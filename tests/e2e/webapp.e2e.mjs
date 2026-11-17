// E2E de la webapp del proceso mensual (ADR-0017): las pantallas HTML REALES contra el .gs real, con el
// Google falso. Cubre el acceso por rol, las nueve pantallas y el estado de los pasos (HU-45 · RF-79).
import { expect, test } from '@playwright/test';
import { cargarPagos, ID_LIBRO_PAGOS, prepararPagos, TOKEN_PRUEBA } from '../pagos/cargar.js';
import { SRC_WEBAPP } from '../soporte/cargar-gs.js';
import {
  ARCHIVOS_GS,
  CONFIG_NORMAL,
  CONFIG_PERSONAL,
  ID_MAESTRO,
  prepararLibro,
  prepararPersonal,
  RUTAS_HTML,
  URL_SERVICIO_PRUEBA,
} from '../webapp/cargar.js';
import { iniciarAplicacion } from './arnes.mjs';

let app;
test.afterEach(async () => app?.cerrar());

const arrancar = async ({
  usuario = 'sara@gala.test',
  libro = { config: CONFIG_NORMAL, estadoPasos: [] },
  preparar = () => {},
  google = {},
} = {}) => {
  app = await iniciarAplicacion({
    raiz: SRC_WEBAPP,
    codigo: ARCHIVOS_GS,
    html: RUTAS_HTML,
    google: { usuario, ...google },
    preparar: (entorno) => {
      prepararLibro(entorno, libro);
      preparar(entorno);
    },
  });
  return app;
};

// Las pantallas de los grupos «Gestión Personal» y «Pagos» están dentro de un submenú: hay que abrirlo antes de pulsar.
const irA = async (page, titulo) => {
  const enlace = page.locator('#navegacion a', { hasText: titulo });
  if (!(await enlace.isVisible())) await enlace.locator('xpath=ancestor::details/summary').click();
  await enlace.click();
};

const TITULOS = [
  'Proceso mensual',
  'Comprobaciones',
  'Registro de diferencias',
  'Altas/bajas',
  'Maestro de personal',
  'Cruzar Pagos',
  'Históricos de Pagos',
  'Maestro de Pagos',
  'Carga inicial de cuentas',
];
// Las pantallas de Pagos tienen su propio recorrido en pagos.e2e.mjs.
const PANTALLAS_PENDIENTES = ['Comprobaciones', 'Registro de diferencias', 'Maestro de personal'];

test('quien tiene acceso ve las nueve pantallas, su correo y su rol', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await expect(page.locator('#navegacion a')).toHaveText(TITULOS);
  await expect(page.locator('#usuario')).toHaveText('sara@gala.test · administracion');
  await expect(page.locator('footer')).toContainText('webapp v0.4.0');
});

test('arranca en Proceso mensual con el grupo Acciones 1 y el paso 3 suelto', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await expect(page.locator('#navegacion a[aria-current="page"]')).toHaveText('Proceso mensual');
  await expect(page.locator('.grupo-titulo')).toHaveText('Acciones 1');
  const pasos = page.locator('#contenedor-pasos li.paso');
  await expect(pasos).toHaveCount(3);
  await expect(pasos.locator('.insignia-paso')).toHaveText(['1.1', '1.2', '3']);
  await expect(pasos.nth(0)).toContainText('Actualizar VAP BBDD Personas');
  await expect(pasos.nth(0)).toContainText('Manual');
  await expect(pasos.nth(1)).toContainText('Comprobar id_trabajador y DNI');
  await expect(pasos.nth(2)).toContainText('Actualizar GSh Export SAGE Laboral');
  await expect(pasos.locator('.chip')).toHaveText(['Pendiente', 'Pendiente', 'Pendiente']);
  await expect(page.locator('#grupo-acciones-1 li.paso')).toHaveCount(2);
});

test('«Manual» va debajo de «Pendiente» y el 1.1 tiene sus dos botones', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  const uno = page.locator('li.paso').nth(0);
  await expect(uno.getByRole('button', { name: 'Ir a Altas y bajas' })).toBeVisible();
  await expect(uno.getByRole('button', { name: 'Marcar como realizado' })).toBeEnabled();
  const chip = await uno.locator('.chip').boundingBox();
  const manual = await uno.locator('.paso-tipo').boundingBox();
  expect(manual.y).toBeGreaterThan(chip.y);
});

test('«Comprobar» está desactivado hasta que el 1.1 está realizado', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  const comprobar = page.locator('li.paso').nth(1).getByRole('button', { name: 'Comprobar' });
  await expect(comprobar).toBeDisabled();
  await page.locator('li.paso').nth(0).getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click();
  await expect(comprobar).toBeEnabled();
});

