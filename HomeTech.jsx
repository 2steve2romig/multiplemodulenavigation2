// HomeTech
//
// Lab-Tech persona home. Mirrors the wireframe:
//   1. Hero (shared with Admin) — kept above this view by Home.jsx
//   2. My Day (2/3) + My Performance (1/3)
//   3. My Recent Results (2/3) + Inventory + EM Streak stacked (1/3)
//
// Reuses existing card chrome (.card / .card-head with flush gray strip,
// .card-title, .card-link). Lab-tech-specific styles live in home-role.css.

function HomeTech({ onNav }) {
  return (
    <>
      <div className="home-row home-row-2-1">
        <MyDay onNav={onNav} />
        <MyPerformance />
      </div>
      <div className="home-row home-row-2-1">
        <MyRecentResults onNav={onNav} />
        <div className="lt-stack">
          <InventoryCard />
          <EMStreakCard />
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------------------
   My Day — assigned/completed/remaining + Up Next sample plans
   --------------------------------------------------------------------------- */

function MyDay({ onNav }) {
  const [range, setRange] = React.useState("month"); // "day" | "week" | "month"

  const upNext = [
    { id: 1, kind: "atp", title: "Zone 3 — Slicer line", sub: "ATP · 8 sample points", time: "9:30 AM", tone: "normal" },
    { id: 2, kind: "em",  title: "Cold storage A",       sub: "Listeria EM · 12 swabs", time: "11:00 AM", tone: "normal" },
    { id: 3, kind: "retest", title: "Re-test: Drain 4B", sub: "Follow-up to yesterday's positive", time: "Overdue", tone: "overdue" },
  ];

  const weekNeeds = [
    { id: 1, kind: "retest", title: "Re-test: Drain 4B", sub: "Follow-up to Wed's positive", time: "Overdue", tone: "overdue" },
    { id: 2, kind: "em",     title: "Heavy day on Wednesday", sub: "12 samples scheduled · plan accordingly", time: "", tone: "normal" },
  ];

  const monthUpcoming = [
    { id: 1, kind: "em",  title: "Environmental sweep",  sub: "May 22 · 24 sample points", time: "", tone: "normal" },
    { id: 2, kind: "atp", title: "Quarter-end audit prep", sub: "3 sampling plans · due May 31", time: "", tone: "normal" },
  ];

  const headerTitle = "My schedule";

  const stats =
    range === "day"   ? { assigned: 14, completed: 9, remaining: 5, labelAssigned: "Assigned today" } :
    range === "week"  ? { assigned: 52, completed: 28, remaining: 24, labelAssigned: "Assigned this week" } :
                        { assigned: 215, completed: 192, remaining: 23, labelAssigned: "Assigned this month" };

  const renderIcon = (kind) => {
    if (kind === "atp") return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v6.5L4.5 18a3 3 0 0 0 2.6 4.5h9.8A3 3 0 0 0 19.5 18L14 8.5V2" />
        <line x1="10" y1="2" x2="14" y2="2" />
        <line x1="8" y1="14" x2="16" y2="14" />
      </svg>
    );
    if (kind === "em") return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <line x1="9" y1="4" x2="9" y2="20" />
        <line x1="15" y1="4" x2="15" y2="20" />
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
      </svg>
    );
    if (kind === "retest") return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" stroke="none">
        <path d="M12.86 3.55a1 1 0 0 0-1.72 0L1.2 20.5A1 1 0 0 0 2.06 22h19.88a1 1 0 0 0 .86-1.5L12.86 3.55z"/>
        <rect x="11" y="9" width="2" height="6" rx="1" fill="#FFFFFF"/>
        <circle cx="12" cy="17.6" r="1.1" fill="#FFFFFF"/>
      </svg>
    );
    return null;
  };

  const renderRow = (row) => (
    <button
      key={row.id}
      className={"md-row" + (row.tone === "overdue" ? " md-row-overdue" : "")}
      onClick={() => onNav && onNav("results")}>
      <span className={"md-row-icon md-row-icon-" + row.kind}>{renderIcon(row.kind)}</span>
      <div className="md-row-body">
        <div className="md-row-title">{row.title}</div>
        <div className="md-row-sub">{row.sub}</div>
      </div>
      {row.time && (
        <div className={"md-row-time" + (row.tone === "overdue" ? " md-row-time-overdue" : "")}>{row.time}</div>
      )}
    </button>
  );

  // ---- Week view content ----
  const weekDays = [
    { name: "Mon", num: 11, count: "8 samples",  today: false },
    { name: "Tue", num: 12, count: "10 samples", today: false },
    { name: "Wed", num: 13, count: "12 samples", today: false },
    { name: "Thu", num: 14, count: "14 today",   today: true,  dot: true },
    { name: "Fri", num: 15, count: "8 samples",  today: false },
  ];

  // ---- Month heatmap (31 days, Mon–Sun grid; weekends muted) ----
  const intensities = [0,0,1,2,1,0,0, 2,3,2,3,1,0,0, 1,3,4,2,3,0,0, 2,2,3,4,2,0,0, 1,2,3];
  const heatColors = ["#F4F6F9", "#DCE6FF", "#A8C2F4", "#5C8FE1", "#2563EB"];

  return (
    <section className="card md-card">
      <header className="card-head">
        <h2 className="card-title">{headerTitle}</h2>
        <div className="md-range" role="tablist" aria-label="Time range">
          {[
            { id: "day",   label: "Day" },
            { id: "week",  label: "Week" },
            { id: "month", label: "Month" },
          ].map((opt) => (
            <button
              key={opt.id}
              role="tab"
              aria-selected={range === opt.id}
              className={"md-range-btn" + (range === opt.id ? " active" : "")}
              onClick={() => setRange(opt.id)}>
              {opt.label}
            </button>
          ))}
        </div>
      </header>
      <div className="card-body md-body">
        <div className="md-stats">
          <div className="md-stat md-stat-info">
            <div className="md-stat-label">{stats.labelAssigned}</div>
            <div className="md-stat-num md-stat-num-info">{stats.assigned}</div>
          </div>
          <div className="md-stat md-stat-pass">
            <div className="md-stat-label">Completed</div>
            <div className="md-stat-num md-stat-num-pass">{stats.completed}</div>
          </div>
          <div className="md-stat md-stat-warn">
            <div className="md-stat-label">Remaining</div>
            <div className="md-stat-num md-stat-num-warn">{stats.remaining}</div>
          </div>
        </div>

        {range === "day" && (
          <>
            <div className="md-subhead">UP NEXT</div>
            <div className="md-list">{upNext.map(renderRow)}</div>
          </>
        )}

        {range === "week" && (
          <>
            <div className="md-subhead">THIS WEEK AT A GLANCE</div>
            <div className="md-week-grid">
              {weekDays.map((d) => (
                <button
                  key={d.name}
                  className={"md-week-day" + (d.today ? " md-week-today" : "")}
                  onClick={() => onNav && onNav("results")}>
                  <span className="md-week-name">{d.name}</span>
                  <span className="md-week-num">{d.num}</span>
                  <span className="md-week-count">{d.count}</span>
                  {d.dot && <span className="md-week-dot" aria-hidden="true" />}
                </button>
              ))}
            </div>
            <div className="md-subhead">NEEDS ATTENTION</div>
            <div className="md-list">{weekNeeds.map(renderRow)}</div>
          </>
        )}

        {range === "month" && (
          <>
            <div className="md-month-wrap">
              <div className="md-month-col">
                <div className="md-subhead">VOLUME BY DAY</div>
                <div className="md-month-grid">
                  {intensities.map((v, i) => {
                    const day = i + 1;
                    const isToday = day === 15;
                    const isWeekend = (i % 7 === 5) || (i % 7 === 6);
                    const finalIntensity = isWeekend ? 0 : v;
                    return (
                      <div
                        key={day}
                        className={"md-month-cell" + (isWeekend ? " md-month-weekend" : "") + (isToday ? " md-month-today" : "")}
                        style={{ background: heatColors[finalIntensity] }}>
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="md-month-legend">
                  <span>Less</span>
                  <span className="md-month-legend-sw" style={{ background: heatColors[0] }} />
                  <span className="md-month-legend-sw" style={{ background: heatColors[2] }} />
                  <span className="md-month-legend-sw" style={{ background: heatColors[4] }} />
                  <span>More</span>
                </div>
              </div>
              <div className="md-month-col md-month-col-list">
                <div className="md-subhead">UPCOMING THIS MONTH</div>
                <div className="md-list">{monthUpcoming.map(renderRow)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   My Performance — personal pass rate + on-time / samples / avg / streak
   --------------------------------------------------------------------------- */

function MyPerformance() {
  const [period, setPeriod] = React.useState("This month");
  const [open, setOpen] = React.useState(false);
  const periods = ["This week", "This month", "This quarter", "This year"];

  return (
    <section className="card mp-card">
      <header className="card-head">
        <h2 className="card-title">My performance</h2>
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
                  onClick={() => { setPeriod(p); setOpen(false); }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="card-body mp-body">
        <div className="mp-headline">
          <div className="mp-label">Personal pass rate</div>
          <div className="mp-headline-row">
            <span className="mp-pct">92<span className="mp-pct-sym">%</span></span>
            <span className="mp-delta">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              3.1% vs last month
            </span>
          </div>
          <div className="mp-bar">
            <div className="mp-bar-fill" style={{ width: "92%" }} />
          </div>
        </div>

        <div className="mp-mini-grid">
          <MiniStat
            tone="info"
            label="On-time rate"
            value="98%"
            icon={(
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5V12h3.5" />
              </svg>
            )}
          />
          <MiniStat
            tone="violet"
            label="Samples / week"
            value="87"
            icon={(
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7.5" y="2.5" width="9" height="2.4" rx="0.6" />
                <path d="M8.5 4.9v12.6a3.5 3.5 0 0 0 7 0V4.9" />
                <path d="M8.5 13h7" fill="currentColor" stroke="none" opacity="0.35" />
                <path d="M8.5 13h7" />
              </svg>
            )}
          />
          <MiniStat
            tone="teal"
            label="Avg time / sample"
            value="2.4m"
            icon={(
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="14" r="7.5" />
                <path d="M9.5 2.5h5" />
                <path d="M12 2.5v3.5" />
                <path d="M18.4 5.6l1.4-1.4" />
                <path d="M12 14l3 2.5" />
              </svg>
            )}
          />
          <MiniStat
            tone="warn"
            label="Streak"
            value="12 days"
            icon={(
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" stroke="none">
                <path d="M13.5 2c.4 3.2-1.4 4.2-2.8 5.7C9.1 9.5 8 11.2 8 13.5c0 .9.2 1.7.5 2.4-.9-.4-1.8-1.3-2.3-2.4-.1.6-.2 1.2-.2 1.8C6 19.5 8.7 22 12 22s6-2.5 6-5.7c0-3.8-2.3-5.8-3.9-8.1-1-1.5-1.5-3.4-.6-6.2z"/>
              </svg>
            )}
          />
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, icon, tone }) {
  return (
    <div className={"mp-mini" + (tone ? " mp-mini-" + tone : "")}>
      {icon && <div className="mp-mini-icon" aria-hidden="true">{icon}</div>}
      <div className="mp-mini-text">
        <div className="mp-mini-label">{label}</div>
        <div className="mp-mini-val">{value}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   My Recent Results — chronological pass/fail list
   --------------------------------------------------------------------------- */

function MyRecentResults({ onNav }) {
  const rows = [
    { id: 1, status: "pass", site: "Zone 2 — Conveyor", test: "ATP · 42 RLU", time: "8:42 AM" },
    { id: 2, status: "pass", site: "Packaging room", test: "Allergen · Negative", time: "8:15 AM" },
    { id: 3, status: "fail", site: "Drain 4B", test: "Listeria · Presumptive +", time: "Yesterday" },
    { id: 4, status: "pass", site: "Cooler 2 — Door seal", test: "ATP · 18 RLU", time: "Yesterday" },
  ];

  return (
    <section className="card mr-card">
      <header className="card-head">
        <h2 className="card-title">My recent results</h2>
        <a className="card-link" onClick={() => onNav && onNav("results")}>View all →</a>
      </header>
      <div className="card-body mr-body">
        {rows.map((r) => (
          <button key={r.id} className="mr-row" onClick={() => onNav && onNav("results")}>
            <span className={"mr-icon mr-icon-img mr-icon-" + r.status} title={r.status === "pass" ? "Pass" : "Fail"}>
              <img src={RES("assets/" + r.status + "-icon.png")} alt={r.status === "pass" ? "Pass" : "Fail"} />
            </span>
            <div className="mr-body-text">
              <div className="mr-site">{r.site}</div>
              <div className="mr-test">{r.test}</div>
            </div>
            <div className="mr-time">{r.time}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Inventory — supplies on hand
   --------------------------------------------------------------------------- */

function InventoryCard() {
  const items = [
    { name: "ATP swabs", count: 142, pct: 71, tone: "good" },
    { name: "Listeria EM", count: 18, pct: 18, tone: "low", note: "low" },
    { name: "Allergen kits", count: 56, pct: 80, tone: "good" },
  ];
  return (
    <section className="card iv-card">
      <header className="card-head">
        <h2 className="card-title">Inventory</h2>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#6B7280" }}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </header>
      <div className="card-body iv-body">
        {items.map((it) => (
          <div key={it.name} className="iv-row">
            <div className="iv-row-head">
              <span className="iv-name">{it.name}</span>
              <span className={"iv-count" + (it.tone === "low" ? " iv-count-low" : "")}>
                {it.count}{it.note && <span className="iv-note"> — {it.note}</span>}
              </span>
            </div>
            <div className="iv-bar">
              <div className={"iv-bar-fill iv-bar-fill-" + it.tone} style={{ width: it.pct + "%" }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   EM Streak — my zones
   --------------------------------------------------------------------------- */

function EMStreakCard() {
  return (
    <section className="card em-card">
      <header className="card-head">
        <h2 className="card-title">EM streak — my zones</h2>
      </header>
      <div className="card-body em-body">
        <div className="em-text">
          <div className="em-headline">
            <span className="em-num">47</span>
            <span className="em-unit">days clean</span>
          </div>
          <div className="em-meta">Zones 1, 2, 5 · Last positive Mar 29</div>
        </div>
        <div className="em-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" />
            <path d="M8.5 12l2.5 2.5L16 9.5" />
          </svg>
        </div>
      </div>
    </section>
  );
}

window.HomeTech = HomeTech;
