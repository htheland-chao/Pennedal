import { defineConfig } from '@playwright/test';

// I CI bruges Playwrights egen Chromium. Lokalt kan en anden Chromium bruges via CHROMIUM_STI.
const sti = process.env.CHROMIUM_STI;

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1366, height: 768 },
    locale: 'da-DK',
    trace: 'retain-on-failure',
    launchOptions: sti
      ? {
          executablePath: sti,
          args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--in-process-gpu'],
        }
      : {},
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
