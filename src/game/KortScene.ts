import Phaser from 'phaser';
import type { StedObjekt } from '../content';
import type { Avatar } from '../engine/gem';
import { erFastTegn, FELT, feltMidte, feltVed, felterVed, findVej, laesKort, type Felt, type Kort } from './kort';
import { bordflade, erInde, HOLM, KARTOTEK, KASSE, LOGBOG, PLANTE, reol, tegnRum, trappe, vindueslys } from './pixel/inde';
import { belysning, hash, lavLys, lavSkygge, lysOpsaetning, tegnGrund, tegnkortTilLerred, tegnVand, VARMT, type Farve } from './pixel/lerred';
import { avatarPixel, BLADE, FUGL, fyrtaarn, KLATTEN, LANTERNE, papirtrae, PIL, PLANKE, SKILT, STOLPE, voksen, type Retning, type Tegnkort } from './pixel/sprites';
import type { VerdenData, VerdenKroge } from './VerdenScene';

/**
 * Pixelgrafikken tegnes i 320 x 180. Spillets lærred skifter til den størrelse, når et sted har kort,
 * og browseren forstørrer det med skarpe pixel. Det er 9 gange færre pixel at tegne end 960 x 540.
 */
export const VIS_B = 320;
export const VIS_H = 180;
const FART = 70; // pixel pr. sekund i pixelverdenen
const NAER = 24;
const FASTE_FORMER = new Set(['gnom', 'skilt', 'person', 'skab']);
/** Figurer med deres eget pixelbillede i stedet for en almindelig voksen. */
const PERSONER: Record<string, Tegnkort> = { holm: HOLM };
/** Hvor højt over feltets midte pilen svæver for hver form. */
const PIL_HOEJDE: Record<string, number> = { gnom: 20, person: 27, skilt: 16, bog: 12, doer: 20, skab: 24 };

type Lyskilde = { x: number; y: number; billede: HTMLCanvasElement };

export class KortScene extends Phaser.Scene {
  private data_!: VerdenData;
  private kort!: Kort;
  private spiller!: Phaser.GameObjects.Image;
  private spillerSkygge!: Phaser.GameObjects.Image;
  private lanterne!: Phaser.GameObjects.Image;
  private fugl!: Phaser.GameObjects.Image;
  private pil!: Phaser.GameObjects.Image;
  private vand!: Phaser.GameObjects.Image;
  private lysLag!: Phaser.GameObjects.Image;
  private lysTekstur!: Phaser.Textures.CanvasTexture;
  private objektBilleder = new Map<string, Phaser.GameObjects.Image[]>();
  private planker: Phaser.GameObjects.Image[] = [];
  private faste = new Set<string>();
  private lyskilder: Lyskilde[] = [];
  private fyrLamper: { x: number; y: number }[] = [];
  private lygte: HTMLCanvasElement | null = null;
  private tone: Farve = [255, 255, 255];
  /** Lys, der ikke flytter sig: vinduer, lampen på disken og lyset fra trappen. */
  private faesteLys: Lyskilde[] = [];
  private fyrlys: HTMLCanvasElement[] = [];
  private objektlys!: HTMLCanvasElement;
  private taster?: Record<'op' | 'ned' | 'venstre' | 'hoejre' | 'w' | 'a' | 's' | 'd' | 'enter' | 'mellemrum', Phaser.Input.Keyboard.Key>;
  private vej: Felt[] = [];
  private interagerVedMaal = false;
  private retning: Retning = 'op';
  private gaaTid = 0;
  private ur = 0;
  private naer: string | null = null;
  private laast = false;
  private kam = { x: 0, y: 0 };
  /** Lyset tegnes kun forfra, når noget har flyttet sig. Det sparer meget på langsomme computere. */
  private sidsteLys = '';

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
    this.lyskilder = [];
    this.fyrLamper = [];
    this.faesteLys = [];
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
      for (const f of [0, 1, 2] as const) this.tekstur(`px-spiller-${r}-${f}`, avatarPixel(a, r, f), true);
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
    const traeer = [22, 26, 30, 34].map((h, i) => this.tekstur(`px-trae-${i}`, papirtrae(h)));
    this.tekstur('px-klatten', KLATTEN);
    this.tekstur('px-skilt', SKILT);
    this.tekstur('px-blade', BLADE);
    this.tekstur('px-stolpe', STOLPE);
    this.tekstur('px-planke', PLANKE);
    this.tekstur('px-pil', PIL);
    this.tekstur('px-fugl', FUGL);
    this.tekstur('px-fyr', fyrtaarn());
    this.tekstur('px-lanterne', LANTERNE);
    this.tekstur('px-skygge', lavSkygge(12));
    this.byggAvatar();

