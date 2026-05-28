export const esCorreoInstitucional = (correo: string): boolean => {
  //return correo.endsWith("@morelia.tecnm.mx");
  return correo.endsWith("@gmail.com");
};

export const formatearMensajeChat = (
  msg: any,
  usuarioActualId: string
) => {
  return {
    id: msg.id_mensaje.toString(),
    texto: msg.contenido,
    remitente: msg.id_emisor === usuarioActualId ? "yo" : "otro",
    nombre: msg.emisor?.nombre || "Usuario",
  };
};

export const filtrarViajesDisponibles = (
  viajes: any[],
  usuarioActualId: string
) => {
  return viajes.filter(
    (viaje) =>
      viaje.asientos_disponibles > 0 &&
      viaje.conductor?.usuario?.id_usuario !== usuarioActualId
  );
};