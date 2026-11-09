import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Fejl = { skrevet: string; rigtig: string; ekstra: string };
type Tekst = { id: string; fejl: Fejl[] };
type Stumt = { ord: string; stumt: number };
const laes = <T,>(sti: string) => JSON.parse(readFileSync(new URL(`../src/content/${sti}`, import.meta.url), 'utf8')) as T;
const tekster = laes<{ tekster: Tekst[] }>('ord/korrektur.json').tekster;
const stumme = laes<{ ord: Stumt[] }>('ord/stumme.json').ord;
const BILLEDER = 'test-results/skaermbilleder';

async function laesDialog(page: Page) {
  const dialog = page.locator('dialog.dialogboks');
  await dialog.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
  for (let i = 0; i < 20 && (await dialog.isVisible()); i++) {
    await dialog
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  }
  await expect(dialog).toHaveCount(0);
}

/** Klikker videre i dialogen, til valget kommer, og vælger muligheden. */
async function vaelg(page: Page, svar: string) {
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 12 && !(await dialog.locator('.dialog-valg').isVisible()); i++)
    await dialog
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  await dialog.getByRole('button', { name: svar }).click();
}

/** Klikker videre i dialogen, til teksten står der. */
async function venterPaa(page: Page, tekst: string) {
  const dialog = page.locator('dialog.dialogboks');
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  for (let i = 0; i < 12 && !(await dialog.getByText(tekst).isVisible()); i++)
    await dialog
      .getByRole('button', { name: 'Videre' })
      .click({ timeout: 3_000 })
      .catch(() => undefined);
  await expect(dialog).toContainText(tekst);
}

async function gaaTil(page: Page, id: string) {
  await page.evaluate((x) => (window as unknown as { __pennedal: { gaaTil: (id: string) => void } }).__pennedal.gaaTil(x), id);
}

/** Den rigtige stavemåde for en fejl med id som k07.1 (tekst og fejl). */
function rigtigFor(id: string): string {
  const [t, nr] = id.split('.');
  return tekster.find((x) => x.id === t)!.fejl[Number(nr)].rigtig;
}

/** Små stavningsopgaver (sidemissionen og stenene). */
async function stavning(page: Page, antal: number, sidste: string) {
  const v = page.locator('dialog.ord-opgave');
  await expect(v).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < antal; i++) {
    const id = (await v.locator('[data-opgave-id]').getAttribute('data-opgave-id'))!;
    await v.getByRole('button', { name: rigtigFor(id), exact: true }).click();
    await expect(v.locator('.besked-god .regel')).toContainText('Regel');
    await v.getByRole('button', { name: i < antal - 1 ? 'Næste ord' : sidste, exact: true }).click();
  }
  await expect(v).toHaveCount(0);
}

