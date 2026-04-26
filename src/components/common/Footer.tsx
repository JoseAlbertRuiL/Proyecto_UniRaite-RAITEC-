import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SvgXml } from "react-native-svg";

interface FooterProps {
  navigation: any;
}

// Íconos SVG
const homeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3l-10-9-10 9h3v8z"/></svg>`;
const chatSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5zM7.5 13h2v2h-2zM14.5 13h2v2h-2z"/></svg>`;
const historySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 1 0 8.94 10h-2.02A7 7 0 1 1 13 5V3zm-1 5h2v6l5 3-1 1.73-6-3.73V8z"/></svg>`;

const Footer: React.FC<FooterProps> = ({ navigation }) => {
  return (
    <View className="flex-row justify-around items-center py-4 bg-gray-100 border-t border-gray-200">
      {/* Inicio */}
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("Home")}
      >
        <SvgXml xml={homeSvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Inicio</Text>
      </TouchableOpacity>

      {/* Chat */}
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("ChatHistory")}
      >
        <SvgXml xml={chatSvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Chat</Text>
      </TouchableOpacity>

      {/* Conducir (Ofrecer viaje) */}
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("Conducir")}
      >
        <SvgXml xml={carSvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Conducir</Text>
      </TouchableOpacity>

      {/* Historial */}
      <TouchableOpacity
        className="items-center"
        onPress={() => navigation.navigate("Historial")}
      >
        <SvgXml xml={historySvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Historial</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Footer;
