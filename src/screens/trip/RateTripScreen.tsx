import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useBackHandler } from "../../hooks/useBackHandler";
import { orpc } from "../../services/api/apiClient";
import { getViajePorId } from "../../services/trip/tripService";

export default function RateTripScreen({ navigation, route }: any) {
  useBackHandler(navigation, "normal");
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");

  const hasData = !!route?.params?.driver || !!route?.params?.viaje;

  const { data: viajeData, isLoading: loading, error: fetchError } = useQuery({
    queryKey: ["rate-trip", route?.params?.viajeId],
    queryFn: async () => {
      const viajeId = route?.params?.viajeId;
      if (viajeId) {
        const response = await getViajePorId(viajeId);
        if (response.success && response.viaje) return response.viaje;
      }
      const solicitudesResponse = await orpc.solicitudes.misSolicitudes();
      if (solicitudesResponse.success && Array.isArray(solicitudesResponse.solicitudes)) {
        const accepted = solicitudesResponse.solicitudes
          .filter((s: any) => s.estado_solicitud === "aceptada" && s.viaje?.conductor?.usuario)
          .sort((a: any, b: any) => new Date(b.viaje?.fecha_hora_salida).getTime() - new Date(a.viaje?.fecha_hora_salida).getTime());
        if (accepted.length > 0) return accepted[0].viaje;
      }
      throw new Error("No se encontraron datos de conductor o viaje.");
    },
    enabled: !hasData,
  });

  const error = fetchError ? (fetchError as Error).message : null;
  const trip = hasData ? route?.params?.viaje : viajeData;
  const driver = hasData ? route?.params?.driver : (trip?.conductor?.usuario || trip?.conductor);

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

  const submitMutation = useMutation({
    mutationFn: (params: { viajeId: number; estrellas: number; comentario?: string }) =>
      orpc.calificaciones.guardar(params),
    onSuccess: (_data, variables) => {
      Alert.alert(
        "¡Gracias!",
        `Tu calificación de ${variables.estrellas} ⭐ ha sido guardada exitosamente.`,
        [{ text: "OK", onPress: () => navigation.replace("Home") }]
      );
    },
    onError: (err: any) => {
      const errorMsg = err?.message || "Error al guardar la calificación";
      Alert.alert("Error", errorMsg);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Atención", "Por favor selecciona una calificación antes de enviar.");
      return;
    }
    if (!trip?.id_viaje_pub) {
      Alert.alert("Error", "No se encontró el ID del viaje.");
      return;
    }
    submitMutation.mutate({
      viajeId: trip.id_viaje_pub,
      estrellas: rating,
      comentario: comment || undefined,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Encabezado */}
        <View className="flex-row items-center justify-center p-4 relative">
          <TouchableOpacity
            className="absolute left-4 p-2"
            onPress={() => navigation?.replace("Home")}
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
        ) : error ? (
          <View className="mx-5 mt-12 bg-white rounded-[32px] p-6 shadow-sm items-center justify-center h-64">
            <Text className="text-center text-slate-700 font-semibold mb-3">{error}</Text>
            <Text className="text-center text-slate-500">
              Si este problema persiste, revisa el viaje activo o intenta de nuevo desde tus solicitudes.
            </Text>
          </View>
        ) : (
          <>
            <View className="mx-5 mt-12 bg-white rounded-[32px] p-6 shadow-sm items-center relative">
              {/* Avatar del Conductor */}
              <View className="absolute -top-10 w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-slate-200">
                <Image
                  source={{ uri: driverAvatar }}
                  className="w-full h-full"
                />
              </View>

              {/* Información del Conductor */}
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

              {/* Estrellas de Calificación */}
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

            {/* Comentario */}
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

            {/* Botón de Enviar */}
            <View className="mt-8 px-5">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
                className={`w-full py-4 rounded-2xl items-center ${
                  submitMutation.isPending ? "bg-slate-400" : "bg-[#047857]"
                }`}
              >
                {submitMutation.isPending ? (
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
    </SafeAreaView>
  );
}
