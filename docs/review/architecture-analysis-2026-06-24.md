# SureTrend Platform — Critical Analysis: ERD & Architecture

**Date:** 2026-06-24  
**Basis:** Full source review — all migrations, API routes, middleware, ADRs, test strategy  
**Save as:** `docs/review/architecture-analysis-2026-06-24.md`

---

## Overall Rating: 7.4 / 10

| Dimension | Score | Rationale |
|---|---|---|
| Schema design | 8.0 | Clean, purposeful, well-indexed. One structural gap (no FK from entitlements to module_manifests). |
| Tenant isolation model | 7.5 | RLS + service-role-only is the right pattern. Correctly implemented. Score limited by missing cross-tenant isolation tests in CI. |
| API architecture | 7.5 | Middleware pattern is excellent. Fail-open audit writes and missing org audit trail are real gaps. |
| Auth scaffolding | 8.5 | ADR-006 + resolveTenant middleware is one of the strongest parts of the whole system. Single replacement point is exactly right. |
| Entitlement engine | 9.0 | The best-built component. Pure function, correct edge case handling, server-side expiry, post-filter annotation. |
| Compliance readiness | 6.0 | Structural intent is sound. Fail-open audit and missing transactional guarantee are the blockers. Phase 2 and 3 not started. |
| Test strategy | 6.5 | Strategy document is thorough and well-reasoned. Actual test coverage lags the strategy — isolation tests not in CI. |
| Documentation / ADRs | 9.0 | Exceptional for a prototype. Every major decision is recorded with alternatives considered and consequences stated. |
| Security posture | 7.0 | No hardcoded secrets, correct key handling, explicit CORS, IP sanitization. Missing security headers and CORS header leak. |
| Forward architecture | 7.0 | Standalone module pattern is correctly motivated. Realtime cross-project gap and no dev orchestration tooling are risks. |

**Composite: 7.4 / 10**

---

## Part 1 — ERD Analysis

### What the ERD gets right

**The hierarchy is domain-correct.** `organizations → tenants (sites) → user_tenant_memberships` accurately models how food manufacturing enterprises actually work: a corporate entity (Kraft, Tyson, Sysco) operates multiple facilities, each of which is independently managed but shares a corporate contract. This is not an over-engineered abstraction — it reflects a real billing and access control requirement documented in ADR-007.

**Entitlement duality is well-designed.** Having two entitlement tables (`entitlements` for site-purchased modules, `org_entitlements` for corporate-purchased modules) with identical schemas and a server-side union pattern is cleaner than a single table with a nullable org/site discriminator. The schema doesn't force a decision at insert time about which entity "owns" the entitlement — it models both relationships cleanly.

**The audit tables are structurally correct for 21 CFR Part 11.** `audit_log` with server-side `occurred_at DEFAULT now()`, before/after JSONB state, and an immutability trigger is the right implementation. The `electronic_signatures` table structure — binding to `audit_log_id` + SHA-256 `record_hash` — is the correct pattern for Part 11 §11.10(d). These were clearly designed with the regulation in mind, not retrofitted.

**Index coverage is thoughtful.** `(tenant_id, occurred_at DESC)`, `(org_id, occurred_at DESC)`, `(event_type, occurred_at DESC)`, and `(resource_type, resource_id)` on `audit_log` cover the four primary query patterns for compliance review. `entitlements_tenant_id_idx` is the right primary index. Most schemas at this stage have no indexes at all.

---

### ERD Issues and Actions

#### Issue 1 — `entitlements.module_id` has no foreign key to `module_manifests.id`

**Severity: Medium**

Both `entitlements.module_id` and `org_entitlements.module_id` are `text NOT NULL` with no FK to `module_manifests.id`. The relationship is enforced at the API layer via `filterEntitledManifests()`, not at the database layer. This means you can `INSERT` an entitlement for `module_id = 'nonexistent_module'` and the database will accept it silently. The API will then return an empty module list for that tenant because no manifest matches, with no error signal.

