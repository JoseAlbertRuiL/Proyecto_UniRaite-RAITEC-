import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { protectedProcedure } from '../middleware'
import { prisma } from '../context'

// POST /api/registro-conductor
// NOTA: Las fotos se suben primero via POST /upload/conductor (Express+Multer+Cloudinary),
// que devuelve las URLs seguras. El cliente pasa esas URLs aquí.
export const registroConductor = protectedProcedure
  .input(
    z.object({
      modelo: z.string().min(1),
      color: z.string().min(1),
      placas: z.string().min(1),
      capacidad_pasajeros: z.number().int().min(1),
      // URLs de Cloudinary devueltas por el endpoint de upload
      foto_licencia: z.string().optional(),
      foto_circulacion: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const id_licencia = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

    await prisma.usuarios.update({
      where: { id_usuario: context.user.id },
      data: {
        es_conductor: true,
        licencia_de_conducir: id_licencia,
      },
    })

    await prisma.conductores.create({
      data: {
        id_licencia,
        foto_licencia: input.foto_licencia,
        foto_circulacion: input.foto_circulacion,
        modelo: input.modelo,
        color: input.color,
        placas: input.placas,
        capacidad_pasajeros: input.capacidad_pasajeros,
      },
    })

    return { success: true, message: 'Ahora eres conductor' }
  })

// PUT /api/vehiculo
// NOTA: foto_circulacion (opcional) — si se reemplaza, primero subir via POST /upload/circulacion.
export const actualizarVehiculo = protectedProcedure
  .input(
    z.object({
      modelo: z.string().min(1),
      color: z.string().min(1),
      placas: z.string().min(1),
      capacidad_pasajeros: z.number().int().min(1),
      foto_circulacion: z.string().url().optional(), // URL de Cloudinary si se reemplaza
    })
  )
  .handler(async ({ input, context }) => {
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: context.user.id },
    })

    if (!usuario?.licencia_de_conducir) {
      throw new ORPCError('NOT_FOUND', { message: 'Conductor no encontrado' })
    }

    await prisma.conductores.update({
      where: { id_licencia: usuario.licencia_de_conducir },
      data: {
        modelo: input.modelo,
        color: input.color,
        placas: input.placas,
        capacidad_pasajeros: input.capacidad_pasajeros,
        ...(input.foto_circulacion && { foto_circulacion: input.foto_circulacion }),
      },
    })

    return { success: true, message: 'Vehículo actualizado correctamente' }
  })
