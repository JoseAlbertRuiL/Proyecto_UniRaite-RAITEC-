import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";

export const useSocketInvalidator = () => {
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();
    if (!socket) return;

    const invalidate = (...keys: string[][]) => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
    };

    socket.on("nueva_solicitud", () =>
      invalidate(["viajes"], ["solicitudes"])
    );
    socket.on("solicitud_actualizada", () =>
      invalidate(["solicitudes"], ["viajes"])
    );
    socket.on("solicitud_cancelada", () =>
      invalidate(["solicitudes"], ["viajes"])
    );
    socket.on("nuevo_viaje", () => invalidate(["viajes"]));
    socket.on("viaje_cancelado", () =>
      invalidate(["viajes"], ["solicitudes"])
    );
    socket.on("viaje_iniciado", () => invalidate(["viajes"]));
    socket.on("viaje_finalizado", () =>
      invalidate(["viajes"], ["solicitudes"])
    );
    socket.on("nueva_notificacion", () => invalidate(["notificaciones"]));
    socket.on("new_message", () => invalidate(["chat"]));
    socket.on("mensajes_leidos", () => invalidate(["chat"]));
  }, [queryClient]);
};
