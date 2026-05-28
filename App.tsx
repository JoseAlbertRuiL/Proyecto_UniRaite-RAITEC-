import "./global.css";
import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ConductorModeProvider } from './src/context/ConductorModeContext';
import { useSesion } from "./src/hooks/useSesion";
import LoginScreen from "./src/screens/Principal/LoginScreen";
import RegisterScreen from "./src/screens/Principal/RegisterScreen";
import HomeScreen from "./src/screens/Principal/HomeScreen";
import ForgetPasswordScreen from "./src/screens/Principal/ForgetPasswordScreen";
import CodeForgetPasswordScreen from "./src/screens/Principal/CodeForgetPasswordScreen";
import ConfPerfilScreen from "./src/screens/Principal/ConfPerfilScreen";
import ChangePasswordScreen from "./src/screens/Principal/ChangePasswordScreen";
import Map from "./src/components/common/Map";
import ChatScreen from "./src/screens/Principal/ChatScreen";
import PublishTripScreen from "./src/screens/trip/PublishTripScreen";
import LicenciaScreen from "./src/screens/Principal/LicenciaScreen";
import CirculacionScreen from "./src/screens/Principal/CirculacionScreen";
import ChatHistory from "./src/screens/Principal/ChatHistoryScreen";
import PerfilPublicoScreen from "./src/screens/Principal/PerfilPublicoScreen";
import ConducirScreen from "./src/screens/Principal/ConducirScreen";
import NotificacionesScreen from "./src/screens/Principal/NotificacionesScreen";
import FinishTripScreen from "./src/screens/trip/FinishTripScreen";
import RateTripScreen from "./src/screens/trip/RateTripScreen";
import HistoryScreen from "./src/screens/Principal/HistoryScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

type ScreenName =
  | "Login"
  | "Register"
  | "Home"
  | "Start"
  | "Forget"
  | "Code"
  | "ConfigP"
  | "ChangePassword"
  | "Map"
  | "Chat"
  | "Licencia"
  | "Circulacion"
  | "PublicarViaje"
  | "ChatHistory"
  | "PerfilPublico"
  | "Conducir"
  | "Notificaciones"
  | "FinishTrip"
  | "RateTrip"
  | "History";

export default function App() {
  const { isCargando, pantallaInicial } = useSesion();
  const [screen, setScreen] = useState<ScreenName>("Login");
  const [route, setRoute] = useState<any>({});
  
  useEffect(() => {
    if (!isCargando) {
      setScreen(pantallaInicial);
    }
  }, [isCargando, pantallaInicial]);

  const navigation = {
    navigate: (name: string, params?: any) => {
      if (params) setRoute({ params });
      
      if (name === "Start") {
        setScreen("Home");
      } else {
        setScreen(name as ScreenName);
      }
    },
    goBack: () => setScreen("Home"),
  } as any;

  // Función que decide qué pantalla dibujar
  const renderScreen = () => {
    switch (screen) {
      case "Login": return <LoginScreen navigation={navigation} />;
      case "Home": return <HomeScreen navigation={navigation} />;
      case "Register": return <RegisterScreen navigation={navigation} />;
      case "Forget": return <ForgetPasswordScreen navigation={navigation} />;
      case "Code": return <CodeForgetPasswordScreen navigation={navigation} route={route} />;
      case "ConfigP": return <ConfPerfilScreen navigation={navigation} />;
      case "ChangePassword": return <ChangePasswordScreen navigation={navigation} route={route} />;
      case "Map": return <Map navigation={navigation} />;
      case "Chat": return <ChatScreen navigation={navigation} route={route} />;
      case "Licencia": return <LicenciaScreen navigation={navigation} />;
      case "Circulacion": return <CirculacionScreen navigation={navigation} route={route} />;
      case "PublicarViaje": return <PublishTripScreen navigation={navigation} />;
      case "Conducir": return <ConducirScreen navigation={navigation} />;
      case "PerfilPublico": return <PerfilPublicoScreen navigation={navigation} route={route} />;
      case "ChatHistory": return <ChatHistory navigation={navigation} />;
      case "Notificaciones": return <NotificacionesScreen navigation={navigation} />;
      case "FinishTrip": return <FinishTripScreen navigation={navigation} route={route} />;
      case "RateTrip": return <RateTripScreen navigation={navigation} route={route} />;
      case "History": return <HistoryScreen navigation={navigation} />;
      case "Start": return <HomeScreen navigation={navigation} />;
      default: return <LoginScreen navigation={navigation} />;
    }
  };

  // Un return limpio y seguro
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ConductorModeProvider>
          {isCargando ? (
            <View className="flex-1 justify-center items-center bg-white">
              <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
          ) : (
            renderScreen()
          )}
        </ConductorModeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
