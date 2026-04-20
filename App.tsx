import "./global.css";
import React, { useState } from "react";
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
import LicenciaScreen    from "./src/screens/Principal/LicenciaScreen";
import CirculacionScreen from "./src/screens/Principal/CirculacionScreen"
import ChatHistory from "./src/screens/Principal/ChatHistoryScreen";

interface NavigationProps {
  navigation: any;
  route?: any;
}


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
  | "ChatHistory";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("PublicarViaje"); // ← cambia a "Login" cuando tengas backend
  const [route, setRoute] = useState<any>({});

  const navigation = {
    navigate: (name: string, params?: any) => {
      if (params) setRoute({ params });
      if (name === "Register")       setScreen("Register");
      if (name === "Login")          setScreen("Login");
      if (name === "Home")           setScreen("Home");
      if (name === "Forget")         setScreen("Forget");
      if (name === "Code")           setScreen("Code");
      if (name === "ConfigP")        setScreen("ConfigP");
      if (name === "ChangePassword") setScreen("ChangePassword");
      if (name === "Map")            setScreen("Map");
      if (name === "Chat")           setScreen("Chat");
      if (name === "Licencia")       setScreen("Licencia");
      if (name === "Circulacion")    setScreen("Circulacion");
      if (name === "PublicarViaje")  setScreen("PublicarViaje");
      if (name === "ChatHistory") setScreen("ChatHistory");
    },
    goBack: () => setScreen("Home"),
  } as any;

  return screen === "Home" ? (
    <HomeScreen navigation={navigation} />
  ) : screen === "Register" ? (
    <RegisterScreen navigation={navigation} />
  ) : screen === "Forget" ? (
    <ForgetPasswordScreen navigation={navigation} />
  ) : screen === "Code" ? (
    <CodeForgetPasswordScreen navigation={navigation} route={route} />
  ) : screen === "ConfigP" ? (
    <ConfPerfilScreen navigation={navigation} />
  ) : screen === "ChangePassword" ? (
    <ChangePasswordScreen navigation={navigation} route={route} />
  ) : screen === "Map" ? (
    <Map navigation={navigation} />
  ) : screen === "Chat" ? (
    <ChatScreen navigation={navigation} route={route} />
  ) : screen === "Licencia" ? (
    <LicenciaScreen navigation={navigation} />
  ) : screen === "Circulacion" ? (
    <CirculacionScreen navigation={navigation} route={route} />
  ) : screen === "PublicarViaje" ? (
    <PublishTripScreen navigation={navigation} />
  ) : screen === "ChatHistory" ? (
  <ChatHistory navigation={navigation} />
  ) : (
    <LoginScreen navigation={navigation} />
  );
}