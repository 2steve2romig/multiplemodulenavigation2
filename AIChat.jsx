// AIChat.jsx
//
// SureTrend Assistant — floating AI chat widget.
// Self-contained: collapsed FAB → expanded 400×600 panel with welcome state,
// suggested quick actions, message thread, typing indicator, follow-up chips,
// inline "Take me there" deep-links, thumbs feedback, escalation card,
// and persistent thread + open state in localStorage.

/* ---------------- Tiny icon set (no external deps) ---------------- */
const Sparkle = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.6 4.6L18 9l-4.4 1.4L12 15l-1.6-4.6L6 9l4.4-1.4L12 3z"/>
    <path d="M19 14l.7 1.8L21.5 16.5l-1.8.7L19 19l-.7-1.8L16.5 16.5l1.8-.7L19 14z"/>
  </svg>
);
const IconChat = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a8 8 0 0 1-11.7 7.1L4 21l1.9-5.3A8 8 0 1 1 21 12z"/>
    <path d="M9 12h.01M12 12h.01M15 12h.01"/>
  </svg>
);
const IconMin = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="14" x2="19" y2="14"/></svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
);
const IconRefresh = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15A9 9 0 1 1 19 6.36L23 10"/></svg>
);
const IconSend = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
);
const IconPaperclip = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);
const IconGlobe = () => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z"/></svg>
);
const IconThumbUp = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9A2 2 0 0 0 19.66 9H14z"/><line x1="2" y1="22" x2="7" y2="22"/></svg>
);
const IconThumbDown = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9A2 2 0 0 0 4.34 15H10z"/><line x1="22" y1="2" x2="17" y2="2"/></svg>
);
const IconArrowR = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);
const IconResults = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
);
const IconReport = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="14" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>
);
const IconWarning = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const IconUp = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
);
const IconAgent = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-1a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v1"/><circle cx="12" cy="7" r="4"/></svg>
);

/* ---------------- Suggested-action grid (welcome state) ---------------- */
const QUICK_ACTIONS = [
  { id: "results",    label: "View my results",   icon: <IconResults/>,  tone: ""    },
  { id: "report",     label: "Run a report",      icon: <IconReport/>,   tone: "up"  },
  { id: "trouble",    label: "Troubleshoot a test", icon: <IconWarning/>,tone: "warn"},
  { id: "upgrade",    label: "Upgrade my plan",   icon: <IconUp/>,       tone: ""    },
];