test('marcar pide confirmación: cancelar no escribe y confirmar deja quién y cuándo', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  const uno = page.locator('li.paso').nth(0);
  await uno.getByRole('button', { name: 'Marcar como realizado' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(uno.locator('.chip')).toHaveText('Pendiente');
  expect(app.llamadas.filter((l) => l.nombre === 'apiMarcarPasoRealizado')).toHaveLength(0);

  await uno.getByRole('button', { name: 'Marcar como realizado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click();
  await expect(uno.locator('.chip')).toHaveText('Realizado');
  await expect(uno).toContainText('sara@gala.test');
  await expect(uno).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  await expect(uno.getByRole('button', { name: 'Marcar como realizado' })).toHaveCount(0);
  expect(app.llamadas.filter((l) => l.nombre === 'apiMarcarPasoRealizado')).toHaveLength(1);
});

test('el servidor rechaza marcar un paso que no es manual', async ({ page }) => {
  await arrancar({
    libro: {
      config: CONFIG_NORMAL,
      estadoPasos: [],
    },
  });
  await page.goto(app.url);
  const resultado = await page.evaluate(async () => {
    const r = await fetch('/rpc/apiMarcarPasoRealizado', {
      method: 'POST',
      body: JSON.stringify(['2026-11', 'comprobar-concordancia']),
    });
    return r.json();
  });
  expect(resultado.error).toContain('manual');
});

test('«Ir a Altas y bajas» lleva a esa pantalla', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await page.locator('li.paso').nth(0).getByRole('button', { name: 'Ir a Altas y bajas' }).click();
  await expect(page.locator('h1')).toHaveText('Altas/bajas');
  await expect(page.locator('#navegacion a[aria-current="page"]')).toHaveText('Altas/bajas');
});

test('Altas/bajas y Maestro de personal cuelgan de «Gestión Personal»; las de pagos, de «Pagos»', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await expect(page.locator('#navegacion summary')).toHaveText(['Gestión Personal', 'Pagos']);
  await expect(page.locator('#navegacion details a')).toHaveText([
    'Altas/bajas',
    'Maestro de personal',
    'Cruzar Pagos',
    'Históricos de Pagos',
    'Maestro de Pagos',
    'Carga inicial de cuentas',
  ]);
  await expect(page.locator('#navegacion > a')).toHaveText([
    'Proceso mensual',
    'Comprobaciones',
    'Registro de diferencias',
  ]);
});

test('el estado de cada paso sale del libro de la webapp y cambia con el periodo', async ({ page }) => {
  await arrancar({
    libro: {
      config: CONFIG_NORMAL,
      estadoPasos: [
        ['2026-11', 'actualizar-bbdd-personas', 'hecho', 'sara@gala.test', '2026-11-03 09:15'],
        ['2026-11', 'actualizar-export-sage', 'con-incidencias', 'sara@gala.test', '2026-11-04 10:00'],
        ['2026-10', 'actualizar-bbdd-personas', 'pendiente', 'sara@gala.test', '2026-10-02 08:00'],
      ],
    },
  });
  await page.goto(app.url);
  await page.locator('#periodo').fill('2026-11');
  await expect(page.locator('li.paso .chip')).toHaveText(['Realizado', 'Pendiente', 'Con incidencias']);
  await expect(page.locator('li.paso').first()).toContainText('sara@gala.test');
  await expect(page.locator('li.paso').first()).toContainText('2026-11-03 09:15');

  await page.locator('#periodo').fill('2026-10');
  await expect(page.locator('li.paso .chip')).toHaveText(['Pendiente', 'Pendiente', 'Pendiente']);
  expect(app.llamadas.filter((l) => l.nombre === 'apiPasosDelPeriodo').map((l) => l.args[0])).toContain('2026-10');
});

test('las pantallas aún sin construir existen y dicen que están pendientes', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  for (const titulo of PANTALLAS_PENDIENTES) {
    await irA(page, titulo);
    await expect(page.locator('#navegacion a[aria-current="page"]')).toHaveText(titulo);
    await expect(page.locator('h1')).toHaveText(titulo);
    await expect(page.getByText('Pendiente · esta pantalla se construye en una versión posterior.')).toBeVisible();
  }
});

