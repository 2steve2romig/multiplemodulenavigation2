'use strict';

// Pre-auth guard for admin mutation routes — per ADR-006.
// Replaced by real auth middleware when an identity provider is wired.
// TODO: auth-gate — replace with JWT + role claim check ('admin' role required).

function requireAdminSecret(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || !process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { requireAdminSecret };
