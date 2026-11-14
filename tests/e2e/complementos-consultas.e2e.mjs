// E2E de la pantalla «Consulta de envíos» y recorrido Reportar → Consultar (HTML real + .gs real).
// RF-09 · RF-08 · RNF-03 · RNF-06 · RNF-09 · RNF-10 · ADR-0005
import { expect, test } from '@playwright/test';
import { fijarHora } from '../complementos/ayudas.js';
import { arrancar, CARGA_XSS, URL_CONSULTAS, URL_REPORTAR, validarEnConsultas, validarEnReportar } from './complementos-ayudas.mjs';

let app;
test.afterEach(async () => { if (app) await app.cerrar(); app = null; });

const abrir = async (page, opciones) => {
  app = await arrancar(opciones);
  await page.goto(URL_CONSULTAS(app));
  return app;
};
/** Elige año y mes y espera a que aparezcan los resultados. */
const consultar = async (page, year, month) => {
  await page.locator('#selYear').selectOption(String(year));
  await page.locator('#selMonth').selectOption(String(month));
  await page.locator('#step3').waitFor({ state: 'visible' });
};

const DATOS = [
  { batch: 'B_ENERO', mes: 1, ts: '2026-01-10T09:00:00Z', idS: 'S1', nomS: 'Zoe Ficticia', valor: 10 },
  { batch: 'B_MARZO_1', mes: 3, ts: '2026-03-05T09:00:00Z', idS: 'S1', nomS: 'Zoe Ficticia', valor: 1234.5 },
  { batch: 'B_MARZO_1', mes: 3, ts: '2026-03-05T09:00:00Z', idS: 'S2', nomS: 'Álvaro Falso', valor: 0 },
  { batch: 'B_MARZO_2', mes: 3, ts: '2026-03-12T09:00:00Z', idS: 'S1', nomS: 'Zoe Ficticia', valor: 1300, modo: 'CORRECCION', corrige: 'B_MARZO_1' },
  { batch: 'B_MARZO_S50', mes: 3, ts: '2026-03-08T09:00:00Z', idC: 'C2', conc: 'Sábados 50', idS: 'S4', nomS: 'Ñoño Inventado', valor: 7 },
  { batch: 'B_2025', year: 2025, mes: 12, ts: '2025-12-10T09:00:00Z', idS: 'S1', nomS: 'Zoe Ficticia', valor: 3 },
  { batch: 'B_AJENO', resp: 'R2', mes: 3, idC: 'C3', conc: 'Reseñas', idS: 'S1', nomS: 'Zoe Ficticia', valor: 99 },
];
const logCorreccion = (env) => env.logs().appendRow([env.fecha('2026-03-12T09:00:00Z'), 'B_MARZO_2', 'R1', 'CORRECCION', 1, 'OK', 'OK', 'PARCIAL']);

