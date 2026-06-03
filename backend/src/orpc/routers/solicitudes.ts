import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { protectedProcedure } from '../middleware'
import { prisma } from '../context'
import { io } from '../../server'
import logger from '../../services/logger'

// Función auxiliar para crear notificaciones
const crearNotificacion = async (
  usuarioId: string,
  titulo: string,
  cuerpo: string,
  tipo: string,
  idViaje?: number
) => {
  await prisma.notificaciones.create({
    data: {
      id_usuario: usuarioId,
      titulo,
      cuerpo_mensaje: cuerpo,
      tipo_notif: tipo,
      leido: false,
      fecha_creacion: new Date(),
      id_viaje: idViaje,
    },
  });
};

// POST /api/viajes/:id/solicitar
export const solicitarViaje = protectedProcedure
  .input(z.object({
    viajeId: z.number(),
    latitud_recogida: z.number().optional(),
    longitud_recogida: z.number().optional(),
  }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.viajeId },
      include: { conductor: { include: { usuario: true } } }
    });

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'Viaje no encontrado' });
    }

    if (viaje.asientos_disponibles <= 0) {
      throw new ORPCError('BAD_REQUEST', { message: 'No hay asientos disponibles' });
    }

    const solicitudExistente = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: input.viajeId,
        id_pasajero: context.user.id,
      },
    });

    if (solicitudExistente) {
      throw new ORPCError('CONFLICT', { message: 'Ya has solicitado este viaje' });
    }

    // Obtener el usuario completo para obtener nombre y apellido
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: context.user.id },
      select: { nombre: true, apellido_paterno: true }
    });

    const solicitud = await prisma.solicitudes_viaje.create({
      data: {
        id_viaje_pub: input.viajeId,
        id_pasajero: context.user.id,
        estado_solicitud: 'pendiente',
        fecha_solicitud: new Date(),
        latitud_recogida:  input.latitud_recogida ?? null,
        longitud_recogida: input.longitud_recogida ?? null,
      },
    });

    // NOTIFICACIÓN: Avisar al conductor que tiene una nueva solicitud
    if (!viaje.conductor?.usuario) {
      throw new ORPCError('NOT_FOUND', { message: 'Conductor no encontrado' });
    }

    await crearNotificacion(
      viaje.conductor.usuario.id_usuario,
      "Nueva solicitud de viaje",
      `${usuario?.nombre} ${usuario?.apellido_paterno} ha solicitado un asiento en tu viaje a ${viaje.destino_texto}`,
      "solicitud",
      viaje.id_viaje_pub
    );

    // EMITIR EVENTO WEBSOCKET
    if (io) {
      io.emit('nueva_solicitud', {
        viajeId: input.viajeId,
        solicitud,
        mensaje: `Nueva solicitud para el viaje a ${viaje.destino_texto}`
      });
      
      io.emit('nueva_notificacion', {
        usuarioId: viaje.conductor.usuario.id_usuario,
        titulo: "Nueva solicitud de viaje",
        cuerpo: `${usuario?.nombre} ${usuario?.apellido_paterno} ha solicitado un asiento en tu viaje`,
        tipo: "solicitud"
      });
      
      logger.info('Eventos nueva_solicitud y nueva_notificacion emitidos', { viajeId: input.viajeId })
    }

    return { success: true, solicitud };
  });

