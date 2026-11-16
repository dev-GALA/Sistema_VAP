// E2E de la webapp del proceso mensual (ADR-0017): las pantallas HTML REALES contra el .gs real, con el
// Google falso. Cubre el acceso por rol, las cinco pantallas y el estado de los pasos (HU-45 · RF-79).
import { expect, test } from '@playwright/test';
import { SRC_WEBAPP } from '../soporte/cargar-gs.js';
import { ARCHIVOS_GS, CONFIG_NORMAL, prepararLibro, RUTAS_HTML } from '../webapp/cargar.js';
import { iniciarAplicacion } from './arnes.mjs';

let app;
test.afterEach(async () => app?.cerrar());

const arrancar = async ({ usuario = 'sara@gala.test', libro = { config: CONFIG_NORMAL, estadoPasos: [] } } = {}) => {
  app = await iniciarAplicacion({
    raiz: SRC_WEBAPP,
    codigo: ARCHIVOS_GS,
    html: RUTAS_HTML,
    google: { usuario },
    preparar: (entorno) => prepararLibro(entorno, libro),
  });
  return app;
};

const TITULOS = ['Proceso mensual', 'Comprobaciones', 'Registro de diferencias', 'Altas/bajas', 'Maestro de personal'];

test('quien tiene acceso ve las cinco pantallas, su correo y su rol', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await expect(page.locator('#navegacion a')).toHaveText(TITULOS);
  await expect(page.locator('#usuario')).toHaveText('sara@gala.test · administracion');
  await expect(page.locator('footer')).toContainText('webapp v0.1.0');
});

test('arranca en Proceso mensual y muestra los tres pasos pendientes', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await expect(page.locator('#navegacion a[aria-current="page"]')).toHaveText('Proceso mensual');
  const pasos = page.locator('#lista-pasos > li');
  await expect(pasos).toHaveCount(3);
  await expect(pasos.nth(0)).toContainText('primera exportación de SAGE');
  await expect(pasos.nth(0)).toContainText('Paso manual');
  await expect(pasos.nth(2)).toContainText('Se ejecuta desde esta pantalla · aún no disponible');
  await expect(pasos.locator('.chip')).toHaveText(['Pendiente', 'Pendiente', 'Pendiente']);
});

test('el estado de cada paso sale del libro de la webapp y cambia con el periodo', async ({ page }) => {
  await arrancar({
    libro: {
      config: CONFIG_NORMAL,
      estadoPasos: [
        ['2026-11', 'actualizar-export-sage', 'hecho', 'sara@gala.test', '2026-11-03'],
        ['2026-11', 'actualizar-bbdd-personas', 'con-incidencias', 'sara@gala.test', '2026-11-04'],
        ['2026-10', 'actualizar-export-sage', 'pendiente', 'sara@gala.test', '2026-10-02'],
      ],
    },
  });
  await page.goto(app.url);
  await page.locator('#periodo').fill('2026-11');
  await expect(page.locator('#lista-pasos .chip')).toHaveText(['Hecho', 'Con incidencias', 'Pendiente']);
  await expect(page.locator('#lista-pasos > li').first()).toContainText('actualizado por sara@gala.test (2026-11-03)');

  await page.locator('#periodo').fill('2026-10');
  await expect(page.locator('#lista-pasos .chip')).toHaveText(['Pendiente', 'Pendiente', 'Pendiente']);
  expect(app.llamadas.filter((l) => l.nombre === 'apiPasosDelPeriodo').map((l) => l.args[0])).toContain('2026-10');
});

test('las otras cuatro pantallas existen y dicen que están pendientes', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  for (const titulo of TITULOS.slice(1)) {
    await page.locator('#navegacion a', { hasText: titulo }).click();
    await expect(page.locator('#navegacion a[aria-current="page"]')).toHaveText(titulo);
    await expect(page.locator('h1')).toHaveText(titulo);
    await expect(page.getByText('Pendiente · esta pantalla se construye en una versión posterior.')).toBeVisible();
  }
});

test('desde otra pantalla se puede volver a Proceso mensual', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await page.locator('#navegacion a', { hasText: 'Altas/bajas' }).click();
  await page.locator('#navegacion a', { hasText: 'Proceso mensual' }).click();
  await expect(page.locator('#lista-pasos > li')).toHaveCount(3);
});

test('un usuario que no consta ve «Sin acceso» y la aplicación no se carga', async ({ page }) => {
  await arrancar({ usuario: 'extrano@gala.test' });
  await page.goto(app.url);
  await expect(page.getByRole('alert')).toContainText('Sin acceso');
  await expect(page.getByText('Sesión iniciada como extrano@gala.test')).toBeVisible();
  await expect(page.locator('#navegacion')).toHaveCount(0);
  expect(app.llamadas).toHaveLength(0);
});

test('si la webapp no está configurada lo dice y no se abre', async ({ page }) => {
  app = await iniciarAplicacion({
    raiz: SRC_WEBAPP,
    codigo: ARCHIVOS_GS,
    html: RUTAS_HTML,
    google: { usuario: 'sara@gala.test' },
  });
  await page.goto(app.url);
  await expect(page.getByRole('alert')).toContainText('aún no está configurada');
  await expect(page.locator('#navegacion')).toHaveCount(0);
});

test('el texto que viene del libro se muestra como texto, nunca como HTML', async ({ page }) => {
  const intento = '<img src=x onerror="window.__inyectado=1">';
  await arrancar({
    libro: {
      config: CONFIG_NORMAL,
      estadoPasos: [['2026-11', 'actualizar-export-sage', 'hecho', intento, '2026-11-03']],
    },
  });
  await page.goto(app.url);
  await page.locator('#periodo').fill('2026-11');
  await expect(page.locator('#lista-pasos > li').first()).toContainText(intento);
  await expect(page.locator('#lista-pasos img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__inyectado)).toBeUndefined();
});

test('un periodo no válido enviado a mano se rechaza en el servidor', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  const respuesta = await page.evaluate(async () => {
    const r = await fetch('/rpc/apiPasosDelPeriodo', { method: 'POST', body: JSON.stringify(['2026-13']) });
    return r.json();
  });
  expect(respuesta.error).toContain('AAAA-MM');
});
