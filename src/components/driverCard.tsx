import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";

interface DriverCardProps {
  viaje: {
    id_viaje_pub: number;
    origen_texto: string;
    destino_texto: string;
    fecha_hora_salida: string;
    asientos_disponibles: number;
    costo_estimado: number;
    conductor: {
      modelo: string;
      color: string;
      placas: string;
      usuario: {
        id_usuario: string;
        nombre: string;
        apellido_paterno: string;
        foto_perfil: string | null;
        reputacion_promedio: number | null;
      };
    };
  };
  onPress: (id: number) => void;
  onVerPerfil: (usuarioId: string) => void;
}

const DriverCard = ({ viaje, onPress, onVerPerfil }: DriverCardProps) => {
  const fecha = new Date(viaje.fecha_hora_salida);
  const hora = fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fechaStr = fecha.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });

  return (
    <View className="bg-white rounded-xl shadow-sm mb-4 border border-gray-100 overflow-hidden">
      <View className="p-4">
        {/* Conductor y botones */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            {viaje.conductor.usuario.foto_perfil ? (
              <Image
                source={{
                  uri: `http://localhost:3000/uploads/perfiles/${viaje.conductor.usuario.foto_perfil}`,
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <View className="w-10 h-10 bg-gray-300 rounded-full items-center justify-center mr-3">
                <Text className="text-xl">👤</Text>
              </View>
            )}
            <View>
              <Text className="font-semibold text-gray-900">
                {viaje.conductor.usuario.nombre}{" "}
                {viaje.conductor.usuario.apellido_paterno}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-yellow-500 mr-1">★</Text>
                <Text className="text-xs text-gray-500">
                  {viaje.conductor.usuario.reputacion_promedio?.toFixed(1) ||
                    "Nuevo"}
                </Text>
              </View>
            </View>
          </View>

          {/* Botón Ver Perfil */}
          <TouchableOpacity
            className="bg-gray-200 rounded-lg px-3 py-2"
            onPress={() => onVerPerfil(viaje.conductor.usuario.id_usuario)}
          >
            <Text className="text-blue-800 font-semibold text-xs">
              Ver Perfil
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ruta */}
        <View className="flex-row items-start mb-3">
          <View className="items-center mr-3">
            <View className="w-3 h-3 rounded-full bg-green-500" />
            <View className="w-0.5 h-8 bg-gray-300" />
            <View className="w-3 h-3 rounded-full bg-red-500" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-medium">
              {viaje.origen_texto}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {viaje.destino_texto}
            </Text>
          </View>
        </View>

        {/* Detalles */}
        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
          <View className="flex-row items-center">
            <Text className="text-gray-500 mr-1">📅</Text>
            <Text className="text-sm text-gray-700">{fechaStr}</Text>
            <Text className="text-gray-500 mx-2">•</Text>
            <Text className="text-gray-500 mr-1">⏰</Text>
            <Text className="text-sm text-gray-700">{hora}</Text>
          </View>
          <View>
            <Text className="text-lg font-bold text-blue-900">
              ${viaje.costo_estimado}
            </Text>
            <Text className="text-xs text-gray-500">por persona</Text>
          </View>
        </View>

        {/* Vehículo y botón solicitar */}
        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-50">
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-400">
              🚗 {viaje.conductor.modelo}
            </Text>
            <Text className="text-xs text-gray-400 mx-2">•</Text>
            <Text className="text-xs text-gray-400">
              {viaje.conductor.color}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-blue-900 rounded-lg px-4 py-2"
            onPress={() => onPress(viaje.id_viaje_pub)}
          >
            <Text className="text-white font-semibold text-xs">Solicitar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default DriverCard;
