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
import { listarViajes, publicarViaje } from './routers/viajes'
import { solicitarViaje, responderSolicitud } from './routers/solicitudes'

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
  },
  solicitudes: {
    responder: responderSolicitud,
  },
}

export type AppRouter = typeof router