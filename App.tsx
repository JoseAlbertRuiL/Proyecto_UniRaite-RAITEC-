import "./global.css";
import React, { useState } from 'react';
import LoginScreen from './src/screens/Principal/LoginScreen';
import RegisterScreen from './src/screens/Principal/RegisterScreen';
import StartScreen from "./src/screens/Principal/HomeScreen";
import RateTripScreen from './src/screens/trip/RateTripScreen';

type ScreenName = 'Login' | 'Register' | 'Start' | 'RateTrip';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Start');

  const navigation = {
    navigate: (name: ScreenName) => {
      if (name === 'Register') setScreen('Register');
      if (name === 'Login') setScreen('Login');
      if (name === 'Start') setScreen('Start');
      if (name === 'RateTrip') setScreen('RateTrip');
    },
  } as any;

  return screen === 'Login' ? (
    <LoginScreen navigation={navigation} />
  ) : screen === 'Register' ? (
    <RegisterScreen navigation={navigation} />
  ) : screen === 'RateTrip' ? (
    <RateTripScreen />
  ) : (
    <StartScreen navigation={navigation} />
  );
}