-- SureTrend Platform - Schema v2: Org/Site Hierarchy (ADR-007)
-- Run after 001_platform_schema.sql.
-- Introduces organizations table, org_id FK on tenants, and org_entitlements.

-- ─────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────
CREATE TABLE organizations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  region     text        NOT NULL DEFAULT 'us-east-1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- TODO: auth-gate — add authenticated-role read policy when auth is wired.

-- ─────────────────────────────────────────
-- tenants: add org_id FK (sites belong to one org)
-- ─────────────────────────────────────────
ALTER TABLE tenants ADD COLUMN org_id uuid REFERENCES organizations(id);

CREATE INDEX tenants_org_id_idx ON tenants(org_id);

-- ─────────────────────────────────────────
-- org_entitlements (corporate-level module access)
-- ─────────────────────────────────────────
-- Entitlements held at the org level are inherited by all child sites.
-- Effective entitlements for a site = site_entitlements UNION org_entitlements.
CREATE TABLE org_entitlements (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id  text        NOT NULL,
  status     text        NOT NULL CHECK (status IN ('active', 'suspended', 'expired')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, module_id)
);

ALTER TABLE org_entitlements ENABLE ROW LEVEL SECURITY;
CREATE INDEX org_entitlements_org_id_idx ON org_entitlements(org_id);
-- TODO: auth-gate — add authenticated-role read policy when auth is wired.

-- ─────────────────────────────────────────
-- user_tenant_memberships: update role constraint to confirmed 4-role model
-- ─────────────────────────────────────────
ALTER TABLE user_tenant_memberships
  DROP CONSTRAINT user_tenant_memberships_role_check;

ALTER TABLE user_tenant_memberships
  ADD CONSTRAINT user_tenant_memberships_role_check
  CHECK (role IN ('owner', 'globaladmin', 'admin', 'user'));
