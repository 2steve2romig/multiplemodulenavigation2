'use strict';

const { filterActiveEntitlements, filterEntitledManifests } = require('../../api/_lib/entitlements');

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
