import { type StedObjekt } from '../../content';
import { BORGMESTER, HOLM } from '../pixel/inde';
import { KLATTEN, type Tegnkort, voksen } from '../pixel/sprites';
import { HALVFUGL, STUMMING, TOMORD, VIMS } from '../pixel/viskeskov';
import { EKKO, RIMFOD } from '../pixel/rimbjerg';
import { FRU_FODNOTE, TVIVL } from '../pixel/arkiv';
import { KRUSEDULLE, POSTSNEGL } from '../pixel/blaeksoe';
import { BIP, GRUMSEN, LUP, PRINSESSE } from '../pixel/halvelande';
import { HALVSAETNING, LILLE_SKYGGE } from '../pixel/sidstesiden';

/**
 * Faste tal og tabeller for stedets figurer: hvilke former man ikke kan gå igennem, hvor pilen svæver, hvilke figurer der lever, og tegnkortet bag hver figur.
 * Delt ud af KortScene.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export const FART = 70; // pixel pr. sekund i pixelverdenen
export const NAER = 24;
export const FASTE_FORMER = new Set([
  'gnom',
  'skilt',
  'person',
  'skab',
  'port',
  'kasse',
  'presse',
  'borger',
  'doer',
  'stige',
  'vims',
  'tomord',
  'stumming',
  'halvfugl',
  'grenport',
  'rimfod',
  'ekko',
  'digtsten',
  'fodnote',
  'tvivl',
  'ufaerdige',
  'hytte',
  'snegl',
  'krusedulle',
  'fugl',
  'prinsesse',
  'lup',
  'grumsen',
  'bip',
  'halvsaetning',
  'skygge',
]);
/** Figurer med deres eget pixelbillede i stedet for en almindelig voksen. */
export const PERSONER: Record<string, Tegnkort> = { holm: HOLM, borgmester: BORGMESTER };
/** Hvor højt over feltets midte pilen svæver for hver form. */
export const PIL_HOEJDE: Record<string, number> = {
  gnom: 20,
  person: 27,
  skilt: 16,
  bog: 12,
  doer: 22,
  skab: 24,
  port: 22,
  kasse: 14,
  presse: 16,
  stige: 24,
  vims: 20,
  tomord: 18,
  stumming: 18,
  halvfugl: 16,
  ordblad: 10,
  grenport: 16,
  rimfod: 26,
  ekko: 20,
  digtsten: 20,
  fodnote: 16,
  tvivl: 17,
  fodnotetal: 9,
  haefte: 10,
  ufaerdige: 23,
  hytte: 38,
  snegl: 16,
  brev: 9,
  krusedulle: 18,
  fugl: 12,
  prinsesse: 18,
  lup: 17,
  grumsen: 17,
  bip: 17,
  spor: 10,
  halvsaetning: 15,
  skygge: 16,
};

export type Lyskilde = { x: number; y: number; billede: HTMLCanvasElement };
/** Former, der lever: de blinker og trækker vejret, når de står stille. Hvilke tegn i tegnkortet der er øjne. */
export const LEVENDE: Record<string, string[]> = {
  gnom: ['O', 'o'],
  person: ['E'],
  borger: ['E'],
  vims: ['E'],
  tomord: ['E'],
  stumming: ['E'],
  halvfugl: ['E'],
  rimfod: ['E'],
  ekko: ['E'],
  fodnote: ['E'],
  tvivl: ['E'],
  snegl: ['E'],
  krusedulle: ['E'],
  prinsesse: ['E'],
  lup: ['E'],
  grumsen: ['E'],
  bip: ['B'],
  halvsaetning: ['E'],
  skygge: ['E'],
};

/** Tegnkortet bag en levende figur, så den kan få billeder til at blinke og trække vejret. */
export function figurTegnkort(o: StedObjekt): Tegnkort | null {
  if (o.form === 'gnom') return KLATTEN;
  if (o.form === 'person') return PERSONER[o.id] ?? voksen(o.farve);
  if (o.form === 'borger') return voksen(o.farve, o.lys ? '#3a2a20' : '#6b4a2b');
  if (o.form === 'vims') return VIMS;
  if (o.form === 'tomord') return TOMORD;
  if (o.form === 'stumming') return STUMMING;
  if (o.form === 'halvfugl') return HALVFUGL;
  if (o.form === 'rimfod') return RIMFOD;
  if (o.form === 'ekko') return EKKO;
  if (o.form === 'fodnote') return FRU_FODNOTE;
  if (o.form === 'tvivl') return TVIVL;
  if (o.form === 'snegl') return POSTSNEGL;
  if (o.form === 'krusedulle') return KRUSEDULLE;
  if (o.form === 'prinsesse') return PRINSESSE;
  if (o.form === 'lup') return LUP;
  if (o.form === 'grumsen') return GRUMSEN;
  if (o.form === 'bip') return BIP;
  if (o.form === 'halvsaetning') return HALVSAETNING;
  if (o.form === 'skygge') return LILLE_SKYGGE;
  return null;
}
