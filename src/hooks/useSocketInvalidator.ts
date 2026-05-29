import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";

const DEBOUNCE_MS = 2000;

export const useSocketInvalidator = () => {
  const queryClient = useQueryClient();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const debouncedInvalidate = (...keys: string[][]) => {
      keys.forEach((k) => {
        const keyStr = JSON.stringify(k);
        const existing = timersRef.current.get(keyStr);
        if (existing) clearTimeout(existing);
        timersRef.current.set(
          keyStr,
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: k });
            timersRef.current.delete(keyStr);
          }, DEBOUNCE_MS)
        );
      });
    };

    const handlers = {
      nueva_solicitud: () => debouncedInvalidate(["viajes"], ["solicitudes"]),
      solicitud_actualizada: () => debouncedInvalidate(["solicitudes"], ["viajes"]),
      solicitud_cancelada: () => debouncedInvalidate(["solicitudes"], ["viajes"]),
      nuevo_viaje: () => debouncedInvalidate(["viajes"]),
      viaje_cancelado: () => debouncedInvalidate(["viajes"], ["solicitudes"]),
      viaje_iniciado: () => debouncedInvalidate(["viajes"]),
      viaje_finalizado: () => debouncedInvalidate(["viajes"], ["solicitudes"]),
      nueva_notificacion: () => debouncedInvalidate(["notificaciones"]),
      new_message: () => debouncedInvalidate(["chat"]),
      mensajes_leidos: () => debouncedInvalidate(["chat"]),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [queryClient]);
};