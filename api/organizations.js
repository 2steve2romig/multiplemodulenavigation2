'use strict';

// POST /api/organizations — create an organization (admin only)
// Organizations are the parent entity in the org/site hierarchy (ADR-007).
// TODO: auth-gate — verify JWT + admin role claim (see ADR-006).

const { requireAdminSecret } = require('./_middleware/requireAdminSecret');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { OrgCreateSchema } = require('./_lib/validate');
const { writeAuditLog, requestContext } = require('./_lib/audit');

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => requireAdminSecret(req, res, resolve));
  if (res.writableEnded) return;

  const parsed = OrgCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create organization' });

  await writeAuditLog({
    event_type: 'organization.created',
    actor_type: 'admin',
    org_id: data.id,
    resource_type: 'organization',
    resource_id: data.id,
    after_state: data,
    ...requestContext(req),
  });

  return res.status(201).json({ organization: data });
};
