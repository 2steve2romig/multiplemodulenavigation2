'use strict';

// PATCH /api/entitlements/:id — update status or expires_at (admin only)
// Atomic via RPC: UPDATE + audit_log INSERT in one transaction (ADR-008 Phase 2 pattern).
// TODO: auth-gate — verify JWT before trusting caller identity (see ADR-006).

const { requireAdminSecret } = require('../_middleware/requireAdminSecret');
const { handleCors } = require('../_middleware/cors');
const { supabase } = require('../_lib/supabase');
const { EntitlementPatchSchema } = require('../_lib/validate');
const { requestContext } = require('../_lib/audit');
const { z } = require('zod');

const UuidSchema = z.string().uuid();

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const { id } = req.query;
  if (!UuidSchema.safeParse(id).success) {
    return res.status(400).json({ error: 'Invalid entitlement id' });
  }

  if (req.method === 'PATCH') {
    await new Promise((resolve) => requireAdminSecret(req, res, resolve));
    if (res.writableEnded) return;

    const parsed = EntitlementPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const { status, expires_at } = parsed.data;
    const ctx = requestContext(req);

    // expires_at === null means "explicitly clear the expiry date" (make perpetual).
    // expires_at === undefined means "field not in request body — leave unchanged".
    const { data, error } = await supabase.rpc('update_entitlement_with_audit', {
      p_id:            id,
      p_status:        status ?? null,
      p_expires_at:    (expires_at !== undefined && expires_at !== null) ? expires_at : null,
      p_clear_expires: expires_at === null,
      p_actor_id:      'admin',
      p_ip_address:    ctx.ip_address,
      p_user_agent:    ctx.user_agent,
      p_request_id:    ctx.request_id,
    });

    if (error) return res.status(500).json({ error: 'Failed to update entitlement' });
    if (data === null) return res.status(404).json({ error: 'Entitlement not found' });

    return res.status(200).json({ entitlement: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
