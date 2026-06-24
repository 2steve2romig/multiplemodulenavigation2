'use strict';

// ADR-008: 21 CFR Part 11 audit trail helper.
//
// writeAuditLog() is intentionally fail-open: a failed audit write logs a
// console.error but never throws. The primary operation must not be blocked
// by an audit failure — but failures must be loud so they're caught in ops.

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

/**
 * Extract request context fields from an Express-style request object.
 * Produces ip_address, user_agent, and a synthetic request_id.
 */
function requestContext(req) {
  return {
    ip_address: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null),
    user_agent: (req.headers['user-agent'] || null),
    request_id: (req.headers['x-request-id'] || null),
  };
}

module.exports = { writeAuditLog, requestContext };
