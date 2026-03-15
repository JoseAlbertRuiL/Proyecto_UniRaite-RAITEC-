import React from "react"
import Svg, { Path } from "react-native-svg";

const CarIcon = () => (
  <Svg viewBox="0 0 24 24" width={20} height={20} stroke="#1e3a8a" fill="none">
    <Path
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5M5 13h14M6 16a1 1 0 1 0 0 .01M18 16a1 1 0 1 0 0 .01"
    />
  </Svg>
);
export default CarIcon;