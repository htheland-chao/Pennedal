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
  // Gør spillet langsomt med vilje (som en svag Chromebook): hvert billede venter 45 ms, så spillet højst når ca. 20
  // billeder pr. sekund, uanset hvor hurtig testmaskinen er. Før blev CPU'en bremset 8 gange, men på en hurtig
  // GitHub-maskine nåede spillet alligevel over 40 billeder pr. sekund en gang imellem, og testen fejlede tilfældigt.
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => window.setTimeout(() => raf(cb), 45) as unknown as number;
  });
  await page.goto('/?hop=kaelder');
  await expect(page.locator('main.verden')).toBeVisible({ timeout: 30_000 });
  const bredde = () => page.evaluate(() => document.querySelector('canvas')?.width);
  expect(await bredde()).toBe(640);
  await expect.poll(bredde, { timeout: 45_000 }).toBe(320);
  const ind = await page.evaluate(() => JSON.parse(localStorage.getItem('pennedal.indstillinger.v1') ?? '{}'));
  expect(ind.grafik).toBe('hurtig');
});

// Henrik, 13. november 2026: med fin grafik (SKALA 2) så banerne kun himmel, fordi kameraet var sat forkert op.
// Testene kører ellers med hurtig grafik, så den fejl blev ikke fanget. Her tjekkes, at hovedpersonen ses på banen,
// og at kameraet følger med, når hun løber.
test('fin grafik: banens kamera viser hovedpersonen og følger med', async ({ page }) => {
  test.setTimeout(90_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k3-til-lysning&skala=2');
  await expect(page.locator('.sted-navn')).toContainText('Den viskede sti', { timeout: 30_000 });
  const dialog = page.locator('dialog.dialogboks');
  await dialog.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  for (let i = 0; i < 20 && (await dialog.isVisible()); i++)
    await dialog.getByRole('button', { name: 'Videre' }).click({ timeout: 3_000 }).catch(() => undefined);
  const kamera = () =>
    page.evaluate(() => (window as unknown as { __pennedal: { baneKamera: () => { x: number; y: number; sx: number; sy: number } } }).__pennedal.baneKamera());
  const foer = await kamera();
  // Hovedpersonen står inde i billedet (skærmkoordinater i spillets egne pixel, 0-1).
  expect(foer.sx).toBeGreaterThan(0.02);
  expect(foer.sx).toBeLessThan(0.98);
  expect(foer.sy).toBeGreaterThan(0.3);
  expect(foer.sy).toBeLessThan(0.98);
  await page.locator('.spilflade canvas').focus().catch(() => undefined);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2500);
  await page.keyboard.up('ArrowRight');
  const efter = await kamera();
  expect(efter.x).toBeGreaterThan(foer.x + 20);
  expect(efter.sx).toBeGreaterThan(0.02);
  expect(efter.sx).toBeLessThan(0.98);
  await page.screenshot({ path: 'test-results/skaermbilleder/bane-fin-grafik.png' });
  expect(fejl).toEqual([]);
});
