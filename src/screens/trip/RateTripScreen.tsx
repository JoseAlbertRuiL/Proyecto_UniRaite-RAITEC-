import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, ScrollView } from 'react-native';

export default function RateTripScreen({ navigation }: any) {
  // Estados para que la interfaz sea interactiva visualmente
  const [rating, setRating] = useState(4);
  const [selectedTip, setSelectedTip] = useState('$10');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Buena música']);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = () => {
    // Por ahora, al presionar "Enviar" solo cerramos la pantalla y volvemos al inicio
    if (navigation) {
      navigation.navigate('Start');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        
        {/* Encabezado */}
        <View className="flex-row items-center justify-center p-4 relative">
          <TouchableOpacity 
            className="absolute left-4 p-2"
            onPress={() => navigation?.navigate('Start')}
          >
            <Text className="text-slate-600 text-lg font-bold">✕</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#0f172a]">Califica tu viaje</Text>
        </View>

        {/* Tarjeta del Conductor */}
        <View className="mx-5 mt-12 bg-white rounded-[32px] p-6 shadow-sm items-center relative">
          
          {/* Avatar Fijo */}
          <View className="absolute -top-10 w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-slate-200">
            <Image 
              source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Jose' }} 
              className="w-full h-full"
            />
          </View>

          {/* Información del Conductor Fija */}
          <Text className="mt-10 text-xs text-slate-500 font-medium tracking-wide uppercase mb-1">Tu Conductor</Text>
          <Text className="text-2xl font-bold text-[#1e293b] mb-3">Jose Negro</Text>
          
          <View className="flex-row items-center bg-[#f8f9fa] rounded-full px-4 py-2 border border-slate-100">
            <Text className="text-sm font-medium text-slate-700">
              ⭐ 4.98  •   mustang de fuego  •  ABC 9876
            </Text>
          </View>

          {/* Estrellas de Calificación */}
          <Text className="text-base font-semibold mt-8 mb-4">¿Qué tal estuvo el viaje?</Text>
          <View className="flex-row gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text className={`text-4xl ${star <= rating ? 'text-[#6ee7b7]' : 'text-slate-200'}`}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Etiquetas de Retroalimentación */}
          <View className="flex-row flex-wrap justify-center gap-3 mb-6">
            {['Auto limpio', 'Buena música', 'Viaje seguro', 'Buena plática', 'Puntual'].map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  className={`px-5 py-2.5 rounded-full border ${
                    isSelected 
                      ? 'bg-[#86efac] border-transparent' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className={`text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón de Comentario */}
          <TouchableOpacity className="w-full bg-[#f8f9fa] rounded-2xl p-4 flex-row justify-between items-center mt-2">
            <Text className="font-semibold text-slate-800">Deja un comentario</Text>
            <Text className="text-slate-500">▼</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de Propina */}
        <View className="mx-5 mt-4 bg-white rounded-[32px] p-6 shadow-sm">
          <Text className="font-bold text-[#1e293b] mb-4">¿Dejar propina para Jose?</Text>
          <View className="flex-row justify-between gap-2">
            {['$5', '$10', '$20', 'Otro'].map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => setSelectedTip(amount)}
                className={`flex-1 py-3 rounded-2xl items-center justify-center ${
                  selectedTip === amount
                    ? 'bg-[#047857]'
                    : 'bg-[#f8f9fa]'
                }`}
              >
                <Text className={`font-bold ${selectedTip === amount ? 'text-white' : 'text-slate-800'}`}>
                  {amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón de Enviar */}
        <View className="mt-8 px-5">
          <TouchableOpacity 
            onPress={handleSubmit}
            className="w-full bg-[#047857] py-4 rounded-2xl items-center"
          >
            <Text className="text-white text-lg font-bold">Enviar Calificación</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}