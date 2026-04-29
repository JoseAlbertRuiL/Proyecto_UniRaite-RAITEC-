import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import DriverCard from "../../components/driverCard";
import { orpc } from "../../services/api/apiClient";
import { useBackHandler } from "../../hooks/useBackHandler";

const HistoryScreen = ({ navigation }: any) => {
  useBackHandler(navigation, "normal");
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viajes, setViajes] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "pasajero" | "conductor">("todos");

  const fetchHistorial = async () => {
    try {
      const [resPasajero, resConductor] = await Promise.all([
        orpc.viajes.historialPasajero(),
        orpc.viajes.historialConductor(),
      ]);

      let combinados = [];

      if (resPasajero.success) {
        combinados.push(...resPasajero.viajes.map((v: any) => ({ ...v, rol: "pasajero" })));
      }
      
      if (resConductor.success) {
        combinados.push(...resConductor.viajes.map((v: any) => ({ ...v, rol: "conductor" })));
      }

      // Ordenar del más reciente al más viejo
      combinados.sort((a, b) => new Date(b.fecha_hora_salida).getTime() - new Date(a.fecha_hora_salida).getTime());
      
      setViajes(combinados);
    } catch (error) {
      console.error("Error al obtener historial:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistorial();
  };

  const viajesFiltrados = viajes.filter(v => filtro === "todos" || v.rol === filtro);

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: StatusBar.currentHeight || 0 }}
    >
      <Header navigation={navigation} title="Historial de Viajes" />

      <View className="flex-row justify-center py-4 border-b border-gray-100 px-4">
        <TouchableOpacity
          onPress={() => setFiltro("todos")}
          className={`px-4 py-2 rounded-full mx-1 ${filtro === "todos" ? "bg-blue-900" : "bg-gray-100"}`}
        >
          <Text className={filtro === "todos" ? "text-white font-semibold" : "text-gray-600"}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFiltro("pasajero")}
          className={`px-4 py-2 rounded-full mx-1 ${filtro === "pasajero" ? "bg-blue-900" : "bg-gray-100"}`}
        >
          <Text className={filtro === "pasajero" ? "text-white font-semibold" : "text-gray-600"}>Como Pasajero</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFiltro("conductor")}
          className={`px-4 py-2 rounded-full mx-1 ${filtro === "conductor" ? "bg-blue-900" : "bg-gray-100"}`}
        >
          <Text className={filtro === "conductor" ? "text-white font-semibold" : "text-gray-600"}>Como Conductor</Text>
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
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">No hay viajes recientes</Text>
              <Text className="text-gray-500 text-center px-6">Aún no tienes viajes completados en tu historial.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mb-4 relative">
              <View className="absolute z-10 top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">
                  {item.rol === "conductor" ? "🚗 Conductor" : "🧑‍🤝‍🧑 Pasajero"}
                </Text>
              </View>
              <DriverCard
                viaje={{
                  ...item,
                  asientos_totales: 4,
                  conductor: {
                    ...item.conductor,
                    usuario: {
                      ...item.conductor.usuario,
                      total_viajes: item.conductor.usuario.viajes_completados || 0,
                    }
                  }
                }}
                onPress={() => {}}
                onVerPerfil={(id) => navigation.navigate("PerfilPublico", { usuarioId: id })}
                estadoSolicitud="completado"
              />
            </View>
          )}
        />
      )}

      <Footer navigation={navigation} />
    </View>
  );
};

export default HistoryScreen;
