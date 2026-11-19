import Phaser from 'phaser';
import { objektVedTryk } from './tryk';
import { type Avatar } from '../data/gem';
import { erFastTegn, FELT, feltMidte, feltVed, laesKort, type Felt, type Kort } from './kort';
import { belysning, lavLys, lysOpsaetning, tegnkortTilLerred, VARMT, type Farve } from './pixel/lerred';
import { erInde } from './pixel/inde';
import { aande, gangRamme, hvileTilstand, lukOejne } from './pixel/liv';
import { stedTone, type Partikel } from './stemning';
import { FIN_FIGUR_I_VERDEN, finFigur } from './pixel/fin';
import { avatarPixel, type Retning, type Tegnkort } from './pixel/sprites';
import { type VerdenData, type VerdenKroge } from './typer';
import { VIS_B, VIS_H, SKALA, skarpZoom } from './kort/skala';
import { type Lyskilde } from './kort/figurer';
import { byggGrund, byggObjekter } from './kort/byg';
import { opdaterFigurer, visOgSkjul } from './kort/effekter';
import { fuglFoelger, gaaSkridt, gaaTilObjekt, kanUndersoeges, opdaterNaer, saetVej, sendHint } from './kort/gang';
import { flytKamera, gennemsigtigeTraeer, opdaterTalerZoom, vendModTaler } from './kort/kameraet';
import { lavStemning, opdaterLuft } from './kort/luft';
import { byggGloed, lavFaesteLys, tegnLyslag } from './kort/lys';

