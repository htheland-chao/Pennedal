/**
 * Alle pixelfigurer samlet i grupper, til grafikarket og til testen (src/ark/tjek.test.ts).
 * Ny pixelgrafik tilføjes her, så den kommer med på arket og bliver tjekket.
 */
import { AVATAR_DELE, AVATAR_GRAENSER, STANDARD_AVATAR } from '../engine/gem';
import { PORTRAETTER } from '../game/pixel/portraetter';
import {
  avatarPixel,
  BLADE,
  FUGL,
  KLATTEN,
  LANTERNE,
  PIL,
  PLANKE,
  SKILT,
  SKYGGE,
  STOLPE,
  TALEBOBLE,
  voksen,
  type Retning,
  type Tegnkort,
} from '../game/pixel/sprites';
import { MARKOER } from '../game/pixel/kampscene';
import { TING_IKONER } from '../game/pixel/ting';
import { STUMMING, TOMORD, VIMS } from '../game/pixel/viskeskov';
import { FODNOTETAL, FRU_FODNOTE, HAEFTE_KORT, TVIVL, UFAERDIGE_KORT } from '../game/pixel/arkiv';
import { BREV, hytte, KRUSEDULLE, POSTSNEGL } from '../game/pixel/blaeksoe';
import { BIP, GRUMSEN, LUP, PRINSESSE, SPOR } from '../game/pixel/halvelande';

export type Element = { navn: string; kort: Tegnkort };
export type Gruppe = {
  id: string;
  titel: string;
  /** Hvor mange gange pixlerne forstørres på arket. */
  skala: number;
  /** Alle figurer i gruppen skal have denne størrelse. */
  forventet?: { b: number; h: number };
  /** Alle figurer i gruppen skal have samme størrelse som den første. */
  ensStoerrelse?: boolean;
  elementer: Element[];
};

const RETNINGER: Retning[] = ['ned', 'op', 'hoejre', 'venstre'];

export function grupper(): Gruppe[] {
  const avatarValg: Element[] = [];
  for (const del of AVATAR_DELE)
    for (let v = 0; v < AVATAR_GRAENSER[del]; v++)
      avatarValg.push({ navn: `${del} ${v}`, kort: avatarPixel({ ...STANDARD_AVATAR, [del]: v }, 'ned', 0) });
  const retninger: Element[] = [];
  for (const r of RETNINGER) for (const ramme of [0, 1, 2] as const) retninger.push({ navn: `${r} ${ramme}`, kort: avatarPixel(STANDARD_AVATAR, r, ramme) });

  return [
    {
      id: 'portraetter',
      titel: 'Portrætter i dialogen (24 x 24)',
      skala: 6,
      forventet: { b: 24, h: 24 },
      elementer: Object.entries(PORTRAETTER).map(([navn, kort]) => ({ navn, kort })),
    },
    {
      id: 'avatar-valg',
      titel: 'Avatardesigneren: hvert valg for sig, resten som standard',
      skala: 4,
      ensStoerrelse: true,
      elementer: avatarValg,
    },
    {
      id: 'avatar-retninger',
      titel: 'Avataren i fire retninger og tre billeder',
      skala: 4,
      ensStoerrelse: true,
      elementer: retninger,
    },
    {
      id: 'figurer',
      titel: 'Figurer og væsner',
      skala: 5,
      elementer: [
        { navn: 'klatten', kort: KLATTEN },
        { navn: 'fugl (Æseløre)', kort: FUGL },
        { navn: 'vims', kort: VIMS },
        { navn: 'tomordet', kort: TOMORD },
        { navn: 'Fru Fodnote', kort: FRU_FODNOTE },
        { navn: 'Den Tvivlende Sætning', kort: TVIVL },
        { navn: 'fodnotetal', kort: FODNOTETAL },
        { navn: 'det grønne hæfte', kort: HAEFTE_KORT },
        { navn: 'Den Ufærdige', kort: UFAERDIGE_KORT },
        { navn: 'Krusedullen', kort: KRUSEDULLE },
        { navn: 'Postsneglen', kort: POSTSNEGL },
        { navn: 'et vådt brev', kort: BREV },
        { navn: 'Klattens hytte', kort: hytte() },
        { navn: 'Prinsesse Hilde', kort: PRINSESSE },
        { navn: 'Kommissær Lup', kort: LUP },
        { navn: 'Grumsen', kort: GRUMSEN },
        { navn: 'Bip', kort: BIP },
        { navn: 'et spor', kort: SPOR },
        { navn: 'stumming', kort: STUMMING },
        { navn: 'skygge', kort: SKYGGE },
        { navn: 'voksen', kort: voksen('#6a4a8a') },
      ],
    },
    {
      id: 'ting',
      titel: 'Ikoner i tasken (12 x 12)',
      skala: 6,
      forventet: { b: 12, h: 12 },
      elementer: Object.entries(TING_IKONER).map(([navn, kort]) => ({ navn, kort })),
    },
    {
      id: 'smaating',
      titel: 'Små ting',
      skala: 6,
      elementer: [
        { navn: 'lanterne', kort: LANTERNE },
        { navn: 'blade', kort: BLADE },
        { navn: 'stolpe', kort: STOLPE },
        { navn: 'planke', kort: PLANKE },
        { navn: 'taleboble', kort: TALEBOBLE },
        { navn: 'pil', kort: PIL },
        { navn: 'skilt', kort: SKILT },
        { navn: 'markør i kamp', kort: MARKOER },
      ],
    },
  ];
}
