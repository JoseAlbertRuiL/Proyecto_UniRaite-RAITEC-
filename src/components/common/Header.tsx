import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import UserIcon from '../../icons/userIcon';
import CarIcon from '../../icons/carIcon';

interface HeaderProps {
  navigation: any;
}

const Header: React.FC<HeaderProps> = ({ navigation }) => {
  return (
    <View className="flex-row justify-between items-center px-6 py-4 bg-blue-900">
      <View className="w-10 h-10 bg-white rounded-full justify-center items-center">
        <CarIcon />
      </View>
      <TouchableOpacity
        className="w-10 h-10 bg-white rounded-full justify-center items-center"
        onPress={() => navigation.navigate('Register')}
      >
        {/*Ícono de usuario*/}
        <UserIcon/>
      </TouchableOpacity>
    </View>
  );
};

export default Header;