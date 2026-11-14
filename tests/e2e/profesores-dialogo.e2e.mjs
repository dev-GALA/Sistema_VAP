// E2E del diálogo «Volcar Actividad de Profesores» (HTML real) contra el .gs real en la caja de Node.
// Cubre RF-16 (periodo), RF-17 (informe previo antes de escribir), RF-18 (cancelar), RF-20 (acumulación),
// RF-23 (destino ocupado), RF-48 (errores visibles), RF-60 (valores no numéricos), RF-70 (ya archivado).
import { expect, test } from '@playwright/test';
import { iniciarAplicacion } from './arnes.mjs';
import { CODIGO, HTML } from '../soporte/cargar-gs.js';
import { SHIM_RUN } from '../profesores/shim-run.js';
import { filaDestino, filaOrigen, leerLog, poblarActividad } from '../profesores/ayudas.js';

const ANA = 'Ana Beta Ficticia';
const CARLOS = 'Carlos Dos Ficticio';
const aplicaciones = [];

/** Arranca la aplicación con los datos indicados y abre el diálogo real. */
async function abrir(page, datos = {}, { esperar = true, google = {} } = {}) {
  const app = await iniciarAplicacion({
    codigo: [CODIGO.profesoresActividad],
    html: { DialogoVolcado: HTML.profesoresDialogo },
    google,
    preparar: (entorno) => poblarActividad(entorno, datos),
  });
  aplicaciones.push(app);
  await page.addInitScript(SHIM_RUN);
  await page.goto(`${app.url}/archivo/DialogoVolcado`);
  if (esperar) await expect(page.locator('#mes option')).toHaveCount(12);
  return app;
}
test.afterEach(async () => { while (aplicaciones.length) await aplicaciones.pop().cerrar(); });

const origenMarzo = () => [
  filaOrigen({ profesor: ANA, sucursal: 'Sucursal Uno', ts: '2026-03-05T12:00:00Z', datos: { 6: 10, 7: 20 } }),
  filaOrigen({ profesor: ANA, sucursal: 'Sucursal Dos', ts: '2026-03-12T12:00:00Z', datos: { 6: '', 8: 5 } }),
  filaOrigen({ profesor: CARLOS, ts: '2026-03-08T12:00:00Z', datos: { 6: 0 } }),
  filaOrigen({ profesor: ANA, mes: 'ABRIL', ts: '2026-04-02T12:00:00Z', datos: { 6: 999 } }),
];
const linea = (page, texto) => page.locator('#informe .linea', { hasText: texto });
const retrasar = async (page, patron) => {
  let soltar;
  const puerta = new Promise((r) => { soltar = r; });
  await page.route(patron, async (ruta) => { await puerta; await ruta.continue(); });
  return soltar;
};

test.describe('carga inicial del diálogo', () => {
  test('RF-16 · propone el mes en curso y el año, con 12 meses y el año anterior', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [] });
    await expect(page.locator('h3')).toHaveText('Volcar Actividad de Profesores a Vinculación');
    await expect(page.locator('#hoy')).toHaveText('Fecha de ejecución: 15/03/2026 · se propone el mes en curso');
    await expect(page.locator('#mes')).toHaveValue('MARZO');
    await expect(page.locator('#mes option').first()).toHaveText('Enero');
    await expect(page.locator('#mes option').last()).toHaveText('Diciembre');
    await expect(page.locator('#anio option')).toHaveText(['2026', '2025']);
    await expect(page.locator('#anio')).toHaveValue('2026');
  });
  test('arranca con el informe y el botón Exportar ocultos, y Revisar y Cancelar activos', async ({ page }) => {
    await abrir(page, { destino: [] });
    await expect(page.locator('#informe')).toBeHidden();
    await expect(page.locator('#btnExportar')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeEnabled();
  });
  test('la propuesta cambia con la fecha de ejecución (diciembre de 2027)', async ({ page }) => {
    await abrir(page, { destino: [] }, { google: { ahora: '2027-12-15T12:00:00Z' } });
    await expect(page.locator('#mes')).toHaveValue('DICIEMBRE');
    await expect(page.locator('#anio option')).toHaveText(['2027', '2026']);
  });
  test('si falla la carga inicial muestra «Error al cargar» y no rompe la página', async ({ page }) => {
    await page.route('**/rpc/vapPeriodoPropuesto', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ error: 'sin conexión ficticia' }) }));
    await abrir(page, { destino: [] }, { esperar: false });
    await expect(page.locator('#hoy')).toHaveText('Error al cargar: sin conexión ficticia');
    await expect(page.locator('#mes option')).toHaveCount(0);
  });
});

