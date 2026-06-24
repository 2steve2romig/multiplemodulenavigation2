-- 006_restrict_and_softdelete.sql
-- Architecture review findings 2026-06-24 (ERD-3, ERD-4, ERD-5).
--
-- 1. audit_log FKs: ON DELETE SET NULL → ON DELETE RESTRICT
-- 2. Soft-delete columns on tenants and organizations
-- 3. entitlements.module_id + org_entitlements.module_id → module_manifests FK (NOT VALID)
-- 4. update_entitlement_with_audit RPC (PATCH /api/entitlements/:id)

-- ── 1. audit_log FK: RESTRICT ─────────────────────────────────────────────────
-- Prevents hard-deleting a tenant or org that still has audit records.
-- ALCOA "Attributable": if the referenced entity were deleted, its audit records
-- would lose traceability — violating 21 CFR §11.10(b).
-- Soft-delete (section 2 below) is the only compliant deletion path.

ALTER TABLE audit_log
  DROP CONSTRAINT IF EXISTS audit_log_tenant_id_fkey;
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE audit_log
  DROP CONSTRAINT IF EXISTS audit_log_org_id_fkey;
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE RESTRICT;

-- ── 2. Soft-delete columns ────────────────────────────────────────────────────
-- Soft-delete is the only compliant path for regulated entities with audit records.
-- FDA food safety records: 2-year minimum retention (21 CFR Part 117.305).
-- Active record query pattern: WHERE deleted_at IS NULL

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── 3. Module manifest FK (ghost entitlement prevention) ─────────────────────
-- Prevents entitlements referencing modules that do not exist in module_manifests.
-- NOT VALID: skips validation of existing rows.
-- After backfilling module_manifests for all existing entitlement module_ids, run:
--   ALTER TABLE entitlements VALIDATE CONSTRAINT entitlements_module_id_fkey;
--   ALTER TABLE org_entitlements VALIDATE CONSTRAINT org_entitlements_module_id_fkey;

ALTER TABLE entitlements
  ADD CONSTRAINT entitlements_module_id_fkey
  FOREIGN KEY (module_id) REFERENCES module_manifests(id) ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE org_entitlements
  ADD CONSTRAINT org_entitlements_module_id_fkey
  FOREIGN KEY (module_id) REFERENCES module_manifests(id) ON DELETE RESTRICT
  NOT VALID;

-- ── 4. update_entitlement_with_audit RPC ─────────────────────────────────────
-- PATCH /api/entitlements/:id: atomic UPDATE + audit_log INSERT (fail-closed).
-- Captures before_state for ALCOA "Original" requirement.
-- Returns the updated row as jsonb, or NULL if the id is not found (→ 404).
--
-- p_clear_expires = TRUE sets expires_at to NULL (makes the entitlement perpetual).
-- When p_clear_expires = FALSE and p_expires_at = NULL, expires_at is unchanged.
-- When p_status = NULL, status is unchanged (COALESCE preserves current value).

CREATE OR REPLACE FUNCTION update_entitlement_with_audit(
  p_id             uuid,
  p_status         text         DEFAULT NULL,
  p_expires_at     timestamptz  DEFAULT NULL,
  p_clear_expires  boolean      DEFAULT false,
  p_actor_id       text         DEFAULT 'admin',
  p_ip_address     text         DEFAULT NULL,
  p_user_agent     text         DEFAULT NULL,
  p_request_id     text         DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_before entitlements;
  v_after  entitlements;
BEGIN
  SELECT * INTO v_before FROM entitlements WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE entitlements
  SET
    status     = COALESCE(p_status,     status),
    expires_at = CASE
                   WHEN p_clear_expires THEN NULL
                   ELSE COALESCE(p_expires_at, expires_at)
                 END,
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO audit_log (
    event_type, actor_type, actor_id, tenant_id, resource_type, resource_id,
    before_state, after_state, ip_address, user_agent, request_id
  ) VALUES (
    'entitlement.updated', 'admin', p_actor_id, v_after.tenant_id,
    'entitlement', v_after.id::text,
    to_jsonb(v_before), to_jsonb(v_after),
    p_ip_address, p_user_agent, p_request_id
  );

  RETURN to_jsonb(v_after);
END; $$;
