import { Stack } from "expo-router";

export default function TripLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="PublicarViaje" />
      <Stack.Screen name="FinishTrip" />
      <Stack.Screen name="RateTrip" />
    </Stack>
  );
}
