-- SureTrend Platform — Module Manifest Seed
-- Derived from iq-catalog.js. Run after 001_platform_schema.sql.
-- Uses service role (RLS bypass) — run via Supabase dashboard or CLI.

INSERT INTO module_manifests (id, manifest) VALUES

('atp', '{
  "id": "atp",
  "displayName": "ATP IQ",
  "description": "Environmental Monitoring ATP",
  "icon": "/assets/iq-icons/iq-atp.png",
  "color": "#1B8A7A",
  "baseRoute": "/iq/atp",
  "serviceUrl": "",
  "minRequiredRole": "technician",
  "pricingLabel": "$229/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview", "path": "/iq/atp"},
    {"label": "Results",  "path": "/iq/atp/results"},
    {"label": "Plans",    "path": "/iq/atp/plans"}
  ],
  "workflowStages": ["test"],
  "category": "environmental",
  "version": "1.0.0"
}'),

('map', '{
  "id": "map",
  "displayName": "Map IQ",
  "description": "Facility Mapping",
  "icon": "/assets/iq-icons/iq-map.png",
  "color": "#29ABE2",
  "baseRoute": "/iq/map",
  "serviceUrl": "",
  "minRequiredRole": "technician",
  "pricingLabel": "$199/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",   "path": "/iq/map"},
    {"label": "Floor Plans","path": "/iq/map/floorplans"},
    {"label": "Locations",  "path": "/iq/map/locations"}
  ],
  "workflowStages": ["plan"],
  "category": "environmental",
  "version": "1.0.0"
}'),

('sample', '{
  "id": "sample",
  "displayName": "Sample IQ",
  "description": "Environmental Monitoring AI",
  "icon": "/assets/iq-icons/iq-sample.png",
  "color": "#9B2E7D",
  "baseRoute": "/iq/sample",
  "serviceUrl": "",
  "minRequiredRole": "technician",
  "pricingLabel": "$299/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",      "path": "/iq/sample"},
    {"label": "Recommendations","path": "/iq/sample/recommendations"},
    {"label": "History",       "path": "/iq/sample/history"}
  ],
  "workflowStages": ["test"],
  "category": "environmental",
  "version": "1.0.0"
}'),

('clean', '{
  "id": "clean",
  "displayName": "Kleanz IQ",
  "description": "Sanitation Management",
  "icon": "/assets/iq-icons/iq-clean.png",
  "color": "#1B7A8C",
  "baseRoute": "/iq/clean",
  "serviceUrl": "",
  "minRequiredRole": "technician",
  "pricingLabel": "$199/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",  "path": "/iq/clean"},
    {"label": "Schedules", "path": "/iq/clean/schedules"},
    {"label": "Records",   "path": "/iq/clean/records"}
  ],
  "workflowStages": ["test"],
  "category": "environmental",
  "version": "1.0.0"
}'),

('plan', '{
  "id": "plan",
  "displayName": "Plan IQ",
  "description": "Food Safety Plan Builder",
  "icon": "/assets/iq-icons/iq-plan.png",
  "color": "#1F8A3B",
  "baseRoute": "/iq/plan",
  "serviceUrl": "",
  "minRequiredRole": "supervisor",
  "pricingLabel": "$249/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview", "path": "/iq/plan"},
    {"label": "Plans",    "path": "/iq/plan/plans"},
    {"label": "Hazards",  "path": "/iq/plan/hazards"}
  ],
  "workflowStages": ["plan"],
  "category": "foodsafety",
  "version": "1.0.0"
}'),

('supplier', '{
  "id": "supplier",
  "displayName": "Supplier IQ",
  "description": "Supplier Approval",
  "icon": "/assets/iq-icons/iq-supplier.png",
  "color": "#5C8C25",
  "baseRoute": "/iq/supplier",
  "serviceUrl": "",
  "minRequiredRole": "supervisor",
  "pricingLabel": "$149/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",   "path": "/iq/supplier"},
    {"label": "Suppliers",  "path": "/iq/supplier/suppliers"},
    {"label": "Scorecards", "path": "/iq/supplier/scorecards"}
  ],
  "workflowStages": ["plan"],
  "category": "foodsafety",
  "version": "1.0.0"
}'),

('lab', '{
  "id": "lab",
  "displayName": "Lab IQ",
  "description": "Lab Sample & Results Network",
  "icon": "/assets/iq-icons/iq-lab.png",
  "color": "#B5A678",
  "baseRoute": "/iq/lab",
  "serviceUrl": "",
  "minRequiredRole": "technician",
  "pricingLabel": "$349/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",    "path": "/iq/lab"},
    {"label": "Submissions", "path": "/iq/lab/submissions"},
    {"label": "Results",     "path": "/iq/lab/results"}
  ],
  "workflowStages": ["test"],
  "category": "foodsafety",
  "version": "1.0.0"
}'),

