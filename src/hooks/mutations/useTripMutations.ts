import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../../services/api/apiClient";

export const usePublicarViajeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: any) => orpc.viajes.publicar(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viajes"] });
    },
  });
};

export const useSolicitarViajeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      viajeId: number;
      latitud_recogida?: number;
      longitud_recogida?: number;
    }) => orpc.solicitudes.solicitar(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viajes"] });
      queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
    },
  });
};

export const useResponderSolicitudMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      solicitudId,
      estado,
    }: {
      solicitudId: number;
      estado: "aceptada" | "rechazada";
    }) => orpc.solicitudes.responder({ solicitudId, estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
    },
  });
};

export const useIniciarViajeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ viajeId }: { viajeId: number }) =>
      orpc.viajes.iniciarViaje({ viajeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viajes"] });
    },
  });
};

export const useCancelarViajeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      viajeId,
      motivo,
    }: {
      viajeId: number;
      motivo?: string;
    }) => orpc.viajes.cancelar({ viajeId, motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viajes"] });
    },
  });
};

export const useCancelarSolicitudMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      solicitudId,
      motivo,
    }: {
      solicitudId: number;
      motivo?: string;
    }) => orpc.solicitudes.cancelar({ solicitudId, motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
      queryClient.invalidateQueries({ queryKey: ["viajes"] });
    },
  });
};

export const useMarcarNotificacionLeidaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      orpc.notificaciones.marcarLeida({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });
};

export const useMarcarTodasLeidasMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => orpc.notificaciones.marcarTodasLeidas(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });
};

export const useEliminarNotificacionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      orpc.notificaciones.eliminar({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });
};

export const useEnviarMensajeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      contenido,
    }: {
      chatId: number;
      contenido: string;
    }) => orpc.chat.enviarMensaje({ chatId, contenido }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
    },
  });
};

export const useCalificarViajeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: any) => orpc.calificaciones.guardar(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calificaciones"] });
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });
};
