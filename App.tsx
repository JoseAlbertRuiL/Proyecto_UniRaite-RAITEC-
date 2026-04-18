import "./global.css";
import React, { useState } from 'react';
import LoginScreen from './src/screens/Principal/LoginScreen';
import RegisterScreen from './src/screens/Principal/RegisterScreen';
import StartScreen from "./src/screens/Principal/HomeScreen";
import ChatScreen from "./src/screens/ChatScreen"; 
import ChatHistoryScreen from './src/screens/ChatHistoryScreen'; // Nueva pantalla

type ScreenName = 'Login' | 'Register' | 'Start' | 'Chat' | 'ChatHistory'; // Agregamos ChatHistory al tipo

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Start');
  const [parametros, setParametros] = useState<any>({});

  const navigation = {
    navigate: (name: string, datosExtra?: any) => {
      if (datosExtra) setParametros(datosExtra);
      if (name === 'Register') setScreen('Register');
      if (name === 'Login') setScreen('Login');
      if (name === 'Start') setScreen('Start');
      if (name === 'ChatHistory') setScreen('ChatHistory');
      if (name === 'Chat') setScreen('Chat');
    },
    goBack: () => setScreen('Start'),
  } as any;

  const route = { params: parametros };

  return screen === 'Login' ? (
    <LoginScreen navigation={navigation} />
  ) : screen === 'Register' ? (
    <RegisterScreen navigation={navigation} />
  ) : screen === 'Chat' ? (
    <ChatScreen navigation={navigation} route={route} />
  ) : screen === 'ChatHistory' ? (
    <ChatHistoryScreen navigation={navigation} />
  ) : (
    <StartScreen navigation={navigation} />
  );
}