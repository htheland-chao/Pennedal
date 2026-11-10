/**
 * Lydeffekter (Henrik, 10. november 2026). Alt laves med kode i browseren (Web Audio), ligesom musikken.
 * Der er ingen lydfiler, så der skal ikke stå noget i LICENSER.md.
 *
 * Hver effekt er en liste af toner og støj med en kort kurve. Feedback er aldrig straffende: et forkert svar er
 * en blød, dyb tone, ikke en summer. Med "Mindre uhygge" er alt svagere, og slag og skade er blødere.
 */

export type EffektNavn =
  | 'knap'
  | 'skridt'
  | 'hop'
  | 'landing'
  | 'planke'
  | 'rigtig'
  | 'forkert'
  | 'niveau'
  | 'skaar'
  | 'taske'
  | 'side'
  | 'sted'
  | 'kampstart'
  | 'slag'
  | 'stort'
  | 'skade'
  | 'smelter'
  | 'heling'
  | 'sejr';

type Boelge = 'sine' | 'triangle' | 'square' | 'sawtooth';
export type Lyd =
  /** En tone, der kan glide fra én frekvens til en anden. Tid i sekunder fra effektens start. */
  | { type: 'tone'; boelge: Boelge; fra: number; til?: number; start: number; laengde: number; styrke: number }
  /** Filtreret støj (skridt, sus og slag). */
  | { type: 'stoej'; filter: BiquadFilterType; frekvens: number; tilFrekvens?: number; start: number; laengde: number; styrke: number };

const tone = (boelge: Boelge, fra: number, start: number, laengde: number, styrke: number, til?: number): Lyd => ({
  type: 'tone',
  boelge,
  fra,
  til,
  start,
  laengde,
  styrke,
});
const stoej = (filter: BiquadFilterType, frekvens: number, start: number, laengde: number, styrke: number, tilFrekvens?: number): Lyd => ({
  type: 'stoej',
  filter,
  frekvens,
  tilFrekvens,
  start,
  laengde,
  styrke,
});

// Toner i C-dur, så effekterne passer til musikken.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.5;
const G6 = 1568;
const A4 = 440;
const F4 = 349.23;

export const EFFEKTER: Record<EffektNavn, Lyd[]> = {
  knap: [tone('triangle', 1200, 0, 0.04, 0.12, 900)],
  skridt: [stoej('lowpass', 900, 0, 0.05, 0.1)],
  hop: [tone('square', 330, 0, 0.12, 0.08, 620)],
  landing: [stoej('lowpass', 400, 0, 0.09, 0.22), tone('sine', 110, 0, 0.08, 0.15, 70)],
  planke: [tone('triangle', E5, 0, 0.1, 0.16), tone('triangle', G5, 0.06, 0.1, 0.16), tone('sine', C6, 0.12, 0.25, 0.14)],
  rigtig: [tone('triangle', C5, 0, 0.12, 0.18), tone('triangle', E5, 0.08, 0.12, 0.18), tone('triangle', G5, 0.16, 0.3, 0.18)],
  // Blødt og venligt: to dybe toner ned, ingen summer.
  forkert: [tone('sine', A4, 0, 0.16, 0.16), tone('sine', F4, 0.13, 0.26, 0.16)],
  niveau: [
    tone('triangle', C5, 0, 0.1, 0.16),
    tone('triangle', E5, 0.08, 0.1, 0.16),
    tone('triangle', G5, 0.16, 0.1, 0.16),
    tone('triangle', C6, 0.24, 0.35, 0.18),
  ],
  skaar: [
    tone('sine', G5, 0, 0.3, 0.12),
    tone('sine', C6, 0.07, 0.3, 0.12),
    tone('sine', E6, 0.14, 0.3, 0.12),
    tone('sine', G6, 0.21, 0.5, 0.12),
    stoej('highpass', 6000, 0, 0.6, 0.04),
  ],
  taske: [stoej('bandpass', 1400, 0, 0.12, 0.14, 700)],
  side: [stoej('bandpass', 2500, 0, 0.16, 0.1, 5000)],
  sted: [stoej('bandpass', 300, 0, 0.6, 0.16, 2400), tone('sine', 220, 0.1, 0.5, 0.06, 440)],
  kampstart: [stoej('bandpass', 400, 0, 0.45, 0.18, 3000), tone('square', 196, 0.35, 0.12, 0.1), tone('square', 294, 0.47, 0.25, 0.1)],
  slag: [stoej('lowpass', 2200, 0, 0.12, 0.25, 400), tone('square', 260, 0, 0.1, 0.08, 120)],
  stort: [stoej('lowpass', 3000, 0, 0.3, 0.3, 300), tone('sawtooth', 180, 0, 0.3, 0.09, 60), tone('triangle', G5, 0.05, 0.25, 0.1)],
  skade: [tone('square', 200, 0, 0.14, 0.1, 140), stoej('lowpass', 800, 0, 0.1, 0.12)],
  smelter: [tone('sine', 700, 0, 0.7, 0.12, 120), stoej('bandpass', 1800, 0.05, 0.6, 0.06, 300)],
  heling: [tone('sine', E5, 0, 0.2, 0.12, G5), tone('sine', C6, 0.12, 0.3, 0.1)],
  sejr: [
    tone('square', C5, 0, 0.12, 0.09),
    tone('square', C5, 0.13, 0.12, 0.09),
    tone('square', C5, 0.26, 0.12, 0.09),
    tone('square', E5, 0.4, 0.5, 0.1),
    tone('triangle', G5, 0.4, 0.5, 0.1),
  ],
};

