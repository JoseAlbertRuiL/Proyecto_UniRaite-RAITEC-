import express from "express";
import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import cors from "cors";

const app = express();
/*Usar adaptador para que funcione prisma*/
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());
/* post */
app.post("/login", async (req, res) => {
  console.log("📩 Request body:", req.body);

  const { correo, password } = req.body;

  try {
    console.log("🔍 Buscando usuario...");
    /* Encontrar al primer usuario */
    const user = await prisma.usuarios.findFirst({
      where: { correo_inst: correo }
    });

    console.log("👤 Usuario encontrado:", user);
      
    /* Validaciones */
    if (!user) {
      console.log("❌ Usuario no existe");
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (user.password_hash !== password) {
      console.log("❌ Password incorrecto");
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    console.log("✅ Login correcto");
    /* Retornar el usuario */
    return res.status(200).json({
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo_inst
      }
    });

  } catch (err) {

      /* Error de Servidor */
    console.error("🔥 ERROR REAL:", err);
    return res.status(500).json({
      message: "Error servidor",
      error: err.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));