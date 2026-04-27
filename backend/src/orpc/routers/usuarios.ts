import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { baseProcedure, protectedProcedure } from '../middleware'
import { prisma } from '../context'

// GET /api/perfil  — perfil del usuario autenticado
export const getPerfil = protectedProcedure.handler(async ({ context }) => {
  const usuario = await prisma.usuarios.findUnique({
    where: { id_usuario: context.user.id },
    select: {
      id_usuario: true,
      nombre: true,
      apellido_paterno: true,
      apellido_materno: true,
      correo_inst: true,
      num_control: true,
      foto_credencial: true,
      foto_perfil: true,
      carrera: true,
      es_conductor: true,
      verificado: true,
      reputacion_promedio: true,
      licencia_de_conducir: true,
    },
  })

  if (!usuario) {
    throw new ORPCError('NOT_FOUND', { message: 'Usuario no encontrado' })
  }

  return { success: true, user: usuario }
})

// GET /api/usuarios/:id  — perfil público de cualquier usuario
export const getUsuarioById = baseProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: input.id },
      select: {
        id_usuario: true,
        nombre: true,
        apellido_paterno: true,
        apellido_materno: true,
        carrera: true,
        num_control: true,
        foto_perfil: true,
        reputacion_promedio: true,
        created_at: true,
        es_conductor: true,
      },
    })

    if (!usuario) {
      throw new ORPCError('NOT_FOUND', { message: 'Usuario no encontrado' })
    }

    return { success: true, user: usuario }
  })

// PUT /api/usuarios/foto-perfil
export const actualizarFotoPerfil = protectedProcedure
  .input(z.object({ foto_perfil: z.string() }))
  .handler(async ({ input, context }) => {
    await prisma.usuarios.update({
      where: { id_usuario: context.user.id },
      data: { foto_perfil: input.foto_perfil },
    })
    return { success: true, message: "Foto actualizada" }
  })

// PUT /api/usuarios/cambiar-password
export const cambiarPassword = protectedProcedure
  .input(z.object({
    passwordActual: z.string(),
    nuevaPassword: z.string().min(6),
  }))
  .handler(async ({ input, context }) => {
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: context.user.id },
    })

    if (!usuario) {
      throw new ORPCError('NOT_FOUND', { message: 'Usuario no encontrado' })
    }

    const valido = await bcrypt.compare(input.passwordActual, usuario.password_hash)
    if (!valido) {
      throw new ORPCError('BAD_REQUEST', { message: 'Contraseña actual incorrecta' })
    }

    const hashedPassword = await bcrypt.hash(input.nuevaPassword, 10)
    await prisma.usuarios.update({
      where: { id_usuario: context.user.id },
      data: { password_hash: hashedPassword },
    })

    return { success: true, message: 'Contraseña actualizada' }
  })

// PUT /api/usuarios/actualizar-perfil
export const actualizarPerfil = protectedProcedure
  .input(z.object({
    nombre: z.string().min(1),
    apellido_paterno: z.string().min(1),
    apellido_materno: z.string().optional(),
  }))
  .handler(async ({ input, context }) => {
    await prisma.usuarios.update({
      where: { id_usuario: context.user.id },
      data: {
        nombre: input.nombre,
        apellido_paterno: input.apellido_paterno,
        apellido_materno: input.apellido_materno || null,
      },
    })
    return { success: true, message: 'Perfil actualizado' }
  })

// PUT /api/usuarios/actualizar-carrera
export const actualizarCarrera = protectedProcedure
  .input(z.object({ carrera: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    await prisma.usuarios.update({
      where: { id_usuario: context.user.id },
      data: { carrera: input.carrera },
    })
    return { success: true, message: 'Carrera actualizada' }
  })