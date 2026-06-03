import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Snackbar from "../../components/common/Snackbar";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from 'expo-location';
import { orpc } from "../../services/api/apiClient";
import { getSocket } from "../../services/socket";
import { useBackHandler } from "../../hooks/useBackHandler";
import EmergencyButton from "../../components/EmergencyButton";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import LiveMapModal from "../../components/LiveMapModal";

type TabType = "activos" | "solicitudes";

const ConducirScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("activos");
  const [viajeActivoId, setViajeActivoId] = useState<number | null>(null);
  const [transmitiendo, setTransmitiendo] = useState<number | null>(null);
  const [liveMapViajeId, setLiveMapViajeId] = useState<number | null>(null);
  const [liveMapVisible, setLiveMapVisible] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [cancelandoViajeId, setCancelandoViajeId] = useState<number | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const destinoAlertado = useRef<boolean>(false);
  // const locationInterval = useRef<any>(null);
  const [snackbar, setSnackbar] = useState<{
  visible: boolean;
  message: string;
  type: "success" | "error" | "info";
}>({
  visible: false,
  message: "",
  type: "info",
});

const mostrarSnackbar = (
  message: string,
  type: "success" | "error" | "info" = "info"
) => {
  setSnackbar({ visible: true, message, type });

  setTimeout(() => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  }, 3000);
};

  const {
    data: viajesActivos = [],
    isLoading: cargandoViajes,
    isRefetching: refrescandoViajes,
    isError: errorViajes,
    refetch: refetchViajes,
  } = useQuery({
    queryKey: ["viajes", "activos", "conductor"],
    queryFn: async () => {
      const data = await orpc.viajes.activos();
      return data.success ? (data.viajes || []) : [];
    },
    refetchInterval: 10000,
  });

  const {
    data: solicitudes = [],
    isLoading: cargandoSolicitudes,
    isError: errorSolicitudes,
    isRefetching: refrescandoSolicitudes,
    refetch: refetchSolicitudes,
  } = useQuery({
    queryKey: ["solicitudes", "recibidas", "conductor"],
    queryFn: async () => {
      const data = await orpc.solicitudes.recibidas();
      return data.success ? (data.solicitudes || []) : [];
    },
    refetchInterval: 10000,
  });

  const cargando = cargandoViajes || cargandoSolicitudes;
  const refrescando = refrescandoViajes || refrescandoSolicitudes;
  const hayError = errorViajes || errorSolicitudes;

  useBackHandler(navigation, "normal");

  const cargarDatos = async () => {
    await Promise.all([refetchViajes(), refetchSolicitudes()]);
  };

  // Revisa si el id_viaje_pub actual existe dentro del arreglo de viajesActivos
  const esViajeActivo = (idViajePub: number) => {
    if (!Array.isArray(viajesActivos) || viajesActivos.length === 0) return false;
    
    const viajeActual = viajesActivos.find((v) => v.id_viaje_pub === idViajePub);
    return viajeActual?.viajes_activos && viajeActual.viajes_activos.length > 0;
  };

  const handleIniciarViaje = async (viajeId: number) => {
    const viaje = viajesActivos.find((v) => v.id_viaje_pub === viajeId);

    const pasajerosAceptados = (viaje?.solicitudes ?? []).length;
    if (pasajerosAceptados === 0) {
      Alert.alert(
        "Sin pasajeros",
        "No puedes iniciar el viaje sin pasajeros aceptados. Acepta al menos una solicitud en la pestaña \"Solicitudes\"."
      );
      return;
    }

    console.log(`Intentando iniciar el viaje con ID: ${viajeId}`);
    try {
      const result = await orpc.viajes.iniciarViaje({ viajeId });
      if (result.success) {
        const viajeCompleto = viajesActivos.find((v) => v.id_viaje_pub === viajeId);
        const viajeActivoId = result.viajeActivo?.id_viaje_activo;
        if (!viajeActivoId) {
          Alert.alert("Error", "No se pudo obtener el ID del viaje activo");
          return;
        }

        await iniciarTransmisionUbicacion(
          viajeId,
          viajeActivoId,
          viajeCompleto
        );
        Alert.alert("¡Viaje iniciado!", "Compartiendo tu ubicación con los pasajeros.");
        await cargarDatos();
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo iniciar el viaje");
    }
  };

  const iniciarTransmisionUbicacion = async (viajeId: number, viajeActivoId: number, viaje?: any) => {
    const socket = getSocket();
    if (!socket) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitas dar permiso de ubicación para transmitir.");
      return;
    }
    
    socket.emit('join_viaje', viajeId);
    setTransmitiendo(viajeId);
    destinoAlertado.current = false;

    locationSub.current?.remove();
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 8 },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        const currentSocket = getSocket();

        if (currentSocket?.connected) {
          currentSocket.emit('driver_location', {
            viajeActivoId,
            viajeId,
            lat: latitude,
            lng: longitude,
          });
          console.log(`📡 Ubicación emitida: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }

        if (
          !destinoAlertado.current &&
          viaje?.latitud_destino != null &&
          viaje?.longitud_destino != null
        ) {
          const distancia = calcularDistanciaMetros(
            latitude, longitude,
            viaje.latitud_destino, viaje.longitud_destino
          );

          console.log(`📏 Distancia al destino: ${Math.round(distancia)}m`);

          if (distancia <= 150) {
            destinoAlertado.current = true;

            locationSub.current?.remove();
            locationSub.current = null;
            getSocket()?.emit('leave_viaje', viajeId);
            setTransmitiendo(null);

            navigation.navigate("FinishTrip", {
              viajeId: viaje.id_viaje_pub,
              viaje,
            });
          }
        }
      }
    );
  };

  const detenerTransmision = (viajeId: number) => {
    locationSub.current?.remove();
    locationSub.current = null;

    const socket = getSocket();
    socket?.emit('leave_viaje', viajeId);
    setTransmitiendo(null);
  };

  const abrirModalCancelacion = (viajeId: number) => {
    setCancelandoViajeId(viajeId);
    setMotivoCancelacion("");
    setShowCancelModal(true);
  };

  const ejecutarCancelacion = async () => {
    if (!cancelandoViajeId || !motivoCancelacion.trim()) return;

    try {
      const result = await orpc.viajes.cancelar({
        viajeId: cancelandoViajeId,
        motivo: motivoCancelacion.trim(),
      });
      if (result.success) {
        setShowCancelModal(false);
        setCancelandoViajeId(null);
        setMotivoCancelacion("");
        Alert.alert("Viaje cancelado", "Se ha registrado el motivo en la auditoría.");
        cargarDatos();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cancelar el viaje");
    }
  };

  const calcularDistanciaMetros = (
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const responderSolicitud = async (
    solicitudId: number,
    viajeId: number,
    estado: "aceptada" | "rechazada",
  ) => {
    try {
      const result = await orpc.solicitudes.responder({ solicitudId, estado });
      if (result.success) {
        mostrarSnackbar(
  `Solicitud ${estado === "aceptada" ? "aceptada" : "rechazada"} correctamente`,
  "success"
);
        cargarDatos();
      }
    } catch (error: any) {
      mostrarSnackbar(
  error.message || "No se pudo procesar la solicitud",
  "error"
);
    }
  };

  const onRefresh = () => {
    cargarDatos();
  };

  // Configurar WebSocket para recibir actualizaciones
  useEffect(() => {
    cargarDatos();

    const socket = getSocket();
    if (socket) {
      const onNuevaSolicitud = (data: any) => {
        console.log("📢 Nueva solicitud recibida en Conducir:", data);
        cargarDatos().catch(e => console.error("Error al recargar datos:", e));
      };

      const onSolicitudActualizada = (data: any) => {
        console.log("📢 Solicitud actualizada en Conducir:", data);
        cargarDatos().catch(e => console.error("Error al recargar datos:", e));
      };

      const onViajeCancelado = (data: any) => {
        console.log("📢 Viaje cancelado en Conducir:", data);
        cargarDatos().catch(e => console.error("Error al recargar datos:", e));
      };

      const onNuevoViajePublicado = (data: any) => {
        cargarDatos().catch(e => console.error("Error al recargar datos:", e));
      };

      const onViajeFinalizado = (data: any) => {
        console.log("📢 Viaje finalizado en Conducir:", data);
        cargarDatos().catch(e => console.error("Error al recargar datos:", e));
      };

      const onSolicitudCancelada = (data: any) => {
        console.log("📢 Solicitud cancelada en Conducir:", data);
        cargarDatos().catch(e => console.error("Error al recargar datos:", e));
      };

      socket.on("nueva_solicitud", onNuevaSolicitud);
      socket.on("solicitud_actualizada", onSolicitudActualizada);
      socket.on("solicitud_cancelada", onSolicitudCancelada);
      socket.on("viaje_cancelado", onViajeCancelado);
      socket.on("nuevo_viaje", onNuevoViajePublicado);
      socket.on("viaje_finalizado", onViajeFinalizado);

      return () => {
        socket.off("nueva_solicitud", onNuevaSolicitud);
        socket.off("solicitud_actualizada", onSolicitudActualizada);
        socket.off("solicitud_cancelada", onSolicitudCancelada);
        socket.off("viaje_cancelado", onViajeCancelado);
        socket.off("nuevo_viaje", onNuevoViajePublicado);
        socket.off("viaje_finalizado", onViajeFinalizado);
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      locationSub.current?.remove();
    };
  }, []);

  const renderViajeCard = (
    viaje: any,
    showActions = false,
    solicitudId?: number,
    isActive = false,
  ) => (
    <View
      key={viaje.id_viaje_pub}
      className="bg-white rounded-xl mb-3 p-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-sm text-green-600 font-semibold">ORIGEN</Text>
          <Text className="text-gray-800 font-medium">
            {viaje.origen_texto}
          </Text>
          <Text className="text-sm text-red-600 font-semibold mt-2">
            DESTINO
          </Text>
          <Text className="text-gray-800 font-medium">
            {viaje.destino_texto}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-blue-900">
            ${viaje.costo_estimado}
          </Text>
          <Text className="text-xs text-gray-500">por persona</Text>
        </View>
      </View>

      <View className="flex-row mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center mr-4">
          <Text className="text-gray-500 mr-1">📅</Text>
          <Text className="text-sm text-gray-700">
            {new Date(viaje.fecha_hora_salida).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>
        <View className="flex-row items-center mr-4">
          <Text className="text-gray-500 mr-1">⏰</Text>
          <Text className="text-sm text-gray-700">
            {new Date(viaje.fecha_hora_salida).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-gray-500 mr-1">👥</Text>
          <Text className="text-sm text-gray-700">
            {(viaje.solicitudes?.length ?? 0)}/{viaje.asientos_ofrecidos ?? viaje.capacidad_pasajeros ?? '?'} ocupados
          </Text>
        </View>
      </View>

      {/* Botones de acción */}
      <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-100">
        {isActive && (
          <>
            {/* Botón Iniciar Viaje */}
            {!esViajeActivo(viaje.id_viaje_pub) ? (
              <TouchableOpacity
                className="bg-green-600 rounded-lg px-4 py-2 mr-2"
                onPress={() => handleIniciarViaje(viaje.id_viaje_pub)}
              >
                <Text className="text-white font-semibold text-sm">Iniciar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-blue-600 rounded-lg px-4 py-2 mr-2"
                onPress={() => {
                  setLiveMapViajeId(viaje.id_viaje_pub);
                  setLiveMapVisible(true);
                }}
              >
                <Text className="text-white font-semibold text-sm">Ver ruta</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className={`rounded-lg px-4 py-2 mr-2 ${
                esViajeActivo(viaje.id_viaje_pub) ? "bg-orange-500" : "bg-gray-400 opacity-70"
              }`}
              disabled={!esViajeActivo(viaje.id_viaje_pub)}
              
              onPress={() => {
                destinoAlertado.current = true;
                locationSub.current?.remove();
                locationSub.current = null;
                getSocket()?.emit('leave_viaje', viaje.id_viaje_pub);
                setTransmitiendo(null);
                navigation.navigate("FinishTrip", {
                  viajeId: viaje.id_viaje_pub,
                  viaje, 
                });
              }}
            >
              <Text className="text-white font-semibold text-sm">Finalizar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-500 rounded-lg px-4 py-2 mr-2"
              onPress={() => abrirModalCancelacion(viaje.id_viaje_pub)}
            >
              <Text className="text-white font-semibold text-sm">Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
        {showActions && (
          <>
            <TouchableOpacity
              className="bg-green-500 rounded-lg px-4 py-2 mr-2"
              onPress={() =>
                responderSolicitud(
                  solicitudId || viaje.id,
                  viaje.id_viaje_pub,
                  "aceptada",
                )
              }
            >
              <Text className="text-white font-semibold text-sm">Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-red-500 rounded-lg px-4 py-2"
              onPress={() =>
                responderSolicitud(
                  solicitudId || viaje.id,
                  viaje.id_viaje_pub,
                  "rechazada",
                )
              }
            >
              <Text className="text-white font-semibold text-sm">Rechazar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    
    if (cargando && !refrescando) {
  return <LoadingState message="Cargando información del conductor..." />;
}
if (hayError) {
  return (
    <ErrorState message="No se pudo cargar la información del conductor" />
  );
}

    if (activeTab === "activos") {
      if (viajesActivos.length === 0) {
  return (
    <EmptyState
      icon="🚗"
      message="No tienes viajes activos"
      buttonText="Publicar un viaje"
      onPress={() => navigation.navigate("PublicarViaje")}
    />
  );
}
      return viajesActivos.map((viaje) =>
        renderViajeCard(viaje, false, undefined, true),
      );
    }

    if (activeTab === "solicitudes") {
      if (solicitudes.length === 0) {
  return (
    <EmptyState
      icon="📭"
      message="No hay solicitudes pendientes"
    />
  );
}
      return solicitudes.map((solicitud) => (
        <View key={solicitud.id_solicitud}>
          {renderViajeCard(
            solicitud.viaje,
            true,
            solicitud.id_solicitud,
            false,
          )}
        </View>
      ));
    }

    return null;
  };

  return (
    <ScreenWrapper hasFooter={true}>
      <Header navigation={navigation} title="Conducir" />

      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${activeTab === "activos" ? "border-b-2 border-blue-900" : ""}`}
          onPress={() => setActiveTab("activos")}
        >
          <Text
            className={`font-semibold ${activeTab === "activos" ? "text-blue-900" : "text-gray-500"}`}
          >
            Activos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${activeTab === "solicitudes" ? "border-b-2 border-blue-900" : ""}`}
          onPress={() => setActiveTab("solicitudes")}
        >
          <Text
            className={`font-semibold ${activeTab === "solicitudes" ? "text-blue-900" : "text-gray-500"}`}
          >
            Solicitudes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={onRefresh} />
        }
      >
        {renderContent()}
      </ScrollView>

      <TouchableOpacity
        testID="btn-nuevo-viaje"
        className="absolute right-6 bg-blue-900 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ bottom: 80 + insets.bottom }}
        onPress={() => navigation.navigate("PublicarViaje")}
        activeOpacity={0.8}
      >
        <Text className="text-white text-3xl font-bold">+</Text>
      </TouchableOpacity>

      <Footer navigation={navigation} />
      {liveMapViajeId && (() => {
        const viaje = viajesActivos.find((v) => v.id_viaje_pub === liveMapViajeId);
        if (!viaje) return null;

        const pasajerosCoordenadas = (viaje.solicitudes ?? [])
          .filter((s: any) => s.latitud_recogida && s.longitud_recogida)
          .map((s: any) => ({
            latitude: s.latitud_recogida,
            longitude: s.longitud_recogida,
            nombre: `${s.pasajero?.nombre ?? "Pasajero"}`,
          }));

        return (
          <LiveMapModal
            visible={liveMapVisible}
            onClose={() => setLiveMapVisible(false)}
            viajeId={liveMapViajeId}
            mode="conductor"
            pasajerosCoordenadas={pasajerosCoordenadas}
            origen={{ lat: viaje.latitud_origen, lng: viaje.longitud_origen }}
            destino={{ lat: viaje.latitud_destino, lng: viaje.longitud_destino }}
          />
        );
      })()}

      {/* Modal de cancelación con motivo */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl w-5/6 p-6">
            <Text className="text-lg font-bold text-gray-800 mb-2">
              Cancelar viaje
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              Indica el motivo de la cancelación. Esta información quedará registrada en la auditoría del viaje.
            </Text>

            <TextInput
              className="border border-gray-300 rounded-xl p-3 text-base mb-4 min-h-[80px]"
              placeholder="Escribe el motivo..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={motivoCancelacion}
              onChangeText={setMotivoCancelacion}
            />

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                className="px-5 py-3 rounded-xl bg-gray-200"
                onPress={() => setShowCancelModal(false)}
              >
                <Text className="text-gray-700 font-semibold">Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-5 py-3 rounded-xl ${motivoCancelacion.trim() ? "bg-red-500" : "bg-red-300"}`}
                onPress={ejecutarCancelacion}
                disabled={!motivoCancelacion.trim()}
              >
                <Text className="text-white font-semibold">Cancelar viaje</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

<Snackbar
  visible={snackbar.visible}
  message={snackbar.message}
  type={snackbar.type}
/>

    </ScreenWrapper>
  );
};

export default ConducirScreen;
