import { KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import Header from '../../components/common/HeaderBack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../services/api';

const PublishTripScreen = ({ navigation }: any) => {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('Tecnológico de Morelia (ITM)');
  const [fecha, setFecha] = useState('Hoy, 17 abr');
  const [hora, setHora] = useState('6:00 AM');
  const [asientos, setAsientos] = useState(4);
  const [precio, setPrecio] = useState('25');
  const [comentario, setComentario] = useState('');

  const [conMusica, setConMusica] = useState(false);
  const [sinParadas, setSinParadas] = useState(true);
  const [soloMujeres, setSoloMujeres] = useState(false);

  const incrementarAsientos = () => {
    if (asientos < 4) setAsientos(asientos + 1);
  };

  const decrementarAsientos = () => {
    if (asientos > 1) setAsientos(asientos - 1);
  };

  const publicarViaje = async () => {
    if (!destino) {
      Alert.alert('Faltan datos', 'Por favor ingresa el destino del viaje.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_URL}/viajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origen,
          destino,
          fecha,
          hora,
          asientos,
          precio: parseFloat(precio),
          con_musica: conMusica,
          solo_mujeres: soloMujeres,
          sin_paradas: sinParadas,
          comentario,
        }),
      });

      const data = await res.json();

      if (data.success) {
        Alert.alert('¡Viaje publicado!', 'Tu viaje ya está disponible para pasajeros.');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'No se pudo publicar el viaje.');
      }
    } catch (error) {
      console.log('Error al publicar viaje:', error);
      Alert.alert('Error', 'Ocurrió un problema. Intenta de nuevo.');
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      <Header navigation={navigation} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-5 gap-5">

          {/* ── Origen / Destino ── */}
          <View className="bg-blue-50 rounded-2xl p-4">
            <View className="flex-row items-stretch gap-3">

              {/* Línea de ruta */}
              <View className="items-center mt-1">
                <View className="w-3 h-3 rounded-full bg-blue-600" />
                <View className="w-0.5 flex-1 bg-gray-300 my-1" style={{ minHeight: 36 }} />
                <View className="w-3 h-3 rounded-full border-2 border-blue-600 bg-white" />
              </View>

              {/* Campos */}
              <View className="flex-1 gap-3">
                <View>
                  <Text className="text-xs text-gray-400 uppercase tracking-wide mb-1">Origen</Text>
                  <TextInput
                    value={origen}
                    onChangeText={setOrigen}
                    className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-200"
                    placeholder="¿Desde dónde sales?"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View>
                  <Text className="text-xs text-gray-400 uppercase tracking-wide mb-1">Destino</Text>
                  <TextInput
                    value={destino}
                    onChangeText={setDestino}
                    className="text-base text-gray-900"
                    placeholder="¿A dónde vas?"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

            </View>
          </View>

          {/* ── Fecha y Hora ── */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Fecha:                                    Hora:</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 flex-row items-center gap-2 border border-gray-200 rounded-xl px-3 py-3"
                onPress={() => {/* abrir date picker */}}
              >
                <Text className="text-sm text-gray-700">{fecha}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center gap-2 border border-gray-200 rounded-xl px-3 py-3"
                onPress={() => {/* abrir time picker */}}
              >
                <Text className="text-sm text-gray-700">{hora}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Asientos disponibles ── */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Lugares disponibles</Text>
            <View className="flex-row items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
              <Text className="text-sm text-gray-700">Asientos Disponibles</Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={decrementarAsientos}
                  className="w-8 h-8 rounded-full border border-blue-600 items-center justify-center"
                >
                  <Text className="text-blue-600 text-lg font-medium leading-none">−</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-900 w-5 text-center">{asientos}</Text>

                <TouchableOpacity
                  onPress={incrementarAsientos}
                  className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center"
                >
                  <Text className="text-white text-lg font-medium leading-none">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Indicador visual de asientos */}
            <View className="flex-row gap-2 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  className={`w-8 h-8 rounded-full border items-center justify-center ${
                    i <= asientos
                      ? 'bg-blue-50 border-blue-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-xs ${i <= asientos ? 'text-blue-600' : 'text-gray-300'}`}>
                    👤
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Precio ── */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Precio por persona</Text>
            <View className="flex-row items-center gap-3 border border-gray-200 rounded-xl px-4 py-3">
              <View className="bg-blue-50 rounded-lg px-2 py-1">
                <Text className="text-blue-600 font-bold text-base">$</Text>
              </View>
              <TextInput
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
                className="flex-1 text-2xl font-bold text-gray-900"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
              />
              <Text className="text-xs text-gray-400">MXN / persona</Text>
            </View>
          </View>


          {/* ── Preferencias ── */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Detalles del Viaje</Text>
            <View className="border border-gray-200 rounded-xl overflow-hidden">

              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
                <Text className="text-sm text-gray-700">🎵  Música en el viaje</Text>
                <Switch
                  value={conMusica}
                  onValueChange={setConMusica}
                  trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                  thumbColor="white"
                />
              </View>

              <View className="flex-row justify-between items-center px-4 py-3">
                <Text className="text-sm text-gray-700">👩  Solo mujeres</Text>
                <Switch
                  value={soloMujeres}
                  onValueChange={setSoloMujeres}
                  trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                  thumbColor="white"
                />
              </View>

              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
                <Text className="text-sm text-gray-700">🛑  Sin paradas</Text>
                <Switch
                  value={sinParadas}
                  onValueChange={setSinParadas}
                  trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                  thumbColor="white"
                />
              </View>

            </View>
          </View>

          {/* ── Comentario ── */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Comentario adicional</Text>
            <TextInput
              value={comentario}
              onChangeText={setComentario}
              multiline
              numberOfLines={3}
              placeholder="Saldre de casa a las 5:45 para evitar tráfico"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700"
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />
          </View>

          {/* ── Botón publicar ── */}
          <TouchableOpacity
            onPress={publicarViaje}
            className="bg-blue-600 rounded-2xl py-4 items-center mb-6"
          >
            <Text className="text-white text-base font-bold">Publicar viaje</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

export default PublishTripScreen;