// Integración · exportación mensual a XLSX (menú «Generar Excel mensual») y utilidades de Data.
// RNF-03 · RNF-06 · RNF-12 · ADR-0005 · ADR-0009 (el último registro gana por Timestamp, sin borrar nada).
import { describe, expect, it } from 'vitest';
import { CAB_DATA, cargarData, colaPrompt, crearEntorno, envio, fetchXlsxOk, registrarTemporal } from './ayudas.js';

/** Entorno de exportación: prompts encadenados, HTTP correcto y libro temporal registrado en Drive. */
function entornoExport({ anio = '2026', mes = 'Marzo', fetch = fetchXlsxOk, filas = [], ...resto } = {}) {
  const env = crearEntorno({ respuestas: { prompt: colaPrompt(anio, mes) }, fetch, ...resto });
  cargarData(env, filas);
  env.idTemporal = registrarTemporal(env);
  return env;
}
const exportar = (env) => env.e.llamar('vap_generarExcelMensual');
const ultimaAlerta = (env) => env.g.estado.alertas.at(-1)[0];
const tablaConDni = (env) => env.g.estado.libros.get(env.idTemporal).getSheets()[0].volcar();
/** La tabla sin la columna DNI (la última), que se comprueba aparte. */
const tablaTemporal = (env) => tablaConDni(env).map((fila) => fila.slice(0, -1));

const BASE = [
  { idS: 'S1', nomS: 'Ficticia, Zoe', idC: 'C1', conc: 'Aptos', valor: 100 },
  { idS: 'S2', nomS: 'Falso, Álvaro', idC: 'C1', conc: 'Aptos', valor: 50 },
];

describe('entrada del usuario', () => {
  it('sin hoja Data avisa y no pregunta nada', () => {
    const env = entornoExport({ sinHojas: ['Data'] });
    exportar(env);
    expect(env.g.estado.alertas).toEqual([['No existe la hoja "Data". Revisa el nombre.']]);
  });
  it('cancelar en el año termina en silencio, sin escribir', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('CANCEL') } });
    exportar(env);
    expect(env.g.estado.alertas).toHaveLength(1); // solo la pregunta
    expect(env.g.estado.libros.size).toBe(2); // solo BBDD + Datos: no se creó el temporal
  });
  it('cancelar en el mes termina en silencio y no crea el libro temporal', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('2026', 'CANCEL') } });
    exportar(env);
    expect(env.g.estado.alertas).toHaveLength(2);
    expect(env.g.estado.peticiones).toEqual([]);
  });
  it.each([['abc'], [''], ['1999'], ['2101'], ['0'], ['-2026']])('año «%s» → «Año inválido»', (anio) => {
    const env = entornoExport({ anio, filas: BASE });
    exportar(env);
    expect(ultimaAlerta(env)).toBe('Año inválido. Ejemplo válido: 2026');
    expect(env.g.estado.peticiones).toEqual([]);
  });
  it.each([['2000'], ['2100'], [' 2026 ']])('año «%s» es válido', (anio) => {
    const env = entornoExport({ anio, filas: [] });
    exportar(env);
    expect(ultimaAlerta(env)).not.toBe('Año inválido. Ejemplo válido: 2026');
  });
  it.each([['13'], ['0'], ['xyz'], [''], ['Sept']])('mes «%s» → «Mes inválido»', (mes) => {
    const env = entornoExport({ mes, filas: BASE });
    exportar(env);
    expect(ultimaAlerta(env)).toBe('Mes inválido. Usa: Enero..Diciembre o 1..12.');
  });
  it.each([['3'], ['03'], ['marzo'], ['MARZO'], [' Marzo ']])('mes «%s» se entiende como Marzo', (mes) => {
    const env = entornoExport({ mes, filas: BASE });
    exportar(env);
    expect(ultimaAlerta(env)).toContain('VAP_COMPLEMENTOS_2026_03.xlsx');
  });
});

