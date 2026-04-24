import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/common/HeaderBack';
import { API_URL } from '../../services/api';


interface TripForm {
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  asientos: number;
  precio: string;
  comentario: string;

}

const INITIAL_FORM: TripForm = {
  origen: '',
  destino: 'Tecnológico de Morelia (ITM)',
  fecha: 'Hoy, 17 abr',
  hora: '6:00 AM',
  asientos: 4,
  precio: '25',
  comentario: '',

};

const PublishTripScreen = ({ navigation }: any) => {
  const [form, setForm] = useState<TripForm>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = <K extends keyof TripForm>(field: K, value: TripForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const incrementarAsientos = () => {
    if (form.asientos < 4) updateField('asientos', form.asientos + 1);
  };

  const decrementarAsientos = () => {
    if (form.asientos > 1) updateField('asientos', form.asientos - 1);
  };

  const publicarViaje = async () => {
  if (!form.origen.trim()) {
    Alert.alert('Faltan datos', 'Por favor ingresa el origen del viaje.');
    return;
  }
  if (!form.destino.trim()) {
    Alert.alert('Faltan datos', 'Por favor ingresa el destino del viaje.');
    return;
  }
  if (!form.precio || parseFloat(form.precio) <= 0) {
    Alert.alert('Faltan datos', 'Por favor ingresa un precio válido.');
    return;
  }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${API_URL}/viajes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          origen: form.origen,
          destino: form.destino,
          fecha: form.fecha,
          hora: form.hora,
          asientos: form.asientos,
          precio: parseFloat(form.precio),
          comentario: form.comentario,
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      <Header navigation={navigation} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-5 gap-5">

          {/* Origen / Destino */}
          <View className="bg-blue-50 rounded-2xl p-4">
            <View className="flex-row items-stretch gap-3">

              <View className="items-center mt-1">
                <View className="w-3 h-3 rounded-full bg-blue-600" />
                <View className="w-0.5 flex-1 bg-gray-300 my-1" style={{ minHeight: 36 }} />
                <View className="w-3 h-3 rounded-full border-2 border-blue-600 bg-white" />
              </View>

              <View className="flex-1 gap-3">
                <View>
                  <Text className="text-xs text-gray-400 uppercase tracking-wide mb-1">Origen</Text>
                  <TextInput
                    value={form.origen}
                    onChangeText={text => updateField('origen', text)}
                    className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-200"
                    placeholder="¿Desde dónde sales?"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View>
                  <Text className="text-xs text-gray-400 uppercase tracking-wide mb-1">Destino</Text>
                  <TextInput
                    value={form.destino}
                    onChangeText={text => updateField('destino', text)}
                    className="text-base text-gray-900"
                    placeholder="¿A dónde vas?"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

            </View>
          </View>

          {/*  Fecha y Hora  */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Fecha:                                    Hora:</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 flex-row items-center gap-2 border border-gray-200 rounded-xl px-3 py-3"
                onPress={() => {}}
              >
                <Text className="text-sm text-gray-700">{form.fecha}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center gap-2 border border-gray-200 rounded-xl px-3 py-3"
                onPress={() => {}}
              >
                <Text className="text-sm text-gray-700">{form.hora}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/*  Asientos disponibles  */}
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

                <Text className="text-xl font-bold text-gray-900 w-5 text-center">{form.asientos}</Text>

                <TouchableOpacity
                  onPress={incrementarAsientos}
                  className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center"
                >
                  <Text className="text-white text-lg font-medium leading-none">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row gap-2 mt-2">
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  className={`w-8 h-8 rounded-full border items-center justify-center ${
                    i <= form.asientos ? 'bg-blue-50 border-blue-600' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-xs ${i <= form.asientos ? 'text-blue-600' : 'text-gray-300'}`}>
                    👤
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/*  Precio  */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Precio por persona</Text>
            <View className="flex-row items-center gap-3 border border-gray-200 rounded-xl px-4 py-3">
              <View className="bg-blue-50 rounded-lg px-2 py-1">
                <Text className="text-blue-600 font-bold text-base">$</Text>
              </View>
              <TextInput
                value={form.precio}
                onChangeText={text => updateField('precio', text)}
                keyboardType="numeric"
                className="flex-1 text-2xl font-bold text-gray-900"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
              />
              <Text className="text-xs text-gray-400">MXN / persona</Text>
            </View>
          </View>

          {/*  Comentario  */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Comentario adicional</Text>
            <TextInput
              value={form.comentario}
              onChangeText={text => updateField('comentario', text)}
              multiline
              numberOfLines={3}
              placeholder="Saldré de casa a las 5:45 para evitar tráfico"
              placeholderTextColor="#9CA3AF"
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700"
              style={{ textAlignVertical: 'top', minHeight: 80 }}
            />
          </View>

          {/*  Publicar  */}
          <TouchableOpacity
            onPress={publicarViaje}
            disabled={isLoading}
            className={`rounded-2xl py-4 items-center mb-6 ${
              isLoading ? 'bg-blue-300' : 'bg-blue-600'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-bold">Publicar viaje</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

export default PublishTripScreen;