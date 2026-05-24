-- CreateTable
CREATE TABLE "historial_viajes" (
    "id_historial" SERIAL NOT NULL,
    "id_viaje_pub" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "realizado_por" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_viajes_pkey" PRIMARY KEY ("id_historial")
);

-- AddForeignKey
ALTER TABLE "historial_viajes" ADD CONSTRAINT "historial_viajes_id_viaje_pub_fkey" FOREIGN KEY ("id_viaje_pub") REFERENCES "viajes_publicados"("id_viaje_pub") ON DELETE RESTRICT ON UPDATE CASCADE;
