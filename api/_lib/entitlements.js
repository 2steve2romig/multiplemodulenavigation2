'use strict';

// Pure entitlement logic — no Supabase dependency, fully unit-testable.

// Filters entitlement rows to those that are active and not expired.
// Enforces: status = 'active' AND (expires_at IS NULL OR expires_at > now).
// Per design-doc §b: query-time expiry filtering is mandatory on every entitlement access path.
function filterActiveEntitlements(rows, now = new Date()) {
  return rows.filter(row => {
    if (row.status !== 'active') return false;
    if (row.expires_at && new Date(row.expires_at) <= now) return false;
    return true;
  });
}

// Filters module_manifest rows to those whose id is in entitledModuleIds.
function filterEntitledManifests(manifests, entitledModuleIds) {
  const idSet = new Set(entitledModuleIds);
  return manifests.filter(m => idSet.has(m.id));
}

module.exports = { filterActiveEntitlements, filterEntitledManifests };
