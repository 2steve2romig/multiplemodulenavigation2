# Cold Review Output — Code-Level Review (Source Files)

**Date:** 2026-06-24  
**Reviewer:** Independent AI cold review — actual source files reviewed  
**Material:** Full repo export — all `api/`, `supabase/migrations/`, `docs/adr/`, `package.json`, `vercel.json`, `.env.example`  
**Prior reviews:** `cold-review-output-2026-06-23.md`, `cold-review-output-2026-06-24.md`  
**Save as:** `docs/review/cold-review-output-2026-06-24-code-level.md`

---

## Verdict

**CONDITIONAL PASS — significantly better than the prior document-only review.**

Most findings from the two prior reviews have been addressed in the actual code. Several prior Critical findings are now confirmed closed. Two new findings emerged from reading the real code that were invisible from the design documents alone.

**Remaining blocker:** Fail-open audit writes still violate 21 CFR Part 11 §11.10(b). This is acknowledged in ADR-008 and flagged as a hard production blocker — the documentation is correct. The code does not yet implement the fix (transactional audit writes via Supabase RPC). This must be resolved before any regulated customer goes live.

---

## Prior Critical Findings — Status After Code Review

### C-1 (Prior): RLS policies not provided — ✅ CLOSED

**Confirmed in code.** `001_platform_schema.sql` shows `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all five platform tables with explicit comments that no anon/authenticated policies exist — deny-all by default. The service role is the only access path. `004_audit_hardening.sql` adds the immutability trigger and confirms RLS on `organizations` and `org_entitlements` with no policies — correctly deny-all. `module_manifests` has one deliberate anon read policy (`manifests_public_read`) scoped to `is_active = true` only — correct for a public manifest list. All five base tables are clean.

### C-2 (Prior): All endpoints unauthenticated and unguarded — ✅ PARTIALLY CLOSED

**Confirmed in code.** `requireAdminSecret` middleware is applied to all mutation routes (`POST /api/tenants`, `PATCH /api/tenants/:id`, `POST /api/entitlements`, `POST /api/organizations`, `POST /api/org-entitlements`, `GET /api/audit-log`). The implementation is correct: constant-time string comparison would be ideal but the current equality check is acceptable for a pre-auth shared secret. Public read routes (`GET /api/modules`, `GET /api/entitlements`, `GET /api/tenants/:id`) remain open pending auth — correctly flagged with `// TODO: auth-gate`.

**One gap remains** — see new finding M-1 below (`POST /api/organizations` has no audit write).

---

## Prior High Findings — Status After Code Review

### H-1 (Prior): `tenantId` client-supplied, no server-side binding — ✅ CLOSED (structurally)

**Confirmed in code.** ADR-006 is fully implemented. `resolveTenant.js` is the single extraction point. Zero route handlers read `tenantId` from `req.query`, `req.body`, or headers directly — confirmed by grep. The `ALLOW_DEV_TENANT_HEADER` env var gate is the correct pattern. **One discrepancy noted** between ADR-006 and the implementation — see new finding L-1 below.

### H-2 (Prior): No input validation — ✅ CLOSED

**Confirmed in code.** Zod schemas exist for all mutation routes in `validate.js`: `TenantCreateSchema`, `TenantPatchSchema`, `EntitlementCreateSchema`, `OrgCreateSchema`, `OrgEntitlementCreateSchema`. Every route calls `.safeParse()` before touching Supabase. The `status` enum is correctly constrained. Query params on `GET /api/audit-log` are also validated via `QuerySchema`. Clean.

### H-3 (Prior): Entitlement expiry enforcement unspecified — ✅ CLOSED

**Confirmed in code.** `filterActiveEntitlements()` in `entitlements.js` is applied on every read path: `GET /api/entitlements`, `GET /api/modules` (post-union). The implementation correctly checks `status !== 'active'` AND `expires_at <= now`. Server-side, query-time enforcement. Clean.

---

## Prior Medium Findings — Status After Code Review

### M-1 (Prior): `organizations` table RLS not in migration — ✅ CLOSED

**Confirmed in `004_audit_hardening.sql`.** `ALTER TABLE organizations ENABLE ROW LEVEL SECURITY` with no policies (deny-all) and same for `org_entitlements`. Correctly addressed.

