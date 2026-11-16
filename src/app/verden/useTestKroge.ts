import { useEffect, useRef } from 'react';

/**
 * Til test (kun med ?hop i adressen): lad gennemspilningen gå hen til et objekt og undersøge det,
 * og læse hovedpersonens plads og banens kamera.
 * Delt ud af Verden.tsx 16. november 2026.
 */
export function useTestKroge() {
  const gaaTilRef = useRef<((id: string) => void) | null>(null);
  const spillerXRef = useRef<(() => number) | null>(null);
  const baneKameraRef = useRef<(() => { x: number; y: number; sx: number; sy: number } | null) | null>(null);
  useEffect(() => {
    if (typeof location === 'undefined' || !new URLSearchParams(location.search).has('hop')) return;
    (window as unknown as { __pennedal?: unknown }).__pennedal = {
      gaaTil: (id: string) => gaaTilRef.current?.(id),
      spillerX: () => spillerXRef.current?.() ?? NaN,
      baneKamera: () => baneKameraRef.current?.() ?? null,
    };
  }, []);
  return { gaaTilRef, spillerXRef, baneKameraRef };
}
