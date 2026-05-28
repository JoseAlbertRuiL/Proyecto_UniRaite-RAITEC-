import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";

export const useSocketInvalidator = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const invalidate = (...keys: string[][]) => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
    };

    const onNuevaSolicitud = () => invalidate(["viajes"], ["solicitudes"]);
    const onSolicitudActualizada = () => invalidate(["solicitudes"], ["viajes"]);
    const onSolicitudCancelada = () => invalidate(["solicitudes"], ["viajes"]);
    const onNuevoViaje = () => invalidate(["viajes"]);
    const onViajeCancelado = () => invalidate(["viajes"], ["solicitudes"]);
    const onViajeIniciado = () => invalidate(["viajes"]);
    const onViajeFinalizado = () => invalidate(["viajes"], ["solicitudes"]);
    const onNuevaNotificacion = () => invalidate(["notificaciones"]);
    const onNewMessage = () => invalidate(["chat"]);
    const onMensajesLeidos = () => invalidate(["chat"]);

    socket.on("nueva_solicitud", onNuevaSolicitud);
    socket.on("solicitud_actualizada", onSolicitudActualizada);
    socket.on("solicitud_cancelada", onSolicitudCancelada);
    socket.on("nuevo_viaje", onNuevoViaje);
    socket.on("viaje_cancelado", onViajeCancelado);
    socket.on("viaje_iniciado", onViajeIniciado);
    socket.on("viaje_finalizado", onViajeFinalizado);
    socket.on("nueva_notificacion", onNuevaNotificacion);
    socket.on("new_message", onNewMessage);
    socket.on("mensajes_leidos", onMensajesLeidos);

    return () => {
      socket.off("nueva_solicitud", onNuevaSolicitud);
      socket.off("solicitud_actualizada", onSolicitudActualizada);
      socket.off("solicitud_cancelada", onSolicitudCancelada);
      socket.off("nuevo_viaje", onNuevoViaje);
      socket.off("viaje_cancelado", onViajeCancelado);
      socket.off("viaje_iniciado", onViajeIniciado);
      socket.off("viaje_finalizado", onViajeFinalizado);
      socket.off("nueva_notificacion", onNuevaNotificacion);
      socket.off("new_message", onNewMessage);
      socket.off("mensajes_leidos", onMensajesLeidos);
    };
  }, [queryClient]);
};