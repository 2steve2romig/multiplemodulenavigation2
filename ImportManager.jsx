// ImportManager
//
// Redesigned "Import data" experience for SureTrend. Two layers:
//   1. Landing — the 7 import types as grouped cards (replaces the legacy
//      colored-square grid). Picking one opens its wizard.
//   2. Wizard — a clean numbered stepper for each import type with the exact
//      step content from the legacy screens (template download, optional
//      industry / file-type / auto-populate controls, site select, upload),
//      plus the per-type upload history table where the legacy app showed one.
//
// Entry points: the Topbar "Quick actions ▸ Import data" flyout deep-links
// straight to a type (target prop), and the Home "Import Data" card opens the
// landing. Built on the SureTrend tokens — no new fonts/colors invented.

/* ---- Shared data --------------------------------------------------------- */
const IMP_SITES = [
  "Beef Processing 1", "Beverage Bottling 1", "Beverage Bottling 2",
  "Dairy Processing 1", "Poultry Processing 1", "Produce Processing 1",
];
const IMP_INDUSTRIES = ["Animal Health", "Food and Beverage", "Health Care", "Janitorial", "Other"];
const IMP_PCR_TYPES = ["Bax (.bax)", "LightCycler96 (.lc96p)", "SDS v2.3, QuantStudio (.eds)", "Biorad CFX"];

/* ---- Icons (simple, single-path where possible) -------------------------- */
const ImpIcons = {
  plans: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h7M3 12h5M3 18h5"/>
      <path d="M17 21s4-4.5 4-8a4 4 0 1 0-8 0c0 3.5 4 8 4 8z"/><circle cx="17" cy="13" r="1.5"/>
    </svg>
  ),
  samples: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M10 3v6.5L5.5 17a2.5 2.5 0 0 0 2.2 3.7h8.6a2.5 2.5 0 0 0 2.2-3.7L14 9.5V3"/>
      <path d="M7.5 14h9"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.8-3.3 3-5 5.5-5s4.7 1.7 5.5 5"/>
      <path d="M16 11.2A3 3 0 0 0 17 5.4M19.5 20c-.4-1.8-1.2-3.2-2.4-4"/>
    </svg>
  ),
  allergens: (
    <img src={RES("assets/allergens_icon.png")} alt="" className="imp-png-icon"/>
  ),
  pcr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3c0 5 10 7 10 12a5 5 0 0 1-10 0M17 21c0-5-10-7-10-12a5 5 0 0 1 10 0"/>
      <path d="M8.5 6.5h7M8.5 17.5h7M9.5 9.5h5M9.5 14.5h5"/>
    </svg>
  ),
  externalData: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>
      <path d="M12 18v-6M9.5 14.5L12 12l2.5 2.5"/>
    </svg>
  ),
  externalLoc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s6-6.5 6-11a6 6 0 1 0-12 0c0 4.5 6 11 6 11z"/>
      <path d="M12 12V7M9.5 9.5L12 7l2.5 2.5"/>
    </svg>
  ),
};

