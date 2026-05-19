import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import UserIcon from "../../icons/userIcon";
import NotificationIcon from "../../icons/notificationIcon";
import { orpc } from "../../services/api/apiClient";
import { getSocket } from "../../services/socket";
import { useEffect } from "react";

interface HeaderProps {
  navigation: any;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ navigation, title }) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({
    queryKey: ["notificaciones-header"],
    queryFn: async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return { notificaciones: [] };
      const data = await orpc.notificaciones.obtenerTodas();
      return data;
    },
  });

  const notificacionesNoLeidas = notifData?.notificaciones?.filter((n: any) => !n.leido).length ?? 0;

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const onNuevaNotificacion = () => {
        queryClient.invalidateQueries({ queryKey: ["notificaciones-header"] });
      };

      socket.on("nueva_notificacion", onNuevaNotificacion);

      return () => {
        socket.off("nueva_notificacion", onNuevaNotificacion);
      };
    }
  }, [queryClient]);

  return (
    <View
      className="flex-row justify-between items-center px-4 bg-blue-900"
      style={{ paddingTop: insets.top + 12, paddingBottom: 12 }} 
    >
      {/* Logo izquierda */}
      <TouchableOpacity
        className="w-8 h-8 rounded-full items-center justify-center" 
        onPress={() => navigation.navigate("Start")}
      >
        <Image
          source={require("../../images/Logtype.png")}
          className="w-7 h-7"
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Título centrado */}
      <Text className="text-white text-sm font-bold">{title}</Text>

      {/* Contenedor derecho */}
      <View className="flex-row gap-2">
        
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