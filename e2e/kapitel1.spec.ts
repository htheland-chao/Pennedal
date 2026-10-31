import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseOgTekst, skalHaveStort } from '../src/mechanics/ogorm';

type StumtOrd = { ord: string };
type OgTekst = { id: string; tekst: string };
type Historie = { id: string };

const json = <T,>(sti: string): T => JSON.parse(readFileSync(new URL(sti, import.meta.url), 'utf8')) as T;
const stumme = json<{ ord: StumtOrd[] }>('../src/content/ord/stumme.json').ord;
const ogTekster = json<{ tekster: OgTekst[] }>('../src/content/ord/ogorm.json').tekster;
const historier = json<{ historier: Historie[] }>('../src/content/ord/historiebro.json').historier;

const ALLE = ['problem', 'portal', 'verden', 'konflikt', 'loesning', 'hjemkomst'];
const LET = ['problem', 'portal', 'loesning', 'hjemkomst'];
const BILLEDER = 'test-results/skaermbilleder';
let steg = 'start';

async function billede(page: Page, navn: string) {
  steg = `billede ${navn}`;
  await page.screenshot({ path: `${BILLEDER}/${navn}.png` });
}

/** Klikker "Videre", indtil dialogen er slut. */
async function laesDialog(page: Page) {
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 20 && (await dialog.isVisible()); i++) {
    await dialog.getByRole('button', { name: 'Videre' }).click();
  }
  await expect(dialog).toHaveCount(0);
}

async function undersoeg(page: Page, navn: string) {
  steg = `undersøg ${navn}`;
  await page.getByRole('button', { name: `Undersøg ${navn}` }).click();
}

async function videre(page: Page) {
  await page.locator('dialog.opgave').getByRole('button', { name: 'Videre' }).click();
}

async function loesHviske(page: Page) {
  const opgave = page.locator('dialog.opgave .hviske');
  await expect(opgave).toBeVisible();
  const visning = (await opgave.locator('.hviske-ord').getAttribute('aria-label')) ?? '';
  const re = new RegExp(`^${visning.replace(/_/g, '.')}$`);
  const ord = stumme.find((o) => re.test(o.ord));
  expect(ord, `ord for ${visning}`).toBeTruthy();
  const huller = [...visning].map((b, i) => (b === '_' ? i : -1)).filter((i) => i >= 0);
  const knapper = opgave.locator('.bogstav-knap');
  if ((await knapper.count()) > 0) {
    await knapper.filter({ hasText: new RegExp(`^${ord!.ord[huller[0]]}$`) }).click();
  } else {
    const felter = opgave.locator('.bogstav-felt');
    for (let i = 0; i < huller.length; i++) await felter.nth(i).fill(ord!.ord[huller[i]]);
    await opgave.getByRole('button', { name: 'Tjek' }).click();
  }
  await expect(page.locator('.besked-god')).toBeVisible();
}

async function loesOgorm(page: Page, foersteGangForkert: boolean) {
  const opgave = page.locator('dialog.opgave .ogorm');
  await expect(opgave).toBeVisible();
  const id = await opgave.getAttribute('data-tekst-id');
  const tekst = ogTekster.find((x) => x.id === id)!;
  const tokens = parseOgTekst(tekst.tekst);
  if (foersteGangForkert) {
    await opgave.getByRole('button', { name: 'Tjek' }).click();
    await expect(page.locator('.besked-fejl')).toContainText('Ormen er stadig for lang');
  }
  const punktummer = tokens.map((t, i) => (t.ogType === 's' ? i : -1)).filter((i) => i >= 0);
  for (const i of punktummer) await opgave.locator(`[data-token="${i}"]`).click();
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].erOg) continue;
    const skal = skalHaveStort(tokens, { punktummer, skiftet: [] }, i);
    const har = tokens[i].ord[0] !== tokens[i].ord[0].toLowerCase();
    if (skal !== har) await opgave.locator(`[data-token="${i}"]`).click();
  }
  await opgave.getByRole('button', { name: 'Tjek' }).click();
  await expect(page.locator('.besked-god')).toBeVisible();
}

