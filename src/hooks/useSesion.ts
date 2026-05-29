import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { connectSocket } from "../services/socket"; // Ajusta la ruta si es necesario

export const useSesion = () => {
  const [isCargando, setIsCargando] = useState(true);
  const [pantallaInicial, setPantallaInicial] = useState<"Login" | "Home">("Login");

  useEffect(() => {
    const arrancarApp = async () => {
      try {
        const tokenGuardado = await AsyncStorage.getItem("token");

        if (tokenGuardado) {
          await connectSocket();
          setPantallaInicial("Home");
        } else {
          setPantallaInicial("Login");
        }
      } catch (error) {
        console.error("Error al cargar la sesión:", error);
        setPantallaInicial("Login");
      } finally {
        setIsCargando(false);
      }
    };

    arrancarApp();
  }, []);

  return { isCargando, pantallaInicial };
};