### M-2 (Prior): Supabase anon key underspecified — ✅ CLOSED (for now)

No anon key usage found in any API file. Realtime subscriptions are not implemented. The anon key concern is moot until Realtime is wired — correctly deferred.

### M-3 (Prior): CORS wildcard risk — ✅ CLOSED

**Confirmed in `cors.js`.** `ALLOWED_ORIGINS` is an explicit allowlist from env var. No wildcard. `Vary: Origin` header set correctly. `.env.example` shows the production origin pre-populated. Clean.

### M-4 (Prior): `_source` annotation may mis-annotate — ✅ CLOSED

**Confirmed in `modules.js`.** `siteActiveIds` and `orgActiveIds` are both derived by calling `filterActiveEntitlements()` on the raw rows **before** `unionEntitlements()` is called. This means both sets are filtered to active-only rows. A site row that is inactive does not appear in `siteActiveIds`, so the annotation falls through to `orgActiveIds` correctly. The prior concern was based on reading the change package description — the actual code is correct.

---

## Prior Low Findings — Status After Code Review

### L-1 (Prior): `audit_log` missing `resource_id` index — ✅ CLOSED

**Confirmed in `004_audit_hardening.sql`.** `CREATE INDEX audit_log_resource_idx ON audit_log (resource_type, resource_id)` is present. `GET /api/audit-log` also supports `resource_type` and `resource_id` filter params via `QuerySchema`. Fully addressed.

### L-2 (Prior): Role constraint change with no data migration — ⚠️ STILL OPEN

**Confirmed in `002_org_hierarchy.sql`.** The migration drops the old role constraint (`viewer, technician, supervisor, admin`) and adds the new one (`owner, globaladmin, admin, user`) with no `UPDATE` data migration step between them. If any rows carry `viewer`, `technician`, or `supervisor` values, the `ADD CONSTRAINT` will fail. This is only a risk if the migration is applied to an instance with existing data in `user_tenant_memberships`. For a fresh/dev database, it is harmless.

---

## New Findings (Visible Only in Source Code)

### High

---

#### H-1 (NEW) · Fail-open audit write is still not 21 CFR Part 11 compliant — and ADR-008 agrees

**Location:** `api/_lib/audit.js` · `writeAuditLog()` · all four mutation routes

**Flaw:** The code calls `writeAuditLog()` after the primary `supabase.insert()` succeeds. If the audit write fails, `console.error` is called and the function returns — the primary record exists in the database without an audit row. ADR-008 explicitly acknowledges this: *"This must change before regulated customers: wrap mutation + audit in a Supabase RPC so both succeed or both roll back."*

The code and the documentation are in agreement that this is a production blocker. It is called out here because it is confirmed open in the actual code, not just in design documents.

**Fix:** Implement a Supabase RPC (PostgreSQL function) for each regulated mutation that wraps the business INSERT and the `audit_log` INSERT in a single transaction. The Node.js route calls the RPC instead of calling `supabase.from(...).insert()` directly. If either INSERT fails, both roll back. The `writeAuditLog()` helper becomes a thin wrapper around the RPC call — and it should throw on failure (the caller handles the error and returns a 500; no business record is committed without an audit row).

---

### Medium

---

#### M-1 (NEW) · `POST /api/organizations` has no audit write

**Location:** `api/organizations.js`

**Flaw:** Every other admin mutation route calls `writeAuditLog()` after a successful write. `POST /api/organizations` does not. Creating an organization — which grants org-level entitlements to all child sites — is a high-impact access control operation. It has no audit trail.

**Why it matters:** ADR-008 lists `org_entitlements` as regulated data in scope. Organization creation is the prerequisite to org-level entitlements. A new org with no audit record is a gap in the chain of custody for any downstream entitlement grants.

**Fix:**

```javascript
await writeAuditLog({
  event_type: 'organization.created',
  actor_type: 'admin',
  org_id: data.id,
  resource_type: 'organization',
  resource_id: data.id,
  after_state: data,
  ...requestContext(req),
});
```

Add immediately after the successful `supabase.insert()` in `api/organizations.js`.

---

#### M-2 (NEW) · `X-Tenant-ID` and `X-Admin-Secret` are listed in `Access-Control-Allow-Headers` — permanently

**Location:** `api/_middleware/cors.js` line: `res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID, X-Admin-Secret');`

