'use strict';

// GET /api/audit-log — paginated audit log (admin only, ADR-008)
//
// Query params:
//   tenant_id   filter by site UUID
//   org_id      filter by org UUID
//   event_type  filter by event type string
//   from        ISO timestamp lower bound (occurred_at >= from)
//   to          ISO timestamp upper bound (occurred_at <= to)
//   page        1-based page number (default: 1)
//   limit       records per page (default: 50, max: 200)
//
// TODO: auth-gate — requires admin role when auth is wired (ADR-006).

const { requireAdminSecret } = require('./_middleware/requireAdminSecret');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { z } = require('zod');

const QuerySchema = z.object({
  tenant_id:  z.string().uuid().optional(),
  org_id:     z.string().uuid().optional(),
  event_type: z.string().min(1).optional(),
  from:       z.string().datetime().optional(),
  to:         z.string().datetime().optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(200).default(50),
});

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => requireAdminSecret(req, res, resolve));
  if (res.writableEnded) return;

  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
  }

  const { tenant_id, org_id, event_type, from, to, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (tenant_id)  query = query.eq('tenant_id', tenant_id);
  if (org_id)     query = query.eq('org_id', org_id);
  if (event_type) query = query.eq('event_type', event_type);
  if (from)       query = query.gte('occurred_at', from);
  if (to)         query = query.lte('occurred_at', to);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: 'Failed to load audit log' });

  return res.status(200).json({
    audit_log: data,
    total: count,
    page,
    limit,
  });
};
