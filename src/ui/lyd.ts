/**
 * Afspiller de indtalte lydklip, som GitHub-jobbet "Lyd" har lavet (public/lyd).
 * Findes et klip ikke, bruger spillet computerens egen stemme (tale.ts).
 * Elevtekster har aldrig et klip, så de læses altid op lokalt.
 */
import { useEffect, useState } from 'react';
import { lydNoegle } from '../content/lydnoegle.mjs';
import stemmer from '../content/stemmer.json';
import { byggRum, type RumKrav } from './rumklang';

export type Figur = keyof typeof stemmer.figurer;
export type LydFil = { figur: string; tekst: string; fil: string; kilde?: string; lavet?: string };
export type LydManifest = { version: number; model?: string; i_alt?: number; mangler?: number; filer: Record<string, LydFil> };

const MAPPE = `${import.meta.env.BASE_URL}lyd/`;
let hentning: Promise<LydManifest | null> | null = null;
let gemt: LydManifest | null | undefined;

export function hentLydManifest(): Promise<LydManifest | null> {
  if (!hentning) {
    hentning = fetch(`${MAPPE}manifest.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m: unknown) => {
        const ok = m && typeof m === 'object' && 'filer' in m && typeof (m as LydManifest).filer === 'object';
        gemt = ok ? (m as LydManifest) : null;
        return gemt;
      })
      .catch(() => {
        gemt = null;
        return null;
      });
  }
  return hentning;
}

/** Manifestet og om det er færdighentet. Mens det hentes, er klar false. */
export function useLydManifest(): { manifest: LydManifest | null; klar: boolean } {
  const [m, setM] = useState<LydManifest | null | undefined>(gemt);
  useEffect(() => {
    if (gemt !== undefined) return;
    let lever = true;
    hentLydManifest().then((x) => lever && setM(x));
    return () => {
      lever = false;
    };
  }, []);
  return { manifest: m ?? null, klar: m !== undefined };
}

export function lydUrl(manifest: LydManifest | null, figur: Figur, tekst: string): string | null {
  if (!manifest) return null;
  const k = lydNoegle(tekst, figur, stemmer);
  const f = k ? manifest.filer[k] : undefined;
  return f ? `${MAPPE}${f.fil}` : null;
}

export function lydUrlForFil(fil: string): string {
  return `${MAPPE}${fil}`;
}

let aktiv: HTMLAudioElement | null = null;
/** Kobler rummet fra det klip, der spiller nu. */
let aktivRyd: (() => void) | null = null;
/** Rummets hale efter et klip, der er slut. Bliver stående, til den er klinget ud, eller til eleven stopper. */
const haler = new Set<() => void>();
let lydContext: AudioContext | null = null;

function context(): AudioContext {
  lydContext ??= new AudioContext();
  return lydContext;
}

/** Stopper klippet, men lader halen fra et klip, der selv er slut, klinge ud. */
function stopAktiv(): void {
  if (!aktiv) return;
  aktiv.onended = null;
  aktiv.onerror = null;
  aktiv.pause();
  aktiv = null;
  aktivRyd?.();
  aktivRyd = null;
}

export function stopLyd(): void {
  stopAktiv();
  for (const afslut of [...haler]) afslut();
}

/**
 * Afspiller et klip. styrke er 0-100. vedSlut får true, når klippet er spillet til ende, og false ved fejl.
 * Med rum sendes lyden gennem rumklang. Går det galt, spilles klippet uden.
 */
export function spilLyd(url: string, styrke: number, vedSlut: (fuldfoert: boolean) => void, rum?: RumKrav): boolean {
  stopAktiv();
  const a = new Audio(url);
  a.volume = Math.min(1, Math.max(0, styrke / 100));
  let ryd: (() => void) | null = null;
  if (rum) {
    try {
      ryd = byggRum(context(), a, rum);
    } catch {
      ryd = null;
    }
  }
  const slut = (fuldfoert: boolean) => {
    if (aktiv === a) {
      aktiv = null;
      aktivRyd = null;
    }
    if (ryd && rum) {
      const koblFra = ryd;
      if (fuldfoert) {
        const ur = window.setTimeout(() => afslut(), (rum.profil.hale + 0.3) * 1000);
        const afslut = () => {
          window.clearTimeout(ur);
          haler.delete(afslut);
          koblFra();
        };
        haler.add(afslut);
      } else koblFra();
    }
    vedSlut(fuldfoert);
  };
  a.onended = () => slut(true);
  a.onerror = () => slut(false);
  aktiv = a;
  aktivRyd = ryd;
  a.play().catch(() => slut(false));
  return true;
}
