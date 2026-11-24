// E2E de la pantalla «Reportar complementos» (HTML real + .gs real + hojas en memoria).
// RF-05 · RF-06 · RF-07 · RF-08 · RF-60 · RF-61 · RNF-06 · RNF-08 · RNF-10 · ADR-0002 · ADR-0003
import { expect, test } from '@playwright/test';
import { arrancar, CARGA_XSS, URL_REPORTAR, validarEnReportar } from './complementos-ayudas.mjs';
import { CAB_DATA } from '../complementos/ayudas.js';

let app;
test.afterEach(async () => { if (app) await app.cerrar(); app = null; });

const abrir = async (page, opciones) => {
  app = await arrancar(opciones);
  await page.goto(URL_REPORTAR(app));
  return app;
};
const entradas = (page) => page.locator('#tbl tbody input');
const continuar = async (page) => {
  await page.locator('#btnContinue').click();
  await page.locator('#step3').waitFor({ state: 'visible' });
};
const filasData = (a) => a.env.data().volcar().slice(1).map((f) => Object.fromEntries(CAB_DATA.map((c, i) => [c, f[i]])));

test.describe('paso 1 · validación del manager (ADR-0003)', () => {
  test('al abrir solo se ve la validación, con el foco en el email', async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole('heading', { name: /VAP - Reporte de Complementos Secretarias/ })).toBeVisible();
    await expect(page.locator('#step2')).toBeHidden();
    await expect(page.locator('#step3')).toBeHidden();
    await expect(page.locator('#email')).toBeFocused();
  });
  test('un email vacío pide introducirlo y no llama al servidor', async ({ page }) => {
    await abrir(page);
    await page.locator('#btnValidate').click();
    await expect(page.locator('#msg1')).toHaveText('Introduce un email.');
    expect(app.llamadas).toEqual([]);
  });
  test.describe('formato inválido', () => {
    for (const malo of ['sin-arroba', 'a@b', 'a b@c.d', '@x.es']) {
      test(`«${malo}» → «Formato de email inválido.»`, async ({ page }) => {
        await abrir(page);
        await page.locator('#email').fill(malo);
        await page.locator('#btnValidate').click();
        await expect(page.locator('#msg1')).toHaveText('Formato de email inválido.');
        expect(app.llamadas).toEqual([]);
      });
    }
  });
  test('RF-06 · un email no autorizado muestra el mensaje del servidor y no abre el paso 2', async ({ page }) => {
    await abrir(page);
    await page.locator('#email').fill('intruso@gala.test');
    await page.locator('#btnValidate').click();
    await expect(page.locator('#msg1')).toHaveText('Email no autorizado o manager inactivo en BBDD.');
    await expect(page.locator('#step2')).toBeHidden();
    await expect(page.locator('#who')).toBeHidden();
  });
  test('un responsable inactivo no entra', async ({ page }) => {
    await abrir(page);
    await page.locator('#email').fill('cleo@gala.test');
    await page.locator('#btnValidate').click();
    await expect(page.locator('#msg1')).toContainText('no autorizado');
  });
  test('RF-06 · un responsable sin conceptos recibe el aviso y no puede continuar', async ({ page }) => {
    await abrir(page);
    await page.locator('#email').fill('dani@gala.test');
    await page.locator('#btnValidate').click();
    await expect(page.locator('#msg1')).toHaveText('Manager válido, pero sin conceptos activos asignados.');
    await expect(page.locator('#step2')).toBeHidden();
  });
  test('un email válido muestra quién es, el paso 2 y el mes actual preseleccionado', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page, '  ANA@gala.test ');
    await expect(page.locator('#who')).toHaveText('Ana Prueba (ana@gala.test)');
    await expect(page.locator('#msg1')).toHaveText('');
    await expect(page.locator('#month option')).toHaveCount(12);
    await expect(page.locator('#month')).toHaveValue('3');
    await expect(page.locator('#month')).toBeFocused();
  });
  test('RF-06 · el desplegable de conceptos solo ofrece los asignados al responsable', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await expect(page.locator('#concept option')).toHaveText(['Aptos (IMPORTE)', 'Sábados 50 (IMPORTE)']);
    expect(await page.locator('#concept').innerHTML()).not.toContain('Reseñas');
  });
  test('Enter en el campo email también valida', async ({ page }) => {
    await abrir(page);
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#email').press('Enter');
    await expect(page.locator('#step2')).toBeVisible();
  });
  test('mientras se valida, el botón y el campo quedan bloqueados y se muestra «Validando…»', async ({ page }) => {
    await abrir(page);
    let liberar;
    const espera = new Promise((r) => { liberar = r; });
    await page.route('**/rpc/vap_bootstrapForEmail', async (ruta) => { await espera; await ruta.continue(); });
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#btnValidate').click();
    await expect(page.locator('#busy1')).toBeVisible();
    await expect(page.locator('#btnValidate')).toBeDisabled();
    await expect(page.locator('#email')).toBeDisabled();
    liberar();
    await expect(page.locator('#step2')).toBeVisible();
    await expect(page.locator('#btnValidate')).toBeEnabled();
    await expect(page.locator('#busy1')).toBeHidden();
  });
  test('un fallo del servidor (hoja de la BBDD ausente) se muestra y desbloquea el botón', async ({ page }) => {
    await abrir(page, { sinHojas: ['VAP_Secretarias'] });
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#btnValidate').click();
    await expect(page.locator('#msg1')).toContainText('Hoja no encontrada en BBDD.');
    await expect(page.locator('#btnValidate')).toBeEnabled();
  });
  test('una respuesta ilegible del servidor muestra «No autorizado.»', async ({ page }) => {
    await abrir(page);
    await page.route('**/rpc/vap_bootstrapForEmail', (r) => r.fulfill({ json: { valor: null } }));
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#btnValidate').click();
    await expect(page.locator('#msg1')).toHaveText('No autorizado.');
  });
  test('tras un fallo se puede corregir el email y entrar', async ({ page }) => {
    await abrir(page);
    await page.locator('#email').fill('intruso@gala.test');
    await page.locator('#btnValidate').click();
    await expect(page.locator('#msg1')).not.toHaveText('');
    await page.locator('#email').fill('ana@gala.test');
    await page.locator('#btnValidate').click();
    await expect(page.locator('#step2')).toBeVisible();
    await expect(page.locator('#msg1')).toHaveText('');
  });
});

