// Filter dropdowns for the Results grid.
// - TypeDropdown — hierarchical test-type picker
// - PeriodDropdown — preset periods; choosing "Custom" opens DateRangePopover
// - DateRangePopover — ONE combined popover with From + To side-by-side,
//   each with inline calendar + clock + time spinners. Eliminates the
//   two-separate-field chore from the legacy UI.

const TYPE_OPTIONS = [
  { value: "Consolidated", label: "Consolidated" },
  { value: "ATP",           label: "ATP" },
  { value: "Allergens",     label: "Allergens" },
  { value: "InSite",        label: "InSite" },
  { value: "Microorganisms",label: "Microorganisms" },
  { value: "Enzymes",       label: "Enzymes" },
  { value: "PCR",           label: "PCR", disabled: true },
  { value: "External Data", label: "External Data" },
];

const PERIOD_OPTIONS = [
  "Today","Yesterday","This Week","Last Week","This Month","Last Month",
  "This Quarter","Last Quarter","This Year","Last Year","Custom"
];

// ---- small helpers --------------------------------------------------------
function useOutside(ref, onClose) {
  React.useEffect(() => {
    function onDoc(e){ if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ref, onClose]);
}
function fmtDateTime(d) {
  if (!d) return "";
  const m = d.getMonth()+1, day = d.getDate(), y = d.getFullYear();
  let h = d.getHours();
  const min = d.getMinutes().toString().padStart(2,"0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${m}/${day}/${y}, ${h}:${min} ${ap}`;
}

// =========================================================================
// TypeDropdown
// =========================================================================
function TypeDropdown({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  useOutside(ref, () => setOpen(false));
  return (
    <span className="fd-wrap" ref={ref}>
      <span className={"chip fd-trigger" + (open ? " open" : "")} onClick={()=>setOpen(o=>!o)}>
        Type: <b style={{marginLeft:3}}>{value}</b> <span className="x">▾</span>
      </span>
      {open && (
        <div className="fd-menu fd-menu-type">
          {TYPE_OPTIONS.map(opt => (
            <div
              key={opt.value}
              className={
                "fd-opt" +
                (value === opt.value ? " selected" : "") +
                (opt.disabled ? " disabled" : "")
              }
              onClick={()=>{
                if (opt.disabled) return;
                onChange(opt.value); setOpen(false);
              }}
            >
              <span className="fd-check">{value === opt.value ? "✓" : ""}</span>
              <span className="fd-label">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

// =========================================================================
// PeriodDropdown + DateRangePopover
// =========================================================================
function PeriodDropdown({ value, onChange, customRange, onCustomRange }) {
  const [open, setOpen] = React.useState(false);
  const [showRange, setShowRange] = React.useState(false);
  const ref = React.useRef(null);
  useOutside(ref, () => setOpen(false));

  const displayLabel = value === "Custom" && customRange
    ? `${fmtDateTime(customRange.from).split(",")[0]} – ${fmtDateTime(customRange.to).split(",")[0]}`
    : value;

  return (
    <span className="fd-wrap" ref={ref}>
      <span className={"chip fd-trigger" + (open ? " open" : "")} onClick={()=>setOpen(o=>!o)}>
        Period: <b style={{marginLeft:3}}>{displayLabel}</b> <span className="x">▾</span>
      </span>
      {open && (
        <div className="fd-menu fd-menu-period">
          {PERIOD_OPTIONS.map(opt => (
            <div
              key={opt}
              className={"fd-opt" + (value === opt ? " selected" : "")}
              onClick={()=>{
                if (opt === "Custom") {
                  setShowRange(true);
                } else {
                  onChange(opt); setOpen(false);
                }
              }}
            >
              <span className="fd-check">{value === opt ? "✓" : ""}</span>
              <span className="fd-label">{opt}</span>
            </div>
          ))}
        </div>
      )}
      {showRange && (
        <DateRangePopover
          initial={customRange || defaultCustomRange()}
          onClose={()=>{ setShowRange(false); }}
          onApply={(range)=>{
            onCustomRange(range);
            onChange("Custom");
            setShowRange(false);
            setOpen(false);
          }}
        />
      )}
    </span>
  );
}

function defaultCustomRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
  return { from, to };
}

// =========================================================================
// DateRangePopover — single combined From/To picker
// =========================================================================
function DateRangePopover({ initial, onApply, onClose }) {
  const [from, setFrom] = React.useState(initial.from);
  const [to, setTo] = React.useState(initial.to);
  const [focused, setFocused] = React.useState("from"); // which side the calendar/clock edits
  const [calMonth, setCalMonth] = React.useState(new Date(initial.from.getFullYear(), initial.from.getMonth(), 1));
  const ref = React.useRef(null);
  useOutside(ref, onClose);

  const current = focused === "from" ? from : to;
  const setCurrent = (d) => {
    if (focused === "from") setFrom(d);
    else setTo(d);
  };

  // Keep calendar focused on selected side when user flips sides
  React.useEffect(() => {
    setCalMonth(new Date(current.getFullYear(), current.getMonth(), 1));
  }, [focused]);

  const valid = from <= to;

  return (
    <div className="drp-popover" ref={ref} onClick={e=>e.stopPropagation()}>
      <div className="drp-head">
        <div className="drp-title">Select date & time range</div>
        <button className="drp-close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="drp-fields">
        <div className={"drp-field" + (focused === "from" ? " active" : "")} onClick={()=>setFocused("from")}>
          <label>From</label>
          <div className="drp-field-val">{fmtDateTime(from)}</div>
        </div>
        <div className="drp-arrow">→</div>
        <div className={"drp-field" + (focused === "to" ? " active" : "")} onClick={()=>setFocused("to")}>
          <label>To</label>
          <div className="drp-field-val">{fmtDateTime(to)}</div>
        </div>
      </div>

      <div className="drp-body">
        <Calendar
          month={calMonth}
          onMonth={setCalMonth}
          selected={current}
          rangeStart={from}
          rangeEnd={to}
          onPick={(d)=>{
            const next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), current.getHours(), current.getMinutes());
            setCurrent(next);
          }}
        />
        <ClockPanel
          value={current}
          onChange={(d)=>setCurrent(d)}
        />
      </div>

      {!valid && (
        <div className="drp-warn">"From" must be before "To".</div>
      )}

      <div className="drp-foot">
        <button className="drp-btn" onClick={()=>{
          const n = new Date();
          const today = new Date(n.getFullYear(), n.getMonth(), n.getDate(), current.getHours(), current.getMinutes());
          setCurrent(today);
          setCalMonth(new Date(today.getFullYear(), today.getMonth(), 1));
        }}>Today</button>
        <div style={{flex:1}}/>
        <button className="drp-btn" onClick={onClose}>Cancel</button>
        <button
          className="drp-btn drp-btn-primary"
          disabled={!valid}
          onClick={()=>onApply({from, to})}
        >Apply</button>
      </div>
    </div>
  );
}

// ---- Calendar ------------------------------------------------------------
function Calendar({ month, onMonth, selected, rangeStart, rangeEnd, onPick }) {
  const startDow = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const prevDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) {
    const d = prevDays - startDow + 1 + i;
    cells.push({ day: d, inMonth: false, date: new Date(month.getFullYear(), month.getMonth()-1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, date: new Date(month.getFullYear(), month.getMonth(), d) });
  }
  while (cells.length < 42) {
    const idx = cells.length - (startDow + daysInMonth) + 1;
    cells.push({ day: idx, inMonth: false, date: new Date(month.getFullYear(), month.getMonth()+1, idx) });
  }

  const isSame = (a, b) => a && b &&
    a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

  const inRange = (d) => rangeStart && rangeEnd &&
    d >= new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate()) &&
    d <= new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate());

  const monthName = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="drp-cal">
      <div className="drp-cal-head">
        <button className="drp-nav" onClick={()=>onMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))} aria-label="Previous month">‹</button>
        <div className="drp-cal-month">{monthName}</div>
        <button className="drp-nav" onClick={()=>onMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))} aria-label="Next month">›</button>
      </div>
      <div className="drp-cal-dow">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="drp-cal-grid">
        {cells.map((c, i) => {
          const sel = isSame(c.date, selected);
          const startSel = isSame(c.date, rangeStart);
          const endSel   = isSame(c.date, rangeEnd);
          const within   = inRange(c.date) && !startSel && !endSel;
          return (
            <button
              key={i}
              className={
                "drp-day" +
                (c.inMonth ? "" : " out") +
                (sel ? " focused" : "") +
                (startSel ? " range-start" : "") +
                (endSel   ? " range-end"   : "") +
                (within   ? " in-range"    : "")
              }
              onClick={()=>onPick(c.date)}
            >{c.day}</button>
          );
        })}
      </div>
    </div>
  );
}

