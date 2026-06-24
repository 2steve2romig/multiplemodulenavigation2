'use strict';

// Unit tests for api/_lib/audit.js
// Supabase is mocked so these run without a database connection.

jest.mock('../../api/_lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../../api/_lib/supabase');
const { writeAuditLog, requestContext } = require('../../api/_lib/audit');

function mockInsert(error = null) {
  const single = jest.fn().mockResolvedValue({ error });
  const insert = jest.fn().mockReturnValue({ error: error });
  // writeAuditLog calls supabase.from(...).insert(...) — result is { error }
  supabase.from.mockReturnValue({ insert: jest.fn().mockResolvedValue({ error }) });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('writeAuditLog', () => {
  test('inserts a record with required fields', async () => {
    mockInsert(null);
    await writeAuditLog({
      event_type: 'entitlement.created',
      actor_type: 'admin',
      resource_type: 'entitlement',
      resource_id: 'abc-123',
    });
    expect(supabase.from).toHaveBeenCalledWith('audit_log');
    const insertFn = supabase.from.mock.results[0].value.insert;
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'entitlement.created',
      actor_type: 'admin',
      resource_type: 'entitlement',
      resource_id: 'abc-123',
    }));
  });

  test('defaults actor_id to "system" when not provided', async () => {
    mockInsert(null);
    await writeAuditLog({
      event_type: 'entitlement.created',
      actor_type: 'system',
      resource_type: 'entitlement',
      resource_id: 'abc-123',
    });
    const insertFn = supabase.from.mock.results[0].value.insert;
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({ actor_id: 'system' }));
  });

  test('defaults tenant_id and org_id to null when not provided', async () => {
    mockInsert(null);
    await writeAuditLog({
      event_type: 'org_entitlement.created',
      actor_type: 'admin',
      resource_type: 'org_entitlement',
      resource_id: 'xyz-456',
    });
    const insertFn = supabase.from.mock.results[0].value.insert;
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({
      tenant_id: null,
      org_id: null,
    }));
  });

  test('passes before_state and after_state when provided', async () => {
    mockInsert(null);
    const before = { status: 'active' };
    const after = { status: 'suspended' };
    await writeAuditLog({
      event_type: 'entitlement.updated',
      actor_type: 'admin',
      resource_type: 'entitlement',
      resource_id: 'abc-123',
      before_state: before,
      after_state: after,
    });
    const insertFn = supabase.from.mock.results[0].value.insert;
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({
      before_state: before,
      after_state: after,
    }));
  });

  test('does not throw when supabase insert returns an error (fail-open)', async () => {
    mockInsert({ message: 'connection refused' });
    await expect(writeAuditLog({
      event_type: 'entitlement.created',
      actor_type: 'admin',
      resource_type: 'entitlement',
      resource_id: 'abc-123',
    })).resolves.toBeUndefined();
  });

  test('logs console.error when supabase insert fails', async () => {
    mockInsert({ message: 'connection refused' });
    await writeAuditLog({
      event_type: 'entitlement.created',
      actor_type: 'admin',
      resource_type: 'entitlement',
      resource_id: 'abc-123',
    });
    expect(console.error).toHaveBeenCalledWith(
      '[audit] WRITE FAILED',
      expect.objectContaining({ event_type: 'entitlement.created' })
    );
  });
});

describe('requestContext', () => {
  test('extracts the last (trusted) IP from x-forwarded-for proxy chain', () => {
    // Vercel appends the real client IP last; first entry is client-controlled.
    const req = { headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3', 'user-agent': 'TestAgent/1' } };
    expect(requestContext(req)).toEqual({
      ip_address: '3.3.3.3',
      user_agent: 'TestAgent/1',
      request_id: null,
    });
  });

  test('accepts a single IP in x-forwarded-for', () => {
    const req = { headers: { 'x-forwarded-for': '1.2.3.4' } };
    expect(requestContext(req).ip_address).toBe('1.2.3.4');
  });

  test('rejects an injected non-IP string in x-forwarded-for', () => {
    const req = { headers: { 'x-forwarded-for': 'injected-value' } };
    expect(requestContext(req).ip_address).toBeNull();
  });

  test('extracts x-request-id when present', () => {
    const req = { headers: { 'x-request-id': 'req-abc', 'x-forwarded-for': '5.6.7.8' } };
    const ctx = requestContext(req);
    expect(ctx.request_id).toBe('req-abc');
    expect(ctx.ip_address).toBe('5.6.7.8');
  });

  test('returns null fields when headers are absent', () => {
    const req = { headers: {} };
    expect(requestContext(req)).toEqual({
      ip_address: null,
      user_agent: null,
      request_id: null,
    });
  });
});
