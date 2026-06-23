# ADR-003: Data Residency — US-Only Now, Region-Aware by Design

| Field | Value |
|---|---|
| **Date** | 2026-06-23 |
| **Status** | Accepted |
| **Deciders** | sromig@hygiena.com |
| **Review trigger** | First confirmed EU customer, or EU/GDPR compliance requirement raised by legal |

---

## Context

Where a tenant's data physically lives may be a compliance requirement (GDPR for EU customers) or a commercial selling point. The Engineering Constitution (§4) requires that data residency be a deliberate decision, not a default. This ADR records that decision.

---

## Decision

**Start with a single Supabase project in the US East region. Design so a second region can be added without structural rework.**

Specifically:
1. The `tenants` table includes a `region` column (`text NOT NULL DEFAULT 'us-east-1'`).
2. No code hardcodes the US region — connection strings and Supabase URLs are environment variables, not literals.
3. The Platform API includes a tenant-to-region routing layer (initially a no-op that always returns the US project URL; expanded to route EU tenants to an EU Supabase project when one is provisioned).
4. No PII is written to logs, Vercel environment variable names visible in CI output, or GitHub Actions workflow logs.

---

## Alternatives Considered

### Option A: Multi-region from day one
Provision both US and EU Supabase projects immediately; route tenants by region at signup.

- **Pro:** GDPR-ready from day one; no migration risk when EU customers arrive.
- **Con:** Double the Supabase operational overhead with no confirmed EU customers; violates scope discipline (§8 of constitution) — do not build infrastructure for features that don't exist yet.

### Option B: US-only, no region awareness in design
Single US region, no `region` field, no routing layer.

- **Pro:** Maximally simple now.
- **Con:** Adding EU residency later requires a schema migration (adding the `region` field), a data migration (assigning regions to existing tenants), and a routing layer — structural rework instead of a config change. This is the mistake the constitution is designed to prevent.

### Option C: US-only now, region-aware by design *(chosen)*
Single US region. `region` field on `tenants` row. Routing layer built as a no-op now, extended later.

- **Pro:** Operationally simple now (one Supabase project); GDPR-capable later (adding an EU project is a config + routing change, not a schema rewrite); satisfies constitution's "bake in the capability, defer the content" principle.
- **Con:** Slightly more code in the routing layer than Option B. Cost is minimal.

---

## Reasoning

No EU customers are confirmed. Multi-region before demand violates scope discipline. But US-only with no design allowance for future regions would require structural rework — which is the mistake the constitution's §4 is designed to prevent. Option C threads the needle: one region in production, zero structural debt for adding a second.

---

## Consequences

- `tenants` table schema includes: `region text NOT NULL DEFAULT 'us-east-1'`
- Platform API has a `getSupabaseClientForTenant(tenantId)` helper that resolves the correct Supabase URL/key from the tenant's region — initially always returns the US client.
- Supabase project URL and service role key are environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — never hardcoded.
- PII (email addresses, names, facility addresses) must not appear in:
  - Application logs (use tenant_id references, not tenant names)
  - Vercel environment variable names
  - GitHub Actions workflow output
- When the first EU customer is confirmed, this ADR is updated and an EU Supabase project is provisioned — the routing layer is updated from a no-op to a real region switch.
