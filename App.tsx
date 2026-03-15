import "./global.css";
import React, { useState } from 'react';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import StartScreen from "./src/screens/auth/StartScreen";

type ScreenName = 'Login' | 'Register' | 'Start';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Start');

  const navigation = {
    navigate: (name: string) => {
      if (name === 'Register') setScreen('Register');
      if (name === 'Login') setScreen('Login');
      if (name === 'Start') setScreen('Start');
    },
  } as any;

  return screen === 'Login' ? (
    <LoginScreen navigation={navigation} />
  ) : screen === 'Register' ? (
    <RegisterScreen navigation={navigation} />
  ) : (
    <StartScreen navigation={navigation} />
  );
}