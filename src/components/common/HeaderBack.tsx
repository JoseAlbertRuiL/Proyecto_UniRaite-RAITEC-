import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
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
  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-blue-900">
      {/* Botón de regreso izquierda - más bonito */}
      <TouchableOpacity
        className="w-10 h-10 rounded-full bg-white/20 items-center justify-center active:bg-white/30"
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <SvgXml xml={backArrowSvg} width={24} height={24} stroke="white" />
      </TouchableOpacity>

      {/* Título centrado */}
      <Text className="text-white text-lg font-bold tracking-wide">
        {title}
      </Text>

      {/* Espacio a la derecha para balance */}
      <View className="w-10" />
    </View>
  );
};

export default HeaderBack;
