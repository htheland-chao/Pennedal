import Phaser from 'phaser';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Sted } from '../content';
import type { Avatar } from '../engine/gem';
import { BaneScene } from './BaneScene';
import { KortScene, VIS_B, VIS_H } from './KortScene';
import { BREDDE, HOEJDE } from './tegn';
import { VerdenScene, type VerdenKroge } from './VerdenScene';

type Props = {
  stedId: string;
  sted: Sted;
  aktiv: string | null;
  /** Platformbane: målet er nået, så hovedpersonen starter ved målet. */
  baneKlaret?: boolean;
  /** Escape room: alt, der kan undersøges. */
  aktive?: string[];
  avatarUri: string;
  /** Bruges til hovedpersonen i pixelgrafik på steder med kort. */
  avatar: Avatar;
  /** Objekter, der ikke vises lige nu. */
  skjulte: string[];
  laast: boolean;
  mindreUhygge: boolean;
  forskraekSignal: number;
  /** Hvem der taler i dialogen. Kameraet zoomer ind på dem og hovedpersonen. */
  taler?: string | null;
  kroge: VerdenKroge;
  label: string;
  fpsRef?: MutableRefObject<() => number>;
  /** Kan kaldes for at gå hen til et objekt og undersøge det. */
  gaaTilRef?: MutableRefObject<((id: string) => void) | null>;
  /** Platformbane: knapperne på skærmen og Æselørets hjælp. */
  baneRef?: MutableRefObject<{ styr: (knap: 'venstre' | 'hoejre' | 'hop', nede: boolean) => void; baerOver: () => void } | null>;
};

export function PhaserVerden(props: Props) {
  const beholder = useRef<HTMLDivElement>(null);
  const spil = useRef<Phaser.Game | null>(null);
  const kroge = useRef(props.kroge);
  /** Phaser er først klar, når standardbillederne er indlæst. isBooted bliver sand før det. */
  const klar = useRef(false);
  const laegAvatarInd = useRef<(() => void) | null>(null);
  kroge.current = props.kroge;

  const sceneNoegle = (s: Sted) => (s.bane ? 'bane' : s.kort ? 'kort' : 'verden');
  const aktivNoegle = useRef(sceneNoegle(props.sted));
  const scene = () => spil.current?.scene.getScene(aktivNoegle.current) as VerdenScene | KortScene | BaneScene | undefined;
  const stoerrelse = (noegle: string): [number, number] => (noegle === 'kort' || noegle === 'bane' ? [VIS_B, VIS_H] : [BREDDE, HOEJDE]);
  const sceneData = () => ({ sted: props.sted, aktiv: props.aktiv, aktive: props.aktive, mindreUhygge: props.mindreUhygge, skjulte: props.skjulte, baneKlaret: props.baneKlaret });

  // Opret spillet én gang.
  useEffect(() => {
    if (!beholder.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: beholder.current,
      width: stoerrelse(aktivNoegle.current)[0],
      height: stoerrelse(aktivNoegle.current)[1],
      backgroundColor: '#1f2a44',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      input: { keyboard: { target: beholder.current } },
      disableContextMenu: true,
      banner: false,
      audio: { noAudio: true },
      scene: [],
    });
    game.registry.set('kroge', {
      onInteraktion: (id: string) => kroge.current.onInteraktion(id),
      onNaer: (id: string | null) => kroge.current.onNaer(id),
      onHint: (pos: { x: number; y: number } | null) => kroge.current.onHint?.(pos),
      onHjaelp: (vis: boolean) => kroge.current.onHjaelp?.(vis),
    } satisfies VerdenKroge);
    game.registry.set('avatar', props.avatar);
    const foerste = aktivNoegle.current;
    game.scene.add('verden', VerdenScene, foerste === 'verden', sceneData());
    game.scene.add('kort', KortScene, foerste === 'kort', sceneData());
    game.scene.add('bane', BaneScene, foerste === 'bane', sceneData());
    spil.current = game;
    game.events.once(Phaser.Core.Events.READY, () => {
      klar.current = true;
      laegAvatarInd.current?.();
    });
    if (props.fpsRef) props.fpsRef.current = () => game.loop.actualFps;
    return () => {
      klar.current = false;
      game.destroy(true);
      spil.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skift sted: start scenen forfra.
  const foersteSted = useRef(true);
  useEffect(() => {
    if (foersteSted.current) {
      foersteSted.current = false;
      return;
    }
    const g = spil.current;
    if (!g) return;
    const ny = sceneNoegle(props.sted);
    if (ny !== aktivNoegle.current) {
      g.scene.stop(aktivNoegle.current);
      g.scale.resize(...stoerrelse(ny));
    }
    aktivNoegle.current = ny;
    g.scene.start(ny, sceneData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.stedId, props.mindreUhygge]);

  useEffect(() => {
    scene()?.saetAktiv(props.aktiv);
  }, [props.aktiv]);

  useEffect(() => {
    scene()?.saetAktive(props.aktive ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(props.aktive ?? []).join(',')]);

  useEffect(() => {
    scene()?.saetSkjulte(props.skjulte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.skjulte.join(',')]);

  useEffect(() => {
    const g = spil.current;
    if (!g) return;
    g.registry.set('avatar', props.avatar);
    const s = scene();
    if ((s instanceof KortScene || s instanceof BaneScene) && s.sys.isActive()) s.byggAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.avatar]);

  useEffect(() => {
    scene()?.laas(props.laast);
    if (!props.laast) beholder.current?.focus({ preventScroll: true });
  }, [props.laast]);

  // Avatarbilledet må først lægges ind, når Phaser er klar. Ellers forstyrrer det Phasers egen opstart.
  useEffect(() => {
    laegAvatarInd.current = () => {
      const g = spil.current;
      if (!g) return;
      if (g.textures.exists('avatar')) g.textures.remove('avatar');
      g.textures.addBase64('avatar', props.avatarUri);
    };
    if (klar.current) laegAvatarInd.current();
  }, [props.avatarUri]);

  useEffect(() => {
    if (props.forskraekSignal > 0) scene()?.forskraek();
  }, [props.forskraekSignal]);

  useEffect(() => {
    const s = scene();
    if (s instanceof KortScene && s.sys.isActive()) s.saetTaler(props.taler ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.taler]);

  useEffect(() => {
    if (props.baneRef)
      props.baneRef.current = {
        styr: (knap, nede) => {
          const s = scene();
          if (s instanceof BaneScene) s.styr(knap, nede);
        },
        baerOver: () => {
          const s = scene();
          if (s instanceof BaneScene) s.baerOver();
        },
      };
  });

  useEffect(() => {
    if (props.gaaTilRef) {
      props.gaaTilRef.current = (id: string) => {
        scene()?.gaaTilObjekt(id);
      };
    }
  });

  return (
    <div
      ref={beholder}
      className={props.sted.kort || props.sted.bane ? 'spilflade spilflade-pixel' : 'spilflade'}
      tabIndex={0}
      role="application"
      aria-label={props.label}
      onPointerDown={() => beholder.current?.focus({ preventScroll: true })}
    />
  );
}