describe('estado de Data antes de exportar', () => {
  it('Data solo con cabecera → «La hoja Data no tiene registros.»', () => {
    const env = entornoExport();
    exportar(env);
    expect(ultimaAlerta(env)).toBe('La hoja Data no tiene registros.');
  });
  it('faltan columnas → las lista y no exporta', () => {
    const env = entornoExport();
    env.data().cargar([['Timestamp', 'Año', 'Mes'], ['x', 2026, 3]]);
    exportar(env);
    expect(ultimaAlerta(env)).toBe('Faltan columnas en Data: ID_Secretaria, Nombre_Secretaria, ID_Concepto, Concepto, Valor');
    expect(env.g.estado.peticiones).toEqual([]);
  });
  it('sin datos para el periodo pedido → «No hay datos para Marzo 2026.»', () => {
    const env = entornoExport({ filas: [{ mes: 4 }, { year: 2025 }] });
    exportar(env);
    expect(ultimaAlerta(env)).toBe('No hay datos para Marzo 2026.');
    expect(env.g.estado.peticiones).toEqual([]);
    expect(env.logs().getLastRow()).toBe(1);
  });
});

describe('contenido del Excel · el último registro gana (ADR-0009 · RNF-06)', () => {
  it('pivot: ID_Secretaria, Secretaria y un concepto por columna', () => {
    const env = entornoExport({ filas: [...BASE, { idS: 'S1', nomS: 'Ficticia, Zoe', idC: 'C2', conc: 'Sábados 50', valor: 7 }] });
    exportar(env);
    expect(tablaTemporal(env)).toEqual([
      ['ID_Secretaria', 'Secretaria', 'Aptos', 'Sábados 50'],
      ['S2', 'Falso, Álvaro', 50, ''],
      ['S1', 'Ficticia, Zoe', 100, 7],
    ]);
  });
  it('el registro con Timestamp más reciente prevalece, esté donde esté en la hoja', () => {
    const env = entornoExport({ filas: [
      { idS: 'S1', nomS: 'Zoe', valor: 300, ts: '2026-03-20T09:00:00Z' },
      { idS: 'S1', nomS: 'Zoe', valor: 100, ts: '2026-03-10T09:00:00Z' },
      { idS: 'S1', nomS: 'Zoe', valor: 200, ts: '2026-03-15T09:00:00Z' },
    ] });
    exportar(env);
    expect(tablaTemporal(env)[1][2]).toBe(300);
  });
  it('en empate de Timestamp prevalece el primero de la hoja', () => {
    const env = entornoExport({ filas: [{ idS: 'S1', valor: 1 }, { idS: 'S1', valor: 2 }] });
    exportar(env);
    expect(tablaTemporal(env)[1][2]).toBe(1);
  });
  it('RF-08 · una corrección PARCIAL cambia solo lo corregido y conserva el resto', () => {
    const env = entornoExport({ filas: [
      ...BASE,
      { batch: 'B2', idS: 'S1', nomS: 'Ficticia, Zoe', valor: 120, ts: '2026-03-12T09:00:00Z', modo: 'CORRECCION', corrige: 'BATCH_A' },
    ] });
    exportar(env);
    expect(tablaTemporal(env).slice(1)).toEqual([['S2', 'Falso, Álvaro', 50], ['S1', 'Ficticia, Zoe', 120]]);
  });
  it('RF-08 · una corrección TOTAL con ceros deja 0 (el 0 es un valor, no un vacío)', () => {
    const env = entornoExport({ filas: [
      ...BASE,
      { batch: 'B2', idS: 'S2', nomS: 'Falso, Álvaro', valor: 0, ts: '2026-03-12T09:00:00Z', modo: 'CORRECCION' },
    ] });
    exportar(env);
    expect(tablaTemporal(env)[1]).toEqual(['S2', 'Falso, Álvaro', 0]);
  });
  it('RNF-06 · exportar no modifica Data', () => {
    const env = entornoExport({ filas: BASE });
    const antes = env.data().volcar();
    exportar(env);
    expect(env.data().volcar()).toEqual(antes);
  });
  it('RNF-03 · solo entra el año y mes pedidos (admite Mes como nombre o número y Año como texto)', () => {
    const env = entornoExport({ filas: [
      { idS: 'S1', valor: 1, mes: 3 }, { idS: 'S2', nomS: 'Álvaro', valor: 2, mes: 'Marzo' }, { idS: 'S4', nomS: 'Ñoño', valor: 3, mes: '03', year: '2026' },
      { idS: 'S5', nomS: 'Otro año', valor: 9, year: 2025 }, { idS: 'S6', nomS: 'Otro mes', valor: 9, mes: 4 },
    ] });
    exportar(env);
    expect(tablaTemporal(env).slice(1).map((f) => f[0]).sort()).toEqual(['S1', 'S2', 'S4']);
  });
  it('descarta filas sin concepto, sin secretaria, sin valor o con fecha ilegible', () => {
    const env = entornoExport({ filas: [
      { idS: 'S1', valor: 1 },
      { idS: 'S2', conc: '', valor: 2 }, { idS: '', nomS: '', valor: 3 }, { idS: 'S4', nomS: 'N', valor: '' },
      { idS: 'S5', nomS: 'M', tsRaw: 'nada', valor: 5 }, { idS: 'S6', nomS: 'P', tsRaw: '', valor: 6 },
    ] });
    env.data().appendRow([env.fecha('2026-03-10T09:00:00Z'), 'B', 'R1', '', '', 2026, 3, 'C1', 'Aptos', 'S7', 'Q', '', null, '', 'NUEVO', '']);
    exportar(env);
    expect(tablaTemporal(env).slice(1).map((f) => f[0])).toEqual(['S1']);
  });
  it('agrupa por ID de secretaria aunque el nombre cambie; sin ID agrupa por nombre', () => {
    const env = entornoExport({ filas: [
      { idS: 'S1', nomS: 'Zoe Vieja', valor: 1, ts: '2026-03-01T09:00:00Z' },
      { idS: 'S1', nomS: 'Zoe Nueva', valor: 2, ts: '2026-03-02T09:00:00Z' },
      { idS: '', nomS: 'Sin Id', valor: 3, ts: '2026-03-01T09:00:00Z' },
      { idS: '', nomS: 'Sin Id', valor: 4, ts: '2026-03-02T09:00:00Z' },
    ] });
    exportar(env);
    expect(tablaTemporal(env).slice(1)).toEqual([['', 'Sin Id', 4], ['S1', 'Zoe Nueva', 2]]);
  });
  it('conceptos: primero los preferidos en su orden, luego el resto alfabético', () => {
    const conceptos = ['Zeta Extra', 'Horas puntos', 'Sábados 60', 'Reseñas', 'Alfa Extra', 'Aptos', 'Sábados 50', 'Financiaciones'];
    const env = entornoExport({ filas: conceptos.map((c, i) => ({ idS: 'S1', idC: `C${i}`, conc: c, valor: i })) });
    exportar(env);
    expect(tablaTemporal(env)[0]).toEqual(['ID_Secretaria', 'Secretaria', 'Aptos', 'Financiaciones', 'Reseñas', 'Sábados 50', 'Sábados 60', 'Horas puntos', 'Alfa Extra', 'Zeta Extra']);
  });
  it('secretarias ordenadas por nombre según el orden del español (Á antes que Z, Ñ entre N y O)', () => {
    const env = entornoExport({ filas: [
      { idS: 'S1', nomS: 'Zoe' }, { idS: 'S2', nomS: 'Álvaro' }, { idS: 'S4', nomS: 'Ñoño' }, { idS: 'S5', nomS: 'Nora' }, { idS: 'S6', nomS: 'Olga' },
    ] });
    exportar(env);
    expect(tablaTemporal(env).slice(1).map((f) => f[1])).toEqual(['Álvaro', 'Nora', 'Ñoño', 'Olga', 'Zoe']);
  });
  it('lee Data por cabecera: con columnas reordenadas el resultado es el mismo (RNF-02)', () => {
    const env = entornoExport({ filas: BASE });
    env.data().cargar(env.data().volcar().map((f) => [...f].reverse()));
    exportar(env);
    expect(tablaTemporal(env).slice(1)).toEqual([['S2', 'Falso, Álvaro', 50], ['S1', 'Ficticia, Zoe', 100]]);
  });
});

