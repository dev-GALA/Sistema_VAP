// E2E de las pantallas del grupo «Pagos» (HU-48 · HU-49 · HU-50): las pantallas HTML REALES dentro de la webapp
// real, con el servidor de Pagos SIMULADO (`/rpc/apiXxx` interceptado): aquí se prueba la INTERFAZ; la lógica del
// servidor se prueba en Vitest. Datos INVENTADOS.
import { expect, test } from '@playwright/test';
import { SRC_WEBAPP } from '../soporte/cargar-gs.js';
import { ARCHIVOS_GS, CONFIG_NORMAL, prepararLibro, RUTAS_HTML } from '../webapp/cargar.js';
import { iniciarAplicacion } from './arnes.mjs';

let app;
test.afterEach(async () => app?.cerrar());

const arrancar = async () => {
  app = await iniciarAplicacion({
    raiz: SRC_WEBAPP,
    codigo: ARCHIVOS_GS,
    html: RUTAS_HTML,
    google: { usuario: 'sara@gala.test' },
    preparar: (entorno) => prepararLibro(entorno, { config: CONFIG_NORMAL, estadoPasos: [] }),
  });
  return app;
};

/** Responde a cada `google.script.run.apiXxx` con lo que diga `respuestas[apiXxx]` (valor o función) y las registra. */
async function simular(page, respuestas) {
  const llamadas = [];
  await page.route('**/rpc/api*', async (ruta) => {
    const nombre = decodeURIComponent(new URL(ruta.request().url()).pathname.slice(5));
    if (!(nombre in respuestas)) return ruta.fallback();
    const args = JSON.parse(ruta.request().postData() || '[]');
    llamadas.push({ nombre, args });
    const r = typeof respuestas[nombre] === 'function' ? respuestas[nombre](...args) : respuestas[nombre];
    if (r instanceof Error) return ruta.fulfill({ json: { error: r.message } });
    return ruta.fulfill({ json: { valor: r } });
  });
  return llamadas;
}

const abrirPagos = async (page, titulo) => {
  await page.locator('#navegacion details[data-grupo="Pagos"] summary').click();
  await page.locator('#navegacion a', { hasText: titulo }).click();
};

const OPCIONES = { empresas: ['Empresa Uno', 'Empresa Dos'], servicioConfigurado: true, fuenteImportesConfigurada: true, formatosAceptados: ['.xml', '.csv', '.txt'] };

const fila = (extra = {}) => ({
  filaId: 'f1', periodo: '2026-11', empresa: 'Empresa Uno', parte: 'coincide', estado: 'Coincidente', idPersonal: 'UNO_1',
  nombre: 'Ana Prueba Uno', dni: '00000000T', ultimos4: '0001', importeBanco: '100,00', importeEsperado: '100,00', banco: 'BANCOX',
  referencia: 'R1', fuente: 'Vinculación', observaciones: '', resolucion: '', asignadaA: '', resueltoPor: '', resueltoEn: '', motivoResolucion: '',
  ...extra,
});
const INCORRECTA = fila({ filaId: 'f2', idPersonal: 'UNO_2', nombre: 'Luis Prueba Dos', dni: '00000001R', ultimos4: '0002', importeBanco: '150,00', importeEsperado: '200,00', estado: 'Incorrecto', observaciones: 'El importe del banco (150,00) no coincide con el esperado (200,00).' });
const NO_EXISTE = fila({ filaId: 'f3', parte: 'no-existe', estado: 'Incorrecto', idPersonal: '', nombre: 'APELLIDO, NOMBRE', dni: '', ultimos4: '0099', importeBanco: '9,00', importeEsperado: '', observaciones: 'Cuenta no registrada en VAP_Pagos.' });
const RESUMEN_FALTA = { empresas: [{ empresa: 'Empresa Uno', coincidentes: 1, incorrectos: 2, sinResolver: 2 }], faltan: ['Empresa Dos'], puedeFusionarse: false, sinResolver: 2 };

test('«Pagos» es un submenú con sus cuatro pantallas', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await expect(page.locator('#navegacion details[data-grupo="Pagos"] a')).toHaveText(['Cruzar Pagos', 'Históricos de Pagos', 'Maestro de Pagos', 'Carga inicial de cuentas']);
});

test('Cruzar Pagos · sin servicio configurado avisa y no deja cruzar', async ({ page }) => {
  await arrancar();
  await simular(page, { apiOpcionesPagos: { ...OPCIONES, servicioConfigurado: false, fuenteImportesConfigurada: false } });
  await page.goto(app.url);
  await abrirPagos(page, 'Cruzar Pagos');
  await expect(page.locator('#aviso-servicio')).toBeVisible();
  await expect(page.locator('#aviso-fuente')).toBeVisible();
  await expect(page.locator('#boton-cruzar')).toBeDisabled();
});

