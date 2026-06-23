// Redesigned Results grid — consolidates many columns into rich cells,
// uses progressive-disclosure (row expand) for secondary fields,
// filter chips instead of per-column filter row, and a column chooser.

const { useState, useMemo, useRef, useEffect } = React;

// ---- tiny icon set (supplementary) --------------------------------------
const IChevron = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;

const IEdit = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;

const IEye = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>;

const IMore = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>;

const IRefresh = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>;

const IColumns = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></svg>;

const IDensity = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>;

const IGroup = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 17h7" /></svg>;

const ICopy = ({ s = 14 }) =>
<svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>;


// ---- helpers -------------------------------------------------------------
function formatAbs(d) {
  const date = d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
}
function formatRel(d) {
  const diff = (Date.now() - d.getTime()) / 1000;
  const days = Math.floor(diff / 86400);
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor(diff / 60);
  if (diff < 60) return "just now";
  if (mins < 60) return mins + "m ago";
  if (hrs < 24) return hrs + "h ago";
  if (days < 7) return days + "d ago";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function initials(name) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// ---- status pieces -------------------------------------------------------
function StatusPill({ state }) {
  const Label = { pass: "Pass", fail: "Fail", caution: "Caution" }[state];
  return <span className={"status-pill " + state}><span className="dot" />{Label}</span>;
}

// Modern round status glyph shown in its own column on each row.
function StatusGlyph({ state, size = 13 }) {
  if (state === "pass") {
    return (
      <span className="status-glyph pass-img" title="Pass">
        <img src={RES("assets/pass-icon.png")} alt="Pass" />
      </span>);

  }
  if (state === "fail") {
    return (
      <span className="status-glyph fail-img" title="Fail">
        <img src={RES("assets/fail-icon.png")} alt="Fail" />
      </span>);

  }
  return (
    <span className="status-glyph caution-img" title="Caution">
      <img src={RES("assets/caution-icon.png")} alt="Caution" />
    </span>);

}

function ReadingCell({ row, flat }) {
  const { rlu, lower, upper, state } = row;
  const maxScale = Math.max(upper * 1.4, rlu * 1.15, 1000);
  const leftPct = Math.min(100, lower / maxScale * 100);
  const rangeW = Math.min(100 - leftPct, (upper - lower) / maxScale * 100);
  const markerPct = Math.min(100, Math.max(0, rlu / maxScale * 100));
  return (
    <div className={"reading " + (flat ? "flat" : "")} data-state={state}>
      <div className="top">
        <span className="val">{rlu.toLocaleString()}<span className="unit">RLU</span></span>
        <span className="limits">{lower}–{upper}</span>
      </div>
      <div className="track">
        <div className="range" style={{ left: leftPct + "%", width: rangeW + "%" }} />
        <div className="marker" style={{ left: markerPct + "%" }} />
      </div>
    </div>);

}

// ---- Column chooser ------------------------------------------------------
const ALL_SECONDARY = [
["cfu", "CFU"],
["instrument", "Instrument"],
["plan", "Plan name"],
["zone", "Zone"],
["line", "Line"],
["surface", "Surface"],
["group", "Group"],
["serial", "Serial no"]];


function ColumnChooser({ value, onChange, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function onDocClick(e) {if (ref.current && !ref.current.contains(e.target)) onClose();}
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);
  const toggle = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div className="popover" ref={ref} onClick={(e) => e.stopPropagation()}>
      <div className="ph">Primary columns</div>
      <label><input type="checkbox" checked disabled /> Status</label>
      <label><input type="checkbox" checked disabled /> Sample</label>
      <label><input type="checkbox" checked disabled /> Reading (RLU)</label>
      <label><input type="checkbox" checked disabled /> Device</label>
      <label><input type="checkbox" checked disabled /> Recorded</label>
      <label><input type="checkbox" checked disabled /> User</label>
      <div className="sep" />
      <div className="ph">Additional columns</div>
      {ALL_SECONDARY.map(([k, l]) =>
      <label key={k}><input type="checkbox" checked={value.includes(k)} onChange={() => toggle(k)} /> {l}</label>
      )}
    </div>);

}

