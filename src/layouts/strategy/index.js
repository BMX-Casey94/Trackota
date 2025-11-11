/*!
 
=========================================================
* Trackota – Race Strategy Layout
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import { FormControl, Select, MenuItem, TextField, FormControlLabel, Switch } from "@mui/material";

// Components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiProgress from "components/VuiProgress";
import VuiButton from "components/VuiButton";
import LineChart from "examples/Charts/LineCharts/LineChart";

// layout components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useEffect, useState } from "react";
import { StrategyApi } from "services/api";

function Strategy() {
  const api = StrategyApi;
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
  // Respect current dataset/car selection saved by Dashboard
  const [selectedFolder] = useState(() => {
    try {
      return localStorage.getItem("trackota:selectedFolder") || null;
    } catch {
      return null;
    }
  });
  const [selectedCar] = useState(() => {
    try {
      const folder = typeof localStorage !== "undefined" ? localStorage.getItem("trackota:selectedFolder") : null;
      return folder ? (localStorage.getItem(`trackota:selectedCar:${folder}`) || null) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const baseParams = selectedFolder ? { folder: selectedFolder } : {};
        const carParams = selectedCar ? { ...baseParams, car: selectedCar } : baseParams;
        const [s, recs, top3, deg, tel] = await Promise.all([
          api.getSummary(carParams),
          api.getRecommendations(baseParams),
          api.getTopThree(carParams),
          api.getTyreDegChart(carParams),
          api.getTelemetry(carParams),
        ]);
        if (!isMounted) return;
        setSummary(s);
        setRecommendations(recs);
        setTopThree(top3);
        setTyreDeg(deg);
        setTelemetry(tel?.series || null);
      } catch (e) {
        // For now we silently fallback to placeholders
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedFolder, selectedCar]);

  const tyreColour = summary?.tyre?.colour || "#FFD060";
  const positionText = summary?.position != null ? `P${summary.position}` : "P—";
  const gapAheadText = summary?.gapAhead != null ? `${summary.gapAhead > 0 ? "+" : ""}${summary.gapAhead}s` : "—";
  const gapBehindText = summary?.gapBehind != null ? `${summary.gapBehind > 0 ? "+" : ""}${summary.gapBehind}s` : "—";
  const lapsText = summary ? `${summary.currentLap}/${summary.totalLaps}` : "—/—";
  const sessionWeatherText = summary ? `Live Race — Session: ${summary.session} — Weather: ${summary.weather}` : "Live Race";
  const lapsCount = Array.isArray(tyreDeg?.laps) ? tyreDeg.laps.length : 0;
  const maxLaps = summary?.totalLaps || (Array.isArray(tyreDeg?.laps) ? tyreDeg.laps.length : 0) || 45;
  const recommendationsList = Array.isArray(recommendations) ? recommendations : [];
  const topThreeList = Array.isArray(topThree) && topThree.length ? topThree : [
    { pos: 1, name: "—", gap: "—" },
    { pos: 2, name: "—", gap: "—" },
    { pos: 3, name: "—", gap: "—" },
  ];

  useEffect(() => {
    (async () => {
      try {
        const baseParams = selectedFolder ? { folder: selectedFolder } : {};
        const carParams = selectedCar ? { ...baseParams, car: selectedCar } : baseParams;
        const deg = await api.getTyreDegChart(carParams);
        setTyreDeg(deg);
        if (showSections) {
          const sec = await api.getSections(carParams);
          setSectionsData(sec);
        } else {
          setSectionsData(null);
        }
        const tel = await api.getTelemetry(carParams);
        setTelemetry(tel?.series || null);
      } catch {}
    })();
  }, [showSections, selectedFolder, selectedCar]);

  // Clamp simulator pit lap to race length whenever summary updates
  useEffect(() => {
    if (summary?.totalLaps) {
      setSim((s) => ({ ...s, pitLap: Math.min(Math.max(1, s.pitLap), summary.totalLaps) }));
    }
  }, [summary?.totalLaps]);

  // Build chart series and colours for the tyre degradation graph
  const baseSeries = [
    {
      name: "Lap Time (s)",
      data: (Array.isArray(tyreDeg?.times) ? tyreDeg.times : []).map((t, i) => ({ x: i + 1, y: t })),
    },
  ];
  const simulatedSeries =
    Array.isArray(simSeries) && simSeries.length
      ? [
          {
            name: "Simulated (s)",
            data: simSeries.map((t, i) => ({ x: i + 1, y: t })),
          },
        ]
      : [];
  const sectionSeries =
    showSections && sectionsData?.timesBySection
      ? Object.keys(sectionsData.timesBySection).map((key) => ({
          name: key,
          data: sectionsData.timesBySection[key].map((t, i) => ({ x: i + 1, y: t })),
        }))
      : [];
  const chartSeries = [...baseSeries, ...simulatedSeries, ...sectionSeries];

  // Colour palette: first for baseline, second for simulated, then rotating colours for sections
  const sectionPalette = [
    "#34D399",
    "#F59E0B",
    "#F43F5E",
    "#10B981",
    "#3B82F6",
    "#F472B6",
    "#22D3EE",
    "#F97316",
    "#EAB308",
    "#60A5FA",
    "#FB7185",
    "#84CC16",
    "#A855F7",
    "#06B6D4",
    "#EF4444",
  ];
  const chartColors = [
    "#2CD9FF", // baseline
    ...(simulatedSeries.length ? ["#A78BFA"] : []), // simulated
    ...sectionPalette.slice(0, sectionSeries.length), // sections
  ];

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
                // Use fr units so gaps don't overflow container; preserve 30/45/25 ratio
                xl: "minmax(0, 6fr) minmax(0, 9fr) minmax(0, 5fr)",
              },
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* Left Sidebar – Live Race Metrics + Scenario Simulator */}
            <VuiBox display="flex" flexDirection="column" gap={3}>
              <Card>
                <VuiBox p={3}>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" component="div" sx={{ mb: "8px" }}>
                    Live Race Metrics
                  </VuiTypography>
                  <VuiTypography variant="button" color="text" fontWeight="medium" component="div" sx={{ mb: "12px" }}>
                    Current Position: {positionText}
                  </VuiTypography>
                  <VuiTypography variant="button" color="success" fontWeight="bold" component="div" sx={{ mb: "4px" }}>
                    Gap Ahead: {gapAheadText}
                  </VuiTypography>
                  <VuiTypography variant="button" color="error" fontWeight="bold" component="div" sx={{ mb: "12px" }}>
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
                    <VuiTypography variant="button" color="text" fontWeight="medium" component="div">
                      Tyre: {summary?.tyre?.compound || "—"}
                    </VuiTypography>
                  </VuiBox>
                  <VuiTypography variant="button" color="text" fontWeight="medium" component="div" sx={{ mb: "6px" }}>
                    Laps on Tyres: {summary?.lapsOnTyre ?? "—"}
                  </VuiTypography>
                  <VuiProgress value={summary?.tyreWearPct ?? 0} color="info" sx={{ background: "#2D2E5F", mb: "14px" }} />
                  <VuiTypography variant="button" color="text" fontWeight="medium" component="div" sx={{ mb: "6px" }}>
                    Fuel Level: {summary?.fuelPct != null ? `${summary.fuelPct}%` : "—"}
                  </VuiTypography>
                  <VuiProgress value={summary?.fuelPct ?? 0} color="success" sx={{ background: "#2D2E5F" }} />
                </VuiBox>
              </Card>

              <Card>
                <VuiBox p={3}>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" component="div" sx={{ mb: "10px" }}>
                    Scenario Simulator
                  </VuiTypography>
                  <VuiBox display="grid" gridTemplateColumns="1fr" gap={2}>
                    <FormControlLabel
                      label={
                        <VuiTypography variant="button" color="text" fontWeight="medium">
                          Show Sections
                        </VuiTypography>
                      }
                      control={
                        <Switch
                          checked={showSections}
                          onChange={(e) => setShowSections(e.target.checked)}
                          color="info"
                        />
                      }
                      sx={{ m: 0, display: "flex", justifyContent: "space-between" }}
                    />

                    <VuiBox display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                      <VuiTypography variant="button" color="text" fontWeight="medium">
                        Pit on Lap
                      </VuiTypography>
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 1, max: maxLaps }}
                        value={sim.pitLap}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          const clamped = isNaN(raw) ? 1 : Math.min(Math.max(1, raw), maxLaps);
                          setSim((s) => ({ ...s, pitLap: clamped }));
                        }}
                        sx={{
                          width: 110,
                          "& .MuiOutlinedInput-root": {
                            color: "#ffffff",
                            background:
                              "linear-gradient(126.97deg, rgba(6, 11, 40, 0.94) 28.26%, rgba(10, 14, 35, 0.8) 91.2%)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(255, 255, 255, 0.125)",
                            borderRadius: "10px",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
                            "& fieldset": { border: "none" },
                            "&:hover": {
                              background:
                                "linear-gradient(126.97deg, rgba(6, 11, 40, 0.98) 28.26%, rgba(10, 14, 35, 0.9) 91.2%)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                            },
                            "&.Mui-focused": {
                              background:
                                "linear-gradient(126.97deg, rgba(6, 11, 40, 0.98) 28.26%, rgba(10, 14, 35, 0.9) 91.2%)",
                              border: "1px solid rgba(44, 217, 255, 0.5)",
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: "#ffffff",
                            textAlign: "center",
                            fontWeight: 500,
                            px: 1.5,
                            // Hide default number input arrows for custom styling
                            "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                              WebkitAppearance: "none",
                              margin: 0,
                            },
                            "&[type=number]": {
                              MozAppearance: "textfield",
                            },
                          },
                          // Custom glass-like increment/decrement buttons
                          "& input[type=number]": {
                            paddingRight: "8px",
                          },
                        }}
                        InputProps={{
                          endAdornment: (
                            <VuiBox
                              display="flex"
                              flexDirection="column"
                              sx={{
                                position: "absolute",
                                right: 4,
                                height: "100%",
                                justifyContent: "center",
                                gap: "2px",
                              }}
                            >
                              <VuiBox
                                component="button"
                                onClick={() =>
                                  setSim((s) => ({
                                    ...s,
                                    pitLap: Math.min(maxLaps, s.pitLap + 1),
                                  }))
                                }
                                sx={{
                                  background:
                                    "linear-gradient(126.97deg, rgba(44, 217, 255, 0.15) 0%, rgba(44, 217, 255, 0.08) 100%)",
                                  backdropFilter: "blur(10px)",
                                  border: "1px solid rgba(44, 217, 255, 0.2)",
                                  borderRadius: "4px",
                                  width: "18px",
                                  height: "12px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  padding: 0,
                                  color: "rgba(44, 217, 255, 0.9)",
                                  fontSize: "9px",
                                  fontWeight: "bold",
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    background:
                                      "linear-gradient(126.97deg, rgba(44, 217, 255, 0.25) 0%, rgba(44, 217, 255, 0.15) 100%)",
                                    border: "1px solid rgba(44, 217, 255, 0.4)",
                                  },
                                }}
                              >
                                ▲
                              </VuiBox>
                              <VuiBox
                                component="button"
                                onClick={() => setSim((s) => ({ ...s, pitLap: Math.max(1, s.pitLap - 1) }))}
                                sx={{
                                  background:
                                    "linear-gradient(126.97deg, rgba(44, 217, 255, 0.15) 0%, rgba(44, 217, 255, 0.08) 100%)",
                                  backdropFilter: "blur(10px)",
                                  border: "1px solid rgba(44, 217, 255, 0.2)",
                                  borderRadius: "4px",
                                  width: "18px",
                                  height: "12px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  padding: 0,
                                  color: "rgba(44, 217, 255, 0.9)",
                                  fontSize: "9px",
                                  fontWeight: "bold",
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    background:
                                      "linear-gradient(126.97deg, rgba(44, 217, 255, 0.25) 0%, rgba(44, 217, 255, 0.15) 100%)",
                                    border: "1px solid rgba(44, 217, 255, 0.4)",
                                  },
                                }}
                              >
                                ▼
                              </VuiBox>
                            </VuiBox>
                          ),
                        }}
                      />
                    </VuiBox>

                    <VuiBox display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                      <VuiTypography variant="button" color="text" fontWeight="medium">
                        Tyre Compound
                      </VuiTypography>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={sim.compound}
                          onChange={(e) => setSim((s) => ({ ...s, compound: e.target.value }))}
                          sx={{
                            color: "#ffffff",
                            background:
                              "linear-gradient(126.97deg, rgba(6, 11, 40, 0.94) 28.26%, rgba(10, 14, 35, 0.8) 91.2%)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(255, 255, 255, 0.125)",
                            borderRadius: "10px",
                            px: 1.5,
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
                            cursor: "pointer",
                            ".MuiOutlinedInput-notchedOutline": { border: "none" },
                            "& .MuiSelect-select": {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "100%",
                              minHeight: "unset",
                              color: "#ffffff",
                              textAlign: "center",
                              paddingLeft: "0 !important",
                              paddingRight: "32px !important",
                              cursor: "pointer",
                            },
                            "& .MuiOutlinedInput-root": {
                              cursor: "pointer",
                            },
                            "&:hover": {
                              background:
                                "linear-gradient(126.97deg, rgba(6, 11, 40, 0.98) 28.26%, rgba(10, 14, 35, 0.9) 91.2%)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
                            ".MuiSvgIcon-root, .MuiSelect-icon": { color: "#ffffff", pointerEvents: "none" },
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                background:
                                  "linear-gradient(127deg, rgba(6, 11, 40, 0.94) 28.26%, rgba(10, 14, 35, 0.94) 91.2%)",
                                backdropFilter: "blur(42px)",
                                border: "1px solid rgba(255, 255, 255, 0.125)",
                                borderRadius: "10px",
                                mt: 1,
                                boxShadow: "0 7px 23px rgba(0, 0, 0, 0.31)",
                                "& .MuiMenuItem-root": {
                                  color: "#ffffff",
                                  py: 1.5,
                                  "&:hover": {
                                    background: "rgba(44, 217, 255, 0.08)",
                                  },
                                  "&.Mui-selected": {
                                    background: "rgba(44, 217, 255, 0.2)",
                                    "&:hover": {
                                      background: "rgba(44, 217, 255, 0.3)",
                                    },
                                  },
                                },
                              },
                            },
                          }}
                        >
                          {["Soft", "Medium", "Hard"].map((c) => (
                            <MenuItem key={c} value={c}>
                              {c}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </VuiBox>

                    <FormControlLabel
                      label={
                        <VuiTypography variant="button" color="text" fontWeight="medium">
                          Safety Car
                        </VuiTypography>
                      }
                      control={
                        <Switch
                          checked={sim.safetyCar}
                          onChange={(e) => setSim((s) => ({ ...s, safetyCar: e.target.checked }))}
                          color="info"
                        />
                      }
                      sx={{ m: 0, display: "flex", justifyContent: "space-between" }}
                    />

                    <VuiBox display="flex" justifyContent="flex-end">
                      <VuiButton
                        color="info"
                        variant="contained"
                        onClick={async () => {
                          try {
                            const baseParams = selectedFolder ? { folder: selectedFolder } : {};
                            const carParams = selectedCar ? { ...baseParams, car: selectedCar } : baseParams;
                            const res = await api.simulate({
                              pitLap: sim.pitLap,
                              compound: sim.compound,
                              safetyCar: sim.safetyCar,
                              ...carParams,
                            });
                            setSimSeries(Array.isArray(res?.times) ? res.times : []);
                          } catch {}
                        }}
                      >
                        Simulate
                      </VuiButton>
                    </VuiBox>
                  </VuiBox>
                </VuiBox>
              </Card>
            </VuiBox>

            {/* Centre – Tyre Degradation Chart Container */}
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" component="div" sx={{ mb: "6px" }}>
                  {trackTitle ? `${trackTitle} — ` : ""}Tyre Degradation (Lap Time vs Lap)
                </VuiTypography>
                {tyreDeg && lapsCount ? (
                  <VuiBox sx={{ mb: "24px" }}>
                    <VuiTypography variant="button" color="text" fontWeight="regular" component="div">
                      Laps: {lapsCount}
                    </VuiTypography>
                    <VuiTypography variant="button" color="text" fontWeight="regular" component="div">
                      Pit window: {tyreDeg.pitWindow?.start ?? "—"}–{tyreDeg.pitWindow?.end ?? "—"}
                    </VuiTypography>
                  </VuiBox>
                ) : (
                  <VuiTypography variant="button" color="text" fontWeight="regular" component="div" sx={{ mb: "24px" }}>
                    Placeholder chart. X: Lap, Y: Lap Time (s). Pit window highlighted.
                  </VuiTypography>
                )}
                
                <VuiBox sx={{ height: "320px" }}>
                  <LineChart
                    lineChartData={chartSeries}
                    lineChartOptions={{
                      chart: { toolbar: { show: false } },
                      tooltip: { theme: "dark" },
                      dataLabels: { enabled: false },
                      stroke: { curve: "smooth" },
                      legend: {
                        show: true,
                        position: "bottom",
                        labels: { colors: "#ffffff" },
                      },
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
                      colors: chartColors,
                      fill: { type: "gradient", gradient: { shade: "dark", opacityFrom: 0.8, opacityTo: 0, stops: [] } },
                    }}
                  />
                </VuiBox>
              </VuiBox>
            </Card>

            {/* Right Sidebar – Strategy Recommendations & Telemetry */}
            <VuiBox display="flex" flexDirection="column" gap={3}>
              <Card>
                <VuiBox p={3}>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" component="div" sx={{ mb: "10px" }}>
                    Strategy Recommendations
                  </VuiTypography>
                  {(recommendationsList).map((r, idx) => {
                    const borderColour = r.style === "optimal" ? "#3B82F6" : r.style === "caution" ? "#F59E0B" : "#EF4444";
                    return (
                      <VuiBox key={idx} mb={idx === (recommendationsList.length - 1) ? 0 : 2} p={2} sx={{ border: `1px solid ${borderColour}`, borderRadius: "12px" }}>
                        {String(r.text || "")
                          .split("—")
                          .map((part, i) => (
                            <VuiTypography key={i} variant="button" color="text" fontWeight="bold" component="div">
                              {part.trim()}
                            </VuiTypography>
                          ))}
                        <VuiTypography variant="caption" color="text" component="div">
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
                  <VuiTypography variant="lg" color="white" fontWeight="bold" component="div" sx={{ mb: "10px" }}>
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
              <VuiTypography variant="lg" color="white" fontWeight="bold" component="div" sx={{ mb: "8px" }}>
                Top 3 — Live Tracker
              </VuiTypography>
              <Grid container spacing={3}>
                {topThreeList.map((d) => (
                  <Grid item xs={12} md={4} key={d.pos}>
                    <VuiBox
                      p={2}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      sx={{ background: "#1B1C3A", borderRadius: "12px", textAlign: "center" }}
                    >
                      <VuiTypography color="white" variant="button" fontWeight="bold" component="div">
                        P{d.pos} — {d.name}
                      </VuiTypography>
                      <VuiTypography color="text" variant="caption" component="div">
                        Gap {d.gap}
                      </VuiTypography>
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


