import Phaser from 'phaser';
import type { Avatar } from '../engine/gem';
import { BFELT, erFare, erFast, erPlanke, find, FYSIK, laesBane, type Bane } from './bane';
import { VIS_B, VIS_H } from './KortScene';
import { checkpoint, MAAL, tegnBane, tegnByBaggrund } from './pixel/banetegn';
import { tegnkortTilLerred } from './pixel/lerred';
import { avatarPixel, FUGL, KLATTEN, SKYGGE, type Tegnkort } from './pixel/sprites';
import type { VerdenData, VerdenKroge } from './VerdenScene';

/** Efter så mange fald tilbyder Æseløre at bære hovedpersonen over. */
export const HJAELP_EFTER = 3;

/**
 * Platformbane set fra siden. Hovedpersonen løber og hopper. Der er ingen død:
 * falder man i blæk eller vand, starter man igen ved sidste tændte lanterne.
 * Målet kalder onInteraktion('maal'), så trinnet i kapitlet går videre.
 */
export class BaneScene extends Phaser.Scene {
  private data_!: VerdenData;
  private bane!: Bane;
  private spiller!: Phaser.GameObjects.Image;
  private fugl!: Phaser.GameObjects.Image;
  private klatten?: Phaser.GameObjects.Image;
  /** Figurer på banen fra kapitlet, fx Den Ufærdige (form "skygge"). */
  private figurer = new Map<string, Phaser.GameObjects.Image>();
  private lanterner: { x: number; y: number; billede: Phaser.GameObjects.Image; taendt: boolean }[] = [];
  private maal = { x: 0, y: 0 };
  private vx = 0;
  private vy = 0;
  private paaJorden = false;
  private sidenJord = 0;
  private hopBuffer = 0;
  private retning: 1 | -1 = 1;
  private gaaTid = 0;
  private ur = 0;
  private checkpointNr = -1;
  private start = { x: 0, y: 0 };
  private fald = 0;
  private laast = false;
  private faerdig = false;
  private taster?: Record<'venstre' | 'hoejre' | 'op' | 'a' | 'd' | 'w' | 'mellemrum', Phaser.Input.Keyboard.Key>;
  /** Knapper på skærmen (touch). */
  private touch = { venstre: false, hoejre: false, hop: false };
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
  }

  private get kroge(): VerdenKroge {
    return this.registry.get('kroge') as VerdenKroge;
  }

  private tekstur(noegle: string, kilde: Tegnkort | HTMLCanvasElement, ny = false) {
    if (this.textures.exists(noegle)) {
      if (!ny) return noegle;
      this.textures.remove(noegle);
    }
    const c = kilde instanceof HTMLCanvasElement ? kilde : tegnkortTilLerred(kilde);
    this.textures.addCanvas(noegle, c)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return noegle;
  }

  byggAvatar() {
    const a = this.registry.get('avatar') as Avatar | undefined;
    if (!a) return;
    for (const f of [0, 1, 2] as const) this.tekstur(`px-side-${f}`, avatarPixel(a, 'hoejre', f), true);
  }

  create() {
    this.bane = laesBane(this.data_.sted.bane ?? ['S', '#']);
    const W = this.bane.bredde * BFELT;
    const H = this.bane.hoejde * BFELT;
    const tema = this.data_.sted.tema;
    this.byggAvatar();
    this.tekstur('px-klatten', KLATTEN);
    this.tekstur('px-fugl', FUGL);
    this.tekstur('px-cp-0', checkpoint(false));
    this.tekstur('px-cp-1', checkpoint(true));
    this.tekstur('px-maal', MAAL);

    // Baggrunden er halvt så bred plus skærmen, fordi den flytter sig med halv fart.
    this.add
      .image(0, 0, this.tekstur(`px-bane-bag-${tema}`, tegnByBaggrund(Math.ceil(W / 2) + VIS_B, Math.max(H, VIS_H)), true))
      .setOrigin(0)
      .setScrollFactor(0.5, 0)
      .setDepth(-2);
    this.add.image(0, 0, this.tekstur(`px-bane-${tema}`, tegnBane(this.bane), true)).setOrigin(0).setDepth(0);

    for (const [x, y] of find(this.bane, 'C')) {
      const bx = x * BFELT + 8;
      const by = (y + 1) * BFELT;
      this.lanterner.push({ x: bx, y: by, billede: this.add.image(bx, by, 'px-cp-0').setOrigin(0.5, 1).setDepth(1), taendt: false });
    }
    this.lanterner.sort((a, b) => a.x - b.x);
    const [m] = find(this.bane, 'M');
    if (m) {
      this.maal = { x: m[0] * BFELT + 8, y: (m[1] + 1) * BFELT };
      this.add.image(this.maal.x, this.maal.y, 'px-maal').setOrigin(0.5, 1).setDepth(1);
    }
    const [s] = find(this.bane, 'S');
    this.start = { x: (s?.[0] ?? 1) * BFELT + 8, y: ((s?.[1] ?? 1) + 1) * BFELT };
    // Er målet allerede nået, står hovedpersonen ved målet (fx hvis spillet blev genåbnet midt i slutscenen).
    const fra = this.data_.baneKlaret ? { x: this.maal.x - 24, y: this.maal.y } : this.start;
    if (this.data_.baneKlaret) this.faerdig = true;
    this.spiller = this.add.image(fra.x, fra.y, 'px-side-0').setOrigin(0.5, 1).setDepth(5);
    this.fugl = this.add.image(this.start.x - 16, this.start.y - 20, 'px-fugl').setOrigin(0.5, 1).setDepth(6);
    this.fugl.setVisible(!(this.data_.skjulte ?? []).includes('aeseloere'));
    const [k] = find(this.bane, 'K');
    if (k && !(this.data_.skjulte ?? []).includes('klatten'))
      this.klatten = this.add
        .image(this.data_.baneKlaret ? this.maal.x + 24 : k[0] * BFELT + 8, this.data_.baneKlaret ? this.maal.y : (k[1] + 1) * BFELT, 'px-klatten')
        .setOrigin(0.5, 1)
        .setDepth(4);

    this.tekstur('px-skygge-figur', SKYGGE);
    for (const o of this.data_.sted.objekter) {
      if (!o.felt || o.form !== 'skygge') continue;
      const b = this.add.image(o.felt[0] * BFELT + 8, (o.felt[1] + 1) * BFELT, 'px-skygge-figur').setOrigin(0.5, 1).setDepth(7);
      b.setVisible(!(this.data_.skjulte ?? []).includes(o.id));
      this.figurer.set(o.id, b);
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, Math.max(H, VIS_H)).setRoundPixels(true);
    cam.setZoom(1);
    cam.centerOn(fra.x, VIS_H / 2);

    const kb = this.input.keyboard;
    if (kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      this.taster = {
        venstre: kb.addKey(K.LEFT),
        hoejre: kb.addKey(K.RIGHT),
        op: kb.addKey(K.UP),
        a: kb.addKey(K.A),
        d: kb.addKey(K.D),
        w: kb.addKey(K.W),
        mellemrum: kb.addKey(K.SPACE),
      };
    }
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
  laas(laast: boolean) {
    this.laast = laast;
    if (this.input.keyboard) this.input.keyboard.enabled = !laast;
  }
  forskraek() {
    if (this.data_.mindreUhygge) return;
    this.cameras.main.shake(250, 0.008);
  }
  gaaTilObjekt(_id: string) {}

  /** Knapperne på skærmen (touch) og musen. */
  styr(knap: 'venstre' | 'hoejre' | 'hop', nede: boolean) {
    this.touch[knap] = nede;
    if (knap === 'hop' && nede) this.hopBuffer = FYSIK.hopBuffer;
  }

  /** Æseløre bærer hovedpersonen hen til næste lanterne eller målet. */
  baerOver() {
    const naeste = this.lanterner.find((_l, i) => i > this.checkpointNr);
    const maal = naeste ?? { x: this.maal.x - 20, y: this.maal.y };
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
    if (this.fald >= HJAELP_EFTER) this.kroge?.onHjaelp?.(true);
  }

  /** Rammer en kasse på (x, y) med højde h noget fast? Planker tæller kun ovenfra. */
  private fastVed(x: number, y: number): boolean {
    return erFast(this.bane.tegn(Math.floor(x / BFELT), Math.floor(y / BFELT)));
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
    this.paaJorden = false;
    if (this.vy >= 0) {
      // Lander på noget fast eller en planke, der var under fødderne før.
      const fodRaekke = Math.floor(ny / BFELT);
      for (const fx of [x - B + 1, x + B - 1]) {
        const c = this.bane.tegn(Math.floor(fx / BFELT), fodRaekke);
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

    // Fare: blæk, vand eller ud af banen forneden.
    const midt = this.bane.tegn(Math.floor(x / BFELT), Math.floor((y - 4) / BFELT));
    if (erFare(midt) || y > this.bane.hoejde * BFELT + 30) this.tilbage();

    // Lanterner tændes, når man går forbi.
    this.lanterner.forEach((l, i) => {
      if (!l.taendt && Math.abs(l.x - x) < 10 && Math.abs(l.y - y) < 24) this.taend(i);
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
    const sigt = x + this.retning * 30;
    cam.scrollX += (sigt - VIS_B / 2 - cam.scrollX) * Math.min(1, dt * 4);
    cam.scrollY = Math.max(0, this.bane.hoejde * BFELT - VIS_H);
  }

  /** Den højde, Klatten løber i: øverste faste felt under ham, ellers samme højde. */
  private jordUnder(x: number, y: number): number {
    const tx = Math.floor(x / BFELT);
    for (let ty = Math.floor((y - 20) / BFELT); ty < this.bane.hoejde; ty++)
      if (erFast(this.bane.tegn(tx, ty)) || erPlanke(this.bane.tegn(tx, ty))) return ty * BFELT;
    return y;
  }
}
