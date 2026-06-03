import React from "react";
import { View, Text } from "react-native";

type Props = {
  message?: string;
};

export default function ErrorState({
  message = "Ocurrió un error al cargar la información",
}: Props) {
  return (
    <View className="flex-1 justify-center items-center p-6">
      <Text className="text-5xl mb-3">⚠️</Text>
      <Text className="text-center text-gray-500 text-lg">
        {message}
      </Text>
    </View>
  );
}