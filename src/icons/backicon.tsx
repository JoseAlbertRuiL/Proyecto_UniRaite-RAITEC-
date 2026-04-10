import React from "react"
import Svg, { Path } from "react-native-svg";

const BackIcon = () => (
  <Svg viewBox="0 0 24 24" width={24} height={24} stroke="#1e3a8a" fill="none">
    <Path
      strokeWidth={2} // Un poco más grueso para que se vea mejor como botón de acción
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 18l-6-6 6-6" 
    />
  </Svg>
);

export default BackIcon;