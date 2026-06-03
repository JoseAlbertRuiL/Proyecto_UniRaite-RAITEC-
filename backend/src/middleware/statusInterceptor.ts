import type { Request, Response, NextFunction } from 'express'

// NOTE: oRPC maps router keys to slash-delimited URL paths
// e.g. router.auth.register → POST /rpc/auth/register → req.url = /auth/register
const creationProcedures = new Set([
  '/auth/register',
  '/viajes/publicar',
  '/calificaciones/guardar',
  '/solicitudes/solicitar',
  '/conductor/registroConductor',
  '/chat/enviarMensaje',
  '/incidentes/registrar',
])

const deletionProcedures = new Set([
  '/notificaciones/eliminar',
  '/chat/eliminarHistorial',
])

export function statusInterceptor(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res)
  const procedurePath = req.url?.split('?')[0] ?? ''

  res.json = function (body: unknown) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (deletionProcedures.has(procedurePath)) {
        res.status(204)
        // Send body anyway so oRPC client can parse it (returns undefined
        // via parseEmptyableJSON if empty, or the actual body if we send one).
        // Future code reading mutation.data will get a defined value.
        return originalJson(body)
      }
      if (creationProcedures.has(procedurePath)) {
        res.status(201)
      }
    }
    return originalJson(body)
  }

  next()
}
