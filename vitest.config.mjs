// Vitest: pruebas unitarias y de integración del código .gs. Las de extremo a extremo (pantallas)
// las ejecuta Playwright (`npm run e2e`). La cobertura es diagnóstico, no objetivo.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
});
