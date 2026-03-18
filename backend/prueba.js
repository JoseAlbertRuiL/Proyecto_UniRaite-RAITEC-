import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import pkg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { Pool } = pkg;

// Conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Función principal
async function main() {
  const user = await prisma.user.create({
    data: {
      email: "test@correo.com",
      password: "123456",
      name: "Usuario Prueba",
    },
  });

  console.log("Usuario insertado:", user);
}

// Ejecutar
main()
  .catch((error) => {
    console.error("Error:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });