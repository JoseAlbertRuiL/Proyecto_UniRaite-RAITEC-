import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { baseProcedure, protectedProcedure } from '../middleware'
import { prisma } from '../context'

// Obtener mensajes de un viaje
export const getMensajes = protectedProcedure
  .input(z.object({ idViaje: z.number() }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.idViaje },
      include: {
        conductor: { include: { usuario: true } },
        solicitudes: true
      }
    });

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'Viaje no encontrado' });
    }

    // Verificar que el usuario esté relacionado con el viaje
    const esConductor = viaje.conductor?.usuario?.id_usuario === context.user.id;
    const esPasajero = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: input.idViaje,
        id_pasajero: context.user.id,
        estado_solicitud: 'aceptada'
      }
    });

    if (!esConductor && !esPasajero) {
      throw new ORPCError('FORBIDDEN', { message: 'No tienes acceso a este chat' });
    }

    const mensajes = await prisma.mensajes_chat.findMany({
      where: { id_viaje_pub: input.idViaje },
      include: {
        emisor: {
          select: {
            nombre: true,
            foto_perfil: true,
          }
        }
      },
      orderBy: { fecha_envio: 'asc' }
    });

    return mensajes;
  });

// Enviar mensaje
export const enviarMensaje = protectedProcedure
  .input(z.object({
    id_viaje_pub: z.number(),
    contenido: z.string().min(1)
  }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.id_viaje_pub },
      include: {
        conductor: { include: { usuario: true } }
      }
    });

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'Viaje no encontrado' });
    }

    // Verificar que el usuario sea conductor o pasajero aceptado
    const esConductor = viaje.conductor?.usuario?.id_usuario === context.user.id;
    const esPasajero = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: input.id_viaje_pub,
        id_pasajero: context.user.id,
        estado_solicitud: 'aceptada'
      }
    });

    if (!esConductor && !esPasajero) {
      throw new ORPCError('FORBIDDEN', { message: 'No puedes enviar mensajes en este chat' });
    }

    const mensaje = await prisma.mensajes_chat.create({
      data: {
        id_viaje_pub: input.id_viaje_pub,
        id_emisor: context.user.id,
        contenido: input.contenido,
        fecha_envio: new Date(),
      },
      include: {
        emisor: {
          select: {
            nombre: true,
            foto_perfil: true,
          }
        }
      }
    });

    // Emitir evento WebSocket
    const { io } = require('../../server');
    if (io) {
      io.to(`chat_${input.id_viaje_pub}`).emit('new_message', mensaje);
    }

    return mensaje;
  });

// Obtener chats del usuario (historial)
export const misChats = protectedProcedure
  .handler(async ({ context }) => {
    // Obtener viajes donde el usuario es conductor
    const viajesConductor = await prisma.viajes_publicados.findMany({
      where: {
        conductor: {
          usuario: { id_usuario: context.user.id }
        }
      },
      select: { id_viaje_pub: true, destino_texto: true }
    });

    // Obtener viajes donde el usuario es pasajero aceptado
    const solicitudesAceptadas = await prisma.solicitudes_viaje.findMany({
      where: {
        id_pasajero: context.user.id,
        estado_solicitud: 'aceptada'
      },
      select: { id_viaje_pub: true }
    });

    // Combinar IDs de viajes
    const idsViajes = [
      ...viajesConductor.map(v => v.id_viaje_pub),
      ...solicitudesAceptadas.map(s => s.id_viaje_pub)
    ];

    // Eliminar duplicados
    const idsUnicos = [...new Set(idsViajes)];

    // Obtener último mensaje de cada viaje
    const chats = [];
    for (const viajeId of idsUnicos) {
      const ultimoMensaje = await prisma.mensajes_chat.findFirst({
        where: { id_viaje_pub: viajeId },
        orderBy: { fecha_envio: 'desc' },
        include: { emisor: { select: { nombre: true } } }
      });

      chats.push({
        idViaje: viajeId,
        remitente: ultimoMensaje?.emisor?.nombre || 'Usuario',
        texto: ultimoMensaje?.contenido || 'Sin mensajes',
        fecha: ultimoMensaje?.fecha_envio || new Date(),
        esMio: ultimoMensaje?.id_emisor === context.user.id
      });
    }

    // Ordenar por fecha descendente
    chats.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return { success: true, chats, idUsuario: context.user.id };
  });

// Obtener estado del viaje (para el chat)
export const getEstado = protectedProcedure
  .input(z.object({ viajeId: z.number() }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.viajeId },
      select: { fecha_hora_salida: true }
    });

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'Viaje no encontrado' });
    }

    const estado = viaje.fecha_hora_salida < new Date() ? 'finalizado' : 'activo';
    return { estado };
  });