import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  Alert
} from 'react-native';

import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

//const BASE_URL = 'http://192.168.100.135:3000/api';
const BASE_URL = 'http://localhost:3000/api';
export default function ChatScreen({ navigation, route }: any) {
  
  //Obtenemos datos de la navegación
  const { idViaje = 1, idUsuario = 'david-test-123' } = route?.params || {};

  const [mensajes, setMensajes] = useState<any[]>([]);
  const [mensajeEscrito, setMensajeEscrito] = useState('');
  const [estaFinalizado, setEstaFinalizado] = useState(false);

  // 2. Lógica de Tiempo Real y Verificación de Estado
  useEffect(() => {
    // Carga inicial
    cargarMensajes();
    checarEstadoViaje();

    // Polling cada 3 segundos
    const intervalo = setInterval(() => {
      cargarMensajes();
      // Solo checamos el estado si el chat sigue abierto
      if (!estaFinalizado) checarEstadoViaje();
    }, 3000);

    return () => clearInterval(intervalo);
  }, [idViaje, estaFinalizado]);

  // --- FUNCIONES DEL BACKEND ---

  const cargarMensajes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/mensajes/${idViaje}`);
      const data = await response.json();
      
      const formateados = data.map((msg: any) => ({
        id: msg.id_mensaje.toString(),
        texto: msg.contenido,
        remitente: msg.id_emisor === idUsuario ? 'yo' : 'otro',
        nombre: msg.emisor?.nombre || 'Usuario'
      }));
      
      setMensajes(formateados);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
    }
  };

  const checarEstadoViaje = async () => {
    try {
      const response = await fetch(`${BASE_URL}/viaje-estado/${idViaje}`);
      const data = await response.json();
      // Si el trayecto está 'finalizado', bloqueamos el chat
      if (data.estado === 'finalizado') {
        setEstaFinalizado(true);
      }
    } catch (error) {
      console.error("Error al checar estado:", error);
    }
  };

 const enviarMensaje = async () => {
    if (mensajeEscrito.trim() === '' || estaFinalizado) return;

    try {
      const response = await fetch(`${BASE_URL}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_viaje_pub: idViaje,
          id_emisor: idUsuario,
          contenido: mensajeEscrito
        })
      });

      // Intentamos leer el mensaje exacto que nos manda tu server.js
      const data = await response.json().catch(() => ({}));

      if (response.status === 403) {
        // Usamos window.alert si estamos en la web, y Alert de React Native si es celular
        if (Platform.OS === 'web') {
          window.alert("Acceso Denegado (403)\nSolo puedes chatear si tienes un match confirmado.");
        } else {
          Alert.alert("Acceso Denegado (403)", "Solo puedes chatear si tienes un match confirmado.");
        }
        return;
      }

      if (!response.ok) {
        const errorMsg = data.error || `Error código: ${response.status}`;
        if (Platform.OS === 'web') {
          window.alert(`Error del Servidor\n${errorMsg}`);
        } else {
          Alert.alert("Error del Servidor", errorMsg);
        }
        return;
      }

      // Si todo salió perfecto:
      setMensajeEscrito('');
      cargarMensajes();
      
    } catch (error) {
      // Si el celular ni siquiera pudo llegar al servidor
      Alert.alert("Error de Conexión", "El celular no encuentra al servidor. ¿Revisaste la IP?");
      console.error("Error al enviar (Network):", error);
    }
  };
  // --- DISEÑO ---

  const renderItem = ({ item }: any) => {
    const esMio = item.remitente === 'yo';
    return (
      <View className={`p-3 m-2 rounded-2xl max-w-[85%] ${
          esMio ? 'bg-blue-900 self-end rounded-tr-none' : 'bg-gray-200 self-start rounded-tl-none'
        }`}
      >
        {!esMio && <Text className="text-[10px] text-blue-900 font-bold mb-1">{item.nombre}</Text>}
        <Text className={esMio ? 'text-white' : 'text-gray-800'}>{item.texto}</Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight || 0 }}>
      
      <Header navigation={navigation} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Banner de Estado*/}
        <View className={`py-2 ${estaFinalizado ? 'bg-red-100' : 'bg-green-50'}`}>
           <Text className={`text-center text-xs font-bold ${estaFinalizado ? 'text-red-600' : 'text-green-600'}`}>
             {estaFinalizado ? 'VIAJE FINALIZADO - CHAT CERRADO' : `CHATEANDO EN VIAJE #${idViaje}`}
           </Text>
        </View>

        <FlatList 
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          className="flex-1 px-2"
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        {/* Input: Se deshabilita si el viaje finalizó */}
        <View className="flex-row items-center p-3 border-t border-gray-100 bg-white">
          <TextInput 
            className={`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mr-2 ${estaFinalizado ? 'text-gray-400' : 'text-black'}`}
            placeholder={estaFinalizado ? "El chat ya no está disponible" : "Escribe un mensaje..."}
            value={mensajeEscrito}
            onChangeText={setMensajeEscrito}
            editable={!estaFinalizado}
          />
          <TouchableOpacity 
            className={`${estaFinalizado ? 'bg-gray-300' : 'bg-blue-900'} p-3 rounded-xl`}
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