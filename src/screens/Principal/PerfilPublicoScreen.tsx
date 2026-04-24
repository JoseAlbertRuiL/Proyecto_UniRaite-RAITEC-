import React, { useState, useEffect } from "react";
import { View, Text, Image, ActivityIndicator, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../services/api";
import HeaderBack from "../../components/common/HeaderBack";

const PerfilPublicoScreen = ({ navigation, route }: any) => {
  const { usuarioId } = route.params;
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setPerfil(data.user);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, [usuarioId]);

  if (cargando) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <HeaderBack navigation={navigation} />
      <ScrollView className="px-6 pt-6">
        <View className="items-center mb-6">
          {perfil?.foto_perfil ? (
            <Image
              source={{
                uri: `${API_URL}/uploads/perfiles/${perfil.foto_perfil}`,
              }}
              className="w-32 h-32 rounded-full"
            />
          ) : (
            <View className="w-32 h-32 bg-gray-300 rounded-full items-center justify-center">
              <Text className="text-5xl">👤</Text>
            </View>
          )}
          <Text className="text-2xl font-bold text-gray-900 mt-4">
            {perfil?.nombre} {perfil?.apellido_paterno}
          </Text>
          <View className="flex-row items-center mt-2">
            <Text className="text-yellow-500 mr-1">★</Text>
            <Text className="text-gray-600">
              {perfil?.reputacion_promedio?.toFixed(1) || "Sin calificaciones"}
            </Text>
          </View>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-gray-500 text-sm">Carrera</Text>
          <Text className="text-gray-900 font-semibold">
            {perfil?.carrera || "No especificada"}
          </Text>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-gray-500 text-sm">Universidad</Text>
          <Text className="text-gray-900 font-semibold">
            TecNM Campus Morelia
          </Text>
        </View>

        <View className="bg-gray-50 rounded-xl p-4">
          <Text className="text-gray-500 text-sm">Miembro desde</Text>
          <Text className="text-gray-900 font-semibold">
            {perfil?.created_at
              ? new Date(perfil.created_at).toLocaleDateString("es-MX")
              : "Reciente"}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default PerfilPublicoScreen;