/** Med "Mindre uhygge": slag og skade uden den hårde støj. */
export const MILDE: Partial<Record<EffektNavn, Lyd[]>> = {
  slag: [tone('triangle', 330, 0, 0.12, 0.12, 200)],
  stort: [tone('triangle', 392, 0, 0.25, 0.12, 196), tone('sine', G5, 0.05, 0.25, 0.08)],
  skade: [tone('sine', 300, 0, 0.16, 0.1, 220)],
  smelter: [tone('sine', 700, 0, 0.7, 0.1, 300)],
};

export function lydeFor(navn: EffektNavn, mild: boolean): Lyd[] {
  return (mild ? MILDE[navn] : undefined) ?? EFFEKTER[navn];
}

/** Effekter, der kommer tit (skridt), må højst spille så ofte, ellers bliver det til en summen. */
const MINDST_MELLEM: Partial<Record<EffektNavn, number>> = { skridt: 0.26, knap: 0.05, landing: 0.15 };

let ctx: AudioContext | null = null;
let ud: GainNode | null = null;
let stoejBuffer: AudioBuffer | null = null;
let valg = { til: true, styrke: 60, mild: false };
const sidst: Partial<Record<EffektNavn, number>> = {};

export function saetEffekter(v: { til: boolean; styrke: number; mild: boolean }): void {
  valg = v;
  if (ud && ctx) ud.gain.setTargetAtTime(styrkeFaktor(), ctx.currentTime, 0.05);
}

/** Faktor ved 100 % i indstillingerne. Målt med lydtjekket (OfflineAudioContext): den kraftigste effekt topper da ved 0,35, så der er god plads til talen. */
export const EFFEKT_HOVED = 1.6;

function styrkeFaktor(): number {
  return (valg.styrke / 100) * EFFEKT_HOVED * (valg.mild ? 0.6 : 1);
}

function opret(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx = new AudioContext();
  ud = ctx.createGain();
  ud.gain.value = styrkeFaktor();
  ud.connect(ctx.destination);
  stoejBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1), ctx.sampleRate);
  const d = stoejBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Spiller en effekt. Gør ingenting, hvis effekterne er slået fra, eller browseren ikke kan spille lyd. */
export function spilEffekt(navn: EffektNavn): void {
  if (!valg.til || valg.styrke <= 0) return;
  // Under automatiske test (Playwright) spilles der ingen lyd. Effekten skrives i en liste, som testen kan læse.
  if (typeof navigator !== 'undefined' && navigator.webdriver) {
    const w = window as unknown as { __effekter?: EffektNavn[] };
    (w.__effekter ??= []).push(navn);
    return;
  }
  const c = opret();
  if (!c || !ud || !stoejBuffer) return;
  if (c.state === 'suspended') void c.resume();
  const nu = c.currentTime;
  const mellem = MINDST_MELLEM[navn];
  if (mellem && sidst[navn] !== undefined && nu - sidst[navn]! < mellem) return;
  sidst[navn] = nu;
  planlaeg(c, ud, stoejBuffer, lydeFor(navn, valg.mild), nu);
}

/** Lægger lydene i kø fra tidspunktet nu. Bruges også af lydtjekket, der optager effekterne uden højttaler. */
export function planlaeg(c: BaseAudioContext, ud: AudioNode, stoejBuffer: AudioBuffer, lyde: Lyd[], nu: number): void {
  for (const l of lyde) {
    const t0 = nu + l.start;
    const t1 = t0 + l.laengde;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(l.styrke, t0 + Math.min(0.01, l.laengde / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t1);
    g.connect(ud);
    if (l.type === 'tone') {
      const o = c.createOscillator();
      o.type = l.boelge;
      o.frequency.setValueAtTime(l.fra, t0);
      if (l.til) o.frequency.exponentialRampToValueAtTime(l.til, t1);
      o.connect(g);
      o.start(t0);
      o.stop(t1 + 0.02);
    } else {
      const s = c.createBufferSource();
      s.buffer = stoejBuffer;
      const f = c.createBiquadFilter();
      f.type = l.filter;
      f.frequency.setValueAtTime(l.frekvens, t0);
      if (l.tilFrekvens) f.frequency.exponentialRampToValueAtTime(l.tilFrekvens, t1);
      s.connect(f).connect(g);
      s.start(t0, Math.random() * 0.3);
      s.stop(t1 + 0.02);
    }
  }
}
