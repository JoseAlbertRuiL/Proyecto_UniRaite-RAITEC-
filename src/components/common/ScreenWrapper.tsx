/**
 * ScreenWrapper
 *
 * Envoltorio estándar para todas las pantallas de la app.
 * Gestiona automáticamente el inset de SafeArea inferior y superior.
 */
import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  children: React.ReactNode;
  hasFooter?: boolean;
  hasHeader?: boolean;
  backgroundColor?: string;
  statusBarColor?: string;
  barStyle?: "default" | "light-content" | "dark-content";
}

export default function ScreenWrapper({
  children,
  hasFooter = false,
  hasHeader = true,
  backgroundColor = "white",
  statusBarColor = "#1e3a8a", 
  barStyle = "light-content", 
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingBottom: hasFooter ? 0 : insets.bottom,
          paddingTop: hasHeader ? 0 : insets.top, 
        },
      ]}
    >
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