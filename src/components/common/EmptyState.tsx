import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

type EmptyStateProps = {
  icon?: string;
  title?: string;
  message: string;
  buttonText?: string;
  onPress?: () => void;
};

const EmptyState = ({
  icon = "📭",
  title,
  message,
  buttonText,
  onPress,
}: EmptyStateProps) => {
  return (
    <View className="flex-1 items-center justify-center py-20 px-6">
      <Text className="text-4xl mb-4">{icon}</Text>

      {title && (
        <Text className="text-lg font-bold text-gray-800 text-center mb-2">
          {title}
        </Text>
      )}

      <Text className="text-gray-500 text-center">{message}</Text>

      {buttonText && onPress && (
        <TouchableOpacity
          className="mt-4 bg-blue-900 rounded-xl py-3 px-6"
          onPress={onPress}
        >
          <Text className="text-white font-semibold">{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;