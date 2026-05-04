// src/screens/Principal/PerfilPublicoScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import { getUsuarioById } from "../../services/auth/authService";
import { BASE_URL } from "../../services/api/apiClient";
import HeaderBack from "../../components/common/HeaderBack";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useBackHandler } from "../../hooks/useBackHandler";

const PerfilPublicoScreen = ({ navigation, route }: any) => {
  const { usuarioId } = route.params;
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useBackHandler(navigation, "normal");

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const data = await getUsuarioById(usuarioId);
        if (data.success) setPerfil(data.user);
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
    <ScreenWrapper hasFooter={false}>
      <HeaderBack navigation={navigation} title="Perfil" />

      <ScrollView className="px-6 pt-6">
        {/* Foto de perfil */}
        <View className="items-center mb-6">
          {perfil?.foto_perfil ? (
            <Image
              source={{
                uri: perfil.foto_perfil,
              }}
              className="w-32 h-32 rounded-full"
            />
          ) : (
            <View className="w-32 h-32 bg-gray-300 rounded-full items-center justify-center">
              <Text className="text-5xl">👤</Text>
            </View>
          )}
        </View>

        <Text className="text-2xl font-bold text-center text-gray-900 mb-2">
          {perfil?.nombre} {perfil?.apellido_paterno} {perfil?.apellido_materno}
        </Text>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-gray-500 text-sm">Carrera</Text>
          <Text className="text-gray-900 font-semibold">
            {perfil?.carrera || "No especificada"}
          </Text>
        </View>

        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-gray-500 text-sm">Número de control</Text>
          <Text className="text-gray-900 font-semibold">
            {perfil?.num_control || "No disponible"}
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
    </ScreenWrapper>
  );
};

export default PerfilPublicoScreen;