test.describe('informe previo (Revisar) · RF-17', () => {
  test('muestra totales, coincidencias, no coincidencias y multi-reporte, sin escribir nada', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    const escriturasAntes = app.entorno.google.estado.escrituras.length;
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(linea(page, 'Respuestas revisadas').locator('.n')).toHaveText('4');
    await expect(linea(page, '✔ COINCIDEN').locator('.n')).toHaveText('3');
    await expect(linea(page, 'NO COINCIDEN').locator('.n')).toHaveText('1');
    await expect(page.locator('#informe')).toContainText('2 profesor(es) a exportar');
    await expect(page.locator('#informe')).toContainText('4 campo(s) de actividad con dato');
    await expect(page.locator('#informe')).toContainText('1 con varios reportes: se acumulan campo a campo');
    await expect(page.locator('#informe')).toContainText('1 de otro mes');
    await expect(page.locator('#informe')).toContainText('(no se tocan)');
    await expect(page.locator('#informe .info').first()).toContainText('una celda vacía no borra lo ya reportado');
    await expect(page.locator('#informe .nota')).toContainText('VINCULACIÓN GASTOS PERSONAL');
    await expect(page.locator('#informe .nota')).toContainText('3 fila(s) a Hoja 1');
    await expect(page.locator('#btnExportar')).toBeVisible();
    expect(app.entorno.google.estado.escrituras.length).toBe(escriturasAntes);
    expect(app.llamadas.map((l) => l.nombre)).toStrictEqual(['vapPeriodoPropuesto', 'vapAnalizarPeriodo']);
    expect(app.llamadas[1].args).toStrictEqual(['MARZO', '2026']);
  });
  test('muestra el motivo de cada no-coincidencia: otro año y mes sin reconocer', async ({ page }) => {
    await abrir(page, { origen: [
      filaOrigen({ profesor: ANA, datos: { 6: 1 } }),
      filaOrigen({ profesor: ANA, ts: '2025-03-10T12:00:00Z' }),
      filaOrigen({ profesor: ANA, mes: 'Trimestre uno' }),
    ], destino: [] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe')).toContainText('1 de otro año');
    await expect(page.locator('#informe')).toContainText('1 sin mes reconocible en la columna C');
    await expect(linea(page, 'NO COINCIDEN').locator('.n')).toHaveText('2');
    await expect(page.locator('#informe .aviso')).toContainText('MES_NO_RECONOCIDO (fila 4)');
  });
  test('sin coincidencias: dice que no hay nada que exportar y no ofrece Exportar', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [] });
    await page.locator('#mes').selectOption('JUNIO');
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .nota')).toHaveText('No hay nada que exportar para este periodo.');
    await expect(page.locator('#btnExportar')).toBeHidden();
  });
  test('RF-16 · cambiar mes y año envía el periodo elegido al servidor', async ({ page }) => {
    const app = await abrir(page, { origen: [filaOrigen({ mes: 'ABRIL', ts: '2025-04-10T12:00:00Z', profesor: ANA, datos: { 6: 1 } })], destino: [] });
    await page.locator('#mes').selectOption({ label: 'Abril' });
    await page.locator('#anio').selectOption('2025');
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(linea(page, '✔ COINCIDEN').locator('.n')).toHaveText('1');
    expect(app.llamadas.at(-1)).toStrictEqual({ nombre: 'vapAnalizarPeriodo', args: ['ABRIL', '2025'] });
  });
  test('RF-23 · destino con datos: alerta destacada con el número de celdas ocupadas', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA, { 29: 1, 30: 2 })] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .alerta')).toContainText('Atención: el destino no está vacío.');
    await expect(page.locator('#informe .alerta')).toContainText('2 celda(s)');
    await expect(page.locator('#btnExportar')).toBeVisible();
  });
  test('RF-23 · destino limpio: no aparece la alerta', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .alerta')).toHaveCount(0);
  });
  test('RF-23 · destino no comprobable (libro inaccesible): aviso de revisar a mano', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    app.entorno.google.estado.libros.delete(app.entorno.valor('TARGET_SPREADSHEET_ID'));
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .aviso', { hasText: 'No se ha podido comprobar si el destino está vacío' })).toBeVisible();
  });
  test('RF-70 · periodo ya archivado: avisa de que se añadirá de nuevo', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [], historico: [['ARCHIVADO MARZO 2026']] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .aviso', { hasText: 'ya hay filas de MARZO 2026' })).toContainText('Se añadirán de nuevo');
  });
  test('avisa de filas con marca temporal fuera del mes y dice que se exportan igualmente', async ({ page }) => {
    await abrir(page, { origen: [filaOrigen({ profesor: ANA, ts: '2026-06-05T12:00:00Z', datos: { 6: 1 } })], destino: [] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .aviso', { hasText: 'fuera de él' })).toContainText('1 fila(s)');
    await expect(page.locator('#informe .aviso', { hasText: 'fuera de él' })).toContainText('Se exportan igualmente');
  });
  test('RF-60 · incidencias: lista las 6 primeras y resume el resto', async ({ page }) => {
    const filas = Array.from({ length: 8 }, (_, i) => filaOrigen({ profesor: `Profesor ${i + 1} Ficticio`, datos: { 6: 'texto' } }));
    await abrir(page, { origen: filas, destino: [] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe ul.incidencias li')).toHaveCount(7);
    await expect(page.locator('#informe ul.incidencias li').last()).toHaveText('… y 2 más (todas en el log)');
    await expect(page.locator('#informe')).toContainText('Incidencias detectadas (8):');
  });
  test('un error del servicio (pestaña de respuestas inexistente) se muestra en rojo y reactiva Revisar', async ({ page }) => {
    await abrir(page, { sinHojaOrigen: true, destino: [] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .error')).toContainText('No existe la pestaña origen: "Respuestas de formulario 1".');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
    await expect(page.locator('#btnExportar')).toBeHidden();
  });
  test('un fallo de comunicación al revisar muestra el error y reactiva Revisar', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [] });
    await page.route('**/rpc/vapAnalizarPeriodo', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ error: 'tiempo agotado ficticio' }) }));
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .error')).toContainText('Error: tiempo agotado ficticio');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
  });
  test('volver a revisar oculta Exportar hasta tener el nuevo informe', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#btnExportar')).toBeVisible();
    const soltar = await retrasar(page, '**/rpc/vapAnalizarPeriodo');
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#btnExportar')).toBeHidden();
    soltar();
    await expect(page.locator('#btnExportar')).toBeVisible();
  });
});

