'use strict';

// POST /api/org-entitlements — grant org-level module access (admin only)
// Org entitlements are inherited by all child sites (ADR-007).
// TODO: auth-gate — verify JWT + admin role claim (see ADR-006).

const { requireAdminSecret } = require('./_middleware/requireAdminSecret');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { OrgEntitlementCreateSchema } = require('./_lib/validate');
const { writeAuditLog, requestContext } = require('./_lib/audit');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => requireAdminSecret(req, res, resolve));
  if (res.writableEnded) return;

  const parsed = OrgEntitlementCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { data, error } = await supabase
    .from('org_entitlements')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create org entitlement' });

  await writeAuditLog({
    event_type: 'org_entitlement.created',
    actor_type: 'admin',
    org_id: data.org_id,
    resource_type: 'org_entitlement',
    resource_id: data.id,
    after_state: data,
    ...requestContext(req),
  });

  return res.status(201).json({ org_entitlement: data });
};