/* ---- Import definitions -------------------------------------------------- */
const PCR_ROWS = [
  ["Molecular Confirmation Trim Combo.bax", "7/11/2025, 11:29 AM", "7/11/2025, 11:29 AM", "Beef Processing 1", "diegotestmode (Diego Casas)"],
  ["Beef Shank Trim Combo Testing July.bax", "7/11/2025, 11:25 AM", "7/11/2025, 11:25 AM", "Beef Processing 1", "diegotestmode (Diego Casas)"],
  ["Beef Shank Trim Combo Testing June.bax", "7/11/2025, 11:22 AM", "7/11/2025, 11:22 AM", "Beef Processing 1", "diegotestmode (Diego Casas)"],
  ["Beef Shank Trim Combo Testing May.bax", "7/11/2025, 11:17 AM", "7/11/2025, 11:18 AM", "Beef Processing 1", "diegotestmode (Diego Casas)"],
  ["Real Time Salmonella Harvest Floor Env", "7/9/2025, 12:21 PM", "7/9/2025, 12:21 PM", "Beef Processing 1", "diegotestmode (Diego Casas)"],
];
const EXT_ROWS = [
  ["Manual input 4/9/2026, 7:53 AM", "4/9/2026, 7:53 AM", "sromigtestmode", "Completed", "Beef Processing 1"],
  ["LimsImportTemplate 18.csv", "3/12/2026, 4:19 PM", "sromigtestmode", "Partially Completed", "Produce Processing 1"],
  ["LimsImportTemplate (17).csv", "3/12/2026, 2:57 PM", "sromigtestmode", "Partially Completed", "Produce Processing 1"],
  ["Manual input 3/10/2026, 8:48 AM", "3/10/2026, 8:48 AM", "sromigtestmode", "Completed", "Multiple sites"],
  ["Manual input 3/9/2026, 9:14 AM", "3/9/2026, 9:14 AM", "sromigtestmode", "Completed", "Produce Processing 1"],
  ["Manual input 3/9/2026, 8:47 AM", "3/9/2026, 8:47 AM", "sromigtestmode", "Completed", "Beef Processing 1"],
  ["import 2.csv", "2/25/2026, 9:00 AM", "sromigtestmode", "Completed", "Produce Processing 1"],
  ["import 1.csv", "2/25/2026, 8:47 AM", "sromigtestmode", "Completed", "Produce Processing 1"],
];

const IMPORTS = [
  {
    id: "plans", group: "core", name: "Plans & Locations", accent: "#E8662A", icon: ImpIcons.plans,
    desc: "Bulk-create sampling plans and their locations from a CSV template.",
    template: "plans and locations",
    steps: [
      { control: "download-industry", label: "Download the CSV template", hint: "Pick the industry that matches your program, then download its plans & locations template." },
      { control: "note", label: "Add plans and locations to the template and save" },
      { control: "site", label: "Select the destination site" },
      { control: "upload", label: "Upload the completed template" },
    ],
  },
  {
    id: "samples", group: "core", name: "Samples", accent: "#2477B3", icon: ImpIcons.samples,
    desc: "Add a batch of samples to an existing site from a CSV template.",
    template: "samples",
    steps: [
      { control: "download", label: "Download the samples CSV template" },
      { control: "note", label: "Add samples to the template and save" },
      { control: "site", label: "Select the destination site" },
      { control: "upload", label: "Upload the completed template" },
    ],
  },
  {
    id: "users", group: "core", name: "Instrument Users", accent: "#1F8A6B", icon: ImpIcons.users,
    desc: "Provision instrument users in bulk so they're ready to log results.",
    template: "instrument users",
    steps: [
      { control: "download", label: "Download the instrument users CSV template" },
      { control: "note", label: "Add instrument users to the template and save" },
      { control: "site", label: "Select the destination site" },
      { control: "upload", label: "Upload the completed template" },
    ],
    history: {
      columns: ["File", "Uploaded On", "Uploaded By", "Status", "Site"],
      rows: [],
    },
  },
  {
    id: "allergens", group: "core", name: "Allergens", accent: "#3B4FA0", icon: ImpIcons.allergens,
    desc: "Import your allergen list so it's available across testing workflows.",
    template: "allergens",
    steps: [
      { control: "download", label: "Download the allergens CSV template" },
      { control: "note", label: "Add allergens to the template and save" },
      { control: "site", label: "Select the destination site" },
      { control: "upload", label: "Upload the completed template" },
    ],
  },
  {
    id: "pcr", group: "ext", name: "PCR Data Upload", accent: "#475569", icon: ImpIcons.externalData,
    desc: "Upload raw PCR run files (.bax, LightCycler, QuantStudio, Bio-Rad CFX).",
    kind: "pcr",
    steps: [
      { control: "site", label: "Select the destination site" },
      { control: "filetype", label: "Select the PCR file type" },
      { control: "upload", label: "Upload the PCR data file" },
    ],
    history: {
      columns: ["File", "Uploaded", "Last Modified", "Status", "Site", "Uploaded By"],
      rows: PCR_ROWS, kind: "pcr", pager: 3,
    },
  },
  {
    id: "external-data", group: "ext", name: "External Data", accent: "#0E7490", icon: ImpIcons.externalData,
    desc: "Bring in third-party / LIMS results and map them to assays and locations.",
    template: "external results",
    steps: [
      { control: "download", label: "Download the external results CSV template" },
      { control: "note", label: "Add external results to the template, then rename and save as a UTF-8 CSV file" },
      { control: "autopop", label: "Auto-populate assay / analyte / location data", hint: "Let SureTrend match incoming rows to existing assays, analytes and locations automatically." },
      { control: "site", label: "Select the destination site" },
      { control: "upload", label: "Upload the CSV file" },
    ],
    history: {
      columns: ["File / Manual Input", "Uploaded On", "Uploaded By", "Status", "Site", ""],
      rows: EXT_ROWS, kind: "ext",
    },
  },
  {
    id: "external-locations", group: "ext", name: "External Locations", accent: "#5B6B7B", icon: ImpIcons.externalLoc,
    desc: "Map external location identifiers to SureTrend sites from a CSV file.",
    template: "external locations",
    steps: [
      { control: "download", label: "Download the external locations CSV template" },
      { control: "note", label: "Add locations to the template, then rename and save as a UTF-8 CSV file" },
      { control: "site", label: "Select the destination site" },
      { control: "upload", label: "Upload the template file" },
    ],
  },
];

