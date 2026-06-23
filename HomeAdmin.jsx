// HomeAdmin
//
// Owner / multi-site admin persona home. Refactor of the prior Home layout
// per the PRD:
//
//   1. Hero  (rendered by Home.jsx — shared with Lab Tech)
//   2. Portfolio Overview (2/3) + Critical Activity Across Sites (1/3)
//   3. Site Comparison panel — full width (new hero element for admins)
//   4. Anomaly Spotlight + Recall & Outbreak Watch
//   5. Compliance & Audit Readiness + Team Performance
//   6. Industry News (2/3) + Your Plan (1/3) — reused from base Home
//
// Card chrome (.card / .card-head flush gray strip) is reused so this
// blends seamlessly with everything else in the prototype.

function HomeAdmin({ onNav }) {
  return (
    <>
      <div className="home-row home-row-2-1">
        <PortfolioOverview onNav={onNav} />
        <CriticalActivity onNav={onNav} />
      </div>

      <SiteComparison onNav={onNav} />

      <div className="home-row home-row-1-1">
        <AnomalySpotlight onNav={onNav} />
        <RecallWatch onNav={onNav} />
      </div>

      <div className="home-row home-row-1-1">
        <ComplianceAudit onNav={onNav} />
        <TeamPerformance onNav={onNav} />
      </div>

      <div className="home-row home-row-2-1">
        <WhatsNew onNav={onNav} />
        <YourPlan />
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------------
   Portfolio Overview — same 4 metrics, aggregated across sites
   --------------------------------------------------------------------------- */

function PortfolioOverview({ onNav }) {
  const go = (key) => (e) => { e.preventDefault(); if (onNav) onNav(key); };
  const [period, setPeriod] = React.useState("This year");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(null);
  const periods = ["This year", "Last 90 days", "This quarter", "This month"];

  const tiles = [
    { id: "pass",   label: "Pass rate" },
    { id: "fails",  label: "New failures" },
    { id: "alerts", label: "Open alerts" },
    { id: "plans",  label: "Plans due" },
  ];

  return (
    <section className="card po-card">
      <header className="card-head">
        <div className="po-head-left">
          <h2 className="card-title">Overview</h2>
          <span className="po-sub">across 12 sites</span>
        </div>
        <div className="po-period">
          <button className="po-period-btn" onClick={() => setOpen((o) => !o)}>
            {period}
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {open && (
            <div className="po-period-menu" onMouseLeave={() => setOpen(false)}>
              {periods.map((p) => (
                <button
                  key={p}
                  className={"po-period-opt" + (p === period ? " active" : "")}
                  onClick={() => { setPeriod(p); setOpen(false); }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="card-body">
        {active && (
          <div className="po-filter-strip">
            <span>Filtered to <b>{tiles.find(t => t.id === active).label}</b></span>
            <button className="po-filter-clear" onClick={() => setActive(null)}>Clear ✕</button>
          </div>
        )}
        <div className="po-grid">
          <a href="#" className={"po-stat" + (active === "pass" ? " po-stat-active" : "")}
             onClick={(e) => { e.preventDefault(); setActive("pass"); }}
             title="Portfolio-weighted pass rate">
            <div className="po-stat-label">Pass rate</div>
            <div className="po-donut">
              <DonutChart pct={87} />
            </div>
            <div className="po-stat-delta delta-up">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              4.2%
            </div>
            <div className="po-stat-sub">portfolio-weighted</div>
          </a>

          <a href="#" className={"po-stat" + (active === "fails" ? " po-stat-active" : "")}
             onClick={(e) => { e.preventDefault(); setActive("fails"); }}
             title="View new failures">
            <div className="po-stat-label">New failures</div>
            <div className="po-icon-bare">
              <svg viewBox="0 0 40 40" width="56" height="56" fill="none" stroke="#EF4444" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="20" cy="20" r="15" strokeWidth="1.3" />
                <path d="M15 15l10 10M25 15l-10 10" strokeWidth="1.3" />
              </svg>
            </div>
            <div className="po-stat-num">34</div>
            <div className="po-stat-delta delta-warn">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              7
            </div>
            <div className="po-stat-sub">across 5 sites today</div>
          </a>

          <a href="#" className="po-stat"
             onClick={go("alerts")}
             title="View open alerts">
            <div className="po-stat-label">Open alerts</div>
            <div className="po-icon-bare">
              <svg viewBox="0 0 40 40" width="56" height="56" fill="none" stroke="#F59E0B" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="20" cy="20" r="15" strokeWidth="1.3" />
                <path d="M15 22c0-3.4 0-5.1.65-6.43A6 6 0 0 1 18.6 12.6c1.07-.5 1.5-.5 1.4-.5s.33 0 1.4.5a6 6 0 0 1 2.95 2.97C25 17.4 25 19.1 25 22" strokeWidth="1.2" />
                <path d="M14.5 22h11" strokeWidth="1.2" />
                <path d="M18.7 25a1.5 1.5 0 0 0 2.6 0" strokeWidth="1.2" />
              </svg>
            </div>
            <div className="po-stat-num">23</div>
            <span className="po-stat-link delta-warn-text">8 overdue</span>
            <div className="po-stat-sub po-stat-sub-spacer">&nbsp;</div>
          </a>

          <a href="#" className={"po-stat" + (active === "plans" ? " po-stat-active" : "")}
             onClick={(e) => { e.preventDefault(); setActive("plans"); }}
             title="View plans due">
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
            <div className="po-stat-num"><span>92</span> <span className="po-stat-of">of 134</span></div>
            <div className="po-progress">
              <div className="po-progress-fill" style={{ width: "69%" }} />
            </div>
            <span className="po-stat-link">69% complete</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Critical Activity Across Sites — failures / presumptive / audit findings
   --------------------------------------------------------------------------- */

function CriticalActivity({ onNav }) {
  const rows = [
    { id: 1, severity: "critical", site: "Site 3", test: "Salmonella +", note: "Zone 4 · Conveyor", time: "8:40 PM" },
    { id: 2, severity: "high",     site: "Site 2", test: "Listeria presumptive", note: "Cold storage A", time: "6:54 PM" },
    { id: 3, severity: "high",     site: "Dist. Center", test: "ATP > 1000 RLU", note: "Loading dock", time: "5:09 PM" },
    { id: 4, severity: "medium",   site: "Site 1", test: "Audit finding", note: "CCP-3 documentation", time: "2:15 PM" },
  ];

  const badge = {
    critical: { label: "CRIT", cls: "sev-critical" },
    high:     { label: "HIGH", cls: "sev-high" },
    medium:   { label: "MED",  cls: "sev-medium" },
  };

  return (
    <section className="card ca-card">
      <header className="card-head">
        <div>
          <h2 className="card-title">Critical Activity</h2>
          <span className="po-sub">across sites</span>
        </div>
        <a className="card-link" onClick={() => onNav && onNav("results")}>View all →</a>
      </header>
      <div className="card-body ca-body">
        {rows.map((r) => (
          <button key={r.id} className="ca-row" onClick={() => onNav && onNav("results")}>
            <span className={"ca-sev " + badge[r.severity].cls}>{badge[r.severity].label}</span>
            <div className="ca-body-text">
              <div className="ca-line1">
                <span className="ca-site">{r.site}</span>
                <span className="ca-dot">·</span>
                <span className="ca-test">{r.test}</span>
              </div>
              <div className="ca-line2">{r.note} · {r.time}</div>
            </div>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Site Comparison — the new hero element for admins
   --------------------------------------------------------------------------- */

function SiteComparison({ onNav }) {
  const sites = [
    { id: "p1", name: "Site 1",          pass: 94.2, fails: 1, plans: 92, trend: "up",   needsAttention: false },
    { id: "p2", name: "Site 2",          pass: 88.6, fails: 4, plans: 71, trend: "down", needsAttention: true  },
    { id: "p3", name: "Site 3",          pass: 81.1, fails: 9, plans: 58, trend: "down", needsAttention: true  },
    { id: "p4", name: "Site 4",          pass: 95.7, fails: 0, plans: 88, trend: "up",   needsAttention: false },
    { id: "p5", name: "Site 5",          pass: 91.3, fails: 2, plans: 81, trend: "flat", needsAttention: false },
    { id: "dc", name: "Distribution Ctr", pass: 86.4, fails: 5, plans: 64, trend: "down", needsAttention: true  },
  ];

  const [sortKey, setSortKey] = React.useState("attention");
  const sorted = React.useMemo(() => {
    const copy = sites.slice();
    if (sortKey === "attention") return copy.sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention) || a.pass - b.pass);
    if (sortKey === "pass") return copy.sort((a, b) => b.pass - a.pass);
    if (sortKey === "fails") return copy.sort((a, b) => b.fails - a.fails);
    if (sortKey === "plans") return copy.sort((a, b) => a.plans - b.plans);
    return copy;
  }, [sortKey]);

  function SortBtn({ id, children }) {
    return (
      <button
        className={"sc-sort" + (sortKey === id ? " active" : "")}
        onClick={() => setSortKey(id)}>
        {children}
        {sortKey === id && (
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>
    );
  }

  function Trend({ t }) {
    if (t === "up")   return <span className="sc-trend sc-trend-up">▲</span>;
    if (t === "down") return <span className="sc-trend sc-trend-down">▼</span>;
    return <span className="sc-trend sc-trend-flat">—</span>;
  }

  return (
    <section className="card sc-card">
      <header className="card-head">
        <div>
          <h2 className="card-title">Site Comparison</h2>
          <span className="po-sub">which site needs attention this week</span>
        </div>
        <div className="sc-sort-row">
          <span className="sc-sort-label">Sort:</span>
          <SortBtn id="attention">Needs attention</SortBtn>
          <SortBtn id="pass">Pass rate</SortBtn>
          <SortBtn id="fails">Open failures</SortBtn>
          <SortBtn id="plans">Plans on-track</SortBtn>
        </div>
      </header>
      <div className="card-body sc-body">
        <div className="sc-table">
          <div className="sc-row sc-row-head">
            <div>Site</div>
            <div>Pass rate</div>
            <div>Open failures</div>
            <div>Plans on-track</div>
            <div>Trend</div>
            <div></div>
          </div>
          {sorted.map((s) => (
            <button
              key={s.id}
              className={"sc-row sc-row-data" + (s.needsAttention ? " sc-row-attention" : "")}
              onClick={() => onNav && onNav("results")}>
              <div className="sc-site">
                {s.needsAttention && <span className="sc-pin" aria-hidden="true" />}
                <span className="sc-site-name">{s.name}</span>
              </div>
              <div className="sc-pass">
                <span className="sc-pass-num">{s.pass.toFixed(1)}%</span>
                <div className="sc-mini-bar">
                  <div className={"sc-mini-bar-fill " + (s.pass >= 90 ? "good" : s.pass >= 85 ? "warn" : "bad")} style={{ width: s.pass + "%" }} />
                </div>
              </div>
              <div className={"sc-fails" + (s.fails >= 5 ? " sc-fails-bad" : s.fails >= 2 ? " sc-fails-warn" : "")}>
                {s.fails}
              </div>
              <div className="sc-plans">
                <span className="sc-plans-num">{s.plans}%</span>
                <div className="sc-mini-bar">
                  <div className={"sc-mini-bar-fill " + (s.plans >= 80 ? "good" : s.plans >= 65 ? "warn" : "bad")} style={{ width: s.plans + "%" }} />
                </div>
              </div>
              <div><Trend t={s.trend} /></div>
              <div className="sc-chev">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Anomaly Spotlight — ML-driven cross-site patterns
   --------------------------------------------------------------------------- */

function AnomalySpotlight({ onNav }) {
  const items = [
    {
      id: 1, magnitude: "3.0×",
      headline: "Site 3 · Zone 4 Listeria hits",
      detail: "3× normal rate over the past 14 days",
      window: "Detected 2h ago",
    },
    {
      id: 2, magnitude: "↑42%",
      headline: "Distribution Ctr · ATP loading dock",
      detail: "Pattern shift correlating with new cleaning crew shift",
      window: "Detected yesterday",
    },
    {
      id: 3, magnitude: "Cluster",
      headline: "Site 2 · Drain swabs",
      detail: "5 presumptives in drains 1B–3B since May 8",
      window: "Detected 3d ago",
    },
  ];

  return (
    <section className="card an-card">
      <header className="card-head">
        <div className="an-head">
          <span className="an-head-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <h2 className="card-title">Anomaly Spotlight</h2>
          <span className="an-pill">ML</span>
        </div>
        <a className="card-link" onClick={() => onNav && onNav("results")}>View all →</a>
      </header>
      <div className="card-body an-body">
        {items.map((it) => (
          <button key={it.id} className="an-row" onClick={() => onNav && onNav("results")}>
            <span className="an-mag">{it.magnitude}</span>
            <div className="an-row-body">
              <div className="an-headline">{it.headline}</div>
              <div className="an-detail">{it.detail}</div>
              <div className="an-window">{it.window}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Recall & Outbreak Watch — FDA / USDA-FSIS / CDC live feed
   --------------------------------------------------------------------------- */

function RecallWatch({ onNav }) {
  const items = [
    { id: 1, agency: "FDA",       severity: "Class I",  title: "Frozen ready-to-eat meals — listeria",  date: "May 14", related: true },
    { id: 2, agency: "USDA/FSIS", severity: "Class II", title: "Ground turkey — salmonella reading",     date: "May 12", related: false },
    { id: 3, agency: "CDC",       severity: "Outbreak", title: "Multi-state cantaloupe outbreak update", date: "May 10", related: false },
  ];

  return (
    <section className="card rw-card">
      <header className="card-head">
        <div className="an-head">
          <span className="an-head-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l10 18H2L12 3z" />
              <line x1="12" y1="10" x2="12" y2="14" />
              <circle cx="12" cy="17.5" r="0.7" fill="currentColor" />
            </svg>
          </span>
          <h2 className="card-title">Recall & Outbreak Watch</h2>
        </div>
        <a className="card-link" onClick={() => onNav && onNav("news")}>View all →</a>
      </header>
      <div className="card-body rw-body">
        {items.map((it) => (
          <button key={it.id} className="rw-row" onClick={() => onNav && onNav("news")}>
            <div className="rw-row-head">
              <span className={"rw-agency rw-agency-" + it.agency.replace(/[^a-z]/gi, "").toLowerCase()}>{it.agency}</span>
              <span className={"rw-severity rw-sev-" + it.severity.replace(/[^a-z]/gi, "").toLowerCase()}>{it.severity}</span>
              {it.related && <span className="rw-related" title="Matches your portfolio">Related to your sites</span>}
            </div>
            <div className="rw-title">{it.title}</div>
            <div className="rw-date">{it.date}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Compliance & Audit Readiness
   --------------------------------------------------------------------------- */

function ComplianceAudit({ onNav }) {
  const rows = [
    { id: 1, site: "Site 1",       audit: "SQF",   nextAudit: "in 42d",  certExpires: "Sep 12, 2026", overdue: 0, tone: "good" },
    { id: 2, site: "Site 2",       audit: "BRCGS", nextAudit: "in 18d",  certExpires: "Jul 02, 2026", overdue: 3, tone: "warn" },
    { id: 3, site: "Site 3",       audit: "FSSC",  nextAudit: "9d",      certExpires: "Jun 30, 2026", overdue: 7, tone: "bad"  },
    { id: 4, site: "Dist. Center",  audit: "SQF",   nextAudit: "in 64d",  certExpires: "Nov 04, 2026", overdue: 1, tone: "good" },
  ];

  return (
    <section className="card cm-card">
      <header className="card-head">
        <h2 className="card-title">Compliance & Audit Readiness</h2>
        <a className="card-link" onClick={() => onNav && onNav("results")}>View details →</a>
      </header>
      <div className="card-body cm-body">
        <div className="cm-grid cm-grid-head">
          <div>Site</div><div>Standard</div><div>Plans overdue</div><div>Next audit</div><div>Cert expires</div>
        </div>
        {rows.map((r) => (
          <button key={r.id} className="cm-grid cm-grid-row" onClick={() => onNav && onNav("results")}>
            <div className="cm-site">{r.site}</div>
            <div className="cm-std">{r.audit}</div>
            <div>
              <span className={"cm-pill cm-pill-" + r.tone}>{r.overdue}</span>
            </div>
            <div className={"cm-next" + (r.nextAudit.indexOf("in") === -1 ? " cm-next-soon" : "")}>{r.nextAudit}</div>
            <div className="cm-exp">{r.certExpires}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Team Performance summary
   --------------------------------------------------------------------------- */

function TeamPerformance({ onNav }) {
  const topPerformers = [
    { id: 1, name: "Jordan M.", site: "Site 1", samples: 312, pass: 96.2, delta: "+4.1" },
    { id: 2, name: "Avery K.",  site: "Site 4", samples: 286, pass: 95.4, delta: "+2.8" },
    { id: 3, name: "Sam B.",    site: "Site 5", samples: 261, pass: 94.7, delta: "+1.2" },
  ];

  const trends = [
    { id: "p4", site: "Site 4", dir: "up",   note: "+6% pass rate" },
    { id: "p1", site: "Site 1", dir: "up",   note: "+3% samples logged" },
    { id: "p3", site: "Site 3", dir: "down", note: "−5% on-time rate" },
  ];

  return (
    <section className="card tp-card">
      <header className="card-head">
        <h2 className="card-title">Team Performance</h2>
        <a className="card-link" onClick={() => onNav && onNav("results")}>View report →</a>
      </header>
      <div className="card-body tp-body">
        <div className="tp-summary">
          <div className="tp-stat">
            <div className="tp-stat-num">1,847</div>
            <div className="tp-stat-label">samples logged this period</div>
          </div>
        </div>

        <div className="tp-subhead">Top performers</div>
        <div className="tp-list">
          {topPerformers.map((p, i) => (
            <div key={p.id} className="tp-row">
              <span className="tp-rank">{i + 1}</span>
              <span className="tp-avatar">{p.name.split(" ").map(s => s[0]).join("")}</span>
              <div className="tp-row-body">
                <div className="tp-name">{p.name}</div>
                <div className="tp-meta">{p.site} · {p.samples} samples</div>
              </div>
              <div className="tp-row-pass">
                <span className="tp-row-pct">{p.pass}%</span>
                <span className="tp-row-delta">{p.delta}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="tp-subhead">Sites trending</div>
        <div className="tp-trends">
          {trends.map((t) => (
            <div key={t.id} className={"tp-trend tp-trend-" + t.dir}>
              <span className="tp-trend-arrow">{t.dir === "up" ? "▲" : "▼"}</span>
              <span className="tp-trend-site">{t.site}</span>
              <span className="tp-trend-note">{t.note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.HomeAdmin = HomeAdmin;
