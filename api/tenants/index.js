'use strict';

// POST /api/tenants — create a tenant (admin only)
// TODO: auth-gate — verify JWT + admin role claim (see ADR-006).

const { requireAdminSecret } = require('../_middleware/requireAdminSecret');
const { handleCors } = require('../_middleware/cors');
const { supabase } = require('../_lib/supabase');
const { TenantCreateSchema } = require('../_lib/validate');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => requireAdminSecret(req, res, resolve));
  if (res.writableEnded) return;

  const parsed = TenantCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { data, error } = await supabase
    .from('tenants')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create tenant' });
  return res.status(201).json({ tenant: data });
};
