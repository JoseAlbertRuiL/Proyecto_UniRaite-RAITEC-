import winston from 'winston'
import path from 'path'

const env = (process.env.NODE_ENV ?? 'development').toLowerCase()

const levels: Record<string, string> = {
  development: 'debug',
  test: 'warn',
  production: 'info',
}

const level = levels[env] ?? 'info'

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  env === 'development'
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
          return `${timestamp} [${level}] ${message}${metaStr}`
        })
      )
    : winston.format.json()
)

const logger = winston.createLogger({
  level,
  format,
  transports: [new winston.transports.Console()],
})

export default logger
