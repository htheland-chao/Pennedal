/**
 * Grafikark: starter Vites udviklingsserver, tegner alle pixelfigurer på ark.html og gemmer et billede
 * af hver gruppe i test-results/ark. Skriver også en kort rapport (størrelse, farver, advarsler).
 * Lokalt kan en anden Chromium bruges med CHROMIUM_STI.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = 4180;
const URL = `http://127.0.0.1:${PORT}/ark.html`;
const MAPPE = 'test-results/ark';
mkdirSync(MAPPE, { recursive: true });

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
const stop = () => vite.kill();
process.on('exit', stop);

async function venter() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(URL)).ok) return;
    } catch {
      /* serveren er ikke klar endnu */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Vite startede ikke');
}

let kode = 0;
try {
  await venter();
  const sti = process.env.CHROMIUM_STI;
  const browser = await chromium.launch(sti ? { executablePath: sti, args: ['--no-sandbox'] } : {});
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const fejl = [];
  page.on('pageerror', (e) => fejl.push(e.message));
  await page.goto(URL);
  await page.waitForSelector('body[data-klar="ja"]', { timeout: 20_000 });
  const sektioner = await page.locator('section[data-ark]').all();
  for (const s of sektioner) {
    const id = await s.getAttribute('data-ark');
    await s.screenshot({ path: `${MAPPE}/${id}.png` });
    console.log(`Gemt ${MAPPE}/${id}.png`);
  }
  const rapport = await page.evaluate(() => window.__ark);
  await browser.close();
  const advarsler = rapport.filter((r) => r.advarsler.length);
  console.log(`\n${rapport.length} figurer tegnet, ${advarsler.length} med advarsler.`);
  for (const r of advarsler) console.log(`  ${r.gruppe} / ${r.navn}: ${r.advarsler.join('; ')}`);
  if (fejl.length) {
    console.log(`\nFejl på siden:\n  ${fejl.join('\n  ')}`);
    kode = 1;
  }
} catch (e) {
  console.error(e);
  kode = 1;
} finally {
  stop();
}
process.exit(kode);
