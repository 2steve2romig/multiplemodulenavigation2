'use strict';

// GET  /api/tenants/:id — fetch a single tenant
// PATCH /api/tenants/:id — assign org_id to a site (admin only, ADR-007)
// TODO: auth-gate — verify JWT before trusting caller identity (see ADR-006).

const { resolveTenant } = require('../_middleware/resolveTenant');
const { requireAdminSecret } = require('../_middleware/requireAdminSecret');
const { handleCors } = require('../_middleware/cors');
const { supabase } = require('../_lib/supabase');
const { TenantPatchSchema } = require('../_lib/validate');
const { requestContext } = require('../_lib/audit');
const { z } = require('zod');

const UuidSchema = z.string().uuid();

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;

  const { id } = req.query;
  if (!UuidSchema.safeParse(id).success) {
    return res.status(400).json({ error: 'Invalid tenant id' });
  }

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    await new Promise((resolve) => resolveTenant(req, res, resolve));
    if (res.writableEnded) return;

    if (req.tenantId !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, region, org_id, created_at')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Tenant not found' });
    return res.status(200).json({ tenant: data });
  }

  // ── PATCH ─────────────────────────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    await new Promise((resolve) => requireAdminSecret(req, res, resolve));
    if (res.writableEnded) return;

    const parsed = TenantPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    // ADR-008 Phase 2: atomic UPDATE + audit_log INSERT via RPC (fail-closed).
    const ctx = requestContext(req);
    const { data, error } = await supabase.rpc('update_tenant_org_with_audit', {
      p_id:         id,
      p_org_id:     parsed.data.org_id,
      p_actor_id:   'admin',
      p_ip_address: ctx.ip_address,
      p_user_agent: ctx.user_agent,
      p_request_id: ctx.request_id,
    });

    if (error) return res.status(500).json({ error: 'Failed to update tenant' });
    if (data === null) return res.status(404).json({ error: 'Tenant not found' });

    return res.status(200).json({ tenant: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
