'use strict';

// GET /api/tenants/:id — fetch a single tenant
// TODO: auth-gate — verify JWT; confirm caller is a member of this tenant (see ADR-006).

const { resolveTenant } = require('../_middleware/resolveTenant');
const { handleCors } = require('../_middleware/cors');
const { supabase } = require('../_lib/supabase');
const { z } = require('zod');

const UuidSchema = z.string().uuid();

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => resolveTenant(req, res, resolve));
  if (res.writableEnded) return;

  const { id } = req.query;
  if (!UuidSchema.safeParse(id).success) {
    return res.status(400).json({ error: 'Invalid tenant id' });
  }

  // Confirm the caller's tenantId matches the requested id.
  // TODO: auth-gate — when auth is wired, also verify membership via JWT claims.
  if (req.tenantId !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, region, created_at')
    .eq('id', id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Tenant not found' });
  return res.status(200).json({ tenant: data });
};
