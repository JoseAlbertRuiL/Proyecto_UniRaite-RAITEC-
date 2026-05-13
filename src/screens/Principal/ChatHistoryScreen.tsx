// src/screens/Principal/ChatHistoryScreen.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { orpc } from "../../services/api/apiClient";
import { useBackHandler } from "../../hooks/useBackHandler";
import { getSocket, onNewMessage, offNewMessage } from "../../services/socket";

const LIMITE_CHATS = 10;

export default function ChatHistoryScreen({ navigation }: any) {
  useBackHandler(navigation, "normal");

  const queryClient = useQueryClient();

  const obtenerHistorialChats = async () => {
    const data = await orpc.chat.misChats();

    return {
      historial: (data.chats ?? []).slice(0, LIMITE_CHATS),
      usuarioId: data.idUsuario ?? "",
    };
  };

  const {
    data,
    isLoading: cargando,
    refetch,
  } = useQuery({
    queryKey: ["chat-history"],
    queryFn: obtenerHistorialChats,
  });

  const historial = data?.historial ?? [];
  const usuarioId = data?.usuarioId ?? "";

  const eliminarChatMutation = useMutation({
    mutationFn: async (idViaje: number) => {
      return await orpc.chat.eliminarHistorial({ idViaje });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-history"],
      });

      Alert.alert("Éxito", "Chat eliminado correctamente.");
    },

    onError: (error: any) => {
      Alert.alert("Error", error?.message || "No se pudo eliminar.");
    },
  });

  const handleEliminarChat = (idViaje: number) => {
    Alert.alert("Eliminar Chat", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => eliminarChatMutation.mutate(idViaje),
      },
    ]);
  };

  useEffect(() => {
    const socket = getSocket();

    if (socket) {
      onNewMessage(() => {
        refetch();
      });
    }

    return () => offNewMessage();
  }, [refetch]);

  const formatearHora = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: any) => {
    const viajeFinalizado =
      item.estado === "finalizado" || item.finalizado === true;

    return (
      <View className="border-b border-gray-100 bg-white">
        <TouchableOpacity
          className="flex-row items-center p-4"
          onPress={() =>
            navigation.navigate("Chat", {
              idViaje: item.idViaje,
            })
          }
        >
          <View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mr-4">
            <Text className="text-blue-900 font-bold text-lg">
              {item.destino?.charAt(0).toUpperCase() || "V"}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row justify-between mb-1">
              <Text className="font-bold text-gray-800 text-base">
                {item.destino || `Viaje #${item.idViaje}`}
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

          {viajeFinalizado && (
            <TouchableOpacity
              onPress={() => handleEliminarChat(item.idViaje)}
              className="ml-2 p-2 bg-red-50 rounded-lg"
              disabled={eliminarChatMutation.isPending}
            >
              <Text className="text-red-500 text-xs font-bold">
                🗑️ Borrar
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (cargando) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text className="mt-2 text-gray-500">Cargando conversaciones...</Text>
      </View>
    );
  }

  return (
    <ScreenWrapper hasFooter={true}>
      <Header navigation={navigation} title="Chat" />

      <View className="p-4 bg-white border-b border-gray-200 shadow-sm flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-blue-900">Mensajes</Text>
          <Text className="text-xs text-gray-400">
            Últimos {LIMITE_CHATS} chats
          </Text>
        </View>
      </View>

      <FlatList
        data={historial}
        keyExtractor={(item) => item.idViaje.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-10">
            No tienes conversaciones activas.
          </Text>
        }
      />

      <Footer navigation={navigation} />
    </ScreenWrapper>
  );
}