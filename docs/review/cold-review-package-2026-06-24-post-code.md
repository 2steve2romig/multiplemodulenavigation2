# SureTrend Platform — Cold Review Package
**Date:** 2026-06-24  
**Period covered:** Commits since last cold review (`57e7509` → `56baf60`)  
**Repository:** https://github.com/2steve2romig/multiplemodulenavigation2  
**Prior cold reviews:** `cold-review-output-2026-06-23.md`, `cold-review-output-2026-06-24.md`, `cold-review-output-2026-06-24-code-level.md`

---

## Instructions for Reviewer

Run this in a **fresh AI session with no prior design history**. Independence is the value.

Review the material below using the following priority order:

1. **Tenant isolation** — Can tenant A read/write/infer tenant B's data through any path? Missing `tenantId` filter on any route, Supabase query, cache, log, event? Is `tenantId` ever trusted from the client?
2. **AuthN / AuthZ scaffolding** — All endpoints requiring future auth marked `// TODO: auth-gate`? Any tenant-data endpoints currently wide open in a dangerous way?
3. **Entitlement integrity** — Can a tenant reach an unpurchased module? Is the entitlement store structured for status + expiry without structural rewrite?
4. **Module coupling** — Any module querying another's Supabase tables directly? Anything that breaks if a sibling module isn't provisioned?
5. **Scalability & resilience** — In-memory state that won't survive Vercel serverless cold starts? N+1 queries, unbounded result sets, missing pagination?
6. **Data residency & compliance** — PII in logs or env var names? Any way tenant data lands in the wrong region?
7. **Globalization** — Hardcoded user-facing strings? Locale-specific formatting assumptions? Non-UTC timestamps?
8. **Standard AppSec** — Secrets in client bundle or committed to repo? SQL injection via interpolated user input? Missing input validation? XSS via `dangerouslySetInnerHTML`? CORS issues? Outdated dependencies?

**Required output format:**
1. **Verdict** — approve for production with real customer data? Yes/No + single biggest blocker if no
2. **Findings** — each ranked Critical / High / Medium / Low: specific flaw, where (file/line), why it matters, concrete fix
3. **Tenant-isolation verdict** — explicit statement on cross-tenant isolation + what test would prove/disprove it
4. **Auth-readiness verdict** — explicit statement on whether scaffolding is structurally ready for IdP wiring without rework
5. **Unknowns** — what could not be assessed + what material is needed
6. **Minimum bar to "yes"** — shortest list of changes to reach production-ready

---

## Stack & Security Constraints (unchanged)

- **Frontend:** React 18.3.1, Babel standalone (browser-compiled JSX, no build step), Vercel static hosting
- **Backend:** Vercel serverless functions (`api/` directory, Node.js >=20)
- **Database:** Supabase PostgreSQL, shared-schema + `tenantId` RLS, service role key server-only
- **Auth:** Intentionally deferred (ADR-004) — `ALLOW_DEV_TENANT_HEADER === 'true'` gate for X-Tenant-ID in dev only; `ADMIN_SECRET` pre-auth shared secret for mutation routes
- **Deployment:** GitHub → Vercel auto-deploy; never direct CLI push
- **Hard constraints:**
  - `SUPABASE_SERVICE_ROLE_KEY` — server-only, never client-visible
  - `ADMIN_SECRET` — server-only, never client-visible
  - `ALLOW_DEV_TENANT_HEADER` must never be `true` in production or preview Vercel deployments
  - `ALLOWED_ORIGINS` — explicit allowlist; never `Access-Control-Allow-Origin: *` on tenant data routes

---

## What Changed Since Last Cold Review

Last cold review (`cold-review-output-2026-06-24-code-level.md`) covered commits through `57e7509`. New commits:

| Commit | Summary |
|--------|---------|
| `8685517` | Remove invalid Vercel runtime spec (`nodejs20.x` is AWS format — removed; Node version read from `package.json engines`) |
| `dcfad7d` | Wire `HomeQuickActions` into `OriginalHome` + `HomeTech`; fix 3 `ResultsGrid.jsx` runtime errors (`IDownload`, `ISearch`, `RES` undefined) |
| `bcabae1` | Activate `MapIQIllustration` SVG in Map IQ hero slide; add light-mode CSS (`map-iq-svg`, `map-grid-line`, `map-floor`) |
| `56baf60` | **Main change — see detail below:** Wire 7 dead sidebar routes: `AuditPage.jsx` (real API), `PlaceholderPage.jsx` × 4, `quant→iq:quant`, `kleanz→iq:kleanz`; remove stale comment |

