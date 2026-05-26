import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { BASE_URL } from "../services/api/apiClient";

interface DriverCardProps {
  viaje: {
    id_viaje_pub: number;
    origen_texto: string;
    destino_texto: string;
    fecha_hora_salida: string;
    asientos_disponibles: number;
    asientos_ofrecidos: number;
    asientos_ocupados: number;
    capacidad_pasajeros: number;
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
        total_viajes?: number;
      };
    };
  };
  onPress: (id: number) => void;
  onVerPerfil: (usuarioId: string) => void;
  estadoSolicitud?: string | null;
  onEliminar?: (id: number) => void;
  onCancelar?: (id: number) => void;
  onCancelarAceptada?: (id: number) => void;
  motivo?: string | null;
}

const DriverCard = ({
  viaje,
  onPress,
  onVerPerfil,
  estadoSolicitud,
  onCancelar,
  onCancelarAceptada,
  motivo,
}: DriverCardProps) => {
  const fecha = new Date(viaje.fecha_hora_salida);
  const hora = fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fechaStr = fecha.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });

  
  const reputacion = viaje.conductor.usuario.reputacion_promedio || 0;
  const totalViajes = viaje.conductor.usuario.total_viajes || 0;

  const isPendiente = estadoSolicitud === "pendiente";

  const getBotonTexto = () => {
    if (isPendiente) return "Cancelar solicitud";
    if (estadoSolicitud === "aceptada") return "Aceptado ✅";
    if (estadoSolicitud === "en_curso") return "En curso 🚗";
    if (estadoSolicitud === "rechazada") return "Rechazado ❌";
    if (estadoSolicitud === "cancelado") return "Cancelado 🚫";
    if (estadoSolicitud === "completado") return "Finalizado 🏁";
    return "Solicitar";
  };

  const getBotonEstilo = () => {
    if (isPendiente) return "bg-red-500";
    if (estadoSolicitud === "aceptada") return "bg-green-500";
    if (estadoSolicitud === "en_curso") return "bg-blue-600";
    if (estadoSolicitud === "rechazada") return "bg-red-500";
    if (estadoSolicitud === "cancelado") return "bg-gray-500";
    if (estadoSolicitud === "completado") return "bg-gray-600";
    return "bg-blue-900";
  };

  const getBotonDisabled = () => {
    if (isPendiente) return false;
    return estadoSolicitud !== null && estadoSolicitud !== undefined;
  };

  const asientosOcupados = viaje.asientos_ofrecidos - viaje.asientos_disponibles;

  const fotoUrl = viaje.conductor.usuario.foto_perfil
    ? viaje.conductor.usuario.foto_perfil
    : null;

  return (
    <View className="bg-white rounded-2xl shadow-md mb-4 border border-gray-100 overflow-hidden">
      {/* Cabecera */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {fotoUrl ? (
              <Image
                source={{ uri: fotoUrl }}
                className="w-12 h-12 rounded-full mr-3"
              />
            ) : (
              <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center mr-3">
                <Text className="text-2xl">👤</Text>
              </View>
            )}

            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="font-bold text-gray-900 text-base">
                  {viaje.conductor.usuario.nombre}{" "}
                  {viaje.conductor.usuario.apellido_paterno?.charAt(0)}.
                </Text>
                <TouchableOpacity
                  className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full"
                  onPress={() =>
                    onVerPerfil(viaje.conductor.usuario.id_usuario)
                  }
                >
                  <Text className="text-xs text-blue-800 font-medium">
                    Ver perfil
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center mt-0.5">
                {totalViajes > 0 ? (
                  <>
                    <Text className="text-yellow-500 text-sm mr-1">★</Text>
                    <Text className="text-xs text-gray-600 font-medium">
                      {reputacion > 0 ? reputacion.toFixed(1) : "Nuevo"}
                    </Text>
                    <Text className="text-xs text-gray-400 ml-1">
                      ({totalViajes} viaje{totalViajes !== 1 ? "s" : ""})
                    </Text>
                  </>
                ) : (
                  <Text className="text-xs text-gray-500 font-medium">
                    Nuevo (0 viajes)
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Ruta */}
      <View className="px-4 py-3 bg-gray-50">
        <View className="flex-row items-start">
          <View className="items-center mr-3">
            <View className="w-3 h-3 rounded-full bg-green-500" />
            <View className="w-0.5 h-6 bg-gray-300" />
            <View className="w-3 h-3 rounded-full bg-red-500" />
          </View>
          <View className="flex-1">
            <View className="mb-2">
              <Text className="text-xs text-green-600 font-semibold">
                ORIGEN
              </Text>
              <Text className="text-gray-800 font-medium text-sm">
                {viaje.origen_texto}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-red-600 font-semibold">
                DESTINO
              </Text>
              <Text className="text-gray-800 font-medium text-sm">
                {viaje.destino_texto}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Detalles del viaje */}
      <View className="p-4 flex-row justify-between items-center border-b border-gray-100">
        <View className="flex-row items-center">
          <Text className="text-gray-500 mr-2">📅</Text>
          <Text className="text-sm text-gray-800 font-medium">{fechaStr}</Text>
          <Text className="text-gray-400 mx-2">•</Text>
          <Text className="text-gray-500 mr-2">⏰</Text>
          <Text className="text-sm text-gray-800 font-medium">{hora}</Text>
          <Text className="text-gray-400 mx-2">•</Text>
          <Text className="text-gray-500 mr-1">👥</Text>
          <Text className="text-sm text-gray-800 font-medium">
            {asientosOcupados}/{viaje.asientos_ofrecidos} ocupados
          </Text>
        </View>
      </View>

      {/* Vehículo */}
      <View className="px-4 py-2 border-b border-gray-100">
        <View className="flex-row items-center">
          <Text className="text-gray-500 mr-2">🚗</Text>
          <Text className="text-sm text-gray-700">
            {viaje.conductor.modelo} • {viaje.conductor.color}
          </Text>
        </View>
        <Text className="px-4 py-1 text-sm text-gray-400 ml-7 mt-0.5">
          Capacidad: {viaje.capacidad_pasajeros} asientos
        </Text>
      </View>

      {/* Motivo de cancelación */}
      {estadoSolicitud === "cancelado" && motivo ? (
        <View className="px-4 py-2 bg-red-50 border-t border-red-100">
          <Text className="text-xs text-red-700 font-medium">
            Motivo: {motivo}
          </Text>
        </View>
      ) : null}

      {/* Precio y acción */}
      <View className="p-4 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-blue-900">
            ${viaje.costo_estimado}
          </Text>
          <Text className="text-xs text-gray-500">por persona</Text>
        </View>

        {estadoSolicitud === "aceptada" ? (
          <View className="flex-row gap-2">
            <View className="bg-green-500 rounded-xl px-6 py-3 opacity-70">
              <Text className="text-white font-semibold text-sm">
                Aceptado ✅
              </Text>
            </View>
            <TouchableOpacity
              className="bg-red-500 rounded-xl px-6 py-3"
              onPress={() => onCancelarAceptada?.(viaje.id_viaje_pub)}
            >
              <Text className="text-white font-semibold text-sm">
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className={`${getBotonEstilo()} rounded-xl px-6 py-3 ${getBotonDisabled() ? "opacity-70" : ""}`}
            onPress={() => isPendiente ? onCancelar?.(viaje.id_viaje_pub) : onPress(viaje.id_viaje_pub)}
            disabled={getBotonDisabled()}
          >
            <Text className="text-white font-semibold text-sm">
              {getBotonTexto()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default DriverCard;