describe('generación del archivo', () => {
  it('crea un libro temporal con nombre repetible, hoja del periodo y cabecera congelada', () => {
    const env = entornoExport({ filas: BASE });
    exportar(env);
    const temporal = env.g.estado.libros.get(env.idTemporal);
    expect(temporal.getName()).toBe(`TEMP_VAP_EXPORT_2026_Marzo_${new Date('2026-03-15T10:00:00Z').getTime()}`);
    expect(temporal.getSheets()[0].getName()).toBe('Complementos_2026_Marzo');
    expect(temporal.getSheets()[0].getFrozenRows()).toBe(1);
  });
  it('pide a Drive el XLSX del libro temporal con el token OAuth y sin lanzar por HTTP', () => {
    const env = entornoExport({ filas: BASE });
    exportar(env);
    const [p] = env.g.estado.peticiones;
    expect(p.url).toBe(`https://www.googleapis.com/drive/v3/files/${env.idTemporal}/export?mimeType=${encodeURIComponent('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}`);
    expect(p.opciones).toEqual({ method: 'get', headers: { Authorization: 'Bearer token-falso' }, muteHttpExceptions: true });
  });
  it('guarda en la carpeta de exportación VAP_COMPLEMENTOS_<año>_<mes 2 cifras>.xlsx con el contenido recibido', () => {
    const env = entornoExport({ filas: BASE, mes: '3' });
    exportar(env);
    const [f] = env.g.estado.archivos.filter((a) => a.carpeta);
    expect(f).toMatchObject({ nombre: 'VAP_COMPLEMENTOS_2026_03.xlsx', carpeta: env.e.valor('EXPORT_FOLDER_ID') });
    expect(Buffer.from(f.contenido).toString('utf8')).toBe('XLSX-FALSO');
  });
  it('el nombre usa 12 para diciembre', () => {
    const env = entornoExport({ mes: 'Diciembre', filas: [{ idS: 'S1', mes: 12 }] });
    exportar(env);
    expect(env.g.estado.archivos.some((a) => a.nombre === 'VAP_COMPLEMENTOS_2026_12.xlsx')).toBe(true);
  });
  it('envía a la papelera el libro temporal', () => {
    const env = entornoExport({ filas: BASE });
    exportar(env);
    expect(env.g.estado.archivos.find((a) => a.id === env.idTemporal).papelera).toBe(true);
  });
  it('registra EXPORT_OK en Logs con el número de secretarias y el nombre del archivo', () => {
    const env = entornoExport({ filas: BASE });
    exportar(env);
    expect(env.logs().volcar()[1].slice(1)).toEqual(['', '', 'EXPORT_OK', 2, 'OK', 'Generado: VAP_COMPLEMENTOS_2026_03.xlsx', '']);
  });
  it('avisa al usuario con el nombre del archivo', () => {
    const env = entornoExport({ filas: BASE });
    exportar(env);
    expect(ultimaAlerta(env)).toBe('Excel generado y guardado en Drive:\nVAP_COMPLEMENTOS_2026_03.xlsx');
  });
  it('sin hoja Logs la exportación termina igualmente bien (RNF-12)', () => {
    const env = entornoExport({ filas: BASE, sinHojas: ['Logs'] });
    exportar(env);
    expect(ultimaAlerta(env)).toContain('Excel generado');
  });
  it('caracteriza: exportar dos veces el mismo periodo crea dos archivos con el mismo nombre (no sobrescribe, RNF-06)', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('2026', 'Marzo', '2026', 'Marzo') }, fetch: fetchXlsxOk });
    cargarData(env, BASE);
    registrarTemporal(env);
    exportar(env);
    registrarTemporal(env);
    exportar(env);
    expect(env.g.estado.archivos.filter((a) => a.nombre === 'VAP_COMPLEMENTOS_2026_03.xlsx')).toHaveLength(2);
  });
});

