import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { RPCHandler } from '@orpc/server/node'
import { onError } from '@orpc/server'
import { router } from './orpc/index'

require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

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

// ─── oRPC Handler ─────────────────────────────────────────────────────────────
// IMPORTANTE: se monta ANTES de express.json() para que oRPC maneje su propio parsing

app.use(cors())
app.use('/uploads', express.static('uploads'))

const orpcHandler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error('[oRPC error]', error)
    }),
  ],
})

app.use('/rpc', async (req, res, next) => {
  console.log('📡 Petición recibida en /rpc:', req.method, req.url)
  const { matched } = await orpcHandler.handle(req, res, {
    prefix: '/rpc',
    context: { headers: req.headers },
  })
  if (!matched) next()
})

// Upload foto de perfil
app.post('/upload/perfil', upload.single('foto_perfil'), (req, res) => {
  res.json({ foto_perfil: req.file?.filename || null });
});

// express.json()
app.use(express.json())

// ─── Rutas de upload (Express + Multer) ──────────────────────────────────────
// Guardan el archivo localmente y devuelven el filename.
// El cliente pasa ese filename al procedure de oRPC correspondiente.

// Upload fotos de registro de usuario
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

// Upload fotos de conductor
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

// Upload foto de circulación (actualizar vehículo)
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

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`)
  console.log(`oRPC    → /rpc/*`)
  console.log(`Uploads → POST /upload/registro | /upload/conductor | /upload/circulacion`)
  console.log(`Health  → GET  /health`)
})

