-- SureTrend Platform — Schema v1
-- Run against the Platform Supabase project.
-- RLS is enabled on all tables. No policies are added for the anon or
-- authenticated roles in v1 (auth is deferred per ADR-004). The service
-- role key bypasses RLS and is the only access path today.
-- TODO: auth-gate — add authenticated-role policies when auth is wired.

-- ─────────────────────────────────────────
-- tenants
-- ─────────────────────────────────────────
CREATE TABLE tenants (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  region     text        NOT NULL DEFAULT 'us-east-1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: deny-all by default.
-- TODO: auth-gate — CREATE POLICY "tenant_self_read" ON tenants
--   FOR SELECT TO authenticated
--   USING (id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────
-- users
-- ─────────────────────────────────────────
CREATE TABLE users (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- TODO: auth-gate — CREATE POLICY "user_self_read" ON users
--   FOR SELECT TO authenticated USING (id = auth.uid());

-- ─────────────────────────────────────────
-- user_tenant_memberships
-- ─────────────────────────────────────────
CREATE TABLE user_tenant_memberships (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id  uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('viewer', 'technician', 'supervisor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

ALTER TABLE user_tenant_memberships ENABLE ROW LEVEL SECURITY;
-- TODO: auth-gate — CREATE POLICY "membership_self_read" ON user_tenant_memberships
--   FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- entitlements
-- ─────────────────────────────────────────
CREATE TABLE entitlements (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id  text        NOT NULL,
  status     text        NOT NULL CHECK (status IN ('active', 'suspended', 'expired')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, module_id)
);

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
-- Index: primary query pattern is always tenant_id-scoped.
CREATE INDEX entitlements_tenant_id_idx ON entitlements(tenant_id);
-- TODO: auth-gate — CREATE POLICY "entitlements_tenant_read" ON entitlements
--   FOR SELECT TO authenticated
--   USING (tenant_id IN (SELECT tenant_id FROM user_tenant_memberships WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────
-- module_manifests
-- ─────────────────────────────────────────
-- Not tenant-scoped. Manifests are global; entitlement filtering
-- happens at the API layer, not in this table.
CREATE TABLE module_manifests (
  id         text        PRIMARY KEY,
  manifest   jsonb       NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE module_manifests ENABLE ROW LEVEL SECURITY;
-- Public list-price manifests: anon role may read active manifests only.
-- Entitlement filtering is still enforced at the API layer.
CREATE POLICY "manifests_public_read" ON module_manifests
  FOR SELECT TO anon
  USING (is_active = true);
-- No anon INSERT/UPDATE/DELETE. Service role manages manifests.
