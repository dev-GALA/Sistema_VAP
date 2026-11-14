// E2E del diálogo del volcado de horas extras: la pantalla HTML real contra el .gs real (hojas en memoria, datos ficticios).
// ADR-0013 · RF-16 (periodo) · RF-17 (informe previo y confirmación) · RF-18 (cancelar no escribe) · RF-19 (envío más reciente).
import { expect, test } from '@playwright/test';
import { iniciarAplicacion } from './arnes.mjs';
import { CODIGO, HTML } from '../soporte/cargar-gs.js';
import { fecha, filaDestino, filaOrigen, poblarVolcado, uuidsDistintos } from '../horas_extras/ayudas.js';

const marzo = (dia, extra = {}) => filaOrigen({ ts: fecha(2026, 3, dia), mes: 'MARZO', ...extra });

const DATOS_BASE = {
  origen: [
    marzo(24, { nombre: 'Ana Prueba', horas: 2, otros: 10 }),
    marzo(27, { nombre: 'Ana Prueba', horas: 3, otros: 12 }),
    marzo(26, { nombre: 'Bea Inventada', horas: 4 }),
    filaOrigen({ ts: fecha(2026, 4, 2), mes: 'ABRIL', nombre: 'Ana Prueba', horas: 9 }),
    filaOrigen({ ts: fecha(2025, 3, 2), mes: 'MARZO', nombre: 'Ana Prueba', horas: 9 }),
    filaOrigen({ ts: fecha(2026, 3, 2), mes: 'nunca', nombre: 'Ana Prueba', horas: 9 }),
  ],
  destino: [filaDestino({ nombre: 'Ana Prueba' }), filaDestino({ nombre: 'Bea Inventada' })],
};

let app;
test.afterEach(async () => { if (app) await app.cerrar(); app = null; });

/** Arranca la app con los datos pedidos y abre el diálogo. */
async function abrir(page, { datos = DATOS_BASE, ahora = '2026-03-15T10:00:00Z', preparar = () => {} } = {}) {
  app = await iniciarAplicacion({
    codigo: [CODIGO.horasExtrasVolcado],
    html: { DialogoVolcado: HTML.horasExtrasDialogo },
    google: { ahora },
    preparar: (entorno) => { uuidsDistintos(entorno.google); poblarVolcado(entorno, datos); preparar(entorno); },
  });
  await page.goto(`${app.url}/archivo/DialogoVolcado`);
  await expect(page.locator('#mes option')).toHaveCount(12);
  return app;
}
const informe = (page) => page.locator('#informe');
const revisar = async (page) => { await page.getByRole('button', { name: 'Revisar' }).click(); };
const llamadas = (nombre) => app.llamadas.filter((l) => l.nombre === nombre);
const escrituras = () => app.entorno.estado.escrituras;

