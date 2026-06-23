# Cold Review Output — SureTrend Platform Architecture

**Date:** 2026-06-23  
**Reviewer:** Independent AI cold review (no design context)  
**Material reviewed:** `design-doc.md` v1.0 (platform shell + entitlement layer)  
**Save as:** `docs/review/cold-review-output-2026-06-23.md`

---

## Verdict

**NO — not approved for production with real customer data.**

**Single biggest blocker:** No Supabase RLS policies were provided for review — isolation cannot be verified, and a single missing policy creates full cross-tenant read/write exposure.

---

## Findings

### Critical

---

#### C-1 · RLS policies not provided — tenant isolation unverifiable

**Location:** `entitlements`, `tenants`, `users`, `user_tenant_memberships`, `module_manifests` tables

**Flaw:** The design doc states RLS is enabled on all five platform tables, but no `CREATE POLICY` statements were provided. This means I cannot verify that any of the stated policies exist, are non-vacuous, or actually enforce `tenantId` filtering. In Supabase, enabling RLS without adding policies denies all access — but the failure mode I cannot see is a policy that accidentally permits cross-tenant reads (e.g., a policy on `entitlements` that uses `auth.uid()` without also scoping to `tenant_id`). Since auth is deferred, the anon role's policies are the only enforcement path today — what those say determines whether the system is safe to develop against at all.

**Why it matters:** One misconfigured policy exposes every tenant's data to every other tenant. This is the highest-consequence class of failure in a multi-tenant system.

**Fix:** Provide all `CREATE POLICY` statements for every table. Until then this is an unknown, not a passing grade. At minimum: confirm that the anon role has zero read/write access to all five tables, and that the service role key is the only path to data — used exclusively server-side in Node.js.

---

#### C-2 · All platform API endpoints are currently unauthenticated and unguarded

**Location:** `GET /api/tenants/:id` · `GET /api/entitlements?tenantId=` · `GET /api/modules?tenantId=` · `POST /api/tenants` · `POST /api/entitlements`

**Flaw:** The design doc explicitly states all routes carry `// TODO: auth-gate` and that auth is deferred. Taken at face value: any caller who supplies a `tenantId` in the query string can retrieve any tenant's entitlements and module list. `POST /api/tenants` and `POST /api/entitlements` are admin operations — they have no gating at all. If Vercel exposes these functions at their default URLs today, this is a fully open tenant enumeration and provisioning API.

**Why it matters:** An unauthenticated admin provisioning endpoint is an unconditional production blocker.

**Fix:** If these Vercel functions are deployed to any publicly reachable URL, add a server-side pre-flight check — even a shared secret in a header, or an IP allowlist — until real auth is wired. The `// TODO` comment is not a control. Confirm these endpoints are not publicly reachable in the current environment.

---

### High

---

#### H-1 · `tenantId` is supplied by the client on every request — no server-side binding

**Location:** `GET /api/entitlements?tenantId=` · `GET /api/modules?tenantId=`

**Flaw:** The design specifies that `tenantId` "travels on every API request" — but with auth deferred, the only place it comes from is the client. There is currently no mechanism that binds a caller to a verified `tenantId`. Any client can supply any `tenantId` value and receive that tenant's data. This is not just a scaffolding gap — it is a structural coupling that will require rework when auth is added if `tenantId` extraction logic is spread across routes rather than centralized in middleware.

**Why it matters:** Client-supplied tenant identity is not isolation. This is the pattern that makes every `// TODO: auth-gate` a mandatory rework point rather than a clean drop-in.

**Fix:** Centralize `tenantId` extraction into a single middleware function that, post-auth, derives it from the verified identity token rather than the request parameter. The current client-supplied path becomes the fallback only in dev/test. This middleware slot needs to exist now so auth drops in cleanly.

---

#### H-2 · No input validation specified on any Node.js route

**Location:** `POST /api/tenants` · `POST /api/entitlements` · all `GET` routes with query params

**Flaw:** The design doc does not mention Zod, Joi, or any schema validation library. The `POST /api/tenants` and `POST /api/entitlements` endpoints accept untrusted input with no described validation layer. The `GET` routes accept `tenantId` as a query string parameter with no described sanitization. If these values are interpolated into Supabase queries — even via the JS client — malformed or oversized inputs can cause unexpected behavior. The entitlement table's `status` field (`active`/`suspended`/`expired`) needs to be enum-validated server-side; a client-supplied arbitrary status string bypasses the state machine.

**Why it matters:** OWASP A03 (Injection) and A08 (Software and Data Integrity) both apply. Missing validation on the status enum specifically creates an entitlement integrity bypass.

**Fix:** Add Zod (preferred for TypeScript/Node) schemas to every route. Validate and strip unknown fields before they reach the Supabase client. Define the `status` enum explicitly in the schema. This is non-optional before any public exposure.

