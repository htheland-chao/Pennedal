import { t, type Sted } from '../../content';
import type { FaerdighedId } from '../../engine/faerdigheder';
import { OrdOpgaveVindue } from '../../components/OrdOpgaveVindue';
import { ordFaerdighed } from './dialog';

type Props = {
  sted: Sted;
  niveauFor: (faerdighed: string) => number;
  onSvar: (faerdighed: FaerdighedId | string, rigtigt: boolean, forsoeg: number) => void;
  onGenskab: () => void;
  onPause: () => void;
};

/**
 * Viskeskovens bane: ordstenen, eleven står ved og svarer på for at genskabe den.
 * Delt ud af Verden.tsx 16. november 2026.
 */
export function OrdstenVindue({ sted, niveauFor, onSvar, onGenskab, onPause }: Props) {
  return (
    <OrdOpgaveVindue
      titel={t(sted.ordsten && sted.ordsten !== 'synonym' ? `ordsten.${sted.ordsten}.titel` : 'ordsten.titel')}
      intro={t(sted.ordsten && sted.ordsten !== 'synonym' ? `ordsten.${sted.ordsten}.intro` : 'ordsten.intro')}
      antal={1}
      art={sted.ordsten ?? 'synonym'}
      niveau={niveauFor(ordFaerdighed(sted.ordsten))}
      onSvar={(r, f, fd) => onSvar(fd ?? ordFaerdighed(sted.ordsten), r, f)}
      faerdigTekst={t('ordsten.genskab')}
      pauseTekst={t('ordsten.vaek')}
      onFaerdig={onGenskab}
      onPause={onPause}
    />
  );
}
