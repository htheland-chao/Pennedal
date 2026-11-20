import { expect, test, type Page } from '@playwright/test';

// Filmsekvenser (20. november 2026): ankomsten til Pennedal i kapitel 1. Hele sekvensen ses i e2e/kapitel1.spec.ts.
// Her: "Spring over" (knap og Escape) giver samme sluttilstand som hele filmen, og rolig bevægelse.
const BILLEDER = 'test-results/skaermbilleder';

/** Trinnet i det gemte spil (-1, hvis hop ikke gemmer). */
async function gemtTrin(page: Page): Promise<number> {
  return page.evaluate(() => (JSON.parse(localStorage.getItem('pennedal.gemtspil.v1') ?? '{}') as { trin?: number }).trin ?? -1);
}

async function efterFilmen(page: Page) {
  await expect(page.locator('.film')).toHaveCount(0);
  await expect(page.locator('dialog.dialogboks')).toHaveCount(0);
  await expect(page.locator('.panel').getByRole('button', { name: 'Undersøg Klatten' })).toBeVisible();
}

test('ankomsten kan springes over med knappen, og spillet står som efter hele filmen', async ({ page }) => {
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=pennedal');
  await expect(page.locator('.film-bjaelker.vis')).toBeVisible();
  const foer = await gemtTrin(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${BILLEDER}/film-01-bjaelker.png` });
  await page.locator('.film').getByRole('button', { name: /Spring over/ }).click();
  await efterFilmen(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${BILLEDER}/film-02-sprunget-over.png` });
  if (foer >= 0) expect(await gemtTrin(page)).toBe(foer + 1);
  // Styringen er tilbage: hovedpersonen kan gå hen til Klatten med tastaturet.
  await page.locator('.spilflade').focus();
  await page.keyboard.press('E');
  expect(fejl, fejl.join('\n')).toEqual([]);
});

test('Escape springer over midt i en replik', async ({ page }) => {
  await page.goto('/?hop=pennedal');
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toContainText('Du lander blødt', { timeout: 15_000 });
  await expect(dialog.getByRole('button', { name: 'Spring over' })).toBeVisible();
  await page.keyboard.press('Escape');
  await efterFilmen(page);
});

test('med rolig bevægelse hopper kameraet, så replikken kommer hurtigt', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?hop=pennedal');
  await expect(page.locator('dialog.dialogboks')).toContainText('Du lander blødt', { timeout: 2_000 });
  // Æseløre dukker bare op (ingen fremkomst), og hans replikker følger lige efter.
  await page.locator('dialog.dialogboks').getByRole('button', { name: 'Videre' }).click();
  await expect(page.locator('dialog.dialogboks')).toContainText('Velkommen til Pennedal', { timeout: 2_000 });
  await page.screenshot({ path: `${BILLEDER}/film-03-rolig-zoom.png` });
  for (let i = 0; i < 4; i++) await page.locator('dialog.dialogboks').getByRole('button', { name: 'Videre' }).click();
  await efterFilmen(page);
});
