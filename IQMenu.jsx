// IQMenu
//
// Mega menu of IQ products, anchored to a chevron button next to the Map IQ
// logo in the home hero. Each product is rendered with a coded text+badge
// "logo" (not an image) so it scales and re-tints cleanly. Items can be
// individually toggled on/off.
//
// In dark mode the panel intentionally keeps a near-white surface so the
// colored badges and dark product names retain full contrast — matches the
// user's guidance ("keep on white background... adjust to make sure that
// contrast in menu is able to be seen").

// Workflow stages — drive the "View by workflow" filter in the menu header.
const IQ_WORKFLOWS = [
  { id: "all",        label: "All IQs" },
  { id: "plan",       label: "Plan & Setup" },
  { id: "test",       label: "Test & Monitor" },
  { id: "analyze",    label: "Analyze & Predict" },
  { id: "investigate", label: "Investigate & Correct" },
  { id: "audit",      label: "Audit & Report" }
];

const IQ_PRODUCTS = [
  { id: "map",       name: "Map",       color: "#29ABE2", desc: "Facility Mapping",            workflow: "plan",        current: true },
  { id: "plan",      name: "Plan",      color: "#1F8A3B", desc: "Food Safety Plan Builder",    workflow: "plan" },
  { id: "supplier",  name: "Supplier",  color: "#5C8C25", desc: "Supplier Approval",           workflow: "plan" },

  { id: "sample",    name: "Sample",    color: "#9B2E7D", desc: "Environmental Monitoring AI", workflow: "test" },
  { id: "lab",       name: "Lab",       color: "#B5A678", desc: "Lab Sample & Results Network", workflow: "test" },
  { id: "clean",     name: "Kleanz",    color: "#1B7A8C", desc: "Sanitation Management",       workflow: "test" },

  { id: "risk",      name: "Risk",      color: "#B53636", desc: "Predictive Risk AI",          workflow: "analyze" },
  { id: "benchmark", name: "Benchmark", color: "#1E3D99", desc: "Cross-facility Intelligence", workflow: "analyze" },

  { id: "correct",   name: "Correct",   color: "#6B3FB5", desc: "AI CAPA Advisor",             workflow: "investigate" },
  { id: "recall",    name: "Recall",    color: "#E55520", desc: "Recall Management",           workflow: "investigate" },
  { id: "trace",     name: "Trace",     color: "#D9A823", desc: "FSMA 204 Traceability",       workflow: "investigate" },

  { id: "audit",     name: "Audit",     color: "#1F4FBF", desc: "Audit Report Generator",      workflow: "audit" },
  { id: "report",    name: "Report",    color: "#16A89A", desc: "Executive Reporting",         workflow: "audit" }
];

/* ---------------------------------------------------------------------------
   IQLogo — coded text-mark replacement for the bitmap IQ logos.
   The wordmark is the product name + a colored rounded-square badge with
   "IQ" inside it and a small superscript trademark glyph.
   --------------------------------------------------------------------------- */

function IQLogo({ name, color, size = "md" }) {
  // size: "sm" (menu rows), "md" (default), "lg" (hero)
  return (
    <span className={"iq-logo iq-logo-" + size}>
      <span className="iq-logo-name">{name}</span>
      <span className="iq-logo-badge" style={{ background: color }}>
        <span className="iq-logo-iq">IQ</span>
      </span>
      <span className="iq-logo-tm" aria-hidden="true">TM</span>
    </span>);
}

/* ---------------------------------------------------------------------------
   IQMenuButton — chevron toggle that anchors the mega menu.
   --------------------------------------------------------------------------- */

function IQMenuButton({ open, onToggle }) {
  return (
    <button
      type="button"
      className={"iq-menu-btn" + (open ? " open" : "")}
      onClick={onToggle}
      aria-label="Switch IQ product"
      aria-expanded={open}>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>);
}

/* ---------------------------------------------------------------------------
   IQWorkflowFilter — "View by workflow" dropdown in the menu header.
   Lightweight custom-popover (no native <select>) so it can match the panel
   chrome and live inside another open menu without z-index conflicts.
   --------------------------------------------------------------------------- */

