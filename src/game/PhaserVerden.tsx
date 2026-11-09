import Phaser from 'phaser';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Sted } from '../content';
import type { Avatar } from '../engine/gem';
import { BaneScene } from './BaneScene';
import { KortScene, SKALA, VIS_B, VIS_H } from './KortScene';
import type { VerdenKroge } from './typer';

type Props = {
  stedId: string;
  sted: Sted;
  aktiv: string | null;
  /** Platformbane: målet er nået, så hovedpersonen starter ved målet. */
  baneKlaret?: boolean;
  /** Escape room: alt, der kan undersøges. */
  aktive?: string[];
  /** Hovedpersonen i pixelgrafik. */
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
  kroge.current = props.kroge;

  const sceneNoegle = (s: Sted) => (s.bane ? 'bane' : 'kort');
  const aktivNoegle = useRef(sceneNoegle(props.sted));
  const scene = () => spil.current?.scene.getScene(aktivNoegle.current) as KortScene | BaneScene | undefined;
  const stoerrelse = (): [number, number] => [VIS_B * SKALA, VIS_H * SKALA];
  const sceneData = () => ({ sted: props.sted, aktiv: props.aktiv, aktive: props.aktive, mindreUhygge: props.mindreUhygge, skjulte: props.skjulte, baneKlaret: props.baneKlaret });

  // Opret spillet én gang.
  useEffect(() => {
    if (!beholder.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: beholder.current,
      width: stoerrelse()[0],
      height: stoerrelse()[1],
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
    game.scene.add('kort', KortScene, foerste === 'kort', sceneData());
    game.scene.add('bane', BaneScene, foerste === 'bane', sceneData());
    spil.current = game;
    if (props.fpsRef) props.fpsRef.current = () => game.loop.actualFps;
    return () => {
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
    if (ny !== aktivNoegle.current) g.scene.stop(aktivNoegle.current);
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
      className="spilflade spilflade-pixel"
      tabIndex={0}
      role="application"
      aria-label={props.label}
      onPointerDown={() => beholder.current?.focus({ preventScroll: true })}
    />
  );
}
