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

// ── Secret prompt ──────────────────────────────────────────────────────────

function SecretPrompt({ onSubmit }) {
  const [val, setVal] = useState("");
  return (
    <div className="aud-prompt-wrap">
      <div className="aud-prompt-card">
        <div className="aud-prompt-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
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

// ── Main page ──────────────────────────────────────────────────────────────

function AuditPage({ onBack }) {
  const [secret, setSecret]       = useState(window.__ADMIN_SECRET__ || "");
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

  function applyFilters() {
    setPage(1);
    load(secret, 1, eventType, from, to);
  }

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

      {/* Filter bar */}
      <div className="aud-filters">
        <select className="aud-select" value={eventType} onChange={e => { setEventType(e.target.value); setPage(1); }}>
          {EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
        </select>
        <div className="aud-date-pair">
          <label className="aud-label">From</label>
          <input className="aud-date" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} />
        </div>
        <div className="aud-date-pair">
          <label className="aud-label">To</label>
          <input className="aud-date" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setEventType(""); setFrom(""); setTo(""); setPage(1); }}>Clear</button>
      </div>

      {/* Table */}
      {error && <div className="aud-error">{error}</div>}
      {loading && <div className="aud-loading">Loading…</div>}

      {!loading && !error && (
        <div className="aud-table-wrap">
          <table className="aud-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Event</th>
                <th>Resource</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan="5" className="aud-empty">No records match these filters.</td></tr>
              )}
              {rows.map(r => (
                <React.Fragment key={r.id}>
                  <tr
                    className={"aud-row" + (expanded === r.id ? " aud-row-open" : "")}
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                    <td className="aud-ts">{fmt(r.occurred_at)}</td>
                    <td><span className={"aud-actor-badge aud-actor-" + r.actor_type}>{r.actor_type}</span></td>
                    <td className="aud-event">{r.event_type}</td>
                    <td className="aud-resource">{r.resource_type}<span className="aud-resource-id">{r.resource_id ? " · " + r.resource_id.slice(0, 8) + "…" : ""}</span></td>
                    <td className="aud-ip">{r.ip_address || "—"}</td>
                  </tr>
                  {expanded === r.id && (
                    <tr className="aud-detail-row">
                      <td colSpan="5">
                        <div className="aud-detail">
                          <div className="aud-detail-grid">
                            <span className="aud-dk">ID</span><span className="aud-dv">{r.id}</span>
                            <span className="aud-dk">Actor ID</span><span className="aud-dv">{r.actor_id || "—"}</span>
                            <span className="aud-dk">Tenant</span><span className="aud-dv">{r.tenant_id || "—"}</span>
                            <span className="aud-dk">Org</span><span className="aud-dv">{r.org_id || "—"}</span>
                            <span className="aud-dk">Request ID</span><span className="aud-dv">{r.request_id || "—"}</span>
                            <span className="aud-dk">User Agent</span><span className="aud-dv aud-dv-wrap">{r.user_agent || "—"}</span>
                          </div>
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
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_LIMIT && (
        <div className="aud-pager">
          <span className="aud-pager-info">
            Showing {((page - 1) * PAGE_LIMIT) + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total.toLocaleString()}
          </span>
          <div className="aud-pager-btns">
            <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} className={"btn btn-sm" + (p === page ? " btn-primary" : " btn-ghost")} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

window.AuditPage = AuditPage;
