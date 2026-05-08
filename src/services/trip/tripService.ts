// src/services/trip/tripService.ts
import { orpc, UPLOAD_URL } from '../api/apiClient'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Viajes ───────────────────────────────────────────────────────────────────

export const listarViajes = async () => {
  return orpc.viajes.listar()
}

export const publicarViaje = async (params: {
  origen_texto: string
  destino_texto: string
  latitud_origen: number
  longitud_origen: number
  latitud_destino: number
  longitud_destino: number
  fechaHoraISO: string
  asientos: number
  precio: number
}) => {
  return orpc.viajes.publicar(params)
}

// ─── Solicitudes ──────────────────────────────────────────────────────────────

// CORREGIDO: usar orpc.solicitudes.solicitar en lugar de orpc.viajes.solicitar
// export const solicitarViaje = async (viajeId: number) => {
//   return orpc.solicitudes.solicitar({ viajeId })
// }

// Solicitar viaje con coordenadas de recogida
export const solicitarViaje = async (
  viajeId: number,
  coordenadas?: { latitud_recogida: number; longitud_recogida: number }
) => {
  return orpc.solicitudes.solicitar({
    viajeId,
    ...coordenadas,
  });
};

// Iniciar viaje (conductor)
export const iniciarViaje = async (viajeId: number) => {
  return orpc.viajes.iniciar({ viajeId });
};

export const responderSolicitud = async (
  solicitudId: number,
  estado: 'aceptada' | 'rechazada'
) => {
  return orpc.solicitudes.responder({ solicitudId, estado })
}

export const obtenerEstadoSolicitud = async (viajeId: number) => {
  try {
    const result = await orpc.solicitudes.obtenerEstadoPorViaje({ viajeId });
    return result.estado;
  } catch (error) {
    return null;
  }
};

export const obtenerMisSolicitudes = async () => {
  return orpc.solicitudes.misSolicitudes();
};

// ─── Conductor ────────────────────────────────────────────────────────────────

export const registroConductor = async (params: {
  modelo: string
  color: string
  placas: string
  capacidad_pasajeros: number
  foto_licencia_uri: string
  foto_circulacion_uri: string
}) => {
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

  return orpc.conductor.registroConductor({
    modelo: params.modelo,
    color: params.color,
    placas: params.placas,
    capacidad_pasajeros: params.capacidad_pasajeros,
    foto_licencia: uploadData.foto_licencia,
    foto_circulacion: uploadData.foto_circulacion,
  })
}

// Obtener solicitudes activas del usuario (pendiente o aceptada)
export const obtenerSolicitudesActivas = async () => {
  return orpc.solicitudes.activas();
};

export const actualizarVehiculo = async (params: {
  modelo: string
  color: string
  placas: string
  capacidad_pasajeros: number
  foto_circulacion_uri?: string
}) => {
  let foto_circulacion: string | undefined

  if (params.foto_circulacion_uri) {
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
    foto_circulacion = uploadData.foto_circulacion
  }

  return orpc.conductor.actualizarVehiculo({
    modelo: params.modelo,
    color: params.color,
    placas: params.placas,
    capacidad_pasajeros: params.capacidad_pasajeros,
    foto_circulacion,
  })
}

export const getVehiculo = async () => {
  return orpc.conductor.getVehiculo()
}

export const getViajePorId = async (viajeId: number) => {
  return orpc.viajes.porId({ viajeId });
};