**Action:** Add a foreign key from `entitlements.module_id` → `module_manifests.id` and from `org_entitlements.module_id` → `module_manifests.id`. Because `module_manifests.id` is `text` (not uuid), this is a text-to-text FK — valid in PostgreSQL. Use `ON DELETE RESTRICT` to prevent manifest deletion when live entitlements exist.

```sql
-- Migration 005_entitlement_fk.sql
ALTER TABLE entitlements
  ADD CONSTRAINT entitlements_module_id_fk
  FOREIGN KEY (module_id) REFERENCES module_manifests(id) ON DELETE RESTRICT;

ALTER TABLE org_entitlements
  ADD CONSTRAINT org_entitlements_module_id_fk
  FOREIGN KEY (module_id) REFERENCES module_manifests(id) ON DELETE RESTRICT;
```

---

#### Issue 2 — `tenants.org_id` is nullable — single-site customers have no org

**Severity: Medium**

ADR-007 states: "A Site always belongs to exactly one Organization. A site cannot exist without a parent org." But the migration adds `org_id uuid REFERENCES organizations(id)` without `NOT NULL`. A tenant can exist with `org_id = NULL`. This means:

- The ADR's data model and the actual schema contradict each other.
- The union entitlement logic in `api/modules.js` handles `orgId = null` (skips org entitlement query), which is correct behavior — but it means the ADR's "single-site customers still have an org" constraint is not enforced.

Either the ADR should be updated to say `org_id` is optional (single-site customers have no org), or `org_id` should be `NOT NULL` with a migration to ensure all sites have a parent org. The current implicit behavior (nullable = no corporate inheritance) is probably the right commercial decision, but it needs to be explicit.

**Action:** Update ADR-007 to reflect that `org_id` is nullable (single-site customers operate without an org). Add a `CHECK` constraint comment to the migration explaining this is intentional. Add an integration test confirming that a tenant with `org_id = NULL` receives only its site-level entitlements and no error.

---

#### Issue 3 — `audit_log.tenant_id` and `org_id` use `ON DELETE SET NULL`

**Severity: Low-Medium**

If a tenant or organization is deleted, its `audit_log` rows have `tenant_id` / `org_id` set to `NULL`. For 21 CFR Part 11, this is a problem: an audit record for `entitlement.created` that no longer references the tenant it was created for loses its attribution context. An auditor cannot reconstruct "which site was this action performed on?"

`ON DELETE RESTRICT` would be the safer choice — prevent deletion of a tenant that has audit records. For food safety SaaS, tenant data should likely never be hard-deleted; soft-delete (a `deleted_at` column) is the compliant pattern.

**Action:** Add a `deleted_at timestamptz` column to both `tenants` and `organizations`. Change `ON DELETE CASCADE` to `ON DELETE RESTRICT` on tables that carry regulated data. Add `ON DELETE RESTRICT` to `audit_log` FKs. Document a data retention policy in the design doc (FDA minimum 2 years for food safety records).

---

#### Issue 4 — No `updated_at` trigger — the column is manually set

**Severity: Low**

`tenants`, `organizations`, `entitlements`, `org_entitlements` all have `updated_at timestamptz`. The `PATCH /api/tenants/:id` route manually passes `updated_at: new Date().toISOString()` — but no other route does this. If `entitlements` or `org_entitlements` are ever updated (status change, expiry extension), `updated_at` will not be maintained unless the route explicitly sets it.

