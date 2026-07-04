'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cajasApi } from '@/lib/api';
import { Caja, FALLBACK_SINGLE_CAJA } from '@/lib/caja';

interface CajaContextType {
  selectedCaja: Caja | null;
  setSelectedCaja: (caja: Caja | null) => void;
  isLoading: boolean;
}

const CajaContext = createContext<CajaContextType | undefined>(undefined);

export function CajaProvider({ children }: { children: ReactNode }) {
  const [selectedCaja, setSelectedCajaState] = useState<Caja | null>(FALLBACK_SINGLE_CAJA);
  const [isLoading, setIsLoading] = useState(true);

  // Siempre usar la caja unica configurada en backend.
  useEffect(() => {
    const bootstrapCaja = async () => {
      try {
        const currentCaja = await cajasApi.getCurrent();
        setSelectedCajaState(currentCaja);
      } catch (e) {
        console.error('Error loading current caja:', e);
        setSelectedCajaState(FALLBACK_SINGLE_CAJA);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapCaja();
  }, []);

  const setSelectedCaja = (caja: Caja | null) => {
    // Evita dejar el sistema sin caja seleccionada.
    setSelectedCajaState(caja ?? FALLBACK_SINGLE_CAJA);
  };

  return (
    <CajaContext.Provider value={{ selectedCaja, setSelectedCaja, isLoading }}>
      {children}
    </CajaContext.Provider>
  );
}

export function useCaja() {
  const context = useContext(CajaContext);
  if (context === undefined) {
    throw new Error('useCaja must be used within a CajaProvider');
  }
  return context;
}
