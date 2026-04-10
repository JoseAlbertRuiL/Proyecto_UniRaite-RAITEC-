import "./global.css";
import React, { useState } from 'react';
import LoginScreen from './src/screens/Principal/LoginScreen';
import RegisterScreen from './src/screens/Principal/RegisterScreen';
import HomeScreen from "./src/screens/Principal/HomeScreen";

type ScreenName = 'Login' | 'Register' | 'Home';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Home');

  const navigation = {
    navigate: (name: string) => {
      if (name === 'Register') setScreen('Register');
      if (name === 'Login') setScreen('Login');
      if (name === 'Home') setScreen('Home');
    },
  } as any;

  return screen === 'Login' ? (
    <LoginScreen navigation={navigation} />
  ) : screen === 'Register' ? (
    <RegisterScreen navigation={navigation} />
  ) : (
    <HomeScreen navigation={navigation} />
  );
}