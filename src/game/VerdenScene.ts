import Phaser from 'phaser';
import type { Sted, StedObjekt } from '../content';
import { BREDDE, GULV_TOP, HOEJDE, tegnBaggrund, tegnObjekt } from './tegn';

export type VerdenKroge = {
  onInteraktion: (objektId: string) => void;
  onNaer: (objektId: string | null) => void;
  /** Placering af E-hintet over det, eleven kan undersøge, i procent af spilfladen. null skjuler det. */
  onHint?: (pos: { x: number; y: number } | null) => void;
  /** Platformbane: true, når Æseløre skal tilbyde at bære hovedpersonen over. */
  onHjaelp?: (vis: boolean) => void;
};

export type VerdenData = {
  sted: Sted;
  aktiv: string | null;
  /** Escape room: alt det, man kan undersøge på én gang. Der vises ingen pil, kun E-hintet. */
  aktive?: string[];
  mindreUhygge: boolean;
  /** Platformbane: målet er allerede nået (eleven er længere i kapitlet). Så starter hovedpersonen ved målet. */
  baneKlaret?: boolean;
  /** Objekter, der ikke skal vises lige nu, fx Klatten, når han er løbet. */
  skjulte?: string[];
};

const FART = 230; // pixels pr. sekund
const NAER_AFSTAND = 110;
const MIN_Y = GULV_TOP + 40;
const MAX_Y = HOEJDE - 20;

export class VerdenScene extends Phaser.Scene {
  private data_!: VerdenData;
  private spiller!: Phaser.GameObjects.Image;
  private markering!: Phaser.GameObjects.Graphics;
  private markeringTween?: Phaser.Tweens.Tween;
  private taster?: Record<'op' | 'ned' | 'venstre' | 'hoejre' | 'w' | 'a' | 's' | 'd' | 'enter' | 'mellemrum', Phaser.Input.Keyboard.Key>;
  private maal: { x: number; y: number; interager: boolean } | null = null;
  private naer: string | null = null;
  private laast = false;

  constructor() {
    super('verden');
  }

  init(data: VerdenData) {
    this.data_ = data;
    this.maal = null;
    this.naer = null;
  }

  private get kroge(): VerdenKroge {
    return this.registry.get('kroge') as VerdenKroge;
  }

