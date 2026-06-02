import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { RPCHandler } from '@orpc/server/node'
import { onError } from '@orpc/server'
import { router } from './orpc/index'
import { statusInterceptor } from './middleware/statusInterceptor'
import { globalErrorHandler } from './middleware/errorHandler'

require('dotenv').config()

const app = express()

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

// ─── Middleware global ─────────────────────────────────────────────────────────

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// ─── oRPC Handler ─────────────────────────────────────────────────────────────

const orpcHandler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error('[oRPC error]', error)
    }),
  ],
})

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const intentosLogin = new Map<string, { count: number; firstAttempt: number }>();
const intentosRegistro = new Map<string, { count: number; firstAttempt: number }>();

const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const esLogin = req.url.includes('/login');
  const esRegistro = req.url.includes('/register');

  if (!esLogin && !esRegistro) {
    return next();
  }

  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();

  const mapaActual = esLogin ? intentosLogin : intentosRegistro;
  const limiteIntentos = esLogin ? 30 : 15;
  const tiempoCastigo = esLogin ? (15 * 60 * 1000) : (30 * 60 * 1000);

  const intentos = mapaActual.get(ip);

  if (intentos) {
    if (now - intentos.firstAttempt > tiempoCastigo) {
      mapaActual.delete(ip);
    } else if (intentos.count >= limiteIntentos) {
      const minutosRestantes = Math.ceil((tiempoCastigo - (now - intentos.firstAttempt)) / 60000);
      const accion = esLogin ? 'iniciar sesión' : 'registrarse';

      console.log(`🔐 BLOQUEADO - IP: ${ip}, intentos: ${intentos.count}`);
      return res.status(429).json({
        success: false,
        message: `Demasiados intentos para ${accion}. Bloqueado por ${minutosRestantes} minutos.`
      });
    }
  }

  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const actuales = mapaActual.get(ip) || { count: 0, firstAttempt: Date.now() };
      actuales.count++;
      mapaActual.set(ip, actuales);
      console.log(`🔐 [RateLimit] Intento FALLIDO ${actuales.count}/${limiteIntentos} en ${esLogin ? 'Login' : 'Registro'} para IP: ${ip}`);
    } else if (res.statusCode >= 200 && res.statusCode < 300) {
      mapaActual.delete(ip);
      console.log(`🔐 [RateLimit] Acceso EXITOSO en ${esLogin ? 'Login' : 'Registro'}. Contador limpio para IP: ${ip}`);
    }
  });

  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of intentosLogin.entries()) {
    if (now - data.firstAttempt > 15 * 60 * 1000) intentosLogin.delete(ip);
  }
  for (const [ip, data] of intentosRegistro.entries()) {
    if (now - data.firstAttempt > 30 * 60 * 1000) intentosRegistro.delete(ip);
  }
}, 60 * 60 * 1000);

app.use('/rpc', rateLimitMiddleware);
app.use('/rpc', statusInterceptor);

app.use('/rpc', async (req, res, next) => {
  console.log('📡 Petición recibida en /rpc:', req.method, req.url);
  const { matched } = await orpcHandler.handle(req, res, {
    prefix: '/rpc',
    context: { headers: req.headers },
  });
  if (!matched) next();
});

// ─── Rutas de upload (Express + Multer) ───────────────────────────────────────

app.post('/upload/perfil', upload.single('foto_perfil'), (req, res) => {
  res.status(201).json({ foto_perfil: req.file?.filename || null });
});

app.post('/upload/credentials', upload.single('foto_credencial'), (req, res) => {
  res.status(201).json({ foto_credencial: req.file?.filename || null });
});

app.post(
  '/upload/registro',
  upload.fields([
    { name: 'foto_credencial', maxCount: 1 },
    { name: 'foto_perfil', maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]>
    res.status(201).json({
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
    res.status(201).json({
      foto_licencia: files?.foto_licencia?.[0]?.filename ?? null,
      foto_circulacion: files?.foto_circulacion?.[0]?.filename ?? null,
    })
  }
)

app.post('/upload/circulacion', upload.single('foto_circulacion'), (req, res) => {
  res.status(201).json({
    foto_circulacion: req.file?.filename ?? null,
  })
})

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor UNIRAITE funcionando' })
})

// ─── Global Error Handler (last) ────────────────────────────────────────

app.use(globalErrorHandler)

export default app
