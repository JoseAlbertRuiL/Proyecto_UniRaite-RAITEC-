import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../services/api";
import HeaderBack from "../../components/common/HeaderBack";

const CirculacionScreen = ({ navigation, route }: any) => {
  const modoEdicion  = route.params?.modoEdicion ?? false;
  const fotoLicencia = route.params?.fotoLicencia ?? null;


  const [fotoCirculacion, setFotoCirculacion] = useState<string | null>(null);

  const [modelo, setModelo]                         = useState("");
  const [color, setColor]                           = useState("");
  const [placas, setPlacas]                         = useState("");
  const [capacidadPasajeros, setCapacidadPasajeros] = useState("");

  const [cargando, setCargando] = useState(false);


  const seleccionarFoto = () => {
    Alert.alert("Subir tarjeta de circulación", "¿Cómo quieres subir la imagen?", [
      { text: "Cancelar",             style: "cancel" },
      { text: "🖼️ Elegir de galería", onPress: elegirDeGaleria },
      { text: "📷 Tomar foto",        onPress: tomarFoto },
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
    if (!result.canceled) setFotoCirculacion(result.assets[0].uri);
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
    if (!result.canceled) setFotoCirculacion(result.assets[0].uri);
  };


  const validarCampos = (): boolean => {
    if (!fotoCirculacion) {
      Alert.alert("Foto requerida", "Debes subir tu tarjeta de circulación.");
      return false;
    }
    if (!modelo.trim()) {
      Alert.alert("Campo requerido", "Ingresa el modelo de tu vehículo.");
      return false;
    }
    if (!color.trim()) {
      Alert.alert("Campo requerido", "Ingresa el color de tu vehículo.");
      return false;
    }
    if (!placas.trim()) {
      Alert.alert("Campo requerido", "Ingresa las placas de tu vehículo.");
      return false;
    }
    const capacidad = parseInt(capacidadPasajeros);
    if (!capacidadPasajeros || isNaN(capacidad) || capacidad < 1 || capacidad > 8) {
      Alert.alert(
        "Capacidad inválida",
        "La capacidad debe ser un número entre 1 y 8 pasajeros."
      );
      return false;
    }
    return true;
  };


  const handleRegistrar = async () => {
    if (!validarCampos()) return;
    setCargando(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();

      // Fotos
      if (!modoEdicion) {
        formData.append("foto_licencia", {
          uri: fotoLicencia,
          name: "licencia.jpg",
          type: "image/jpeg",
        } as any);
      }

      formData.append("foto_circulacion", {
        uri: fotoCirculacion,
        name: "circulacion.jpg",
        type: "image/jpeg",
      } as any);

      // Datos del vehículo
      formData.append("modelo",               modelo.trim());
      formData.append("color",                color.trim());
      formData.append("placas",               placas.trim().toUpperCase());
      formData.append("capacidad_pasajeros",  capacidadPasajeros);

      const endpoint = modoEdicion ? `${API_URL}/vehiculo` : `${API_URL}/registro-conductor`;
      
      const response = await fetch(endpoint, {
        method: modoEdicion ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (!modoEdicion) {
          const userStr = await AsyncStorage.getItem("user");
          if (userStr) {
            const userCacheado = JSON.parse(userStr);
            userCacheado.es_conductor = true;
            await AsyncStorage.setItem("user", JSON.stringify(userCacheado));
          }
        }
        
        Alert.alert(
          "¡LISTO!",
          modoEdicion
            ? "Tu vehiculo fue actualizado correctamente."
            : "Tus documentos fueron validados. Ya eres conductor en UNIRAITE.",
          [{ text: "OK", onPress: () => navigation.navigate("ConfigP") }]
        );
      } else {
        Alert.alert("Error", data.error || "Ocurrió un error.");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudo conectar al servidor.");
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    Alert.alert(
      "Cancelar",
      "¿Seguro que quieres cancelar? Se perderán los cambios no guardados.",
      [
        { text: "Continuar", style: "cancel" },
        {
          text: "Sí, cancelar",
          onPress: () => navigation.navigate(modoEdicion ? "ConfigP" : "Home")
        },
      ]
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
          {modoEdicion ? "Actualizar vehículo" : "Tarjeta de Circulación"}
        </Text>
        <Text className="text-gray-500 mb-2">
          {modoEdicion
            ? "Sube la nueva tarjeta de circulación e ingresa los datos del vehículo"
            : "Paso 2 de 2 — Registro del vehículo"}
        </Text>

        <View className="h-px bg-gray-200 mb-6" />

        {/* Foto de tarjeta de circulación */}
        <Text className="text-sm font-semibold text-gray-800 mb-2">
          Foto de tu tarjeta de circulación *
        </Text>
        <TouchableOpacity
          className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-6 items-center mb-6"
          onPress={seleccionarFoto}
          activeOpacity={0.7}
        >
          {fotoCirculacion ? (
            <View className="items-center w-full">
              <Image
                source={{ uri: fotoCirculacion }}
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
              <Text className="text-5xl mb-3">📄</Text>
              <Text className="text-gray-600 font-semibold">
                Subir tarjeta de circulación
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                Toca para tomar foto o elegir de galería
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Divider con título */}
        <View className="flex-row items-center mb-5">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-3 text-sm text-gray-500 font-semibold">
            Datos del vehículo
          </Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Modelo */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-2">
            Modelo *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
            placeholder="Ej: Nissan Versa 2019"
            placeholderTextColor="#9CA3AF"
            value={modelo}
            onChangeText={setModelo}
          />
        </View>

        {/* Color */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-2">
            Color *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
            placeholder="Ej: Blanco"
            placeholderTextColor="#9CA3AF"
            value={color}
            onChangeText={setColor}
          />
        </View>

        {/* Placas */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-gray-800 mb-2">
            Placas *
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
            placeholder="Ej: ABC-123"
            placeholderTextColor="#9CA3AF"
            value={placas}
            onChangeText={(text) => setPlacas(text.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>

        {/* Capacidad de pasajeros */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-800 mb-2">
            Capacidad de pasajeros * (sin contar al conductor)
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
            placeholder="Ej: 4"
            placeholderTextColor="#9CA3AF"
            value={capacidadPasajeros}
            onChangeText={setCapacidadPasajeros}
            keyboardType="numeric"
            maxLength={1}
          />
        </View>

        {/* Consejo */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-8">
          <Text className="text-yellow-800 text-sm">
            💡 Verifica que los datos coincidan exactamente con tu tarjeta
            de circulación. Serán revisados por el equipo de UNIRAITE.
          </Text>
        </View>

        {/* Botones */}
        <TouchableOpacity
          className={`rounded-xl py-4 items-center mb-3 shadow-lg ${
            cargando ? "bg-blue-400" : "bg-blue-900"
          }`}
          onPress={handleRegistrar}
          disabled={cargando}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold">
            {cargando
              ? "Verificando..."
              : modoEdicion
                ? "Actualizar información"
                : "Registrarme como conductor"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-200 rounded-xl py-4 items-center mb-12"
          onPress={handleCancelar}
          disabled={cargando}
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

export default CirculacionScreen;