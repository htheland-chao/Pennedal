import type { MutableRefObject } from 'react';
import { t, type Replik } from '../../content';
import type { GemtSpil } from '../../data/gem';
import type { Handling } from '../../engine/film/typer';
import type { PhaserFilm } from '../../game/kort/film';
import { DialogBoks } from '../DialogBoks';
import { Filmbjaelker } from './Filmbjaelker';
import { useFilm } from './useFilm';

type Props = {
  handlinger: Handling[];
  phaser: MutableRefObject<PhaserFilm | null>;
  spilRef: MutableRefObject<GemtSpil>;
  onSaet: (valg: string) => void;
  /** Hvem der taler, så kortet ved, hvem der vipper og har taleboblen. */
  onTaler: (taler: Replik['taler'] | null) => void;
  onFaerdig: () => void;
};

/**
 * En filmsekvens på kortet (20. november 2026): sorte filmbjælker, replikker i den almindelige dialogboks og en
 * synlig knap "Spring over" (også Escape). Ligger over spilfladen. Al tekst er HTML (krav 1), og replikkerne
 * venter altid på "Videre" (krav 5).
 */
export function FilmLag({ handlinger, phaser, spilRef, onSaet, onTaler, onFaerdig }: Props) {
  const { bjaelker, replikker, springOver } = useFilm({ handlinger, phaser, spilRef, onSaet, onFaerdig });
  return (
    <>
      <div className="film" role="region" aria-label={t('film.navn')}>
        <Filmbjaelker vis={bjaelker} />
        {!replikker && (
          <button type="button" className="knap film-spring film-spring-fri" aria-keyshortcuts="Escape" onClick={springOver}>
            {t('film.springOver')} <kbd>{t('film.tast')}</kbd>
          </button>
        )}
      </div>
      {/* Dialogen står uden for .film, som ikke tager imod klik (pointer-events arves, også ind i et <dialog>). */}
      {replikker && <DialogBoks replikker={replikker.replikker} onFaerdig={replikker.faerdig} onTaler={onTaler} film={{ springOver }} />}
    </>
  );
}
