import React from 'react';
import { View,
   Text,
   TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface FooterProps {
  navigation: any;
}
{/*Importar los SVGs*/}
const homeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3l-10-9-10 9h3v8z"/></svg>`;
const searchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`;
const chatSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
const historySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
<path d="M13 3a9 9 0 1 0 8.94 10h-2.02A7 7 0 1 1 13 5V3zm-1 5h2v6l5 3-1 1.73-6-3.73V8z"/>
</svg>`;

const Footer: React.FC<FooterProps> = ({ navigation }) => {
  return (
    <View className="flex-row justify-around items-center py-4 bg-gray-100 border-t border-gray-200">
      
      {/* Home */}
      <TouchableOpacity className="items-center" onPress={() => navigation.navigate('Home')}>
        <SvgXml xml={homeSvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Inicio</Text>
      </TouchableOpacity>

      {/* Búsqueda */}
      {/*<TouchableOpacity className="items-center" onPress={() => navigation.navigate('Search')}>
        <SvgXml xml={searchSvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Buscar</Text>
      </TouchableOpacity>*/}
      
      {/*Chats*/}
      <TouchableOpacity className="items-center" onPress={() => navigation.navigate('ChatHistory')}>
        <SvgXml xml={chatSvg} width={24} height={24} fill="#6B7280" />
          <Text className="text-xs text-gray-600">Chat</Text>
      </TouchableOpacity>

      {/* Historial */}
      <TouchableOpacity className="items-center" onPress={() => navigation.navigate('Historial')}>
        <SvgXml xml={historySvg} width={24} height={24} fill="#6B7280" />
        <Text className="text-xs text-gray-600">Historial</Text>
      </TouchableOpacity>

    </View>
  );
};

export default Footer;