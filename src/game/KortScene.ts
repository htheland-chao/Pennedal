import Phaser from 'phaser';
import { objektVedTryk } from './tryk';
import type { StedObjekt } from '../content';
import type { Avatar } from '../engine/gem';
import { erFastTegn, FELT, feltMidte, feltVed, felterVed, findVej, laesKort, type Felt, type Kort } from './kort';
import { bordflade, erInde, HOLM, KARTOTEK, KASSE, LOGBOG, PLANTE, PORT, PRESSE, reol, SPRINGVAND, STIGE, tegnRum, trappe, vindueslys } from './pixel/inde';
import { belysning, blegt, halvtTegnet, linjeretPapir, hash, lavLys, lavSkygge, lysOpsaetning, lavTaagebanker, lavVignet, lysBredde, partikelBilleder, sne, tegnGrund, tegnkortTilLerred, tegnTraeskygger, traePladser, tegnVand, VARMT, type Farve } from './pixel/lerred';
import { aande, gangRamme, hvileTilstand, lukOejne } from './pixel/liv';
import { indenfor, partikelTrin, partiklerFor, stedTone, vignetStyrke, type Partikel } from './stemning';
import { avatarPixel, BLADE, FUGL, fyrtaarn, KLATTEN, LANTERNE, moerkere, papirtrae, PIL, PLANKE, SKILT, STOLPE, TALEBOBLE, voksen, type Retning, type Tegnkort } from './pixel/sprites';
import { GRENPORT, HALVFUGL, ORDBLAD, STUMMING, TOMORD, VIMS } from './pixel/viskeskov';
import { DIGTSTEN, EKKO, granMedSne, RIMFOD } from './pixel/rimbjerg';
import { FODNOTETAL, FRU_FODNOTE, HAEFTE_KORT, TVIVL, UFAERDIGE_KORT } from './pixel/arkiv';
import { BREV, hytte, KRUSEDULLE, POSTSNEGL } from './pixel/blaeksoe';
import { BIP, GRUMSEN, LUP, PRINSESSE, SPOR } from './pixel/halvelande';
import { HALVSAETNING, LILLE_SKYGGE } from './pixel/sidstesiden';
import type { VerdenData, VerdenKroge } from './typer';
import { spilEffekt } from '../ui/effekter';
import { glid } from './kamera';

/**
 * Pixelgrafikken tegnes i 320 x 180. Spillets lærred skifter til den størrelse, når et sted har kort,
 * og browseren forstørrer det med skarpe pixel. Det er 9 gange færre pixel at tegne end 960 x 540.
 */
export const VIS_B = 320;
export const VIS_H = 180;
/**
 * Skarp zoom (9. november 2026): kameraet zoomer kun i hele trin (1 eller 2) og klipper i stedet for at glide.
 * Før gled zoomen fx gennem 1,37 i 320 x 180, så pixlerne "flød". Et forsøg med 4 gange så stor intern
 * opløsning gav skarpe kvarte trin, men kostede for meget (5 i stedet for 42 billeder pr. sekund i testbrowseren).
 */
/**
 * Intern opløsning (Henrik, 10. november 2026: "gå med det pæneste"). 1 = 320 x 180, 2 = 640 x 360 (fin grafik:
 * blødt lys i fuld opløsning). PhaserVerden sætter den med brugSkala, før spillet startes, og scenerne læser den,
 * når de bygges. ?skala=1, 2, 3 eller 4 i adressen vinder altid (til måling).
 */
export let SKALA = 1;
export function brugSkala(n: number) {
  SKALA = n;
}
export function skalaFraAdresse(): number | null {
  if (typeof location === 'undefined') return null;
  const n = Number(new URLSearchParams(location.search).get('skala'));
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}
/** Zoomen rundet ned til et helt trin, så hver verdenspixel er et helt antal skærmpixel, og begge figurer stadig kan ses. */
export const skarpZoom = (z: number) => Math.max(1, Math.floor(z + 1e-6));
const FART = 70; // pixel pr. sekund i pixelverdenen
const NAER = 24;
const FASTE_FORMER = new Set(['gnom', 'skilt', 'person', 'skab', 'port', 'kasse', 'presse', 'borger', 'doer', 'stige', 'vims', 'tomord', 'stumming', 'halvfugl', 'grenport', 'rimfod', 'ekko', 'digtsten', 'fodnote', 'tvivl', 'ufaerdige', 'hytte', 'snegl', 'krusedulle', 'fugl', 'prinsesse', 'lup', 'grumsen', 'bip', 'halvsaetning', 'skygge']);
/** Figurer med deres eget pixelbillede i stedet for en almindelig voksen. */
const PERSONER: Record<string, Tegnkort> = { holm: HOLM };
/** Hvor højt over feltets midte pilen svæver for hver form. */
const PIL_HOEJDE: Record<string, number> = { gnom: 20, person: 27, skilt: 16, bog: 12, doer: 22, skab: 24, port: 22, kasse: 14, presse: 16, stige: 24, vims: 20, tomord: 18, stumming: 18, halvfugl: 16, ordblad: 10, grenport: 16, rimfod: 26, ekko: 20, digtsten: 20, fodnote: 16, tvivl: 17, fodnotetal: 9, haefte: 10, ufaerdige: 23, hytte: 38, snegl: 16, brev: 9, krusedulle: 18, fugl: 12, prinsesse: 18, lup: 17, grumsen: 17, bip: 17, spor: 10, halvsaetning: 15, skygge: 16 };

type Lyskilde = { x: number; y: number; billede: HTMLCanvasElement };
/** Former, der lever: de blinker og trækker vejret, når de står stille. Hvilke tegn i tegnkortet der er øjne. */
const LEVENDE: Record<string, string[]> = { gnom: ['O', 'o'], person: ['E'], borger: ['E'], vims: ['E'], tomord: ['E'], stumming: ['E'], halvfugl: ['E'], rimfod: ['E'], ekko: ['E'], fodnote: ['E'], tvivl: ['E'], snegl: ['E'], krusedulle: ['E'], prinsesse: ['E'], lup: ['E'], grumsen: ['E'], bip: ['B'], halvsaetning: ['E'], skygge: ['E'] };

