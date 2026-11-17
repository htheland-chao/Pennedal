import { t, type TekstId } from '../../content';
import { kanBrugeEvne, KRUMMER_LIV, stortSlagKlar, type EvneId, type HjaelperId, type Kamp, type KampTingId, type MedlemId, type Slag } from '../../mechanics/kampmotor';
import { piletaster } from './tilgaengelighed';
import type { Visning } from './visning';

type Props = {
  visning: Visning;
  kamp: Kamp;
  slagListe: readonly Slag[];
  hjaelpere: HjaelperId[];
  /** Væsnernes navne (nummereret, hvis der er flere af samme slags). */
  navne: string[];
  medlemNavn: (id: MedlemId) => string;
  /** Et væsen varsler et stort angreb: Forsvar fremhæves. */
  stortVarslet: boolean;
  setVisning: (v: Visning) => void;
  /** Peg på et væsen (markøren over det). */
  setPeg: (nr: number) => void;
  onForsvar: () => void;
  onGaaVaek: () => void;
  vaelgSlag: (slag: Slag, stort: boolean) => void;
  startOpgave: (slag: Slag, stort: boolean, fjende: number) => void;
  lyt: (fjende: number) => void;
  evneIMenu: (evne: EvneId, v?: { hvem?: MedlemId; fjende?: number }) => void;
  ting: (id: KampTingId, fjende?: number) => void;
};