async function loesBro(page: Page) {
  const opgave = page.locator('dialog.opgave .bro');
  await expect(opgave).toBeVisible();
  expect(historier.map((h) => h.id)).toContain(await opgave.getAttribute('data-historie-id'));
  const fremmed = opgave.locator('.planker [data-planke-id="fremmed"]');
  if ((await fremmed.count()) > 0) await fremmed.getByRole('button', { name: 'Læg til side' }).click();
  const antal = await opgave.locator('.planker > li').count();
  const facit = antal === 4 ? LET : ALLE;
  for (let i = 0; i < facit.length; i++) {
    const ids = await opgave.locator('.planker > li').evaluateAll((li) => li.map((l) => l.getAttribute('data-planke-id')));
    let j = ids.indexOf(facit[i]);
    while (j > i) {
      await opgave.locator(`.planker > li[data-planke-id="${facit[i]}"]`).getByRole('button', { name: /Flyt op/ }).click();
      j--;
    }
  }
  await opgave.getByRole('button', { name: 'Tjek' }).click();
  await expect(page.locator('.besked-god')).toBeVisible();
}

test('kapitel 1 kan spilles fra start til slut, og gemmekoden virker', async ({ page }) => {
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(`${e.message}\n${e.stack}\nTrin: ${steg}`));
  page.on('console', (m) => {
    if (m.type() === 'error') fejl.push(m.text());
  });

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await billede(page, '01-start');

  await page.getByRole('button', { name: 'Start et nyt eventyr' }).click();
  await expect(page.getByRole('heading', { name: 'Skab din hovedperson' })).toBeVisible();
  await page.getByRole('button', { name: 'Næste På hovedet' }).click();
  await expect(page.getByText('Tørklæde', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Næste Hudfarve' }).click();
  await page.getByRole('button', { name: 'Næste Frisure' }).click();
  await expect(page.getByText(/Kappe er låst/)).toBeVisible();
  await billede(page, '02-avatar');
  await page.getByRole('button', { name: 'Klar til eventyret' }).click();

  // Del 1: biblioteket.
  await expect(page.getByText('Tal med hr. Holm.')).toBeVisible();
  await page.waitForTimeout(500);
  await billede(page, '03-bibliotek');
  await undersoeg(page, 'hr. Holm');
  await billede(page, '04-dialog');
  await laesDialog(page);

  await undersoeg(page, 'logbogen på disken');
  await page.getByRole('button', { name: /logbog/ }).first().click();
  await expect(page.getByRole('dialog', { name: /Ordkort: logbog/ })).toBeVisible();
  await page.getByRole('dialog', { name: /Ordkort/ }).getByRole('button', { name: 'Luk' }).click();
  await page.getByRole('button', { name: 'Læs teksten' }).click();
  await page.locator('[data-saetning="0"]').getByRole('button', { name: /Vælg/ }).click();
  await expect(page.locator('.besked-fejl')).toContainText('nævner ordbogen');
  await page.locator('[data-saetning="1"]').getByRole('button', { name: /Vælg/ }).click();
  await expect(page.locator('.besked-god')).toBeVisible();
  await billede(page, '05-bevisjagt');
  await videre(page);
  await page.locator('[data-saetning="3"]').getByRole('button', { name: /Vælg/ }).click();
  await videre(page);
  await undersoeg(page, 'hr. Holm');
  await laesDialog(page);

  await undersoeg(page, 'trappen til kælderen');
  await laesDialog(page);
  await page.waitForTimeout(800);
  await billede(page, '05b-kaelder');
  await undersoeg(page, 'kartoteksskabet');
  await laesDialog(page);
  await undersoeg(page, 'kartoteksskabet');
  for (let i = 0; i < 6; i++) {
    await loesHviske(page);
    if (i === 0) await billede(page, '06-hviske');
    await videre(page);
  }
  await laesDialog(page);
  const kode = await page.locator('.gemmekode').getAttribute('data-gemmekode');
  expect(kode).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{1,4})+$/);
  await billede(page, '07-gemmekode');
  await page.getByRole('button', { name: 'Spil videre' }).click();

  // Del 2: Pennedal.
  await laesDialog(page);
  await page.waitForTimeout(300);
  await billede(page, '08-pennedal');
  await undersoeg(page, 'Klatten');
  await laesDialog(page);
  await undersoeg(page, 'Klattens skilt');
  for (let i = 0; i < 3; i++) {
    await loesOgorm(page, i === 0);
    if (i === 0) await billede(page, '09-ogorm');
    await videre(page);
  }
  await laesDialog(page);
  await page.getByRole('button', { name: 'Spil videre' }).click();

  // Del 3: floden og fyrtårnet.
  await undersoeg(page, 'stien mod floden');
  await laesDialog(page);
  await undersoeg(page, 'den brudte bro');
  for (let i = 0; i < 2; i++) {
    await loesBro(page);
    if (i === 0) await billede(page, '10-bro');
    await videre(page);
  }
  await undersoeg(page, 'den brudte bro');
  await laesDialog(page);
  await expect(page.getByText('Kapitel 1 er slut.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fortsæt til kapitel 2' })).toBeVisible();
  await expect(page.getByText('Mor Lanternes lanterne')).toBeVisible();
  await billede(page, '11-fyrtaarn');

  // Fremskridtet er gemt i browseren.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Fortsæt eventyret' })).toBeVisible();

  // Lærerkig med CSV.
  await page.getByRole('button', { name: 'Lærerkig' }).click();
  await page.getByLabel('Lærerkode').fill('2026');
  await page.getByRole('button', { name: 'Åbn' }).click();
  await expect(page.getByRole('row', { name: /Stumme bogstaver/ })).toContainText('3');
  await billede(page, '12-laererkig');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Hent som CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
  await page.getByRole('button', { name: 'Luk' }).last().click();

  // Fortsæt med gemmekoden fra del 1 (med små bogstaver og uden bindestreger).
  await page.getByRole('button', { name: 'Fortsæt med en gemmekode' }).click();
  await page.getByLabel('Gemmekode').fill(kode!.replace(/-/g, '').toLowerCase());
  await page.getByRole('button', { name: 'Fortsæt', exact: true }).click();
  await page.getByRole('button', { name: 'Ja, start forfra' }).click();
  await expect(page.locator('dialog.dialogboks')).toContainText('Du lander blødt');

  expect(fejl, fejl.join('\n')).toEqual([]);
});

