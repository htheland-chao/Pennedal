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
  // Dialogen lukker selv efter sidste replik, når den er læst op (8. november 2026). Den kan derfor allerede være væk.
  await dialog.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  for (let i = 0; i < 20 && (await dialog.isVisible()); i++) {
    await dialog
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  }
  await expect(dialog).toHaveCount(0);
}

async function gaaTil(page: Page, id: string) {
  await page.evaluate((x) => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil(x), id);
}

/** Svaret og en forkert mulighed for den opgave, kampen viser lige nu. */
async function facit(page: Page): Promise<{ rigtig: string; forkert: string }> {
  const info = page.locator('dialog.kamp [data-opgave-id]');
  const id = await info.getAttribute('data-opgave-id');
  if ((await info.getAttribute('data-opgave-vaesen')) === 'tomordet') {
    const s = synonymer.find((x) => x.id === id)!;
    return { rigtig: s.svar, forkert: s.forkerte[0] };
  }
  const o = stumme.find((x) => x.ord === id)!;
  const rigtig = o.ord[o.stumt];
  return { rigtig, forkert: ['d', 'h', 'v'].find((b) => b !== rigtig)! };
}

/**
 * Går hen til en ordsten og finder et synonym. Med forkertFoerst svares der først forkert (regel og eksempel).
 * Med alleForkerte prøves alle forkerte først: så kommer der ét nyt ord, før stenen er klaret (spilletest 13. november 2026).
 */
async function ordsten(page: Page, nr: number, forkertFoerst: boolean | 'alle' = false) {
  await gaaTil(page, `ordsten-${nr}`);
  const v = page.locator('dialog.ord-opgave');
  await expect(v).toBeVisible({ timeout: 15_000 });
  let id = await v.locator('[data-opgave-id]').getAttribute('data-opgave-id');
  let s = synonymer.find((x) => x.id === id)!;
  if (forkertFoerst) {
    await v.getByRole('button', { name: s.forkerte[0], exact: true }).click();
    await expect(v.locator('.besked-fejl .regel')).toContainText('Regel');
    await expect(v.locator('.besked-fejl .regel')).toContainText('Eksempel');
  }
  if (forkertFoerst === 'alle') {
    // Klik alle de andre forkerte muligheder, der står i vinduet.
    for (const tekst of await v.locator('.kamp-mulighed:not([disabled])').allTextContents())
      if (tekst.trim() !== s.svar) await v.getByRole('button', { name: tekst.trim(), exact: true }).click();
    await v.getByRole('button', { name: s.svar, exact: true }).click();
    await expect(v.locator('.ordopgave-ekstra')).toBeVisible();
    await expect(v.getByRole('button', { name: 'Skriv planken tilbage' })).toHaveCount(0);
    await v.getByRole('button', { name: 'Prøv et nyt ord' }).click();
    const nytId = await v.locator('[data-opgave-id]').getAttribute('data-opgave-id');
    expect(nytId).not.toBe(id);
    id = nytId;
    s = synonymer.find((x) => x.id === id)!;
  }
  await v.getByRole('button', { name: s.svar, exact: true }).click();
  await v.getByRole('button', { name: 'Skriv planken tilbage' }).click();
  await expect(v).toHaveCount(0);
}

/**
 * Spiller en hel turbaseret kamp i fuld skærm. Første runde lyttes der (svagt punkt) og kigges i tasken,
 * anden runde forsvares der, første slag svares forkert (regel og eksempel), og ellers slås der på væsnets svage punkt.
 * Første animation spilles helt, de næste springes over. Bliver holdet slået tilbage, går testen ind i kampen igen.
 */
