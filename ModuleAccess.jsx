// ModuleAccess
//
// Settings ▸ IQ Suite ▸ Module Access Management.
// Controls which site + role combinations can use each module.
// UX notes vs. the reference (which stacked every module's full matrix in one
// long scroll):
//   • Master–detail. A left rail lists modules with a granted/total count; the
//     right pane shows just the selected module's site × role matrix.
//   • Bulk affordances: tap a role column header or a site row label to flip
//     the whole column/row; "Grant all / Revoke all" act on the module.
//   • Only subscribed modules are listed (access for an unsubscribed app is moot).

function ModuleAccess({ open, onClose }) {
  const subscribed = React.useMemo(
    () => window.IQ_CATALOG.filter((p) => p.defaultOn),
    []
  );
  const sites = window.IQ_SITES;
  const roles = window.IQ_ROLES;

  // access[moduleId] = boolean[siteIdx][roleIdx]
  const initial = React.useMemo(() => {
    const m = {};
    subscribed.forEach((p) => {
      m[p.id] = sites.map(() => roles.map(() => true));
    });
    return m;
  }, [subscribed, sites, roles]);

  const [access, setAccess] = React.useState(initial);
  const [sel, setSel] = React.useState(subscribed[0] ? subscribed[0].id : null);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const grid = access[sel];
  const p = window.IQ_BY_ID[sel];

  const grantedCount = (mid) => {
    const g = access[mid];
    if (!g) return 0;
    let n = 0;
    g.forEach((row) => row.forEach((v) => { if (v) n++; }));
    return n;
  };
  const totalCells = sites.length * roles.length;

  const setCell = (si, ri, val) => {
    setAccess((a) => {
      const next = { ...a, [sel]: a[sel].map((row) => row.slice()) };
      next[sel][si][ri] = val;
      return next;
    });
  };
  const toggleCell = (si, ri) => setCell(si, ri, !grid[si][ri]);

  const toggleRow = (si) => {
    const allOn = grid[si].every(Boolean);
    setAccess((a) => {
      const next = { ...a, [sel]: a[sel].map((row) => row.slice()) };
      next[sel][si] = next[sel][si].map(() => !allOn);
      return next;
    });
  };
  const toggleCol = (ri) => {
    const allOn = grid.every((row) => row[ri]);
    setAccess((a) => {
      const next = { ...a, [sel]: a[sel].map((row) => row.slice()) };
      next[sel].forEach((row) => { row[ri] = !allOn; });
      return next;
    });
  };
  const setAll = (val) => {
    setAccess((a) => ({ ...a, [sel]: a[sel].map((row) => row.map(() => val)) }));
  };

  const query = q.trim().toLowerCase();
  const listed = subscribed.filter((m) =>
    !query || m.name.toLowerCase().includes(query) || m.desc.toLowerCase().includes(query));

  return (
    <div className="iqm-overlay" onMouseDown={onClose}>
      <div className="iqm-modal iqm-access" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Module access management">
        <header className="iqm-head">
          <div>
            <div className="iqm-eyebrow">IQ Suite</div>
            <h2 className="iqm-title">Module Access Management</h2>
          </div>
          <button className="iqm-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
          </button>
        </header>

        <div className="iqa-md">
          {/* Master list */}
          <aside className="iqa-md-list">
            <div className="iqa-md-search">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
              <input placeholder="Search modules" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="iqa-md-scroll">
              {listed.map((m) => {
                const g = grantedCount(m.id);
                return (
                  <button
                    key={m.id}
                    className={"iqa-md-item" + (sel === m.id ? " is-active" : "")}
                    style={{ "--iq": m.color }}
                    onClick={() => setSel(m.id)}
                  >
                    <span className="iqa-md-text">
                      <span className="iqa-md-name">{m.name}<span className="iqa-md-iq">IQ</span></span>
                      <span className="iqa-md-count">{g} of {totalCells} grants</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Detail matrix */}
          <section className="iqa-md-detail" style={{ "--iq": p ? p.color : "#29ABE2" }}>
            <div className="iqa-detail-head">
              <div className="iqa-detail-id">
                <img className="iqa-detail-icon" src={RES("assets/iq-icons/iq-" + sel + ".png")} alt="" aria-hidden="true" draggable="false" />
                <div>
                  <div className="iqa-detail-name">{p.name}<span className="iqa-md-iq">IQ</span></div>
                  <div className="iqa-detail-desc">{p.desc}</div>
                </div>
              </div>
              <div className="iqa-detail-bulk">
                <button className="iqm-btn iqm-btn-ghost sm" onClick={() => setAll(true)}>Grant all</button>
                <button className="iqm-btn iqm-btn-ghost sm" onClick={() => setAll(false)}>Revoke all</button>
              </div>
            </div>

            <p className="iqa-detail-hint">
              Tap a role header or a site name to flip the whole column or row.
            </p>

            <div className="iqa-matrix">
              <table>
                <thead>
                  <tr>
                    <th className="iqa-mx-corner">Site</th>
                    {roles.map((r, ri) => {
                      const allOn = grid.every((row) => row[ri]);
                      return (
                        <th key={r.id}>
                          <button className={"iqa-mx-colbtn" + (allOn ? " all" : "")} onClick={() => toggleCol(ri)}>
                            {r.label}
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site, si) => {
                    const rowAll = grid[si].every(Boolean);
                    return (
                      <tr key={site}>
                        <th className="iqa-mx-site">
                          <button className={"iqa-mx-rowbtn" + (rowAll ? " all" : "")} onClick={() => toggleRow(si)}>
                            {site}
                          </button>
                        </th>
                        {roles.map((r, ri) => {
                          const on = grid[si][ri];
                          return (
                            <td key={r.id}>
                              <button
                                className={"iqa-cell" + (on ? " on" : "")}
                                role="checkbox"
                                aria-checked={on}
                                aria-label={site + " " + r.label + " " + (on ? "granted" : "denied")}
                                onClick={() => toggleCell(si, ri)}
                              >
                                {on ? (
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
                                ) : null}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="iqa-detail-foot">
              <span className="iqa-detail-summary">
                {grantedCount(sel)} of {totalCells} site/role combinations have access to <b>{p.name} IQ</b>.
              </span>
              <button className="iqm-btn iqm-btn-primary" onClick={onClose}>Done</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

window.ModuleAccess = ModuleAccess;