test('Cruzar Pagos · un cruce por empresa: informe en dos partes, plegable, y el fichero no se conserva', async ({ page }) => {
  await arrancar();
  const llamadas = await simular(page, {
    apiOpcionesPagos: OPCIONES,
    apiCruzarPagos: { periodo: '2026-11', empresa: 'Empresa Uno', total: 3, coincidentes: 1, incorrectos: 2, filas: [fila(), INCORRECTA, NO_EXISTE] },
    apiInformePagos: { periodo: '2026-11', filas: [], resumen: RESUMEN_FALTA },
  });
  await page.goto(app.url);
  await abrirPagos(page, 'Cruzar Pagos');
  await expect(page.locator('h1')).toHaveText('Cruzar Pagos');

  await page.getByLabel('Empresa').selectOption('Empresa Uno');
  await page.getByLabel('Periodo').fill('2026-11');
  await page.getByLabel('Ficheros del banco').setInputFiles([
    { name: 'remesa.xml', mimeType: 'text/xml', buffer: Buffer.from('<Document>contenido de prueba</Document>') },
    { name: 'otra.csv', mimeType: 'text/csv', buffer: Buffer.from('a;b\n1;2') },
  ]);
  await page.locator('#boton-cruzar').click();

  const informe = page.locator('details.informe-empresa[data-empresa="Empresa Uno"]');
  await expect(informe).toBeVisible();
  await expect(informe.locator('summary')).toContainText('Coincidentes 1 · Incorrectos 2');
  await expect(informe.locator('section[data-parte="coincide"] h3')).toContainText('Coinciden con VAP_Pagos (2)');
  await expect(informe.locator('section[data-parte="no-existe"] h3')).toContainText('No existen en VAP_Pagos (1)');
  await expect(informe.locator('section[data-parte="no-existe"]')).toContainText('APELLIDO, NOMBRE');
  await expect(informe.locator('section[data-parte="coincide"]')).toContainText('Ana Prueba Uno · 00000000T');
  await expect(informe).toContainText('no coincide con el esperado');

  const envio = llamadas.find((l) => l.nombre === 'apiCruzarPagos').args[0];
  expect(envio).toMatchObject({ periodo: '2026-11', empresa: 'Empresa Uno' });
  expect(envio.ficheros.map((f) => f.nombre)).toEqual(['remesa.xml', 'otra.csv']);
  expect(envio.ficheros[0].texto).toContain('contenido de prueba');
  // El selector de ficheros queda vacío: el contenido no se conserva en pantalla.
  expect(await page.locator('#cruce-ficheros').evaluate((e) => e.files.length)).toBe(0);

  // Plegable a una línea.
  await informe.locator('summary').click();
  await expect(informe.locator('section[data-parte="coincide"]')).toBeHidden();
  // Y se avisa de las empresas que faltan.
  await expect(page.locator('#aviso-faltan')).toContainText('Empresa Dos');
});

test('Cruzar Pagos · exige periodo, empresa y fichero antes de enviar nada', async ({ page }) => {
  await arrancar();
  const llamadas = await simular(page, { apiOpcionesPagos: OPCIONES, apiCruzarPagos: new Error('no debería llamarse') });
  await page.goto(app.url);
  await abrirPagos(page, 'Cruzar Pagos');
  await page.locator('#boton-cruzar').click();
  await expect(page.locator('#zona-mensaje-cruce')).toContainText('Elige la empresa');
  await page.getByLabel('Empresa').selectOption('Empresa Uno');
  await page.locator('#boton-cruzar').click();
  await expect(page.locator('#zona-mensaje-cruce')).toContainText('al menos un fichero');
  expect(llamadas.filter((l) => l.nombre === 'apiCruzarPagos')).toHaveLength(0);
});

test('Cruzar Pagos · un fallo del servidor se muestra y deja volver a intentarlo', async ({ page }) => {
  await arrancar();
  await simular(page, { apiOpcionesPagos: OPCIONES, apiCruzarPagos: new Error('El fichero no cuadra con su cabecera.') });
  await page.goto(app.url);
  await abrirPagos(page, 'Cruzar Pagos');
  await page.getByLabel('Empresa').selectOption('Empresa Uno');
  await page.getByLabel('Ficheros del banco').setInputFiles({ name: 'r.csv', mimeType: 'text/csv', buffer: Buffer.from('x') });
  await page.locator('#boton-cruzar').click();
  await expect(page.locator('#zona-mensaje-cruce [role="alert"]')).toContainText('no cuadra con su cabecera');
  await expect(page.locator('#boton-cruzar')).toBeEnabled();
});