test('desde otra pantalla se puede volver a Proceso mensual', async ({ page }) => {
  await arrancar();
  await page.goto(app.url);
  await irA(page, 'Altas/bajas');
  await irA(page, 'Proceso mensual');
  await expect(page.locator('li.paso')).toHaveCount(3);
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
      estadoPasos: [['2026-11', 'actualizar-bbdd-personas', 'hecho', intento, '2026-11-03']],
    },
  });
  await page.goto(app.url);
  await page.locator('#periodo').fill('2026-11');
  await expect(page.locator('li.paso').first()).toContainText(intento);
  await expect(page.locator('li.paso img')).toHaveCount(0);
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

// ---------- Altas/bajas (HU-47) · datos INVENTADOS ----------
const IBAN = 'ES9121000418450200051332';

// Con servicio: el alta con cuenta llama a VAP_Pagos (otro proyecto, con su propio Google falso). `servicio: false`
// lo deja sin configurar.
let servicioPagos;
const arrancarPersonal = async ({ usuario, personal = {}, config = CONFIG_PERSONAL, servicio = true } = {}) => {
  servicioPagos = cargarPagos();
  prepararPagos(servicioPagos);
  return arrancar({
    usuario,
    google: {
      fetch: (_url, enviado) => ({
        codigo: 200,
        contenido: servicioPagos.llamar('doPost', { postData: { contents: enviado.payload } }).getContent(),
      }),
    },
    libro: { config, estadoPasos: [], registroPersonal: [] },
    preparar: (entorno) => {
      prepararPersonal(entorno, { marca: true, ...personal });
      if (servicio) {
        entorno.google.estado.propiedadesScript.URL_SERVICIO_PAGOS = URL_SERVICIO_PRUEBA;
        entorno.google.estado.propiedadesScript.TOKEN_SERVICIO_PAGOS = TOKEN_PRUEBA;
      }
    },
  });
};

const hoja = (id, nombre) => app.entorno.google.estado.libros.get(id).getSheetByName(nombre).volcar();
const todasLasHojas = () =>
  JSON.stringify([...app.entorno.google.estado.libros.values()].map((l) => l.getSheets().map((h) => h.volcar())));

const abrirAltasBajas = async (page) => {
  await page.goto(app.url);
  await irA(page, 'Altas/bajas');
  await expect(page.locator('h1')).toHaveText('Altas/bajas');
};

const rellenar = async (page, datos) => {
  for (const [id, valor] of Object.entries(datos)) {
    const control = page.locator(`#${id}`);
    if (id === 'f-accion' || id === 'f-empresa') await control.selectOption(valor);
    else await control.fill(valor);
  }
};

const ALTA_MANUAL = {
  'f-accion': 'alta',
  'f-nombre': 'Ana',
  'f-apellidos': 'Ficticia',
  'f-dni': '12345678Z',
  'f-fecha': '2026-11-03',
  'f-empresa': 'Empresa Uno',
};

test('sin configurar el maestro avisa y no deja guardar', async ({ page }) => {
  await arrancarPersonal({ config: CONFIG_NORMAL });
  await abrirAltasBajas(page);
  await expect(page.locator('#aviso-maestro')).toContainText('Falta configurar');
  await expect(page.locator('#guardar-manual')).toBeDisabled();
  await expect(page.locator('#f-iban')).toBeDisabled();
});

test('sin el servicio VAP_Pagos, la cuenta no se puede dar pero el resto sí', async ({ page }) => {
  await arrancarPersonal({ servicio: false });
  await abrirAltasBajas(page);
  await expect(page.locator('#aviso-cuenta')).toBeVisible();
  await expect(page.locator('#f-iban')).toBeDisabled();
  await expect(page.locator('#guardar-manual')).toBeEnabled();
});

test('la empresa se elige de un desplegable con las de config', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await expect(page.locator('#f-empresa option')).toHaveText(['Sin elegir', 'Empresa Uno', 'Empresa Dos']);
});

test('al elegir baja cambia la fecha a «de baja» y se desactiva la cuenta', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await expect(page.getByText('Fecha de alta')).toBeVisible();
  await page.locator('#f-accion').selectOption('baja');
  await expect(page.getByText('Fecha de baja')).toBeVisible();
  await expect(page.locator('#f-iban')).toBeDisabled();
});

test('un alta a mano se guarda en el maestro y el formulario se vacía', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await rellenar(page, { ...ALTA_MANUAL, 'f-id': 'T1' });
  await page.locator('#guardar-manual').click();
  await expect(page.locator('#resultado-manual')).toContainText('Falta la cuenta bancaria');
  await expect(page.locator('#f-nombre')).toHaveValue('');
  expect(hoja(ID_MAESTRO, 'Uno')[1].slice(0, 6)).toStrictEqual([
    'T1',
    'Ana',
    'Ficticia',
    '12345678Z',
    '2026-11-03',
    '',
  ]);
  expect(app.llamadas.filter((l) => l.nombre === 'apiRegistrarPersonas')).toHaveLength(1);
});

