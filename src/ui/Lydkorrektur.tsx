import { useEffect, useState } from 'react';
import { t, type TekstId } from '../content';
import { type LydFil, lydUrlForFil, spilLyd, stopLyd, useLydManifest } from './lyd';

/** Side til Henrik: lyt alle lydklip igennem og find nøglen på et klip, der skal laves om. Åbnes med ?lyd=1. */
export function Lydkorrektur() {
  const { manifest, klar } = useLydManifest();
  const [spiller, setSpiller] = useState<string | null>(null);
  const [kopieret, setKopieret] = useState<string | null>(null);
  useEffect(() => () => stopLyd(), []);

  if (!klar) {
    return (
      <main className="lydkorrektur">
        <p>{t('lyd.henter')}</p>
      </main>
    );
  }

  const filer = manifest ? Object.entries(manifest.filer) : [];
  const grupper = new Map<string, [string, LydFil][]>();
  for (const post of filer) {
    const liste = grupper.get(post[1].figur) ?? [];
    liste.push(post);
    grupper.set(post[1].figur, liste);
  }
  const navn = (figur: string) => (figur === 'ord' ? t('lyd.figur.ord') : t(`taler.${figur}` as TekstId));

  const afspil = (noegle: string, fil: string) => {
    if (spiller === noegle) {
      stopLyd();
      setSpiller(null);
      return;
    }
    setSpiller(noegle);
    spilLyd(lydUrlForFil(fil), 100, () => setSpiller((s) => (s === noegle ? null : s)));
  };

  const kopier = (noegle: string) => {
    navigator.clipboard
      ?.writeText(noegle)
      .then(() => setKopieret(noegle))
      .catch(() => setKopieret(null));
  };

  return (
    <main className="lydkorrektur">
      <h1>{t('lyd.titel')}</h1>
      <p>{t('lyd.intro')}</p>
      <p>
        <strong>{t('lyd.status', { lavet: filer.length, i_alt: manifest?.i_alt ?? filer.length })}</strong>
      </p>
      {filer.length === 0 && <p>{t('lyd.ingen')}</p>}
      {[...grupper].map(([figur, liste]) => (
        <section key={figur}>
          <h2>{navn(figur)}</h2>
          <ul className="lydliste">
            {liste.map(([noegle, f]) => (
              <li key={noegle}>
                <button type="button" className="knap knap-lille" aria-pressed={spiller === noegle} onClick={() => afspil(noegle, f.fil)}>
                  {spiller === noegle ? t('lyd.stop') : t('lyd.afspil')}
                </button>
                <span className="lydliste-tekst">{f.tekst}</span>
                <code className="lydliste-noegle">{noegle}</code>
                <button type="button" className="knap knap-lille" onClick={() => kopier(noegle)}>
                  {kopieret === noegle ? t('lyd.kopieret') : t('lyd.kopier')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p>
        <a href="./">{t('lyd.tilbage')}</a>
      </p>
    </main>
  );
}
