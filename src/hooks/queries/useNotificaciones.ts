import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../services/api/apiClient";

export const useNotificaciones = () =>
  useQuery({
    queryKey: ["notificaciones"],
    queryFn: () => orpc.notificaciones.obtenerTodas(),
    staleTime: 1000 * 60 * 5, // 5 minutos, se invalida via socket
    refetchOnMount: false,
  });
