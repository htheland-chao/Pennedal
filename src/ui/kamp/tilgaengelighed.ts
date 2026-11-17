/**
 * Hensyn i kampen: mindre bevægelse, når eleven har bedt om det, og piletaster i menuerne.
 * Delt ud af KampVindue.tsx 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import type { KeyboardEvent } from 'react';

/** Sand, når eleven har bedt computeren om mindre bevægelse. Så er der ingen zoom, overgang eller slowmotion. */
export function roligBevaegelse(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Piletasterne flytter fokus mellem knapperne i en menu. */
export function piletaster(e: KeyboardEvent<HTMLElement>) {
  if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const knapper = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
  const i = knapper.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0 || knapper.length === 0) return;
  e.preventDefault();
  const frem = e.key === 'ArrowDown' || e.key === 'ArrowRight';
  knapper[(i + (frem ? 1 : knapper.length - 1)) % knapper.length].focus();
}
