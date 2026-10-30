import Phaser from 'phaser';
import { useEffect, useRef, type MutableRefObject } from 'react';
import type { Sted } from '../content';
import type { Avatar } from '../engine/gem';
import { KortScene } from './KortScene';
import { BREDDE, HOEJDE } from './tegn';
import { VerdenScene, type VerdenKroge } from './VerdenScene';

type Props = {
  stedId: string;
  sted: Sted;
  aktiv: string | null;
  avatarUri: string;
  /** Bruges til hovedpersonen i pixelgrafik på steder med kort. */
  avatar: Avatar;
  /** Objekter, der ikke vises lige nu. */
  skjulte: string[];
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

  const sceneNoegle = (s: Sted) => (s.kort ? 'kort' : 'verden');
  const aktivNoegle = useRef(sceneNoegle(props.sted));
  const scene = () => spil.current?.scene.getScene(aktivNoegle.current) as VerdenScene | KortScene | undefined;
  const sceneData = () => ({ sted: props.sted, aktiv: props.aktiv, mindreUhygge: props.mindreUhygge, skjulte: props.skjulte });

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
    game.registry.set('avatar', props.avatar);
    const foerste = aktivNoegle.current;
    game.scene.add('verden', VerdenScene, foerste === 'verden', sceneData());
    game.scene.add('kort', KortScene, foerste === 'kort', sceneData());
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
    if (ny !== aktivNoegle.current) g.scene.stop(aktivNoegle.current);
    aktivNoegle.current = ny;
    g.scene.start(ny, sceneData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.stedId, props.mindreUhygge]);

  useEffect(() => {
    scene()?.saetAktiv(props.aktiv);
  }, [props.aktiv]);

  useEffect(() => {
    scene()?.saetSkjulte(props.skjulte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.skjulte.join(',')]);

  useEffect(() => {
    const g = spil.current;
    if (!g) return;
    g.registry.set('avatar', props.avatar);
    const s = scene();
    if (s instanceof KortScene && s.sys.isActive()) s.byggAvatar();
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
    if (props.gaaTilRef) {
      props.gaaTilRef.current = (id: string) => {
        scene()?.gaaTilObjekt(id);
      };
    }
  });

  return (
    <div
      ref={beholder}
      className={props.sted.kort ? 'spilflade spilflade-pixel' : 'spilflade'}
      tabIndex={0}
      role="application"
      aria-label={props.label}
      onPointerDown={() => beholder.current?.focus({ preventScroll: true })}
    />
  );
}
