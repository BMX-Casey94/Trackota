import { useState } from "react";

// react-router-dom components
import { Link } from "react-router-dom";

// Dashboard React components
import VuiBox from "components/VuiBox";
import VuiTypography from "components/VuiTypography";
import VuiInput from "components/VuiInput";
import VuiButton from "components/VuiButton";
import VuiSwitch from "components/VuiSwitch";
import GradientBorder from "examples/GradientBorder";

// Dashboard assets
import radialGradient from "assets/theme/functions/radialGradient";
import rgba from "assets/theme/functions/rgba";
import palette from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";

// Authentication layout components
import CoverLayout from "layouts/authentication/components/CoverLayout";

// Images
import bgSignIn from "assets/images/signInImage.png";

function SignIn() {
  const [rememberMe, setRememberMe] = useState(true);

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  return (
    <CoverLayout
      title="Lovely to see you!"
      color="white"
      description="Enter your details to sign in."
      premotto="INSPIRED BY THE FUTURE:"
      motto="THE TRACKOTA DASHBOARD"
      image={bgSignIn}
      cardContent
      action={{
        type: "internal",
        route: "/dashboard",
        label: "DASHBOARD",
      }}
    >
      <GradientBorder borderRadius={borders.borderRadius.form} minWidth="100%" maxWidth="100%">
        <VuiBox
          component="form"
          role="form"
          borderRadius="inherit"
          p="45px"
          sx={({ palette: { secondary } }) => ({
            backgroundColor: secondary.focus,
          })}
        >
        <VuiBox mb={2}>
          <VuiBox mb={1} ml={0.5}>
            <VuiTypography component="label" variant="button" color="white" fontWeight="medium">
              Email
            </VuiTypography>
          </VuiBox>
          <GradientBorder
            minWidth="100%"
            padding="1px"
            borderRadius={borders.borderRadius.lg}
            backgroundImage={radialGradient(
              palette.gradients.borderLight.main,
              palette.gradients.borderLight.state,
              palette.gradients.borderLight.angle
            )}
          >
            <VuiInput 
              type="email" 
              placeholder="Your email..." 
              fontWeight="500"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              sx={{
                '&:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                  WebkitTextFillColor: 'white !important',
                  backgroundColor: 'transparent !important',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '&:-webkit-autofill:hover': {
                  WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                  backgroundColor: 'transparent !important',
                },
                '&:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                  backgroundColor: 'transparent !important',
                },
                '&:-webkit-autofill:active': {
                  WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                  backgroundColor: 'transparent !important',
                },
              }}
            />
          </GradientBorder>
        </VuiBox>
        <VuiBox mb={2}>
          <VuiBox mb={1} ml={0.5}>
            <VuiTypography component="label" variant="button" color="white" fontWeight="medium">
              Password
            </VuiTypography>
          </VuiBox>
          <GradientBorder
            minWidth="100%"
            borderRadius={borders.borderRadius.lg}
            padding="1px"
            backgroundImage={radialGradient(
              palette.gradients.borderLight.main,
              palette.gradients.borderLight.state,
              palette.gradients.borderLight.angle
            )}
          >
            <VuiInput
              type="password"
              placeholder="Your password..."
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              sx={({ typography: { size } }) => ({
                fontSize: size.sm,
                '&:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                  WebkitTextFillColor: 'white !important',
                  backgroundColor: 'transparent !important',
                  transition: 'background-color 5000s ease-in-out 0s',
                },
                '&:-webkit-autofill:hover': {
                  WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                  backgroundColor: 'transparent !important',
                },
                '&:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                  backgroundColor: 'transparent !important',
                },
                '&:-webkit-autofill:active': {
                  WebkitBoxShadow: '0 0 0 1000px transparent inset !important',
                  backgroundColor: 'transparent !important',
                },
              })}
            />
          </GradientBorder>
        </VuiBox>
        <VuiBox display="flex" alignItems="center">
          <VuiSwitch color="info" checked={rememberMe} onChange={handleSetRememberMe} />
          <VuiTypography
            variant="caption"
            color="white"
            fontWeight="medium"
            onClick={handleSetRememberMe}
            sx={{ cursor: "pointer", userSelect: "none" }}
          >
            &nbsp;&nbsp;&nbsp;&nbsp;Remember me
          </VuiTypography>
        </VuiBox>
        <VuiBox mt={4} mb={1}>
          <VuiButton color="info" fullWidth>
            SIGN IN
          </VuiButton>
        </VuiBox>
        <VuiBox mt={3} textAlign="center">
          <VuiTypography variant="button" color="text" fontWeight="regular">
            Don&apos;t have an account?{" "}
            <VuiTypography
              component={Link}
              to="/authentication/sign-up"
              variant="button"
              color="white"
              fontWeight="medium"
            >
              Sign up
            </VuiTypography>
          </VuiTypography>
        </VuiBox>
        </VuiBox>
      </GradientBorder>
    </CoverLayout>
  );
}

export default SignIn;
