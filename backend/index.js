import express from "express";
import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post("/login", async (req, res) => {
    console.log("DATABASE:", process.env.DATABASE_URL);
  const { correo, password } = req.body;
  if (!correo || !password) return res.status(400).json({ message: "correo y password requeridos" });
  try {
    const user = await prisma.usuarios.findUnique({ where: { correo_inst: correo }});
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });
    // Si usas bcrypt:
    // const valid = await bcrypt.compare(password, user.password_hash);
    // if (!valid) return res.status(401).json({ message: "Credenciales inválidas" });
    if (user.password_hash !== password) return res.status(401).json({ message: "Credenciales inválidas" });
    return res.status(200).json({ user: { id: user.id_usuario, nombre: user.nombre, correo: user.correo_inst }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error servidor" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));