test.describe('carga inicial · periodo propuesto (RF-16)', () => {
  test('muestra título, fecha de ejecución y el mes en curso preseleccionado', async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole('heading', { level: 3 })).toHaveText('Volcar Horas Extras a Vinculación');
    await expect(page.locator('#hoy')).toHaveText('Fecha de ejecución: 15/03/2026 · se propone el mes en curso');
    await expect(page.locator('#mes')).toHaveValue('MARZO');
    await expect(page.locator('#mes option:checked')).toHaveText('Marzo');
  });
  test('ofrece los 12 meses con la inicial en mayúscula y el año en curso y el anterior', async ({ page }) => {
    await abrir(page);
    const meses = await page.locator('#mes option').allTextContents();
    expect(meses).toEqual(['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']);
    expect(await page.locator('#anio option').allTextContents()).toEqual(['2026', '2025']);
    await expect(page.locator('#anio')).toHaveValue('2026');
  });
  test('en el cambio de año propone ENERO y el año nuevo', async ({ page }) => {
    await abrir(page, { ahora: '2026-12-31T23:30:00Z' });
    await expect(page.locator('#mes')).toHaveValue('ENERO');
    expect(await page.locator('#anio option').allTextContents()).toEqual(['2027', '2026']);
    await expect(page.locator('#hoy')).toContainText('01/01/2027');
  });
  test('al abrir no hay informe ni botón Exportar, y no se escribe nada (RF-17)', async ({ page }) => {
    await abrir(page);
    await expect(informe(page)).toBeHidden();
    await expect(page.locator('#btnExportar')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
    expect(app.llamadas.map((l) => l.nombre)).toEqual(['vapPeriodoPropuesto']);
    expect(escrituras()).toEqual([]);
  });
  test('si falla la carga inicial se muestra el error en la cabecera', async ({ page }) => {
    app = await iniciarAplicacion({ codigo: [CODIGO.horasExtrasVolcado], html: { DialogoVolcado: HTML.horasExtrasDialogo }, preparar: (e) => poblarVolcado(e, DATOS_BASE) });
    await page.route('**/rpc/vapPeriodoPropuesto', (ruta) => ruta.fulfill({ json: { error: 'sin conexión' } }));
    await page.goto(`${app.url}/archivo/DialogoVolcado`);
    await expect(page.locator('#hoy')).toHaveText('Error al cargar: sin conexión');
  });
});

