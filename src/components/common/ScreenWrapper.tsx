/**
 * ScreenWrapper
 *
 * Envoltorio estándar para todas las pantallas de la app.
 * Gestiona automáticamente el inset de SafeArea inferior.
 * NOTA: El inset superior (top) lo manejan los Headers individualmente.
 */
import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  children: React.ReactNode;
  hasFooter?: boolean;
  backgroundColor?: string;
  // Agregamos opciones para controlar la barra de estado globalmente
  statusBarColor?: string;
  barStyle?: "default" | "light-content" | "dark-content";
}

export default function ScreenWrapper({
  children,
  hasFooter = false,
  backgroundColor = "white",
  statusBarColor = "#1e3a8a", // Azul por defecto
  barStyle = "light-content", // Íconos blancos por defecto
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingBottom: hasFooter ? 0 : insets.bottom,
        },
      ]}
    >
      {/* 🚀 Centralizamos el StatusBar aquí para no repetirlo en cada pantalla */}
      <StatusBar barStyle={barStyle} backgroundColor={statusBarColor} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});