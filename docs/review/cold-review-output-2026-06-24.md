# Cold Review Output — SureTrend Platform Change Package

**Date:** 2026-06-24  
**Reviewer:** Independent AI cold review (no design context)  
**Material reviewed:** Change Review Package — commits `500dfc8` through `7d1f1f3`  
**Prior review:** `cold-review-output-2026-06-23.md`  
**Save as:** `docs/review/cold-review-output-2026-06-24.md`

---

## Verdict

**CONDITIONAL PASS — changes are well-structured but two issues must be resolved before this package advances toward regulated use.**

**Blockers:**
1. Fail-open audit writes violate 21 CFR Part 11 §11.10(b) — a mutation that succeeds without a written audit record is a compliance gap, not just an observability gap.
2. `X-Tenant-ID` header is accepted without verification on all public reads — tenant isolation depends entirely on caller honesty.

---

## Findings

### Critical

---

#### C-1 · Fail-open audit writes are not acceptable under 21 CFR Part 11

**Location:** `api/_lib/audit.js` · `writeAuditLog()` · ADR-008

**Flaw:** The ADR-008 "fail-open" design means a mutation (e.g., granting an entitlement) can succeed and commit to the database while the corresponding audit record is never written. Under 21 CFR Part 11 §11.10(b), the requirement is not "log the event when the logging system is available" — it is "maintain accurate and complete copies of all records." A record that exists in `entitlements` with no corresponding row in `audit_log` is a record that was created without an auditable trail. No amount of alerting compensates for this: the alert tells you the trail is broken, it does not reconstruct it.

The ADR argues fail-open is acceptable "with alerting." This is a reasonable engineering tradeoff for non-regulated workloads. It is not an acceptable interpretation of 21 CFR Part 11 for regulated data — FDA inspectors review audit trail completeness against the record set, not against alert logs.

**Why it matters:** This is the foundational compliance requirement for any FDA-regulated customer. Shipping a non-compliant audit trail and then adding compliance later is structurally harder than building it correctly now.

**Fix:** Wrap the business operation and the audit write in a Supabase RPC (PostgreSQL function) that executes both as a single transaction. If the audit write fails, the transaction rolls back and the mutation does not commit. This is the only implementation that guarantees every committed record has a corresponding audit row. If the transaction approach is architecturally blocked, document explicitly in ADR-008 that this system is not 21 CFR Part 11 compliant until Phase 2 wires transactional audit writes — and treat this as a hard production blocker for regulated customers.

---

#### C-2 · `X-Tenant-ID` header is unverified — any caller can read any tenant's data

**Location:** `api/modules.js` · `GET /api/modules` · `GET /api/entitlements` · all public reads

**Flaw:** The change package states "public reads are tenant-scoped via `X-Tenant-ID` header." This is not tenant isolation — this is a convention. Any caller who sends `X-Tenant-ID: <any valid UUID>` receives that tenant's module list, entitlements, and `_source` annotations. There is no mechanism that verifies the caller is associated with the tenant they are requesting. The previous cold review flagged client-supplied `tenantId` as a High finding. This change package introduces a header-based variant of the same pattern without resolving the underlying issue.

The `ALLOW_DEV_TENANT_HEADER` gate is noted — but it is a Vercel env var set at deploy time, not per-request. If it is `true` in any deployed environment reachable by non-developers, the gate provides no protection.

**Why it matters:** The entire tenant isolation model rests on the assumption that callers supply their own tenantId honestly. That is not a security model.

**Fix:** Centralize `tenantId` extraction into middleware that derives it from a verified credential (when auth lands) and refuses the request when no credential is present. The `X-Tenant-ID` header should only be accepted in local development (localhost) and should not exist as a concept in any deployed environment, including preview/staging. Flag `ALLOW_DEV_TENANT_HEADER` as a dev-only env var with a Vercel preview deployment guard.

---

### High

---

#### H-1 · Audit log has no immutability guarantee at the application layer

**Location:** `supabase/migrations/003_audit_log.sql` · `api/_lib/audit.js`

