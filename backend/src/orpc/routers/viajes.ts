import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { baseProcedure, protectedProcedure } from '../middleware'
import { prisma } from '../context'

function parseFechaHora(fecha: string, hora: string): Date {
  const meses: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
  }

  const ahora = new Date()
  let dia = ahora.getDate()
  let mes = ahora.getMonth()
  let año = ahora.getFullYear()

  if (fecha.includes('Hoy')) {
    // valores ya asignados arriba
  } else if (fecha.includes('Mañana')) {
    const manana = new Date()
    manana.setDate(ahora.getDate() + 1)
    dia = manana.getDate()
    mes = manana.getMonth()
    año = manana.getFullYear()
  } else {
    const partes = fecha.trim().split(' ')
    if (partes.length >= 2) {
      dia = parseInt(partes[0])
      const nombreMes = partes[1].toLowerCase()
      if (meses[nombreMes] !== undefined) mes = meses[nombreMes]
    }
  }

  let horas = 0
  let minutos = 0
  const horaMatch = hora.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (horaMatch) {
    horas = parseInt(horaMatch[1])
    minutos = parseInt(horaMatch[2])
    const ampm = horaMatch[3].toUpperCase()
    if (ampm === 'PM' && horas !== 12) horas += 12
    if (ampm === 'AM' && horas === 12) horas = 0
  }

  return new Date(año, mes, dia, horas, minutos)
}

export const listarViajes = baseProcedure.handler(async () => {
  const viajes = await prisma.viajes_publicados.findMany({
    where: {
      asientos_disponibles: { gt: 0 },
      fecha_hora_salida: { gt: new Date() },
    },
    include: {
      conductor: {
        include: {
          usuario: {
            select: {
              id_usuario: true,
              nombre: true,
              apellido_paterno: true,
              foto_perfil: true,
              reputacion_promedio: true,
              viajes_completados: true,
            },
          },
        },
      },
    },
    orderBy: { fecha_hora_salida: 'asc' },
  })

  const viajesConDatos = viajes.map((viaje: any) => ({
    ...viaje,
    asientos_totales: 4,
    conductor: {
      ...viaje.conductor,
      usuario: {
        ...viaje.conductor.usuario,
        reputacion_promedio: viaje.conductor.usuario.reputacion_promedio || 0,
        total_viajes: viaje.conductor.usuario.viajes_completados || 0,
      },
    },
  }))

  return { success: true, viajes: viajesConDatos }
})

export const publicarViaje = protectedProcedure
  .input(
    z.object({
      origen: z.string().min(1),
      destino: z.string().min(1),
      fecha: z.string().min(1),
      hora: z.string().min(1),
      asientos: z.number().int().min(1),
      precio: z.number().positive(),
    })
  )
  .handler(async ({ input, context }) => {
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: context.user.id },
    })

    if (!usuario) {
      throw new ORPCError('NOT_FOUND', { message: 'Usuario no encontrado' })
    }

    if (!usuario.licencia_de_conducir) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Debes ser conductor registrado para publicar viajes',
      })
    }

    const conductor = await prisma.conductores.findUnique({
      where: { id_licencia: usuario.licencia_de_conducir },
    })

    if (!conductor) {
      throw new ORPCError('NOT_FOUND', { message: 'Datos de conductor no encontrados' })
    }

    const fechaHoraSalida = parseFechaHora(input.fecha, input.hora)

    const nuevoViaje = await prisma.viajes_publicados.create({
      data: {
        id_licencia_conductor: conductor.id_licencia,
        origen_texto: input.origen,
        destino_texto: input.destino,
        fecha_hora_salida: fechaHoraSalida,
        asientos_disponibles: input.asientos,
        costo_estimado: input.precio,
        es_recurrente: false,
      },
    })

    return {
      success: true,
      message: 'Viaje publicado exitosamente',
      viaje: nuevoViaje,
    }
  })

// GET /api/viajes/conductor/activos
// GET /api/viajes/conductor/activos
export const obtenerViajesActivos = protectedProcedure
  .handler(async ({ context }) => {
    const viajes = await prisma.viajes_publicados.findMany({
      where: {
        conductor: {
          usuario: { id_usuario: context.user.id }
        },
        fecha_hora_salida: { gt: new Date() },
        // asientos_disponibles: { gt: 0 },  // ← COMENTA O ELIMINA ESTA LÍNEA
      },
      include: {
        conductor: {
          include: {
            usuario: {
              select: {
                id_usuario: true,
                nombre: true,
                apellido_paterno: true,
                foto_perfil: true,
              }
            }
          }
        }
      },
      orderBy: { fecha_hora_salida: 'asc' }
    })

    return { success: true, viajes }
  })

// GET /api/viajes/conductor/historial
export const obtenerHistorialConductor = protectedProcedure
  .handler(async ({ context }) => {
    const viajes = await prisma.viajes_publicados.findMany({
      where: {
        conductor: {
          usuario: { id_usuario: context.user.id }
        },
        fecha_hora_salida: { lt: new Date() }
      },
      include: {
        conductor: {
          include: {
            usuario: {
              select: {
                id_usuario: true,
                nombre: true,
                apellido_paterno: true,
                foto_perfil: true,
              }
            }
          }
        }
      },
      orderBy: { fecha_hora_salida: 'desc' },
      take: 20
    })

    return { success: true, viajes }
  })

// Cancelar un viaje (solo conductor)
export const cancelarViaje = protectedProcedure
  .input(z.object({ viajeId: z.number() }))
  .handler(async ({ input, context }) => {
    const viaje = await prisma.viajes_publicados.findUnique({
      where: { id_viaje_pub: input.viajeId },
      include: { conductor: { include: { usuario: true } } },
    })

    if (!viaje) {
      throw new ORPCError('NOT_FOUND', { message: 'Viaje no encontrado' })
    }

    if (viaje.conductor.usuario?.id_usuario !== context.user.id) {
      throw new ORPCError('FORBIDDEN', { message: 'No autorizado' })
    }

    // Primero eliminar las solicitudes relacionadas
    await prisma.solicitudes_viaje.deleteMany({
      where: { id_viaje_pub: input.viajeId },
    })

    // Luego eliminar el viaje
    await prisma.viajes_publicados.delete({
      where: { id_viaje_pub: input.viajeId },
    })

    return { success: true, message: 'Viaje cancelado' }
  })