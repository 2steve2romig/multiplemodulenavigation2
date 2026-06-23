'use strict';

// Centralized tenantId extraction — per ADR-006.
// extractTenantId is the single function replaced when auth is wired.
// No route handler ever reads tenantId from req.query, req.body, or req.headers directly.

async function extractTenantId(req) {
  // TODO: auth-gate — when auth is wired, replace this entire function body:
  //   const token = req.headers['authorization']?.replace('Bearer ', '');
  //   const { data: { user } } = await supabase.auth.getUser(token);
  //   return user?.app_metadata?.tenant_id ?? null;

  // DEV / PRE-AUTH only — trust X-Tenant-ID header. Never in production.
  if (process.env.NODE_ENV !== 'production') {
    const devHeader = req.headers['x-tenant-id'];
    if (devHeader) return devHeader;
  }

  return null;
}

async function resolveTenant(req, res, next) {
  const tenantId = await extractTenantId(req);
  if (!tenantId) {
    return res.status(400).json({ error: 'tenantId required' });
  }
  req.tenantId = tenantId;
  next();
}

module.exports = { resolveTenant, extractTenantId };
