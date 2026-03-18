import express from "express";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import pkg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(express.json());

// ENDPOINT REGISTER
app.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, lastName2, controlNumber } = req.body;

    // Validación básica
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName} ${lastName2}`,
        controlNumber: controlNumber ? parseInt(controlNumber) : null,
      },
    });

    res.json({
      message: "Usuario registrado correctamente",
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});