describe('fallos de la exportación', () => {
  const fallo = (codigo, contenido) => () => ({ codigo, contenido });
  it.each([[500, 'Error interno'], [403, 'Sin permiso'], [401, 'Token caducado']])('error HTTP %s → excepción con código y cuerpo, sin guardar archivo', (codigo, cuerpo) => {
    const env = entornoExport({ filas: BASE, fetch: fallo(codigo, cuerpo) });
    expect(() => exportar(env)).toThrow(`Export XLSX falló. HTTP ${codigo}: ${cuerpo}`);
    expect(env.g.estado.archivos.filter((a) => a.carpeta)).toEqual([]);
    expect(env.logs().getLastRow()).toBe(1); // no se registra EXPORT_OK
  });
  it.fails('DEFECTO · RNF-12: tras un error HTTP el libro TEMP_VAP_EXPORT queda en Drive (no se envía a la papelera)', () => {
    const env = entornoExport({ filas: BASE, fetch: fallo(500, 'x') });
    try { exportar(env); } catch (_) { /* esperado */ }
    expect(env.g.estado.archivos.find((a) => a.id === env.idTemporal).papelera).toBe(true);
  });
  it.fails('DEFECTO · el error de exportación se propaga como excepción en bruto: no se avisa con una alerta ni se deja fila de ERROR en Logs', () => {
    const env = entornoExport({ filas: BASE, fetch: fallo(500, 'x') });
    expect(() => exportar(env)).not.toThrow();
  });
  it('exportSpreadsheetToXlsx_ devuelve el archivo creado en la carpeta indicada', () => {
    const env = entornoExport();
    const carpeta = env.e.ejecutar('DriveApp.getFolderById("carpeta-x")');
    const archivo = env.e.llamar('exportSpreadsheetToXlsx_', 'id con espacio/ñ', 'salida.xlsx', carpeta);
    expect(archivo.getName()).toBe('salida.xlsx');
    expect(env.g.estado.peticiones[0].url).toContain('files/id%20con%20espacio%2F%C3%B1/export');
    expect(env.g.estado.archivos.at(-1).carpeta).toBe('carpeta-x');
  });
  it('exportSpreadsheetToXlsx_ con HTTP distinto de 200 lanza, incluso con 204 o 3xx', () => {
    for (const codigo of [204, 302, 404]) {
      const env = entornoExport({ fetch: fallo(codigo, 'x') });
      const carpeta = env.e.ejecutar('DriveApp.getFolderById("c")');
      expect(() => env.e.llamar('exportSpreadsheetToXlsx_', 'id', 'a.xlsx', carpeta)).toThrow(`HTTP ${codigo}`);
    }
  });
});

