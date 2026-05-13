import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import HeaderBack from "../../components/common/HeaderBack";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { orpc } from "../../services/api/apiClient";
import { useBackHandler } from "../../hooks/useBackHandler";

interface Notificacion {
  id_notificacion: number;
  titulo: string;
  cuerpo_mensaje: string;
  tipo_notif: string;
  leido: boolean;
  fecha_creacion: string;
}

const NotificacionesScreen = ({ navigation }: any) => {

  useBackHandler(navigation, "normal");
  const queryClient = useQueryClient();

  const obtenerNotificaciones = async () => {
  const data = await orpc.notificaciones.obtenerTodas();

  if (data.success) {
    return data.notificaciones || [];
  }

  return [];
};

const {
  data: notificaciones = [],
  isLoading: cargando,
  refetch,
  isRefetching: refrescando,
} = useQuery({
  queryKey: ["notificaciones"],
  queryFn: obtenerNotificaciones,
});

 const marcarLeidaMutation = useMutation({
  mutationFn: async (id: number) => {
    return await orpc.notificaciones.marcarLeida({ id });
  },

  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["notificaciones"],
    });
  },
});

const marcarComoLeida = (id: number) => {
  marcarLeidaMutation.mutate(id);
};

  const marcarTodasMutation = useMutation({
  mutationFn: async () => {
    return await orpc.notificaciones.marcarTodasLeidas();
  },

  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["notificaciones"],
    });
  },
});

const marcarTodasLeidas = () => {
  marcarTodasMutation.mutate();
};

  const eliminarNotificacion = async (id: number) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que deseas eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
             await orpc.notificaciones.eliminar({ id });

queryClient.invalidateQueries({
  queryKey: ["notificaciones"],
});
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la notificación");
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return "Ayer";
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  const onRefresh = () => {
  refetch();
};

 

  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leido).length;

  return (
    <ScreenWrapper hasFooter={false}>
      <HeaderBack navigation={navigation} title="Notificaciones" />

      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
        <Text className="text-sm text-gray-500">
          {notificacionesNoLeidas} no leída
          {notificacionesNoLeidas !== 1 ? "s" : ""}
        </Text>
        {notificacionesNoLeidas > 0 && (
          <TouchableOpacity onPress={marcarTodasLeidas}>
            <Text className="text-blue-600 text-sm font-semibold">
              Marcar todas como leídas
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} />
        }
      >
        {cargando ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#1e3a8a" />
            <Text className="text-gray-500 mt-4">
              Cargando notificaciones...
            </Text>
          </View>
        ) : notificaciones.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-5xl mb-4">🔔</Text>
            <Text className="text-gray-500 text-center">
              No tienes notificaciones
            </Text>
          </View>
        ) : (
          notificaciones.map((notif) => (
            <TouchableOpacity
              key={notif.id_notificacion}
              className={`p-4 border-b border-gray-100 ${!notif.leido ? "bg-blue-50" : ""}`}
              onPress={() =>
                !notif.leido && marcarComoLeida(notif.id_notificacion)
              }
              activeOpacity={0.7}
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Text className="text-xl">
                    {notif.tipo_notif === "viaje"
                      ? "🚗"
                      : notif.tipo_notif === "solicitud"
                        ? "📝"
                        : notif.tipo_notif === "pago"
                          ? "💰"
                          : notif.tipo_notif === "finalizacion"
                            ? "✅"
                            : "🔔"}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">
                    {notif.titulo}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {notif.cuerpo_mensaje}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-2">
                    {formatearFecha(notif.fecha_creacion)}
                  </Text>
                </View>

                {!notif.leido && (
                  <View className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                )}
              </View>

              {notif.tipo_notif === "finalizacion" && (
                <TouchableOpacity
                  className="mt-4 bg-blue-600 rounded-full px-4 py-2 self-start"
                  onPress={async () => {
                    if (!notif.leido) marcarComoLeida(notif.id_notificacion);
                    navigation.navigate("RateTrip");
                  }}
                >
                  <Text className="text-white text-sm font-semibold">
                    Calificar viaje
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => eliminarNotificacion(notif.id_notificacion)}
              >
                <Text className="text-gray-400">✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default NotificacionesScreen;
