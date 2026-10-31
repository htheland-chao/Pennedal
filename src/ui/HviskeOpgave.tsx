import { useState } from 'react';
import { t } from '../content';
import { tjekHviske, visHviske, type HviskeOpgave as Opgave } from '../mechanics/hviske';
import { useApp } from './Kontekst';
import { lydUrl, useLydManifest } from './lyd';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap, useStemmeFindes } from './Tekst';

export function HviskeOpgave({ opgave, api }: { opgave: Opgave; api: OpgaveApi }) {
  const [svar, setSvar] = useState<string[]>(() => opgave.huller.map(() => ''));
  const [helt, setHelt] = useState('');
  const { indstillinger } = useApp();
  const { manifest } = useLydManifest();
  const visning = visHviske(opgave);
  const { ord, form } = opgave;
  // Kan eleven høre ordet? Enten et indtalt klip eller computerens egen stemme.
  const harKlip = indstillinger.indtalt && lydUrl(manifest, 'ord', ord.ord) !== null;
  const stemme = useStemmeFindes() || harKlip;

  const instruks =
    form === 'vaelg3' || form === 'vaelg5'
      ? t('hviske.instruks.vaelg')
      : form === 'skriv1'
        ? t('hviske.instruks.skriv')
        : form === 'skriv2'
          ? t('hviske.instruks.to')
          : t('hviske.instruks.helt');

  function send(valg?: string) {
    const besvarelse = valg !== undefined ? [valg] : form === 'helt' ? [helt] : svar;
    api.tjek(tjekHviske(opgave, besvarelse));
  }

  // Ordet i sætningen skjules, så sætningen ikke afslører stavemåden.
  const re = new RegExp(`(^|[^a-zæøåA-ZÆØÅ])(${ord.ord})(?=[^a-zæøåA-ZÆØÅ]|$)`, 'i');
  const m = re.exec(ord.saetning);
  const foer = m ? ord.saetning.slice(0, m.index + m[1].length) : ord.saetning;
  const efter = m ? ord.saetning.slice(m.index + m[0].length) : '';
  const ordVist = api.loest ? ord.ord : visning.map((b) => b ?? '_').join('');
  // Står ordet først i sætningen, skal det have stort begyndelsesbogstav.
  const stortI = !!m && m[2][0] !== m[2][0].toLocaleLowerCase('da-DK');
  const medStort = (x: string) => (stortI ? x.charAt(0).toLocaleUpperCase('da-DK') + x.slice(1) : x);
  const ordSkjult = form === 'helt' && !api.loest ? '_____' : medStort(ordVist);

  let hulNr = 0;
  return (
    <div className="hviske">
      <p className="instruks">{instruks}</p>
      <LaesOpKnap
        auto
        dele={[
          { tekst: instruks, figur: 'fortaeller' },
          { tekst: ord.ord, figur: 'ord' },
        ]}
      />
      <div className="hviske-billede" aria-hidden="true">
        {ord.billede}
      </div>
      <p className="hviske-saetning">
        {foer}
        <span className="hviske-ord-i-saetning">{ordSkjult}</span>
        {efter}
      </p>
      <LaesOpKnap tekst={ord.ord} etiket={t('hviske.hoer')} figur="ord" />
      {form === 'helt' && !stemme && !api.loest && (
        <p className="lille-tekst">
          {t('hviske.ingen.stemme', { bogstaver: [...ord.ord].sort().join(', ') })}
        </p>
      )}

      {form !== 'helt' && (
        <div className={`hviske-ord ${api.loest ? 'hviske-loest' : ''}`} aria-label={ordVist}>
          {visning.map((b, i) => {
            if (b !== null || api.loest) {
              return (
                <span key={i} className={`bogstav ${i === ord.stumt && api.loest ? 'bogstav-stumt' : ''}`}>
                  {api.loest ? ord.ord[i] : b}
                </span>
              );
            }
            const nr = hulNr++;
            if (form === 'vaelg3' || form === 'vaelg5') {
              return (
                <span key={i} className="bogstav bogstav-hul">
                  _
                </span>
              );
            }
            return (
              <input
                key={i}
                className="bogstav-felt"
                aria-label={opgave.huller.length > 1 ? t('hviske.felt.bogstav.nr', { nr: nr + 1 }) : t('hviske.felt.bogstav')}
                maxLength={1}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                disabled={api.laast}
                autoFocus={nr === 0}
                value={svar[nr]}
                onChange={(e) => {
                  const nyt = [...svar];
                  nyt[nr] = e.target.value.slice(-1);
                  setSvar(nyt);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
              />
            );
          })}
        </div>
      )}

      {(form === 'vaelg3' || form === 'vaelg5') && !api.loest && (
        <div className="bogstav-valg" role="group" aria-label={t('hviske.instruks.vaelg')}>
          {opgave.valg.map((b) => (
            <button key={b} type="button" className="knap bogstav-knap" disabled={api.laast} onClick={() => send(b)}>
              {b}
            </button>
          ))}
        </div>
      )}

      {form === 'helt' && !api.loest && (
        <label className="helt-felt">
          {t('hviske.felt.ord')}
          <input
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={api.laast}
            autoFocus
            value={helt}
            onChange={(e) => setHelt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send();
            }}
          />
        </label>
      )}

      {(form === 'skriv1' || form === 'skriv2' || form === 'helt') && !api.loest && (
        <div className="knaprad">
          <button type="button" className="knap knap-primaer" disabled={api.laast} onClick={() => send()}>
            {t('opgave.tjek')}
          </button>
        </div>
      )}
      {api.loest && (
        <p className="hviske-loest-tekst" aria-hidden="true">
          ✨ {ord.saetning}
        </p>
      )}
    </div>
  );
}
