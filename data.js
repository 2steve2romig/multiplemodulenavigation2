// Mock test result data. Keeps the grid component lean.
(function(){
  const sites = ["Mark's Moo Milk", "Packer", "Cold Storage", "Receiving", "Dry Goods"];
  const locationsBySite = {
    "Mark's Moo Milk": ["Inline Filter 1", "Clean in Place Unit 1", "Storage Tank 2", "Storage Tank 1", "Pasteurization Tank 1"],
    "Packer": ["Filler Nozzle 3", "Belt A", "Belt B", "Capper Head"],
    "Cold Storage": ["Entry Door", "Wall Panel N", "Rack 3"],
    "Receiving": ["Dock 1", "Dock 2"],
    "Dry Goods": ["Ingredient Bin 4", "Scale 2"],
  };
  const devices = ["UltraSnap", "AquaSnap", "SuperSnap", "MicroSnap"];
  const users = ["Mark Johnson", "Priya Rao", "Sam Nguyen", "Dana Lee", "Luis Ortiz"];
  const plans = ["Daily CIP Sweep", "End of Shift", "Pre-Op", "Weekly Deep Clean"];
  const zones = ["Zone 1", "Zone 2", "Zone 3"];
  const unitTypes = ["Fluid", "Dry", "Aseptic"];
  const lines = ["Line 1", "Line 2", "Line 3"];
  const surfaces = ["Stainless steel", "HDPE", "Conveyor belt", "Rubber gasket"];
  const notesPool = [
    "Re-cleaned with caustic, retest scheduled.",
    "Operator flagged build-up on inlet.",
    "Within spec, no action needed.",
    "Foaming during CIP — reduced chemical dose.",
    "Swab taken after sanitizer flush.",
    "",
    "",
  ];

  function seededRand(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  const rand = seededRand(42);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  function rluFor(state) {
    if (state === "pass") return Math.floor(50 + rand() * 200);
    if (state === "caution") return Math.floor(500 + rand() * 300);
    return Math.floor(800 + rand() * 700);
  }

  // Build 125 rows stamped over the last few days
  const rows = [];
  const startDate = new Date("2026-04-21T20:40:00");
  const states = ["fail","fail","fail","fail","fail","pass","pass","fail","fail","fail","caution","fail","pass","caution","caution","pass","fail","fail","fail","fail"];
  for (let i = 0; i < 125; i++) {
    const state = i < states.length ? states[i] : (rand() < 0.35 ? "fail" : rand() < 0.6 ? "pass" : "caution");
    const site = pick(sites);
    const location = pick(locationsBySite[site]);
    const ts = new Date(startDate.getTime() - i * (14 + Math.floor(rand()*40)) * 60 * 1000);
    const rlu = rluFor(state);
    const lower = 250;
    const upper = 750;
    rows.push({
      id: i + 1,
      state,
      ts,
      site,
      location,
      device: pick(devices),
      user: pick(users),
      cfu: state === "pass" ? 0 : Math.floor(rand() * 8),
      rlu,
      lower,
      upper,
      retest: rand() < 0.08,
      retested: rand() < 0.04,
      serial: "87831",
      instrument: "EnSURE Touch #" + (200 + Math.floor(rand()*40)),
      plan: pick(plans),
      notes: pick(notesPool),
      swabTemp: (4 + rand() * 6).toFixed(1) + "°C",
      ambientTemp: (18 + rand() * 6).toFixed(1) + "°C",
      group: site.split("'")[0] + " group",
      surface: pick(surfaces),
      createdBy: pick(users),
      zone: pick(zones),
      unitType: pick(unitTypes),
      line: pick(lines),
    });
  }

  window.TEST_ROWS = rows;
})();
