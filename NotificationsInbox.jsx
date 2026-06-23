// NotificationsInbox
//
// Full-page (modal-overlay) inbox surface that opens when the user clicks
// "View all" in the bell dropdown. It lives ABOVE the app (full-bleed
// overlay) so it can be closed without navigating — closes on:
//   • the X button in the header
//   • the "Back to Results" link
//   • Escape key
//   • clicking the dim backdrop
//
// Behavior
//   • Sorted by priority (urgent → high → normal → low) then date desc
//   • Read/unread indicator (left rail accent + bold title for unread)
//   • Urgency pill on the row + colored left border for urgent / high
//   • Star (important) and Archive actions; archived items move to a
//     separate tab and stop counting toward unread
//   • Pagination (10 per page) with Prev/Next + page numbers
//   • Search + filter (All / Unread / Starred / Archived)
//   • Reading pane (right side): click a row to read full message; messages
//     are read-only — no replies (this is announcement-style messaging)

const SAMPLE_NOTIFICATIONS = [
{
  id: "n-2026-05-06-001",
  urgency: "urgent",
  category: "Outage",
  subject: "Scheduled maintenance — Sunday May 10, 02:00–04:00 UTC",
  preview: "SureTrend Cloud will be briefly unavailable while we deploy v4.18. Sampling devices will queue locally and sync automatically once service is restored.",
  body: [
  "SureTrend Cloud will be briefly unavailable on Sunday, May 10 between 02:00 and 04:00 UTC while we deploy v4.18.",
  "During the window:",
  " • The web app and reporting APIs will be offline.",
  " • EnSURE Touch and SystemSURE Plus instruments will queue results locally and sync automatically once service resumes — no data will be lost.",
  " • Scheduled report emails will be delayed but not skipped.",
  "If you have questions, contact support@hygiena.com."],

  sender: "SureTrend Operations",
  createdAt: "2026-05-06T15:42:00Z",
  read: false,
  starred: false,
  archived: false
},
{
  id: "n-2026-05-05-014",
  urgency: "high",
  category: "Issue",
  subject: "Action required: 4 instruments missed their calibration window",
  preview: "Instruments SC-104, SC-118, ET-220 and ET-221 have not been calibrated in the last 30 days and will be flagged on reports until calibration is recorded.",
  body: [
  "The following instruments have exceeded their 30-day calibration window:",
  " • SC-104 — Site 4, last calibrated 2026-04-04",
  " • SC-118 — Site 4, last calibrated 2026-04-02",
  " • ET-220 — Site 7, last calibrated 2026-04-01",
  " • ET-221 — Site 7, last calibrated 2026-04-01",
  "Until calibration is recorded, results from these devices will display a calibration warning on all reports.",
  "Open Settings → Instrument Management to record a calibration, or assign a technician via Sampling Plans."],

  sender: "Alert system",
  createdAt: "2026-05-05T09:11:00Z",
  read: false,
  starred: true,
  archived: false
},
{
  id: "n-2026-05-04-008",
  urgency: "normal",
  category: "New feature",
  subject: "Customizable dashboards are here",
  preview: "Drag tiles to rearrange, pin saved filters as widgets, and share dashboards across your organization. Available now in the Dashboard tab.",
  body: [
  "We've shipped customizable dashboards.",
  "What's new:",
  " • Drag and drop to rearrange dashboard tiles",
  " • Pin any saved filter as a widget",
  " • Share a dashboard with your organization or a specific role",
  " • Dark-mode chart palettes",
  "Open the Dashboard tab and click 'Edit layout' to try it."],

  sender: "Product updates",
  createdAt: "2026-05-04T18:00:00Z",
  read: false,
  starred: false,
  archived: false
},
{
  id: "n-2026-05-03-021",
  urgency: "high",
  category: "Issue",
  subject: "3 results out of spec at Site 4 (overnight run)",
  preview: "Last night's run on the Receiving Bay 2 sampling plan flagged 3 fail readings above the 100 RLU threshold. Review and re-swab if appropriate.",
  body: [
  "Site 4 — Receiving Bay 2 — 2026-05-03 overnight run",
  "Failures (RLU):",
  " • Drain cover, station 4 — 312 RLU",
  " • Wall panel, station 7 — 248 RLU",
  " • Floor seam, station 11 — 178 RLU",
  "Threshold: 100 RLU. Recommend re-cleaning and re-swabbing the affected stations before the next run."],

  sender: "Alert system",
  createdAt: "2026-05-03T06:15:00Z",
  read: true,
  starred: false,
  archived: false
},
{
  id: "n-2026-05-02-003",
  urgency: "normal",
  category: "Update",
  subject: "Quant analysis is now in beta",
  preview: "Run quantitative microbial analysis side-by-side with your ATP results. Looking for design partners — opt in from Settings → Account.",
  body: [
  "Quant analysis (beta) lets you bring quantitative microbial counts into SureTrend Cloud and view them alongside ATP and allergen data.",
  "Beta access is opt-in. We're prioritizing customers who can give us regular feedback over the next 6 weeks.",
  "Opt in from Settings → Account Management → Beta features."],

  sender: "Product updates",
  createdAt: "2026-05-02T13:30:00Z",
  read: true,
  starred: true,
  archived: false
},
{
  id: "n-2026-04-30-011",
  urgency: "low",
  category: "Course",
  subject: "Course due date exceeded — Rich Saunders",
  preview: "The 'Foundations of Environmental Monitoring' course assigned to Rich Saunders is past its due date.",
  body: [
  "The course 'Foundations of Environmental Monitoring' assigned to Rich Saunders was due 2026-04-25 and is now overdue.",
  "You can extend the due date or reassign the course from E-Learning → Assignments."],

  sender: "E-Learning",
  createdAt: "2026-04-30T16:00:00Z",
  read: true,
  starred: false,
  archived: false
},
{
  id: "n-2026-04-28-047",
  urgency: "normal",
  category: "Update",
  subject: "Two new report templates: FSMA & SQF audit-ready exports",
  preview: "Generate audit-ready PDFs that map directly to FSMA 204 and SQF Edition 9 requirements. Available under Reports → New report.",
  body: [
  "We've added two new templates to Reports:",
  " • FSMA 204 traceability summary",
  " • SQF Edition 9 environmental monitoring",
  "Each template pre-populates with your saved filters and produces an audit-ready PDF with traceable record IDs."],

  sender: "Product updates",
  createdAt: "2026-04-28T11:45:00Z",
  read: true,
  starred: false,
  archived: false
},
{
  id: "n-2026-04-25-033",
  urgency: "low",
  category: "Course",
  subject: "Welcome — your account is ready",
  preview: "Your SureTrend Cloud account has been provisioned. Three short tutorials will help you get up to speed in under 15 minutes.",
  body: [
  "Welcome to SureTrend Cloud.",
  "We recommend starting with these three short tutorials:",
  " • Tour of the Results grid (3 min)",
  " • Setting up your first sampling plan (5 min)",
  " • Sharing dashboards with your team (4 min)",
  "You'll find them under Help → Getting started."],

  sender: "Onboarding",
  createdAt: "2026-04-25T08:00:00Z",
  read: true,
  starred: false,
  archived: true
},
{
  id: "n-2026-04-22-077",
  urgency: "normal",
  category: "Update",
  subject: "API rate limits increased to 1,000 req/min",
  preview: "We've raised default API rate limits from 200 to 1,000 requests per minute on the Cloud tier. No action needed.",
  body: [
  "Effective today, the default API rate limit on the SureTrend Cloud tier has been raised from 200 to 1,000 requests per minute.",
  "If you maintain custom integrations that throttled themselves to the old limit, you can safely raise that ceiling."],

  sender: "Product updates",
  createdAt: "2026-04-22T17:20:00Z",
  read: true,
  starred: false,
  archived: false
},
{
  id: "n-2026-04-20-002",
  urgency: "low",
  category: "Update",
  subject: "April newsletter: monthly KPI roundup",
  preview: "Across SureTrend customers, average pass rate held at 94.2% in April. Read the highlights and tips for May.",
  body: [
  "April highlights:",
  " • Network-wide average pass rate: 94.2% (▲ 0.4 pts vs March)",
  " • New site rollouts: 142",
  " • Most-improved category: Receiving zones (+1.8 pts)",
  "Tips for May: focus on reducing variance on overnight runs — see the included playbook."],

  sender: "SureTrend News",
  createdAt: "2026-04-20T14:00:00Z",
  read: true,
  starred: false,
  archived: true
},
{
  id: "n-2026-04-18-090",
  urgency: "normal",
  category: "Issue",
  subject: "Sampling plan 'Site 7 — Daily AM' has 2 unassigned stations",
  preview: "Stations 14 and 15 on the Site 7 daily AM sampling plan have no assigned sampler. Results are still being collected but won't be attributed.",
  body: [
  "Sampling plan: Site 7 — Daily AM",
  "Unassigned stations: 14, 15",
  "Currently, results from these stations will land in the plan's catch-all bucket and won't be attributed to a sampler. Assign owners under Sampling Plans → Site 7 — Daily AM."],

  sender: "Alert system",
  createdAt: "2026-04-18T10:05:00Z",
  read: true,
  starred: false,
  archived: false
},
{
  id: "n-2026-04-15-019",
  urgency: "low",
  category: "Course",
  subject: "Reminder: monthly compliance refresher available",
  preview: "Your monthly 5-minute compliance refresher is available. Completing it keeps your audit trail current.",
  body: [
  "Your monthly 5-minute compliance refresher is available.",
  "Topics this month: cross-contamination, allergen swabbing, and corrective-action documentation.",
  "Completing it keeps your audit trail current for FSMA 204 and SQF Edition 9."],

  sender: "E-Learning",
  createdAt: "2026-04-15T09:30:00Z",
  read: true,
  starred: false,
  archived: false
}];