test.describe('informe previo · qué coincide, qué no y por qué (RF-17)', () => {
  test('desglosa coincidencias y no coincidencias por motivo y no escribe nada', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    const caja = informe(page);
    await expect(caja).toContainText('Filas revisadas en la hoja6');
    await expect(caja).toContainText('✔ COINCIDEN3');
    await expect(caja).toContainText('→ 2 secretaria(s) a exportar');
    await expect(caja).toContainText('→ 1 con varios envíos: vale el más reciente');
    await expect(caja).toContainText('✘ NO COINCIDEN3');
    await expect(caja).toContainText('→ 1 de otro mes');
    await expect(caja).toContainText('→ 1 de otro año');
    await expect(caja).toContainText('→ 1 sin mes reconocible en la columna C');
    await expect(caja).toContainText('→ (no se tocan)');
    await expect(caja).toContainText('Se escribirá en VINCULACIÓN GASTOS PERSONAL y se copiarán 3 fila(s) a Anteriores.');
    await expect(caja).toContainText('La hoja de respuestas no se modifica.');
    await expect(page.locator('#btnExportar')).toBeVisible();
    expect(escrituras()).toEqual([]);
    expect(llamadas('vapEjecutarExportacion')).toEqual([]);
  });
  test('envía al servidor el mes y el año elegidos', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    await expect(informe(page)).toContainText('COINCIDEN');
    expect(llamadas('vapAnalizarPeriodo')[0].args).toEqual(['MARZO', '2026']);
  });
  test('al cambiar mes y año el informe usa el nuevo periodo', async ({ page }) => {
    await abrir(page);
    await page.getByLabel('Mes a exportar').selectOption('ABRIL');
    await revisar(page);
    await expect(informe(page)).toContainText('✔ COINCIDEN1');
    expect(llamadas('vapAnalizarPeriodo')[0].args).toEqual(['ABRIL', '2026']);
    await page.getByLabel('Año').selectOption('2025');
    await revisar(page);
    await expect(informe(page)).toContainText('✔ COINCIDEN0');
    expect(llamadas('vapAnalizarPeriodo')[1].args).toEqual(['ABRIL', '2025']);
  });
  test('periodo sin respuestas: avisa de que no hay nada que exportar y NO ofrece Exportar', async ({ page }) => {
    await abrir(page);
    await page.getByLabel('Mes a exportar').selectOption('JULIO');
    await revisar(page);
    await expect(informe(page)).toContainText('No hay nada que exportar para este periodo.');
    await expect(informe(page)).toContainText('✔ COINCIDEN0');
    await expect(page.locator('#btnExportar')).toBeHidden();
  });
  test('hoja de respuestas sin filas: informe con 0 y sin Exportar', async ({ page }) => {
    await abrir(page, { datos: { origen: [], destino: [] } });
    await revisar(page);
    await expect(informe(page)).toContainText('Filas revisadas en la hoja0');
    await expect(informe(page)).toContainText('No hay nada que exportar');
    await expect(page.locator('#btnExportar')).toBeHidden();
    await expect(informe(page)).not.toContainText('Atención: el destino');
  });
  test('muestra el aviso de marca temporal fuera del mes', async ({ page }) => {
    await abrir(page, { datos: { origen: [filaOrigen({ ts: fecha(2026, 6, 1), mes: 'MARZO', nombre: 'Ana Prueba', horas: 1 })], destino: [] } });
    await revisar(page);
    await expect(page.locator('#informe .aviso').first()).toContainText('1 fila(s) coinciden en el mes pero su marca temporal cae fuera de él');
    await expect(page.locator('#informe .aviso').first()).toContainText('Se exportan igualmente');
  });
  test('lista las incidencias y recorta a 8 con «… y N más»', async ({ page }) => {
    const origen = Array.from({ length: 10 }, (_, i) => filaOrigen({ mes: 'MARZO', nombre: `Persona Ficticia ${i}`, horas: 1 }));
    await abrir(page, { datos: { origen, destino: [] } });
    await revisar(page);
    await expect(informe(page)).toContainText('Incidencias detectadas (10):');
    await expect(page.locator('#informe ul.incidencias li')).toHaveCount(9);
    await expect(page.locator('#informe ul.incidencias li').last()).toHaveText('… y 2 más (todas en el log)');
    await expect(page.locator('#informe ul.incidencias li').first()).toContainText('SIN_MARCA_TEMPORAL (fila 2)');
  });
  test('con 8 incidencias exactas no aparece «y N más»', async ({ page }) => {
    const origen = Array.from({ length: 8 }, (_, i) => filaOrigen({ mes: 'MARZO', nombre: `Persona Ficticia ${i}`, horas: 1 }));
    await abrir(page, { datos: { origen, destino: [] } });
    await revisar(page);
    await expect(page.locator('#informe ul.incidencias li')).toHaveCount(8);
  });
  test('alerta si el destino ya tiene datos (volcado sobre la hoja del mes anterior)', async ({ page }) => {
    await abrir(page, { datos: { origen: DATOS_BASE.origen, destino: [filaDestino({ nombre: 'Ana Prueba', horas: 7, otros: 70 }), filaDestino({ nombre: 'Bea Inventada' })] } });
    await revisar(page);
    await expect(page.locator('#informe .alerta')).toContainText('Atención: el destino no está vacío.');
    await expect(page.locator('#informe .alerta')).toContainText('Hay 2 celda(s) con datos en AE/AH');
    await expect(page.locator('#btnExportar')).toBeVisible(); // avisa, no impide: decide la persona
  });
  test('sin alerta cuando el destino está limpio', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    await expect(informe(page)).toContainText('COINCIDEN');
    await expect(page.locator('#informe .alerta')).toHaveCount(0);
  });
  test('si no se puede comprobar el destino lo dice y pide revisarlo a mano', async ({ page }) => {
    await abrir(page, { datos: { origen: DATOS_BASE.origen, libroDestino: false } });
    await revisar(page);
    await expect(informe(page)).toContainText('No se ha podido comprobar si el destino está vacío. Revísalo manualmente antes de exportar.');
  });
  test('avisa de que el periodo ya está archivado en Anteriores', async ({ page }) => {
    await abrir(page, { datos: { ...DATOS_BASE, archivo: [['', '', 'ARCHIVADO MARZO 2026']] } });
    await revisar(page);
    await expect(informe(page)).toContainText('En Anteriores ya hay filas de MARZO 2026 de una ejecución previa. Se añadirán de nuevo.');
  });
  test('revisar de nuevo oculta el Exportar anterior hasta que llega el nuevo informe', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    await expect(page.locator('#btnExportar')).toBeVisible();
    await page.getByLabel('Mes a exportar').selectOption('JULIO');
    await revisar(page);
    await expect(page.locator('#btnExportar')).toBeHidden();
  });
});