    const inde = erInde(this.kort);
    const lys = lysOpsaetning(belysning(tema), mindreUhygge);
    this.tone = lys.tone;

    // Jorden og vandet for dette sted. Indendørs: gulv og vægge.
    const grund = inde ? tegnRum(this.kort, tema === 'kaelder' ? 'sten' : 'trae') : tegnGrund(this.kort);
    this.add.image(0, 0, this.tekstur(`px-grund-${tema}`, grund, true)).setOrigin(0).setDepth(-100000);
    for (let i = 0; i < 3; i++) this.tekstur(`px-vand-${tema}-${i}`, tegnVand(this.kort, i), true);
    this.vand = this.add.image(0, 0, `px-vand-${tema}-0`).setOrigin(0).setDepth(-99999);

    // Træer, stolper, planker, blade og fyrtårne fra kortet.
    for (let ty = 0; ty < this.kort.hoejde; ty++)
      for (let tx = 0; tx < this.kort.bredde; tx++) {
        const c = this.kort.tegn(tx, ty);
        const a = hash(tx * 7 + 3, ty * 13 + 1);
        const b = hash(tx * 5 + 1, ty * 3 + 7);
        if (c === '#') {
          const y1 = ty * FELT + 13 + (b - 0.5) * 6;
          this.add.image(tx * FELT + 8 + (a - 0.5) * 8, y1, traeer[Math.floor(a * 4)]).setOrigin(0.5, 1).setDepth(y1);
          if (b > 0.55) {
            const y2 = ty * FELT + 4 + a * 4;
            this.add.image(tx * FELT + 8 + (b - 0.5) * 14, y2, traeer[Math.floor(b * 3)]).setOrigin(0.5, 1).setDepth(y2);
          }
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
        } else if (inde) this.moebel(c, tx, ty, tema === 'kaelder');
      }

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
      else if (o.form === 'bog') {
        // Bogen ligger fladt på disken og tegnes oven på den.
        billeder.push(this.add.image(o.felt[0] * FELT + 2, o.felt[1] * FELT + 2, this.tekstur('px-logbog', LOGBOG)).setOrigin(0).setDepth(o.felt[1] * FELT + 16));
      }
      if (noegle) {
        if (o.form !== 'skilt' && o.form !== 'skab') billeder.push(this.add.image(midte.x, midte.y, 'px-skygge').setOrigin(0.5, 0.5).setDepth(midte.y - 1));
        billeder.push(this.add.image(midte.x, midte.y, noegle).setOrigin(0.5, 1).setDepth(midte.y));
      }
      if (o.lys) {
        billeder.push(this.add.image(midte.x + 7, midte.y - 9, 'px-lanterne').setOrigin(0.5, 1).setDepth(midte.y + 1));
      }
      this.objektBilleder.set(o.id, billeder);
    }
    this.objektlys = lavLys(46, 0.9, this.tone);
    this.saetSkjulte(this.data_.skjulte ?? []);

    // Hovedpersonen og Æseløre.
    const start = feltMidte(sted.startFelt ?? [1, 1]);
    this.spillerSkygge = this.add.image(start.x, start.y, 'px-skygge').setOrigin(0.5, 0.5);
    this.spiller = this.add.image(start.x, start.y, 'px-spiller-op-0').setOrigin(0.5, 1);
    this.lanterne = this.add.image(start.x, start.y, 'px-lanterne').setOrigin(0.5, 1);
    this.lanterne.setVisible((this.registry.get('avatar') as Avatar | undefined)?.tilbehoer === 3);
    this.fugl = this.add.image(start.x - 14, start.y + 4, 'px-fugl').setOrigin(0.5, 1);
    this.pil = this.add.image(0, 0, 'px-pil').setOrigin(0.5, 1).setDepth(2_000_000).setVisible(false);

    // Nattelys: et lag, der ganges på billedet. Lanternen og fyrtårnet lyser op.
    const tone = this.tone;
    this.lygte = lys.spillerLys > 0 ? lavLys(lys.spillerLys, 0.95, tone) : null;
    this.fyrlys = [lavLys(34, 0.75, tone), lavLys(40, 0.85, tone)];
    if (inde) this.lavFaesteLys();
    if (this.textures.exists('px-lys')) this.textures.remove('px-lys');
    this.lysTekstur = this.textures.createCanvas('px-lys', VIS_B, VIS_H)!;
    this.lysTekstur.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.lysLag = this.add.image(0, 0, 'px-lys').setOrigin(0).setDepth(1_000_000).setBlendMode(Phaser.BlendModes.MULTIPLY);

    const cam = this.cameras.main;
    cam.setZoom(1).setBounds(0, 0, W, H).setRoundPixels(true);
    this.kam = { x: start.x, y: start.y - 10 };
    this.flytKamera(1);

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
        enter: kb.addKey(K.ENTER),
        mellemrum: kb.addKey(K.SPACE),
      };
    }

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.laast) return;
      const punkt = this.cameras.main.getWorldPoint(p.x, p.y);
      const [tx, ty] = feltVed(punkt.x, punkt.y);
      const aktiv = this.aktivtObjekt();
      if (aktiv?.felt && Math.abs(aktiv.felt[0] - tx) <= 1 && Math.abs(aktiv.felt[1] - ty) <= 1) {
        this.gaaTilObjekt(aktiv.id);
        return;
      }
      if (!this.erFast(tx, ty)) this.saetVej([tx, ty], false);
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown');
    });
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
    const lampe = lavLys(40, 0.7, this.tone, [255, 246, 222]);
    const trappelys = lavLys(34, 0.8, this.tone, VARMT);
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

  saetAktiv(id: string | null) {
    this.data_ = { ...this.data_, aktiv: id };
    this.opdaterNaer(true);
  }

  saetSkjulte(skjulte: string[]) {
    this.data_ = { ...this.data_, skjulte };
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
  }

  laas(laast: boolean) {
    this.laast = laast;
    this.vej = [];
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
    this.interagerVedMaal = true;
    if (bedst.length === 0) this.ankommet();
  }

  private saetVej(til: Felt, interager: boolean) {
    const fra = feltVed(this.spiller.x, this.spiller.y - 2);
    const v = findVej(this.kort, fra, til, (x, y) => this.erFast(x, y));
    if (!v) return;
    this.vej = v;
    this.interagerVedMaal = interager;
  }

  private ankommet() {
    const interager = this.interagerVedMaal;
    this.interagerVedMaal = false;
    this.opdaterNaer();
    if (interager && this.naer) this.kroge?.onInteraktion(this.naer);
  }

  private kollision(x: number, y: number): boolean {
    for (const [dx, dy] of [[-5, -3], [5, -3], [-5, 1], [5, 1]]) {
      const [tx, ty] = feltVed(x + dx, y + dy);
      if (this.erFast(tx, ty)) return true;
    }
    return false;
  }

  private opdaterNaer(tving = false) {
    const o = this.aktivtObjekt();
    let ny: string | null = null;
    if (o?.felt && this.spiller) {
      const m = feltMidte(o.felt);
      if (Phaser.Math.Distance.Between(this.spiller.x, this.spiller.y, m.x, m.y) <= NAER) ny = o.id;
    }
    if (ny !== this.naer || tving) {
      this.naer = ny;
      this.kroge?.onNaer(ny);
    }
  }

  private flytKamera(f: number) {
    const [lx, ly] = { op: [0, -1], ned: [0, 1], venstre: [-1, 0], hoejre: [1, 0] }[this.retning];
    const mx = this.spiller.x + lx * 22;
    const my = this.spiller.y - 10 + ly * 26;
    this.kam.x += (mx - this.kam.x) * f;
    this.kam.y += (my - this.kam.y) * f;
    const W = this.kort.bredde * FELT;
    const H = this.kort.hoejde * FELT;
    const vx = Math.round(Phaser.Math.Clamp(this.kam.x - VIS_B / 2, 0, Math.max(0, W - VIS_B)));
    const vy = Math.round(Phaser.Math.Clamp(this.kam.y - VIS_H / 2, 0, Math.max(0, H - VIS_H)));
    this.cameras.main.centerOn(vx + VIS_B / 2, vy + VIS_H / 2);
    return { vx, vy };
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
      if (t && this.naer && (Phaser.Input.Keyboard.JustDown(t.enter) || Phaser.Input.Keyboard.JustDown(t.mellemrum))) {
        this.kroge?.onInteraktion(this.naer);
      }
    }

    // Hovedpersonen: retning og gangbilleder.
    if (gaar) this.gaaTid += dt;
    const ramme = gaar ? 1 + (Math.floor(this.gaaTid * 7) % 2) : 0;
    const r = this.retning === 'venstre' ? 'hoejre' : this.retning;
    this.spiller.setTexture(`px-spiller-${r}-${ramme}`).setFlipX(this.retning === 'venstre');
    this.spiller.setDepth(this.spiller.y);
    this.spillerSkygge.setPosition(this.spiller.x, this.spiller.y).setDepth(this.spiller.y - 1);
    const lx = this.retning === 'venstre' ? -6 : this.retning === 'hoejre' ? 6 : 8;
    this.lanterne.setPosition(this.spiller.x + lx, this.spiller.y - 4).setDepth(this.spiller.y + (this.retning === 'op' ? -1 : 1));

    // Æseløre flyver efter.
    const [rx, ry] = { op: [0, -1], ned: [0, 1], venstre: [-1, 0], hoejre: [1, 0] }[this.retning];
    const fx = this.spiller.x - rx * 16 + (ry ? -12 : 0);
    const fy = this.spiller.y - ry * 10 + 2;
    const k = 1 - Math.pow(0.04, dt);
    const gammelX = this.fugl.x;
    this.fugl.x += (fx - this.fugl.x) * k;
    this.fugl.y += (fy - this.fugl.y) * k;
    if (Math.abs(this.fugl.x - gammelX) > 0.05) this.fugl.setFlipX(this.fugl.x < gammelX);
    const svaev = Math.sin(this.ur * 4) * 2;
    this.fugl.setDepth(this.fugl.y).setDisplayOrigin(8, 10 + 18 - svaev);

    // Vand og planker.
    const vandNoegle = `px-vand-${this.data_.sted.tema}-${Math.floor(this.ur * 2.5) % 3}`;
    if (this.vand.texture.key !== vandNoegle) this.vand.setTexture(vandNoegle);
    this.planker.forEach((p, i) => p.setY((p.getData('y0') as number) + (Math.sin(this.ur * 1.6 + i * 2) > 0.3 ? 1 : 0)));

    // Pil over det, eleven skal undersøge.
    const aktiv = this.aktivtObjekt();
    if (aktiv?.felt && !this.laast) {
      const m = feltMidte(aktiv.felt);
      const hoejde = PIL_HOEJDE[aktiv.form] ?? 6;
      this.pil.setVisible(true).setPosition(m.x, m.y - hoejde - 2 - (Math.sin(this.ur * 5) > 0 ? 1 : 0));
    } else this.pil.setVisible(false);

    this.opdaterNaer();

    // Kamera og lys.
    const { vx, vy } = this.flytKamera(0.12);
    this.lysLag.setPosition(vx, vy);
    const fyrRamme = Math.floor(this.ur * 1.2) % 2;
    const noegle = `${vx},${vy},${Math.round(this.spiller.x)},${Math.round(this.spiller.y)},${fyrRamme},${this.lyskilder.length},${this.data_.mindreUhygge}`;
    if (noegle === this.sidsteLys) return;
    this.sidsteLys = noegle;
    const ctx = this.lysTekstur.context;
    const tone = this.tone;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgb(${tone[0]}, ${tone[1]}, ${tone[2]})`;
    ctx.fillRect(0, 0, VIS_B, VIS_H);
    // "lighten": hvor to lys mødes, vinder det stærkeste, i stedet for at det sidste dækker.
    ctx.globalCompositeOperation = 'lighten';
    const tegnLys = (x: number, y: number, c: HTMLCanvasElement) => ctx.drawImage(c, Math.round(x - vx - c.width / 2), Math.round(y - vy - c.height / 2));
    for (const l of this.fyrLamper) tegnLys(l.x, l.y, this.fyrlys[fyrRamme]);
    for (const l of this.faesteLys) tegnLys(l.x, l.y, l.billede);
    for (const l of this.lyskilder) tegnLys(l.x, l.y, l.billede);
    if (this.lygte) tegnLys(this.spiller.x, this.spiller.y - 12, this.lygte);
    ctx.globalCompositeOperation = 'source-over';
    this.lysTekstur.refresh();
  }
}
