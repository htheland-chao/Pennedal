import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Rim = { ord: string; rimer: string[]; forkerte: string[] };
type Stavelse = { ord: string; dele: string };
type Synonym = { id: string; svar: string };
const laes = <T,>(sti: string) => JSON.parse(readFileSync(new URL(`../src/content/${sti}`, import.meta.url), 'utf8')) as T;
const rimData = laes<{ rim: Rim[]; stavelser: Stavelse[] }>('ord/rim.json');
const synonymer = laes<{ ord: Synonym[] }>('ord/synonymer.json').ord;
const BILLEDER = 'test-results/skaermbilleder';

async function laesDialog(page: Page) {
  const dialog = page.locator('dialog.dialogboks');
  await dialog.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  for (let i = 0; i < 20 && (await dialog.isVisible()); i++) {
    await dialog
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  }
  await expect(dialog).toHaveCount(0);
}

async function gaaTil(page: Page, id: string) {
  await page.evaluate((x) => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil(x), id);
}

/** Det rigtige svar på en rim-, ikke-rim- eller rytmeopgave ud fra ordet og mulighederne. */
function rimSvar(ord: string, art: string | null, muligheder: string[]): string {
  if (art === 'rytme') return String(rimData.stavelser.find((x) => x.ord === ord)!.dele.split('-').length);
  const r = rimData.rim.find((x) => x.ord === ord)!;
  return art === 'ikkerim' ? muligheder.find((m) => r.forkerte.includes(m))! : muligheder.find((m) => r.rimer.includes(m))!;
}

/** Går hen til en ekkosten og finder et rim. Med forkertFoerst svares der først forkert (regel og eksempel). */
async function ekkosten(page: Page, nr: number, forkertFoerst = false) {
  await gaaTil(page, `ordsten-${nr}`);
  const v = page.locator('dialog.ord-opgave');
  await expect(v).toBeVisible({ timeout: 15_000 });
  await expect(v).toContainText('Ekkostenen');
  const ord = (await v.locator('[data-opgave-id]').getAttribute('data-opgave-id'))!;
  const muligheder = await v.locator('.kamp-mulighed').allTextContents();
  const svar = rimSvar(ord, 'rim', muligheder);
  if (forkertFoerst) {
    await v.getByRole('button', { name: muligheder.find((m) => m !== svar)!, exact: true }).click();
    await expect(v.locator('.besked-fejl .regel')).toContainText('Regel');
    await expect(v.locator('.besked-fejl .regel')).toContainText('lyder ens');
  }
  await v.getByRole('button', { name: svar, exact: true }).click();
  await v.getByRole('button', { name: 'Skriv planken tilbage' }).click();
  await expect(v).toHaveCount(0);
}

/** Kampen i Ekkokløften: slå hvert væsen på dets svage punkt (rim mod ekkoerne, synonymer mod Tomordet). */
async function kaemp(page: Page) {
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toBeVisible({ timeout: 30_000 });
  const skaerm = kamp.locator('.kamp-skaerm');
  let animationer = 0;
  for (let runde = 0; runde < 40; runde++) {
    await expect(skaerm).toHaveAttribute('data-fase', /^(menu|slut)$/, { timeout: 30_000 });
    if ((await skaerm.getAttribute('data-fase')) === 'slut') {
      const slut = kamp.locator('.kamp-slut');
      if (await slut.getByText('Vejen er fri').isVisible()) {
        await page.screenshot({ path: `${BILLEDER}/k4-kamp-vundet.png` });
        await slut.getByRole('button', { name: 'Videre', exact: true }).click();
        await expect(kamp).toHaveCount(0);
        return;
      }
      await slut.getByRole('button', { name: 'Tilbage', exact: true }).click();
      await expect(kamp).toHaveCount(0);
      await gaaTil(page, 'ekko');
      await expect(kamp).toBeVisible({ timeout: 30_000 });
      continue;
    }
    const menu = kamp.locator('.kamp-styring');
    if (runde === 0) await page.screenshot({ path: `${BILLEDER}/k4-kamp.png` });
    const maal = (await kamp.locator('.kamp-fjende-etiket:not(.rolig) .kamp-navn').first().textContent())!.trim();
    await menu.getByRole('button', { name: 'Slå', exact: true }).click();
    const art = maal.startsWith('Ekko') ? 'Slå med et rim' : 'Slå med et synonym';
    const stort = menu.getByRole('button', { name: `Stort slag, der rammer alle: ${art}` });
    if (await stort.isVisible()) await stort.click();
    else await menu.getByRole('button', { name: art, exact: true }).click();
    if (await menu.getByText('Hvem vil du slå?').isVisible()) await menu.getByRole('button', { name: maal, exact: true }).click();
    const opgave = kamp.locator('.kamp-opgave-kort');
    const info = kamp.locator('[data-opgave-id]');
    const id = (await info.getAttribute('data-opgave-id'))!;
    const muligheder = await opgave.locator('.kamp-mulighed').allTextContents();
    const svar = (await info.getAttribute('data-opgave-vaesen')) === 'ekko' ? rimSvar(id, 'rim', muligheder) : synonymer.find((x) => x.id === id)!.svar;
    await opgave.getByRole('button', { name: svar, exact: true }).click();
    await expect(opgave.locator('.besked-god .regel')).toContainText('Regel');
    await opgave.getByRole('button', { name: 'Slå!', exact: true }).click();
    if (animationer++ > 0) {
      const spring = kamp.getByRole('button', { name: 'Spring over' });
      if (await spring.isVisible()) await spring.click().catch(() => undefined);
    }
  }
  throw new Error('Kampen i Ekkokløften blev ikke vundet');
}

