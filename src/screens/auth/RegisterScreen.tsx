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


const RegisterScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [firstName, setFirstName] = useState('');
      const [lastName, setLastName] = useState('');
      const [lastName2, setLastName2] = useState('');
      const [controlNumber, setControlNumber] = useState('');
    
      const handleRegister = () => {
        // TODO: Implementar lógica de login
        console.log('Register:', email, password, firstName, lastName, lastName2, controlNumber);
        // navigation.navigate('Home'); // ← Descomentar cuando funcione
      };

    return(
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

                    {/* Nombre */}
                    <View className="mb-5">
                      <Text className="text-sm font-semibold text-gray-800 mb-2">
                        Nombre
                      </Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                        placeholder="Nombre"
                        placeholderTextColor="#9CA3AF"
                        value={firstName}
                        onChangeText={setFirstName}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    
                    {/* Apellido Paterno */}
                    <View className="mb-5">
                      <Text className="text-sm font-semibold text-gray-800 mb-2">
                        Apellido materno
                      </Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                        placeholder="Apellido Paterno"
                        placeholderTextColor="#9CA3AF"
                        value={lastName}
                        onChangeText={setLastName}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    {/* Apellido Materno*/}
                    <View className="mb-5">
                      <Text className="text-sm font-semibold text-gray-800 mb-2">
                        Apellido Materno
                      </Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                        placeholder="Apellido Materno"
                        placeholderTextColor="#9CA3AF"
                        value={lastName2}
                        onChangeText={setLastName2}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
        
                    {/* Número de control */}
                    <View className="mb-5">
                      <Text className="text-sm font-semibold text-gray-800 mb-2">
                        Número de control
                      </Text>
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                        placeholder="Número de control"
                        placeholderTextColor="#9CA3AF"
                        value={controlNumber}
                        onChangeText={setControlNumber}
                        keyboardType="numeric"
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
        
        
                    {/* Botón de registro */}
                    <TouchableOpacity
                      className="bg-blue-900 rounded-xl py-4 items-center mb-6 shadow-lg"
                      onPress={handleRegister}
                      activeOpacity={0.8}
                    >
                      <Text className="text-white text-base font-semibold">
                        Registrar
                      </Text>
                    </TouchableOpacity>
        
                    {/* Divider */}
                    <View className="flex-row items-center mb-6">
                      <View className="flex-1 h-px bg-gray-200" />
                      <View className="flex-1 h-px bg-gray-200" />
                    </View>
          
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
    );
};

export default RegisterScreen;