test.describe('estados de carga', () => {
  test('mientras revisa: mensaje de espera, Revisar deshabilitado y sin Exportar', async ({ page }) => {
    await abrir(page);
    let soltar;
    const puerta = new Promise((r) => { soltar = r; });
    await page.route('**/rpc/vapAnalizarPeriodo', async (ruta) => { await puerta; await ruta.continue(); });
    await revisar(page);
    await expect(informe(page)).toContainText('Revisando la hoja de respuestas…');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeDisabled();
    await expect(page.locator('#btnExportar')).toBeHidden();
    soltar();
    await expect(informe(page)).toContainText('✔ COINCIDEN');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
  });
  test('mientras exporta: aviso de no cerrar, sin Exportar ni Revisar', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    await expect(page.locator('#btnExportar')).toBeVisible();
    let soltar;
    const puerta = new Promise((r) => { soltar = r; });
    await page.route('**/rpc/vapEjecutarExportacion', async (ruta) => { await puerta; await ruta.continue(); });
    await page.locator('#btnExportar').click();
    await expect(informe(page)).toContainText('Exportando… no cierres esta ventana.');
    await expect(page.locator('#btnExportar')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeDisabled();
    soltar();
    await expect(informe(page)).toContainText('Exportación completada');
  });
});

test.describe('confirmar la exportación (RF-17 · RF-19)', () => {
  test('escribe en el destino, copia a Anteriores y muestra el resumen', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    await page.locator('#btnExportar').click();
    const caja = informe(page);
    await expect(caja).toContainText('Exportación completada');
    await expect(caja).toContainText('Actualizadas2');
    await expect(caja).toContainText('Sin cambios0');
    await expect(caja).toContainText('Filas nuevas creadas0');
    await expect(caja).toContainText('Copiadas a Anteriores3');
    await expect(caja).toContainText('Detalle fila a fila en la hoja LOG Volcado.');
    await expect(caja).not.toContainText('Bloqueadas');
    await expect(caja).toContainText('Incidencias anotadas1'); // la fila con mes «nunca»
    const e = app.entorno;
    expect([e.celdaDestino(2, 31), e.celdaDestino(2, 34), e.celdaDestino(3, 31)]).toEqual([3, 12, 4]); // RF-19: gana el envío del día 27
    expect(e.verArchivo()).toHaveLength(3);
    expect(e.verLog().length).toBeGreaterThan(3);
    expect(llamadas('vapEjecutarExportacion')[0].args).toEqual(['MARZO', '2026']);
  });
  test('tras exportar no se puede exportar otra vez sin volver a abrir (Exportar oculto, Revisar deshabilitado)', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    await page.locator('#btnExportar').click();
    await expect(informe(page)).toContainText('Exportación completada');
    await expect(page.locator('#btnExportar')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeDisabled();
    expect(llamadas('vapEjecutarExportacion')).toHaveLength(1);
  });
  test('muestra filas nuevas, bloqueadas e incidencias cuando las hay', async ({ page }) => {
    const origen = [
      marzo(24, { nombre: 'Ana Prueba', horas: 2 }),
      marzo(25, { nombre: 'Nueva Imaginaria', horas: 'x' }),
    ];
    const destino = [filaDestino({ nombre: 'Ana Prueba' }), filaDestino({ nombre: 'Ana Prueba' })];
    await abrir(page, { datos: { origen, destino } });
    await revisar(page);
    await page.locator('#btnExportar').click();
    const caja = informe(page);
    await expect(caja).toContainText('Filas nuevas creadas1');
    await expect(caja).toContainText('Bloqueadas (nombre duplicado)1');
    await expect(caja).toContainText('Incidencias anotadas1');
  });
  test('el envío corregido (el más reciente) es el que llega al destino aunque esté primero en la hoja', async ({ page }) => {
    const origen = [marzo(28, { nombre: 'Ana Prueba', horas: 8 }), marzo(10, { nombre: 'Ana Prueba', horas: 1 })];
    await abrir(page, { datos: { origen, destino: [filaDestino({ nombre: 'Ana Prueba' })] } });
    await revisar(page);
    await page.locator('#btnExportar').click();
    await expect(informe(page)).toContainText('Exportación completada');
    expect(app.entorno.celdaDestino(2, 31)).toBe(8);
  });
  test('error del servidor al exportar (bloqueo ocupado): muestra el error, no escribe y permite revisar de nuevo', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    app.entorno.estado.bloqueoOcupado = true;
    await page.locator('#btnExportar').click();
    await expect(page.locator('#informe .error')).toContainText('Error: Se agotó el tiempo de espera del bloqueo.');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
    await expect(page.locator('#btnExportar')).toBeHidden();
    expect(app.entorno.celdaDestino(2, 31)).toBe('');
    expect(escrituras()).toEqual([]);
  });
  test('error de destino al exportar: muestra el motivo', async ({ page }) => {
    await abrir(page, { datos: { origen: DATOS_BASE.origen, destino: false } });
    await revisar(page);
    await page.locator('#btnExportar').click();
    await expect(page.locator('#informe .error')).toContainText('No existe la pestaña destino: "Hoja 1".');
  });
  test('si la llamada falla (red caída) remite al LOG y reactiva Revisar', async ({ page }) => {
    await abrir(page);
    await revisar(page);
    await page.route('**/rpc/vapEjecutarExportacion', (ruta) => ruta.fulfill({ json: { error: 'tiempo agotado' } }));
    await page.locator('#btnExportar').click();
    await expect(page.locator('#informe .error')).toContainText('Error: tiempo agotado');
    await expect(page.locator('#informe .error')).toContainText('Revisa la hoja LOG Volcado.');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
  });
});

