// Service layer for backend endpoints; defaults to same-origin /api in production
const API_BASE = process.env.REACT_APP_API_BASE || "";

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const StrategyApi = {
  getSummary: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/strategy/summary${q ? `?${q}` : ""}`);
  },
  getRecommendations: () => fetchJson("/strategy/recommendations"),
  getTopThree: () => fetchJson("/race/top3"),
  getTyreDegChart: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/charts/tyre-degradation${q ? `?${q}` : ""}`);
  },
  listDatasets: () => fetchJson("/datasets"),
  simulate: ({ pitLap, compound, safetyCar }) =>
    fetchJson("/strategy/simulate", {
      method: "POST",
      body: JSON.stringify({ pitLap, compound, safetyCar }),
    }),
  getSections: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/charts/sections${q ? `?${q}` : ""}`);
  },
  getTelemetry: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/telemetry/series${q ? `?${q}` : ""}`);
  },
};

// Mock helpers until backend is ready
export const MockStrategyApi = {
  getSummary: async () => ({
    currentLap: 24,
    totalLaps: 45,
    session: "Race",
    weather: "18°C, Overcast",
    position: 7,
    gapAhead: -0.6,
    gapBehind: 0.4,
    tyre: { compound: "Medium", colour: "#FFD060" },
    lapsOnTyre: 10,
    tyreWearPct: 40,
    fuelPct: 65,
  }),
  getRecommendations: async () => ([
    {
      style: "optimal",
      text: "BOX on Lap 26 — Tyre: Hard — Risk: Low",
      reason: "Undercut window opening; expected gain ~1.2s over 3 laps.",
    },
    {
      style: "caution",
      text: "Defer to Lap 28 — Tyre: Medium — Risk: Medium",
      reason: "Protect track position; risk if Safety Car appears.",
    },
  ]),
  getTopThree: async () => ([
    { pos: 1, name: "Driver A", gap: "+0.0s" },
    { pos: 2, name: "Driver B", gap: "+1.1s" },
    { pos: 3, name: "Driver C", gap: "+1.9s" },
  ]),
  getTyreDegChart: async () => ({
    laps: Array.from({ length: 24 }, (_, i) => i + 1),
    times: [93.2, 92.9, 92.7, 92.6, 92.5, 92.8, 93.1, 93.4, 93.9, 94.2, 94.7, 95.1, 95.6, 96.0, 96.4, 96.8, 97.2, 97.5, 97.9, 98.3, 98.8, 99.1, 99.5, 99.9],
    pitWindow: { start: 24, end: 28 },
  }),
};


