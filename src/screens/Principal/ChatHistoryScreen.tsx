// src/screens/Principal/ChatHistoryScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { orpc } from "../../services/api/apiClient";
import { useBackHandler } from "../../hooks/useBackHandler";
import { getSocket, onNewMessage, offNewMessage } from "../../services/socket";

export default function ChatHistoryScreen({ navigation }: any) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [usuarioId, setUsuarioId] = useState<string>("");
  const [cargando, setCargando] = useState(true);

  useBackHandler(navigation, "normal");

  const cargarHistorial = async () => {
    try {
      const data = await orpc.chat.misChats();
      setHistorial(data.chats ?? []);
      setUsuarioId(data.idUsuario ?? "");
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setCargando(false);
    }
  };

  // Recargar historial cuando llega un nuevo mensaje
  const handleNewMessage = (data: any) => {
    console.log("💬 Nuevo mensaje recibido, actualizando historial:", data);
    cargarHistorial();
  };

  useEffect(() => {
    cargarHistorial();

    const socket = getSocket();
    if (socket) {
      onNewMessage(handleNewMessage);
    }

    return () => {
      offNewMessage();
    };
  }, []);

  const formatearHora = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-100 bg-white"
      onPress={() =>
        navigation.navigate("Chat", {
          idViaje: item.idViaje,
        })
      }
    >
      <View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mr-4">
        <Text className="text-blue-900 font-bold text-lg">
          {item.remitente.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between mb-1">
          <Text className="font-bold text-gray-800 text-base">
            Viaje #{item.idViaje}
          </Text>
          <Text className="text-xs text-gray-400">
            {formatearHora(item.fecha)}
          </Text>
        </View>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>
          {item.esMio ? "Tú: " : `${item.remitente}: `}
          {item.texto}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (cargando) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text className="mt-2 text-gray-500">Cargando conversaciones...</Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-gray-50"
      style={{ paddingTop: StatusBar.currentHeight || 0 }}
    >
      <Header navigation={navigation} title="Chat" />
      <View className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <Text className="text-2xl font-bold text-blue-900">Mensajes</Text>
      </View>
      <FlatList
        data={historial}
        keyExtractor={(item) => item.idViaje.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-10">
            No tienes mensajes recientes.
          </Text>
        }
      />
      <Footer navigation={navigation} />
    </View>
  );
}
