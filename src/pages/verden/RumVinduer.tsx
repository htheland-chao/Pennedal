import type { RumFund, RumTrin, Sted } from '../../content';
import { FundVindue, KodeVindue, ManglerVindue } from '../../components/RumVindue';

/** Hvilket vindue der er åbent i et escape room: et fund, en lås der mangler noget, eller koden. */
export type RumVisning = { type: 'fund'; fund: RumFund } | { type: 'mangler' } | { type: 'kode' };

type Props = {
  rum: RumTrin;
  visning: RumVisning;
  sted: Sted;
  onSvar: (rigtigt: boolean, forsoeg: number) => void;
  onAaben: () => void;
  onLuk: () => void;
};

/**
 * Escape room: vinduet for det, eleven lige har undersøgt.
 * Delt ud af Verden.tsx 16. november 2026.
 */
export function RumVinduer({ rum, visning, sted, onSvar, onAaben, onLuk }: Props) {
  const navn = (id: string) => sted.objekter.find((o) => o.id === id)?.navn ?? '';
  if (visning.type === 'fund') return <FundVindue titel={navn(visning.fund.objekt)} fund={visning.fund} onLuk={onLuk} />;
  if (visning.type === 'mangler') return <ManglerVindue titel={navn(rum.laas.objekt)} tekst={rum.laas.mangler} onLuk={onLuk} />;
  return <KodeVindue titel={navn(rum.laas.objekt)} laas={rum.laas} onSvar={onSvar} onAaben={onAaben} onLuk={onLuk} />;
}
