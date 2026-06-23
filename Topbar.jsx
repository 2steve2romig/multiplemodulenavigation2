// Topbar
//
// Top navigation. Adds:
//   • A profile menu (avatar + name) with Settings ▸ submenu, Help, Sign out.
//     Notifications stays as its own bell (with unread dot) since it's used often.
//   • An integrated "Share an idea" entry point.
//      - Compact icon button (lightbulb) sits in the topbar, near the bell — much
//        more discoverable than a floating corner action and consistent with
//        the rest of the toolbar.
//      - Clicking opens a right-side slide-out panel (the existing form, redesigned).
//      - Form is shorter & more conversational: the legal/waiver line is collapsed
//        behind a "Why are we asking?" disclosure, and the questions are grouped.
//
// Everything is self-contained — no external menu lib.

// Import types surfaced in the Quick actions ▸ Import data flyout.
// Order + colors mirror ImportManager.jsx so the two entry points feel like
// one feature. Clicking a row deep-links to that import's wizard.
const IMPORT_TYPES = [
  { id: "plans",              label: "Plans & Locations",  color: "#E8662A" },
  { id: "samples",            label: "Samples",            color: "#2477B3" },
  { id: "users",              label: "Instrument Users",   color: "#1F8A6B" },
  { id: "allergens",          label: "Allergens",          color: "#3B4FA0" },
  { id: "pcr",                label: "PCR Data Upload",     color: "#475569" },
  { id: "external-data",      label: "External Data",      color: "#0E7490" },
  { id: "external-locations", label: "External Locations", color: "#5B6B7B" },
];

