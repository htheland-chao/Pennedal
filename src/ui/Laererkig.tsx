import { useState } from 'react';
import { avatarnavn, hentKapitel, navne, t, type TekstId } from '../content';
import { LAERERKODE } from '../config';
import { lavCsv } from '../engine/csv';
import { FAERDIGHEDER } from '../engine/faerdigheder';
import { gemSpil, hentGemtSpil, sletGemtSpil, type GemtSpil } from '../engine/gem';
import { filnavn, hentFil } from './Gemmekode';

export function Laererkig({ onLuk }: { onLuk: () => void }) {
  const [kode, setKode] = useState('');
  const [aaben, setAaben] = useState(false);
  const [fejl, setFejl] = useState(false);
  const [spil, setSpil] = useState<GemtSpil | null>(() => hentGemtSpil());
  const [besked, setBesked] = useState<string | null>(null);
  const [bekraeft, setBekraeft] = useState(false);

  if (!aaben) {
    return (
      <main className="side smal-side">
        <h1>{t('laerer.titel')}</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (kode.trim() === LAERERKODE) setAaben(true);
            else setFejl(true);
          }}
        >
          <label className="kode-felt">
            {t('laerer.kode')}
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={kode}
              autoFocus
              onChange={(e) => {
                setKode(e.target.value);
                setFejl(false);
              }}
            />
          </label>
          <p className="fejltekst" aria-live="polite">
            {fejl ? t('laerer.forkert') : ''}
          </p>
          <div className="knaprad">
            <button type="button" className="knap" onClick={onLuk}>
              {t('laerer.luk')}
            </button>
            <button type="submit" className="knap knap-primaer">
              {t('laerer.aabn')}
            </button>
          </div>
        </form>
      </main>
    );
  }

  const etiket = (id: string) => t(`faerdighed.${id}` as TekstId);
  const overskrifter = [
    t('laerer.tabel.faerdighed'),
    t('laerer.tabel.niveau'),
    t('laerer.tabel.rigtige'),
    t('laerer.tabel.fejl'),
  ];

  return (
    <main className="side">
      <h1>{t('laerer.titel')}</h1>
      <p>{t('laerer.forklaring')}</p>
      {!spil ? (
        <p>{besked ?? t('laerer.ingen')}</p>
      ) : (
        <>
          <p>
            <strong>{t('laerer.elev')}:</strong> {avatarnavn(spil.avatarnavn)}
          </p>
          <p>
            {t('laerer.fremskridt', {
              kapitel: spil.kapitel,
              trin: Math.min(spil.trin + 1, hentKapitel(spil.kapitel)?.trin.length ?? 0),
              antal: hentKapitel(spil.kapitel)?.trin.length ?? 0,
            })}
          </p>
          <table className="tabel">
            <thead>
              <tr>
                {overskrifter.map((o) => (
                  <th key={o} scope="col">
                    {o}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FAERDIGHEDER.map((id) => {
                const s = spil.faerdigheder[id];
                const oevet = s.rigtigeIForsoeg1 + s.fejl > 0 || s.niveau > 1;
                return (
                  <tr key={id} className={oevet ? '' : 'ikke-oevet'}>
                    <th scope="row">{etiket(id)}</th>
                    {oevet ? (
                      <>
                        <td>{s.niveau}</td>
                        <td>{s.rigtigeIForsoeg1}</td>
                        <td>{s.fejl}</td>
                      </>
                    ) : (
                      <td colSpan={3}>{t('laerer.ikke.oevet')}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="lille-tekst">{t('laerer.note')}</p>
          <div className="knaprad">
            <button
              type="button"
              className="knap"
              onClick={() =>
                hentFil(
                  `pennedal-${filnavn(avatarnavn(spil.avatarnavn))}.csv`,
                  lavCsv(spil, avatarnavn(spil.avatarnavn), etiket, overskrifter),
                  'text/csv;charset=utf-8',
                )
              }
            >
              {t('laerer.csv')}
            </button>
            <button
              type="button"
              className="knap"
              onClick={() => {
                const nyt = {
                  ...spil,
                  avatarnavn: {
                    adjektiv: Math.floor(Math.random() * navne.adjektiver.length),
                    dyr: Math.floor(Math.random() * navne.dyr.length),
                  },
                };
                gemSpil(nyt);
                setSpil(nyt);
                setBesked(t('laerer.nyt.navn.ok', { navn: avatarnavn(nyt.avatarnavn) }));
              }}
            >
              {t('laerer.nyt.navn')}
            </button>
            {!bekraeft ? (
              <button type="button" className="knap knap-fare" onClick={() => setBekraeft(true)}>
                {t('laerer.slet')}
              </button>
            ) : (
              <span className="bekraeft">
                {t('laerer.slet.bekraeft')}{' '}
                <button
                  type="button"
                  className="knap knap-fare"
                  onClick={() => {
                    sletGemtSpil();
                    setSpil(null);
                    setBekraeft(false);
                    setBesked(t('laerer.slettet'));
                  }}
                >
                  {t('laerer.slet.ja')}
                </button>{' '}
                <button type="button" className="knap" onClick={() => setBekraeft(false)} autoFocus>
                  {t('laerer.slet.nej')}
                </button>
              </span>
            )}
          </div>
        </>
      )}
      <p aria-live="polite">{spil ? besked : ''}</p>
      <div className="knaprad">
        <button type="button" className="knap knap-primaer" onClick={onLuk}>
          {t('laerer.luk')}
        </button>
      </div>
    </main>
  );
}