/* ---- Small reusable bits ------------------------------------------------- */
function ImpChevDown() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>;
}
function ImpCheck() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>;
}
function ImpClose({ onClose }) {
  if (!onClose) return null;
  return (
    <button type="button" className="imp-close" onClick={onClose} aria-label="Close import manager" title="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
    </button>
  );
}

function ImpDropdown({ value, placeholder, options, onChange, full }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className={"imp-dd" + (full ? " full" : "") + (open ? " open" : "")} ref={ref}>
      <button type="button" className={"imp-dd-trigger" + (value ? "" : " placeholder")} onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span>{value || placeholder}</span>
        <ImpChevDown/>
      </button>
      {open && (
        <div className="imp-dd-pop" role="listbox">
          {options.map(opt => (
            <button key={opt} type="button" role="option" aria-selected={value === opt}
              className={"imp-dd-opt" + (value === opt ? " sel" : "")}
              onClick={() => { onChange(opt); setOpen(false); }}>
              <span>{opt}</span>
              {value === opt && <span className="imp-dd-check"><ImpCheck/></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImpDropzone({ file, accept, onFile, onClear, disabled }) {
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef(null);
  const pick = () => inputRef.current && inputRef.current.click();
  const onDrop = (e) => {
    e.preventDefault(); setOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onFile(f.name, f.size);
  };
  if (file) {
    return (
      <div className="imp-file-chip">
        <span className="fc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg></span>
        <span>
          <div className="fc-name">{file.name}</div>
          <div className="fc-size">{file.size ? (file.size / 1024).toFixed(0) + " KB · ready to import" : "ready to import"}</div>
        </span>
        <button className="fc-x" onClick={onClear} aria-label="Remove file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
      </div>
    );
  }
  return (
    <div className={"imp-drop" + (over ? " over" : "") + (disabled ? " disabled" : "")}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onClick={pick}>
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f.name, f.size); }}/>
      <span className="imp-drop-ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5-5 5 5M12 5v12"/></svg>
      </span>
      <div className="imp-drop-title"><b>Drag &amp; Drop</b> or <span className="imp-link">Browse</span></div>
      <div className="imp-drop-sub">{disabled ? "Select a site first" : "Supports " + (accept === ".bax" ? "PCR run files" : "CSV")}</div>
    </div>
  );
}

/* ---- Landing ------------------------------------------------------------- */
function ImpLanding({ onOpen, onClose }) {
  const groups = [
    { id: "core", label: "SureTrend data" },
    { id: "ext", label: "External & instrument data" },
  ];
  return (
    <div className="imp-page">
      <ImpClose onClose={onClose}/>
      <div className="imp-head">
        <span className="imp-eyebrow">Import Manager</span>
        <h1 className="imp-title">Import data</h1>
        <p className="imp-sub">Bring data into SureTrend. Choose what you're importing — each type walks you through a short, guided upload.</p>
      </div>
      {groups.map(g => (
        <div className="imp-group" key={g.id}>
          <div className="imp-group-label">{g.label}</div>
          <div className="imp-grid">
            {IMPORTS.filter(i => i.group === g.id).map(imp => (
              <button key={imp.id} className="imp-card" style={{ "--imp-accent": imp.accent }} onClick={() => onOpen(imp.id)}>
                <span className="imp-card-icon">{imp.icon}</span>
                <span className="imp-card-body">
                  <span className="imp-card-title">{imp.name}</span>
                  <span className="imp-card-desc">{imp.desc}</span>
                  <span className="imp-card-meta">
                    {imp.kind === "pcr" ? "Direct file upload" : "CSV template"}
                    {imp.history && <><span className="dot"/>Upload history</>}
                  </span>
                </span>
                <span className="imp-card-go">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- History table ------------------------------------------------------- */
function ImpStatus({ label }) {
  const cls = /partial/i.test(label) ? "partial" : /process|pending|queue/i.test(label) ? "proc" : "ok";
  return <span className={"imp-status " + cls}><span className="sdot"/>{label}</span>;
}
function ImpHistory({ def }) {
  const [page, setPage] = React.useState(1);
  const rows = def.rows;
  return (
    <div className="imp-history">
      <div className="imp-history-head">
        <span className="imp-history-title">Upload history</span>
        <span className="imp-history-count">{rows.length ? rows.length + " uploads" : "No uploads yet"}</span>
      </div>
      <div className="imp-table-wrap">
        <table className="imp-table">
          <thead><tr>{def.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={def.columns.length}><div className="imp-empty">No data</div></td></tr>
            ) : def.kind === "pcr" ? rows.map((r, i) => (
              <tr key={i}>
                <td className="col-file">{r[0]}</td>
                <td className="muted">{r[1]}</td>
                <td className="muted">{r[2]}</td>
                <td><span className="lnk">View rack</span></td>
                <td>{r[3]}</td>
                <td className="muted">{r[4]}</td>
              </tr>
            )) : rows.map((r, i) => (
              <tr key={i}>
                <td className="col-file">{r[0]}</td>
                <td className="muted">{r[1]}</td>
                <td className="muted">{r[2]}</td>
                <td><ImpStatus label={r[3]}/></td>
                <td>{r[4]}</td>
                <td><span className="lnk">File view</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {def.pager && rows.length > 0 && (
          <div className="imp-pager">
            {Array.from({ length: def.pager }, (_, i) => i + 1).map(p => (
              <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Wizard -------------------------------------------------------------- */
function ImpWizard({ imp, onBack, onToast, onClose }) {
  const [st, setSt] = React.useState({
    downloaded: false, industry: "Food and Beverage", site: "", fileType: "", autopop: false, file: null,
  });
  const set = (patch) => setSt(s => ({ ...s, ...patch }));

  const isDone = (control) => {
    switch (control) {
      case "download": case "download-industry": case "note": case "autopop": return st.downloaded;
      case "site": return !!st.site;
      case "filetype": return !!st.fileType;
      case "upload": return !!st.file;
      default: return false;
    }
  };
  const activeIndex = imp.steps.findIndex(s => !isDone(s.control));

  const needsFileType = imp.kind === "pcr";
  const canSubmit = !!st.site && !!st.file && (!needsFileType || !!st.fileType);

  const submit = () => {
    onToast(imp.name + " import started for " + st.site + ".");
    set({ file: null });
  };

  return (
    <div className="imp-page">
      <ImpClose onClose={onClose}/>
      <button className="imp-back" onClick={onBack}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        All imports
      </button>

      <div className="imp-wiz-head">
        <span className="imp-wiz-icon" style={{ "--imp-accent": imp.accent, boxShadow: "0 8px 20px -8px " + imp.accent }}>{imp.icon}</span>
        <div className="imp-wiz-htext">
          <h2>Import {imp.name}</h2>
          <p>{imp.desc}</p>
        </div>
      </div>

      <div className="imp-wiz-card">
        <ol className="imp-steps">
          {imp.steps.map((step, i) => {
            const done = isDone(step.control);
            const active = i === activeIndex;
            return (
              <li key={i} className={"imp-step" + (done ? " done" : "") + (active ? " active" : "")}>
                <span className="imp-step-num">{done ? <ImpCheck/> : i + 1}</span>
                <div className="imp-step-main">
                  <div className="imp-step-label">{step.label}</div>
                  {step.hint && <div className="imp-step-hint">{step.hint}</div>}
                  <div className="imp-step-control">{renderControl(step.control, imp, st, set)}</div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="imp-wiz-foot">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>Dismiss</button>
          <span className="spacer"/>
          <button className={"btn btn-primary" + (canSubmit ? "" : " is-disabled")} disabled={!canSubmit} onClick={submit}>
            Import {imp.name}
          </button>
        </div>
      </div>

      {imp.history && <ImpHistory def={imp.history}/>}
    </div>
  );
}

function renderControl(control, imp, st, set) {
  switch (control) {
    case "download-industry":
      return (
        <div className="imp-row">
          <ImpDropdown value={st.industry} options={IMP_INDUSTRIES} onChange={v => set({ industry: v })}/>
          <DownloadBtn st={st} set={set}/>
          {st.downloaded && <DonePill/>}
        </div>
      );
    case "download":
      return (
        <div className="imp-row">
          <DownloadBtn st={st} set={set}/>
          {st.downloaded && <DonePill/>}
        </div>
      );
    case "note":
      return null;
    case "autopop":
      return (
        <label className="imp-check">
          <input type="checkbox" checked={st.autopop} onChange={e => set({ autopop: e.target.checked })}/>
          <span className="imp-check-box"><ImpCheck/></span>
          <span>{st.autopop ? "Enabled" : "Off — map columns manually"}</span>
        </label>
      );
    case "site":
      return <ImpDropdown value={st.site} placeholder="Select site…" options={IMP_SITES} onChange={v => set({ site: v })} full/>;
    case "filetype":
      return <ImpDropdown value={st.fileType} placeholder="Select file type…" options={IMP_PCR_TYPES} onChange={v => set({ fileType: v })} full/>;
    case "upload":
      return (
        <ImpDropzone
          file={st.file}
          accept={imp.kind === "pcr" ? ".bax" : ".csv"}
          disabled={!st.site || (imp.kind === "pcr" && !st.fileType)}
          onFile={(name, size) => set({ file: { name, size } })}
          onClear={() => set({ file: null })}/>
      );
    default:
      return null;
  }
}

function DownloadBtn({ st, set }) {
  return (
    <button className="btn btn-primary btn-sm imp-dl-btn" onClick={() => set({ downloaded: true })}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>
      {st.downloaded ? "Download again" : "Download"}
    </button>
  );
}
function DonePill() {
  return <span className="imp-done-pill"><ImpCheck/> Template downloaded</span>;
}

/* ---- Root ---------------------------------------------------------------- */
function ImportManager({ target, onConsumeTarget, onClose }) {
  const [openId, setOpenId] = React.useState(target && IMPORTS.some(i => i.id === target) ? target : null);
  const [toast, setToast] = React.useState(null);

  // React to a new deep-link target after mount (submenu click while on page).
  React.useEffect(() => {
    if (target && IMPORTS.some(i => i.id === target)) {
      setOpenId(target);
      onConsumeTarget && onConsumeTarget();
    }
  }, [target]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 3600);
  };

  const imp = openId ? IMPORTS.find(i => i.id === openId) : null;

  return (
    <>
      {imp
        ? <ImpWizard imp={imp} onBack={() => setOpenId(null)} onToast={showToast} onClose={onClose}/>
        : <ImpLanding onOpen={setOpenId} onClose={onClose}/>}
      {toast && (
        <div className="imp-toast">
          <span className="t-ic"><ImpCheck/></span>
          {toast}
        </div>
      )}
    </>
  );
}

window.ImportManager = ImportManager;
window.IMPORTS = IMPORTS;
