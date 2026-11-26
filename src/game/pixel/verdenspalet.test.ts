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
            if (!iPaletten(`#${m[2]}`)) fejl.push(`${fil}:${i + 1} #${m[2]}`);
        });
    }
    expect(
      fejl,
      "Brug en farve fra src/game/pixel/palet.ts (naermesteFarve finder den nærmeste)",
    ).toEqual([]);
  });
});
