import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import http from 'http'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { RPCHandler } from '@orpc/server/node'
import { onError } from '@orpc/server'
import { router } from './orpc/index'
import { PrismaClient } from '@prisma/client'
import { iniciarCronJobs } from './services/cronJobs'

require('dotenv').config()

const app = express()
const serverHttp = http.createServer(app)
const io = new Server(serverHttp, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

// Guardar io para usarlo en otros archivos
export { io }

// ─── Directorios de uploads ───────────────────────────────────────────────────

const uploadDirs = [
  './uploads',
  './uploads/credentials',
  './uploads/perfiles',
  './uploads/licencias',
  './uploads/circulaciones',
]
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// ─── Multer ───────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinos: Record<string, string> = {
      foto_credencial: './uploads/credentials',
      foto_perfil: './uploads/perfiles',
      foto_licencia: './uploads/licencias',
      foto_circulacion: './uploads/circulaciones',
    }
    cb(null, destinos[file.fieldname] ?? './uploads')
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, unique + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo JPG/PNG'))
    }
  },
})

// ─── Middleware de autenticación para Socket.IO ───────────────────────────────

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token requerido'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: (decoded as any).id }
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
  console.log('⚡ Usuario conectado:', (socket as any).user?.id_usuario);

  socket.on('join_chat', (chatId: string) => {
    socket.join(`chat_${chatId}`);
    console.log(`📱 Usuario unido al chat ${chatId}`);
  });

  socket.on('send_message', async (data: { chatId: string; message: string; receiverId: string }) => {
    const user = (socket as any).user;
    try {
      const mensaje = await prisma.mensajes_chat.create({
        data: {
          id_viaje_pub: parseInt(data.chatId),
          id_emisor: user.id_usuario,
          contenido: data.message,
          fecha_envio: new Date(),
        },
        include: { emisor: { select: { nombre: true, foto_perfil: true } } }
      });

      io.to(`chat_${data.chatId}`).emit('new_message', mensaje);
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
      socket.emit('message_error', 'No se pudo enviar el mensaje');
    }
  });

  socket.on('driver_location', async (data: {
    viajeActivoId: number;
    viajeId: number;
    lat: number;
    lng: number;
  }) => {
    console.log(`📍 driver_location recibido de ${(socket as any).user?.id_usuario} para viaje ${data.viajeId}`);

    const roomName = `viaje_${data.viajeId}`;
    const socketsEnRoom = await io.in(roomName).fetchSockets();
    console.log(`   Enviando a ${socketsEnRoom.length} socket(s) en ${roomName}`);

    io.to(roomName).emit('driver_location_update', {
      lat: data.lat,
      lng: data.lng,
      viajeId: data.viajeId,
      timestamp: new Date().toISOString(),
      conductorId: (socket as any).user?.id_usuario,
    });

    // Guardar en historial_ruta cada N puntos (opcional, para no saturar la BD)
    try {
      const viajeActivo = await prisma.viajes_activos.findUnique({
        where: { id_viaje_activo: data.viajeActivoId },
      });
      if (viajeActivo) {
        const historial = (viajeActivo.historial_ruta as any[]) || [];
        // Guardar cada 10 puntos para no saturar
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

  // Pasajero/conductor se une a la sala del viaje
  socket.on('join_viaje', (viajeId: number) => {
    socket.join(`viaje_${viajeId}`);
    console.log(`🗺️ Usuario unido al viaje ${viajeId}`);
  });

  socket.on('leave_viaje', (viajeId: number) => {
    socket.leave(`viaje_${viajeId}`);
  });

  socket.on('disconnect', () => {
    console.log('⚡ Usuario desconectado');
  });
});

// ─── oRPC Handler ─────────────────────────────────────────────────────────────

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

const orpcHandler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error('[oRPC error]', error)
    }),
  ],
})

// ─── Rate Limiting implementado DENTRO del handler de oRPC ─────────────────────

// Almacenamiento: fallos de login y fallos de registro
const intentosLogin = new Map<string, { count: number; firstAttempt: number }>();
const intentosRegistro = new Map<string, { count: number; firstAttempt: number }>();

