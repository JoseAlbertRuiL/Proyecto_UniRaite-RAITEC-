const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../plugins");

// Importamos la función de extracción de texto desde vision.service.js
const { extraerTextoDeImagen } = require("../services/vision.service");

const prisma = new PrismaClient();

const uploadToCloudinary = async (localPath, folder) => {
  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
};

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

// Normalizador de texto extremo
const normalizarTexto = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD") // Separa los acentos de las vocales
    .replace(/[\u0300-\u036f]/g, "") // Borra los acentos
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // Deja ÚNICAMENTE letras y números juntos
};

router.post(
  "/registro-conductor",
  upload.fields([
    { name: "foto_licencia",    maxCount: 1 },
    { name: "foto_circulacion", maxCount: 1 },
  ]),
  async (req, res) => {
    // Función de emergencia para borrar fotos si alguien intenta hacer fraude
    const borrarArchivosSubidos = () => {
      if (req.files?.foto_licencia?.[0]) fs.unlinkSync(path.join(licenciasDir, req.files.foto_licencia[0].filename));
      if (req.files?.foto_circulacion?.[0]) fs.unlinkSync(path.join(vehiculosDir, req.files.foto_circulacion[0].filename));
    };

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

      const fotoLicenciaFile = req.files?.foto_licencia?.[0] || null;
      const fotoCirculacionFile = req.files?.foto_circulacion?.[0] || null;

      if (!fotoLicenciaFile || !fotoCirculacionFile) {
        return res.status(400).json({ error: "Faltan las fotos requeridas" });
      }

      const foto_licencia = fotoLicenciaFile.filename;
      const foto_circulacion = fotoCirculacionFile.filename;

      const { modelo, color, placas, capacidad_pasajeros } = req.body;

      if (!modelo || !color || !placas || !capacidad_pasajeros) {
        return res.status(400).json({ error: "Faltan datos del vehículo" });
      }

      const placaNormalizada = placas.trim().toUpperCase();
      const vehiculoExistente = await prisma.vehiculos.findFirst({
        where: { placas: placaNormalizada },
      });
      if (vehiculoExistente) {
        return res.status(400).json({ error: "Esas placas ya están registradas" });
      }

      // ==============================================================================
      // IA: 1. VALIDACIÓN DE LICENCIA DE CONDUCIR

      console.log("🔍 Validando Licencia de Conducir con IA...");
      const rutaLicencia = path.join(licenciasDir, foto_licencia);
      const textoLicenciaRaw = await extraerTextoDeImagen(rutaLicencia);
      const txtLicencia = normalizarTexto(textoLicenciaRaw);

      // Validar Formato
      if (!txtLicencia.includes("ESTADOSUNIDOSMEXICANOS") || !txtLicencia.includes("LICENCIAPARACONDUCIR")) {
        borrarArchivosSubidos();
        return res.status(400).json({ error: "El documento no parece ser una Licencia de Conducir oficial." });
      }

      // Validar Información
      const nombreNorm = normalizarTexto(usuario.nombre);
      const paternoNorm = normalizarTexto(usuario.apellido_paterno);
      const maternoNorm = normalizarTexto(usuario.apellido_materno);

      if (!txtLicencia.includes(nombreNorm) || !txtLicencia.includes(paternoNorm) || !txtLicencia.includes(maternoNorm)) {
        borrarArchivosSubidos();
        return res.status(400).json({ error: "El nombre en la licencia no coincide con tu perfil de UNIRAITE." });
      }

      // Validar Caducidad
      const caducidadRegex = /PERMANENTE|202[4-9]|203[0-9]/;
      if (!caducidadRegex.test(txtLicencia)) {
        borrarArchivosSubidos();
        return res.status(400).json({ error: "La licencia parece estar vencida o no se detectó fecha de vigencia." });
      }

      // ==============================================================================
      // IA: 2. VALIDACIÓN DE TARJETA DE CIRCULACIÓN

      console.log("🔍 Validando Tarjeta de Circulación con IA...");
      const rutaTarjeta = path.join(vehiculosDir, foto_circulacion);
      const textoTarjetaRaw = await extraerTextoDeImagen(rutaTarjeta);
      const txtTarjeta = normalizarTexto(textoTarjetaRaw);

      // Validar Formato
      if (!txtTarjeta.includes("CIRCULA")) {
        borrarArchivosSubidos();
        return res.status(400).json({ error: "El documento no parece ser una Tarjeta de Circulación oficial." });
      }

      // Validar Información
      if (!txtTarjeta.includes(placaNormalizada)) {
        borrarArchivosSubidos();
        return res.status(400).json({ error: "Las placas no coinciden con la Tarjeta de Circulación." });
      }

      if (!txtTarjeta.includes(normalizarTexto(color))) {
        borrarArchivosSubidos();
        return res.status(400).json({ error: "El color del vehículo no coincide con la Tarjeta de Circulación." });
      }

      // Validar Modelo
      const palabrasModelo = modelo.split(" ");
      let modeloValido = false;
      for (const palabra of palabrasModelo) {
        if (palabra.length > 2 && txtTarjeta.includes(normalizarTexto(palabra))) {
          modeloValido = true;
          break;
        }
      }

      if (!modeloValido) {
        borrarArchivosSubidos();
        return res.status(400).json({ error: "La marca o modelo no coinciden con la Tarjeta de Circulación." });
      }

      // ==============================================================================

      console.log("Validación completada exitosamente.");

      const licenciaUrl = await uploadToCloudinary(rutaLicencia, "uniraite/licencias");
      const circulacionUrl = await uploadToCloudinary(rutaTarjeta, "uniraite/circulaciones");
      fs.unlinkSync(rutaLicencia);
      fs.unlinkSync(rutaTarjeta);

      await prisma.usuarios.update({
        where: { id_usuario: userId },
        data: {
          foto_licencia:    licenciaUrl,
          foto_circulacion: circulacionUrl,
          es_conductor:     true,
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
        message: "Solicitud de conductorSolicitud verificada por IA y enviada exitosamente.",
        vehiculo_id: vehiculo.id_vehiculo,
      });

    } catch (error) {
      console.error("Error en registro-conductor:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

// PUT /api/vehiculo — actualizar vehículo existente con nueva validación de IA
router.put(
  "/vehiculo",
  upload.fields([{ name: "foto_circulacion", maxCount: 1 }]),
  async (req, res) => {
    const borrarArchivo = () => {
      if (req.files?.foto_circulacion?.[0]) {
        fs.unlinkSync(path.join(vehiculosDir, req.files.foto_circulacion[0].filename));
      }
    };

    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Token requerido" });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId  = decoded.id;

      const usuario = await prisma.usuarios.findUnique({
        where: { id_usuario: userId },
      });

      const vehiculoActual = await prisma.vehiculos.findFirst({
        where: { id_usuario: userId },
      });

      const fotoCirculacionFile = req.files?.foto_circulacion?.[0] || null;
      if (!fotoCirculacionFile) {
        return res.status(400).json({ error: "Falta la foto de circulación" });
      }
      const foto_circulacion = fotoCirculacionFile.filename;

      const { modelo, color, placas, capacidad_pasajeros } = req.body;
      if (!modelo || !color || !placas || !capacidad_pasajeros) {
        borrarArchivo();
        return res.status(400).json({ error: "Faltan datos del vehículo" });
      }

      const placaNormalizada = placas.trim().toUpperCase();

      const placaDuplicada = await prisma.vehiculos.findFirst({
        where: {
          placas:      placaNormalizada,
          id_vehiculo: { not: vehiculoActual.id_vehiculo }, // ignorar el vehículo actual
        },
      });
      if (placaDuplicada) {
        borrarArchivo();
        return res.status(400).json({ error: "Esas placas ya están registradas por otro usuario" });
      }

      console.log("🔍 Validando Tarjeta de Circulación con IA...");
      const rutaTarjeta    = path.join(vehiculosDir, foto_circulacion);
      const textoTarjetaRaw = await extraerTextoDeImagen(rutaTarjeta);
      const txtTarjeta     = normalizarTexto(textoTarjetaRaw);

      if (!txtTarjeta.includes("CIRCULA")) {
        borrarArchivo();
        return res.status(400).json({ error: "El documento no parece ser una Tarjeta de Circulación oficial." });
      }
      if (!txtTarjeta.includes(placaNormalizada)) {
        borrarArchivo();
        return res.status(400).json({ error: "Las placas no coinciden con la Tarjeta de Circulación." });
      }
      if (!txtTarjeta.includes(normalizarTexto(color))) {
        borrarArchivo();
        return res.status(400).json({ error: "El color del vehículo no coincide con la Tarjeta de Circulación." });
      }

      const palabrasModelo = modelo.split(" ");
      const modeloValido   = palabrasModelo.some(
        (p) => p.length > 2 && txtTarjeta.includes(normalizarTexto(p))
      );
      if (!modeloValido) {
        borrarArchivo();
        return res.status(400).json({ error: "La marca o modelo no coinciden con la Tarjeta de Circulación." });
      }

      const fotoAnterior = path.join(vehiculosDir, vehiculoActual.foto_auto_url || "");
      if (vehiculoActual.foto_auto_url && fs.existsSync(fotoAnterior)) {
        fs.unlinkSync(fotoAnterior);
      }

      const circulacionUrl = await uploadToCloudinary(rutaTarjeta, "uniraite/circulaciones");
      fs.unlinkSync(rutaTarjeta);

      const vehiculoActualizado = await prisma.vehiculos.update({
        where: { id_vehiculo: vehiculoActual.id_vehiculo },
        data: {
          modelo:              modelo.trim(),
          color:               color.trim(),
          placas:              placaNormalizada,
          capacidad_pasajeros: parseInt(capacidad_pasajeros),
          foto_auto_url:       circulacionUrl,
        },
      });

      await prisma.usuarios.update({
        where: { id_usuario: userId },
        data:  { foto_circulacion: circulacionUrl },
      });

      res.json({
        success: true,
        message: "Vehículo actualizado correctamente.",
        vehiculo: vehiculoActualizado,
      });

    } catch (error) {
      console.error("Error al actualizar vehículo:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }
);

// GET /api/vehiculo — obtener vehículo del conductor autenticado
router.get("/vehiculo", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token requerido" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const vehiculo = await prisma.vehiculos.findFirst({
      where: { id_usuario: decoded.id },
      select: {
        modelo:              true,
        color:               true,
        placas:              true,
        capacidad_pasajeros: true,
      },
    });

    res.json({ success: true, vehiculo });
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
});

module.exports = router;