describe('vap_rellenarNombresSecretariaFaltantes · reparación de nombres en Data', () => {
  const rellenar = (env) => env.e.llamar('vap_rellenarNombresSecretariaFaltantes');
  it('sin hoja Data avisa', () => {
    const env = crearEntorno({ sinHojas: ['Data'] });
    rellenar(env);
    expect(env.g.estado.alertas).toEqual([['No existe la hoja "Data".']]);
  });
  it('Data vacía → «Data está vacía.»', () => {
    const env = crearEntorno();
    rellenar(env);
    expect(ultimaAlerta(env)).toBe('Data está vacía.');
  });
  it('sin las columnas necesarias avisa y no toca nada', () => {
    const env = crearEntorno();
    env.data().cargar([['ID_Secretaria'], ['S1']]);
    rellenar(env);
    expect(ultimaAlerta(env)).toBe('Faltan columnas ID_Secretaria o Nombre_Secretaria en Data.');
    expect(env.g.estado.escrituras).toEqual([]);
  });
  it('rellena solo los nombres vacíos con coincidencia por ID y cuenta los que no casan', () => {
    const env = crearEntorno();
    cargarData(env, [
      { idS: 'S1', nomS: '' }, { idS: 'S2', nomS: '   ' }, { idS: 'S4', nomS: 'Nombre Ya Escrito' }, { idS: 'S9', nomS: '' },
      { idS: '', nomS: '' }, { idS: 'S9', nomS: '' }, { idS: 'S8', nomS: '' },
    ]);
    rellenar(env);
    const nombres = env.data().volcar().slice(1).map((f) => f[10]);
    expect(nombres).toEqual(['Ficticia, Zoe', 'Falso, Álvaro', 'Nombre Ya Escrito', '', '', '', '']);
    expect(ultimaAlerta(env)).toBe('Filas actualizadas: 2\nFilas sin match en BBDD: 3\n\nIDs sin match:\nS9, S8');
  });
  it('sin pendientes no lista IDs', () => {
    const env = crearEntorno();
    cargarData(env, [{ idS: 'S1', nomS: 'Zoe' }]);
    rellenar(env);
    expect(ultimaAlerta(env)).toBe('Filas actualizadas: 0\nFilas sin match en BBDD: 0');
  });
  it('una secretaria sin nombre en la BBDD no sirve de coincidencia', () => {
    const env = crearEntorno();
    cargarData(env, [{ idS: 'S5', nomS: '' }]);
    rellenar(env);
    expect(ultimaAlerta(env)).toContain('Filas sin match en BBDD: 1');
  });
  it('si falta la hoja de secretarias de la BBDD falla con mensaje claro', () => {
    const env = crearEntorno({ sinHojas: ['VAP_Secretarias'] });
    cargarData(env, [{ idS: 'S1', nomS: '' }]);
    expect(() => rellenar(env)).toThrow('Hoja no encontrada en BBDD.');
  });
  it.fails('DEFECTO · RNF-07: escribe celda a celda (una escritura por fila) en lugar de en bloque', () => {
    const env = crearEntorno();
    cargarData(env, [{ idS: 'S1', nomS: '' }, { idS: 'S2', nomS: '' }, { idS: 'S4', nomS: '' }]);
    rellenar(env);
    expect(env.g.estado.escrituras.length).toBeLessThanOrEqual(1);
  });
});

