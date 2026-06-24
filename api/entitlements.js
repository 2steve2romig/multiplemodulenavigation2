'use strict';

// GET /api/entitlements   — read active entitlements for a tenant
// POST /api/entitlements  — create an entitlement (admin only)
// TODO: auth-gate — verify JWT before trusting tenantId (see ADR-006).

const { resolveTenant } = require('./_middleware/resolveTenant');
const { requireAdminSecret } = require('./_middleware/requireAdminSecret');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { filterActiveEntitlements } = require('./_lib/entitlements');
const { EntitlementCreateSchema } = require('./_lib/validate');
const { requestContext } = require('./_lib/audit');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  if (req.method === 'GET') {
    await new Promise((resolve) => resolveTenant(req, res, resolve));
    if (res.writableEnded) return;

    const { data, error } = await supabase
      .from('entitlements')
      .select('id, tenant_id, module_id, status, expires_at, created_at')
      .eq('tenant_id', req.tenantId);

    if (error) return res.status(500).json({ error: 'Failed to load entitlements' });

    const entitlements = filterActiveEntitlements(data);
    return res.status(200).json({ entitlements });
  }

  if (req.method === 'POST') {
    await new Promise((resolve) => requireAdminSecret(req, res, resolve));
    if (res.writableEnded) return;

    const parsed = EntitlementCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    // ADR-008 Phase 2: both INSERTs (entitlement + audit_log) are atomic via RPC.
    const ctx = requestContext(req);
    const { data, error } = await supabase.rpc('create_entitlement_with_audit', {
      p_tenant_id:  parsed.data.tenant_id,
      p_module_id:  parsed.data.module_id,
      p_status:     parsed.data.status,
      p_expires_at: parsed.data.expires_at ?? null,
      p_actor_id:   'admin',
      p_ip_address: ctx.ip_address,
      p_user_agent: ctx.user_agent,
      p_request_id: ctx.request_id,
    });

    if (error) return res.status(500).json({ error: 'Failed to create entitlement' });

    return res.status(201).json({ entitlement: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