test('kapitel 4: Rimbjerget, ekkostenene, Ekkoet, digtet og mørket', async ({ page }) => {
  test.setTimeout(420_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));

  await page.goto('/?hop=k4-ankomst');
  await laesDialog(page);
  await expect(page.locator('main.verden')).toHaveClass(/tema-rimbjerg/);
  await page.screenshot({ path: `${BILLEDER}/k4-01-bjergfod.png` });

  // Rimfod taler på rim og giver sin sten.
  await gaaTil(page, 'rimfod');
  await expect(page.locator('dialog.dialogboks')).toContainText('Godmorgen, I små', { timeout: 30_000 });
  await laesDialog(page);
  await expect(page.locator('.ny-ting')).toContainText('Rimfods sten');

  // Stien op ad bjerget: ekkostenene giver trinene tilbage, når eleven finder et rim.
  await expect(page.locator('.sted-navn')).toContainText('Stien op ad bjerget', { timeout: 30_000 });
  await laesDialog(page);
  await page.screenshot({ path: `${BILLEDER}/k4-02-bane.png` });
  for (const nr of [0, 1, 2]) await ekkosten(page, nr, nr === 0);
  await gaaTil(page, 'maal');

  // Ekkokløften og kampen.
  await expect(page.locator('.sted-navn')).toContainText('Ekkokløften', { timeout: 30_000 });
  await laesDialog(page);
  await gaaTil(page, 'ekko');
  await expect(page.locator('dialog.dialogboks')).toContainText('Gentag', { timeout: 30_000 });
  await laesDialog(page);
  await gaaTil(page, 'ekko');
  await kaemp(page);
  await laesDialog(page);

  // Toppen: tavlen, godnathistorien og digtet.
  await gaaTil(page, 'opgang');
  await expect(page.locator('.sted-navn')).toContainText('Toppen af Rimbjerget', { timeout: 30_000 });
  await gaaTil(page, 'digtsten');
  await expect(page.locator('dialog.dialogboks')).toContainText('tavle af sten', { timeout: 30_000 });
  await laesDialog(page);
  await expect(page.locator('.kvittering').filter({ hasText: 'Godnathistorien' })).toBeVisible();
  // Sidemissionen (frivillig, før kapitlet slutter): Rimfod vil sige én sætning uden rim.
  await gaaTil(page, 'rimfod-top');
  await laesDialog(page);
  const v = page.locator('dialog.ord-opgave');
  for (let i = 0; i < 3; i++) {
    const ord = (await v.locator('[data-opgave-id]').getAttribute('data-opgave-id'))!;
    const muligheder = await v.locator('.kamp-mulighed').allTextContents();
    await v.getByRole('button', { name: rimSvar(ord, 'ikkerim', muligheder), exact: true }).click();
    await v.getByRole('button', { name: i < 2 ? 'Næste ord' : 'Færdig', exact: true }).click();
  }
  await laesDialog(page);
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Skyggen i margenen' })).toBeVisible();

  await gaaTil(page, 'digtsten');
  const opgave = page.locator('dialog.opgave .rim-opgave');
  for (let i = 0; i < 4; i++) {
    await expect(opgave).toBeVisible({ timeout: 15_000 });
    const ord = (await opgave.getAttribute('data-opgave-id'))!;
    const art = await opgave.getAttribute('data-opgave-art');
    const muligheder = await opgave.locator('.kamp-mulighed').allTextContents();
    const svar = rimSvar(ord, art, muligheder);
    if (i === 1) {
      // Rytme: et forkert svar giver regel og eksempel.
      await opgave.getByRole('button', { name: muligheder.find((m) => m !== svar)!, exact: true }).click();
      await expect(page.locator('dialog.opgave .besked-fejl .regel')).toContainText('stavelse');
      await page.screenshot({ path: `${BILLEDER}/k4-03-rytme.png` });
    }
    await opgave.getByRole('button', { name: svar, exact: true }).click();
    await expect(page.locator('dialog.opgave .besked-god')).toBeVisible();
    await page.locator('dialog.opgave').getByRole('button', { name: 'Videre' }).click();
  }
  // Digtet slutter, og mørket kommer af sig selv. Klik videre, til kapitlet er slut.
  const slut = page.getByText('Kapitel 4 er slut.');
  const dialog = page.locator('dialog.dialogboks');
  for (let i = 0; i < 40 && !(await slut.isVisible()); i++) {
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Videre' }).click({ timeout: 3_000 }).catch(() => undefined);
    else await page.waitForTimeout(500);
  }
  await expect(slut).toBeVisible();

  expect(fejl).toEqual([]);
});
