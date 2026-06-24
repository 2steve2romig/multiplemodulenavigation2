'use strict';

// Explicit CORS allowlist — per design-doc §f.
// Never use Access-Control-Allow-Origin: * on any route carrying tenant data.

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function applyCors(req, res) {
  const origin = req.headers['origin'];
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    // Only advertise custom headers to allowed origins — prevents fingerprinting
    // by disallowed origins via OPTIONS preflight.
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID, X-Admin-Secret');
  }
}

function handleCors(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // handled
  }
  return false;
}

module.exports = { handleCors, applyCors };
