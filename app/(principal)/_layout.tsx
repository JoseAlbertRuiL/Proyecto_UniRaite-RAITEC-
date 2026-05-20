import { Stack } from "expo-router";

export default function PrincipalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="Home" />
      <Stack.Screen name="Register" />
      <Stack.Screen name="Forget" />
      <Stack.Screen name="Code" />
      <Stack.Screen name="ChangePassword" />
      <Stack.Screen name="ConfigP" />
      <Stack.Screen name="Licencia" />
      <Stack.Screen name="Circulacion" />
      <Stack.Screen name="Conducir" />
      <Stack.Screen name="Map" />
      <Stack.Screen name="Chat" />
      <Stack.Screen name="ChatHistory" />
      <Stack.Screen name="PerfilPublico" />
      <Stack.Screen name="Notificaciones" />
      <Stack.Screen name="History" />
    </Stack>
  );
}
