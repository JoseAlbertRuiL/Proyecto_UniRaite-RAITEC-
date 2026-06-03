import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { useLoginMutation } from "../../hooks/mutations/useAuthMutations";
import { useBackHandler } from "../../hooks/useBackHandler";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { connectSocket } from "../../services/socket";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { BASE_URL } from "../../services/api/apiClient";

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLoginMutation();

  useBackHandler(navigation, "login");

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      alert("Por favor ingresa tu correo.");
      return;
    }
    if (!emailRegex.test(email)) {
      alert("Por favor ingresa un correo válido.");
      return;
    }
    if (!password) {
      alert("Por favor ingresa tu contraseña.");
      return;
    }
    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    loginMutation.mutate(
      { correo_inst: email, password },
      {
        onSuccess: async () => {
          await connectSocket();
          navigation.navigate("Home");
        },
        onError: (error: any) => {
          const errorMessage = error?.message || error?.toString() || "Error desconocido en el login";
          alert(`Error: ${errorMessage}`);
        },
      }
    );
  };

  return (
    <ScreenWrapper hasFooter={false}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="px-6"
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
          <View className="items-center justify-center flex-1 mb-12">
            <Image
                      source={require("../../images/Logtype.png")}
                      className="w-40 h-40 mt-16 mb-4"
                      resizeMode="contain"
                    />

            <Text className="text-4xl font-bold text-blue-900 tracking-wider mb-2">
              UNIRAITE
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              Viaja seguro con tu comunidad
            </Text>
          </View>

          <View className="w-full pb-8">
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                Correo
              </Text>
              <TextInput
                testID="input-correo"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="Ingresa tu correo"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                Contraseña
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl">
                <TextInput
                  testID="input-contrasena"
                  className="flex-1 px-4 py-4 text-base text-gray-900"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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
            </View>

            <TouchableOpacity
              className="self-end mb-6"
              onPress={() => navigation.navigate("Forget")}
              activeOpacity={0.8}
            >
              <Text className="text-sm text-blue-900 font-medium">
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`rounded-xl py-4 items-center mb-6 shadow-lg ${
                loginMutation.isPending ? 'bg-gray-400' : 'bg-blue-900'
              }`}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">
                {loginMutation.isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-sm text-gray-500">o</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <TouchableOpacity
              className="bg-white border-2 border-blue-900 rounded-xl py-4 items-center"
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.8}
            >
              <Text className="text-blue-900 text-base font-semibold">
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
};

export default LoginScreen;