/* ---------------- Mock answer book ---------------- */
// Lightweight matcher → returns one of a small set of pre-built rich responses
// with follow-ups, deep-link actions, and optional escalation cards.
function answerFor(text, routeContext) {
  const q = text.toLowerCase();

  if (q.includes("listeria") || (q.includes("report") && (q.includes("site") || q.includes("run") || q.includes("how")))) {
    return {
      kind: "report",
      content: (
        <>
          Here's how to run a Listeria report for Site 1:
          <div style={{marginTop:8}}>
            <div className="ai-step"><span className="ai-step-n">1</span><span>Go to <b>Reports</b> in the left sidebar.</span></div>
            <div className="ai-step"><span className="ai-step-n">2</span><span>Choose <b>Environmental Monitoring → Listeria Trends</b> from the templates.</span></div>
            <div className="ai-step"><span className="ai-step-n">3</span><span>Set <b>Site → Site 1</b> and your date range, then <b>Generate</b>.</span></div>
            <div className="ai-step"><span className="ai-step-n">4</span><span>Use <b>Export</b> for PDF or Excel, or <b>Schedule</b> to email weekly.</span></div>
          </div>
          <div className="ai-actions">
            <button className="ai-action-btn" data-nav="reports">Take me to Reports <IconArrowR/></button>
            <button className="ai-action-btn secondary">View template</button>
          </div>
        </>
      ),
      followups: [
        "Schedule this weekly",
        "Add it to my dashboard",
        "Export as branded PDF",
      ],
    };
  }

  if ((q.includes("power") && q.includes("premium")) || q.includes("difference") || q.includes("compare") || q.includes("plan")) {
    return {
      kind: "plans",
      content: (
        <>
          Both are paid tiers — <b>Power</b> is multi-site with full data visualization, while <b>Premium</b> adds enterprise-wide visibility and real-time alerts.
          <div className="ai-compare">
            <div className="ai-compare-col">
              <div className="ai-compare-h">Power <span className="tag" style={{background:"#0D6A99"}}>POPULAR</span></div>
              <div className="ai-compare-price">Contact sales</div>
              <ul>
                <li>Multi-site rollups</li>
                <li>Trend & heatmap views</li>
                <li>Custom report templates</li>
                <li>Up to 25 users</li>
              </ul>
            </div>
            <div className="ai-compare-col featured">
              <div className="ai-compare-h">Premium <span className="tag">ENTERPRISE</span></div>
              <div className="ai-compare-price">Contact sales</div>
              <ul>
                <li>Enterprise-wide visibility</li>
                <li>Real-time alerts + deep links</li>
                <li>SSO + domain lock</li>
                <li>Unlimited users & sites</li>
              </ul>
            </div>
          </div>
          <div className="ai-actions">
            <button className="ai-action-btn" data-nav="upgrade">Upgrade <IconArrowR/></button>
            <button className="ai-action-btn secondary">Start 30-day trial</button>
          </div>
        </>
      ),
      followups: [
        "Does Premium include Map IQ?",
        "Annual vs monthly billing?",
        "Talk to sales",
      ],
    };
  }

  if (q.includes("ensure") || q.includes("sync") || q.includes("luminometer") || q.includes("instrument")) {
    return {
      kind: "trouble",
      content: (
        <>
          Sorry your EnSURE Touch isn't syncing. Try this in order — most cases resolve at step 2:
          <div style={{marginTop:8}}>
            <div className="ai-step"><span className="ai-step-n">1</span><span>Confirm Wi-Fi is connected (Settings → Network).</span></div>
            <div className="ai-step"><span className="ai-step-n">2</span><span>Sign out, then back in — refreshes the SureTrend token.</span></div>
            <div className="ai-step"><span className="ai-step-n">3</span><span>Check <b>Software Updates</b>; an older firmware can stall sync.</span></div>
            <div className="ai-step"><span className="ai-step-n">4</span><span>Re-register the instrument from <b>Sites → Instruments</b>.</span></div>
          </div>
          <div className="ai-escalate">
            <div className="ai-escalate-h"><IconAgent/> Still stuck?</div>
            <div className="ai-escalate-body">
              Our 24/7 support team can pull instrument logs in real time.
            </div>
            <div className="ai-actions" style={{marginTop:8}}>
              <button className="ai-action-btn">Connect with support</button>
              <button className="ai-action-btn secondary">Submit a ticket</button>
            </div>
          </div>
        </>
      ),
      followups: [
        "Show my unsynced tests",
        "How do I factory reset?",
        "Update instrument firmware",
      ],
    };
  }

  if (q.includes("map iq") || q.includes("mapiq") || q.includes("map-iq") || q.includes("what is map")) {
    return {
      kind: "feature",
      content: (
        <>
          <b>Map IQ</b> turns your environmental monitoring data into a smart, shareable site map.
          <ul>
            <li><b>Smart mapping</b> — drop test points on a real floor plan.</li>
            <li><b>Risk insights</b> — auto-highlights recurring failures by zone.</li>
            <li><b>Easy sharing</b> — send a heatmap link to QA or your auditor in one click.</li>
          </ul>
          <div className="ai-actions">
            <button className="ai-action-btn" data-nav="map">Explore Map IQ <IconArrowR/></button>
            <button className="ai-action-btn secondary">Watch 90-sec demo</button>
          </div>
        </>
      ),
      followups: [
        "Which plans include Map IQ?",
        "How do I upload a floor plan?",
        "Show me a heatmap example",
      ],
    };
  }

  if (q.includes("upgrade") || q.includes("trial")) {
    return {
      kind: "upgrade",
      content: (
        <>
          You can <b>start a 30-day free trial</b> of any paid tier with no credit card. Annual billing saves ~17%, and we accept Purchase Orders via Stripe.
          <div className="ai-actions">
            <button className="ai-action-btn" data-nav="upgrade">Start free trial <IconArrowR/></button>
            <button className="ai-action-btn secondary">Talk to sales</button>
          </div>
        </>
      ),
      followups: ["Compare Power vs Premium", "What's an ROI Calculator?", "Set up SSO"],
    };
  }

  if (q.includes("result") || q.includes("recent") || q.includes("fail")) {
    const here = routeContext === "results";
    return {
      kind: "results",
      content: (
        <>
          {here ? <>You're already on the <b>Results</b> screen — here's what to look for: </> : <>I'll pull up your latest results. </>}
          The fastest way to triage is to filter <b>Status = Fail</b> and sort by <b>Date desc</b>; recurring sites surface immediately.
          <div className="ai-actions">
            <button className="ai-action-btn" data-nav="results">{here ? "Apply Fail filter" : "Open Results"} <IconArrowR/></button>
            <button className="ai-action-btn secondary">Open as heatmap</button>
          </div>
        </>
      ),
      followups: [
        "Show recurring failure sites",
        "Why did Drain — Line 3 fail?",
        "Send this to my QA lead",
      ],
    };
  }

  // Default fallback
  return {
    kind: "default",
    content: (
      <>
        Good question — I can help with results, reports, sampling plans, instruments (EnSURE Touch, BAX Q7, MicroSnap), compliance (HACCP / FSMA 204 / GFSI), and plan upgrades.
        What would you like to do next?
      </>
    ),
    followups: [
      "Run a Listeria report",
      "What is Map IQ?",
      "Troubleshoot my EnSURE Touch",
    ],
  };
}

/* ---------------- Storage ---------------- */
const STORE_KEY = "ai-chat-thread";
const STORE_OPEN = "ai-chat-open";
const STORE_MIN = "ai-chat-min";

function loadThread() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    // we only persist the lightweight shell — content is re-derived
    const arr = JSON.parse(raw);
    return arr.map(m => {
      if (m.role === "ai" && m.queryEcho) {
        const a = answerFor(m.queryEcho, m.context);
        return { ...m, content: a.content, followups: a.followups };
      }
      return m;
    });
  } catch (e) { return []; }
}
function saveThread(thread) {
  try {
    // Strip React content — keep just text echo + feedback so we can re-derive
    const lite = thread.map(m => ({
      id: m.id, role: m.role, text: m.text,
      queryEcho: m.queryEcho, context: m.context,
      feedback: m.feedback, time: m.time,
    }));
    localStorage.setItem(STORE_KEY, JSON.stringify(lite));
  } catch(e) {}
}

