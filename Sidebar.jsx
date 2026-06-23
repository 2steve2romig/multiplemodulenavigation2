function Sidebar({ route, onNav, collapsed, onToggleCollapsed }) {
  const [iqOpen, setIqOpen] = React.useState(false);
  const [iqSelected, setIqSelected] = React.useState(null);
  const iqBtnRef = React.useRef(null);

  const items = [
    ["home", "Home", IHome],
    ["import", "Import Data", IDownload],
    ["dashboard", "Dashboard", IDashboard],
    ["results", "Results", IResults],
    ["reports", "Reports", IReports],
    ["sites", "Sites", ISites],
    ["map", "Map", IMap],
    ["audit", "Audit Trail", IAuditTrail],
    ["sampling", "Sampling Plans", ISamplingPlans],
    ["quant", "Quant", IQuant],
    ["kleanz", "KLEANZ", IKleanz],
  ];

  const IChevLeft = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
  const IChevRight = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
  return (
    <aside className={"sidebar" + (collapsed ? " collapsed" : "")}>
      <div
        className="brand"
        onClick={() => onNav("home")}
        role="button"
        tabIndex={0}
        title="Go to Home"
        style={{ cursor: "pointer" }}
      >
        {collapsed ? (
          <img src={RES("assets/suretrend-cloud-logo.png")} alt="SureTrend" className="brand-mini"/>
        ) : (
          <img src={RES("assets/suretrend-cloud-logo.png")} alt="SureTrend Cloud" className="brand-full"/>
        )}
      </div>
      <button
        className="sb-collapse-btn"
        onClick={onToggleCollapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <IChevRight/> : <IChevLeft/>}
      </button>
      <IQLauncherButton
        open={iqOpen}
        onToggle={() => setIqOpen((o) => !o)}
        btnRef={iqBtnRef}
        collapsed={collapsed}
      />
      <div className="sb-iq-sep" aria-hidden="true" />
      <IQLauncherPanel
        open={iqOpen}
        onClose={() => setIqOpen(false)}
        anchorRef={iqBtnRef}
        selected={iqSelected}
        onSelect={(id) => setIqSelected(id)}
        onNav={onNav}
      />
      <nav>
        {items.map(([id, label, Icon]) => (
          <a
            key={id}
            className={route === id ? "active" : ""}
            onClick={() => onNav(id)}
            data-tip={label}
            title={collapsed ? label : undefined}
          >
            <Icon/>
            <span className="sb-label">{label}</span>
          </a>
        ))}
      </nav>
      <div className="foot">
        {collapsed ? (
          <span className="foot-mini">©</span>
        ) : (
          <span>©2026 Hygiena, LLC<br/>One Health Diagnostics™</span>
        )}
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;