test.describe('paso 2 y 3 · parámetros e importes (RF-05)', () => {
  test('«Continuar» abre la tabla con las secretarias de alta, ordenadas, y el contexto del envío', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await expect(page.locator('#tbl tbody tr td:first-child')).toHaveText(['Álvaro Falso', 'Ñoño Inventado', 'Zoe Ficticia']);
    await expect(page.locator('#contextLine')).toHaveText('Mes: Marzo | Concepto: Aptos | Envío mensual');
    await expect(entradas(page).first()).toBeFocused();
    expect(await entradas(page).first().getAttribute('placeholder')).toBe('0,00');
  });
  test('el contexto refleja el mes y concepto elegidos', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await page.locator('#month').selectOption('12');
    await page.locator('#concept').selectOption('C2');
    await continuar(page);
    await expect(page.locator('#contextLine')).toHaveText('Mes: Diciembre | Concepto: Sábados 50 | Envío mensual');
  });
  test('«Atrás» oculta la tabla de importes', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await page.getByRole('button', { name: 'Atrás' }).click();
    await expect(page.locator('#step3')).toBeHidden();
  });
  test('RNF-08 · al salir del campo normaliza el importe al estilo español', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    const casos = [['1.234,56', '1234,56'], ['1,234.56', '1234,56'], ['€ 12,5', '12,5'], ['100.5', '100,5'], ['  7 ', '7'], ['-3,2', '-3,2']];
    for (const [i, [escrito, esperado]] of casos.entries()) {
      const campo = entradas(page).nth(i % 3);
      await campo.fill(escrito);
      await campo.blur();
      await expect(campo).toHaveValue(esperado);
    }
  });
  test('un campo en blanco queda en blanco al salir', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).first().fill('   ');
    await entradas(page).first().blur();
    await expect(entradas(page).first()).toHaveValue('');
  });
  test('los nombres con HTML se muestran como texto y no se ejecutan', async ({ page }) => {
    await abrir(page, { bbdd: { VAP_Secretarias: [['id_trabajador', 'Nombre_Secretaria', 'Alta'], ['S1', CARGA_XSS, true]] } });
    await validarEnReportar(page);
    await continuar(page);
    await expect(page.locator('#tbl tbody td:first-child')).toHaveText(CARGA_XSS);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });
  test('el apodo del responsable con HTML se muestra como texto', async ({ page }) => {
    await abrir(page, { bbdd: { VAP_Responsables: [['ID_Respon', 'Nombre', 'Email', 'Activa'], ['R1', '<b>Ana</b>', 'ana@gala.test', true]] } });
    await validarEnReportar(page);
    await expect(page.locator('#who')).toHaveText('<b>Ana</b> (ana@gala.test)');
  });
});

