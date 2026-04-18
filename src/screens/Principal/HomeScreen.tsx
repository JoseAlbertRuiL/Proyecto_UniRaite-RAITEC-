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
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import DriverCard from '../../components/driverCard';
import EmergencyButton from "../../components/EmergencyButton";


const StartScreen = ({ navigation }: any) => {
const handleStart = () => {
    // Aqui va el consumo de la API
    console.log('Start:');
    // Implementar lógica de autenticación y manejo de errores
  };


return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      <Header navigation={navigation} />

          <KeyboardAvoidingView // Asegura que el teclado no oculte los campos de texto
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Ajusta el comportamiento según el sistema operativo
            className="flex-1"
          >
            <ScrollView // Permite que el contenido sea scrollable cuando el teclado está abierto
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              className="px-6"
            >

              {/*Mapa*/}
              <View className="w-full h-64 bg-green-200 rounded-lg mb-6" />

              {/* Botones de mapa */}
              <View className="flex-row justify-between mb-6">
                <TouchableOpacity className="bg-blue-600 rounded-lg py-3 px-6"
                onPress={() => navigation.navigate("Map")}>
                  <Text className="text-white font-bold">Establecer ruta cercana al hogar</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-green-500 rounded-lg py-3 px-6">
                  <Text className="text-white font-bold">Ofrecer Viaje</Text>
                </TouchableOpacity>
              </View>

              {/* Logo/Título */}
              <View className="items-center justify-center flex-1 mb-12">
                <Text className="text-4xl font-bold text-blue-900 tracking-wider mb-2">
                  UNIRAITE
                </Text>

                {/* Divider */}
                <View className="flex-row items-center mb-6">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="mx-4 text-sm text-gray-500">Conductores</Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>

                <DriverCard/>
              </View>
    
                {/* Divider */}
                <View className="flex-row items-center mb-6">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="mx-4 text-sm text-gray-500">o</Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>

              

                    </ScrollView>
                      </KeyboardAvoidingView>

                      <EmergencyButton />

      <Footer navigation={navigation} />
                    </View>
  );
};

export default StartScreen;