test.describe('validación del manager', () => {
  test('al abrir solo se ve el paso 1, con el foco en el email y la ayuda sobre qué mes elegir', async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole('heading', { name: /Consulta de Envíos Complementos/ })).toBeVisible();
    await expect(page.locator('#step2')).toBeHidden();
    await expect(page.locator('#step3')).toBeHidden();
    await expect(page.locator('#email')).toBeFocused();
  });
  test('email vacío o con formato inválido → «Introduce un email válido.» sin llamar al servidor', async ({ page }) => {
    await abrir(page);
    await page.locator('#btnVal').click();
    await expect(page.locator('#msg1')).toHaveText('Introduce un email válido.');
    await page.locator('#email').fill('no-es-email');
    await page.locator('#btnVal').click();
    await expect(page.locator('#msg1')).toHaveText('Introduce un email válido.');
    expect(app.llamadas).toEqual([]);
  });
  test('RNF-09 · un email desconocido o inactivo no entra y se muestra el motivo', async ({ page }) => {
    await abrir(page);
    await page.locator('#email').fill('intruso@gala.test');
    await page.locator('#btnVal').click();
    await expect(page.locator('#msg1')).toHaveText('Email no autorizado o manager inactivo.');
    await page.locator('#email').fill('cleo@gala.test');
    await page.locator('#btnVal').click();
    await expect(page.locator('#msg1')).toHaveText('Email no autorizado o manager inactivo.');
    await expect(page.locator('#step2')).toBeHidden();
  });
  test('un email válido muestra el responsable y los años disponibles, del más reciente al más antiguo', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page, ' ANA@gala.test ');
    await expect(page.locator('#whoLabel')).toHaveText('Ana Prueba — ana@gala.test');
    await expect(page.locator('#selYear option')).toHaveText(['Seleccionar', '2026', '2025']);
    await expect(page.locator('#selMonth')).toBeDisabled();
    await expect(page.locator('#selYear')).toBeFocused();
    await expect(page.getByText('Selecciona el mes al que corresponden los complementos abonados')).toBeVisible();
  });
  test('Enter valida', async ({ page }) => {
    await abrir(page);
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#email').press('Enter');
    await expect(page.locator('#step2')).toBeVisible();
  });
  test('mientras valida se bloquea el formulario y se muestra «Validando…»', async ({ page }) => {
    await abrir(page);
    let liberar;
    const espera = new Promise((r) => { liberar = r; });
    await page.route('**/rpc/vap_consultaBootstrap', async (ruta) => { await espera; await ruta.continue(); });
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#btnVal').click();
    await expect(page.locator('#busy1')).toBeVisible();
    await expect(page.locator('#btnVal')).toBeDisabled();
    await expect(page.locator('#email')).toBeDisabled();
    liberar();
    await expect(page.locator('#step2')).toBeVisible();
    await expect(page.locator('#btnVal')).toBeEnabled();
  });
  test('un fallo del servidor se muestra y desbloquea el botón', async ({ page }) => {
    await abrir(page);
    await page.route('**/rpc/vap_consultaBootstrap', (r) => r.fulfill({ json: { error: 'servicio caído' } }));
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#btnVal').click();
    await expect(page.locator('#msg1')).toHaveText('Error: servicio caído');
    await expect(page.locator('#btnVal')).toBeEnabled();
  });
  test('sin hoja Data el servidor devuelve un error claro que se muestra', async ({ page }) => {
    await abrir(page, { sinHojas: ['Data'] });
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#btnVal').click();
    await expect(page.locator('#msg1')).toHaveText('No existe la hoja "Data".');
  });
  test('al validar otro email se oculta el resultado anterior', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#btnVal').click();
    await expect(page.locator('#step3')).toBeHidden();
  });
});

test.describe('filtro por periodo · RNF-03 · ADR-0005', () => {
  test('al elegir año se ofrecen solo los meses con envíos, del más reciente al más antiguo', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await page.locator('#selYear').selectOption('2026');
    await expect(page.locator('#selMonth option')).toHaveText(['Seleccionar', 'Marzo', 'Enero']);
    await expect(page.locator('#selMonth')).toBeEnabled();
    await page.locator('#selYear').selectOption('2025');
    await expect(page.locator('#selMonth option')).toHaveText(['Seleccionar', 'Diciembre']);
  });
  test('volver a «Seleccionar» en el año bloquea el mes y oculta los resultados', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await page.locator('#selYear').selectOption('');
    await expect(page.locator('#selMonth')).toBeDisabled();
    await expect(page.locator('#step3')).toBeHidden();
  });
  test('cambiar de año oculta los resultados del año anterior', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await page.locator('#selYear').selectOption('2025');
    await expect(page.locator('#step3')).toBeHidden();
  });
  test('el botón «Consultar» carga el periodo elegido', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await page.locator('#selYear').selectOption('2026');
    await page.locator('#selMonth').selectOption('1');
    await page.locator('#step3').waitFor({ state: 'visible' });
    await page.locator('#step3').evaluate((e) => e.classList.add('hidden'));
    await page.getByRole('button', { name: 'Consultar' }).click();
    await expect(page.locator('#step3')).toBeVisible();
  });
  test('«Consultar» sin elegir mes no hace nada ni llama al servidor', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await page.locator('#selYear').selectOption('2026');
    await page.getByRole('button', { name: 'Consultar' }).click();
    await expect(page.locator('#step3')).toBeHidden();
    expect(app.llamadas.filter((l) => l.nombre === 'vap_consultaBatches')).toEqual([]);
  });
  test('la consulta manda responsable, año y mes numéricos', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    expect(app.llamadas.find((l) => l.nombre === 'vap_consultaBatches').args).toEqual([{ idResponsable: 'R1', year: 2026, month: 3 }]);
  });
});

