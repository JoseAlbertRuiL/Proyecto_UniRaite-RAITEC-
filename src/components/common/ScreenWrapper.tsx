/**
 * ScreenWrapper
 *
 * Envoltorio estándar para todas las pantallas de la app.
 * Gestiona automáticamente los insets de SafeArea (top, bottom) para
 * que el contenido nunca quede detrás de la barra de estado ni de
 * los botones de navegación del sistema (Android gesture/button nav).
 *
 * Props:
 *  - hasFooter: si la pantalla incluye el componente <Footer />,
 *    pasa `true` para que el ScreenWrapper NO aplique paddingBottom
 *    (el Footer ya lo gestiona por su cuenta).
 *  - edges: control fino de qué lados aplicar. Por defecto aplica top + bottom.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Si true, el paddingBottom lo gestiona el componente Footer internamente. */
  hasFooter?: boolean;
  /** Color de fondo. Default: "white". */
  backgroundColor?: string;
}

export default function ScreenWrapper({
  children,
  hasFooter = false,
  backgroundColor = "white",
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top,
          // Si hay Footer, él aplica su propio paddingBottom
          paddingBottom: hasFooter ? 0 : insets.bottom,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});