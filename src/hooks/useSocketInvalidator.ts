import { useEffect, useRef } from "react";
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

    const handlers = {
      nueva_solicitud: () => invalidate(["viajes"], ["solicitudes"]),
      solicitud_actualizada: () => invalidate(["solicitudes"], ["viajes"]),
      solicitud_cancelada: () => invalidate(["solicitudes"], ["viajes"]),
      nuevo_viaje: () => invalidate(["viajes"]),
      viaje_cancelado: () => invalidate(["viajes"], ["solicitudes"]),
      viaje_iniciado: () => invalidate(["viajes"]),
      viaje_finalizado: () => invalidate(["viajes"], ["solicitudes"]),
      nueva_notificacion: () => invalidate(["notificaciones"]),
      new_message: () => invalidate(["chat"]),
      mensajes_leidos: () => invalidate(["chat"]),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [queryClient]);
};
