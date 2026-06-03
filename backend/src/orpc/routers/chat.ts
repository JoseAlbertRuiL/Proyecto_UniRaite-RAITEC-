import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { baseProcedure, protectedProcedure } from '../middleware'
import { prisma } from '../context'
import logger from '../../services/logger'

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
        leido: false
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

    try {
      const { io } = require('../../server');
      if (io) {
        io.to(`chat_${input.id_viaje_pub}`).emit('new_message', mensaje);
      }
    } catch (e) {
      logger.error('Error al emitir mensaje por socket', { 
        error: e instanceof Error ? e.message : e, 
        viajeId: input.id_viaje_pub, 
        emisorId: context.user.id 
      })
    }

    return mensaje;
  });

// Obtener chats del usuario (Corregido: Solo muestra chats con match confirmado)
export const misChats = protectedProcedure
  .handler(async ({ context }) => {
    const viajesConductor = await prisma.viajes_publicados.findMany({
      where: {
        conductor: {
          usuario: { id_usuario: context.user.id }
        },
        // --- FILTRO CORREGIDO: Solo viajes que tengan al menos una solicitud aceptada ---
        solicitudes: {
          some: { estado_solicitud: 'aceptada' }
        }
      },
      select: { 
        id_viaje_pub: true, 
        destino_texto: true, 
        fecha_hora_salida: true, 
        asientos_disponibles: true 
      }
    });

    const solicitudesAceptadas = await prisma.solicitudes_viaje.findMany({
      where: {
        id_pasajero: context.user.id,
        estado_solicitud: 'aceptada'
      },
      include: {
        viaje: {
          select: {
            id_viaje_pub: true,
            destino_texto: true,
            fecha_hora_salida: true,
            asientos_disponibles: true
          }
        }
      }
    });

    const viajesDesdeSolicitudes = solicitudesAceptadas.map(solicitud => ({
      id_viaje_pub: solicitud.viaje.id_viaje_pub,
      destino_texto: solicitud.viaje.destino_texto,
      fecha_hora_salida: solicitud.viaje.fecha_hora_salida,
      asientos_disponibles: solicitud.viaje.asientos_disponibles
    }));

    const idsViajes: number[] = [
      ...viajesConductor.map(v => v.id_viaje_pub),
      ...viajesDesdeSolicitudes.map(v => v.id_viaje_pub)
    ];

    const idsUnicos = [...new Set(idsViajes)];

    const chats = [];
    for (const viajeId of idsUnicos) {
      const ultimoMensaje = await prisma.mensajes_chat.findFirst({
        where: { id_viaje_pub: viajeId },
        orderBy: { fecha_envio: 'desc' },
        include: { emisor: { select: { nombre: true } } }
      });

      let viaje = viajesConductor.find(v => v.id_viaje_pub === viajeId);
      if (!viaje) {
        viaje = viajesDesdeSolicitudes.find(v => v.id_viaje_pub === viajeId);
      }

      if (!viaje) continue;

      
      const viajeFinalizado = await prisma.viajes_activos.findFirst({
      where: { id_viaje_pub: viajeId, estado_trayecto: 'finalizado' }
    });
    const estaFinalizado = !!viajeFinalizado;

      if (!ultimoMensaje && estaFinalizado) {
        continue;
      }

      chats.push({
        idViaje: viajeId,
        destino: viaje.destino_texto || 'Viaje',
        fechaViaje: viaje.fecha_hora_salida,
        remitente: ultimoMensaje ? (ultimoMensaje.emisor?.nombre || 'Usuario') : 'Sistema',
        texto: ultimoMensaje ? ultimoMensaje.contenido : '¡Match confirmado! Escribe algo...',
        fecha: ultimoMensaje ? ultimoMensaje.fecha_envio : viaje.fecha_hora_salida,
        esMio: ultimoMensaje ? (ultimoMensaje.id_emisor === context.user.id) : false,
        finalizado: estaFinalizado
      });
    }

    // Ordenar chats por fecha (más reciente primero)
    chats.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Regresar solo los últimos 10 chats[cite: 4]
    return { success: true, chats: chats.slice(0, 10), idUsuario: context.user.id };
  });
  
// Eliminar historial de chat (solo conductor)
export const eliminarHistorial = protectedProcedure
  .input(z.object({ idViaje: z.number() }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.idViaje },
      include: { conductor: { include: { usuario: { select: { id_usuario: true } } } } },
    });

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'Viaje no encontrado' });
    }

    if (viaje.conductor?.usuario?.id_usuario !== context.user.id) {
      throw new ORPCError('FORBIDDEN', { message: 'Solo el conductor puede eliminar el historial del chat' });
    }

    await prisma.mensajes_chat.deleteMany({
      where: {
        id_viaje_pub: input.idViaje
      }
    });

    return { success: true, message: 'Historial eliminado correctamente' };
  });

// Obtener estado del viaje
export const getEstado = protectedProcedure
  .input(z.object({ viajeId: z.number() }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.viajeId },
      select: { id_viaje_pub: true } // Ya no necesitamos los asientos aquí
    });

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'Viaje no encontrado' });
    }

    // Buscamos si el viaje ya tiene un registro de que finalizó
    const viajeActivo = await prisma.viajes_activos.findFirst({
      where: { 
        id_viaje_pub: input.viajeId, 
        estado_trayecto: 'finalizado' 
      }
    });

    const estado = viajeActivo ? 'finalizado' : 'activo';
    return { estado };
  });
// Contar mensajes no leídos del usuario
export const contarMensajesNoLeidos = protectedProcedure
  .handler(async ({ context }) => {
    const viajesConductor = await prisma.viajes_publicados.findMany({
      where: {
        conductor: {
          usuario: { id_usuario: context.user.id }
        }
      },
      select: { id_viaje_pub: true }
    });

    const solicitudesAceptadas = await prisma.solicitudes_viaje.findMany({
      where: {
        id_pasajero: context.user.id,
        estado_solicitud: 'aceptada'
      },
      select: { id_viaje_pub: true }
    });

    const idsViajes = [
      ...viajesConductor.map(v => v.id_viaje_pub),
      ...solicitudesAceptadas.map(s => s.id_viaje_pub)
    ];

    const idsUnicos = [...new Set(idsViajes)];

    let totalNoLeidos = 0;
    for (const viajeId of idsUnicos) {
      const count = await prisma.mensajes_chat.count({
        where: {
          id_viaje_pub: viajeId,
          id_emisor: { not: context.user.id },
          leido: false
        }
      });
      totalNoLeidos += count;
    }

    return { success: true, total: totalNoLeidos };
  });

// 7. Marcar mensajes como leídos en un viaje
export const marcarComoLeidos = protectedProcedure
  .input(z.object({ viajeId: z.number() }))
  .handler(async ({ input, context }) => {
    await prisma.mensajes_chat.updateMany({
      where: {
        id_viaje_pub: input.viajeId,
        id_emisor: { not: context.user.id },
        leido: false
      },
      data: { leido: true }
    });
    
    try {
      const { io } = require('../../server');
      if (io) {
        io.to(`chat_${input.viajeId}`).emit('mensajes_leidos', { usuarioId: context.user.id, viajeId: input.viajeId });
      }
    } catch (e) {
      logger.error('Error al emitir mensajes leídos por socket', { 
        error: e instanceof Error ? e.message : e, 
        viajeId: input.viajeId, 
        usuarioId: context.user.id 
      })
    }
    
    return { success: true };
  });