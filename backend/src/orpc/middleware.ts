import { os, ORPCError } from '@orpc/server'
import jwt from 'jsonwebtoken'
import type { InitialContext, AuthContext } from './context'

// Procedimiento base — todos los procedures parten de aquí
// Requiere que el contexto inicial tenga los headers
export const baseProcedure = os.$context<InitialContext>()

// Middleware de autenticación reutilizable
// Verifica el JWT y enriquece el contexto con el usuario
export const authMiddleware = baseProcedure.middleware(async ({ context, next }) => {
  const token = context.headers.authorization?.split(' ')[1]

  if (!token) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Token requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
    return next({
      context: {
        ...context,
        user: { id: decoded.id },
      } satisfies AuthContext,
    })
  } catch {
    throw new ORPCError('UNAUTHORIZED', { message: 'Token inválido' })
  }
})

// Procedimiento protegido — cualquier procedure que requiera auth lo usa como base
export const protectedProcedure = baseProcedure.use(authMiddleware)
