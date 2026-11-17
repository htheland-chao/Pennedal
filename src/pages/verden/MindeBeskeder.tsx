import { useCallback } from 'react';
import { t } from '../../content';
import { mindeTitel, type MindeId } from '../../content/minder';
import { ALLE_SKAAR } from '../../engine/betingelse';
import { Kvittering } from '../../components/Kvittering';
import { Tilbageblik } from '../../components/Tilbageblik';

type Props = {
  /** Et nyt hukommelsesskår med sit minde. */
  skaarMinde: MindeId | null;
  /** Et nyt frivilligt minde fra en dialog (Henrik, 8. november 2026). */
  nytMinde: MindeId | null;
  /** Mindet, der vises lige nu. */
  vist: MindeId | null;
  antalSkaar: number;
  /** Beskederne venter, mens et trin eller en dialog er i gang. */
  kanVise: { skaar: boolean; minde: boolean };
  setSkaarMinde: (m: MindeId | null) => void;
  setNytMinde: (m: MindeId | null) => void;
  setVist: (m: MindeId | null) => void;
};

/**
 * Beskeder om nye minder og skår, og selve tilbageblikket, når eleven vælger at se det.
 * Delt ud af Verden.tsx 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function MindeBeskeder({ skaarMinde, nytMinde, vist, antalSkaar, kanVise, setSkaarMinde, setNytMinde, setVist }: Props) {
  const skjulSkaar = useCallback(() => setSkaarMinde(null), [setSkaarMinde]);
  const skjulMinde = useCallback(() => setNytMinde(null), [setNytMinde]);
  return (
    <>
      {skaarMinde && kanVise.skaar && (
        <Kvittering
          tekst={`${t('skaar.fundet', { titel: mindeTitel(skaarMinde), antal: antalSkaar, ialt: ALLE_SKAAR.length })}${
            antalSkaar === 1 ? ` ${t('skaar.forklaring')}` : ''
          }`}
          onSkjul={skjulSkaar}
          luk={t('kvittering.luk')}
          handling={{ tekst: t('minde.se.nu'), onKlik: () => { setVist(skaarMinde); setSkaarMinde(null); } }}
        />
      )}
      {nytMinde && kanVise.minde && (
        <Kvittering
          tekst={t('minde.nyt', { titel: mindeTitel(nytMinde) })}
          onSkjul={skjulMinde}
          luk={t('kvittering.luk')}
          handling={{ tekst: t('minde.se.nu'), onKlik: () => { setVist(nytMinde); setNytMinde(null); } }}
        />
      )}
      {vist && <Tilbageblik id={vist} onFaerdig={() => setVist(null)} />}
    </>
  );
}