---

#### H-3 · Entitlement expiry enforcement is unspecified

**Location:** `entitlements` table · `GET /api/modules?tenantId=` · `GET /api/entitlements?tenantId=`

**Flaw:** The design specifies that entitlements have a `status` and `expiry` field, which is the right structure. But it does not describe how expiry is enforced. Options are: (a) server-side filter on every entitlement query that drops rows where `expiry < now()`, (b) a scheduled job that flips `status` to `expired`, or (c) a client-side check. If it's (c), expired tenants can access modules. If it's (b) only, there's a window of exposure when the job hasn't run. The current design doc is silent on this — it describes the data shape but not the enforcement path.

**Why it matters:** An expired tenant continuing to access paid modules is a commercial integrity failure and a potential compliance exposure under the regulatory frameworks cited (FSMA, SQF, BRCGS).

**Fix:** Specify that the `/api/modules` and `/api/entitlements` routes filter server-side for `status = 'active' AND expiry > now()`. The status field alone is not sufficient if expiry-driven transitions are not automated. Add an ADR for the expiry enforcement strategy.

---

### Medium

---

#### M-1 · Module manifest includes `pricingLabel` — PII-adjacent field sent to all tenants

**Location:** `module_manifests` table · `GET /api/modules?tenantId=` response

**Flaw:** The manifest schema includes a `pricingLabel` field currently set to `$X/mo`. If this field is ever populated with tenant-specific pricing (volume discounts, negotiated rates), and the manifest is served as-is to the client, one tenant's pricing becomes visible to anyone who can inspect the network response. This is a structural disclosure risk that is easier to address now than after tenant-specific prices are stored.

**Fix:** Either (a) strip `pricingLabel` from the client-facing manifest response and serve it only from a dedicated pricing API with explicit access control, or (b) document explicitly that `pricingLabel` is a public list price, never tenant-specific, and enforce that constraint in the entitlements system.

---

#### M-2 · Supabase anon key usage in React shell is underspecified

**Location:** React shell · Supabase Realtime subscriptions

**Flaw:** The design states the anon key is used in the React client "if needed for direct Realtime subscriptions — always with RLS enforcing tenantId." The hedge "if needed" is doing a lot of work. The anon key is necessarily public — it ships in the JS bundle. The security model for Realtime must be fully specified: what channels can the anon role subscribe to, and what data flows over those channels? If the channel namespace is `tenant:{tenantId}:...` and the tenantId is client-supplied, a malicious client can subscribe to any tenant's channel unless RLS or channel-level auth explicitly prevents it.

**Fix:** Provide the Supabase Realtime authorization policy. Confirm that channel subscriptions require a verified identity claim, not just a matching tenantId in the channel name. If auth is deferred, Realtime in the client should be deferred with it — or channels should carry zero business data until auth is wired.

---

#### M-3 · CORS policy unspecified for Node.js API routes

**Location:** All `/api/*` routes on Vercel

**Flaw:** The design doc does not mention CORS configuration. Vercel serverless functions do not apply CORS headers by default — but the default behavior can mask a misconfiguration that becomes exploitable when modules are deployed on separate Vercel projects (as the architecture specifies for IQ modules). If `GET /api/entitlements` is called cross-origin from an IQ module's domain, the CORS policy needs to be explicit.

**Fix:** Define an explicit allowlist of origins permitted to call the Platform API. Do not use `Access-Control-Allow-Origin: *` on any route that carries tenant data. Add this to an ADR or to the Platform API route middleware.

---

#### M-4 · Globalization declared but no enforcement mechanism described

**Location:** React shell · Node.js API responses · `module_manifests` nav labels

**Flaw:** The design states "no hardcoded user-facing strings in JSX or Node.js responses" and "locale-aware" number/currency formatting. This is a design intent, not an enforcement mechanism. The manifest schema shows `"label": "Results"` and `"label": "Plans"` — hardcoded English strings. The `pricingLabel: "$X/mo"` hardcodes the dollar sign. These are not edge cases; they are in the canonical schema example. The gap between "we intend to do i18n" and "we have an i18n library and a keyed string catalog" is large.

**Fix:** Either (a) adopt a locale resource pattern now (react-intl, i18next, or equivalent) and replace manifest string literals with locale keys, or (b) explicitly document that v1 is English-only and the manifest schema will be versioned when localization is added. The current design creates a false sense of readiness.

---

### Low

---

#### L-1 · `minRequiredRole` in manifest is client-facing with no server enforcement path described

**Location:** `module_manifests` · `GET /api/modules` response

**Flaw:** `minRequiredRole: "technician"` is in the manifest schema but no route or middleware is described that enforces it server-side. Currently the shell uses manifests to render nav — if a future client reads this field and gates UI display, that is a client-side-only enforcement pattern, which is not a control. When auth is wired, this field needs to be consumed by server-side middleware, not the shell.