// PUT /api/solicitudes/:id
export const responderSolicitud = protectedProcedure
  .input(
    z.object({
      solicitudId: z.number().int(),
      estado: z.enum(['aceptada', 'rechazada']),
    })
  )
  .handler(async ({ input, context }) => {
    const solicitud = await prisma.solicitudes_viaje.findUnique({
      where: { id_solicitud: input.solicitudId },
      include: { 
        viaje: true,
        pasajero: true
      },
    })

    if (!solicitud) {
      throw new ORPCError('NOT_FOUND', { message: 'Solicitud no encontrada' })
    }

    const conductor = await prisma.conductores.findUnique({
      where: { id_licencia: solicitud.viaje.id_licencia_conductor },
      include: { usuario: true },
    })

    if (conductor?.usuario?.id_usuario !== context.user.id) {
      throw new ORPCError('FORBIDDEN', { message: 'No autorizado' })
    }

    // CONTAR SOLICITUDES YA ACEPTADAS
    const solicitudesAceptadas = await prisma.solicitudes_viaje.count({
      where: {
        id_viaje_pub: solicitud.id_viaje_pub,
        estado_solicitud: 'aceptada',
      },
    })

    // VALIDAR QUE NO SUPERE LOS ASIENTOS DISPONIBLES
    if (input.estado === 'aceptada') {
      if (solicitud.viaje.asientos_disponibles <= 0) {
        throw new ORPCError('BAD_REQUEST', { 
          message: 'No hay suficientes asientos disponibles. El viaje ya está completo.' 
        })
      }
    }

    const solicitudActualizada = await prisma.solicitudes_viaje.update({
      where: { id_solicitud: input.solicitudId },
      data: { estado_solicitud: input.estado },
    })

    if (input.estado === 'aceptada') {
      await prisma.viajes_publicados.update({
        where: { id_viaje_pub: solicitud.id_viaje_pub },
        data: { asientos_disponibles: { decrement: 1 } },
      })
    }

    // NOTIFICACIÓN: Avisar al pasajero que su solicitud fue respondida
    const mensaje = input.estado === 'aceptada' 
      ? `¡Tu solicitud para el viaje a ${solicitud.viaje.destino_texto} ha sido ACEPTADA!`
      : `Tu solicitud para el viaje a ${solicitud.viaje.destino_texto} ha sido RECHAZADA`;

    await crearNotificacion(
      solicitud.id_pasajero,
      input.estado === 'aceptada' ? "Solicitud aceptada" : "Solicitud rechazada",
      mensaje,
      input.estado === 'aceptada' ? "aceptacion" : "rechazo",
      solicitud.id_viaje_pub
    );

    // EMITIR EVENTO WEBSOCKET
    if (io) {
      io.emit('solicitud_actualizada', {
        viajeId: solicitud.id_viaje_pub,
        solicitudId: input.solicitudId,
        estado: input.estado,
        mensaje: `Solicitud ${input.estado === 'aceptada' ? 'aceptada' : 'rechazada'} para el viaje a ${solicitud.viaje.destino_texto}`
      });
      
      io.emit('nueva_notificacion', {
        usuarioId: solicitud.id_pasajero,
        titulo: input.estado === 'aceptada' ? "Solicitud aceptada" : "Solicitud rechazada",
        cuerpo: mensaje,
        tipo: input.estado === 'aceptada' ? "aceptacion" : "rechazo"
      });
      
      logger.info('Eventos solicitud_actualizada y nueva_notificacion emitidos', { solicitudId: input.solicitudId, estado: input.estado })
    }

    return { success: true, solicitud: solicitudActualizada }
  })

// GET /api/solicitudes/recibidas
export const obtenerSolicitudesRecibidas = protectedProcedure
  .handler(async ({ context }) => {
    const solicitudes = await prisma.solicitudes_viaje.findMany({
      where: {
        viaje: {
          conductor: {
            usuario: { id_usuario: context.user.id }
          }
        },
        estado_solicitud: 'pendiente'
      },
      include: {
        viaje: {
          include: {
            solicitudes: {
              where: { estado_solicitud: 'aceptada' }
            },
            conductor: {
              include: {
                usuario: {
                  select: {
                    id_usuario: true,
                    nombre: true,
                    apellido_paterno: true,
                    foto_perfil: true,
                  }
                }
              }
            }
          }
        },
        pasajero: {
          select: {
            id_usuario: true,
            nombre: true,
            apellido_paterno: true,
            foto_perfil: true,
          }
        }
      },
      orderBy: { fecha_solicitud: 'desc' }
    });

    return { success: true, solicitudes };
  });

// GET /api/solicitudes/estado/:viajeId
export const obtenerEstadoPorViaje = protectedProcedure
  .input(z.object({ viajeId: z.number() }))
  .handler(async ({ input, context }) => {
    logger.debug('Buscando solicitud para viaje', { viajeId: input.viajeId, userId: context.user.id })
    const solicitud = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: input.viajeId,
        id_pasajero: context.user.id,
      },
      include: {
        viaje: {
          select: {
            viajes_activos: {
              select: { id_viaje_activo: true, estado_trayecto: true },
              take: 1,
            },
          },
        },
      },
    });
    logger.debug('Solicitud encontrada', { solicitudId: solicitud?.id_solicitud })

    let estado: string | null = solicitud?.estado_solicitud || null;

    // Si la solicitud está aceptada y el viaje tiene un viaje_activo:
    //   - en_curso → devolver "en_curso"
    //   - cancelado → devolver "cancelado"
    if (estado === 'aceptada' && (solicitud?.viaje?.viajes_activos?.length ?? 0) > 0) {
      const estadoTrayecto = solicitud!.viaje!.viajes_activos[0].estado_trayecto;
      estado = estadoTrayecto;
    }

    return { estado };
  });

// Obtener todas las solicitudes del pasajero
export const misSolicitudes = protectedProcedure
  .handler(async ({ context }) => {
    const solicitudes = await prisma.solicitudes_viaje.findMany({
      where: { id_pasajero: context.user.id },
      include: { viaje: { include: { conductor: { include: { usuario: true } } } } },
    });
    return { success: true, solicitudes };
  });

