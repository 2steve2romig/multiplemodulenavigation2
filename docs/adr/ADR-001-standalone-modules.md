# ADR-001: Standalone Modules from the Start

| Field | Value |
|---|---|
| **Date** | 2026-06-23 |
| **Status** | Accepted |
| **Deciders** | sromig@hygiena.com |
| **Overrides** | Engineering Constitution §5 default (monolith-first) |

---

## Context

The Engineering Constitution defaults to a modular monolith — one Node.js backend, one Supabase project — with individual modules graduating to standalone deployments when they earn the operational cost. This decision record records a deliberate departure from that default.

SureTrend is sold as an à la carte suite. Customers contract and pay for individual IQ modules independently. Each module has distinct data (ATP results vs. floor maps vs. supplier records), distinct compliance requirements, and potentially distinct data residency needs. The business anticipates handing off individual modules to dedicated engineering teams as the suite grows.

---

## Decision

Each IQ module will be deployed as a standalone service from the start:
- Its own Node.js API (Vercel serverless functions, separate project)
- Its own Supabase project (separate PostgreSQL instance with RLS)
- Its own Vercel deployment

The Platform/Core service (tenants, users, entitlements, module registry) is a separate standalone service and is the one shared dependency all modules may call.

---

## Alternatives Considered

### Option A: Modular monolith (constitution default)
One Node.js backend, one Supabase project, module code imported as packages. Modules graduate to standalone when they earn it.

- **Pro:** Simpler operations early; lower cost; easier local dev; constitution-recommended default.
- **Con:** Harder to enforce module data ownership boundaries at the code level; graduating a module later is a deployment change but requires careful decoupling discipline throughout; harder to assign modules to separate teams without cross-contamination risk.

### Option B: Standalone modules from the start *(chosen)*
Each module is its own deployment from day one.

- **Pro:** Module data ownership is structurally enforced (separate Supabase projects can't be queried cross-module by accident); easier to assign modules to independent teams; data residency is per-module from the start; matches the à la carte commercial model.
- **Con:** Higher operational overhead earlier; more complex local dev setup; inter-module communication contract must be defined upfront; cold-start latency across multiple Vercel projects.

### Option C: Hybrid — monolith core + standalone for large modules
Core monolith for the first 2–3 modules; standalone for modules with distinct data residency or team requirements.

- **Pro:** Lower early cost; defers complexity.
- **Con:** Creates two architectural patterns in the codebase simultaneously; module graduation boundary is ambiguous; likely to end up as Option B anyway.

---

## Reasoning

The à la carte model and anticipated team structure make standalone isolation the right long-term architecture. Starting standalone avoids the discipline tax of maintaining module isolation inside a monolith, where cross-module database queries are only prevented by convention rather than structure. The operational overhead is real but manageable: Vercel and Supabase both support multiple projects with low marginal cost.

---

## Consequences

- Inter-module communication contract must be defined before any module code is written (Realtime events / webhooks — never direct DB queries).
- The shell must load module manifests dynamically from the Platform API at runtime; the module list cannot be hardcoded.
- Local development requires running multiple services; a `docker-compose` or equivalent dev orchestration setup is needed.
- Cold-start latency across multiple Vercel functions must be managed (warm-up strategies, edge functions where appropriate).
- Each module's Supabase project must have RLS enabled from the moment it is created (per ADR-002).
- Operational cost is higher per module; this is accepted as the cost of structural isolation.
