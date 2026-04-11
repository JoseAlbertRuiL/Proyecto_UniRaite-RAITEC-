import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { API_URL } from "../../services/api";

const CodeForgetPasswordScreen = ({ navigation, route }: any) => {
  const { email } = route.params;
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const verificarCodigo = async () => {
    if (!codigo || codigo.length !== 6) {
      Alert.alert("Error", "Ingresa el código de 6 dígitos");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_inst: email, codigo: codigo }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.navigate("ChangePassword", { email: email });
      } else {
        Alert.alert("Error", data.error || "Código incorrecto");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo verificar el código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      <Text className="text-4xl font-bold text-blue-900 text-center mt-4">
        UNIRAITE
      </Text>
      <Text className="text-gray-500 text-center mb-8">Verificar código</Text>

      <Text className="text-gray-700 text-center mb-4">
        Te enviamos un código a {email}
      </Text>

      <TextInput
        className="border border-gray-300 rounded-xl p-4 text-center text-2xl tracking-widest"
        placeholder="000000"
        value={codigo}
        onChangeText={setCodigo}
        keyboardType="numeric"
        maxLength={6}
      />

      <TouchableOpacity
        className={`bg-blue-900 p-4 rounded-xl mt-8 ${loading ? "opacity-50" : ""}`}
        onPress={verificarCodigo}
        disabled={loading}
      >
        <Text className="text-white text-center font-bold text-lg">
          {loading ? "Verificando..." : "Verificar código"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 p-4"
        onPress={() => navigation.navigate("Forget")}
      >
        <Text className="text-gray-500 text-center">
          ¿No recibiste el código? Reenviar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CodeForgetPasswordScreen;