**Action:** Add a PostgreSQL trigger function to auto-update `updated_at` on every UPDATE, applied to all tables with that column:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- repeat for organizations, entitlements, org_entitlements
```

---

#### Issue 5 — `users.email` is the only user-identifying column

**Severity: Low**

The `users` table has `id` and `email` only. When auth is wired, the auth provider will assign a subject identifier (JWT `sub` claim) that is not necessarily the email address. If Supabase Auth is chosen, its `auth.users` table has its own UUID — you'll need to map `users.id` to `auth.users.id`. If Auth0 or Azure AD is chosen, the `sub` will be a provider-specific opaque string. There is no `external_auth_id` or `provider` column to store this mapping.

**Action:** Add `external_auth_id text UNIQUE` and `auth_provider text` columns to `users` now, even as nullable placeholders. This avoids a schema migration at the worst possible time (mid-auth-provider integration).

---

## Part 2 — Architecture Analysis

### What the architecture gets right

**The middleware pattern is the strongest structural decision in the codebase.** ADR-006 + `resolveTenant.js` — centralized `tenantId` extraction, single replacement point for auth — is textbook. The alternative (inline `req.query.tenantId` in every handler) would make auth wiring a surgical multi-file operation with high regression risk. This decision was made correctly and implemented correctly.

**The standalone module pattern (ADR-001) is correctly motivated.** The à la carte commercial model and anticipated multi-team growth make structural module isolation worth the operational overhead. Choosing this now rather than extracting from a monolith later avoids one of the most painful refactors in SaaS architecture.

**The entitlement resolution logic is the best-built component in the system.** `filterActiveEntitlements()` is a pure function. `unionEntitlements()` correctly handles the org-active + site-expired edge case (site rows only win on deliberate state, not accidental lapse). `_source` annotation is derived from pre-union filtered sets. This is production-quality logic, not prototype-quality.

**The ADR library is exceptional for this stage.** Eight ADRs, all with alternatives considered and consequences stated, covering isolation model, auth deferral, data residency, module manifest schema, org hierarchy, and compliance. Most teams at this stage have zero documented architectural decisions. This is the difference between a codebase that can be reviewed and one that can only be feared.

---

### Architecture Issues and Actions

#### Issue 1 — Fail-open audit writes are not 21 CFR Part 11 compliant

**Severity: Critical (production blocker for regulated customers)**

Already confirmed in the code-level review. Restated here because it is the most consequential architectural gap. The current pattern:

```
supabase.insert(businessRecord) → success
writeAuditLog(event)            → may silently fail
```

A committed business record without an audit row is a §11.10(b) violation. ADR-008 correctly identifies this as a hard production blocker but the fix is not yet implemented.

**Action:** Implement a Supabase RPC for each regulated mutation. The RPC wraps both INSERTs in a single PostgreSQL transaction:

```sql
-- Example: create_entitlement_with_audit(p_tenant_id, p_module_id, ...)
CREATE OR REPLACE FUNCTION create_entitlement_with_audit(...) 
RETURNS entitlements LANGUAGE plpgsql AS $$
DECLARE
  v_row entitlements;
BEGIN
  INSERT INTO entitlements (...) VALUES (...) RETURNING * INTO v_row;
  INSERT INTO audit_log (event_type, resource_type, resource_id, after_state, ...)
    VALUES ('entitlement.created', 'entitlement', v_row.id, row_to_json(v_row), ...);
  RETURN v_row;