**The significant security-relevant change is `56baf60`.** The other commits are UI wiring, SVG activation, and cleanup with no API or data access changes. This review should focus primarily on `AuditPage.jsx` and its interaction with the `GET /api/audit-log` endpoint.

---

## New Files

### `AuditPage.jsx` (new — `56baf60`)

This is the most security-relevant new component. It is a **client-side React component** that fetches from `GET /api/audit-log` using the admin secret entered by the user via an inline prompt. The secret is held in React component state only and never written to localStorage, sessionStorage, or any persistent store. A "Lock" button clears the secret from state.

**Reviewer focus areas:**
- `window.__ADMIN_SECRET__` fallback on line 65 — is this populated anywhere in production? If yes, that is a secret in client-visible global scope.
- Admin secret transmitted as `x-admin-secret` HTTP request header — what is the exposure surface?
- Filter parameters (`event_type`, `from`, `to`, `page`, `limit`) are passed to the server via `URLSearchParams` — any injection risk at the server?
- `after_state` JSON rendered in a `<pre>` tag — any XSS risk?
- The audit log returns `before_state` / `after_state` which may contain sensitive field values — is this appropriate for a client-side viewer?

```jsx
// AuditPage — read-only audit trail viewer backed by GET /api/audit-log.
// Requires the admin secret (X-Admin-Secret header) — entered once per session
// via an inline prompt. This is a prototype pattern; auth will replace it.

const { useState, useEffect, useCallback } = React;

const EVENT_TYPES = [
  { value: "", label: "All event types" },
  { value: "tenant.created",          label: "tenant.created" },
  { value: "tenant.updated",          label: "tenant.updated" },
  { value: "organization.created",    label: "organization.created" },
  { value: "entitlement.created",     label: "entitlement.created" },
  { value: "org_entitlement.created", label: "org_entitlement.created" },
];

const PAGE_LIMIT = 25;

function fmt(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function SecretPrompt({ onSubmit }) {
  const [val, setVal] = useState("");
  return (
    <div className="aud-prompt-wrap">
      <div className="aud-prompt-card">
        <h2 className="aud-prompt-title">Admin access required</h2>
        <p className="aud-prompt-sub">Enter the admin secret to view the audit log. This is a prototype placeholder for role-based auth (ADR-004).</p>
        <div className="aud-prompt-row">
          <input
            className="aud-secret-input"
            type="password"
            placeholder="Admin secret"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && val && onSubmit(val)}
            autoFocus
          />
          <button
            className="btn btn-primary btn-sm"
            disabled={!val}
            onClick={() => onSubmit(val)}>
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}

function AuditPage({ onBack }) {
  const [secret, setSecret]       = useState(window.__ADMIN_SECRET__ || "");  // line 65
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [eventType, setEventType] = useState("");
  const [from, setFrom]           = useState("");
  const [to, setTo]               = useState("");
  const [expanded, setExpanded]   = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const load = useCallback((s, pg, et, f, t) => {
    if (!s) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: pg, limit: PAGE_LIMIT });
    if (et) params.set("event_type", et);
    if (f)  params.set("from", f);
    if (t)  params.set("to", t);
    fetch(`/api/audit-log?${params}`, { headers: { "x-admin-secret": s } })
      .then(r => {
        if (r.status === 401) throw new Error("Invalid admin secret");
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(data => {
        setRows(data.logs || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        if (err.message === "Invalid admin secret") setSecret("");
      });
  }, []);

  useEffect(() => {
    if (secret) load(secret, page, eventType, from, to);
  }, [secret, page, eventType, from, to, load]);

  if (!secret) return <SecretPrompt onSubmit={s => { setSecret(s); load(s, 1, "", "", ""); }} />;

  return (
    <div className="content wide">
      <div className="page-head">
        <div className="left">
          <h1 className="page-h1">Audit Trail</h1>
          <p className="page-sub page-sub-inline">21 CFR Part 11 §11.10 — append-only event log · {total.toLocaleString()} records</p>
        </div>
        <div className="right">
          <button className="btn btn-ghost btn-sm" onClick={() => { setSecret(""); setRows([]); }}>Lock</button>
        </div>
      </div>
      {/* filter bar, table, and pagination omitted for brevity — no server interaction beyond the fetch above */}
      {rows.map(r => (
        <React.Fragment key={r.id}>
          {/* row cells render r.actor_type, r.event_type, r.resource_type, r.ip_address as text */}
          {expanded === r.id && (
            <tr className="aud-detail-row">
              <td colSpan="5">
                <div className="aud-detail">
                  {/* expanded detail — all fields rendered as React text nodes (no dangerouslySetInnerHTML) */}
                  {r.after_state && (
                    <details className="aud-json-wrap">
                      <summary>After state</summary>
                      <pre className="aud-json">{JSON.stringify(r.after_state, null, 2)}</pre>
                    </details>
                  )}
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

window.AuditPage = AuditPage;
```

