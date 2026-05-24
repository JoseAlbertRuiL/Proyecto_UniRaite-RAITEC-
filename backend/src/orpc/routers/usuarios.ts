import { ORPCError } from '@orpc/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { baseProcedure, protectedProcedure } from '../middleware'
import { prisma } from '../context'
import fs from 'fs'
import path from 'path'
import cloudinary from '../../services/cloudinaryService'
import { extraerTextoDeImagen, normalizarTexto } from '../../services/visionService'

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
      contacto_emergencia: true,
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
    foto_credencial: z.string().min(1, { message: 'Se requiere una nueva foto de credencial para validar el cambio de nombre' })
  }))
  .handler(async ({ input, context }) => {
    
    // Obtener el estado actual del usuario antes de modificarlo para la auditoría
    const usuarioActual = await prisma.usuarios.findUnique({
      where: { id_usuario: context.user.id }
    });

    if (!usuarioActual) {
      throw new ORPCError('NOT_FOUND', { message: 'Usuario no encontrado en el sistema.' });
    }

    const rutaCredencial = path.join(process.cwd(), 'uploads', 'credentials', input.foto_credencial);

    if (!fs.existsSync(rutaCredencial)) {
      throw new ORPCError('BAD_REQUEST', { message: 'No se encontró el archivo de la nueva credencial en el servidor' });
    }

    console.log('Validando nueva credencial con IA para cambio de nombre...');
    const txtCredencial = normalizarTexto(await extraerTextoDeImagen(rutaCredencial));

    // Validar estructura básica de la credencial
    if (!txtCredencial.includes('TECNOLOGICONACIONALDEMEXICO') && !txtCredencial.includes('INSTITUTOTECNOLOGICODEMORELIA')) {
      fs.unlinkSync(rutaCredencial);
      throw new ORPCError('BAD_REQUEST', { message: 'El documento no parece ser una credencial oficial del ITM.' });
    }

    // Validar que el nuevo nombre coincida con el texto extraído
    const nombreNorm = normalizarTexto(input.nombre);
    const paternoNorm = normalizarTexto(input.apellido_paterno);
    const maternoNorm = input.apellido_materno ? normalizarTexto(input.apellido_materno) : '';

    if (!txtCredencial.includes(nombreNorm) || !txtCredencial.includes(paternoNorm) || (maternoNorm && !txtCredencial.includes(maternoNorm))) {
      fs.unlinkSync(rutaCredencial);
      throw new ORPCError('BAD_REQUEST', { message: 'El nuevo nombre no coincide con la credencial subida.' });
    }

    let urlSeguraNube: string;
    try {
      console.log('Subiendo nueva credencial a Cloudinary...');
      urlSeguraNube = await subirACloudinary(rutaCredencial, 'uniraite/credenciales');
      fs.unlinkSync(rutaCredencial);
    } catch (error) {
      if (fs.existsSync(rutaCredencial)) fs.unlinkSync(rutaCredencial);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Error al subir la imagen a la nube' });
    }

    // Comparar campos de identidad para construir el historial inmutable granular
    const operacionesLog: any[] = [];

    if (usuarioActual.nombre !== input.nombre) {
      operacionesLog.push(
        prisma.historial_cambios_perfil.create({
          data: {
            id_usuario: context.user.id,
            campo_modificado: 'nombre',
            valor_anterior: usuarioActual.nombre,
            valor_nuevo: input.nombre,
            foto_evidencia: urlSeguraNube,
          },
        })
      );
    }

    if (usuarioActual.apellido_paterno !== input.apellido_paterno) {
      operacionesLog.push(
        prisma.historial_cambios_perfil.create({
          data: {
            id_usuario: context.user.id,
            campo_modificado: 'apellido_paterno',
            valor_anterior: usuarioActual.apellido_paterno,
            valor_nuevo: input.apellido_paterno,
            foto_evidencia: urlSeguraNube,
          },
        })
      );
    }

    const maternoActual = usuarioActual.apellido_materno || '';
    const maternoNuevo = input.apellido_materno || '';
    if (maternoActual !== maternoNuevo) {
      operacionesLog.push(
        prisma.historial_cambios_perfil.create({
          data: {
            id_usuario: context.user.id,
            campo_modificado: 'apellido_materno',
            valor_anterior: usuarioActual.apellido_materno || 'N/A',
            valor_nuevo: input.apellido_materno || 'N/A',
            foto_evidencia: urlSeguraNube,
          },
        })
      );
    }

    // 🔒 3. Ejecutar actualización del perfil y logs de auditoría en una transacción segura
    try {
      await prisma.$transaction([
        ...operacionesLog,
        prisma.usuarios.update({
          where: { id_usuario: context.user.id },
          data: {
            nombre: input.nombre,
            apellido_paterno: input.apellido_paterno,
            apellido_materno: input.apellido_materno || null,
            foto_credencial: urlSeguraNube
          },
        }),
      ]);
    } catch (error) {
      console.error('Error en la transacción de actualización:', error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'No se pudo guardar el cambio de perfil de manera segura.' });
    }
    
    return { success: true, message: 'Perfil actualizado exitosamente y cambio registrado en la auditoría' }
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

// PUT /api/usuarios/actualizar-contacto-emergencia
export const actualizarContactoEmergencia = protectedProcedure
  .input(z.object({ contacto_emergencia: z.string().min(10) }))
  .handler(async ({ input, context }) => {
    await prisma.usuarios.update({
      where: { id_usuario: context.user.id },
      data: { contacto_emergencia: input.contacto_emergencia },
    })
    return { success: true, message: 'Contacto de emergencia actualizado' }
  })