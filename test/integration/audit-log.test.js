'use strict';

/**
 * Integration tests — GET /api/audit-log (ADR-008).
 *
 * Relies on existing admin-routes.test.js creating resources (tenants,
 * org-entitlements) that trigger audit writes. This suite validates that
 * those writes land in the audit_log table and are queryable via the API.
 *
 * Prerequisites: same as api.test.js.
 * Run: jest test/integration/audit-log.test.js
 */

const required = ['PLATFORM_URL', 'ADMIN_SECRET', 'TENANT_A_ID'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(`Audit log tests skipped — missing env vars: ${missing.join(', ')}`);
}

const describeIf = (cond) => cond ? describe : describe.skip;

const BASE = () => process.env.PLATFORM_URL;
const ADMIN = () => ({ 'content-type': 'application/json', 'x-admin-secret': process.env.ADMIN_SECRET });
const NO_SECRET = () => ({ 'content-type': 'application/json' });

describeIf(missing.length === 0)('GET /api/audit-log (admin)', () => {
  let createdTenantId;

  beforeAll(async () => {
    // Create a tenant so there's at least one audit record (tenant.created)
    const res = await fetch(`${BASE()}/api/tenants`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({ name: 'Audit Log Test Tenant' }),
    });
    const { tenant } = await res.json();
    createdTenantId = tenant.id;
  });

  test('returns 401 without admin secret', async () => {
    const res = await fetch(`${BASE()}/api/audit-log`, { headers: NO_SECRET() });
    expect(res.status).toBe(401);
  });

  test('returns 405 for POST', async () => {
    const res = await fetch(`${BASE()}/api/audit-log`, {
      method: 'POST',
      headers: ADMIN(),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(405);
  });

  test('returns audit log array with pagination fields', async () => {
    const res = await fetch(`${BASE()}/api/audit-log`, { headers: ADMIN() });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.audit_log)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(body.page).toBe(1);
    expect(body.limit).toBe(50);
  });

  test('each audit record has required ALCOA fields', async () => {
    const res = await fetch(`${BASE()}/api/audit-log`, { headers: ADMIN() });
    const { audit_log } = await res.json();
    expect(audit_log.length).toBeGreaterThan(0);
    audit_log.forEach(entry => {
      expect(entry.id).toBeDefined();
      expect(entry.event_type).toBeDefined();
      expect(entry.actor_type).toMatch(/^(user|system|admin)$/);
      expect(entry.occurred_at).toBeDefined();
      expect(entry.resource_type).toBeDefined();
      expect(entry.resource_id).toBeDefined();
    });
  });

  test('filters by tenant_id', async () => {
    const res = await fetch(
      `${BASE()}/api/audit-log?tenant_id=${createdTenantId}`,
      { headers: ADMIN() }
    );
    expect(res.status).toBe(200);
    const { audit_log } = await res.json();
    // The tenant.created event for this tenant should appear
    expect(audit_log.length).toBeGreaterThan(0);
    audit_log.forEach(entry => expect(entry.tenant_id).toBe(createdTenantId));
  });

  test('filters by event_type', async () => {
    const res = await fetch(
      `${BASE()}/api/audit-log?event_type=tenant.created`,
      { headers: ADMIN() }
    );
    expect(res.status).toBe(200);
    const { audit_log } = await res.json();
    expect(audit_log.length).toBeGreaterThan(0);
    audit_log.forEach(entry => expect(entry.event_type).toBe('tenant.created'));
  });

  test('returns 400 for invalid tenant_id format', async () => {
    const res = await fetch(
      `${BASE()}/api/audit-log?tenant_id=not-a-uuid`,
      { headers: ADMIN() }
    );
    expect(res.status).toBe(400);
  });

  test('respects limit and page params', async () => {
    const res = await fetch(
      `${BASE()}/api/audit-log?limit=2&page=1`,
      { headers: ADMIN() }
    );
    expect(res.status).toBe(200);
    const { audit_log, limit, page } = await res.json();
    expect(audit_log.length).toBeLessThanOrEqual(2);
    expect(limit).toBe(2);
    expect(page).toBe(1);
  });
});
