import "./global.css";
import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import HistoryScreen from "./src/screens/Principal/HistoryScreen";

type ScreenName =
  | "Login"
  | "Register"
  | "Home"
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
  | "History";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("Login");
  const [route, setRoute] = useState<any>({});

  const navigation = {
    navigate: (name: string, params?: any) => {
      if (params) setRoute({ params });
      if (name === "Register") setScreen("Register");
      if (name === "Login") setScreen("Login");
      if (name === "Home") setScreen("Home");
      if (name === "Forget") setScreen("Forget");
      if (name === "Code") setScreen("Code");
      if (name === "ConfigP") setScreen("ConfigP");
      if (name === "ChangePassword") setScreen("ChangePassword");
      if (name === "Map") setScreen("Map");
      if (name === "Chat") setScreen("Chat");
      if (name === "Licencia") setScreen("Licencia");
      if (name === "Circulacion") setScreen("Circulacion");
      if (name === "PublicarViaje") setScreen("PublicarViaje");
      if (name === "ChatHistory") setScreen("ChatHistory");
      if (name === "PerfilPublico") setScreen("PerfilPublico");
      if (name === "Conducir") setScreen("Conducir");
      if (name === "Notificaciones") setScreen("Notificaciones");
      if (name === "FinishTrip") setScreen("FinishTrip");
      if (name === "History") setScreen("History");
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
      case "FinishTrip": return <FinishTripScreen navigation={navigation} />;
      case "History": return <HistoryScreen navigation={navigation} />;
      default: return <LoginScreen navigation={navigation} />;
    }
  };

  // Un return limpio y seguro
  return (
    <SafeAreaProvider>
      {renderScreen()}
    </SafeAreaProvider>
  );
}
