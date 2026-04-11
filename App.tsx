import "./global.css";
import React, { useState } from 'react';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgetPasswordScreen from './src/screens/auth/ForgetPasswordScreen';
import CodeForgetPasswordScreen from './src/screens/auth/CodeForgetPasswordScreen';
import ConfPerfilScreen from './src/screens/auth/ConfPerfilScreen';

type ScreenName = 'Login' | 'Register' | 'Forget' | 'Code' | 'ConfigP';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Login');

  const navigation = {
    navigate: (name: string) => {
      if (name === 'Register') setScreen('Register');
      if (name === 'Login') setScreen('Login');
      if (name === 'Forget') setScreen('Forget');
      if (name === 'Code') setScreen('Code');
      if (name === 'ConfigP') setScreen('ConfigP');
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
  ) : screen === 'ConfigP' ? (
    <ConfPerfilScreen navigation={navigation} />
  ) :(
    <LoginScreen navigation={navigation} />
  );
}