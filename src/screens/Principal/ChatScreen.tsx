// src/screens/Principal/ChatScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { orpc } from "../../services/api/apiClient";
import { useBackHandler } from "../../hooks/useBackHandler";

import {
  getSocket,
  joinChat,
  sendMessage,
  onNewMessage,
  offNewMessage,
} from "../../services/socket";

export default function ChatScreen({ navigation, route }: any) {
  const { idViaje = 1 } = route?.params || {};

  useBackHandler(navigation, "normal");

const queryClient = useQueryClient();

const [mensajeEscrito, setMensajeEscrito] = useState("");
const [error, setError] = useState<string | null>(null);

const flatListRef = useRef<FlatList>(null);

const { data: perfil } = useQuery({
  queryKey: ["mi-perfil-chat"],
  queryFn: async () => {
    const data = await orpc.usuarios.getPerfil();
    return data.user;
  },
});

const myId = perfil?.id_usuario;

const {
  data: mensajes = [],
  isLoading: cargandoMensajes,
} = useQuery({
  queryKey: ["chat-mensajes", idViaje],
  queryFn: async () => {
    const data = await orpc.chat.getMensajes({ idViaje });

    return data.map((msg: any) => ({
      id: msg.id_mensaje.toString(),
      texto: msg.contenido,
      remitente: msg.id_emisor === myId ? "yo" : "otro",
      nombre: msg.emisor?.nombre || "Usuario",
    }));
  },
  enabled: !!myId,
});

const { data: estadoViaje } = useQuery({
  queryKey: ["estado-viaje-chat", idViaje],
  queryFn: async () => {
    return await orpc.chat.getEstado({ viajeId: idViaje });
  },
});

const estaFinalizado = estadoViaje?.estado === "finalizado";


  const marcarMensajesComoLeidos = async () => {
    try {
      console.log("📱 Marcando mensajes como leídos para viaje:", idViaje);
      await orpc.chat.marcarComoLeidos({ viajeId: idViaje });
    } catch (error) {
      console.error("Error al marcar mensajes como leídos:", error);
    }
  };
useEffect(() => {
  const inicializarChat = async () => {
    try {
      await marcarMensajesComoLeidos();

      const socket = getSocket();

      if (socket && socket.connected) {
        joinChat(idViaje);
        console.log(`📱 Unido al chat del viaje ${idViaje}`);
      }
    } catch (error: any) {
      console.error("Error al inicializar chat:", error);

      if (error?.code === "NOT_FOUND") {
        setError("El viaje no existe o ya no está disponible");
      } else if (error?.code === "FORBIDDEN") {
        setError("No tienes acceso a este chat");
      } else {
        setError("Error al cargar el chat");
      }
    }
  };

  inicializarChat();

  const handleNewMessage = () => {
    queryClient.invalidateQueries({
      queryKey: ["chat-mensajes", idViaje],
    });
  };

  onNewMessage(handleNewMessage);

  return () => {
    offNewMessage();
  };
}, [idViaje]);

  

  

  const enviarMensaje = async () => {
    if (mensajeEscrito.trim() === "" || estaFinalizado) return;

    try {
      await orpc.chat.enviarMensaje({
        id_viaje_pub: idViaje,
        contenido: mensajeEscrito,
      });
      setMensajeEscrito("");
    } catch (error: any) {
      if (error?.code === "FORBIDDEN") {
        Alert.alert(
          "Acceso Denegado",
          "Solo puedes chatear si tienes un match confirmado.",
        );
      } else {
        Alert.alert("Error", error?.message || "No se pudo enviar el mensaje.");
      }
    }
  };

  const renderItem = ({ item }: any) => {
    const esMio = item.remitente === "yo";
    return (
      <View
        className={`p-3 m-2 rounded-2xl max-w-[85%] ${esMio ? "bg-blue-900 self-end rounded-tr-none" : "bg-gray-200 self-start rounded-tl-none"}`}
      >
        {!esMio && (
          <Text className="text-[10px] text-blue-900 font-bold mb-1">
            {item.nombre}
          </Text>
        )}
        <Text className={esMio ? "text-white" : "text-gray-800"}>
          {item.texto}
        </Text>
      </View>
    );
  };

 if (cargandoMensajes) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text className="mt-2 text-gray-500">Cargando chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="flex-1 justify-center items-center bg-white p-6"
        style={{ paddingTop: StatusBar.currentHeight || 0 }}
      >
        <Header navigation={navigation} title="Chat" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 text-lg text-center mb-4">{error}</Text>
          <TouchableOpacity
            className="bg-blue-900 px-6 py-3 rounded-xl"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Volver</Text>
          </TouchableOpacity>
        </View>
        <Footer navigation={navigation} />
      </View>
    );
  }

  return (
    <ScreenWrapper hasFooter={true}>
      <Header navigation={navigation} title="Chat" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View
          className={`py-2 ${estaFinalizado ? "bg-red-100" : "bg-green-50"}`}
        >
          <Text
            className={`text-center text-xs font-bold ${estaFinalizado ? "text-red-600" : "text-green-600"}`}
          >
            {estaFinalizado
              ? "VIAJE FINALIZADO - CHAT CERRADO"
              : `CHATEANDO EN VIAJE #${idViaje}`}
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          className="flex-1 px-2"
          contentContainerStyle={{ paddingBottom: 20 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View className="flex-row items-center p-3 border-t border-gray-100 bg-white">
          <TextInput
            className={`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mr-2 ${estaFinalizado ? "text-gray-400" : "text-black"}`}
            placeholder={
              estaFinalizado
                ? "El chat ya no está disponible"
                : "Escribe un mensaje..."
            }
            value={mensajeEscrito}
            onChangeText={setMensajeEscrito}
            editable={!estaFinalizado}
          />
          <TouchableOpacity
            className={`${estaFinalizado ? "bg-gray-300" : "bg-blue-900"} p-3 rounded-xl`}
            onPress={enviarMensaje}
            disabled={estaFinalizado}
          >
            <Text className="text-white font-bold">Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Footer navigation={navigation} />
    </ScreenWrapper>
  );
}