/**
 * Kampens menu nederst: Slå, Lyt, Forsvar, Hjælpere og Taske, og valgene under dem.
 * Delt ud af KampVindue.tsx 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function KampMenu({ visning, kamp, slagListe, hjaelpere, navne, medlemNavn, stortVarslet, setVisning, setPeg, onForsvar, onGaaVaek, vaelgSlag, startOpgave, lyt, evneIMenu, ting }: Props) {
  const tilbage = (
    <button type="button" className="knap knap-diskret" onClick={() => setVisning({ type: 'menu' })}>
      {t('kamp.tilbage')}
    </button>
  );

  const fjendeKnapper = (handling: (nr: number) => void, kun?: (nr: number) => boolean) => (
    <div className="kamp-menu" onKeyDown={piletaster}>
      {kamp.fjender.map((f, i) =>
        f.liv > 0 && (!kun || kun(f.nr)) ? (
          <button
            key={f.nr}
            type="button"
            className="knap"
            autoFocus={i === kamp.fjender.findIndex((x) => x.liv > 0)}
            onClick={() => handling(f.nr)}
            onFocus={() => setPeg(f.nr)}
            onMouseEnter={() => setPeg(f.nr)}
          >
            {navne[f.nr]}
          </button>
        ) : null,
      )}
      {tilbage}
    </div>
  );

  if (visning.type === 'menu')
    return (
      <fieldset className="kamp-menu kamp-hovedmenu" onKeyDown={piletaster}>
        <legend className="sr-only">{t('kamp.hvad')}</legend>
        <button type="button" className="knap knap-primaer" onClick={() => setVisning({ type: 'slag' })} autoFocus>
          {t('kamp.menu.slaa')}
        </button>
        <button type="button" className="knap" onClick={() => setVisning({ type: 'lyt' })}>
          {t('kamp.lyt')}
        </button>
        <button type="button" className={`knap${stortVarslet ? ' knap-fremhaev' : ''}`} onClick={onForsvar}>
          {t('kamp.menu.forsvar')}
        </button>
        <button type="button" className="knap" onClick={() => setVisning({ type: 'hjaelper' })} disabled={hjaelpere.length === 0}>
          {t('kamp.menu.hjaelpere')}
        </button>
        <button type="button" className="knap" onClick={() => setVisning({ type: 'taske' })}>
          {t('kamp.menu.taske')}
        </button>
        <button type="button" className="knap knap-diskret" onClick={onGaaVaek}>
          {t('kamp.gaa')}
        </button>
      </fieldset>
    );
  if (visning.type === 'slag')
    return (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.slag.hvad')}</legend>
        {slagListe.map((s, i) => (
          <button key={s} type="button" className="knap" onClick={() => vaelgSlag(s, false)} autoFocus={i === 0}>
            {t(`kamp.slag.${s}` as TekstId)}
          </button>
        ))}
        {stortSlagKlar(kamp) &&
          slagListe.map((s) => (
            <button key={`stort-${s}`} type="button" className="knap knap-primaer kamp-stort" onClick={() => vaelgSlag(s, true)}>
              {t('kamp.slag.stort', { slag: t(`kamp.slag.${s}` as TekstId) })}
            </button>
          ))}
        {tilbage}
      </fieldset>
    );
  if (visning.type === 'maal')
    return (
      <div>
        <p className="kamp-spoergsmaal">{t('kamp.maal.hvem')}</p>
        {fjendeKnapper((nr) => startOpgave(visning.slag, visning.stort, nr))}
      </div>
    );
  if (visning.type === 'lyt')
    return (
      <div>
        <p className="kamp-spoergsmaal">{t('kamp.maal.lyt')}</p>
        {fjendeKnapper(lyt)}
      </div>
    );
  if (visning.type === 'hjaelper') {
    const evner: EvneId[] = [
      ...(hjaelpere.includes('aeseloere') ? (['lap'] as const) : []),
      ...(hjaelpere.includes('vims') ? (['visk', 'slet'] as const) : []),
      ...(hjaelpere.includes('klatten') ? (['skjul'] as const) : []),
    ];
    return (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.menu.hjaelpere')}</legend>
        {evner.map((e, i) => (
          <button
            key={e}
            type="button"
            className="knap"
            autoFocus={i === 0}
            disabled={!kanBrugeEvne(kamp, e)}
            onClick={() => (e === 'lap' ? setVisning({ type: 'lap' }) : e === 'slet' ? setVisning({ type: 'slet' }) : evneIMenu(e))}
          >
            {t(`kamp.evne.${e}` as TekstId, { antal: kamp.evner[e] ?? 0 })}
          </button>
        ))}
        {tilbage}
      </fieldset>
    );
  }
  if (visning.type === 'lap')
    return (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.lap.hvem')}</legend>
        {kamp.hold.map((m, i) => (
          <button key={m.id} type="button" className="knap" autoFocus={i === 0} disabled={m.liv >= m.maks} onClick={() => evneIMenu('lap', { hvem: m.id })}>
            {t('kamp.medlem.liv', { navn: medlemNavn(m.id), liv: m.liv, maks: m.maks })}
          </button>
        ))}
        {tilbage}
      </fieldset>
    );
  if (visning.type === 'slet')
    return (
      <div>
        <p className="kamp-spoergsmaal">{t('kamp.slet.hvem')}</p>
        {fjendeKnapper((nr) => evneIMenu('slet', { fjende: nr }), (nr) => !!kamp.fjender[nr].varsel)}
      </div>
    );
  if (visning.type === 'taske') {
    const tilgaengelige = (Object.keys(kamp.ting) as KampTingId[]).filter((x) => kamp.ting[x]);
    return (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.menu.taske')}</legend>
        {tilgaengelige.length === 0 && <p className="lille-tekst">{t('kamp.ting.ingen')}</p>}
        {tilgaengelige.map((x, i) => (
          <button key={x} type="button" className="knap" autoFocus={i === 0} onClick={() => (x === 'punktum' ? setVisning({ type: 'punktum' }) : ting(x))}>
            {t(`kamp.ting.${x}` as TekstId, { liv: KRUMMER_LIV })}
          </button>
        ))}
        {tilbage}
      </fieldset>
    );
  }
  if (visning.type === 'punktum')
    return (
      <div>
        <p className="kamp-spoergsmaal">{t('kamp.punktum.hvem')}</p>
        {fjendeKnapper((nr) => ting('punktum', nr))}
      </div>
    );
  return null;
}
