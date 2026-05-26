import cron from 'node-cron';
import { prisma } from '../orpc/context';
import { Server } from 'socket.io';

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
              in: ['en_curso', 'finalizado'],
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

    console.log(`⏰ [CronJob] ${viajesExpirados.length} viaje(s) expirado(s) encontrado(s)`);

    for (const viaje of viajesExpirados) {
      try {
        console.log(
          `🗑️  [CronJob] Cancelando viaje ${viaje.id_viaje_pub}: ` +
          `${viaje.origen_texto} → ${viaje.destino_texto} ` +
          `(salida: ${viaje.fecha_hora_salida.toISOString()})`
        );

        // Notificar a todos los pasajeros que solicitaron el viaje
        for (const solicitud of viaje.solicitudes) {
          await prisma.notificaciones.create({
            data: {
              id_usuario:      solicitud.id_pasajero,
              titulo:          'Viaje cancelado automáticamente',
              cuerpo_mensaje:  `El viaje a ${viaje.destino_texto} fue cancelado porque el conductor no lo inició a tiempo.`,
              tipo_notif:      'cancelacion',
              leido:           false,
              fecha_creacion:  new Date(),
            },
          });

          // WebSocket: notificación individual al pasajero
          io.emit('nueva_notificacion', {
            usuarioId: solicitud.id_pasajero,
            titulo:    'Viaje cancelado automáticamente',
            cuerpo:    `El viaje a ${viaje.destino_texto} no inició a tiempo y fue cancelado.`,
            tipo:      'cancelacion',
          });
        }

        // Notificar al conductor
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

        // Emitir evento global para que ambas pantallas recarguen
        io.emit('viaje_cancelado', {
          viajeId:    viaje.id_viaje_pub,
          automatico: true,
          mensaje:    `El viaje a ${viaje.destino_texto} fue cancelado por inactividad.`,
        });

        // Eliminar en cascada
        await prisma.mensajes_chat.deleteMany({
          where: { id_viaje_pub: viaje.id_viaje_pub },
        });

        await prisma.viajes_activos.deleteMany({
          where: { id_viaje_pub: viaje.id_viaje_pub },
        });

        await prisma.solicitudes_viaje.deleteMany({
          where: { id_viaje_pub: viaje.id_viaje_pub },
        });

        await prisma.viajes_publicados.delete({
          where: { id_viaje_pub: viaje.id_viaje_pub },
        });

        console.log(`✅ [CronJob] Viaje ${viaje.id_viaje_pub} eliminado correctamente`);
      } catch (errorViaje) {
        console.error(`❌ [CronJob] Error al cancelar viaje ${viaje.id_viaje_pub}:`, errorViaje);
      }
    }
  } catch (error) {
    console.error('❌ [CronJob] Error general en cancelarViajesExpirados:', error);
  }
};


export const iniciarCronJobs = (io: Server): void => {
  // Ejecutar cada minuto: "* * * * *"
  cron.schedule('* * * * *', async () => {
    await cancelarViajesExpirados(io);
  });

  console.log('CronJobs iniciados: revisión de viajes expirados cada minuto');
};