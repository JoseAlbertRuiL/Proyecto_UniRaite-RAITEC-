import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { protectedProcedure } from '../middleware'
import { prisma } from '../context'

// POST /api/viajes/:id/solicitar
export const solicitarViaje = protectedProcedure
  .input(z.object({ viajeId: z.number() }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.viajeId },
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

    const solicitud = await prisma.solicitudes_viaje.create({
      data: {
        id_viaje_pub: input.viajeId,
        id_pasajero: context.user.id,
        estado_solicitud: 'pendiente',
        fecha_solicitud: new Date(),
      },
    });

    return { success: true, solicitud };
  });

// PUT /api/solicitudes/:id  — aceptar o rechazar (solo el conductor dueño del viaje)
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
      include: { viaje: true },
    })

    if (!solicitud) {
      throw new ORPCError('NOT_FOUND', { message: 'Solicitud no encontrada' })
    }

    // Verificar que quien responde es el conductor del viaje
    const conductor = await prisma.conductores.findUnique({
      where: { id_licencia: solicitud.viaje.id_licencia_conductor },
      include: { usuario: true },
    })

    if (conductor?.usuario?.id_usuario !== context.user.id) {
      throw new ORPCError('FORBIDDEN', { message: 'No autorizado' })
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
  console.log(`🔍 Buscando solicitud para viaje ${input.viajeId}, usuario ${context.user.id}`); // ← LOG
    const solicitud = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: input.viajeId,
        id_pasajero: context.user.id,
      },
    });
    console.log(`📋 Solicitud encontrada:`, solicitud); // ← LOG
    return { estado: solicitud?.estado_solicitud || null };
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
        }
      },
      orderBy: { fecha_solicitud: 'desc' },
      take: 1,
    });
    return { success: true, solicitudes };
  });