**Fix:** Add a note to the ADR or design doc that `minRequiredRole` is for display purposes in v1 and will be enforced server-side in the auth layer. Create a TODO in the manifest-serving route to re-filter by role once the identity token carries role claims.

---

#### L-2 · Cross-module event namespace assumes Realtime works across Supabase projects

**Location:** Supabase Realtime event channel: `tenant:{tenantId}:module:{moduleId}:event:{eventType}`

**Flaw:** The Realtime channel namespace is well-formed. The risk is: if IQ module databases are separate Supabase projects (as the architecture implies), and each project has its own Realtime instance, channel subscriptions from the Platform level need to cross project boundaries. Supabase Realtime is scoped per project — a channel on the ATP Supabase project is not the same channel as one on the Platform Supabase project. This may require a webhook fan-out model rather than direct Realtime subscriptions, which contradicts the design's "alternatively" framing.

**Fix:** Resolve and document whether cross-module events use Supabase Realtime (only viable within a single project) or webhooks (viable across projects). The current design presents both as equivalent alternatives when they are not architecturally equivalent given the multi-project deployment model.

---

## Tenant Isolation Verdict

**Does cross-tenant isolation hold? Cannot confirm.**

No RLS policies were provided for review. The service-role-key-server-only constraint is stated as design intent but is not verifiable from this material. The client-supplied `tenantId` on every request is a structural gap with no compensating control documented.

**Test to prove or disprove it:** With RLS policies in hand, use the Supabase anon key to query the `entitlements` table with a `tenantId` you did not provision. The result must be an empty result set — not a policy error, not a row. Repeat for all five platform tables. If any query returns data, isolation has failed.

---

## Auth Readiness Verdict

**Structurally ready with one gap.**

The entitlement model (`status` + `expiry`) is the right shape. The `// TODO: auth-gate` markers are present. The module manifest includes `minRequiredRole` as a hook for future enforcement.

The gap: there is no centralized middleware slot where `tenantId` is derived from a verified identity token. If `tenantId` is extracted inline in each route handler from the query string, wiring auth will require touching every route individually. The Realtime authorization model for the anon-key path is unspecified and will also require rework.

**Recommended addition:** An ADR-006 covering the `tenantId` extraction strategy — specifically how it transitions from client-supplied query param (current) to identity-token-derived server claim (post-auth). Document this now so the implementation can be verified against intent rather than reconstructed from code.

---

## Unknowns — Cannot Assess Without These

| # | What's missing | Why it's needed |
|---|---|---|
| 1 | All `CREATE POLICY` statements for every Supabase table | Without these, tenant isolation is unauditable |
| 2 | Actual Node.js route handler code | Design describes intent; code reveals what's implemented |
| 3 | Vercel environment variable names | Need to confirm no service role key is prefixed `NEXT_PUBLIC_` or `VITE_` |
| 4 | Supabase Realtime authorization config | Specifically what the anon role can subscribe to and what data flows over those channels |
| 5 | CORS configuration | Needed for Vercel/Next.js config or route middleware review |
| 6 | `package.json` | Cannot assess CVE exposure in npm dependencies without it |
| 7 | Entitlement expiry enforcement implementation | Scheduled job, query-time filter, or neither — not specified |
| 8 | GitHub Actions workflow files | Cannot assess secret exposure in CI/CD output without them |

---

## Minimum Bar to "Yes"

The shortest list of changes that would get this to production-ready:

1. **Provide and verify all RLS policies** — confirm anon role has zero access without a verified identity claim. Run the cross-tenant query test on all five tables.

2. **Add server-side `tenantId` middleware** — one centralized place that extracts and validates `tenantId`, structured to accept an auth token as the source of truth when auth lands.

3. **Add Zod validation to all routes** — especially the two POST admin routes and the `status` enum on entitlements.

4. **Lock down or remove public access to admin endpoints** — `POST /api/tenants` and `POST /api/entitlements` must not be reachable without a credential, even a pre-auth shared secret.

5. **Define and enforce expiry logic server-side** — filter `status = 'active' AND expiry > now()` on every entitlement query at the API layer.

6. **Specify and restrict CORS** — explicit origin allowlist, no wildcard on any route that carries tenant data.

7. **Resolve the Realtime cross-project event model** — confirm whether webhooks or Realtime, and specify the authorization model for the anon key path before using Realtime in the React client.

---

*This review was conducted against `design-doc.md` v1.0 only. No ADRs, route handler code, RLS SQL, or environment configuration was provided. Findings are based solely on what the design document specifies and what it omits. This is a sandbox engineering check and does not replace an independent human review before real customer data (see design-doc.md, Open Items #1).*