  create() {
    const { sted, mindreUhygge } = this.data_;
    const baggrund = this.add.graphics();
    tegnBaggrund(baggrund, sted.tema, mindreUhygge);
    baggrund.setDepth(-1000);

    for (const o of sted.objekter) {
      const g = this.add.graphics();
      tegnObjekt(g, o);
      g.setDepth(o.y + o.h / 2);
    }

    this.markering = this.add.graphics().setDepth(5000);
    this.tegnMarkering();

    const nøgle = this.textures.exists('avatar') ? 'avatar' : '__WHITE';
    this.spiller = this.add.image(sted.start.x, sted.start.y, nøgle).setOrigin(0.5, 1);
    this.tilpasSpiller();
    this.textures.on('addtexture', (key: string) => {
      if (key === 'avatar' && this.spiller?.active) {
        this.spiller.setTexture('avatar');
        this.tilpasSpiller();
      }
    });

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
      const aktiv = this.aktivtObjekt();
      const paaAktiv =
        aktiv && Math.abs(p.worldX - aktiv.x) < aktiv.w / 2 + 20 && Math.abs(p.worldY - aktiv.y) < aktiv.h / 2 + 20;
      if (paaAktiv && aktiv) this.gaaTil(aktiv.x, aktiv.y + aktiv.h / 2 + 30, true);
      else this.gaaTil(p.worldX, p.worldY, false);
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.textures.off('addtexture');
      this.markeringTween?.remove();
    });
  }

  private tilpasSpiller() {
    if (this.spiller.texture.key === 'avatar') this.spiller.clearTint().setDisplaySize(84, 140);
    else this.spiller.setDisplaySize(40, 80).setTint(0x7b4bb3);
  }

  private aktivtObjekt(): StedObjekt | undefined {
    return this.data_.sted.objekter.find((o) => o.id === this.data_.aktiv);
  }

  private tegnMarkering() {
    this.markering.clear();
    this.markeringTween?.remove();
    const o = this.aktivtObjekt();
    if (!o) return;
    this.markering.lineStyle(4, 0xffd76a, 1).strokeRoundedRect(o.x - o.w / 2 - 10, o.y - o.h / 2 - 10, o.w + 20, o.h + 20, 12);
    this.markering.setAlpha(1);
    this.markeringTween = this.tweens.add({ targets: this.markering, alpha: 0.25, duration: 800, yoyo: true, repeat: -1 });
  }

  /** Kaldes fra React, når det aktive objekt skifter, uden at stedet skifter. */
  saetAktiv(id: string | null) {
    this.data_ = { ...this.data_, aktiv: id };
    if (this.markering) this.tegnMarkering();
    this.opdaterNaer(true);
  }

  /** Steder uden kort har ingen objekter, der forsvinder. */
  saetSkjulte(_skjulte: string[]) {}

  saetAktive(_aktive: string[]) {}

  /** Går hen til et objekt og undersøger det. */
  gaaTilObjekt(id: string) {
    const o = this.data_.sted.objekter.find((x) => x.id === id);
    if (o) this.gaaTil(o.x, o.y + o.h / 2 + 30, true);
  }

  laas(laast: boolean) {
    this.laast = laast;
    this.maal = null;
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

  gaaTil(x: number, y: number, interager: boolean) {
    this.maal = {
      x: Phaser.Math.Clamp(x, 40, BREDDE - 40),
      y: Phaser.Math.Clamp(y, MIN_Y, MAX_Y),
      interager,
    };
  }

  private opdaterNaer(tving = false) {
    const o = this.aktivtObjekt();
    let ny: string | null = null;
    if (o && this.spiller) {
      const afstand = Phaser.Math.Distance.Between(this.spiller.x, this.spiller.y - 40, o.x, o.y);
      if (afstand < NAER_AFSTAND + Math.max(o.w, o.h) / 2) ny = o.id;
    }
    if (ny !== this.naer || tving) {
      this.naer = ny;
      this.kroge?.onNaer(ny);
    }
  }

  update(_tid: number, delta: number) {
    if (!this.spiller || this.laast) return;
    const t = this.taster;
    let dx = 0;
    let dy = 0;
    if (t) {
      if (t.venstre.isDown || t.a.isDown) dx -= 1;
      if (t.hoejre.isDown || t.d.isDown) dx += 1;
      if (t.op.isDown || t.w.isDown) dy -= 1;
      if (t.ned.isDown || t.s.isDown) dy += 1;
    }
    const skridt = (FART * delta) / 1000;
    if (dx !== 0 || dy !== 0) {
      this.maal = null;
      const l = Math.hypot(dx, dy);
      this.spiller.x += (dx / l) * skridt;
      this.spiller.y += (dy / l) * skridt;
    } else if (this.maal) {
      const ax = this.maal.x - this.spiller.x;
      const ay = this.maal.y - this.spiller.y;
      const l = Math.hypot(ax, ay);
      if (l <= skridt) {
        this.spiller.setPosition(this.maal.x, this.maal.y);
        const interager = this.maal.interager;
        this.maal = null;
        this.opdaterNaer();
        if (interager && this.naer) this.kroge?.onInteraktion(this.naer);
      } else {
        this.spiller.x += (ax / l) * skridt;
        this.spiller.y += (ay / l) * skridt;
      }
    }
    this.spiller.x = Phaser.Math.Clamp(this.spiller.x, 40, BREDDE - 40);
    this.spiller.y = Phaser.Math.Clamp(this.spiller.y, MIN_Y, MAX_Y);
    if (dx < 0) this.spiller.setFlipX(true);
    if (dx > 0) this.spiller.setFlipX(false);
    this.spiller.setDepth(this.spiller.y);
    this.opdaterNaer();

    if (t && this.naer && (Phaser.Input.Keyboard.JustDown(t.enter) || Phaser.Input.Keyboard.JustDown(t.mellemrum))) {
      this.kroge?.onInteraktion(this.naer);
    }
  }
}
