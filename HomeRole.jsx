// HomeRole — demo strip for switching between three personas on the
// SureTrend home screen:
//   - Original Concept (Dave G.) — restore the home layout from before
//     the persona work began
//   - Admin / Owner       (Riley S.) — multi-site portfolio view
//   - Lab Tech            (Jordan M.) — single-tech daily workflow
//
// Minimizable: when collapsed it shrinks to a single line showing the
// active persona + an expand button so it stays out of the way during
// long demos. State persists in localStorage.

const ROLE_ITEMS = [
  {
    id: "original",
    label: "Original Concept",
    sub: "Dave G.",
    color: "#6B7280",
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
        <path d="M3 12a9 9 0 0 1 14.65-7" />
      </svg>
    ),
  },
  {
    id: "tech",
    label: "Lab Tech",
    sub: "Jordan M.",
    color: "#16A34A",
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2v6.5L4.5 18a3 3 0 0 0 2.6 4.5h9.8A3 3 0 0 0 19.5 18L14 8.5V2" />
        <line x1="10" y1="2" x2="14" y2="2" />
        <line x1="8" y1="14" x2="16" y2="14" />
      </svg>
    ),
  },
  {
    id: "admin",
    label: "Admin / Owner",
    sub: "Riley S.",
    color: "#0D6A99",
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" />
      </svg>
    ),
  },
];

function RoleToggle({ role, onChange }) {
  const [minimized, setMinimized] = React.useState(() => {
    try { return localStorage.getItem("role-strip-min") === "1"; } catch (e) { return false; }
  });

  React.useEffect(() => {
    try { localStorage.setItem("role-strip-min", minimized ? "1" : "0"); } catch (e) {}
  }, [minimized]);

  const current = ROLE_ITEMS.find((i) => i.id === role) || ROLE_ITEMS[1];

  if (minimized) {
    return (
      <button
        className="role-strip role-strip-min"
        onClick={() => setMinimized(false)}
        aria-label="Expand persona toggle"
        title="Expand persona toggle">
        <span className="role-strip-eyebrow">DEMO</span>
        <span className="role-strip-min-text">Viewing as</span>
        <span className="role-seg-icon role-seg-icon-min">{current.icon}</span>
        <span className="role-strip-min-name">{current.label}</span>
        <span className="role-strip-min-sub">· {current.sub}</span>
        <span className="role-strip-min-spacer" />
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="role-strip-min-icon">
          <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="role-strip" role="region" aria-label="Persona toggle (demo)">
      <div className="role-strip-left">
        <span className="role-strip-eyebrow">DEMO</span>
        <span className="role-strip-label">View home as</span>
      </div>
      <div className="role-seg" role="tablist">
        {ROLE_ITEMS.map((it) => (
          <button
            key={it.id}
            role="tab"
            aria-selected={role === it.id}
            className={"role-seg-btn" + (role === it.id ? " is-active" : "")}
            onClick={() => onChange(it.id)}>
            <span className="role-seg-icon">{it.icon}</span>
            <span className="role-seg-text">
              <span className="role-seg-label">{it.label}</span>
              <span className="role-seg-sub">{it.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <button
        className="role-strip-min-btn"
        onClick={() => setMinimized(true)}
        aria-label="Minimize persona toggle"
        title="Minimize">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

window.RoleToggle = RoleToggle;