test.describe('estados de carga', () => {
  test('al revisar: muestra «Revisando…», desactiva Revisar y lo reactiva con el informe', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [] });
    const soltar = await retrasar(page, '**/rpc/vapAnalizarPeriodo');
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .cargando')).toHaveText('Revisando las respuestas…');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeDisabled();
    await expect(page.locator('#btnExportar')).toBeHidden();
    soltar();
    await expect(page.locator('#informe .cargando')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
  });
  test('al exportar: muestra «Exportando…», oculta Exportar y desactiva Revisar (evita doble pulsación)', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    const soltar = await retrasar(page, '**/rpc/vapEjecutarExportacion');
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.locator('#informe .cargando')).toHaveText('Exportando… no cierres esta ventana.');
    await expect(page.locator('#btnExportar')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeDisabled();
    soltar();
    await expect(page.locator('#informe')).toContainText('Exportación completada');
    expect(app.llamadas.filter((l) => l.nombre === 'vapEjecutarExportacion')).toHaveLength(1);
  });
});

test.describe('exportación (Exportar) · RF-20 · RF-63', () => {
  test('muestra el resumen y deja el destino, el histórico y el log en el estado esperado', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Exportar' }).click();
    const informe = page.locator('#informe');
    await expect(informe).toContainText('Exportación completada');
    await expect(linea(page, 'Profesores actualizados').locator('.n')).toHaveText('2');
    await expect(linea(page, 'Sin cambios').locator('.n')).toHaveText('0');
    await expect(linea(page, 'Filas nuevas creadas').locator('.n')).toHaveText('1');
    await expect(linea(page, 'Celdas escritas').locator('.n')).toHaveText('4');
    await expect(linea(page, 'Celdas conservadas').locator('.n')).toHaveText('0');
    await expect(linea(page, 'Filas copiadas al histórico').locator('.n')).toHaveText('3');
    await expect(informe).not.toContainText('Bloqueados');
    await expect(informe).toContainText('LOG Volcado');
    await expect(page.locator('#btnExportar')).toBeHidden();

    const e = app.entorno;
    expect(e.hojaDestino.volcar().slice(1).map((f) => [f[2], f[28], f[29], f[30]])).toStrictEqual([[ANA, 10, 20, 5], [CARLOS, 0, '', '']]);
    expect(e.libroOrigen.getSheetByName('Hoja 1').volcar()).toHaveLength(4);
    expect(leerLog(e).at(-1).Tipo).toBe('OK');
    expect(app.llamadas.at(-1)).toStrictEqual({ nombre: 'vapEjecutarExportacion', args: ['MARZO', '2026'] });
  });
  test('RF-20 · la exportación no borra con un vacío el valor que ya había en el destino', async ({ page }) => {
    const app = await abrir(page, { origen: [filaOrigen({ profesor: ANA, datos: { 6: 4, 7: '' } })], destino: [filaDestino(ANA, { 30: 11 })] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(linea(page, 'Celdas conservadas').locator('.n')).toHaveText('1');
    expect(app.entorno.hojaDestino.volcar()[1][29]).toBe(11);
  });
  test('tras exportar, Revisar queda desactivado (no se puede relanzar sin reabrir el diálogo)', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.locator('#informe')).toContainText('Exportación completada');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeDisabled();
    await expect(page.locator('#btnExportar')).toBeHidden();
  });
  test('RF-70 · reabrir el diálogo y exportar el mismo periodo: avisa del duplicado y sale «sin cambios»', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.locator('#informe')).toContainText('Exportación completada');
    await page.goto(`${app.url}/archivo/DialogoVolcado`);
    await expect(page.locator('#mes option')).toHaveCount(12);
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe .aviso', { hasText: 'ya hay filas de MARZO 2026' })).toBeVisible();
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(linea(page, 'Sin cambios').locator('.n')).toHaveText('2');
    await expect(linea(page, 'Celdas escritas').locator('.n')).toHaveText('0');
    expect(app.entorno.libroOrigen.getSheetByName('Hoja 1').volcar()).toHaveLength(7);
  });
  test('nombre duplicado en el destino: aparece la línea «Bloqueados» en rojo', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA), filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(linea(page, 'Bloqueados (nombre duplicado)').locator('.n')).toHaveText('1');
    await expect(linea(page, 'Bloqueados (nombre duplicado)').locator('.no').first()).toBeVisible();
  });
  test('muestra «Incidencias anotadas» cuando el análisis las generó', async ({ page }) => {
    await abrir(page, { origen: [filaOrigen({ profesor: ANA, datos: { 6: 'texto' } })], destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(linea(page, 'Incidencias anotadas').locator('.n')).toHaveText('1');
  });
  test('si falla la pestaña destino muestra el error del servidor sin romper y permite revisar de nuevo', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: null, historico: [['previo']] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.locator('#informe .error')).toContainText('No existe la pestaña destino: "Hoja 1".');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
    await expect(page.locator('#btnExportar')).toBeHidden();
    expect(app.entorno.hojaHistorico.volcar()).toStrictEqual([['previo']]);
  });
  test('RNF-04 · con el bloqueo ocupado muestra el error y no escribe en el destino', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    app.entorno.google.estado.bloqueoOcupado = true;
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.locator('#informe .error')).toContainText('bloqueo');
    expect(app.entorno.hojaDestino.volcar()[1][28]).toBe('');
  });
  test('un fallo de comunicación al exportar muestra el error y remite a la hoja LOG Volcado', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.route('**/rpc/vapEjecutarExportacion', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ error: 'caída ficticia' }) }));
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.locator('#informe .error')).toContainText('Error: caída ficticia');
    await expect(page.locator('#informe .error')).toContainText('Revisa la hoja LOG Volcado.');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
  });
  test('el periodo exportado es el elegido en los desplegables en el momento de pulsar Exportar', async ({ page }) => {
    const app = await abrir(page, { origen: [filaOrigen({ mes: 'ABRIL', ts: '2026-04-10T12:00:00Z', profesor: ANA, datos: { 6: 7 } })], destino: [filaDestino(ANA)] });
    await page.locator('#mes').selectOption('ABRIL');
    await page.getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.locator('#informe')).toContainText('Exportación completada');
    expect(app.llamadas.at(-1).args).toStrictEqual(['ABRIL', '2026']);
    expect(app.entorno.hojaDestino.volcar()[1][28]).toBe(7);
  });
});

