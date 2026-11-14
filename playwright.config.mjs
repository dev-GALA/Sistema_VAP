// Playwright: extremo a extremo de las pantallas HTML, contra el arnés local (sin Google ni datos reales).
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.mjs',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: { headless: true, locale: 'es-ES', timezoneId: 'Europe/Madrid' },
});
