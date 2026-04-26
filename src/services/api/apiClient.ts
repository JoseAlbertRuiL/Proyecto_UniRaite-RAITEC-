// src/services/api/apiClient.ts
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AppRouter } from '../../../backend/src/orpc/index' // ajusta la ruta si es necesario

// ─── Detecta la IP del servidor igual que antes ───────────────────────────────

const getBaseUrl = (): string => {
  let expoIp: string | null = null

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.launchAsset?.url ??
    null

  if (hostUri) {
    expoIp = hostUri.split(':')[0]
  }

  console.log('IP detectada:', expoIp)

  if (expoIp) return `http://${expoIp}:3000`

  console.warn('No se detectó IP, usando localhost')
  return 'http://localhost:3000'
}

export const BASE_URL = getBaseUrl()

// Sigue funcionando para los endpoints de upload (Express)
export const UPLOAD_URL = BASE_URL

// ─── Cliente oRPC ─────────────────────────────────────────────────────────────

const link = new RPCLink({
  url: `${BASE_URL}/rpc/`,
  // Adjunta el token automáticamente en cada llamada
  headers: async () => {
    const token = await AsyncStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
})

export const orpc = createORPCClient<any>(link)
