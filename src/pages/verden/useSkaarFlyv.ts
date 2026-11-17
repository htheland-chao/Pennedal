import { useRef, useState } from 'react';

/**
 * Et skår flyver op i tasken (Henrik, 10. november 2026): et lysende stykke papir flyver fra midten af skærmen hen
 * til knappen Taske, som derefter pulserer. Slået fra med reducer bevægelse.
 * Delt ud af Verden.tsx 16. november 2026.
 */
export function useSkaarFlyv() {
  const taskeKnap = useRef<HTMLButtonElement>(null);
  const [skaarFlyv, setSkaarFlyv] = useState<{ nr: number; x: number; y: number } | null>(null);
  const [taskePuls, setTaskePuls] = useState(false);
  function flyvTilTasken() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = taskeKnap.current?.getBoundingClientRect();
    if (!r) return;
    setSkaarFlyv((f) => ({ nr: (f?.nr ?? 0) + 1, x: r.left + r.width / 2, y: r.top + r.height / 2 }));
    window.setTimeout(() => {
      setSkaarFlyv(null);
      setTaskePuls(true);
      window.setTimeout(() => setTaskePuls(false), 900);
    }, 1100);
  }
  return { taskeKnap, skaarFlyv, taskePuls, flyvTilTasken };
}
