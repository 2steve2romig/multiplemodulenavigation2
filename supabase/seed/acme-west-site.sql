-- acme-west-site.sql
-- Creates "Acme Foods - West Coast" as a second site under the Acme Foods Inc.
-- organization.  This site has a different module mix than Tenant A (East Coast)
-- to demonstrate that org-level entitlements (supplier) are inherited at both
-- sites while site-level entitlements differ per location.
--
-- Prerequisites:
--   1. 001_platform_schema.sql applied
--   2. 002_org_hierarchy.sql applied
--   3. Acme Foods Inc. org already exists in the organizations table.
--      Run this query first to get its id:
--        SELECT id FROM organizations WHERE name = 'Acme Foods Inc.';
--      Then replace <ACME_ORG_ID> below with the actual UUID.
--
-- Run in Supabase SQL editor.

DO $$
DECLARE
  acme_org_id   uuid;
  west_site_id  uuid;
BEGIN
  -- Resolve the Acme Foods Inc. org
  SELECT id INTO acme_org_id
  FROM organizations
  WHERE name = 'Acme Foods Inc.'
  LIMIT 1;

  IF acme_org_id IS NULL THEN
    RAISE EXCEPTION 'Acme Foods Inc. org not found — run the demo setup first';
  END IF;

  -- Create the West Coast site
  INSERT INTO tenants (name, region)
  VALUES ('Acme Foods - West Coast', 'us-east-1')
  RETURNING id INTO west_site_id;

  -- Assign it to the Acme Foods org
  UPDATE tenants
  SET org_id = acme_org_id
  WHERE id = west_site_id;

  -- West Coast site-level entitlements:
  --   atp, map, clean, lab — same core as East Coast
  --   NOT: sample, plan, report (East Coast extras)
  --   Inherits: supplier (org-level via Acme Foods Inc.)
  INSERT INTO entitlements (tenant_id, module_id, status)
  VALUES
    (west_site_id, 'atp',   'active'),
    (west_site_id, 'map',   'active'),
    (west_site_id, 'clean', 'active'),
    (west_site_id, 'lab',   'active');

  RAISE NOTICE 'West Coast site created: %', west_site_id;
  RAISE NOTICE 'Assign to .env.test as TENANT_C_ID=%', west_site_id;
END $$;
