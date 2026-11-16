import { t, type Mission } from '../../content';
import type { FaerdighedId } from '../../engine/faerdigheder';
import { OrdOpgaveVindue } from '../../ui/OrdOpgaveVindue';
import { ordFaerdighed } from './dialog';

type Props = {
  mission: Mission;
  niveauFor: (faerdighed: string) => number;
  onSvar: (faerdighed: FaerdighedId | string, rigtigt: boolean, forsoeg: number) => void;
  onFaerdig: () => void;
  onPause: () => void;
};

/**
 * Sidemissionens opgave til sidst (fx Halvsangens sang).
 * Delt ud af Verden.tsx 16. november 2026.
 */
export function MissionVindue({ mission, niveauFor, onSvar, onFaerdig, onPause }: Props) {
  return (
    <OrdOpgaveVindue
      titel={mission.titel}
      intro={mission.intro}
      antal={mission.antal}
      art={mission.art ?? 'synonym'}
      niveau={niveauFor(ordFaerdighed(mission.art))}
      onSvar={(r, f, fd) => onSvar(fd ?? ordFaerdighed(mission.art), r, f)}
      faerdigTekst={t('ordopgave.faerdig')}
      pauseTekst={t('ordsten.vaek')}
      onFaerdig={onFaerdig}
      onPause={onPause}
    />
  );
}