test.describe('envío mensual · RF-05 · RF-07 · RF-61', () => {
  test('recorrido completo: rellenar, enviar, ver constancia, quedar en Data/Logs y salir el correo', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(0).fill('100');
    await entradas(page).nth(2).fill('1.234,56');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toHaveText('Guardado OK. Batch_ID: BATCH_20260315_110000_1000 | Registros: 2 | Errores: 0');
    await expect(page.locator('#msg3')).toHaveClass('ok');
    // los campos quedan limpios para evitar un doble envío con los mismos importes
    for (const campo of await entradas(page).all()) await expect(campo).toHaveValue('');
    expect(filasData(app).map((f) => [f.ID_Secretaria, f.Valor, f.Modo, f.Concepto, f.Año, f.Mes])).toEqual([
      ['S2', 100, 'NUEVO', 'Aptos', 2026, 3],
      ['S1', 1234.56, 'NUEVO', 'Aptos', 2026, 3],
    ]);
    expect(app.env.logs().volcar()[1][3]).toBe('ENVIO');
    expect(app.entorno.google.estado.correos).toHaveLength(1);
    expect(app.entorno.google.estado.correos[0].subject).toContain('BATCH_20260315_110000_1000');
  });
  test('el envío manda el payload esperado al servidor', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(1).fill('50,5');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    const llamada = app.llamadas.find((l) => l.nombre === 'vap_submitBatch');
    expect(llamada.args[0]).toMatchObject({
      year: 2026, month: 3, modo: 'NUEVO', corrigeBatchId: '', tipoCorreccion: '',
      responsable: { id: 'R1', email: 'ana@gala.test' }, concepto: { id: 'C1', concepto: 'Aptos' },
    });
    expect(llamada.args[0].valores).toEqual([
      { idSecretaria: 'S2', nombreSecretaria: 'Álvaro Falso', valorStr: '' },
      { idSecretaria: 'S4', nombreSecretaria: 'Ñoño Inventado', valorStr: '50.5' },
      { idSecretaria: 'S1', nombreSecretaria: 'Zoe Ficticia', valorStr: '' },
    ]);
  });
  test('RF-61 · las secretarias en blanco no se guardan', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(2).fill('9');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Registros: 1');
    expect(filasData(app).map((f) => f.ID_Secretaria)).toEqual(['S1']);
  });
  test('todo en blanco → el servidor lo rechaza y se muestra en rojo sin guardar nada', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toHaveText('No hay registros para enviar (todo vacío).');
    await expect(page.locator('#msg3')).toHaveClass('error');
    expect(app.env.data().getLastRow()).toBe(1);
    expect(app.entorno.google.estado.correos).toEqual([]);
  });
  test('RF-60 · un importe con formato imposible (1-2) llega al servidor y queda como incidencia, el resto se guarda', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(0).fill('1-2');
    await entradas(page).nth(2).fill('10');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Registros: 1 | Errores: 1');
    expect(app.env.errores().volcar()[1].slice(5)).toEqual(['S2', '1-2', 'Valor no numérico']);
  });
  test('un importe negativo se acepta tal cual (caracterización)', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(2).fill('-25,5');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    expect(filasData(app)[0].Valor).toBe(-25.5);
  });
  test('el botón «Enviar» queda bloqueado mientras se guarda (evita doble envío)', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(2).fill('5');
    let liberar;
    const espera = new Promise((r) => { liberar = r; });
    await page.route('**/rpc/vap_submitBatch', async (ruta) => { await espera; await ruta.continue(); });
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#busy3')).toBeVisible();
    await expect(page.locator('#btnSubmit')).toBeDisabled();
    await page.locator('#btnSubmit').click({ force: true, timeout: 500 }).catch(() => {});
    liberar();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    await expect(page.locator('#btnSubmit')).toBeEnabled();
    expect(filasData(app)).toHaveLength(1);
    expect(app.llamadas.filter((l) => l.nombre === 'vap_submitBatch')).toHaveLength(1);
  });
  test('un error del servidor en el envío se muestra, desbloquea el botón y no vacía los importes', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(2).fill('77');
    await page.route('**/rpc/vap_submitBatch', (r) => r.fulfill({ json: { error: 'cuota agotada' } }));
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toHaveText('Error: cuota agotada');
    await expect(page.locator('#msg3')).toHaveClass('error');
    await expect(page.locator('#btnSubmit')).toBeEnabled();
    await expect(entradas(page).nth(2)).toHaveValue('77');
  });
  test('«Fallo interno» del servidor se muestra tal cual', async ({ page }) => {
    await abrir(page, { sinHojas: ['Errores'] });
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(2).fill('1');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toHaveText('No existe hoja "Errores".');
  });
  test('reenviar el mismo mes y concepto NO sobrescribe: añade otra remesa (RNF-06)', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(2).fill('10');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    await entradas(page).nth(2).fill('20');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    expect(filasData(app).map((f) => f.Valor)).toEqual([10, 20]);
  });
  test('al volver atrás y cambiar el concepto, el siguiente envío usa el nuevo concepto', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await page.getByRole('button', { name: 'Atrás' }).click();
    await page.locator('#concept').selectOption('C2');
    await continuar(page);
    await entradas(page).nth(2).fill('3');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    expect(filasData(app)[0]).toMatchObject({ ID_Concepto: 'C2', Concepto: 'Sábados 50' });
  });
  test('el año del envío es el año actual de la hora de Madrid (límite de año)', async ({ page }) => {
    await abrir(page, { ahora: '2026-12-31T23:30:00Z' });
    await validarEnReportar(page);
    await expect(page.locator('#month')).toHaveValue('1');
    await continuar(page);
    await entradas(page).nth(2).fill('1');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    expect(filasData(app)[0]).toMatchObject({ Año: 2027, Mes: 1 });
  });
});

