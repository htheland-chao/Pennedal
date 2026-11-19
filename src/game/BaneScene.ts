import Phaser from 'phaser';
import type { Avatar } from '../data/gem';
import { BFELT, erFare, erFast, erPlanke, erVisket, FYSIK, type Bane } from './bane';
import { SKALA, VIS_H } from './KortScene';
import { byggBane } from './bane/byg';
import { tegnkortTilLerred } from './pixel/lerred';
import { FIN_FIGUR_I_VERDEN, finFigur } from './pixel/fin';
import { avatarPixel, type Tegnkort } from './pixel/sprites';
import type { VerdenData, VerdenKroge } from './typer';
import { spilEffekt } from '../lyd/effekter';
import { glid } from './kamera';

/** Efter så mange fald tilbyder Æseløre at bære hovedpersonen over. */
export const HJAELP_EFTER = 3;

/**
 * Platformbane set fra siden. Hovedpersonen løber og hopper. Der er ingen død:
 * falder man i blæk eller vand, starter man igen ved sidste tændte lanterne.
 * Målet kalder onInteraktion('maal'), så trinnet i kapitlet går videre.
 */
export class BaneScene extends Phaser.Scene {
  data_!: VerdenData;
  bane!: Bane;
  spiller!: Phaser.GameObjects.Image;
  fugl!: Phaser.GameObjects.Image;
  klatten?: Phaser.GameObjects.Image;
  /** Figurer på banen fra kapitlet, fx Den Ufærdige (form "skygge"). */
  figurer = new Map<string, Phaser.GameObjects.Image>();
  lanterner: { x: number; y: number; billede: Phaser.GameObjects.Image; taendt: boolean }[] = [];
  maal = { x: 0, y: 0 };
  private vx = 0;
  private vy = 0;
  private paaJorden = false;
  private sidenJord = 0;
  private hopBuffer = 0;
  /** Hvor langt kameraet kigger frem. */
  fremad = 0;
  /** Kameraets midte vandret. Glider efter hovedpersonen. */
  kamX = 0;
  private retning: 1 | -1 = 1;
  private gaaTid = 0;
  private ur = 0;
  private checkpointNr = -1;
  start = { x: 0, y: 0 };
  private fald = 0;
  private laast = false;
  faerdig = false;
  taster?: Record<'venstre' | 'hoejre' | 'op' | 'a' | 'd' | 'w' | 'mellemrum', Phaser.Input.Keyboard.Key>;
  /** Knapper på skærmen (touch). */
  private touch = { venstre: false, hoejre: false, hop: false };
  /** Viskeskoven: grupper af viskede planker, hvilke der er skrevet tilbage, og ordstenene. */
  grupper: [number, number][][] = [];
  gruppeVed = new Map<string, number>();
  private genskabt = new Set<number>();
  ordsten: { x: number; y: number; billede: Phaser.GameObjects.Image }[] = [];
  /** Den ordsten, eleven lige er blevet spurgt ved. Først når man går væk, kan den spørge igen. */
  private spurgt: number | null = null;
  taage?: Phaser.GameObjects.Image;
  stenNoegle = 'px-ordsten';
  private roligt = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    super('bane');
  }

  init(data: VerdenData) {
    this.data_ = data;
    this.lanterner = [];
    this.figurer = new Map();
    this.checkpointNr = -1;
    this.fald = 0;
    this.faerdig = false;
    this.vx = 0;
    this.vy = 0;
    this.touch = { venstre: false, hoejre: false, hop: false };
    this.grupper = [];
    this.gruppeVed = new Map();
    this.genskabt = new Set();
    this.ordsten = [];
    this.spurgt = null;
    this.taage = undefined;
  }

  /** Feltet på banen. En viskede planke, der er skrevet tilbage, er en almindelig planke. */
  private tegn(x: number, y: number): string {
    const c = this.bane.tegn(x, y);
    if (erVisket(c)) {
      const g = this.gruppeVed.get(`${x},${y}`);
      return g !== undefined && this.genskabt.has(g) ? '=' : '.';
    }
    return c === 'O' ? '.' : c;
  }

  private get kroge(): VerdenKroge {
    return this.registry.get('kroge') as VerdenKroge;
  }

  tekstur(noegle: string, kilde: Tegnkort | HTMLCanvasElement, ny = false) {
    if (this.textures.exists(noegle)) {
      if (!ny) return noegle;
      this.textures.remove(noegle);
    }
    const c = kilde instanceof HTMLCanvasElement ? kilde : tegnkortTilLerred(kilde);
    this.textures.addCanvas(noegle, c)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return noegle;
  }

  /** Hovedpersonens størrelse: den fine figur har dobbelt så mange pixel og vises i halv størrelse. */
  get grundSkala() {
    return SKALA >= 2 && FIN_FIGUR_I_VERDEN ? 0.5 : 1;
  }

  byggAvatar() {
    const a = this.registry.get('avatar') as Avatar | undefined;
    if (!a) return;
    // Fin hovedperson er slået fra: én pixelstørrelse i hele verden (se pixel/fin.ts).
    for (const f of [0, 1, 2] as const) {
      const t = avatarPixel(a, 'hoejre', f);
      this.tekstur(`px-side-${f}`, SKALA >= 2 && FIN_FIGUR_I_VERDEN ? finFigur(t) : t, true);
    }
  }

  create() {
    byggBane(this);
  }

  // Samme metoder som de andre scener, så React kan kalde dem uden at vide, hvilken scene der kører.
  saetAktiv(id: string | null) {
    this.data_ = { ...this.data_, aktiv: id };
  }
  saetAktive(_aktive: string[]) {}
  saetSkjulte(skjulte: string[]) {
    this.data_ = { ...this.data_, skjulte };
    if (this.fugl?.scene) this.fugl.setVisible(!skjulte.includes('aeseloere'));
    for (const [id, b] of this.figurer) if (b.scene) b.setVisible(!skjulte.includes(id));
    if (this.klatten?.scene) this.klatten.setVisible(!skjulte.includes('klatten'));
  }
  /** Til test: hovedpersonens vandrette plads i verden. */
  spillerX(): number {
    return this.spiller ? Math.round(this.spiller.x) : NaN;
  }
  /** Til test: hovedpersonens plads i verden og på skærmen (0-1 af det, kameraet viser). */
  kameraInfo() {
    const v = this.cameras.main.worldView;
    const x = this.spiller?.x ?? NaN;
    const y = this.spiller?.y ?? NaN;
    return { x: Math.round(x), y: Math.round(y), sx: (x - v.x) / v.width, sy: (y - v.y) / v.height };
  }

  laas(laast: boolean) {
    this.laast = laast;
    // Slippes en tast, mens en opgave er åben, opdager Phaser det ikke, og hovedpersonen løber videre bagefter.
    // Derfor nulstilles taster og knapper på skærmen, både når der låses, og når der låses op.
    this.input.keyboard?.resetKeys();
    this.touch = { venstre: false, hoejre: false, hop: false };
    this.hopBuffer = 0;
    this.vx = 0;
    if (this.input.keyboard) this.input.keyboard.enabled = !laast;
  }
  forskraek() {
    if (this.data_.mindreUhygge) return;
    this.cameras.main.shake(250, 0.008);
  }
  /**
   * Til gennemspilningen (kun med ?hop): stil hovedpersonen ved en ordsten (ordsten-0, ordsten-1, ...) eller ved målet.
   * Eleven kan ikke kalde den.
   */
  gaaTilObjekt(id: string) {
    const m = /^ordsten-(\d+)$/.exec(id);
    const p = m ? this.ordsten[Number(m[1])] : id === 'maal' ? { x: this.maal.x, y: this.maal.y } : undefined;
    if (!p) return;
    this.spiller.setPosition(m ? p.x - 4 : p.x, p.y - 2);
    this.vx = 0;
    this.vy = 0;
    this.spurgt = null;
  }

  /** Skriver gruppe nr af viskede planker tilbage. Plankerne toner frem og falder på plads med lidt glimmer. */
  genskab(nr: number, animer = true) {
    if (this.genskabt.has(nr) || !this.grupper[nr]) return;
    this.genskabt.add(nr);
    this.ordsten[nr]?.billede.setTexture(`${this.stenNoegle}-1`);
    this.grupper[nr].forEach(([x, y], i) => {
      const px = x * BFELT;
      const py = y * BFELT;
      const b = this.add.image(px, py, 'px-ny-planke').setOrigin(0).setDepth(1);
      if (animer && i === 0) spilEffekt('planke');
      if (!animer || this.roligt) return;
      b.setAlpha(0).setY(py - 6);
      this.tweens.add({ targets: b, alpha: 1, y: py, duration: 260, delay: i * 90, ease: 'Back.Out' });
      for (let k = 0; k < 3; k++) {
        const g = this.add.rectangle(px + 3 + k * 5, py, 1, 1, 0xffe9a8).setDepth(2);
        this.tweens.add({ targets: g, y: py - 8 - k * 3, alpha: 0, duration: 500, delay: i * 90 + 120, onComplete: () => g.destroy() });
      }
    });
    this.spurgt = null;
  }

  /**
   * Hop med fjedren (Henrik, 10. november 2026): hovedpersonen strækker sig ved hop og trykkes sammen ved landing.
   * Fødderne bliver stående, fordi billedets origo er under fødderne.
   */
  private fjedr(sx: number, sy: number, ms: number) {
    if (this.roligt) return;
    this.tweens.killTweensOf(this.spiller);
    const g = this.grundSkala;
    this.spiller.setScale(sx * g, sy * g);
    this.tweens.add({ targets: this.spiller, scaleX: g, scaleY: g, duration: ms, ease: 'Back.Out' });
  }

  /** Små støvpuf ved fødderne. */
  private stoev(x: number, y: number, antal: number) {
    if (this.roligt) return;
    for (let k = 0; k < antal; k++) {
      const side = k % 2 === 0 ? -1 : 1;
      const p = this.add.rectangle(Math.round(x + side * (2 + k)), Math.round(y - 1), 2, 1, 0xe8dfc8).setDepth(6).setAlpha(0.9);
      this.tweens.add({ targets: p, x: p.x + side * (5 + k * 2), y: p.y - 2 - (k % 3), alpha: 0, duration: 280 + k * 30, onComplete: () => p.destroy() });
    }
  }

  /** Knapperne på skærmen (touch) og musen. */
  styr(knap: 'venstre' | 'hoejre' | 'hop', nede: boolean) {
    this.touch[knap] = nede;
    if (knap === 'hop' && nede) this.hopBuffer = FYSIK.hopBuffer;
  }

  /** Æseløre bærer hovedpersonen hen til næste lanterne eller målet. */
  baerOver() {
    // Æseløre bærer ikke forbi en ordsten, der ikke er løst. Så står man ved stenen og kan skrive planken tilbage.
    const sten = this.ordsten.find((o, i) => !this.genskabt.has(i) && o.x > this.spiller.x + 4);
    const lanterne = this.lanterner.find((_l, i) => i > this.checkpointNr);
    const naeste = lanterne && (!sten || lanterne.x < sten.x) ? lanterne : undefined;
    const maal = naeste ?? (sten ? { x: sten.x - 12, y: sten.y } : { x: this.maal.x - 20, y: this.maal.y });
    if (naeste) this.taend(this.lanterner.indexOf(naeste));
    this.spiller.setPosition(maal.x, maal.y - 2);
    this.vx = 0;
    this.vy = 0;
    this.fald = 0;
    this.kroge?.onHjaelp?.(false);
  }

  private taend(nr: number) {
    if (nr <= this.checkpointNr) return;
    this.checkpointNr = nr;
    const l = this.lanterner[nr];
    l.taendt = true;
    l.billede.setTexture('px-cp-1');
  }

  private tilbage() {
    const l = this.lanterner[this.checkpointNr];
    const p = l ? { x: l.x, y: l.y } : this.start;
    this.spiller.setPosition(p.x, p.y - 2);
    this.vx = 0;
    this.vy = 0;
    this.fald++;
    if (!this.roligt) this.cameras.main.flash(180, 20, 22, 41);
    if (this.fald >= HJAELP_EFTER && !this.data_.svaer) this.kroge?.onHjaelp?.(true);
  }

  /** Rammer en kasse på (x, y) med højde h noget fast? Planker tæller kun ovenfra. */
  private fastVed(x: number, y: number): boolean {
    return erFast(this.tegn(Math.floor(x / BFELT), Math.floor(y / BFELT)));
  }

  update(_t: number, delta: number) {
    if (!this.spiller) return;
    const dt = Math.min(0.033, Math.max(0, delta / 1000));
    this.ur += dt;
    const t = this.taster;
    const venstre = !this.laast && (this.touch.venstre || !!t?.venstre.isDown || !!t?.a.isDown);
    const hoejre = !this.laast && (this.touch.hoejre || !!t?.hoejre.isDown || !!t?.d.isDown);
    const hopNede = !this.laast && (this.touch.hop || !!t?.mellemrum.isDown || !!t?.op.isDown || !!t?.w.isDown);
    if (!this.laast && t && (Phaser.Input.Keyboard.JustDown(t.mellemrum) || Phaser.Input.Keyboard.JustDown(t.op) || Phaser.Input.Keyboard.JustDown(t.w)))
      this.hopBuffer = FYSIK.hopBuffer;

    // Vandret.
    const maalVx = (hoejre ? 1 : 0) - (venstre ? 1 : 0);
    if (maalVx !== 0) this.retning = maalVx > 0 ? 1 : -1;
    this.vx += (maalVx * FYSIK.fart - this.vx) * Math.min(1, dt * (this.paaJorden ? 18 : 8));

    // Hop med coyote-tid og buffer, så det er tilgivende.
    this.sidenJord = this.paaJorden ? 0 : this.sidenJord + dt;
    this.hopBuffer = Math.max(0, this.hopBuffer - dt);
    if (this.hopBuffer > 0 && this.sidenJord <= FYSIK.coyote) {
      spilEffekt('hop');
      this.fjedr(0.85, 1.15, 160);
      this.stoev(this.spiller.x, this.spiller.y, 2);
      this.vy = -FYSIK.hop;
      this.hopBuffer = 0;
      this.sidenJord = FYSIK.coyote + 1;
    }
    // Slipper man hop tidligt, bliver hoppet lavere.
    if (!hopNede && this.vy < -120) this.vy = -120;
    this.vy = Math.min(420, this.vy + FYSIK.tyngde * dt);

    // Flyt og kollider. Hovedpersonen er en kasse 10 bred og 20 høj med fødderne i (x, y).
    const B = 5;
    const H = 20;
    let { x, y } = this.spiller;
    const nx = x + this.vx * dt;
    if (!this.fastVed(nx + (this.vx > 0 ? B : -B), y - 2) && !this.fastVed(nx + (this.vx > 0 ? B : -B), y - H + 2)) x = nx;
    else this.vx = 0;
    let ny = y + this.vy * dt;
    const varPaaJorden = this.paaJorden;
    const faldFart = this.vy;
    this.paaJorden = false;
    if (this.vy >= 0) {
      // Lander på noget fast eller en planke, der var under fødderne før.
      const fodRaekke = Math.floor(ny / BFELT);
      for (const fx of [x - B + 1, x + B - 1]) {
        const c = this.tegn(Math.floor(fx / BFELT), fodRaekke);
        const top = fodRaekke * BFELT;
        if ((erFast(c) || (erPlanke(c) && y <= top + 1)) && ny >= top) {
          ny = top;
          this.vy = 0;
          this.paaJorden = true;
        }
      }
    } else if (this.fastVed(x - B + 1, ny - H) || this.fastVed(x + B - 1, ny - H)) {
      // Slår hovedet.
      ny = (Math.floor((ny - H) / BFELT) + 1) * BFELT + H;
      this.vy = 0;
    }
    y = ny;
    this.spiller.setPosition(x, y);
    if (this.paaJorden && !varPaaJorden && faldFart > 140) {
      spilEffekt('landing');
      this.fjedr(1.2, 0.8, 150);
      this.stoev(x, y, faldFart > 300 ? 6 : 4);
    }
    else if (this.paaJorden && Math.abs(this.vx) > 30) spilEffekt('skridt');

    // Fare: blæk, vand eller ud af banen forneden.
    const midt = this.tegn(Math.floor(x / BFELT), Math.floor((y - 4) / BFELT));
    if (erFare(midt) || y > this.bane.hoejde * BFELT + 30) this.tilbage();

    // Lanterner tændes, når man går forbi.
    this.lanterner.forEach((l, i) => {
      if (!l.taendt && Math.abs(l.x - x) < 10 && Math.abs(l.y - y) < 24) this.taend(i);
    });

    // Ordsten: står man ved en, der ikke er løst, spørger den. Går man væk, kan den spørge igen.
    this.ordsten.forEach((o, i) => {
      const ved = Math.abs(o.x - x) < 14 && Math.abs(o.y - y) < 20;
      if (!ved && this.spurgt === i && Math.abs(o.x - x) > 30) this.spurgt = null;
      if (ved && !this.genskabt.has(i) && this.spurgt !== i && this.paaJorden && !this.laast) {
        this.spurgt = i;
        this.vx = 0;
        this.kroge?.onOrdsten?.(i);
      }
      if (!this.genskabt.has(i) && !this.roligt) o.billede.setTint(Math.sin(this.ur * 3 + i) > 0.4 ? 0xffffff : 0xf0e6c8);
    });

    // Målet.
    // Målet tæller, når hovedpersonen er nået hen til lemmen, også midt i et hop.
    const vedMaal = x >= this.maal.x - 10 && x <= this.maal.x + 40 && y <= this.maal.y + 2 && y >= this.maal.y - 64;
    if (!this.faerdig && vedMaal && this.data_.aktiv === 'maal' && !this.laast) {
      this.faerdig = true;
      this.kroge?.onHjaelp?.(false);
      this.kroge?.onInteraktion('maal');
    }

    // Udseende.
    const gaar = Math.abs(this.vx) > 10 && this.paaJorden;
    if (gaar) this.gaaTid += dt;
    const ramme = !this.paaJorden ? 1 : gaar ? 1 + (Math.floor(this.gaaTid * 8) % 2) : 0;
    this.spiller.setTexture(`px-side-${ramme}`).setFlipX(this.retning < 0);

    // Æseløre flyver lidt bag og over hovedpersonen.
    const k = 1 - Math.pow(0.03, dt);
    this.fugl.x += (x - this.retning * 18 - this.fugl.x) * k;
    this.fugl.y += (y - 26 + Math.sin(this.ur * 4) * 2 - this.fugl.y) * k;
    this.fugl.setFlipX(this.retning < 0);

    // Klatten løber foran og venter, hvis hovedpersonen er langt bagud.
    if (this.klatten) {
      const maalX = Math.min(this.maal.x + 24, x + 110);
      if (this.klatten.x < maalX) this.klatten.x = Math.min(maalX, this.klatten.x + 85 * dt);
      const fod = this.jordUnder(this.klatten.x, this.klatten.y);
      this.klatten.y = fod;
      this.klatten.setFlipX(false).setDisplayOrigin(7, 17 + (this.roligt ? 0 : Math.abs(Math.sin(this.ur * 10)) * 2));
    }

    // Skyggen svajer langsomt og flimrer, som om den ikke helt er der.
    for (const b of this.figurer.values()) {
      if (!b.visible) continue;
      b.setAlpha(this.roligt ? 0.95 : 0.8 + Math.sin(this.ur * 7) * 0.08 + (Math.sin(this.ur * 23) > 0.92 ? -0.4 : 0));
      if (!this.roligt) b.setScale(1 + Math.sin(this.ur * 0.9) * 0.04, 1 + Math.sin(this.ur * 0.7) * 0.03);
    }

    // Kameraet følger med og kigger lidt frem.
    const cam = this.cameras.main;
    // Fremadkigget glider for sig selv, så en vending ikke giver et ryk (10. november 2026).
    this.fremad = glid(this.fremad, this.retning * 30, dt, 2.5);
    this.kamX = glid(this.kamX, x + this.fremad, dt, 5);
    cam.centerOn(this.kamX, this.kamY());
    this.taage?.setPosition(Math.round(x), Math.round(y - 10));
  }

  /** Midten af det, kameraet viser lodret: banens bund står nederst i billedet. */
  kamY() {
    return Math.max(VIS_H / 2, this.bane.hoejde * BFELT - VIS_H / 2);
  }

  /** Den højde, Klatten løber i: øverste faste felt under ham, ellers samme højde. */
  private jordUnder(x: number, y: number): number {
    const tx = Math.floor(x / BFELT);
    for (let ty = Math.floor((y - 20) / BFELT); ty < this.bane.hoejde; ty++)
      if (erFast(this.tegn(tx, ty)) || erPlanke(this.tegn(tx, ty))) return ty * BFELT;
    return y;
  }
}