// ---- Expanded row --------------------------------------------------------
function ExpandPanel({ row, span }) {
  return (
    <tr className="expand-row">
      <td colSpan={span}>
        <div className="expand-panel">
          <div className="col">
            <h4>Sample details</h4>
            <div className="kv-grid">
              <div className="kv"><div className="k">Zone</div><div className="v">{row.zone}</div></div>
              <div className="kv"><div className="k">Line</div><div className="v">{row.line}</div></div>
              <div className="kv"><div className="k">Unit type</div><div className="v">{row.unitType}</div></div>
              <div className="kv"><div className="k">Surface</div><div className="v">{row.surface}</div></div>
              <div className="kv"><div className="k">Group</div><div className="v">{row.group}</div></div>
              <div className="kv"><div className="k">Plan</div><div className="v">{row.plan}</div></div>
              <div className="kv"><div className="k">Swab temp</div><div className="v">{row.swabTemp}</div></div>
              <div className="kv"><div className="k">Ambient temp</div><div className="v">{row.ambientTemp}</div></div>
              <div className="kv"><div className="k">CFU</div><div className="v">{row.cfu}</div></div>
              <div className="kv"><div className="k">Serial no</div><div className="v">{row.serial}</div></div>
              <div className="kv"><div className="k">Instrument</div><div className="v">{row.instrument}</div></div>
              <div className="kv"><div className="k">Created by</div><div className="v">{row.createdBy}</div></div>
            </div>
          </div>
          <div className="col">
            <h4>Notes</h4>
            <div className={"notes-box " + (row.notes ? "" : "empty")}>
              {row.notes || "No notes recorded for this test."}
            </div>
            <div className="actions-row">
              <button className="btn btn-secondary btn-sm">Retest</button>
              <button className="btn btn-ghost btn-sm">Add note</button>
              <button className="btn btn-ghost btn-sm">View audit trail</button>
            </div>
          </div>
        </div>
      </td>
    </tr>);

}

