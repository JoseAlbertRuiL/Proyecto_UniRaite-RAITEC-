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

    const { io } = require('../../server');
    if (io) {
      io.to(`chat_${input.id_viaje_pub}`).emit('new_message', mensaje);
    }

    return mensaje;
  });

// Obtener chats del usuario - TODOS los viajes (sin filtrar por fecha)
export const misChats = protectedProcedure
  .handler(async ({ context }) => {
    const viajesConductor = await prisma.viajes_publicados.findMany({
      where: {
        conductor: {
          usuario: { id_usuario: context.user.id }
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

    // Crear un array de viajes desde las solicitudes aceptadas
    const viajesDesdeSolicitudes = solicitudesAceptadas.map(solicitud => ({
      id_viaje_pub: solicitud.viaje.id_viaje_pub,
      destino_texto: solicitud.viaje.destino_texto,
      fecha_hora_salida: solicitud.viaje.fecha_hora_salida,
      asientos_disponibles: solicitud.viaje.asientos_disponibles
    }));

    // Combinar todos los IDs de viajes
    const idsViajes: number[] = [
      ...viajesConductor.map(v => v.id_viaje_pub),
      ...viajesDesdeSolicitudes.map(v => v.id_viaje_pub)
    ];

    const idsUnicos = [...new Set(idsViajes)];

    const chats = [];
    for (const viajeId of idsUnicos) {
      // Obtener el último mensaje del chat
      const ultimoMensaje = await prisma.mensajes_chat.findFirst({
        where: { id_viaje_pub: viajeId },
        orderBy: { fecha_envio: 'desc' },
        include: { emisor: { select: { nombre: true } } }
      });

      // Buscar el viaje en los arrays
      let viaje = viajesConductor.find(v => v.id_viaje_pub === viajeId);
      if (!viaje) {
        viaje = viajesDesdeSolicitudes.find(v => v.id_viaje_pub === viajeId);
      }

      // Si no se encuentra el viaje, saltar
      if (!viaje) {
        continue;
      }

      // Determinar si el viaje está finalizado (solo por asientos disponibles)
      const estaFinalizado = viaje.asientos_disponibles === 0;
      
      chats.push({
        idViaje: viajeId,
        destino: viaje.destino_texto || 'Viaje',
        fechaViaje: viaje.fecha_hora_salida,
        remitente: ultimoMensaje?.emisor?.nombre || 'Usuario',
        texto: ultimoMensaje?.contenido || 'Sin mensajes',
        fecha: ultimoMensaje?.fecha_envio || new Date(),
        esMio: ultimoMensaje?.id_emisor === context.user.id,
        finalizado: estaFinalizado
      });
    }

    // Ordenar chats por fecha del último mensaje (más reciente primero)
    chats.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return { success: true, chats, idUsuario: context.user.id };
  });

// Obtener estado del viaje
export const getEstado = protectedProcedure
  .input(z.object({ viajeId: z.number() }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.viajeId },
      select: { asientos_disponibles: true }
    });

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'Viaje no encontrado' });
    }

    // El viaje está activo si tiene asientos disponibles
    const estado = viaje.asientos_disponibles > 0 ? 'activo' : 'finalizado';
    return { estado };
  });

// Contar mensajes no leídos del usuario - TODOS los viajes
export const contarMensajesNoLeidos = protectedProcedure
  .handler(async ({ context }) => {
    // Obtener viajes donde el usuario es conductor
    const viajesConductor = await prisma.viajes_publicados.findMany({
      where: {
        conductor: {
          usuario: { id_usuario: context.user.id }
        }
      },
      select: { id_viaje_pub: true }
    });

    // Obtener viajes donde el usuario es pasajero y fue aceptado
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

    const idsUnicos = [...new Set(idsViajes)];

    // Contar mensajes no leídos
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

// Marcar mensajes como leídos en un viaje
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
    
    const { io } = require('../../server');
    if (io) {
      io.emit('mensajes_leidos', { usuarioId: context.user.id, viajeId: input.viajeId });
    }
    
    return { success: true };
  });