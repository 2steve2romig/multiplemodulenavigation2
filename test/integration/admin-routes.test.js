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

// Audit atomicity tests only need PLATFORM_URL + ADMIN_SECRET.
const auditRequired = ['PLATFORM_URL', 'ADMIN_SECRET'];
const auditMissing = auditRequired.filter(k => !process.env[k]);

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

// ─── Audit atomicity — ADR-008 Phase 2 ───────────────────────────────────────
//
// These tests prove that each regulated mutation creates a corresponding
// audit_log entry. With the transactional RPC pattern, both INSERTs are
// atomic: if the audit write fails, the business record rolls back.
// These tests verify the happy-path invariant.

describeIf(auditMissing.length === 0)('Audit atomicity (ADR-008 Phase 2)', () => {
  const AUDIT_HEADERS = () => ({
    'x-admin-secret': process.env.ADMIN_SECRET,
  });

  async function getAuditEntries(resourceType, resourceId) {
    const res = await fetch(
      `${BASE()}/api/audit-log?resource_type=${resourceType}&resource_id=${encodeURIComponent(resourceId)}`,
      { headers: AUDIT_HEADERS() },
    );
    const body = await res.json();
    return body.audit_log ?? [];
  }

  test('POST /api/tenants creates a tenant.created audit entry', async () => {
    const res = await fetch(`${BASE()}/api/tenants`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'Audit Atomicity — Tenant' }),
    });
    expect(res.status).toBe(201);
    const { tenant } = await res.json();

    const logs = await getAuditEntries('tenant', tenant.id);
    const entry = logs.find(l => l.event_type === 'tenant.created');
    expect(entry).toBeDefined();
    expect(entry.resource_id).toBe(tenant.id);
    expect(entry.tenant_id).toBe(tenant.id);
  });

  test('POST /api/organizations creates an organization.created audit entry', async () => {
    const res = await fetch(`${BASE()}/api/organizations`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'Audit Atomicity — Org' }),
    });
    expect(res.status).toBe(201);
    const { organization } = await res.json();

    const logs = await getAuditEntries('organization', organization.id);
    const entry = logs.find(l => l.event_type === 'organization.created');
    expect(entry).toBeDefined();
    expect(entry.resource_id).toBe(organization.id);
    expect(entry.org_id).toBe(organization.id);
  });

  test('POST /api/entitlements creates an entitlement.created audit entry', async () => {
    const tenantRes = await fetch(`${BASE()}/api/tenants`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'Audit Atomicity — Entitlement Site' }),
    });
    const { tenant } = await tenantRes.json();

    const res = await fetch(`${BASE()}/api/entitlements`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ tenant_id: tenant.id, module_id: 'atp', status: 'active' }),
    });
    expect(res.status).toBe(201);
    const { entitlement } = await res.json();

    const logs = await getAuditEntries('entitlement', entitlement.id);
    const entry = logs.find(l => l.event_type === 'entitlement.created');
    expect(entry).toBeDefined();
    expect(entry.resource_id).toBe(entitlement.id);
    expect(entry.tenant_id).toBe(tenant.id);
  });

  test('POST /api/org-entitlements creates an org_entitlement.created audit entry', async () => {
    const orgRes = await fetch(`${BASE()}/api/organizations`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'Audit Atomicity — OrgEnt Org' }),
    });
    const { organization } = await orgRes.json();

    const res = await fetch(`${BASE()}/api/org-entitlements`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ org_id: organization.id, module_id: 'map', status: 'active' }),
    });
    expect(res.status).toBe(201);
    const { org_entitlement } = await res.json();

    const logs = await getAuditEntries('org_entitlement', org_entitlement.id);
    const entry = logs.find(l => l.event_type === 'org_entitlement.created');
    expect(entry).toBeDefined();
    expect(entry.resource_id).toBe(org_entitlement.id);
    expect(entry.org_id).toBe(organization.id);
  });
});

// ─── PATCH /api/entitlements/:id ─────────────────────────────────────────────

