import React, { useState, useEffect } from "react";
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
import { orpc } from "../../services/api/apiClient";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useBackHandler } from "../../hooks/useBackHandler";
import { getSocket } from "../../services/socket";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabType = "activos" | "solicitudes" | "historial";

const ConducirScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<TabType>("activos");
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [viajesActivos, setViajesActivos] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const insets = useSafeAreaInsets();

  useBackHandler(navigation, "normal");

  const cargarDatos = async () => {
    try {
      const activosData = await orpc.viajes.activos();
      if (activosData.success) setViajesActivos(activosData.viajes || []);

      const solicitudesData = await orpc.solicitudes.recibidas();
      if (solicitudesData.success)
        setSolicitudes(solicitudesData.solicitudes || []);

      const historialData = await orpc.viajes.historialConductor();
      if (historialData.success) setHistorial(historialData.viajes || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
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

      socket.on("nueva_solicitud", onNuevaSolicitud);
      socket.on("solicitud_actualizada", onSolicitudActualizada);
      socket.on("viaje_cancelado", onViajeCancelado);
      socket.on("nuevo_viaje", onNuevoViajePublicado);
      socket.on("viaje_finalizado", onViajeFinalizado);

      return () => {
        socket.off("nueva_solicitud", onNuevaSolicitud);
        socket.off("solicitud_actualizada", onSolicitudActualizada);
        socket.off("viaje_cancelado", onViajeCancelado);
        socket.off("nuevo_viaje", onNuevoViajePublicado);
        socket.off("viaje_finalizado", onViajeFinalizado);
      };
    }
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
            <TouchableOpacity
              className="bg-orange-500 rounded-lg px-4 py-2 mr-2"
              onPress={() => navigation.navigate("FinishTrip", { viaje })}
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

    if (activeTab === "historial") {
      if (historial.length === 0) {
        return (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-4xl mb-4">📜</Text>
            <Text className="text-gray-500 text-center">
              No hay viajes en el historial
            </Text>
          </View>
        );
      }
      return historial.map((viaje) =>
        renderViajeCard(viaje, false, undefined, false),
      );
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
        <TouchableOpacity
          className={`flex-1 py-3 items-center ${activeTab === "historial" ? "border-b-2 border-blue-900" : ""}`}
          onPress={() => setActiveTab("historial")}
        >
          <Text
            className={`font-semibold ${activeTab === "historial" ? "text-blue-900" : "text-gray-500"}`}
          >
            Historial
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
    </ScreenWrapper>
  );
};

export default ConducirScreen;
