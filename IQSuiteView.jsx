// IQSuiteView
//
// "View all IQ apps" landing — reached from the launcher footer link or the
// sidebar IQ Suite button. Lists every app in the suite, filterable by
// category and searchable. Clicking an app opens its themed environment.

function IQSuiteView({ onNav, onClose }) {
  const [cat, setCat] = React.useState("all");
  const [q, setQ] = React.useState("");
  const subs = useIQSubs();

  const query = q.trim().toLowerCase();
  const items = window.IQ_CATALOG.filter((p) => {
    const catOk = cat === "all" || p.category === cat;
    const qOk = !query ||
      p.name.toLowerCase().includes(query) ||
      p.desc.toLowerCase().includes(query);
    return catOk && qOk;
  });

  const catLabel = (id) => (window.IQ_CATEGORIES.find((c) => c.id === id) || {}).label;

  return (
    <div className="iqs-page">
      <header className="iqs-head">
        <div className="iqs-head-main">
          <h1 className="iqs-title">IQ Suite</h1>
          <p className="iqs-sub">
            Every connected app in your food-safety platform. Open an app to work in it.
          </p>
        </div>
        <button className="iqs-close" onClick={onClose} aria-label="Close IQ Suite">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
      </header>

      <div className="iqs-tabs" role="tablist">
        {window.IQ_CATEGORIES.map((c) => {
          const count = c.id === "all"
            ? window.IQ_CATALOG.length
            : window.IQ_CATALOG.filter((p) => p.category === c.id).length;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={cat === c.id}
              className={"iqs-tab" + (cat === c.id ? " is-active" : "")}
              onClick={() => setCat(c.id)}
            >
              {c.label}
              <span className="iqs-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="iqs-grid">
        {items.map((p) => {
          const on = !!subs[p.id];
          return (
          <button
            key={p.id}
            type="button"
            className={"iqs-card" + (on ? "" : " not-active")}
            style={{ "--iq": p.color }}
            onClick={() => onNav((on ? "iq:" : "learn:") + p.id)}
          >
            <span className="iqs-card-bar" aria-hidden="true" />
            <span className="iqs-card-iconwrap">
              <img
                className="iqs-card-icon"
                src={RES("assets/iq-icons/iq-" + p.id + ".png")}
                alt=""
                aria-hidden="true"
                draggable="false"
              />
              {on ? null : (
                <span className="iqs-card-lock" title="Not licensed — view pricing" aria-label="Not licensed">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                </span>
              )}
            </span>
            <span className="iqs-card-body">
              <span className="iqs-card-name">
                {p.name}<span className="iqs-card-iq">IQ</span>
              </span>
              <span className="iqs-card-desc">{p.desc}</span>
              <span className="iqs-card-cat">
                {catLabel(p.category)}
                {p._source === 'org' ? <span className="iqs-corp-badge">Corporate</span> : null}
              </span>
            </span>
            <span className="iqs-card-go" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </button>);
        })}
        {items.length === 0 ? (
          <div className="iqs-empty">No apps in this category.</div>
        ) : null}
      </div>
    </div>
  );
}

window.IQSuiteView = IQSuiteView;
