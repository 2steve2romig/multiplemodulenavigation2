# SureTrend Platform — Architecture Design Document

> **Status:** Draft v1.2 — updated post domain review 2026-06-23  
> **Version:** 1.2  
> **Date:** 2026-06-23  
> **Scope:** V1 — Platform shell + entitlement layer

---

## a) Product & Domain

**Product:** SureTrend — food safety management platform by Hygiena  
**Customers:** Food and beverage manufacturing facilities; multi-site organizations  
**Business model:** SaaS, multi-tenant, à la carte module purchase  

**Regulatory context:**

SureTrend customers operate under one or more of the following frameworks. The specific clauses below directly shape platform data architecture — immutability, audit trails, electronic signatures, and access control.

| Framework | Relevant Clauses | Architectural impact |
|---|---|---|
| **SQF** (Safe Quality Food) | §11.5.1 document control, §11.5.2 records management, §2.1.1 senior management commitment | Immutable records, document versioning, role-based access |
| **BRCGS** (British Retail Consortium) | §4.11.1 goods receipt traceability, §4.11.2 product traceability, §3.11 food safety plan | Lot-level traceability data, food safety plan builder |
| **FSMA** (Food Safety Modernization Act) | §117.135 monitoring of preventive controls, §117.80 sanitation controls (prerequisite programs) | Preventive control monitoring records, sanitation scheduling |
| **FDA 21 CFR Part 117** | §117.190 supply chain program | Supplier qualification, supply chain records |
| **FDA 21 CFR Part 11** | §11.10 electronic records and signature controls | **Audit trail is mandatory.** Records must be: attributable, legible, contemporaneous, original, accurate (ALCOA). System must enforce: access controls, audit trail with timestamps, data integrity, no record deletion |
| **PrimusGFS** | Good Agricultural Practices — fresh produce | Environmental monitoring, sanitation, pest control |
| **CanadaGAP** | Canadian Good Agricultural Practices | Environmental monitoring, recordkeeping |
| **GLOBALG.A.P.** | Good Agricultural Practice — international | Traceability, environmental monitoring |

**21 CFR Part 11 §11.10 is the highest-impact clause** for a digital platform. It requires: validated systems, complete audit trails with timestamps, access limited to authorized individuals, authority checks enforced in software, and records that cannot be altered without detection. This is non-negotiable before any regulated customer goes live.

**V1 scope:** Platform shell + entitlement layer only. Individual IQ modules (ATP, Map, Sample, etc.) are onboarded one at a time after the platform foundation is validated.

---

## b) Tenancy Model

### Billing hierarchy (domain requirement — SME review 2026-06-23)

SureTrend must support two billing models simultaneously:

| Model | Description | Example |
|---|---|---|
| **Corporate billing** | A parent organization pays for modules; all its child sites inherit those entitlements | Acme Foods Corp pays for ATP IQ → all 12 Acme plants can use it |
| **Site billing** | An individual site pays for its own modules independently | Acme Foods Chicago Plant pays for Kleanz IQ separately |

A site's effective entitlements = **union of its own entitlements + its parent organization's entitlements**. See ADR-007 for the full hierarchy model and resolution algorithm.

### Tenant concepts

- **Organization** — the corporate/contracting entity (e.g., Acme Foods, Inc.). May have many sites. May hold corporate-level entitlements.
- **Site** — an individual facility or plant (e.g., Acme Foods Chicago). Always belongs to exactly one organization. May hold site-level entitlements in addition to inheriting org-level ones.
- **`tenantId`** always refers to a **Site** — the most granular billing and data-isolation unit. It travels on every API request, database row, log line, metric, trace, and event. No data structure is tenant-agnostic.
- **Users** belong to one or more sites (via `user_tenant_memberships`). A user may have different roles across sites.

### User roles (domain-confirmed 2026-06-23)

| Role | ID | Description |
|---|---|---|
| Owner | `owner` | Account owner — full control, billing, org management |
| Global Admin | `globaladmin` | Admin across all sites within the organization |
| Admin | `admin` | Admin within a single site |
| User | `user` | Standard end-user — can operate modules they have access to |

