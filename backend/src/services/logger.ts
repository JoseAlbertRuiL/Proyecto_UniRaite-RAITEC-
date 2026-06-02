import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Formato JSON es estándar para logs profesionales
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Opcional: guardar errores en un archivo
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ],
});

export default logger;