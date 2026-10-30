import { useRef, useState } from 'react';
import { historiebro, ogorm, stumme, t, type BevisjagtTrin, type OpgaveTrin } from '../content';
import type { Haendelse, Niveau } from '../engine/tilpasning';
import { lavHviskeOpgave, type HviskeOpgave as HOpgave } from '../mechanics/hviske';
import { vaelgOgTekst } from '../mechanics/ogorm';
import { lavBro } from '../mechanics/historiebro';
import { OpgaveRamme } from '../ui/OpgaveRamme';
import { HviskeOpgave } from '../ui/HviskeOpgave';
import { OgormOpgave } from '../ui/OgormOpgave';
import { BroOpgave } from '../ui/BroOpgave';
import { Bevisjagt, Forforstaaelse } from '../ui/Bevisjagt';
import { Modal } from '../ui/Modal';

type Faelles = {
  niveau: Niveau;
  loeste: number;
  onSvar: (rigtigt: boolean, forsoeg: number) => Haendelse;
  onLoest: (info?: { ord?: string; historie?: boolean }) => void;
  onPause: () => void;
};

/** Ord og tekster, der er brugt i denne session, så de ikke kommer igen med det samme. */
const brugt = { hviske: [] as string[], og: [] as string[], bro: [] as string[] };

function husk(liste: string[], id: string, maks = 8) {
  liste.push(id);
  if (liste.length > maks) liste.shift();
}

function HviskeVindue({ trin, niveau, loeste, onSvar, onLoest, onPause }: Faelles & { trin: OpgaveTrin }) {
  const [emne, setEmne] = useState<HOpgave>(() => lavHviskeOpgave(stumme.ord, niveau, Math.random, brugt.hviske));
  const niveauRef = useRef(niveau);
  niveauRef.current = niveau;
  const eksempler = stumme.ord
    .filter((o) => o.type === emne.ord.type && o.ord !== emne.ord.ord && o.svaerhed === 1)
    .slice(0, 3)
    .map((o) => o.ord)
    .join(', ');
  return (
    <OpgaveRamme
      titel={t('hviske.titel')}
      antal={trin.antal}
      loeste={loeste}
      regel={stumme.regler[emne.ord.type]}
      eksempel={t('hviske.eksempel', { ord: eksempler })}
      andreRegler={Object.values(stumme.regler)}
      onSvar={onSvar}
      onPause={onPause}
      onLoest={() => {
        husk(brugt.hviske, emne.ord.ord);
        onLoest({ ord: emne.ord.ord });
        setEmne(lavHviskeOpgave(stumme.ord, niveauRef.current, Math.random, brugt.hviske));
      }}
    >
      {(api) => <HviskeOpgave key={`${emne.ord.ord}-${loeste}`} opgave={emne} api={api} />}
    </OpgaveRamme>
  );
}

function OgormVindue({ trin, niveau, loeste, onSvar, onLoest, onPause }: Faelles & { trin: OpgaveTrin }) {
  const [tekst, setTekst] = useState(() => vaelgOgTekst(ogorm.tekster, niveau, Math.random, brugt.og));
  const niveauRef = useRef(niveau);
  niveauRef.current = niveau;
  return (
    <OpgaveRamme
      titel={t('ogorm.titel')}
      antal={trin.antal}
      loeste={loeste}
      regel={t('ogorm.regel')}
      eksempel={t('ogorm.eksempel')}
      andreRegler={[t('bro.regel'), t('bevisjagt.regel')]}
      onSvar={onSvar}
      onPause={onPause}
      onLoest={() => {
        husk(brugt.og, tekst.id);
        onLoest();
        setTekst(vaelgOgTekst(ogorm.tekster, niveauRef.current, Math.random, brugt.og));
      }}
    >
      {(api) => <OgormOpgave key={`${tekst.id}-${loeste}`} tekst={tekst} api={api} />}
    </OpgaveRamme>
  );
}

function BroVindue({ trin, niveau, loeste, onSvar, onLoest, onPause }: Faelles & { trin: OpgaveTrin }) {
  const [bro, setBro] = useState(() => lavBro(historiebro.historier, niveau, Math.random, brugt.bro));
  const niveauRef = useRef(niveau);
  niveauRef.current = niveau;
  return (
    <OpgaveRamme
      titel={t('bro.titel')}
      antal={trin.antal}
      loeste={loeste}
      regel={t('bro.regel')}
      eksempel={t('bro.eksempel')}
      andreRegler={[t('ogorm.regel'), t('bevisjagt.regel')]}
      onSvar={onSvar}
      onPause={onPause}
      onLoest={() => {
        husk(brugt.bro, bro.historie.id, 2);
        onLoest({ historie: true });
        setBro(lavBro(historiebro.historier, niveauRef.current, Math.random, brugt.bro));
      }}
    >
      {(api) => <BroOpgave key={`${bro.historie.id}-${loeste}`} bro={bro} api={api} />}
    </OpgaveRamme>
  );
}

export function OpgaveVindue(props: Faelles & { trin: OpgaveTrin }) {
  if (props.trin.mekanik === 'hviske') return <HviskeVindue {...props} />;
  if (props.trin.mekanik === 'ogorm') return <OgormVindue {...props} />;
  return <BroVindue {...props} />;
}

export function BevisjagtVindue({
  trin,
  loeste,
  onSvar,
  onLoest,
  onPause,
}: Omit<Faelles, 'niveau'> & { trin: BevisjagtTrin }) {
  const [klar, setKlar] = useState(loeste > 0);
  if (!klar) {
    return (
      <Modal titel={t('bevisjagt.titel')} onLuk={onPause} bred klasse="opgave">
        <h2>{t('bevisjagt.titel')}</h2>
        <Forforstaaelse trin={trin} onVidere={() => setKlar(true)} />
      </Modal>
    );
  }
  return (
    <OpgaveRamme
      titel={t('bevisjagt.titel')}
      antal={trin.spoergsmaal.length}
      loeste={loeste}
      regel={t('bevisjagt.regel')}
      eksempel={t('bevisjagt.eksempel')}
      andreRegler={[t('ogorm.regel'), t('bro.regel')]}
      onSvar={onSvar}
      onPause={onPause}
      onLoest={() => onLoest()}
    >
      {(api) => <Bevisjagt key={loeste} trin={trin} nr={loeste} api={api} />}
    </OpgaveRamme>
  );
}
