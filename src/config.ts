/**
 * Lærerkoden holder lærerkigget af vejen for eleverne. Den er ikke en rigtig adgangskode:
 * Den ligger i spillets filer, og lærerkigget viser kun data fra elevens egen computer.
 * Skift den ved at sætte VITE_LAERERKODE, når spillet bygges.
 */
export const LAERERKODE: string = import.meta.env.VITE_LAERERKODE || '2026';

/** Antal færdige historier, der får fyrtårnet til at lyse helt. */
export const FYRTAARN_MAKS = 10;
