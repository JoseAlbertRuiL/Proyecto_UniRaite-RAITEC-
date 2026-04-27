import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import { baseProcedure, protectedProcedure } from '../middleware'
import { prisma } from '../context'
import fs from 'fs'
import path from 'path'
import cloudinary from '../../services/cloudinaryService'

const subirACloudinary = async (localPath: string, folder: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: 'image',
  })
  return result.secure_url
}

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
    let urlSeguraNube: string | null = null;
    const rutaPerfil = path.join(process.cwd(), 'uploads', 'perfiles', input.foto_perfil);

    if (fs.existsSync(rutaPerfil)) {
      console.log('Subiendo nueva foto de perfil a Cloudinary...');
      urlSeguraNube = await subirACloudinary(rutaPerfil, 'uniraite/perfiles');
      
      fs.unlinkSync(rutaPerfil);
      console.log('Archivo local eliminado.');
    } else {
      throw new ORPCError('BAD_REQUEST', { message: 'No se encontró el archivo de imagen en el servidor' })
    }

    await prisma.usuarios.update({
      where: { id_usuario: context.user.id },
      data: { foto_perfil: urlSeguraNube },
    });
    return { success: true, message: "Foto actualizada" };
  });
