// src/context/ConductorModeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ConductorModeContextType = {
  esConductorActivo: boolean;
  activarModoConductor: () => Promise<void>;
  desactivarModoConductor: () => Promise<void>;
};

const ConductorModeContext = createContext<ConductorModeContextType>({
  esConductorActivo: false,
  activarModoConductor: async () => {},
  desactivarModoConductor: async () => {},
});

export const ConductorModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [esConductorActivo, setEsConductorActivo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('modo_conductor_activo').then((valor) => {
      setEsConductorActivo(valor === 'true');
    });
  }, []);

  const activarModoConductor = async () => {
    setEsConductorActivo(true);
    await AsyncStorage.setItem('modo_conductor_activo', 'true');
  };

  const desactivarModoConductor = async () => {
    setEsConductorActivo(false);
    await AsyncStorage.setItem('modo_conductor_activo', 'false');
  };

  return (
    <ConductorModeContext.Provider
      value={{ esConductorActivo, activarModoConductor, desactivarModoConductor }}
    >
      {children}
    </ConductorModeContext.Provider>
  );
};

export const useConductorMode = () => useContext(ConductorModeContext);
