import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Synonym = { id: string; svar: string; forkerte: string[] };
type Stumt = { ord: string; stumt: number };
const laes = <T,>(sti: string) => JSON.parse(readFileSync(new URL(`../src/content/${sti}`, import.meta.url), 'utf8')) as T;
const synonymer = laes<{ ord: Synonym[] }>('ord/synonymer.json').ord;
const stumme = laes<{ ord: Stumt[] }>('ord/stumme.json').ord;
const BILLEDER = 'test-results/skaermbilleder';

async function laesDialog(page: Page) {
  const dialog = page.locator('dialog.dialogboks');
  // Testbrowseren tegner langsomt, så det kan tage tid at gå hen til den, der skal tales med.
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 30 && (await dialog.isVisible()); i++) await dialog.getByRole('button', { name: 'Videre' }).click();
  await expect(dialog).toHaveCount(0);
}

async function gaaTil(page: Page, id: string) {
  await page.evaluate((x) => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil(x), id);
}

/** Svaret og en forkert mulighed for den opgave, kampen viser lige nu. */
async function facit(page: Page): Promise<{ rigtig: string; forkert: string }> {
  const kamp = page.locator('dialog.kamp');
  const id = await kamp.locator('[data-opgave-id]').getAttribute('data-opgave-id');
  if (await kamp.evaluate((d) => d.classList.contains('kamp-tomordet'))) {
    const s = synonymer.find((x) => x.id === id)!;
    return { rigtig: s.svar, forkert: s.forkerte[0] };
  }
  const o = stumme.find((x) => x.ord === id)!;
  const rigtig = o.ord[o.stumt];
  return { rigtig, forkert: ['d', 'h', 'v'].find((b) => b !== rigtig)! };
}

/** Spiller en hel kamp. Første tur svares forkert én gang, så regel og eksempel bliver vist. */
async function kaemp(page: Page, navn: string, medVims = false) {
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toBeVisible({ timeout: 30_000 });
  for (let tur = 0; tur < 6; tur++) {
    if (await kamp.getByRole('button', { name: 'Videre' }).isVisible()) break;
    if (tur === 0) {
      await kamp.getByRole('button', { name: 'Lyt' }).click();
      await expect(kamp.locator('.besked-info')).toBeVisible();
    }
    await kamp.getByRole('button', { name: 'Skriv færdig' }).click();
    const { rigtig, forkert } = await facit(page);
    if (tur === 0 && medVims) {
      await kamp.getByRole('button', { name: 'Spørg Vims' }).click();
      await expect(kamp.locator('.kamp-mulighed:disabled')).toHaveCount(1);
      await expect(kamp.getByRole('button', { name: 'Spørg Vims' })).toHaveCount(0);
    }
    if (tur === 0) {
      const knap = kamp.getByRole('button', { name: forkert, exact: true });
      if (await knap.isEnabled()) {
        await knap.click();
        await expect(kamp.locator('.besked-fejl .regel')).toContainText('Regel');
        await expect(kamp.locator('.besked-fejl .regel')).toContainText('Eksempel');
        await page.screenshot({ path: `${BILLEDER}/k3-${navn}-fejl.png` });
      }
    }
    await kamp.getByRole('button', { name: rigtig, exact: true }).click();
    await expect(kamp.locator('.besked-god .regel')).toContainText('Regel');
    await kamp.getByRole('button', { name: 'Næste tur' }).click();
  }
  await expect(kamp.locator('.kamp-angreb')).toContainText(/roligt|stille/);
  await kamp.getByRole('button', { name: 'Videre' }).click();
  await expect(kamp).toHaveCount(0);
}

test('kapitel 3: Viskeskoven, rolige kampe, Vims, mindet og Klattens valg', async ({ page }) => {
  test.setTimeout(420_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));

  await page.goto('/?hop=k3-ankomst');
  await laesDialog(page);
  await expect(page.locator('main.verden')).toHaveClass(/tema-viskeskov/);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${BILLEDER}/k3-01-skoven.png` });

  await gaaTil(page, 'skilt');
  await laesDialog(page);
  // Tal igen: skiltet kan læses igen, uden at historien går videre.
  await gaaTil(page, 'skilt');
  await expect(page.locator('dialog.dialogboks')).toContainText('Skiltet er helt hvidt', { timeout: 30_000 });
  await laesDialog(page);
  await expect(page.locator('.naeste-tekst')).toContainText('Gå hen til væsnet på stien.');
  await gaaTil(page, 'tomordet');
  await laesDialog(page);

  // Første kamp: Tomordet (synonymer). Gå væk midt i, og kom tilbage: væsnet venter, og turen er husket.
  await gaaTil(page, 'tomordet');
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toContainText('Tomordet', { timeout: 30_000 });
  await page.screenshot({ path: `${BILLEDER}/k3-02-kamp.png` });
  await kamp.getByRole('button', { name: 'Gå væk' }).click();
  await expect(kamp).toHaveCount(0);
  await gaaTil(page, 'tomordet');
  await kaemp(page, 'tomordet');
  await laesDialog(page);

  // Vims under svampen, og det tredje minde.
  await gaaTil(page, 'vims');
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 5; i++) await dialog.getByRole('button', { name: 'Videre' }).click();
  const minde = page.locator('dialog.tilbageblik');
  await expect(minde).toContainText('Et minde: Køkkenbordet');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${BILLEDER}/k3-03-minde.png` });
  await minde.getByRole('button', { name: 'Tilbage til Pennedal' }).click();
  await laesDialog(page);
  await expect(page.locator('.ny-ting')).toContainText('Vims');
  await page.getByRole('button', { name: 'Spil videre' }).click();

  // Lysningen: Stummingen med Vims som hjælper.
  await gaaTil(page, 'sti');
  await laesDialog(page);
  await gaaTil(page, 'stumming');
  await laesDialog(page);
  await gaaTil(page, 'stumming');
  await kaemp(page, 'stumming', true);
  await laesDialog(page);

  // Klattens valg.
  await gaaTil(page, 'klatten');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 4; i++) await dialog.getByRole('button', { name: 'Videre' }).click();
  await expect(dialog.locator('.dialog-valg')).toContainText('Hvad gør du?');
  await page.screenshot({ path: `${BILLEDER}/k3-04-valg.png` });
  await dialog.getByRole('button', { name: 'Hjælp Klatten fri' }).click();
  await expect(dialog).toContainText('punktum');
  // Klik gennem Klattens svar, indtil mørket kommer (den næste dialog åbner af sig selv).
  const verden = page.locator('main.verden');
  for (let i = 0; i < 12 && !/moerke/.test((await verden.getAttribute('class')) ?? ''); i++)
    await dialog.getByRole('button', { name: 'Videre' }).click();

  // Mørket og kapitlets slutning.
  await expect(verden).toHaveClass(/moerke/);
  for (let i = 0; i < 3 && !((await dialog.textContent()) ?? '').includes('Og så'); i++) await dialog.getByRole('button', { name: 'Videre' }).click();
  await expect(dialog).toContainText('Og så');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${BILLEDER}/k3-05-moerke.png` });
  await laesDialog(page);
  await expect(page.getByText('Kapitel 3 er slut.')).toBeVisible();
  expect(fejl).toEqual([]);
});
