import type { Request, Response, NextFunction } from 'express'
import { MulterError } from 'multer'
import { Prisma } from '@prisma/client'
import { ORPCError } from '@orpc/server'
import logger from '../utils/logger'

interface AppError {
  code: string
  message: string
}

function toErrorResponse(err: AppError) {
  return {
    success: false,
    error: err,
  }
}

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) {
    return
  }

  // ── Multer errors ──────────────────────────────────────────────────────
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json(
        toErrorResponse({ code: 'FILE_TOO_LARGE', message: 'El archivo excede el límite de 5MB' })
      )
      return
    }
    res.status(400).json(
      toErrorResponse({ code: 'FILE_UPLOAD_ERROR', message: err.message })
    )
    return
  }

  // Multer fileFilter error (plain Error with custom message)
  if (err instanceof Error && err.message === 'Solo JPG/PNG') {
    res.status(400).json(
      toErrorResponse({ code: 'INVALID_FILE_TYPE', message: 'Solo se permiten imágenes JPG y PNG' })
    )
    return
  }

  // ── Prisma errors ─────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(500).json(
      toErrorResponse({ code: 'DATABASE_ERROR', message: 'Error en la base de datos' })
    )
    return
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(500).json(
      toErrorResponse({ code: 'DATABASE_VALIDATION_ERROR', message: 'Error de validación en la base de datos' })
    )
    return
  }

  // ── oRPC errors — already handled by oRPC handler, keep format ─────────
  if (err instanceof ORPCError) {
    res.status(500).json(
      toErrorResponse({ code: 'INTERNAL_SERVER_ERROR', message: 'An internal server error occurred' })
    )
    return
  }

  // ── Generic / unhandled ───────────────────────────────────────────────
  const message =
    err instanceof Error ? err.message : 'An internal server error occurred'

  logger.error(`[GlobalErrorHandler] ${err instanceof Error ? err.message : err}`)
  res.status(500).json(
    toErrorResponse({ code: 'INTERNAL_SERVER_ERROR', message })
  )
}