// Opløsningen bruges også af BaneScene og PhaserVerden, så den kan stadig hentes herfra.
export { brugSkala, SKALA, skalaFraAdresse, skarpZoom, VIS_B, VIS_H } from './kort/skala';
export class KortScene extends Phaser.Scene {
  data_!: VerdenData;
  kort!: Kort;
  spiller!: Phaser.GameObjects.Image;
  spillerSkygge!: Phaser.GameObjects.Image;
  lanterne!: Phaser.GameObjects.Image;
  fugl!: Phaser.GameObjects.Image;
  /** Hvilken side af hovedpersonen Æseløre står på, mens han taler (-1 venstre, 1 højre). */
  fuglSide: number | null = null;
  /** Sand, mens Æseløre folder sig ud og flyver frem første gang. Så følger han ikke efter imens. */
  fuglAnim = false;
  pil!: Phaser.GameObjects.Image;
  vand!: Phaser.GameObjects.Image;
  lysLag!: Phaser.GameObjects.Image;
  lysTekstur!: Phaser.Textures.CanvasTexture;
  objektBilleder = new Map<string, Phaser.GameObjects.Image[]>();
  planker: Phaser.GameObjects.Image[] = [];
  snakkebobler: Phaser.GameObjects.Image[] = [];
  faste = new Set<string>();
  lyskilder: Lyskilde[] = [];
  fyrLamper: { x: number; y: number }[] = [];
  /**
   * Fyrtårnets lys tænder (idélisten, 14. november 2026): når man kommer til fyrtårnet, blafrer lyset et par gange
   * og bliver så stående, svagt, som Mor Lanterne siger. fyrStart er uret, hvor det begynder. null = lyset står.
   */
  fyrStart: number | null = null;
  fyrGloed: Phaser.GameObjects.Image[] = [];
  /** Fin grafik: glød om lyskilderne, lagt oven på med ADD på grafikkortet. Den sidste følger hovedpersonens lygte. */
  gloed: Phaser.GameObjects.Image[] = [];
  lygteGloed: Phaser.GameObjects.Image | null = null;
  lygte: HTMLCanvasElement | null = null;
  tone: Farve = [255, 255, 255];
  /** Lys, der ikke flytter sig: vinduer, lampen på disken og lyset fra trappen. */
  faesteLys: Lyskilde[] = [];
  fyrlys: HTMLCanvasElement[] = [];
  objektlys!: HTMLCanvasElement;
  taster?: Record<'op' | 'ned' | 'venstre' | 'hoejre' | 'w' | 'a' | 's' | 'd' | 'e' | 'enter' | 'mellemrum', Phaser.Input.Keyboard.Key>;
  /** Sidst sendte placering af E-hintet, så React kun får besked, når det flytter sig. */
  sidsteHint = '';
  vej: Felt[] = [];
  interagerVedMaal = false;
  /** Den ting, hovedpersonen er på vej hen til (klik eller gaaTil). Den vinder over en anden ting, der står lige så tæt på. */
  maalObjekt: string | null = null;
  retning: Retning = 'op';
  gaaTid = 0;
  ur = 0;
  naer: string | null = null;
  laast = false;
  kam = { x: 0, y: 0 };
  /** Hvor langt kameraet kigger frem i gåretningen. Glider langsomt, så en vending ikke giver et ryk. */
  fremad = { x: 0, y: 0 };
  /** Lyset tegnes kun forfra, når noget har flyttet sig. Det sparer meget på langsomme computere. */
  sidsteLys = '';
  /** Dialog: hvem der taler, kameraets zoom og talebobben. */
  taler: string | null = null;
  zoom = 1;
  zoomMaal = 1;
  /** Hovedpersonen går hen til den, der taler, når dialogen starter. */
  gaarTilTaler = false;
  boble!: Phaser.GameObjects.Image;
  /** Partikler i luften og forgrundens grene (parallakse). */
  partikler: { billede: Phaser.GameObjects.Image; p: Partikel; noegle: string }[] = [];
  forgrund: { billede: Phaser.GameObjects.Image; x: number; y: number }[] = [];
  vignet: HTMLCanvasElement | null = null;
  /** Tågebanker i Viskeskoven: to lag, der driver med hver sin fart og glider forskelligt med kameraet. */
  taage: { billeder: Phaser.GameObjects.Image[]; fart: number; faktor: number; y: number }[] = [];
  /** Figurer, der blinker og trækker vejret: billedet, nøglen til det almindelige billede og en fase. */
  levende: { billede: Phaser.GameObjects.Image; noegle: string; fase: number }[] = [];
  /** Træerne, så de kan blive gennemsigtige, når de står foran en figur. */
  traeBilleder: Phaser.GameObjects.Image[] = [];
  roligt = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
    this.fyrGloed = [];
    this.fyrStart = null;
    this.gloed = [];
    this.lygteGloed = null;
    this.faesteLys = [];
    this.partikler = [];
    this.forgrund = [];
    this.taage = [];
    this.levende = [];
    this.traeBilleder = [];
  }

  get kroge(): VerdenKroge {
    return this.registry.get('kroge') as VerdenKroge;
  }

  tekstur(noegle: string, kilde: HTMLCanvasElement | Tegnkort, ny = false) {
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
    const fin = SKALA >= 2 && FIN_FIGUR_I_VERDEN;
    for (const r of ['ned', 'op', 'hoejre'] as const)
      for (const f of [0, 1, 2] as const) {
        const t = avatarPixel(a, r, f);
        // Fin hovedperson (32 x 48) er slået fra: én pixelstørrelse i hele verden (se pixel/fin.ts).
        const lav = (k: Tegnkort) => (fin ? finFigur(k) : k);
        this.tekstur(`px-spiller-${r}-${f}`, lav(t), true);
        if (f !== 0) continue;
        // Stå stille: blinke (ikke bagfra) og trække vejret. Hoften er række 16 i hovedpersonens 24 rækker.
        this.tekstur(`px-spiller-${r}-0-blink`, lav((r !== 'op' && lukOejne(t, ['E', 'W'])) || t), true);
        this.tekstur(`px-spiller-${r}-0-aande`, lav(aande(t, 16)), true);
      }
    this.lanterne?.setVisible(a.tilbehoer === 3);
  }

  /** Viser og skjuler objekter (se kort/effekter.ts). */
  saetSkjulte(skjulte: string[], animer = true) {
    visOgSkjul(this, skjulte, animer);
  }

  /** Dialog: kameraet zoomer ind på den, der taler (se kort/kameraet.ts). null zoomer ud igen. */
  saetTaler(taler: string | null) {
    vendModTaler(this, taler);
  }

  /** Går hen til objektet og undersøger det (se kort/gang.ts). */
  gaaTilObjekt(id: string) {
    gaaTilObjekt(this, id);
  }

  erFast(x: number, y: number): boolean {
    return erFastTegn(this.kort.tegn(x, y)) || this.faste.has(`${x},${y}`);
  }

  create() {
    const { sted, mindreUhygge } = this.data_;
    this.kort = laesKort(sted.kort ?? ['.']);
    const W = this.kort.bredde * FELT;
    const H = this.kort.hoejde * FELT;
    const tema = sted.tema;

    const inde = erInde(this.kort);
    const lys = lysOpsaetning(belysning(tema), mindreUhygge);
    this.tone = stedTone(tema, mindreUhygge) ?? lys.tone;
    // Billeder, der deles af alle steder, jorden, vandet og tingene fra kortet.
    byggGrund(this, tema, inde);

    byggObjekter(this);
    this.objektlys = lavLys(46, 0.9, this.tone, VARMT, SKALA);
    visOgSkjul(this, this.data_.skjulte ?? [], false);
    // Ved selve fyrtårnet tænder lyset, når man kommer (ikke under reduceret bevægelse).
    if (this.data_.sted.tema === 'fyrtaarn' && this.fyrLamper.length && !this.roligt) this.fyrStart = this.ur;

    // Hovedpersonen og Æseløre.
    const start = feltMidte(sted.startFelt ?? [1, 1]);
    this.spillerSkygge = this.add.image(start.x, start.y, 'px-skygge').setOrigin(0.5, 0.5);
    this.spiller = this.add
      .image(start.x, start.y, 'px-spiller-op-0')
      .setOrigin(0.5, 1)
      .setScale(SKALA >= 2 && FIN_FIGUR_I_VERDEN ? 0.5 : 1);
    this.lanterne = this.add.image(start.x, start.y, 'px-lanterne').setOrigin(0.5, 1);
    this.lanterne.setVisible((this.registry.get('avatar') as Avatar | undefined)?.tilbehoer === 3);
    this.fugl = this.add
      .image(start.x - 14, start.y + 4, 'px-fugl')
      .setOrigin(0.5, 1)
      .setVisible(!(this.data_.skjulte ?? []).includes('aeseloere'));
    this.pil = this.add.image(0, 0, 'px-pil').setOrigin(0.5, 1).setDepth(2_000_000).setVisible(false);
    this.boble = this.add.image(0, 0, 'px-boble').setOrigin(0.5, 1).setDepth(2_000_001).setVisible(false);

    // Nattelys: et lag, der ganges på billedet. Lanternen og fyrtårnet lyser op.
    const tone = this.tone;
    this.lygte = lys.spillerLys > 0 ? lavLys(lys.spillerLys, 0.95, tone, VARMT, SKALA) : null;
    this.fyrlys = [lavLys(34, 0.75, tone, VARMT, SKALA), lavLys(40, 0.85, tone, VARMT, SKALA)];
    if (inde) lavFaesteLys(this);
    if (this.textures.exists('px-lys')) this.textures.remove('px-lys');
    // Fin grafik: lyslaget har samme opløsning som spillet (SKALA), og lyset er blødt.
    this.lysTekstur = this.textures.createCanvas('px-lys', VIS_B * SKALA, VIS_H * SKALA)!;
    this.lysTekstur.setFilter(SKALA > 1 ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST);
    this.lysLag = this.add.image(0, 0, 'px-lys').setOrigin(0).setDepth(1_000_000).setBlendMode(Phaser.BlendModes.MULTIPLY);

    const cam = this.cameras.main;
    cam.setZoom(SKALA).setBounds(0, 0, W, H).setRoundPixels(true);
    this.kam = { x: start.x, y: start.y - 10 };
    this.fremad = { x: 0, y: 0 };
    flytKamera(this, Infinity);
    lavStemning(this, tema, inde);
    byggGloed(this);

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
      const ramt = objektVedTryk(kanUndersoeges(this), tx, ty, this.data_.aktiv);
      if (ramt) {
        gaaTilObjekt(this, ramt.id);
        return;
      }
      if (!this.erFast(tx, ty)) saetVej(this, [tx, ty], false);
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown');
    });
  }

  saetAktive(aktive: string[]) {
    this.data_ = { ...this.data_, aktive };
    opdaterNaer(this, true);
  }

  saetAktiv(id: string | null) {
    this.data_ = { ...this.data_, aktiv: id };
    opdaterNaer(this, true);
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

  update(_tid: number, delta: number) {
    if (!this.spiller) return;
    const dt = Math.min(0.05, Math.max(0, delta / 1000));
    this.ur += dt;
    let gaar = false;

    gaar = gaaSkridt(this, dt);
    opdaterTalerZoom(this);

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

    fuglFoelger(this, dt);

    opdaterFigurer(this);

    opdaterNaer(this);
    sendHint(this);

    // Kamera og lys. Zoomen klipper i hele trin, mens kameraet glider hen til figurerne.
    this.zoom = skarpZoom(this.zoomMaal);
    const { vx, vy, z } = flytKamera(this, dt, this.taler ? 6 : 7);
    this.lysLag.setPosition(vx, vy).setScale(1 / (z * SKALA));
    if (this.lygteGloed)
      this.lygteGloed
        .setPosition(this.spiller.x, this.spiller.y - 12)
        .setAlpha((this.data_.mindreUhygge ? 0.24 : 0.32) + (this.roligt ? 0 : Math.sin(this.ur * 7) * 0.04));
    opdaterLuft(this, dt, vx, vy, z);
    gennemsigtigeTraeer(this);
    tegnLyslag(this, vx, vy, z);
  }
}
