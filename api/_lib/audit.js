'use strict';

// ADR-008: 21 CFR Part 11 audit trail helper.
//
// writeAuditLog() is NO LONGER USED for regulated mutations.
// ADR-008 Phase 2 (migration 005) wraps each regulated mutation + its
// audit_log INSERT in a single PostgreSQL RPC transaction (fail-closed).
// See api/entitlements.js, api/organizations.js, api/tenants/index.js,
// api/org-entitlements.js — all now call supabase.rpc() directly.
//
// writeAuditLog() is retained here for non-regulated read-path logging.
// If no such paths exist, this file can be removed when auth is wired.

const { supabase } = require('./supabase');

/**
 * @param {object} event
 * @param {string}  event.event_type       e.g. 'entitlement.created'
 * @param {string}  event.actor_type       'user' | 'system' | 'admin'
 * @param {string}  [event.actor_id]       user id or 'system'
 * @param {string}  [event.tenant_id]      site UUID (null for org-level events)
 * @param {string}  [event.org_id]         org UUID (null for site-level events)
 * @param {string}  event.resource_type    e.g. 'entitlement'
 * @param {string}  event.resource_id      id of the affected row
 * @param {object}  [event.before_state]   row before change (null for creates)
 * @param {object}  [event.after_state]    row after change (null for deletes)
 * @param {string}  [event.ip_address]
 * @param {string}  [event.user_agent]
 * @param {string}  [event.request_id]
 */
async function writeAuditLog(event) {
  const {
    event_type,
    actor_type,
    actor_id = 'system',
    tenant_id = null,
    org_id = null,
    resource_type,
    resource_id,
    before_state = null,
    after_state = null,
    ip_address = null,
    user_agent = null,
    request_id = null,
  } = event;

  const { error } = await supabase.from('audit_log').insert({
    event_type,
    actor_type,
    actor_id,
    tenant_id,
    org_id,
    resource_type,
    resource_id,
    before_state,
    after_state,
    ip_address,
    user_agent,
    request_id,
  });

  if (error) {
    // Fail-open: log but do not throw. Alert on this in production observability.
    console.error('[audit] WRITE FAILED', { event_type, resource_type, resource_id, error });
  }
}

// Basic IPv4/IPv6 sanity check — rejects injected strings.
const IP_RE = /^[\d.:a-fA-F]+$/;

/**
 * Extract request context fields from an Express-style request object.
 *
 * ip_address: On Vercel, X-Forwarded-For is a comma-separated list where
 * Vercel appends the real client IP last. We take the last entry so that
 * a spoofed first entry (client-controlled) is ignored.
 */
function requestContext(req) {
  let ip_address = null;
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const parts = xff.split(',').map(s => s.trim());
    const last = parts[parts.length - 1];
    if (IP_RE.test(last)) ip_address = last;
  } else if (req.socket && req.socket.remoteAddress) {
    const addr = req.socket.remoteAddress;
    if (IP_RE.test(addr)) ip_address = addr;
  }
  return {
    ip_address,
    user_agent: (req.headers['user-agent'] || null),
    request_id: (req.headers['x-request-id'] || null),
  };
}

module.exports = { writeAuditLog, requestContext };
