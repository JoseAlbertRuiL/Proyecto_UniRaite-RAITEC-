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

const ForgetPasswordScreen  = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    
    const handleRecover = () => {
        // Aqui va el consumo de la API para la recuperacion del Usuario
    console.log('Recover:', email);
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

                    {/* Solicitud */} {/* Aquí es donde se encuentran los campos de correo, así como los botones de solicitar y regresar a login */}
                    <View className="w-full pb-8">
                        <View className="mb-5 items-center">
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                            Ingresa el Correo Electronico que desea restablecer la contraseña.
                            </Text>
                        </View>

                        {/* Correo */}
                        <View className="mb-5">
                            <Text className="text-sm font-semibold text-gray-800 mb-2">
                            Correo
                            </Text>
                            <TextInput
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

                        {/* Divider */}
                        <View className="flex-row items-center mb-6">
                        </View>

                        {/* Boton para enviar el codigo */}
                        <TouchableOpacity
                            className="bg-blue-900 rounded-xl py-4 items-center mb-6 shadow-lg"
                            onPress={() => navigation.navigate('Code')}
                            activeOpacity={0.8}

                            > {/* Navega a la pantalla del codigo */}
                            <Text className="text-white text-base font-semibold">
                                Solicitar Codigo. ✉️➡️
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
                            className="bg-white border-2 border-red-500 rounded-xl py-4 items-center"
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.8}

                            > {/* Navega a la pantalla de login */}
                            <Text className="text-red-500 text-base font-semibold">
                                Regresar al Login ↩️
                            </Text>
                        </TouchableOpacity>

                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    ); 
};

export default ForgetPasswordScreen;