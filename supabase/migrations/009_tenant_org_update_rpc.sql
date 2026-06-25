-- 009_tenant_org_update_rpc.sql
-- ADR-008 Phase 2 extension: PATCH /api/tenants/:id was using the fail-open
-- writeAuditLog() helper. This migration adds a transactional RPC so the
-- org_id assignment and its audit record commit or roll back together.
--
-- Regression caught by end-to-end review 2026-06-25.

CREATE OR REPLACE FUNCTION update_tenant_org_with_audit(
  p_id          uuid,
  p_org_id      uuid,
  p_actor_id    text DEFAULT 'admin',
  p_ip_address  text DEFAULT NULL,
  p_user_agent  text DEFAULT NULL,
  p_request_id  text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_before tenants;
  v_after  tenants;
BEGIN
  SELECT * INTO v_before FROM tenants WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE tenants
  SET org_id = p_org_id
  WHERE id = p_id
  RETURNING * INTO v_after;

  INSERT INTO audit_log (
    event_type, actor_type, actor_id, tenant_id, resource_type, resource_id,
    before_state, after_state, ip_address, user_agent, request_id
  ) VALUES (
    'tenant.org_assigned', 'admin', p_actor_id, v_after.id,
    'tenant', v_after.id::text,
    to_jsonb(v_before), to_jsonb(v_after),
    p_ip_address, p_user_agent, p_request_id
  );

  RETURN to_jsonb(v_after);
END; $$;
