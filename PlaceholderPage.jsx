// PlaceholderPage — shared "planned feature" screen for routes that are not
// yet implemented. Rendered in place of the main content; sidebar, topbar,
// and AI chat remain visible. Each caller supplies a title, icon, and brief
// description of what the page will eventually do.

function PlaceholderPage({ title, icon, description, onBack }) {
  return (
    <div className="ph-root">
      <div className="ph-card">
        <div className="ph-badge">Planned feature</div>
        <div className="ph-icon-wrap">{icon}</div>
        <h1 className="ph-title">{title}</h1>
        <p className="ph-desc">{description}</p>
        <p className="ph-note">
          This page is under active development and will be available in a future release.
          If you need access sooner, contact your Hygiena representative.
        </p>
        <button className="btn btn-ghost btn-sm ph-back" onClick={onBack}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

window.PlaceholderPage = PlaceholderPage;
