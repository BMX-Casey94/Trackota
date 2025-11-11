
// @mui material components
// @mui icons
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import { useEffect, useState } from "react";
// Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import Footer from "examples/Footer";
// Dashboard React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
// Overview page components
import Header from "layouts/profile/components/Header";
import PlatformSettings from "layouts/profile/components/PlatformSettings";
import LineChart from "examples/Charts/LineCharts/LineChart";
import BarChart from "examples/Charts/BarCharts/BarChart";
import { StrategyApi, MockStrategyApi } from "services/api";

function Overview() {
  const useMocks = process.env.REACT_APP_USE_MOCKS === "true";
  const api = useMocks ? MockStrategyApi : StrategyApi;
  const [summary, setSummary] = useState(null);
  const [tyreDeg, setTyreDeg] = useState(null);
  const [sections, setSections] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [s, deg, sec, tel] = await Promise.all([
          api.getSummary(),
          api.getTyreDegChart(),
          api.getSections(),
          api.getTelemetry(),
        ]);
        if (!isMounted) return;
        setSummary(s);
        setTyreDeg(deg);
        setSections(sec);
        setTelemetry(tel?.series || null);
      } catch (e) {
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const trackPath = tyreDeg?.file || sections?.file || null;
  const trackParts = trackPath ? trackPath.split("/") : [];
  const trackName = trackParts.length ? trackParts[0].replace(/[-_]/g, " ") : "—";
  const eventName = trackParts.length > 1 ? trackParts[1].replace(/[-_]/g, " ") : "—";

  const lapTimes = Array.isArray(tyreDeg?.times) ? tyreDeg.times : [];
  const recentLapPairs = lapTimes.slice(-10).map((t, i, arr) => {
    const lapNum = lapTimes.length - arr.length + i + 1;
    return { lap: lapNum, time: t };
  });

  const sectionsByName = sections?.timesBySection || {};
  const sectionNames = Object.keys(sectionsByName || {});
  const sectionAverages = sectionNames.map((name) => {
    const arr = sectionsByName[name] || [];
    const slice = arr.slice(Math.max(0, arr.length - 5));
    if (!slice.length) return 0;
    return parseFloat((slice.reduce((a, b) => a + (b || 0), 0) / slice.length).toFixed(3));
  });

  const positionText = summary?.position ? `P${summary.position}` : "P—";
  const lapsText = summary?.currentLap && summary?.totalLaps ? `${summary.currentLap}/${summary.totalLaps}` : "—/—";
  const tyreText = summary?.tyre?.compound || "—";
  const fuelText = summary?.fuelPct != null ? `${summary.fuelPct}%` : "—";

  if (loading) {
    return (
      <DashboardLayout>
        <Header />
        <VuiBox py={6} display="flex" justifyContent="center" alignItems="center">
          <VuiTypography variant="h4" color="text">Loading profile…</VuiTypography>
        </VuiBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header />
      <VuiBox mt={5} mb={3}>
        <Grid
          container
          spacing={3}
          sx={({ breakpoints }) => ({
            [breakpoints.only("xl")]: {
              gridTemplateColumns: "repeat(2, 1fr)",
            },
          })}
        >
          {/* Left – Driver & Car Profile */}
          <Grid item xs={12} xl={6}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography color="white" variant="lg" fontWeight="bold" mb="6px">
                  Driver & Car Profile
                </VuiTypography>
                <VuiTypography color="text" variant="button" fontWeight="regular" mb="16px">
                  Track: {trackName} — Event: {eventName}
                </VuiTypography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <VuiTypography color="text" variant="button">Session</VuiTypography>
                    <VuiTypography color="white" variant="lg" fontWeight="bold">{summary?.session || "Race"}</VuiTypography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <VuiTypography color="text" variant="button">Laps</VuiTypography>
                    <VuiTypography color="white" variant="lg" fontWeight="bold">{lapsText}</VuiTypography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <VuiTypography color="text" variant="button">Position</VuiTypography>
                    <VuiTypography color="white" variant="lg" fontWeight="bold">{positionText}</VuiTypography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <VuiTypography color="text" variant="button">Tyres</VuiTypography>
                    <VuiTypography color="white" variant="lg" fontWeight="bold">{tyreText}</VuiTypography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <VuiTypography color="text" variant="button">Fuel</VuiTypography>
                    <VuiTypography color="white" variant="lg" fontWeight="bold">{fuelText}</VuiTypography>
                  </Grid>
                </Grid>
              </VuiBox>
            </Card>
          </Grid>

          {/* Right – Section Snapshot */}
          <Grid item xs={12} xl={6}>
            <Card>
              <VuiBox p={3}>
                <VuiTypography color="white" variant="lg" fontWeight="bold" mb="6px">
                  Section Snapshot (avg of last 5 laps)
                </VuiTypography>
                <VuiBox height="220px">
                  <BarChart
                    barChartData={[{ name: "Time (s)", data: sectionAverages }]}
                    barChartOptions={{
                      chart: { toolbar: { show: false } },
                      tooltip: { theme: "dark" },
                      xaxis: { categories: sectionNames, labels: { style: { colors: "#fff", fontSize: "10px" } } },
                      yaxis: { labels: { style: { colors: "#fff", fontSize: "10px" } } },
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
        </Grid>
      </VuiBox>
      <Grid container spacing={3} mb="30px">
        <Grid item xs={12} xl={3} height="100%">
          <PlatformSettings />
        </Grid>
        <Grid item xs={12} xl={9}>
          <Card>
            <VuiBox display="flex" flexDirection="column" height="100%">
              <VuiBox display="flex" flexDirection="column" mb="24px">
                <VuiTypography color="white" variant="lg" fontWeight="bold" mb="6px">
                  Recent Lap Times
                </VuiTypography>
                <VuiTypography color="text" variant="button" fontWeight="regular">
                  Last 10 laps recorded from dataset
                </VuiTypography>
              </VuiBox>
              <Grid container spacing={2}>
                {recentLapPairs.map((p) => (
                  <Grid key={p.lap} item xs={6} md={3} lg={2}>
                    <Card>
                      <VuiBox p={2} textAlign="center">
                        <VuiTypography color="text" variant="caption">Lap {p.lap}</VuiTypography>
                        <VuiTypography color="white" variant="lg" fontWeight="bold">{p.time?.toFixed(1)}s</VuiTypography>
                      </VuiBox>
                    </Card>
                  </Grid>
                ))}
                {!recentLapPairs.length && (
                  <Grid item xs={12}>
                    <VuiTypography color="text" variant="button">No lap data available.</VuiTypography>
                  </Grid>
                )}
              </Grid>
            </VuiBox>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb="30px">
        <Grid item xs={12} xl={12}>
          <Card>
            <VuiBox p={3}>
              <VuiTypography color="white" variant="lg" fontWeight="bold" mb="6px">
                Telemetry Snapshot
              </VuiTypography>
              <VuiBox display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr" gap={12}>
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
      </Grid>

      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
