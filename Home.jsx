// Home
//
// New SureTrend home screen. Layout, top to bottom:
//   1. Hero banner — "Map IQ" launch promo (left copy, center isometric
//      illustration with 3 glowing pulse dots, right column of 3 feature
//      callouts separated by a thin vertical divider)
//   2. Quick actions — 4 cards (View results / Run a report / Add result /
//      Find a site)
//   3. Program overview (2/3 wide) + Recent activity (1/3 wide)
//   4. What's new in food safety (2/3 wide) + Your plan (1/3 wide)
//
// Visual language matches the existing SureTrend prototype:
//   • Open Sans throughout, no new font stack
//   • Existing SureTrend blue (#29ABE2 / #0D6A99) for primary actions/links
//   • Semantic colors from --st-pass / --st-fail / --st-caution
//   • Dark mode reads from the prototype's --dm-* tokens
//
// Every actionable surface (cards, list rows, links, CTAs) lifts on hover.

function Home({ onNav, role, onRoleChange }) {
  const r = role || "admin";
  return (
    <div className="home-page" data-role={r}>
      <HomeHero />
      <div style={{ padding: "0 24px 8px" }}>
        <RoleToggle role={r} onChange={onRoleChange} />
      </div>
      {r === "tech" ?
      <HomeTech onNav={onNav} /> :
      r === "original" ?
      <OriginalHome onNav={onNav} /> :
      <HomeAdmin onNav={onNav} />
      }
    </div>);

}

// Original Home layout — preserved from before the persona work began.
// Reuses the same building blocks that Admin/Lab Tech don't depend on.
function OriginalHome({ onNav }) {
  return (
    <>
      <div className="home-row home-row-2-1">
        <ProgramOverview onNav={onNav} />
        <RecentActivity onNav={onNav} />
      </div>
      <HomeQuickActions onNav={onNav} />
      {typeof CustomTiles !== "undefined" && <CustomTiles onNav={onNav} />}
      <div className="home-row home-row-2-1">
        <WhatsNew onNav={onNav} />
        <YourPlan />
      </div>
    </>);

}

/* ---------------------------------------------------------------------------
   1. Hero banner
   --------------------------------------------------------------------------- */

function HomeHero() {
  const [minimized, setMinimized] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [selected, setSelected] = React.useState("map");
  const [current, setCurrent] = React.useState(0);

  const slides = ["mapiq", "dashboard"];
  const count = slides.length;
  const go = (i) => setCurrent(((i % count) + count) % count);

  return (
    <section
      className={"hero-card hero-carousel" + (minimized ? " minimized" : "")}
      data-slide={current}>
      
      <button
        className="hero-minimize"
        onClick={() => setMinimized((m) => !m)}
        aria-label={minimized ? "Expand" : "Minimize"}
        title={minimized ? "Expand" : "Minimize"}>
        
        {minimized ?
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" /></svg> :

        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
        }
      </button>

      <div className="hero-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        <MapIQSlide
          active={current === 0}
          menuOpen={menuOpen}
          onMenuToggle={() => setMenuOpen((o) => !o)}
          onMenuClose={() => setMenuOpen(false)}
          selected={selected}
          onSelect={(id) => {setSelected(id);setMenuOpen(false);}} />
        
        <DashboardSlide active={current === 1} />
      </div>

      {!minimized &&
      <div className="hero-dots" role="tablist" aria-label="Featured highlights">
          {slides.map((id, i) =>
        <button
          key={id}
          className={"hero-dot" + (i === current ? " active" : "")}
          onClick={() => go(i)}
          role="tab"
          aria-selected={i === current}
          aria-label={"Show slide " + (i + 1) + " of " + count} />

        )}
        </div>
      }
    </section>);

}

