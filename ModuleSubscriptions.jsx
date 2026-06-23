// ModuleSubscriptions
//
// Settings ▸ IQ Suite ▸ Module Subscription Management.
// Turn IQ apps on/off and see the resulting monthly cost before committing.
// UX notes vs. the reference:
//   • A sticky summary rail shows the *projected* total and the delta from the
//     current bill, so the price impact of a pending change is always visible.
//   • Toggling is staged — nothing bills until "Apply changes" is pressed;
//     "Discard" reverts to the last applied state. Changed cards are flagged.
//   • Category tabs + search keep a 14-app grid scannable.
//   • Org-inherited modules (p._source === 'org') are locked — managed at the
//     corporate level, not billed to this site, and cannot be toggled off.

function fmtUSD(n) {
  return "$" + n.toLocaleString("en-US");
}

function ModuleSubscriptions({ open, flash, onClose }) {
  // Live applied subscription state comes from the shared store; `draft` holds
  // staged edits until the user presses "Apply changes".
  const applied = useIQSubs();
  const [draft, setDraft] = React.useState(() => window.IQSubs.get());
  const [cat, setCat] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [justApplied, setJustApplied] = React.useState(false);
  const [flashOpen, setFlashOpen] = React.useState(false);
  const wasOpen = React.useRef(false);

  // Re-sync staged edits from the live store each time the modal opens.
  React.useEffect(() => {
    if (open && !wasOpen.current) {
      setDraft(window.IQSubs.get());
      setJustApplied(false);
      setFlashOpen(!!flash);
    }
    wasOpen.current = open;
  }, [open, flash]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (pid) => {
    setJustApplied(false);
    setDraft((d) => ({ ...d, [pid]: !d[pid] }));
  };

  // Org modules are not billed to the site — exclude from cost totals.
  const siteBilled = (p) => p._source !== 'org';

  const sumFor = (state) =>
    window.IQ_CATALOG.reduce((acc, p) => acc + (siteBilled(p) && state[p.id] ? p.price : 0), 0);
  const countFor = (state) =>
    window.IQ_CATALOG.filter((p) => state[p.id]).length;

  const appliedTotal = sumFor(applied);
  const draftTotal = sumFor(draft);
  const delta = draftTotal - appliedTotal;

  // Org modules are always on — exclude from site-managed change diff.
  const added   = window.IQ_CATALOG.filter((p) => siteBilled(p) && draft[p.id] && !applied[p.id]);
  const removed = window.IQ_CATALOG.filter((p) => siteBilled(p) && !draft[p.id] && applied[p.id]);
  const dirty = added.length > 0 || removed.length > 0;

  const query = q.trim().toLowerCase();
  const items = window.IQ_CATALOG.filter((p) => {
    const catOk = cat === "all" || p.category === cat;
    const qOk = !query || p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query);
    return catOk && qOk;
  });

  const apply = () => {
    window.IQSubs.setMany(draft);
    setJustApplied(true);
  };
  const discard = () => { setDraft(window.IQSubs.get()); setJustApplied(false); };

  const flashMod = flash ? window.IQ_BY_ID[flash] : null;

  return (
    <div className="iqm-overlay" onMouseDown={onClose}>
      <div className="iqm-modal iqm-subs" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Module subscription management">
        <header className="iqm-head">
          <div>
            <div className="iqm-eyebrow">IQ Suite</div>
            <h2 className="iqm-title">Module Subscription Management</h2>
          </div>
          <button className="iqm-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
          </button>
        </header>

        <div className="iqm-toolbar">
          <div className="iqm-tabs">
            {window.IQ_CATEGORIES.map((c) => {
              const count = c.id === "all"
                ? window.IQ_CATALOG.length
                : window.IQ_CATALOG.filter((p) => p.category === c.id).length;
              return (
                <button
                  key={c.id}
                  className={"iqm-tab" + (cat === c.id ? " is-active" : "")}
                  onClick={() => setCat(c.id)}
                >{c.label}<span className="iqm-tab-count">{count}</span></button>
              );
            })}
          </div>
        </div>

        {flashOpen && flashMod ? (
          <div className="iqm-flash" role="status">
            <span className="iqm-flash-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
            </span>
            <span className="iqm-flash-text"><b>{flashMod.name} IQ</b> has been turned on and added to your subscription.</span>
            <button className="iqm-flash-close" onClick={() => setFlashOpen(false)} aria-label="Dismiss">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
            </button>
          </div>
        ) : null}

        <div className="iqm-body">
          <div className="iqm-list">
            {items.map((p) => {
              const on = draft[p.id];
              const isOrg = p._source === 'org';
              return (
                <div
                  key={p.id}
                  className={"iqm-row" + (on ? " on" : "") + (isOrg ? " iqm-row-org" : "")}
                  style={{ "--iq": p.color }}
                >
                  <img className="iqm-row-icon" src={RES("assets/iq-icons/iq-" + p.id + ".png")} alt="" aria-hidden="true" draggable="false" />
                  <div className="iqm-row-id">
                    <div className="iqm-row-name">
                      {p.name}<span className="iqm-card-iq">IQ</span>
                      {isOrg ? <span className="iqm-corp-badge">Corporate</span> : null}
                    </div>
                    <div className="iqm-row-desc">{p.desc}</div>
                  </div>
                  {isOrg
                    ? <span className="iqm-row-corp-label">Included in<br/>corporate plan</span>
                    : <span className="iqm-row-price">{fmtUSD(p.price)}<span className="iqm-card-per">/mo</span></span>
                  }
                  <button
                    className={"iqm-switch" + (on ? " on" : "") + (isOrg ? " iqm-switch-locked" : "")}
                    role="switch"
                    aria-checked={on}
                    aria-label={isOrg ? p.name + " IQ — managed by corporate plan" : (on ? "Disable " : "Enable ") + p.name + " IQ"}
                    onClick={() => !isOrg && toggle(p.id)}
                    disabled={isOrg}
                  >
                    <span className="iqm-switch-knob" />
                  </button>
                </div>
              );
            })}
            {items.length === 0 ? <div className="iqm-empty">No modules match your filter.</div> : null}
          </div>

          <aside className="iqm-summary">
            <div className="iqm-sum-label">Projected monthly cost</div>
            <div className="iqm-sum-total">{fmtUSD(draftTotal)}<span className="iqm-sum-per">/mo</span></div>
            <div className="iqm-sum-count">{countFor(draft)} active modules</div>
            <div className="iqm-sum-corp-note">
              Corporate plan modules are billed separately and not included above.
            </div>

            <div className={"iqm-sum-delta" + (delta > 0 ? " up" : delta < 0 ? " down" : " flat")}>
              {delta === 0 ? "No change from current bill"
                : (delta > 0 ? "+" : "−") + fmtUSD(Math.abs(delta)) + "/mo vs. current"}
            </div>

            {dirty ? (
              <div className="iqm-sum-changes">
                {added.length > 0 ? (
                  <div className="iqm-sum-block">
                    <div className="iqm-sum-block-head add">Adding {added.length}</div>
                    {added.map((p) => (
                      <div key={p.id} className="iqm-sum-row"><span>{p.name} IQ</span><span>+{fmtUSD(p.price)}</span></div>
                    ))}
                  </div>
                ) : null}
                {removed.length > 0 ? (
                  <div className="iqm-sum-block">
                    <div className="iqm-sum-block-head rem">Removing {removed.length}</div>
                    {removed.map((p) => (
                      <div key={p.id} className="iqm-sum-row"><span>{p.name} IQ</span><span>−{fmtUSD(p.price)}</span></div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="iqm-sum-empty">
                {justApplied ? "Changes applied. Your subscription is up to date." : "Toggle modules to preview cost changes."}
              </div>
            )}

            <div className="iqm-sum-actions">
              <button className="iqm-btn iqm-btn-ghost" onClick={discard} disabled={!dirty}>Discard</button>
              <button className="iqm-btn iqm-btn-primary" onClick={apply} disabled={!dirty}>Apply changes</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.ModuleSubscriptions = ModuleSubscriptions;
