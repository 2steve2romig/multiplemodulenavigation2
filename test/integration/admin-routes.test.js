'use strict';

/**
 * Integration tests — admin-only mutation routes (ADR-007).
 *
 * Tests POST /api/organizations, POST /api/org-entitlements, and
 * PATCH /api/tenants/:id against the live Supabase project.
 *
 * Each describe block that needs a resource creates it in beforeAll.
 * No teardown — consistent with the existing api.test.js pattern.
 *
 * Prerequisites: same as api.test.js.
 * Run: jest test/integration/admin-routes.test.js
 */

const required = ['PLATFORM_URL', 'ADMIN_SECRET', 'TENANT_A_ID'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(`Admin route tests skipped — missing env vars: ${missing.join(', ')}`);
}

const describeIf = (cond) => cond ? describe : describe.skip;

const BASE = () => process.env.PLATFORM_URL;
const ADMIN = () => ({ 'content-type': 'application/json', 'x-admin-secret': process.env.ADMIN_SECRET });
const NO_SECRET = () => ({ 'content-type': 'application/json' });

// ─── POST /api/organizations ─────────────────────────────────────────────────

describeIf(missing.length === 0)('POST /api/organizations (admin)', () => {
  test('returns 401 without admin secret', async () => {
    const res = await fetch(`${BASE()}/api/organizations`, {
      method: 'POST',
      headers: NO_SECRET(),
      body: JSON.stringify({ name: 'Unauthorized Org' }),
    });
    expect(res.status).toBe(401);
  });

  test('returns 400 with missing name', async () => {
    const res = await fetch(`${BASE()}/api/organizations`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ region: 'us-east-1' }),
    });
    expect(res.status).toBe(400);
  });

  test('creates organization with valid input', async () => {
    const res = await fetch(`${BASE()}/api/organizations`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'Integration Test Org', region: 'us-east-1' }),
    });
    expect(res.status).toBe(201);
    const { organization } = await res.json();
    expect(organization.id).toBeDefined();
    expect(organization.name).toBe('Integration Test Org');
    expect(organization.region).toBe('us-east-1');
  });

  test('returns 405 for GET', async () => {
    const res = await fetch(`${BASE()}/api/organizations`);
    expect(res.status).toBe(405);
  });
});

// ─── POST /api/org-entitlements ──────────────────────────────────────────────

describeIf(missing.length === 0)('POST /api/org-entitlements (admin)', () => {
  let testOrgId;

  beforeAll(async () => {
    const res = await fetch(`${BASE()}/api/organizations`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'Org Entitlement Test Org' }),
    });
    const { organization } = await res.json();
    testOrgId = organization.id;
  });

  test('returns 401 without admin secret', async () => {
    const res = await fetch(`${BASE()}/api/org-entitlements`, {
      method: 'POST',
      headers: NO_SECRET(),
      body: JSON.stringify({ org_id: testOrgId, module_id: 'atp', status: 'active' }),
    });
    expect(res.status).toBe(401);
  });

  test('returns 400 with invalid org_id', async () => {
    const res = await fetch(`${BASE()}/api/org-entitlements`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ org_id: 'not-a-uuid', module_id: 'atp', status: 'active' }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 with invalid status', async () => {
    const res = await fetch(`${BASE()}/api/org-entitlements`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ org_id: testOrgId, module_id: 'atp', status: 'unknown' }),
    });
    expect(res.status).toBe(400);
  });

  test('creates org entitlement with valid input', async () => {
    const res = await fetch(`${BASE()}/api/org-entitlements`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ org_id: testOrgId, module_id: 'map', status: 'active' }),
    });
    expect(res.status).toBe(201);
    const { org_entitlement } = await res.json();
    expect(org_entitlement.id).toBeDefined();
    expect(org_entitlement.org_id).toBe(testOrgId);
    expect(org_entitlement.module_id).toBe('map');
    expect(org_entitlement.status).toBe('active');
  });

  test('returns 405 for GET', async () => {
    const res = await fetch(`${BASE()}/api/org-entitlements`);
    expect(res.status).toBe(405);
  });
});

// ─── PATCH /api/tenants/:id ───────────────────────────────────────────────────

describeIf(missing.length === 0)('PATCH /api/tenants/:id (admin)', () => {
  let testTenantId;
  let testOrgId;

  beforeAll(async () => {
    const [tenantRes, orgRes] = await Promise.all([
      fetch(`${BASE()}/api/tenants`, {
        method: 'POST',
        headers: ADMIN(),
        body: JSON.stringify({ name: 'Patch Test Site' }),
      }),
      fetch(`${BASE()}/api/organizations`, {
        method: 'POST',
        headers: ADMIN(),
        body: JSON.stringify({ name: 'Patch Test Org' }),
      }),
    ]);
    const [{ tenant }, { organization }] = await Promise.all([tenantRes.json(), orgRes.json()]);
    testTenantId = tenant.id;
    testOrgId = organization.id;
  });

  test('returns 401 without admin secret', async () => {
    const res = await fetch(`${BASE()}/api/tenants/${testTenantId}`, {
      method: 'PATCH',
      headers: NO_SECRET(),
      body: JSON.stringify({ org_id: testOrgId }),
    });
    expect(res.status).toBe(401);
  });

  test('returns 400 with invalid tenant UUID in path', async () => {
    const res = await fetch(`${BASE()}/api/tenants/not-a-uuid`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({ org_id: testOrgId }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 with invalid org_id value', async () => {
    const res = await fetch(`${BASE()}/api/tenants/${testTenantId}`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({ org_id: 'not-a-uuid' }),
    });
    expect(res.status).toBe(400);
  });

  test('assigns org_id to tenant', async () => {
    const res = await fetch(`${BASE()}/api/tenants/${testTenantId}`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({ org_id: testOrgId }),
    });
    expect(res.status).toBe(200);
    const { tenant } = await res.json();
    expect(tenant.org_id).toBe(testOrgId);
    expect(tenant.id).toBe(testTenantId);
  });
});
