import "react-native-reanimated";
import "react-native-quick-base64";
import "../global.css";
import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/services/queryClient";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        >
          <Stack.Screen
            name="index"
            options={{ animation: "none" }}
          />
          <Stack.Screen name="(principal)" />
          <Stack.Screen name="(trip)" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}