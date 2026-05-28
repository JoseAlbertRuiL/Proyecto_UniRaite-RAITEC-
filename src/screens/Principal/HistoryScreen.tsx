import React, { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import DriverCard from "../../components/driverCard";
import { useHistorialPasajero, useHistorialConductor } from "../../hooks/queries/useViajes";
import { useSocketInvalidator } from "../../hooks/useSocketInvalidator";
import { useBackHandler } from "../../hooks/useBackHandler";

const HistoryScreen = ({ navigation }: any) => {
  useBackHandler(navigation, "normal");
  useSocketInvalidator();

  const { data: dataPasajero, isLoading: loadingPasajero, refetch: refetchPasajero } = useHistorialPasajero();
  const { data: dataConductor, isLoading: loadingConductor, refetch: refetchConductor } = useHistorialConductor();
  const [filtro, setFiltro] = useState<"todos" | "pasajero" | "conductor">("todos");

  const isLoading = loadingPasajero || loadingConductor;

  let viajes: any[] = [];
  if (dataPasajero?.success) {
    viajes.push(...dataPasajero.viajes.map((v: any) => ({ ...v, rol: "pasajero" })));
  }
  if (dataConductor?.success) {
    viajes.push(...dataConductor.viajes.map((v: any) => ({ ...v, rol: "conductor" })));
  }
  viajes.sort((a, b) => new Date(b.fecha_hora_salida).getTime() - new Date(a.fecha_hora_salida).getTime());

  const onRefresh = () => {
    refetchPasajero();
    refetchConductor();
  };

  const viajesFiltrados = viajes.filter(v => filtro === "todos" || v.rol === filtro);

  return (
    <ScreenWrapper hasFooter={true}>
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

      {isLoading ? (
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
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-10 mt-10">
              <Text className="text-5xl mb-4">📭</Text>
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">No hay viajes recientes</Text>
              <Text className="text-gray-500 text-center px-6">Aún no tienes viajes completados en tu historial.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const capacidadPasajeros = item.capacidad_pasajeros ?? item.conductor?.capacidad_pasajeros ?? 4;
            const asientosOfrecidos = item.asientos_ofrecidos > 0
              ? item.asientos_ofrecidos
              : (item.capacidad_pasajeros ?? item.conductor?.capacidad_pasajeros ?? 4);
            const asientosOcupados = item.pasajeros_confirmados != null
              ? item.pasajeros_confirmados
              : Math.max(0, asientosOfrecidos - item.asientos_disponibles);

            const estadoViaje = item.viajes_activos?.[0]?.estado_trayecto;
            const motivoCancelacion = item.historial?.[0]?.motivo;
            const esCancelado = estadoViaje === 'cancelado';

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
                    asientos_ofrecidos: asientosOfrecidos,
                    asientos_ocupados: asientosOcupados,
                    capacidad_pasajeros: capacidadPasajeros,
                    conductor: {
                      ...item.conductor,
                      modelo: item.vehiculo_modelo ?? item.conductor?.modelo,
                      color: item.vehiculo_color ?? item.conductor?.color,
                      placas: item.vehiculo_placas ?? item.conductor?.placas,
                      usuario: {
                        ...item.conductor.usuario,
                        total_viajes: item.conductor.usuario.viajes_completados || 0,
                      }
                    }
                  }}
                  onPress={() => {}}
                  onVerPerfil={(id) => navigation.navigate("PerfilPublico", { usuarioId: id })}
                  estadoSolicitud={esCancelado ? "cancelado" : "completado"}
                  motivo={motivoCancelacion}
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
