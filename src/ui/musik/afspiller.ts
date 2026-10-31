/**
 * Spiller baggrundsmusikken med Web Audio. Ingen lydfiler: tonerne laves i browseren.
 * Browsere tillader først lyd efter et tryk eller en tast, så musikken starter ved elevens første tryk.
 * Musikken skrues ned, mens der er dialog eller oplæsning, så talen høres tydeligt.
 */
import { laesSpor, trinISpor, type Sang, type Tone } from './noder';
import { SANGE } from './sange';

/** Musikken er altid lav. 100 % i indstillingerne svarer til denne styrke. */
const MAKS = 0.35;
/** Under tale spiller musikken med denne del af styrken. */
const DAEMPET = 0.18;
const FADE = 1.2;
const FREMSYN = 0.2;

type Afspilning = {
  tema: string;
  sang: Sang;
  spor: { lyd: Sang['spor'][number]['lyd']; styrke: number; toner: Map<number, Tone> }[];
  trin: number;
  ialt: number;
  naeste: number;
  gain: GainNode;
};

let ctx: AudioContext | null = null;
let hoved: GainNode | null = null;
let daemper: GainNode | null = null;
let stoej: AudioBuffer | null = null;
let nu: Afspilning | null = null;
let ur: number | null = null;
let oensket: { tema: string; til: boolean; styrke: number; mild: boolean } = { tema: 'forside', til: false, styrke: 50, mild: false };
const daempAarsager = new Set<string>();
/** Når Den Ufærdige er til stede, spiller hans sang i stedet for stedets. */
let override: string | null = null;

/** Den sang, der lige nu spiller i stedet for stedets (fx Den Ufærdiges eller et minde). */
export function hentMusikOverride(): string | null {
  return override;
}

export function saetMusikOverride(tema: string | null): void {
  override = tema;
  if (ctx) anvend();
}

function lydFindes(): boolean {
  return typeof window !== 'undefined' && 'AudioContext' in window;
}

function opret(): AudioContext | null {
  if (ctx || !lydFindes()) return ctx;
  ctx = new AudioContext();
  hoved = ctx.createGain();
  daemper = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3200;
  daemper.connect(filter).connect(hoved).connect(ctx.destination);
  hoved.gain.value = 0;
  daemper.gain.value = daempAarsager.size ? DAEMPET : 1;
  stoej = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const d = stoej.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (oensket.til) void ctx.resume();
  });
  return ctx;
}

/** Kaldes ved elevens første tryk eller tast. Før det må browseren ikke spille lyd. */
export function laasOpMusik(): void {
  const c = opret();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  anvend();
}

/** Hvilken musik der skal spille. Kaldes, når stedet eller indstillingerne skifter. */
export function saetMusik(valg: { tema: string; til: boolean; styrke: number; mild: boolean }): void {
  oensket = valg;
  if (ctx) anvend();
}

/** Skru musikken ned af en grund (fx "dialog" eller "tale"). Den kommer op igen, når alle grunde er væk. */
export function daempMusik(aarsag: string, daemp: boolean): void {
  if (daemp) daempAarsager.add(aarsag);
  else daempAarsager.delete(aarsag);
  if (!ctx || !daemper) return;
  const maal = daempAarsager.size ? DAEMPET : 1;
  daemper.gain.cancelScheduledValues(ctx.currentTime);
  daemper.gain.setTargetAtTime(maal, ctx.currentTime, daempAarsager.size ? 0.08 : 0.4);
}

function anvend() {
  if (!ctx || !hoved) return;
  const styrke = oensket.til ? (Math.min(100, Math.max(0, oensket.styrke)) / 100) * MAKS : 0;
  hoved.gain.setTargetAtTime(styrke, ctx.currentTime, 0.3);
  const oensketTema = override ?? oensket.tema;
  const tema = SANGE[oensketTema] ? oensketTema : 'forside';
  const noegle = `${tema}|${oensket.mild}`;
  if (!oensket.til) {
    stopSang();
    return;
  }
  if (nu && `${nu.tema}|${oensket.mild}` === noegle) return;
  stopSang();
  startSang(tema, oensket.mild);
}

function startSang(tema: string, mild: boolean) {
  if (!ctx || !daemper) return;
  const sang = SANGE[tema];
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE);
  gain.connect(daemper);
  const spor = sang.spor
    .filter((s) => !(mild && s.uhygge))
    .map((s) => ({ lyd: s.lyd, styrke: s.styrke, toner: new Map(laesSpor(s.noder).map((t) => [t.trin, t])) }));
  const ialt = Math.max(...sang.spor.map((s) => trinISpor(s.noder).length));
  nu = { tema, sang, spor, trin: 0, ialt, naeste: ctx.currentTime + 0.1, gain };
  if (ur === null) ur = window.setInterval(planlaeg, 50);
  planlaeg();
}

function stopSang() {
  if (!nu || !ctx) return;
  const g = nu.gain;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + FADE / 2);
  window.setTimeout(() => g.disconnect(), FADE * 1000);
  nu = null;
}

/** Lægger de næste toner klar lidt før tid, så musikken ikke hakker. */
function planlaeg() {
  if (!ctx || !nu) return;
  const a = nu;
  const ottendedel = 60 / a.sang.bpm / 2;
  // Har fanen været skjult, springer vi frem i stedet for at spille alt det, vi er bagud.
  if (a.naeste < ctx.currentTime - 0.5) a.naeste = ctx.currentTime + 0.05;
  while (a.naeste < ctx.currentTime + FREMSYN) {
    for (const s of a.spor) {
      const t = s.toner.get(a.trin);
      if (t) spil(a.gain, s.lyd, s.styrke, t.frekvens, a.naeste, t.laengde * ottendedel);
    }
    a.naeste += ottendedel;
    a.trin = (a.trin + 1) % a.ialt;
  }
}

function spil(ud: GainNode, lyd: string, styrke: number, frekvens: number, start: number, laengde: number) {
  if (!ctx) return;
  const g = ctx.createGain();
  const slut = start + Math.max(0.05, laengde * 0.92);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(styrke, start + 0.015);
  g.gain.setTargetAtTime(styrke * 0.7, start + 0.05, 0.2);
  g.gain.setTargetAtTime(0, slut - 0.04, 0.03);
  g.connect(ud);
  if (lyd === 'stoej' && stoej) {
    const kilde = ctx.createBufferSource();
    kilde.buffer = stoej;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = frekvens;
    f.Q.value = 6;
    kilde.connect(f).connect(g);
    kilde.start(start);
    kilde.stop(start + 0.15);
    return;
  }
  const o = ctx.createOscillator();
  o.type = lyd === 'firkant' ? 'square' : lyd === 'savtak' ? 'sawtooth' : 'triangle';
  o.frequency.value = frekvens;
  o.connect(g);
  o.start(start);
  o.stop(slut + 0.1);
}
