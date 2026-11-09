import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Rim = { ord: string; rimer: string[]; forkerte: string[] };
type Klassificer = { id: string; fortaeller: 'jeg' | 'hanhun' };
type Fortsaet = { id: string; svar: string };
const laes = <T,>(sti: string) => JSON.parse(readFileSync(new URL(`../src/content/${sti}`, import.meta.url), 'utf8')) as T;
const rim = laes<{ rim: Rim[] }>('ord/rim.json').rim;
const fort = laes<{ klassificer: Klassificer[]; fortsaet: Fortsaet[] }>('ord/fortaeller.json');
const BILLEDER = 'test-results/skaermbilleder';
const NAVN = { jeg: 'En jeg-fortæller', hanhun: 'En han- eller hun-fortæller' };

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

const fortsaetSvar = (id: string) => fort.fortsaet.find((x) => x.id === id)!.svar;

/** En lille ordopgave med fortsæt-sætninger (sidemissionen og bøgerne på reolerne). */
async function fortsaet(page: Page, antal: number, sidste: string) {
  const v = page.locator('dialog.ord-opgave');
  await expect(v).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < antal; i++) {
    const id = (await v.locator('[data-opgave-id]').getAttribute('data-opgave-id'))!;
    await v.getByRole('button', { name: fortsaetSvar(id), exact: true }).click();
    await expect(v.locator('.besked-god .regel')).toContainText('fortæller');
    await v.getByRole('button', { name: i < antal - 1 ? 'Næste ord' : sidste, exact: true }).click();
  }
  await expect(v).toHaveCount(0);
}

/** Kampen i Det inderste arkiv: én fortæller mod Den Tvivlende Sætning, rim mod Ekkoet. */
async function kaemp(page: Page) {
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toBeVisible({ timeout: 30_000 });
  const skaerm = kamp.locator('.kamp-skaerm');
  let animationer = 0;
  for (let runde = 0; runde < 50; runde++) {
    await expect(skaerm).toHaveAttribute('data-fase', /^(menu|slut)$/, { timeout: 30_000 });
    if ((await skaerm.getAttribute('data-fase')) === 'slut') {
      const slut = kamp.locator('.kamp-slut');
      if (await slut.getByText('Vejen er fri').isVisible()) {
        await page.screenshot({ path: `${BILLEDER}/k5-kamp-vundet.png` });
        await slut.getByRole('button', { name: 'Videre', exact: true }).click();
        await expect(kamp).toHaveCount(0);
        return;
      }
      await slut.getByRole('button', { name: 'Tilbage', exact: true }).click();
      await expect(kamp).toHaveCount(0);
      await gaaTil(page, 'tvivl');
      await expect(kamp).toBeVisible({ timeout: 30_000 });
      continue;
    }
    const menu = kamp.locator('.kamp-styring');
    if (runde === 0) await page.screenshot({ path: `${BILLEDER}/k5-kamp.png` });
    const maal = (await kamp.locator('.kamp-fjende-etiket:not(.rolig) .kamp-navn').first().textContent())!.trim();
    await menu.getByRole('button', { name: 'Slå', exact: true }).click();
    const art = maal.startsWith('Ekko') ? 'Slå med et rim' : 'Slå med én fortæller';
    const stort = menu.getByRole('button', { name: `Stort slag, der rammer alle: ${art}` });
    if (await stort.isVisible()) await stort.click();
    else await menu.getByRole('button', { name: art, exact: true }).click();
    if (await menu.getByText('Hvem vil du slå?').isVisible()) await menu.getByRole('button', { name: maal, exact: true }).click();
    const opgave = kamp.locator('.kamp-opgave-kort');
    const info = kamp.locator('[data-opgave-id]');
    const id = (await info.getAttribute('data-opgave-id'))!;
    const muligheder = await opgave.locator('.kamp-mulighed').allTextContents();
    const vaesen = await info.getAttribute('data-opgave-vaesen');
    const svar = vaesen === 'ekko' ? muligheder.find((m) => rim.find((x) => x.ord === id)!.rimer.includes(m))! : fortsaetSvar(id);
    await opgave.getByRole('button', { name: svar, exact: true }).click();
    await expect(opgave.locator('.besked-god .regel')).toContainText('Regel');
    await opgave.getByRole('button', { name: 'Slå!', exact: true }).click();
    if (animationer++ > 0) {
      const spring = kamp.getByRole('button', { name: 'Spring over' });
      if (await spring.isVisible()) await spring.click().catch(() => undefined);
    }
  }
  throw new Error('Kampen i Det inderste arkiv blev ikke vundet');
}

