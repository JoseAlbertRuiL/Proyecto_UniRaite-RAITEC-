import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../services/api/apiClient";

export const useViajesDisponibles = () =>
  useQuery({
    queryKey: ["viajes", "disponibles"],
    queryFn: () => orpc.viajes.listar(),
  });

export const useViajesActivos = () =>
  useQuery({
    queryKey: ["viajes", "activos"],
    queryFn: () => orpc.viajes.activos(),
  });

export const useViajePorId = (viajeId: number | undefined) =>
  useQuery({
    queryKey: ["viajes", viajeId],
    queryFn: () => orpc.viajes.porId({ viajeId: viajeId! }),
    enabled: !!viajeId,
  });

export const useHistorialPasajero = () =>
  useQuery({
    queryKey: ["viajes", "historial", "pasajero"],
    queryFn: () => orpc.viajes.historialPasajero(),
  });

export const useHistorialConductor = () =>
  useQuery({
    queryKey: ["viajes", "historial", "conductor"],
    queryFn: () => orpc.viajes.historialConductor(),
  });

export const useVehiculo = () =>
  useQuery({
    queryKey: ["vehiculo"],
    queryFn: () => orpc.conductor.getVehiculo(),
  });

export const useServerTime = () =>
  useQuery({
    queryKey: ["serverTime"],
    queryFn: () => orpc.serverTime(),
  });
