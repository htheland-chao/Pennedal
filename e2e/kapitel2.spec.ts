import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Saetning = { id: string; tegn: '.' | '?' | '!' };
const raaber = (JSON.parse(readFileSync(new URL('../src/content/ord/raaber.json', import.meta.url), 'utf8')) as { saetninger: Saetning[] }).saetninger;
const NAVN = { '.': 'Punktum', '?': 'Spørgsmålstegn', '!': 'Udråbstegn' } as const;
const BILLEDER = 'test-results/skaermbilleder';

async function laesDialog(page: Page) {
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 30 && (await dialog.isVisible()); i++) await dialog.getByRole('button', { name: 'Videre' }).click();
  await expect(dialog).toHaveCount(0);
}

async function loesRaaber(page: Page) {
  const opgave = page.locator('dialog.opgave .raaber');
  await expect(opgave).toBeVisible();
  const id = await opgave.getAttribute('data-saetning-id');
  const s = raaber.find((x) => x.id === id)!;
  await opgave.getByRole('button', { name: NAVN[s.tegn] }).click();
  await expect(page.locator('.besked-god')).toBeVisible();
  await page.locator('dialog.opgave').getByRole('button', { name: 'Videre' }).click();
}

/** Går hen til et objekt og undersøger det (testkrog, der kun findes med ?hop). */
async function gaaTil(page: Page, id: string) {
  await page.evaluate((x) => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil(x), id);
}

test('kapitel 2: Råberens tegn, escape room, jagten over tagene og mørket', async ({ page }) => {
  test.setTimeout(240_000);

  // Råberens tegn på torvet.
  await page.goto('/?hop=k2-raaber');
  // Tingene fra kapitel 1 er med i tasken.
  await page.getByRole('button', { name: /^Taske/ }).click();
  for (const navn of ['Lanternen', 'Klattens kappe', 'Holms logbog']) await expect(page.locator('dialog.taske-vindue')).toContainText(navn);
  await page.locator('dialog.taske-vindue').getByRole('button', { name: 'Luk tasken' }).click();
  await page.getByRole('button', { name: 'Undersøg Råberen' }).click();
  // Et forkert svar giver en regel og et eksempel.
  const opgave = page.locator('dialog.opgave .raaber');
  const id = await opgave.getAttribute('data-saetning-id');
  const forkert = (['.', '?', '!'] as const).find((t) => t !== raaber.find((x) => x.id === id)!.tegn)!;
  await opgave.getByRole('button', { name: NAVN[forkert] }).click();
  await expect(page.locator('.besked-fejl')).toBeVisible();
  await expect(page.locator('.besked-fejl .regel')).toContainText('Regel');
  await page.screenshot({ path: `${BILLEDER}/k2-01-raaber.png` });
  await opgave.getByRole('button', { name: NAVN[raaber.find((x) => x.id === id)!.tegn] }).click();
  // Et rigtigt svar forklares også med en regel og et eksempel.
  await expect(page.locator('.besked-god .regel')).toContainText('Eksempel');
  await page.locator('dialog.opgave').getByRole('button', { name: 'Videre' }).click();
  for (let i = 0; i < 5; i++) await loesRaaber(page);
  await laesDialog(page);

  // Escape room i trykkeriet.
  await page.goto('/?hop=k2-rum');
  await expect(page.getByText('Din taske')).toBeVisible();
  await gaaTil(page, 'typeskab');
  await expect(page.locator('dialog.rum-vindue')).toContainText('Der mangler noget');
  await page.locator('dialog.rum-vindue').getByRole('button', { name: 'Luk' }).click();
  for (const id of ['kasse1', 'kasse2', 'presse', 'seddel']) {
    await gaaTil(page, id);
    await expect(page.locator('dialog.rum-vindue')).toBeVisible({ timeout: 15_000 });
    await page.locator('dialog.rum-vindue').getByRole('button', { name: 'Luk' }).click();
  }
  await expect(page.locator('.taske li')).toHaveCount(3);
  await gaaTil(page, 'typeskab');
  const laas = page.locator('dialog.rum-vindue');
  await laas.getByLabel('Kode').fill('123');
  await laas.getByRole('button', { name: 'Prøv koden' }).click();
  await expect(laas.locator('.besked-fejl')).toContainText('Tæl tegnene');
  await laas.getByLabel('Kode').fill('421');
  await laas.getByRole('button', { name: 'Prøv koden' }).click();
  await page.screenshot({ path: `${BILLEDER}/k2-02-rum.png` });
  await laas.getByRole('button', { name: 'Videre' }).click();
  await laesDialog(page);

  // Jagten over tagene: løb og hop. Efter tre fald tilbyder Æseløre at bære hovedpersonen over.
  await page.goto('/?hop=k2-tagene');
  await page.locator('.spilflade').focus();
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 160 && !(await page.locator('dialog.dialogboks').isVisible()); i++) {
    await page.keyboard.down('Space');
    await page.waitForTimeout(250);
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    const hjaelp = page.getByRole('button', { name: 'Ja, bær mig over' });
    if (await hjaelp.isVisible()) {
      await page.keyboard.up('ArrowRight');
      await hjaelp.click();
      await page.locator('.spilflade').focus();
      await page.keyboard.down('ArrowRight');
    }
  }
  await page.keyboard.up('ArrowRight');
  await laesDialog(page);

  // Byens brev og mørket.
  for (let i = 0; i < 4; i++) await loesRaaber(page);
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible();
  await expect(page.locator('main.verden')).toHaveClass(/moerke/);
  // Den fjerde replik er Den Ufærdiges første.
  for (let i = 0; i < 3; i++) await dialog.getByRole('button', { name: 'Videre' }).click();
  await expect(page.locator('dialog.taler-ufaerdige')).toBeVisible();
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${BILLEDER}/k2-03-moerke.png` });
  await laesDialog(page);
  await expect(page.getByText('Kapitel 2 er slut.')).toBeVisible();
});
