// IQAppView
//
// A single IQ app's environment. Themed end-to-end by the app's brand color
// so the user always knows which environment they're in: tinted header band,
// app icon, accent stat values, and accent affordances. Generalizes the ATP
// example to every app in the catalog.

function IQAppView({ id, onNav }) {
  const p = window.IQ_BY_ID[id];

  if (!p) {
    return (
      <div className="iqa-page">
        <div className="iqa-missing">
          <p>That app isn’t available.</p>
          <button className="iqa-back" onClick={() => onNav("iqsuite")}>← Back to IQ Suite</button>
        </div>
      </div>
    );
  }

  const s = p.stats;

  return (
    <div className="iqa-page" style={{ "--iq": p.color }}>
      <div className="iqa-topbar">
        <button className="iqa-back" onClick={() => onNav("iqsuite")}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          IQ Suite
        </button>
        <IQSwitcher currentId={p.id} onNav={onNav} />
      </div>

      <header className="iqa-hero">
        <img
          className="iqa-hero-icon"
          src={RES("assets/iq-icons/iq-" + p.id + ".png")}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
        <div className="iqa-hero-text">
          <div className="iqa-hero-title">
            <span className="iqa-hero-name">{p.name}</span>
            <span className="iqa-hero-iq">IQ</span>
          </div>
          <p className="iqa-hero-desc">{p.desc}</p>
        </div>
        <span className="iqa-hero-status">
          <span className="iqa-hero-dot" aria-hidden="true" /> Active
        </span>
      </header>

      <p className="iqa-blurb">{p.blurb}</p>

      <div className="iqa-stats">
        <div className="iqa-stat">
          <div className="iqa-stat-val">{s.open}</div>
          <div className="iqa-stat-label">Open items</div>
          <div className="iqa-stat-meta">+{s.openDelta} this week</div>
        </div>
        <div className="iqa-stat">
          <div className="iqa-stat-val">{s.completed}</div>
          <div className="iqa-stat-label">Completed</div>
          <div className="iqa-stat-meta">{s.onTime}% on time</div>
        </div>
        <div className="iqa-stat">
          <div className="iqa-stat-val">{s.passRate}%</div>
          <div className="iqa-stat-label">Pass rate</div>
          <div className="iqa-stat-meta">last 30 days</div>
        </div>
      </div>

      <section className="iqa-panel">
        <div className="iqa-panel-head">
          <span className="iqa-panel-eyebrow">Workspace — {p.name} IQ</span>
        </div>
        <p className="iqa-panel-copy">
          Module content for <b>{p.name} IQ</b> renders here. This is a prototype
          environment — each app ships its own data, views, and actions inside this
          themed shell.
        </p>
        <div className="iqa-actions">
          <button className="iqa-btn iqa-btn-primary">Open {p.name} workspace</button>
          <button className="iqa-btn iqa-btn-ghost">View documentation</button>
        </div>
        <code className="iqa-route">/{p.id}/home</code>
      </section>
    </div>
  );
}

window.IQAppView = IQAppView;