describe('el DNI de cada secretaria · lista, envío, Excel y datos antiguos', () => {
  const SECRETARIAS = [
    ['id_trabajador', 'Nombre_Secretaria', 'Alta', 'DNI'],
    ['S1', 'Buena, Ana', true, ' 1111-1111h '],
    ['S2', 'Sin Dni, Beto', true, ''],
    ['S3', 'Largo Dni, Carla', true, '050986557L'],
    ['S4', 'Sin Coma Dora', true, '44444444A'],
  ];
  const montar = () =>
    crearEntorno({ bbdd: { VAP_Secretarias: SECRETARIAS }, respuestas: { prompt: colaPrompt('2026', 'Marzo') }, fetch: fetchXlsxOk });

  it('el portal ofrece solo a quien tiene id, DNI válido y «APELLIDOS, NOMBRE», y no envía el DNI al navegador', () => {
    const env = montar();
    const r = env.llamar('vap_bootstrapForEmail', 'ana@gala.test');
    expect(r.secretarias).toEqual([{ id: 'S1', nombre: 'Buena, Ana' }]);
    expect(JSON.stringify(r)).not.toContain('11111111H');
    const registro = JSON.stringify(env.g.estado.logs);
    expect(registro).toContain('(S3): DNI con forma no válida');
    expect(registro).not.toContain('Largo Dni');
  });

  it('el Excel lleva el DNI al final: el guardado en Data o, en filas antiguas, el del maestro por id', () => {
    const env = montar();
    cargarData(env, [
      { idS: 'S1', nomS: 'Buena, Ana', valor: 10, dni: '' },
      { idS: 'S9', nomS: 'Otra, Persona', valor: 5, dni: '99999999R' },
      { idS: 'S8', nomS: 'Sin, Dni', valor: 1, dni: '' },
    ]);
    env.idTemporal = registrarTemporal(env);
    env.e.llamar('vap_generarExcelMensual');
    const [cabecera, ...filas] = tablaConDni(env);
    expect(cabecera.at(-1)).toBe('DNI');
    expect(Object.fromEntries(filas.map((f) => [f[0], f.at(-1)]))).toEqual({ S1: '11111111H', S9: '99999999R', S8: '' });
  });

  it('simular el relleno no escribe; rellenar completa solo las filas sin DNI cuyo id se conoce', () => {
    const env = montar();
    cargarData(env, [
      { idS: 'S1', dni: '' },
      { idS: 'S8', dni: '' },
      { idS: 'S1', dni: '99999999R' },
    ]);
    const antes = JSON.stringify(env.data().volcar());
    expect(env.llamar('simularRellenoDniData')).toEqual({ filas: 3, porRellenar: 1, idsSinDni: ['S8'], escrito: false });
    expect(JSON.stringify(env.data().volcar())).toBe(antes);
    expect(env.llamar('rellenarDniData')).toMatchObject({ porRellenar: 1, escrito: true });
    expect(env.data().volcar().slice(1).map((f) => f.at(-1))).toEqual(['11111111H', '', '99999999R']);
  });

  it('si Data no tiene la columna DNI_Secretaria, el primer envío la crea al final', () => {
    const env = montar();
    env.data().cargar([CAB_DATA.slice(0, -1)]);
    env.llamar('vap_submitBatch', envio({ valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Buena, Ana', valorStr: '10' }] }));
    const [cabecera, fila] = env.data().volcar();
    expect(cabecera.at(-1)).toBe('DNI_Secretaria');
    expect(fila.at(-1)).toBe('11111111H');
  });
});
