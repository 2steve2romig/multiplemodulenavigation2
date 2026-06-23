// iq-catalog.js
//
// Single source of truth for the IQ Suite. Powers the launcher, the
// "View all IQ apps" page, each individual IQ environment page, and the
// Module Subscription / Access Management screens.
//
// Each entry:
//   id        stable key (matches assets/iq-icons/iq-<id>.png)
//   name      short product name (precedes the "IQ" badge)
//   color     brand accent — used to theme the whole environment
//   desc      one-line product descriptor
//   blurb     longer sentence for the app landing page
//   category  environmental | foodsafety | analytics
//   workflow  plan | test | analyze | investigate | audit
//   price     monthly list price (USD)
//   defaultOn whether it ships active in the subscription editor
(function () {
  const CATALOG = [
    { id: "atp",       name: "ATP",       color: "#1B8A7A", desc: "Environmental Monitoring ATP",   blurb: "Run ATP hygiene tests, track pass rates, and act on out-of-spec sites in real time.",          category: "environmental", workflow: "test",        price: 229, defaultOn: true },
    { id: "map",       name: "Map",       color: "#29ABE2", desc: "Facility Mapping",               blurb: "Build interactive facility floor plans and pin sampling locations across every site.",           category: "environmental", workflow: "plan",        price: 199, defaultOn: true },
    { id: "sample",    name: "Sample",    color: "#9B2E7D", desc: "Environmental Monitoring AI",     blurb: "AI-guided environmental monitoring that recommends where and when to swab next.",                category: "environmental", workflow: "test",        price: 299, defaultOn: true },
    { id: "clean",     name: "Kleanz",    color: "#1B7A8C", desc: "Sanitation Management",          blurb: "Schedule, document, and verify sanitation cycles with full chemical and CIP traceability.",     category: "environmental", workflow: "test",        price: 199, defaultOn: true },

    { id: "plan",      name: "Plan",      color: "#1F8A3B", desc: "Food Safety Plan Builder",       blurb: "Author HACCP and preventive-control plans from validated templates and hazard libraries.",     category: "foodsafety",    workflow: "plan",        price: 249, defaultOn: true },
    { id: "supplier",  name: "Supplier",  color: "#5C8C25", desc: "Supplier Approval",              blurb: "Onboard, score, and continuously monitor suppliers against your approval requirements.",        category: "foodsafety",    workflow: "plan",        price: 149, defaultOn: true },
    { id: "lab",       name: "Lab",       color: "#B5A678", desc: "Lab Sample & Results Network",   blurb: "Submit samples to partner labs and stream results back into a single connected workflow.",      category: "foodsafety",    workflow: "test",        price: 349, defaultOn: true },
    { id: "correct",   name: "Correct",   color: "#6B3FB5", desc: "AI CAPA Advisor",                blurb: "Turn failures into corrective actions with AI root-cause guidance and closure tracking.",       category: "foodsafety",    workflow: "investigate", price: 249, defaultOn: true },
    { id: "recall",    name: "Recall",    color: "#E55520", desc: "Recall Management",              blurb: "Coordinate mock and live recalls with traceable notifications and disposition records.",        category: "foodsafety",    workflow: "investigate", price: 299, defaultOn: true },
    { id: "trace",     name: "Trace",     color: "#D9A823", desc: "FSMA 204 Traceability",          blurb: "Capture critical tracking events and produce FSMA 204 traceability records on demand.",         category: "foodsafety",    workflow: "investigate", price: 349, defaultOn: false, features: ["Capture Critical Tracking Events automatically", "Generate FSMA 204 traceability records on demand", "Link lots end-to-end across suppliers and sites"] },

    { id: "risk",      name: "Risk",      color: "#B53636", desc: "Predictive Risk AI",             blurb: "Forecast contamination risk by site and shift before it shows up in your results.",             category: "analytics",     workflow: "analyze",     price: 399, defaultOn: false, features: ["Forecast contamination risk by site, line, and shift", "Catch emerging trends before they hit your results", "Prioritize sampling where risk is highest"] },
    { id: "benchmark", name: "Benchmark", color: "#E07A1E", desc: "Cross-facility Intelligence",    blurb: "Compare performance across plants and surface the practices driving your best sites.",          category: "analytics",     workflow: "analyze",     price: 299, defaultOn: false, features: ["Compare KPIs across every plant in one view", "Surface the practices behind your best sites", "Spot underperformers early with ranked scorecards"] },
    { id: "audit",     name: "Audit",     color: "#1F4FBF", desc: "Audit Report Generator",         blurb: "Assemble audit-ready report packages from live data in a few clicks.",                          category: "analytics",     workflow: "audit",       price: 199, defaultOn: true },
    { id: "report",    name: "Report",    color: "#16A89A", desc: "Executive Reporting",            blurb: "Schedule executive dashboards and recurring reports for leadership and customers.",             category: "analytics",     workflow: "audit",       price: 149, defaultOn: false, features: ["Schedule recurring dashboards for leadership", "Build branded report packages in a few clicks", "Share live KPIs with customers and auditors"] },
  ];

  const CATEGORIES = [
    { id: "all",           label: "All apps" },
    { id: "environmental", label: "Environmental" },
    { id: "foodsafety",    label: "Food Safety" },
    { id: "analytics",     label: "Analytics" },
  ];

  const SITES = [
    "Site A – Chicago",
    "Site B – Los Angeles",
    "Site C – Frankfurt",
    "Site D – Singapore",
  ];

  const ROLES = [
    { id: "owner",       label: "Owner" },
    { id: "globaladmin", label: "Global Admin" },
    { id: "admin",       label: "Admin" },
    { id: "user",        label: "User" },
  ];

  const byId = {};
  CATALOG.forEach((p) => { byId[p.id] = p; });

  // Deterministic per-IQ demo stats so each environment page feels distinct
  // without inventing data on every render.
  function seeded(seed) {
    let s = seed;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }
  CATALOG.forEach((p, i) => {
    const r = seeded(100 + i * 7 + p.id.length);
    p.stats = {
      open:      Math.floor(8 + r() * 90),
      completed: Math.floor(60 + r() * 220),
      passRate:  Math.floor(72 + r() * 26),
      openDelta: Math.floor(4 + r() * 50),
      onTime:    Math.floor(68 + r() * 28),
    };
  });

  window.IQ_CATALOG = CATALOG;
  window.IQ_BY_ID = byId;
  window.IQ_CATEGORIES = CATEGORIES;
  window.IQ_SITES = SITES;
  window.IQ_ROLES = ROLES;
  window.IQ_TOTAL_PRICE = CATALOG.filter((p) => p.defaultOn).reduce((a, b) => a + b.price, 0);
})();
