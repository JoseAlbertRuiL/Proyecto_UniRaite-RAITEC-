import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../services/api/apiClient";

export const useSolicitudesRecibidas = () =>
  useQuery({
    queryKey: ["solicitudes", "recibidas"],
    queryFn: () => orpc.solicitudes.recibidas(),
  });

export const useSolicitudesActivas = () =>
  useQuery({
    queryKey: ["solicitudes", "activas"],
    queryFn: () => orpc.solicitudes.activas(),
  });

export const useEstadoSolicitud = (viajeId: number) =>
  useQuery({
    queryKey: ["solicitudes", "estado", viajeId],
    queryFn: () => orpc.solicitudes.obtenerEstadoPorViaje({ viajeId }),
    enabled: !!viajeId,
  });

export const useMisSolicitudes = () =>
  useQuery({
    queryKey: ["solicitudes", "mis"],
    queryFn: () => orpc.solicitudes.misSolicitudes(),
  });
