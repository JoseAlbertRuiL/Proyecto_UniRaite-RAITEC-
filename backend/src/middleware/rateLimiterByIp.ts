import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Obtener IP real del cliente
const getRealIP = (req: any): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    console.log(`🔐 [getRealIP] X-Forwarded-For: ${forwarded}, IP extraída: ${ips.trim()}`);
    return ips.trim();
  }
  console.log(`🔐 [getRealIP] IP directa: ${req.ip || req.socket?.remoteAddress}`);
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

// Rate limiting por IP: 5 intentos cada 15 minutos
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req, res) => {
    const ip = getRealIP(req);
    console.log(`🔐 [RateLimit] CLAVE GENERADA PARA IP: ${ip}`);
    return ipKeyGenerator(ip);
  },
  handler: (req, res, next, options) => {
    console.log(`🔐 [RateLimit] ¡BLOQUEADO! Se superó el límite de intentos.`);
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos desde este dispositivo. Por favor, espera 15 minutos.'
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req, res) => {
    const ip = getRealIP(req);
    return ipKeyGenerator(ip);
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Demasiados registros desde este dispositivo. Espera 1 hora.'
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});