-- AlterTable
ALTER TABLE "notificaciones" ADD COLUMN     "id_viaje" INTEGER;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_id_viaje_fkey" FOREIGN KEY ("id_viaje") REFERENCES "viajes_publicados"("id_viaje_pub") ON DELETE SET NULL ON UPDATE CASCADE;
