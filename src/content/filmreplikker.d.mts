import type { Replik } from './index';
import type { Handling } from '../engine/film/typer';

/** Et trin af enhver slags. Trin uden replikker giver en tom liste. */
export function trinReplikker(trin: object): Replik[];
export function filmReplikker(handlinger: Handling[]): Replik[];