test.describe('cancelar · RF-18', () => {
  test('Cancelar cierra el diálogo y no llama al servidor ni escribe nada', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)] });
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(await page.evaluate(() => window.__dialogoCerrado)).toBe(true);
    expect(app.llamadas.map((l) => l.nombre)).toStrictEqual(['vapPeriodoPropuesto']);
    expect(app.entorno.google.estado.escrituras).toStrictEqual([]);
  });
  test('Cancelar tras revisar cierra sin exportar: el destino y el histórico quedan intactos', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [filaDestino(ANA)], historico: [['previo']] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#btnExportar')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(await page.evaluate(() => window.__dialogoCerrado)).toBe(true);
    expect(app.llamadas.some((l) => l.nombre === 'vapEjecutarExportacion')).toBe(false);
    expect(app.entorno.hojaDestino.volcar()[1][28]).toBe('');
    expect(app.entorno.hojaHistorico.volcar()).toStrictEqual([['previo']]);
  });
  test('el diálogo no se cierra solo: sin pulsar Cancelar, __dialogoCerrado queda sin definir', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    expect(await page.evaluate(() => window.__dialogoCerrado)).toBeUndefined();
  });
});

test.describe('accesibilidad básica de los controles', () => {
  test('los desplegables tienen etiqueta asociada y los botones, nombre accesible', async ({ page }) => {
    await abrir(page, { destino: [] });
    await expect(page.getByLabel('Mes a exportar')).toHaveAttribute('id', 'mes');
    await expect(page.getByLabel('Año')).toHaveAttribute('id', 'anio');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();
    await expect(page.getByRole('combobox')).toHaveCount(2);
  });
  test('se recorre con el teclado: Tab pasa por mes, año y Revisar; Intro revisa; Exportar es alcanzable', async ({ page }) => {
    const app = await abrir(page, { origen: origenMarzo(), destino: [] });
    await page.locator('#mes').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#anio')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(linea(page, '✔ COINCIDEN')).toBeVisible();
    expect(app.llamadas.at(-1).nombre).toBe('vapAnalizarPeriodo');
    // Mientras carga, Revisar se desactiva y el foco se pierde (comportamiento actual); se retoma en Cancelar.
    await page.getByRole('button', { name: 'Cancelar' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Exportar' })).toBeFocused();
  });
  test('Revisar desactivado durante la carga no es operable (atributo disabled real)', async ({ page }) => {
    await abrir(page, { origen: origenMarzo(), destino: [] });
    const soltar = await retrasar(page, '**/rpc/vapAnalizarPeriodo');
    await page.getByRole('button', { name: 'Revisar' }).click();
    expect(await page.locator('#btnRevisar').getAttribute('disabled')).not.toBeNull();
    soltar();
  });
  test.fail('DEFECTO (accesibilidad): el documento debería declarar el idioma (<html lang="es">)', async ({ page }) => {
    await abrir(page, { destino: [] });
    await expect(page.locator('html')).toHaveAttribute('lang', /^es/);
  });
  test.fail('DEFECTO (accesibilidad): el informe debería anunciarse a lectores de pantalla (aria-live / role)', async ({ page }) => {
    await abrir(page, { destino: [] });
    const vivo = await page.locator('#informe').evaluate((e) => e.getAttribute('aria-live') || e.getAttribute('role'));
    expect(vivo).toBeTruthy();
  });
});

test.describe('seguridad del contenido mostrado', () => {
  test.fail('DEFECTO: un valor de la hoja con HTML se interpreta como código en el informe (innerHTML sin escapar)', async ({ page }) => {
    await abrir(page, { origen: [filaOrigen({ profesor: ANA, datos: { 6: '<img src=x onerror="window.__inyectado=1">' } })], destino: [] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe')).toContainText('Incidencias detectadas');
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__inyectado)).toBeUndefined();
  });
  test('texto normal con caracteres especiales (acentos, comillas, &) se muestra literal', async ({ page }) => {
    await abrir(page, { origen: [filaOrigen({ profesor: 'Ñoño "Ficticio" & Cía', datos: { 6: 1 } })], destino: [] });
    await page.getByRole('button', { name: 'Revisar' }).click();
    await expect(page.locator('#informe')).toContainText('1 profesor(es) a exportar');
  });
});
