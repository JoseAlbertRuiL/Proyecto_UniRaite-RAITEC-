import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../services/api/apiClient";

export const usePerfil = () =>
  useQuery({
    queryKey: ["perfil"],
    queryFn: () => orpc.usuarios.getPerfil(),
  });

export const useUsuarioById = (id: string) =>
  useQuery({
    queryKey: ["usuarios", id],
    queryFn: () => orpc.usuarios.getUsuarioById({ id }),
    enabled: !!id,
  });
