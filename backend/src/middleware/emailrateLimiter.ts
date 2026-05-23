import { Request, Response, NextFunction } from 'express';

// Almacenamiento en memoria (se reinicia si el servidor se cae)
const intentosPorEmail = new Map<string, { intentos: number; bloqueadoHasta: number }>();

export const emailLoginLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }

  const registro = intentosPorEmail.get(email);
  
  if (registro && registro.bloqueadoHasta > Date.now()) {
    const minutosRestantes = Math.ceil((registro.bloqueadoHasta - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      message: `Demasiados intentos. Cuenta bloqueada por ${minutosRestantes} minutos.`
    });
  }

  next();
};

// Función para registrar un intento fallido
export const registrarIntentoFallido = (email: string) => {
  const ahora = Date.now();
  const registro = intentosPorEmail.get(email);
  
  if (registro) {
    const nuevosIntentos = registro.intentos + 1;
    if (nuevosIntentos >= 5) {
      // Bloquear por 15 minutos
      intentosPorEmail.set(email, {
        intentos: 0,
        bloqueadoHasta: ahora + 15 * 60 * 1000
      });
    } else {
      intentosPorEmail.set(email, {
        intentos: nuevosIntentos,
        bloqueadoHasta: 0
      });
    }
  } else {
    intentosPorEmail.set(email, {
      intentos: 1,
      bloqueadoHasta: 0
    });
  }
};

// Función para resetear intentos (login exitoso)
export const resetearIntentos = (email: string) => {
  intentosPorEmail.delete(email);
};

// Limpiar registros expirados cada hora
setInterval(() => {
  const ahora = Date.now();
  for (const [email, registro] of intentosPorEmail.entries()) {
    if (registro.bloqueadoHasta > 0 && registro.bloqueadoHasta < ahora) {
      intentosPorEmail.delete(email);
    }
  }
}, 60 * 60 * 1000);