// ---- Main grid -----------------------------------------------------------
function ResultsGrid({ tweaks }) {
  const [rows] = useState(window.TEST_ROWS || []);
  const [filterState, setFilterState] = useState("all"); // all | pass | fail | caution | retest
  const [filterType, setFilterType] = useState("ATP");
  const [filterPeriod, setFilterPeriod] = useState("This Year");
  const [customRange, setCustomRange] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [dense, setDense] = useState(tweaks.density === "compact");
  const [extraCols, setExtraCols] = useState(["instrument", "plan"]);
  const [showColChooser, setShowColChooser] = useState(false);
  const [sortBy, setSortBy] = useState({ key: "ts", dir: "desc" });
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {setDense(tweaks.density === "compact");}, [tweaks.density]);

  // counts for chips
  const counts = useMemo(() => ({
    all: rows.length,
    pass: rows.filter((r) => r.state === "pass").length,
    caution: rows.filter((r) => r.state === "caution").length,
    fail: rows.filter((r) => r.state === "fail").length,
    retest: rows.filter((r) => r.retest).length
  }), [rows]);

  // Filter + sort
  const filtered = useMemo(() => {
    let out = rows;
    if (filterState === "retest") out = out.filter((r) => r.retest);else
    if (filterState !== "all") out = out.filter((r) => r.state === filterState);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((r) => (r.site + r.location + r.user + r.device).toLowerCase().includes(q));
    }
    out = [...out].sort((a, b) => {
      const dir = sortBy.dir === "asc" ? 1 : -1;
      const k = sortBy.key;
      if (k === "ts") return (a.ts - b.ts) * dir;
      if (k === "rlu") return (a.rlu - b.rlu) * dir;
      const av = String(a[k] ?? ""),bv = String(b[k] ?? "");
      return av.localeCompare(bv) * dir;
    });
    return out;
  }, [rows, filterState, search, sortBy]);

  useEffect(() => {setPage(1);}, [filterState, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
  const toggleSelect = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === pageRows.length) setSelected(new Set());else
    setSelected(new Set(pageRows.map((r) => r.id)));
  };
  const sortClick = (k) => setSortBy((s) => s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" });
  const SortIndicator = ({ k }) => sortBy.key === k ? <span className="sort">{sortBy.dir === "asc" ? "▲" : "▼"}</span> : <span className="sort">↕</span>;

  const colSpan = 7 + extraCols.length; // status+check+sample+reading+device+when+who + actions + extras
  const actualColSpan = 1 /*status-bar*/ + 1 /*check*/ + 1 /*icon*/ + 1 /*sample*/ + 1 /*reading*/ + 1 /*device*/ + 1 /*when*/ + 1 /*who*/ + extraCols.length + 1 /*actions*/;

  const flatReading = tweaks.readingStyle === "flat";
  const showZebra = tweaks.zebra;

  const activeFilters = [];
  if (filterType) activeFilters.push({ k: "type", v: filterType });
  if (filterPeriod !== "All time") activeFilters.push({ k: "period", v: filterPeriod });
  if (filterState !== "all") activeFilters.push({ k: "state", v: filterState.charAt(0).toUpperCase() + filterState.slice(1) });
  if (search) activeFilters.push({ k: "search", v: `"${search}"` });

  return (
    <div className="content wide">
      <div className="page-head">
        <div className="left">
          <h1 className="page-h1">Results</h1>
          <p className="page-sub page-sub-inline">Every test result across every site · {filtered.length.toLocaleString()} records</p>
        </div>
        <div className="right">
          <button className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IDownload /> Export to XLS</button>
        </div>
      </div>

      {/* Dynamic summary header — donut + stat boxes, collapsible */}
      <window.SummaryHeader counts={counts} />

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="chips">
          {[
          ["all", "All", counts.all],
          ["pass", "Pass", counts.pass],
          ["caution", "Caution", counts.caution],
          ["fail", "Fail", counts.fail],
          ["retest", "Needs retest", counts.retest]].
          map(([k, label, ct]) =>
          <span
            key={k}
            className={"chip status-" + k + (filterState === k ? " active" : "")}
            onClick={() => setFilterState(k)}>
            
              {label} <span className="count">{ct}</span>
            </span>
          )}
        </div>

        <div className="divider" />

        <div className="chips">
          <window.TypeDropdown value={filterType} onChange={setFilterType} />
          <window.PeriodDropdown
            value={filterPeriod}
            onChange={setFilterPeriod}
            customRange={customRange}
            onCustomRange={setCustomRange} />
          

        </div>

        <div style={{ flex: 1 }} />

        <div className="search">
          <ISearch size={14} />
          <input
            placeholder="Search site, location, user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)} />
          
        </div>
      </div>

      {activeFilters.length > 0 &&
      <div className="filter-summary">
          <span className="lbl">Active:</span>
          {activeFilters.map((f, i) =>
        <span className="f" key={i}>{f.v}<span className="rm" onClick={() => {
            if (f.k === "search") setSearch("");else
            if (f.k === "state") setFilterState("all");else
            if (f.k === "period") setFilterPeriod("All time");
          }}>×</span></span>
        )}
          <span className="clear" onClick={() => {setFilterState("all");setSearch("");setFilterPeriod("This Year");}}>Clear all</span>
        </div>
      }

      {/* Grid */}
      <div className="grid-card" style={{ marginTop: 12 }}>
        <div className="grid-header">
          <div className="count"><b>{filtered.length}</b> results · <b>{counts.fail}</b> fails · <b>{counts.caution}</b> cautions</div>
          <div className="spacer" />
          {selected.size > 0 &&
          <div className="count" style={{ color: "#0D6A99", fontWeight: 600 }}>
              {selected.size} selected · <span className="clear" style={{ cursor: "pointer", color: "#29ABE2" }} onClick={() => setSelected(new Set())}>Clear</span>
            </div>
          }
          <div className="tool-group">
            <div className="popover-wrap">
              <button className={"icon-btn " + (showColChooser ? "active" : "")} title="Columns" onClick={() => setShowColChooser((v) => !v)}>
                <IColumns />
                {extraCols.length > 0 && <span className="badge-dot">{extraCols.length}</span>}
              </button>
              {showColChooser && <ColumnChooser value={extraCols} onChange={setExtraCols} onClose={() => setShowColChooser(false)} />}
            </div>
            <button className="icon-btn" title="Refresh"><IRefresh /></button>
            <button className="icon-btn" title="Retest relationships"><ICopy /></button>
          </div>
        </div>

        <div className="grid-scroll">
          <table className={"rtable " + (dense ? "compact" : "") + (showZebra ? " zebra" : "")}>
            <thead>
              <tr>
                <th className="col-status" style={{ width: 4, padding: 0 }}></th>
                <th style={{ width: 32, padding: "10px 8px" }}>
                  <input type="checkbox"
                  checked={pageRows.length > 0 && selected.size === pageRows.length}
                  onChange={toggleAll}
                  style={{ accentColor: "#29ABE2" }} />
                  
                </th>
                <th className="col-icon"></th>
                <th className="sortable" onClick={() => sortClick("site")} style={{ minWidth: 220 }}>
                  Sample <SortIndicator k="site" />
                </th>
                <th className="sortable num" onClick={() => sortClick("rlu")} style={{ minWidth: 160 }}>
                  Reading <SortIndicator k="rlu" />
                </th>
                <th className="sortable" onClick={() => sortClick("device")} style={{ minWidth: 110 }}>
                  Device <SortIndicator k="device" />
                </th>
                <th className={"sortable " + (sortBy.key === "ts" ? "sorted" : "")} onClick={() => sortClick("ts")} style={{ minWidth: 140 }}>
                  Recorded <SortIndicator k="ts" />
                </th>
                <th className="sortable" onClick={() => sortClick("user")} style={{ minWidth: 160 }}>
                  User <SortIndicator k="user" />
                </th>
                {extraCols.includes("cfu") && <th className="sortable num col-cfu" onClick={() => sortClick("cfu")} style={{ minWidth: 70 }}>CFU <SortIndicator k="cfu" /></th>}
                {extraCols.includes("instrument") && <th className="col-instrument" style={{ minWidth: 140 }}>Instrument</th>}
                {extraCols.includes("plan") && <th className="col-plan" style={{ minWidth: 140 }}>Plan</th>}
                {extraCols.includes("zone") && <th style={{ minWidth: 80 }}>Zone</th>}
                {extraCols.includes("line") && <th style={{ minWidth: 80 }}>Line</th>}
                {extraCols.includes("surface") && <th style={{ minWidth: 140 }}>Surface</th>}
                {extraCols.includes("group") && <th style={{ minWidth: 120 }}>Group</th>}
                {extraCols.includes("serial") && <th style={{ minWidth: 90 }}>Serial no</th>}
                <th style={{ width: 90, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) =>
              <React.Fragment key={r.id}>
                  <tr
                  data-state={r.state}
                  className={(expandedId === r.id ? "expanded " : "") + (selected.has(r.id) ? "selected" : "")}>
                  
                    <td className="col-status"><span className="bar" /></td>
                    <td style={{ padding: "10px 8px" }}>
                      <input type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    style={{ accentColor: "#29ABE2" }} />
                    
                    </td>
                    <td className="col-icon">
                      <StatusGlyph state={r.state} />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                        className={"expand-btn " + (expandedId === r.id ? "open" : "")}
                        onClick={() => toggleExpand(r.id)}
                        title="Show details">
                        <IChevron /></button>
                        <div className="sample">
                          <div className="primary" title={r.site}>
                            {r.site}
                            {r.retest && <span className="retest-tag" style={{ marginLeft: 6 }}>Retest</span>}
                            {r.retested && <span className="retest-tag done" style={{ marginLeft: 6 }}>Retested</span>}
                          </div>
                          <div className="secondary" title={r.location}>{r.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      <ReadingCell row={r} flat={flatReading} />
                    </td>
                    <td>
                      <span className="device-pill">{r.device}</span>
                    </td>
                    <td>
                      <div className="when">
                        <span className="abs">{formatAbs(r.ts)}</span>
                        <span className="rel">{formatRel(r.ts)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="who">
                        <span className="av">{initials(r.user)}</span>
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span className="nm">{r.user}</span>
                        </div>
                      </div>
                    </td>
                    {extraCols.includes("cfu") && <td className="num">{r.cfu}</td>}
                    {extraCols.includes("instrument") && <td style={{ color: "#757575" }}>{r.instrument}</td>}
                    {extraCols.includes("plan") && <td style={{ color: "#757575" }}>{r.plan}</td>}
                    {extraCols.includes("zone") && <td style={{ color: "#757575" }}>{r.zone}</td>}
                    {extraCols.includes("line") && <td style={{ color: "#757575" }}>{r.line}</td>}
                    {extraCols.includes("surface") && <td style={{ color: "#757575" }}>{r.surface}</td>}
                    {extraCols.includes("group") && <td style={{ color: "#757575" }}>{r.group}</td>}
                    {extraCols.includes("serial") && <td style={{ color: "#757575", fontVariantNumeric: "tabular-nums" }}>{r.serial}</td>}
                    <td>
                      <div className="row-actions">
                        <button title="View"><IEye /></button>
                        <button title="Edit"><IEdit /></button>
                        <button title="More"><IMore /></button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === r.id && <ExpandPanel row={r} span={actualColSpan} />}
                </React.Fragment>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid-foot">
          <div>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()}</div>
          <div className="page-ctrls">
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i + 1;
              return <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
            })}
            {totalPages > 5 && <button disabled>…</button>}
            <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next ›</button>
          </div>
        </div>
      </div>
    </div>);

}

window.ResultsGrid = ResultsGrid;