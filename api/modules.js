'use strict';

// GET /api/modules
// Returns module manifests for modules this tenant is entitled to.
// Entitlement filtering is server-side — the client only receives what it may see.
// TODO: auth-gate — verify JWT before trusting tenantId (see ADR-006).

const { resolveTenant } = require('./_middleware/resolveTenant');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { filterActiveEntitlements, filterEntitledManifests } = require('./_lib/entitlements');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => resolveTenant(req, res, resolve));
  if (res.writableEnded) return;

  const tenantId = req.tenantId;

  const [entResult, manifestResult] = await Promise.all([
    supabase
      .from('entitlements')
      .select('module_id, status, expires_at')
      .eq('tenant_id', tenantId),
    supabase
      .from('module_manifests')
      .select('id, manifest')
      .eq('is_active', true),
  ]);

  if (entResult.error) return res.status(500).json({ error: 'Failed to load entitlements' });
  if (manifestResult.error) return res.status(500).json({ error: 'Failed to load manifests' });

  const active = filterActiveEntitlements(entResult.data);
  const entitledIds = active.map(e => e.module_id);
  const modules = filterEntitledManifests(manifestResult.data, entitledIds)
    .map(row => row.manifest);

  return res.status(200).json({ modules });
};