const URGENCY_RANK = { urgent: 0, high: 1, normal: 2, low: 3 };

const URGENCY_META = {
  urgent: { label: "Urgent", swatch: "#F44336", soft: "#FDECEA" },
  high: { label: "High", swatch: "#E8662A", soft: "#FFF1E8" },
  normal: { label: "Normal", swatch: "#29ABE2", soft: "#E8F7FD" },
  low: { label: "Low", swatch: "#9E9E9E", soft: "#F2F2F2" }
};

function relativeTime(iso) {
  const now = new Date();
  const then = new Date(iso);
  const ms = now - then;
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fullDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

const PAGE_SIZE = 8;

function NotificationsInbox({ open, onClose, initialId }) {
  const [items, setItems] = React.useState(SAMPLE_NOTIFICATIONS);
  const [tab, setTab] = React.useState("all"); // all | unread | starred | archived
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState(null);
  const [sortBy, setSortBy] = React.useState("priority"); // priority | newest | oldest | unread

  // When opened with an initialId (e.g. user clicked a row in the bell
  // dropdown), pre-select that message and mark it read.
  React.useEffect(() => {
    if (open && initialId) {
      setSelectedId(initialId);
      setItems(arr => arr.map(n => n.id === initialId ? { ...n, read: true } : n));
    }
    if (!open) setSelectedId(null);
  }, [open, initialId]);

  // Close on Escape + lock body scroll
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {if (e.key === "Escape") onClose();};
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Reset page when changing tab/query
  React.useEffect(() => {setPage(1);}, [tab, query, sortBy]);

  if (!open) return null;

  const filtered = items.
  filter((n) => {
    if (tab === "archived") return n.archived;
    if (n.archived) return false;
    if (tab === "unread") return !n.read;
    if (tab === "starred") return n.starred;
    return true;
  }).
  filter((n) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      n.subject.toLowerCase().includes(q) ||
      n.preview.toLowerCase().includes(q) ||
      n.sender.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q));

  }).
  sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === "unread") {
      const ua = a.read ? 1 : 0;
      const ub = b.read ? 1 : 0;
      if (ua !== ub) return ua - ub;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    // priority (default)
    const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (u !== 0) return u;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const counts = {
    all: items.filter((n) => !n.archived).length,
    unread: items.filter((n) => !n.archived && !n.read).length,
    starred: items.filter((n) => !n.archived && n.starred).length,
    archived: items.filter((n) => n.archived).length
  };

  const selected = items.find((n) => n.id === selectedId) || null;

  function update(id, patch) {
    setItems((arr) => arr.map((n) => n.id === id ? { ...n, ...patch } : n));
  }
  function openMessage(n) {
    setSelectedId(n.id);
    if (!n.read) update(n.id, { read: true });
  }
  function toggleStar(n, e) {e.stopPropagation();update(n.id, { starred: !n.starred });}
  function archive(n, e) {e.stopPropagation();update(n.id, { archived: true });if (selectedId === n.id) setSelectedId(null);}
  function unarchive(n, e) {e.stopPropagation();update(n.id, { archived: false });}
  function markAllRead() {setItems((arr) => arr.map((n) => ({ ...n, read: true })));}

  return (
    <div className="ni-overlay" onClick={onClose}>
      <section
        className="ni-shell"
        role="dialog"
        aria-label="Notifications inbox"
        onClick={(e) => e.stopPropagation()}>
        
        <header className="ni-header">
          <div className="ni-header-left">
            <button className="ni-back" onClick={onClose} aria-label="Back to Results">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span>Back</span>
            </button>
            <div className="ni-title-block">
              <div className="ni-eyebrow">SureTrend / Notifications</div>
              <h1 className="ni-title">Inbox</h1>
            </div>
          </div>

          <div className="ni-header-right">
            <div className="ni-search">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                placeholder="Search notifications…"
                value={query}
                onChange={(e) => setQuery(e.target.value)} />
              
            </div>
            <button className="ni-action-btn" onClick={markAllRead}>Mark all read</button>
            <button className="ni-close" onClick={onClose} aria-label="Close inbox">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
        </header>

        <div className="ni-tabs" role="tablist">
          <NiTab id="all" tab={tab} setTab={setTab} count={counts.all}>All</NiTab>
          <NiTab id="unread" tab={tab} setTab={setTab} count={counts.unread} highlight={counts.unread > 0}>Unread</NiTab>
          <NiTab id="starred" tab={tab} setTab={setTab} count={counts.starred}>Starred</NiTab>
          <NiTab id="archived" tab={tab} setTab={setTab} count={counts.archived}>Archived</NiTab>
          <div className="ni-tab-spacer" />
          <div className="ni-sort">
            <label className="ni-sort-label">Sort:</label>
            <select className="ni-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="priority">Priority (urgent first)</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="unread">Unread first</option>
            </select>
            <svg className="ni-sort-caret" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div className="ni-legend">
            <span className="ni-leg"><span className="urg-badge urgent">!!</span>Urgent</span>
            <span className="ni-leg"><span className="urg-badge high">!</span>High</span>
            <span className="ni-leg"><span className="urg-badge normal" />Normal</span>
            <span className="ni-leg"><span className="urg-badge low" />Low</span>
          </div>
        </div>

        <div className="ni-body">
          <div className="ni-list">
            {pageItems.length === 0 &&
            <div className="ni-empty">
                <div className="ni-empty-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                  </svg>
                </div>
                <div className="ni-empty-title">No notifications</div>
                <div className="ni-empty-sub">
                  {tab === "unread" && "You're all caught up."}
                  {tab === "starred" && "Star important messages to find them here."}
                  {tab === "archived" && "Archived messages will appear here."}
                  {tab === "all" && "Nothing matches that search."}
                </div>
              </div>
            }

            {pageItems.map((n) =>
            <NiRow
              key={n.id}
              n={n}
              selected={n.id === selectedId}
              onOpen={() => openMessage(n)}
              onStar={(e) => toggleStar(n, e)}
              onArchive={(e) => n.archived ? unarchive(n, e) : archive(n, e)}
              isArchived={n.archived} />

            )}

            {filtered.length > 0 &&
            <div className="ni-pagination">
                <div className="ni-page-info">
                  Showing <b>{(safePage - 1) * PAGE_SIZE + 1}</b>–<b>{Math.min(safePage * PAGE_SIZE, filtered.length)}</b> of <b>{filtered.length}</b>
                </div>
                <div className="ni-page-ctrls">
                  <button
                  className="ni-page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page">
                  
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
                <button
                  key={p}
                  className={"ni-page-num" + (p === safePage ? " active" : "")}
                  onClick={() => setPage(p)}>
                  
                      {p}
                    </button>
                )}
                  <button
                  className="ni-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page">
                  
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <aside className="ni-reader">
            {selected ?
            <NiReader
              n={selected}
              onStar={(e) => toggleStar(selected, e)}
              onArchive={(e) => selected.archived ? unarchive(selected, e) : archive(selected, e)}
              onClose={() => setSelectedId(null)} /> :


            <div className="ni-reader-empty">
                <div className="ni-reader-empty-icon">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" />
                  </svg>
                </div>
                <div className="ni-reader-empty-title">Select a notification</div>
                <div className="ni-reader-empty-sub">Click any message on the left to read the full details. Notifications are read-only — they're announcements from SureTrend, not a conversation.</div>
              </div>
            }
          </aside>
        </div>
      </section>
    </div>);

}

