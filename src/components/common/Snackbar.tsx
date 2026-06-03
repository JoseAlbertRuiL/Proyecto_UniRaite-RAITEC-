import React from "react";
import { View, Text } from "react-native";

type SnackbarProps = {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
};

const Snackbar = ({ visible, message, type = "info" }: SnackbarProps) => {
  if (!visible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-blue-900";

  return (
    <View
      className={`absolute bottom-24 left-4 right-4 rounded-xl px-4 py-3 ${bgColor}`}
    >
      <Text className="text-white text-center font-semibold">{message}</Text>
    </View>
  );
};

export default Snackbar;