import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import UserIcon from "../../icons/userIcon";
import NotificationIcon from "../../icons/notificationIcon";

interface HeaderProps {
  navigation: any;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ navigation, title }) => {
  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-blue-900">
      {/* Logo izquierda */}
      <TouchableOpacity
        className="w-10 h-10 rounded-full items-center justify-center"
        onPress={() => navigation.navigate("Start")}
      >
        <Image
          source={require("../../images/Logtype.png")}
          className="w-8 h-8"
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Título centrado */}
      <Text className="text-white text-lg font-bold">{title}</Text>

      {/* Contenedor derecho */}
      <View className="flex-row gap-3">
        {/* Botón notificaciones */}
        <TouchableOpacity
          className="w-10 h-10 bg-white rounded-full items-center justify-center"
          onPress={() => navigation.navigate("Notificaciones")}
        >
          <NotificationIcon />
        </TouchableOpacity>

        {/* Botón usuario/perfil */}
        <TouchableOpacity
          className="w-10 h-10 bg-white rounded-full items-center justify-center"
          onPress={() => navigation.navigate("ConfigP")}
        >
          <UserIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