---

### `PlaceholderPage.jsx` (new — `56baf60`)

Purely presentational. Accepts `title` (string), `description` (string), `icon` (inline SVG React element), `onBack` (callback). No data access, no fetch calls, no user input rendered to DOM. All props are caller-controlled constants defined inline in `App.jsx`.

```jsx
function PlaceholderPage({ title, icon, description, onBack }) {
  return (
    <div className="ph-root">
      <div className="ph-card">
        <div className="ph-badge">Planned feature</div>
        <div className="ph-icon-wrap">{icon}</div>
        <h1 className="ph-title">{title}</h1>
        <p className="ph-desc">{description}</p>
        <p className="ph-note">
          This page is under active development and will be available in a future release.
          If you need access sooner, contact your Hygiena representative.
        </p>
        <button className="btn btn-ghost btn-sm ph-back" onClick={onBack}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

window.PlaceholderPage = PlaceholderPage;
```

---

## Changed Files

### `App.jsx` — routing changes (`56baf60`)

```diff
-    const map = { map: "home" };
+    const map = { map: "home", quant: "iq:quant", kleanz: "iq:kleanz" };
     setRoute(map[id] || id);
```

```diff
+              : route === "audit" ? "Audit Trail"
+              : route === "dashboard" ? "Dashboard"
+              : route === "reports" ? "Reports"
+              : route === "sites" ? "Sites"
+              : route === "sampling" ? "Sampling Plans"
```

```diff
+          : route === "audit"
+          ? <AuditPage onBack={() => setRoute("home")}/>
+          : route === "dashboard"
+          ? <PlaceholderPage title="Dashboard" ... />
+          : route === "reports"
+          ? <PlaceholderPage title="Reports" ... />
+          : route === "sites"
+          ? <PlaceholderPage title="Sites" ... />
+          : route === "sampling"
+          ? <PlaceholderPage title="Sampling Plans" ... />
```

### `ResultsGrid.jsx` — runtime error fixes (`dcfad7d`)

Three symbols were called but never defined — the grid would crash on first render:

```jsx
// Added at line 35-40:
const IDownload = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
</svg>;

const ISearch = ({ size = 14 }) =>
<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
</svg>;

function RES(path) { return path; }
```

### `Home.jsx` — `HomeQuickActions` wiring (`dcfad7d`)

```diff
 function OriginalHome({ onNav }) {
   return (
     <>
       <div className="home-row home-row-2-1">
         <ProgramOverview onNav={onNav} />
         <RecentActivity onNav={onNav} />
       </div>
+      <HomeQuickActions onNav={onNav} />
       {typeof CustomTiles !== "undefined" && <CustomTiles onNav={onNav} />}
```

### `HomeTech.jsx` — `HomeQuickActions` wiring (`dcfad7d`)

```diff
 function HomeTech({ onNav }) {
   return (
     <>
+      <HomeQuickActions onNav={onNav} />
       <div className="home-row home-row-2-1">
         <MyDay onNav={onNav} />
```

---

## Existing API Endpoint — `GET /api/audit-log`

The new `AuditPage` UI is a viewer for this existing endpoint. Reproduced for reference:

