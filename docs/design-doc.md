# SureTrend Platform — Architecture Design Document

> **Status:** Draft v1.1 — updated post cold review 2026-06-23  
> **Version:** 1.1  
> **Date:** 2026-06-23  
> **Scope:** V1 — Platform shell + entitlement layer

---

## a) Product & Domain

**Product:** SureTrend — food safety management platform by Hygiena  
**Customers:** Food and beverage manufacturing facilities; multi-site organizations  
**Business model:** SaaS, multi-tenant, à la carte module purchase  

**Regulatory context:**  
- FSMA (Food Safety Modernization Act) — US federal law governing preventive controls, traceability, environmental monitoring
- SQF (Safe Quality Food) — GFSI-recognized certification scheme
- BRCGS (British Retail Consortium Global Standards) — global food safety standard
- FSSC 22000 — ISO-based food safety management system standard

These frameworks impose strict data integrity, audit trail, and traceability requirements that directly shape the platform's architecture: data must be immutable after submission, audit trails must be tamper-evident, and access must be role-controlled and logged.

**V1 scope:** Platform shell + entitlement layer only. Individual IQ modules (ATP, Map, Sample, etc.) are onboarded one at a time after the platform foundation is validated.

---

## b) Tenancy Model

- **Tenant** = one customer organization (e.g., Acme Foods, Inc.). A tenant may have many sites, users, and devices.
- **`tenantId`** is the primary axis. It travels on every API request, database row, log line, metric, trace, and event. No data structure is tenant-agnostic.
- **Users** belong to one or more tenants via `user_tenant_memberships`. A user may have different roles across tenants.
- **Entitlements** are per-tenant. Each entitlement record specifies which module a tenant has purchased, its status (`active` | `suspended` | `expired`), and its expiry timestamp. Customers buy modules à la carte.
- **Entitlement expiry is enforced at query time** — every API route that reads entitlements filters server-side: `status = 'active' AND (expires_at IS NULL OR expires_at > now())`. The `status` field alone is not sufficient; query-time expiry filtering is mandatory on every entitlement access path. There is no reliance on a background job to flip status before the query runs.
- **Authentication is deferred.** No identity provider is wired at this time. The entitlement model and `tenantId` scaffolding are built now so auth can be added without structural rework. All endpoints that will require auth enforcement before production are marked `// TODO: auth-gate`.
- **Visibility is computed server-side.** The shell renders only what the platform API says a tenant is entitled to. The client is never the source of truth for access.

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
  "minRequiredRole": "technician",
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
| 5 | FSMA traceability requirements per module | SME review | Yes — affects data model per module |
| 6 | Admin endpoint pre-auth shared secret | Engineering | Yes — before any public deployment of the platform API |
| 7 | `minRequiredRole` server-side enforcement | Engineering | No for v1 (display only); Yes before auth is wired |
