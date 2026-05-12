// src/screens/Principal/ForgetPasswordScreen.tsx
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
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { orpc } from "../../services/api/apiClient";
import { useBackHandler } from "../../hooks/useBackHandler";

const ForgetPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useBackHandler(navigation, "normal");

  const enviarCodigo = async () => {
    if (!email) {
      Alert.alert("Error", "Ingresa tu correo institucional");
      return;
    }

    setLoading(true);
    try {
      await orpc.auth.forgotPassword({ correo_inst: email });
      Alert.alert("Éxito", "Código enviado a tu correo");
      navigation.navigate("Code", { email });
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", error?.message || "Correo no registrado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper hasFooter={false}>
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
    </ScreenWrapper>
  );
};

export default ForgetPasswordScreen;
