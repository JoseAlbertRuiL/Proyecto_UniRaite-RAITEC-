// backend/src/orpc/index.ts
import { 
  verificarCorreo, 
  login, 
  register,
  forgotPassword,
  verifyCode,
  resetPassword
} from './routers/auth'
import { getPerfil, getUsuarioById } from './routers/usuarios'
import { registroConductor, actualizarVehiculo } from './routers/conductor'
import { listarViajes, publicarViaje, getEstado } from './routers/viajes'
import { solicitarViaje, responderSolicitud } from './routers/solicitudes'
import { getMensajes, enviarMensaje, misChats } from './routers/chat'

export const router = {
  auth: {
    verificarCorreo,
    login,
    register,
    forgotPassword,
    verifyCode,
    resetPassword,
  },
  usuarios: {
    getPerfil,
    getUsuarioById,
  },
  conductor: {
    registroConductor,
    actualizarVehiculo,
  },
  viajes: {
    listar: listarViajes,
    publicar: publicarViaje,
    solicitar: solicitarViaje,
    getEstado: getEstado, 
  },
  solicitudes: {
    responder: responderSolicitud,
  },
  chat: {
    getMensajes,
    enviarMensaje,
    misChats,
  },
}

export type AppRouter = typeof router