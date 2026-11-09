import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const laes = <T,>(sti: string) => JSON.parse(readFileSync(new URL(`../src/content/${sti}`, import.meta.url), 'utf8')) as T;
const genre = laes<{ navne: Record<string, string>; kendetegn: Record<string, string[]>; tekster: { id: string; genre: string }[] }>('ord/genre.json');
const korrektur = laes<{ tekster: { id: string; fejl: { rigtig: string }[] }[] }>('ord/korrektur.json').tekster;
const fortsaet = laes<{ fortsaet: { id: string; svar: string }[] }>('ord/fortaeller.json').fortsaet;
const synonymer = laes<{ ord: { id: string; svar: string }[] }>('ord/synonymer.json').ord;
const BILLEDER = 'test-results/skaermbilleder';

async function laesDialog(page: Page) {
  const dialog = page.locator('dialog.dialogboks');
  await dialog.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  for (let i = 0; i < 60 && (await dialog.isVisible()); i++) {
    await dialog
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  }
  await expect(dialog).toHaveCount(0);
}

async function venterPaa(page: Page, tekst: string) {
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 15 && !(await dialog.getByText(tekst).isVisible()); i++)
    await dialog
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  await expect(dialog).toContainText(tekst);
}

async function vaelg(page: Page, svar: string) {
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 12 && !(await dialog.locator('.dialog-valg').isVisible()); i++)
    await dialog
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  await dialog.getByRole('button', { name: svar }).click();
}

async function gaaTil(page: Page, id: string) {
  await page.evaluate((x) => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil(x), id);
}

/** Svaret som tekst på knappen: genrens navn for et tekststykke, kendetegnet for et kendetegn (id som krimi.2). */
function genreSvar(id: string): string {
  if (id.includes('.')) {
    const [g, nr] = id.split('.');
    return genre.kendetegn[g][Number(nr)];
  }
  return genre.navne[genre.tekster.find((x) => x.id === id)!.genre];
}

/** Genreopgaverne hos en af figurerne. Den første får et forkert svar (regel og eksempel). */
async function genreOpgaver(page: Page, objekt: string, forkertFoerst: boolean) {
  const opg = page.locator('dialog.opgave .genre-opgave');
  // Står hovedpersonen allerede ved figuren lige efter en dialog, kan et enkelt klik gå tabt. Prøv igen.
  for (let i = 0; i < 4 && !(await opg.isVisible()); i++) {
    if (i < 2) await gaaTil(page, objekt);
    // Som eleven: knappen Undersøg i sidepanelet.
    else await page.getByRole('complementary').getByRole('button', { name: /^Undersøg/ }).click().catch(() => undefined);
    await opg.waitFor({ state: 'visible', timeout: 6_000 }).catch(() => undefined);
  }
  for (let i = 0; i < 3; i++) {
    await expect(opg).toBeVisible({ timeout: 15_000 });
    const id = (await opg.getAttribute('data-opgave-id'))!;
    const svar = genreSvar(id);
    if (forkertFoerst && i === 0) {
      const forkert = (await opg.locator('.kamp-mulighed').allTextContents()).find((m) => m !== svar)!;
      await opg.getByRole('button', { name: forkert, exact: true }).click();
      await expect(page.locator('dialog.opgave .besked-fejl .regel')).toContainText('Regel');
      await page.screenshot({ path: `${BILLEDER}/k7-02-genre.png` });
    }
    await opg.getByRole('button', { name: svar, exact: true }).click();
    await expect(page.locator('dialog.opgave .besked-god')).toBeVisible();
    await page.locator('dialog.opgave').getByRole('button', { name: 'Videre' }).click();
  }
}

/** Små genreopgaver i sidemissionen og på broen. */
async function smaaGenre(page: Page, antal: number, sidste: string) {
  const v = page.locator('dialog.ord-opgave');
  await expect(v).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < antal; i++) {
    const id = (await v.locator('[data-opgave-id]').getAttribute('data-opgave-id'))!;
    await v.getByRole('button', { name: genreSvar(id), exact: true }).click();
    await expect(v.locator('.besked-god .regel')).toContainText('Regel');
    await v.getByRole('button', { name: i < antal - 1 ? 'Næste ord' : sidste, exact: true }).click();
  }
  await expect(v).toHaveCount(0);
}

