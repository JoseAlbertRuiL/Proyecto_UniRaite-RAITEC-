const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Crear carpetas si no existen
const licenciasDir = "./uploads/licencias";
const vehiculosDir = "./uploads/vehiculos";

if (!fs.existsSync(licenciasDir)) fs.mkdirSync(licenciasDir, { recursive: true });
if (!fs.existsSync(vehiculosDir)) fs.mkdirSync(vehiculosDir, { recursive: true });


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "foto_licencia") {
      cb(null, "uploads/licencias/");
    } else if (file.fieldname === "foto_circulacion") {
      cb(null, "uploads/vehiculos/");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Solo JPG/PNG"), false);
    }
  },
});

router.post(
  "/registro-conductor",
  upload.fields([
    { name: "foto_licencia",    maxCount: 1 },
    { name: "foto_circulacion", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Token requerido" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId  = decoded.id;

      const usuario = await prisma.usuarios.findUnique({
        where: { id_usuario: userId },
      });
      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (usuario.foto_licencia) {
        return res.status(400).json({
          error: "Ya tienes una solicitud de conductor en proceso o aprobada",
        });
      }

      const foto_licencia    = req.files?.foto_licencia?.[0]?.filename    || null;
      const foto_circulacion = req.files?.foto_circulacion?.[0]?.filename || null;

      if (!foto_licencia || !foto_circulacion) {
        return res.status(400).json({ error: "Faltan las fotos requeridas" });
      }

      const { modelo, color, placas, capacidad_pasajeros } = req.body;

      if (!modelo || !color || !placas || !capacidad_pasajeros) {
        return res.status(400).json({ error: "Faltan datos del vehículo" });
      }

      const vehiculoExistente = await prisma.vehiculos.findFirst({
        where: { placas: placas.toUpperCase() },
      });
      if (vehiculoExistente) {
        return res.status(400).json({ error: "Esas placas ya están registradas" });
      }

      await prisma.usuarios.update({
        where: { id_usuario: userId },
        data: {
          foto_licencia:    foto_licencia,
          foto_circulacion: foto_circulacion,
          es_conductor:     false,
        },
      });

      const vehiculo = await prisma.vehiculos.create({
        data: {
          id_usuario:          userId,
          modelo:              modelo.trim(),
          color:               color.trim(),
          placas:              placas.trim().toUpperCase(),
          capacidad_pasajeros: parseInt(capacidad_pasajeros),
          foto_auto_url:       null,
        },
      });

      res.json({
        success: true,
        message: "Solicitud de conductor enviada, pendiente de verificación",
        vehiculo_id: vehiculo.id_vehiculo,
      });

    } catch (error) {
      console.error("Error en registro-conductor:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

module.exports = router;