# SureTrend Platform — Architecture Design Document

> **Status:** Draft — pending domain/acceptance review (SME: sromig@hygiena.com)  
> **Version:** 1.0  
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
  Cross-module communication: Supabase Realtime events
  or webhooks, namespaced by tenantId. Never direct DB queries.
```

**Key constraints:**
- The Supabase service role key is **server-only** — never exposed to the React client bundle or prefixed `NEXT_PUBLIC_` / `VITE_`.
- The React shell uses only the Supabase **anon key** (if needed for direct Realtime subscriptions) — always with RLS enforcing tenantId.
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
- Cross-module interaction goes through the Platform API or Supabase Realtime events.
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

**Cross-module events**
- Supabase Realtime channels, namespaced: `tenant:{tenantId}:module:{moduleId}:event:{eventType}`
- Alternatively: webhook POST from one module's API to the Platform API, which fans out to subscribers.
- Never: one module's Node.js code calling another module's Supabase DB directly.

---

## g) Globalization

| Concern | Decision |
|---|---|
| Default locale | `en-US` |
| Supported locales (v1) | `en-US` only — bake in the capability, defer additional locales until demanded |
| UI strings | Locale-keyed resource layer; no hardcoded user-facing strings in JSX or Node.js responses |
| Date/time storage | UTC in Supabase; rendered in user's locale and time zone |
| Number/currency formatting | Locale-aware; no hardcoded `$` or unit symbols |
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
