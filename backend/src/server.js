const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const emailjs = require("@emailjs/nodejs");

//Configuración
require("dotenv").config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

//Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

//Configuración de Subida de fotos
const uploadDir = "./uploads/credentials";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "foto_credencial") {
      cb(null, "uploads/credentials/");
    } else if (file.fieldname === "foto_perfil") {
      cb(null, "uploads/perfiles/");
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Solo JPG/PNG"), false);
    }
  },
});

// Función para validación de correo institucional
const isValidEmail = (email) => {
  const regex = /^l[2][0-9]{7}@morelia\.tecnm\.mx$/;
  return regex.test(email);
};

//Endpoint para registro
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

      // Obtener los nombres de los archivos subidos
      const foto_credencial = req.files?.foto_credencial?.[0]?.filename || null;
      const foto_perfil = req.files?.foto_perfil?.[0]?.filename || null;

      // Validar correo institucional (formato: lXXXXXXXX@morelia.tecnm.mx)
      const emailRegex = /^l[2][0-9]{7}@morelia\.tecnm\.mx$/;
      if (!emailRegex.test(correo_inst)) {
        return res.status(400).json({
          error:
            "Usa tu correo @morelia.tecnm.mx con formato lXXXXXXXX@morelia.tecnm.mx",
        });
      }

      // Validación para que todos los campos obligatorios existan
      if (
        !nombre ||
        !apellido_paterno ||
        !num_control ||
        !correo_inst ||
        !password
      ) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
      }

      // Verificar si ya existe el correo o número de control
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

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
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
          es_conductor: false,
          verificado: false,
        },
      });

      // Generar token JWT
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
          carrera: usuario.carrera,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },
);

//Endpoint de login
app.post("/api/login", async (req, res) => {
  try {
    const { correo_inst, password } = req.body;

    //Busca el usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { correo_inst: correo_inst },
    });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    //Verifica la contraseña
    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    //Genera el token
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

//Endpoint para obtener el perfil
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
        es_conductor: true,
        verificado: true,
        reputacion_promedio: true,
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

//Mensaje para confirmación de levantamiento de servidores
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor UNIRAITE funcionando" });
});

// Endpoint para verificar si el correo ya existe
app.get("/api/verificar-correo", async (req, res) => {
  try {
    const { correo } = req.query;
    console.log("Verificando correo:", correo);
    const usuario = await prisma.usuarios.findUnique({
      where: { correo_inst: correo },
    });
    res.json({ existe: !!usuario });
  } catch (error) {
    console.error("Error al verificar:", error);
    res.status(500).json({ error: "Error al verificar" });
  }
});

//Endpoint para solicitar código de recuperación
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { correo_inst } = req.body;

    //Verifica si el usuario existe
    const usuario = await prisma.usuarios.findUnique({
      where: { correo_inst: correo_inst },
    });

    if (!usuario) {
      return res.status(404).json({ error: "El correo no está registrado" });
    }

    //Genera el código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    //Guarda el código en la base de datos
    await prisma.usuarios.update({
      where: { correo_inst: correo_inst },
      data: {
        reset_token: codigo,
        reset_expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Enviar correo con EmailJS
    const templateParams = {
      to_name: usuario.nombre,
      email: correo_inst,
      codigo: codigo,
      from_name: "UNIRAITE",
    };

    console.log("📧 Enviando email a:", correo_inst);
    console.log("📧 Código:", codigo);

    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      },
    );

    console.log("✅ Email enviado:", result.status);

    res.json({
      success: true,
      message: "Código enviado a tu correo",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    res.status(500).json({ error: "Error al enviar el código" });
  }
});

//Endpoint para verificar código
app.post("/api/verify-code", async (req, res) => {
  try {
    const { correo_inst, codigo } = req.body;

    const usuario = await prisma.usuarios.findUnique({
      where: { correo_inst: correo_inst },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.reset_token !== codigo) {
      return res.status(400).json({ error: "Código incorrecto" });
    }

    if (usuario.reset_expires < new Date()) {
      return res.status(400).json({ error: "El código ha expirado" });
    }

    res.json({ success: true, message: "Código válido" });
  } catch (error) {
    console.error("Error en verify-code:", error);
    res.status(500).json({ error: "Error al verificar el código" });
  }
});

//Endpoint para cambiar contraseña
app.post("/api/reset-password", async (req, res) => {
  try {
    const { correo_inst, newPassword } = req.body;

    // Obtener el usuario actual para comparar contraseñas
    const usuario = await prisma.usuarios.findUnique({
      where: { correo_inst: correo_inst },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar si la nueva contraseña es igual a la actual
    const esMismaContraseña = await bcrypt.compare(
      newPassword,
      usuario.password_hash,
    );
    if (esMismaContraseña) {
      return res
        .status(400)
        .json({
          error: "La nueva contraseña no puede ser igual a la anterior",
        });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuarios.update({
      where: { correo_inst: correo_inst },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_expires: null,
      },
    });

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error en reset-password:", error);
    res.status(500).json({ error: "Error al cambiar la contraseña" });
  }
});

//Para iniciar el servidor
async function main() {
  try {
    await prisma.$connect();
    console.log("Servidor PostreSQL funcionando");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`Endpoints:`);
      console.log(`   POST   /api/register`);
      console.log(`   POST   /api/login`);
      console.log(`   GET    /api/perfil`);
      console.log(`   GET    /api/health`);
    });
  } catch (error) {
    console.error("❌ Error al conectar:", error);
  }
}

main();
