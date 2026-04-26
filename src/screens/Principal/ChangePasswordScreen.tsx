// src/screens/Principal/ChangePasswordScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { orpc } from "../../services/api/apiClient";

const ChangePasswordScreen = ({ navigation, route }: any) => {
  const { email } = route.params;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const cambiarPassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await orpc.auth.resetPassword({ correo_inst: email, newPassword: password });
      Alert.alert("Éxito", "Contraseña actualizada correctamente", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      <Text className="text-4xl font-bold text-blue-900 text-center mt-4">
        UNIRAITE
      </Text>
      <Text className="text-gray-500 text-center mb-8">Nueva contraseña</Text>

      <Text className="text-gray-700 mt-4">Nueva contraseña</Text>
      <View className="flex-row items-center border border-gray-300 rounded-xl mt-1 bg-gray-50">
        <TextInput
          className="flex-1 p-4"
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          className="px-4"
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text className="text-blue-900 font-semibold">
            {showPassword ? "Ocultar" : "Mostrar"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="text-gray-700 mt-4">Confirmar contraseña</Text>
      <View className="flex-row items-center border border-gray-300 rounded-xl mt-1 bg-gray-50">
        <TextInput
          className="flex-1 p-4"
          placeholder="••••••••"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          className="px-4"
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Text className="text-blue-900 font-semibold">
            {showConfirmPassword ? "Ocultar" : "Mostrar"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className={`bg-blue-900 p-4 rounded-xl mt-8 ${loading ? "opacity-50" : ""}`}
        onPress={cambiarPassword}
        disabled={loading}
      >
        <Text className="text-white text-center font-bold text-lg">
          {loading ? "Actualizando..." : "Cambiar contraseña"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 p-4"
        onPress={() => navigation.navigate("Login")}
      >
        <Text className="text-gray-500 text-center">Volver al login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ChangePasswordScreen;
