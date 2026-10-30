import Phaser from 'phaser';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Sted } from '../content';
import { BREDDE, HOEJDE } from './tegn';
import { VerdenScene, type VerdenKroge } from './VerdenScene';

type Props = {
  stedId: string;
  sted: Sted;
  aktiv: string | null;
  avatarUri: string;
  laast: boolean;
  mindreUhygge: boolean;
  forskraekSignal: number;
  kroge: VerdenKroge;
  label: string;
  fpsRef?: MutableRefObject<() => number>;
  /** Kan kaldes for at gå hen til et objekt og undersøge det. */
  gaaTilRef?: MutableRefObject<((id: string) => void) | null>;
};

export function PhaserVerden(props: Props) {
  const beholder = useRef<HTMLDivElement>(null);
  const spil = useRef<Phaser.Game | null>(null);
  const kroge = useRef(props.kroge);
  /** Phaser er først klar, når standardbillederne er indlæst. isBooted bliver sand før det. */
  const klar = useRef(false);
  const laegAvatarInd = useRef<(() => void) | null>(null);
  kroge.current = props.kroge;

  const scene = () => spil.current?.scene.getScene('verden') as VerdenScene | undefined;

  // Opret spillet én gang.
  useEffect(() => {
    if (!beholder.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: beholder.current,
      width: BREDDE,
      height: HOEJDE,
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
    } satisfies VerdenKroge);
    game.scene.add('verden', VerdenScene, true, {
      sted: props.sted,
      aktiv: props.aktiv,
      mindreUhygge: props.mindreUhygge,
    });
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
    spil.current?.scene.start('verden', { sted: props.sted, aktiv: props.aktiv, mindreUhygge: props.mindreUhygge });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.stedId, props.mindreUhygge]);

  useEffect(() => {
    scene()?.saetAktiv(props.aktiv);
  }, [props.aktiv]);

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
    if (props.gaaTilRef) {
      props.gaaTilRef.current = (id: string) => {
        const o = props.sted.objekter.find((x) => x.id === id);
        if (o) scene()?.gaaTil(o.x, o.y + o.h / 2 + 30, true);
      };
    }
  });

  return (
    <div
      ref={beholder}
      className="spilflade"
      tabIndex={0}
      role="application"
      aria-label={props.label}
      onPointerDown={() => beholder.current?.focus({ preventScroll: true })}
    />
  );
}
