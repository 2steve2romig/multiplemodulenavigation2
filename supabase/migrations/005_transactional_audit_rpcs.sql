-- 005_transactional_audit_rpcs.sql
-- ADR-008 Phase 2: fail-closed audit writes.
--
-- Each function wraps one regulated mutation + one audit_log INSERT in a
-- single PostgreSQL transaction. If either INSERT fails, the whole
-- transaction rolls back — no committed business record without an audit row.
--
-- Replaces the fail-open pattern (writeAuditLog called after primary INSERT):
--   OLD: supabase.from('entitlements').insert(data)  -- may succeed
--        writeAuditLog(event)                         -- may silently fail
--
--   NEW: supabase.rpc('create_entitlement_with_audit', params)
--        -- both INSERTs are atomic; either both commit or both roll back
--
-- Called from Node.js routes via the service role key. Service role bypasses
-- RLS on all tables. The audit_log immutability trigger (004_audit_hardening)
-- fires on UPDATE/DELETE only — INSERTs proceed normally.
--
-- Run in Supabase SQL editor or via supabase db push.

-- ── 1. create_entitlement_with_audit ────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_entitlement_with_audit(
  p_tenant_id   uuid,
  p_module_id   text,
  p_status      text,
  p_expires_at  timestamptz,
  p_actor_id    text,
  p_ip_address  text,
  p_user_agent  text,
  p_request_id  text
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row entitlements;
BEGIN
  INSERT INTO entitlements (tenant_id, module_id, status, expires_at)
    VALUES (p_tenant_id, p_module_id, p_status, p_expires_at)
    RETURNING * INTO v_row;

  INSERT INTO audit_log (
    event_type, actor_type, actor_id,
    tenant_id, resource_type, resource_id, after_state,
    ip_address, user_agent, request_id
  ) VALUES (
    'entitlement.created', 'admin', p_actor_id,
    v_row.tenant_id, 'entitlement', v_row.id::text, to_jsonb(v_row),
    p_ip_address, p_user_agent, p_request_id
  );

  RETURN to_jsonb(v_row);
END;
$$;

-- ── 2. create_org_entitlement_with_audit ────────────────────────────────────

CREATE OR REPLACE FUNCTION create_org_entitlement_with_audit(
  p_org_id      uuid,
  p_module_id   text,
  p_status      text,
  p_expires_at  timestamptz,
  p_actor_id    text,
  p_ip_address  text,
  p_user_agent  text,
  p_request_id  text
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row org_entitlements;
BEGIN
  INSERT INTO org_entitlements (org_id, module_id, status, expires_at)
    VALUES (p_org_id, p_module_id, p_status, p_expires_at)
    RETURNING * INTO v_row;

  INSERT INTO audit_log (
    event_type, actor_type, actor_id,
    org_id, resource_type, resource_id, after_state,
    ip_address, user_agent, request_id
  ) VALUES (
    'org_entitlement.created', 'admin', p_actor_id,
    v_row.org_id, 'org_entitlement', v_row.id::text, to_jsonb(v_row),
    p_ip_address, p_user_agent, p_request_id
  );

  RETURN to_jsonb(v_row);
END;
$$;

-- ── 3. create_tenant_with_audit ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_tenant_with_audit(
  p_name        text,
  p_region      text,
  p_actor_id    text,
  p_ip_address  text,
  p_user_agent  text,
  p_request_id  text
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row tenants;
BEGIN
  INSERT INTO tenants (name, region)
    VALUES (p_name, p_region)
    RETURNING * INTO v_row;

  INSERT INTO audit_log (
    event_type, actor_type, actor_id,
    tenant_id, resource_type, resource_id, after_state,
    ip_address, user_agent, request_id
  ) VALUES (
    'tenant.created', 'admin', p_actor_id,
    v_row.id, 'tenant', v_row.id::text, to_jsonb(v_row),
    p_ip_address, p_user_agent, p_request_id
  );

  RETURN to_jsonb(v_row);
END;
$$;

-- ── 4. create_organization_with_audit ───────────────────────────────────────

CREATE OR REPLACE FUNCTION create_organization_with_audit(
  p_name        text,
  p_region      text,
  p_actor_id    text,
  p_ip_address  text,
  p_user_agent  text,
  p_request_id  text
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row organizations;
BEGIN
  INSERT INTO organizations (name, region)
    VALUES (p_name, p_region)
    RETURNING * INTO v_row;

  INSERT INTO audit_log (
    event_type, actor_type, actor_id,
    org_id, resource_type, resource_id, after_state,
    ip_address, user_agent, request_id
  ) VALUES (
    'organization.created', 'admin', p_actor_id,
    v_row.id, 'organization', v_row.id::text, to_jsonb(v_row),
    p_ip_address, p_user_agent, p_request_id
  );

  RETURN to_jsonb(v_row);
END;
$$;