test.describe('resultados · RF-09', () => {
  test('título con mes y año, tarjetas del más reciente al más antiguo con sus campos', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await expect(page.locator('#resultsTitle')).toHaveText('Envíos — Marzo 2026');
    const tarjetas = page.locator('.batch-card');
    await expect(tarjetas).toHaveCount(3);
    await expect(tarjetas.nth(0).locator('.meta-val').first()).toHaveText('B_MARZO_2');
    await expect(tarjetas.nth(1).locator('.meta-val').first()).toHaveText('B_MARZO_S50');
    await expect(tarjetas.nth(2).locator('.meta-val').first()).toHaveText('B_MARZO_1');
    await expect(tarjetas.nth(2)).toContainText('05/03/2026 10:00');
    await expect(tarjetas.nth(2)).toContainText('Aptos');
    await expect(tarjetas.nth(2).locator('.meta-val').nth(3)).toHaveText('2');
  });
  test('RNF-09 · no aparecen envíos de otro responsable ni de otro periodo', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    const texto = await page.locator('#batchList').innerText();
    expect(texto).not.toContain('B_AJENO');
    expect(texto).not.toContain('B_ENERO');
    expect(texto).not.toContain('B_2025');
  });
  test('distingue con insignia NUEVO y CORRECCIÓN', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await expect(page.locator('.batch-card').nth(0).locator('.badge')).toHaveText('CORRECCIÓN');
    await expect(page.locator('.batch-card').nth(0).locator('.badge')).toHaveClass(/badge-corr/);
    await expect(page.locator('.batch-card').nth(2).locator('.badge')).toHaveText('NUEVO');
    await expect(page.locator('.batch-card').nth(2).locator('.badge')).toHaveClass(/badge-nuevo/);
  });
  test('el detalle está oculto y se abre y cierra al pulsar la cabecera', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    const tarjeta = page.locator('.batch-card').nth(2);
    await expect(tarjeta.locator('.detail-panel')).toBeHidden();
    await expect(tarjeta.locator('.toggle-hint')).toHaveText('▼ Ver detalle');
    await tarjeta.locator('.batch-head').click();
    await expect(tarjeta.locator('.detail-panel')).toBeVisible();
    await expect(tarjeta.locator('.toggle-hint')).toHaveText('▲ Ocultar');
    await tarjeta.locator('.batch-head').click();
    await expect(tarjeta.locator('.detail-panel')).toBeHidden();
  });
  test('el detalle lista ID, nombre y valor con formato español (es-ES no agrupa los miles de 4 cifras; el 0 sale como 0,00)', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    const tarjeta = page.locator('.batch-card').nth(2);
    await tarjeta.locator('.batch-head').click();
    await expect(tarjeta.locator('th')).toHaveText(['ID Secretaria', 'Nombre', 'Valor']);
    await expect(tarjeta.locator('tbody tr')).toHaveText([/S1\s+Zoe Ficticia\s+1234,50/, /S2\s+Álvaro Falso\s+0,00/]);
  });
  test('RF-08 · el detalle de una corrección indica el tipo (desde Logs) y el envío corregido', async ({ page }) => {
    await abrir(page, { datos: DATOS, preparar: logCorreccion });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    const tarjeta = page.locator('.batch-card').nth(0);
    await tarjeta.locator('.batch-head').click();
    await expect(tarjeta.locator('.corr-info')).toHaveText('Tipo: PARCIAL · Corrige: B_MARZO_1');
  });
  test('una corrección sin tipo en Logs muestra «-»', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await page.locator('.batch-card').nth(0).locator('.batch-head').click();
    await expect(page.locator('.batch-card').nth(0).locator('.corr-info')).toHaveText('Tipo: - · Corrige: B_MARZO_1');
  });
  test('valores vacíos se muestran «—» y un texto se muestra tal cual', async ({ page }) => {
    await abrir(page, { datos: [{ batch: 'B1', idS: 'S1', nomS: 'Zoe', valor: '' }, { batch: 'B1', idS: 'S2', nomS: 'Álvaro', valor: 'a revisar' }] });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await page.locator('.batch-head').click();
    await expect(page.locator('.batch-card tbody tr')).toHaveText([/Zoe\s+—/, /Álvaro\s+a revisar/]);
  });
  test('RNF-06 · la consulta es de solo lectura: no escribe nada', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    const antes = app.env.data().volcar();
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    expect(app.env.data().volcar()).toEqual(antes);
    expect(app.env.logs().getLastRow()).toBe(1);
    expect(app.entorno.google.estado.correos).toEqual([]);
  });
});

test.describe('filtro por concepto', () => {
  test('con un solo concepto el filtro no se muestra', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 1);
    await expect(page.locator('#conceptFilter')).toBeHidden();
  });
  test('con varios conceptos aparece «Todos» + cada concepto y filtra las tarjetas', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await expect(page.locator('#conceptFilter')).toBeVisible();
    await expect(page.locator('#selConcept option')).toHaveText(['Todos', 'Aptos', 'Sábados 50']);
    await page.locator('#selConcept').selectOption('Sábados 50');
    await expect(page.locator('.batch-card')).toHaveCount(1);
    await expect(page.locator('.batch-card')).toContainText('B_MARZO_S50');
    await page.locator('#selConcept').selectOption('');
    await expect(page.locator('.batch-card')).toHaveCount(3);
  });
});

