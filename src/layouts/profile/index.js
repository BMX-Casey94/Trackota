
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
import Welcome from "layouts/profile/components/Welcome";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import CarInformations from "layouts/profile/components/CarInformations";
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
        <Card>
          <VuiBox p={3}>
            <VuiTypography color="white" variant="lg" fontWeight="bold" mb="6px">
              Toyota Gazoo Racing Platform — Profile
            </VuiTypography>
            <VuiTypography color="text" variant="button" fontWeight="regular" mb="12px">
              This profile represents the Toyota GR racing persona inside Trackota. It focuses on identity and team context rather than race engineering tools.
            </VuiTypography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <VuiTypography color="text" variant="button">Name</VuiTypography>
                <VuiTypography color="white" variant="lg" fontWeight="bold">Akio Toyoda</VuiTypography>
              </Grid>
              <Grid item xs={12} md={3}>
                <VuiTypography color="text" variant="button">Affiliation</VuiTypography>
                <VuiTypography color="white" variant="lg" fontWeight="bold">TOYOTA GAZOO Racing</VuiTypography>
              </Grid>
              <Grid item xs={12} md={3}>
                <VuiTypography color="text" variant="button">Car</VuiTypography>
                <VuiTypography color="white" variant="lg" fontWeight="bold">GR86</VuiTypography>
              </Grid>
              <Grid item xs={12} md={3}>
                <VuiTypography color="text" variant="button">Country</VuiTypography>
                <VuiTypography color="white" variant="lg" fontWeight="bold">Japan</VuiTypography>
              </Grid>
            </Grid>
          </VuiBox>
        </Card>
      </VuiBox>
      <VuiBox mb={3}>
        <Grid
          container
          spacing={3}
          sx={({ breakpoints }) => ({
            [breakpoints.only("xl")]: {
              gridTemplateColumns: "repeat(2, 1fr)",
            },
          })}
        >
          {/* Restore original left column welcome */}
          <Grid item xs={12} xl={4} xxl={3}>
            <Welcome />
          </Grid>
          {/* Middle – Car overview (original widget retained) */}
          <Grid item xs={12} xl={5} xxl={6}>
            <CarInformations />
          </Grid>
          {/* Right – Profile details card */}
          <Grid item xs={12} xl={3} xxl={3}>
            <ProfileInfoCard
              title="profile information"
              description="Akio Toyoda — Toyota Gazoo Racing leadership profile."
              info={{
                fullName: "Akio Toyoda",
                mobile: "(+81) 123 456 789",
                email: "akio@toyota.co.jp",
                location: "Japan",
              }}
              social={[]}
            />
          </Grid>
        </Grid>
      </VuiBox>
      {/* Keep PlatformSettings; remove analytics lists from Profile */}
      <Grid container spacing={3} mb="30px">
        <Grid item xs={12} xl={3} height="100%">
          <PlatformSettings />
        </Grid>
        <Grid item xs={12} xl={9}></Grid>
      </Grid>
      {/* Telemetry/Laps/Sections analytics removed from Profile (now on Dashboard/Strategy) */}

      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
