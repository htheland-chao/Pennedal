/**
 * Rumklang på stemmerne (3. november 2026). Klippene er uberørte: rummet lægges på, mens de afspilles.
 * Det giver stemning i hviskninger, introen og tilbageblik, og det kan justeres uden at lave nye klip.
 * Profilerne står i src/content/stemmer.json under "rum". Rumklang må aldrig ligge på opgaver, feedback og enkeltord,
 * fordi det gør tale sværere at forstå (oplæsningen er et hjælpemiddel for ordblinde elever).
 */
import stemmer from '../content/stemmer.json';

export type RumId = keyof typeof stemmer.rum;
export type RumProfil = { hale: number; vaad: number; lavpas: number; foerForsinkelse: number };
export type RumKrav = { profil: RumProfil; daempet: boolean };

export const rumProfil = (id: RumId): RumProfil => stemmer.rum[id];

/** Et rums svar på et klik: støj, der klinger ud, og som bliver mørkere (lavpas). Samme resultat hver gang. */
export function lavImpuls(sampleRate: number, p: RumProfil, kanal: number): Float32Array {
  const start = Math.round(p.foerForsinkelse * sampleRate);
  const laengde = start + Math.ceil(p.hale * sampleRate);
  const ud = new Float32Array(laengde);
  let frø = 0x9e3779b9 ^ (kanal * 0x85ebca6b);
  const tilfaeldig = () => {
    frø = (Math.imul(frø, 1664525) + 1013904223) >>> 0;
    return frø / 0x80000000 - 1;
  };
  const a = 1 - Math.exp((-2 * Math.PI * p.lavpas) / sampleRate);
  let y = 0;
  for (let i = start; i < laengde; i++) {
    const t = (i - start) / sampleRate;
    // 60 dB ned efter "hale" sekunder.
    const hylde = Math.exp((-6.9 * t) / p.hale);
    y += a * (tilfaeldig() - y);
    ud[i] = y * hylde;
  }
  return ud;
}

const impulser = new Map<string, AudioBuffer>();
function impuls(ctx: BaseAudioContext, p: RumProfil): AudioBuffer {
  const noegle = `${ctx.sampleRate}:${JSON.stringify(p)}`;
  let b = impulser.get(noegle);
  if (!b) {
    b = ctx.createBuffer(2, Math.round((p.foerForsinkelse + p.hale) * ctx.sampleRate), ctx.sampleRate);
    for (let k = 0; k < 2; k++) b.copyToChannel(lavImpuls(ctx.sampleRate, p, k) as Float32Array<ArrayBuffer>, k);
    impulser.set(noegle, b);
  }
  return b;
}

/**
 * Sender lyden fra et lydelement gennem rummet. Returnerer en funktion, der kobler det hele fra igen.
 * Alle knuder laves før elementet kobles på, så en fejl aldrig efterlader et stumt element.
 */
export function byggRum(ctx: AudioContext, element: HTMLMediaElement, krav: RumKrav): () => void {
  const toer = ctx.createGain();
  const rum = ctx.createConvolver();
  rum.buffer = impuls(ctx, krav.profil);
  const vaad = ctx.createGain();
  vaad.gain.value = krav.profil.vaad * (krav.daempet ? 0.5 : 1);
  const kilde = ctx.createMediaElementSource(element);
  kilde.connect(toer).connect(ctx.destination);
  kilde.connect(rum);
  rum.connect(vaad).connect(ctx.destination);
  if (ctx.state === 'suspended') void ctx.resume();
  return () => {
    for (const k of [kilde, toer, rum, vaad]) {
      try {
        k.disconnect();
      } catch {
        /* allerede koblet fra */
      }
    }
  };
}