async function kaemp(page: Page, navn: string, objekt: string, medVims = false) {
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toBeVisible({ timeout: 30_000 });
  const skaerm = kamp.locator('.kamp-skaerm');
  let slag = 0;
  let animationer = 0;
  for (let runde = 0; runde < 40; runde++) {
    await expect(skaerm).toHaveAttribute('data-fase', /^(menu|slut)$/, { timeout: 30_000 });
    if ((await skaerm.getAttribute('data-fase')) === 'slut') {
      const slut = kamp.locator('.kamp-slut');
      if (await slut.getByText('Vejen er fri').isVisible()) {
        await page.screenshot({ path: `${BILLEDER}/k3-${navn}-vundet.png` });
        await slut.getByRole('button', { name: 'Videre', exact: true }).click();
        await expect(kamp).toHaveCount(0);
        return;
      }
      // Blødt nederlag: ud af kampen og ind igen. Holdet har fuldt liv, og væsnerne har stadig deres sår.
      await expect(slut).toContainText('Holdet er slået tilbage');
      await slut.getByRole('button', { name: 'Tilbage', exact: true }).click();
      await expect(kamp).toHaveCount(0);
      await gaaTil(page, objekt);
      await expect(kamp).toBeVisible({ timeout: 30_000 });
      continue;
    }
    const menu = kamp.locator('.kamp-styring');
    if (runde === 0) {
      await menu.getByRole('button', { name: 'Lyt', exact: true }).click();
      await kamp.locator('.kamp-menu').getByRole('button').first().click();
      await expect(kamp.locator('.kamp-notat')).toContainText('Nu ved du');
      await expect(kamp.locator('.kamp-fjende-etiket').first()).toContainText('svagt punkt');
      await menu.getByRole('button', { name: 'Taske', exact: true }).click();
      await menu.getByRole('button', { name: 'Tilbage', exact: true }).click();
      if (medVims) {
        await menu.getByRole('button', { name: 'Hjælpere', exact: true }).click();
        await expect(menu.getByRole('button', { name: /Vims: visk et angreb ud/ })).toBeEnabled();
        await menu.getByRole('button', { name: 'Tilbage', exact: true }).click();
      }
      await page.screenshot({ path: `${BILLEDER}/k3-${navn}-kamp.png` });
    }
    if (runde === 1) {
      await menu.getByRole('button', { name: 'Forsvar', exact: true }).click();
      await expect(kamp.locator('.kamp-linje')).toContainText('Holdet dækker sig');
    } else {
      // Slå det første væsen, der stadig står, med det slag, det er svagt over for.
      const maal = (await kamp.locator('.kamp-fjende-etiket:not(.rolig) .kamp-navn').first().textContent())!.trim();
      await menu.getByRole('button', { name: 'Slå', exact: true }).click();
      const art = maal.startsWith('Tomordet') ? 'Slå med et synonym' : 'Slå med et stumt bogstav';
      const stort = menu.getByRole('button', { name: `Stort slag, der rammer alle: ${art}` });
      if (await stort.isVisible()) await stort.click();
      else await menu.getByRole('button', { name: art, exact: true }).click();
      if (await menu.getByText('Hvem vil du slå?').isVisible()) await menu.getByRole('button', { name: maal, exact: true }).click();
      const opgave = kamp.locator('.kamp-opgave-kort');
      const { rigtig, forkert } = await facit(page);
      if (slag === 0 && medVims) {
        await opgave.getByRole('button', { name: /Vims: visk en forkert mulighed ud/ }).click();
        await expect(opgave.locator('.kamp-mulighed:disabled')).toHaveCount(1);
      }
      const forkertKnap = opgave.getByRole('button', { name: forkert, exact: true });
      if (slag === 0 && (await forkertKnap.isEnabled())) {
        await forkertKnap.click();
        await expect(opgave.locator('.besked-fejl .regel')).toContainText('Regel');
        await expect(opgave.locator('.besked-fejl .regel')).toContainText('Eksempel');
        await page.screenshot({ path: `${BILLEDER}/k3-${navn}-fejl.png` });
        await opgave.getByRole('button', { name: 'Videre', exact: true }).click();
      } else {
        await opgave.getByRole('button', { name: rigtig, exact: true }).click();
        await expect(opgave.locator('.besked-god .regel')).toContainText('Regel');
        await opgave.getByRole('button', { name: 'Slå!', exact: true }).click();
      }
      slag++;
    }
    // Første animation spilles helt. Bagefter springes de over, så testen ikke tager for lang tid.
    if (animationer++ > 0) {
      const spring = kamp.getByRole('button', { name: 'Spring over' });
      if (await spring.isVisible()) await spring.click().catch(() => undefined);
    }
  }
  throw new Error(`Kampen ${navn} blev ikke vundet`);
}

