import { useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { orpc } from "../../services/api/apiClient";

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      correo_inst,
      password,
    }: {
      correo_inst: string;
      password: string;
    }) => orpc.auth.login({ correo_inst, password }),
    onSuccess: async (data: any) => {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: any) => orpc.auth.register(params),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    },
  });
};

export const useVerificarCorreoMutation = () =>
  useMutation({
    mutationFn: ({ correo }: { correo: string }) =>
      orpc.auth.verificarCorreo({ correo }),
  });
