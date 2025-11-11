/*!
=========================================================
* Trackota - Track Your Journey
=========================================================
* Custom Trackota Logo Component
=========================================================
*/

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

function TrackotaLogo({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background rounded square */}
      <rect
        x="1"
        y="1"
        width="20"
        height="20"
        rx="4"
        ry="4"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      />
      {/* Letter T */}
      <path
        d="M6 6h10v2H12v8h-2v-8H6V6z"
        fill="white"
      />
    </svg>
  );
}

// Setting default values for the props of TrackotaLogo
TrackotaLogo.defaultProps = {
  color: "dark",
  size: "16px",
};

// Typechecking props for the TrackotaLogo
TrackotaLogo.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
    "light",
    "white",
  ]),
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default TrackotaLogo;
