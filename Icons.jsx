// Minimal Lucide-style SVG icons (1.5–2px, currentColor).
const svg = (d, opts = {}) => (
  <svg viewBox="0 0 24 24" fill={opts.fill || "none"} stroke="currentColor" strokeWidth={opts.sw || 2}
       strokeLinecap="round" strokeLinejoin="round" width={opts.size || 16} height={opts.size || 16}>
    {d}
  </svg>
);

const IHome = (p) => svg(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>, p);
const IDashboard = (p) => svg(<><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>, p);
const IResults = (p) => svg(<><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>, p);
const IReports = (p) => svg(<><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></>, p);
const ISites = (p) => svg(<><circle cx="12" cy="10" r="3"/><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/></>, p);
const IMap = (p) => svg(<><path d="M9 4l-6 3v13l6-3 6 3 6-3V4l-6 3z"/><path d="M9 4v13M15 7v13"/></>, p);
const ISearch = (p) => svg(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>, p);
const IBell = (p) => svg(<><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>, p);
const IPlus = (p) => svg(<><path d="M12 5v14M5 12h14"/></>, p);
const IDownload = (p) => svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></>, p);
const IArrow = (p) => svg(<><path d="M5 12h14M13 5l7 7-7 7"/></>, p);
const IPlay = (p) => svg(<path d="M6 4l14 8-14 8z"/>, { ...p, fill: "currentColor" });
const IUsers = (p) => svg(<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></>, p);
const IGrid = (p) => svg(<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>, p);
const ICheck = (p) => svg(<path d="M5 12l4 4L19 6"/>, p);
const IX = (p) => svg(<><path d="M6 6l12 12M6 18L18 6"/></>, p);
const IWarn = (p) => svg(<><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></>, p);
const IFilter = (p) => svg(<path d="M22 3H2l8 9.5V21l4-2v-6.5z"/>, p);
const ISettings = (p) => svg(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>, p);
const ILogo = (p) => (
  // Placeholder — real SureTrend logo not supplied. Drop final SVG here when available.
  <svg viewBox="0 0 56 56" width={p?.size||28} height={p?.size||28}>
    <rect x="4" y="4" width="48" height="48" rx="8" fill="none" stroke={p?.color||"#29ABE2"} strokeWidth="1.5" strokeDasharray="3 3"/>
    <text x="28" y="33" textAnchor="middle" fontFamily="Open Sans, sans-serif" fontSize="12" fontWeight="700" fill={p?.color||"#0D6A99"}>ST</text>
  </svg>
);

const IAuditTrail = (p) => svg(<><path d="M4 7h8M4 12h6M4 17h5"/><circle cx="17" cy="15" r="4"/><path d="M20 18l2.5 2.5"/></>, p);
const ISamplingPlans = (p) => svg(<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8l1.5 1.5L13 7M9 13l1.5 1.5L13 12M9 18l1.5 1.5L13 17"/></>, p);
const IQuant = (p) => svg(<><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></>, p);
const IKleanz = (p) => <span className="sb-img-icon" aria-hidden="true" />;

Object.assign(window, { IHome, IDashboard, IResults, IReports, ISites, IMap, ISearch, IBell, IPlus, IDownload, IArrow, IPlay, IUsers, IGrid, ICheck, IX, IWarn, IFilter, ISettings, IAuditTrail, ISamplingPlans, IQuant, IKleanz, ILogo });
