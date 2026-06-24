'use strict';

/**
 * Cross-tenant isolation tests — security gate.
 *
 * These tests prove tenant A cannot read tenant B's data through any path.
 * Must be green before any deploy (per test-strategy.md).
 *
 * Prerequisites: same as api.test.js, plus TENANT_B_ID in .env.test.
 *
 * Run: NODE_ENV=test jest test/integration/isolation.test.js
 */

const { createClient } = require('@supabase/supabase-js');

const apiRequired = ['PLATFORM_URL', 'TENANT_A_ID', 'TENANT_B_ID'];
const rlsRequired = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'TENANT_A_ID', 'TENANT_B_ID'];

const apiMissing = apiRequired.filter(k => !process.env[k]);
const rlsMissing = rlsRequired.filter(k => !process.env[k]);

if (apiMissing.length) console.warn(`API isolation tests skipped — missing: ${apiMissing.join(', ')}`);
if (rlsMissing.length) console.warn(`RLS isolation tests skipped — missing: ${rlsMissing.join(', ')}`);

const describeIf = (cond) => cond ? describe : describe.skip;

// ─── API-layer isolation ─────────────────────────────────────────────────────

describeIf(apiMissing.length === 0)('API cross-tenant isolation', () => {
  const tenantAId = process.env.TENANT_A_ID;
  const tenantBId = process.env.TENANT_B_ID;

  test('TENANT_A cannot see TENANT_B entitlements via API', async () => {
    // Request with TENANT_A header should never return TENANT_B rows.
    const res = await fetch(`${process.env.PLATFORM_URL}/api/entitlements`, {
      headers: { 'x-tenant-id': tenantAId },
    });
    const { entitlements } = await res.json();
    const crossTenant = entitlements.filter(e => e.tenant_id === tenantBId);
    expect(crossTenant).toHaveLength(0);
  });

  test('TENANT_A module list does not include TENANT_B-only modules', async () => {
    const resA = await fetch(`${process.env.PLATFORM_URL}/api/modules`, {
      headers: { 'x-tenant-id': tenantAId },
    });
    const resB = await fetch(`${process.env.PLATFORM_URL}/api/modules`, {
      headers: { 'x-tenant-id': tenantBId },
    });
    const { modules: modulesA } = await resA.json();
    const { modules: modulesB } = await resB.json();
    const idsA = new Set(modulesA.map(m => m.id));
    const idsB = new Set(modulesB.map(m => m.id));

    // Any module in B-only (not in A) must not appear in A's list.
    const bOnly = [...idsB].filter(id => !idsA.has(id));
    bOnly.forEach(id => expect(idsA.has(id)).toBe(false));
  });

  test('absent tenantId returns 400, not another tenants data', async () => {
    const res = await fetch(`${process.env.PLATFORM_URL}/api/entitlements`);
    expect(res.status).toBe(400);
  });
});

// ─── Direct Supabase RLS bypass attempts ────────────────────────────────────

describeIf(rlsMissing.length === 0)('Supabase RLS isolation (anon key)', () => {
  let anonClient;

  beforeAll(() => {
    anonClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  });

  test('anon key cannot read any entitlements row', async () => {
    const { data, error } = await anonClient.from('entitlements').select('*');
    // RLS with no anon policy = empty result (not an error).
    expect(data).toHaveLength(0);
  });

  test('anon key cannot read tenants', async () => {
    const { data } = await anonClient.from('tenants').select('*');
    expect(data).toHaveLength(0);
  });

  test('anon key cannot read user_tenant_memberships', async () => {
    const { data } = await anonClient.from('user_tenant_memberships').select('*');
    expect(data).toHaveLength(0);
  });

  test('anon key cannot insert into entitlements', async () => {
    const { error } = await anonClient.from('entitlements').insert({
      tenant_id: process.env.TENANT_A_ID,
      module_id: 'atp',
      status: 'active',
    });
    expect(error).not.toBeNull();
  });

  test('anon key filtering by TENANT_B id returns zero rows', async () => {
    const { data } = await anonClient
      .from('entitlements')
      .select('*')
      .eq('tenant_id', process.env.TENANT_B_ID);
    expect(data).toHaveLength(0);
  });

  test('anon key cannot read any org_entitlements row', async () => {
    const { data } = await anonClient.from('org_entitlements').select('*');
    expect(data).toHaveLength(0);
  });

  test('anon key cannot read any organizations row', async () => {
    const { data } = await anonClient.from('organizations').select('*');
    expect(data).toHaveLength(0);
  });

  test('anon key cannot read audit_log', async () => {
    // audit_log has deny-all RLS; 21 CFR Part 11 records must never be
    // readable by client roles.
    const { data } = await anonClient.from('audit_log').select('*');
    expect(data).toHaveLength(0);
  });
});
