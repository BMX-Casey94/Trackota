
// @mui material components
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import { Card, LinearProgress, Stack, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";

// Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiProgress from "components/VuiProgress";

// Dashboard React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";
import linearGradient from "assets/theme/functions/linearGradient";

// Dashboard React base styles
import typography from "assets/theme/base/typography";
import colors from "assets/theme/base/colors";

// Dashboard layout components
// Removed template widgets or will adapt with real data

// React icons
import { IoIosRocket } from "react-icons/io";
import { IoGlobe } from "react-icons/io5";
import { IoBuild } from "react-icons/io5";
import { IoWallet } from "react-icons/io5";
import { IoDocumentText } from "react-icons/io5";
import { FaShoppingCart } from "react-icons/fa";

// Data
import LineChart from "examples/Charts/LineCharts/LineChart";
import BarChart from "examples/Charts/BarCharts/BarChart";
import { StrategyApi, MockStrategyApi } from "services/api";
import CircularProgress from "@mui/material/CircularProgress";

function Dashboard() {
  const { gradients } = colors;
  const { cardContent } = gradients;
  const useMocks = process.env.REACT_APP_USE_MOCKS === "true";
  const api = useMocks ? MockStrategyApi : StrategyApi;
  const [summary, setSummary] = useState(null);
  const [tyreDeg, setTyreDeg] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [sectionsData, setSectionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [datasetOptions, setDatasetOptions] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(() => {
    try {
      return localStorage.getItem("trackota:selectedFolder") || null;
    } catch {
      return null;
    }
  });
  const [datasetsLoading, setDatasetsLoading] = useState(true);

  // Load dataset options from serverless API and choose sensible defaults (prefer Sebring Race 1/2)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setDatasetsLoading(true);
        const ds = await StrategyApi.listDatasets();
        const dirs = (ds?.files || []).filter((f) => f.kind === "directory" && (f.csvCount || 0) > 0);
        // Prefer Sebring Race 1 and Race 2 if available
        const sebringDirs = dirs.filter((d) => /sebring/i.test(d.relativePath));
        const race1 = sebringDirs.find((d) => /race[\s_-]?1/i.test(d.relativePath));
        const race2 = sebringDirs.find((d) => /race[\s_-]?2/i.test(d.relativePath));
        let options = [];
        if (race1) options.push({ label: "Sebring - Race 1", value: race1.relativePath });
        if (race2) options.push({ label: "Sebring - Race 2", value: race2.relativePath });
        if (!options.length) {
          // Fallback: list top-level directories discovered
          options = dirs.map((d) => ({ label: d.relativePath, value: d.relativePath }));
        }
        if (active) {
          setDatasetOptions(options);
          // Choose initial selection: localStorage -> env default -> first option
          const envDefault = process.env.REACT_APP_DATASET_FOLDER || null;
          const initial = (selectedFolder && options.find((o) => o.value === selectedFolder)?.value)
            || (envDefault && options.find((o) => o.value === envDefault)?.value)
            || (options[0]?.value || null);
          setSelectedFolder(initial);
        }
      } catch (e) {
        console.error("Failed to load dataset list:", e);
      } finally {
        if (active) setDatasetsLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [s, deg, tel, sec] = await Promise.all([
          api.getSummary(selectedFolder ? { folder: selectedFolder } : {}),
          api.getTyreDegChart(selectedFolder ? { folder: selectedFolder } : {}),
          api.getTelemetry(selectedFolder ? { folder: selectedFolder } : {}),
          api.getSections(selectedFolder ? { folder: selectedFolder } : {}),
        ]);
        if (!isMounted) return;
        setSummary(s);
        setTyreDeg(deg);
        setTelemetry(tel?.series || null);
        setSectionsData(sec || null);
      } catch (e) {
        console.error("Dashboard data fetch error:", e);
        // Fallback to mock data if real API fails and mocks are not already enabled
        if (!useMocks) {
          try {
            const [s, deg] = await Promise.all([
              MockStrategyApi.getSummary(),
              MockStrategyApi.getTyreDegChart(),
            ]);
            if (!isMounted) return;
            setSummary(s);
            setTyreDeg(deg);
            setTelemetry(null);
            setSectionsData(null);
          } catch (mockErr) {
            console.error("Failed to load mock dashboard data:", mockErr);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedFolder]); // re-fetch when dataset changes

  const currentLap = summary?.currentLap;
  const totalLaps = summary?.totalLaps;
  const remainingLaps = currentLap && totalLaps ? Math.max(totalLaps - currentLap, 0) : null;
  const positionText = summary?.position ? `P${summary.position}` : "P—";
  const gapAheadText = summary?.gapAhead != null ? `${summary.gapAhead > 0 ? "+" : ""}${summary.gapAhead}s` : "—";
  const tyreCompound = summary?.tyre?.compound || "—";
  const lapsOnTyre = summary?.lapsOnTyre != null ? `${summary.lapsOnTyre} laps` : "—";
  const fuelPctText = summary?.fuelPct != null ? `${summary.fuelPct}%` : "—";

  const times = Array.isArray(tyreDeg?.times) ? tyreDeg.times : [];
  const bestLap = times.length ? Math.min(...times) : null;
  const lastWindow = times.slice(Math.max(0, times.length - 10));
  const avgLap = lastWindow.length ? (lastWindow.reduce((a, b) => a + b, 0) / lastWindow.length) : null;
  const pitStart = tyreDeg?.pitWindow?.start;
  const stintLaps = pitStart && currentLap ? Math.max(0, currentLap - pitStart + 1) : (pitStart ? Math.max(0, (times.length - pitStart + 1)) : null);
  const last3 = times.slice(-3);
  const lastMean = last3.length ? (last3.reduce((a, b) => a + b, 0) / last3.length) : null;
  const tyreWearPct = bestLap && lastMean ? Math.max(0, Math.min(100, Math.round(((lastMean - bestLap) / bestLap) * 100))) : null;

  // Driver Consistency: higher is better; based on std dev over last 10 laps
  const stdDev = (() => {
    if (!lastWindow.length) return null;
    const mean = avgLap;
    const variance = lastWindow.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / lastWindow.length;
    return Math.sqrt(variance);
  })();
  const consistencyPct = (() => {
    if (avgLap == null || stdDev == null) return null;
    // 0% at 3.0s std dev, 100% at 0s std dev; clamp 0..100
    const score = Math.max(0, Math.min(100, Math.round(100 - (stdDev / 3.0) * 100)));
    return score;
  })();

  // Section Pace: average last 5 laps per section
  const sections = sectionsData?.timesBySection || null;
  const sectionNames = sections ? Object.keys(sections) : [];
  const sectionAverages = sections
    ? sectionNames.map((name) => {
        const arr = sections[name] || [];
        const slice = arr.slice(Math.max(0, arr.length - 5));
        if (!slice.length) return 0;
        return parseFloat((slice.reduce((a, b) => a + (b || 0), 0) / slice.length).toFixed(3));
      })
    : [];
  const sectionDelta = sections
    ? sectionNames.map((name) => {
        const arr = (sections[name] || []).filter((v) => typeof v === "number");
        if (!arr.length) return { name, delta: 0, last: 0, avg: 0 };
        const last = arr[arr.length - 1];
        const slice = arr.slice(Math.max(0, arr.length - 10));
        const avg = slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : last;
        const delta = parseFloat((last - avg).toFixed(3));
        return { name, delta, last: parseFloat(last.toFixed(3)), avg: parseFloat(avg.toFixed(3)) };
      })
    : [];
  const consistencySeries = lastWindow.length ? lastWindow.map((t, i) => ({ x: times.length - lastWindow.length + i + 1, y: t })) : [];

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <VuiBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <VuiTypography variant="h4" color="text">Loading dashboard data...</VuiTypography>
        </VuiBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <VuiBox px={3} mt={2} mb={1} display="flex" justifyContent="flex-end" alignItems="center">
        {!!datasetOptions.length && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="dataset-select-label" sx={{ color: "#c8cfca" }}>Dataset</InputLabel>
            <Select
              labelId="dataset-select-label"
              id="dataset-select"
              value={selectedFolder || ""}
              label="Dataset"
              onChange={(e) => {
                const value = e.target.value || null;
                setSelectedFolder(value);
                try { localStorage.setItem("trackota:selectedFolder", value || ""); } catch {}
              }}
              sx={{
                color: "white",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "#56577A" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#8F91B5" },
                ".MuiSvgIcon-root": { color: "#c8cfca" },
              }}
            >
              {datasetOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </VuiBox>
      <VuiBox py={3}>
        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "current lap", fontWeight: "regular" }}
                count={`${currentLap ?? "—"}/${totalLaps ?? "—"}`}
                percentage={{ color: "success", text: remainingLaps != null ? `remaining ${remainingLaps} laps` : "" }}
                icon={{ color: "info", component: <IoIosRocket size="22px" color="white" /> }}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "position" }}
                count={positionText}
                percentage={{ color: "success", text: `gap ahead ${gapAheadText}` }}
                icon={{ color: "info", component: <IoGlobe size="22px" color="white" /> }}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "tyre compound" }}
                count={tyreCompound}
                percentage={{ color: "warning", text: lapsOnTyre }}
                icon={{ color: "info", component: <IoBuild size="22px" color="white" /> }}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "fuel level" }}
                count={fuelPctText}
                percentage={{ color: "info", text: "" }}
                icon={{ color: "info", component: <IoWallet size="20px" color="white" /> }}
              />
            </Grid>
          </Grid>
        </VuiBox>
        <VuiBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6} xl={7}>
              <Card>
                <VuiBox sx={{ height: "100%" }}>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                    Lap Time Overview
                  </VuiTypography>
                  <VuiBox display="flex" alignItems="center" mb="40px">
                    <VuiTypography variant="button" color="success" fontWeight="bold">
                      trend {" "}
                      <VuiTypography variant="button" color="text" fontWeight="regular">
                        this session
                      </VuiTypography>
                    </VuiTypography>
                  </VuiBox>
                  <VuiBox sx={{ height: "310px" }}>
                    <LineChart
                      lineChartData={[
                        {
                          name: "Lap Time (s)",
                          data: times.map((t, i) => ({ x: i + 1, y: t })),
                        },
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
                          categories: times.map((_, i) => i + 1),
                        },
                        yaxis: {
                          title: { text: "Time (s)" },
                          labels: { style: { colors: "#c8cfca", fontSize: "10px" } },
                        },
                        grid: { strokeDashArray: 5, borderColor: "#56577A" },
                      }}
                    />
                  </VuiBox>
                </VuiBox>
              </Card>
            </Grid>
            <Grid item xs={12} lg={6} xl={5}>
              <Card>
                <VuiBox>
                  <VuiBox
                    mb="24px"
                    height="220px"
                    sx={{
                      background: linearGradient(
                        cardContent.main,
                        cardContent.state,
                        cardContent.deg
                      ),
                      borderRadius: "20px",
                    }}
                  >
                      {/* Stint overview chart removed; reserve space for metrics */}
                  </VuiBox>
                  <VuiTypography variant="lg" color="white" fontWeight="bold" mb="5px">
                    Stint Metrics
                  </VuiTypography>
                  <VuiBox display="flex" alignItems="center" mb="40px">
                    <VuiTypography variant="button" color="text" fontWeight="regular">
                      Latest figures based on last 10 laps
                    </VuiTypography>
                  </VuiBox>
                  <Grid container spacing="50px">
                    <Grid item xs={6} md={3} lg={3}>
                      <Stack
                        direction="row"
                        spacing={{ sm: "10px", xl: "4px", xxl: "10px" }}
                        mb="6px"
                      >
                        <VuiBox
                          bgColor="info"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          sx={{ borderRadius: "6px", width: "25px", height: "25px" }}
                        >
                          <IoWallet color="#fff" size="12px" />
                        </VuiBox>
                        <VuiTypography color="text" variant="button" fontWeight="medium">
                          Avg Lap
                        </VuiTypography>
                      </Stack>
                      <VuiTypography color="white" variant="lg" fontWeight="bold" mb="8px">
                        {avgLap != null ? `${avgLap.toFixed(1)}s` : "—"}
                      </VuiTypography>
                      <VuiProgress value={60} color="info" sx={{ background: "#2D2E5F" }} />
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <Stack
                        direction="row"
                        spacing={{ sm: "10px", xl: "4px", xxl: "10px" }}
                        mb="6px"
                      >
                        <VuiBox
                          bgColor="info"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          sx={{ borderRadius: "6px", width: "25px", height: "25px" }}
                        >
                          <IoIosRocket color="#fff" size="12px" />
                        </VuiBox>
                        <VuiTypography color="text" variant="button" fontWeight="medium">
                          Best Lap
                        </VuiTypography>
                      </Stack>
                      <VuiTypography color="white" variant="lg" fontWeight="bold" mb="8px">
                        {bestLap != null ? `${bestLap.toFixed(1)}s` : "—"}
                      </VuiTypography>
                      <VuiProgress value={60} color="info" sx={{ background: "#2D2E5F" }} />
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <Stack
                        direction="row"
                        spacing={{ sm: "10px", xl: "4px", xxl: "10px" }}
                        mb="6px"
                      >
                        <VuiBox
                          bgColor="info"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          sx={{ borderRadius: "6px", width: "25px", height: "25px" }}
                        >
                          <FaShoppingCart color="#fff" size="12px" />
                        </VuiBox>
                        <VuiTypography color="text" variant="button" fontWeight="medium">
                          Stint Laps
                        </VuiTypography>
                      </Stack>
                      <VuiTypography color="white" variant="lg" fontWeight="bold" mb="8px">
                        {stintLaps != null ? stintLaps : "—"}
                      </VuiTypography>
                      <VuiProgress value={60} color="info" sx={{ background: "#2D2E5F" }} />
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <Stack
                        direction="row"
                        spacing={{ sm: "10px", xl: "4px", xxl: "10px" }}
                        mb="6px"
                      >
                        <VuiBox
                          bgColor="info"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          sx={{ borderRadius: "6px", width: "25px", height: "25px" }}
                        >
                          <IoBuild color="#fff" size="12px" />
                        </VuiBox>
                        <VuiTypography color="text" variant="button" fontWeight="medium">
                          Tyre Wear
                        </VuiTypography>
                      </Stack>
                      <VuiTypography color="white" variant="lg" fontWeight="bold" mb="8px">
                        {tyreWearPct != null ? `${tyreWearPct}%` : "—"}
                      </VuiTypography>
                      <VuiProgress value={60} color="info" sx={{ background: "#2D2E5F" }} />
                    </Grid>
                  </Grid>
                </VuiBox>
              </Card>
            </Grid>
          </Grid>
        </VuiBox>
        <Grid container spacing={3} direction="row" justifyContent="center" alignItems="stretch">
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <VuiBox p={3} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="10px">
                  Driver Consistency
                </VuiTypography>
                <VuiBox sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
                  <CircularProgress variant="determinate" value={consistencyPct ?? 0} size={170} color="info" />
                  <VuiBox
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: "absolute",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <VuiTypography color="white" variant="h3" fontWeight="bold">
                      {consistencyPct != null ? `${consistencyPct}%` : "—"}
                    </VuiTypography>
                  </VuiBox>
                </VuiBox>
                <VuiTypography variant="button" color="text" fontWeight="regular">
                  Last 10 laps variability (lower is better)
                </VuiTypography>
                <VuiBox sx={{ width: "100%", height: "120px", mt: 2 }}>
                  <LineChart
                    lineChartData={[
                      { name: "Lap Time (s)", data: consistencySeries }
                    ]}
                    lineChartOptions={{
                      chart: { toolbar: { show: false }, sparkline: { enabled: true } },
                      dataLabels: { enabled: false },
                      stroke: { curve: "smooth" },
                      xaxis: { type: "numeric", categories: consistencySeries.map((p) => p.x) },
                      yaxis: { labels: { style: { colors: "#c8cfca", fontSize: "10px" } } },
                      grid: { strokeDashArray: 5, borderColor: "#56577A" },
                    }}
                  />
                </VuiBox>
              </VuiBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="10px">
                  Telemetry Snapshot
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
          </Grid>
          <Grid item xs={12} md={12} lg={4}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="10px">
                  Section Pace (avg of last 5 laps)
                </VuiTypography>
                <VuiBox height="220px">
                  <BarChart
                    barChartData={[
                      {
                        name: "Time (s)",
                        data: sectionAverages,
                      },
                    ]}
                    barChartOptions={{
                      chart: { toolbar: { show: false } },
                      tooltip: {
                        theme: "dark",
                      },
                      xaxis: {
                        categories: sectionNames,
                        labels: { style: { colors: "#fff", fontSize: "10px" } },
                      },
                      yaxis: {
                        labels: { style: { colors: "#fff", fontSize: "10px" } },
                      },
                      grid: { show: false },
                      dataLabels: { enabled: false },
                      plotOptions: { bar: { borderRadius: 8, columnWidth: "16px" } },
                      fill: { colors: "#2CD9FF" },
                    }}
                  />
                </VuiBox>
              </VuiBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography variant="lg" color="white" fontWeight="bold" mb="10px">
                  Section Delta (last lap vs 10‑lap avg)
                </VuiTypography>
                <Grid container spacing={2}>
                  {sectionDelta.map((s) => {
                    const positive = s.delta > 0;
                    const colour = positive ? "error" : "success";
                    const sign = s.delta > 0 ? "+" : "";
                    return (
                      <Grid key={s.name} item xs={6} md={4} lg={2}>
                        <VuiBox p={2} sx={{ background: "#1B1C3A", borderRadius: "12px" }}>
                          <VuiTypography color="text" variant="button" fontWeight="medium" mb="4px">
                            {s.name}
                          </VuiTypography>
                          <VuiTypography color="white" variant="lg" fontWeight="bold">
                            {sign}{s.delta.toFixed(3)}s
                          </VuiTypography>
                          <VuiTypography color={colour} variant="caption" fontWeight="regular">
                            {positive ? "Slower" : "Faster"}
                          </VuiTypography>
                        </VuiBox>
                      </Grid>
                    );
                  })}
                  {!sectionDelta.length && (
                    <Grid item xs={12}>
                      <VuiTypography variant="button" color="text">No section data available.</VuiTypography>
                    </Grid>
                  )}
                </Grid>
              </VuiBox>
            </Card>
          </Grid>
        </Grid>
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
