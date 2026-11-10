import { expect, test } from '@playwright/test';

// Fin grafik (10. november 2026): 640 x 360 med blødt lys og glød. Testene kører ellers med hurtig grafik.
test('fin grafik tegner i 640 x 360 uden fejl, og indstillingen kan skiftes', async ({ page }) => {
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=kaelder&skala=2');
  await expect(page.locator('main.verden')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1500);
  const stoerrelse = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return c ? `${c.width}x${c.height}` : '';
  });
  expect(stoerrelse).toBe('640x360');
  await page.goto('/?hop=bibliotek&skala=1');
  await expect(page.locator('main.verden')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => document.querySelector('canvas')?.width)).toBe(320);
  expect(fejl).toEqual([]);
});

// Krav 8: går fin grafik for langsomt, skifter spillet selv til hurtig grafik og husker det.
// Testbrowseren har intet grafikkort og kører langsomt i 640 x 360, så den er et godt eksempel på en svag computer.
test('fin grafik, der går for langsomt, skifter selv til hurtig', async ({ page }) => {
  test.setTimeout(90_000);
  // Lad som om, det ikke er en automatisk test, så spillet vælger fin grafik som hos en elev.
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  // Gør browseren langsom med vilje (som en svag Chromebook), så testen ikke afhænger af, hvor hurtig testmaskinen er.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 8 });
  await page.goto('/?hop=kaelder');
  await expect(page.locator('main.verden')).toBeVisible({ timeout: 30_000 });
  const bredde = () => page.evaluate(() => document.querySelector('canvas')?.width);
  expect(await bredde()).toBe(640);
  await expect.poll(bredde, { timeout: 45_000 }).toBe(320);
  const ind = await page.evaluate(() => JSON.parse(localStorage.getItem('pennedal.indstillinger.v1') ?? '{}'));
  expect(ind.grafik).toBe('hurtig');
});
