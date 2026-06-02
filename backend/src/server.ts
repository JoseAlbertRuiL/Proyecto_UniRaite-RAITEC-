import http from 'http'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import app from './app'
import { iniciarCronJobs } from './services/cronJobs'
import logger from './services/logger';

require('dotenv').config()

const serverHttp = http.createServer(app)
const io = new Server(serverHttp, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

// ─── Helper: verificar acceso a chat ──────────────────────────────────────────
const tieneAccesoChat = async (prisma: PrismaClient, userId: string, viajeId: number) => {
  const viaje = await prisma.viajes_publicados.findUnique({
    where: { id_viaje_pub: viajeId },
    select: {
      id_licencia_conductor: true,
      conductor: { select: { usuario: { select: { id_usuario: true } } } },
    },
  });
  if (!viaje) return false;

  const esConductor = viaje.conductor?.usuario?.id_usuario === userId;
  if (esConductor) return true;

  const solicitud = await prisma.solicitudes_viaje.findFirst({
    where: {
      id_viaje_pub: viajeId,
      id_pasajero: userId,
      estado_solicitud: 'aceptada',
    },
  });
  return !!solicitud;
};

export { io }

// ─── Middleware de autenticación para Socket.IO ───────────────────────────────

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token requerido'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: (decoded as any).id },
    });

    if (!usuario) {
      return next(new Error('Usuario no encontrado'));
    }

    (socket as any).user = usuario;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

// ─── Eventos de Socket.IO ─────────────────────────────────────────────────────

io.on('connection', (socket) => {
logger.info('Usuario conectado a Socket.IO', { userId: (socket as any).user?.id_usuario });

  socket.on('join_chat', async (chatId: string) => {
    const user = (socket as any).user;
    const viajeId = parseInt(chatId);
    if (isNaN(viajeId)) return;

    const puedeAcceder = await tieneAccesoChat(prisma, user.id_usuario, viajeId);
    if (!puedeAcceder) {
      socket.emit('chat_error', 'No tienes acceso a este chat');
      return;
    }
    socket.join(`chat_${chatId}`);
    logger.debug('Usuario unido al chat', { chatId });
  });

  socket.on('send_message', async (data: { chatId: string; message: string; receiverId: string }) => {
    const user = (socket as any).user;
    const viajeId = parseInt(data.chatId);
    if (isNaN(viajeId)) return;

    const puedeEnviar = await tieneAccesoChat(prisma, user.id_usuario, viajeId);
    if (!puedeEnviar) {
      socket.emit('chat_error', 'No tienes permiso para enviar mensajes en este chat');
      return;
    }

    try {
      const mensaje = await prisma.mensajes_chat.create({
        data: {
          id_viaje_pub: viajeId,
          id_emisor: user.id_usuario,
          contenido: data.message,
          fecha_envio: new Date(),
        },
        include: { emisor: { select: { nombre: true, foto_perfil: true } } },
      });

      io.to(`chat_${data.chatId}`).emit('new_message', mensaje);
    } catch (error) {
      logger.error('Error al guardar mensaje', { error: error instanceof Error ? error.message : error });
      socket.emit('message_error', 'No se pudo enviar el mensaje');
    }
  });

  socket.on('driver_location', async (data: {
    viajeActivoId: number;
    viajeId: number;
    lat: number;
    lng: number;
  }) => {
    logger.debug('Ubicación de conductor recibida', { conductorId: (socket as any).user?.id_usuario, viajeId: data.viajeId });

    const roomName = `viaje_${data.viajeId}`;
    const socketsEnRoom = await io.in(roomName).fetchSockets();
    logger.debug('Emitiendo ubicación a sockets', { socketsCount: socketsEnRoom.length, roomName });

    io.to(roomName).emit('driver_location_update', {
      lat: data.lat,
      lng: data.lng,
      viajeId: data.viajeId,
      timestamp: new Date().toISOString(),
      conductorId: (socket as any).user?.id_usuario,
    });

    try {
      const viajeActivo = await prisma.viajes_activos.findUnique({
        where: { id_viaje_activo: data.viajeActivoId },
      });
      if (viajeActivo) {
        const historial = Array.isArray(viajeActivo.historial_ruta) ? (viajeActivo.historial_ruta as any[]) : [];
        if (historial.length % 10 === 0) {
          historial.push({ lat: data.lat, lng: data.lng, ts: Date.now() });
          await prisma.viajes_activos.update({
            where: { id_viaje_activo: data.viajeActivoId },
            data: { historial_ruta: historial },
          });
        }
      }
    } catch (e) {
      // No bloquear si falla el guardado
    }
  });

  socket.on('join_viaje', (viajeId: number) => {
    socket.join(`viaje_${viajeId}`);
    logger.info('Usuario unido al rastreo de viaje', { viajeId });
  });

  socket.on('leave_viaje', (viajeId: number) => {
    socket.leave(`viaje_${viajeId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Usuario desconectado de Socket.IO');
  });
});

// ─── Arranque ─────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  serverHttp.listen(Number(PORT), '0.0.0.0', () => {
    logger.info('Servidor HTTP iniciado', { port: PORT });
    iniciarCronJobs(io);
    logger.info('Ruta configurada: oRPC -> /rpc/*');
    logger.info('Rate Limit configurado', { login: '30 intentos/15min', registro: '15 intentos/30min' });
    logger.info('Rutas de Uploads configuradas');
    logger.info('Ruta Health configurada: GET /health');
    logger.info('WebSocket Server corriendo en el mismo puerto');
  })
}