export class KortScene extends Phaser.Scene {
  private data_!: VerdenData;
  private kort!: Kort;
  private spiller!: Phaser.GameObjects.Image;
  private spillerSkygge!: Phaser.GameObjects.Image;
  private lanterne!: Phaser.GameObjects.Image;
  private fugl!: Phaser.GameObjects.Image;
  /** Hvilken side af hovedpersonen Æseløre står på, mens han taler (-1 venstre, 1 højre). */
  private fuglSide: number | null = null;
  /** Sand, mens Æseløre folder sig ud og flyver frem første gang. Så følger han ikke efter imens. */
  private fuglAnim = false;
  private pil!: Phaser.GameObjects.Image;
  private vand!: Phaser.GameObjects.Image;
  private lysLag!: Phaser.GameObjects.Image;
  private lysTekstur!: Phaser.Textures.CanvasTexture;
  private objektBilleder = new Map<string, Phaser.GameObjects.Image[]>();
  private planker: Phaser.GameObjects.Image[] = [];
  private snakkebobler: Phaser.GameObjects.Image[] = [];
  private faste = new Set<string>();
  private lyskilder: Lyskilde[] = [];
  private fyrLamper: { x: number; y: number }[] = [];
  /** Fin grafik: glød om lyskilderne, lagt oven på med ADD på grafikkortet. Den sidste følger hovedpersonens lygte. */
  private gloed: Phaser.GameObjects.Image[] = [];
  private lygteGloed: Phaser.GameObjects.Image | null = null;
  private lygte: HTMLCanvasElement | null = null;
  private tone: Farve = [255, 255, 255];
  /** Lys, der ikke flytter sig: vinduer, lampen på disken og lyset fra trappen. */
  private faesteLys: Lyskilde[] = [];
  private fyrlys: HTMLCanvasElement[] = [];
  private objektlys!: HTMLCanvasElement;
  private taster?: Record<'op' | 'ned' | 'venstre' | 'hoejre' | 'w' | 'a' | 's' | 'd' | 'e' | 'enter' | 'mellemrum', Phaser.Input.Keyboard.Key>;
  /** Sidst sendte placering af E-hintet, så React kun får besked, når det flytter sig. */
  private sidsteHint = '';
  private vej: Felt[] = [];
  private interagerVedMaal = false;
  /** Den ting, hovedpersonen er på vej hen til (klik eller gaaTil). Den vinder over en anden ting, der står lige så tæt på. */
  private maalObjekt: string | null = null;
  private retning: Retning = 'op';
  private gaaTid = 0;
  private ur = 0;
  private naer: string | null = null;
  private laast = false;
  private kam = { x: 0, y: 0 };
  /** Hvor langt kameraet kigger frem i gåretningen. Glider langsomt, så en vending ikke giver et ryk. */
  private fremad = { x: 0, y: 0 };
  /** Lyset tegnes kun forfra, når noget har flyttet sig. Det sparer meget på langsomme computere. */
  private sidsteLys = '';
  /** Dialog: hvem der taler, kameraets zoom og talebobben. */
  private taler: string | null = null;
  private zoom = 1;
  private zoomMaal = 1;
  /** Hovedpersonen går hen til den, der taler, når dialogen starter. */
  private gaarTilTaler = false;
  private boble!: Phaser.GameObjects.Image;
  /** Partikler i luften og forgrundens grene (parallakse). */
  private partikler: { billede: Phaser.GameObjects.Image; p: Partikel; noegle: string }[] = [];
  private forgrund: { billede: Phaser.GameObjects.Image; x: number; y: number }[] = [];
  private vignet: HTMLCanvasElement | null = null;
  /** Tågebanker i Viskeskoven: to lag, der driver med hver sin fart og glider forskelligt med kameraet. */
  private taage: { billeder: Phaser.GameObjects.Image[]; fart: number; faktor: number; y: number }[] = [];
  /** Figurer, der blinker og trækker vejret: billedet, nøglen til det almindelige billede og en fase. */
  private levende: { billede: Phaser.GameObjects.Image; noegle: string; fase: number }[] = [];
  /** Træerne, så de kan blive gennemsigtige, når de står foran en figur. */
  private traeBilleder: Phaser.GameObjects.Image[] = [];
  private roligt = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    super('kort');
  }

  init(data: VerdenData) {
    this.data_ = data;
    this.sidsteLys = '';
    this.vej = [];
    this.naer = null;
    this.objektBilleder = new Map();
    this.planker = [];
    this.snakkebobler = [];
    this.taler = null;
    this.zoom = 1;
    this.zoomMaal = 1;
    this.lyskilder = [];
    this.fyrLamper = [];
    this.gloed = [];
    this.lygteGloed = null;
    this.faesteLys = [];
    this.partikler = [];
    this.forgrund = [];
    this.taage = [];
    this.levende = [];
    this.traeBilleder = [];
  }

  private get kroge(): VerdenKroge {
    return this.registry.get('kroge') as VerdenKroge;
  }

  private tekstur(noegle: string, kilde: HTMLCanvasElement | Tegnkort, ny = false) {
    if (this.textures.exists(noegle)) {
      if (!ny) return noegle;
      this.textures.remove(noegle);
    }
    const c = kilde instanceof HTMLCanvasElement ? kilde : tegnkortTilLerred(kilde);
    this.textures.addCanvas(noegle, c)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return noegle;
  }

  /** Laver hovedpersonens billeder ud fra avataren. Kaldes igen, hvis eleven ændrer sin avatar. */
  byggAvatar() {
    const a = this.registry.get('avatar') as Avatar | undefined;
    if (!a) return;
    for (const r of ['ned', 'op', 'hoejre'] as const)
      for (const f of [0, 1, 2] as const) {
        const t = avatarPixel(a, r, f);
        this.tekstur(`px-spiller-${r}-${f}`, t, true);
        if (f !== 0) continue;
        // Stå stille: blinke (ikke bagfra) og trække vejret. Hoften er række 16 i hovedpersonens 24 rækker.
        this.tekstur(`px-spiller-${r}-0-blink`, (r !== 'op' && lukOejne(t, ['E', 'W'])) || t, true);
        this.tekstur(`px-spiller-${r}-0-aande`, aande(t, 16), true);
      }
    this.lanterne?.setVisible(a.tilbehoer === 3);
  }

  private erFast(x: number, y: number): boolean {
    return erFastTegn(this.kort.tegn(x, y)) || this.faste.has(`${x},${y}`);
  }

  create() {
    const { sted, mindreUhygge } = this.data_;
    this.kort = laesKort(sted.kort ?? ['.']);
    const W = this.kort.bredde * FELT;
    const H = this.kort.hoejde * FELT;
    const tema = sted.tema;

    // Billeder, der deles af alle steder.
    // Rimbjerget har graner med sne i stedet for papirtræer.
    const bjerg = tema === 'rimbjerg';
    const traeer = [22, 26, 30, 34].map((h, i) => this.tekstur(`px-trae-${bjerg ? 'gran-' : ''}${i}`, bjerg ? granMedSne(h) : papirtrae(h)));
    this.tekstur('px-klatten', KLATTEN);
    this.tekstur('px-skilt', SKILT);
    this.tekstur('px-blade', BLADE);
    this.tekstur('px-stolpe', STOLPE);
    this.tekstur('px-planke', PLANKE);
    this.tekstur('px-pil', PIL);
    this.tekstur('px-fugl', FUGL);
    this.tekstur('px-boble', TALEBOBLE);
    this.tekstur('px-fyr', fyrtaarn());
    this.tekstur('px-lanterne', LANTERNE);
    this.tekstur('px-skygge', lavSkygge(12));
    this.byggAvatar();

    const inde = erInde(this.kort);
    const lys = lysOpsaetning(belysning(tema), mindreUhygge);
    this.tone = stedTone(tema, mindreUhygge) ?? lys.tone;

    // Jorden og vandet for dette sted. Indendørs: gulv og vægge.
    const grund0 = inde ? tegnRum(this.kort, tema === 'kaelder' || tema === 'arkiv' ? 'sten' : 'trae') : tegnGrund(this.kort);
    if (!inde) tegnTraeskygger(grund0, this.kort, [22, 26, 30, 34].map((h) => Math.round(h * 0.36) * 2 + 1));
    const grund = tema === 'viskeskov' ? blegt(grund0, 0.8) : tema === 'rimbjerg' ? sne(grund0) : tema === 'halve' ? halvtTegnet(grund0) : tema === 'siden' ? linjeretPapir(grund0) : grund0;
    this.add.image(0, 0, this.tekstur(`px-grund-${tema}`, grund, true)).setOrigin(0).setDepth(-100000);
    for (let i = 0; i < 3; i++) this.tekstur(`px-vand-${tema}-${i}`, tegnVand(this.kort, i, tema), true);
    this.vand = this.add.image(0, 0, `px-vand-${tema}-0`).setOrigin(0).setDepth(-99999);

    // Træer, stolper, planker, blade og fyrtårne fra kortet.
    for (let ty = 0; ty < this.kort.hoejde; ty++)
      for (let tx = 0; tx < this.kort.bredde; tx++) {
        const c = this.kort.tegn(tx, ty);
        const a = hash(tx * 7 + 3, ty * 13 + 1);
        const b = hash(tx * 5 + 1, ty * 3 + 7);
        if (c === '#') {
          // Træerne sættes nedenfor ud fra traePladser, så de passer med skyggerne.
        } else if (c === 'p') {
          const y = ty * FELT + 13;
          this.add.image(tx * FELT + 8, y, 'px-stolpe').setOrigin(0.5, 1).setDepth(y);
        } else if (c === 'q') {
          const y0 = Math.round(ty * FELT + 6 + b * 4);
          this.planker.push(this.add.image(Math.round(tx * FELT + 4 + a * 4), y0, 'px-planke').setOrigin(0).setDepth(-99990).setData('y0', y0));
        } else if (c === 'L') {
          this.add.image(tx * FELT + 1, ty * FELT + 6, 'px-blade').setOrigin(0).setDepth(-99980);
        } else if (c === 'F') {
          const y = (ty + 1) * FELT - 1;
          this.add.image(tx * FELT + 8, y, 'px-fyr').setOrigin(0.5, 1).setDepth(y);
          this.fyrLamper.push({ x: tx * FELT + 8, y: y - 44 });
        } else if (c === 'f' && this.kort.tegn(tx - 1, ty) !== 'f' && this.kort.tegn(tx, ty - 1) !== 'f') {
          const y = (ty + 2) * FELT;
          this.add.image(tx * FELT, y, this.tekstur('px-springvand', SPRINGVAND)).setOrigin(0, 1).setDepth(y - 1);
        } else if (inde) this.moebel(c, tx, ty, tema === 'kaelder' || tema === 'arkiv');
      }

    for (const t of traePladser(this.kort)) this.traeBilleder.push(this.add.image(t.x, t.y, traeer[t.nr]).setOrigin(0.5, 1).setDepth(t.y));

    // Objekter: Klatten, skilte og personer.
    for (const o of sted.objekter) {
      if (!o.felt) continue;
      const midte = feltMidte(o.felt);
      const billeder: Phaser.GameObjects.Image[] = [];
      let noegle: string | null = null;
      if (o.form === 'gnom') noegle = 'px-klatten';
      else if (o.form === 'skilt') noegle = 'px-skilt';
      else if (o.form === 'person') noegle = PERSONER[o.id] ? this.tekstur(`px-person-${o.id}`, PERSONER[o.id]) : this.tekstur(`px-person-${o.farve}`, voksen(o.farve));
      else if (o.form === 'skab') noegle = this.tekstur('px-kartotek', KARTOTEK);
      else if (o.form === 'port' || o.form === 'doer') noegle = this.tekstur('px-port', PORT);
      else if (o.form === 'kasse') noegle = this.tekstur('px-kasse', KASSE);
      else if (o.form === 'presse') noegle = this.tekstur('px-presse', PRESSE);
      else if (o.form === 'stige') noegle = this.tekstur('px-stige', STIGE);
      else if (o.form === 'vims') noegle = this.tekstur('px-vims', VIMS);
      else if (o.form === 'tomord') noegle = this.tekstur('px-tomord', TOMORD);
      else if (o.form === 'stumming') noegle = this.tekstur('px-stumming', STUMMING);
      else if (o.form === 'halvfugl') noegle = this.tekstur('px-halvfugl', HALVFUGL);
      else if (o.form === 'ordblad') noegle = this.tekstur('px-ordblad', ORDBLAD);
      else if (o.form === 'grenport') noegle = this.tekstur('px-grenport', GRENPORT);
      else if (o.form === 'rimfod') noegle = this.tekstur('px-rimfod', RIMFOD);
      else if (o.form === 'ekko') noegle = this.tekstur('px-ekko', EKKO);
      else if (o.form === 'digtsten') noegle = this.tekstur('px-digtsten', DIGTSTEN);
      else if (o.form === 'fodnote') noegle = this.tekstur('px-fodnote', FRU_FODNOTE);
      else if (o.form === 'tvivl') noegle = this.tekstur('px-tvivl', TVIVL);
      else if (o.form === 'fodnotetal') noegle = this.tekstur('px-fodnotetal', FODNOTETAL);
      else if (o.form === 'haefte') noegle = this.tekstur('px-haefte', HAEFTE_KORT);
      else if (o.form === 'ufaerdige') noegle = this.tekstur('px-ufaerdige', UFAERDIGE_KORT);
      else if (o.form === 'hytte') noegle = this.tekstur('px-hytte', hytte());
      else if (o.form === 'snegl') noegle = this.tekstur('px-snegl', POSTSNEGL);
      else if (o.form === 'brev') noegle = this.tekstur('px-brev', BREV);
      else if (o.form === 'krusedulle') noegle = this.tekstur('px-krusedulle', KRUSEDULLE);
      else if (o.form === 'fugl') noegle = 'px-fugl';
      else if (o.form === 'prinsesse') noegle = this.tekstur('px-prinsesse', PRINSESSE);
      else if (o.form === 'lup') noegle = this.tekstur('px-lup', LUP);
      else if (o.form === 'grumsen') noegle = this.tekstur('px-grumsen', GRUMSEN);
      else if (o.form === 'bip') noegle = this.tekstur('px-bip', BIP);
      else if (o.form === 'spor') noegle = this.tekstur('px-spor', SPOR);
      else if (o.form === 'halvsaetning') noegle = this.tekstur('px-halvsaetning', HALVSAETNING);
      else if (o.form === 'skygge') noegle = this.tekstur('px-lille-skygge', LILLE_SKYGGE);
      else if (o.form === 'borger') noegle = this.tekstur(`px-person-${o.farve}`, voksen(o.farve, o.lys ? '#3a2a20' : '#6b4a2b'));
      else if (o.form === 'bog') {
        // Bogen ligger fladt på disken og tegnes oven på den.
        billeder.push(this.add.image(o.felt[0] * FELT + 2, o.felt[1] * FELT + 2, this.tekstur('px-logbog', LOGBOG)).setOrigin(0).setDepth(o.felt[1] * FELT + 16));
      }
      if (noegle) {
        if (['gnom', 'person', 'borger', 'vims', 'tomord', 'stumming', 'fodnote', 'tvivl', 'snegl', 'krusedulle', 'fugl', 'prinsesse', 'lup', 'grumsen', 'bip', 'halvsaetning', 'skygge'].includes(o.form)) billeder.push(this.add.image(midte.x, midte.y, 'px-skygge').setOrigin(0.5, 0.5).setDepth(midte.y - 1));
        const hoved = this.add.image(midte.x, midte.y, noegle).setOrigin(0.5, 1).setDepth(midte.y).setData('y0', midte.y);
        billeder.push(hoved);
        const oejne = LEVENDE[o.form];
        if (oejne) {
          // Lav billeder til at blinke og trække vejret ud fra figurens eget billede.
          const kilde = this.figurTegnkort(o);
          if (kilde) {
            const lukket = lukOejne(kilde, oejne);
            if (lukket) this.tekstur(`${noegle}-blink`, lukket);
            this.tekstur(`${noegle}-aande`, aande(kilde));
            this.levende.push({ billede: hoved, noegle, fase: hash(o.felt[0] * 3, o.felt[1] * 11) });
          }
        }
      }
      if (o.form === 'ufaerdige' && noegle && !this.data_.mindreUhygge) {
        // Den Ufærdiges blege øjne ses i mørket: de ligger over lyslaget.
        const oejne = { raekker: UFAERDIGE_KORT.raekker.map((r) => r.replace(/[^E]/g, '.')), palet: UFAERDIGE_KORT.palet };
        billeder.push(this.add.image(midte.x, midte.y, this.tekstur('px-ufaerdige-oejne', oejne)).setOrigin(0.5, 1).setDepth(1_000_001));
      }
      if (o.lys) {
        billeder.push(this.add.image(midte.x + 7, midte.y - 9, 'px-lanterne').setOrigin(0.5, 1).setDepth(midte.y + 1));
      }
      if (o.snakker) {
        // Byens folk snakker i munden på hinanden: små talebobler, der kommer og går.
        const b = this.add.image(midte.x + 4, midte.y - 28, 'px-boble').setOrigin(0.5, 1).setDepth(2_000_000).setVisible(false);
        b.setData('snak', hash(o.felt[0] * 13, o.felt[1] * 7) * 6).setData('id', o.id);
        this.snakkebobler.push(b);
        billeder.push(b);
      }
      this.objektBilleder.set(o.id, billeder);
    }
    this.objektlys = lavLys(46, 0.9, this.tone, VARMT, SKALA);
    this.saetSkjulte(this.data_.skjulte ?? []);

    // Hovedpersonen og Æseløre.
    const start = feltMidte(sted.startFelt ?? [1, 1]);
    this.spillerSkygge = this.add.image(start.x, start.y, 'px-skygge').setOrigin(0.5, 0.5);
    this.spiller = this.add.image(start.x, start.y, 'px-spiller-op-0').setOrigin(0.5, 1);
    this.lanterne = this.add.image(start.x, start.y, 'px-lanterne').setOrigin(0.5, 1);
    this.lanterne.setVisible((this.registry.get('avatar') as Avatar | undefined)?.tilbehoer === 3);
    this.fugl = this.add.image(start.x - 14, start.y + 4, 'px-fugl').setOrigin(0.5, 1).setVisible(!(this.data_.skjulte ?? []).includes('aeseloere'));
    this.pil = this.add.image(0, 0, 'px-pil').setOrigin(0.5, 1).setDepth(2_000_000).setVisible(false);
    this.boble = this.add.image(0, 0, 'px-boble').setOrigin(0.5, 1).setDepth(2_000_001).setVisible(false);

    // Nattelys: et lag, der ganges på billedet. Lanternen og fyrtårnet lyser op.
    const tone = this.tone;
    this.lygte = lys.spillerLys > 0 ? lavLys(lys.spillerLys, 0.95, tone, VARMT, SKALA) : null;
    this.fyrlys = [lavLys(34, 0.75, tone, VARMT, SKALA), lavLys(40, 0.85, tone, VARMT, SKALA)];
    if (inde) this.lavFaesteLys();
    if (this.textures.exists('px-lys')) this.textures.remove('px-lys');
    // Fin grafik: lyslaget har samme opløsning som spillet (SKALA), og lyset er blødt.
    this.lysTekstur = this.textures.createCanvas('px-lys', VIS_B * SKALA, VIS_H * SKALA)!;
    this.lysTekstur.setFilter(SKALA > 1 ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST);
    this.lysLag = this.add.image(0, 0, 'px-lys').setOrigin(0).setDepth(1_000_000).setBlendMode(Phaser.BlendModes.MULTIPLY);

    const cam = this.cameras.main;
    cam.setZoom(SKALA).setBounds(0, 0, W, H).setRoundPixels(true);
    this.kam = { x: start.x, y: start.y - 10 };
    this.fremad = { x: 0, y: 0 };
    this.flytKamera(Infinity);
    this.lavStemning(tema, inde);
    this.byggGloed();

    const kb = this.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.taster = {
        op: kb.addKey(K.UP),
        ned: kb.addKey(K.DOWN),
        venstre: kb.addKey(K.LEFT),
        hoejre: kb.addKey(K.RIGHT),
        w: kb.addKey(K.W),
        a: kb.addKey(K.A),
        s: kb.addKey(K.S),
        d: kb.addKey(K.D),
        e: kb.addKey(K.E),
        enter: kb.addKey(K.ENTER),
        mellemrum: kb.addKey(K.SPACE),
      };
    }

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.laast) return;
      const punkt = this.cameras.main.getWorldPoint(p.x, p.y);
      const [tx, ty] = feltVed(punkt.x, punkt.y);
      // Trykker man på (eller lige ved) noget, man kan undersøge, går hovedpersonen derhen og undersøger det.
      const ramt = objektVedTryk(this.kanUndersoeges(), tx, ty, this.data_.aktiv);
      if (ramt) {
        this.gaaTilObjekt(ramt.id);
        return;
      }
      if (!this.erFast(tx, ty)) this.saetVej([tx, ty], false);
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown');
    });
  }

  /** Tegnkortet bag en levende figur, så den kan få billeder til at blinke og trække vejret. */
  private figurTegnkort(o: StedObjekt): Tegnkort | null {
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

  /**
   * Stemning (Henrik, 9. november 2026): partikler i luften, en vignet på lyset og grene i forgrunden.
   * Med reduceret bevægelse er der ingen partikler, og grenene står stille.
   */
  private lavStemning(tema: string, inde: boolean) {
    this.vignet = lavVignet(VIS_B * SKALA, VIS_H * SKALA, vignetStyrke(tema, this.data_.mindreUhygge), SKALA > 1);
    if (!this.roligt)
      for (const { art, antal } of partiklerFor(tema)) {
        const [a, b] = partikelBilleder(art);
        const n0 = this.tekstur(`px-partikel-${art}-0`, a);
        this.tekstur(`px-partikel-${art}-1`, b);
        // Ildfluer lyser i mørket, så de ligger over lyslaget. Resten bliver mørkere med lyset.
        const dybde = art === 'ildflue' ? 1_000_001 : 999_000;
        for (let i = 0; i < antal; i++) {
          const fase = hash(i * 17 + art.length, i * 5 + 3);
          const p: Partikel = { art, x: this.kam.x - VIS_B / 2 + hash(i, art.length * 7) * VIS_B, y: this.kam.y - VIS_H / 2 + hash(art.length, i * 7) * VIS_H, fase };
          this.partikler.push({ billede: this.add.image(p.x, p.y, n0).setDepth(dybde).setOrigin(0.5), p, noegle: `px-partikel-${art}` });
        }
      }
    if (tema === 'viskeskov') {
      const B = VIS_B * 2;
      for (const [i, lag] of [{ fart: 4, faktor: 0.25, y: 0.15, alpha: 0.45 }, { fart: 9, faktor: -0.15, y: 0.55, alpha: 0.32 }].entries()) {
        const noegle = this.tekstur(`px-taagebanke-${i}`, lavTaagebanker(B, 70, i + 3));
        const a = this.data_.mindreUhygge ? lag.alpha * 0.6 : lag.alpha;
        const billeder = [0, 1].map(() => this.add.image(0, 0, noegle).setOrigin(0).setDepth(999_100 + i).setAlpha(a));
        this.taage.push({ billeder, fart: this.roligt ? 0 : lag.fart, faktor: lag.faktor, y: lag.y });
      }
    }
    if (inde) return;
    // Grene i forgrunden: mørke trækroner langs kortets nederste kant, der glider lidt hurtigere end resten,
    // så verden får dybde, når kameraet flytter sig.
    const k = this.kort;
    const gren = this.tekstur('px-forgrund', { ...papirtrae(40), palet: Object.fromEntries(Object.entries(papirtrae(40).palet).map(([n, f]) => [n, moerkere(f, 0.42)])) });
    for (let tx = 1; tx < k.bredde; tx += 4) {
      if (k.tegn(tx, k.hoejde - 1) !== '#') continue;
      const x = tx * FELT + hash(tx, 5) * 16;
      const y = k.hoejde * FELT - 6 + hash(tx, 9) * 6;
      this.forgrund.push({ billede: this.add.image(x, y, gren).setOrigin(0.5, 1).setDepth(999_500), x, y });
    }
  }

  /** Et møbel fra kortet. Fodpunktet bestemmer dybden, så man kan gå bag om det. */
  private moebel(c: string, tx: number, ty: number, kaelder: boolean) {
    const k = this.kort;
    const saet = (noegle: string, x: number, bund: number) => this.add.image(x, bund, noegle).setOrigin(0, 1).setDepth(bund - 1);
    if (c === 'R') saet(this.tekstur(`px-reol-v-${kaelder}`, reol(26, kaelder)), tx * FELT, ty * FELT + 16);
    else if (c === 'r' && k.tegn(tx, ty - 1) !== 'r') saet(this.tekstur(`px-reol-f-${kaelder}`, reol(30, kaelder)), tx * FELT, (ty + 2) * FELT);
    else if (c === 'P') saet(this.tekstur('px-plante', PLANTE), tx * FELT + 3, ty * FELT + 15);
    else if (c === 'k') saet(this.tekstur('px-kasse', KASSE), tx * FELT + 1, ty * FELT + 15);
    else if (c === 'S' || c === 'U') saet(this.tekstur(`px-trappe-${c}`, trappe(c === 'U')), tx * FELT, ty * FELT + 16);
    else if (c === 'D' && k.tegn(tx - 1, ty) !== 'D') {
      let n = 0;
      while (k.tegn(tx + n, ty) === 'D') n++;
      saet(this.tekstur(`px-disk-${n}`, bordflade(n * FELT, 14, '#a07a4a', '#6b4a2b')), tx * FELT, ty * FELT + 16);
    } else if (c === 'B' && k.tegn(tx - 1, ty) !== 'B' && k.tegn(tx, ty - 1) !== 'B') {
      let n = 0;
      while (k.tegn(tx + n, ty) === 'B') n++;
      saet(this.tekstur(`px-bord-${n}`, bordflade(n * FELT, 30, '#b98b5a', '#7a5636')), tx * FELT, (ty + 2) * FELT);
    }
  }

  /** Lys indendørs: morgensol gennem vinduerne, en lampe på disken og lys fra trappen op. */
  private lavFaesteLys() {
    const k = this.kort;
    const morgensol: Farve = [255, 252, 240];
    const sol = vindueslys(this.tone, morgensol);
    const lampe = lavLys(40, 0.7, this.tone, [255, 246, 222], SKALA);
    const trappelys = lavLys(34, 0.8, this.tone, VARMT, SKALA);
    for (let ty = 0; ty < k.hoejde; ty++)
      for (let tx = 0; tx < k.bredde; tx++) {
        const c = k.tegn(tx, ty);
        if (c === 'v' && ty === 0 && k.tegn(tx - 1, ty) !== 'v') this.faesteLys.push({ x: tx * FELT + 30, y: 2 * FELT + 48, billede: sol });
        else if (c === 'D' && k.tegn(tx + 1, ty) !== 'D') this.faesteLys.push({ x: tx * FELT, y: ty * FELT, billede: lampe });
        else if (c === 'U' && k.tegn(tx, ty - 1) !== 'U') this.faesteLys.push({ x: tx * FELT + 8, y: ty * FELT + 8, billede: trappelys });
      }
  }

  private aktivtObjekt(): StedObjekt | undefined {
    return this.data_.sted.objekter.find((o) => o.id === this.data_.aktiv);
  }

  /** Det, man kan undersøge lige nu: det aktive objekt eller alt i et escape room. */
  private kanUndersoeges(): StedObjekt[] {
    const ids = this.data_.aktive?.length ? this.data_.aktive : this.data_.aktiv ? [this.data_.aktiv] : [];
    return this.data_.sted.objekter.filter((o) => ids.includes(o.id) && !(this.data_.skjulte ?? []).includes(o.id));
  }

  saetAktive(aktive: string[]) {
    this.data_ = { ...this.data_, aktive };
    this.opdaterNaer(true);
  }

  saetAktiv(id: string | null) {
    this.data_ = { ...this.data_, aktiv: id };
    this.opdaterNaer(true);
  }

  /**
   * Æseløres fremkomst (Henrik, 8. november 2026): han ligger foldet i skuffen, folder sig ud i et lysglimt
   * med papirstumper og flagrer i en bue op til hovedpersonen. Med reduceret bevægelse dukker han bare op.
   */
  private fuglFremkomst() {
    const f = this.fugl;
    const kilde = this.data_.sted.objekter.find((o) => o.id === this.data_.aktiv && o.felt);
    const sx = kilde?.felt ? kilde.felt[0] * FELT + FELT / 2 : this.spiller.x + 20;
    const sy = kilde?.felt ? kilde.felt[1] * FELT + FELT / 2 : this.spiller.y - 10;
    if (this.roligt) {
      f.setVisible(true);
      return;
    }
    this.fuglAnim = true;
    const top = 9000;
    f.setVisible(true).setPosition(sx, sy).setScale(0.15).setAngle(-200).setAlpha(0).setDepth(top).setDisplayOrigin(8, 10);
    // Et glimt af lys og en ring, der vokser.
    const glimt = this.add.circle(sx, sy - 4, 4, 0xffe9a8, 0.9).setDepth(top - 1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glimt, radius: 26, alpha: 0, duration: 700, ease: 'Cubic.Out', onComplete: () => glimt.destroy() });
    const ring = this.add.circle(sx, sy - 4, 6).setStrokeStyle(1, 0xf0c45a).setDepth(top - 1);
    this.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 900, ease: 'Sine.Out', onComplete: () => ring.destroy() });
    // Papirstumper, der hvirvler ud og daler.
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const stump = this.add.rectangle(sx, sy - 4, 2, 2, i % 3 === 0 ? 0xf0c45a : 0xf4efe0).setDepth(top - 1);
      this.tweens.add({
        targets: stump,
        x: sx + Math.cos(a) * (14 + (i % 4) * 6),
        y: sy - 4 + Math.sin(a) * (10 + (i % 3) * 5) + 14,
        angle: 360 + i * 30,
        alpha: 0,
        duration: 900 + (i % 5) * 120,
        ease: 'Quad.Out',
        onComplete: () => stump.destroy(),
      });
    }
    // Han folder sig ud.
    this.tweens.add({
      targets: f,
      scale: 1,
      angle: 0,
      alpha: 1,
      y: sy - 10,
      duration: 650,
      ease: 'Back.Out',
      onComplete: () => {
        // Og flagrer i en bue op til hovedpersonen.
        const fra = { x: f.x, y: f.y };
        const bue = { t: 0 };
        this.tweens.add({
          targets: bue,
          t: 1,
          duration: 1100,
          ease: 'Sine.InOut',
          onUpdate: () => {
            const til = { x: this.spiller.x - 14, y: this.spiller.y + 4 };
            const kx = (fra.x + til.x) / 2;
            const ky = Math.min(fra.y, til.y) - 34;
            const t = bue.t;
            const x = (1 - t) * (1 - t) * fra.x + 2 * (1 - t) * t * kx + t * t * til.x;
            const y = (1 - t) * (1 - t) * fra.y + 2 * (1 - t) * t * ky + t * t * til.y + Math.sin(t * Math.PI * 6) * 2;
            f.setFlipX(x < f.x).setPosition(x, y).setDepth(top);
          },
          onComplete: () => {
            this.fuglAnim = false;
            f.setDepth(f.y);
          },
        });
      },
    });
  }

  saetSkjulte(skjulte: string[]) {
    const fuglFoer = this.fugl?.scene ? this.fugl.visible : true;
    this.data_ = { ...this.data_, skjulte };
    const fuglNu = !skjulte.includes('aeseloere');
    if (this.fugl?.scene) {
      if (!fuglFoer && fuglNu) this.fuglFremkomst();
      else this.fugl.setVisible(fuglNu);
    }
    this.faste.clear();
    for (const o of this.data_.sted.objekter) {
      const skjult = skjulte.includes(o.id);
      for (const b of this.objektBilleder.get(o.id) ?? []) b.setVisible(!skjult);
      if (!skjult && o.felt && FASTE_FORMER.has(o.form)) this.faste.add(`${o.felt[0]},${o.felt[1]}`);
    }
    this.lyskilder = this.data_.sted.objekter
      .filter((o) => o.lys && o.felt && !skjulte.includes(o.id))
      .map((o) => {
        const m = feltMidte(o.felt!);
        return { x: m.x + 7, y: m.y - 12, billede: this.objektlys };
      });
    this.byggGloed();
  }

  /**
   * Glød (fin grafik, 10. november 2026): et blødt, varmt skær om lanterner, lamper og fyrtårnet, som får lyset til
   * at stråle ud over kanten. Tegnes af grafikkortet (ADD), så det koster næsten intet. Kun med fin grafik.
   */
  private byggGloed() {
    for (const g of this.gloed) g.destroy();
    this.gloed = [];
    if (SKALA < 2) return;
    if (!this.textures.exists('px-gloed')) {
      const n = 64;
      const c = this.textures.createCanvas('px-gloed', n, n)!;
      const ctx = c.context;
      const grad = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      grad.addColorStop(0, 'rgba(255, 226, 160, 1)');
      grad.addColorStop(0.25, 'rgba(255, 205, 130, 0.55)');
      grad.addColorStop(0.6, 'rgba(255, 180, 110, 0.15)');
      grad.addColorStop(1, 'rgba(255, 170, 100, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, n, n);
      c.refresh();
    }
    const styrke = this.data_.mindreUhygge ? 0.3 : 0.4;
    const lav = (x: number, y: number, r: number, a = styrke) =>
      this.add.image(x, y, 'px-gloed').setDisplaySize(r * 2, r * 2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(a).setDepth(1_000_001);
    for (const l of this.fyrLamper) this.gloed.push(lav(l.x, l.y, 26, styrke + 0.15));
    for (const l of this.faesteLys) this.gloed.push(lav(l.x, l.y, lysBredde(l.billede) * 0.35));
    for (const l of this.lyskilder) this.gloed.push(lav(l.x, l.y, 22));
    if (!this.lygteGloed?.scene && this.lygte) this.lygteGloed = lav(0, 0, 16, styrke * 0.8);
  }

  /**
   * Dialog: kameraet zoomer ind på den, der taler, og hovedpersonen, og de vender sig mod hinanden.
   * Fortælleren og figurer, der ikke er på stedet, zoomer ikke. null zoomer ud igen.
   */
  saetTaler(taler: string | null) {
    const foer = this.taler;
    this.taler = taler;
    this.sidsteLys = '';
    if (!taler) {
      // Stop kun den tur, dialogen selv startede, ikke en tur, eleven lige har sat i gang.
      if (this.gaarTilTaler) this.vej = [];
      this.gaarTilTaler = false;
      return;
    }
    // Står hovedpersonen langt fra den, der taler, går den derhen.
    const o = this.data_.sted.objekter.find((x) => x.id === taler && x.felt && !this.data_.skjulte?.includes(x.id));
    if (o?.felt && foer !== taler) {
      const m = feltMidte(o.felt);
      if (Phaser.Math.Distance.Between(this.spiller.x, this.spiller.y, m.x, m.y) > 34) {
        const fra = feltVed(this.spiller.x, this.spiller.y - 2);
        let bedst: Felt[] | null = null;
        for (const f of felterVed(this.kort, o.felt, (x, y) => this.erFast(x, y))) {
          const v = findVej(this.kort, fra, f, (x, y) => this.erFast(x, y));
          if (v && (!bedst || v.length < bedst.length)) bedst = v;
        }
        if (bedst) {
          this.vej = bedst;
          this.interagerVedMaal = false;
          this.gaarTilTaler = true;
        }
      }
    }
  }

  /** Zoom under dialog: så tæt på som muligt, men begge skal kunne ses. Hovedpersonen kigger på den, der taler. */
  private opdaterTalerZoom() {
    if (!this.taler) {
      this.zoomMaal = 1;
      return;
    }
    const p = this.talerPunkt();
    if (!p) {
      this.zoomMaal = 1;
      return;
    }
    const dx = Math.abs(p.x - this.spiller.x);
    const dy = Math.abs(p.y - this.spiller.y);
    this.zoomMaal = Math.max(1, Math.min(2, (VIS_B - 40) / (dx + 60), (VIS_H - 30) / (dy + 70)));
    if (!this.gaarTilTaler && (dx > 2 || dy > 2)) {
      const ax = p.x - this.spiller.x;
      const ay = p.y - this.spiller.y;
      this.retning = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'hoejre' : 'venstre') : ay > 0 ? 'ned' : 'op';
    }
  }

  /** Hvor den, der taler, står. Æseløre er fuglen, de andre er objekter på stedet med samme id. */
  private talerPunkt(): { x: number; y: number; billede?: Phaser.GameObjects.Image } | null {
    if (!this.taler || this.taler === 'fortaeller') return null;
    if (this.taler === 'aeseloere') return this.fugl.visible ? { x: this.fugl.x, y: this.fugl.y, billede: this.fugl } : null;
    const o = this.data_.sted.objekter.find((x) => x.id === this.taler && x.felt);
    if (!o?.felt || this.data_.skjulte?.includes(o.id)) return null;
    const m = feltMidte(o.felt);
    const billeder = this.objektBilleder.get(o.id) ?? [];
    return { x: m.x, y: m.y, billede: billeder.find((b) => b.getData('y0') !== undefined) };
  }

  /** Til test: hovedpersonens vandrette plads i verden. */
  spillerX(): number {
    return this.spiller ? Math.round(this.spiller.x) : NaN;
  }

  laas(laast: boolean) {
    this.laast = laast;
    // Kun låsning stopper en tur. Ellers sletter oplåsningen efter en dialog en tur, der lige er startet.
    if (laast) this.vej = [];
    // Slippes en tast under en dialog, opdager Phaser det ikke, og hovedpersonen går videre bagefter. Nulstil tasterne.
    this.input.keyboard?.resetKeys();
    if (this.input.keyboard) this.input.keyboard.enabled = !laast;
  }

  forskraek() {
    if (this.data_.mindreUhygge) return;
    const cam = this.cameras.main;
    cam.fadeOut(120, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      cam.shake(250, 0.008);
      cam.fadeIn(700, 0, 0, 0);
    });
  }

  /** Går hen ved siden af objektet ad den korteste vej og undersøger det, når hovedpersonen er fremme. */
  gaaTilObjekt(id: string) {
    const o = this.data_.sted.objekter.find((x) => x.id === id);
    if (!o?.felt || !this.spiller) return;
    const fra = feltVed(this.spiller.x, this.spiller.y - 2);
    const muligheder = [...(this.erFast(o.felt[0], o.felt[1]) ? [] : [o.felt]), ...felterVed(this.kort, o.felt, (x, y) => this.erFast(x, y))];
    let bedst: Felt[] | null = null;
    for (const m of muligheder) {
      if (m[0] === fra[0] && m[1] === fra[1]) {
        bedst = [];
        break;
      }
      const v = findVej(this.kort, fra, m, (x, y) => this.erFast(x, y));
      if (v && (!bedst || v.length < bedst.length)) bedst = v;
    }
    if (!bedst) return;
    this.vej = bedst;
    this.gaarTilTaler = false;
    this.interagerVedMaal = true;
    this.maalObjekt = id;
    if (bedst.length === 0) this.ankommet();
  }

  private saetVej(til: Felt, interager: boolean) {
    const fra = feltVed(this.spiller.x, this.spiller.y - 2);
    const v = findVej(this.kort, fra, til, (x, y) => this.erFast(x, y));
    if (!v) return;
    this.vej = v;
    this.gaarTilTaler = false;
    this.interagerVedMaal = interager;
    this.maalObjekt = null;
  }

  private ankommet() {
    const interager = this.interagerVedMaal;
    const maal = this.maalObjekt;
    this.interagerVedMaal = false;
    this.maalObjekt = null;
    this.opdaterNaer();
    if (!interager) return;
    // Står hovedpersonen ved den ting, der blev klikket på, er det den, der undersøges, også hvis en anden er lige så tæt på.
    const valgt = this.kanUndersoeges().find((o) => o.id === maal && o.felt);
    if (valgt?.felt) {
      const m = feltMidte(valgt.felt);
      if (Phaser.Math.Distance.Between(this.spiller.x, this.spiller.y, m.x, m.y) < NAER + 0.01) {
        this.kroge?.onInteraktion(valgt.id);
        return;
      }
    }
    if (this.naer) this.kroge?.onInteraktion(this.naer);
  }

  private kollision(x: number, y: number): boolean {
    for (const [dx, dy] of [[-5, -3], [5, -3], [-5, 1], [5, 1]]) {
      const [tx, ty] = feltVed(x + dx, y + dy);
      if (this.erFast(tx, ty)) return true;
    }
    return false;
  }

  private opdaterNaer(tving = false) {
    let ny: string | null = null;
    let bedst = NAER + 0.01;
    if (this.spiller)
      for (const o of this.kanUndersoeges()) {
        if (!o.felt) continue;
        const m = feltMidte(o.felt);
        const d = Phaser.Math.Distance.Between(this.spiller.x, this.spiller.y, m.x, m.y);
        if (d < bedst) {
          bedst = d;
          ny = o.id;
        }
      }
    if (ny !== this.naer || tving) {
      this.naer = ny;
      this.kroge?.onNaer(ny);
    }
  }

  /** Hvor E-hintet skal stå: over det, eleven kan undersøge, i procent af spilfladen. */
  private sendHint() {
    let pos: { x: number; y: number } | null = null;
    const o = this.naer && !this.laast && !this.taler ? this.data_.sted.objekter.find((x) => x.id === this.naer) : undefined;
    if (o?.felt) {
      const m = feltMidte(o.felt);
      const h = PIL_HOEJDE[o.form] ?? 6;
      const cam = this.cameras.main;
      const sx = (m.x - cam.worldView.x) * cam.zoom;
      const sy = (m.y - h - 4 - cam.worldView.y) * cam.zoom;
      pos = { x: Math.round((sx / (VIS_B * SKALA)) * 1000) / 10, y: Math.round((sy / (VIS_H * SKALA)) * 1000) / 10 };
    }
    const noegle = pos ? `${pos.x},${pos.y}` : '';
    if (noegle === this.sidsteHint) return;
    this.sidsteHint = noegle;
    this.kroge?.onHint?.(pos);
  }

  /**
   * Kameraet (rettet 10. november 2026): glidningen regnes efter tid, ikke efter billeder. Før flyttede kameraet 12 %
   * pr. billede, så det på en skærm med 240 billeder pr. sekund nåede frem fire gange så hurtigt og rykkede ved hver
   * vending. Fremadkigget glider nu for sig selv (cirka et halvt sekund), og kameraet følger efter (cirka 0,15 sekund).
   * dt = Infinity sætter kameraet på plads med det samme.
   */
  private flytKamera(dt: number, fart = 7) {
    const [lx, ly] = { op: [0, -1], ned: [0, 1], venstre: [-1, 0], hoejre: [1, 0] }[this.retning];
    this.fremad.x = glid(this.fremad.x, lx * 18, dt, 2.5);
    this.fremad.y = glid(this.fremad.y, ly * 14, dt, 2.5);
    let mx = this.spiller.x + this.fremad.x;
    let my = this.spiller.y - 10 + this.fremad.y;
    if (this.taler) {
      // Under dialog: midt imellem hovedpersonen og den, der taler.
      const p = this.talerPunkt();
      mx = p ? (this.spiller.x + p.x) / 2 : this.spiller.x;
      // Kameraet sigter lidt under figurerne, så de står over dialogboksen nederst.
      my = (p ? (this.spiller.y + p.y) / 2 : this.spiller.y) + 6;
    }
    this.kam.x = glid(this.kam.x, mx, dt, fart);
    this.kam.y = glid(this.kam.y, my, dt, fart);
    const z = skarpZoom(this.zoom);
    const bw = VIS_B / z;
    const bh = VIS_H / z;
    const W = this.kort.bredde * FELT;
    const H = this.kort.hoejde * FELT;
    const vx = Phaser.Math.Clamp(this.kam.x - bw / 2, 0, Math.max(0, W - bw));
    const vy = Phaser.Math.Clamp(this.kam.y - bh / 2, 0, Math.max(0, H - bh));
    const cam = this.cameras.main;
    cam.setZoom(z * SKALA);
    cam.centerOn(vx + bw / 2, vy + bh / 2);
    return { vx, vy, z };
  }

  /** Partiklerne driver og holdes inden for det, kameraet ser. Grenene i forgrunden glider lidt hurtigere end verden. */
  private opdaterStemning(dt: number, vx: number, vy: number, z: number) {
    const bw = VIS_B / z;
    const bh = VIS_H / z;
    for (const d of this.partikler) {
      const { dx, dy, alpha, ramme } = partikelTrin(d.p, dt, this.ur);
      d.p.x = indenfor(d.p.x + dx, vx, bw);
      d.p.y = indenfor(d.p.y + dy, vy, bh);
      d.billede.setPosition(Math.round(d.p.x), Math.round(d.p.y)).setAlpha(Math.round(alpha * 4) / 4);
      const n = `${d.noegle}-${ramme}`;
      if (d.billede.texture.key !== n) d.billede.setTexture(n);
    }
    // Tågebankerne driver langsomt og ligger fast på skærmen, men glider lidt med kameraet (parallakse).
    for (const l of this.taage) {
      // Billedet skaleres med zoomen, så det fylder det samme på skærmen. Bredden i verden er derfor width / z.
      const b = l.billeder[0].width / z;
      const forskud = (((this.ur * l.fart + vx * l.faktor) % b) + b) % b;
      l.billeder.forEach((img, i) => img.setPosition(Math.round(vx - forskud + i * b), Math.round(vy + bh * l.y)).setScale(1 / z));
    }
    const cx = vx + bw / 2;
    const cy = vy + bh / 2;
    for (const g of this.forgrund) g.billede.setPosition(Math.round(g.x + (g.x - cx) * 0.3), Math.round(g.y + (g.y - cy) * 0.3));
  }

  /**
   * Træer, der står foran hovedpersonen, Æseløre eller den, der taler, bliver halvt gennemsigtige,
   * så figurerne altid kan ses (især når kameraet zoomer ind under dialog).
   */
  private gennemsigtigeTraeer() {
    const figurer: { x: number; y: number }[] = [{ x: this.spiller.x, y: this.spiller.y - 8 }];
    if (this.fugl.visible) figurer.push({ x: this.fugl.x, y: this.fugl.y - 22 });
    const tp = this.talerPunkt();
    if (tp) figurer.push({ x: tp.x, y: tp.y - 8 });
    for (const t of this.traeBilleder) {
      const halv = t.width / 2;
      let foran = false;
      for (const f of figurer)
        if (t.y > f.y + 6 && Math.abs(t.x - f.x) < halv + 3 && t.y - t.height < f.y + 4 && t.y - f.y < t.height + 4) {
          foran = true;
          break;
        }
      const a = foran ? 0.45 : 1;
      if (t.alpha !== a) t.setAlpha(a);
    }
  }

  update(_tid: number, delta: number) {
    if (!this.spiller) return;
    const dt = Math.min(0.05, Math.max(0, delta / 1000));
    this.ur += dt;
    let gaar = false;

    if (!this.laast) {
      const t = this.taster;
      let dx = 0;
      let dy = 0;
      if (t) {
        if (t.venstre.isDown || t.a.isDown) dx -= 1;
        if (t.hoejre.isDown || t.d.isDown) dx += 1;
        if (t.op.isDown || t.w.isDown) dy -= 1;
        if (t.ned.isDown || t.s.isDown) dy += 1;
      }
      const skridt = FART * dt;
      if (dx !== 0 || dy !== 0) {
        this.vej = [];
        this.interagerVedMaal = false;
        const l = Math.hypot(dx, dy);
        const nx = this.spiller.x + (dx / l) * skridt;
        const ny = this.spiller.y + (dy / l) * skridt;
        if (!this.kollision(nx, this.spiller.y)) this.spiller.x = nx;
        if (!this.kollision(this.spiller.x, ny)) this.spiller.y = ny;
        this.retning = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'hoejre' : 'venstre') : dy > 0 ? 'ned' : 'op';
        gaar = true;
      } else if (this.vej.length > 0) {
        const m = feltMidte(this.vej[0]);
        const ax = m.x - this.spiller.x;
        const ay = m.y - this.spiller.y;
        const l = Math.hypot(ax, ay);
        if (l > 0.01) this.retning = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'hoejre' : 'venstre') : ay > 0 ? 'ned' : 'op';
        if (l <= skridt) {
          this.spiller.setPosition(m.x, m.y);
          this.vej.shift();
          if (this.vej.length === 0) this.ankommet();
        } else {
          this.spiller.x += (ax / l) * skridt;
          this.spiller.y += (ay / l) * skridt;
        }
        gaar = true;
      }
      if (gaar) spilEffekt('skridt');
      // E undersøger. Enter og mellemrum virker også, så tastaturbrugere ikke skal lære noget nyt.
      if (t && this.naer && (Phaser.Input.Keyboard.JustDown(t.e) || Phaser.Input.Keyboard.JustDown(t.enter) || Phaser.Input.Keyboard.JustDown(t.mellemrum))) {
        this.kroge?.onInteraktion(this.naer);
      }
    } else if (this.gaarTilTaler && this.vej.length > 0) {
      // Under dialog går hovedpersonen selv hen til den, der taler.
      const skridt = FART * dt;
      const m = feltMidte(this.vej[0]);
      const ax = m.x - this.spiller.x;
      const ay = m.y - this.spiller.y;
      const l = Math.hypot(ax, ay);
      if (l > 0.01) this.retning = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'hoejre' : 'venstre') : ay > 0 ? 'ned' : 'op';
      if (l <= skridt) {
        this.spiller.setPosition(m.x, m.y);
        this.vej.shift();
        if (this.vej.length === 0) this.gaarTilTaler = false;
      } else {
        this.spiller.x += (ax / l) * skridt;
        this.spiller.y += (ay / l) * skridt;
      }
      gaar = true;
    }
    this.opdaterTalerZoom();

    // Hovedpersonen: retning og gangbilleder.
    if (gaar) this.gaaTid += dt;
    else this.gaaTid = 0;
    const ramme = gaar ? gangRamme(this.gaaTid) : 0;
    const r = this.retning === 'venstre' ? 'hoejre' : this.retning;
    const hvile = ramme === 0 && !gaar ? hvileTilstand(this.ur, 0.37, this.roligt) : 'staa';
    this.spiller.setTexture(hvile === 'staa' ? `px-spiller-${r}-${ramme}` : `px-spiller-${r}-0-${hvile}`).setFlipX(this.retning === 'venstre');
    this.spiller.setDepth(this.spiller.y);
    this.spillerSkygge.setPosition(this.spiller.x, this.spiller.y).setDepth(this.spiller.y - 1);
    const lx = this.retning === 'venstre' ? -6 : this.retning === 'hoejre' ? 6 : 8;
    this.lanterne.setPosition(this.spiller.x + lx, this.spiller.y - 4).setDepth(this.spiller.y + (this.retning === 'op' ? -1 : 1));

    // Æseløre flyver efter.
    // Når Æseløre taler, vender hovedpersonen sig mod ham. Hvis han så fulgte retningen, ville han flyve om
    // på den anden side, hovedpersonen ville vende sig igen, og han ville flakke frem og tilbage. Derfor står
    // han stille ved siden af hovedpersonen, så længe han taler, og kigger på hovedpersonen.
    let fx: number;
    let fy: number;
    if (this.taler === 'aeseloere') {
      if (this.fuglSide === null) {
        // Den side, han er på i forvejen, medmindre der står træer eller en væg. Så den anden side.
        const side = this.fugl.x < this.spiller.x ? -1 : 1;
        const [tx, ty] = feltVed(this.spiller.x + side * 18, this.spiller.y - 2);
        // Han svæver lidt over jorden, så feltet over tæller også (ellers gemmer han sig bag trækronerne).
        this.fuglSide = this.erFast(tx, ty) || this.erFast(tx, ty - 1) ? -side : side;
      }
      fx = this.spiller.x + this.fuglSide * 18;
      fy = this.spiller.y + 2;
    } else {
      this.fuglSide = null;
      const [rx, ry] = { op: [0, -1], ned: [0, 1], venstre: [-1, 0], hoejre: [1, 0] }[this.retning];
      fx = this.spiller.x - rx * 16 + (ry ? -12 : 0);
      fy = this.spiller.y - ry * 10 + 2;
    }
    if (!this.fuglAnim) {
      const k = 1 - Math.pow(0.04, dt);
      const gammelX = this.fugl.x;
      this.fugl.x += (fx - this.fugl.x) * k;
      this.fugl.y += (fy - this.fugl.y) * k;
      if (this.fuglSide !== null) this.fugl.setFlipX(this.fuglSide > 0);
      else if (Math.abs(this.fugl.x - gammelX) > 0.3) this.fugl.setFlipX(this.fugl.x < gammelX);
      const svaev = Math.sin(this.ur * 4) * 2;
      this.fugl.setDepth(this.fugl.y).setDisplayOrigin(8, 10 + 18 - svaev);
    }

    // Vand og planker.
    const vandNoegle = `px-vand-${this.data_.sted.tema}-${Math.floor(this.ur * 2.5) % 3}`;
    if (this.vand.texture.key !== vandNoegle) this.vand.setTexture(vandNoegle);
    this.planker.forEach((p, i) => p.setY((p.getData('y0') as number) + (Math.sin(this.ur * 1.6 + i * 2) > 0.3 ? 1 : 0)));

    // Den, der taler, vipper lidt op og ned, og en lille taleboble står over hovedet.
    const tp = this.taler ? this.talerPunkt() : null;
    for (const billeder of this.objektBilleder.values()) {
      const hoved = billeder.find((b) => b.getData('y0') !== undefined);
      if (!hoved) continue;
      const taler = tp?.billede === hoved;
      const hop = taler && !this.roligt ? (Math.sin(this.ur * 9) > 0.2 ? 1 : 0) : 0;
      hoved.setY((hoved.getData('y0') as number) - hop);
    }
    // Levende figurer blinker og trækker vejret. Den, der taler, vipper i stedet.
    for (const l of this.levende) {
      const taler = tp?.billede === l.billede;
      const t = taler ? 'staa' : hvileTilstand(this.ur, l.fase, this.roligt);
      const n = t === 'staa' ? l.noegle : `${l.noegle}-${t}`;
      l.billede.setTexture(this.textures.exists(n) ? n : l.noegle);
    }
    if (tp && !this.roligt) {
      // Boblen står over billedets øverste kant. Æseløre svæver over sin plads, så hans fodpunkt kan ikke bruges.
      const b = tp.billede;
      const top = b ? b.y - b.displayOriginY * b.scaleY : tp.y - 24;
      this.boble.setVisible(true).setPosition(Math.round(tp.x), Math.round(top - 2));
    } else this.boble.setVisible(false);

    // Byens folk snakker uden pause (taleboblerne blinker skiftevis).
    if (!this.roligt)
      for (const b of this.snakkebobler) {
        const skjult = (this.data_.skjulte ?? []).includes(b.getData('id') as string) || !!this.taler;
        b.setVisible(!skjult && Math.sin(this.ur * 2.2 + (b.getData('snak') as number)) > 0.1);
      }

    // Pil over det, eleven skal undersøge.
    const aktiv = this.aktivtObjekt();
    if (aktiv?.felt && !this.laast && !this.taler) {
      const m = feltMidte(aktiv.felt);
      const hoejde = PIL_HOEJDE[aktiv.form] ?? 6;
      this.pil.setVisible(true).setPosition(m.x, m.y - hoejde - 2 - (Math.sin(this.ur * 5) > 0 ? 1 : 0));
    } else this.pil.setVisible(false);

    this.opdaterNaer();
    this.sendHint();

    // Kamera og lys. Zoomen klipper i hele trin, mens kameraet glider hen til figurerne.
    this.zoom = skarpZoom(this.zoomMaal);
    const { vx, vy, z } = this.flytKamera(dt, this.taler ? 6 : 7);
    this.lysLag.setPosition(vx, vy).setScale(1 / (z * SKALA));
    if (this.lygteGloed) this.lygteGloed.setPosition(this.spiller.x, this.spiller.y - 12).setAlpha((this.data_.mindreUhygge ? 0.24 : 0.32) + (this.roligt ? 0 : Math.sin(this.ur * 7) * 0.04));
    this.opdaterStemning(dt, vx, vy, z);
    this.gennemsigtigeTraeer();
    const fyrRamme = Math.floor(this.ur * 1.2) % 2;
    const noegle = `${Math.round(vx * z)},${Math.round(vy * z)},${z.toFixed(3)},${Math.round(this.spiller.x)},${Math.round(this.spiller.y)},${fyrRamme},${this.lyskilder.length},${this.data_.mindreUhygge}`;
    if (noegle === this.sidsteLys) return;
    this.sidsteLys = noegle;
    const ctx = this.lysTekstur.context;
    const tone = this.tone;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgb(${tone[0]}, ${tone[1]}, ${tone[2]})`;
    ctx.fillRect(0, 0, VIS_B * SKALA, VIS_H * SKALA);
    // "lighten": hvor to lys mødes, vinder det stærkeste, i stedet for at det sidste dækker.
    ctx.globalCompositeOperation = 'lighten';
    // Lyslaget dækker det, kameraet ser. Med zoom er hver verdenspixel z * SKALA pixel i laget.
    ctx.imageSmoothingEnabled = SKALA > 1;
    const k = z * SKALA;
    const tegnLys = (x: number, y: number, c: HTMLCanvasElement) => {
      const b = lysBredde(c);
      const h = (c.height / c.width) * b;
      ctx.drawImage(c, Math.round((x - vx - b / 2) * k), Math.round((y - vy - h / 2) * k), Math.round(b * k), Math.round(h * k));
    };
    for (const l of this.fyrLamper) tegnLys(l.x, l.y, this.fyrlys[fyrRamme]);
    for (const l of this.faesteLys) tegnLys(l.x, l.y, l.billede);
    for (const l of this.lyskilder) tegnLys(l.x, l.y, l.billede);
    if (this.lygte) tegnLys(this.spiller.x, this.spiller.y - 12, this.lygte);
    // Vignetten ganges på til sidst, så kanterne er lidt mørkere, også hvor der er lys.
    if (this.vignet) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(this.vignet, 0, 0);
    }
    ctx.globalCompositeOperation = 'source-over';
    this.lysTekstur.refresh();
  }
}
