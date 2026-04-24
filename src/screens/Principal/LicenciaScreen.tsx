// src/screens/Principal/LicenciaScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import HeaderBack from "../../components/common/HeaderBack";

const LicenciaScreen = ({ navigation }: any) => {
  const [fotoLicencia, setFotoLicencia] = useState<string | null>(null);

  const seleccionarFoto = () => {
    Alert.alert("Subir licencia", "¿Cómo quieres subir la imagen?", [
      { text: "Cancelar", style: "cancel" },
      { text: "🖼️ Elegir de galería", onPress: elegirDeGaleria },
      { text: "📷 Tomar foto", onPress: tomarFoto },
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
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setFotoLicencia(result.assets[0].uri);
  };

  const elegirDeGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso", "Necesitamos acceso a la galería");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setFotoLicencia(result.assets[0].uri);
  };

  const handleSiguiente = () => {
    if (!fotoLicencia) {
      Alert.alert(
        "Foto requerida",
        "Debes subir tu licencia de conducir para continuar.",
      );
      return;
    }
    navigation.navigate("Circulacion", { fotoLicencia });
  };

  const handleCancelar = () => {
    Alert.alert(
      "Cancelar registro",
      "¿Seguro que quieres cancelar? No se activará el modo conductor.",
      [
        { text: "Continuar registro", style: "cancel" },
        { text: "Sí, cancelar", onPress: () => navigation.navigate("Home") },
      ],
    );
  };

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: StatusBar.currentHeight || 0 }}
    >
      <HeaderBack navigation={navigation} />

      <ScrollView
        className="px-6 pt-6"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <Text className="text-2xl font-bold text-blue-900 mb-1">
          Licencia de Conducir
        </Text>
        <Text className="text-gray-500 mb-2">
          Paso 1 de 2 — Verificación de conductor
        </Text>

        {/* Divider */}
        <View className="h-px bg-gray-200 mb-6" />

        {/* Explicación */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <Text className="text-blue-900 font-semibold mb-1">
            ¿Por qué pedimos esto?
          </Text>
          <Text className="text-blue-800 text-sm">
            Para cumplir con las leyes de tránsito en México y garantizar la
            seguridad de todos los estudiantes, necesitamos verificar que
            cuentes con una licencia de conducir vigente.
          </Text>
        </View>

        {/* Área de foto */}
        <Text className="text-sm font-semibold text-gray-800 mb-2">
          Foto de tu licencia *
        </Text>
        <TouchableOpacity
          className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 items-center mb-6"
          onPress={seleccionarFoto}
          activeOpacity={0.7}
        >
          {fotoLicencia ? (
            <View className="items-center w-full">
              <Image
                source={{ uri: fotoLicencia }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
              <Text className="text-green-600 font-semibold mt-3">
                ✓ Foto cargada correctamente
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                Toca para cambiarla
              </Text>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-5xl mb-3">🪪</Text>
              <Text className="text-gray-600 font-semibold">
                Subir licencia de conducir
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                Toca para tomar foto o elegir de galería
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Consejo */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-8">
          <Text className="text-yellow-800 text-sm">
            💡 Asegúrate de que la foto sea legible y que se vean claramente tus
            datos y la fecha de vigencia.
          </Text>
        </View>

        {/* Botones */}
        <TouchableOpacity
          className="bg-blue-900 rounded-xl py-4 items-center mb-3 shadow-lg"
          onPress={handleSiguiente}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold">
            Siguiente →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-200 rounded-xl py-4 items-center mb-12"
          onPress={handleCancelar}
          activeOpacity={0.8}
        >
          <Text className="text-gray-600 text-base font-semibold">
            Cancelar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default LicenciaScreen;