// Middleware de rate limiting
const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Filtrar solo las rutas que nos interesan proteger
  const esLogin = req.url.includes('/login');
  const esRegistro = req.url.includes('/register');

  if (!esLogin && !esRegistro) {
    return next();
  }
    
  // Obtener IP
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Reglas específicas para login y registro
  const mapaActual = esLogin ? intentosLogin : intentosRegistro;
  const limiteIntentos = esLogin ? 30 : 15; // 30 intentos para login, 15 para registro
  const tiempoCastigo = esLogin ? (15 * 60 * 1000) : (30 * 60 * 1000); // 15 mins para login, 30 mins para registro

  const intentos = mapaActual.get(ip);

  // Verificación de bloqueos
  if (intentos) {
    if (now - intentos.firstAttempt > tiempoCastigo) {
      // Ya pasó el tiempo de castigo, limpiamos su historial
      mapaActual.delete(ip);
    } else if (intentos.count >= limiteIntentos) {
      // Sigue castigado: Bloqueamos la petición
      const minutosRestantes = Math.ceil((tiempoCastigo - (now - intentos.firstAttempt)) / 60000);
      const accion = esLogin ? "iniciar sesión" : "registrarse";
      
      console.log(`🔐 BLOQUEADO - IP: ${ip}, intentos: ${intentos.count}`);
      return res.status(429).json({
        success: false,
        message: `Demasiados intentos para ${accion}. Bloqueado por ${minutosRestantes} minutos.`
      });
    }
  }

  // Interceptamos la respuesta final
  res.on('finish', () => {
    // Si falla (Error 400+)
    if (res.statusCode >= 400) {
      const actuales = mapaActual.get(ip) || { count: 0, firstAttempt: Date.now() };
      actuales.count++;
      mapaActual.set(ip, actuales);
      console.log(`🔐 [RateLimit] Intento FALLIDO ${actuales.count}/${limiteIntentos} en ${esLogin ? 'Login' : 'Registro'} para IP: ${ip}`);
    } 
    // Si tiene éxito (200)
    else if (res.statusCode >= 200 && res.statusCode < 300) {
      mapaActual.delete(ip);
      console.log(`🔐 [RateLimit] Acceso EXITOSO en ${esLogin ? 'Login' : 'Registro'}. Contador limpio para IP: ${ip}`);
    }
  });
  
  next();
};

// Limpiador de basura
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of intentosLogin.entries()) {
    if (now - data.firstAttempt > 15 * 60 * 1000) intentosLogin.delete(ip);
  }
  for (const [ip, data] of intentosRegistro.entries()) {
    if (now - data.firstAttempt > 30 * 60 * 1000) intentosRegistro.delete(ip);
  }
}, 60 * 60 * 1000); // Se ejecuta cada hora para liberar RAM

// Aplicar rate limit middleware ANTES del handler de oRPC
app.use('/rpc', rateLimitMiddleware);

// oRPC handler principal
app.use('/rpc', async (req, res, next) => {
  console.log('📡 Petición recibida en /rpc:', req.method, req.url);
  const { matched } = await orpcHandler.handle(req, res, {
    prefix: '/rpc',
    context: { headers: req.headers },
  });
  if (!matched) next();
});

// Upload foto de perfil
app.post('/upload/perfil', upload.single('foto_perfil'), (req, res) => {
  res.json({ foto_perfil: req.file?.filename || null });
});

// Upload foto de credencial
app.post('/upload/credentials', upload.single('foto_credencial'), (req, res) => {
  res.json({ foto_credencial: req.file?.filename || null });
});

// ─── Rutas de upload (Express + Multer) ──────────────────────────────────────

app.post(
  '/upload/registro',
  upload.fields([
    { name: 'foto_credencial', maxCount: 1 },
    { name: 'foto_perfil', maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]>
    res.json({
      foto_credencial: files?.foto_credencial?.[0]?.filename ?? null,
      foto_perfil: files?.foto_perfil?.[0]?.filename ?? null,
    })
  }
)

app.post(
  '/upload/conductor',
  upload.fields([
    { name: 'foto_licencia', maxCount: 1 },
    { name: 'foto_circulacion', maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]>
    res.json({
      foto_licencia: files?.foto_licencia?.[0]?.filename ?? null,
      foto_circulacion: files?.foto_circulacion?.[0]?.filename ?? null,
    })
  }
)

app.post('/upload/circulacion', upload.single('foto_circulacion'), (req, res) => {
  res.json({
    foto_circulacion: req.file?.filename ?? null,
  })
})

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor UNIRAITE funcionando' })
})

// ─── Arranque ─────────────────────────────────────────────────────────────────

serverHttp.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`)
  iniciarCronJobs(io);
  console.log(`oRPC    → /rpc/*`)
  console.log(`Rate Limit → Login (30 intentos/15min) | Registro (15 intentos/30min)`)
  console.log(`Uploads → POST /upload/registro | /upload/conductor | /upload/circulacion`)
  console.log(`Health  → GET  /health`)
  console.log(`WebSocket Server corriendo en el mismo puerto`)
})