import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../services/api/apiClient";

export const useMensajesNoLeidos = () =>
  useQuery({
    queryKey: ["chat", "noLeidos"],
    queryFn: () => orpc.chat.contarMensajesNoLeidos(),
  });

export const useMisChats = () =>
  useQuery({
    queryKey: ["chat", "misChats"],
    queryFn: () => orpc.chat.misChats(),
  });

export const useMensajes = (chatId: number) =>
  useQuery({
    queryKey: ["chat", "mensajes", chatId],
    queryFn: () => orpc.chat.getMensajes({ idViaje: chatId }),
    enabled: !!chatId,
  });

export const useChatEstado = () =>
  useQuery({
    queryKey: ["chat", "estado"],
    queryFn: () => orpc.chat.getEstado(),
  });

export const useCalificacionPendiente = () =>
  useQuery({
    queryKey: ["calificaciones", "pendiente"],
    queryFn: () => orpc.calificaciones.obtenerPendiente(),
  });
