import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import DriverCard from "../../components/driverCard";
import { orpc } from "../../services/api/apiClient";
import { useBackHandler } from "../../hooks/useBackHandler";
import { getSocket } from "../../services/socket";

const HistoryScreen = ({ navigation }: any) => {
  useBackHandler(navigation, "normal");

  const [filtro, setFiltro] = useState<"todos" | "pasajero" | "conductor">("todos");

  const obtenerHistorial = async () => {
    const [resPasajero, resConductor] = await Promise.all([
      orpc.viajes.historialPasajero(),
      orpc.viajes.historialConductor(),
    ]);

    let combinados: any[] = [];

    if (resPasajero.success) {
      combinados.push(
        ...resPasajero.viajes.map((v: any) => ({ ...v, rol: "pasajero" }))
      );
    }

    if (resConductor.success) {
      combinados.push(
        ...resConductor.viajes.map((v: any) => ({ ...v, rol: "conductor" }))
      );
    }

    combinados.sort(
      (a, b) =>
        new Date(b.fecha_hora_salida).getTime() -
        new Date(a.fecha_hora_salida).getTime()
    );

    return combinados;
  };

  const {
    data: viajes = [],
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
  } = useQuery({
    queryKey: ["historial-viajes"],
    queryFn: obtenerHistorial,
  });

  useEffect(() => {
    const socket = getSocket();

    if (socket) {
      const onViajeFinalizado = (data: any) => {
        console.log("📢 Viaje finalizado en History:", data);
        refetch();
      };

      socket.on("viaje_finalizado", onViajeFinalizado);

      return () => {
        socket.off("viaje_finalizado", onViajeFinalizado);
      };
    }
  }, [refetch]);

  const onRefresh = () => {
    refetch();
  };

  const viajesFiltrados = viajes.filter(
    (v: any) => filtro === "todos" || v.rol === filtro
  );

  return (
    <ScreenWrapper hasFooter={true}>
      <Header navigation={navigation} title="Historial de Viajes" />

      <View className="flex-row justify-center py-4 border-b border-gray-100 px-4">
        <TouchableOpacity
          onPress={() => setFiltro("todos")}
          className={`px-4 py-2 rounded-full mx-1 ${
            filtro === "todos" ? "bg-blue-900" : "bg-gray-100"
          }`}
        >
          <Text className={filtro === "todos" ? "text-white font-semibold" : "text-gray-600"}>
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFiltro("pasajero")}
          className={`px-4 py-2 rounded-full mx-1 ${
            filtro === "pasajero" ? "bg-blue-900" : "bg-gray-100"
          }`}
        >
          <Text className={filtro === "pasajero" ? "text-white font-semibold" : "text-gray-600"}>
            Como Pasajero
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFiltro("conductor")}
          className={`px-4 py-2 rounded-full mx-1 ${
            filtro === "conductor" ? "bg-blue-900" : "bg-gray-100"
          }`}
        >
          <Text className={filtro === "conductor" ? "text-white font-semibold" : "text-gray-600"}>
            Como Conductor
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text className="mt-4 text-gray-500">Cargando historial...</Text>
        </View>
      ) : (
        <FlatList
          data={viajesFiltrados}
          keyExtractor={(item, index) => `historial-${item.id_viaje_pub}-${index}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-10 mt-10">
              <Text className="text-5xl mb-4">📭</Text>
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                No hay viajes recientes
              </Text>
              <Text className="text-gray-500 text-center px-6">
                Aún no tienes viajes completados en tu historial.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const capacidadTotal = item.conductor?.capacidad_pasajeros ?? 4;

            const pasajerosOcupados =
              typeof item.pasajeros_confirmados === "number"
                ? item.pasajeros_confirmados
                : typeof item.asientos_disponibles === "number"
                  ? Math.max(0, capacidadTotal - item.asientos_disponibles)
                  : 0;

            return (
              <View className="mb-4 relative">
                <View className="absolute z-10 top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {item.rol === "conductor" ? "🚗 Conductor" : "🧑‍🤝‍🧑 Pasajero"}
                  </Text>
                </View>

                <DriverCard
                  viaje={{
                    ...item,
                    asientos_totales: capacidadTotal,
                    asientos_ocupados: pasajerosOcupados,
                    conductor: {
                      ...item.conductor,
                      usuario: {
                        ...item.conductor.usuario,
                        total_viajes:
                          item.conductor.usuario.viajes_completados || 0,
                      },
                    },
                  }}
                  onPress={() => {}}
                  onVerPerfil={(id) =>
                    navigation.navigate("PerfilPublico", { usuarioId: id })
                  }
                  estadoSolicitud="completado"
                />
              </View>
            );
          }}
        />
      )}

      <Footer navigation={navigation} />
    </ScreenWrapper>
  );
};

export default HistoryScreen;