function Topbar({ crumb, theme, onToggleTheme, onOpenInbox, onNav, role, onRoleChange, onOpenIQModal }) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(true);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [qaOpen, setQaOpen] = React.useState(false);
  const [qaSubOpen, setQaSubOpen] = React.useState(false);
  const [ideaOpen, setIdeaOpen] = React.useState(false);
  const [roleCollapsed, setRoleCollapsed] = React.useState(() => {
    try { return localStorage.getItem("roleCollapsed") === "1"; } catch (e) { return false; }
  });
  const toggleRoleCollapsed = () => setRoleCollapsed((c) => {
    const next = !c;
    try { localStorage.setItem("roleCollapsed", next ? "1" : "0"); } catch (e) {}
    return next;
  });

  const profileRef = React.useRef(null);
  const notifRef = React.useRef(null);
  const qaRef = React.useRef(null);

  // close menus on outside click / esc
  React.useEffect(() => {
    function onDoc(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (qaRef.current && !qaRef.current.contains(e.target)) {
        setQaOpen(false); setQaSubOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotifOpen(false); setQaOpen(false); setQaSubOpen(false); setIdeaOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const ISun = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
  const IMoon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
  const IBulb = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 22h4"/>
      <path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3v1h6v-1c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z"/>
    </svg>
  );
  const IChevron = ({dir="down"}) => (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{transform: dir === "right" ? "rotate(-90deg)" : "none", transition:"transform .15s"}}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );
  const ICog = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
    </svg>
  );
  const IHelp = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7V14M12 17h.01"/>
    </svg>
  );
  const ILogout = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  );
  const IUser = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/>
    </svg>
  );
  const IShield = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/>
    </svg>
  );

  const IBell2 = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
    </svg>
  );

  const isDark = theme === "dark";

  // Persona — switches with the Admin / Lab Tech toggle on Home.
  const persona = role === "tech"
    ? { initials: "JM", short: "Jordan M.", full: "Jordan Martinez",
        email: "jordan.m@hygiena.com", org: "Hygiena · Lab Technician" }
    : role === "original"
    ? { initials: "DG", short: "Dave G.", full: "Dave Garcia",
        email: "dave.g@hygiena.com", org: "Hygiena · Food Safety Manager" }
    : { initials: "RS", short: "Riley S.", full: "Riley Saunders",
        email: "riley.s@hygiena.com", org: "Hygiena · Site Manager / Owner" };

  // Mock notifications — preview the most important / most recent. Full inbox is
  // reachable via the "View all" footer link, which opens the NotificationsInbox.
  // IDs match SAMPLE_NOTIFICATIONS in NotificationsInbox.jsx so a row click can
  // pre-select the message in the inbox.
  const notifications = [
    { id:"n-2026-05-06-001", title:"Scheduled maintenance — Sun May 10, 02:00–04:00 UTC", time:"2m ago", unread:true, urgency:"urgent", category:"Outage" },
    { id:"n-2026-05-05-014", title:"Action required: 4 instruments missed calibration", time:"1h ago", unread:true, urgency:"high", category:"Issue" },
    { id:"n-2026-05-04-008", title:"Customizable dashboards are here", time:"2d ago", unread:true, urgency:"normal", category:"New feature" },
    { id:"n-2026-05-03-021", title:"3 results out of spec at Site 4 (overnight run)", time:"3d ago", unread:false, urgency:"high", category:"Issue" },
  ];
  const unread = notifications.filter(n => n.unread).length;

  const settingsItems = [
    "Account Management",
    "Alert Management",
    "Instrument Management",
    "Instrument Registration",
    "User Management",
    "User Preferences",
  ];

  return (
    <div className="topbar">
      <div className="crumb"><span>SureTrend</span> / <b>{crumb}</b></div>
      {onRoleChange && (
        <div className="tb-role-wrap">
          {!roleCollapsed && (
            <div className="tb-role" role="tablist" aria-label="Persona (demo)">
              <span className="tb-role-eyebrow" title="Demo persona toggle">DEMO</span>
              {[
                { id: "original", label: "Orig.", title: "Original Concept — Dave G." },
                { id: "tech",     label: "Tech",  title: "Lab Tech — Jordan M." },
                { id: "admin",    label: "Admin", title: "Admin / Owner — Riley S." },
              ].map(it => (
                <button
                  key={it.id}
                  role="tab"
                  aria-selected={role === it.id}
                  title={it.title}
                  className={"tb-role-btn" + (role === it.id ? " is-active" : "")}
                  onClick={() => onRoleChange(it.id)}
                >
                  {it.label}
                </button>
              ))}
            </div>
          )}
          <button
            className={"tb-role-toggle" + (roleCollapsed ? " is-collapsed" : "")}
            onClick={toggleRoleCollapsed}
            title={roleCollapsed ? "Show demo switcher" : "Hide demo switcher"}
            aria-label={roleCollapsed ? "Show demo switcher" : "Hide demo switcher"}
            aria-expanded={!roleCollapsed}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
      )}
      <div className="spacer"/>

      {/* Theme toggle (existing) */}
      <button
        className="theme-toggle"
        onClick={onToggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label="Toggle theme"
      >
        <span className={"tt-track " + (isDark ? "dark" : "light")}>
          <span className="tt-icon sun"><ISun/></span>
          <span className="tt-icon moon"><IMoon/></span>
          <span className="tt-thumb"/>
        </span>
      </button>

      {/* Quick actions */}
      <div className="tb-pop-host" ref={qaRef}>
        <button
          className={"btn btn-ghost btn-sm tb-qa-btn" + (qaOpen ? " is-open" : "")}
          style={{display:"inline-flex",alignItems:"center",gap:6}}
          onClick={() => { setQaOpen(o=>!o); setProfileOpen(false); setNotifOpen(false); }}
          aria-haspopup="menu"
          aria-expanded={qaOpen}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>
          </svg>
          Quick actions
          <IChevron/>
        </button>
        {qaOpen && (
          <div className="tb-pop tb-pop-qa" role="menu">
            {[
              { id:"results", title:"View results",  sub:"See latest test results", bg:"#E5E7EB", fg:"#4B5563",
                icon:(<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3v3h6V3"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/></svg>) },
              { id:"reports", title:"Run a report",  sub:"Analyze your data",       bg:"#7C3AED", fg:"#FFFFFF",
                icon:(<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>) },
              { id:"add",     title:"Import data",   sub:"7 import types",            bg:"#16A34A", fg:"#FFFFFF", hasSub:true,
                icon:(<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>) },
              { id:"sites",   title:"Find a site",   sub:"View site activity",      bg:"#F59E0B", fg:"#FFFFFF",
                icon:(<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>) },
            ].map(it => (
              it.hasSub ? (
                <React.Fragment key={it.id}>
                  <button
                    className={"tb-pop-item tb-qa-item has-sub" + (qaSubOpen ? " open" : "")}
                    onClick={() => setQaSubOpen(o => !o)}
                    aria-haspopup="menu"
                    aria-expanded={qaSubOpen}
                  >
                    <span className="tb-qa-badge" style={{ background: it.bg, color: it.fg }}>{it.icon}</span>
                    <span className="tb-qa-text">
                      <span className="tb-qa-title">{it.title}</span>
                      <span className="tb-qa-sub">{it.sub}</span>
                    </span>
                    <span className="tb-qa-sub-chev">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                    </span>
                  </button>
                  {qaSubOpen && (
                    <div className="tb-qa-submenu" role="menu">
                      {IMPORT_TYPES.map(t => (
                        <button
                          key={t.id}
                          className="tb-qa-sub-item"
                          onClick={() => { setQaOpen(false); setQaSubOpen(false); onNav && onNav("import:" + t.id); }}
                        >
                          <span className="tb-qa-sub-label">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ) : (
                <button
                  key={it.id}
                  className="tb-pop-item tb-qa-item"
                  onClick={() => { setQaOpen(false); onNav && onNav(it.id); }}
                >
                  <span className="tb-qa-badge" style={{ background: it.bg, color: it.fg }}>{it.icon}</span>
                  <span className="tb-qa-text">
                    <span className="tb-qa-title">{it.title}</span>
                    <span className="tb-qa-sub">{it.sub}</span>
                  </span>
                </button>
              )
            ))}
          </div>
        )}
      </div>

      {/* Share an idea — replaces floating lightbulb */}
      <button
        className="tb-icon-btn"
        title="Share Idea"
        aria-label="Share Idea"
        onClick={() => setIdeaOpen(true)}
      >
        <IBulb/>
      </button>

      {/* Notifications */}
      <div className="tb-pop-host" ref={notifRef}>
        <button
          className="tb-icon-btn"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => { setNotifOpen(o=>!o); setProfileOpen(false); }}
        >
          <IBell2/>
          {unread > 0 && <span className="tb-badge">{unread}</span>}
        </button>
        {notifOpen && (
          <div className="tb-pop tb-pop-notif" role="menu">
            <div className="tb-pop-head">
              <span>
                Notifications
                {unread > 0 && <span className="tb-unread-bubble">{unread}</span>}
              </span>
              <button className="tb-pop-link">Mark all read</button>
            </div>
            <div className="tb-pop-list">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={
                    "tb-notif" +
                    (n.unread ? " unread" : "") +
                    (n.urgency === "urgent" ? " is-urgent" : "") +
                    (n.urgency === "high" ? " is-high" : "")
                  }
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={() => { setNotifOpen(false); onOpenInbox && onOpenInbox(n.id); }}
                >
                  <span className={"urg-badge " + n.urgency} title={n.urgency === "urgent" ? "Urgent" : n.urgency === "high" ? "High" : n.urgency === "normal" ? "Normal" : "Low"} aria-label={n.urgency}>
                    {n.urgency === "urgent" ? "!!" : n.urgency === "high" ? "!" : ""}
                  </span>
                  <div className="tb-notif-body">
                    <div className="tb-notif-title">
                      {n.title}
                    </div>
                    <div className="tb-notif-time">{n.category} · {n.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="tb-pop-foot">
              <button
                className="tb-pop-link"
                onClick={() => { setNotifOpen(false); onOpenInbox && onOpenInbox(); }}
              >
                View all →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile menu */}
      <div className="tb-pop-host" ref={profileRef}>
        <button
          className={"user-trigger" + (profileOpen ? " is-open" : "")}
          onClick={() => { setProfileOpen(o=>!o); setNotifOpen(false); }}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
        >
          <span className="avatar">{persona.initials}</span>
          <span className="user-name">{persona.short}</span>
          <IChevron/>
        </button>

        {profileOpen && (
          <div className="tb-pop tb-pop-profile" role="menu">
            <div className="tb-profile-head">
              <span className="avatar lg">{persona.initials}</span>
              <div className="tb-profile-id">
                <div className="tb-profile-name">{persona.full}</div>
                <div className="tb-profile-meta">{persona.email}</div>
                <div className="tb-profile-org">{persona.org}</div>
              </div>
            </div>

            <div className="tb-pop-sep"/>

            <button
              className={"tb-pop-item has-sub" + (settingsOpen ? " active" : "")}
              onClick={() => setSettingsOpen(o=>!o)}
            >
              <ICog/> <span>Settings</span>
              <span className="tb-pop-spacer"/>
              <IChevron dir={settingsOpen ? "down" : "right"}/>
            </button>
            {settingsOpen && (
              <div className="tb-pop-sub">
                {settingsItems.map(it => (
                  <button key={it} className="tb-pop-item sub">{it}</button>
                ))}
                <div className="tb-sub-group">IQ Suite</div>
                <button
                  className="tb-pop-item sub"
                  onClick={() => { setProfileOpen(false); onOpenIQModal && onOpenIQModal("subs"); }}
                >
                  Module Subscription Management
                </button>
                <button
                  className="tb-pop-item sub"
                  onClick={() => { setProfileOpen(false); onOpenIQModal && onOpenIQModal("access"); }}
                >
                  Module Access Management
                </button>
              </div>
            )}

            <button className="tb-pop-item">
              <IUser/> <span>My profile</span>
            </button>
            <button className="tb-pop-item">
              <IHelp/> <span>Help & documentation</span>
            </button>
            <button className="tb-pop-item" onClick={() => setIdeaOpen(true)}>
              <IBulb/> <span>Share an idea</span>
            </button>

            <div className="tb-pop-sep"/>

            <button className="tb-pop-item danger">
              <ILogout/> <span>Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* Slide-out: Share an Idea */}
      {ideaOpen && <IdeaPanel onClose={() => setIdeaOpen(false)}/>}
    </div>
  );
}

// ----- Slide-out panel ----------------------------------------------------

function IdeaPanel({ onClose }) {
  const [openToTalk, setOpenToTalk] = React.useState(null);
  const [type, setType] = React.useState("");
  const [scope, setScope] = React.useState("");
  const [idea, setIdea] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [showLegal, setShowLegal] = React.useState(false);

  // Lock background scroll while open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const canSubmit = type && scope && idea.trim().length > 4 && audience && openToTalk !== null;

  return (
    <div className="idea-overlay" onClick={onClose}>
      <aside
        className="idea-panel"
        onClick={(e)=>e.stopPropagation()}
        role="dialog"
        aria-label="Share an idea"
      >
        <header className="idea-head">
          <div>
            <div className="idea-eyebrow">Help shape SureTrend</div>
            <h2 className="idea-title">Share an idea</h2>
          </div>
          <button className="idea-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M6 18L18 6"/>
            </svg>
          </button>
        </header>

        <p className="idea-lede">
          Spotted a rough edge or a feature you'd love to see? Tell us what you have in mind —
          our product team reads every submission.
        </p>

        <button className="idea-disclosure" onClick={()=>setShowLegal(s=>!s)}>
          <IChevronSm dir={showLegal ? "down" : "right"}/>
          Why are we asking?
        </button>
        {showLegal && (
          <p className="idea-legal">
            By submitting this form, you agree that you're waiving rights to the
            information contained within and that you'll have no legal claim to
            any product or service ultimately developed.
          </p>
        )}

        <div className="idea-form">
          <Field label="What kind of idea is this?" required>
            <ChipGroup
              value={type}
              onChange={setType}
              options={[
                {v:"feature",     label:"New feature"},
                {v:"improvement", label:"Improve existing"},
                {v:"bug",         label:"Bug or friction"},
                {v:"workflow",    label:"Workflow/usability"},
                {v:"integration", label:"Integration"},
                {v:"other",       label:"Other"},
              ]}
            />
          </Field>

          <Field label="Where does it live?" required>
            <ChipGroup
              value={scope}
              onChange={setScope}
              options={[
                {v:"results",     label:"Results"},
                {v:"dashboard",   label:"Dashboard"},
                {v:"reports",     label:"Reports"},
                {v:"sites",       label:"Sites"},
                {v:"instruments", label:"Instruments"},
                {v:"general",     label:"General / not sure"},
              ]}
            />
          </Field>

          <Field label="Tell us about it" required hint="What's the problem, who hits it, what would great look like?">
            <textarea
              className="idea-textarea"
              rows={5}
              placeholder="e.g. When I review overnight runs I have to filter by site every morning. I'd love to save my filters as a preset I can pin to the sidebar..."
              value={idea}
              onChange={e=>setIdea(e.target.value)}
            />
            <div className="idea-charcount">{idea.length} chars</div>
          </Field>

          <Field label="Attach a screenshot or sketch" hint="Optional — a rough drawing helps a lot.">
            <div className="idea-drop">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <path d="M7 10l5-5 5 5M12 5v12"/>
              </svg>
              <div>
                <div className="idea-drop-title">Drag files here</div>
                <div className="idea-drop-sub">or <span className="idea-link">browse</span> · PNG, JPG, PDF up to 10MB</div>
              </div>
            </div>
          </Field>

          <div className="idea-row">
            <Field label="Could other customers use this?" required compact>
              <ChipGroup
                value={audience}
                onChange={setAudience}
                options={[
                  {v:"yes",    label:"Yes"},
                  {v:"maybe",  label:"Maybe"},
                  {v:"no",     label:"Just me"},
                ]}
              />
            </Field>

            <Field label="OK if the team follows up?" required compact>
              <ChipGroup
                value={openToTalk === null ? "" : openToTalk ? "yes" : "no"}
                onChange={(v)=>setOpenToTalk(v === "yes")}
                options={[{v:"yes", label:"Yes"}, {v:"no", label:"No"}]}
              />
            </Field>
          </div>
        </div>

        <footer className="idea-foot">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button
            className={"btn btn-primary btn-sm" + (canSubmit ? "" : " is-disabled")}
            disabled={!canSubmit}
          >
            Send idea
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Field({ label, required, hint, compact, children }) {
  return (
    <label className={"idea-field" + (compact ? " compact" : "")}>
      <div className="idea-label">
        {label}{required && <span className="idea-req">*</span>}
      </div>
      {children}
      {hint && <div className="idea-hint">{hint}</div>}
    </label>
  );
}

function ChipGroup({ value, onChange, options }) {
  return (
    <div className="idea-chips">
      {options.map(o => (
        <button
          key={o.v}
          type="button"
          className={"idea-chip" + (value === o.v ? " sel" : "")}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const IChevronSm = ({dir}) => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    style={{transform: dir === "right" ? "rotate(-90deg)" : "none", transition:"transform .15s", marginRight:6}}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

window.Topbar = Topbar;