```javascript
// api/audit-log.js
'use strict';

const { requireAdminSecret } = require('./_middleware/requireAdminSecret');
const { handleCors } = require('./_middleware/cors');
const { supabase } = require('./_lib/supabase');
const { z } = require('zod');

const QuerySchema = z.object({
  tenant_id:     z.string().uuid().optional(),
  org_id:        z.string().uuid().optional(),
  event_type:    z.string().max(100).optional(),
  resource_type: z.string().max(100).optional(),
  resource_id:   z.string().max(200).optional(),
  from:          z.string().datetime({ offset: true }).optional(),
  to:            z.string().datetime({ offset: true }).optional(),
  page:          z.coerce.number().int().min(1).default(1),
  limit:         z.coerce.number().int().min(1).max(100).default(25),
});

module.exports = async (req, res) => {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  await new Promise((resolve) => requireAdminSecret(req, res, resolve));
  if (res.writableEnded) return;

  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });

  const { tenant_id, org_id, event_type, resource_type, resource_id, from, to, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  let q = supabase.from('audit_log').select('*', { count: 'exact' });
  if (tenant_id)     q = q.eq('tenant_id', tenant_id);
  if (org_id)        q = q.eq('org_id', org_id);
  if (event_type)    q = q.eq('event_type', event_type);
  if (resource_type) q = q.eq('resource_type', resource_type);
  if (resource_id)   q = q.eq('resource_id', resource_id);
  if (from)          q = q.gte('occurred_at', from);
  if (to)            q = q.lte('occurred_at', to);

  q = q.order('occurred_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) return res.status(500).json({ error: 'Failed to load audit log' });

  return res.status(200).json({ logs: data, total: count, page, limit });
};
```

---

## `audit_log` Table Schema (from `003_audit_log.sql`)

```sql
CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      text,
  actor_type    text NOT NULL CHECK (actor_type IN ('user', 'system', 'admin')),
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  event_type    text NOT NULL,
  tenant_id     uuid REFERENCES tenants(id) ON DELETE SET NULL,
  org_id        uuid REFERENCES organizations(id) ON DELETE SET NULL,
  resource_type text NOT NULL,
  resource_id   text NOT NULL,
  before_state  jsonb,
  after_state   jsonb,
  ip_address    text,
  user_agent    text,
  request_id    text
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- No policies defined — deny-all for client roles; service role bypasses RLS.
-- Immutability enforced by trigger in 004_audit_hardening.sql (fires for all roles).

CREATE INDEX audit_log_tenant_idx ON audit_log (tenant_id, occurred_at DESC);
CREATE INDEX audit_log_org_idx    ON audit_log (org_id,    occurred_at DESC);
CREATE INDEX audit_log_event_idx  ON audit_log (event_type, occurred_at DESC);
CREATE INDEX audit_log_resource_idx ON audit_log (resource_type, resource_id);
```

---

## Architecture Context

### Tenant model
- `tenantId` is the primary access axis — on every request, row, log, event
- Multi-tenancy: shared Supabase schema + `tenantId` RLS
- Org/site billing hierarchy (ADR-007): sites are tenants; orgs own multiple sites
- `unionEntitlements(siteRows, orgRows, now)` — expired site rows fall through to org row

### Auth scaffolding (ADR-004 — deferred)
- No IdP wired — `ALLOW_DEV_TENANT_HEADER === 'true'` gate for X-Tenant-ID in dev only
- All data-access routes marked `// TODO: auth-gate`
- `ADMIN_SECRET` pre-auth shared secret for mutation + admin read routes
- Entitlement model built now: `entitlements` table (status + expiry per tenant) + `org_entitlements`

### 21 CFR Part 11 — Audit trail (ADR-008 Phase 1)
- `audit_log` table: append-only, RLS deny-all (client roles), immutability trigger blocks UPDATE/DELETE for all roles including service role
- `writeAuditLog()` fail-open — primary operation succeeds even if audit write fails
- **Hard production blocker (acknowledged):** audit writes must become transactional Supabase RPC before any regulated customer goes live

### Known open items (not new — carry-forward)
- `actor_id` is static `'admin'` — must be replaced with JWT subject when auth is wired
- Fail-open audit writes — must become transactional before regulated customers
- `minRequiredRole` server-side enforcement deferred to auth wiring
- Human engineering reviewer required before real customer data (per Engineering Constitution)

---

## What the Reviewer Should NOT Flag as New Issues

The following are known, accepted, or intentional:
- `ALLOW_DEV_TENANT_HEADER` dev-only pattern — documented in ADR-006; must never be `true` in production
- `actor_id: 'admin'` static value in audit writes — deferred until auth wired (ADR-008 Phase 1)
- Fail-open audit writes — acknowledged hard blocker; tracked in ADR-008
- `// TODO: auth-gate` on all data-access routes — intentional pre-auth pattern (ADR-004)
- `window.__TENANT_ID__` injection in `App.jsx` — pre-auth prototype pattern
- No Jest tests for UI components — intentional; business logic is in tested API routes
