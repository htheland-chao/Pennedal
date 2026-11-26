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

test('mørket over tagene (kapitel 2) kan springes over på platformbanen, og kapitlet slutter', async ({ page }) => {
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k2-moerke');
  await expect(page.locator('dialog.dialogboks')).toContainText('Pludselig bliver alt stille', { timeout: 15_000 });
  await page.locator('dialog.dialogboks').getByRole('button', { name: 'Videre' }).click();
  // Mørket lægger sig, og den næste replik kommer.
  await expect(page.locator('dialog.dialogboks')).toContainText('Farverne løber ud', { timeout: 5_000 });
  await page.screenshot({ path: `${BILLEDER}/film-04-k2-moerke.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('.film')).toHaveCount(0);
  await expect(page.getByText('Kapitel 2 er slut.')).toBeVisible();
  expect(fejl, fejl.join('\n')).toEqual([]);
});

test('fristelsen (kapitel 7) starter ved Den Ufærdige og kan springes over med knappen i dialogen', async ({ page }) => {
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k7-fristelse');
  await page.evaluate(() => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil('ufaerdige'));
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toContainText('Så bliver alt stille', { timeout: 15_000 });
  const tilbud = dialog.getByText('Jeg kan give jer en slutning');
  // Klik kun, mens den første replik står der, så klikket ikke springer forbi tilbuddet.
  const foerste = dialog.getByText('Så bliver alt stille');
  for (let i = 0; i < 30 && !(await tilbud.isVisible()); i++) {
    if (await foerste.isVisible()) await dialog.getByRole('button', { name: 'Videre' }).click({ timeout: 1_000 }).catch(() => undefined);
    else await page.waitForTimeout(300);
  }
  await expect(tilbud).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${BILLEDER}/film-05-k7-fristelse.png` });
  await dialog.getByRole('button', { name: 'Spring over' }).click();
  await expect(page.locator('.film')).toHaveCount(0);
  // Bagefter: kampen hos Den Ufærdige er næste trin.
  await expect(page.locator('.panel').getByRole('button', { name: /Den Ufærdige/ })).toBeVisible({ timeout: 10_000 });
  expect(fejl, fejl.join('\n')).toEqual([]);
});

test('slutningen (kapitel 8) kan springes over: Den Ufærdige er blevet til Skyggen, og mindet kommer', async ({ page }) => {
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k8-oplaesning');
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toContainText('Du læser hele slutningen højt', { timeout: 15_000 });
  await page.screenshot({ path: `${BILLEDER}/film-06-k8-oplaesning.png` });
  await page.keyboard.press('Escape');
  await expect(page.locator('.film')).toHaveCount(0);
  await expect(page.locator('.kvittering').filter({ hasText: 'Skuffen' })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.panel').getByRole('button', { name: /Skyggen/ })).toBeVisible({ timeout: 10_000 });
  expect(fejl, fejl.join('\n')).toEqual([]);
});

test('med "Mindre uhygge" kører fristelsen uden fejl, og der kommer ingen besked om uhygge', async ({ page }) => {
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.addInitScript(() => {
    const n = 'pennedal.indstillinger.v1';
    const i = JSON.parse(localStorage.getItem(n) ?? '{}') as Record<string, unknown>;
    localStorage.setItem(n, JSON.stringify({ ...i, mindreUhygge: true }));
  });
  await page.goto('/?hop=k7-fristelse');
  await page.evaluate(() => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil('ufaerdige'));
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toContainText('Så bliver alt stille', { timeout: 15_000 });
  // Hele filmen: blink og rystelse er slået fra, men replikkerne kommer som ellers.
  for (let i = 0; i < 80 && (await page.locator('.film').count()) > 0; i++) {
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Videre' }).click({ timeout: 1_000 }).catch(() => undefined);
    else await page.waitForTimeout(300);
  }
  await expect(page.locator('.film')).toHaveCount(0);
  await expect(page.getByText('Pludselig bliver alt mørkt et øjeblik.')).toHaveCount(0);
  expect(fejl, fejl.join('\n')).toEqual([]);
});
