'use strict';

const { z } = require('zod');

const TenantCreateSchema = z.object({
  name:   z.string().min(1).max(255),
  region: z.enum(['us-east-1']).default('us-east-1'),
});

const EntitlementCreateSchema = z.object({
  tenant_id:  z.string().uuid(),
  module_id:  z.string().min(1).max(64),
  status:     z.enum(['active', 'suspended', 'expired']),
  expires_at: z.string().datetime().nullable().optional(),
});

const TenantIdQuerySchema = z.object({
  // tenantId comes from req.tenantId (middleware), not from query string.
  // This schema validates any extra query params that should not be trusted.
});

module.exports = { TenantCreateSchema, EntitlementCreateSchema, TenantIdQuerySchema };