test('kapitel 5: Fodnoternes kælder, bøgerne, kartoteksskabet, Den Tvivlende Sætning og Den Ufærdige', async ({ page }) => {
  test.setTimeout(420_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));

  await page.goto('/?hop=k5-ankomst');
  await laesDialog(page);
  await expect(page.locator('main.verden')).toHaveClass(/tema-arkiv/);
  await page.screenshot({ path: `${BILLEDER}/k5-01-arkiv.png` });

  // Fru Fodnote taler i fodnoter.
  await gaaTil(page, 'fodnote');
  await expect(page.locator('dialog.dialogboks.taler-fodnote')).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${BILLEDER}/k5-02-fodnote.png` });
  await laesDialog(page);

  // Bøgerne på bogvognen: hvem fortæller? Første svar er forkert (regel og eksempel).
  await gaaTil(page, 'bogvognen');
  const opgave = page.locator('dialog.opgave .synsvinkel-opgave');
  for (let i = 0; i < 5; i++) {
    await expect(opgave).toBeVisible({ timeout: 15_000 });
    const id = (await opgave.getAttribute('data-opgave-id'))!;
    const rigtig = fort.klassificer.find((x) => x.id === id)!.fortaeller;
    if (i === 0) {
      await opgave.getByRole('button', { name: NAVN[rigtig === 'jeg' ? 'hanhun' : 'jeg'], exact: true }).click();
      await expect(page.locator('dialog.opgave .besked-fejl .regel')).toContainText('jeg-fortæller');
      await page.screenshot({ path: `${BILLEDER}/k5-03-boeger.png` });
    }
    await opgave.getByRole('button', { name: NAVN[rigtig], exact: true }).click();
    await expect(page.locator('dialog.opgave .besked-god')).toBeVisible();
    await page.locator('dialog.opgave').getByRole('button', { name: 'Videre' }).click();
  }
  await laesDialog(page);

  // Sidemissionen (frivillig): Fru Fodnotes tre fodnotetal.
  await gaaTil(page, 'fodnote');
  await expect(page.locator('dialog.dialogboks')).toContainText('fodnotetal', { timeout: 30_000 });
  await laesDialog(page);
  for (const [i, tal] of ['tal1', 'tal2', 'tal3'].entries()) {
    await gaaTil(page, tal);
    await expect(page.locator('.kvittering').filter({ hasText: `(${i + 1} af 3)` })).toBeVisible({ timeout: 30_000 });
  }
  await gaaTil(page, 'fodnote');
  await laesDialog(page);
  await fortsaet(page, 3, 'Færdig');
  await laesDialog(page);
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Fodnoten i hæftet' })).toBeVisible();

  // De høje reoler (frivillig udflugt, svær med vilje).
  const dialog = page.locator('dialog.dialogboks');
  await gaaTil(page, 'reolstige');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 4 && !(await dialog.locator('.dialog-valg').isVisible()); i++) await dialog.getByRole('button', { name: 'Videre' }).click();
  await dialog.getByRole('button', { name: 'Klatr op' }).click();
  await expect(page.locator('.sted-navn')).toContainText('De høje reoler', { timeout: 30_000 });
  await laesDialog(page);
  await page.screenshot({ path: `${BILLEDER}/k5-04-reoler.png` });
  for (const nr of [0, 1]) {
    await gaaTil(page, `ordsten-${nr}`);
    await fortsaet(page, 1, 'Skriv planken tilbage');
  }
  await gaaTil(page, 'maal');
  await laesDialog(page);
  await expect(page.locator('.sted-navn')).toContainText('Fodnoternes arkiv', { timeout: 30_000 });
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Hvad skriver du?' })).toBeVisible();

  // Kartoteksskabet: tre messingskilte og koden fra sedlen.
  await gaaTil(page, 'kartotek');
  const rum = page.locator('dialog.rum-vindue');
  await expect(rum).toContainText('Der mangler noget', { timeout: 30_000 });
  await rum.getByRole('button', { name: 'Luk' }).click();
  for (const id of ['kasse1', 'kasse2', 'bunke', 'seddel']) {
    await gaaTil(page, id);
    await expect(rum).toBeVisible({ timeout: 15_000 });
    await rum.getByRole('button', { name: 'Luk' }).click();
  }
  await gaaTil(page, 'kartotek');
  await rum.getByLabel('Kode').fill('123');
  await rum.getByRole('button', { name: 'Prøv koden' }).click();
  await expect(rum.locator('.besked-fejl')).toContainText('første ord');
  await rum.getByLabel('Kode').fill('312');
  await rum.getByRole('button', { name: 'Prøv koden' }).click();
  await rum.getByRole('button', { name: 'Videre' }).click();
  await laesDialog(page);

  // Ned gennem lemmen til Det inderste arkiv.
  await gaaTil(page, 'lem');
  await expect(page.locator('.sted-navn')).toContainText('Det inderste arkiv', { timeout: 30_000 });
  await laesDialog(page);
  await page.screenshot({ path: `${BILLEDER}/k5-05-dybarkiv.png` });
  await gaaTil(page, 'tvivl');
  await expect(dialog).toContainText('Jeg er en sætning', { timeout: 30_000 });
  await laesDialog(page);
  await gaaTil(page, 'tvivl');
  await kaemp(page);
  await laesDialog(page);

  // Hæftet, tilbageblikket og twistet.
  await gaaTil(page, 'haefte');
  const slut = page.getByText('Kapitel 5 er slut.');
  const blik = page.locator('dialog.tilbageblik');
  let saaUfaerdige = false;
  for (let i = 0; i < 60 && !(await slut.isVisible()); i++) {
    if (await blik.isVisible()) {
      await blik
        .getByRole('button')
        .last()
        .click({ timeout: 3_000 })
        .catch(() => undefined);
    } else if (await dialog.isVisible()) {
      if (!saaUfaerdige && (await dialog.getByText('Der er du jo.').isVisible())) {
        saaUfaerdige = true;
        await page.screenshot({ path: `${BILLEDER}/k5-06-twist.png` });
      }
      await dialog
        .getByRole('button', { name: 'Videre' })
        .click({ timeout: 3_000 })
        .catch(() => undefined);
    } else await page.waitForTimeout(500);
  }
  await expect(slut).toBeVisible();
  expect(saaUfaerdige).toBe(true);
  expect(fejl).toEqual([]);
});
