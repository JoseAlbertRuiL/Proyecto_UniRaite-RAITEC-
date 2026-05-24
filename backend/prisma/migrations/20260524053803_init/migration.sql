/*
  Warnings:

  - Added the required column `capacidad_pasajeros` to the `viajes_publicados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehiculo_color` to the `viajes_publicados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehiculo_modelo` to the `viajes_publicados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehiculo_placas` to the `viajes_publicados` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "viajes_publicados" ADD COLUMN     "capacidad_pasajeros" INTEGER NOT NULL,
ADD COLUMN     "vehiculo_color" TEXT NOT NULL,
ADD COLUMN     "vehiculo_modelo" TEXT NOT NULL,
ADD COLUMN     "vehiculo_placas" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "historial_cambios_perfil" (
    "id_log" SERIAL NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "campo_modificado" TEXT NOT NULL,
    "valor_anterior" TEXT NOT NULL,
    "valor_nuevo" TEXT NOT NULL,
    "foto_evidencia" TEXT NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_cambios_perfil_pkey" PRIMARY KEY ("id_log")
);

-- AddForeignKey
ALTER TABLE "historial_cambios_perfil" ADD CONSTRAINT "historial_cambios_perfil_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
