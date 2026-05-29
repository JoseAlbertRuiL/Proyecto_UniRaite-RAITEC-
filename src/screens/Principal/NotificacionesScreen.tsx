import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import HeaderBack from "../../components/common/HeaderBack";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useNotificaciones } from "../../hooks/queries/useNotificaciones";
import {
  useMarcarNotificacionLeidaMutation,
  useMarcarTodasLeidasMutation,
  useEliminarNotificacionMutation,
} from "../../hooks/mutations/useTripMutations";
import { useSocketInvalidator } from "../../hooks/useSocketInvalidator";
import { useBackHandler } from "../../hooks/useBackHandler";

interface Notificacion {
  id_notificacion: number;
  titulo: string;
  cuerpo_mensaje: string;
  tipo_notif: string;
  leido: boolean;
  fecha_creacion: string;
  yaCalificado?: boolean;
}

const NotificacionesScreen = ({ navigation }: any) => {
  useBackHandler(navigation, "normal");
  useSocketInvalidator();

  const { data, isLoading, refetch, isRefetching } = useNotificaciones();
  const marcarLeidaMutation = useMarcarNotificacionLeidaMutation();
  const marcarTodasMutation = useMarcarTodasLeidasMutation();
  const eliminarMutation = useEliminarNotificacionMutation();

  const notificaciones: Notificacion[] = data?.notificaciones ?? [];
  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leido).length;

  const marcarComoLeida = (id: number) => {
    marcarLeidaMutation.mutate({ id });
  };

  const marcarTodasLeidas = () => {
    marcarTodasMutation.mutate();
  };

  const eliminarNotificacion = (id: number) => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que deseas eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: () => eliminarMutation.mutate({ id }),
          style: "destructive",
        },
      ]
    );
  };

  const manejarClickCalificar = async (notif: Notificacion) => {
    if (!notif.leido) {
      marcarLeidaMutation.mutate({ id: notif.id_notificacion });
    }

    navigation.navigate("RateTrip", {
      notificacionId: notif.id_notificacion,
    });
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

  return (
    <ScreenWrapper hasFooter={false}>
      <HeaderBack navigation={navigation} title="Notificaciones" />

      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
        <Text className="text-sm text-gray-500">
          {notificacionesNoLeidas} no leída{notificacionesNoLeidas !== 1 ? "s" : ""}
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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#1e3a8a" />
            <Text className="text-gray-500 mt-4">Cargando notificaciones...</Text>
          </View>
        ) : notificaciones.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-5xl mb-4">🔔</Text>
            <Text className="text-gray-500 text-center">No tienes notificaciones</Text>
          </View>
        ) : (
          notificaciones.map((notif) => (
            <TouchableOpacity
              key={notif.id_notificacion}
              className={`p-4 border-b border-gray-100 ${!notif.leido ? "bg-blue-50" : ""}`}
              onPress={() => !notif.leido && marcarComoLeida(notif.id_notificacion)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Text className="text-xl">
                    {notif.tipo_notif === "viaje" ? "🚗"
                      : notif.tipo_notif === "solicitud" ? "📝"
                      : notif.tipo_notif === "pago" ? "💰"
                      : notif.tipo_notif === "finalizacion" ? "✅"
                      : "🔔"}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">{notif.titulo}</Text>
                  <Text className="text-sm text-gray-600 mt-1">{notif.cuerpo_mensaje}</Text>
                  <Text className="text-xs text-gray-400 mt-2">{formatearFecha(notif.fecha_creacion)}</Text>
                </View>

                {!notif.leido && <View className="w-2 h-2 rounded-full bg-blue-600 mt-2" />}
              </View>

              {notif.tipo_notif === "finalizacion" && (
                <>
                  {notif.yaCalificado ? (
                    <View className="mt-4 flex-row items-center">
                      <Text className="text-gray-400 text-sm italic">✓ Viaje calificado</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="mt-4 bg-blue-600 rounded-full px-4 py-2 self-start"
                      onPress={() => manejarClickCalificar(notif)}
                    >
                      <Text className="text-white text-sm font-semibold">
                        Calificar viaje
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
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
