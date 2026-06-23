// Dynamic summary header with donut chart + stat boxes.
// Collapsible — users can minimize it so the data grid takes the full screen.

function Donut({ pass, caution, fail, size = 140 }) {
  const total = pass + caution + fail || 1;
  const r = size / 2 - 14;
  const cx = size / 2,cy = size / 2;
  const C = 2 * Math.PI * r;

  // Animation progress 0 -> 1
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let raf, start;
    const dur = 900; // ms
    function step(ts) {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      // ease-out-cubic
      const e = 1 - Math.pow(1 - t, 3);
      setProgress(e);
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [pass, caution, fail]);

  // arc lengths scaled by progress
  const lenPass = pass / total * C * progress;
  const lenCaution = caution / total * C * progress;
  const lenFail = fail / total * C * progress;

  // offsets (stack sequentially around the ring)
  const offPass = 0;
  const offCaution = pass / total * C * progress;
  const offFail = (pass + caution) / total * C * progress;

  // rotate so the first slice starts at top (12 o'clock)
  const rot = `rotate(-90 ${cx} ${cy})`;

  const passPct = Math.round(pass / total * 100 * progress);

  return (
    <div className="sh-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="sh-grad-pass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4CD964" />
            <stop offset="100%" stopColor="#2E9E42" />
          </linearGradient>
          <linearGradient id="sh-grad-caution" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFC83D" />
            <stop offset="100%" stopColor="#E68900" />
          </linearGradient>
          <linearGradient id="sh-grad-fail" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF5A5F" />
            <stop offset="100%" stopColor="#B01E24" />
          </linearGradient>
        </defs>
        {/* bg track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
        className="sh-donut-track" strokeWidth="14" />
        <g transform={rot}>
          {/* Pass arc */}
          {pass > 0 &&
          <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#sh-grad-pass)" strokeWidth="14"
          strokeDasharray={`${lenPass} ${C - lenPass}`}
          strokeDashoffset={-offPass}
          strokeLinecap="butt" />
          }
          {/* Caution arc */}
          {caution > 0 &&
          <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#sh-grad-caution)" strokeWidth="14"
          strokeDasharray={`${lenCaution} ${C - lenCaution}`}
          strokeDashoffset={-offCaution}
          strokeLinecap="butt" />
          }
          {/* Fail arc */}
          {fail > 0 &&
          <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#sh-grad-fail)" strokeWidth="14"
          strokeDasharray={`${lenFail} ${C - lenFail}`}
          strokeDashoffset={-offFail}
          strokeLinecap="butt" />
          }
        </g>
      </svg>
      <div className="sh-donut-center">
        <div className="sh-donut-big">{passPct}<span className="sh-donut-pct">%</span></div>
        <div className="sh-donut-small">pass rate</div>
      </div>
    </div>);

}

// Plausible "back of card" data — trend, top contributor, last 24h.
// (In a real app these would come from the same data source as `counts`.)
const SH_BACK_DATA = {
  pass:    { trend:  "+4.2%", trendDir: "up",   top: "Packaging Line 1", topCount: 142, last24: 187 },
  caution: { trend:  "-1.8%", trendDir: "down", top: "Cold Storage A",   topCount:  18, last24:  12 },
  fail:    { trend:  "+0.6%", trendDir: "up",   top: "Packaging Line 3", topCount:  12, last24:   9 },
  retest:  { trend:  "-2.1%", trendDir: "down", top: "Prep Zone B",      topCount:   7, last24:   5 }
};

