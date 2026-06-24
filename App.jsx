const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "readingStyle": "bar",
  "zebra": false,
  "showHint": true
}/*EDITMODE-END*/;

function App() {
  const tweaks = useTweaks(TWEAK_DEFAULTS);

  // TODO: auth-gate — TENANT_ID comes from window.__TENANT_ID__ (pre-auth placeholder).
  // When auth is wired, derive tenantId from the JWT claim in ADR-006's extractTenantId.
  const [modulesReady, setModulesReady] = React.useState(!window.__TENANT_ID__);

  React.useEffect(() => {
    const tenantId = window.__TENANT_ID__;
    if (!tenantId) return;
    fetch('/api/modules', { headers: { 'x-tenant-id': tenantId } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(({ modules }) => {
        if (modules && modules.length > 0) {
          // Normalize API manifest fields to match what legacy components expect:
          // displayName → name, description → desc, category → cats[]
          const normalized = modules.map(m => ({
            ...m,
            name: m.displayName,
            desc: m.description,
            cats: [m.category],
            // ModuleAccess filters by defaultOn — all entitled modules are active
            defaultOn: true,
            // ModuleSubscriptions uses price as a number; parse from pricingLabel ("$229/mo" → 229)
            price: parseInt((m.pricingLabel || '').replace(/[^0-9]/g, ''), 10) || 0,
          }));
          window.IQ_CATALOG = normalized;
          window.IQ_BY_ID = Object.fromEntries(normalized.map(m => [m.id, m]));
        }
      })
      .catch(() => { /* fall back to iq-catalog.js globals already on window */ })
      .finally(() => setModulesReady(true));
  }, []);

  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem("theme") || "light"; } catch(e) { return "light"; }
  });
  const [navCollapsed, setNavCollapsed] = React.useState(() => {
    try { return localStorage.getItem("nav-collapsed") === "1"; } catch(e) { return false; }
  });
  const [route, setRoute] = React.useState(() => {
    const def = window.__DEFAULT_ROUTE__ || "home";
    try { return localStorage.getItem("route") || def; } catch(e) { return def; }
  });
  const [inboxOpen, setInboxOpen] = React.useState(false);
  const [inboxInitialId, setInboxInitialId] = React.useState(null);
  const [importTarget, setImportTarget] = React.useState(null);
  const [iqModal, setIqModal] = React.useState(null); // "subs" | "access" | null
  const [subsFlash, setSubsFlash] = React.useState(null); // module id just added
  const [role, setRole] = React.useState(() => {
    try { return localStorage.getItem("role") || "admin"; } catch(e) { return "admin"; }
  });

  React.useEffect(() => {
    try { localStorage.setItem("role", role); } catch(e) {}
  }, [role]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch(e) {}
  }, [theme]);
  React.useEffect(() => {
    try { localStorage.setItem("nav-collapsed", navCollapsed ? "1" : "0"); } catch(e) {}
  }, [navCollapsed]);
  React.useEffect(() => {
    try { localStorage.setItem("route", route); } catch(e) {}
  }, [route]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  // Turn a module on from a Learn-more page, then open Module Subscription
  // Management with a confirmation prompt for that module.
  function handleGetModule(id) {
    if (window.IQSubs) window.IQSubs.set(id, true);
    setRoute("iqsuite");
    setSubsFlash(id);
    setIqModal("subs");
  }

  // The quick-action cards on Home use shorthand ids that don't all map
  // directly to sidebar routes — translate before navigating.
  function handleNav(id) {
    if (id === "alerts" || id === "inbox") {
      setInboxInitialId(null);
      setInboxOpen(true);
      return;
    }
    // Import data — "add"/"import" open the Import Manager landing;
    // "import:<type>" deep-links straight to one import's wizard.
    if (id === "add" || id === "import") {
      setImportTarget(null);
      setRoute("import");
      return;
    }
    if (typeof id === "string" && id.indexOf("import:") === 0) {
      setImportTarget(id.slice("import:".length));
      setRoute("import");
      return;
    }
    const map = { map: "home", quant: "iq:quant", kleanz: "iq:kleanz" };
    setRoute(map[id] || id);
  }

  if (!modulesReady) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"var(--text-muted,#888)",fontSize:14}}>Loading modules…</div>;

  const iqId = typeof route === "string" && route.indexOf("iq:") === 0 ? route.slice(3) : null;
  const learnId = typeof route === "string" && route.indexOf("learn:") === 0 ? route.slice(6) : null;
  const crumb = route === "home" ? "Home"
              : route === "results" ? "Results"
              : route === "news" ? "Food safety news"
              : route === "import" ? "Import data"
              : route === "iqsuite" ? "IQ Suite"
              : route === "audit" ? "Audit Trail"
              : route === "dashboard" ? "Dashboard"
              : route === "reports" ? "Reports"
              : route === "sites" ? "Sites"
              : route === "sampling" ? "Sampling Plans"
              : learnId ? (((window.IQ_BY_ID || {})[learnId] || {}).name || "App") + " IQ"
              : iqId ? (((window.IQ_BY_ID || {})[iqId] || {}).name || "App") + " IQ"
              : route.charAt(0).toUpperCase() + route.slice(1);

  return (
    <div className={"app" + (navCollapsed ? " nav-collapsed" : "")} data-route={route}>
      <Sidebar
        route={route}
        onNav={handleNav}
        collapsed={navCollapsed}
        onToggleCollapsed={()=>setNavCollapsed(c => !c)}
      />
      <main className="main">
        <Topbar
          crumb={crumb}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNav={handleNav}
          role={role}
          onRoleChange={route === "home" ? setRole : null}
          onOpenInbox={(id) => { setInboxInitialId(id || null); setInboxOpen(true); }}
          onOpenIQModal={setIqModal}
        />
        {route === "home"
          ? <Home onNav={handleNav} role={role} onRoleChange={setRole}/>
          : route === "news"
          ? <NewsPage onBack={() => setRoute("home")}/>
          : route === "import"
          ? <ImportManager target={importTarget} onConsumeTarget={() => setImportTarget(null)} onClose={() => setRoute("home")}/>
          : route === "iqsuite"
          ? <IQSuiteView onNav={handleNav} onClose={() => setRoute("home")}/>
          : route === "audit"
          ? <AuditPage onBack={() => setRoute("home")}/>
          : route === "dashboard"
          ? <PlaceholderPage title="Dashboard" onBack={() => setRoute("home")}
              description="A unified metrics dashboard showing pass rates, failure trends, open alerts, and site-level performance across your entire portfolio."
              icon={<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>}/>
          : route === "reports"
          ? <PlaceholderPage title="Reports" onBack={() => setRoute("home")}
              description="Generate, schedule, and download compliance and performance reports across sites and time periods."
              icon={<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}/>
          : route === "sites"
          ? <PlaceholderPage title="Sites" onBack={() => setRoute("home")}
              description="Browse and manage all facilities in your organisation — view site status, contact info, entitlements, and recent activity."
              icon={<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}/>
          : route === "sampling"
          ? <PlaceholderPage title="Sampling Plans" onBack={() => setRoute("home")}
              description="Create and manage sampling plans — define schedules, assign sites and zones, and track compliance against planned vs. completed samples."
              icon={<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>}/>
          : learnId
          ? <IQLearn id={learnId} onNav={handleNav} onGet={handleGetModule}/>
          : iqId
          ? <IQAppView id={iqId} onNav={handleNav}/>
          : <ResultsGrid tweaks={tweaks.values}/>}
      </main>

      <ModuleSubscriptions open={iqModal === "subs"} flash={subsFlash} onClose={() => { setIqModal(null); setSubsFlash(null); }}/>
      <ModuleAccess open={iqModal === "access"} onClose={() => setIqModal(null)}/>

      <NotificationsInbox
        open={inboxOpen}
        initialId={inboxInitialId}
        onClose={() => setInboxOpen(false)}
      />

      <AIChat route={route} onNav={handleNav}/>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Layout">
          <TweakRadio label="Density" value={tweaks.values.density} onChange={v=>tweaks.set("density", v)} options={[
            {value:"comfortable", label:"Comfortable"},
            {value:"compact", label:"Compact"},
          ]}/>
          <TweakRadio label="Reading display" value={tweaks.values.readingStyle} onChange={v=>tweaks.set("readingStyle", v)} options={[
            {value:"bar", label:"With threshold bar"},
            {value:"flat", label:"Number only"},
          ]}/>
          <TweakToggle label="Zebra striping" value={tweaks.values.zebra} onChange={v=>tweaks.set("zebra", v)}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
