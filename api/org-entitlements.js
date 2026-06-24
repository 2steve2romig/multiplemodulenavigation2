'use strict';

// POST /api/org-entitlements — grant org-level module access (admin only)
// Org entitlements are inherited by all child sites (ADR-007).
// TODO: auth-gate — verify JWT + admin role claim (see ADR-006).

const { requireAdminSecret } = require('./_middleware/requireAdminSecret');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { OrgEntitlementCreateSchema } = require('./_lib/validate');
const { requestContext } = require('./_lib/audit');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => requireAdminSecret(req, res, resolve));
  if (res.writableEnded) return;

  const parsed = OrgEntitlementCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  // ADR-008 Phase 2: both INSERTs (org_entitlement + audit_log) are atomic via RPC.
  const ctx = requestContext(req);
  const { data, error } = await supabase.rpc('create_org_entitlement_with_audit', {
    p_org_id:     parsed.data.org_id,
    p_module_id:  parsed.data.module_id,
    p_status:     parsed.data.status,
    p_expires_at: parsed.data.expires_at ?? null,
    p_actor_id:   'admin',
    p_ip_address: ctx.ip_address,
    p_user_agent: ctx.user_agent,
    p_request_id: ctx.request_id,
  });

  if (error) return res.status(500).json({ error: 'Failed to create org entitlement' });

  return res.status(201).json({ org_entitlement: data });
};