function StatBox({ kind, label, value, total, icon, index = 0 }) {
  const pct = total ? Math.round(value / total * 100) : 0;
  const [barPct, setBarPct] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  React.useEffect(() => {
    // Start the bar at 0 then ease to target. Time the start so the bar grows
    // *while* the box itself is fading in, finishing slightly after.
    const startDelay = 120 + index * 90 + 80; // ms — just after the box begins to appear
    const t = setTimeout(() => setBarPct(pct), startDelay);
    return () => clearTimeout(t);
  }, [pct, index]);

  const back = SH_BACK_DATA[kind] || {};
  const TrendArrow = () => back.trendDir === "up" ?
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 14 12 8 18 14"/></svg> :
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 10 12 16 18 10"/></svg>;

  return (
    <div
      className={"sh-stat sh-stat-" + kind + (flipped ? " flipped" : "")}
      style={{ animationDelay: 120 + index * 90 + "ms" }}
      onClick={() => setFlipped(f => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlipped(f => !f); } }}
      title={flipped ? "Click to see overview" : "Click to see details"}>

      <div className="sh-stat-inner">
        <div className="sh-stat-face sh-stat-front">
          <div className="sh-stat-top">
            <span className="sh-stat-icon">{icon}</span>
            <span className="sh-stat-label">{label}</span>
          </div>
          <div className="sh-stat-num">{value.toLocaleString()}</div>
          <div className="sh-stat-bar">
            <div className="sh-stat-bar-fill" style={{ width: barPct + "%" }} />
          </div>
          <div className="sh-stat-pct">{pct}% of total</div>
        </div>
        <div className="sh-stat-face sh-stat-back">
          <div className="sh-stat-back-label">{label}</div>
          <div className="sh-stat-back-row">
            <span className="sh-stat-back-key">vs prior period</span>
            <span className="sh-stat-back-val"><TrendArrow/> {back.trend}</span>
          </div>
          <div className="sh-stat-back-row stack">
            <span className="sh-stat-back-key">Top site</span>
            <span className="sh-stat-back-val">{back.top} <em>({back.topCount})</em></span>
          </div>
        </div>
      </div>
    </div>);

}

function SummaryHeader({ counts }) {
  const [collapsed, setCollapsed] = React.useState(() => {
    try {return localStorage.getItem("sh-collapsed") === "1";} catch (e) {return false;}
  });
  React.useEffect(() => {
    try {localStorage.setItem("sh-collapsed", collapsed ? "1" : "0");} catch (e) {}
  }, [collapsed]);

  const total = counts.all || 0;

  const IPassIco = () =>
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>;

  const ICautIco = () =>
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01M10.29 3.86l-8.55 14.8A2 2 0 0 0 3.45 22h17.1a2 2 0 0 0 1.71-3.34l-8.55-14.8a2 2 0 0 0-3.42 0z" />
    </svg>;

  const IFailIco = () =>
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>;

  const IRetestIco = () =>
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>;

  const IChevUp = () =>
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>;

  const IChevDown = () =>
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>;


  if (collapsed) {
    return (
      <div className="summary-header collapsed">
        <h3 className="sh-title sh-title-mini">At a glance</h3>
        <div className="sh-mini-spacer" />
        <button className="sh-toggle" onClick={() => setCollapsed(false)} title="Show summary">
          Show summary <IChevDown />
        </button>
      </div>);

  }

  return (
    <div className="summary-header">
      <div className="sh-head">
        <div>
          <h3 className="sh-title">At a glance</h3>
          <p className="sh-sub">{total.toLocaleString()} results in current view</p>
        </div>
        <button className="sh-toggle" onClick={() => setCollapsed(true)} title="Minimize summary">
          Hide <IChevUp />
        </button>
      </div>
      <div className="sh-body">
        <Donut pass={counts.pass} caution={counts.caution} fail={counts.fail} />
        <div className="sh-stats">
          <StatBox kind="pass" index={0} label="Pass" value={counts.pass} total={total} icon={<IPassIco />} />
          <StatBox kind="caution" index={1} label="Caution" value={counts.caution} total={total} icon={<ICautIco />} />
          <StatBox kind="fail" index={2} label="Fail" value={counts.fail} total={total} icon={<IFailIco />} />
          <StatBox kind="retest" index={3} label="Needs retest" value={counts.retest} total={total} icon={<IRetestIco />} />
        </div>
      </div>
    </div>);

}

window.SummaryHeader = SummaryHeader;