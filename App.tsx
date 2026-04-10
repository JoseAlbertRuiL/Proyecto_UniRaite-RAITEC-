import "./global.css";
import React, { useState } from "react";
import LoginScreen from "./src/screens/Principal/LoginScreen";
import RegisterScreen from "./src/screens/Principal/RegisterScreen";
import StartScreen from "./src/screens/Principal/StartScreen";
import ForgetPasswordScreen from "./src/screens/Principal/ForgetPasswordScreen";
import CodeForgetPasswordScreen from "./src/screens/Principal/CodeForgetPasswordScreen";
import ConfPerfilScreen from "./src/screens/Principal/ConfPerfilScreen";
import ChangePasswordScreen from "./src/screens/Principal/ChangePasswordScreen";

type ScreenName =
  | "Login"
  | "Register"
  | "Start"
  | "Forget"
  | "Code"
  | "ConfigP"
  | "ChangePassword";

export default function App() {
  const [screen, setScreen] = useState<ScreenName>("Login");
  const [route, setRoute] = useState<any>({}); // ← AGREGAR ESTA LÍNEA

  const navigation = {
    navigate: (name: string, params?: any) => {
      // ← AGREGAR params
      if (params) {
        setRoute({ params }); // ← GUARDAR PARAMS
      }
      if (name === "Register") setScreen("Register");
      if (name === "Login") setScreen("Login");
      if (name === "Start") setScreen("Start");
      if (name === "Forget") setScreen("Forget");
      if (name === "Code") setScreen("Code");
      if (name === "ConfigP") setScreen("ConfigP");
      if (name === "ChangePassword") setScreen("ChangePassword");
    },
  } as any;

  return screen === "Start" ? (
    <StartScreen navigation={navigation} />
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
  ) : (
    <LoginScreen navigation={navigation} />
  );
}