test('Cruzar Pagos · subsanar exige motivo, conserva el resultado original y muestra la resolución', async ({ page }) => {
  await arrancar();
  let resuelta = false;
  const llamadas = await simular(page, {
    apiOpcionesPagos: OPCIONES,
    apiCruzarPagos: { periodo: '2026-11', empresa: 'Empresa Uno', total: 2, coincidentes: 1, incorrectos: 1, filas: [fila(), INCORRECTA] },
    apiSubsanarPago: () => { resuelta = true; return { filaId: 'f2', resolucion: 'aceptado' }; },
    apiInformePagos: () => ({
      periodo: '2026-11',
      filas: [fila(), resuelta ? { ...INCORRECTA, resolucion: 'aceptado', motivoResolucion: 'Anticipo ya descontado', resueltoPor: 'sara@gala.test', resueltoEn: '2026-11-17 12:30' } : INCORRECTA],
      resumen: { ...RESUMEN_FALTA, sinResolver: resuelta ? 0 : 1 },
    }),
  });
  await page.goto(app.url);
  await abrirPagos(page, 'Cruzar Pagos');
  await page.getByLabel('Empresa').selectOption('Empresa Uno');
  await page.getByLabel('Ficheros del banco').setInputFiles({ name: 'r.csv', mimeType: 'text/csv', buffer: Buffer.from('x') });
  await page.locator('#boton-cruzar').click();

  await page.getByRole('button', { name: 'Subsanar Luis Prueba Dos' }).click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole('button', { name: 'Guardar subsanación' }).click();
  await expect(dialogo).toContainText('El motivo es obligatorio');
  expect(llamadas.filter((l) => l.nombre === 'apiSubsanarPago')).toHaveLength(0);

  await dialogo.getByLabel('Resolución').selectOption('asignado');
  await dialogo.getByRole('button', { name: 'Guardar subsanación' }).click();
  await expect(dialogo).toContainText('El motivo es obligatorio');
  await dialogo.getByLabel('Motivo (obligatorio)').fill('Anticipo ya descontado');
  await dialogo.getByRole('button', { name: 'Guardar subsanación' }).click();
  await expect(dialogo).toContainText('a qué persona');
  await dialogo.getByLabel('Resolución').selectOption('aceptado');
  await dialogo.getByRole('button', { name: 'Guardar subsanación' }).click();
  await expect(dialogo).toBeHidden();

  const envio = llamadas.find((l) => l.nombre === 'apiSubsanarPago').args[0];
  expect(envio).toEqual({ periodo: '2026-11', filaId: 'f2', resolucion: 'aceptado', asignadaA: '', motivo: 'Anticipo ya descontado' });
  const informe = page.locator('details.informe-empresa[data-empresa="Empresa Uno"]');
  await expect(informe).toContainText('Aceptado · Anticipo ya descontado');
  await expect(informe).toContainText('no coincide con el esperado'); // el resultado original sigue ahí
  await expect(informe.getByRole('button', { name: 'Cambiar la subsanación de Luis Prueba Dos' })).toBeVisible();
});

test('Cruzar Pagos · «Fusionar informes» dice qué empresas faltan y, si están todas, lo confirma', async ({ page }) => {
  await arrancar();
  let intento = 0;
  await simular(page, {
    apiOpcionesPagos: OPCIONES,
    apiInformePagos: { periodo: '2026-11', filas: [], resumen: RESUMEN_FALTA },
    apiFusionarInformes: () => {
      intento += 1;
      if (intento === 1) return new Error('No se puede fusionar: faltan los informes de Empresa Dos.');
      return { empresas: [{ empresa: 'Empresa Uno' }, { empresa: 'Empresa Dos' }], faltan: [], puedeFusionarse: true, sinResolver: 0 };
    },
  });
  await page.goto(app.url);
  await abrirPagos(page, 'Cruzar Pagos');
  await page.locator('#boton-fusionar').click();
  await expect(page.locator('#zona-fusion [role="alert"]')).toContainText('faltan los informes de Empresa Dos');
  await page.locator('#boton-fusionar').click();
  await expect(page.locator('#aviso-fusionado')).toContainText('2 empresas');
});

