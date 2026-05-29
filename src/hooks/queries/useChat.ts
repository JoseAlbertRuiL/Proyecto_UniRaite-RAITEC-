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
    queryFn: async () => {
      const data = await orpc.chat.misChats();
      return data;
    },
    staleTime: 1000 * 15,
  });

export const useMensajes = (chatId: number) =>
  useQuery({
    queryKey: ["chat", "mensajes", chatId],
    queryFn: async () => {
      const data = await orpc.chat.getMensajes({ idViaje: chatId });
      return data.mensajes ?? data; 
    },
    staleTime: 1000 * 10,
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
