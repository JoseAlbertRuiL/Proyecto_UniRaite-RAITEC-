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

const CodeForgetPasswordScreen  = ({ navigation }: any) => {
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');

    
    const handleRecover = () => {
        // Aqui va el consumo de la API para la recuperacion del Usuario
    console.log('Recover:', code);
        // Recolecta la nueva contraseña
    console.log('Recover:', password);
    
        // Implementar la recuperacion de autenticación y manejo de errores
    };


    return(
        <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
            <KeyboardAvoidingView // Asegura que el teclado no oculte los campos de texto
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Ajusta el comportamiento según el sistema operativo
                className="flex-1"
            >
                <ScrollView // Permite que el contenido sea scrollable cuando el teclado está abierto
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    className="px-6"
                >

                    {/* Logo/Título */}
                    <View className="items-center justify-center flex-1 mb-12">
                        <Text className="text-6xl mb-4">¿📍? . . . . . 🚗</Text>
                        <Text className="text-4xl font-bold text-blue-900 tracking-wider mb-2">
                            UNIRAITE
                        </Text>
                        <Text className="text-sm text-gray-500 text-center">
                            Viaja seguro con tu comunidad
                        </Text>
                    </View>

                    {/* Formulario */} {/* Aquí es donde se encuentran los campos de codigo y contraseña, así como los botones modificar correo y cambiar contraseña */}
                    <View className="w-full pb-8">

                        {/* Codigo */}
                        <View className="mb-5">
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                            Ingrese el codigo.
                            </Text>
                            <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900"
                            placeholder=" "
                            placeholderTextColor="#9CA3AF"
                            value={code}
                            onChangeText={setCode}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            />
                        </View>

                        {/* Linea de volver enviar codigo */}
                        <TouchableOpacity 
                            className="self-end items-center mb-6"
                            onPress={() => navigation.navigate('Forget')}
                            activeOpacity={0.8}
                            >
                            <Text className="text-sm text-blue-900 font-medium">
                            Enviar de nuevo el codigo.
                            </Text>
                        </TouchableOpacity>

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

                        {/* Verificar Contraseña */}
                        <View className="mb-5">
                        <Text className="text-sm font-semibold text-gray-800 mb-2">
                            Verifique la contraseña
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

                        {/* Botón para confirmar y regresar a login */}
                        <TouchableOpacity
                            className="bg-blue-900 rounded-xl py-4 mb-6 shadow-lg items-center"
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.8}

                            > {/* Navega a la pantalla de login */}
                            <Text className="text-white text-base font-semibold">
                                Confirmar
                            </Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="flex-row items-center mb-6">
                            <View className="flex-1 h-px bg-gray-200" />
                            <Text className="mx-4 text-sm text-gray-500">o</Text>
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>                        

                        {/* Botón para regresar al login */}
                        <TouchableOpacity
                            className="bg-white border-2 border-gray-500 rounded-xl py-4 items-center"
                            onPress={() => navigation.navigate('Forget')}
                            activeOpacity={0.8}

                            > {/* Navega a la pantalla de login */}
                            <Text className="text-gray-500 text-base font-semibold">
                                Modificar el correo
                            </Text>
                        </TouchableOpacity>

                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    ); 
};

export default CodeForgetPasswordScreen;