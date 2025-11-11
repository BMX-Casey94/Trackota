// Service layer for backend endpoints; default to same-origin /api (Vercel functions)
// CRITICAL: Webpack inlines process.env.REACT_APP_API_BASE at build time, so we must check runtime value
const defaultBase = "/api";

function isLocalBase(v) {
  if (!v) return false;
  let s = String(v).trim();
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  try {
    const u = new URL(s);
    const host = (u.hostname || "").toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "[::1]"
    );
  } catch {
    return false;
  }
}

// Get API base: ALWAYS use /api in production, never localhost
// This function runs at module load, but checks runtime window.location for safety
function getApiBase() {
  // Detect production: either NODE_ENV=production OR we're on a real domain (not localhost)
  const isProd = process.env.NODE_ENV === "production" || 
    (typeof window !== "undefined" && window.location && 
     !window.location.hostname.match(/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/));
  
  // Get the base URL (webpack may have inlined this at build time)
  const rawBase = process.env.REACT_APP_API_BASE;
  
  // In production: ALWAYS reject localhost, use /api instead
  if (isProd) {
    if (isLocalBase(rawBase)) {
      console.warn("[Trackota] Rejecting localhost API base in production, using /api");
      return defaultBase;
    }
    // If no base provided in production, use default
    if (!rawBase) {
      return defaultBase;
    }
    // If a valid non-localhost base is provided, use it
    return rawBase;
  }
  
  // Development: allow localhost if explicitly set
  return rawBase || defaultBase;
}

const API_BASE = getApiBase();

const DEFAULT_FOLDER = process.env.REACT_APP_DATASET_FOLDER || null;

function appendFolder(path, params = {}) {
  if (!DEFAULT_FOLDER) return path;
  // Add folder to query string if not present
  const hasQuery = path.includes("?");
  const url = new URL(path, "http://dummy.local");
  if (!url.searchParams.has("folder")) {
    url.searchParams.set("folder", DEFAULT_FOLDER);
  }
  const qs = url.searchParams.toString();
  return hasQuery ? `${url.pathname}?${qs}` : `${url.pathname}?${qs}`;
}

async function fetchJson(path, options = {}) {
  // Normalise URL: join base and path with a single slash
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const suffix = (appendFolder(path) || path).startsWith("/")
    ? appendFolder(path).slice(1)
    : appendFolder(path);
  const url = `${base}/${suffix}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const StrategyApi = {
  getSummary: (params = {}) => {
    const all = { ...params };
    const q = new URLSearchParams(all).toString();
    return fetchJson(`/strategy/summary${q ? `?${q}` : ""}`);
  },
  getRecommendations: () => fetchJson("/strategy/recommendations"),
  getTopThree: () => fetchJson("/race/top3"),
  listCars: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/race/cars${q ? `?${q}` : ""}`);
  },
  getTyreDegChart: (params = {}) => {
    const all = { ...params };
    const q = new URLSearchParams(all).toString();
    return fetchJson(`/charts/tyre-degradation${q ? `?${q}` : ""}`);
  },
  getWeatherTrend: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/weather/trend${q ? `?${q}` : ""}`);
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