`minRequiredRole` in module manifests gates which roles can access a module. Server-side enforcement is deferred (Open Item #7); v1 is display-only.
- **Entitlements** are held at either the Organization or Site level. The Platform API resolves effective entitlements by unioning both before returning the module manifest list.
- **Entitlement expiry is enforced at query time** — every API route that reads entitlements filters server-side: `status = 'active' AND (expires_at IS NULL OR expires_at > now())`. The `status` field alone is not sufficient; query-time expiry filtering is mandatory on every entitlement access path.
- **Authentication is deferred.** No identity provider is wired at this time. The entitlement model and `tenantId` scaffolding are built now so auth can be added without structural rework. All endpoints that will require auth enforcement before production are marked `// TODO: auth-gate`.
- **Visibility is computed server-side.** The shell renders only what the platform API says a site is entitled to (direct + inherited). The client is never the source of truth for access.

---

## c) Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│           SureTrend Web App (React Shell)            │
│               Vercel (static hosting)                │
│  - Topbar, Sidebar, Home, Results, Notifications     │
│  - Loads module registry from Platform API           │
│  - Renders entitled modules at their routes          │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────┐
│            Platform / Core API (Node.js)             │
│           Vercel Serverless Functions                │
│  Routes:                                             │
│    GET  /api/tenants/:id                             │
│    GET  /api/entitlements?tenantId=                  │
│    GET  /api/modules?tenantId=        (manifest reg) │
│    POST /api/tenants  (admin)                        │
│    POST /api/entitlements  (admin)                   │
│  Every route: // TODO: auth-gate                     │
└────────────────────┬────────────────────────────────┘
                     │ Supabase JS client (service role — server only)
                     ▼
┌─────────────────────────────────────────────────────┐
│          Platform Supabase DB (PostgreSQL)           │
│          US East region (initial)                    │
│  Tables:                                             │
│    tenants                  (RLS enabled)            │
│    users                    (RLS enabled)            │
│    user_tenant_memberships  (RLS enabled)            │
│    entitlements             (RLS enabled)            │
│    module_manifests         (RLS enabled)            │
└─────────────────────────────────────────────────────┘

Future — each IQ module (standalone, per ADR-001):
┌──────────────────┐   ┌──────────────────┐   ...
│  IQ-ATP API      │   │  IQ-Map API      │
│  Vercel          │   │  Vercel          │
│  + ATP Supabase  │   │  + Map Supabase  │
└──────────────────┘   └──────────────────┘
  Cross-module communication: webhooks only (see §f).
  Never direct DB queries across module boundaries.
```

**Key constraints:**
- The Supabase service role key is **server-only** — never exposed to the React client bundle or prefixed `NEXT_PUBLIC_` / `VITE_`.
- The React shell does **not** use the Supabase anon key for Realtime. Cross-module events use webhooks between server-side APIs (see §f). The anon key is not used in the React client in v1.
- No in-memory state in Node.js serverless functions (Vercel functions are stateless; local variables do not persist across invocations).

---

## d) Data Ownership

| Data | Owner | Access pattern |
|---|---|---|
| Tenants | Platform/Core | Platform API only |
| Users | Platform/Core | Platform API only |
| User↔Tenant memberships | Platform/Core | Platform API only |
| Entitlements | Platform/Core | Platform API only |
| Module manifests | Platform/Core | Platform API only |
| ATP test results | IQ-ATP module | IQ-ATP API only |
| Map floor plans | IQ-Map module | IQ-Map API only |
| *(future modules)* | Each module | That module's API only |

**Rules:**
- Each module owns its data exclusively and privately.
- No module reads or writes another module's Supabase tables directly.
- Cross-module interaction goes through the Platform API or webhooks (see §f). Never Supabase Realtime across projects.
- The Platform/Core service is the one acceptable shared dependency.

---

## e) Module Manifest Schema

Each IQ module is self-describing via one manifest. The Platform API serves the filtered set of manifests for a given tenant (only modules the tenant is entitled to).

```json
{
  "id": "atp",
  "displayName": "ATP IQ",
  "icon": "/iq-icons/iq-atp.png",
  "color": "#29ABE2",
  "baseRoute": "/iq/atp",
  "serviceUrl": "https://atp.suretrend.app",
  "minRequiredRole": "user",
  "pricingLabel": "$X/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    { "label": "Results", "path": "/iq/atp/results" },
    { "label": "Plans", "path": "/iq/atp/plans" }
  ],
  "version": "1.0.0"
}
```

**Rules:**
- A module is defined in **one** manifest. `id`, `displayName`, `icon`, `color`, `baseRoute` are never duplicated elsewhere in the shell.
- The shell assembles its navigation and routing from manifests at runtime.
- A module that fails to load its manifest degrades gracefully — its nav item shows as unavailable, no crash.

---

## f) Integration Approach

**Shell → Platform API**
- On load, the shell calls `GET /api/modules?tenantId=` to fetch the entitled module manifest list.
- The shell builds its sidebar nav and route table from the returned manifests.
- If the platform API is unreachable, the shell shows a degraded state (no module nav) rather than crashing.

**Shell → IQ Module**
- Each IQ module is rendered at its `baseRoute` within the shell's router.
- The shell passes `tenantId` (and, when auth is wired, an auth token) to each module's context.
- Modules are loaded lazily (code-split) so an unavailable module doesn't block the shell.

**Cross-module events — webhooks only**
- Each IQ module is a separate Supabase project. Supabase Realtime is scoped per project and cannot span projects. Therefore Realtime is **not** the cross-module event mechanism.
- Cross-module events use **webhooks**: the originating module's API sends a POST to the Platform API (`/api/events`), which fans out to subscriber modules.
- Event payload carries `tenantId` and is verified server-side by the receiving module.
- Webhook endpoint authentication: shared HMAC secret per module pair, verified in middleware.
- Never: one module's Node.js code calling another module's Supabase DB directly.

**CORS**
- The Platform API sets an explicit `Access-Control-Allow-Origin` allowlist — only the shell's Vercel domain and registered module domains are permitted.
- `Access-Control-Allow-Origin: *` is never used on any route that carries tenant data.
- CORS allowlist is an environment variable, not hardcoded, so it can include preview deployment URLs in dev.

---

## g) Globalization

| Concern | Decision |
|---|---|
| Default locale | `en-US` |
| Supported locales (v1) | `en-US` only — bake in the capability, defer additional locales until demanded |
| UI strings | **V1: en-US strings only, English hardcoded.** The i18n library (react-intl) and locale resource file structure are set up in v1 so strings can be extracted to locale keys when a second locale is demanded — but no translation work is done until then. `pricingLabel` in module manifests is a public list price string, never tenant-specific. |
| Date/time storage | UTC in Supabase; rendered in user's locale and time zone |
| Number/currency formatting | V1: en-US formatting only. Locale-aware formatting (Intl.NumberFormat, Intl.DateTimeFormat) used throughout so locale can be swapped without code changes. No hardcoded `$` or unit symbols in logic — display-only strings in the en-US resource file. |
| Unicode | UTF-8 end to end; non-Latin scripts and RTL layouts not precluded |
| Data residency | US region (Supabase `us-east-1`) initially; `region` field on `tenants` table enables per-tenant routing to a future EU project without structural rework |

---

## Open Items (must be resolved before production)

| # | Item | Owner | Blocking? |
|---|---|---|---|
| 1 | Named independent human engineering reviewer for production | sromig@hygiena.com | Yes — before real customer data |
| 2 | Auth provider selection (Supabase Auth vs Auth0 vs other) | TBD | Yes — before production |
| 3 | EU data residency decision (GDPR customer demand?) | Business | No — design is ready; decision is commercial |
| 4 | Per-module pricing data (replace `$X/mo` in manifests) | Product | No — needed for subscription UI |
| 5 | FSMA / SQF / BRCGS traceability requirements per module | SME review | Yes — affects data model per module |
| 6 | Admin endpoint pre-auth shared secret | Engineering | Yes — before any public deployment of the platform API |
| 7 | `minRequiredRole` server-side enforcement | Engineering | No for v1 (display only); Yes before auth is wired |
| 8 | ~~21 CFR Part 11 §11.10 compliance audit — immutable audit trail~~ — **Phase 1 resolved 2026-06-24.** Migration 003 creates append-only `audit_log` + `electronic_signatures` tables (RLS, no UPDATE/DELETE). `api/_lib/audit.js` fail-open helper. Audit writes wired into all entitlement + tenant mutation routes. `GET /api/audit-log` admin read route live. Phase 2 (e-signatures per IQ module) and Phase 3 (validation protocol) pending. | Engineering + SME | Phase 1 closed — Phase 2+3 pending |
| 9 | ~~Org/Site billing hierarchy implementation (ADR-007)~~ — **Resolved 2026-06-23.** Organizations table, org_id FK on tenants, org_entitlements table live in Supabase (migration 002). GET /api/modules unions site + org entitlements. Admin routes: POST /api/organizations, POST /api/org-entitlements, PATCH /api/tenants/:id. | Engineering | Closed |
| 10 | ~~User role names aligned with SureTrend domain~~ — **Resolved 2026-06-23.** Roles confirmed: Owner / Global Admin / Admin / User. Implemented in seed.sql, live DB, and iq-catalog.js. | sromig@hygiena.com | Closed |
| 12 | ~~Dead sidebar navigation routes~~ — **Resolved 2026-06-24.** 7 sidebar links had no route handler (silently fell through to ResultsGrid). Fixed: `quant→iq:quant`, `kleanz→iq:kleanz` in handleNav map; `AuditPage.jsx` (real data from GET /api/audit-log, admin secret prompt); `PlaceholderPage.jsx` shared component for dashboard/reports/sites/sampling with "Planned feature" badge. | Engineering | Closed |
| 11 | ~~Designer component gap analysis~~ — **Resolved 2026-06-24.** Full audit of designer components vs implemented app. Findings: HomeQuickActions wired into Original/Tech layouts (`dcfad7d`); 3 ResultsGrid runtime errors fixed (IDownload, ISearch, RES undefined — `dcfad7d`); MapIQIllustration activated in hero slide, replacing CSS placeholder — light-mode CSS added for map-iq-svg/map-grid-line/map-floor (TBD); SummaryHeader/TypeDropdown/PeriodDropdown confirmed wired via window injection; NotificationsInbox 100% implemented; module catalog (15 modules) matches seed.sql exactly. | Engineering | Closed |
| 13 | Inter-module event contract (ADR-009) — document and review before first IQ module API is written. ADR-001 required webhooks or Realtime; architecture analysis confirmed Realtime cannot span Supabase projects. ADR-009 authored 2026-06-24 specifying webhooks-only with HMAC auth, retry, and idempotency requirements. | Engineering | Yes — before first IQ module API |
| 14 | Migration 005 — FK from `entitlements.module_id` → `module_manifests.id` and `org_entitlements.module_id` → `module_manifests.id` (`ON DELETE RESTRICT`). Currently enforced only at the API layer; a ghost entitlement for a nonexistent module silently returns an empty module list with no error signal. | Engineering | No — hardening |
| 15 | `PATCH /api/entitlements/:id` — missing mutation route. Entitlement status changes (suspend, extend expiry) currently require Supabase dashboard access with no API-level audit trail. ADR-008 lists `entitlement.updated` as a required audit event type. Route must use transactional RPC pattern (Issue 1 in ADR-008 Phase 2) as the first implementation of that pattern. | Engineering | Yes — before regulated customers |
| 16 | Soft-delete (`deleted_at`) on `tenants` and `organizations`. Current `audit_log` uses `ON DELETE SET NULL` for tenant/org FKs — if a tenant is hard-deleted, audit records lose attribution context, violating 21 CFR Part 11 ALCOA attributability. Change to `ON DELETE RESTRICT` + add `deleted_at` column. FDA minimum data retention: 2 years for food safety records. | Engineering | Yes — before regulated customers |
| 17 | `external_auth_id text UNIQUE` + `auth_provider text` columns on `users` table. Currently `users` has only `id` and `email`. Auth providers assign opaque `sub` claims (not email). Without this column, mapping the provider's user record to the platform's `users` row requires a painful schema migration at the worst possible time — mid auth-provider integration. | Engineering | Yes — before auth wiring |
| 18 | Security headers in `vercel.json` — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. No headers block on static responses currently. Trivial to add; no build-step dependency. | Engineering | No — hardening |
