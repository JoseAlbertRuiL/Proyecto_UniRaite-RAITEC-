import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import DriverCard from "../../components/driverCard";
import { getPerfil, getUsuarioById } from "../../services/auth/authService";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { filtrarViajesCercanos } from "../../services/map/mapService";
import {
  listarViajes,
  solicitarViaje,
  obtenerEstadoSolicitud,
  obtenerSolicitudesActivas,
  getViajePorId,
} from "../../services/trip/tripService";
import { BASE_URL } from "../../services/api/apiClient";
import EmergencyButton from "../../components/EmergencyButton";
import { useBackHandler } from "../../hooks/useBackHandler";
import { getSocket } from "../../services/socket";

const StartScreen = ({ navigation }: any) => {
  const [viajes, setViajes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<any>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [esConductorActivo, setEsConductorActivo] = useState(false);
  const [puntoEncuentro,    setPuntoEncuentro]    = useState<{ latitude: number; longitude: number; texto: string } | null>(null);
  const [mapEncuentroVisible, setMapEncuentroVisible] = useState(false);
  const [markerTemp,          setMarkerTemp]          = useState<{ latitude: number; longitude: number } | null>(null);
  const [geocodingLoad,       setGeocodingLoad]       = useState(false);
  const mapEncuentroRef = useRef<MapView>(null);
  const [estadosSolicitudes, setEstadosSolicitudes] = useState<{
    [key: number]: string;
  }>({});
  const [solicitudActiva, setSolicitudActiva] = useState<{
    tieneSolicitud: boolean;
    estado: string | null;
    viajeId?: number;
  }>({ tieneSolicitud: false, estado: null });

  useBackHandler(navigation, "main");

  const verificarSolicitudActiva = async () => {
    try {
      const result = await obtenerSolicitudesActivas();
      if (
        result.success &&
        result.solicitudes &&
        result.solicitudes.length > 0
      ) {
        const solicitud = result.solicitudes[0];

        if (solicitud.estado_solicitud === 'rechazada') {
          setSolicitudActiva({ tieneSolicitud: false, estado: null });
          return;
        }

        setSolicitudActiva({
          tieneSolicitud: true,
          estado: solicitud.estado_solicitud,
          viajeId: solicitud.id_viaje_pub,
        });
      } else {
        setSolicitudActiva({ tieneSolicitud: false, estado: null });
      }
    } catch (error) {
      console.log("Error al verificar solicitud activa:", error);
    }
  };

  const verificarModoCondutor = async (perfil: any) => {
    const modoGuardado = await AsyncStorage.getItem("modo_conductor_activo");
    const activo = perfil?.es_conductor === true && modoGuardado === "true";
    setEsConductorActivo(activo);

    // Si era conductor activo, limpiar punto de encuentro guardado
    if (activo) {
      await AsyncStorage.removeItem("punto_encuentro");
      setPuntoEncuentro(null);
    } else {
      // Cargar punto de encuentro guardado si existe
      const guardado = await AsyncStorage.getItem("punto_encuentro");
      if (guardado) setPuntoEncuentro(JSON.parse(guardado));
    }
  };

  const cargarEstadosSolicitudes = async (viajesLista: any[]) => {
    const nuevosEstados: { [key: number]: string } = {};
    for (const viaje of viajesLista) {
      try {
        const estado = await obtenerEstadoSolicitud(viaje.id_viaje_pub);
        if (estado) {
          nuevosEstados[viaje.id_viaje_pub] = estado;
        }
      } catch (error) {
        // No hay solicitud para este viaje
      }
    }
    setEstadosSolicitudes(nuevosEstados);
  };

  const cargarViajes = async () => {
    try {
      const perfilData = await getPerfil();
      if (!perfilData || !perfilData.user) {
        navigation.navigate("Login");
        return;
      }

      await verificarModoCondutor(perfilData.user);

      const usuarioActualId = perfilData.user?.id_usuario;
      const viajesData = await listarViajes();

      if (viajesData && viajesData.success) {
        let viajesFiltrados = viajesData.viajes.filter(
          (viaje: any) =>
            viaje.conductor?.usuario?.id_usuario !== usuarioActualId,
        );

        if (!esConductorActivo) {
          const solicitudActivaData = await obtenerSolicitudesActivas();
          const solicitudReciente = solicitudActivaData?.solicitudes?.[0] ?? null;
          const viajeIdConSolicitud = solicitudReciente?.id_viaje_pub ?? null;
          const estadoSolicitudReciente = solicitudReciente?.estado_solicitud ?? null;

          const tieneActivaPendienteOAceptada =
            estadoSolicitudReciente === 'pendiente' || estadoSolicitudReciente === 'aceptada';

          let viajesConSolicitudActiva: any[] = [];

          if (viajeIdConSolicitud && tieneActivaPendienteOAceptada) {
            let viajeConSolicitud = viajesFiltrados.find(
              (v: any) => v.id_viaje_pub === viajeIdConSolicitud
            );

            if (!viajeConSolicitud) {
              try {
                const resultado = await getViajePorId(viajeIdConSolicitud);
                if (resultado.success) viajeConSolicitud = resultado.viaje;
              } catch {
              }
            }

            if (viajeConSolicitud) {
              viajesConSolicitudActiva = [viajeConSolicitud];
            }
          }

          const viajesSinSolicitud = tieneActivaPendienteOAceptada && viajeIdConSolicitud
            ? viajesFiltrados.filter((v: any) => v.id_viaje_pub !== viajeIdConSolicitud)
            : viajesFiltrados;
          
          const guardado = await AsyncStorage.getItem("punto_encuentro");
          let viajesCercanos: any[] = [];

          if (guardado && estadoSolicitudReciente !== 'aceptada') {
            const punto = JSON.parse(guardado);

            viajesCercanos = filtrarViajesCercanos(
              viajesSinSolicitud,
              punto.latitude,
              punto.longitude,
              0.5
            );            
          } else {
            viajesCercanos = [];
          }
          viajesFiltrados = [...viajesConSolicitudActiva, ...viajesCercanos];
        }

        setViajes(viajesFiltrados);
        await cargarEstadosSolicitudes(viajesFiltrados);
        await verificarSolicitudActiva();
      }
    } catch (error) {
      console.error("Error:", error);
      navigation.navigate("Login");
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const handleVerPerfil = async (usuarioId: string) => {
    setCargandoPerfil(true);
    setModalVisible(true);
    try {
      const data = await getUsuarioById(usuarioId);
      if (data && data.success) {
        setPerfilSeleccionado(data.user);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cargar el perfil");
    } finally {
      setCargandoPerfil(false);
    }
  };

  const handleSolicitarViaje = async (viajeId: number) => {
    if (solicitudActiva.tieneSolicitud) {
      if (solicitudActiva.estado === "pendiente") {
        Alert.alert(
          "Solicitud pendiente",
          "Ya tienes una solicitud pendiente. Espera a que el conductor responda.",
        );
      } else if (solicitudActiva.estado === "aceptada") {
        Alert.alert(
          "Viaje aceptado",
          "Ya tienes un viaje aceptado. No puedes solicitar otro viaje.",
        );
      }
      return;
    }

    try {
      const result = await solicitarViaje(viajeId);
      if (result && result.success) {
        setEstadosSolicitudes((prev) => ({ ...prev, [viajeId]: "pendiente" }));
        setSolicitudActiva({
          tieneSolicitud: true,
          estado: "pendiente",
          viajeId,
        });
        Alert.alert(
          "Solicitud enviada",
          "Tu solicitud ha sido enviada al conductor",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo enviar la solicitud");
    }
  };

  const abrirMapaEncuentro = () => {
    setMarkerTemp(
      puntoEncuentro
        ? { latitude: puntoEncuentro.latitude, longitude: puntoEncuentro.longitude }
        : null
    );
    setMapEncuentroVisible(true);
  };

  const centrarEnUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc    = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMarkerTemp(coords);
      mapEncuentroRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 800
      );
    } catch {
      Alert.alert("Error", "No se pudo obtener tu ubicación.");
    }
  };

  const confirmarPuntoEncuentro = async () => {
    if (!markerTemp) {
      Alert.alert("Selecciona un punto", "Toca el mapa para marcar donde esperarás.");
      return;
    }
    setGeocodingLoad(true);
    try {
      const resultados = await Location.reverseGeocodeAsync(markerTemp);
      const r      = resultados[0];
      const partes = [r?.street, r?.streetNumber, r?.district, r?.city].filter(Boolean);
      const texto  = partes.length > 0
        ? partes.join(", ")
        : `${markerTemp.latitude.toFixed(5)}, ${markerTemp.longitude.toFixed(5)}`;

      const punto = { ...markerTemp, texto };
      setPuntoEncuentro(punto);
      await AsyncStorage.setItem("punto_encuentro", JSON.stringify(punto));
      await cargarViajes();
      
      setMapEncuentroVisible(false);
      Alert.alert("Punto guardado", `Te recogerán en: ${texto}`);
    } catch {
      const texto = `${markerTemp.latitude.toFixed(5)}, ${markerTemp.longitude.toFixed(5)}`;
      const punto = { ...markerTemp, texto };
      setPuntoEncuentro(punto);
      await AsyncStorage.setItem("punto_encuentro", JSON.stringify(punto));
      setMapEncuentroVisible(false);
    } finally {
      setGeocodingLoad(false);
    }
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarViajes();
  };

  // Configurar WebSocket y polling para actualizaciones
  useEffect(() => {
    cargarViajes();

    // Polling: recargar cada 30 segundos para actualizar viajes expirados
    const interval = setInterval(() => {
      console.log("🔄 Polling: recargando viajes...");
      cargarViajes();
    }, 30000);

    const socket = getSocket();
    if (socket) {
      const onSolicitudActualizada = (data: any) => {
        console.log("📢 Solicitud actualizada en tiempo real:", data);
        cargarViajes();
      };

      const onNuevaSolicitud = (data: any) => {
        console.log("📢 Nueva solicitud en tiempo real:", data);
        cargarViajes();
      };

      const onNuevoViaje = (data: any) => {
        console.log("📢 Nuevo viaje disponible:", data);
        cargarViajes();
      };

      const onViajeCancelado = (data: any) => {
        console.log("📢 Viaje cancelado:", data);
        cargarViajes();
      };

      socket.on("solicitud_actualizada", onSolicitudActualizada);
      socket.on("nueva_solicitud", onNuevaSolicitud);
      socket.on("nuevo_viaje", onNuevoViaje);
      socket.on("viaje_cancelado", onViajeCancelado);

      return () => {
        clearInterval(interval);
        socket.off("solicitud_actualizada", onSolicitudActualizada);
        socket.off("nueva_solicitud", onNuevaSolicitud);
        socket.off("nuevo_viaje", onNuevoViaje);
        socket.off("viaje_cancelado", onViajeCancelado);
      };
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: StatusBar.currentHeight || 0 }}
    >
      <Header navigation={navigation} title="Inicio" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={onRefresh} />
          }
        >
          <View className="w-full h-48 bg-green-200 rounded-lg mb-4" />

          <View className="flex-row justify-between mb-6">
            {!esConductorActivo && (
              <TouchableOpacity
                className={`rounded-lg py-3 px-4 flex-1 mr-2 ${
                  solicitudActiva.tieneSolicitud ? "bg-gray-400" : "bg-blue-600"
                }`}
                onPress={solicitudActiva.tieneSolicitud ? undefined : abrirMapaEncuentro}
                activeOpacity={solicitudActiva.tieneSolicitud ? 1 : 0.7}
              >
                <Text className="text-white font-bold text-center text-sm">
                  {solicitudActiva.tieneSolicitud
                    ? "📍 Punto de encuentro fijo"
                    : puntoEncuentro
                      ? "📍 Punto de encuentro"
                      : "📍 Establecer punto de encuentro"}
                </Text>
                {puntoEncuentro && (
                  <Text className="text-white/70 text-xs text-center mt-0.5" numberOfLines={1}>
                    {solicitudActiva.tieneSolicitud
                      ? "No editable con viaje activo"
                      : puntoEncuentro.texto}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View className="items-center justify-center mb-12">
            <Text className="text-4xl font-bold text-blue-900 tracking-wider mb-2">
              UNIRAITE
            </Text>

            <View className="flex-row items-center mb-6 w-full">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-sm text-gray-500">
                Viajes disponibles
              </Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {cargando ? (
              <ActivityIndicator size="large" color="#1e3a8a" />
            ) : viajes.length === 0 ? (
              <Text className="text-gray-500 text-center">
                No hay viajes disponibles
              </Text>
            ) : (
              viajes.map((viaje: any) => (
                <DriverCard
                  key={viaje.id_viaje_pub}
                  viaje={viaje}
                  onPress={handleSolicitarViaje}
                  onVerPerfil={handleVerPerfil}
                  estadoSolicitud={
                    estadosSolicitudes[viaje.id_viaje_pub] || null
                  }
                />
              ))
            )}
          </View>

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-sm text-gray-500">o</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Modal mapa punto de encuentro */}
      <Modal visible={mapEncuentroVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapEncuentroRef}
            style={{ flex: 1 }}
            initialRegion={
              markerTemp
                ? { ...markerTemp, latitudeDelta: 0.01, longitudeDelta: 0.01 }
                : { latitude: 19.7069, longitude: -101.1945, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            }
            onPress={(e: MapPressEvent) => setMarkerTemp(e.nativeEvent.coordinate)}
          >
            {markerTemp && <Marker coordinate={markerTemp} />}
          </MapView>

          {/* Instrucción flotante */}
          <View
            style={{
              position: "absolute", top: 16, left: 16, right: 16,
              backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 12, padding: 12,
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
              📍 Toca el mapa para marcar donde esperarás al conductor
            </Text>
          </View>

          {/* Botones inferiores */}
          <View style={{ position: "absolute", bottom: 32, left: 16, right: 16, gap: 10 }}>
            <TouchableOpacity
              onPress={centrarEnUbicacion}
              style={{ backgroundColor: "#1e3a8a", borderRadius: 14, padding: 14, alignItems: "center" }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>📍 Usar mi ubicación actual</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setMapEncuentroVisible(false)}
                style={{ flex: 1, backgroundColor: "#e5e7eb", borderRadius: 14, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#374151", fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmarPuntoEncuentro}
                disabled={geocodingLoad || !markerTemp}
                style={{
                  flex: 2, borderRadius: 14, padding: 14, alignItems: "center",
                  backgroundColor: markerTemp ? "#2563eb" : "#93c5fd",
                }}
              >
                {geocodingLoad
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: "white", fontWeight: "700" }}>Confirmar punto</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de perfil flotante */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-6"
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-white rounded-2xl w-full max-w-md p-6">
            {cargandoPerfil ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text className="text-gray-500 mt-4">Cargando perfil...</Text>
              </View>
            ) : (
              <>
                <View className="items-center mb-4">
                  {perfilSeleccionado?.foto_perfil ? (
                    <Image
                      source={{
                        uri: perfilSeleccionado.foto_perfil,
                      }}
                      className="w-24 h-24 rounded-full"
                    />
                  ) : (
                    <View className="w-24 h-24 bg-gray-300 rounded-full items-center justify-center">
                      <Text className="text-4xl">👤</Text>
                    </View>
                  )}
                </View>

                <Text className="text-xl font-bold text-center text-gray-900">
                  {perfilSeleccionado?.nombre}{" "}
                  {perfilSeleccionado?.apellido_paterno?.charAt(0)}.
                </Text>

                <View className="bg-gray-50 rounded-xl p-3 mt-4">
                  <Text className="text-gray-500 text-xs">Carrera</Text>
                  <Text className="text-gray-900 font-semibold">
                    {perfilSeleccionado?.carrera || "No especificada"}
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 mt-2">
                  <Text className="text-gray-500 text-xs">Universidad</Text>
                  <Text className="text-gray-900 font-semibold">
                    TecNM Campus Morelia
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 mt-2">
                  <Text className="text-gray-500 text-xs">Reputación</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-yellow-500 text-lg mr-1">★</Text>
                    <Text className="text-gray-900 font-semibold text-lg">
                      {perfilSeleccionado?.reputacion_promedio?.toFixed(1) ||
                        "Nuevo"}
                    </Text>
                    <Text className="text-gray-400 text-sm ml-1">/ 5.0</Text>
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-blue-900 rounded-xl py-3 mt-6 items-center"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="text-white font-semibold">Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <EmergencyButton />
      <Footer navigation={navigation} />
    </View>
  );
};

export default StartScreen;
