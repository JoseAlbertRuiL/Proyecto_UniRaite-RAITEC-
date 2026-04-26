import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../../components/common/Header";
import { getPerfil, logout } from "../../services/auth/authService";
import { orpc } from "../../services/api/apiClient";
import { BASE_URL } from "../../services/api/apiClient";

const ConfigPerfilScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<any>(null);
  const [viajesComoConductor, setViajesComoConductor] = useState(0);
  const [viajesComoPasajero, setViajesComoPasajero] = useState(0);
  const [modalFotoVisible, setModalFotoVisible] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    obtenerPerfil();
    obtenerEstadisticas();
  }, []);

  const obtenerPerfil = async () => {
    try {
      const data = await getPerfil();
      setUser(data.user);
    } catch (error) {
      console.log("ERROR al obtener perfil:", error);
      navigation.navigate("Login");
    }
  };

  const obtenerEstadisticas = async () => {
    try {
      const historialConductor = await orpc.viajes.historialConductor();
      if (historialConductor.success) {
        setViajesComoConductor(historialConductor.viajes?.length || 0);
      }

      const solicitudes = await orpc.solicitudes.misSolicitudes?.();
      if (solicitudes?.success) {
        const aceptadas =
          solicitudes.solicitudes?.filter(
            (s: any) => s.estado_solicitud === "aceptada",
          ).length || 0;
        setViajesComoPasajero(aceptadas);
      }
    } catch (error) {
      console.log("Error al obtener estadísticas:", error);
    }
  };

  const cerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, cerrar sesión",
        onPress: async () => {
          await logout();
          navigation.navigate("Login");
        },
        style: "destructive",
      },
    ]);
  };

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a la cámara");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFotoSeleccionada(result.assets[0].uri);
      subirFoto(result.assets[0].uri);
    }
    setModalFotoVisible(false);
  };

  const elegirDeGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a la galería");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFotoSeleccionada(result.assets[0].uri);
      subirFoto(result.assets[0].uri);
    }
    setModalFotoVisible(false);
  };

  const subirFoto = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append("foto_perfil", {
        uri: uri,
        type: "image/jpeg",
        name: "perfil.jpg",
      } as any);

      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/upload/perfil`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.foto_perfil) {
        await orpc.usuarios.actualizarFotoPerfil({
          foto_perfil: data.foto_perfil,
        });
        obtenerPerfil();
        Alert.alert("Éxito", "Foto de perfil actualizada");
      }
    } catch (error) {
      console.error("Error al subir foto:", error);
      Alert.alert("Error", "No se pudo actualizar la foto");
    }
  };

  const fotoUrl = user?.foto_perfil
    ? `${BASE_URL}/uploads/perfiles/${user.foto_perfil}`
    : null;

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: StatusBar.currentHeight || 0 }}
    >
      <Header navigation={navigation} title="Mi Perfil" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Foto de perfil y nombre */}
        <View className="items-center mt-6 mb-4">
          <TouchableOpacity
            onPress={() => setModalFotoVisible(true)}
            activeOpacity={0.8}
          >
            {fotoUrl ? (
              <Image
                source={{ uri: fotoUrl }}
                className="w-28 h-28 rounded-full border-2 border-blue-900"
              />
            ) : (
              <View className="w-28 h-28 bg-gray-300 rounded-full items-center justify-center">
                <Text className="text-5xl">👤</Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full items-center justify-center">
              <Text className="text-white text-xs">✎</Text>
            </View>
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-900 mt-3">
            {user?.nombre} {user?.apellido_paterno?.charAt(0)}.
          </Text>

          <Text className="text-gray-500 text-sm mt-1">
            {user?.carrera || "Carrera no especificada"}
          </Text>

          <View className="flex-row items-center mt-2">
            <Text className="text-yellow-500 text-lg mr-1">★</Text>
            <Text className="text-gray-700 font-semibold">
              {user?.reputacion_promedio?.toFixed(1) || "Nuevo"}
            </Text>
            <Text className="text-gray-400 ml-1">/ 5.0</Text>
          </View>
        </View>

        {/* Estadísticas */}
        <View className="px-6 mt-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Estadísticas
          </Text>

          <View className="flex-row justify-between bg-gray-50 rounded-2xl p-4">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-blue-900">
                {viajesComoConductor}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Viajes como conductor
              </Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-blue-900">
                {viajesComoPasajero}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Viajes como pasajero
              </Text>
            </View>
          </View>
        </View>

        {/* Configuración */}
        <View className="px-6 mt-6 mb-10">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Configuración
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={() => navigation.navigate("EditarPerfil")}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">✏️</Text>
              <Text className="text-base text-gray-700">Editar perfil</Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={() => navigation.navigate("Notificaciones")}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🔔</Text>
              <Text className="text-base text-gray-700">Notificaciones</Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
            onPress={() => navigation.navigate("ContactoEmergencia")}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🆘</Text>
              <Text className="text-base text-gray-700">
                Contacto de emergencia
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4 mt-4"
            onPress={cerrarSesion}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🚪</Text>
              <Text className="text-base text-red-600 font-semibold">
                Cerrar sesión
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para opciones de foto */}
      <Modal
        visible={modalFotoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalFotoVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setModalFotoVisible(false)}
        >
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-center mb-4">
              Foto de perfil
            </Text>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={tomarFoto}
            >
              <Text className="text-2xl mr-3">📷</Text>
              <Text className="text-base text-gray-700">Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={elegirDeGaleria}
            >
              <Text className="text-2xl mr-3">🖼️</Text>
              <Text className="text-base text-gray-700">Elegir de galería</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center py-4 mt-2"
              onPress={() => setModalFotoVisible(false)}
            >
              <Text className="text-2xl mr-3"></Text>
              <Text className="text-base text-red-500">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ConfigPerfilScreen;
