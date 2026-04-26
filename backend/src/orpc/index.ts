import { 
  verificarCorreo, 
  login, 
  register,
  forgotPassword,
  verifyCode,
  resetPassword
} from './routers/auth'
import { getPerfil, getUsuarioById, actualizarFotoPerfil } from './routers/usuarios'
import { registroConductor, actualizarVehiculo } from './routers/conductor'
import { 
  listarViajes, 
  publicarViaje,
  obtenerViajesActivos,
  obtenerHistorialConductor
} from './routers/viajes'
import { 
  solicitarViaje, 
  responderSolicitud,
  obtenerSolicitudesRecibidas
} from './routers/solicitudes'

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
    actualizarFotoPerfil,
  },
  conductor: {
    registroConductor,
    actualizarVehiculo,
  },
  viajes: {
    listar: listarViajes,
    publicar: publicarViaje,
    activos: obtenerViajesActivos,
    historialConductor: obtenerHistorialConductor,
  },
  solicitudes: {
    solicitar: solicitarViaje,
    responder: responderSolicitud,
    recibidas: obtenerSolicitudesRecibidas,
  },
}

export type AppRouter = typeof router