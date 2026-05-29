-- DropForeignKey
ALTER TABLE "calificaciones" DROP CONSTRAINT "calificaciones_id_viaje_activo_fkey";

-- DropForeignKey
ALTER TABLE "historial_viajes" DROP CONSTRAINT "historial_viajes_id_viaje_pub_fkey";

-- DropForeignKey
ALTER TABLE "incidentes_seguridad" DROP CONSTRAINT "incidentes_seguridad_id_viaje_activo_fkey";

-- DropForeignKey
ALTER TABLE "mensajes_chat" DROP CONSTRAINT "mensajes_chat_id_viaje_pub_fkey";

-- DropForeignKey
ALTER TABLE "solicitudes_viaje" DROP CONSTRAINT "solicitudes_viaje_id_viaje_pub_fkey";

-- DropForeignKey
ALTER TABLE "viajes_activos" DROP CONSTRAINT "viajes_activos_id_viaje_pub_fkey";

-- AddForeignKey
ALTER TABLE "historial_viajes" ADD CONSTRAINT "historial_viajes_id_viaje_pub_fkey" FOREIGN KEY ("id_viaje_pub") REFERENCES "viajes_publicados"("id_viaje_pub") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_viaje" ADD CONSTRAINT "solicitudes_viaje_id_viaje_pub_fkey" FOREIGN KEY ("id_viaje_pub") REFERENCES "viajes_publicados"("id_viaje_pub") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes_chat" ADD CONSTRAINT "mensajes_chat_id_viaje_pub_fkey" FOREIGN KEY ("id_viaje_pub") REFERENCES "viajes_publicados"("id_viaje_pub") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viajes_activos" ADD CONSTRAINT "viajes_activos_id_viaje_pub_fkey" FOREIGN KEY ("id_viaje_pub") REFERENCES "viajes_publicados"("id_viaje_pub") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidentes_seguridad" ADD CONSTRAINT "incidentes_seguridad_id_viaje_activo_fkey" FOREIGN KEY ("id_viaje_activo") REFERENCES "viajes_activos"("id_viaje_activo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_viaje_activo_fkey" FOREIGN KEY ("id_viaje_activo") REFERENCES "viajes_activos"("id_viaje_activo") ON DELETE CASCADE ON UPDATE CASCADE;
