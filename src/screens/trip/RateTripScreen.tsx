import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useBackHandler } from "../../hooks/useBackHandler";
import { useViajePorId } from "../../hooks/queries/useViajes";
import { useCalificacionPendiente } from "../../hooks/queries/useChat";
import { useCalificarViajeMutation } from "../../hooks/mutations/useTripMutations";

export default function RateTripScreen({ navigation, route }: any) {
  useBackHandler(navigation, "normal");
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");

  const queryClient = useQueryClient();

  const viajeId = route?.params?.viajeId;
  const { data: viajeData, isLoading: loadingViaje } = useViajePorId(viajeId);
  const { data: pendienteData, isLoading: loadingPendiente } = useCalificacionPendiente();

  const calificarMutation = useCalificarViajeMutation();

  const trip = route?.params?.viaje || viajeData?.viaje || pendienteData?.viaje;
  const driver = route?.params?.driver || trip?.conductor?.usuario || trip?.conductor || pendienteData?.viaje?.conductor?.usuario;
  const loading = loadingViaje || loadingPendiente;

  const driverUser = driver?.usuario || driver;
  const driverName =
    driverUser?.nombre || driverUser?.name || route?.params?.driverName || "Tu conductor";
  const driverAvatar =
    driverUser?.foto_perfil
      ? driverUser.foto_perfil
      : driverUser?.avatar || route?.params?.driverAvatar ||
        "https://api.dicebear.com/7.x/avataaars/png?seed=Usuario";
  const driverInfo =
    trip?.conductor?.modelo && trip?.conductor?.color
      ? `${trip.conductor.modelo} • ${trip.conductor.color}`
      : driverUser?.vehiculo || route?.params?.driverVehicle || "Vehículo disponible";
  const driverRatingText =
    driverUser?.reputacion_promedio || route?.params?.driverRating
      ? `⭐ ${driverUser?.reputacion_promedio ?? route?.params?.driverRating}`
      : "⭐ 4.9";

  const handleSubmit = async () => {
    if (calificarMutation.isPending) return;

    if (rating === 0) {
      Alert.alert("Atención", "Por favor selecciona una calificación antes de enviar.");
      return;
    }

    if (!trip?.id_viaje_pub) {
      Alert.alert("Error", "No se encontró el ID del viaje a calificar.");
      return;
    }

    calificarMutation.mutate(
      {
        viajeId: trip.id_viaje_pub,
        estrellas: rating,
        comentario: comment || undefined,
      },
      {
        onSuccess: (response: any) => {
          if (response.success) {
            queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
            queryClient.invalidateQueries({ queryKey: ["calificacionPendiente"] });

            Alert.alert(
              "¡Gracias!",
              `Tu calificación de ${rating} ⭐ ha sido guardada exitosamente.`,
              [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }
        },
        onError: (err: any) => {
          console.error("Error guardando calificación:", err);
          Alert.alert("Error", err?.message || "Error al guardar la calificación");
        },
      }
    );
  };

  return (
    <ScreenWrapper hasHeader={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-center p-4 relative">
          <TouchableOpacity
            className="absolute left-4 p-2"
            onPress={() => navigation?.goBack()}
          >
            <Text className="text-slate-600 text-lg font-bold">✕</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#0f172a]">
            Califica tu viaje
          </Text>
        </View>

        {loading ? (
          <View className="mx-5 mt-12 bg-white rounded-[32px] p-6 shadow-sm items-center justify-center h-64">
            <ActivityIndicator size="large" color="#047857" />
            <Text className="text-center text-slate-500 mt-4">Cargando datos del conductor...</Text>
          </View>
        ) : !trip ? (
          <View className="mx-5 mt-12 bg-white rounded-[32px] p-6 shadow-sm items-center justify-center h-64">
            <Text className="text-center text-slate-700 font-semibold mb-3">
              No tienes viajes pendientes por calificar.
            </Text>
          </View>
        ) : (
          <>
            <View className="mx-5 mt-12 bg-white rounded-[32px] p-6 shadow-sm items-center relative">
              <View className="absolute -top-10 w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-slate-200">
                <Image
                  source={{ uri: driverAvatar }}
                  className="w-full h-full"
                />
              </View>

              <Text className="mt-10 text-xs text-slate-500 font-medium tracking-wide uppercase mb-1">
                Tu Conductor
              </Text>
              <Text className="text-2xl font-bold text-[#1e293b] mb-3">
                {driverName}
              </Text>

              <View className="flex-row items-center bg-[#f8f9fa] rounded-full px-4 py-2 border border-slate-100">
                <Text className="text-sm font-medium text-slate-700">
                  {driverRatingText} • {driverInfo}
                </Text>
              </View>

              <Text className="text-base font-semibold mt-8 mb-4">
                ¿Qué tal estuvo el viaje?
              </Text>
              <View className="flex-row gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Text
                      className={`text-4xl ${star <= rating ? "text-[#6ee7b7]" : "text-slate-200"}`}
                    >
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mx-5 mt-4 bg-white rounded-[32px] p-6 shadow-sm">
              <Text className="font-bold text-[#1e293b] mb-4">Comentarios</Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Escribe tu opinión sobre el conductor o el viaje"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={6}
                className="min-h-[140px] rounded-3xl bg-[#f8f9fa] p-4 text-slate-800"
              />
            </View>

            <View className="mt-8 px-5">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={calificarMutation.isPending}
                className={`w-full py-4 rounded-2xl items-center ${
                  calificarMutation.isPending ? "bg-slate-400" : "bg-[#047857]"
                }`}
              >
                {calificarMutation.isPending ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white text-lg font-bold">
                      Guardando...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white text-lg font-bold">
                    Enviar Calificación
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
