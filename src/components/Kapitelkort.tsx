import { t, type Kapitel } from '../content';
import { ALLE_SKAAR } from '../engine/betingelse';
import { Modal } from './Modal';
import { LaesOpKnap, type Del } from './Tekst';

/** Det, fortælleren læser op på titelkortet. Teksterne skal stå sådan i scripts/lydtekster.mjs. */
export function kapitelkortDele(kapitel: Kapitel, naeste?: string): Del[] {
  const dele: Del[] = [
    { tekst: `${t('kapitelkort.kapitel', { nr: kapitel.kapitel })}. ${kapitel.titel}.`, figur: 'fortaeller' },
    { tekst: kapitel.maal, figur: 'fortaeller' },
  ];
  if (naeste) dele.push({ tekst: naeste, figur: 'fortaeller' });
  return dele;
}

/**
 * Titelkortet (Henrik, 10. november 2026): når et kapitel begynder, står kapitlets navn og mål på skærmen,
 * så eleven ved, hvad der er på spil. Når man fortsætter et spil, viser det samme kort "Sidst i Pennedal":
 * kapitlet, målet, det næste, man skal gøre, og hvor mange skår man har. Godt, når klassen spiller én gang om ugen.
 * Al tekst er HTML, og kortet kan altid lukkes.
 */
export function Kapitelkort({
  kapitel,
  fortsat,
  naeste,
  skaar,
  onVidere,
}: {
  kapitel: Kapitel;
  fortsat: boolean;
  naeste?: string;
  skaar: number;
  onVidere: () => void;
}) {
  return (
    <Modal titel={fortsat ? t('kapitelkort.sidst') : t('kapitelkort.titel')} onLuk={onVidere} klasse={`kapitelkort${fortsat ? ' fortsat' : ''}`}>
      {fortsat && <p className="kapitelkort-sidst">{t('kapitelkort.sidst')}</p>}
      <p className="kapitelkort-nr">{t('kapitelkort.kapitel', { nr: kapitel.kapitel })}</p>
      <h2 className="kapitelkort-titel">{kapitel.titel}</h2>
      <div className="kapitelkort-blok">
        <h3>{t('kapitelkort.maal')}</h3>
        <p>{kapitel.maal}</p>
      </div>
      {fortsat && naeste && (
        <div className="kapitelkort-blok">
          <h3>{t('kapitelkort.naeste')}</h3>
          <p>{naeste}</p>
        </div>
      )}
      {fortsat && skaar > 0 && <p className="skaar-taeller">{t('minder.skaar', { antal: skaar, ialt: ALLE_SKAAR.length })}</p>}
      <div className="knaprad">
        <LaesOpKnap auto dele={kapitelkortDele(kapitel, fortsat ? naeste : undefined)} />
        <button type="button" className="knap knap-primaer" autoFocus onClick={onVidere}>
          {fortsat ? t('kapitelkort.fortsaet') : t('kapitelkort.begynd')}
        </button>
      </div>
    </Modal>
  );
}
