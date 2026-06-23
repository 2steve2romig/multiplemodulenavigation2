// IQLauncher
//
// Sidebar IQ-Suite launcher. A grid "app launcher" button sits at the very top
// of the left rail (above Home); clicking it opens a panel anchored to the
// right edge of the rail with:
//   • a search box ("Search IQ apps")
//   • category tabs (All IQs / Food Safety / Environmental / Analytics)
//   • a sort control (Featured / A–Z)
//   • a 2-column grid of selectable IQ cards (square IQ badge + name + desc)
//   • a "View all IQ apps" footer link
//
// Cards are selectable but intentionally NOT wired to navigation yet.
// Visual language matches the existing IQMenu / SureTrend chrome.

const IQ_LAUNCHER_ITEMS = [
  { id: "atp",       name: "ATP",       color: "#1B8A7A", desc: "Environmental Monitoring ATP",  cats: ["environmental"] },
  { id: "risk",      name: "Risk",      color: "#B53636", desc: "Predictive Risk AI",            cats: ["analytics"] },
  { id: "map",       name: "Map",       color: "#29ABE2", desc: "Facility Mapping",              cats: ["environmental"] },
  { id: "benchmark", name: "Benchmark", color: "#E07A1E", desc: "Cross-facility Intelligence",   cats: ["analytics"] },
  { id: "plan",      name: "Plan",      color: "#1F8A3B", desc: "Food Safety Plan Builder",      cats: ["foodsafety"] },
  { id: "correct",   name: "Correct",   color: "#6B3FB5", desc: "AI CAPA Advisor",               cats: ["foodsafety"] },
  { id: "supplier",  name: "Supplier",  color: "#5C8C25", desc: "Supplier Approval",             cats: ["foodsafety"] },
  { id: "recall",    name: "Recall",    color: "#E55520", desc: "Recall Management",             cats: ["foodsafety"] },
  { id: "sample",    name: "Sample",    color: "#9B2E7D", desc: "Environmental Monitoring AI",   cats: ["environmental"] },
  { id: "trace",     name: "Trace",     color: "#D9A823", desc: "FSMA 204 Traceability",         cats: ["foodsafety"] },
  { id: "lab",       name: "Lab",       color: "#B5A678", desc: "Lab Sample & Results Network",  cats: ["foodsafety"] },
  { id: "audit",     name: "Audit",     color: "#1F4FBF", desc: "Audit Report Generator",        cats: ["analytics"] },
  { id: "clean",     name: "Kleanz",    color: "#1B7A8C", desc: "Sanitation Management",         cats: ["environmental"] },
  { id: "report",    name: "Report",    color: "#16A89A", desc: "Executive Reporting",           cats: ["analytics"] }
];

const IQ_LAUNCHER_TABS = [
  { id: "all",           label: "All IQs" },
  { id: "foodsafety",    label: "Food Safety" },
  { id: "environmental", label: "Environmental" },
  { id: "analytics",     label: "Analytics" }
];

/* Square IQ badge — white "IQ" wordmark over the product's accent color. */
function IQBadge({ color }) {
  return (
    <span className="iql-badge" style={{ "--iql-accent": color }} aria-hidden="true">
      <span className="iql-badge-iq">IQ</span>
    </span>);
}

/* Launcher rail button (grid of squares). Lives at the top of the sidebar. */
function IQLauncherButton({ open, onToggle, btnRef, collapsed }) {
  return (
    <button
      type="button"
      ref={btnRef}
      className={"sb-iq-launch" + (open ? " open" : "")}
      onClick={onToggle}
      aria-label="IQ Suite"
      aria-expanded={open}
      data-tip="IQ Suite">
      <img src={RES("assets/app-icon.png")} width="20" height="20" alt="" aria-hidden="true" draggable="false" />
      <span className="sb-iq-launch-label">IQ Suite</span>
    </button>);
}

