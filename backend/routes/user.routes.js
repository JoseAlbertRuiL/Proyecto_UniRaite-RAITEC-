const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();


// ==========================
// 🔐 MIDDLEWARE AUTH
// ==========================
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token requerido" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
};


// ==========================
// 📥 OBTENER PERFIL
// ==========================
router.get("/perfil", authMiddleware, async (req, res) => {
  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: req.user.id },
      select: {
        id_usuario: true,
        nombre: true,
        apellido_paterno: true,
        apellido_materno: true,
        correo_inst: true,
        num_control: true,
        carrera: true,
        es_conductor: true,
        contacto_emergencia: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true, user: usuario });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


// ==========================
// ✏️ ACTUALIZAR PERFIL
// ==========================
router.put("/perfil", authMiddleware, async (req, res) => {
  try {
    let { nombre, apellido_paterno, apellido_materno } = req.body;

    // Validaciones
    if (!nombre || !apellido_paterno) {
      return res.status(400).json({ error: "Campos requeridos" });
    }

    // Sanitizar
    nombre = nombre.trim();
    apellido_paterno = apellido_paterno.trim();
    apellido_materno = apellido_materno?.trim();

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: req.user.id },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id_usuario: req.user.id },
      data: {
        nombre,
        apellido_paterno,
        apellido_materno,
      },
    });

    res.json({ success: true, user: usuarioActualizado });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});


// ==========================
// 🔐 CAMBIAR CONTRASEÑA
// ==========================
router.put("/perfil/password", authMiddleware, async (req, res) => {
  try {
    const { passwordActual, nuevaPassword } = req.body;

    // Validaciones
    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({ error: "Campos requeridos" });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ error: "Mínimo 6 caracteres" });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: req.user.id },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Validar contraseña actual
    const match = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Evitar misma contraseña
    const samePassword = await bcrypt.compare(nuevaPassword, usuario.password_hash);
    if (samePassword) {
      return res.status(400).json({ error: "No puedes usar la misma contraseña" });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    await prisma.usuarios.update({
      where: { id_usuario: req.user.id },
      data: { password_hash: hashedPassword },
    });

    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar contraseña" });
  }
});


// ==========================
// 📞 CONTACTO EMERGENCIA
// ==========================
router.put("/perfil/contacto", authMiddleware, async (req, res) => {
  try {
    let { contactoEmergencia } = req.body;

    if (!contactoEmergencia) {
      return res.status(400).json({ error: "Contacto requerido" });
    }

    contactoEmergencia = contactoEmergencia.trim();

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: req.user.id },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id_usuario: req.user.id },
      data: { contacto_emergencia: contactoEmergencia },
    });

    res.json({ success: true, user: usuarioActualizado });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar contacto" });
  }
});


module.exports = router;