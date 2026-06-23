// HomeTiles
//
// Customizable tile section for the Home page. Renders a 2-column grid of
// optional widgets. Users can:
//   • Toggle "Customize" mode to reveal grip handles + remove buttons
//   • Drag-and-drop to reorder tiles
//   • Add tiles back from an "Add tile" menu
//
// Active layout (order + visible ids) is persisted in localStorage under
// "home-tiles-layout" so the home screen feels personalized across reloads.
//
// Visual language matches the existing SureTrend prototype: Open Sans,
// #29ABE2 primary, flush-gray card-head strip (.tile-head), shared dark-mode
// tokens. New tiles are intentionally lightweight on iconography to avoid
// data slop — every dot, sparkline, and badge has a clear job.

/* ---------------------------------------------------------------------------
   Tile registry
   --------------------------------------------------------------------------- */

const TILE_DEFS = [
  { id: "recall",    title: "Recall & Outbreak Watch",       blurb: "FDA, USDA/FSIS & CDC live feed",   render: (p) => <RecallTile {...p} /> },
  { id: "anomaly",   title: "Anomaly Spotlight",             blurb: "ML-driven pattern detection",      render: (p) => <AnomalyTile {...p} /> },
  { id: "emstreak",  title: "EM Streak",                     blurb: "Days since last positive",         render: (p) => <EMStreakTile {...p} /> },
  { id: "inventory", title: "Inventory",                     blurb: "Testing supplies on hand",         render: (p) => <InventoryTile {...p} /> },
];

const DEFAULT_LAYOUT = ["recall", "anomaly", "emstreak", "inventory"];
const STORAGE_KEY = "home-tiles-layout";

function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT.slice();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT.slice();
    // Filter to known ids only
    const known = new Set(TILE_DEFS.map((t) => t.id));
    return parsed.filter((id) => known.has(id));
  } catch (e) {
    return DEFAULT_LAYOUT.slice();
  }
}
function saveLayout(ids) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch (e) {}
}

/* ---------------------------------------------------------------------------
   Section shell
   --------------------------------------------------------------------------- */