test('con cuenta: el servicio guarda solo la huella y la cuenta no queda ni en pantalla ni en ninguna hoja', async ({
  page,
}) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await rellenar(page, { ...ALTA_MANUAL, 'f-id': 'T1', 'f-iban': IBAN });
  await page.locator('#guardar-manual').click();
  await expect(page.locator('#resultado-manual')).toContainText('Guardado y completo');
  await expect(page.locator('#f-iban')).toHaveValue('');
  expect(await page.content()).not.toContain(IBAN);
  expect(servicioPagos.google.estado.libros.get(ID_LIBRO_PAGOS).getSheetByName('huellas').volcar()[1][1]).toMatch(
    /^[0-9a-f]{64}$/,
  );
  expect(hoja(ID_MAESTRO, 'Uno')[1][6]).toBe('sí');
  expect(todasLasHojas()).not.toContain(IBAN);
  expect(app.entorno.google.estado.logs.join('\n')).not.toContain(IBAN);
});

test('el campo de la cuenta se vacía aunque el servidor rechace el registro', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await rellenar(page, { ...ALTA_MANUAL, 'f-dni': '12345678A', 'f-id': 'T1', 'f-iban': IBAN });
  await page.locator('#guardar-manual').click();
  await expect(page.locator('#resultado-manual')).toContainText('DNI no es válido');
  await expect(page.locator('#f-iban')).toHaveValue('');
  expect(hoja(ID_MAESTRO, 'Uno')).toHaveLength(1);
});

test('sin empresa el evento se registra pero no se aplica, y lo dice', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await rellenar(page, { ...ALTA_MANUAL, 'f-empresa': '' });
  await page.locator('#guardar-manual').click();
  await expect(page.locator('#resultado-manual')).toContainText('Falta la empresa');
  expect(hoja(ID_MAESTRO, 'Uno')).toHaveLength(1);
  expect(
    hoja('libro-webapp-prueba', 'registro_personal')
      .map((f) => f[6])
      .slice(1),
  ).toStrictEqual(['registrado', 'sin-aplicar']);
});

test('una baja a mano pone la fecha de baja', async ({ page }) => {
  await arrancarPersonal({ personal: { filasMaestro: [['T9', 'Luis', 'Falso', '87654321X', '2025-01-01', '']] } });
  await abrirAltasBajas(page);
  await rellenar(page, { ...ALTA_MANUAL, 'f-accion': 'baja', 'f-dni': '87654321X', 'f-fecha': '2026-11-30' });
  await page.locator('#guardar-manual').click();
  await expect(page.locator('#resultado-manual')).toContainText('Guardado y completo');
  expect(hoja(ID_MAESTRO, 'Uno')[1][5]).toBe('2026-11-30');
});

test('un error al aplicar se ve en pantalla con su motivo', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await rellenar(page, { ...ALTA_MANUAL, 'f-accion': 'baja' });
  await page.locator('#guardar-manual').click();
  await expect(page.locator('#resultado-manual .alerta')).toContainText('No se encuentra a esa persona');
});

const CABECERA = 'accion;nombre;apellidos;dni;fecha;empresa;id_trabajador';
const subir = (page, texto) =>
  page.locator('#archivo').setInputFiles({ name: 'plantilla.csv', mimeType: 'text/csv', buffer: Buffer.from(texto) });

test('la pantalla muestra las columnas de la plantilla', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await expect(page.locator('#cabecera-plantilla')).toHaveText(CABECERA);
});

test('la plantilla se previsualiza: las filas con error no se pueden verificar', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await subir(
    page,
    [
      CABECERA,
      'alta;Ana;Ficticia;12345678Z;03/11/2026;Empresa Uno;T1',
      'alta;Luis;Falso;11111111A;2026-11-03;Empresa Uno;',
      'alta;Eva;Inventada;X1234567L;2026-11-04;Empresa Dos;T3',
    ].join('\n'),
  );
  await expect(page.locator('#tabla-plantilla tbody tr')).toHaveCount(3);
  await expect(page.locator('#resumen-plantilla')).toContainText('3 filas · 2 sin errores · 1 con errores');
  const filas = page.locator('#tabla-plantilla tbody tr');
  await expect(filas.nth(1)).toContainText('DNI no es válido');
  await expect(filas.nth(1).getByRole('checkbox')).toBeDisabled();
  await expect(filas.nth(0).getByRole('checkbox')).toBeEnabled();
  expect(hoja(ID_MAESTRO, 'Uno')).toHaveLength(1);
});

