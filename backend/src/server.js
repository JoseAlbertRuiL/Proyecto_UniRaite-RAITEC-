const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

//Configuración
require('dotenv').config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

//Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

//Configuración de Subida de fotos
const uploadDir = './uploads/credentials';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cred-' + unique + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Solo JPG/PNG'), false);
    }
  }
});

// Función para validación de correo institucional
const isValidEmail = (email) => {
  return email.endsWith('@morelia.tecnm.mx');
};

//Endpoint para registro
app.post('/api/register', upload.single('foto_credencial'), async (req, res) => {
  try {
    const { nombre, apellido_paterno, apellido_materno, num_control, correo_inst, password } = req.body;
    const foto_credencial = req.file ? req.file.filename : null;

    //Validar correo institucional
    if (!isValidEmail(correo_inst)) {
      return res.status(400).json({ error: 'Usa tu correo @morelia.tecnm.mx' });
    }

    //Validación para que todos los campos obligatorios existan
    if (!nombre || !apellido_paterno || !num_control || !correo_inst || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    //Verificación de que existen
    const existe = await prisma.usuarios.findFirst({
      where: {
        OR: [
          { correo_inst: correo_inst },
          { num_control: num_control }
        ]
      }
    });

    if (existe) {
      return res.status(400).json({ error: 'El correo o número de control ya está registrado' });
    }

    //Encriptación de contraseña con hash
    const hashedPassword = await bcrypt.hash(password, 10);

    //Creación de usuario
    const usuario = await prisma.usuarios.create({
      data: {
        nombre,
        apellido_paterno,
        apellido_materno: apellido_materno || null,
        num_control,
        correo_inst,
        password_hash: hashedPassword,
        foto_credencial
      }
    });

    //Generación de token jwt
    const token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Registro exitoso',
      token,
      user: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        correo_inst: usuario.correo_inst,
        num_control: usuario.num_control
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

//Endpoint de login
app.post('/api/login', async (req, res) => {
  try {
    const { correo_inst, password } = req.body;

    //Busca el usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { correo_inst: correo_inst }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    //Verifica la contraseña
    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    //Genera el token
    const token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        correo_inst: usuario.correo_inst,
        num_control: usuario.num_control,
        es_conductor: usuario.es_conductor,
        verificado: usuario.verificado
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

//Endpoint para obtener el perfil
app.get('/api/perfil', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: decoded.id },
      select: {
        id_usuario: true,
        nombre: true,
        apellido_paterno: true,
        apellido_materno: true,
        correo_inst: true,
        num_control: true,
        foto_credencial: true,
        es_conductor: true,
        verificado: true,
        reputacion_promedio: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, user: usuario });

  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

//Mensaje para confirmación de levantamiento de servidores
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor UNIRAITE funcionando' });
});
// ---------------- RUTAS DE CHAT ----------------

// OBTENER MENSAJES: Solo si el viaje existe
app.get('/api/mensajes/:idViaje', async (req, res) => {
  try {
    const { idViaje } = req.params;
    const mensajes = await prisma.mensajes_chat.findMany({
      where: { id_viaje_pub: parseInt(idViaje) },
      orderBy: { fecha_envio: 'asc' },
      include: { emisor: { select: { nombre: true } } }
    });
    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// ENVIAR MENSAJE: Valida el "Match"
app.post('/api/mensajes', async (req, res) => {
  try {
    const { id_viaje_pub, id_emisor, contenido } = req.body;
    const tripId = parseInt(id_viaje_pub);

    // Verificamos si el emisor es el CONDUCTOR
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: tripId }
    });

    if (!viaje) {
      return res.status(404).json({ error: 'El viaje no existe.' });
    }

    // Verificamos si el emisor es un PASAJERO con solicitud ACEPTADA (El "Match")
    const match = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: tripId,
        id_pasajero: id_emisor,
        estado_solicitud: 'aceptada'
      }
    });

    // Seguridad: Si no es conductor ni pasajero aceptado, no puede chatear
    if (viaje.id_conductor !== id_emisor && !match) {
      return res.status(403).json({ error: 'No tienes un match confirmado para este viaje.' });
    }

    const nuevoMensaje = await prisma.mensajes_chat.create({
      data: {
        id_viaje_pub: tripId,
        id_emisor: id_emisor,
        contenido: contenido,
        fecha_envio: new Date()
      }
    });
    
    res.status(201).json(nuevoMensaje);
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// ESTADO DEL VIAJE: Para bloquear el chat al finalizar)
app.get('/api/viaje-estado/:idViaje', async (req, res) => {
  try {
    const { idViaje } = req.params;
    // Buscamos en viajes_activos el estado del trayecto
    const trayecto = await prisma.viajes_activos.findFirst({
      where: { id_viaje_pub: parseInt(idViaje) },
      select: { estado_trayecto: true }
    });

    res.json({ estado: trayecto?.estado_trayecto || 'pendiente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar estado' });
  }
});
// ---------------- RESPONDER SOLICITUDES ----------------
app.put('/api/solicitudes/:idSolicitud/responder', async (req, res) => {
  try {
    const { accion } = req.body; // Tiene que ser 'aceptar' o 'rechazar'
    const idSolicitud = parseInt(req.params.idSolicitud);

    //Buscamos la solicitud en la base de datos
    const solicitud = await prisma.solicitudes_viaje.findUnique({
      where: { id_solicitud: idSolicitud }
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'La solicitud no existe.' });
    }

    if (solicitud.estado_solicitud !== 'pendiente') {
      return res.status(400).json({ error: 'Esta solicitud ya fue respondida.' });
    }

    // REGLA DE NEGOCIO: Validar los 10 minutos
    const ahora = new Date();
    const tiempoTranscurridoMs = ahora - new Date(solicitud.fecha_solicitud);
    const minutosTranscurridos = tiempoTranscurridoMs / (1000 * 60);

    if (minutosTranscurridos > 10) {
      // Si pasaron más de 10 minutos, la auto-rechazamos por tiempo vencido
      await prisma.solicitudes_viaje.update({
        where: { id_solicitud: idSolicitud },
        data: { estado_solicitud: 'rechazada' }
      });
      return res.status(400).json({ error: 'La solicitud expiró. Pasaron más de 10 minutos.' });
    }

    // 3. Actualizamos el estado a lo que decidió el conductor
    const nuevoEstado = accion === 'aceptar' ? 'aceptada' : 'rechazada';
    
    await prisma.solicitudes_viaje.update({
      where: { id_solicitud: idSolicitud },
      data: { estado_solicitud: nuevoEstado }
    });

    // 4. REGLA DE NEGOCIO: "Entonces el viaje se crea en estado activo"
    // Solo lo hacemos si el conductor aceptó y si el viaje no estaba activo ya.
    if (nuevoEstado === 'aceptada') {
      const viajeYaActivo = await prisma.viajes_activos.findFirst({
        where: { id_viaje_pub: solicitud.id_viaje_pub }
      });

      if (!viajeYaActivo) {
        await prisma.viajes_activos.create({
          data: {
            id_viaje_pub: solicitud.id_viaje_pub,
            hora_inicio_real: new Date(),
            estado_trayecto: 'en_curso' // Inicia el viaje oficialmente
          }
        });
      }
    }

    res.json({ 
      success: true, 
      mensaje: `Solicitud ${nuevoEstado} exitosamente.` 
    });

  } catch (error) {
    console.error("Error al responder solicitud:", error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});
// Fin del código del Rutas para el chat
// ---------------- HISTORIAL DE CHATS ----------------
app.get('/api/mis-chats/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;

    // 1. Buscamos los viajes donde eres CONDUCTOR
    const viajesConductor = await prisma.viajes_publicados.findMany({
      where: { id_conductor: idUsuario },
      select: { id_viaje_pub: true }
    });

    // 2. Buscamos los viajes donde eres PASAJERO (con Match aceptado)
    const viajesPasajero = await prisma.solicitudes_viaje.findMany({
      where: { id_pasajero: idUsuario, estado_solicitud: 'aceptada' },
      select: { id_viaje_pub: true }
    });

    // Juntamos todos los IDs de los viajes en una sola lista y quitamos duplicados
    const idsViajes = [...viajesConductor, ...viajesPasajero].map(v => v.id_viaje_pub);
    const viajesUnicos = [...new Set(idsViajes)];

    // 3. Rescatamos el ÚLTIMO mensaje de cada viaje
    const historial = [];
    
    for (const idViaje of viajesUnicos) {
      const ultimoMensaje = await prisma.mensajes_chat.findFirst({
        where: { id_viaje_pub: idViaje },
        orderBy: { fecha_envio: 'desc' }, // El más reciente primero
        include: { emisor: { select: { nombre: true } } }
      });

      if (ultimoMensaje) {
        historial.push({
          idViaje: idViaje,
          texto: ultimoMensaje.contenido,
          fecha: ultimoMensaje.fecha_envio,
          remitente: ultimoMensaje.emisor.nombre,
          esMio: ultimoMensaje.id_emisor === idUsuario
        });
      }
    }

    // Ordenamos todo el historial para que el chat con el mensaje más nuevo salga hasta arriba
    historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: 'Error al cargar el historial de chats' });
  }
});
//Para iniciar el servidor
async function main() {
  try {
    await prisma.$connect();
    console.log('Servidor PostreSQL funcionando');
    
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`Endpoints:`);
      console.log(`   POST   /api/register`);
      console.log(`   POST   /api/login`);
      console.log(`   GET    /api/perfil`);
      console.log(`   GET    /api/health`);
    });
  } catch (error) {
    console.error('❌ Error al conectar:', error);
  }
}



main();