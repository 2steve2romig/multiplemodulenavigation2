'use strict';

const { filterActiveEntitlements, filterEntitledManifests, unionEntitlements } = require('../../api/_lib/entitlements');

const NOW = new Date('2026-06-23T12:00:00Z');

// ─── filterActiveEntitlements ────────────────────────────────────────────────

describe('filterActiveEntitlements', () => {
  test('returns active entitlement with no expiry', () => {
    const rows = [{ module_id: 'atp', status: 'active', expires_at: null }];
    expect(filterActiveEntitlements(rows, NOW)).toEqual(rows);
  });

  test('returns active entitlement with future expiry', () => {
    const rows = [{ module_id: 'atp', status: 'active', expires_at: '2027-01-01T00:00:00Z' }];
    expect(filterActiveEntitlements(rows, NOW)).toEqual(rows);
  });

  test('excludes active entitlement with past expiry', () => {
    const rows = [{ module_id: 'atp', status: 'active', expires_at: '2025-01-01T00:00:00Z' }];
    expect(filterActiveEntitlements(rows, NOW)).toHaveLength(0);
  });

  test('excludes suspended entitlement', () => {
    const rows = [{ module_id: 'atp', status: 'suspended', expires_at: null }];
    expect(filterActiveEntitlements(rows, NOW)).toHaveLength(0);
  });

  test('excludes expired-status entitlement', () => {
    const rows = [{ module_id: 'atp', status: 'expired', expires_at: null }];
    expect(filterActiveEntitlements(rows, NOW)).toHaveLength(0);
  });

  test('filters mixed list correctly', () => {
    const rows = [
      { module_id: 'atp',  status: 'active',    expires_at: null },
      { module_id: 'map',  status: 'active',    expires_at: '2025-01-01T00:00:00Z' }, // past
      { module_id: 'plan', status: 'suspended', expires_at: null },
      { module_id: 'lab',  status: 'active',    expires_at: '2027-01-01T00:00:00Z' },
    ];
    const result = filterActiveEntitlements(rows, NOW);
    expect(result.map(r => r.module_id)).toEqual(['atp', 'lab']);
  });

  test('returns empty array for empty input', () => {
    expect(filterActiveEntitlements([], NOW)).toEqual([]);
  });
});

// ─── filterEntitledManifests ─────────────────────────────────────────────────

describe('filterEntitledManifests', () => {
  const manifests = [
    { id: 'atp',  manifest: { id: 'atp',  displayName: 'ATP IQ'  } },
    { id: 'map',  manifest: { id: 'map',  displayName: 'Map IQ'  } },
    { id: 'plan', manifest: { id: 'plan', displayName: 'Plan IQ' } },
  ];

  test('returns only manifests for entitled module IDs', () => {
    const entitledIds = ['atp', 'plan'];
    const result = filterEntitledManifests(manifests, entitledIds);
    expect(result.map(m => m.id)).toEqual(['atp', 'plan']);
  });

  test('returns empty array when no entitlements', () => {
    expect(filterEntitledManifests(manifests, [])).toEqual([]);
  });

  test('returns empty array when manifests list is empty', () => {
    expect(filterEntitledManifests([], ['atp'])).toEqual([]);
  });

  test('ignores entitled IDs with no matching manifest', () => {
    const result = filterEntitledManifests(manifests, ['atp', 'nonexistent']);
    expect(result.map(m => m.id)).toEqual(['atp']);
  });
});

// ─── unionEntitlements ───────────────────────────────────────────────────────

describe('unionEntitlements', () => {
  test('returns org entitlements when site has none', () => {
    const org = [{ module_id: 'atp', status: 'active', expires_at: null }];
    const result = unionEntitlements([], org);
    expect(result).toHaveLength(1);
    expect(result[0].module_id).toBe('atp');
  });

  test('returns site entitlements when org has none', () => {
    const site = [{ module_id: 'map', status: 'active', expires_at: null }];
    const result = unionEntitlements(site, []);
    expect(result).toHaveLength(1);
    expect(result[0].module_id).toBe('map');
  });

  test('unions distinct modules from both levels', () => {
    const site = [{ module_id: 'map',  status: 'active', expires_at: null }];
    const org  = [{ module_id: 'atp',  status: 'active', expires_at: null }];
    const result = unionEntitlements(site, org);
    const ids = result.map(r => r.module_id).sort();
    expect(ids).toEqual(['atp', 'map']);
  });

  test('site row wins on module_id conflict', () => {
    const site = [{ module_id: 'atp', status: 'suspended', expires_at: null }];
    const org  = [{ module_id: 'atp', status: 'active',    expires_at: null }];
    const result = unionEntitlements(site, org);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('suspended'); // site overrides org
  });

  test('returns empty array when both are empty', () => {
    expect(unionEntitlements([], [])).toEqual([]);
  });

  // H-2 (cold review 2026-06-24): expired site row must NOT block an active org grant.
  // A lapsed site entitlement is accidental; only deliberate suspension should suppress.
  test('org active row wins when site row status is expired', () => {
    const NOW = new Date('2026-06-24T12:00:00Z');
    const site = [{ module_id: 'atp', status: 'expired',  expires_at: null }];
    const org  = [{ module_id: 'atp', status: 'active',   expires_at: null }];
    const result = unionEntitlements(site, org, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('active'); // org row survives
  });

  test('org active row wins when site row has a past expires_at (time-lapsed)', () => {
    const NOW = new Date('2026-06-24T12:00:00Z');
    const site = [{ module_id: 'atp', status: 'active', expires_at: '2025-01-01T00:00:00Z' }];
    const org  = [{ module_id: 'atp', status: 'active', expires_at: null }];
    const result = unionEntitlements(site, org, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].expires_at).toBeNull(); // org row survives (no expiry)
  });

  test('site suspended row still wins over org active (deliberate action)', () => {
    const NOW = new Date('2026-06-24T12:00:00Z');
    const site = [{ module_id: 'atp', status: 'suspended', expires_at: null }];
    const org  = [{ module_id: 'atp', status: 'active',    expires_at: null }];
    const result = unionEntitlements(site, org, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('suspended'); // intentional suppression wins
  });

  test('deduplicates — no duplicate module_ids in result', () => {
    const site = [
      { module_id: 'atp', status: 'active', expires_at: null },
      { module_id: 'map', status: 'active', expires_at: null },
    ];
    const org = [
      { module_id: 'atp',  status: 'active', expires_at: null },
      { module_id: 'plan', status: 'active', expires_at: null },
    ];
    const result = unionEntitlements(site, org);
    const ids = result.map(r => r.module_id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    expect(ids.sort()).toEqual(['atp', 'map', 'plan']);
  });
});