function kampSvar(vaesen: string, id: string): string {
  if (vaesen === 'tvivl') return fortsaet.find((x) => x.id === id)!.svar;
  if (vaesen === 'krusedulle') {
    const [t, nr] = id.split('.');
    return korrektur.find((x) => x.id === t)!.fejl[Number(nr)].rigtig;
  }
  return synonymer.find((x) => x.id === id)!.svar;
}

async function kaemp(page: Page, navn: string) {
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toBeVisible({ timeout: 30_000 });
  const skaerm = kamp.locator('.kamp-skaerm');
  let animationer = 0;
  for (let runde = 0; runde < 60; runde++) {
    await expect(skaerm).toHaveAttribute('data-fase', /^(menu|slut)$/, { timeout: 30_000 });
    if ((await skaerm.getAttribute('data-fase')) === 'slut') {
      const slut = kamp.locator('.kamp-slut');
      if (await slut.getByText('Vejen er fri').isVisible()) {
        await slut.getByRole('button', { name: 'Videre', exact: true }).click();
        await expect(kamp).toHaveCount(0);
        return;
      }
      await slut.getByRole('button', { name: 'Tilbage', exact: true }).click();
      await expect(kamp).toHaveCount(0);
      await gaaTil(page, 'ufaerdige');
      await expect(kamp).toBeVisible({ timeout: 30_000 });
      continue;
    }
    const menu = kamp.locator('.kamp-styring');
    if (runde === 0) await page.screenshot({ path: `${BILLEDER}/${navn}.png` });
    const maal = (await kamp.locator('.kamp-fjende-etiket:not(.rolig) .kamp-navn').first().textContent())!.trim();
    await menu.getByRole('button', { name: 'Slå', exact: true }).click();
    const art = maal.startsWith('Den Tvivlende') ? 'Slå med én fortæller' : maal.startsWith('Krusedull') ? 'Slå med en rettelse' : 'Slå med et synonym';
    const stort = menu.getByRole('button', { name: `Stort slag, der rammer alle: ${art}` });
    if (await stort.isVisible()) await stort.click();
    else await menu.getByRole('button', { name: art, exact: true }).click();
    if (await menu.getByText('Hvem vil du slå?').isVisible()) await menu.getByRole('button', { name: maal, exact: true }).click();
    const opgave = kamp.locator('.kamp-opgave-kort');
    const info = kamp.locator('[data-opgave-id]');
    const svar = kampSvar((await info.getAttribute('data-opgave-vaesen'))!, (await info.getAttribute('data-opgave-id'))!);
    await opgave.getByRole('button', { name: svar, exact: true }).click();
    await expect(opgave.locator('.besked-god .regel')).toContainText('Regel');
    await opgave.getByRole('button', { name: 'Slå!', exact: true }).click();
    if (animationer++ > 0) {
      const spring = kamp.getByRole('button', { name: 'Spring over' });
      if (await spring.isVisible()) await spring.click().catch(() => undefined);
    }
  }
  throw new Error('Kampen i De halve lande blev ikke vundet');
}

