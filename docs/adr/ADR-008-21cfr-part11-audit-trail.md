# ADR-008: 21 CFR Part 11 Compliance Design - Audit Trail and Electronic Records

**Status:** Accepted - Phase 1 + Phase 2a Implemented (2026-06-24)  
**Date:** 2026-06-23  
**Deciders:** sromig@hygiena.com  
**Blocking:** Yes - required before any regulated customer goes live (Open Item #8)

---

## Context

FDA 21 CFR Part 11 §11.10 governs electronic records and electronic signatures for FDA-regulated industries. SureTrend customers operating under FSMA, 21 CFR Part 117, or other FDA frameworks must use a Part 11-compliant system. This is a hard blocker — not a nice-to-have.

§11.10 requires:

| Requirement | Description |
|---|---|
| **§11.10(a)** | Validated systems that generate accurate and complete copies of records |
| **§11.10(b)** | Records protected from erasure, destruction, or unauthorized alteration |
| **§11.10(c)** | Access limited to authorized individuals |
| **§11.10(d)** | Audit trails with computer-generated date/time stamps |
| **§11.10(e)** | Sequential use of record identifiers and date/time stamps |
| **§11.10(f)** | Authority checks to ensure only authorized individuals can use the system |
| **§11.10(g)** | Device checks to verify the source of data input |
| **§11.10(h)** | Training documentation for individuals who use electronic records |
| **§11.10(i)** | Written policies holding signatories accountable for actions under their signatures |
| **§11.10(j)** | Controls ensuring the authenticity, integrity, and confidentiality of electronic records |
| **§11.10(k)** | Distribution controls for electronic records |

The ALCOA+ framework (Attributable, Legible, Contemporaneous, Original, Accurate — plus Complete, Consistent, Enduring, Available) governs what audit records must contain.

---

## Decision

Implement a dedicated, append-only `audit_log` table in the Platform Supabase database. Every create, update, and delete operation on regulated data must write an audit record before the operation is considered complete.

### Regulated data in scope for v1

- `entitlements` (who can access what modules)
- `org_entitlements` (corporate-level module access)
- `user_tenant_memberships` (who belongs to which site and with what role)
- `module_manifests` (what modules exist and their access requirements)

### Events that must be logged

| Event type | Triggered by |
|---|---|
| `entitlement.created` | POST /api/entitlements |
| `entitlement.updated` | PATCH /api/entitlements/:id |
| `entitlement.suspended` | Status change to suspended |
| `org_entitlement.created` | POST /api/org-entitlements |
| `org_entitlement.updated` | PATCH /api/org-entitlements/:id |
| `membership.created` | User added to a site |
| `membership.removed` | User removed from a site |
| `membership.role_changed` | User role changed at a site |
| `manifest.updated` | Module manifest content changed |
| `access.denied` | Request rejected due to missing entitlement |
| `access.unauthorized` | Request rejected due to missing/invalid auth |

### Audit record schema

```sql
CREATE TABLE audit_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ALCOA: Attributable
  actor_id      text,       -- user id or 'system' for automated actions
  actor_type    text        NOT NULL CHECK (actor_type IN ('user', 'system', 'admin')),
  -- ALCOA: Contemporaneous
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  -- What changed
  event_type    text        NOT NULL,          -- e.g. 'entitlement.created'
  tenant_id     uuid,                          -- site scope (nullable for org-level events)
  org_id        uuid,                          -- org scope (nullable for site-level events)
  resource_type text        NOT NULL,          -- e.g. 'entitlement', 'membership'
  resource_id   text        NOT NULL,          -- id of the affected row
  -- ALCOA: Original and Accurate
  before_state  jsonb,                         -- row state before change (null for creates)
  after_state   jsonb,                         -- row state after change (null for deletes)
  -- Context
  ip_address    text,
  user_agent    text,
  request_id    text                           -- correlates to API request log
);
```

### Immutability rules

- **No UPDATE or DELETE on `audit_log`** — enforced via Supabase RLS: no policy grants UPDATE or DELETE to any role, including authenticated. Only INSERT is permitted (via service role in API middleware).
- **No soft-delete on `audit_log`** — records are permanent.
- **Timestamps use `DEFAULT now()` server-side** — client-supplied timestamps are never trusted for audit records.
- **Sequential IDs** — UUID v4 does not provide sequential ordering; `occurred_at` is the authoritative sort key. Composite index on `(tenant_id, occurred_at)` for efficient per-tenant queries.

### Electronic signature requirements (§11.10(d), §11.10(i))

For regulated write operations (creating or modifying a food safety record), the system must capture a signature event:

```sql
CREATE TABLE electronic_signatures (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id  uuid        NOT NULL REFERENCES audit_log(id),
  signer_id     text        NOT NULL,   -- user id
  signer_name   text        NOT NULL,   -- full name at time of signing
  meaning       text        NOT NULL,   -- what the signature means (e.g. 'I approve this record')
  signed_at     timestamptz NOT NULL DEFAULT now(),
  -- Signature is bound to the record content hash
  record_hash   text        NOT NULL    -- SHA-256 of after_state JSON
);
```

Electronic signatures are NOT required for every API call — only for regulated record approvals (e.g., approving a HACCP plan, signing off on a corrective action). The specific workflows requiring signatures are defined per IQ module, not in the platform.

---

## Implementation approach

### Phase 1 - Audit log infrastructure (platform layer)

1. Run migration `003_audit_log.sql` to create `audit_log` and `electronic_signatures` tables with RLS.
2. Add `writeAuditLog(event)` helper to `api/_lib/audit.js` — wraps Supabase insert, never throws (audit failure must not block the primary operation, but must be alerted).
3. Add audit writes to all entitlement and membership mutation routes.
4. Add `GET /api/audit-log` route (admin only) — paginated, filterable by `tenant_id`, `event_type`, `resource_id`, `occurred_at` range.
5. Run migration `004_audit_hardening.sql`: PostgreSQL immutability trigger on `audit_log` (blocks UPDATE/DELETE for all roles including service role); RLS on `organizations` and `org_entitlements`; `(resource_type, resource_id)` index.

**Hard production blockers identified in Phase 1 (cold review 2026-06-24):**

- ~~**Fail-open audit writes are not 21 CFR Part 11 compliant.**~~ **RESOLVED — Phase 2a (2026-06-24).** Migration `005_transactional_audit_rpcs.sql` introduces four PostgreSQL RPC functions (`create_entitlement_with_audit`, `create_org_entitlement_with_audit`, `create_tenant_with_audit`, `create_organization_with_audit`). Each function wraps the business record INSERT and the `audit_log` INSERT in a single transaction. All four regulated mutation routes (`api/entitlements.js`, `api/org-entitlements.js`, `api/tenants/index.js`, `api/organizations.js`) now call `supabase.rpc()` instead of the fail-open `writeAuditLog()` helper. `writeAuditLog()` is retained in `api/_lib/audit.js` for non-regulated logging paths only.

- **`actor_id` is not attributable.** Phase 1 and 2a audit records carry `actor_id: 'admin'` (a static string from the shared admin secret). ALCOA requires identifying the specific individual. When auth is wired, `actor_id` will be replaced with the authenticated user's JWT subject. To avoid silently mixing attributed and non-attributed records, the auth enablement event must write a `system.auth_enabled` tombstone record to mark the boundary — records before the boundary are prototype-phase; records after carry real identities. This tombstone must be written as the first action when auth is enabled.

### Phase 2a - Transactional audit writes *(COMPLETED 2026-06-24)*

Migration `005_transactional_audit_rpcs.sql`: four PostgreSQL functions wrapping each regulated mutation + audit INSERT in a single transaction. All four mutation routes updated to use `supabase.rpc()`. `writeAuditLog()` fail-open helper retained for non-regulated paths; no longer called on regulated mutation routes.

Integration tests added in `test/integration/admin-routes.test.js` verifying that each mutation route creates a corresponding `audit_log` entry (atomicity happy-path gate).

### Phase 2b - Electronic signatures (per IQ module)

Implemented inside each IQ module's API when a workflow step requires a regulated signature. Not in the platform layer. Pending — no IQ modules built yet.

### Phase 3 - Validation (pre-regulated-customer)

- System validation protocol document (IQ/OQ/PQ per FDA guidance)
- Penetration test of audit log immutability
- Named third-party reviewer sign-off

---

## Alternatives considered

| Alternative | Reason rejected |
|---|---|
| Log to a separate logging service (Datadog, Logtail) | Violates ALCOA — logs must be associated with the regulated data, not in a separate system that can be disconnected |
| Supabase Realtime triggers | Not synchronous with the write — audit record could be lost if the trigger fires after a crash |
| Hash-chain audit log (blockchain-style) | Adds complexity without regulatory requirement; ALCOA does not require hash chains |

---

## Consequences

- Every regulated mutation path gains a synchronous audit write — adds ~5ms latency per request (one additional INSERT).
- Audit log grows unboundedly — must plan for data retention (FDA requires records kept for minimum 2 years for food safety records).
- `GET /api/audit-log` is sensitive — requires strict access control when auth is wired.
- ~~The `audit.js` helper currently never throws (fail-open).~~ **Resolved Phase 2a.** All regulated mutation routes use transactional RPCs. `writeAuditLog()` retained only for non-regulated paths.
- **Phase 1 + 2a implemented** — `audit_log` table (migration 003), immutability trigger (migration 004), four transactional RPC functions (migration 005). All four regulated mutation routes are now fail-closed. `GET /api/audit-log` admin read route live.
- **Phase 2b and 3** remain pending — electronic signatures per IQ module workflow, and system validation protocol before regulated customers go live.
