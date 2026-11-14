// E2E del portal de complementos (arnés incluido). Prueba que la página real se sirve, que la plantilla
// resuelve la URL de la webapp y que los accesos llevan a Reportar y a Consultas (RF-58 · HU-36 · RNF-10).
import { expect, test } from '@playwright/test';
import { arrancar, URL_PORTAL } from './complementos-ayudas.mjs';

let app;
test.beforeEach(async () => {
  app = await arrancar();
});
test.afterEach(async () => app.cerrar());

const base = () => app.entorno.google.estado.urlWebapp;

test('el portal ofrece los dos accesos con la URL de la webapp', async ({ page }) => {
  await page.goto(URL_PORTAL(app));
  await expect(page.locator('a.access.rep')).toHaveAttribute('href', base());
  await expect(page.locator('a.access.con')).toHaveAttribute('href', `${base()}?page=consultas`);
});

test('RF-58 · muestra la cabecera, la pregunta y el aviso de validación de email', async ({ page }) => {
  await page.goto(URL_PORTAL(app));
  await expect(page.getByText('GALA HUB · SISTEMA VAP')).toBeVisible();
  await expect(page.getByText('Complementos Salariales Secretarias').first()).toBeVisible();
  await expect(page.getByText('¿Qué quieres hacer? Elige una opción para continuar.')).toBeVisible();
  await expect(page.getByText('Cada opción te pedirá validar tu email de manager al entrar.')).toBeVisible();
});

test('cada acceso explica qué hace, con su nombre y su llamada a la acción', async ({ page }) => {
  await page.goto(URL_PORTAL(app));
  const rep = page.locator('a.access.rep');
  await expect(rep).toContainText('Reportar complementos');
  await expect(rep).toContainText('Envía o corrige los importes por secretaria del mes');
  await expect(rep).toContainText('Reportar');
  const con = page.locator('a.access.con');
  await expect(con).toContainText('Consultar mis envíos');
  await expect(con).toContainText('Revisa los últimos envíos realizados, por año y mes');
});

test('solo hay dos accesos y ninguno apunta a un ID de despliegue fijo del código', async ({ page }) => {
  await page.goto(URL_PORTAL(app));
  await expect(page.locator('a.access')).toHaveCount(2);
  const hrefs = await page.locator('a.access').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual([base(), `${base()}?page=consultas`]);
});

test('RF-58 · el acceso «Reportar» abre el reporte con el paso de validación del manager', async ({ page }) => {
  await page.goto(URL_PORTAL(app));
  // el enlace real apunta a la URL de Google; lo reencaminamos al servidor local conservando la ruta
  await page.route(`${base()}**`, (ruta) => ruta.fulfill({ status: 302, headers: { location: `${app.url}/${new URL(ruta.request().url()).search}` } }));
  await page.locator('a.access.rep').click();
  await expect(page.getByRole('heading', { name: /Reporte de Complementos/ })).toBeVisible();
  await expect(page.locator('#step1')).toBeVisible();
});

test('RF-58 · el acceso «Consultar» abre la consulta de envíos', async ({ page }) => {
  await page.goto(URL_PORTAL(app));
  await page.route(`${base()}**`, (ruta) => ruta.fulfill({ status: 302, headers: { location: `${app.url}/${new URL(ruta.request().url()).search}` } }));
  await page.locator('a.access.con').click();
  await expect(page.getByRole('heading', { name: /Consulta de Envíos/ })).toBeVisible();
});

test('RF-58 · los accesos directos existentes siguen funcionando sin pasar por el portal', async ({ page }) => {
  await page.goto(`${app.url}/`);
  await expect(page.locator('#step1')).toBeVisible();
  await page.goto(`${app.url}/?page=consultas`);
  await expect(page.locator('#btnVal')).toBeVisible();
});

test('RNF-10 · en móvil los accesos se apilan en una columna sin desbordar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(URL_PORTAL(app));
  const columnas = await page.locator('.grid').evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
  expect(columnas).toBe(1);
  const desborda = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(desborda).toBe(false);
});

test('en escritorio los accesos van en dos columnas', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(URL_PORTAL(app));
  const columnas = await page.locator('.grid').evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(' ').length);
  expect(columnas).toBe(2);
});

test('accesibilidad · los accesos son enlaces con nombre accesible y se alcanzan con el teclado', async ({ page }) => {
  await page.goto(URL_PORTAL(app));
  await expect(page.getByRole('link', { name: /Reportar complementos/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Consultar mis envíos/ })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('a.access.rep')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('a.access.con')).toBeFocused();
});

test('accesibilidad · la página declara el idioma en <html lang>', async ({ page }) => {
  test.fail(true, 'DEFECTO: el <html> del portal no lleva atributo lang (WCAG 3.1.1)');
  await page.goto(URL_PORTAL(app));
  await expect(page.locator('html')).toHaveAttribute('lang', /es/);
});

test('el portal no ejecuta nada del servidor ni escribe datos al abrirse', async ({ page }) => {
  await page.goto(URL_PORTAL(app));
  expect(app.llamadas).toEqual([]);
  expect(app.env.data().getLastRow()).toBe(1);
});