// GET /api/solicitudes/activas - obtener solicitudes activas del usuario (pendiente o aceptada)
export const obtenerSolicitudesActivas = protectedProcedure
  .handler(async ({ context }) => {
    const solicitudes = await prisma.solicitudes_viaje.findMany({
      where: {
        id_pasajero: context.user.id,
        estado_solicitud: {
          in: ['pendiente', 'aceptada']
        },
        viaje: {
          viajes_activos: {
            none: {
              estado_trayecto: {
                in: ['finalizado', 'cancelado']
              }
            },
          },
        },
      },
      include: {
        viaje: {
          select: {
            id_viaje_pub: true,
            origen_texto: true,
            destino_texto: true,
            latitud_origen: true,
            longitud_origen: true,
            latitud_destino: true,
            longitud_destino: true,
            fecha_hora_salida: true,
            costo_estimado: true,
            viajes_activos: {
              select: { id_viaje_activo: true, estado_trayecto: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { fecha_solicitud: 'desc' },
      take: 1,
    });

    return { success: true, solicitudes };

    // return {
    //   success: true,
    //   solicitudes: solicitudes.map((s) => ({
    //     ...s,
    //     latitud_recogida: s.latitud_recogida,
    //     longitud_recogida: s.longitud_recogida,
    //   })),
    // };
  });

// PUT /api/solicitudes/:id/cancelar
export const cancelarSolicitud = protectedProcedure
  .input(z.object({
    solicitudId: z.number().int(),
    motivo: z.string().optional(),
  }))
  .handler(async ({ input, context }) => {
    const solicitud = await prisma.solicitudes_viaje.findUnique({
      where: { id_solicitud: input.solicitudId },
      include: {
        viaje: { include: { conductor: { include: { usuario: true } } } },
      },
    });

    if (!solicitud) {
      throw new ORPCError('NOT_FOUND', { message: 'Solicitud no encontrada' });
    }

    if (solicitud.id_pasajero !== context.user.id) {
      throw new ORPCError('FORBIDDEN', { message: 'No autorizado para cancelar esta solicitud' });
    }

    if (!['pendiente', 'aceptada'].includes(solicitud.estado_solicitud)) {
      throw new ORPCError('BAD_REQUEST', { message: 'Solo puedes cancelar solicitudes pendientes o aceptadas' });
    }

    const eraAceptada = solicitud.estado_solicitud === 'aceptada';

    if (eraAceptada) {
      await prisma.solicitudes_viaje.update({
        where: { id_solicitud: input.solicitudId },
        data: { estado_solicitud: 'rechazada' },
      });

      await prisma.viajes_publicados.update({
        where: { id_viaje_pub: solicitud.id_viaje_pub },
        data: { asientos_disponibles: { increment: 1 } },
      });
    } else {
      await prisma.solicitudes_viaje.delete({
        where: { id_solicitud: input.solicitudId },
      });
    }

    const motivoTexto = input.motivo ? ` Motivo: ${input.motivo}` : '';
    const notifCuerpo = eraAceptada
      ? `Un pasajero ha cancelado su viaje aceptado a ${solicitud.viaje.destino_texto}.${motivoTexto}`
      : `Un pasajero ha cancelado su solicitud para el viaje a ${solicitud.viaje.destino_texto}.${motivoTexto}`;

    // NOTIFICACIÓN: Avisar al conductor
    if (solicitud.viaje?.conductor?.usuario) {
      await crearNotificacion(
        solicitud.viaje.conductor.usuario.id_usuario,
        eraAceptada ? "Viaje cancelado por pasajero" : "Solicitud cancelada",
        notifCuerpo,
        "cancelacion",
        solicitud.id_viaje_pub
      );
    }

    // EMITIR EVENTO WEBSOCKET
    if (io) {
      io.emit('solicitud_cancelada', {
        viajeId: solicitud.id_viaje_pub,
        solicitudId: input.solicitudId,
        mensaje: notifCuerpo,
      });

      if (solicitud.viaje?.conductor?.usuario) {
        io.emit('nueva_notificacion', {
          usuarioId: solicitud.viaje.conductor.usuario.id_usuario,
          titulo: eraAceptada ? "Viaje cancelado por pasajero" : "Solicitud cancelada",
          cuerpo: notifCuerpo,
          tipo: "cancelacion"
        });
      }

      logger.info('Evento solicitud_cancelada emitido', { solicitudId: input.solicitudId })
    }

    return { success: true, message: 'Solicitud cancelada exitosamente' };
  });