/*!
 
=========================================================
* Trackota – Race Strategy Layout
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiProgress from "components/VuiProgress";
import LineChart from "examples/Charts/LineCharts/LineChart";

// layout components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useEffect, useState } from "react";
import { StrategyApi, MockStrategyApi } from "services/api";

function Strategy() {
  const useMocks = process.env.REACT_APP_USE_MOCKS === "true";
  const api = useMocks ? MockStrategyApi : StrategyApi;
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [topThree, setTopThree] = useState([]);
  const [tyreDeg, setTyreDeg] = useState(null);
  const [sim, setSim] = useState({ pitLap: 26, compound: "Hard", safetyCar: false });
  const [simSeries, setSimSeries] = useState([]);
  const [showSections, setShowSections] = useState(false);
  const [sectionsData, setSectionsData] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const trackTitle = tyreDeg?.file ? tyreDeg.file.split("/").slice(-1)[0].replace(/[-_]/g, " ") : "";

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [s, recs, top3, deg] = await Promise.all([
          api.getSummary(),
          api.getRecommendations(),
          api.getTopThree(),
          api.getTyreDegChart(),
        ]);
        if (!isMounted) return;
        setSummary(s);
        setRecommendations(recs);
        setTopThree(top3);
        setTyreDeg(deg);
      } catch (e) {
        // For now we silently fallback to placeholders
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const tyreColour = summary?.tyre?.colour || "#FFD060";
  const positionText = summary ? `P${summary.position}` : "P-";
  const gapAheadText = summary?.gapAhead != null ? `${summary.gapAhead > 0 ? "+" : ""}${summary.gapAhead}s` : "—";
  const gapBehindText = summary?.gapBehind != null ? `${summary.gapBehind > 0 ? "+" : ""}${summary.gapBehind}s` : "—";
  const lapsText = summary ? `${summary.currentLap}/${summary.totalLaps}` : "—/—";
  const sessionWeatherText = summary ? `Live Race — Session: ${summary.session} — Weather: ${summary.weather}` : "Live Race";
  const lapsCount = Array.isArray(tyreDeg?.laps) ? tyreDeg.laps.length : 0;
  const recommendationsList = Array.isArray(recommendations) ? recommendations : [];
  const topThreeList = Array.isArray(topThree) && topThree.length ? topThree : [
    { pos: 1, name: "—", gap: "—" },
    { pos: 2, name: "—", gap: "—" },
    { pos: 3, name: "—", gap: "—" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const deg = await api.getTyreDegChart();
        setTyreDeg(deg);
        if (showSections) {
          const sec = await api.getSections();
          setSectionsData(sec);
        } else {
          setSectionsData(null);
        }
        const tel = await api.getTelemetry();
        setTelemetry(tel?.series || null);
      } catch {}
    })();
  }, [showSections]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox py={3}>
        {/* Top Banner */}
        <VuiBox mb={3}>
          <Card>
            <VuiBox p={3} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <VuiTypography variant="lg" color="white" fontWeight="bold">
                LAP {lapsText}
              </VuiTypography>
              <VuiBox display="flex" alignItems="center" gap={2}>
                <VuiBox
                  sx={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "#01B574",
                    boxShadow: "0 0 0 6px rgba(1,181,116,0.15)",
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%": { boxShadow: "0 0 0 0 rgba(1,181,116,0.5)" },
                      "70%": { boxShadow: "0 0 0 10px rgba(1,181,116,0)" },
                      "100%": { boxShadow: "0 0 0 0 rgba(1,181,116,0)" },
                    },
                  }}
                />
                <VuiTypography variant="button" color="text" fontWeight="medium">
                  {sessionWeatherText}
                </VuiTypography>
              </VuiBox>
            </VuiBox>
          </Card>
        </VuiBox>

        {/* Main grid: Left (30%), Centre (45%), Right (25%) */}
        <VuiBox mb={3}>
          <VuiBox
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "30% 45% 25%",
              },
              gap: "24px",
            }}
          >
            {/* Left Sidebar – Live Race Metrics */}
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="8px">
                  Live Race Metrics
                </VuiTypography>
                <VuiTypography variant="button" color="text" fontWeight="medium" mb="12px">
                  Current Position: {positionText}
                </VuiTypography>
                <VuiTypography variant="button" color="success" fontWeight="bold" mb="4px">
                  Gap Ahead: {gapAheadText}
                </VuiTypography>
                <VuiTypography variant="button" color="error" fontWeight="bold" mb="12px">
                  Gap Behind: {gapBehindText}
                </VuiTypography>
                <VuiBox display="flex" alignItems="center" gap={1} mb="12px">
                  <VuiBox
                    sx={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: tyreColour,
                    }}
                  />
                  <VuiTypography variant="button" color="text" fontWeight="medium">
                    Tyre: {summary?.tyre?.compound || "—"}
                  </VuiTypography>
                </VuiBox>
                <VuiTypography variant="button" color="text" fontWeight="medium" mb="6px">
                  Laps on Tyres: {summary?.lapsOnTyre ?? "—"}
                </VuiTypography>
                <VuiProgress value={summary?.tyreWearPct ?? 0} color="info" sx={{ background: "#2D2E5F", mb: "14px" }} />
                <VuiTypography variant="button" color="text" fontWeight="medium" mb="6px">
                  Fuel Level: {summary?.fuelPct != null ? `${summary.fuelPct}%` : "—"}
                </VuiTypography>
                <VuiProgress value={summary?.fuelPct ?? 0} color="success" sx={{ background: "#2D2E5F" }} />
              </VuiBox>
            </Card>

            {/* Centre – Tyre Degradation Chart Container */}
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="6px">
                  {trackTitle ? `${trackTitle} — ` : ""}Tyre Degradation (Lap Time vs Lap)
                </VuiTypography>
                {tyreDeg && lapsCount ? (
                  <VuiTypography variant="button" color="text" fontWeight="regular" mb="24px">
                    Laps: {lapsCount} — Pit window: {tyreDeg.pitWindow?.start ?? "—"}–{tyreDeg.pitWindow?.end ?? "—"}
                  </VuiTypography>
                ) : (
                  <VuiTypography variant="button" color="text" fontWeight="regular" mb="24px">
                    Placeholder chart. X: Lap, Y: Lap Time (s). Pit window highlighted.
                  </VuiTypography>
                )}
                
                <VuiBox sx={{ height: "320px" }}>
                  <LineChart
                    lineChartData={[
                      {
                        name: "Lap Time (s)",
                        data: (Array.isArray(tyreDeg?.times) ? tyreDeg.times : []).map((t, i) => ({ x: i + 1, y: t })),
                      },
                      ...(Array.isArray(simSeries) && simSeries.length
                        ? [
                            {
                              name: "Simulated (s)",
                              data: simSeries.map((t, i) => ({ x: i + 1, y: t })),
                            },
                          ]
                        : []),
                      ...(showSections && sectionsData?.timesBySection
                        ? Object.keys(sectionsData.timesBySection).map((key) => ({
                            name: key,
                            data: sectionsData.timesBySection[key].map((t, i) => ({ x: i + 1, y: t })),
                          }))
                        : []),
                    ]}
                    lineChartOptions={{
                      chart: { toolbar: { show: false } },
                      tooltip: { theme: "dark" },
                      dataLabels: { enabled: false },
                      stroke: { curve: "smooth" },
                      xaxis: {
                        type: "numeric",
                        title: { text: "Lap" },
                        labels: { style: { colors: "#c8cfca", fontSize: "10px" } },
                        // Provide categories to avoid ApexCharts accessing undefined length
                        categories: Array.isArray(tyreDeg?.times)
                          ? tyreDeg.times.map((_, i) => i + 1)
                          : [],
                      },
                      yaxis: {
                        title: { text: "Time (s)" },
                        labels: { style: { colors: "#c8cfca", fontSize: "10px" } },
                      },
                      grid: { strokeDashArray: 5, borderColor: "#56577A" },
                      annotations: {
                        xaxis: [
                          summary?.currentLap
                            ? { x: summary.currentLap, strokeDashArray: 2, borderColor: "#22D1EE", label: { text: "Current Lap" } }
                            : null,
                          tyreDeg?.pitWindow?.start
                            ? { x: tyreDeg.pitWindow.start, strokeDashArray: 2, borderColor: "#F59E0B", label: { text: "Pit Window Start" } }
                            : null,
                          tyreDeg?.pitWindow?.end
                            ? { x: tyreDeg.pitWindow.end, strokeDashArray: 2, borderColor: "#F59E0B", label: { text: "Pit Window End" } }
                            : null,
                        ].filter(Boolean),
                      },
                      colors: ["#2CD9FF"],
                      fill: { type: "gradient", gradient: { shade: "dark", opacityFrom: 0.8, opacityTo: 0, stops: [] } },
                    }}
                  />
                </VuiBox>
              </VuiBox>
            </Card>

            {/* Right Sidebar – Strategy Recommendations & Simulator */}
            <VuiBox display="flex" flexDirection="column" gap={3}>
              <Card>
                <VuiBox p={3}>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" mb="10px">
                    Strategy Recommendations
                  </VuiTypography>
                  {(recommendationsList).map((r, idx) => {
                    const borderColour = r.style === "optimal" ? "#3B82F6" : r.style === "caution" ? "#F59E0B" : "#EF4444";
                    return (
                      <VuiBox key={idx} mb={idx === (recommendationsList.length - 1) ? 0 : 2} p={2} sx={{ border: `1px solid ${borderColour}`, borderRadius: "12px" }}>
                        <VuiTypography variant="button" color="text" fontWeight="bold">
                          {r.text}
                        </VuiTypography>
                        <VuiTypography variant="caption" color="text">
                          Reasoning: {r.reason}
                        </VuiTypography>
                      </VuiBox>
                    );
                  })}
                  {!recommendationsList.length && (
                    <VuiTypography variant="button" color="text">No recommendations available.</VuiTypography>
                  )}
                </VuiBox>
              </Card>

              <Card>
                <VuiBox p={3}>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" mb="10px">
                    Scenario Simulator
                  </VuiTypography>
                  <VuiBox display="flex" flexDirection="column" gap={2}>
                    <label style={{ color: "#c8cfca" }}>
                      Show Sections
                      <input
                        type="checkbox"
                        checked={showSections}
                        onChange={(e) => setShowSections(e.target.checked)}
                        style={{ marginLeft: 8 }}
                      />
                    </label>
                    <label style={{ color: "#c8cfca" }}>
                      Pit on Lap
                      <input
                        type="number"
                        min={1}
                        value={sim.pitLap}
                        onChange={(e) => setSim((s) => ({ ...s, pitLap: Number(e.target.value) }))}
                        style={{ marginLeft: 8, background: "#1B1C3A", color: "#c8cfca", border: "1px solid #56577A", borderRadius: 6, padding: "4px 8px" }}
                      />
                    </label>
                    <label style={{ color: "#c8cfca" }}>
                      Tyre Compound
                      <select
                        value={sim.compound}
                        onChange={(e) => setSim((s) => ({ ...s, compound: e.target.value }))}
                        style={{ marginLeft: 8, background: "#1B1C3A", color: "#c8cfca", border: "1px solid #56577A", borderRadius: 6, padding: "4px 8px" }}
                      >
                        <option>Soft</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </label>
                    <label style={{ color: "#c8cfca" }}>
                      Safety Car
                      <input
                        type="checkbox"
                        checked={sim.safetyCar}
                        onChange={(e) => setSim((s) => ({ ...s, safetyCar: e.target.checked }))}
                        style={{ marginLeft: 8 }}
                      />
                    </label>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.simulate({ pitLap: sim.pitLap, compound: sim.compound, safetyCar: sim.safetyCar });
                          setSimSeries(Array.isArray(res?.times) ? res.times : []);
                        } catch {}
                      }}
                      style={{ background: "#2CD9FF", color: "#0b0d2a", border: 0, borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Simulate
                    </button>
                  </VuiBox>
                </VuiBox>
              </Card>

              <Card>
                <VuiBox p={3}>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" mb="10px">
                    Live Telemetry
                  </VuiTypography>
                  <VuiBox display="grid" gridTemplateColumns="1fr 1fr" gap={12}>
                    <VuiBox>
                      <VuiTypography variant="button" color="text">Speed</VuiTypography>
                      <VuiTypography variant="lg" color="white" fontWeight="bold">{telemetry?.speed?.slice(-1)[0] != null ? `${telemetry.speed.slice(-1)[0]} mph` : "—"}</VuiTypography>
                    </VuiBox>
                    <VuiBox>
                      <VuiTypography variant="button" color="text">Gear</VuiTypography>
                      <VuiTypography variant="lg" color="white" fontWeight="bold">{telemetry?.gear?.slice(-1)[0] ?? "—"}</VuiTypography>
                    </VuiBox>
                    <VuiBox>
                      <VuiTypography variant="button" color="text">Throttle</VuiTypography>
                      <VuiTypography variant="lg" color="white" fontWeight="bold">{telemetry?.throttle?.slice(-1)[0] != null ? `${telemetry.throttle.slice(-1)[0]}%` : "—"}</VuiTypography>
                    </VuiBox>
                    <VuiBox>
                      <VuiTypography variant="button" color="text">Brake F/R</VuiTypography>
                      <VuiTypography variant="lg" color="white" fontWeight="bold">{telemetry?.brake_f?.slice(-1)[0] ?? "—"} / {telemetry?.brake_r?.slice(-1)[0] ?? "—"}</VuiTypography>
                    </VuiBox>
                  </VuiBox>
                </VuiBox>
              </Card>
            </VuiBox>
          </VuiBox>
        </VuiBox>

        {/* Bottom – Top 3 competitor tracker */}
        <VuiBox>
          <Card>
            <VuiBox p={3}>
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="8px">
                Top 3 — Live Tracker
              </VuiTypography>
              <Grid container spacing={3}>
                {topThreeList.map((d) => (
                  <Grid item xs={12} md={4} key={d.pos}>
                    <VuiBox p={2} sx={{ background: "#1B1C3A", borderRadius: "12px" }}>
                      <VuiTypography color="text" variant="button" fontWeight="bold">P{d.pos} — {d.name}</VuiTypography>
                      <VuiTypography color="text" variant="caption">Gap {d.gap}</VuiTypography>
                    </VuiBox>
                  </Grid>
                ))}
              </Grid>
            </VuiBox>
          </Card>
        </VuiBox>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Strategy;