test.describe('errores al revisar', () => {
  test('hoja de respuestas inexistente: muestra el error, reactiva Revisar, sin Exportar', async ({ page }) => {
    await abrir(page, { datos: { origen: false } });
    await revisar(page);
    await expect(page.locator('#informe .error')).toContainText('Error: No existe la pestaña origen: "Respuestas de formulario".');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
    await expect(page.locator('#btnExportar')).toBeHidden();
    expect(escrituras().every((w) => w.hoja === 'LOG Volcado')).toBe(true); // lo único que se escribe es el LOG de errores
  });
  test('libro de respuestas inexistente: muestra el error del servidor', async ({ page }) => {
    await abrir(page, { datos: { libroOrigen: false } });
    await revisar(page);
    await expect(page.locator('#informe .error')).toContainText(/no existe o no hay acceso/);
  });
  test('fallo de la llamada: muestra el error y reactiva Revisar', async ({ page }) => {
    await abrir(page);
    await page.route('**/rpc/vapAnalizarPeriodo', (ruta) => ruta.fulfill({ json: { error: 'servicio no disponible' } }));
    await revisar(page);
    await expect(page.locator('#informe .error')).toContainText('Error: servicio no disponible');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeEnabled();
  });
});

test.describe('cancelar (RF-18)', () => {
  test('el botón Cancelar cierra el diálogo y no llama al servidor para escribir', async ({ page }) => {
    await abrir(page);
    expect(await page.evaluate(() => window.__dialogoCerrado)).toBeFalsy();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(await page.evaluate(() => window.__dialogoCerrado)).toBe(true);
    expect(app.llamadas.map((l) => l.nombre)).toEqual(['vapPeriodoPropuesto']);
    expect(escrituras()).toEqual([]);
  });
  test('cancelar DESPUÉS de revisar tampoco modifica ningún dato', async ({ page }) => {
    await abrir(page);
    const e = app.entorno;
    const origen = e.hojaOrigen.volcar();
    const destino = e.hojaDestino.volcar();
    await revisar(page);
    await expect(page.locator('#btnExportar')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(await page.evaluate(() => window.__dialogoCerrado)).toBe(true);
    expect(llamadas('vapEjecutarExportacion')).toEqual([]);
    expect(e.hojaOrigen.volcar()).toEqual(origen);
    expect(e.hojaDestino.volcar()).toEqual(destino);
    expect(escrituras()).toEqual([]);
    expect(e.libroOrigen.getSheets().map((h) => h.getName())).toEqual(['Respuestas de formulario']);
  });
  test('Cancelar está disponible también mientras se revisa', async ({ page }) => {
    await abrir(page);
    await page.route('**/rpc/vapAnalizarPeriodo', async () => { /* se queda colgada */ });
    await revisar(page);
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(await page.evaluate(() => window.__dialogoCerrado)).toBe(true);
  });
});

test.describe('accesibilidad básica', () => {
  test('los desplegables tienen etiqueta asociada y los botones nombre accesible', async ({ page }) => {
    await abrir(page);
    await expect(page.getByLabel('Mes a exportar')).toBeVisible();
    await expect(page.getByLabel('Año')).toBeVisible();
    for (const nombre of ['Revisar', 'Cancelar']) await expect(page.getByRole('button', { name: nombre })).toBeVisible();
  });
  test('se maneja con teclado: orden Mes → Año → Revisar → Cancelar y Enter en Revisar lanza el informe', async ({ page }) => {
    await abrir(page);
    await page.getByLabel('Mes a exportar').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Año')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Revisar' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(informe(page)).toContainText('✔ COINCIDEN');
    await page.getByRole('button', { name: 'Cancelar' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Exportar' })).toBeFocused();
  });
  test('Revisar deshabilitado usa el atributo disabled (no solo estilo)', async ({ page }) => {
    await abrir(page);
    await page.route('**/rpc/vapAnalizarPeriodo', async () => {});
    await revisar(page);
    expect(await page.locator('#btnRevisar').getAttribute('disabled')).not.toBeNull();
  });
  test('Exportar oculto no es alcanzable con teclado ni por lectores (display:none)', async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole('button', { name: 'Exportar' })).toHaveCount(0);
  });
  test.fail('DEFECTO a11y: el documento debería declarar el idioma (<html lang="es">, WCAG 3.1.1)', async ({ page }) => {
    await abrir(page);
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('es');
  });
  test.fail('DEFECTO a11y: el informe y los errores deberían anunciarse a lectores de pantalla (aria-live / role="status"|"alert")', async ({ page }) => {
    await abrir(page);
    const atributos = await page.locator('#informe').evaluate((el) => `${el.getAttribute('aria-live') || ''}${el.getAttribute('role') || ''}`);
    expect(atributos).not.toBe('');
  });
});

test.describe('seguridad del contenido mostrado', () => {
  test.fail('DEFECTO: lo que escriben las secretarias (nombres, valores) no debe interpretarse como HTML en el informe (innerHTML sin escapar)', async ({ page }) => {
    const origen = [marzo(24, { nombre: 'Ana Prueba', horas: '<img src=x onerror="window.__inyectado=1">' })];
    await abrir(page, { datos: { origen, destino: [] } });
    await revisar(page);
    await expect(informe(page)).toContainText('Incidencias detectadas');
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__inyectado)).toBeUndefined();
    expect(await page.locator('#informe img').count()).toBe(0);
  });
  test('el texto normal con caracteres como & o comillas se muestra literal en las incidencias', async ({ page }) => {
    const origen = [marzo(24, { nombre: 'Ana Prueba', horas: 'dos & medio' })];
    await abrir(page, { datos: { origen, destino: [] } });
    await revisar(page);
    await expect(informe(page)).toContainText('Nº HORAS EXTRA = "dos & medio" no es un número.');
  });
});
