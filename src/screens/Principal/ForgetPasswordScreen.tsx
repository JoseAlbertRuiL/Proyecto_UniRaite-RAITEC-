import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { API_URL } from "../../services/api";

const ForgetPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const enviarCodigo = async () => {
    if (!email) {
      Alert.alert("Error", "Ingresa tu correo institucional");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo_inst: email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Éxito", "Código enviado a tu correo");
        navigation.navigate("Code", { email: email });
      } else {
        Alert.alert("Error", data.error || "Correo no registrado");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      <Text className="text-4xl font-bold text-blue-900 text-center mt-4">
        UNIRAITE
      </Text>
      <Text className="text-gray-500 text-center mb-8">
        Recuperar contraseña
      </Text>

      <Text className="text-gray-700 mt-4">Correo institucional</Text>
      <TextInput
        className="border border-gray-300 rounded-xl p-4 mt-1 bg-gray-50"
        placeholder="lXXXXXXXX@morelia.tecnm.mx"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        className={`bg-blue-900 p-4 rounded-xl mt-8 ${loading ? "opacity-50" : ""}`}
        onPress={enviarCodigo}
        disabled={loading}
      >
        <Text className="text-white text-center font-bold text-lg">
          {loading ? "Enviando..." : "Enviar código"}
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

export default ForgetPasswordScreen;
