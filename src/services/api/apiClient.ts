console.log('🔥 apiClient cargado')// src/services/api/apiClient.ts
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AppRouter } from '../../../backend/src/orpc/index' // ajusta la ruta si es necesario


// ─── Detecta la IP del servidor igual que antes ───────────────────────────────

const normalizeUrl = (url: string) => url.replace(/\/+$/, '')

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL
  const extraUrl =
    process.env.EXPO_PUBLIC_API_URL ??
    Constants.expoConfig?.extra?.apiUrl ??
    Constants.manifest?.extra?.apiUrl ??
    (Constants as any).manifest2?.extra?.apiUrl ??
    null

  console.log('API URL config:', {
    envUrl,
    extraUrl,
    expoConfigExtra: Constants.expoConfig?.extra,
    manifestExtra: Constants.manifest?.extra,
    manifest2Extra: (Constants as any).manifest2?.extra,
  })

  if (extraUrl) {
    return normalizeUrl(extraUrl.replace(/\/api$/i, ''))
  }

  let expoIp: string | null = null

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.manifest?.debuggerHost ??
    Constants.manifest?.hostUri ??
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
