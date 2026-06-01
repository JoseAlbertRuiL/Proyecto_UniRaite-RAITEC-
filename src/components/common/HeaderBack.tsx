import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

interface HeaderBackProps {
  navigation: any;
  title: string;
}

// Ícono de flecha hacia atrás más bonito
const backArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 18l-6-6 6-6"/>
</svg>`;

const HeaderBack: React.FC<HeaderBackProps> = ({ navigation, title }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row justify-between items-center px-4 bg-blue-900"
      style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
    >
      {/* Botón de regreso izquierda - más bonito */}
      <TouchableOpacity
        testID="btn-regresar"
        className="w-8 h-8 rounded-full bg-white/20 items-center justify-center active:bg-white/30"
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <SvgXml xml={backArrowSvg} width={20} height={20} stroke="white" />
      </TouchableOpacity>

      {/* Título centrado */}
      <Text className="text-white text-base font-bold tracking-wide">
        {title}
      </Text>

      {/* Espacio a la derecha para balance */}
      <View className="w-10" />
    </View>
  );
};

export default HeaderBack;
