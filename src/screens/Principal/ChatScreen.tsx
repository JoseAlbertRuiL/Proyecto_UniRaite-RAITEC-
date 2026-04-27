// src/screens/Principal/ChatScreen.tsx
import React, { useState, useEffect } from "react";
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
  ActivityIndicator
} from "react-native";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import { orpc } from "../../services/api/apiClient";

export default function ChatScreen({ navigation, route }: any) {
  const { idViaje = 1 } = route?.params || {};

  const [mensajes, setMensajes] = useState<any[]>([]);
  const [mensajeEscrito, setMensajeEscrito] = useState("");
  const [estaFinalizado, setEstaFinalizado] = useState(false);
  const [myId, setMyId] = useState<string | null>(null); // Guardaremos tu ID aquí

  useEffect(() => {
    const inicializarChat = async () => {
      try {
        // 1. Obtenemos tu perfil para saber quién eres tú realmente
        const perfil = await orpc.usuarios.getPerfil();
        setMyId(perfil.user.id_usuario);
        
        // 2. Cargamos mensajes y estado
        cargarMensajes(perfil.user.id_usuario);
        checarEstadoViaje();
      } catch (error) {
        console.error("Error al inicializar chat:", error);
      }
    };

    inicializarChat();

    // Intervalo de Polling cada 3 segundos
    const intervalo = setInterval(() => {
      if (myId) cargarMensajes(myId);
      if (!estaFinalizado) checarEstadoViaje();
    }, 3000);

    return () => clearInterval(intervalo);
  }, [idViaje, estaFinalizado, myId]);

  const cargarMensajes = async (currentUserId: string) => {
    try {
      const data = await orpc.chat.getMensajes({ idViaje });
      const formateados = data.map((msg: any) => ({
        id: msg.id_mensaje.toString(),
        texto: msg.contenido,
        // Comparamos el emisor contra tu ID real del perfil
        remitente: msg.id_emisor === currentUserId ? "yo" : "otro",
        nombre: msg.emisor?.nombre || "Usuario",
      }));
      setMensajes(formateados);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
    }
  };

  const checarEstadoViaje = async () => {
    try {
      const data = await orpc.viajes.getEstado({ viajeId: idViaje });
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
      if (myId) cargarMensajes(myId);
    } catch (error: any) {
      if (error?.status === 403 || error?.code === 403) {
        Alert.alert("Acceso Denegado", "Solo puedes chatear si tienes un match confirmado.");
      } else {
        Alert.alert("Error", error?.message || "No se pudo enviar el mensaje.");
      }
    }
  };

  const renderItem = ({ item }: any) => {
    const esMio = item.remitente === "yo";
    return (
      <View className={`p-3 m-2 rounded-2xl max-w-[85%] ${esMio ? "bg-blue-900 self-end rounded-tr-none" : "bg-gray-200 self-start rounded-tl-none"}`}>
        {!esMio && <Text className="text-[10px] text-blue-900 font-bold mb-1">{item.nombre}</Text>}
        <Text className={esMio ? "text-white" : "text-gray-800"}>{item.texto}</Text>
      </View>
    );
  };

  if (!myId) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text className="mt-2 text-gray-500">Cargando chat...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      <Header navigation={navigation} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className={`py-2 ${estaFinalizado ? "bg-red-100" : "bg-green-50"}`}>
          <Text className={`text-center text-xs font-bold ${estaFinalizado ? "text-red-600" : "text-green-600"}`}>
            {estaFinalizado ? "VIAJE FINALIZADO - CHAT CERRADO" : `CHATEANDO EN VIAJE #${idViaje}`}
          </Text>
        </View>
        <FlatList
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          className="flex-1 px-2"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
        <View className="flex-row items-center p-3 border-t border-gray-100 bg-white">
          <TextInput
            className={`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mr-2 ${estaFinalizado ? "text-gray-400" : "text-black"}`}
            placeholder={estaFinalizado ? "El chat ya no está disponible" : "Escribe un mensaje..."}
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
    </View>
  );
}