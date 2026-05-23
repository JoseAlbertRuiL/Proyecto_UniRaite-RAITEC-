// src/services/api/apiClient.ts

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

console.log('🔥 apiClient cargado')

const PROD_URL = 'https://proyecto-uniraite-raitec.onrender.com'


const getLocalUrl = (): string => {
  let expoIp: string | null = null

  if (Constants.expoConfig?.hostUri) {
    expoIp = Constants.expoConfig.hostUri.split(':')[0]
  } else if ((Constants as any).manifest?.hostUri) {
    expoIp = (Constants as any).manifest.hostUri.split(':')[0]
  } else if ((Constants as any).manifest?.debuggerHost) {
    expoIp = (Constants as any).manifest.debuggerHost.split(':')[0]
  } else if ((Constants as any).manifest2?.launchAsset?.url) {

    const match = (Constants as any).manifest2.launchAsset.url.match(/:\/\/([^:]+)/);
    if (match) expoIp = match[1];
  }

  if (expoIp) {
    console.log('📡 IP local detectada dinámicamente:', expoIp)
    return `http://${expoIp}:3000`
  }

  console.warn('⚠️ No se detectó IP local de Expo, usando localhost por defecto')
  return 'http://localhost:3000'
}


//export const BASE_URL = __DEV__ ? getLocalUrl() : PROD_URL
export const BASE_URL = PROD_URL

console.log('🌐 BASE_URL final:', BASE_URL)
console.log('🛠️ Modo Desarrollo (__DEV__):', __DEV__)

export const UPLOAD_URL = BASE_URL


const link = new RPCLink({
  url: `${BASE_URL}/rpc/`,
  headers: async () => {
    const token = await AsyncStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
})

export const orpc = createORPCClient<any>(link)