describeIf(auditMissing.length === 0)('PATCH /api/entitlements/:id (admin)', () => {
  let testEntitlementId;

  beforeAll(async () => {
    const tenantRes = await fetch(`${BASE()}/api/tenants`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'PATCH Entitlement Test Site' }),
    });
    const { tenant } = await tenantRes.json();

    const entRes = await fetch(`${BASE()}/api/entitlements`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ tenant_id: tenant.id, module_id: 'atp', status: 'active' }),
    });
    const { entitlement } = await entRes.json();
    testEntitlementId = entitlement.id;
  });

  test('returns 401 without admin secret', async () => {
    const res = await fetch(`${BASE()}/api/entitlements/${testEntitlementId}`, {
      method: 'PATCH',
      headers: NO_SECRET(),
      body: JSON.stringify({ status: 'suspended' }),
    });
    expect(res.status).toBe(401);
  });

  test('returns 400 with invalid entitlement UUID in path', async () => {
    const res = await fetch(`${BASE()}/api/entitlements/not-a-uuid`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({ status: 'suspended' }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 with invalid status value', async () => {
    const res = await fetch(`${BASE()}/api/entitlements/${testEntitlementId}`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({ status: 'unknown' }),
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 with empty body (no fields to update)', async () => {
    const res = await fetch(`${BASE()}/api/entitlements/${testEntitlementId}`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test('returns 404 for non-existent entitlement id', async () => {
    const res = await fetch(`${BASE()}/api/entitlements/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({ status: 'suspended' }),
    });
    expect(res.status).toBe(404);
  });

  test('updates status and creates entitlement.updated audit entry with before/after states', async () => {
    const res = await fetch(`${BASE()}/api/entitlements/${testEntitlementId}`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({ status: 'suspended' }),
    });
    expect(res.status).toBe(200);
    const { entitlement } = await res.json();
    expect(entitlement.status).toBe('suspended');
    expect(entitlement.id).toBe(testEntitlementId);

    const logsRes = await fetch(
      `${BASE()}/api/audit-log?resource_type=entitlement&resource_id=${encodeURIComponent(testEntitlementId)}`,
      { headers: { 'x-admin-secret': process.env.ADMIN_SECRET } },
    );
    const { audit_log: logs } = await logsRes.json();
    const entry = logs.find(l => l.event_type === 'entitlement.updated');
    expect(entry).toBeDefined();
    expect(entry.before_state.status).toBe('active');
    expect(entry.after_state.status).toBe('suspended');
  });

  test('returns 405 for GET on resource path', async () => {
    const res = await fetch(`${BASE()}/api/entitlements/${testEntitlementId}`);
    expect(res.status).toBe(405);
  });
});

// ─── Module FK enforcement (migration 006 + 008) ─────────────────────────────
// Proves that the module_id FK to module_manifests rejects ghost entitlements.
// Requires: migration 006 (NOT VALID FK) + migration 008 (VALIDATE CONSTRAINT)
// applied to the test Supabase project.

describeIf(auditMissing.length === 0)('Module FK enforcement', () => {
  test('POST /api/entitlements with non-existent module_id is rejected', async () => {
    const tenantRes = await fetch(`${BASE()}/api/tenants`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'FK Enforcement Test Site' }),
    });
    const { tenant } = await tenantRes.json();

    const res = await fetch(`${BASE()}/api/entitlements`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ tenant_id: tenant.id, module_id: 'ghost-module-xyz', status: 'active' }),
    });
    expect(res.status).toBe(500);
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

  test('assigns org_id to tenant and creates tenant.org_assigned audit entry', async () => {
    const res = await fetch(`${BASE()}/api/tenants/${testTenantId}`, {
      method: 'PATCH',
      headers: ADMIN(),
      body: JSON.stringify({ org_id: testOrgId }),
    });
    expect(res.status).toBe(200);
    const { tenant } = await res.json();
    expect(tenant.org_id).toBe(testOrgId);
    expect(tenant.id).toBe(testTenantId);

    const logsRes = await fetch(
      `${BASE()}/api/audit-log?resource_type=tenant&resource_id=${encodeURIComponent(testTenantId)}`,
      { headers: { 'x-admin-secret': process.env.ADMIN_SECRET } },
    );
    const { audit_log: logs } = await logsRes.json();
    const entry = logs.find(l => l.event_type === 'tenant.org_assigned');
    expect(entry).toBeDefined();
    expect(entry.before_state.org_id).toBeNull();
    expect(entry.after_state.org_id).toBe(testOrgId);
  });
});