test('en forkert gemmekode giver en forståelig besked', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Fortsæt med en gemmekode' }).click();
  await page.getByLabel('Gemmekode').fill('ABCD');
  await page.getByRole('button', { name: 'Fortsæt', exact: true }).click();
  await expect(page.getByText(/Koden skal have \d+ tegn\. Du har skrevet 4\./)).toBeVisible();
});

test('indstillingerne skifter skrift og størrelse', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Indstillinger' }).click();
  await page.getByLabel('OpenDyslexic').check();
  await page.getByLabel('Ekstra stor').check();
  await expect(page.locator('html')).toHaveAttribute('data-skrift', 'ordblind');
  await expect(page.locator('html')).toHaveAttribute('data-stoerrelse', '3');
  await page.getByRole('button', { name: 'Luk' }).click();
  await billede(page, '13-ordblind-skrift');
});

test('intet går ud over kanten på en mobil, hverken stående eller liggende', async ({ browser }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const forBred = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    await page.goto('/');
    expect(await forBred(), `start ${viewport.width}`).toBe(false);
    await page.getByRole('button', { name: 'Start et nyt eventyr' }).click();
    expect(await forBred(), `avatar ${viewport.width}`).toBe(false);
    await page.getByRole('button', { name: 'Klar til eventyret' }).tap();
    await expect(page.getByRole('button', { name: 'Undersøg hr. Holm' })).toBeVisible();
    expect(await forBred(), `verden ${viewport.width}`).toBe(false);
    await ctx.close();
  }
});
