# ADR-007: Organisation / Site Two-Level Tenant Hierarchy

**Status:** Accepted  
**Date:** 2026-06-23  
**Deciders:** sromig@hygiena.com (SME domain review)

---

## Context

The original flat tenant model (tenant = one entity) cannot support a common customer pattern:

- **Acme Foods Inc.** (corporate) signs an enterprise agreement and pays for ATP IQ across all its plants.
- **Acme Foods Chicago** (individual site) also wants to add Kleanz IQ, paid and administered locally.

Each Acme plant must see both the corporate-purchased modules AND any modules it purchased itself. The flat model has no parent/child relationship and therefore cannot resolve inherited entitlements.

Additionally, SureTrend's commercial model supports both:
1. A corporate buyer who pays for all sites centrally
2. An individual site buyer who pays only for their own location

Both must coexist under the same organization.

---

## Decision

Introduce a two-level hierarchy: **Organization → Site**.

```
Organization (Acme Foods Inc.)
    │
    ├── Site (Acme Foods — Chicago Plant)    ← tenantId in all data rows
    ├── Site (Acme Foods — Dallas Plant)
    └── Site (Acme Foods — Seattle Plant)
```

### Rules

1. **`tenantId` always refers to a Site** — the most granular isolation unit. All existing conventions (tenantId on every row, every request, every log) continue unchanged.
2. **Entitlements may be held at either level:**
   - `org_entitlements(org_id, module_id, status, expires_at)` — corporate-purchased modules; inherited by all child sites.
   - `entitlements(tenant_id, module_id, status, expires_at)` — site-purchased modules; scoped to that site only.
3. **Effective entitlement resolution** — `GET /api/modules` unions both:
   ```
   effective = site_entitlements(active) ∪ org_entitlements(active, for site's org)
   ```
   Deduplication by `module_id`; most permissive status wins.
4. **A Site always belongs to exactly one Organization.** A site cannot exist without a parent org. If a customer has only one location, they still have an org (with one child site).
5. **Users are assigned to Sites**, not Organizations. A corporate admin may be a member of multiple sites.
6. **Billing address and contract live on the Organization** (not modelled in v1; noted for future billing integration).

---

## Schema changes required

```sql
-- New table
CREATE TABLE organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  region     TEXT NOT NULL DEFAULT 'us-east-1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing tenants table becomes "sites" (or add org_id FK to tenants)
ALTER TABLE tenants ADD COLUMN org_id UUID REFERENCES organizations(id);

-- New org-level entitlements table
CREATE TABLE org_entitlements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id),
  module_id  TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('active','suspended','expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON org_entitlements(org_id);
```

---

## API changes required

`GET /api/modules` must:
1. Resolve the site's `org_id` from `tenants` (single row lookup, cached in the request).
2. Fetch `org_entitlements` for that `org_id` in parallel with `entitlements` for the `tenant_id`.
3. Union the two sets, deduplicate by `module_id`, enforce expiry on both.

New admin routes needed:
- `POST /api/organizations` — create an organization
- `POST /api/org-entitlements` — grant org-level module access
- `PATCH /api/tenants/:id` — assign `org_id` to a site

---

## Alternatives considered

| Alternative | Reason rejected |
|---|---|
| Keep flat tenant model, duplicate entitlements to each site manually | Operationally unworkable at scale; corporate changes require updating N site records |
| Tenant = Organization (not site) | Cannot isolate data at site level; regulatory frameworks (21 CFR Part 11) require site-level data isolation |
| Three-level hierarchy (Enterprise > Org > Site) | Over-engineered for current customer base; can be added later without structural rework |

---

## Consequences

- The flat `tenants` table becomes a "sites" table with an `org_id` FK.
- All existing `tenantId` references in data rows, API routes, and middleware remain valid — `tenantId` = site ID.
- `GET /api/modules` complexity increases (one additional query + union logic), but both queries are indexed and the result is small.
- `POST /api/tenants` (create site) requires an `org_id`; a new `POST /api/organizations` route is needed first.
- Existing test tenant (`c4d2d99e...`) must be assigned an `org_id` in migration.
- **Not yet implemented** — this ADR documents the decision. Implementation is tracked in Open Item #9 of the design doc.
