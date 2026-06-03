import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

type LoadingStateProps = {
  message?: string;
};

const LoadingState = ({ message = "Cargando..." }: LoadingStateProps) => {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <ActivityIndicator size="large" color="#1e3a8a" />
      <Text className="text-gray-500 mt-4">{message}</Text>
    </View>
  );
};

export default LoadingState;