/* ---------------- Component ---------------- */
function AIChat({ route, onNav }) {
  const [open, setOpen] = React.useState(() => {
    try { return localStorage.getItem(STORE_OPEN) === "1"; } catch(e) { return false; }
  });
  const [minimized, setMinimized] = React.useState(() => {
    try { return localStorage.getItem(STORE_MIN) === "1"; } catch(e) { return false; }
  });
  const [thread, setThread] = React.useState(() => loadThread());
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const [unread, setUnread] = React.useState(true);
  const bodyRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Persist open/min
  React.useEffect(() => {
    try { localStorage.setItem(STORE_OPEN, open ? "1" : "0"); } catch(e) {}
    if (open) setUnread(false);
  }, [open]);
  React.useEffect(() => {
    try { localStorage.setItem(STORE_MIN, minimized ? "1" : "0"); } catch(e) {}
  }, [minimized]);
  React.useEffect(() => { saveThread(thread); }, [thread]);

  // Auto-scroll on new content
  React.useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thread, typing, open, minimized]);

  // Auto-focus input when opening
  React.useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 220);
    }
  }, [open, minimized]);

  function ask(text) {
    const userMsg = {
      id: "u" + Date.now(),
      role: "user",
      text,
      time: nowStr(),
    };
    setThread(t => [...t, userMsg]);
    setDraft("");
    setTyping(true);
    // Simulated latency
    const delay = 700 + Math.min(1400, text.length * 18);
    setTimeout(() => {
      const a = answerFor(text, route);
      const aiMsg = {
        id: "a" + Date.now(),
        role: "ai",
        queryEcho: text,
        context: route,
        content: a.content,
        followups: a.followups,
        feedback: null,
        time: nowStr(),
      };
      setThread(t => [...t, aiMsg]);
      setTyping(false);
    }, delay);
  }

  function handleChip(actionId) {
    const map = {
      results: "Show me my latest results",
      report:  "How do I run a Listeria report for Site 1?",
      trouble: "My EnSURE Touch isn't syncing",
      upgrade: "What's the difference between Power and Premium?",
    };
    ask(map[actionId] || "Tell me more");
  }

  function handleSubmit(e) {
    e?.preventDefault?.();
    const t = draft.trim();
    if (!t || typing) return;
    ask(t);
  }

  function setFeedback(id, val) {
    setThread(t => t.map(m => m.id === id ? { ...m, feedback: m.feedback === val ? null : val } : m));
  }

  function resetThread() {
    setThread([]);
    try { localStorage.removeItem(STORE_KEY); } catch(e) {}
  }

  // Wire deep-link buttons inside AI bubbles
  function onBodyClick(e) {
    const btn = e.target.closest?.("button[data-nav]");
    if (btn && onNav) {
      const id = btn.getAttribute("data-nav");
      onNav(id === "upgrade" ? "home" : id);
      setOpen(false);
    }
  }

  /* ---------- Render ---------- */
  if (!open) {
    return (
      <div className="ai-fab-wrap">
        <button
          className="ai-fab"
          onClick={() => { setOpen(true); setMinimized(false); }}
          aria-label="Open SureTrend Assistant"
          title="SureTrend Assistant"
        >
          <Sparkle size={22}/>
          {unread && <span className="ai-fab-dot"/>}
        </button>
      </div>
    );
  }

  const ctxLabel = routeLabel(route);
  const hasThread = thread.length > 0;

  return (
    <div className="ai-fab-wrap">
      <div className={"ai-panel" + (minimized ? " minimized" : "")} role="dialog" aria-label="SureTrend Assistant">
        <header className="ai-header">
          <div className="ai-header-avatar"><Sparkle size={16}/></div>
          <div className="ai-header-text">
            <div className="ai-header-title">
              SureTrend Assistant
              <span className="ai-online-dot" title="Online"/>
            </div>
            <div className="ai-header-sub">
              {minimized ? "Tap to expand" : ctxLabel ? `On ${ctxLabel} · usually replies instantly` : "Usually replies instantly"}
            </div>
          </div>
          <div className="ai-header-actions">
            <button className="ai-header-btn" onClick={resetThread} title="New conversation" aria-label="New conversation"><IconRefresh/></button>
            <button className="ai-header-btn" onClick={() => setMinimized(m => !m)} title={minimized ? "Expand" : "Minimize"} aria-label="Minimize"><IconMin/></button>
            <button className="ai-header-btn" onClick={() => setOpen(false)} title="Close" aria-label="Close"><IconX/></button>
          </div>
        </header>

        <div className="ai-body" ref={bodyRef} onClick={onBodyClick}>
          {!hasThread && (
            <div className="ai-welcome">
              <div className="ai-welcome-hero">
                <div className="ai-welcome-avatar"><Sparkle size={16}/></div>
                <div className="ai-welcome-text">
                  Hi! I'm your <b>SureTrend Assistant</b>. I can help you analyze results, generate reports, troubleshoot instruments, and more. How can I help today?
                </div>
              </div>
              {ctxLabel && (
                <span className="ai-context-pill">
                  <span className="dot"/> Context: {ctxLabel}
                </span>
              )}
              <div className="ai-chip-grid">
                {QUICK_ACTIONS.map(a => (
                  <button key={a.id} className={"ai-chip " + a.tone} onClick={() => handleChip(a.id)}>
                    <span className="ai-chip-icon">{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {thread.map((m, idx) => (
            <React.Fragment key={m.id}>
              {m.role === "user" ? (
                <div className="ai-msg user">
                  <div className="ai-bubble">{m.text}</div>
                </div>
              ) : (
                <>
                  <div className="ai-msg ai">
                    <div className="ai-msg-avatar"><Sparkle size={13}/></div>
                    <div className="ai-bubble">{m.content}</div>
                  </div>
                  {/* Feedback row */}
                  <div className="ai-feedback">
                    <button
                      className={"ai-feedback-btn up" + (m.feedback === "up" ? " active" : "")}
                      onClick={() => setFeedback(m.id, "up")}
                      title="Helpful"
                      aria-label="Helpful"
                    ><IconThumbUp/></button>
                    <button
                      className={"ai-feedback-btn down" + (m.feedback === "down" ? " active" : "")}
                      onClick={() => setFeedback(m.id, "down")}
                      title="Not helpful"
                      aria-label="Not helpful"
                    ><IconThumbDown/></button>
                    <span className="ai-feedback-time">{m.time}</span>
                  </div>
                  {/* Follow-up chips */}
                  {idx === thread.length - 1 && m.followups && (
                    <div className="ai-followups">
                      {m.followups.map(f => (
                        <button key={f} className="ai-followup" onClick={() => ask(f)}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </React.Fragment>
          ))}

          {typing && (
            <div className="ai-msg ai">
              <div className="ai-msg-avatar"><Sparkle size={13}/></div>
              <div className="ai-typing"><span/><span/><span/></div>
            </div>
          )}
        </div>

        <form className="ai-input" onSubmit={handleSubmit}>
          <div className="ai-input-row">
            <textarea
              ref={inputRef}
              className="ai-input-field"
              placeholder="Ask me anything about SureTrend..."
              rows={1}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                // autosize
                e.target.style.height = "auto";
                e.target.style.height = Math.min(110, e.target.scrollHeight) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button type="button" className="ai-input-btn" title="Attach a screenshot" aria-label="Attach"><IconPaperclip/></button>
            <button
              type="submit"
              className="ai-input-btn send"
              disabled={!draft.trim() || typing}
              title="Send"
              aria-label="Send"
            ><IconSend/></button>
          </div>
          <div className="ai-input-foot">
            <span className="ai-input-foot-l">Press <b>Enter</b> to send · <b>Shift+Enter</b> for newline</span>
            <span className="ai-input-foot-r">
              <button type="button" className="ai-foot-btn" title="Language"><IconGlobe/> EN</button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function nowStr() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
function routeLabel(route) {
  const map = {
    home: "Home",
    dashboard: "Dashboard",
    results: "Results",
    reports: "Reports",
    sites: "Sites",
    map: "Map IQ",
    audit: "Audit Trail",
    sampling: "Sampling Plans",
    quant: "Quant",
    kleanz: "KLEANZ",
  };
  return map[route] || "";
}

window.AIChat = AIChat;