function IQWorkflowFilter({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = IQ_WORKFLOWS.find((w) => w.id === value) || IQ_WORKFLOWS[0];

  return (
    <div className={"iq-wf" + (open ? " open" : "")} ref={rootRef}>
      <button
        type="button"
        className="iq-wf-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}>
        <svg className="iq-wf-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h18" />
          <path d="M6 12h12" />
          <path d="M10 19h4" />
        </svg>
        <span className="iq-wf-label">View by workflow</span>
        <span className="iq-wf-value">{current.label}</span>
        <svg className="iq-wf-chev" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="iq-wf-pop" role="listbox" aria-label="Workflow">
          {IQ_WORKFLOWS.map((w) => {
            const isSel = w.id === value;
            return (
              <button
                key={w.id}
                type="button"
                role="option"
                aria-selected={isSel}
                className={"iq-wf-opt" + (isSel ? " selected" : "")}
                onClick={() => { onChange(w.id); setOpen(false); }}>
                <span className="iq-wf-opt-dot" aria-hidden="true" />
                <span className="iq-wf-opt-label">{w.label}</span>
                {isSel ? (
                  <svg className="iq-wf-opt-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                ) : null}
              </button>);
          })}
        </div>
      ) : null}
    </div>);
}

/* ---------------------------------------------------------------------------
   IQMegaMenu — anchored panel of all IQ products. Each card is individually
   selectable; selected cards get a check overlay + accent ring.
   --------------------------------------------------------------------------- */

function IQMegaMenu({ open, onClose, selected, onSelect }) {
  const panelRef = React.useRef(null);
  const itemRefs = React.useRef({});
  const pendingFlipRef = React.useRef(null);
  const [workflow, setWorkflow] = React.useState("all");

  // Close on outside click + Esc
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Don't close if user clicked the toggle button itself — let the
        // button's own onClick handle it.
        if (e.target.closest && e.target.closest(".iq-menu-btn")) return;
        onClose();
      }
    };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // FLIP reshuffle — capture positions BEFORE workflow changes, animate AFTER.
  // We render ALL products always so the panel size stays constant; matching
  // items get order:0 (top of grid), the rest order:1 (faded out, behind).
  const handleWorkflowChange = React.useCallback((newW) => {
    const snap = {};
    IQ_PRODUCTS.forEach((p) => {
      const el = itemRefs.current[p.id];
      if (el) snap[p.id] = el.getBoundingClientRect();
    });
    pendingFlipRef.current = snap;
    setWorkflow(newW);
  }, []);

  React.useLayoutEffect(() => {
    const old = pendingFlipRef.current;
    if (!old) return;
    pendingFlipRef.current = null;

    IQ_PRODUCTS.forEach((p, idx) => {
      const el = itemRefs.current[p.id];
      if (!el || !old[p.id]) return;
      const next = el.getBoundingClientRect();
      const dx = old[p.id].left - next.left;
      const dy = old[p.id].top - next.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      // Stagger slightly by index for an organic flow
      const delay = Math.min(idx * 12, 90);

      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      // Force layout flush so the next assignment starts from the offset state
      // eslint-disable-next-line no-unused-expressions
      el.getBoundingClientRect();
      el.style.transition =
        `transform 440ms cubic-bezier(.22,.85,.28,1) ${delay}ms,` +
        ` opacity 240ms ease,` +
        ` filter 240ms ease`;
      el.style.transform = "";
    });
  });

  if (!open) return null;

  return (
    <div className="iq-menu-panel" ref={panelRef} role="dialog" aria-label="IQ products">
      <div className="iq-menu-head">
        <div className="iq-menu-head-left">
          <div className="iq-menu-title">IQ Suite</div>
          <div className="iq-menu-sub">Switch to another IQ product</div>
        </div>
      </div>

      <div className="iq-menu-tabs" role="tablist">
        {IQ_WORKFLOWS.map((w) => {
          const count = w.id === "all"
            ? IQ_PRODUCTS.length
            : IQ_PRODUCTS.filter((p) => p.workflow === w.id).length;
          return (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={workflow === w.id}
              className={"iq-menu-tab" + (workflow === w.id ? " is-active" : "")}
              onClick={() => handleWorkflowChange(w.id)}>
              {w.label}
              <span className="iq-menu-tab-count">{count}</span>
            </button>);
        })}
      </div>

      <div className="iq-menu-grid">
        {IQ_PRODUCTS.map((p) => {
          const isSel = selected === p.id;
          const isMatch = workflow === "all" || p.workflow === workflow;
          return (
            <button
              key={p.id}
              ref={(el) => { itemRefs.current[p.id] = el; }}
              type="button"
              className={
                "iq-menu-item" +
                (isSel ? " selected" : "") +
                (p.current ? " is-current" : "") +
                (isMatch ? "" : " is-dim")
              }
              onClick={() => { if (isMatch) onSelect(p.id); }}
              style={{ "--iq-accent": p.color, order: isMatch ? 0 : 1 }}
              aria-hidden={!isMatch}
              tabIndex={isMatch ? 0 : -1}>
              <IQLogo name={p.name} color={p.color} size="sm" />
              <span className="iq-menu-item-desc">{p.desc}</span>
              {p.current ? <span className="iq-menu-item-pill">Current</span> : null}
            </button>);
        })}
      </div>
    </div>);
}

window.IQ_PRODUCTS = IQ_PRODUCTS;
window.IQ_WORKFLOWS = IQ_WORKFLOWS;
window.IQLogo = IQLogo;
window.IQMenuButton = IQMenuButton;
window.IQMegaMenu = IQMegaMenu;
window.IQWorkflowFilter = IQWorkflowFilter;
