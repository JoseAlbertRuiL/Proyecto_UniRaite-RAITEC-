import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { useBackHandler } from "../../hooks/useBackHandler";
import { orpc } from "../../services/api/apiClient";

const ForgetPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");

  useBackHandler(navigation, "normal");

  const forgotMutation = useMutation({
    mutationFn: ({ correo_inst }: { correo_inst: string }) =>
      orpc.auth.forgotPassword({ correo_inst }),
  });

  const enviarCodigo = async () => {
    if (!email) {
      Alert.alert("Error", "Ingresa tu correo institucional");
      return;
    }

    forgotMutation.mutate(
      { correo_inst: email },
      {
        onSuccess: () => {
          Alert.alert("Éxito", "Código enviado a tu correo");
          navigation.navigate("Code", { email });
        },
        onError: (error: any) => {
          console.log(error);
          Alert.alert("Error", error?.message || "Correo no registrado");
        },
      }
    );
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
          className={`bg-blue-900 p-4 rounded-xl mt-8 ${forgotMutation.isPending ? "opacity-50" : ""}`}
          onPress={enviarCodigo}
          disabled={forgotMutation.isPending}
        >
          <Text className="text-white text-center font-bold text-lg">
            {forgotMutation.isPending ? "Enviando..." : "Enviar código"}
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