('correct', '{
  "id": "correct",
  "displayName": "Correct IQ",
  "description": "AI CAPA Advisor",
  "icon": "/assets/iq-icons/iq-correct.png",
  "color": "#6B3FB5",
  "baseRoute": "/iq/correct",
  "serviceUrl": "",
  "minRequiredRole": "technician",
  "pricingLabel": "$249/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview", "path": "/iq/correct"},
    {"label": "Actions",  "path": "/iq/correct/actions"},
    {"label": "Closed",   "path": "/iq/correct/closed"}
  ],
  "workflowStages": ["investigate"],
  "category": "foodsafety",
  "version": "1.0.0"
}'),

('recall', '{
  "id": "recall",
  "displayName": "Recall IQ",
  "description": "Recall Management",
  "icon": "/assets/iq-icons/iq-recall.png",
  "color": "#E55520",
  "baseRoute": "/iq/recall",
  "serviceUrl": "",
  "minRequiredRole": "admin",
  "pricingLabel": "$299/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",   "path": "/iq/recall"},
    {"label": "Mock Recalls","path": "/iq/recall/mock"},
    {"label": "Live Events", "path": "/iq/recall/live"}
  ],
  "workflowStages": ["investigate"],
  "category": "foodsafety",
  "version": "1.0.0"
}'),

('trace', '{
  "id": "trace",
  "displayName": "Trace IQ",
  "description": "FSMA 204 Traceability",
  "icon": "/assets/iq-icons/iq-trace.png",
  "color": "#D9A823",
  "baseRoute": "/iq/trace",
  "serviceUrl": "",
  "minRequiredRole": "technician",
  "pricingLabel": "$349/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview", "path": "/iq/trace"},
    {"label": "Events",   "path": "/iq/trace/events"},
    {"label": "Records",  "path": "/iq/trace/records"}
  ],
  "workflowStages": ["investigate"],
  "category": "foodsafety",
  "version": "1.0.0"
}'),

('risk', '{
  "id": "risk",
  "displayName": "Risk IQ",
  "description": "Predictive Risk AI",
  "icon": "/assets/iq-icons/iq-risk.png",
  "color": "#B53636",
  "baseRoute": "/iq/risk",
  "serviceUrl": "",
  "minRequiredRole": "supervisor",
  "pricingLabel": "$399/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",  "path": "/iq/risk"},
    {"label": "Forecasts", "path": "/iq/risk/forecasts"},
    {"label": "Heatmap",   "path": "/iq/risk/heatmap"}
  ],
  "workflowStages": ["analyze"],
  "category": "analytics",
  "version": "1.0.0"
}'),

('benchmark', '{
  "id": "benchmark",
  "displayName": "Benchmark IQ",
  "description": "Cross-facility Intelligence",
  "icon": "/assets/iq-icons/iq-benchmark.png",
  "color": "#E07A1E",
  "baseRoute": "/iq/benchmark",
  "serviceUrl": "",
  "minRequiredRole": "admin",
  "pricingLabel": "$299/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",    "path": "/iq/benchmark"},
    {"label": "Comparisons", "path": "/iq/benchmark/compare"},
    {"label": "Scorecards",  "path": "/iq/benchmark/scorecards"}
  ],
  "workflowStages": ["analyze"],
  "category": "analytics",
  "version": "1.0.0"
}'),

('audit', '{
  "id": "audit",
  "displayName": "Audit IQ",
  "description": "Audit Report Generator",
  "icon": "/assets/iq-icons/iq-audit.png",
  "color": "#1F4FBF",
  "baseRoute": "/iq/audit",
  "serviceUrl": "",
  "minRequiredRole": "supervisor",
  "pricingLabel": "$199/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview", "path": "/iq/audit"},
    {"label": "Reports",  "path": "/iq/audit/reports"},
    {"label": "History",  "path": "/iq/audit/history"}
  ],
  "workflowStages": ["audit"],
  "category": "analytics",
  "version": "1.0.0"
}'),

('report', '{
  "id": "report",
  "displayName": "Report IQ",
  "description": "Executive Reporting",
  "icon": "/assets/iq-icons/iq-report.png",
  "color": "#16A89A",
  "baseRoute": "/iq/report",
  "serviceUrl": "",
  "minRequiredRole": "admin",
  "pricingLabel": "$149/mo",
  "supportedLocales": ["en-US"],
  "nav": [
    {"label": "Overview",    "path": "/iq/report"},
    {"label": "Dashboards",  "path": "/iq/report/dashboards"},
    {"label": "Scheduled",   "path": "/iq/report/scheduled"}
  ],
  "workflowStages": ["audit"],
  "category": "analytics",
  "version": "1.0.0"
}')

ON CONFLICT (id) DO UPDATE SET
  manifest   = EXCLUDED.manifest,
  updated_at = now();