test.describe('estados vacíos y errores', () => {
  test('un periodo sin envíos devuelto por el servidor muestra «No se encontraron envíos para este período.»', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await page.route('**/rpc/vap_consultaBatches', (r) => r.fulfill({ json: { valor: { ok: true, batches: [] } } }));
    await consultar(page, 2026, 3);
    await expect(page.locator('#batchList .empty')).toHaveText('No se encontraron envíos para este período.');
  });
  test('un lote sin filas de detalle muestra «Sin detalle disponible.»', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await page.route('**/rpc/vap_consultaBatches', (r) => r.fulfill({ json: { valor: { ok: true, batches: [
      { batchId: 'B0', tsText: '01/03/2026 09:00', concepto: 'Aptos', modo: 'NUEVO', tipoCorreccion: '', corrigeBatchId: '', nRegistros: 0, secretarias: [] },
    ] } } }));
    await consultar(page, 2026, 3);
    await page.locator('.batch-head').click();
    await expect(page.locator('.detail-panel')).toHaveText('Sin detalle disponible.');
  });
  test('un error del servidor al cargar envíos se muestra bajo los filtros', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await page.route('**/rpc/vap_consultaBatches', (r) => r.fulfill({ json: { valor: { ok: false, error: 'Parámetros inválidos.' } } }));
    await page.locator('#selYear').selectOption('2026');
    await page.locator('#selMonth').selectOption('3');
    await expect(page.locator('#msg2')).toHaveText('Parámetros inválidos.');
    await expect(page.locator('#step3')).toBeHidden();
  });
  test('un fallo de red al cargar envíos se muestra', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await page.route('**/rpc/vap_consultaBatches', (r) => r.fulfill({ json: { error: 'sin conexión' } }));
    await page.locator('#selYear').selectOption('2026');
    await page.locator('#selMonth').selectOption('3');
    await expect(page.locator('#msg2')).toHaveText('Error: sin conexión');
  });
  test('RF-66 · un responsable sin ningún envío debe ver un aviso de que no hay envíos', async ({ page }) => {
    test.fail(true, 'DEFECTO: con periodos vacíos solo queda el desplegable de año vacío, sin mensaje que lo explique');
    await abrir(page);
    await validarEnConsultas(page, 'beto@gala.test');
    await expect(page.getByText(/no hay envíos|sin envíos|no has realizado/i)).toBeVisible({ timeout: 1000 });
  });
  test('un responsable sin envíos ve el desplegable de año sin opciones (caracterización)', async ({ page }) => {
    await abrir(page);
    await validarEnConsultas(page, 'beto@gala.test');
    await expect(page.locator('#selYear option')).toHaveText(['Seleccionar']);
    await expect(page.locator('#selMonth')).toBeDisabled();
  });
});

test.describe('seguridad · escape de HTML (RNF-09)', () => {
  test('el nombre de la secretaria con HTML no debe ejecutarse en el detalle', async ({ page }) => {
    test.fail(true, 'DEFECTO: renderDetail inserta nombreSecretaria/idSecretaria con innerHTML sin escapar');
    await abrir(page, { datos: [{ batch: 'B1', nomS: CARGA_XSS }] });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await page.waitForFunction(() => window.__xss === 1, null, { timeout: 1500 }).catch(() => {});
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });
  test('el concepto con HTML no debe ejecutarse en la cabecera de la tarjeta', async ({ page }) => {
    test.fail(true, 'DEFECTO: renderBatches inserta batchId/concepto con innerHTML sin escapar');
    await abrir(page, { datos: [{ batch: 'B1', conc: CARGA_XSS, idC: 'C1' }] });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await page.waitForFunction(() => window.__xss === 1, null, { timeout: 1500 }).catch(() => {});
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });
  test('el Batch_ID con HTML se debe mostrar como texto literal', async ({ page }) => {
    test.fail(true, 'DEFECTO: el Batch_ID se interpreta como HTML');
    await abrir(page, { datos: [{ batch: '<b>negrita</b>' }] });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await expect(page.locator('.batch-card .meta-val').first()).toHaveText('<b>negrita</b>', { timeout: 1500 });
  });
  test('el nombre del responsable con HTML se muestra como texto en la etiqueta', async ({ page }) => {
    await abrir(page, { bbdd: { VAP_Responsables: [['ID_Respon', 'Nombre', 'Email', 'Activa'], ['R1', CARGA_XSS, 'ana@gala.test', true]] } });
    await validarEnConsultas(page);
    await expect(page.locator('#whoLabel')).toHaveText(`${CARGA_XSS} — ana@gala.test`);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });
});

