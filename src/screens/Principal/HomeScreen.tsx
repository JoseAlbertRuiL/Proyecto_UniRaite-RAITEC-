// src/screens/Principal/HomeScreen.tsx

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
  Modal,
  Image,
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import DriverCard from "../../components/driverCard";
import { getPerfil, getUsuarioById } from "../../services/auth/authService";
import { listarViajes } from "../../services/trip/tripService";
import { BASE_URL, orpc } from "../../services/api/apiClient";
import EmergencyButton from "../../components/EmergencyButton";

const StartScreen = ({ navigation }: any) => {
  const [viajes, setViajes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<any>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);

  const cargarViajes = async () => {
    try {
      const perfilData = await getPerfil();
      const usuarioActualId = perfilData.user?.id_usuario;

      const viajesData = await listarViajes();

      if (viajesData.success) {
        const viajesFiltrados = viajesData.viajes.filter(
          (viaje: any) => viaje.conductor.usuario?.id_usuario !== usuarioActualId,
        );
        setViajes(viajesFiltrados);
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
      if (data.success) {
        setPerfilSeleccionado(data.user);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cargar el perfil");
    } finally {
      setCargandoPerfil(false);
    }
  };

  const handleOfrecerViaje = async () => {
    try {
      const data = await getPerfil();
      if (data.user?.es_conductor) {
        navigation.navigate("PublicarViaje");
      } else {
        navigation.navigate("Licencia");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo verificar tu información.");
    }
  };

  // En src/screens/Principal/HomeScreen.tsx
  const handleSolicitarViaje = async (viajeId: number) => {
    try {
      const data = await orpc.viajes.solicitar({ viajeId });
      if (data.success) {
        Alert.alert("¡Solicitud enviada!", "Espera a que el conductor acepte.");
      }
    } catch (error: any) {
      // Si ya tienes match o ya lo solicitaste, entra al chat directamente
      if (error.message.includes("Ya has solicitado") || error.code === "CONFLICT") {
        navigation.navigate("Chat", { idViaje: viajeId });
      } else {
        Alert.alert("Error", error.message);
      }
    }
  };
  const onRefresh = () => {
    setRefrescando(true);
    cargarViajes();
  };

  useEffect(() => {
    cargarViajes();
  }, []);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      <Header navigation={navigation} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
        >
          <View className="w-full h-48 bg-green-200 rounded-lg mb-4" />

          <View className="flex-row justify-between mb-6">
            <TouchableOpacity
              className="bg-blue-600 rounded-lg py-3 px-4 flex-1 mr-2"
              onPress={() => navigation.navigate("Map")}
            >
              <Text className="text-white font-bold text-center text-sm">Establecer ruta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-green-500 rounded-lg py-3 px-4 flex-1 ml-2"
              onPress={handleOfrecerViaje}
            >
              <Text className="text-white font-bold text-center text-sm">Ofrecer Viaje</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center justify-center mb-12">
            <Text className="text-4xl font-bold text-blue-900 tracking-wider mb-2">UNIRAITE</Text>

            <View className="flex-row items-center mb-6 w-full">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-sm text-gray-500">Viajes disponibles</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {cargando ? (
              <ActivityIndicator size="large" color="#1e3a8a" />
            ) : viajes.length === 0 ? (
              <Text className="text-gray-500 text-center">No hay viajes disponibles</Text>
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

      {/* Modal de perfil flotante */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
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
                      source={{ uri: `${BASE_URL}/uploads/perfiles/${perfilSeleccionado.foto_perfil}` }}
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
                  <Text className="text-gray-900 font-semibold">{perfilSeleccionado?.carrera || "No especificada"}</Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 mt-2">
                  <Text className="text-gray-500 text-xs">Universidad</Text>
                  <Text className="text-gray-900 font-semibold">TecNM Campus Morelia</Text>
                </View>

                <View className="bg-gray-50 rounded-xl p-3 mt-2">
                  <Text className="text-gray-500 text-xs">Reputación</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-yellow-500 text-lg mr-1">★</Text>
                    <Text className="text-gray-900 font-semibold text-lg">
                      {perfilSeleccionado?.reputacion_promedio?.toFixed(1) || "Nuevo"}
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