/** Kampen ved Blæksøen: rettelser mod Krusedullerne, stumme bogstaver mod Stummingen. */
async function kaemp(page: Page, medKlatten: boolean, navn = 'k6-kamp') {
  const kamp = page.locator('dialog.kamp');
  await expect(kamp).toBeVisible({ timeout: 30_000 });
  if (medKlatten) await expect(kamp.locator('.kamp-navn').filter({ hasText: 'Klatten' })).toHaveCount(1);
  else await expect(kamp.locator('.kamp-navn').filter({ hasText: 'Klatten' })).toHaveCount(0);
  const skaerm = kamp.locator('.kamp-skaerm');
  let animationer = 0;
  let brugtKlatten = false;
  for (let runde = 0; runde < 50; runde++) {
    await expect(skaerm).toHaveAttribute('data-fase', /^(menu|slut)$/, { timeout: 30_000 });
    if ((await skaerm.getAttribute('data-fase')) === 'slut') {
      const slut = kamp.locator('.kamp-slut');
      if (await slut.getByText('Vejen er fri').isVisible()) {
        await page.screenshot({ path: `${BILLEDER}/${navn}-vundet.png` });
        await slut.getByRole('button', { name: 'Videre', exact: true }).click();
        await expect(kamp).toHaveCount(0);
        return;
      }
      await slut.getByRole('button', { name: 'Tilbage', exact: true }).click();
      await expect(kamp).toHaveCount(0);
      await gaaTil(page, 'krusedulle');
      await expect(kamp).toBeVisible({ timeout: 30_000 });
      continue;
    }
    const menu = kamp.locator('.kamp-styring');
    if (runde === 0) await page.screenshot({ path: `${BILLEDER}/${navn}.png` });
    const maal = (await kamp.locator('.kamp-fjende-etiket:not(.rolig) .kamp-navn').first().textContent())!.trim();
    await menu.getByRole('button', { name: 'Slå', exact: true }).click();
    const art = maal.startsWith('Stumming') ? 'Slå med et stumt bogstav' : 'Slå med en rettelse';
    const stort = menu.getByRole('button', { name: `Stort slag, der rammer alle: ${art}` });
    if (await stort.isVisible()) await stort.click();
    else await menu.getByRole('button', { name: art, exact: true }).click();
    if (await menu.getByText('Hvem vil du slå?').isVisible()) await menu.getByRole('button', { name: maal, exact: true }).click();
    const opgave = kamp.locator('.kamp-opgave-kort');
    const info = kamp.locator('[data-opgave-id]');
    const id = (await info.getAttribute('data-opgave-id'))!;
    const vaesen = await info.getAttribute('data-opgave-vaesen');
    if (medKlatten && !brugtKlatten && vaesen === 'krusedulle') {
      // Klatten viser en af sine gamle fejl, og den mulighed forsvinder.
      brugtKlatten = true;
      await opgave.getByRole('button', { name: /^Klatten: vis en af mine gamle fejl/ }).click();
      await expect(kamp).toContainText('Den fejl har jeg selv lavet');
    }
    const svar = vaesen === 'krusedulle' ? rigtigFor(id) : (() => {
      const o = stumme.find((x) => x.ord === id)!;
      return o.ord[o.stumt];
    })();
    await opgave.getByRole('button', { name: svar, exact: true }).click();
    await expect(opgave.locator('.besked-god .regel')).toContainText('Regel');
    await opgave.getByRole('button', { name: 'Slå!', exact: true }).click();
    if (animationer++ > 0) {
      const spring = kamp.getByRole('button', { name: 'Spring over' });
      if (await spring.isVisible()) await spring.click().catch(() => undefined);
    }
  }
  throw new Error('Kampen ved Blæksøen blev ikke vundet');
}

