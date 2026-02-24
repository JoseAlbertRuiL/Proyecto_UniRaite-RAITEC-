import "./global.css";
import React, { useState } from 'react';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

type ScreenName = 'Login' | 'Register';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Login');

  const navigation = {
    navigate: (name: string) => {
      if (name === 'Register') setScreen('Register');
      if (name === 'Login') setScreen('Login');
    },
  } as any;

  return screen === 'Login' ? (
    <LoginScreen navigation={navigation} />
  ) : (
    <RegisterScreen navigation={navigation} />
  );
}