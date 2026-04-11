const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
// Todo el archivo es para actualizar el perfil del usuario.
// Obtener perfil
router.get("/perfil", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token requerido" });
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
        carrera: true,
      },
    });

    res.json({ success: true, user: usuario });

  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
});

// Actualizar perfil
router.put("/perfil", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { nombre, apellido_paterno, apellido_materno } = req.body;

    const usuarioActualizado = await prisma.usuarios.update({
    where: { id_usuario: decoded.id },
    data: { 
        nombre, 
        apellido_paterno, 
        apellido_materno
    },
    });

    res.json({ success: true, user: usuarioActualizado });

  } catch (error) {
    res.status(500).json({ error: "Error al actualizar perfil" });
  }
});

module.exports = router;