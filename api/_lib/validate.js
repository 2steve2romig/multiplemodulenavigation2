'use strict';

const { z } = require('zod');

const TenantCreateSchema = z.object({
  name:   z.string().min(1).max(255),
  region: z.enum(['us-east-1']).default('us-east-1'),
});

// PATCH /api/tenants/:id — assign org_id to a site (ADR-007)
const TenantPatchSchema = z.object({
  org_id: z.string().uuid(),
});

const EntitlementCreateSchema = z.object({
  tenant_id:  z.string().uuid(),
  module_id:  z.string().min(1).max(64),
  status:     z.enum(['active', 'suspended', 'expired']),
  expires_at: z.string().datetime().nullable().optional(),
});

// POST /api/organizations — create a parent org (ADR-007)
const OrgCreateSchema = z.object({
  name:   z.string().min(1).max(255),
  region: z.enum(['us-east-1']).default('us-east-1'),
});

// POST /api/org-entitlements — grant org-level module access (ADR-007)
const OrgEntitlementCreateSchema = z.object({
  org_id:    z.string().uuid(),
  module_id: z.string().min(1).max(64),
  status:    z.enum(['active', 'suspended', 'expired']),
  expires_at: z.string().datetime().nullable().optional(),
});

// PATCH /api/entitlements/:id — update status and/or expires_at
const EntitlementPatchSchema = z.object({
  status:     z.enum(['active', 'suspended', 'expired']).optional(),
  expires_at: z.string().datetime().nullable().optional(),
}).refine(
  body => body.status !== undefined || body.expires_at !== undefined,
  { message: 'At least one field (status, expires_at) is required' },
);

const TenantIdQuerySchema = z.object({
  // tenantId comes from req.tenantId (middleware), not from query string.
  // This schema validates any extra query params that should not be trusted.
});

module.exports = {
  TenantCreateSchema,
  TenantPatchSchema,
  EntitlementCreateSchema,
  EntitlementPatchSchema,
  OrgCreateSchema,
  OrgEntitlementCreateSchema,
  TenantIdQuerySchema,
};
