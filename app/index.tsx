import React from 'react';
import LoginScreen from '../src/screens/Principal/LoginScreen';
import { withNavigation } from './withNavigation';

const WrappedLogin = withNavigation(LoginScreen);

export default function Index() {
  return <WrappedLogin />;
}
