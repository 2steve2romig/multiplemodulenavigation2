'use strict';

// GET /api/modules
// Returns module manifests for modules this tenant is entitled to.
// Entitlement filtering is server-side — the client only receives what it may see.
// Resolves effective entitlements = site entitlements UNION org entitlements (ADR-007).
// Each manifest is annotated with _source: 'org' | 'site' so the UI can
// show whether a module is included via corporate plan or a site subscription.
// TODO: auth-gate — verify JWT before trusting tenantId (see ADR-006).

const { resolveTenant } = require('./_middleware/resolveTenant');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { filterActiveEntitlements, filterEntitledManifests, unionEntitlements } = require('./_lib/entitlements');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => resolveTenant(req, res, resolve));
  if (res.writableEnded) return;

  const tenantId = req.tenantId;

  // Resolve org_id for this site (ADR-007: org/site hierarchy).
  const tenantResult = await supabase
    .from('tenants')
    .select('org_id')
    .eq('id', tenantId)
    .single();

  const orgId = tenantResult.data && tenantResult.data.org_id;

  // Fetch site entitlements, org entitlements (if site belongs to an org),
  // and module manifests in parallel.
  const queries = [
    supabase.from('entitlements').select('module_id, status, expires_at').eq('tenant_id', tenantId),
    supabase.from('module_manifests').select('id, manifest').eq('is_active', true),
  ];

  if (orgId) {
    queries.push(
      supabase.from('org_entitlements').select('module_id, status, expires_at').eq('org_id', orgId)
    );
  }

  const [entResult, manifestResult, orgEntResult] = await Promise.all(queries);

  if (entResult.error) return res.status(500).json({ error: 'Failed to load entitlements' });
  if (manifestResult.error) return res.status(500).json({ error: 'Failed to load manifests' });
  if (orgEntResult && orgEntResult.error) return res.status(500).json({ error: 'Failed to load org entitlements' });

  const siteRows = entResult.data || [];
  const orgRows = (orgEntResult && orgEntResult.data) || [];

  // Build source sets before union so we can annotate each module correctly.
  // _source = 'org' only when the module is exclusively from the org plan
  // (the site has no independent active entitlement for it).
  const siteActiveIds = new Set(filterActiveEntitlements(siteRows).map(e => e.module_id));
  const orgActiveIds  = new Set(filterActiveEntitlements(orgRows).map(e => e.module_id));

  // Union site + org entitlements; deduplicate by module_id (site row wins on conflict).
  const merged = unionEntitlements(siteRows, orgRows);
  const active = filterActiveEntitlements(merged);
  const entitledIds = active.map(e => e.module_id);

  const modules = filterEntitledManifests(manifestResult.data, entitledIds)
    .map(row => ({
      ...row.manifest,
      _source: (!siteActiveIds.has(row.id) && orgActiveIds.has(row.id)) ? 'org' : 'site',
    }));

  return res.status(200).json({ modules });
};
