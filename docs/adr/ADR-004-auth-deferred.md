# ADR-004: Authentication Deferred — Entitlement Scaffolding Built Now

| Field | Value |
|---|---|
| **Date** | 2026-06-23 |
| **Status** | Accepted |
| **Deciders** | sromig@hygiena.com |
| **Review trigger** | Auth provider selection; required before real customer data |

---

## Context

Authentication (proving *who* a user is) requires selecting and integrating an identity provider — a non-trivial decision with commercial and compliance implications. The Engineering Constitution (§1) defers this decision but requires that the entitlement model and `tenantId` scaffolding be built now so auth can be added without structural rework.

This ADR records what is built now, what is deferred, and the exact contract the auth layer must fulfill when it is wired in.

---

## Decision

**No identity provider is wired at this time. The following scaffolding is built now:**

1. **Entitlement store** — `entitlements` table in the Platform Supabase project, with schema:
   ```sql
   CREATE TABLE entitlements (
     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
     module_id     text NOT NULL,
     status        text NOT NULL CHECK (status IN ('active', 'suspended', 'expired')),
     expires_at    timestamptz,
     created_at    timestamptz NOT NULL DEFAULT now(),
     updated_at    timestamptz NOT NULL DEFAULT now()
   );
   -- RLS enabled per ADR-002
   ```

2. **`tenantId` on every request** — all Node.js API routes accept `X-Tenant-ID` header (temporary, for dev/demo purposes only). When auth is wired, `tenantId` will come from the validated JWT claim, not a client-supplied header. The extraction is isolated to a `getTenantId(req)` helper so the call site changes in one place.

3. **`// TODO: auth-gate` on every data-access endpoint** — no endpoint that reads or writes tenant data is left without this comment. The comment is the placeholder for the auth middleware that will be inserted when an IdP is chosen.

4. **Entitlement check is server-side** — the Platform API's `GET /api/modules?tenantId=` endpoint evaluates entitlements and returns only manifests for modules the tenant has active, non-expired entitlements for. The client renders what the server returns; the client does not evaluate entitlements.

5. **Module access re-checked per request** — the architecture is set up so that when auth is added, every API request to a module's backend will re-validate the tenant's entitlement for that module via the Platform API. There is no "logged in once, access forever" pattern.

---

## Alternatives Considered

### Option A: Wire auth now (Supabase Auth or Auth0)
Select and integrate an identity provider before any feature code.

- **Pro:** Fully secure from the first request; no placeholder headers; no `// TODO` debt.
- **Con:** Auth provider selection is a non-trivial decision (Supabase Auth vs Auth0 vs Okta vs custom) with commercial and regulatory implications; delays the start of feature work for a decision that can be made later without structural cost; the prototype needs to demo before customers are real.

### Option B: Skip entitlement model until auth is ready
Build feature code now; add entitlements and tenantId when auth is chosen.

- **Pro:** Fastest to first demo.
- **Con:** This is exactly the structural mistake the Engineering Constitution is designed to prevent. Retrofitting tenantId onto every table and route, and adding the entitlement model, requires touching every data access path — effectively a rewrite. The whole point of building the scaffolding now is to avoid this.

### Option C: Defer auth, build scaffolding now *(chosen)*
No IdP, but `tenantId` scaffolding + entitlement store + `// TODO: auth-gate` markers built now.

- **Pro:** Feature code can begin; the switch from placeholder to real auth is a surgical change to the `getTenantId()` helper and auth middleware insertion at the `// TODO` markers — not a rewrite.
- **Con:** The system is not securely authenticated until auth is wired. This is acceptable for a dev/sandbox build; it is **not acceptable before real customer data**. This is a hard gate.

---

## Reasoning

The scaffolding cost is low (one helper function, one comment per endpoint, one table). The retrofit cost if skipped is high. The constitution is explicit: building the entitlement model now is non-negotiable.

---

## Consequences

- **`getTenantId(req)` helper** — isolates tenant extraction. Current implementation reads `X-Tenant-ID` header. When auth is added, this function is replaced with JWT claim extraction. Call sites are unchanged.
- **`checkEntitlement(tenantId, moduleId)` helper** — queries the entitlements table. Returns `{ allowed: boolean, reason: string }`. Every module API route calls this before processing any request.
- **All data-access endpoints marked** `// TODO: auth-gate` — specifically: verify JWT, extract tenantId from claims (not from client header), enforce entitlement. This comment is the contract.
- **No client-side entitlement evaluation** — the shell's sidebar and route table are built from the server-returned manifest list. There is no client-side "is this module enabled?" check.
- **Hard gate before production:** An independent human engineering review is required before real customer data. The `// TODO: auth-gate` comments must all be resolved, and a real auth provider must be wired, before that gate.

---

## Auth Provider Candidates (to be decided via §2 protocol when ready)

| Provider | Notes |
|---|---|
| Supabase Auth | Native integration; JWT with custom claims; easiest operational path |
| Auth0 | More feature-rich (MFA, enterprise SSO, SAML); higher cost |
| Okta | Enterprise-grade; common in regulated industries; highest cost |
| Azure AD B2C | If Hygiena org uses Microsoft stack |

Decision will be recorded as ADR-006 when made.
