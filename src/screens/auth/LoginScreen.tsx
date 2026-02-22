// src/screens/auth/LoginScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Implementar lógica de login
    console.log('Login:', email, password);
    // navigation.navigate('Home'); // ← Descomentar cuando funcione
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          {/* Logo/Título */}
          <View className="items-center justify-center flex-1 mb-12">
            <Text className="text-6xl mb-4">🚗</Text>
            <Text className="text-4xl font-bold text-blue-900 tracking-wider mb-2">
              UNIRAITE
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              Viaja seguro con tu comunidad
            </Text>
          </View>

          {/* Formulario */}
          <View className="w-full pb-8">
            {/* Correo */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                Correo
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="tu@correo.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Contraseña */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-800 mb-2">
                Contraseña
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Olvidé mi contraseña */}
            <TouchableOpacity className="self-end mb-6">
              <Text className="text-sm text-blue-900 font-medium">
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            {/* Botón de login */}
            <TouchableOpacity
              className="bg-blue-900 rounded-xl py-4 items-center mb-6 shadow-lg"
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text className="text-white text-base font-semibold">
                Iniciar Sesión
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-4 text-sm text-gray-500">o</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Botón de registro */}
            <TouchableOpacity
              className="bg-white border-2 border-blue-900 rounded-xl py-4 items-center"
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text className="text-blue-900 text-base font-semibold">
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;