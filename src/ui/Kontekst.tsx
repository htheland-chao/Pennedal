import { createContext, useContext } from 'react';
import type { Indstillinger } from '../engine/gem';

export type AppKontekst = {
  indstillinger: Indstillinger;
  visOrdkort: (id: string) => void;
};

export const Kontekst = createContext<AppKontekst | null>(null);

export function useApp(): AppKontekst {
  const k = useContext(Kontekst);
  if (!k) throw new Error('useApp skal bruges inde i Kontekst.Provider');
  return k;
}