test.describe('defectos de importes · RF-60 · RNF-08', () => {
  test('RF-60 · un texto no numérico («doce») debe quedar como incidencia, no desaparecer en silencio', async ({ page }) => {
    test.fail(true, 'DEFECTO: normalizeMoneyStr elimina las letras, el valor llega vacío y se omite sin incidencia');
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(0).fill('doce');
    await entradas(page).nth(2).fill('10');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Errores: 1');
  });
  test('RF-60 · «12abc» no debe guardarse como 12', async ({ page }) => {
    test.fail(true, 'DEFECTO: la pantalla recorta los caracteres no numéricos y guarda 12');
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(2).fill('12abc');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Errores: 1');
  });
  test('RNF-08 · «1.234» (mil doscientos treinta y cuatro) debe guardarse como 1234', async ({ page }) => {
    test.fail(true, 'DEFECTO: el punto único se interpreta como decimal y se guarda 1,234');
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await entradas(page).nth(2).fill('1.234');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    expect(filasData(app)[0].Valor).toBe(1234);
  });
});

test.describe('correcciones · RF-08 · RNF-06', () => {
  const previos = [
    { batch: 'BATCH_VIEJO', idS: 'S1', nomS: 'Zoe Ficticia', valor: 100, ts: '2026-03-05T09:00:00Z' },
    { batch: 'BATCH_NUEVO', idS: 'S1', nomS: 'Zoe Ficticia', valor: 110, ts: '2026-03-10T09:30:00Z' },
    { batch: 'BATCH_AJENO', resp: 'R2', idC: 'C3', conc: 'Reseñas', idS: 'S1', valor: 5 },
    { batch: 'BATCH_OTRO_MES', mes: 4, idS: 'S1', valor: 5 },
  ];
  const aCorreccion = async (page) => {
    await page.locator('#modo').selectOption('CORRECCION');
  };

  test('al elegir «Corrección» aparecen el selector de envío y el tipo; en «Envío mensual» se ocultan', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await expect(page.locator('#corrBox')).toBeHidden();
    await expect(page.locator('#corrTypeBox')).toBeHidden();
    await aCorreccion(page);
    await expect(page.locator('#corrBox')).toBeVisible();
    await expect(page.locator('#corrTypeBox')).toBeVisible();
    await page.locator('#modo').selectOption('NUEVO');
    await expect(page.locator('#corrBox')).toBeHidden();
    await expect(page.locator('#corrTypeBox')).toBeHidden();
  });
  test('lista solo los envíos de este responsable, mes y concepto, el más reciente primero', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await aCorreccion(page);
    await expect(page.locator('#corrigeBatchId option')).toHaveText([
      'Selecciona un envío…', '10/03/2026 10:30 — BATCH_NUEVO', '05/03/2026 10:00 — BATCH_VIEJO',
    ]);
    await expect(page.locator('#corrigeBatchId')).toBeEnabled();
  });
  test('sin envíos previos lo dice y bloquea el desplegable', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await aCorreccion(page);
    await expect(page.locator('#corrigeBatchId option')).toHaveText(['No hay envíos previos para corregir']);
    await expect(page.locator('#corrigeBatchId')).toBeDisabled();
    await expect(page.locator('#corrMsg')).toHaveText('No existen envíos anteriores para este mes y concepto.');
  });
  test('al cambiar mes o concepto se recarga la lista de envíos corregibles', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await aCorreccion(page);
    await expect(page.locator('#corrigeBatchId option')).toHaveCount(3);
    await page.locator('#month').selectOption('4');
    await expect(page.locator('#corrigeBatchId option')).toHaveText(['Selecciona un envío…', '10/03/2026 10:00 — BATCH_OTRO_MES']);
    await page.locator('#month').selectOption('3');
    await page.locator('#concept').selectOption('C2');
    await expect(page.locator('#corrigeBatchId option')).toHaveText(['No hay envíos previos para corregir']);
  });
  test('«Continuar» exige elegir el envío a corregir', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await aCorreccion(page);
    await page.locator('#btnContinue').click();
    await expect(page.locator('#msg2')).toHaveText('Selecciona el envío a corregir.');
    await expect(page.locator('#step3')).toBeHidden();
  });
  test('RF-08 · corrección PARCIAL: añade solo lo relleno, enlaza el original y lo conserva intacto (RNF-06)', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await aCorreccion(page);
    await page.locator('#corrigeBatchId').selectOption('BATCH_NUEVO');
    await continuar(page);
    await expect(page.locator('#contextLine')).toHaveText('Mes: Marzo | Concepto: Aptos | Corrección (PARCIAL)');
    const antes = app.env.data().volcar().map((f) => [...f]);
    app.env.e.ejecutar('Math.random = () => 0.5');
    await entradas(page).nth(2).fill('125,5');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK. Batch_ID: BATCH_20260315_110000_5500 | Registros: 1 | Errores: 0');
    const despues = app.env.data().volcar();
    expect(despues.slice(0, antes.length)).toEqual(antes);
    expect(filasData(app).at(-1)).toMatchObject({ Modo: 'CORRECCION', Corrige_Batch_ID: 'BATCH_NUEVO', Valor: 125.5, ID_Secretaria: 'S1' });
    expect(app.env.logs().volcar()[1].slice(3, 8)).toEqual(['CORRECCION', 1, 'OK', 'OK', 'PARCIAL']);
    expect(app.entorno.google.estado.correos[0].htmlBody).toContain('CORRECCIÓN');
  });
  test('RF-08 · corrección TOTAL: las secretarias vacías se guardan como 0', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await aCorreccion(page);
    await page.locator('#tipoCorreccion').selectOption('TOTAL');
    await page.locator('#corrigeBatchId').selectOption('BATCH_VIEJO');
    await continuar(page);
    await expect(page.locator('#contextLine')).toContainText('Corrección (TOTAL)');
    await entradas(page).nth(2).fill('90');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Registros: 3');
    const nuevas = filasData(app).slice(-3);
    expect(nuevas.map((f) => [f.ID_Secretaria, f.Valor])).toEqual([['S2', 0], ['S4', 0], ['S1', 90]]);
    expect(nuevas.every((f) => f.Corrige_Batch_ID === 'BATCH_VIEJO')).toBe(true);
  });
  test('si cambia a «Envío mensual» tras elegir un lote, no se envía el lote', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await aCorreccion(page);
    await page.locator('#corrigeBatchId').selectOption('BATCH_NUEVO');
    await page.locator('#modo').selectOption('NUEVO');
    await continuar(page);
    await entradas(page).nth(2).fill('1');
    await page.locator('#btnSubmit').click();
    await expect(page.locator('#msg3')).toContainText('Guardado OK');
    expect(filasData(app).at(-1)).toMatchObject({ Modo: 'NUEVO', Corrige_Batch_ID: '' });
  });
  test('un fallo al cargar los envíos se muestra y deja el desplegable bloqueado', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await page.route('**/rpc/vap_listCorrectionTargets', (r) => r.fulfill({ json: { valor: { ok: false, error: 'Faltan columnas en Data: Mes' } } }));
    await aCorreccion(page);
    await expect(page.locator('#msg2')).toHaveText('Faltan columnas en Data: Mes');
    await expect(page.locator('#corrigeBatchId option')).toHaveText(['(Error al cargar)']);
    await expect(page.locator('#corrigeBatchId')).toBeDisabled();
  });
  test('un error de red al cargar los envíos también se muestra', async ({ page }) => {
    await abrir(page, { datos: previos });
    await validarEnReportar(page);
    await page.route('**/rpc/vap_listCorrectionTargets', (r) => r.fulfill({ json: { error: 'sin conexión' } }));
    await aCorreccion(page);
    await expect(page.locator('#msg2')).toHaveText('Error: sin conexión');
  });
  test('un Batch_ID con HTML no debe ejecutarse al listarse en el desplegable', async ({ page }) => {
    test.fail(true, 'DEFECTO: refreshCorrectionTargets inserta batchId con innerHTML sin escapar');
    await abrir(page, { datos: [{ batch: CARGA_XSS }] });
    await validarEnReportar(page);
    await aCorreccion(page);
    await expect(page.locator('#corrigeBatchId option')).toHaveCount(2);
    await page.waitForFunction(() => window.__xss === 1, null, { timeout: 1500 }).catch(() => {});
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });
});