test('Históricos · el informe de un mes y la búsqueda por nombre o DNI con candidatos al teclear', async ({ page }) => {
  await arrancar();
  const llamadas = await simular(page, {
    apiInformePagos: { periodo: '2026-10', filas: [fila({ periodo: '2026-10' }), NO_EXISTE], resumen: { empresas: [], faltan: ['Empresa Dos'], puedeFusionarse: false, sinResolver: 1 } },
    apiMaestroPagos: [
      { idPersonal: 'UNO_1', nombre: 'Ana Prueba Uno', dni: '00000000T', empresa: 'Empresa Uno', ultimos4: '0001', actualizadoEn: '2026-11-17 10:00' },
      { idPersonal: 'UNO_2', nombre: 'Luis Prueba Dos', dni: '00000001R', empresa: 'Empresa Uno', ultimos4: '0002', actualizadoEn: '2026-11-17 10:00' },
    ],
    apiHistorialPersonaPagos: [fila({ periodo: '2026-09' }), fila({ periodo: '2026-10' })],
  });
  await page.goto(app.url);
  await abrirPagos(page, 'Históricos de Pagos');
  await page.getByLabel('Año').selectOption(String(new Date().getFullYear()));
  await page.getByLabel('Mes').selectOption('10');
  await page.locator('#boton-cargar-mes').click();
  await expect(page.locator('#zona-informe-mes details.informe-empresa')).toBeVisible();
  await expect(page.locator('#zona-informe-mes')).toContainText('Sin informe: Empresa Dos');
  expect(llamadas.find((l) => l.nombre === 'apiInformePagos').args).toEqual([`${new Date().getFullYear()}-10`, '']);

  const buscador = page.getByLabel('Buscar por DNI o nombre');
  await buscador.fill('luis');
  await expect(page.locator('#historico-candidatos button')).toHaveCount(1);
  await buscador.fill('0000000');
  await expect(page.locator('#historico-candidatos button')).toHaveCount(2);
  await buscador.fill('zzz');
  await expect(page.locator('#historico-candidatos')).toContainText('Ningún candidato');
  await buscador.fill('ana uno');
  await page.locator('#historico-candidatos button').click();
  await expect(page.locator('#historial-persona h2')).toContainText('Ana Prueba Uno');
  await expect(page.locator('#historial-persona tbody tr')).toHaveCount(2);
  expect(llamadas.find((l) => l.nombre === 'apiHistorialPersonaPagos').args).toEqual(['UNO_1']);
});

test('Históricos · un mes sin informe lo dice', async ({ page }) => {
  await arrancar();
  await simular(page, { apiInformePagos: { periodo: '2026-01', filas: [], resumen: { empresas: [], faltan: [], puedeFusionarse: false, sinResolver: 0 } }, apiMaestroPagos: [] });
  await page.goto(app.url);
  await abrirPagos(page, 'Históricos de Pagos');
  await page.locator('#boton-cargar-mes').click();
  await expect(page.locator('#zona-informe-mes')).toContainText('No hay informe de pagos');
});

test('Maestro de Pagos · tabla con últimos 4 y fecha, filtro al teclear y NINGUNA huella', async ({ page }) => {
  await arrancar();
  await simular(page, {
    apiMaestroPagos: [
      { idPersonal: 'UNO_2', nombre: 'Luis Prueba Dos', dni: '00000001R', empresa: 'Empresa Uno', ultimos4: '0002', actualizadoEn: '2026-11-17 10:00' },
      { idPersonal: 'UNO_1', nombre: 'Ana Prueba Uno', dni: '00000000T', empresa: 'Empresa Uno', ultimos4: '0001', actualizadoEn: '2026-11-16 09:00' },
    ],
  });
  await page.goto(app.url);
  await abrirPagos(page, 'Maestro de Pagos');
  await expect(page.locator('#maestro-resumen')).toHaveText('2 de 2 personas.');
  await expect(page.locator('#zona-maestro th')).toHaveText(['Nombre', 'DNI', 'Empresa', 'Últimos 4', 'Última actualización']);
  await expect(page.locator('#zona-maestro tbody tr').first()).toContainText('Ana Prueba Uno'); // ordenado por nombre
  await expect(page.locator('#zona-maestro tbody tr').first()).toContainText('0001');
  await page.getByLabel('Buscar por DNI o nombre').fill('0000001r');
  await expect(page.locator('#zona-maestro tbody tr')).toHaveCount(1);
  await expect(page.locator('#maestro-resumen')).toHaveText('1 de 2 personas.');
  await expect(page.locator('#zona-maestro')).not.toContainText(/[0-9a-f]{64}/);
});

