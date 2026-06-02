import cron from 'node-cron';
import { prisma } from '../orpc/context';
import { Server } from 'socket.io';
import logger from './logger';

/**
 * Cancela automáticamente los viajes que no iniciaron dentro de los
 * 5 minutos de tolerancia después de su hora programada.
 * Usa hora del servidor (Date.now())
 */
const cancelarViajesExpirados = async (io: Server) => {
  const ahora = new Date();
  // Tolerancia: 5 minutos después de la hora de salida
  const limiteExpiracion = new Date(ahora.getTime() - 5 * 60 * 1000);

  try {
    // Buscar viajes cuya hora de salida ya pasó y que no tienen viajes activos en curso o finalizados
    const viajesExpirados = await prisma.viajes_publicados.findMany({
      where: {
        fecha_hora_salida: {
          lte: limiteExpiracion,
        },
        viajes_activos: {
          none: {
            estado_trayecto: {
              in: ['en_curso', 'finalizado', 'cancelado'],
            },
          },
        },
      },
      include: {
        conductor: {
          include: { usuario: true },
        },
        solicitudes: {
          select: { id_pasajero: true },
        },
      },
    });

    if (viajesExpirados.length === 0) return;

    logger.info('Viajes expirados encontrados por CronJob', { cantidad: viajesExpirados.length });

    for (const viaje of viajesExpirados) {
      try {
        logger.info('Cancelando viaje expirado automáticamente', { viajeId: viaje.id_viaje_pub, destino: viaje.destino_texto });

        // 1. Rechazar solicitudes pendientes del viaje
        await prisma.solicitudes_viaje.updateMany({
          where: {
            id_viaje_pub: viaje.id_viaje_pub,
            estado_solicitud: { in: ['pendiente', 'aceptada'] },
          },
          data: { estado_solicitud: 'rechazada' },
        });

        // 2. Crear registro en viajes_activos como cancelado
        //    Esto evita que el cron vuelva a encontrar el viaje
        await prisma.viajes_activos.create({
          data: {
            id_viaje_pub: viaje.id_viaje_pub,
            hora_inicio_real: viaje.fecha_hora_salida,
            hora_fin_real: new Date(),
            estado_trayecto: 'cancelado',
            historial_ruta: [],
          },
        });

        // 3. Registrar en historial de auditoría
        await prisma.historial_viajes.create({
          data: {
            id_viaje_pub: viaje.id_viaje_pub,
            accion: 'cancelado',
            motivo: 'El conductor no inició el viaje dentro de los 5 minutos de tolerancia.',
            realizado_por: 'sistema',
            id_usuario: viaje.conductor?.usuario?.id_usuario ?? 'sistema',
            fecha_cambio: new Date(),
          },
        });

        // 4. Notificar a los pasajeros
        for (const solicitud of viaje.solicitudes) {
          await prisma.notificaciones.create({
            data: {
              id_usuario:      solicitud.id_pasajero,
              titulo:          'Viaje cancelado automáticamente',
              cuerpo_mensaje:  `El viaje a ${viaje.destino_texto} fue cancelado porque el conductor no lo inició a tiempo.`,
              tipo_notif:      'cancelacion',
              leido:           false,
              fecha_creacion:  new Date(),
              id_viaje:        viaje.id_viaje_pub,
            },
          });

          io.emit('nueva_notificacion', {
            usuarioId: solicitud.id_pasajero,
            titulo:    'Viaje cancelado automáticamente',
            cuerpo:    `El viaje a ${viaje.destino_texto} no inició a tiempo y fue cancelado.`,
            tipo:      'cancelacion',
          });
        }

        // 5. Notificar al conductor
        if (viaje.conductor?.usuario) {
          await prisma.notificaciones.create({
            data: {
              id_usuario:     viaje.conductor.usuario.id_usuario,
              titulo:         'Tu viaje fue cancelado automáticamente',
              cuerpo_mensaje: `Tu viaje a ${viaje.destino_texto} fue cancelado porque no lo iniciaste dentro de los 5 minutos de tolerancia.`,
              tipo_notif:     'cancelacion',
              leido:          false,
              fecha_creacion: new Date(),
              id_viaje:       viaje.id_viaje_pub,
            },
          });

          io.emit('nueva_notificacion', {
            usuarioId: viaje.conductor.usuario.id_usuario,
            titulo:    'Tu viaje fue cancelado automáticamente',
            cuerpo:    `Tu viaje a ${viaje.destino_texto} no fue iniciado a tiempo.`,
            tipo:      'cancelacion',
          });
        }

        // 6. Emitir evento global para que ambas pantallas recarguen
        io.emit('viaje_cancelado', {
          viajeId:    viaje.id_viaje_pub,
          automatico: true,
          mensaje:    `El viaje a ${viaje.destino_texto} fue cancelado por inactividad.`,
        });

        logger.info('Viaje cancelado automáticamente con éxito', { viajeId: viaje.id_viaje_pub });
      } catch (errorViaje) {
        logger.error('Error al cancelar viaje expirado', { error: errorViaje instanceof Error ? errorViaje.message : errorViaje, viajeId: viaje.id_viaje_pub });
      }
    }
  } catch (error) {
    logger.error('Error general en cron de cancelación de viajes', { error: error instanceof Error ? error.message : error });
  }
};


export const iniciarCronJobs = (io: Server): void => {
  // Ejecutar cada minuto: "* * * * *"
  cron.schedule('* * * * *', async () => {
    await cancelarViajesExpirados(io);
  });

  logger.info('CronJobs iniciados: revisión de viajes expirados configurada');
};