import Constants from 'expo-constants';

const getApiUrl = () => {
  let expoIp = null;
  
  // Probar diferentes formas de obtener la IP según la versión de Expo
  if (Constants.manifest?.hostUri) {
    expoIp = Constants.manifest.hostUri.split(':')[0];
  } else if (Constants.manifest?.debuggerHost) {
    expoIp = Constants.manifest.debuggerHost.split(':')[0];
  } else if (Constants.expoConfig?.hostUri) {
    expoIp = Constants.expoConfig.hostUri.split(':')[0];
  }
  
  console.log('IP detectada:', expoIp);
  
  if (expoIp) {
    return `http://${expoIp}:3000/api`;
  }
  
  console.warn('No se detectó IP, usando localhost');
  return 'http://localhost:3000/api';
};

export const API_URL = getApiUrl();