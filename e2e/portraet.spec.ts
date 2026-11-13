import { expect, test } from '@playwright/test';

// Levende portrætter (13. november 2026): figuren i dialogen blinker og bevæger munden, når en replik kommer frem.
test('portrættet i dialogen blinker og taler', async ({ page }) => {
  test.setTimeout(60_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k4-ankomst');
  const billede = page.locator('dialog.dialogboks img.pixel-portraet.levende');
  await expect(billede).toBeVisible({ timeout: 20_000 });
  // Gå frem til en replik fra en figur med øjne (ikke fortælleren).
  for (let i = 0; i < 8 && (await page.locator('dialog.dialogboks.taler-fortaeller').count()) > 0; i++)
    await page.locator('dialog.dialogboks').getByRole('button', { name: 'Videre' }).click();
  await expect(page.locator('dialog.dialogboks')).not.toHaveClass(/taler-fortaeller/);
  await page.locator('dialog.dialogboks').screenshot({ path: 'test-results/skaermbilleder/portraet-dialog.png' });
  // Over 7 sekunder ses både blink og åben mund (munden ved ny replik, også uden oplæsning).
  const set = new Set<string>(
    await page.evaluate(
      () =>
        new Promise<string[]>((svar) => {
          const img = document.querySelector('dialog.dialogboks img.pixel-portraet.levende')!;
          const set = new Set([img.getAttribute('data-billede') ?? '']);
          const obs = new MutationObserver(() => set.add(img.getAttribute('data-billede') ?? ''));
          obs.observe(img, { attributes: true, attributeFilter: ['data-billede'] });
          setTimeout(() => {
            obs.disconnect();
            svar([...set]);
          }, 7000);
        }),
    ),
  );
  expect([...set]).toEqual(expect.arrayContaining(['hvile', 'blink']));
  expect(fejl).toEqual([]);
});
