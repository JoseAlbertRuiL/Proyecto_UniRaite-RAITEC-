import React from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useUsuarioById } from "../../hooks/queries/usePerfil";
import HeaderBack from "../../components/common/HeaderBack";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useBackHandler } from "../../hooks/useBackHandler";

const PerfilPublicoScreen = ({ navigation, route }: any) => {
  const { usuarioId } = route.params;
  const { data, isLoading } = useUsuarioById(usuarioId);
  const perfil = data?.user;

  useBackHandler(navigation, "normal");

  if (isLoading) {
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