function CustomTiles({ onNav }) {
  const [layout, setLayout] = React.useState(loadLayout);
  const [addOpen, setAddOpen] = React.useState(false);
  const [dragId, setDragId] = React.useState(null);
  const [overId, setOverId] = React.useState(null);
  const [justAdded, setJustAdded] = React.useState(null);

  React.useEffect(() => { saveLayout(layout); }, [layout]);

  // When a tile is added, scroll the page to bring it into view so the user
  // sees exactly where it landed. Highlight pulse fades after the scroll.
  React.useEffect(() => {
    if (!justAdded) return;
    const el = document.querySelector('[data-tile-id="' + justAdded + '"]');
    if (el) {
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const target = window.scrollY + rect.top - 24;
        window.scrollTo({ top: target, behavior: "smooth" });
      });
    }
    const t = setTimeout(() => setJustAdded(null), 1600);
    return () => clearTimeout(t);
  }, [justAdded]);

  const remove = (id) => setLayout((l) => l.filter((x) => x !== id));
  // Allow multiple tiles to be added — menu stays open until user dismisses it.
  const add = (id) => {
    setLayout((l) => (l.includes(id) ? l : [...l, id]));
    setJustAdded(id);
  };

  // Drag and drop reorder — always on
  function onDragStart(e, id) {
    setDragId(id);
    try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); } catch (err) {}
  }
  function onDragOver(e, id) {
    if (!dragId) return;
    e.preventDefault();
    if (id !== overId) setOverId(id);
  }
  function onDrop(e, id) {
    if (!dragId) return;
    e.preventDefault();
    setLayout((l) => {
      const next = l.filter((x) => x !== dragId);
      const idx = next.indexOf(id);
      if (idx === -1) return [...next, dragId];
      next.splice(idx, 0, dragId);
      return next;
    });
    setDragId(null); setOverId(null);
  }
  function onDragEnd() { setDragId(null); setOverId(null); }

  const known = new Set(TILE_DEFS.map((t) => t.id));
  const activeDefs = layout.map((id) => TILE_DEFS.find((t) => t.id === id)).filter(Boolean);
  const inactive = TILE_DEFS.filter((t) => !layout.includes(t.id));

  return (
    <section className="ct-section">
      {activeDefs.length > 0 && (
        <div className="ct-grid" data-count={activeDefs.length}>
          {activeDefs.map((t) => (
            <div
              key={t.id}
              data-tile-id={t.id}
              className={
                "ct-tile-wrap" +
                (dragId === t.id ? " is-dragging" : "") +
                (overId === t.id && dragId && dragId !== t.id ? " is-over" : "") +
                (justAdded === t.id ? " just-added" : "")
              }
              draggable={true}
              onDragStart={(e) => onDragStart(e, t.id)}
              onDragOver={(e) => onDragOver(e, t.id)}
              onDrop={(e) => onDrop(e, t.id)}
              onDragEnd={onDragEnd}
            >
              <div className="ct-edit-bar">
                <span className="ct-grip" title="Drag to reorder">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                </span>
                <button
                  className="ct-remove"
                  onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  draggable={false}
                  aria-label="Remove tile"
                  title="Remove tile"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>
              {t.render({ onNav })}
            </div>
          ))}
        </div>
      )}

      {(inactive.length > 0 || addOpen) && (
        <div className="ct-add-dock">
          <button
            className={"ct-add-tab" + (addOpen ? " open" : "")}
            onClick={() => setAddOpen((o) => !o)}
            aria-label="Add tiles"
            title="Add tiles"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          {addOpen && (
            <>
              <div className="ct-add-backdrop" onClick={() => setAddOpen(false)} />
              <div className="ct-add-menu">
                <div className="ct-add-menu-head">
                  <div className="ct-add-menu-title">Add tiles to your home screen</div>
                  <div className="ct-add-menu-hint">Tap any tile to add it. Add as many as you like.</div>
                  <button className="ct-add-menu-close" onClick={() => setAddOpen(false)} aria-label="Close">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                  </button>
                </div>
                <div className="ct-add-list">
                  {TILE_DEFS.map((t) => {
                    const added = layout.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        className={"ct-add-opt" + (added ? " is-added" : "")}
                        onClick={() => { if (!added) add(t.id); }}
                        disabled={added}
                      >
                        <div className="ct-add-opt-icon">{tileGlyph(t.id)}</div>
                        <div className="ct-add-opt-body">
                          <div className="ct-add-opt-title">{t.title}</div>
                          <div className="ct-add-opt-sub">{added ? "Already on your home screen" : t.blurb}</div>
                        </div>
                        <span className={"ct-add-opt-plus" + (added ? " checked" : "")}>
                          {added ? (
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7"/></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="ct-add-menu-foot">
                  <span>{layout.length} of {TILE_DEFS.length} on home</span>
                  <button className="ct-add-done" onClick={() => setAddOpen(false)}>Done</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function tileGlyph(id) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (id) {
    case "recall":    return <svg {...common}><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>;
    case "anomaly":   return <svg {...common}><path d="M12 2l2 5 5 .8-3.6 3.6.85 5L12 14l-4.25 2.4L8.6 11.4 5 7.8 10 7z"/></svg>;
    case "emstreak":  return <svg {...common}><path d="M12 2C8 7 6 9 6 13a6 6 0 0 0 12 0c0-2-1-4-3-6 0 2-1.5 3-3 3 0-2 0-5 0-8z"/></svg>;
    case "inventory": return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M3 11h18M8 7V4h8v3"/></svg>;
    default: return null;
  }
}

/* ---------------------------------------------------------------------------
   Tile 1: Recall & Outbreak Watch
   --------------------------------------------------------------------------- */

function RecallTile({ onNav }) {
  const allItems = [
    { id: 1, source: "FDA",  product: "Ready-to-eat chicken salad", category: "Meat",     pathogen: "Listeria monocytogenes", severity: "I",   time: "32m ago" },
    { id: 2, source: "CDC",  product: "Multi-state outbreak — fresh cucumbers", category: "Produce", pathogen: "Salmonella Typhimurium", severity: null, time: "2h ago", outbreak: true },
    { id: 3, source: "FSIS", product: "Beef hot dogs, select lots",  category: "Meat",     pathogen: "Possible undeclared milk", severity: "II", time: "5h ago" },
    { id: 4, source: "FDA",  product: "Sliced cheddar, 8oz",         category: "Dairy",    pathogen: "Possible mislabeling", severity: "III", time: "1d ago" },
    { id: 5, source: "FDA",  product: "Frozen mango chunks",          category: "Produce",  pathogen: "Hepatitis A",          severity: "I",   time: "1d ago" },
  ];
  const cats = ["All", "Meat", "Produce", "Dairy", "Allergen"];
  const [cat, setCat] = React.useState("All");
  const filtered = (cat === "All" ? allItems : allItems.filter((i) => i.category === cat)).slice(0, 3);

  return (
    <div className="card ct-card recall-card">
      <header className="card-head ct-head">
        <div className="ct-head-title">
          <h2 className="card-title">Recall &amp; Outbreak Watch</h2>
          <span className="live-dot" title="Live feed">
            <span className="live-dot-pulse" />
            Live
          </span>
        </div>
        <a className="card-link" onClick={() => onNav && onNav("recalls")}>View all</a>
      </header>
      <div className="card-body recall-body">
        <div className="chip-row">
          {cats.map((c) => (
            <button key={c} className={"chip" + (c === cat ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="ct-tile-empty">No new recalls in your categories today.</div>
        ) : (
          <ul className="recall-list">
            {filtered.map((r) => (
              <li key={r.id} className="recall-item">
                <span className={"agency agency-" + r.source.toLowerCase()}>{r.source}</span>
                <div className="recall-body-col">
                  <div className="recall-product">{r.product}</div>
                  <div className="recall-meta">
                    <span className="recall-cat">{r.category}</span>
                    <span className="recall-dot">·</span>
                    <span className="recall-path">{r.pathogen}</span>
                  </div>
                </div>
                <div className="recall-right">
                  {r.severity ? (
                    <span className={"severity sev-" + r.severity.toLowerCase()}>Class&nbsp;{r.severity}</span>
                  ) : r.outbreak ? (
                    <span className="severity sev-outbreak">Outbreak</span>
                  ) : null}
                  <span className="recall-time">{r.time}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Tile 2: Anomaly Spotlight
   --------------------------------------------------------------------------- */

function AnomalyTile({ onNav }) {
  const items = [
    {
      id: 1,
      severity: "high",
      headline: "Site 2, Zone 3 trending positive",
      detail: "4 Listeria hits this week vs. 0 average over the prior 8 weeks",
      site: "Site 2 · Zone 3",
      pathogen: "Listeria",
      spark: [0, 0, 0, 1, 0, 0, 2, 4],
      delta: "+4 vs avg",
    },
    {
      id: 2,
      severity: "med",
      headline: "ATP RLU drift on Line 4",
      detail: "Average RLU up 38% this week — likely cleaning gap on post-rinse swabs",
      site: "Site 1 · Line 4",
      pathogen: "ATP",
      spark: [120, 130, 140, 135, 160, 175, 195, 215],
      delta: "+38%",
    },
  ];

  return (
    <div className="card ct-card anomaly-card">
      <header className="card-head ct-head">
        <div className="ct-head-title">
          <h2 className="card-title">Anomaly Spotlight</h2>
          <span className="ai-pill" title="AI-detected">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 2l1.6 4.4L18 8l-4.4 1.6L12 14l-1.6-4.4L6 8l4.4-1.6z"/><path d="M19 14l.7 2 2 .7-2 .7L19 19.5l-.7-2.1-2-.7 2-.7z" opacity=".7"/></svg>
            AI
          </span>
        </div>
        <a className="card-link" onClick={() => onNav && onNav("anomalies")}>View all</a>
      </header>
      <div className="card-body anomaly-body">
        {items.length === 0 ? (
          <div className="ct-tile-empty positive">
            <div className="ct-empty-check">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4.5 4.5L19 7"/></svg>
            </div>
            <div>
              <div className="ct-empty-headline">All sites tracking normal</div>
              <div className="ct-empty-line">Nice work — no unusual patterns detected this week.</div>
            </div>
          </div>
        ) : (
          <div className="anomaly-list">
            {items.map((a) => (
              <article key={a.id} className={"anom-card sev-" + a.severity}>
                <div className="anom-stripe" />
                <div className="anom-main">
                  <div className="anom-head-row">
                    <div className="anom-headline">{a.headline}</div>
                    <span className={"anom-tag tag-" + a.severity}>{a.severity === "high" ? "High" : a.severity === "med" ? "Medium" : "Low"}</span>
                  </div>
                  <div className="anom-detail">{a.detail}</div>
                  <div className="anom-foot">
                    <span className="anom-site">{a.site}</span>
                    <span className="anom-dot">·</span>
                    <span className="anom-path">{a.pathogen}</span>
                  </div>
                </div>
                <div className="anom-right">
                  <Sparkline values={a.spark} severity={a.severity} />
                  <div className="anom-delta">{a.delta}</div>
                  <button className="anom-cta" onClick={() => onNav && onNav("anomaly-" + a.id)}>
                    Investigate
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Sparkline({ values, severity }) {
  const w = 90, h = 32, p = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = p + (i / (values.length - 1)) * (w - p * 2);
    const y = h - p - ((v - min) / range) * (h - p * 2);
    return [x, y];
  });
  const d = pts.map(([x, y], i) => (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1)).join(" ");
  const area = d + ` L${(w - p).toFixed(1)},${h} L${p},${h} Z`;
  const color = severity === "high" ? "#EF4444" : severity === "med" ? "#F59E0B" : "#29ABE2";
  const fill = severity === "high" ? "rgba(239,68,68,0.18)" : severity === "med" ? "rgba(245,158,11,0.18)" : "rgba(41,171,226,0.18)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="spark">
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.4" fill={color} />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Tile 3: EM Streak
   --------------------------------------------------------------------------- */

function EMStreakTile() {
  const views = [
    { id: "zone", label: "By zone" },
    { id: "site", label: "By site" },
    { id: "pathogen", label: "By pathogen" },
  ];
  const data = {
    zone: [
      { name: "Site 1 · Zone 4 (Packaging)", pathogen: "Listeria",   days: 187, prevBest: 142 },
      { name: "Site 3 · Zone 1 (Receiving)", pathogen: "Salmonella", days:  92, prevBest:  78 },
      { name: "Site 2 · Zone 5 (Cold storage)", pathogen: "Listeria", days:  46, prevBest:  60 },
    ],
    site: [
      { name: "Site 1",  pathogen: "All pathogens", days: 64, prevBest: 51 },
      { name: "Site 3",  pathogen: "All pathogens", days: 28, prevBest: 35 },
      { name: "Site 2",  pathogen: "All pathogens", days: 12, prevBest: 22 },
    ],
    pathogen: [
      { name: "Salmonella, all sites", pathogen: "Salmonella", days: 128, prevBest: 99  },
      { name: "Listeria, all sites",    pathogen: "Listeria",   days:  41, prevBest: 60  },
      { name: "E. coli O157:H7, all sites", pathogen: "E. coli", days: 312, prevBest: 244 },
    ],
  };

  const [view, setView] = React.useState("zone");
  const [idx, setIdx] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const items = data[view];
  const cur = items[idx % items.length];
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const next = () => setIdx((i) => (i + 1) % items.length);

  React.useEffect(() => { setIdx(0); }, [view]);

  const pctOfBest = Math.min(100, Math.round((cur.days / Math.max(cur.prevBest, cur.days)) * 100));
  const beatingBest = cur.days >= cur.prevBest;

  return (
    <div className="card ct-card streak-card">
      <header className="card-head ct-head">
        <div className="ct-head-title">
          <h2 className="card-title">EM Streak</h2>
        </div>
        <div className="streak-view">
          <button className="streak-view-btn" onClick={() => setOpen((o) => !o)}>
            {views.find((v) => v.id === view).label}
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          {open && (
            <div className="streak-view-menu" onMouseLeave={() => setOpen(false)}>
              {views.map((v) => (
                <button key={v.id} className={"streak-view-opt" + (v.id === view ? " active" : "")} onClick={() => { setView(v.id); setOpen(false); }}>{v.label}</button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="card-body streak-body">
        <div className="streak-main">
          <div className="streak-number-wrap">
            <div className="streak-number">{cur.days}</div>
            <div className="streak-unit">
              <div>days</div>
              <div className="streak-sub">since last positive</div>
            </div>
            {cur.days >= 30 && (
              <span className="streak-badge" title={cur.days >= 90 ? "90+ day streak" : "30+ day streak"}>
                {cur.days >= 180 ? (
                  // trophy
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M17 6h2a2 2 0 0 1 0 4h-2M7 6H5a2 2 0 0 0 0 4h2"/></svg>
                ) : (
                  // flame
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C9 6 7 8 7 12a5 5 0 0 0 10 0c0-2-1-3.5-2.5-5 0 2-1.5 3-2.5 3 0-2 0-5 0-8z"/></svg>
                )}
              </span>
            )}
          </div>

          <div className="streak-meta">
            <div className="streak-zone">{cur.name}</div>
            <div className="streak-path">Tracking <b>{cur.pathogen}</b></div>
          </div>

          <div className="streak-progress-wrap">
            <div className="streak-progress-row">
              <span className="streak-progress-label">Previous best</span>
              <span className="streak-progress-val">
                {cur.prevBest} days
                {beatingBest ? (
                  <span className="streak-delta up">+{cur.days - cur.prevBest}</span>
                ) : (
                  <span className="streak-delta down">−{cur.prevBest - cur.days}</span>
                )}
              </span>
            </div>
            <div className="streak-progress">
              <div className="streak-progress-fill" style={{ width: pctOfBest + "%" }} />
              <div className="streak-progress-marker" style={{ left: Math.min(100, Math.round((cur.prevBest / Math.max(cur.prevBest, cur.days)) * 100)) + "%" }} title="Previous best" />
            </div>
          </div>
        </div>

        <div className="streak-cycle">
          <button className="streak-arrow" onClick={prev} aria-label="Previous">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <div className="streak-dots">
            {items.map((_, i) => (
              <button key={i} className={"streak-dot" + (i === idx ? " active" : "")} onClick={() => setIdx(i)} aria-label={"Item " + (i + 1)} />
            ))}
          </div>
          <button className="streak-arrow" onClick={next} aria-label="Next">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Tile 4: Inventory Control
   --------------------------------------------------------------------------- */

function InventoryTile({ onNav }) {
  const items = [
    { id: 1, name: "ATP Surface Swabs",       qty: 142, unit: "swabs",  daysLeft: 28, capacity: 500, expiresSoon: false, lot: "ATP-1124", status: "ok" },
    { id: 2, name: "Listeria Test Kits",      qty:  18, unit: "tests",  daysLeft:  6, capacity: 100, expiresSoon: true,  lot: "LIS-0426", status: "low" },
    { id: 3, name: "Allergen Kits (Peanut)",  qty:   9, unit: "tests",  daysLeft:  3, capacity:  80, expiresSoon: false, lot: "ALG-P-22", status: "critical" },
    { id: 4, name: "Luminometer Calibration", qty:   6, unit: "vials",  daysLeft: 42, capacity:  20, expiresSoon: false, lot: "CAL-031",  status: "ok" },
  ];
  const belowPar = items.filter((i) => i.status !== "ok").length;

  return (
    <div className="card ct-card inv-card">
      <header className="card-head ct-head">
        <div className="ct-head-title">
          <h2 className="card-title">Inventory</h2>
          {belowPar > 0 && (
            <span className="inv-par-badge" title="Items below par level">
              {belowPar} below par
            </span>
          )}
        </div>
        <a className="card-link" onClick={() => onNav && onNav("inventory")}>Manage all</a>
      </header>
      <div className="card-body inv-body">
        <ul className="inv-list">
          {items.map((it) => {
            const pct = Math.max(2, Math.min(100, Math.round((it.qty / it.capacity) * 100)));
            return (
              <li key={it.id} className={"inv-item status-" + it.status}>
                <div className="inv-row-1">
                  <div className="inv-name">{it.name}</div>
                  <div className="inv-qty">
                    <span className="inv-qty-num">{it.qty}</span>
                    <span className="inv-qty-unit">{it.unit}</span>
                  </div>
                </div>
                <div className="inv-bar">
                  <div className={"inv-bar-fill bar-" + it.status} style={{ width: pct + "%" }} />
                </div>
                <div className="inv-row-3">
                  <div className="inv-meta">
                    <span className={"inv-days days-" + it.status}>
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      {it.daysLeft}d of inventory
                    </span>
                    {it.expiresSoon && (
                      <span className="inv-expiry" title={"Lot " + it.lot + " expires within 30 days"}>
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                        Lot expires &lt;30d
                      </span>
                    )}
                  </div>
                  {it.status !== "ok" && (
                    <button className="inv-reorder" onClick={() => onNav && onNav("reorder-" + it.id)}>Reorder</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

window.CustomTiles = CustomTiles;
