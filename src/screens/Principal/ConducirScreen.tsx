import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
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
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  // const [transmitiendo, setTransmitiendo] = useState(false);
  const [viajeActivoId, setViajeActivoId] = useState<number | null>(null);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [viajesActivos, setViajesActivos] = useState<any[]>([]);
  const [transmitiendo, setTransmitiendo] = useState<number | null>(null);
  const [liveMapViajeId, setLiveMapViajeId] = useState<number | null>(null);
  const [liveMapVisible, setLiveMapVisible] = useState(false);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const destinoAlertado = useRef<boolean>(false);
  // const locationInterval = useRef<any>(null);

  useBackHandler(navigation, "normal");

  const cargarDatos = async () => {
    try {
      const activosData = await orpc.viajes.activos();
      const todosActivos = activosData.viajes || [];

      if (activosData.success) {
        const ahora = new Date();

        const expirados = todosActivos.filter((viaje: any) => {
          const haIniciado = viaje.viajes_activos?.length > 0;
          const fechaPasada = new Date(viaje.fecha_hora_salida) < ahora;
          return !haIniciado && fechaPasada;
        });

        if (expirados.length > 0) {
          Promise.allSettled(
            expirados.map((v: any) =>
              orpc.viajes.cancelar({ viajeId: v.id_viaje_pub })
            )
          ).then((results) => {
            const cancelados = results.filter((r) => r.status === 'fulfilled').length;
            if (cancelados > 0) {
              console.log(`🗑️ ${cancelados} viaje(s) expirado(s) cancelado(s) automáticamente`);
              // Refrescar para que desaparezcan de la lista
              cargarDatos();
            }
          });
        }
        
        const vigentes = todosActivos.filter((viaje: any) => {
          const haIniciado = viaje.viajes_activos?.length > 0;
          const fechaPasada = new Date(viaje.fecha_hora_salida) < ahora;
          return haIniciado || !fechaPasada;
        });

        setViajesActivos(vigentes);
      }

      const solicitudesData = await orpc.solicitudes.recibidas();
      if (solicitudesData.success)
        setSolicitudes(solicitudesData.solicitudes || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
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

        await iniciarTransmisionUbicacion(
          viajeId,
          result.viajeActivo.id_viaje_activo,
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

  const cancelarViaje = async (viajeId: number) => {
    Alert.alert(
      "Cancelar viaje",
      "¿Estás seguro de que deseas cancelar este viaje?",
      [
        {
          text: "Sí, cancelar",
          onPress: async () => {
            try {
              const result = await orpc.viajes.cancelar({ viajeId });
              if (result.success) {
                Alert.alert("Éxito", "Viaje cancelado correctamente");
                cargarDatos();
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "No se pudo cancelar el viaje",
              );
            }
          },
          style: "destructive",
        },
        { text: "No", style: "cancel" },
      ],
    );
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
        Alert.alert(
          "Éxito",
          `Solicitud ${estado === "aceptada" ? "aceptada" : "rechazada"}`,
        );
        cargarDatos();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo procesar la solicitud");
    }
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarDatos();
  };

  // Configurar WebSocket para recibir actualizaciones
  useEffect(() => {
    cargarDatos();

    const socket = getSocket();
    if (socket) {
      const onNuevaSolicitud = (data: any) => {
        console.log("📢 Nueva solicitud recibida en Conducir:", data);
        cargarDatos();
      };

      const onSolicitudActualizada = (data: any) => {
        console.log("📢 Solicitud actualizada en Conducir:", data);
        cargarDatos();
      };

      const onViajeCancelado = (data: any) => {
        console.log("📢 Viaje cancelado en Conducir:", data);
        cargarDatos();
      };

      const onNuevoViajePublicado = (data: any) => {
        // Solo actualiza si el viaje es del conductor actual
        cargarDatos();
      };

      const onViajeFinalizado = (data: any) => {
        console.log("📢 Viaje finalizado en Conducir:", data);
        cargarDatos();
      };

      const onSolicitudCancelada = (data: any) => {
        console.log("📢 Solicitud cancelada en Conducir:", data);
        cargarDatos();
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
            {viaje.asientos_disponibles} lugares
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
              // 🎨 Cambiamos el color dinámicamente: Naranja si está activo, Gris si no lo está
              className={`rounded-lg px-4 py-2 mr-2 ${
                esViajeActivo(viaje.id_viaje_pub) ? "bg-orange-500" : "bg-gray-400 opacity-70"
              }`}
              // 🔒 Bloqueamos el clic si el viaje NO está activo
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
              onPress={() => cancelarViaje(viaje.id_viaje_pub)}
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
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text className="text-gray-500 mt-4">Cargando...</Text>
        </View>
      );
    }

    if (activeTab === "activos") {
      if (viajesActivos.length === 0) {
        return (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-4xl mb-4">🚗</Text>
            <Text className="text-gray-500 text-center">
              No tienes viajes activos
            </Text>
            <TouchableOpacity
              className="mt-4 bg-blue-900 rounded-xl py-3 px-6"
              onPress={() => navigation.navigate("PublicarViaje")}
            >
              <Text className="text-white font-semibold">
                Publicar un viaje
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
      return viajesActivos.map((viaje) =>
        renderViajeCard(viaje, false, undefined, true),
      );
    }

    if (activeTab === "solicitudes") {
      if (solicitudes.length === 0) {
        return (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-4xl mb-4">📭</Text>
            <Text className="text-gray-500 text-center">
              No hay solicitudes pendientes
            </Text>
          </View>
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
        const pasajerosCoordenadas = (viaje?.solicitudes ?? [])
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
            origen={viaje ? { lat: viaje.latitud_origen, lng: viaje.longitud_origen } : undefined}
            destino={viaje ? { lat: viaje.latitud_destino, lng: viaje.longitud_destino } : undefined}
          />
        );
      })()}
    </ScreenWrapper>
  );
};

export default ConducirScreen;
