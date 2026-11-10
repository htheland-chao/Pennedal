import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const laes = <T,>(sti: string) => JSON.parse(readFileSync(new URL(`../src/content/${sti}`, import.meta.url), 'utf8')) as T;
const halv = laes<{ tegnNavne: Record<string, string>; slut: { id: string; svar: string }[]; tegn: { id: string; tegn: string }[] }>('ord/halvsaetning.json');
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
  for (let i = 0; i < 20 && !(await dialog.getByText(tekst).isVisible()); i++)
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
  await dialog.getByRole('button', { name: svar, exact: true }).click();
}

async function gaaTil(page: Page, id: string) {
  await page.evaluate((x) => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil(x), id);
}

function halvSvar(id: string): string {
  const s = halv.slut.find((x) => x.id === id);
  if (s) return s.svar;
  return halv.tegnNavne[halv.tegn.find((x) => x.id === id)!.tegn];
}

async function kaemp(page: Page) {
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
      await gaaTil(page, 'halvsaetning');
      await expect(kamp).toBeVisible({ timeout: 30_000 });
      continue;
    }
    const menu = kamp.locator('.kamp-styring');
    if (runde === 0) await page.screenshot({ path: `${BILLEDER}/k8-kamp.png` });
    const maal = (await kamp.locator('.kamp-fjende-etiket:not(.rolig) .kamp-navn').first().textContent())!.trim();
    await menu.getByRole('button', { name: 'Slå', exact: true }).click();
    const art = 'Slå med en slutning';
    const stort = menu.getByRole('button', { name: `Stort slag, der rammer alle: ${art}` });
    if (await stort.isVisible()) await stort.click();
    else await menu.getByRole('button', { name: art, exact: true }).click();
    if (await menu.getByText('Hvem vil du slå?').isVisible()) await menu.getByRole('button', { name: maal, exact: true }).click();
    const opgave = kamp.locator('.kamp-opgave-kort');
    const id = (await kamp.locator('[data-opgave-id]').getAttribute('data-opgave-id'))!;
    await opgave.getByRole('button', { name: halvSvar(id), exact: true }).click();
    await expect(opgave.locator('.besked-god .regel')).toContainText('Regel');
    await opgave.getByRole('button', { name: 'Slå!', exact: true }).click();
    if (animationer++ > 0) {
      const spring = kamp.getByRole('button', { name: 'Spring over' });
      if (await spring.isVisible()) await spring.click().catch(() => undefined);
    }
  }
  throw new Error('Kampen på Den sidste side blev ikke vundet');
}

test('kapitel 8: Den sidste side, slutningen, den sande slutning og epilogen', async ({ page }) => {
  test.setTimeout(420_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));

  await page.goto('/?hop=k8-ankomst&valg=aeseloere.tilgivet&venlighed=1&skaar=alle');
  await venterPaa(page, 'Den, du aldrig skrev');
  await laesDialog(page);
  await expect(page.locator('main.verden')).toHaveClass(/tema-siden/);
  await page.screenshot({ path: `${BILLEDER}/k8-01-siden.png` });

  await gaaTil(page, 'halvsaetning');
  await venterPaa(page, 'Jeg er en sætning');
  await laesDialog(page);
  await gaaTil(page, 'halvsaetning');
  await kaemp(page);
  await laesDialog(page);

  // Den Ufærdige er Skyggen. Eleven skriver slutningen med tre valg.
  await gaaTil(page, 'ufaerdige');
  await venterPaa(page, 'Vil du skrive min slutning?');
  await page.screenshot({ path: `${BILLEDER}/k8-02-moede.png` });
  // De tre valg kommer lige efter hinanden. vaelg klikker videre, til valget står der.
  await vaelg(page, 'I biblioteket, mellem alle bøgerne');
  await vaelg(page, 'Alle hjælperne');
  await vaelg(page, 'Og så var Skyggen ikke alene mere.');

  // Slutningen læses op med elevens valg.
  await venterPaa(page, 'Den fandt et sted i biblioteket');
  await venterPaa(page, 'Der ventede alle hjælperne');
  await venterPaa(page, 'Og så var Skyggen ikke alene mere.');
  await venterPaa(page, 'Tak fordi du tilgav mig');
  await laesDialog(page);
  await expect(page.locator('.kvittering').filter({ hasText: 'Skuffen' })).toBeVisible({ timeout: 15_000 });

  // Den sande slutning: Skyggen får et navn, og sedlen ligger i hæftet.
  await gaaTil(page, 'skyggen');
  await vaelg(page, 'Pip');
  await venterPaa(page, 'Pip. Det er et godt navn.');
  await venterPaa(page, 'Den var faktisk god. Undskyld.');
  await page.screenshot({ path: `${BILLEDER}/k8-03-sand.png` });
  await laesDialog(page);

  // Epilogen i biblioteket.
  await gaaTil(page, 'lys');
  await expect(page.locator('.sted-navn')).toContainText('Skolebiblioteket', { timeout: 30_000 });
  await gaaTil(page, 'holm');
  await venterPaa(page, 'Det var mig, der fandt dit hæfte');
  await venterPaa(page, 'Eller rettere: begyndelsen.');
  await page.screenshot({ path: `${BILLEDER}/k8-04-epilog.png` });
  const slut = page.getByText('Kapitel 8 er slut.');
  const dialog = page.locator('dialog.dialogboks');
  for (let i = 0; i < 30 && !(await slut.isVisible()); i++) {
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Videre' }).click({ timeout: 3_000 }).catch(() => undefined);
    else await page.waitForTimeout(500);
  }
  await expect(slut).toBeVisible();
  expect(fejl).toEqual([]);
});

test('kapitel 8: Æseløre kommer tilbage, og uden alle skår får Skyggen intet navn endnu', async ({ page }) => {
  test.setTimeout(180_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k8-ankomst');
  await venterPaa(page, 'Jeg sagde jo, at jeg kom tilbage.');
  await laesDialog(page);

  await page.goto('/?hop=k8-skyggen&venlighed=1');
  await gaaTil(page, 'skyggen');
  await venterPaa(page, 'Måske finder jeg et navn en dag.');
  await expect(page.locator('dialog.dialogboks .dialog-valg')).toHaveCount(0);
  await laesDialog(page);
  expect(fejl).toEqual([]);
});
