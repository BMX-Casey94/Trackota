
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
import { StrategyApi } from "services/api";

function Overview() {
  const api = StrategyApi;
  const [summary, setSummary] = useState(null);
  const [tyreDeg, setTyreDeg] = useState(null);
  const [sections, setSections] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

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

  const profileMeta = [
    { label: "Name", value: "Akio Toyoda" },
    { label: "Affiliation", value: "TOYOTA GAZOO Racing" },
    { label: "Car", value: "GR010 HYBRID" },
    { label: "Country", value: "Japan" },
  ];

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
      <Header tabValue={activeTab} onTabChange={setActiveTab} />
      <VuiBox position="relative">
        <VuiBox mt={5} mb={3}>
          <Card>
            <VuiBox p={3}>
              <VuiTypography color="white" variant="lg" fontWeight="bold" mb="8px" component="div" textAlign="center">
                Toyota Gazoo Racing Platform
              </VuiTypography>
              <VuiBox mb="40px" textAlign="center">
                <VuiTypography color="text" variant="button" fontWeight="regular" component="div">
                  This profile represents the Toyota GR racing persona inside Trackota.
                </VuiTypography>
                <VuiTypography color="text" variant="button" fontWeight="regular" component="div">
                  It focuses on identity and team context rather than race engineering tools. This page uses mock data.
                </VuiTypography>
              </VuiBox>
              <Grid container spacing={3}>
                {profileMeta.map((item, idx) => (
                  <Grid
                    item
                    xs={12}
                    md={3}
                    key={item.label}
                    sx={({ breakpoints }) => ({
                      textAlign: "center",
                      [breakpoints.up("md")]: {
                        borderLeft: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                        paddingLeft: idx === 0 ? 0 : "16px",
                      },
                      [breakpoints.down("md")]: {
                        borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                        paddingTop: idx === 0 ? 0 : "12px",
                      },
                    })}
                  >
                    <VuiTypography color="text" variant="button" fontWeight="medium" textTransform="uppercase" mb="4px" component="div">
                      {item.label}
                    </VuiTypography>
                    <VuiTypography color="white" variant="lg" fontWeight="bold" component="div">
                      {item.value}
                    </VuiTypography>
                  </Grid>
                ))}
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

        {activeTab !== 0 && (
          <VuiBox
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
              background: "rgba(0,0,0,0.55)",
              p: 3,
              pt: "300px",
            }}
          >
            <Card
              sx={{
                p: 3,
                textAlign: "center",
                maxWidth: 720,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
              }}
            >
              <VuiTypography variant="lg" color="white" fontWeight="bold" mb="8px">
                Coming soon
              </VuiTypography>
              <VuiTypography variant="button" color="text" fontWeight="regular">
                Unfortunately, I ran out of time before I could get this page constructed.
              </VuiTypography>
            </Card>
          </VuiBox>
        )}
      </VuiBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
