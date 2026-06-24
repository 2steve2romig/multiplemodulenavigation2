'use strict';

// POST /api/tenants — create a tenant (admin only)
// TODO: auth-gate — verify JWT + admin role claim (see ADR-006).

const { requireAdminSecret } = require('../_middleware/requireAdminSecret');
const { handleCors } = require('../_middleware/cors');
const { supabase } = require('../_lib/supabase');
const { TenantCreateSchema } = require('../_lib/validate');
const { requestContext } = require('../_lib/audit');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => requireAdminSecret(req, res, resolve));
  if (res.writableEnded) return;

  const parsed = TenantCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  // ADR-008 Phase 2: both INSERTs (tenant + audit_log) are atomic via RPC.
  const ctx = requestContext(req);
  const { data, error } = await supabase.rpc('create_tenant_with_audit', {
    p_name:       parsed.data.name,
    p_region:     parsed.data.region,
    p_actor_id:   'admin',
    p_ip_address: ctx.ip_address,
    p_user_agent: ctx.user_agent,
    p_request_id: ctx.request_id,
  });

  if (error) return res.status(500).json({ error: 'Failed to create tenant' });

  return res.status(201).json({ tenant: data });
};
