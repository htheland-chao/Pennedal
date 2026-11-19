import { describe, expect, it } from "vitest";
import { PAPIRGRAN_FORMER, papirgran, vaelgForm } from "./papirgraner";
import { papirtrae } from "./sprites";

describe("papirgraner", () => {
  it("den normale form er præcis det gamle papirtræ", () => {
    for (const h of [22, 26, 30, 34])
      expect(papirgran(h, "normal")).toEqual(papirtrae(h));
  });

  it("alle former har lige lange rækker og kun farver fra paletten", () => {
    for (const form of PAPIRGRAN_FORMER)
      for (const h of [22, 26, 30, 34]) {
        const t = papirgran(h, form);
        const w = t.raekker[0].length;
        for (const r of t.raekker) {
          expect(r.length).toBe(w);
          for (const c of r) expect(c === "." || c in t.palet).toBe(true);
        }
      }
  });

  it("formerne ser forskellige ud", () => {
    const tegn = PAPIRGRAN_FORMER.map((f) =>
      papirgran(30, f).raekker.join("\n"),
    );
    expect(new Set(tegn).size).toBe(PAPIRGRAN_FORMER.length);
  });

  it("samme plads giver altid samme form, og alle former bliver brugt", () => {
    expect(vaelgForm(PAPIRGRAN_FORMER, 40, 90)).toBe(
      vaelgForm(PAPIRGRAN_FORMER, 40, 90),
    );
    const brugt = new Set<string>();
    for (let x = 0; x < 400; x += 7)
      for (let y = 0; y < 400; y += 11)
        brugt.add(vaelgForm(PAPIRGRAN_FORMER, x, y));
    expect(brugt.size).toBe(PAPIRGRAN_FORMER.length);
  });

  it("én form (graner med sne) giver altid den", () => {
    expect(vaelgForm(["gran"], 5, 5)).toBe("gran");
  });
});
