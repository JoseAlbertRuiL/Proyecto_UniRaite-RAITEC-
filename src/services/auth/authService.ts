// src/services/auth/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { orpc, UPLOAD_URL } from '../api/apiClient'

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (correo_inst: string, password: string) => {

    const data = await orpc.auth.login({ correo_inst, password })
    await AsyncStorage.setItem('token', data.token)
    await AsyncStorage.setItem('user', JSON.stringify(data.user))
    return data
 
}

// ─── Registro ─────────────────────────────────────────────────────────────────

export const register = async (params: {
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  num_control: string
  correo_inst: string
  password: string
  carrera?: string
  foto_credencial_uri?: string  // URI local de la foto (ej: de ImagePicker)
  foto_perfil_uri?: string
}) => {
  // 1. Subir fotos si las hay
  let foto_credencial: string | null = null
  let foto_perfil: string | null = null

  if (params.foto_credencial_uri || params.foto_perfil_uri) {
    const formData = new FormData()

    if (params.foto_credencial_uri) {
      formData.append('foto_credencial', {
        uri: params.foto_credencial_uri,
        type: 'image/jpeg',
        name: 'credencial.jpg',
      } as any)
    }

    if (params.foto_perfil_uri) {
      formData.append('foto_perfil', {
        uri: params.foto_perfil_uri,
        type: 'image/jpeg',
        name: 'perfil.jpg',
      } as any)
    }

    const uploadRes = await fetch(`${UPLOAD_URL}/upload/registro`, {
      method: 'POST',
      body: formData,
    })
    const uploadData = await uploadRes.json()
    foto_credencial = uploadData.foto_credencial
    foto_perfil = uploadData.foto_perfil
  }

  // 2. Crear usuario con oRPC
  const data = await orpc.auth.register({
    nombre: params.nombre,
    apellido_paterno: params.apellido_paterno,
    apellido_materno: params.apellido_materno,
    num_control: params.num_control,
    correo_inst: params.correo_inst,
    password: params.password,
    carrera: params.carrera,
    foto_credencial: foto_credencial ?? undefined,
    foto_perfil: foto_perfil ?? undefined,
  })

  await AsyncStorage.setItem('token', data.token)
  await AsyncStorage.setItem('user', JSON.stringify(data.user))
  return data
}

// ─── Verificar correo ─────────────────────────────────────────────────────────

export const verificarCorreo = async (correo: string) => {
  return orpc.auth.verificarCorreo({ correo })
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

export const getPerfil = async () => {
  return orpc.usuarios.getPerfil()
}

export const getUsuarioById = async (id: string) => {
  return orpc.usuarios.getUsuarioById({ id })
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async () => {
  await AsyncStorage.removeItem('token')
  await AsyncStorage.removeItem('user')
}