/* Slide 1 — Map IQ launch promo (unchanged content, now a carousel slide) */
function MapIQSlide({ active, menuOpen, onMenuToggle, onMenuClose, selected, onSelect }) {
  return (
    <div className="hero-slide hero-slide-mapiq" aria-hidden={!active}>
      <div className="hero-left">
        <div className="hero-eyebrow">Introducing</div>
        <h1 className="hero-title">
          <span className="hero-title-logo-wrap">
            <img src={RES("assets/MapIQ-Logo.png")} alt="Map IQ" className="hero-title-logo hero-title-logo-light" />
            <img src={RES("assets/MapIQ-Logo-white.png")} alt="Map IQ" className="hero-title-logo hero-title-logo-dark" />
            <IQMenuButton open={menuOpen} onToggle={onMenuToggle} />
            <IQMegaMenu
              open={menuOpen}
              onClose={onMenuClose}
              selected={selected}
              onSelect={onSelect} />
          </span>
        </h1>
        <div className="hero-tagline">A better way to see your facility.</div>
        <p className="hero-copy">
          A faster, more visual way to build, analyze, and share your floor
          plans — with three powerful tools designed to save you clicks and
          surface insight quicker.
        </p>
        <button className="hero-cta">
          Explore Map IQ
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="hero-center">
        <div className="map-iq-stage">
          {/*
            PLACEMENT NOTE — Map IQ hero illustration goes here.
            Prior art tried: assets/facility_new_hero1.png (isometric facility
            floor plan with risk donuts) and facility_new_hero.png.
            Restore by swapping the placeholder below for an <img
            className="map-iq-img map-iq-img-facility" src="..." />.
            Slot: .map-iq-stage, max-width 760px, 3:2 aspect.
          */}
          <MapIQIllustration />
        </div>
      </div>

      <div className="hero-divider" />

      <div className="hero-right">
        <HeroFeature
          color="#0D6A99"
          icon={
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" />
              <path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z" />
            </svg>
          }
          title="Smart mapping"
          desc="Create and edit floor plans faster than ever" />
        
        <HeroFeature
          color="#0D6A99"
          icon={
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="20" x2="6" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="18" y1="20" x2="18" y2="14" />
            </svg>
          }
          title="Risk insights"
          desc="Visualize results and risks right on your map" />
        
        <HeroFeature
          color="#0D6A99"
          icon={
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          }
          title="Easy sharing"
          desc="Share maps and insights with your team instantly" />
        
      </div>
    </div>);

}

