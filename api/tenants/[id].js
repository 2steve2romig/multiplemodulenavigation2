'use strict';

// GET  /api/tenants/:id — fetch a single tenant
// PATCH /api/tenants/:id — assign org_id to a site (admin only, ADR-007)
// TODO: auth-gate — verify JWT before trusting caller identity (see ADR-006).

const { resolveTenant } = require('../_middleware/resolveTenant');
const { requireAdminSecret } = require('../_middleware/requireAdminSecret');
const { handleCors } = require('../_middleware/cors');
const { supabase } = require('../_lib/supabase');
const { TenantPatchSchema } = require('../_lib/validate');
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

    const { data, error } = await supabase
      .from('tenants')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Tenant not found' });
    return res.status(200).json({ tenant: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
