// src/services/api/apiClient.ts

import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import AsyncStorage from '@react-native-async-storage/async-storage'

console.log('🔥 apiClient cargado')

export const BASE_URL =
  'https://proyecto-uniraite-raitec.onrender.com'

console.log('🌐 BASE_URL:', BASE_URL)

export const UPLOAD_URL = BASE_URL

const link = new RPCLink({
  url: `${BASE_URL}/rpc/`,
  headers: async () => {
    const token = await AsyncStorage.getItem('token')

    return token
      ? { Authorization: `Bearer ${token}` }
      : {}
  },
})

export const orpc = createORPCClient<any>(link)