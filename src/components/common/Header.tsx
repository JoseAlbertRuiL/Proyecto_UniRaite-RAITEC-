import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    cargarNotificacionesNoLeidas();

    const socket = getSocket();
    if (socket) {
      const onNuevaNotificacion = (data: any) => {
        cargarNotificacionesNoLeidas();
      };

      socket.on("nueva_notificacion", onNuevaNotificacion);

      return () => {
        socket.off("nueva_notificacion", onNuevaNotificacion);
      };
    }
  }, []);

  return (
    <View
      className="flex-row justify-between items-center px-4 bg-blue-900"
      style={{ paddingTop: insets.top + 2, paddingBottom: 6 }} 
    >
      {/* Logo izquierda */}
      <TouchableOpacity
        className="w-8 h-8 rounded-full items-center justify-center" 
        onPress={() => navigation.navigate("Start")}
      >
        <Image
          source={require("../../images/Logtype.png")}
          className="w-7 h-7" // ✅ w-8→w-7
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Título centrado */}
      <Text className="text-white text-sm font-bold">{title}</Text>

      {/* Contenedor derecho */}
      <View className="flex-row gap-2"> {/* ✅ gap-3→gap-2 */}
        {/* Botón notificaciones con contador */}
        <TouchableOpacity
          className="w-8 h-8 bg-white rounded-full items-center justify-center relative" 
          onPress={() => navigation.navigate("Notificaciones")}
        >
          <NotificationIcon />
          {notificacionesNoLeidas > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[14px] h-[14px] items-center justify-center px-1">
              <Text className="text-white text-[10px] font-bold">
                {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Botón usuario/perfil */}
        <TouchableOpacity
          className="w-8 h-8 bg-white rounded-full items-center justify-center" 
          onPress={() => navigation.navigate("ConfigP")}
        >
          <UserIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;