-- 004_audit_hardening.sql
-- Addresses cold-review findings 2026-06-24.
--
-- H-1: PostgreSQL immutability trigger on audit_log — blocks UPDATE and DELETE
--      for ALL roles including the service role (which bypasses RLS).
--      RLS alone is insufficient because the service role key used by all Node.js
--      routes can call .update()/.delete() without restriction.
--
-- M-2: RLS policies for organizations and org_entitlements — the 002 migration
--      enabled RLS but omitted CREATE POLICY statements.
--
-- L-1: Composite index on (resource_type, resource_id) for per-resource audit queries.
--      A 21 CFR Part 11 audit review routinely queries "show me everything that
--      happened to entitlement UUID X" — without this index the query scans the
--      full audit_log table.
--
-- Run in Supabase SQL editor or via supabase db push.

-- ── H-1: audit_log immutability trigger ─────────────────────────────────────
-- This is the only mechanism that prevents the service role from mutating rows.
-- RLS is bypassed by the service role; a trigger fires regardless of role.

CREATE OR REPLACE FUNCTION audit_log_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows are immutable — 21 CFR Part 11 §11.10(b)';
END;
$$;

CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();

-- ── M-2: RLS policies for organizations ─────────────────────────────────────
-- organizations is an admin-only table. Anon and authenticated roles have no
-- legitimate reason to read org rows directly — they access org-level data
-- through the API (which uses the service role and applies its own filtering).
-- Service role bypasses RLS so API routes continue to work.

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- No SELECT, INSERT, UPDATE, or DELETE policies for anon or authenticated.
-- Effective result: direct client queries are denied; service role is unrestricted.

-- ── M-2: RLS policies for org_entitlements ──────────────────────────────────
-- org_entitlements are accessed server-side only (the /api/modules route unions
-- them with site entitlements using the service role). Direct client reads are
-- not needed and not permitted.

-- Ensure RLS is enabled (may already be set from migration 002).
ALTER TABLE org_entitlements ENABLE ROW LEVEL SECURITY;

-- No policies — all direct client access denied.

-- ── L-1: resource_id index on audit_log ─────────────────────────────────────
-- Supports per-resource audit queries: "show all changes to entitlement UUID X".
-- (resource_type, resource_id) composite covers queries that filter by both.

CREATE INDEX IF NOT EXISTS audit_log_resource_idx
  ON audit_log (resource_type, resource_id);