test.describe('accesibilidad y adaptación · RNF-10', () => {
  test('los botones principales tienen nombre accesible y el email admite teclado', async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole('button', { name: 'Validar' })).toBeVisible();
    await page.locator('#email').press('Tab');
    await expect(page.getByRole('button', { name: 'Validar' })).toBeFocused();
  });
  test('las tablas de importes tienen cabeceras de columna', async ({ page }) => {
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await expect(page.getByRole('columnheader', { name: 'Secretaria' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Importe' })).toBeVisible();
  });
  test('en móvil la rejilla de parámetros pasa a una columna sin desbordar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await abrir(page);
    await validarEnReportar(page);
    const columnas = await page.locator('#step2 .row').first().evaluate((r) => getComputedStyle(r).gridTemplateColumns.split(' ').length);
    expect(columnas).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
  test('el campo Email tiene una etiqueta asociada (getByLabel)', async ({ page }) => {
    test.fail(true, 'DEFECTO: los <label> no llevan for/id, los campos no tienen nombre accesible por etiqueta');
    await abrir(page);
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 1000 });
  });
  test('los importes por secretaria tienen nombre accesible (aria-label)', async ({ page }) => {
    test.fail(true, 'DEFECTO: los inputs de importe no tienen etiqueta ni aria-label: un lector de pantalla no sabe de quién es cada importe');
    await abrir(page);
    await validarEnReportar(page);
    await continuar(page);
    await expect(page.getByRole('textbox', { name: /Zoe Ficticia/ })).toBeVisible({ timeout: 1000 });
  });
  test('los mensajes de error se anuncian a lectores de pantalla (role=alert / aria-live)', async ({ page }) => {
    test.fail(true, 'DEFECTO: #msg1/#msg2/#msg3 no son regiones aria-live');
    await abrir(page);
    await page.locator('#btnValidate').click();
    await expect(page.getByRole('alert')).toHaveText('Introduce un email.', { timeout: 1000 });
  });
  test('la página declara el idioma', async ({ page }) => {
    test.fail(true, 'DEFECTO: <html> sin lang');
    await abrir(page);
    await expect(page.locator('html')).toHaveAttribute('lang', /es/);
  });
});
