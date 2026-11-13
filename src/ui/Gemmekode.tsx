import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { hentKapitel, t } from '../content';
import { validerGemtSpil, type GemtSpil } from '../engine/gem';
import { KODE_LAENGDE, laesGemmekode, lavGemmekode } from '../engine/gemmekode';
import { Modal } from './Modal';
import { LaesOpKnap } from './Tekst';

/** Filnavne uden æ, ø og å, så alle browsere gemmer filen med det rigtige navn. */
export function filnavn(tekst: string): string {
  return tekst
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/Æ/g, 'Ae')
    .replace(/Ø/g, 'Oe')
    .replace(/Å/g, 'Aa')
    .replace(/[^A-Za-z0-9-]+/g, '-');
}

export function hentFil(navn: string, indhold: string, type: string) {
  const url = URL.createObjectURL(new Blob([indhold], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = navn;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Hvilken af Fru Fodnotes tre kommentarer koden får. Samme kode giver samme kommentar. */
export function fodnoteNr(kode: string): 1 | 2 | 3 {
  let sum = 0;
  for (const c of kode) sum += c.charCodeAt(0);
  return ((sum % 3) + 1) as 1 | 2 | 3;
}

/**
 * Fru Fodnote kommenterer gemmekoden (docs/historie.md: hun bryder den fjerde væg). Kun når eleven har mødt hende
 * (kapitel 5). Teksten er HTML nederst i vinduet, som hendes fodnoter i spillet.
 */
function FodnoteOmKoden({ kode }: { kode: string }) {
  const tekst = t(`gem.fodnote.${fodnoteNr(kode)}`);
  return (
    <p className="gem-fodnote">
      <span className="gem-fodnote-navn">{t('taler.fodnote')}:</span> {tekst}
      <LaesOpKnap tekst={tekst} figur="fodnote" ikon />
    </p>
  );
}

export function GemmekodeVindue({ spil, del, onLuk }: { spil: GemtSpil; del?: number; onLuk: () => void }) {
  const kode = lavGemmekode(spil);
  const [qr, setQr] = useState<string | null>(null);
  const [kopieret, setKopieret] = useState(false);
  useEffect(() => {
    QRCode.toDataURL(kode, { margin: 1, width: 220, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => setQr(null));
  }, [kode]);
  return (
    <Modal titel={t('gem.titel')} onLuk={onLuk}>
      {del !== undefined && <p className="stor-ros">{t('gem.del.slut', { nr: del })}</p>}
      <h2>{t('gem.titel')}</h2>
      <p>{t('gem.forklaring')}</p>
      <p className="gemmekode" data-gemmekode={kode}>
        {/* Hver gruppe på fire tegn holdes samlet, så koden aldrig deles midt i en gruppe. Teksten er den samme som koden. */}
        {kode.split('-').map((gruppe, i, alle) => (
          <span key={i} className="kode-gruppe">
            {i < alle.length - 1 ? `${gruppe}-` : gruppe}
          </span>
        ))}
      </p>
      {qr && <img className="qr" src={qr} alt={t('gem.qr')} width={220} height={220} />}
      {spil.kapitel >= 5 && <FodnoteOmKoden kode={kode} />}
      <div className="knaprad">
        <button
          type="button"
          className="knap"
          onClick={() => {
            navigator.clipboard
              ?.writeText(kode)
              .then(() => setKopieret(true))
              .catch(() => setKopieret(false));
          }}
        >
          {t('gem.kopier')}
        </button>
        <button
          type="button"
          className="knap"
          onClick={() => hentFil('pennedal-gemt.json', JSON.stringify(spil, null, 2), 'application/json')}
        >
          {t('gem.fil')}
        </button>
        <button type="button" className="knap knap-primaer" onClick={onLuk} autoFocus>
          {t('gem.videre')}
        </button>
      </div>
      <p aria-live="polite" className="lille-tekst">
        {kopieret ? t('gem.kopieret') : ''}
      </p>
    </Modal>
  );
}

export function IndlaesSide({ onIndlaest, onTilbage }: { onIndlaest: (s: GemtSpil) => void; onTilbage: () => void }) {
  const [kode, setKode] = useState('');
  const [fejl, setFejl] = useState<string | null>(null);
  const filRef = useRef<HTMLInputElement>(null);

  function indlaes() {
    const r = laesGemmekode(kode, (k) => hentKapitel(k)?.trin.length ?? -1);
    if (r.ok) return onIndlaest(r.spil);
    if (r.fejl === 'laengde') setFejl(t('gem.fejl.laengde', { laengde: KODE_LAENGDE, antal: r.antal }));
    else if (r.fejl === 'tegn') setFejl(t('gem.fejl.tegn', { tegn: r.tegn }));
    else if (r.fejl === 'kontrol') setFejl(t('gem.fejl.kontrol'));
    else setFejl(t('gem.fejl.indhold'));
  }

  return (
    <main className="side smal-side">
      <h1>{t('gem.indlaes.titel')}</h1>
      <p>{t('gem.indlaes.forklaring')}</p>
      <label className="kode-felt">
        {t('gem.indlaes.felt')}
        <input
          value={kode}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          aria-describedby="kode-fejl"
          onChange={(e) => {
            setKode(e.target.value);
            setFejl(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') indlaes();
          }}
        />
      </label>
      <p id="kode-fejl" className="fejltekst" aria-live="polite">
        {fejl}
      </p>
      <div className="knaprad">
        <button type="button" className="knap" onClick={onTilbage}>
          {t('gem.indlaes.tilbage')}
        </button>
        <button type="button" className="knap" onClick={() => filRef.current?.click()}>
          {t('gem.indlaes.fil')}
        </button>
        <button type="button" className="knap knap-primaer" onClick={indlaes}>
          {t('gem.indlaes.knap')}
        </button>
      </div>
      <input
        ref={filRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const fil = e.target.files?.[0];
          if (!fil) return;
          try {
            const spil = validerGemtSpil(JSON.parse(await fil.text()));
            if (spil) onIndlaest(spil);
            else setFejl(t('gem.fejl.fil'));
          } catch {
            setFejl(t('gem.fejl.fil'));
          }
        }}
      />
    </main>
  );
}
