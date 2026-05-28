import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import { usePerfil } from "../../hooks/queries/usePerfil";
import { useMensajes } from "../../hooks/queries/useChat";
import { useBackHandler } from "../../hooks/useBackHandler";
import { orpc } from "../../services/api/apiClient";

import {
  getSocket,
  joinChat,
  sendMessage,
  onNewMessage,
  offNewMessage,
} from "../../services/socket";

export default function ChatScreen({ navigation, route }: any) {
  const { idViaje = 1 } = route?.params || {};
  const viajeIdNum = Number(idViaje);
  const queryClient = useQueryClient();

  useBackHandler(navigation, "normal");

  const [mensajeEscrito, setMensajeEscrito] = useState("");
  const [estaFinalizado, setEstaFinalizado] = useState(false);

  const { data: perfilData } = usePerfil();
  const { data: mensajesData, isLoading: loadingMensajes } = useMensajes(viajeIdNum);

  const myId = perfilData?.user?.id_usuario ?? null;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const socket = getSocket();

    const unirseAlChat = () => {
      if (socket && socket.connected) {
        joinChat(idViaje);
        console.log(`📱 Unido (o re-unido) al chat del viaje ${idViaje}`);
      }
    };

    const inicializarChat = async () => {
      try {
        await orpc.chat.marcarComoLeidos({ viajeId: idViaje });
        await checarEstadoViaje();
        unirseAlChat();
      } catch (error: any) {
        console.error("Error al inicializar el chat:", error);
      }
    };

    if (myId) {
      inicializarChat();
    }

    if (socket) {
      socket.on("connect", unirseAlChat);
    }

    const handleNewMessage = (data: any) => {
      console.log("🔥 [SOCKET] MENSAJE ENTRANTE:", data);
      
      if (data?.id_viaje_pub == viajeIdNum || data?.idViaje == viajeIdNum || !data) {
        queryClient.invalidateQueries({ queryKey: ["chat", "mensajes", viajeIdNum] });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
      }
    };

    onNewMessage(handleNewMessage);

    return () => {
      offNewMessage();
      if (socket) {
        socket.off("connect", unirseAlChat);
      }
    };
  }, [idViaje, myId]);

  const mensajes = React.useMemo(() => {
    if (!mensajesData) return [];
    return mensajesData.map((msg: any) => ({
      id: msg.id_mensaje.toString(),
      texto: msg.contenido,
      remitente: msg.id_emisor === myId ? "yo" : "otro",
      nombre: msg.emisor?.nombre || "Usuario",
    }));
  }, [mensajesData, myId]);

  const checarEstadoViaje = async () => {
    try {
      const data = await orpc.chat.getEstado({ viajeId: idViaje });
      if (data.estado === "finalizado") setEstaFinalizado(true);
    } catch (error) {
      console.error("Error al checar estado:", error);
    }
  };

  const enviarMensaje = async () => {
    if (mensajeEscrito.trim() === "" || estaFinalizado) return;

    try {
      await orpc.chat.enviarMensaje({
        id_viaje_pub: idViaje,
        contenido: mensajeEscrito,
      });
      setMensajeEscrito("");
      queryClient.invalidateQueries({ queryKey: ["chat", "mensajes", idViaje] });
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

  if (loadingMensajes && mensajes.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text className="mt-2 text-gray-500">Cargando chat...</Text>
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
