import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import BackIcon from '../../icons/backicon';
import CarIcon from '../../icons/carIcon';

interface HeaderProps {
  navigation: any;
}

const Header: React.FC<HeaderProps> = ({ navigation }) => {
  return (
    <View className="flex-row justify-between items-center px-6 py-4 bg-blue-900">
      <TouchableOpacity
        className="w-10 h-10 bg-white rounded-full justify-center items-center"
        //onPress={() => navigation.goBack()}
      >
        <BackIcon/>
      </TouchableOpacity>
      <TouchableOpacity
        className="w-10 h-10 bg-white rounded-full justify-center items-center"
        onPress={() => navigation.navigate('Home')}
      >
        <CarIcon/>
      </TouchableOpacity>
    </View>

  );
};

export default Header;