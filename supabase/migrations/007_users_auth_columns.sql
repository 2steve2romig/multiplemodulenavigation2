-- 007_users_auth_columns.sql
-- Design doc open item #17: external_auth_id + auth_provider on users table.
-- Also adds set_updated_at() trigger function across all mutable tables
-- (architecture analysis finding: updated_at currently set manually in routes/RPCs).
--
-- Run after 001–006.

-- ── 1. Users: auth provider columns ──────────────────────────────────────────
-- external_auth_id: opaque sub claim from the identity provider (e.g. auth0|abc123).
--   UNIQUE enforces one platform user per provider identity.
--   Index supports the JWT-sub → platform-user lookup at auth middleware time.
-- auth_provider: which IdP issued the credential (e.g. 'auth0', 'supabase').
--   Nullable until auth is wired (ADR-004); set to non-null when the
--   system.auth_enabled tombstone event is written (ADR-008).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS external_auth_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS auth_provider    text;

CREATE INDEX IF NOT EXISTS users_external_auth_id_idx ON users(external_auth_id)
  WHERE external_auth_id IS NOT NULL;

-- ── 2. updated_at trigger function ───────────────────────────────────────────
-- BEFORE UPDATE trigger that stamps updated_at = now() automatically.
-- Replaces manual updated_at maintenance in application code and RPCs.
-- All mutable tables gain a trigger; immutable tables (audit_log,
-- electronic_signatures) are intentionally excluded.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

-- Drop and recreate triggers to make this migration idempotent.
DROP TRIGGER IF EXISTS set_updated_at ON tenants;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON organizations;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON entitlements;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON org_entitlements;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON org_entitlements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON module_manifests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON module_manifests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
