import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const NotificationIcon = () => {
  return (
    <View>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
          fill="black"
        />
      </Svg>
    </View>
  );
};

export default NotificationIcon;