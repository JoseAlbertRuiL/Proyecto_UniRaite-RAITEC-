const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../plugins");

require("dotenv").config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

const uploadToCloudinary = async (localPath, folder) => {
  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: "image",
  });
  return result.secure_url;
};

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "foto_credencial") cb(null, "./uploads/credentials");
    else if (file.fieldname === "foto_perfil") cb(null, "./uploads/perfiles");
    else if (file.fieldname === "foto_licencia")
      cb(null, "./uploads/licencias");
    else if (file.fieldname === "foto_circulacion")
      cb(null, "./uploads/circulaciones");
    else cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
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

const isValidEmail = (email) => {
  return email.endsWith("@morelia.tecnm.mx");
};

// Endpoint para verificar si un correo ya está registrado
app.get("/api/verificar-correo", async (req, res) => {
  try {
    const { correo } = req.query;
    const usuario = await prisma.usuarios.findUnique({
      where: { correo_inst: correo },
    });
    res.json({ existe: !!usuario });
  } catch (error) {
    console.error("Error al verificar:", error);
    res.status(500).json({ error: "Error al verificar" });
  }
});

// Endpoint para registrar un nuevo usuario
app.post(
  "/api/register",
  upload.fields([
    { name: "foto_credencial", maxCount: 1 },
    { name: "foto_perfil", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        nombre,
        apellido_paterno,
        apellido_materno,
        num_control,
        correo_inst,
        password,
        carrera,
      } = req.body;

      const fotoCredencialFile = req.files?.foto_credencial?.[0] || null;
      const fotoPerfilFile = req.files?.foto_perfil?.[0] || null;

      let foto_credencial = null;
      let foto_perfil = null;

      if (fotoCredencialFile) {
        const localPath = fotoCredencialFile.path;
        foto_credencial = await uploadToCloudinary(localPath, "uniraite/credenciales");
        fs.unlinkSync(localPath);
      }

      if (fotoPerfilFile) {
        const localPath = fotoPerfilFile.path;
        foto_perfil = await uploadToCloudinary(localPath, "uniraite/perfiles");
        fs.unlinkSync(localPath);
      }

      if (!isValidEmail(correo_inst)) {
        return res
          .status(400)
          .json({ error: "Usa tu correo @morelia.tecnm.mx" });
      }

      if (
        !nombre ||
        !apellido_paterno ||
        !num_control ||
        !correo_inst ||
        !password
      ) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      const existe = await prisma.usuarios.findFirst({
        where: {
          OR: [{ correo_inst: correo_inst }, { num_control: num_control }],
        },
      });

      if (existe) {
        return res
          .status(400)
          .json({ error: "El correo o número de control ya está registrado" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const usuario = await prisma.usuarios.create({
        data: {
          id_usuario: crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(),
          nombre,
          apellido_paterno,
          apellido_materno: apellido_materno || null,
          num_control,
          correo_inst,
          password_hash: hashedPassword,
          carrera: carrera || null,
          foto_credencial,
          foto_perfil,
        },
      });

      const token = jwt.sign(
        { id: usuario.id_usuario },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      res.json({
        success: true,
        message: "Registro exitoso",
        token,
        user: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          apellido_paterno: usuario.apellido_paterno,
          apellido_materno: usuario.apellido_materno,
          correo_inst: usuario.correo_inst,
          num_control: usuario.num_control,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },
);

// Endpoint para iniciar sesión
app.post("/api/login", async (req, res) => {
  try {
    const { correo_inst, password } = req.body;

    const usuario = await prisma.usuarios.findUnique({
      where: { correo_inst: correo_inst },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = jwt.sign({ id: usuario.id_usuario }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Login exitoso",
      token,
      user: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        correo_inst: usuario.correo_inst,
        num_control: usuario.num_control,
        es_conductor: usuario.es_conductor,
        verificado: usuario.verificado,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Endpoint para obtener el perfil del usuario autenticado
app.get("/api/perfil", async (req, res) => {
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
        foto_credencial: true,
        foto_perfil: true,
        carrera: true,
        es_conductor: true,
        verificado: true,
        reputacion_promedio: true,
        licencia_de_conducir: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true, user: usuario });
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
});

// Endpoint para registrar conductor (licencia + datos del vehículo)
app.post(
  "/api/registro-conductor",
  upload.fields([
    { name: "foto_licencia", maxCount: 1 },
    { name: "foto_circulacion", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Token requerido" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { modelo, color, placas, capacidad_pasajeros } = req.body;
      const foto_licencia = req.files?.foto_licencia?.[0]?.filename || null;
      const foto_circulacion =
        req.files?.foto_circulacion?.[0]?.filename || null;

      if (!foto_licencia || !foto_circulacion) {
        return res.status(400).json({ error: "Faltan fotos requeridas" });
      }

      const id_licencia = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      await prisma.usuarios.update({
        where: { id_usuario: decoded.id },
        data: {
          es_conductor: true,
          licencia_de_conducir: id_licencia,
        },
      });

      await prisma.conductores.create({
        data: {
          id_licencia: id_licencia,
          foto_licencia: foto_licencia,
          foto_circulacion: foto_circulacion,
          modelo: modelo,
          color: color,
          placas: placas,
          capacidad_pasajeros: parseInt(capacidad_pasajeros),
        },
      });

      res.json({ success: true, message: "Ahora eres conductor" });
    } catch (error) {
      console.error("Error al registrar conductor:", error);
      res.status(500).json({ error: "Error al registrar conductor" });
    }
  },
);

// Endpoint para actualizar vehículo (edición)
app.put(
  "/api/vehiculo",
  upload.single("foto_circulacion"),
  async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Token requerido" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { modelo, color, placas, capacidad_pasajeros } = req.body;
      const foto_circulacion = req.file?.filename || null;

      const usuario = await prisma.usuarios.findUnique({
        where: { id_usuario: decoded.id },
      });

      if (!usuario?.licencia_de_conducir) {
        return res.status(404).json({ error: "Conductor no encontrado" });
      }

      await prisma.conductores.update({
        where: { id_licencia: usuario.licencia_de_conducir },
        data: {
          modelo: modelo,
          color: color,
          placas: placas,
          capacidad_pasajeros: parseInt(capacidad_pasajeros),
          ...(foto_circulacion && { foto_circulacion }),
        },
      });

      res.json({
        success: true,
        message: "Vehículo actualizado correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar vehículo:", error);
      res.status(500).json({ error: "Error al actualizar vehículo" });
    }
  },
);

// Endpoint para publicar un viaje
// Endpoint para obtener todos los viajes disponibles
app.get("/api/viajes", async (req, res) => {
  try {
    const viajes = await prisma.viajes_publicados.findMany({
      where: {
        asientos_disponibles: { gt: 0 },
        fecha_hora_salida: { gt: new Date() },
      },
      include: {
        conductor: {
          include: {
            usuario: {
              select: {
                id_usuario: true,
                nombre: true,
                apellido_paterno: true,
                foto_perfil: true,
                reputacion_promedio: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_hora_salida: "asc" },
    });
    res.json({ success: true, viajes });
  } catch (error) {
    console.error("Error al obtener viajes:", error);
    res.status(500).json({ error: "Error al obtener viajes" });
  }
});

// Endpoint para obtener todos los viajes disponibles
app.get("/api/viajes", async (req, res) => {
  try {
    const viajes = await prisma.viajes_publicados.findMany({
      where: {
        asientos_disponibles: { gt: 0 },
        fecha_hora_salida: { gt: new Date() },
      },
      include: {
        conductor: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido_paterno: true,
                foto_perfil: true,
                reputacion_promedio: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_hora_salida: "asc" },
    });
    res.json({ success: true, viajes });
  } catch (error) {
    console.error("Error al obtener viajes:", error);
    res.status(500).json({ error: "Error al obtener viajes" });
  }
});

// Endpoint para solicitar un asiento en un viaje
app.post("/api/viajes/:id/solicitar", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token requerido" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const viajeId = parseInt(req.params.id);
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: viajeId },
    });
    if (!viaje) {
      return res.status(404).json({ error: "Viaje no encontrado" });
    }
    if (viaje.asientos_disponibles <= 0) {
      return res.status(400).json({ error: "No hay asientos disponibles" });
    }
    const solicitudExistente = await prisma.solicitudes_viaje.findFirst({
      where: {
        id_viaje_pub: viajeId,
        id_pasajero: decoded.id,
      },
    });
    if (solicitudExistente) {
      return res.status(400).json({ error: "Ya has solicitado este viaje" });
    }
    const solicitud = await prisma.solicitudes_viaje.create({
      data: {
        id_viaje_pub: viajeId,
        id_pasajero: decoded.id,
        estado_solicitud: "pendiente",
        fecha_solicitud: new Date(),
      },
    });
    res.json({ success: true, solicitud });
  } catch (error) {
    console.error("Error al solicitar viaje:", error);
    res.status(500).json({ error: "Error al solicitar viaje" });
  }
});

// Endpoint para obtener perfil público de un usuario
app.get("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: id },
      select: {
        id_usuario: true,
        nombre: true,
        apellido_paterno: true,
        apellido_materno: true,
        carrera: true,
        foto_perfil: true,
        reputacion_promedio: true,
        created_at: true,
        es_conductor: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true, user: usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});

// Endpoint para aceptar o rechazar una solicitud
app.put("/api/solicitudes/:id", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token requerido" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const solicitudId = parseInt(req.params.id);
    const { estado } = req.body;
    const solicitud = await prisma.solicitudes_viaje.findUnique({
      where: { id_solicitud: solicitudId },
      include: { viaje: true },
    });
    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }
    const conductor = await prisma.conductores.findUnique({
      where: { id_licencia: solicitud.viaje.id_licencia_conductor },
      include: { usuario: true },
    });
    if (conductor?.usuario?.id_usuario !== decoded.id) {
      return res.status(403).json({ error: "No autorizado" });
    }
    const solicitudActualizada = await prisma.solicitudes_viaje.update({
      where: { id_solicitud: solicitudId },
      data: { estado_solicitud: estado },
    });
    if (estado === "aceptada") {
      await prisma.viajes_publicados.update({
        where: { id_viaje_pub: solicitud.id_viaje_pub },
        data: { asientos_disponibles: { decrement: 1 } },
      });
    }
    res.json({ success: true, solicitud: solicitudActualizada });
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    res.status(500).json({ error: "Error al actualizar solicitud" });
  }
});

// Endpoint para verificar el estado del servidor
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor UNIRAITE funcionando" });
});

// Rutas del chat (si las tienes)
// const chatRoutes = require("../routes/chat.routes");
// app.use("/api", chatRoutes);

async function main() {
  try {
    await prisma.$connect();
    console.log("Servidor PostgreSQL funcionando");
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`Endpoints:`);
      console.log(`   GET    /api/verificar-correo`);
      console.log(`   POST   /api/register`);
      console.log(`   POST   /api/login`);
      console.log(`   GET    /api/perfil`);
      console.log(`   POST   /api/registro-conductor`);
      console.log(`   PUT    /api/vehiculo`);
      console.log(`   POST   /api/viajes`);
      console.log(`   GET    /api/viajes`);
      console.log(`   POST   /api/viajes/:id/solicitar`);
      console.log(`   PUT    /api/solicitudes/:id`);
      console.log(`   GET    /api/health`);
    });
  } catch (error) {
    console.error("❌ Error al conectar:", error);
  }
}

main();
