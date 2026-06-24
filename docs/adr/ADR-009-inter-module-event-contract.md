# ADR-009: Inter-Module Event Contract — Webhooks Only

| Field | Value |
|---|---|
| **Date** | 2026-06-24 |
| **Status** | Accepted |
| **Deciders** | sromig@hygiena.com |
| **Triggered by** | Architecture analysis 2026-06-24 — gap in ADR-001 |
| **Applies to** | All current and future IQ module APIs |

---

## Context

ADR-001 states that inter-module communication must use "Realtime events / webhooks — never direct DB queries." The design doc's §f Integration Approach correctly narrows this to webhooks only, but ADR-001 itself was not updated to match. Additionally, neither ADR-001 nor the design doc fully specifies the webhook contract (authentication, retry, idempotency). This ADR closes both gaps.

### Why Supabase Realtime is not an option for cross-module events

Supabase Realtime is scoped to a single Supabase project. The Platform DB and each IQ module DB are separate Supabase projects. A Realtime channel published on the IQ-ATP project is invisible to the Platform project and to any other IQ module project. There is no supported mechanism to subscribe to Realtime events across Supabase projects.

Discovering this at integration time — when the first IQ module attempts to send an event to the Platform — would be a blocking surprise under time pressure. This ADR pre-empts that discovery.

---

## Decision

All cross-module events use **HTTP webhooks**. Supabase Realtime is used only within a single module for real-time client updates (e.g., result streaming within IQ-ATP), never for cross-module or cross-project communication.

### Webhook pattern

```
IQ-Module API  →  POST /api/events  →  Platform API  →  fan-out to subscriber modules
```

1. **Originating module** — when a regulated event occurs (e.g., ATP test result published), the originating module's API sends a POST to the Platform API's event endpoint.
2. **Platform API** (`POST /api/events`) — verifies the HMAC signature, validates the payload schema, persists the event, and fans out to all registered subscriber modules for that event type.
3. **Subscriber modules** — receive a POST webhook from the Platform API; verify the signature; process the event idempotently.

### Payload schema (all events)

```json
{
  "event_id": "uuid",
  "event_type": "atp.result.published",
  "tenant_id": "uuid",
  "org_id": "uuid | null",
  "occurred_at": "ISO-8601 UTC",
  "source_module": "atp",
  "payload": {}
}
```

`tenant_id` is always present and always verified by the receiving module before any processing. `org_id` is nullable (sites without a parent org).

### Authentication between modules

- Each registered module pair (sender → Platform, Platform → subscriber) uses a **shared HMAC-SHA256 secret** stored as a Vercel environment variable (`WEBHOOK_SECRET_<MODULE_ID>`).
- Every webhook POST includes an `X-Webhook-Signature` header: `HMAC-SHA256(secret, raw_body)`.
- The receiver computes the same HMAC and compares with constant-time comparison. Mismatch → 401, no processing.
- Secrets rotate independently per module pair — a compromised IQ-ATP key does not affect IQ-Map.

### Retry and idempotency

- The Platform API retries failed fan-out deliveries: exponential backoff, max 5 attempts, 24-hour deadline.
- All subscriber modules must handle duplicate delivery idempotently. Use `event_id` as the idempotency key — insert-or-ignore in the subscriber's local event log.
- A subscriber returning any non-2xx response triggers a retry. Subscribers must not return 2xx before completing processing.

---

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Supabase Realtime cross-project | Not supported — Realtime is scoped per Supabase project |
| Shared event bus (dedicated message queue: SQS, Pub/Sub, Upstash) | Additional infrastructure dependency; adds cost and ops burden before the pattern is proven; can be adopted later if webhook volume or reliability requirements demand it |
| Direct API calls (module A calls module B's API) | Creates tight coupling between modules; module B must be available for module A to succeed; violates module independence |
| Shared PostgreSQL database for events | Violates ADR-001 data ownership model; would create a shared DB dependency across all modules |

---

## Consequences

- Every IQ module API must implement: outbound HMAC signing, inbound signature verification, `event_id`-based idempotency.
- The Platform API must implement `POST /api/events` with: HMAC verification, payload schema validation, subscriber fan-out, retry queue.
- Each new module requires a `WEBHOOK_SECRET_<MODULE_ID>` environment variable in both the module's Vercel project and the Platform's Vercel project.
- Local development: module-to-platform webhook delivery requires both services running and network-addressable. The `docker-compose` dev orchestration (Open Item #13 in design doc) must wire webhook delivery between local services.
- Supabase Realtime may still be used **within a single module** for pushing events to browser clients (e.g., live result updates in the IQ-ATP UI). This is intra-module and does not conflict with this ADR.
- ADR-001 Consequences updated to reference this ADR.
