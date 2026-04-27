import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { protectedProcedure } from '../middleware'
import { prisma } from '../context'

// 1. OBTENER MENSAJES (Para ChatScreen.tsx)
export const getMensajes = protectedProcedure
  .input(z.object({ idViaje: z.number().int() }))
  .handler(async ({ input }) => {
    const mensajes = await prisma.mensajes_chat.findMany({
      where: { id_viaje_pub: input.idViaje },
      orderBy: { fecha_envio: 'asc' },
      include: { emisor: { select: { nombre: true } } }
    })
    return mensajes
  })

// 2. ENVIAR MENSAJE (Valida el Match o si es el Conductor)
export const enviarMensaje = protectedProcedure
  .input(
    z.object({
      id_viaje_pub: z.number().int(),
      contenido: z.string().min(1),
    })
  )
  .handler(async ({ input, context }) => {
    const id_emisor = context.user.id 

    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.id_viaje_pub },
      include: { conductor: { include: { usuario: true } } }
    })

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'El viaje no existe.' })
    }

    // Validamos si es el conductor del viaje
    const esConductor = viaje.conductor.usuario?.id_usuario === id_emisor

    // Validamos si es pasajero con match confirmado
    const match = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: input.id_viaje_pub,
        id_pasajero: id_emisor,
        estado_solicitud: 'aceptada',
      },
    })

    if (!esConductor && !match) {
      throw new ORPCError('FORBIDDEN', { message: 'No tienes un match confirmado para este viaje.' })
    }

    const nuevoMensaje = await prisma.mensajes_chat.create({
      data: {
        id_viaje_pub: input.id_viaje_pub,
        id_emisor: id_emisor,
        contenido: input.contenido,
        fecha_envio: new Date(),
      },
    })

    return nuevoMensaje
  })

// 3. HISTORIAL DE CHATS (Para ChatHistoryScreen.tsx)
// Esta versión muestra el viaje aunque no tenga mensajes previos
export const misChats = protectedProcedure.handler(async ({ context }) => {
  const idUsuario = context.user.id

  // A. Obtenemos la licencia del usuario por si es conductor
  const usuarioInfo = await prisma.usuarios.findUnique({
    where: { id_usuario: idUsuario },
    select: { licencia_de_conducir: true },
  })

  // B. Buscamos todos los viajes donde participa el usuario (como conductor o pasajero aceptado)
  const viajesParticipando = await prisma.viajes_publicados.findMany({
    where: {
      OR: [
        { id_licencia_conductor: usuarioInfo?.licencia_de_conducir || 'SIN_LICENCIA' },
        { solicitudes: { some: { id_pasajero: idUsuario, estado_solicitud: 'aceptada' } } }
      ]
    },
    include: {
      conductor: { include: { usuario: { select: { nombre: true } } } },
      // Traemos el último mensaje para mostrarlo en la lista
      mensajes: {
        orderBy: { fecha_envio: 'desc' },
        take: 1,
        include: { emisor: { select: { nombre: true } } }
      }
    }
  })

  // C. Formateamos la respuesta para el frontend
  const historial = viajesParticipando.map(viaje => {
    const tieneMensajes = viaje.mensajes.length > 0

    return {
      idViaje: viaje.id_viaje_pub,
      // Si no hay mensajes, mostramos el nombre del conductor como remitente por defecto
      remitente: tieneMensajes ? viaje.mensajes[0].emisor.nombre : viaje.conductor.usuario?.nombre || "Conductor desconocido",
      // Si no hay mensajes, ponemos un texto de invitación
      texto: tieneMensajes ? viaje.mensajes[0].contenido : "¡Match confirmado! Pulsa aquí para saludar.",
      fecha: tieneMensajes ? viaje.mensajes[0].fecha_envio : viaje.fecha_hora_salida,
      esMio: tieneMensajes ? viaje.mensajes[0].id_emisor === idUsuario : false,
      idUsuario: idUsuario // Para que el frontend sepa quién es el usuario actual
    }
  })

  // Ordenamos por fecha (los más recientes arriba)
  return historial.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
})