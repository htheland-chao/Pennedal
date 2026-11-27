import { expect, type Page } from '@playwright/test';

const ren = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Klikker "Videre" i dialogen, til en bestemt replik står der (fælles for kapitel 6-8, 26. november 2026).
 *
 * Tidligere tjekkede hjælperen først teksten og derefter, om der var en dialog, i to kald. I en filmsekvens kan en ny
 * dialog dukke op lige imellem de to kald, og så blev der klikket "Videre" på netop den replik, der blev ventet på
 * (set i kapitel 8 på GitHub). Nu læses dialogens tekst i ét kald, og der klikkes kun på en dialog, der stadig viser
 * den samme replik. Er dialogen skiftet imens, klikkes der ikke.
 */
export async function venterPaa(page: Page, tekst: string, gange = 60) {
  const dialog = page.locator('dialog.dialogboks');
  const replik = dialog.locator('.dialog-tekst p[aria-live]');
  const maal = ren(tekst).toLowerCase();
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < gange; i++) {
    const nu = await replik.textContent({ timeout: 500 }).catch(() => null);
    if (nu === null) {
      await page.waitForTimeout(300);
      continue;
    }
    if (ren(await dialog.textContent().catch(() => '') ?? '').toLowerCase().includes(maal)) break;
    await dialog
      .filter({ has: page.locator('.dialog-tekst p[aria-live]', { hasText: ren(nu) }) })
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 1_000 })
      .catch(() => undefined);
  }
  await expect(dialog).toContainText(tekst);
}
