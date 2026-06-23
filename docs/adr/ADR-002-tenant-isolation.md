# ADR-002: Tenant Isolation — Shared Schema + tenantId + RLS

| Field | Value |
|---|---|
| **Date** | 2026-06-23 |
| **Status** | Accepted |
| **Deciders** | sromig@hygiena.com |
| **Applies to** | Platform Supabase project and every future module Supabase project |

---

## Context

Multi-tenancy is required from the first line of code (Engineering Constitution §3). The primary decision is the isolation model: how tenant data is separated at the database layer. This decision applies to the Platform Supabase project and, by extension, to every future module Supabase project (each module follows the same pattern).

---

## Decision

**Shared schema with `tenantId` column + Supabase Row Level Security (RLS).**

Every table that carries tenant data:
1. Has a `tenant_id uuid NOT NULL` column with a foreign key to `tenants.id`
2. Has an RLS policy enabled that filters all SELECT, INSERT, UPDATE, DELETE by `tenant_id`
3. Is tested for RLS isolation (see test strategy)

No table that carries tenant data may exist without an RLS policy. This is enforced at the time the table is created, not retrofitted later.

The Supabase service role key is used **only** on the server (Node.js API). The React client never holds the service role key. Client-side Supabase access (if used for Realtime) uses the anon key, which is always governed by RLS.

---

## Alternatives Considered

### Option A: Database-per-tenant
Each tenant gets its own Supabase project / PostgreSQL instance.

- **Pro:** Maximum isolation; no RLS misconfiguration risk; simpler queries (no tenantId filter needed).
- **Con:** Supabase project count becomes unmanageable at hundreds of tenants; provisioning new tenants requires infra automation; schema migrations must be applied to every tenant's DB; cost scales linearly with tenant count.

### Option B: Schema-per-tenant
Each tenant gets its own PostgreSQL schema within one Supabase project.

- **Pro:** Schema-level isolation without per-project overhead; queries are simpler within a schema.
- **Con:** Supabase does not cleanly support schema-per-tenant at scale; schema migrations must be applied per-schema; Supabase's RLS and auth are designed around the shared-schema model.

### Option C: Shared schema + tenantId + RLS *(chosen)*
All tenants share tables; `tenantId` column + RLS policies enforce isolation.

- **Pro:** Standard Supabase pattern; RLS is the enforcement layer Supabase is built for; schema migrations apply once; scales to thousands of tenants; operationally simple.
- **Con:** RLS misconfiguration is a security vulnerability; requires disciplined testing (cross-tenant isolation tests are the gate, not an afterthought); service role key must be kept strictly server-side.

---

## Reasoning

Shared schema + RLS is the model Supabase is designed for. Database-per-tenant at hundreds of customers is operationally untenable. Schema-per-tenant doesn't have first-class Supabase support. The RLS misconfiguration risk is real but is mitigated structurally: cross-tenant isolation tests are a required quality gate (see test strategy), and the service role key is server-only by architecture.

---

## Consequences

- Every Supabase table with tenant data must have RLS enabled from the moment it is created. Enabling RLS retroactively is operationally risky and counts as a defect.
- Cross-tenant isolation tests (prove tenant A cannot read tenant B's data via API and via direct RLS bypass attempts) are a required quality gate before any deploy.
- The Supabase service role key must never appear in the React client bundle, in `NEXT_PUBLIC_` / `VITE_` environment variables, or in GitHub repository history.
- Every Node.js API route that accesses tenant data must pass `tenantId` as the filter — trusting `tenantId` from the client request body is a bug; it must come from the authenticated session (when auth is wired) or be enforced by RLS.
- RLS policy template for tenant tables:
  ```sql
  ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "tenant_isolation" ON <table_name>
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
  ```