test('«Todos» verifica solo las filas válidas y «Aplicar» pide confirmación', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await subir(
    page,
    [
      CABECERA,
      'alta;Ana;Ficticia;12345678Z;2026-11-03;Empresa Uno;T1',
      'alta;Luis;Falso;11111111A;2026-11-03;Empresa Uno;',
      'alta;Eva;Inventada;X1234567L;2026-11-04;Empresa Dos;T3',
    ].join('\n'),
  );
  await expect(page.locator('#aplicar-verificados')).toBeDisabled();
  await page.locator('#verificar-todos').check();
  const filas = page.locator('#tabla-plantilla tbody tr');
  await expect(filas.nth(0).getByRole('checkbox')).toBeChecked();
  await expect(filas.nth(1).getByRole('checkbox')).not.toBeChecked();
  await expect(page.locator('#aplicar-verificados')).toContainText('(2)');

  await page.locator('#aplicar-verificados').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  expect(hoja(ID_MAESTRO, 'Uno')).toHaveLength(1);

  await page.locator('#aplicar-verificados').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.locator('#resumen-plantilla')).toContainText('2 aplicadas');
  expect(hoja(ID_MAESTRO, 'Uno')).toHaveLength(2);
  expect(hoja(ID_MAESTRO, 'Empresa Dos')).toHaveLength(2);
  await expect(filas.nth(0)).toContainText('Aplicado · falta la cuenta');
  await expect(filas.nth(1)).toContainText('Con errores');
});

test('corregir una celda revalida la fila y la deja verificable', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await subir(page, [CABECERA, 'alta;Luis;Falso;11111111A;2026-11-03;Empresa Uno;'].join('\n'));
  const fila = page.locator('#tabla-plantilla tbody tr').first();
  await expect(fila).toContainText('Con errores');
  await fila.locator('input[aria-label="dni"]').fill('87654321X');
  await fila.locator('input[aria-label="dni"]').blur();
  await expect(fila).not.toContainText('Con errores');
  await expect(fila.getByRole('checkbox')).toBeEnabled();
});

test('un DNI repetido dentro de la plantilla se marca en la segunda fila', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  const linea = 'alta;Ana;Ficticia;12345678Z;2026-11-03;Empresa Uno;T1';
  await subir(page, [CABECERA, linea, linea].join('\n'));
  const filas = page.locator('#tabla-plantilla tbody tr');
  await expect(filas.nth(1)).toContainText('repetido');
  await expect(filas.nth(0)).not.toContainText('Con errores');
});

test('una plantilla con columna de cuenta se rechaza sin enviarla al servidor', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await subir(page, `${CABECERA};iban\nalta;Ana;Ficticia;12345678Z;2026-11-03;Empresa Uno;T1;${IBAN}`);
  await expect(page.locator('#zona-mensaje')).toContainText('no puede llevar la cuenta bancaria');
  expect(app.llamadas.filter((l) => l.nombre === 'apiValidarPersonas')).toHaveLength(0);
  expect(await page.content()).not.toContain(IBAN);
});

test('una plantilla sin columnas obligatorias dice cuáles faltan', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await subir(page, 'accion;nombre\nalta;Ana');
  await expect(page.locator('#zona-mensaje')).toContainText('faltan las columnas: apellidos, dni, fecha');
});

test('el texto de la plantilla se muestra como texto, nunca como HTML', async ({ page }) => {
  await arrancarPersonal();
  await abrirAltasBajas(page);
  await subir(page, [CABECERA, 'alta;<img src=x onerror="window.__x=1">;Ficticia;12345678Z;2026-11-03;;'].join('\n'));
  await expect(page.locator('#tabla-plantilla')).toBeVisible();
  await expect(page.locator('#tabla-plantilla img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__x)).toBeUndefined();
});

test('un extraño no llega a Altas/bajas ni puede registrar nada', async ({ page }) => {
  await arrancarPersonal({ usuario: 'extrano@gala.test' });
  await page.goto(app.url);
  await expect(page.getByRole('alert')).toContainText('Sin acceso');
  const respuesta = await page.evaluate(async () => {
    const r = await fetch('/rpc/apiRegistrarPersonas', { method: 'POST', body: JSON.stringify([[{}]]) });
    return r.json();
  });
  expect(respuesta.error).toContain('No tienes acceso');
  expect(hoja(ID_MAESTRO, 'Uno')).toHaveLength(1);
});