test('kapitel 7: De halve lande, fire genrer, fristelsen og kampen med hele holdet', async ({ page }) => {
  test.setTimeout(540_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));

  // Den venlige vej: Æseløre er tilgivet, og Klatten er en ven.
  await page.goto('/?hop=k7-ankomst&valg=aeseloere.tilgivet&venlighed=1');
  await venterPaa(page, 'sejlede jer over');
  await laesDialog(page);
  await expect(page.locator('main.verden')).toHaveClass(/tema-halve/);
  await page.screenshot({ path: `${BILLEDER}/k7-01-halve-lande.png` });

  await gaaTil(page, 'prinsesse');
  await venterPaa(page, 'Rimfods sten');
  await laesDialog(page);
  await genreOpgaver(page, 'prinsesse', true);
  // Figurerne står langt fra hinanden, så der ventes på deres første replik, før dialogen læses færdig.
  await gaaTil(page, 'lup');
  await venterPaa(page, 'Jeg er Kommissær Lup');
  await laesDialog(page);
  await genreOpgaver(page, 'lup', false);
  await gaaTil(page, 'grumsen');
  await venterPaa(page, 'Jeg er Grumsen');
  await laesDialog(page);
  await genreOpgaver(page, 'grumsen', false);
  await gaaTil(page, 'bip');
  await venterPaa(page, 'Jeg er Bip');
  await laesDialog(page);
  await genreOpgaver(page, 'bip', false);
  await venterPaa(page, 'De halve lande at tegne sig færdige');
  await laesDialog(page);

  // Sidemissionen: Kommissær Lups tre spor.
  await gaaTil(page, 'lup');
  await venterPaa(page, 'Tre spor af blæk');
  await laesDialog(page);
  for (const [i, spor] of ['spor1', 'spor2', 'spor3'].entries()) {
    await gaaTil(page, spor);
    await expect(page.locator('.kvittering').filter({ hasText: `(${i + 1} af 3)` })).toBeVisible({ timeout: 30_000 });
  }
  await gaaTil(page, 'lup');
  await laesDialog(page);
  await smaaGenre(page, 3, 'Færdig');
  await laesDialog(page);
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Kassen på biblioteket' })).toBeVisible();

  // Den halve bro (frivillig udflugt).
  await gaaTil(page, 'halvbro');
  await vaelg(page, 'Gå ud på broen');
  await expect(page.locator('.sted-navn')).toContainText('Den halve bro', { timeout: 30_000 });
  await laesDialog(page);
  await page.screenshot({ path: `${BILLEDER}/k7-03-bro.png` });
  for (const nr of [0, 1]) {
    await gaaTil(page, `ordsten-${nr}`);
    await smaaGenre(page, 1, 'Skriv planken tilbage');
  }
  await gaaTil(page, 'maal');
  await laesDialog(page);
  await expect(page.locator('.sted-navn')).toContainText('De halve lande', { timeout: 30_000 });
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Skyggen på vejen' })).toBeVisible();

  // Fristelsen: Den Ufærdige står midt på vejen. Alle bliver.
  await gaaTil(page, 'ufaerdige');
  await venterPaa(page, 'glattes ud sammen med den, der tilgav mig');
  await page.screenshot({ path: `${BILLEDER}/k7-04-fristelse.png` });
  await laesDialog(page);
  await gaaTil(page, 'ufaerdige');
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toBeVisible({ timeout: 30_000 });
  for (const navn of ['Æseløre', 'Vims', 'Klatten']) await expect(kamp.locator('.kamp-navn').filter({ hasText: navn })).toHaveCount(1);
  await kaemp(page, 'k7-kamp');
  await laesDialog(page);

  await gaaTil(page, 'rimfod');
  const slut = page.getByText('Kapitel 7 er slut.');
  const dialog = page.locator('dialog.dialogboks');
  for (let i = 0; i < 30 && !(await slut.isVisible()); i++) {
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Videre' }).click({ timeout: 3_000 }).catch(() => undefined);
    else await page.waitForTimeout(500);
  }
  await expect(slut).toBeVisible();
  expect(fejl).toEqual([]);
});

test('kapitel 7: uden tilgivelse går Æseløre med Den Ufærdige, og kampen er uden ham og Klatten', async ({ page }) => {
  test.setTimeout(300_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k7-fristelse');
  await gaaTil(page, 'ufaerdige');
  await venterPaa(page, 'Jeg kommer tilbage. Det lover jeg.');
  await laesDialog(page);
  await gaaTil(page, 'ufaerdige');
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toBeVisible({ timeout: 30_000 });
  await expect(kamp.locator('.kamp-navn').filter({ hasText: 'Æseløre' })).toHaveCount(0);
  await expect(kamp.locator('.kamp-navn').filter({ hasText: 'Klatten' })).toHaveCount(0);
  await expect(kamp.locator('.kamp-navn').filter({ hasText: 'Vims' })).toHaveCount(1);
  await kaemp(page, 'k7-kamp-uden');
  await venterPaa(page, 'Ingen er væk for altid');
  await laesDialog(page);
  expect(fejl).toEqual([]);
});
