# ADR-006: tenantId Extraction Strategy — Middleware Contract

| Field | Value |
|---|---|
| **Date** | 2026-06-23 |
| **Status** | Accepted |
| **Deciders** | sromig@hygiena.com |
| **Prompted by** | Cold review finding H-1 — client-supplied tenantId with no server-side binding |

---

## Context

Every Node.js API route must know the `tenantId` of the caller before touching any data. With auth deferred (ADR-004), there is no JWT from which to derive this — so a temporary mechanism is needed for dev and testing. The cold review correctly identified that if `tenantId` is extracted inline in each route handler from the query string, wiring auth later will require touching every route individually. A centralized middleware slot must exist now so auth drops in cleanly at one location.

---

## Decision

**`tenantId` extraction is centralized in a single `resolveTenant(req)` middleware function. No route handler ever reads `tenantId` directly from `req.query`, `req.body`, or `req.headers`.**

### The middleware contract

```javascript
// platform/middleware/resolveTenant.js

async function resolveTenant(req, res, next) {
  const tenantId = await extractTenantId(req);
  if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
  req.tenantId = tenantId; // attached for route handlers
  next();
}

// extractTenantId is the only function that changes when auth is wired.
async function extractTenantId(req) {
  // POST-AUTH: derive from verified JWT claim — replace this block entirely.
  // TODO: auth-gate — when auth is wired, extract tenantId from
  //   req.auth.tenantId (JWT custom claim), not from the request input.

  // DEV/PRE-AUTH only: trust X-Tenant-ID header (never in production).
  const devHeader = req.headers['x-tenant-id'];
  if (devHeader && process.env.NODE_ENV !== 'production') return devHeader;

  return null; // no tenantId source available — caller gets 400
}
```

### Usage in route handlers

```javascript
// All data-access routes apply resolveTenant middleware:
router.get('/api/entitlements', resolveTenant, async (req, res) => {
  const { tenantId } = req; // always from middleware, never from req.query
  // ...
});
```

### Admin routes

Admin routes (`POST /api/tenants`, `POST /api/entitlements`) require a pre-auth shared secret in addition to the `resolveTenant` middleware:

```javascript
// platform/middleware/requireAdminSecret.js
function requireAdminSecret(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Usage:
router.post('/api/tenants', requireAdminSecret, async (req, res) => { ... });
```

`ADMIN_SECRET` is a Vercel environment variable (server-only, not prefixed `NEXT_PUBLIC_`). This is the pre-auth control for admin endpoints until a real auth provider is wired.

---

## Alternatives Considered

### Option A: tenantId from query string, per-route
Each handler reads `req.query.tenantId` directly.

- **Pro:** Simplest to write initially.
- **Con:** Auth wiring touches every route. No single place to audit tenantId extraction. Rejected — this is the structural mistake the cold review identified.

### Option B: Centralized middleware *(chosen)*
Single `resolveTenant` middleware; `extractTenantId` is the only function that changes when auth lands.

- **Pro:** Auth wiring is a one-function replacement. Every route is guaranteed to have a validated `tenantId`. Easy to audit. Correct.
- **Con:** Slightly more setup. Cost is negligible.

### Option C: Skip tenantId middleware until auth is wired
Defer all tenantId extraction decisions until the auth provider is chosen.

- **Con:** Impossible — code can't be written without knowing how to get `tenantId`. This option doesn't exist.

---

## Reasoning

The cold review correctly identified that scattered inline `req.query.tenantId` reads make auth wiring a multi-file surgical operation. Centralized middleware makes it a single-function replacement. The pre-auth `x-tenant-id` dev header is explicitly dev/test-only (`process.env.NODE_ENV !== 'production'` guard) so it cannot be exploited in production even before auth is wired.

---

## Consequences

- `resolveTenant` middleware is applied to **every** data-access route in the Platform API.
- `requireAdminSecret` middleware is applied to every admin mutation route.
- `ADMIN_SECRET` environment variable must be set in Vercel before the platform API is deployed publicly.
- When auth is wired (ADR-004 / ADR-007), only `extractTenantId` is replaced — no route handlers change.
- The `x-tenant-id` dev header path is removed entirely when auth is wired; it is never available in `NODE_ENV=production`.
- `req.tenantId` is the canonical source of `tenantId` for all route handlers. Any route reading from any other source is a bug.
