# ADR-005: Module Manifest Schema

| Field | Value |
|---|---|
| **Date** | 2026-06-23 |
| **Status** | Accepted |
| **Deciders** | sromig@hygiena.com |
| **Source** | Derived from prototype `iq-catalog.js` |

---

## Context

The Engineering Constitution (§5) requires that each module be self-describing via one manifest. The shell assembles its registry from manifests. A module is defined in one place — never scattered across registry, nav, colors, and icons separately.

The prototype's `iq-catalog.js` already contains the seed data for 14 IQ modules. This ADR formalizes the manifest schema that the production Platform API will serve and that every current and future module must implement.

---

## Decision

**Each IQ module ships one manifest JSON. The Platform API stores manifests in the `module_manifests` table and serves them via `GET /api/modules?tenantId=`, filtered to only the modules that tenant is entitled to.**

### Canonical Manifest Schema

```typescript
// TypeScript interface for documentation purposes
interface ModuleManifest {
  // Identity
  id: string;                  // Stable, lowercase, hyphenated: "atp", "iq-map"
  version: string;             // Semver: "1.0.0"

  // Display
  displayName: string;         // User-facing name: "ATP IQ"
  description: string;         // One-sentence description
  icon: string;                // URL path to icon image
  color: string;               // Brand hex color: "#29ABE2"

  // Routing
  baseRoute: string;           // Shell route prefix: "/iq/atp"
  serviceUrl: string;          // Module's own deployment URL: "https://atp.suretrend.app"

  // Access
  minRequiredRole: "viewer" | "technician" | "supervisor" | "admin";
  pricingLabel: string;        // Display only: "$X/mo" — not used for billing logic

  // Localization
  supportedLocales: string[];  // BCP 47 locale codes: ["en-US"]

  // Navigation — items the shell renders in the sidebar when this module is active
  nav: Array<{
    label: string;             // Locale key (resolved via i18n) or en-US string
    path: string;              // Absolute path within the shell router
    icon?: string;             // Optional nav item icon URL
  }>;

  // Workflow metadata (for filtering/search in IQ launcher)
  workflowStages: Array<"plan" | "test" | "analyze" | "investigate" | "audit">;
  category: string;            // e.g. "Environmental", "Food Safety", "Analytics"
}
```

### Database Schema (`module_manifests` table)

```sql
CREATE TABLE module_manifests (
  id           text PRIMARY KEY,          -- module id, e.g. "atp"
  manifest     jsonb NOT NULL,            -- full manifest JSON
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
-- Note: module_manifests is NOT tenant-scoped (manifests are global)
-- Entitlement filtering happens at the API layer, not in this table
-- RLS: public read of active manifests; admin-only write
```

---

## Alternatives Considered

### Option A: Hardcoded module list in the shell
The React shell imports a static array of module definitions.

- **Pro:** Simplest — no API call needed to build the nav.
- **Con:** Adding a module requires a shell code change and redeploy; the shell is coupled to the module list; entitlement filtering must happen client-side (violates constitution §3: visibility computed server-side). Rejected.

### Option B: Separate registry microservice
A dedicated "module registry" service separate from the Platform/Core API.

- **Pro:** Clean separation of concerns.
- **Con:** Unnecessary complexity for v1; the Platform API already owns module entitlements — co-locating manifest serving there is natural and avoids a fifth service for essentially a JSON lookup. Can be extracted later if the registry grows complex.

### Option C: Manifests served from the Platform API *(chosen)*
`module_manifests` table in the Platform Supabase project. Platform API serves manifests, filtered by entitlement, via `GET /api/modules?tenantId=`.

- **Pro:** Single source of truth; server-side entitlement filtering; no shell coupling to module list; new modules registered by inserting a manifest row — no shell redeploy required.
- **Con:** Shell has a startup API call dependency; mitigated by caching the manifest list in sessionStorage with a short TTL.

---

## Reasoning

The manifest pattern is the core mechanism that makes the suite modular. Getting it right now — one definition per module, served from the server, filtered by entitlement — is the foundation everything else builds on. The prototype's `iq-catalog.js` already proves the data model; this ADR just formalizes it as a database-backed API.

---

## Consequences

- Every IQ module (current and future) must supply a manifest conforming to this schema before it can be onboarded.
- The shell's sidebar nav, route table, and IQ launcher are all built from the API-returned manifest list at runtime.
- A module that is not in the manifest list for a tenant simply doesn't appear in the shell — no special "hide this" logic needed.
- Manifest updates (new nav items, version bumps) take effect on the next shell load without a shell redeploy.
- The prototype's `iq-catalog.js` will be converted to a database seed file (`supabase/seed.sql` or equivalent) that populates `module_manifests` for all 14 existing IQ products.
- Breaking changes to the manifest schema require a version bump and a migration — the `version` field on each manifest supports this.
