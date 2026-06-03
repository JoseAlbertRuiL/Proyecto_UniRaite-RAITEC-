import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  const { method, url } = req

  res.on('finish', () => {
    const duration = Date.now() - start
    const { statusCode } = res

    const level = statusCode >= 500 ? 'error'
      : statusCode >= 400 ? 'warn'
      : 'info'

    logger.log(level, `${method} ${url} ${statusCode} ${duration}ms`)
  })

  next()
}
