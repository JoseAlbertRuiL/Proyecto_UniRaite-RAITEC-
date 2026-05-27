import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePerfil } from "../../hooks/queries/usePerfil";
import { useMensajesNoLeidos } from "../../hooks/queries/useChat";
import { useSocketInvalidator } from "../../hooks/useSocketInvalidator";

interface FooterProps {
  navigation: any;
}

const homeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3l-10-9-10 9h3v8z"/></svg>`;
const chatSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5zM7.5 13h2v2h-2zM14.5 13h2v2h-2z"/></svg>`;
const historySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 1 0 8.94 10h-2.02A7 7 0 1 1 13 5V3zm-1 5h2v6l5 3-1 1.73-6-3.73V8z"/></svg>`;

const Footer: React.FC<FooterProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { data: perfilData } = usePerfil();
  const { data: mensajesData } = useMensajesNoLeidos();

  useSocketInvalidator();

  const mensajesNoLeidos = mensajesData?.total ?? 0;
  const perfil = perfilData?.user;
  const modoConductorActivoRef = React.useRef(false);

  React.useEffect(() => {
    const checkModo = async () => {
      const modoGuardado = await AsyncStorage.getItem("modo_conductor_activo");
      modoConductorActivoRef.current =
        perfil?.es_conductor === true && modoGuardado === "true";
    };
    checkModo();
  }, [perfil]);

  const verificarConductor = async () => {
    try {
      if (perfil && perfil.es_conductor) {
        navigation.navigate("Conducir");
      } else {
        Alert.alert(
          "Necesitas registrarte como conductor",
          "¿Quieres registrarte ahora?",
          [
            {
              text: "Sí, registrarme",
              onPress: () => navigation.navigate("Licencia"),
            },
            {
              text: "No",
              onPress: () => navigation.navigate("Start"),
              style: "cancel",
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error al verificar conductor:", error);
      Alert.alert("Error", "No se pudo verificar tu información");
    }
  };

  return (
    <View
      className="flex-row justify-around items-center bg-gray-100 border-t border-gray-200"
      style={{
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 12,
      }}
    >
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("Home")}
      >
        <SvgXml xml={homeSvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Inicio</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center relative"
        onPress={() => navigation.navigate("ChatHistory")}
      >
        <View>
          <SvgXml xml={chatSvg} width={24} height={24} fill="#6B7280" />
          {mensajesNoLeidos > 0 && (
            <View className="absolute -top-2 -right-3 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
              <Text className="text-white text-xs font-bold">
                {mensajesNoLeidos > 9 ? "9+" : mensajesNoLeidos}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-gray-600">Chat</Text>
      </TouchableOpacity>

      {modoConductorActivoRef.current && (
        <TouchableOpacity className="items-center" onPress={verificarConductor}>
          <SvgXml xml={carSvg} width={24} height={24} fill="#6B7280" />
          <Text className="text-xs text-gray-600">Conducir</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("History")}
      >
        <SvgXml xml={historySvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Historial</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
