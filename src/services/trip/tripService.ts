// src/services/trip/tripService.ts
import { orpc, UPLOAD_URL } from '../api/apiClient'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Viajes ───────────────────────────────────────────────────────────────────

export const listarViajes = async () => {
  return orpc.viajes.listar()
}

export const publicarViaje = async (params: {
  origen: string
  destino: string
  fecha: string
  hora: string
  asientos: number
  precio: number
}) => {
  return orpc.viajes.publicar(params)
}

export const solicitarViaje = async (viajeId: number) => {
  return orpc.viajes.solicitar({ viajeId })
}

// ─── Solicitudes ──────────────────────────────────────────────────────────────

export const responderSolicitud = async (
  solicitudId: number,
  estado: 'aceptada' | 'rechazada'
) => {
  return orpc.solicitudes.responder({ solicitudId, estado })
}

// ─── Conductor ────────────────────────────────────────────────────────────────

export const registroConductor = async (params: {
  modelo: string
  color: string
  placas: string
  capacidad_pasajeros: number
  foto_licencia_uri: string
  foto_circulacion_uri: string
}) => {
  // Express guarda los archivos en disco y devuelve los filenames
  const formData = new FormData()
  formData.append('foto_licencia', {
    uri: params.foto_licencia_uri,
    type: 'image/jpeg',
    name: 'licencia.jpg',
  } as any)
  formData.append('foto_circulacion', {
    uri: params.foto_circulacion_uri,
    type: 'image/jpeg',
    name: 'circulacion.jpg',
  } as any)

  const uploadRes = await fetch(`${UPLOAD_URL}/upload/conductor`, {
    method: 'POST',
    body: formData,
  })
  const uploadData = await uploadRes.json()

  if (!uploadData.foto_licencia || !uploadData.foto_circulacion) {
    throw new Error('Error al subir las fotos al servidor')
  }

  // oRPC valida con Vision AI, sube a Cloudinary y guarda en BD
  return orpc.conductor.registroConductor({
    modelo: params.modelo,
    color: params.color,
    placas: params.placas,
    capacidad_pasajeros: params.capacidad_pasajeros,
    foto_licencia: uploadData.foto_licencia,
    foto_circulacion: uploadData.foto_circulacion,
  })
}

export const actualizarVehiculo = async (params: {
  modelo: string
  color: string
  placas: string
  capacidad_pasajeros: number
  foto_circulacion_uri?: string
}) => {
  if (!params.foto_circulacion_uri) {
    throw new Error('Se requiere foto de circulación para actualizar el vehículo')
  }

  // Express guarda el archivo en disco
  const formData = new FormData()
  formData.append('foto_circulacion', {
    uri: params.foto_circulacion_uri,
    type: 'image/jpeg',
    name: 'circulacion.jpg',
  } as any)

  const uploadRes = await fetch(`${UPLOAD_URL}/upload/circulacion`, {
    method: 'POST',
    body: formData,
  })
  const uploadData = await uploadRes.json()

  if (!uploadData.foto_circulacion) {
    throw new Error('Error al subir la foto de circulación')
  }

  // oRPC valida con Vision AI, sube a Cloudinary y actualiza BD
  return orpc.conductor.actualizarVehiculo({
    modelo: params.modelo,
    color: params.color,
    placas: params.placas,
    capacidad_pasajeros: params.capacidad_pasajeros,
    foto_circulacion_filename: uploadData.foto_circulacion,
  })
}

export const getVehiculo = async () => {
  return orpc.conductor.getVehiculo()
}