function NiTab({ id, tab, setTab, count, highlight, children }) {
  const active = tab === id;
  return (
    <button
      role="tab"
      className={"ni-tab" + (active ? " active" : "")}
      onClick={() => setTab(id)}>
      
      <span>{children}</span>
      <span className={"ni-tab-count" + (highlight && !active ? " on" : "")}>{count}</span>
    </button>);

}

function NiRow({ n, selected, onOpen, onStar, onArchive, isArchived }) {
  const meta = URGENCY_META[n.urgency];
  return (
    <div
      className={
      "ni-row" + (
      n.read ? " read" : " unread") + (
      selected ? " selected" : "") + (
      n.urgency === "urgent" ? " is-urgent" : "") + (
      n.urgency === "high" ? " is-high" : "")
      }
      onClick={onOpen}
      role="button"
      tabIndex={0}>
      
      <span className="ni-row-rail" style={{ background: meta.swatch }} />

      <div className="ni-row-status">
        <span className={"ni-unread-dot" + (n.read ? " read" : "")} aria-label={n.read ? "Read" : "Unread"} />
      </div>

      <button
        className={"ni-star" + (n.starred ? " on" : "")}
        onClick={onStar}
        aria-label={n.starred ? "Unstar" : "Star"}
        title={n.starred ? "Unstar" : "Star"}>
        
        <svg viewBox="0 0 24 24" width="14" height="14" fill={n.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.8L12 17.8 5.7 21l1.2-6.8-5-4.9 7-1z" />
        </svg>
      </button>

      <div className="ni-row-main">
        <div className="ni-row-line1">
          <span className={"urg-badge " + n.urgency} title={meta.label} aria-label={meta.label}>
            {n.urgency === "urgent" ? "!!" : n.urgency === "high" ? "!" : ""}
          </span>
          <span className="ni-cat">{n.category}</span>
          <span className="ni-sender">{n.sender}</span>
          <span className="ni-row-spacer" />
          <span className="ni-time" title={fullDate(n.createdAt)}>{relativeTime(n.createdAt)}</span>
        </div>
        <div className="ni-row-subject">{n.subject}</div>
        <div className="ni-row-preview">{n.preview}</div>
      </div>

      <div className="ni-row-actions">
        <button
          className="ni-icon-btn"
          onClick={onArchive}
          aria-label={isArchived ? "Restore" : "Archive"}
          title={isArchived ? "Restore" : "Archive"}>
          
          {isArchived ?
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h18v4H3z" /><path d="M5 11v9h14v-9" /><path d="M9 15h6" /><path d="M12 12v6" /><path d="m9 15 3-3 3 3" />
            </svg> :

          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h18v4H3z" /><path d="M5 11v9h14v-9" /><path d="M10 15h4" />
            </svg>
          }
        </button>
      </div>
    </div>);

}

function NiReader({ n, onStar, onArchive, onClose }) {
  const meta = URGENCY_META[n.urgency];
  return (
    <div className="ni-reader-pane">
      <div className="ni-reader-head">
        <div className="ni-reader-meta">
          <span className={"urg-badge " + n.urgency} title={meta.label} aria-label={meta.label}>
            {n.urgency === "urgent" ? "!!" : n.urgency === "high" ? "!" : ""}
          </span>
          <span className="ni-cat">{n.category}</span>
        </div>
        <div className="ni-reader-actions">
          <button className={"ni-icon-btn" + (n.starred ? " on-star" : "")} onClick={onStar} title={n.starred ? "Unstar" : "Star"} aria-label="Star">
            <svg viewBox="0 0 24 24" width="15" height="15" fill={n.starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.8L12 17.8 5.7 21l1.2-6.8-5-4.9 7-1z" />
            </svg>
          </button>
          <button className="ni-icon-btn" onClick={onArchive} title={n.archived ? "Restore" : "Archive"} aria-label="Archive">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h18v4H3z" /><path d="M5 11v9h14v-9" /><path d="M10 15h4" />
            </svg>
          </button>
          <button className="ni-icon-btn" onClick={onClose} title="Close reader" aria-label="Close reader">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
      </div>

      <h2 className="ni-reader-subject">{n.subject}</h2>
      <div className="ni-reader-byline">
        <span><b>{n.sender}</b></span>
        <span className="ni-reader-dot">·</span>
        <span title={fullDate(n.createdAt)}>{fullDate(n.createdAt)}</span>
      </div>

      <div className="ni-reader-body">
        {n.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>

      <div className="ni-reader-footer">
        <div className="ni-reader-readonly">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
          This is a read-only announcement. Replies aren't sent. For support, email <a href="mailto:support@hygiena.com">support@hygiena.com</a>.
        </div>
      </div>
    </div>);

}

window.NotificationsInbox = NotificationsInbox;