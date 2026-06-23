// IQSwitcher
//
// A "Switch module" dropdown shown on individual IQ pages (the module
// environment and the learn-more page) so the user can jump straight to
// another module without returning to the IQ Suite landing. Active modules
// open their workspace; inactive ones open their learn-more page.

function IQSwitcher({ currentId, onNav }) {
  const [open, setOpen] = React.useState(false);
  const subs = useIQSubs();
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={"iqsw" + (open ? " open" : "")} ref={ref}>
      <button
        type="button"
        className="iqsw-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}>
        <svg className="iqsw-grid" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
          <rect x="2" y="2" width="6" height="6" rx="1.4" />
          <rect x="9.5" y="2" width="6" height="6" rx="1.4" />
          <rect x="17" y="2" width="5" height="6" rx="1.4" />
          <rect x="2" y="9.5" width="6" height="6" rx="1.4" />
          <rect x="9.5" y="9.5" width="6" height="6" rx="1.4" />
          <rect x="17" y="9.5" width="5" height="6" rx="1.4" />
        </svg>
        <span className="iqsw-trigger-label">Switch module</span>
        <svg className="iqsw-chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="iqsw-pop iqsw-popgrid" role="listbox" aria-label="Switch module">
          {window.IQ_CATALOG.map((p) => {
            const on = !!subs[p.id];
            const isCur = p.id === currentId;
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={isCur}
                className={"iqsw-cell" + (isCur ? " is-current" : "")}
                title={p.name + " IQ" + (on ? "" : " — not licensed")}
                onClick={() => { setOpen(false); if (!isCur) onNav((on ? "iq:" : "learn:") + p.id); }}>
                <span className="iqsw-cell-iconwrap">
                  <img className="iqsw-cell-icon" src={RES("assets/iq-icons/iq-" + p.id + ".png")} alt="" aria-hidden="true" draggable="false" />
                  {on ? null : (
                    <span className="iqsw-cell-lock" aria-label="Not licensed">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                    </span>
                  )}
                </span>
                <span className="iqsw-cell-name">{p.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

window.IQSwitcher = IQSwitcher;
