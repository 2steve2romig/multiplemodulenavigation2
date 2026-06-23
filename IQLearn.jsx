// IQLearn
//
// Marketing / "learn more" page for an IQ module the user is NOT subscribed to.
// Reached from the IQ Suite launcher (or the IQ Suite grid) when a module is
// inactive. Themed by the module's brand color. The primary CTA — "Get module
// now" — turns the module on and opens Module Subscription Management with a
// confirmation prompt.

function IQLearn({ id, onNav, onGet }) {
  const p = window.IQ_BY_ID[id];

  if (!p) {
    return (
      <div className="iqa-page">
        <div className="iqa-missing">
          <p>That module isn’t available.</p>
          <button className="iqa-back" onClick={() => onNav("iqsuite")}>← Back to IQ Suite</button>
        </div>
      </div>
    );
  }

  const subs = useIQSubs();
  const on = !!subs[id];
  const features = p.features && p.features.length
    ? p.features
    : [
        "Works inside your existing SureTrend workspace",
        "Site- and role-based access controls included",
        "No separate login — part of your IQ Suite",
      ];

  const fmtUSD = (n) => "$" + n.toLocaleString("en-US");

  return (
    <div className="iqa-page iql-learn" style={{ "--iq": p.color }}>
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
        <span className={"iql-learn-badge" + (on ? " is-on" : "")}>
          {on ? "In your plan" : "Not in your plan"}
        </span>
      </header>

      <p className="iqa-blurb">{p.blurb}</p>

      <section className="iql-learn-grid">
        <div className="iql-learn-features">
          <h3 className="iql-learn-h">What you get</h3>
          <ul className="iql-learn-list">
            {features.map((f, i) => (
              <li key={i} className="iql-learn-item">
                <span className="iql-learn-check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <aside className="iql-learn-buy">
          <div className="iql-learn-price-label">Add to your subscription</div>
          <div className="iql-learn-price">{fmtUSD(p.price)}<span className="iql-learn-per">/mo</span></div>
          {on ? (
            <React.Fragment>
              <div className="iql-learn-owned">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
                Active on your account
              </div>
              <button className="iqa-btn iqa-btn-primary iql-learn-cta" onClick={() => { onNav("iq:" + id); }}>
                Open {p.name} IQ
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="iqa-btn iqa-btn-primary iql-learn-cta" onClick={() => onGet(id)}>
                Buy now
              </button>
              <button type="button" className="iql-learn-trial" onClick={() => onGet(id)}>
                Start free 7-day trial
              </button>
              <p className="iql-learn-fine">Billing updates on your next invoice. Cancel anytime from Module Subscription Management.</p>
            </React.Fragment>
          )}
        </aside>
      </section>
    </div>
  );
}

window.IQLearn = IQLearn;