**Flaw:** The RLS approach — "no UPDATE or DELETE policies defined, service role bypasses RLS" — is stated as the immutability mechanism. The anon/authenticated roles cannot modify audit rows, which is correct. But the service role key bypasses RLS entirely, including on `audit_log`. Any Node.js route that has access to the service role key (which is all of them, since it's imported into `api/_lib/supabase.js`) can `.update()` or `.delete()` on `audit_log` rows today. There is no PostgreSQL-level constraint preventing this.

For 21 CFR Part 11 §11.10(b), "computer-generated, time-stamped audit trails" must be protected from modification. RLS protecting the anon role is not sufficient if the service role — which is used by all API routes — can mutate the table freely.

**Fix:** Add a PostgreSQL trigger on `audit_log` that raises an exception on any `UPDATE` or `DELETE`, including from the service role. This is the only mechanism that protects against application-layer mutation regardless of which role is used:

```sql
CREATE OR REPLACE FUNCTION audit_log_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows are immutable';
END;
$$;

CREATE TRIGGER audit_log_immutable_trigger
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
```

---

#### H-2 · `unionEntitlements` has an unhandled edge case: org active, site expired

**Location:** `api/_lib/entitlements.js` · `unionEntitlements()` · `api/modules.js` step 4

**Flaw:** The "site wins" logic overwrites org rows with site rows on the same `module_id` — then step 4 filters to active/non-expired. This means: if the org has an active entitlement for module X and the site has an `expired` entitlement for the same module (not deliberately suspended — just lapsed), the site's expired row wins the union, the module is filtered out in step 4, and the site cannot access a module the org explicitly granted. A lapsed site entitlement silently overrides an active org entitlement.

The 6 unit tests do not cover: `org active + site expired`. This is the case most likely to produce a support ticket ("we paid for this at the corporate level but one site lost access") and least likely to be caught in manual testing.

**Fix:** Clarify in ADR-007 whether an expired site row should block an org-active entitlement. If the intent is "site can only deliberately suppress, not accidentally block via expiry," the logic should be: site row wins only if its `status` is `active`. Expired site rows should fall through to the org row. Add the `org active + site expired` test case to `entitlements.test.js`.

---

#### H-3 · `actor_id` is always a static string — audit records are not attributable

**Location:** `api/_lib/audit.js` · all `writeAuditLog()` call sites

**Flaw:** Every audit record has `actor_id: 'system'` or `actor_id: 'admin'` — a static string, not an identity. The first A in ALCOA is Attributable: "who performed the action." Under 21 CFR Part 11, attributability requires identifying the specific individual, not the role. A log that says "admin" did something is not attributable — it says a class of credential was used, which is meaningless when the admin secret is shared (which it is).

This is acknowledged in the known limitations section. It is called out here as High because the implementation wires attributability-less records into the same table that will be used for 21 CFR Part 11 compliance. Starting with non-attributable records means the audit trail will contain a mix of attributed and non-attributed records once auth lands, which complicates the compliance argument without an explicit boundary marker.

**Fix:** Accept that Phase 1 audit records are non-attributable and document a tombstone event strategy: when auth lands, write a `system.auth_enabled` audit record that marks the boundary. Records before the boundary are prototype-phase; records after carry real `actor_id`. Do not mix them silently in the same table without a marker.

---

### Medium

---

#### M-1 · `ip_address` extracted from `X-Forwarded-For` without sanitization

**Location:** `api/_lib/audit.js` · `requestContext()`

**Flaw:** `X-Forwarded-For` is a client-supplied header. It can contain arbitrary values including multiple IPs (proxy chain), spoofed IPs, or injected strings. Writing it directly into `audit_log.ip_address` stores unvalidated client input in the compliance record. On Vercel, the actual client IP is available as the last entry in `X-Forwarded-For` (Vercel appends the real client IP at the end); the first entry is client-controlled. Storing a spoofed IP as the actor's network location weakens the attribution argument for the audit record.

**Fix:** On Vercel, trust only the last IP in `X-Forwarded-For` or use `req.socket.remoteAddress` where available. Validate the extracted value as a valid IPv4/IPv6 string before storing. Do not store multi-IP strings.

---

#### M-2 · `organizations` table has no RLS policies specified in this package

**Location:** `supabase/migrations/002_org_hierarchy.sql` · `organizations` table

**Flaw:** The migration creates `organizations` and `org_entitlements`. The change package states RLS is enabled on `org_entitlements` with a tenant-scoped read policy. It does not state whether RLS is enabled on `organizations` itself, and no `CREATE POLICY` statements are provided for either table. The previous cold review flagged the absence of RLS policy SQL as the top critical finding. This change introduces two new tables without closing that gap.

**Fix:** Provide `CREATE POLICY` statements for both `organizations` and `org_entitlements` in the migration file. At minimum: confirm the anon role cannot read org rows. Confirm the tenant-scoped read policy on `org_entitlements` exists as actual SQL.

---

#### M-3 · `_source` annotation may mis-annotate when a site row is present but inactive

**Location:** `api/modules.js` · step 6 (`_source` annotation)

**Flaw:** The spec says `_source` is `'org'` only when no active site-level entitlement exists for that module. The logic reportedly compares `siteActiveIds` vs `orgActiveIds` after the union and filter. But `unionEntitlements()` is called with `siteRows` and `orgRows` before the active/non-expired filter (step 4 runs after step 3). If `siteActiveIds` is derived from the pre-filter `siteRows` rather than the post-filter set, a site row that is inactive will still appear in `siteActiveIds` and the module will be mis-annotated as `'site'` when it should be `'org'`.

The integration tests check `supplier` as `'org'` and `atp` as `'site'`, but do not test: site has an inactive entitlement for module X, org has an active entitlement — expected `_source === 'org'`.

**Fix:** Derive `siteActiveIds` from the already-filtered active set (post step 4), not from raw `siteRows`. Add the missing test case.

---

### Low

---

#### L-1 · `audit_log` missing index on `resource_id`

**Location:** `supabase/migrations/003_audit_log.sql`

**Flaw:** Three indexes are defined: `(tenant_id, occurred_at DESC)`, `(org_id, occurred_at DESC)`, `(event_type, occurred_at DESC)`. The `GET /api/audit-log` route supports filtering by `tenant_id` and `event_type`, both covered. But there is no index on `resource_id`. A 21 CFR Part 11 audit review will routinely query "show me everything that happened to entitlement UUID X" — without a `resource_id` index, that query scans the full audit table.

**Fix:** Add `CREATE INDEX ON audit_log (resource_type, resource_id)` and expose `resource_id` as a filter parameter in `GET /api/audit-log`.

---

#### L-2 · Role constraint change is a breaking migration — no rollback strategy documented

**Location:** `supabase/migrations/002_org_hierarchy.sql` · `user_tenant_memberships` role check

**Flaw:** The migration drops the existing role constraint and replaces it with a new one (`owner / globaladmin / admin / user` replacing `technician / supervisor`). If any existing rows in `user_tenant_memberships` carry the old role values, the migration will fail at the constraint add — or rows with old values will violate the new constraint. There is no documented rollback path and no data migration step.

**Fix:** Add an explicit `UPDATE user_tenant_memberships SET role = 'user' WHERE role NOT IN ('owner','globaladmin','admin','user')` before the `DROP CONSTRAINT / ADD CONSTRAINT` steps. Document what the existing role values were and how they map to the new model.

---

## Specific Review Focus Responses

### 1. Immutability guarantee — 21 CFR Part 11 §11.10(b)

**Verdict: Insufficient.** RLS-only does not protect against the service role key, which is used by all Node.js routes. Any route can call `.update()` or `.delete()` on `audit_log` today. Additionally, fail-open audit writes mean committed business records can exist without a corresponding audit row, which violates §11.10(b)'s completeness requirement. Two fixes required: (a) PostgreSQL immutability trigger, (b) transactional audit writes.

### 2. `unionEntitlements` correctness

**Verdict: Correct for documented cases, one unhandled edge case.** Site-wins logic is sound for the stated intent. Unhandled case: org active + site expired silently blocks access rather than falling through to the org grant. Whether this is intended behavior or an expiry-driven accidental suppression needs an explicit decision in ADR-007 and a unit test.

### 3. `_source` annotation accuracy

**Verdict: Potentially incorrect, unverified by tests.** Depends on whether `siteActiveIds` is derived pre- or post-filter. The test suite does not cover the scenario where a site row is present but inactive. Requires code review of where `siteActiveIds` is populated and an additional test case.

### 4. Fail-open audit writes vs. 21 CFR Part 11

**Verdict: Not acceptable for regulated customers.** The regulation requires complete records, not best-effort records. The "fail-loud" alerting argument is a monitoring strategy, not a compliance strategy. Transactional audit writes (business op + audit in one PostgreSQL transaction via Supabase RPC) are the minimum bar for regulated use. ADR-008 should be updated to reflect this as a hard production blocker.

### 5. Admin secret as auth — prototype acceptability

**Verdict: Acceptable for prototype, must not reach regulated customers.** A shared `ADMIN_SECRET` means audit records cannot attribute actions to individuals — every admin operation looks identical regardless of who performed it. Migration path: when auth lands, replace the static `actor_id: 'admin'` with the authenticated user's JWT subject, and rotate the shared secret to per-user credentials. Document this in ADR-004.

### 6. Schema review — `audit_log`, `org_entitlements`, `organizations`

**Gaps identified:**
- `organizations`: no RLS policy SQL provided
- `org_entitlements`: no RLS policy SQL provided (stated as "tenant-scoped read policy" but no SQL)
- `audit_log`: missing `resource_id` index; missing immutability trigger; no constraint preventing future columns from accepting client-supplied `occurred_at`
- `electronic_signatures`: `record_hash` column exists but no description of what is hashed or how — this needs a spec before Phase 2

---

## What This Package Does Well

- `unionEntitlements()` as a pure function with unit tests is clean, correct for documented cases, and easy to reason about independently of the route logic.
- The admin secret header pattern is appropriate for a prototype. The cleanup commit (Change 8) — removing diagnostic error detail from the production response — shows the right instinct applied quickly.
- The `audit_log` schema is well-designed: UUID PK, `timestamptz` with server-side `now()` default, `before_state`/`after_state` JSONB, `CHECK` constraint on `actor_type`, correct FK references.
- Test coverage has grown from 0 to 68 passing tests. Integration tests run against live Vercel + Supabase — this is the right fidelity for a serverless stack where behavior can differ from local mocks.
- The `_source` annotation is computed server-side and not trusted from the client.
- The `IQAppView` crash fix (Change 3) is correct: the fallback default object is the right pattern; it avoids both a crash and a misleading empty render.

---

## Minimum Bar Before Regulated Customer Use

1. **Transactional audit writes** — wrap mutation + `writeAuditLog()` in a Supabase RPC. No fail-open for regulated operations.
2. **PostgreSQL immutability trigger** on `audit_log` — block `UPDATE` and `DELETE` for all roles including service role.
3. **RLS policy SQL for `organizations` and `org_entitlements`** — provide actual `CREATE POLICY` statements in the migration file.
4. **Remove `X-Tenant-ID` from deployed environments** — dev-only, localhost-only, never in Vercel preview or production.
5. **Resolve org-active + site-expired edge case** in `unionEntitlements()` and add the unit test.
6. **`resource_id` index on `audit_log`** and expose as a query filter — required for practical audit review.
7. **Specify `record_hash` in `electronic_signatures`** — what is hashed, with what algorithm, verified how — before Phase 2 writes to this table.

---

*This review was conducted against the Change Review Package (commits `500dfc8` through `7d1f1f3`) only. No actual source code was reviewed — findings are based on the code excerpts and descriptions in the change package document. This is a sandbox engineering check and does not replace an independent human review before real customer data (see design-doc.md, Open Items #1).*