test('kapitel 3: Viskeskoven, turbaserede kampe, Vims, mindet og Klattens valg', async ({ page }) => {
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
  await kaemp(page, 'tomordet', 'tomordet');
  await laesDialog(page);

  // Vims under svampen, og det tredje minde.
  await gaaTil(page, 'vims');
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await laesDialog(page);
  await expect(page.locator('.ny-ting')).toContainText('Vims');
  // Mindet er frivilligt: en kort besked, og så kan man se det.
  const besked = page.locator('.kvittering').filter({ hasText: 'Køkkenbordet' });
  await expect(besked).toContainText('Et minde: Køkkenbordet');
  await besked.getByRole('button', { name: 'Se mindet nu' }).click();
  const minde = page.locator('dialog.tilbageblik');
  await expect(minde).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${BILLEDER}/k3-03-minde.png` });
  await minde.getByRole('button', { name: 'Tilbage til Pennedal' }).click();

  // Den viskede sti (9. november 2026): platformbanen. Æseløre forklarer, og hver ordsten skriver planker tilbage.
  await expect(page.locator('.sted-navn')).toContainText('Den viskede sti', { timeout: 30_000 });
  await laesDialog(page);
  await page.screenshot({ path: `${BILLEDER}/k3-bane.png` });
  for (const nr of [0, 1, 2]) await ordsten(page, nr, nr === 0 ? true : nr === 1 ? 'alle' : false);
  await gaaTil(page, 'maal');
  await expect(page.locator('.sted-navn')).toContainText('Den hvide lysning', { timeout: 30_000 });
  await laesDialog(page);

  // Lysningen: Stummingen med Vims som hjælper.
  await gaaTil(page, 'stumming');
  await laesDialog(page);
  await gaaTil(page, 'stumming');
  await kaemp(page, 'stumming', 'stumming', true);
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

test('kapitel 3: Halvsangens sidemission og den lange hvide sti giver hukommelsesskår', async ({ page }) => {
  test.setTimeout(240_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k3-stumming-moede');
  await laesDialog(page);
  const dialog = page.locator('dialog.dialogboks');

  // Fuglen giver missionen, og så kan bladene ses.
  await gaaTil(page, 'halvfugl');
  await expect(dialog).toContainText('Min sang er gået i stykker', { timeout: 30_000 });
  await laesDialog(page);
  for (const [i, blad] of ['blad1', 'blad2', 'blad3'].entries()) {
    await gaaTil(page, blad);
    await expect(page.locator('.kvittering').filter({ hasText: `(${i + 1} af 3)` })).toBeVisible({ timeout: 30_000 });
  }
  await gaaTil(page, 'halvfugl');
  await laesDialog(page);
  const v = page.locator('dialog.ord-opgave');
  for (let i = 0; i < 3; i++) {
    const id = await v.locator('[data-opgave-id]').getAttribute('data-opgave-id');
    await v.getByRole('button', { name: synonymer.find((x) => x.id === id)!.svar, exact: true }).click();
    await v.getByRole('button', { name: i < 2 ? 'Næste ord' : 'Færdig', exact: true }).click();
  }
  await laesDialog(page);
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Viskelæderet' })).toBeVisible();

  // Den lange hvide sti: frivillig, uden hjælp, og man kan gå tilbage når som helst.
  await gaaTil(page, 'hvidsti');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 4 && !(await dialog.locator('.dialog-valg').isVisible()); i++) await dialog.getByRole('button', { name: 'Videre' }).click();
  await dialog.getByRole('button', { name: 'Gå ind på stien' }).click();
  await expect(page.locator('.sted-navn')).toContainText('Den lange hvide sti', { timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Gå tilbage' })).toBeVisible();
  for (const nr of [0, 1]) await ordsten(page, nr);
  await gaaTil(page, 'maal');
  await laesDialog(page);
  await expect(page.locator('.sted-navn')).toContainText('Den hvide lysning', { timeout: 30_000 });
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Hæftet på gulvet' })).toBeVisible();

  // Minderne ligger i tasken.
  await page.getByRole('button', { name: /Taske/ }).click();
  await expect(page.locator('dialog')).toContainText('Viskelæderet');
  await expect(page.locator('dialog')).toContainText('Hæftet på gulvet');
  expect(fejl).toEqual([]);
});

test('banen: slippes en piletast, mens ordstenens opgave er åben, løber hovedpersonen ikke videre bagefter', async ({ page }) => {
  test.setTimeout(120_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k3-til-lysning');
  await expect(page.locator('.sted-navn')).toContainText('Den viskede sti', { timeout: 30_000 });
  await laesDialog(page);
  const x = () => page.evaluate(() => (window as unknown as { __pennedal: { spillerX: () => number } }).__pennedal.spillerX());
  // Som eleven: hold højre pil nede, til ordstenen spørger, og slip tasten, mens opgaven er åben.
  await page.locator('.spilflade canvas').focus().catch(() => undefined);
  await page.keyboard.down('ArrowRight');
  const v = page.locator('dialog.ord-opgave');
  await expect(v).toBeVisible({ timeout: 30_000 });
  await page.keyboard.up('ArrowRight');
  const id = await v.locator('[data-opgave-id]').getAttribute('data-opgave-id');
  await v.getByRole('button', { name: synonymer.find((s) => s.id === id)!.svar, exact: true }).click();
  await v.getByRole('button', { name: 'Skriv planken tilbage' }).click();
  await expect(v).toHaveCount(0);
  const efter = await x();
  await page.waitForTimeout(2000);
  expect(Math.abs((await x()) - efter)).toBeLessThan(4);
  // Lydeffekterne (10. november 2026): skridt, rigtigt svar og planken, der dukker op.
  const lyde = await page.evaluate(() => (window as unknown as { __effekter?: string[] }).__effekter ?? []);
  for (const l of ['skridt', 'rigtig', 'planke']) expect(lyde, l).toContain(l);
  expect(fejl).toEqual([]);
});