test.describe('accesibilidad y adaptación · RNF-10', () => {
  test('las tablas de detalle tienen cabeceras y los botones nombre accesible', async ({ page }) => {
    await abrir(page, { datos: DATOS });
    await expect(page.getByRole('button', { name: 'Validar Responsable' })).toBeVisible();
    await validarEnConsultas(page);
    await expect(page.getByRole('button', { name: 'Consultar' })).toBeVisible();
    await consultar(page, 2026, 3);
    await page.locator('.batch-head').first().click();
    await expect(page.getByRole('columnheader', { name: 'ID Secretaria' }).first()).toBeVisible();
  });
  test('el detalle de un envío se puede abrir con el teclado', async ({ page }) => {
    test.fail(true, 'DEFECTO: la cabecera de cada envío es un <div onclick> sin tabindex, role ni manejo de teclado');
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await expect(page.getByRole('button', { name: /Batch_ID|Ver detalle/ }).first()).toBeVisible({ timeout: 1000 });
  });
  test('el email tiene etiqueta asociada (getByLabel)', async ({ page }) => {
    test.fail(true, 'DEFECTO: los <label> no llevan for/id');
    await abrir(page);
    await expect(page.getByLabel('Email del manager')).toBeVisible({ timeout: 1000 });
  });
  test('la página declara el idioma', async ({ page }) => {
    test.fail(true, 'DEFECTO: <html> sin lang');
    await abrir(page);
    await expect(page.locator('html')).toHaveAttribute('lang', /es/);
  });
  test('en móvil la cabecera de cada envío pasa a dos columnas y no hay desbordamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await abrir(page, { datos: DATOS });
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    const columnas = await page.locator('.batch-head').first().evaluate((h) => getComputedStyle(h).gridTemplateColumns.split(' ').length);
    expect(columnas).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});

test.describe('recorrido completo Reportar → Consultar → corregir → Consultar (RF-05 · RF-07 · RF-08 · RF-09 · RNF-06)', () => {
  test('lo enviado aparece en la consulta; la corrección se añade y el original se conserva', async ({ page }) => {
    app = await arrancar();
    // 1) Reportar
    await page.goto(URL_REPORTAR(app));
    await validarEnReportar(page);
    await page.locator('#btnContinue').click();
    await page.locator('#step3').waitFor({ state: 'visible' });
    await page.locator('#tbl tbody input').nth(2).fill('1.000,50');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Batch_ID: BATCH_20260315_110000_1000');
    // 2) Consultar
    await page.goto(URL_CONSULTAS(app));
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await expect(page.locator('.batch-card')).toHaveCount(1);
    await page.locator('.batch-head').click();
    await expect(page.locator('.batch-card tbody tr')).toHaveText([/S1\s+Zoe Ficticia\s+1000,50/]);
    // 3) Corregir (otro Batch_ID para que se distingan)
    app.env.e.ejecutar('Math.random = () => 0.5');
    fijarHora(app.env, '2026-03-16T10:00:00Z');
    await page.goto(URL_REPORTAR(app));
    await validarEnReportar(page);
    await page.locator('#modo').selectOption('CORRECCION');
    await page.locator('#corrigeBatchId').selectOption('BATCH_20260315_110000_1000');
    await page.locator('#btnContinue').click();
    await page.locator('#step3').waitFor({ state: 'visible' });
    await page.locator('#tbl tbody input').nth(2).fill('900');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    // 4) Consultar de nuevo: dos envíos, ambos presentes
    await page.goto(URL_CONSULTAS(app));
    await validarEnConsultas(page);
    await consultar(page, 2026, 3);
    await expect(page.locator('.batch-card')).toHaveCount(2);
    await expect(page.locator('.batch-card').nth(0).locator('.badge')).toHaveText('CORRECCIÓN');
    await expect(page.locator('.batch-card').nth(1).locator('.badge')).toHaveText('NUEVO');
    await page.locator('.batch-head').nth(0).click();
    await expect(page.locator('.batch-card').nth(0).locator('.corr-info')).toHaveText('Tipo: PARCIAL · Corrige: BATCH_20260315_110000_1000');
    await page.locator('.batch-head').nth(1).click();
    await expect(page.locator('.batch-card').nth(1).locator('tbody tr')).toHaveText([/1000,50/]);
    // 5) La hoja Data conserva ambas remesas y se enviaron dos correos
    expect(app.env.data().getLastRow()).toBe(3);
    expect(app.entorno.google.estado.correos).toHaveLength(2);
  });
});
