// Pruebas del propio arnés: si el puente google.script.run miente, todas las pantallas mienten.
import { expect, test } from '@playwright/test';
import { iniciarAplicacion } from './arnes.mjs';
import { CODIGO, HTML } from '../soporte/cargar-gs.js';

let app;
test.beforeEach(async () => {
  app = await iniciarAplicacion({
    codigo: [CODIGO.complementos],
    html: { Portal: HTML.complementosPortal, Index: HTML.complementosReportar, Consultas: HTML.complementosConsultas },
  });
});
test.afterEach(async () => app.cerrar());

test('la cadena withSuccessHandler(f).funcion() llega al .gs y devuelve el resultado', async ({ page }) => {
  await page.goto(`${app.url}/?page=portal`);
  await page.evaluate(() => {
    window.google.script.run.withSuccessHandler((v, u) => { window.__ok = { v, u }; }).withUserObject('marca').doGet({ parameter: { page: 'portal' } });
  });
  await page.waitForFunction(() => window.__ok);
  expect(await page.evaluate(() => window.__ok.u)).toBe('marca');
  expect(app.llamadas.map((l) => l.nombre)).toContain('doGet');
});

test('un error del .gs llega al manejador de fallo, no al de éxito', async ({ page }) => {
  await page.goto(`${app.url}/?page=portal`);
  await page.evaluate(() => {
    window.google.script.run
      .withSuccessHandler(() => { window.__resultado = 'ok'; })
      .withFailureHandler((e) => { window.__resultado = `fallo: ${e.message}`; })
      .funcionQueNoExiste();
  });
  await page.waitForFunction(() => window.__resultado);
  expect(await page.evaluate(() => window.__resultado)).toMatch(/^fallo: /);
});

test('google.script.host.close marca el diálogo como cerrado', async ({ page }) => {
  await page.goto(`${app.url}/?page=portal`);
  await page.evaluate(() => window.google.script.host.close());
  expect(await page.evaluate(() => window.__dialogoCerrado)).toBe(true);
});