test('kapitel 6: Blæksøen, Klattens tekster, twist 2, Krusedullerne med Klatten på holdet', async ({ page }) => {
  test.setTimeout(480_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));

  await page.goto('/?hop=k6-ankomst');
  await laesDialog(page);
  await expect(page.locator('main.verden')).toHaveClass(/tema-blaeksoe/);
  await page.screenshot({ path: `${BILLEDER}/k6-01-soeen.png` });

  // Sidemissionen (frivillig): Postsneglens tre våde breve.
  await gaaTil(page, 'snegl');
  await expect(page.locator('dialog.dialogboks')).toContainText('Postsneglen', { timeout: 30_000 });
  await laesDialog(page);
  for (const [i, brev] of ['brev1', 'brev2', 'brev3'].entries()) {
    await gaaTil(page, brev);
    await expect(page.locator('.kvittering').filter({ hasText: `(${i + 1} af 3)` })).toBeVisible({ timeout: 30_000 });
  }
  await gaaTil(page, 'snegl');
  await laesDialog(page);
  await stavning(page, 3, 'Færdig');
  await laesDialog(page);
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Klatten på siden' })).toBeVisible();

  // Stenene over Blæksøen (frivillig udflugt).
  await gaaTil(page, 'bro');
  await vaelg(page, 'Hop ud');
  await expect(page.locator('.sted-navn')).toContainText('Stenene over Blæksøen', { timeout: 30_000 });
  await laesDialog(page);
  await page.screenshot({ path: `${BILLEDER}/k6-02-stenene.png` });
  for (const nr of [0, 1]) {
    await gaaTil(page, `ordsten-${nr}`);
    await stavning(page, 1, 'Skriv planken tilbage');
  }
  await gaaTil(page, 'maal');
  await laesDialog(page);
  await expect(page.locator('.sted-navn')).toContainText('Blæksøens bred', { timeout: 30_000 });
  await expect(page.locator('.kvittering').filter({ hasText: 'Et hukommelsesskår: Kassen ved døren' })).toBeVisible();

  // Døren: giv Klatten kappen tilbage. Så bliver han en ven.
  await gaaTil(page, 'hytte');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${BILLEDER}/k6-02b-hytte-udefra.png` });
  await vaelg(page, 'Giv ham kappen tilbage');
  await laesDialog(page);
  await gaaTil(page, 'hytte');
  await expect(page.locator('.sted-navn')).toContainText('Klattens hytte', { timeout: 30_000 });
  await laesDialog(page);
  await page.screenshot({ path: `${BILLEDER}/k6-03-hytten.png` });
  await gaaTil(page, 'kasser');
  await venterPaa(page, 'de samme fejl');
  await laesDialog(page);

  // Klattens tekster: find fejlen, og vælg den rigtige stavemåde. Først et ord, der er rigtigt, og et forkert valg.
  await gaaTil(page, 'skrivebord');
  const opg = page.locator('dialog.opgave .korrektur-opgave');
  for (let i = 0; i < 6; i++) {
    await expect(opg).toBeVisible({ timeout: 15_000 });
    const tekstId = (await opg.getAttribute('data-opgave-id'))!;
    if (i === 0) {
      await opg.locator('.korrektur-ord:not([data-fejl])').first().click();
      await expect(opg.locator('.besked-info .regel')).toContainText('Læs langsomt');
    }
    const ord = opg.locator('.korrektur-ord[data-fejl]').first();
    const nr = (await ord.getAttribute('data-fejl'))!;
    await ord.click();
    const rigtig = rigtigFor(`${tekstId}.${nr}`);
    if (i === 0) {
      const forkert = (await opg.locator('.kamp-mulighed').allTextContents()).find((m) => m !== rigtig)!;
      await opg.locator('.kamp-muligheder').getByRole('button', { name: forkert, exact: true }).click();
      await expect(page.locator('dialog.opgave .besked-fejl .regel')).toContainText('Regel');
      await page.screenshot({ path: `${BILLEDER}/k6-04-korrektur.png` });
    }
    await opg.locator('.kamp-muligheder').getByRole('button', { name: rigtig, exact: true }).click();
    await expect(page.locator('dialog.opgave .besked-god')).toBeVisible();
    await expect(opg.locator('.korrektur-rettet').filter({ hasText: rigtig })).toBeVisible();
    await page.locator('dialog.opgave').getByRole('button', { name: 'Videre' }).click();
  }
  await laesDialog(page);

  // Twist 2 ved søen.
  await gaaTil(page, 'ud');
  await expect(page.locator('.sted-navn')).toContainText('Blæksøens bred', { timeout: 30_000 });
  await gaaTil(page, 'aeseloere-bred');
  await venterPaa(page, 'ikke været helt ærlig');
  await page.screenshot({ path: `${BILLEDER}/k6-05-twist.png` });
  await vaelg(page, 'Jeg tilgiver dig');
  await laesDialog(page);
  await expect(page.locator('.kvittering').filter({ hasText: 'Hjørnet bliver foldet' })).toBeVisible({ timeout: 15_000 });

  // Krusedullerne kommer op af søen. Klatten er med på holdet.
  await laesDialog(page);
  await gaaTil(page, 'krusedulle');
  await kaemp(page, true);
  await laesDialog(page);

  // Farvel ved bredden. Kapitlet slutter.
  await gaaTil(page, 'klatten-bred');
  const slut = page.getByText('Kapitel 6 er slut.');
  const dialog = page.locator('dialog.dialogboks');
  for (let i = 0; i < 30 && !(await slut.isVisible()); i++) {
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Videre' }).click({ timeout: 3_000 }).catch(() => undefined);
    else await page.waitForTimeout(500);
  }
  await expect(slut).toBeVisible();
  expect(fejl).toEqual([]);
});

test('kapitel 6: uden venlighed sniger man sig ind, og Klatten er ikke med i kampen', async ({ page }) => {
  test.setTimeout(240_000);
  const fejl: string[] = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto('/?hop=k6-doer');
  await laesDialog(page);
  await gaaTil(page, 'hytte');
  await venterPaa(page, 'Gå væk');
  await vaelg(page, 'Tag kappen på, og snig dig ind');
  await laesDialog(page);
  await gaaTil(page, 'hytte');
  await venterPaa(page, 'Du har min kappe på');
  await laesDialog(page);

  await page.goto('/?hop=k6-krusedul');
  await venterPaa(page, 'under bordet');
  await laesDialog(page);
  await gaaTil(page, 'krusedulle');
  await kaemp(page, false, 'k6-kamp-uden-klatten');
  expect(fejl).toEqual([]);
});
