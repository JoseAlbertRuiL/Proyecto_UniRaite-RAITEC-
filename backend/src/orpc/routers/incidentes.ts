import { z } from "zod";
import { protectedProcedure } from "../middleware";
import { prisma } from "../context";
import logger from '../../services/logger'

export const registrarIncidente = protectedProcedure
  .input(
    z.object({
      tipo: z.enum(["accidente", "acoso", "falla_mecanica", "otro"]),
      id_viaje_activo: z.number().int(), 
      descripcion: z.string().optional(),
      ubicacion: z.string().optional()
    })
  )
  .handler(async ({ input, context }) => {
    logger.info("Incidente registrado", { userId: context.user.id, tipo: input.tipo })

    const incidente = await prisma.incidentes_seguridad.create({
      data: {
        tipo_emergencia: input.tipo,
        id_usuario_reporta: context.user.id, 
        id_viaje_activo: input.id_viaje_activo, 
        
        descripcion_breve: input.descripcion ?? "Botón de emergencia activado",
        ubicacion_lat_lng: input.ubicacion ?? "0,0",
        fecha_reporte: new Date(),
      },
    });

    return {
      success: true,
      incidente,
    };
  });