'use strict';

// POST /api/organizations — create an organization (admin only)
// Organizations are the parent entity in the org/site hierarchy (ADR-007).
// TODO: auth-gate — verify JWT + admin role claim (see ADR-006).

const { requireAdminSecret } = require('./_middleware/requireAdminSecret');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { OrgCreateSchema } = require('./_lib/validate');
const { requestContext } = require('./_lib/audit');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => requireAdminSecret(req, res, resolve));
  if (res.writableEnded) return;

  const parsed = OrgCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  // ADR-008 Phase 2: both INSERTs (organization + audit_log) are atomic via RPC.
  const ctx = requestContext(req);
  const { data, error } = await supabase.rpc('create_organization_with_audit', {
    p_name:       parsed.data.name,
    p_region:     parsed.data.region,
    p_actor_id:   'admin',
    p_ip_address: ctx.ip_address,
    p_user_agent: ctx.user_agent,
    p_request_id: ctx.request_id,
  });

  if (error) return res.status(500).json({ error: 'Failed to create organization' });

  return res.status(201).json({ organization: data });
};
