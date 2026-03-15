import React from 'react';
import Svg, { Path } from 'react-native-svg';

const UserIcon = () => (
  <Svg viewBox="0 0 24 24" width={20} height={20} stroke="#1e3a8a" fill="none">
    <Path
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
    />
  </Svg>
);
export default UserIcon;