/* The anchored launcher panel. Positioned fixed, flush to the rail's edge. */
function IQLauncherPanel({ open, onClose, anchorRef, selected, onSelect, onNav }) {
  const panelRef = React.useRef(null);
  const wfRef = React.useRef(null);
  const [tab, setTab] = React.useState("all");
  const [tabOpen, setTabOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ top: 88, left: 80 });
  const subs = useIQSubs();

  // Anchor the panel to the right edge of the sidebar, near the launcher.
  const reposition = React.useCallback(() => {
    const btn = anchorRef && anchorRef.current;
    const aside = btn && btn.closest(".sidebar");
    if (!aside) return;
    const ar = aside.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const top = Math.max(12, Math.min(br.top - 6, window.innerHeight - 360));
    setPos({ top, left: ar.right + 10 });
  }, [anchorRef]);

  React.useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const onWin = () => reposition();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, reposition]);

  // Close on outside-click / Esc.
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      if (e.target.closest && e.target.closest(".sb-iq-launch")) return;
      onClose();
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Close the workflow dropdown on outside-click within the panel.
  React.useEffect(() => {
    if (!tabOpen) return;
    const onDoc = (e) => {
      if (wfRef.current && !wfRef.current.contains(e.target)) setTabOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [tabOpen]);

  if (!open) return null;

  let items = IQ_LAUNCHER_ITEMS.filter((it) => {
    return tab === "all" || it.cats.indexOf(tab) !== -1;
  });
  const currentTab = IQ_LAUNCHER_TABS.find((t) => t.id === tab) || IQ_LAUNCHER_TABS[0];

  // Portal to <body> so the panel escapes the sidebar's stacking context
  // (the sidebar is position:sticky, which traps its descendants' z-index).
  return ReactDOM.createPortal((
    <div
      className="iql-panel"
      ref={panelRef}
      role="dialog"
      aria-label="IQ Suite"
      style={{ top: pos.top, left: pos.left }}>

      {/* Header: title + workflow filter */}
      <div className="iql-toolbar">
        <div className="iql-title">IQ Suite</div>
        <div className={"iql-wf" + (tabOpen ? " open" : "")} ref={wfRef}>
          <button
            type="button"
            className="iql-wf-trigger"
            onClick={() => setTabOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={tabOpen}>
            <svg className="iql-wf-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5h18" />
              <path d="M6 12h12" />
              <path d="M10 19h4" />
            </svg>
            <span className="iql-wf-value">{currentTab.label}</span>
            <svg className="iql-wf-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {tabOpen ? (
            <div className="iql-wf-pop" role="listbox" aria-label="Workflow">
              {IQ_LAUNCHER_TABS.map((t) => {
                const isSel = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    className={"iql-wf-opt" + (isSel ? " selected" : "")}
                    onClick={() => { setTab(t.id); setTabOpen(false); }}>
                    <span className="iql-wf-opt-label">{t.label}</span>
                    {isSel ? (
                      <svg className="iql-wf-opt-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l4 4 10-10" />
                      </svg>
                    ) : null}
                  </button>);
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Grid */}
      <div className="iql-grid">
        {items.map((it) => {
          const on = !!subs[it.id];
          return (
            <button
              key={it.id}
              type="button"
              className={"iql-card" + (on ? "" : " not-active")}
              style={{ "--iql-accent": it.color }}
              onClick={() => {
                if (onNav) { onNav(on ? ("iq:" + it.id) : ("learn:" + it.id)); onClose(); }
              }}>
              <span className="iql-iconwrap">
                <img
                  className="iql-icon"
                  src={RES("assets/iq-icons/iq-" + it.id + ".png")}
                  alt=""
                  aria-hidden="true"
                  draggable="false" />
                {on ? null : (
                  <span className="iql-lock" title="Not licensed — view pricing" aria-label="Not licensed">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                  </span>
                )}
              </span>
              <span className="iql-card-body">
                <span className="iql-card-name">{it.name}</span>
                <span className="iql-card-desc">{it.desc}</span>
              </span>
            </button>);
        })}
        {items.length === 0 ? (
          <div className="iql-empty">No IQ apps in this category.</div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="iql-foot">
        <button
          className="iql-foot-link"
          type="button"
          onClick={() => { if (onNav) { onNav("iqsuite"); onClose(); } }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="6" height="6" rx="1.2" />
            <rect x="9" y="5" width="6" height="6" rx="1.2" />
            <rect x="16" y="5" width="6" height="6" rx="1.2" />
            <rect x="2" y="14" width="6" height="6" rx="1.2" />
            <rect x="9" y="14" width="6" height="6" rx="1.2" />
            <rect x="16" y="14" width="6" height="6" rx="1.2" />
          </svg>
          View all IQ apps
        </button>
      </div>
    </div>), document.body);
}

window.IQ_LAUNCHER_ITEMS = IQ_LAUNCHER_ITEMS;
window.IQLauncherButton = IQLauncherButton;
window.IQLauncherPanel = IQLauncherPanel;
