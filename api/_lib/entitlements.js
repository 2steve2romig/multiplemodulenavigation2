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

// Unions site-level and org-level entitlement rows by module_id.
//
// Site rows override org rows when the site row reflects a deliberate action:
//   - active (site has its own subscription)
//   - suspended (site is intentionally pausing a corporate module)
//
// An expired site row (status='expired' OR expires_at in the past) falls through
// to the org row. Accidental lapse of a site entitlement must not silently block
// a module the corporate org has actively granted.
//
// Decision recorded in ADR-007.
function unionEntitlements(siteRows, orgRows, now = new Date()) {
  const map = new Map();
  for (const row of orgRows) map.set(row.module_id, row);
  for (const row of siteRows) {
    const timeExpired = row.expires_at && new Date(row.expires_at) <= now;
    if (row.status !== 'expired' && !timeExpired) {
      map.set(row.module_id, row); // deliberate site state wins
    }
    // If site row is expired (any flavour), org row stays in the map
  }
  return Array.from(map.values());
}

module.exports = { filterActiveEntitlements, filterEntitledManifests, unionEntitlements };
