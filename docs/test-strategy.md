# SureTrend Platform — Test Strategy

> **Status:** Draft  
> **Date:** 2026-06-23  
> **Scope:** V1 — Platform shell + entitlement layer

This document defines what the test suite must prove before any deploy is permitted. Tests are written before implementation (TDD). A passing test suite is evidence, not assertion — the tests are the audit trail.

---

## a) Unit Tests

**What they prove:** Pure logic is correct in isolation. No database, no network.

| Area | What to test |
|---|---|
| Entitlement evaluation | `checkEntitlement(tenantId, moduleId)` returns `allowed: false` for expired/suspended entitlements; `allowed: true` for active non-expired ones |
| Entitlement expiry | Entitlement with `expires_at` in the past → denied; in the future → allowed; `null` → allowed (no expiry) |
| Manifest filtering | Given a list of manifests and a list of active entitlement module IDs, filter returns only entitled manifests |
| Manifest schema validation | A manifest missing required fields fails validation; a valid manifest passes |
| Locale resolution | Precedence: user preference → tenant default → Accept-Language header → `en-US` fallback |
| `getTenantId(req)` | Extracts `X-Tenant-ID` header correctly; returns null/throws when header absent |
| Region routing | `getSupabaseClientForTenant(tenantId)` returns correct client for known regions; throws for unknown region |

**Framework:** Jest (Node.js)

---

## b) Integration Tests

**What they prove:** API routes work end-to-end against a real (test) Supabase project.

| Route | Test cases |
|---|---|
| `GET /api/modules?tenantId=` | Returns only manifests for modules with active entitlements; returns empty array for tenant with no entitlements; returns 400 if tenantId missing |
| `GET /api/entitlements?tenantId=` | Returns correct entitlement records; filters by tenantId; excludes expired records |
| `GET /api/tenants/:id` | Returns tenant record; 404 for unknown tenant |
| `POST /api/tenants` | Creates tenant with required fields; rejects missing fields; sets `region` correctly |
| `POST /api/entitlements` | Creates entitlement with valid status; rejects invalid status values |

**Additional integration assertions:**

- Every data-access Supabase query in the Platform API is asserted to include a `tenant_id` filter — achieved by query-level tests that assert the generated SQL/filter includes the tenantId parameter.
- The `module_manifests` table is confirmed to have RLS enabled via Supabase introspection query: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'module_manifests'`.

**Framework:** Jest + Supabase test project (separate from production)

---

## c) Cross-Tenant Isolation Tests (Security Gate)

**What they prove:** Tenant A cannot read, write, or infer Tenant B's data through any path. This is a security gate — it must be green before any deploy.

### Test setup
- Two test tenants in the test Supabase project: `TENANT_A` and `TENANT_B`
- `TENANT_A` has entitlements for module `atp`
- `TENANT_B` has entitlements for module `iq-map`

### API-layer isolation tests
| Test | Expected result |
|---|---|
| Request with `X-Tenant-ID: TENANT_A` to `GET /api/entitlements` | Returns only TENANT_A's entitlements; TENANT_B's records absent |
| Request with `X-Tenant-ID: TENANT_A` to `GET /api/modules` | Returns only `atp` manifest; `iq-map` absent |
| Request with manipulated `X-Tenant-ID` set to TENANT_B's ID | Returns TENANT_B's data — this proves the header is the current tenantId source; the auth-gate ADR records that this changes when JWT is wired |
| Request with no `X-Tenant-ID` header | Returns 400 (missing required parameter) |

### RLS bypass attempt tests (direct Supabase)
These tests use the Supabase **anon key** (not service role) to simulate what a client could do directly:

| Test | Expected result |
|---|---|
| Anon key SELECT on `entitlements` with no tenantId filter | Returns 0 rows (RLS blocks all anon access) |
| Anon key SELECT on `entitlements` filtering by TENANT_B's ID | Returns 0 rows (RLS blocks without JWT claim) |
| Anon key INSERT to `entitlements` | Rejected by RLS |
| Anon key SELECT on `org_entitlements` | Returns 0 rows (RLS deny-all for anon) |
| Anon key SELECT on `organizations` | Returns 0 rows (RLS deny-all for anon) |
| Anon key SELECT on `audit_log` | Returns 0 rows (RLS deny-all; 21 CFR audit records never client-readable) |
| Anon key SELECT on `tenants` | Returns 0 rows (RLS deny-all for anon) |
| Anon key SELECT on `user_tenant_memberships` | Returns 0 rows (RLS deny-all for anon) |
| Service role key SELECT on `entitlements` (no RLS bypass) | Returns all rows — confirms service role is server-only; test verifies the key is not in any client-accessible env var |

### Manifest isolation test
| Test | Expected result |
|---|---|
| Request for TENANT_A's module list | Does not include TENANT_B-only modules |

**Framework:** Jest + Supabase test project  
**Run frequency:** Every CI run; blocks merge to main

---

## d) Auth-Readiness Tests

**What they prove:** When a real auth provider is wired, it can be done without structural changes.

| Test | Expected result |
|---|---|
| Replace `getTenantId(req)` implementation with JWT extractor | All integration tests pass without changes to call sites |
| Insert auth middleware at a `// TODO: auth-gate` endpoint | Endpoint returns 401 when no/invalid token provided; returns correct data with valid token |
| Entitlement check result used server-side | `GET /api/modules` returns 0 manifests when entitlement check returns `allowed: false` — not just a UI hide |

These tests are written against a mock auth middleware that simulates JWT validation. They prove the plumbing is correct before a real IdP is integrated.

---

## e) Load Test Baseline

**What they prove:** The Platform API handles concurrent tenant sessions without state leakage or timeout.

**Scenario:** 50 concurrent tenant sessions, mixed read traffic (module registry + entitlement checks), sustained for 60 seconds.

| Assertion | Target |
|---|---|
| P95 response time for `GET /api/modules` | < 500ms |
| P99 response time | < 1000ms |
| Zero cross-tenant data in any response | Verified by response content inspection |
| Zero 5xx errors | Required |
| No in-memory state leaked between invocations | Verified by running 100 sequential requests in separate Vercel function invocations and confirming each starts cold |

**Vercel cold-start test:** Deploy to Vercel, invoke the function with a 5-minute gap between invocations, confirm no module-level variable holds state from the previous invocation.

**Framework:** k6 or Artillery  
**Run frequency:** Before each release; not required on every PR

---

## Quality Gate Summary

| Gate | Blocks |
|---|---|
| Unit tests green | Every commit |
| Integration tests green | Every PR to main |
| Cross-tenant isolation tests green | Every PR to main; required before deploy |
| Auth-readiness tests green | Required before auth provider is wired |
| Load test green | Required before production launch |
| Cold review completed (output in `docs/review/`) | Required before any production code ships |
| Independent human engineering review | Required before real customer data |
