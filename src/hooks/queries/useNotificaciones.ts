import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../services/api/apiClient";

export const useNotificaciones = () =>
  useQuery({
    queryKey: ["notificaciones"],
    queryFn: () => orpc.notificaciones.obtenerTodas(),
  });
