import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import UserIcon from "../../icons/userIcon";
import NotificationIcon from "../../icons/notificationIcon";
import { orpc } from "../../services/api/apiClient";
import { getSocket } from "../../services/socket";

interface HeaderProps {
  navigation: any;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ navigation, title }) => {
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  const cargarNotificacionesNoLeidas = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const data = await orpc.notificaciones.obtenerTodas();
      if (data.success && data.notificaciones) {
        const noLeidas = data.notificaciones.filter(
          (n: any) => !n.leido,
        ).length;
        setNotificacionesNoLeidas(noLeidas);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  };

  // WebSocket: escuchar nuevas notificaciones
  useEffect(() => {
    cargarNotificacionesNoLeidas();

    const socket = getSocket();
    if (socket) {
      const onNuevaNotificacion = (data: any) => {
        console.log("🔔 Nueva notificación recibida:", data);
        cargarNotificacionesNoLeidas();
      };

      socket.on("nueva_notificacion", onNuevaNotificacion);

      return () => {
        socket.off("nueva_notificacion", onNuevaNotificacion);
      };
    }
  }, []);

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
        {/* Botón notificaciones con contador */}
        <TouchableOpacity
          className="w-10 h-10 bg-white rounded-full items-center justify-center relative"
          onPress={() => navigation.navigate("Notificaciones")}
        >
          <NotificationIcon />
          {notificacionesNoLeidas > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
              <Text className="text-white text-xs font-bold">
                {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
              </Text>
            </View>
          )}
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
