const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ---------------- RUTAS DE CHAT (HU-20) ----------------

// OBTENER MENSAJES: Solo si el viaje existe
router.get('/mensajes/:idViaje', async (req, res) => {
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
router.post('/mensajes', async (req, res) => {
  try {
    const { id_viaje_pub, id_emisor, contenido } = req.body;
    const tripId = parseInt(id_viaje_pub);

    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: tripId }
    });

    if (!viaje) return res.status(404).json({ error: 'El viaje no existe.' });

    const match = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: tripId,
        id_pasajero: id_emisor,
        estado_solicitud: 'aceptada'
      }
    });

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

// ESTADO DEL VIAJE: Para bloquear el chat al finalizar
router.get('/viaje-estado/:idViaje', async (req, res) => {
  try {
    const { idViaje } = req.params;
    const trayecto = await prisma.viajes_activos.findFirst({
      where: { id_viaje_pub: parseInt(idViaje) },
      select: { estado_trayecto: true }
    });
    res.json({ estado: trayecto?.estado_trayecto || 'pendiente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar estado' });
  }
});

// ---------------- RESPONDER SOLICITUDES (HU-17) ----------------
router.put('/solicitudes/:idSolicitud/responder', async (req, res) => {
  try {
    const { accion } = req.body;
    const idSolicitud = parseInt(req.params.idSolicitud);

    const solicitud = await prisma.solicitudes_viaje.findUnique({
      where: { id_solicitud: idSolicitud }
    });

    if (!solicitud) return res.status(404).json({ error: 'La solicitud no existe.' });
    if (solicitud.estado_solicitud !== 'pendiente') return res.status(400).json({ error: 'Esta solicitud ya fue respondida.' });

    const ahora = new Date();
    const minutosTranscurridos = (ahora - new Date(solicitud.fecha_solicitud)) / (1000 * 60);

    if (minutosTranscurridos > 10) {
      await prisma.solicitudes_viaje.update({
        where: { id_solicitud: idSolicitud },
        data: { estado_solicitud: 'rechazada' }
      });
      return res.status(400).json({ error: 'La solicitud expiró. Pasaron más de 10 minutos.' });
    }

    const nuevoEstado = accion === 'aceptar' ? 'aceptada' : 'rechazada';
    
    await prisma.solicitudes_viaje.update({
      where: { id_solicitud: idSolicitud },
      data: { estado_solicitud: nuevoEstado }
    });

    if (nuevoEstado === 'aceptada') {
      const viajeYaActivo = await prisma.viajes_activos.findFirst({
        where: { id_viaje_pub: solicitud.id_viaje_pub }
      });

      if (!viajeYaActivo) {
        await prisma.viajes_activos.create({
          data: {
            id_viaje_pub: solicitud.id_viaje_pub,
            hora_inicio_real: new Date(),
            estado_trayecto: 'en_curso'
          }
        });
      }
    }

    res.json({ success: true, mensaje: `Solicitud ${nuevoEstado} exitosamente.` });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ---------------- HISTORIAL DE CHATS ----------------
router.get('/mis-chats/:idUsuario', async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const viajesConductor = await prisma.viajes_publicados.findMany({
      where: { id_conductor: idUsuario },
      select: { id_viaje_pub: true }
    });

    const viajesPasajero = await prisma.solicitudes_viaje.findMany({
      where: { id_pasajero: idUsuario, estado_solicitud: 'aceptada' },
      select: { id_viaje_pub: true }
    });

    const idsViajes = [...viajesConductor, ...viajesPasajero].map(v => v.id_viaje_pub);
    const viajesUnicos = [...new Set(idsViajes)];

    const historial = [];
    
    for (const idViaje of viajesUnicos) {
      const ultimoMensaje = await prisma.mensajes_chat.findFirst({
        where: { id_viaje_pub: idViaje },
        orderBy: { fecha_envio: 'desc' },
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

    historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar el historial de chats' });
  }
});

// Exportamos el router para usarlo en server.js
module.exports = router;