import "./global.css";
import React, { useState } from 'react';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import StartScreen from "./src/screens/auth/StartScreen";
import ForgetPasswordScreen from './src/screens/auth/ForgetPasswordScreen';
import CodeForgetPasswordScreen from './src/screens/auth/CodeForgetPasswordScreen';

type ScreenName = 'Login' | 'Register' | 'Start' | 'Forget' | 'Code';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Start');

  const navigation = {
    navigate: (name: string) => {
      if (name === 'Register') setScreen('Register');
      if (name === 'Login') setScreen('Login');
      if (name === 'Start') setScreen('Start');
      if (name === 'Forget') setScreen('Forget');
      if (name === 'Code') setScreen('Code');
    },
  } as any;

  return screen === 'Login' ? (
    <LoginScreen navigation={navigation} />
  ) : screen === 'Register' ? (
    <RegisterScreen navigation={navigation} />
  ) : screen === 'Forget' ? (
    <ForgetPasswordScreen navigation={navigation} />
  ) : screen === 'Code' ? (
    <CodeForgetPasswordScreen navigation={navigation} />
  ) : (
    <StartScreen navigation={navigation} />
  );
}