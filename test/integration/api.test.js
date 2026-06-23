'use strict';

/**
 * Integration tests — Platform API routes against a real Supabase test project.
 *
 * Prerequisites:
 *   1. A Supabase test project with 001_platform_schema.sql applied.
 *   2. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in .env.test.
 *   3. ADMIN_SECRET set in .env.test.
 *   4. Two test tenants seeded: TENANT_A_ID, TENANT_B_ID (set in .env.test).
 *
 * Run: NODE_ENV=test jest test/integration/api.test.js
 */

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_SECRET', 'TENANT_A_ID'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(`Integration tests skipped — missing env vars: ${missing.join(', ')}`);
}

const describeIf = (cond) => cond ? describe : describe.skip;

describeIf(missing.length === 0)('GET /api/modules', () => {
  const tenantAId = process.env.TENANT_A_ID;

  test('returns only manifests the tenant is entitled to', async () => {
    // Seed: TENANT_A has entitlement for 'atp' only.
    const res = await fetch(`${process.env.PLATFORM_URL}/api/modules`, {
      headers: { 'x-tenant-id': tenantAId },
    });
    expect(res.status).toBe(200);
    const { modules } = await res.json();
    expect(modules.every(m => m.id === 'atp')).toBe(true);
  });

  test('returns 400 when tenantId header is absent', async () => {
    const res = await fetch(`${process.env.PLATFORM_URL}/api/modules`);
    expect(res.status).toBe(400);
  });

  test('returns empty array for tenant with no entitlements', async () => {
    const res = await fetch(`${process.env.PLATFORM_URL}/api/modules`, {
      headers: { 'x-tenant-id': process.env.TENANT_B_ID },
    });
    expect(res.status).toBe(200);
    const { modules } = await res.json();
    expect(modules).toHaveLength(0);
  });
});

describeIf(missing.length === 0)('GET /api/entitlements', () => {
  const tenantAId = process.env.TENANT_A_ID;

  test('returns entitlements for the requested tenant only', async () => {
    const res = await fetch(`${process.env.PLATFORM_URL}/api/entitlements`, {
      headers: { 'x-tenant-id': tenantAId },
    });
    expect(res.status).toBe(200);
    const { entitlements } = await res.json();
    expect(entitlements.every(e => e.tenant_id === tenantAId)).toBe(true);
  });

  test('excludes expired entitlements', async () => {
    const res = await fetch(`${process.env.PLATFORM_URL}/api/entitlements`, {
      headers: { 'x-tenant-id': tenantAId },
    });
    const { entitlements } = await res.json();
    const now = new Date();
    entitlements.forEach(e => {
      expect(e.status).toBe('active');
      if (e.expires_at) expect(new Date(e.expires_at) > now).toBe(true);
    });
  });
});

describeIf(missing.length === 0)('POST /api/tenants (admin)', () => {
  test('returns 401 without admin secret', async () => {
    const res = await fetch(`${process.env.PLATFORM_URL}/api/tenants`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tenant-id': 'any' },
      body: JSON.stringify({ name: 'Test Tenant', region: 'us-east-1' }),
    });
    expect(res.status).toBe(401);
  });

  test('creates tenant with correct admin secret', async () => {
    const res = await fetch(`${process.env.PLATFORM_URL}/api/tenants`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-secret': process.env.ADMIN_SECRET,
      },
      body: JSON.stringify({ name: 'Integration Test Tenant', region: 'us-east-1' }),
    });
    expect(res.status).toBe(201);
    const { tenant } = await res.json();
    expect(tenant.id).toBeDefined();
    expect(tenant.region).toBe('us-east-1');
  });
});
