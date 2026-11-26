import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { iPaletten } from "./palet";

// Verdenens grafik (jord, huse, vand, baner, rum, partikler) må kun bruge masterpalettens farver (26. november 2026).
// Undtaget: himmelforløb (addColorStop), gennemsigtige farver (rgba) og lys, toning og nat, som ligger i lys.ts,
// stemning.ts og filmlag.ts. Intro, titel, minder og kampens baggrunde er ikke tjekket endnu.
const VERDEN = [
  "src/game/pixel/lerred",
  "src/game/pixel/banetegn",
  "src/game/pixel/banetegn.ts",
  "src/game/pixel/inde.ts",
  "src/game/pixel/blaekling.ts",
  "src/game/pixel/ogorm.ts",
  "src/game/kort",
  "src/game/PhaserVerden.tsx",
];
const UNDTAGET = ["src/game/pixel/lerred/lys.ts"];
// Viskeskovens bane og Rimbjergets bane: paletten mangler kolde, lyse grå og sne. Venter på Henriks valg (26. november 2026).
const VENTER = [
  "#e8e6ee",
  "#c9cfc4",
  "#b8ad9c",
  "#a99f8e",
  "#8f8a80",
  "#eceaf2",
  "#e2e0ea",
  "#d2cfdc",
  "#b9b4c8",
  "#e4e2ec",
  "#d6d3e0",
  "#c4c0d2",
  "#f2f6fb",
  "#cdd9e8",
  "#7d7f8c",
  "#6a6c7a",
  "#9a9cab",
  "#3a4562",
  "#2f3854",
  "#4c5878",
  "#9aa3b8",
  "#c9d3e4",
  "#a3afc7",
  "#7f8aa6",
  "#2a2c38",
  "#8d8a86",
  "#6c6a68",
];

function filer(sti: string): string[] {
  if (!statSync(sti).isDirectory()) return [sti];
  return readdirSync(sti).flatMap((f) => filer(join(sti, f)));
}

describe("verdenens farver", () => {
  it("bruger kun farver fra masterpaletten", () => {
    const fejl: string[] = [];
    for (const fil of VERDEN.flatMap(filer)) {
      if (
        !/\.tsx?$/.test(fil) ||
        fil.includes(".test.") ||
        UNDTAGET.includes(fil)
      )
        continue;
      readFileSync(fil, "utf8")
        .split("\n")
        .forEach((linje, i) => {
          if (/addColorStop|rgba\(/.test(linje)) return;
          for (const m of linje.matchAll(/(#|0x)([0-9a-fA-F]{6})\b/g))
            if (
              !iPaletten(`#${m[2]}`) &&
              !VENTER.includes(`#${m[2]}`.toLowerCase())
            )
              fejl.push(`${fil}:${i + 1} #${m[2]}`);
        });
    }
    expect(
      fejl,
      "Brug en farve fra src/game/pixel/palet.ts (naermesteFarve finder den nærmeste)",
    ).toEqual([]);
  });
});
