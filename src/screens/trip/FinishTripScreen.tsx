import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useBackHandler } from "../../hooks/useBackHandler";
import { orpc } from "../../services/api/apiClient";

const MAX_PASAJEROS = 4;

const FinishTripScreen = ({ navigation, route }: any) => {
  const viajeParam = route?.params?.viaje;
  const viajeIdParam = route?.params?.viajeId;

  const [viaje, setViaje] = useState<any>(viajeParam || null);
  const [loading, setLoading] = useState(!viajeParam);
  const [finalizando, setFinalizando] = useState(false);

  useBackHandler(navigation, "main");

  const fetchViaje = async () => {
  try {
    setLoading(true);

    const viajeId = viajeIdParam || viajeParam?.id_viaje_pub;

    if (!viajeId) {
      console.log("No hay viajeId");
      return;
    }

    const response = await orpc.viajes.porId({ viajeId });

    if (response.success) {
      setViaje(response.viaje);
    } else {
      setViaje(null);
    }
  } catch (error) {
    console.error("Error al cargar viaje:", error);
    setViaje(null);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  console.log("PARAMS:", route?.params);

  if (!viajeParam && viajeIdParam) {
    fetchViaje();
  }
}, [viajeParam, viajeIdParam]);

  const handleFinalizarViaje = async () => {
    const viajeId = viajeIdParam || viaje?.id_viaje_pub;

    if (!viajeId) {
      console.log("No hay viajeId");
      setLoading(false); //  importante
      return;
    }

    try {
      setFinalizando(true);
      const response = await orpc.viajes.finalizarViaje({ viajeId });
      if (response.success) {
        Alert.alert("¡Listo!", "Viaje finalizado y guardado en historial");
        navigation.navigate("Home");
      } else {
        Alert.alert("Error", "Error al finalizar viaje");
      }
    } catch (error) {
      console.error("Error al finalizar viaje:", error);
      Alert.alert("Error", "Error al finalizar viaje");
    } finally {
      setFinalizando(false);
    }
  };

  // const [driverRating, setDriverRating] = useState<number>(0);
  // const [ratingSaved, setRatingSaved] = useState(false);

  const acceptedPassengers = Array.isArray(viaje?.solicitudes)
    ? viaje.solicitudes
    : [];
  const totalCobrado = viaje ? acceptedPassengers.length * (viaje.costo_estimado || 0) : 0;
  const fechaSalida = viaje ? new Date(viaje.fecha_hora_salida) : null;
  const pasajerosCount = acceptedPassengers.length;
  const asientosDisponibles = viaje?.asientos_disponibles ?? 0;
  const asientosTotales = Math.min(MAX_PASAJEROS, pasajerosCount + asientosDisponibles);

  // const handleSaveDriverRating = () => {
  //   if (driverRating === 0) {
  //     Alert.alert("Atención", "Selecciona una calificación antes de guardar.");
  //     return;
  //   }
  //   setRatingSaved(true);
  //   Alert.alert("¡Listo!", "Tu calificación de pasajeros ha sido registrada.");
  // };


  return (
    
    <ScreenWrapper hasFooter={false}>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-6 pt-12 pb-16 rounded-b-3xl shadow-lg">
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-black bg-opacity-20 rounded-full items-center justify-center mb-4">
              <View className="w-20 h-20 bg-green-400 rounded-full items-center justify-center">
                <Text className="text-4xl">✓</Text>
              </View>
            </View>
            <Text className="text-black text-4xl font-bold tracking-tight">¡Viaje</Text>
            <Text className="text-black text-4xl font-bold tracking-tight">Finalizado!</Text>
          </View>

          <View className="bg-white bg-opacity-10 rounded-2xl px-4 py-3 border border-white border-opacity-20">
            <Text className="text-black text-center text-sm font-medium">
              Gracias por usar UniRaite.
              {"\n"}
              Aquí está el resumen del viaje activo.
            </Text>
          </View>
        </View>

        <View className="px-6 py-8">
          {loading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#1e3a8a" />
              <Text className="mt-4 text-gray-500">Cargando datos del viaje...</Text>
            </View>
          ) : !viaje ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-center">
                No se encontró un viaje activo para mostrar.
              </Text>
            </View>
          ) : (
            <>
              <View className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden border border-gray-100">
                <View className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                  <Text className="text-blue-900 font-bold text-base">RESUMEN DEL VIAJE</Text>
                </View>
                <View className="p-6 space-y-4">
                  <View>
                    <Text className="text-xs uppercase text-gray-500">Origen</Text>
                    <Text className="text-gray-900 font-semibold text-lg">{viaje.origen_texto}</Text>
                  </View>
                  <View>
                    <Text className="text-xs uppercase text-gray-500">Destino</Text>
                    <Text className="text-gray-900 font-semibold text-lg">{viaje.destino_texto}</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-3">
                    <View className="bg-blue-50 rounded-2xl px-4 py-3">
                      <Text className="text-xs text-gray-500">Fecha</Text>
                      <Text className="text-gray-900 font-semibold">
                        {fechaSalida?.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                    <View className="bg-blue-50 rounded-2xl px-4 py-3">
                      <Text className="text-xs text-gray-500">Hora</Text>
                      <Text className="text-gray-900 font-semibold">
                        {fechaSalida?.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row flex-wrap gap-3">
                    <View className="bg-slate-50 rounded-2xl px-4 py-3">
                      <Text className="text-xs text-gray-500">Pasajeros confirmados</Text>
                      <Text className="text-gray-900 font-semibold">{pasajerosCount}</Text>
                    </View>
                    <View className="bg-slate-50 rounded-2xl px-4 py-3">
                      <Text className="text-xs text-gray-500">Asientos disponibles</Text>
                      <Text className="text-gray-900 font-semibold">{asientosDisponibles}</Text>
                    </View>
                    <View className="bg-slate-50 rounded-2xl px-4 py-3">
                      <Text className="text-xs text-gray-500">Máx. pasajeros</Text>
                      <Text className="text-gray-900 font-semibold">{MAX_PASAJEROS}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden border border-gray-100">
                <View className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
                  <Text className="text-green-900 font-bold text-base">💰 DESGLOSE FINANCIERO</Text>
                </View>
                <View className="p-6">
                  <View className="mb-4">
                    <View className="flex-row bg-gray-50 rounded-lg px-4 py-3 mb-2 border border-gray-200">
                      <Text className="flex-1 text-gray-700 font-semibold text-xs">PASAJERO</Text>
                      <Text className="w-20 text-gray-700 font-semibold text-xs text-right">TARIFA</Text>
                    </View>

                    {acceptedPassengers.length > 0 ? (
                      acceptedPassengers.map((solicitud: any, index: number) => (
                        <View key={solicitud.id_pasajero || index} className="flex-row px-4 py-3 border-b border-gray-100">
                          <View className="flex-1">
                            <Text className="text-gray-900 font-medium text-sm">
                              {solicitud.pasajero?.nombre ? `${solicitud.pasajero.nombre} ${solicitud.pasajero.apellido_paterno || ''}`.trim() : `Pasajero ${index + 1}`}
                            </Text>
                          </View>
                          <Text className="w-20 text-gray-900 font-semibold text-sm text-right">
                            ${viaje.costo_estimado?.toFixed(2) ?? "0.00"}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View className="px-4 py-4 border border-gray-100 rounded-2xl bg-gray-50">
                        <Text className="text-gray-600 text-sm text-center">
                          No hay pasajeros confirmados aún.
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="h-px bg-gray-200 my-4" />

                  <View className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl px-4 py-4 border border-green-200 flex-row justify-between items-center">
                    <View>
                      <Text className="text-green-900 font-bold text-base">TOTAL COBRADO</Text>
                      <Text className="text-sm text-gray-500">{pasajerosCount} x ${viaje.costo_estimado?.toFixed(2) ?? "0.00"}</Text>
                    </View>
                    <Text className="text-green-600 font-bold text-2xl">${totalCobrado.toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              {/**
              <View className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden border border-gray-100">
                <View className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-6 py-4 border-b border-gray-200">
                  <Text className="text-yellow-900 font-bold text-base">⭐ CALIFICACIÓN</Text>
                </View>
                <View className="p-6">
                  <Text className="text-gray-600 text-sm mb-4 text-center">
                    Califica la experiencia con tus pasajeros antes de finalizar.
                  </Text>
                  <View className="flex-row justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center border border-gray-200"
                        onPress={() => {
                          setDriverRating(star);
                          setRatingSaved(false);
                        }}
                      >
                        <Text className={`text-lg ${star <= driverRating ? "text-yellow-500" : "text-gray-400"}`}>
                          ★
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={handleSaveDriverRating}
                    className={`w-full rounded-2xl py-3 ${ratingSaved ? "bg-green-500" : "bg-blue-600"}`}
                  >
                    <Text className="text-white font-semibold text-center">
                      {ratingSaved ? "Calificación guardada" : "Guardar calificación"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              */}

              <View className="mb-6">
                <TouchableOpacity
                  onPress={handleFinalizarViaje}
                  disabled={finalizando}
                  className="bg-blue-500 rounded-2xl px-6 py-4 shadow-lg mb-3"
                >
                  <Text className="text-white font-bold text-center text-lg">
                    {finalizando ? "Finalizando..." : "Finalizar Viaje"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-200 mb-8">
                <Text className="text-blue-900 text-xs text-center font-medium">
                  ✓ Tu viaje ha sido registrado en el historial y los pasajeros han sido notificados.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default FinishTripScreen;