**Flaw:** CORS preflight responses advertise `X-Tenant-ID` and `X-Admin-Secret` as accepted headers to any origin that sends an OPTIONS request — including origins not in the `ALLOWED_ORIGINS` list. `applyCors()` only sets `Access-Control-Allow-Origin` conditionally (if the origin is in the allowlist), but it always sets `Access-Control-Allow-Headers` unconditionally. This means any origin can learn which custom headers the API accepts via a preflight, even if cross-origin requests themselves are blocked.

More importantly: when auth is wired, `X-Admin-Secret` should be removed from this list entirely. Advertising it tells every potential attacker which header to brute-force.

**Fix:** Gate the `Access-Control-Allow-Headers` response behind the same origin check that gates `Access-Control-Allow-Origin`. Additionally, plan to remove `X-Admin-Secret` from this header when auth replaces the shared secret pattern.

---

#### M-3 (NEW) · No security headers on static responses — `vercel.json` is minimal

**Location:** `vercel.json`

**Flaw:** `vercel.json` only defines `outputDirectory` and a single rewrite rule. There are no `headers` entries for the static frontend. This means the React shell is served without:
- `Content-Security-Policy` — no XSS protection
- `X-Frame-Options` or `frame-ancestors` — clickjacking risk
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Strict-Transport-Security` (Vercel adds HSTS by default on `.vercel.app` domains, but explicit control is better)

For a food safety SaaS platform with regulated data, missing CSP is notable — especially since the React shell is loaded via Babel standalone (no build step), which means the CSP cannot use hashes for inline scripts.

**Fix:** Add a `headers` block to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

CSP requires more thought given the Babel standalone setup — `unsafe-inline` will likely be required for scripts, which limits its effectiveness, but `default-src 'self'` with an explicit allowlist for CDN resources is still better than nothing.

---

### Low

---

#### L-1 (NEW) · ADR-006 documents `NODE_ENV !== 'production'` guard; actual code uses `ALLOW_DEV_TENANT_HEADER`

**Location:** `api/_middleware/resolveTenant.js` vs. `docs/adr/ADR-006-tenant-id-middleware.md`

**Flaw:** ADR-006 states: *"The pre-auth `x-tenant-id` dev header is explicitly dev/test-only (`process.env.NODE_ENV !== 'production'` guard) so it cannot be exploited in production."* The actual implementation uses `process.env.ALLOW_DEV_TENANT_HEADER === 'true'` instead. These are different controls:

- `NODE_ENV !== 'production'` is set by the runtime environment and is harder to accidentally enable in production.
- `ALLOW_DEV_TENANT_HEADER === 'true'` is an explicit opt-in, which is arguably stricter — it must be deliberately set to `true` rather than defaulting on in dev. However, it means the control can be enabled in any environment including production if the env var is set, and the ADR documentation doesn't reflect this.

This is a documentation/implementation divergence, not a security flaw — `ALLOW_DEV_TENANT_HEADER` is the stricter pattern. But the divergence means the ADR cannot be trusted as an accurate description of the implementation.

**Fix:** Update ADR-006 to reflect the actual `ALLOW_DEV_TENANT_HEADER` mechanism and document explicitly that this env var must never be set to `true` in production Vercel environments. Add a note to the Vercel deployment checklist.

#### L-2 (NEW) · `engines` field requires Node.js `>=18` but Node 18 reached EOL April 2025

**Location:** `package.json` — `"engines": { "node": ">=18.0.0" }`

**Flaw:** Node.js 18 reached end-of-life on April 30, 2025 and no longer receives security updates. The `>=18` constraint allows Vercel to deploy on Node 18 if that is the selected runtime. `@supabase/supabase-js` v2.79.0+ dropped Node 18 support. The current `^2.49.0` range could resolve to a version that does not support Node 18, creating a mismatch.

**Fix:** Update to `"node": ">=20.0.0"` (Node 20 is current LTS) and set the Vercel Node.js version to 20.x explicitly in `vercel.json` or the Vercel project settings.

#### L-3 (Prior, still open) · Role constraint migration has no data migration step

Already noted above under Prior Low Findings — no change in status.

---

## Confirmed Closed from Prior Reviews (Summary)

| Prior Finding | Status |
|---|---|
| C-1: RLS policies not provided | ✅ Closed — deny-all confirmed in SQL |
| C-2: Admin endpoints unguarded | ✅ Closed — `requireAdminSecret` on all mutations |
| H-1: `tenantId` client-supplied | ✅ Closed — ADR-006 implemented correctly |
| H-2: No input validation | ✅ Closed — Zod schemas on all routes |
| H-3: Expiry not enforced | ✅ Closed — `filterActiveEntitlements()` on all read paths |
| M-1: `organizations` RLS missing SQL | ✅ Closed — migration 004 |
| M-2: Anon key Realtime risk | ✅ Closed — Realtime not implemented |
| M-3: CORS wildcard risk | ✅ Closed — explicit allowlist |
| M-4: `_source` annotation correctness | ✅ Closed — code is correct |
| M-2 (change pkg): `ip_address` from XFF unsanitized | ✅ Closed — last-entry extraction + IP regex validation |
| L-1: `audit_log` missing `resource_id` index | ✅ Closed — migration 004 |

---

## Remaining Open Items

| # | Finding | Severity | Blocking for regulated customers? |
|---|---|---|---|
| 1 | Fail-open audit writes not 21 CFR Part 11 compliant | High | **Yes** |
| 2 | `POST /api/organizations` missing audit write | Medium | Yes |
| 3 | `Access-Control-Allow-Headers` unconditional | Medium | No |
| 4 | No security headers in `vercel.json` | Medium | No |
| 5 | ADR-006 documents wrong guard mechanism | Low | No |
| 6 | Node 18 EOL in `engines` field | Low | No |
| 7 | Role constraint migration missing data migration step | Low | Risk only on non-fresh instances |

---

## What the Code Confirms Is Well-Built

The following design doc claims were verified as actually implemented correctly — not just intended:

- **Centralized `tenantId` middleware** (`resolveTenant.js`) — single extraction point, zero inline reads in route handlers.
- **Zod validation on every mutation route** — schemas are specific, enum-constrained, and applied before any database call.
- **Server-side expiry enforcement** — `filterActiveEntitlements()` is a pure function applied consistently on every read path.
- **`unionEntitlements()` edge case handling** — the org-active + site-expired case is correctly handled: expired site rows fall through to the org row. The implementation is more complete than the change package suggested.
- **`_source` annotation correctness** — `siteActiveIds` is derived from filtered (active-only) rows before the union. The concern from the prior review was unfounded.
- **IP address extraction from `X-Forwarded-For`** — takes the last entry (Vercel-appended real IP), validates with regex before storing.
- **`audit_log` immutability trigger** — PostgreSQL-level trigger in migration 004 blocks UPDATE and DELETE for all roles including service role. This was the key gap from the prior review and it's fully addressed.
- **No hardcoded secrets** in any source file. No `NEXT_PUBLIC_` or `VITE_` prefixed env var references. No `dangerouslySetInnerHTML` in JSX.
- **Dependency surface is minimal** — only two runtime dependencies (`@supabase/supabase-js`, `zod`). Both are well-maintained with no known critical CVEs at current version ranges.

---

## Minimum Bar to "Yes" for Regulated Customers

1. **Transactional audit writes** — Supabase RPC wrapping mutation + audit INSERT. `writeAuditLog()` must throw on failure so the primary operation rolls back. This is the only remaining hard blocker for 21 CFR Part 11.
2. **Audit write for `POST /api/organizations`** — one `writeAuditLog()` call missing.

Everything else on the open items list is a hardening improvement, not a production blocker for non-regulated customers.

---

## Note on Prototype Status

This codebase is notably clean for a pre-auth prototype. The architectural decisions are sound, the middleware pattern is correctly structured for auth drop-in, and the SQL migrations are precise. The gap between "prototype" and "production-ready for regulated customers" is now a short list dominated by one item (transactional audit writes) rather than the structural rework risk that was present in the first cold review.

---

*This review was conducted against actual source files extracted from `multiplemodulenavigation2-main.zip` (exported 2026-06-24). Files reviewed: all `api/` routes and middleware, all `supabase/migrations/`, all `docs/adr/`, `package.json`, `vercel.json`, `.env.example`, `.gitignore`. This is a sandbox engineering check and does not replace an independent human review before real customer data (design-doc.md, Open Items #1).*
