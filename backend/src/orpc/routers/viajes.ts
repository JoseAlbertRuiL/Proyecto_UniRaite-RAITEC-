import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { baseProcedure, protectedProcedure } from '../middleware'
import { prisma } from '../context'

// Helper: parsea la fecha/hora que manda el cliente ("Hoy", "Mañana", "15 abr", "10:30 AM")
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

// GET /api/viajes  — listar viajes disponibles
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
            },
          },
        },
      },
    },
    orderBy: { fecha_hora_salida: 'asc' },
  })

  return { success: true, viajes }
})

// POST /api/viajes  — publicar un viaje (solo conductores)
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
    // 1. Buscamos al usuario y verificamos su licencia
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: context.user.id },
    })

    if (!usuario || !usuario.licencia_de_conducir) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Debes ser conductor registrado para publicar viajes',
      })
    }

    // 2. NUEVO: Buscamos qué vehículo tiene este conductor
    const relacionVehiculo = await prisma.tiene_carro.findFirst({
      where: { id_licencia: usuario.licencia_de_conducir }
    })

    if (!relacionVehiculo) {
      throw new ORPCError('BAD_REQUEST', { 
        message: 'Necesitas tener un vehículo registrado para publicar un viaje' 
      })
    }

    const fechaHoraSalida = parseFechaHora(input.fecha, input.hora)

    // 3. Creamos el viaje enlazando tanto al conductor como al vehículo
    const nuevoViaje = await prisma.viajes_publicados.create({
      data: {
        id_licencia_conductor: usuario.licencia_de_conducir,
        id_vehiculo: relacionVehiculo.id_vehiculo, // <-- ESTO ES LO QUE FALTABA
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

// GET /api/viajes/estado — Consulta si el viaje ya finalizó
export const getEstado = protectedProcedure
  .input(z.object({ viajeId: z.number().int() }))
  .handler(async ({ input }) => {
    // Buscamos en la tabla de viajes_activos para ver el estado real
    const trayecto = await prisma.viajes_activos.findFirst({
      where: { id_viaje_pub: input.viajeId },
      select: { estado_trayecto: true },
    })
    
    // Si no lo encuentra, asumimos que sigue "en_curso" o pendiente
    return { estado: trayecto?.estado_trayecto || 'en_curso' }
  })
