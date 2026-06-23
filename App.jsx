const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "readingStyle": "bar",
  "zebra": false,
  "showHint": true
}/*EDITMODE-END*/;

function App() {
  const tweaks = useTweaks(TWEAK_DEFAULTS);
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
    const map = { map: "home" };
    setRoute(map[id] || id);
  }

  const iqId = typeof route === "string" && route.indexOf("iq:") === 0 ? route.slice(3) : null;
  const learnId = typeof route === "string" && route.indexOf("learn:") === 0 ? route.slice(6) : null;
  const crumb = route === "home" ? "Home"
              : route === "results" ? "Results"
              : route === "news" ? "Food safety news"
              : route === "import" ? "Import data"
              : route === "iqsuite" ? "IQ Suite"
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