/* Slide 2 — New Dashboard launch promo */
function DashboardSlide({ active }) {
  return (
    <div className="hero-slide hero-slide-dashboard" aria-hidden={!active}>
      <div className="hero-left">
        <div className="hero-eyebrow">Introducing</div>
        <h1 className="hero-title hero-title-dashboard">New Dashboard</h1>
        <div className="hero-tagline">A Smarter Way to See Your Data</div>
        <p className="hero-copy">
          The new dashboard is a configurable workspace where users can select
          the analytics tiles most important to their organization, facility,
          or role.
        </p>
        <button className="hero-cta">
          Explore the Dashboard
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="hero-center">
        <div className="dash-stage">
          <img src={RES("assets/dashboard_home.png?v=1")} alt="New dashboard with configurable analytics tiles" className="dash-img" />
        </div>
      </div>

      <div className="hero-divider" />

      <div className="hero-right">
        <HeroFeature
          variant="dashboard"
          icon={
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
          }
          title="Configurable Analytics Workspace"
          desc="Build personalized dashboards using tiles that display charts, KPIs, trends, and analytics relevant to your operation." />
        
        <HeroFeature
          variant="dashboard"
          icon={
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
          title="At-a-Glance Operational Insights"
          desc="Quickly monitor food safety performance, testing activity, failures, trends, and operational changes from a single screen." />
        
        <HeroFeature
          variant="dashboard"
          icon={
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l4-4 3 3 5-6" />
              <circle cx="11" cy="10" r="1.4" fill="currentColor" stroke="none" />
            </svg>
          }
          title="Interactive Drill-Through Analytics"
          desc="Select charts and data points to drill directly into detailed results and investigate trends faster." />
        
      </div>
    </div>);

}

function HeroFeature({ icon, title, desc, variant }) {
  return (
    <div className={"hero-feature" + (variant ? " hero-feature-" + variant : "")}>
      <div className="hero-feature-icon">{icon}</div>
      <div className="hero-feature-body">
        <div className="hero-feature-title">{title}</div>
        <div className="hero-feature-desc">{desc}</div>
      </div>
    </div>);

}

function MapIQIllustration() {
  // Concentric-ring pulse stack matching the reference image — 5 rings of
  // increasing opacity inward, a solid colored disk, and a white pinpoint.
  // `cls` is added to every shape so dark mode can re-tint via CSS.
  function Pulse({ x, y, color, dur }) {
    const stops = [
    { r: 44, op: 0.12 },
    { r: 36, op: 0.20 },
    { r: 28, op: 0.32 },
    { r: 20, op: 0.50 },
    { r: 13, op: 0.85 }];

    return (
      <g transform={`translate(${x} ${y})`}>
        {stops.map((s, i) =>
        <circle key={i} r={s.r} fill={color} opacity={s.op}>
            <animate attributeName="r" values={`${s.r - 2};${s.r + 2};${s.r - 2}`} dur={dur} repeatCount="indefinite" />
          </circle>
        )}
        <circle r="7" fill={color} />
        <circle r="2.4" fill="#FFFFFF" />
      </g>);

  }

  return (
    <svg
      viewBox="0 0 520 360"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className="map-iq-svg"
      aria-hidden="true">
      
      <defs>
        {/* Isometric grid: two overlapping line sets at ±30° */}
        <pattern id="iso-grid-a" width="26" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <line x1="0" y1="0" x2="0" y2="15" className="map-grid-line" />
        </pattern>
        <pattern id="iso-grid-b" width="26" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <line x1="0" y1="0" x2="0" y2="15" className="map-grid-line" />
        </pattern>
      </defs>

      {/* Faint isometric grid background */}
      <rect width="520" height="360" fill="url(#iso-grid-a)" />
      <rect width="520" height="360" fill="url(#iso-grid-b)" />

      {/* Isometric floor plan — thin blue outline, no fill */}
      <g className="map-floor" fill="none" strokeLinejoin="round" strokeLinecap="round" strokeWidth="2">
        {/* Outer L-shape footprint */}
        <path d="M70 195 L70 165 L130 135 L210 178 L270 145 L330 175 L330 145 L420 195 L420 245 L360 280 L300 250 L240 285 L160 245 L100 280 L70 250 Z" />
        {/* Interior partitions */}
        <path d="M70 195 L160 245" opacity="0.55" />
        <path d="M160 245 L160 215 L220 182" opacity="0.55" />
        <path d="M210 178 L210 210" opacity="0.55" />
        <path d="M270 145 L270 175 L330 205" opacity="0.55" />
        <path d="M330 175 L330 205 L300 220" opacity="0.55" />
        <path d="M240 285 L240 250 L300 220" opacity="0.55" />
      </g>

      {/* Pulse markers */}
      <Pulse x="200" y="115" color="#F44336" dur="2.4s" />
      <Pulse x="375" y="170" color="#22C55E" dur="2.8s" />
      <Pulse x="260" y="245" color="#F97316" dur="2.6s" />
    </svg>);

}

/* ---------------------------------------------------------------------------
   2. Quick actions
   --------------------------------------------------------------------------- */

function HomeQuickActions({ onNav }) {
  const items = [
  {
    id: "results",
    title: "View results",
    sub: "See latest test results",
    bg: "#E5E7EB",
    fg: "#4B5563",
    icon:
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <path d="M9 3v3h6V3" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="15" x2="13" y2="15" />
        </svg>

  },
  {
    id: "reports",
    title: "Run a report",
    sub: "Analyze your data",
    bg: "#7C3AED",
    fg: "#FFFFFF",
    icon:
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 17 9 11 13 15 21 7" />
          <polyline points="15 7 21 7 21 13" />
        </svg>

  },
  {
    id: "add",
    title: "Import Data",
    sub: "Upload results",
    bg: "#16A34A",
    fg: "#FFFFFF",
    icon:
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

  },
  {
    id: "sites",
    title: "Find a site",
    sub: "View site activity",
    bg: "#F59E0B",
    fg: "#FFFFFF",
    icon:
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>

  }];

  return (
    <section className="qa-section">
      <div className="home-section-label">Quick actions</div>
      <div className="qa-grid">
        {items.map((it) =>
        <button key={it.id} className="qa-card" onClick={() => onNav && onNav(it.id)}>
            <span className="qa-badge" style={{ background: it.bg, color: it.fg }}>
              {it.icon}
            </span>
            <span className="qa-body">
              <span className="qa-title">{it.title}</span>
              <span className="qa-sub">{it.sub}</span>
            </span>
            <span className="qa-chev">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </section>);

}

/* ---------------------------------------------------------------------------
   3. Program overview
   --------------------------------------------------------------------------- */

function ProgramOverview({ onNav }) {
  const go = (key) => (e) => {e.preventDefault();if (onNav) onNav(key);};
  const [period, setPeriod] = React.useState("This year");
  const [open, setOpen] = React.useState(false);
  const periods = ["This year", "Last 90 days", "This quarter", "This month"];

  return (
    <section className="card po-card">
      <header className="card-head">
        <h2 className="card-title">Overview</h2>
        <div className="po-period">
          <button className="po-period-btn" onClick={() => setOpen((o) => !o)}>
            {period}
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {open &&
          <div className="po-period-menu" onMouseLeave={() => setOpen(false)}>
              {periods.map((p) =>
            <button
              key={p}
              className={"po-period-opt" + (p === period ? " active" : "")}
              onClick={() => {setPeriod(p);setOpen(false);}}>
              {p}</button>
            )}
            </div>
          }
        </div>
      </header>
      <div className="card-body">
      <div className="po-grid">
        <a href="#" className="po-stat" onClick={go("results")} title="View pass rate details">
          <div className="po-stat-label">Pass rate</div>
          <div className="po-donut">
            <DonutChart pct={34} />
          </div>
          <div className="po-stat-delta delta-up">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            4.2%
          </div>
          <div className="po-stat-sub">vs last year</div>
        </a>

        <a href="#" className="po-stat" onClick={go("results")} title="View new failures">
          <div className="po-stat-label">New failures</div>
          <div className="po-icon-bare">
            <svg viewBox="0 0 40 40" width="56" height="56" fill="none" stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="20" cy="20" r="15" strokeWidth="1.3" />
              <path d="M15 15l10 10M25 15l-10 10" strokeWidth="1.3" />
            </svg>
          </div>
          <div className="po-stat-num">12</div>
          <div className="po-stat-delta delta-warn">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            3
          </div>
          <div className="po-stat-sub">since yesterday</div>
        </a>

        <a href="#" className="po-stat" onClick={go("alerts")} title="View open alerts">
          <div className="po-stat-label">Open alerts</div>
          <div className="po-icon-bare">
            <svg viewBox="0 0 40 40" width="56" height="56" fill="none" stroke="#F59E0B" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="20" cy="20" r="15" strokeWidth="1.3" />
              <path d="M15 22c0-3.4 0-5.1.65-6.43A6 6 0 0 1 18.6 12.6c1.07-.5 1.5-.5 1.4-.5s.33 0 1.4.5a6 6 0 0 1 2.95 2.97C25 17.4 25 19.1 25 22" strokeWidth="1.2" />
              <path d="M14.5 22h11" strokeWidth="1.2" />
              <path d="M18.7 25a1.5 1.5 0 0 0 2.6 0" strokeWidth="1.2" />
            </svg>
          </div>
          <div className="po-stat-num">7</div>
          <span className="po-stat-link delta-warn-text">3 overdue</span>
          <div className="po-stat-sub po-stat-sub-spacer">&nbsp;</div>
        </a>

        <a href="#" className="po-stat" onClick={go("plans")} title="View plans due">
          <div className="po-stat-label">Plans due</div>
          <div className="po-icon-bare">
            <svg viewBox="0 0 40 40" width="56" height="56" fill="none" stroke="#29ABE2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="20" cy="20" r="15" strokeWidth="1.3" />
              <rect x="14" y="13" width="12" height="15" rx="1.6" strokeWidth="1.2" />
              <path d="M17 13v-1.2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V13" strokeWidth="1.2" />
              <line x1="17" y1="19" x2="23" y2="19" strokeWidth="1.2" />
              <line x1="17" y1="23" x2="21.5" y2="23" strokeWidth="1.2" />
            </svg>
          </div>
          <div className="po-stat-num"><span>9</span> <span className="po-stat-of">of 13</span></div>
          <div className="po-progress">
            <div className="po-progress-fill" style={{ width: "68%" }} />
          </div>
          <span className="po-stat-link">68% complete</span>
        </a>
      </div>
      </div>
    </section>);

}

function DonutChart({ pct }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const seg = (frac) => frac * c;
  // Animate segments drawing in on mount + number counting up
  const [p, setP] = React.useState(0);
  const [num, setNum] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    const dur = 1100;
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      // easeOutCubic
      const e = 1 - Math.pow(1 - k, 3);
      setP(e);
      setNum(Math.round(pct * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const segs = [
  { color: "#EF4444", frac: 0.22, start: 0 },
  { color: "#F59E0B", frac: 0.14, start: 0.22 },
  { color: "#16A34A", frac: 0.30, start: 0.36 }];

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 120 120" width="120" height="120" className="donut-svg">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="14" />
        {segs.map((s, i) =>
        <circle
          key={i}
          cx="60" cy="60" r={r}
          fill="none" stroke={s.color} strokeWidth="14"
          strokeDasharray={`${seg(s.frac) * p} ${c}`}
          strokeDashoffset={c * 0.25 - seg(s.start) * p}
          transform="rotate(-90 60 60)"
          strokeLinecap="butt" />

        )}
      </svg>
      <div className="donut-center">
        <span className="donut-num">{num}</span>
        <span className="donut-pct">%</span>
      </div>
    </div>);

}

/* ---------------------------------------------------------------------------
   4. Recent activity
   --------------------------------------------------------------------------- */

function RecentActivity({ onNav }) {
  const rows = [
  { id: 1, status: "fail", site: "Site 3", test: "Salmonella", rlu: "1,338", time: "4/21/2026, 8:40 PM" },
  { id: 2, status: "caution", site: "Distribution Center", test: "ATP", rlu: "1,018", time: "4/21/2026, 8:09 PM" },
  { id: 3, status: "pass", site: "Site 1", test: "Listeria", rlu: "67", time: "4/21/2026, 7:00 PM" },
  { id: 4, status: "caution", site: "Site 2", test: "Allergen (Peanut)", rlu: "929", time: "4/21/2026, 6:54 PM" }];

  return (
    <section className="card ra-card">
      <header className="card-head">
        <h2 className="card-title">Recent activity</h2>
        <a className="card-link" onClick={() => onNav && onNav("results")}>View all</a>
      </header>
      <div className="card-body">
      <div className="ra-list">
        {rows.map((r) =>
          <button key={r.id} className="ra-row" onClick={() => onNav && onNav("results")}>
            <span className={"ra-icon ra-icon-img " + r.status} title={r.status === "fail" ? "Fail" : r.status === "caution" ? "Caution" : "Pass"}>
              <img src={RES("assets/" + r.status + "-icon.png")} alt={r.status} />
            </span>
            <div className="ra-body">
              <div className="ra-site">{r.site}</div>
              <div className="ra-test">{r.test}</div>
            </div>
            <div className="ra-meta">
              <div className="ra-rlu"><b>{r.rlu}</b> RLU</div>
              <div className="ra-time">{r.time}</div>
            </div>
            <span className="ra-chev">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
          )}
      </div>
      </div>
    </section>);

}

/* ---------------------------------------------------------------------------
   5. What's new in food safety
   --------------------------------------------------------------------------- */

function WhatsNew({ onNav }) {
  const items = [
  {
    id: 1, tag: "PRODUCT UPDATE", tagKind: "product",
    title: "SureTrend 5.2: Full lot-level traceability is coming soon",
    desc: "Track every lot from receipt to result with confidence",
    src: "SureTrend Team", date: "May 12, 2026"
  },
  {
    id: 2, tag: "RECALL ALERT", tagKind: "recall",
    title: "FDA issues listeria recall for ready-to-eat meals",
    desc: "Frozen meal products sold nationwide recalled due to possible contamination",
    src: "FDA", date: "May 10, 2026"
  },
  {
    id: 3, tag: "REGULATION UPDATE", tagKind: "regulation",
    title: "FSMA 204 compliance update",
    desc: "New traceability requirements now in effect for high-risk foods",
    src: "Food Safety News", date: "May 8, 2026"
  }];

  return (
    <section className="card wn-card">
      <header className="card-head">
        <h2 className="card-title">Industry News</h2>
        <a className="card-link" onClick={() => onNav && onNav("news")}>View all news</a>
      </header>
      <div className="card-body">
      <div className="wn-grid">
        {items.map((it) =>
          <article key={it.id} className={"wn-item wn-item-" + it.tagKind} onClick={() => onNav && onNav("news")}>
            <div className={"wn-tag wn-tag-" + it.tagKind}>{it.tag}</div>
            <div className="wn-title">{it.title}</div>
            <div className="wn-desc">{it.desc}</div>
            <div className="wn-foot">
              <span>{it.src}</span>
              <span className="wn-dot">•</span>
              <span>{it.date}</span>
            </div>
          </article>
          )}
      </div>
      </div>
    </section>);

}

/* ---------------------------------------------------------------------------
   6. Your plan
   --------------------------------------------------------------------------- */

function YourPlan() {
  const bullets = ["Advanced sampling", "Audit traceability", "Unlimited users", "Priority support"];
  return (
    <section className="card yp-card">
      <span className="yp-pill yp-pill-top">Power plan</span>
      <div className="yp-sparkles" aria-hidden="true">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <g fill="#4FA8D8" opacity="0.85">
            <path d="M50 12 L52 18 L58 20 L52 22 L50 28 L48 22 L42 20 L48 18 Z" />
            <path d="M64 28 L65.5 32 L69.5 33.5 L65.5 35 L64 39 L62.5 35 L58.5 33.5 L62.5 32 Z" />
            <path d="M40 32 L41 35 L44 36 L41 37 L40 40 L39 37 L36 36 L39 35 Z" />
          </g>
        </svg>
      </div>

      <div className="yp-row">
        <div className="yp-left">
          <div className="yp-head">
            <h2 className="card-title">Your plan</h2>
          </div>
          <p className="yp-copy">Unlock advanced sampling, audit traceability and unlimited users.</p>
          <button className="yp-cta">Upgrade to Premium</button>
          <a className="yp-compare">
            Compare plans
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <div className="yp-divider" aria-hidden="true" />
        <ul className="yp-bullets">
          {bullets.map((b) =>
          <li key={b}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l4.5 4.5L19 7" />
              </svg>
              <span>{b}</span>
            </li>
          )}
        </ul>
      </div>
    </section>);

}

window.Home = Home;