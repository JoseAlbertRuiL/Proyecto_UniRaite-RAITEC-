import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import UserIcon from '../../icons/userIcon';
import CarIcon from '../../icons/carIcon';
import NotificationIcon from '../../icons/notificationIcon';

interface HeaderProps {
  navigation: any;
}

const Header: React.FC<HeaderProps> = ({ navigation }) => {
   return (
    <View className="flex-row justify-between items-center px-6 py-4 bg-blue-900">
      
      {/* Ícono carro */}
      <View className="w-10 h-10 bg-white rounded-full justify-center items-center">
        <CarIcon />
      </View>

      {/* Contenedor derecho */}
      <View className="flex-row gap-3">
        
        {/* Botón notificaciones */}
        <TouchableOpacity
          className="w-10 h-10 bg-white rounded-full justify-center items-center"
          onPress={() => navigation.navigate('Notificaciones')}
        >
          <NotificationIcon />
        </TouchableOpacity>

        {/* Botón usuario */}
        <TouchableOpacity
          className="w-10 h-10 bg-white rounded-full justify-center items-center"
          onPress={() => navigation.navigate('ConfigP')}
        >
          <UserIcon />
        </TouchableOpacity>

      </View>
    </View>
  );
};

export default Header;