END; $$;
$$;
```

The Node.js route calls `supabase.rpc('create_entitlement_with_audit', {...})`. If either INSERT fails, the transaction rolls back — no committed record without an audit row.

---

#### Issue 2 — No cross-tenant isolation tests in CI

**Severity: High**

The test strategy document specifies cross-tenant isolation tests as a security gate that "blocks merge to main." These tests do not exist in the current test suite (confirmed by file listing — there is no `test/isolation/` or equivalent). The architecture depends entirely on RLS for isolation, and the design doc itself says "cross-tenant isolation tests are the gate, not an afterthought." Having the policy without the gate is the most dangerous kind of gap: the team believes it is protected.

**Action:** Create `test/integration/isolation.test.js` using the two-tenant pattern from the test strategy:

```javascript
// Provision TENANT_A and TENANT_B with different entitlements
// Test 1: TENANT_A cannot see TENANT_B's entitlements via API
// Test 2: anon key SELECT on entitlements returns 0 rows
// Test 3: anon key INSERT to entitlements is rejected
// Test 4: TENANT_A module list contains no TENANT_B-only modules
```

Add this to the CI pipeline as a merge-blocking step. This is the test that proves the most important security property of the entire system.

---

#### Issue 3 — `POST /api/organizations` has no audit write

**Severity: Medium**

The only admin mutation route without an audit write. Creating an organization is a high-impact access control action — it is the precondition for all corporate-level entitlement grants. There is no way to reconstruct who created which organization from the audit log.

**Action:** Add five lines to `api/organizations.js` after the successful insert:

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

---

#### Issue 4 — The Realtime cross-project event model is unresolved

**Severity: Medium (will block first IQ module integration)**

ADR-001 requires that cross-module communication use "Supabase Realtime events or webhooks, namespaced by tenantId. Never direct DB queries." The design doc presents these as equivalent alternatives. They are not:

- Supabase Realtime is scoped to a single Supabase project. The Platform DB and IQ-ATP DB are separate projects. A Realtime channel on the ATP project is invisible to the Platform project.
- Webhooks (HTTP POST from one module's API to the Platform API) work across projects but require retry logic, authentication, and idempotency handling.

This gap is invisible until the first IQ module is built and tries to send an event to the Platform. At that point, the Realtime approach silently fails and the team discovers the constraint under time pressure.

**Action:** Create ADR-009 resolving the inter-module event contract before any IQ module API is written. Decide: webhooks (simpler, cross-project, requires retry logic) or a shared event bus (e.g., Supabase Realtime on the Platform project only, with modules pushing events to a Platform endpoint that broadcasts). Document the chosen pattern as the mandatory implementation for all future modules.

---

#### Issue 5 — No local development orchestration

**Severity: Medium**

ADR-001 acknowledges: "Local development requires running multiple services; a docker-compose or equivalent dev orchestration setup is needed." This is listed as a consequence but nothing has been built. Currently there is no `docker-compose.yml`, no `Makefile`, no dev startup script. As long as only the Platform shell exists this is tolerable. The moment the first IQ module is added, running the full system locally requires manually starting multiple Vercel dev servers and multiple Supabase local instances.

**Action:** Create a `dev/` directory with a `docker-compose.yml` that starts:
- Platform API (`vercel dev` on port 3000)
- Supabase local stack (via `supabase start`)
- A stub IQ-ATP API on a second port (for integration testing the manifest/entitlement flow)

Add a `make dev` or `npm run dev:full` script that starts the full local stack in one command. This pays dividends the moment a second engineer joins the project.

---

#### Issue 6 — No security headers on static responses

**Severity: Medium**

`vercel.json` has no `headers` block. The React shell is served without `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy`. For a food safety SaaS platform, missing `X-Frame-Options: DENY` is a clickjacking risk. Missing `X-Content-Type-Options: nosniff` is a MIME-sniffing risk.

CSP is complicated by the Babel standalone setup (requires `unsafe-inline` for scripts), but frame protection and content type options have no build-step dependency.

**Action:**

```json
// vercel.json addition
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
    ]
  }
]
```

For CSP: migrate off Babel standalone to a build step (Vite) as part of the auth wiring work. This unlocks hash-based CSP and removes the `unsafe-inline` requirement.

---

#### Issue 7 — `Access-Control-Allow-Headers` is exposed unconditionally

**Severity: Medium**

`cors.js` sets `Access-Control-Allow-Headers: Content-Type, X-Tenant-ID, X-Admin-Secret` on every response regardless of whether the requesting origin is in the allowlist. Any origin can learn that `X-Admin-Secret` is a valid header by sending an OPTIONS preflight. This is a minor but unnecessary information disclosure.

**Action:** Move `Access-Control-Allow-Headers` inside the origin check so it is only returned to allowlisted origins. When auth replaces the shared secret, remove `X-Admin-Secret` from this header entirely.

---

#### Issue 8 — No `entitlement.updated` route or event type

**Severity: Medium**

ADR-008 lists `entitlement.updated` and `entitlement.suspended` as required audit event types. There is no `PATCH /api/entitlements/:id` route. Entitlement status changes (e.g., suspending a module, extending expiry) currently require going directly to the Supabase dashboard or the admin secret routes, with no API-level audit trail.

**Action:** Add `PATCH /api/entitlements/:id` with:
- `requireAdminSecret` middleware
- Zod schema for the patch body (`status`, `expires_at`)
- Audit write for `entitlement.updated` with `before_state` (fetch before update) and `after_state`

This is also where the transactional audit write pattern (Issue 1) should be first implemented as the template.

---

#### Issue 9 — Node.js `>=18` in `engines` — EOL since April 2025

**Severity: Low**

Node 18 is no longer receiving security patches. The `^2.49.0` range for `@supabase/supabase-js` could resolve to v2.79.0+ which drops Node 18 support.

**Action:** Update `package.json` to `"node": ">=20.0.0"` and pin the Vercel runtime to Node 20 in `vercel.json`:

```json
"functions": { "api/**/*.js": { "runtime": "nodejs20.x" } }
```

---

#### Issue 10 — Babel standalone has no build step — blocks CSP, type safety, and bundle optimization

**Severity: Low (now), High (at production)**

The React shell uses Babel standalone in the browser. This is a valid rapid-prototyping choice and acceptable for the current stage. However, it carries three forward risks:
- Cannot implement a meaningful Content-Security-Policy without `unsafe-inline`
- No TypeScript, no static analysis, no tree-shaking
- Runtime compilation adds ~300ms to first meaningful paint

**Action:** This is not an immediate fix — don't introduce build tooling during the prototype phase. But create a tracked task: "Migrate shell to Vite build step as part of auth wiring work." The auth wiring moment is the right time because it requires changes to environment variable handling anyway (Vite's `import.meta.env` vs. runtime globals). Combining the two migrations minimizes churn.

---

## Summary: Prioritized Action List

### Do before any regulated customer goes live

| # | Action | Effort |
|---|---|---|
| 1 | Implement transactional audit writes via Supabase RPC | Medium |
| 2 | Add cross-tenant isolation tests to CI (merge-blocking) | Small |
| 3 | Add `PATCH /api/entitlements/:id` with before/after audit write | Small |
| 4 | Add audit write to `POST /api/organizations` | Trivial |

### Do before the first IQ module is built

| # | Action | Effort |
|---|---|---|
| 5 | Resolve inter-module event contract (ADR-009: webhooks vs. Realtime) | Small (doc) |
| 6 | Create local dev orchestration (`docker-compose` / `make dev`) | Medium |
| 7 | Add FK from `entitlements.module_id` → `module_manifests.id` | Small |
| 8 | Clarify `org_id` nullability — update ADR-007 or enforce NOT NULL | Trivial |

### Do as part of auth wiring work

| # | Action | Effort |
|---|---|---|
| 9 | Add `external_auth_id` + `auth_provider` columns to `users` | Small |
| 10 | Add soft-delete (`deleted_at`) to `tenants` and `organizations` | Small |
| 11 | Add `updated_at` trigger function to all mutable tables | Small |
| 12 | Migrate shell from Babel standalone to Vite | Medium |
| 13 | Implement meaningful CSP after build step migration | Medium |

### Hardening (can be done any time)

| # | Action | Effort |
|---|---|---|
| 14 | Add security headers to `vercel.json` (X-Frame-Options etc.) | Trivial |
| 15 | Gate `Access-Control-Allow-Headers` behind origin check | Trivial |
| 16 | Update Node.js engine to `>=20` and pin Vercel runtime | Trivial |
| 17 | Add `ON DELETE RESTRICT` to audit FK references | Small |

---

## What Earns the 7.4

The score is held down by two things: the compliance gap (fail-open audit writes) and the test coverage gap (no isolation tests in CI). These are the only two items that would cause an independent reviewer to say "not yet" for a regulated customer.

Everything else — the ADR library, the middleware pattern, the entitlement engine, the schema design, the RLS strategy, the key handling — is genuinely strong for a pre-auth prototype. The code reflects deliberate architectural thinking, not accretion. The gap between 7.4 and 9.0 is almost entirely execution on two well-understood, well-documented items that are already on the radar.

The documentation quality alone puts this system ahead of most commercial SaaS platforms at the same stage. ADR-006's single-replacement-point auth scaffolding, ADR-007's correct resolution of the org/site billing hierarchy, and the `filterActiveEntitlements` + `unionEntitlements` pure function pattern are all things a senior engineer would have to fight for on most teams. Here they were designed in from the start.

---

*Analysis based on full source review: all migrations (001–004), all API routes and middleware, all eight ADRs, test strategy, design doc v1.2. Rating is relative to production-readiness for a regulated food safety SaaS platform, not relative to prototype standards.*
