import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Synonym = { id: string; svar: string; forkerte: string[] };
const synonymer = (JSON.parse(readFileSync(new URL('../src/content/ord/synonymer.json', import.meta.url), 'utf8')) as { ord: Synonym[] }).ord;
const BILLEDER = 'test-results/skaermbilleder';

// Blækdybet (13. november 2026). Kode DYB-1008: første rum er en synonymsten, andet rum er en kamp.
test('Blækdybet: udfordringskode, blæk, gaver og rekordkode', async ({ page }) => {
  test.setTimeout(120_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));

  // En ny spiller kan ikke se Blækdybet på forsiden.
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start et nyt eventyr' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Blækdybet' })).toHaveCount(0);

  await page.goto('/?hop=dybet');
  await expect(page.getByRole('heading', { name: 'Blækdybet' })).toBeVisible();
  await page.screenshot({ path: `${BILLEDER}/dybet-1-start.png` });

  // En forkert kode giver en forståelig besked.
  await page.getByLabel('Har du en udfordringskode fra din lærer?').fill('ABC');
  await page.getByRole('button', { name: 'Spil koden' }).click();
  await expect(page.locator('.besked-fejl')).toContainText('DYB og fire tal');

  await page.getByLabel('Har du en udfordringskode fra din lærer?').fill('dyb 1008');
  await page.getByRole('button', { name: 'Spil koden' }).click();
  await expect(page.locator('.dybet-dybde')).toHaveText('Dybde 0');
  await expect(page.locator('.dybet-blaek')).toHaveAttribute('aria-label', 'Blæk: 3 af 5');
  await expect(page.getByText('Kode: DYB-1008')).toBeVisible();

  // Rum 1: synonymsten med to ord. Et forkert svar koster en dråbe og forklarer reglen.
  await page.getByRole('button', { name: 'Gå ind' }).click();
  const v = page.locator('dialog.ord-opgave');
  await expect(v).toBeVisible();
  for (let i = 0; i < 2; i++) {
    const id = await v.locator('[data-opgave-id]').getAttribute('data-opgave-id');
    const s = synonymer.find((x) => x.id === id)!;
    if (i === 0) {
      await v.getByRole('button', { name: s.forkerte[0], exact: true }).click();
      await expect(v.locator('.besked-fejl .regel')).toContainText('Regel');
    }
    await v.getByRole('button', { name: s.svar, exact: true }).click();
    await v.getByRole('button', { name: i === 0 ? 'Næste ord' : 'Videre ned', exact: true }).click();
  }
  await expect(page.locator('.dybet-blaek')).toHaveAttribute('aria-label', 'Blæk: 2 af 5');

  // Gave: Fyldt blækhus giver to dråber tilbage (højst fem).
  await expect(page.getByRole('heading', { name: 'Vælg en gave' })).toBeVisible();
  await page.screenshot({ path: `${BILLEDER}/dybet-2-gaver.png` });
  await expect(page.locator('.dybet-gave')).toHaveCount(3);
  await page.locator('.dybet-gave').first().click();
  await expect(page.locator('.dybet-dybde')).toHaveText('Dybde 1');

  // Rum 2 er en kamp. Den åbner, og eleven kan gå tilbage (koster en dråbe).
  await expect(page.getByRole('heading', { name: 'Væsner i mørket' })).toBeVisible();
  await page.getByRole('button', { name: 'Gå ind' }).click();
  await expect(page.locator('dialog.kamp')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.kamp-overgang')).toHaveCount(0, { timeout: 5_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${BILLEDER}/dybet-3-kamp.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.kamp')).toHaveCount(0);

  // Stop turen: rekorden og rekordkoden vises og gemmes i browseren.
  await page.getByRole('button', { name: 'Stop turen her' }).click();
  await expect(page.getByRole('heading', { name: 'Blækket er brugt' })).toBeVisible();
  const kode = await page.locator('.dybet-rekordkode').getAttribute('data-rekordkode');
  expect(kode).toMatch(/^DYB-1008\/1\/\d+\/[A-Z]{2}$/);
  await expect(page.getByText('Ny rekord!')).toBeVisible();
  await page.screenshot({ path: `${BILLEDER}/dybet-4-slut.png` });
  const gemt = await page.evaluate(() => JSON.parse(localStorage.getItem('pennedal.dybet.v1') ?? '{}'));
  expect(gemt.bedste.dybde).toBe(1);
  expect(gemt.perKode['1008'].dybde).toBe(1);

  // Prøv samme kode igen: samme første rum.
  await page.getByRole('button', { name: 'Prøv DYB-1008 igen' }).click();
  await expect(page.locator('.dybet-dybde')).toHaveText('Dybde 0');
  await expect(page.getByRole('heading', { name: 'En ordsten' })).toBeVisible();
  expect(fejl).toEqual([]);
});

// Kode DYB-1076: to synonymsten, og så en platformbane (Reolerne) fra spillet.
test('Blækdybet: en platformbane kan spilles og forlades', async ({ page }) => {
  test.setTimeout(120_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=dybet');
  await page.getByLabel('Har du en udfordringskode fra din lærer?').fill('DYB-1076');
  await page.getByRole('button', { name: 'Spil koden' }).click();
  for (let rum = 0; rum < 2; rum++) {
    await page.getByRole('button', { name: 'Gå ind' }).click();
    const v = page.locator('dialog.ord-opgave');
    for (let i = 0; i < 2; i++) {
      const id = await v.locator('[data-opgave-id]').getAttribute('data-opgave-id');
      const s = synonymer.find((x) => x.id === id)!;
      await v.getByRole('button', { name: s.svar, exact: true }).click();
      await v.getByRole('button', { name: i === 0 ? 'Næste ord' : 'Videre ned', exact: true }).click();
    }
    await page.locator('.dybet-gave').first().click();
  }
  await expect(page.getByRole('heading', { name: 'En sti over blækket' })).toBeVisible();
  await page.getByRole('button', { name: 'Gå ind' }).click();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowRight');
  await page.screenshot({ path: `${BILLEDER}/dybet-5-bane.png` });
  const foer = await page.locator('.dybet-blaek').getAttribute('aria-label');
  await page.getByRole('button', { name: 'Gå tilbage (koster en dråbe)' }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.locator('.dybet-blaek').getAttribute('aria-label')).not.toBe(foer);
  expect(fejl).toEqual([]);
});
