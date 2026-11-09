import { useRef, useState } from 'react';
import { fortaellersaetninger, historiebro, ogorm, raaber, rimord, stumme, t, type BevisjagtTrin, type OpgaveTrin } from '../content';
import type { Haendelse, Niveau } from '../engine/tilpasning';
import { lavHviskeOpgave, type HviskeOpgave as HOpgave } from '../mechanics/hviske';
import { vaelgOgTekst } from '../mechanics/ogorm';
import { lavBro } from '../mechanics/historiebro';
import { lavRaaberOpgave, type RaaberSaetning } from '../mechanics/raaber';
import { RaaberOpgave } from '../ui/RaaberOpgave';
import { lavOpgaveAfArt, type RimOpgave as ROpgave } from '../mechanics/rim';
import { RimOpgave } from '../ui/RimOpgave';
import { lavKlassificer, type KlassificerSaetning } from '../mechanics/fortaeller';
import { SynsvinkelOpgave } from '../ui/SynsvinkelOpgave';
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
const brugt = { hviske: [] as string[], og: [] as string[], bro: [] as string[], raab: [] as string[], rim: [] as string[], fort: [] as string[] };

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

function RaaberVindue({ trin, niveau, loeste, onSvar, onLoest, onPause }: Faelles & { trin: OpgaveTrin }) {
  const alle = raaber.saetninger as RaaberSaetning[];
  const [s, setS] = useState(() => lavRaaberOpgave(alle, niveau, Math.random, brugt.raab));
  const niveauRef = useRef(niveau);
  niveauRef.current = niveau;
  return (
    <OpgaveRamme
      titel={t('raaber.titel')}
      antal={trin.antal}
      loeste={loeste}
      regel={t('raaber.regel')}
      eksempel={t('raaber.eksempel')}
      andreRegler={[t('ogorm.regel'), t('bevisjagt.regel')]}
      onSvar={onSvar}
      onPause={onPause}
      onLoest={() => {
        husk(brugt.raab, s.id);
        onLoest();
        setS(lavRaaberOpgave(alle, niveauRef.current, Math.random, brugt.raab));
      }}
    >
      {(api) => <RaaberOpgave key={`${s.id}-${loeste}`} saetning={s} api={api} />}
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

/** Bjergets ældste digt (kapitel 4): rim og rytme på skift. Reglen følger opgaven. */
function RimVindue({ trin, niveau, loeste, onSvar, onLoest, onPause }: Faelles & { trin: OpgaveTrin }) {
  const art = (n: number) => (n % 2 === 0 ? 'rim' : 'rytme');
  const [o, setO] = useState<ROpgave>(() => lavOpgaveAfArt(art(loeste), rimord, niveau, Math.random, brugt.rim));
  const niveauRef = useRef(niveau);
  niveauRef.current = niveau;
  const rytme = o.art === 'rytme';
  return (
    <OpgaveRamme
      titel={t('rim.titel')}
      antal={trin.antal}
      loeste={loeste}
      regel={t(rytme ? 'rytme.regel' : 'rim.regel')}
      eksempel={t(rytme ? 'rytme.eksempel' : 'rim.eksempel')}
      andreRegler={[t('rim.regel'), t('rytme.regel'), t('kamp.tomordet.regel')]}
      onSvar={onSvar}
      onPause={onPause}
      onLoest={() => {
        husk(brugt.rim, o.id);
        // Rimordene kommer ikke i ordsamlingen (den er til stumme bogstaver).
        onLoest();
        setO(lavOpgaveAfArt(art(loeste + 1), rimord, niveauRef.current, Math.random, brugt.rim));
      }}
    >
      {(api) => <RimOpgave key={`${o.id}-${loeste}`} opgave={o} api={api} />}
    </OpgaveRamme>
  );
}

/** Fru Fodnotes bøger (kapitel 5): sortér sætningerne efter, hvem der fortæller. */
function SynsvinkelVindue({ trin, niveau, loeste, onSvar, onLoest, onPause }: Faelles & { trin: OpgaveTrin }) {
  const [o, setO] = useState<KlassificerSaetning>(() => lavKlassificer(fortaellersaetninger.klassificer, niveau, Math.random, brugt.fort));
  const niveauRef = useRef(niveau);
  niveauRef.current = niveau;
  return (
    <OpgaveRamme
      titel={t('fortaeller.titel')}
      antal={trin.antal}
      loeste={loeste}
      regel={t('fortaeller.regel')}
      eksempel={t('fortaeller.eksempel')}
      andreRegler={[t('rim.regel'), t('kamp.tomordet.regel')]}
      onSvar={onSvar}
      onPause={onPause}
      onLoest={() => {
        husk(brugt.fort, o.id);
        onLoest();
        setO(lavKlassificer(fortaellersaetninger.klassificer, niveauRef.current, Math.random, brugt.fort));
      }}
    >
      {(api) => <SynsvinkelOpgave key={`${o.id}-${loeste}`} opgave={o} api={api} />}
    </OpgaveRamme>
  );
}

export function OpgaveVindue(props: Faelles & { trin: OpgaveTrin }) {
  if (props.trin.mekanik === 'synsvinkel') return <SynsvinkelVindue {...props} />;
  if (props.trin.mekanik === 'rim') return <RimVindue {...props} />;
  if (props.trin.mekanik === 'hviske') return <HviskeVindue {...props} />;
  if (props.trin.mekanik === 'ogorm') return <OgormVindue {...props} />;
  if (props.trin.mekanik === 'raaber') return <RaaberVindue {...props} />;
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
