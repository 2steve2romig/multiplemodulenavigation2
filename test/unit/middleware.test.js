'use strict';

const { resolveTenant, extractTenantId } = require('../../api/_middleware/resolveTenant');
const { requireAdminSecret } = require('../../api/_middleware/requireAdminSecret');

// ─── resolveTenant ───────────────────────────────────────────────────────────

describe('extractTenantId (dev mode)', () => {
  const originalEnv = process.env.NODE_ENV;
  beforeEach(() => { process.env.NODE_ENV = 'development'; });
  afterEach(() => { process.env.NODE_ENV = originalEnv; });

  test('returns tenantId from X-Tenant-ID header in dev', async () => {
    const req = { headers: { 'x-tenant-id': 'tenant-abc' } };
    expect(await extractTenantId(req)).toBe('tenant-abc');
  });

  test('returns null when header absent', async () => {
    const req = { headers: {} };
    expect(await extractTenantId(req)).toBeNull();
  });
});

describe('extractTenantId (production mode)', () => {
  const originalEnv = process.env.NODE_ENV;
  beforeEach(() => { process.env.NODE_ENV = 'production'; });
  afterEach(() => { process.env.NODE_ENV = originalEnv; });

  test('ignores X-Tenant-ID header in production', async () => {
    const req = { headers: { 'x-tenant-id': 'tenant-abc' } };
    expect(await extractTenantId(req)).toBeNull();
  });
});

describe('resolveTenant middleware', () => {
  const originalEnv = process.env.NODE_ENV;
  beforeEach(() => { process.env.NODE_ENV = 'development'; });
  afterEach(() => { process.env.NODE_ENV = originalEnv; });

  test('attaches tenantId to req and calls next()', async () => {
    const req = { headers: { 'x-tenant-id': 'tenant-xyz' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await resolveTenant(req, res, next);

    expect(req.tenantId).toBe('tenant-xyz');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 400 when no tenantId source available', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await resolveTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'tenantId required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('req.tenantId is the canonical source — never set from query string', async () => {
    const req = { headers: {}, query: { tenantId: 'should-be-ignored' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await resolveTenant(req, res, next);

    expect(req.tenantId).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── requireAdminSecret ──────────────────────────────────────────────────────

describe('requireAdminSecret middleware', () => {
  const originalSecret = process.env.ADMIN_SECRET;
  beforeEach(() => { process.env.ADMIN_SECRET = 'test-secret-123'; });
  afterEach(() => { process.env.ADMIN_SECRET = originalSecret; });

  test('calls next() when correct secret provided', () => {
    const req = { headers: { 'x-admin-secret': 'test-secret-123' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireAdminSecret(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 when secret is wrong', () => {
    const req = { headers: { 'x-admin-secret': 'wrong-secret' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireAdminSecret(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when secret header is absent', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireAdminSecret(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when ADMIN_SECRET env var is not set', () => {
    delete process.env.ADMIN_SECRET;
    const req = { headers: { 'x-admin-secret': 'anything' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireAdminSecret(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