// ---------- Carga inicial (HU-48 · RF-89) · cuentas INVENTADAS ----------
const CSV = 'empresa;nombre;dni;cuenta\nEmpresa Uno;Ana Prueba Uno;00000000T;ES0000000000000000000001\nEmpresa Uno;Luis Prueba Dos;00000001R;ES0000000000000000000002\nEmpresa Dos;Sin Persona;00000002W;ES0000000000000000000003\n';

test('Carga inicial · valida, deja confirmar en bloque las listas y NUNCA enseña la cuenta', async ({ page }) => {
  await arrancar();
  const llamadas = await simular(page, {
    apiValidarCargaInicial: [
      { indice: 0, estado: 'lista', idPersonal: 'UNO_1', empresa: 'Empresa Uno', ultimos4: '0001' },
      { indice: 1, estado: 'ya-registrada', idPersonal: 'UNO_2', empresa: 'Empresa Uno', ultimos4: '0002' },
      { indice: 2, estado: 'sin-persona', idPersonal: '', empresa: 'Empresa Dos', ultimos4: '0003' },
    ],
    apiConfirmarCargaInicial: [{ indice: 0, estado: 'guardada', detalle: '' }],
  });
  await page.goto(app.url);
  await abrirPagos(page, 'Carga inicial de cuentas');
  await expect(page.locator('#aviso-uso-unico')).toContainText('uso único');
  await page.getByLabel('Fichero CSV').setInputFiles({ name: 'cuentas.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) });

  await expect(page.locator('ul.recuento li[data-estado="lista"]')).toContainText('1');
  await expect(page.locator('ul.recuento li[data-estado="ya-registrada"]')).toContainText('1');
  await expect(page.locator('ul.recuento li[data-estado="sin-persona"]')).toContainText('1');
  await expect(page.locator('#zona-carga')).not.toContainText('ES00000000000');
  await expect(page.locator('#zona-carga')).toContainText('Corrige el CSV');

  const validacion = llamadas.find((l) => l.nombre === 'apiValidarCargaInicial').args[0];
  expect(validacion).toHaveLength(3);
  expect(validacion[0]).toEqual({ empresa: 'Empresa Uno', nombre: 'Ana Prueba Uno', dni: '00000000T', cuenta: 'ES0000000000000000000001' });

  await page.locator('#boton-confirmar-carga').click();
  await expect(page.getByRole('dialog')).toContainText('¿Guardar la cuenta de 1 personas?');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('#resultado-carga')).toContainText('Guardadas 1 cuentas');
  const envio = llamadas.find((l) => l.nombre === 'apiConfirmarCargaInicial').args[0];
  expect(envio).toHaveLength(1); // solo la lista; la «ya registrada» no estaba marcada
  expect(envio[0].dni).toBe('00000000T');
  await expect(page.locator('#zona-carga')).not.toContainText('ES00000000000');
  expect(await page.locator('#carga-archivo').evaluate((e) => e.files.length)).toBe(0);
});

test('Carga inicial · marcar una «ya registrada» la incluye; un CSV sin columnas se rechaza sin enviar nada', async ({ page }) => {
  await arrancar();
  const llamadas = await simular(page, {
    apiValidarCargaInicial: [{ indice: 0, estado: 'ya-registrada', idPersonal: 'UNO_1', empresa: 'Empresa Uno', ultimos4: '0001' }],
    apiConfirmarCargaInicial: [{ indice: 0, estado: 'error', detalle: 'No se pudo guardar.' }],
  });
  await page.goto(app.url);
  await abrirPagos(page, 'Carga inicial de cuentas');

  await page.getByLabel('Fichero CSV').setInputFiles({ name: 'mal.csv', mimeType: 'text/csv', buffer: Buffer.from('nombre;dni\nA;B\n') });
  await expect(page.locator('#zona-mensaje-carga [role="alert"]')).toContainText('Faltan las columnas: empresa, cuenta');
  expect(llamadas).toHaveLength(0);

  await page.getByLabel('Fichero CSV').setInputFiles({ name: 'ok.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV.split('\n').slice(0, 2).join('\n')) });
  await expect(page.locator('#boton-confirmar-carga')).toBeDisabled();
  await page.getByLabel('Sustituir la cuenta de Ana Prueba Uno').check();
  await page.getByRole('button', { name: /Confirmar las 0 listas/ }).evaluate((b) => { b.disabled = false; });
  await page.locator('#boton-confirmar-carga').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('#zona-carga')).toContainText('con error 1');
  await expect(page.locator('#zona-carga')).toContainText('No se pudo guardar.');
});
