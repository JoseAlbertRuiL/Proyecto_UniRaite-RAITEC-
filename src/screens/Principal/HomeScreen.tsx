import React, { useState, useEffect } from "react";
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
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import DriverCard from "../../components/driverCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../services/api";
import EmergencyButton from "../../components/EmergencyButton";

const StartScreen = ({ navigation }: any) => {
  const [viajes, setViajes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarViajes = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const perfilRes = await fetch(`${API_URL}/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const perfilData = await perfilRes.json();
      const usuarioActualId = perfilData.user?.id_usuario;
      console.log("Usuario actual ID:", usuarioActualId); // ← Verifica

      const viajesRes = await fetch(`${API_URL}/viajes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const viajesData = await viajesRes.json();
      console.log("Todos los viajes:", viajesData.viajes); // ← Verifica

      if (viajesData.success) {
        const viajesFiltrados = viajesData.viajes.filter((viaje: any) => {
          console.log(
            "Viaje conductor ID:",
            viaje.conductor.usuario?.id_usuario,
          ); // ← Verifica
          return viaje.conductor.usuario?.id_usuario !== usuarioActualId;
        });
        console.log("Viajes filtrados:", viajesFiltrados.length); // ← Verifica
        setViajes(viajesFiltrados);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const handleOfrecerViaje = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate("Login");
        return;
      }

      const res = await fetch(`${API_URL}/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.user?.es_conductor) {
        navigation.navigate("PublicarViaje");
      } else {
        navigation.navigate("Licencia");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo verificar tu información.");
    }
  };

  const handleSolicitarViaje = (viajeId: number) => {
    navigation.navigate("SolicitarViaje", { viajeId });
  };

  const handleVerPerfil = (usuarioId: string) => {
    console.log("Click en Ver Perfil - ID:", usuarioId);
    Alert.alert("Prueba", `Ver perfil del usuario: ${usuarioId}`);
    // navigation.navigate("PerfilPublico", { usuarioId });
  };

  const onRefresh = () => {
    setRefrescando(true);
    cargarViajes();
  };

  useEffect(() => {
    cargarViajes();
  }, []);

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: StatusBar.currentHeight || 0 }}
    >
      <Header navigation={navigation} />

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
            <TouchableOpacity
              className="bg-blue-600 rounded-lg py-3 px-4 flex-1 mr-2"
              onPress={() => navigation.navigate("Map")}
            >
              <Text className="text-white font-bold text-center text-sm">
                Establecer ruta
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-green-500 rounded-lg py-3 px-4 flex-1 ml-2"
              onPress={handleOfrecerViaje}
            >
              <Text className="text-white font-bold text-center text-sm">
                Ofrecer Viaje
              </Text>
            </TouchableOpacity>
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

      <EmergencyButton />
      <Footer navigation={navigation} />
    </View>
  );
};

export default StartScreen;
