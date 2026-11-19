import { existsSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Billedtest (19. november 2026): faste billeder af spillets grafik på udvalgte steder. Fanger grafikfejl, som
// enhedstestene ikke ser (fx banerne, der kun viste himmel med fin grafik 13. november).
//
// Billederne skal laves på samme slags maskine, som testen kører på, ellers giver grafikkort og skrift falske fejl.
// Derfor laves de kun af GitHub-jobbet Billeder (.github/workflows/billeder.yml), og testen springes over, indtil de
// findes. Når grafikken ændres med vilje: kør jobbet Billeder, se de nye billeder i dets pull request, og merge.
//
// Spillet gøres ens hver gang: uret står stille og går kun frem i faste skridt, og tilfældige tal kommer fra en fast
// startværdi. Kun canvas tages med (HTML ovenpå skjules), så skrift og tekst i HTML ikke giver forskelle.

const STEDER = ['pennedal', 'torvet', 'lysningen', 'tagene', 'kaelder', 'soebred'] as const;
const SKALAER = [1, 2] as const;

async function gørEns(page: Page) {
  // Oplæsning følger lydens rigtige tid (munden og taleboblen), så den slås fra her.
  await page.addInitScript(() => {
    const nøgle = 'pennedal.indstillinger.v1';
    const ind = JSON.parse(localStorage.getItem(nøgle) ?? '{}');
    localStorage.setItem(nøgle, JSON.stringify({ ...ind, oplaesning: false }));
  });
  await page.addInitScript(() => {
    let s = 20261119;
    Math.random = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  });
  // install alene lader uret gå videre i rigtig tid. pauseAt stopper det, så kun gåFrem flytter tiden.
  await page.clock.install({ time: new Date('2026-11-19T10:00:00+01:00') });
  await page.clock.pauseAt(new Date('2026-11-19T10:00:01+01:00'));
}

async function gåFrem(page: Page, ms: number) {
  for (let t = 0; t < ms; t += 50) await page.clock.runFor(50);
}

// Kun canvas: alt HTML ovenpå (dialog, menuer, stednavn) skjules, før billedet tages.
// (toDataURL på canvas giver et sort billede, når Phaser lige har tømt det, så det bruges ikke.)
const KUN_CANVAS = 'body * { visibility: hidden !important; } .spilflade canvas { visibility: visible !important; }';

for (const skala of SKALAER) {
  for (const sted of STEDER) {
    test(`billede: ${sted}, ${skala === 2 ? 'fin' : 'hurtig'} grafik`, async ({ page }, info) => {
      const navn = `${sted}-skala${skala}.png`;
      // Uden faste billeder springes testen over. Jobbet Billeder sætter BILLEDER_OPDATER og laver dem.
      const findes = existsSync(info.snapshotPath(navn, { kind: 'screenshot' }));
      test.skip(!findes && !process.env.BILLEDER_OPDATER, 'Billederne laves af GitHub-jobbet Billeder');
      await gørEns(page);
      await page.goto(`/?hop=${sted}&skala=${skala}`);
      const verden = page.locator('main.verden');
      for (let i = 0; i < 200 && !(await verden.isVisible()); i++) await page.clock.runFor(100);
      await expect(verden).toBeVisible();
      await gåFrem(page, 3000);
      await page.addStyleTag({ content: KUN_CANVAS });
      await expect(page.locator('.spilflade canvas')).toHaveScreenshot(navn, { maxDiffPixelRatio: 0.002 });
    });
  }
}
