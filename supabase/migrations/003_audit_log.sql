-- 003_audit_log.sql
-- ADR-008: 21 CFR Part 11 compliance - append-only audit trail.
--
-- Immutability is enforced at the RLS level: no UPDATE or DELETE policy exists
-- for any role. Only the service role (server-side API) may INSERT.
--
-- Run in Supabase SQL editor or via supabase db push.

-- ── audit_log ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ALCOA: Attributable
  actor_id      text,
  actor_type    text        NOT NULL CHECK (actor_type IN ('user', 'system', 'admin')),

  -- ALCOA: Contemporaneous — server-side timestamp, never client-supplied
  occurred_at   timestamptz NOT NULL DEFAULT now(),

  -- What changed
  event_type    text        NOT NULL,
  tenant_id     uuid        REFERENCES tenants(id)       ON DELETE SET NULL,
  org_id        uuid        REFERENCES organizations(id)  ON DELETE SET NULL,
  resource_type text        NOT NULL,
  resource_id   text        NOT NULL,

  -- ALCOA: Original and Accurate
  before_state  jsonb,
  after_state   jsonb,

  -- Request context
  ip_address    text,
  user_agent    text,
  request_id    text
);

-- Efficient per-tenant time-ordered queries (primary audit query pattern)
CREATE INDEX IF NOT EXISTS audit_log_tenant_time_idx
  ON audit_log (tenant_id, occurred_at DESC);

-- Efficient per-org queries
CREATE INDEX IF NOT EXISTS audit_log_org_time_idx
  ON audit_log (org_id, occurred_at DESC);

-- Efficient by event type
CREATE INDEX IF NOT EXISTS audit_log_event_type_idx
  ON audit_log (event_type, occurred_at DESC);

-- ── electronic_signatures ────────────────────────────────────────────────────
-- Required for regulated record approvals per §11.10(d) and §11.10(i).
-- Signatures are per IQ module workflow, not every API call.

CREATE TABLE IF NOT EXISTS electronic_signatures (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id  uuid        NOT NULL REFERENCES audit_log(id),
  signer_id     text        NOT NULL,
  signer_name   text        NOT NULL,
  meaning       text        NOT NULL,
  signed_at     timestamptz NOT NULL DEFAULT now(),
  record_hash   text        NOT NULL  -- SHA-256 of after_state JSON
);

CREATE INDEX IF NOT EXISTS esig_audit_log_idx
  ON electronic_signatures (audit_log_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Immutability: enable RLS but grant NO update/delete policies.
-- The service role bypasses RLS entirely (used by server-side API only).
-- Anon/authenticated roles cannot read or write audit_log directly.

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_signatures ENABLE ROW LEVEL SECURITY;

-- No policies granted — all client access denied.
-- Service role (used by api/_lib/supabase.js) bypasses RLS.
