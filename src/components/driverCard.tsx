import React from "react";
import Svg, { Path } from 'react-native-svg';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';

const DriverCard = () => {
    return (
        <View className="flex-row justify-between items-center px-6 py-4 bg-blue-900">
            
            <View className="w-10 h-10 bg-white rounded-full justify-center items-center">
            </View>
        <Text className="text-white font-bold">     John Doe        </Text>    
        <View className="w-4 h-4 bg-white rounded-full justify-center items-center">
            </View>
            <View className="w-4 h-4 bg-white rounded-full justify-center items-center">
            </View>
            <View className="w-4 h-4 bg-white rounded-full justify-center items-center">
            </View>
                
            <TouchableOpacity className="flex-row justify-between items-center px-6 py-4 bg-green-500 rounded-lg">
                <Text className="font-bold text-white">
                    Ver Perfil
                </Text>
            </TouchableOpacity>
        </View>

    );
};
export default DriverCard;
