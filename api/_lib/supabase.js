'use strict';

const { createClient } = require('@supabase/supabase-js');

// Service role client — server-only. Never expose to the React client bundle.
// getClientForRegion is a stub per ADR-003: currently always returns the US client.
// When an EU Supabase project is provisioned, extend this to route by region.

function getClientForRegion(region = 'us-east-1') {
  // TODO: when EU project is added, return the EU client for region 'eu-west-1'.
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Default client (US region).
const supabase = getClientForRegion('us-east-1');

module.exports = { supabase, getClientForRegion };