// ---- ClockPanel ----------------------------------------------------------
function ClockPanel({ value, onChange }) {
  const hours24 = value.getHours();
  const minutes = value.getMinutes();
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  const update = (h12, m, ap) => {
    let h = h12 % 12;
    if (ap === "PM") h += 12;
    const d = new Date(value);
    d.setHours(h, m, 0, 0);
    onChange(d);
  };

  // clock face positions
  const faceR = 72;
  const cx = 85, cy = 85;
  const hourAngle   = ((hours12 % 12) * 30 - 90) * Math.PI / 180;
  const minuteAngle = (minutes * 6 - 90) * Math.PI / 180;
  const hourX = cx + Math.cos(hourAngle) * (faceR - 28);
  const hourY = cy + Math.sin(hourAngle) * (faceR - 28);
  const minX = cx + Math.cos(minuteAngle) * (faceR - 14);
  const minY = cy + Math.sin(minuteAngle) * (faceR - 14);

  return (
    <div className="drp-clock">
      <div className="drp-clock-face">
        <svg width="170" height="170" viewBox="0 0 170 170">
          <circle cx={cx} cy={cy} r={faceR} fill="#fff" stroke="#E4E7EB" strokeWidth="1.5"/>
          {/* hour marks */}
          {[...Array(12)].map((_,i) => {
            const a = (i * 30 - 90) * Math.PI/180;
            const n = i === 0 ? 12 : i;
            const isActive = n === hours12;
            return (
              <text
                key={i}
                x={cx + Math.cos(a) * (faceR - 12)}
                y={cy + Math.sin(a) * (faceR - 12) + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isActive ? 700 : 400}
                fill={isActive ? "#29ABE2" : "#757575"}
              >{n}</text>
            );
          })}
          {/* minute hand */}
          <line x1={cx} y1={cy} x2={minX} y2={minY} stroke="#29ABE2" strokeWidth="2.5" strokeLinecap="round"/>
          {/* hour hand */}
          <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke="#29ABE2" strokeWidth="3.5" strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r="4" fill="#29ABE2"/>
          <circle cx={minX} cy={minY} r="3" fill="#29ABE2"/>
        </svg>
      </div>
      <div className="drp-time-spinners">
        <Spinner value={hours12} min={1} max={12} onChange={h => update(h, minutes, ampm)}/>
        <span className="drp-colon">:</span>
        <Spinner value={minutes} min={0} max={59} pad={2} onChange={m => update(hours12, m, ampm)}/>
        <AmPmToggle value={ampm} onChange={ap => update(hours12, minutes, ap)}/>
      </div>
    </div>
  );
}

function Spinner({ value, min, max, pad=0, onChange }) {
  const wrap = (v) => {
    if (v > max) return min;
    if (v < min) return max;
    return v;
  };
  return (
    <div className="drp-spin">
      <input
        type="text"
        value={pad ? String(value).padStart(pad,"0") : value}
        onChange={e => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= min && n <= max) onChange(n);
        }}
      />
      <div className="drp-spin-btns">
        <button onClick={()=>onChange(wrap(value+1))}>▴</button>
        <button onClick={()=>onChange(wrap(value-1))}>▾</button>
      </div>
    </div>
  );
}

function AmPmToggle({ value, onChange }) {
  return (
    <div className="drp-ampm">
      <button className={value === "AM" ? "active" : ""} onClick={()=>onChange("AM")}>AM</button>
      <button className={value === "PM" ? "active" : ""} onClick={()=>onChange("PM")}>PM</button>
    </div>
  );
}

window.TypeDropdown = TypeDropdown;
window.PeriodDropdown = PeriodDropdown;
