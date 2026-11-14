// Unitarias de VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.gs: funciones puras y de menú.
// RF-20 (acumulación campo a campo) · RF-16 (periodo) · RF-48 (error con solución) · ADR-0009 · ADR-0014 · SSD §7.4.
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { COL_DESTINO_PRIMERA, N_CAMPOS, entornoActividad } from './ayudas.js';

const e = entornoActividad();
const f = (nombre, ...args) => e.llamar(nombre, ...args);

describe('constantes y COLUMN_MAP (SSD §7.4: F..BQ → AC..CN)', () => {
  it('genera 64 pares correlativos, de F(6)→AC(29) a BQ(69)→CN(92)', () => {
    const mapa = plano(e.valor('COLUMN_MAP'));
    expect(mapa).toHaveLength(N_CAMPOS);
    expect(mapa[0]).toStrictEqual({ src: 6, dst: 29 });
    expect(mapa[63]).toStrictEqual({ src: 69, dst: 92 });
    mapa.forEach((m) => expect(m.dst - m.src).toBe(COL_DESTINO_PRIMERA - 6));
  });
  it('cubre la columna del nombre, mes, sucursal y marca temporal tal como documenta el SSD', () => {
    expect([e.valor('SRC_TIMESTAMP_COL'), e.valor('SRC_MONTH_COL'), e.valor('SRC_SUCURSAL_COL'), e.valor('SOURCE_NAME_COL'), e.valor('TARGET_NAME_COL')]).toStrictEqual([1, 3, 4, 5, 3]);
  });
  it('los meses son 12, en mayúsculas y en orden natural', () => {
    const meses = plano(e.valor('MESES'));
    expect(meses).toHaveLength(12);
    expect(meses[0]).toBe('ENERO');
    expect(meses[8]).toBe('SEPTIEMBRE');
    expect(meses[11]).toBe('DICIEMBRE');
  });
  it('la copia al histórico está activada y las cabeceras del log son las del SSD', () => {
    expect(e.valor('COPIAR_A_HISTORICO')).toBe(true);
    expect(plano(e.valor('LOG_HEADERS'))).toStrictEqual(['Timestamp', 'Run ID', 'Usuario', 'Periodo', 'Categoría', 'Tipo', 'Fila origen', 'Profesor', 'Detalle']);
  });
});

describe('normalizeKey (clave de cruce por nombre · SSD §7.4)', () => {
  it.each([
    ['  José   PÉREZ  ', 'jose perez'],
    ['Ñandú Ficticio', 'nandu ficticio'],
    ['ANA\tBETA\nFICTICIA', 'ana beta ficticia'],
    ['', ''], [null, ''], [undefined, ''], [42, '42'],
  ])('%j → %j', (entrada, esperado) => expect(f('normalizeKey', entrada)).toBe(esperado));
  it('nombres con tildes y sin ellas dan la misma clave', () => {
    expect(f('normalizeKey', 'Álvaro Núñez')).toBe(f('normalizeKey', 'alvaro nunez'));
  });
});

describe('isEmpty · RF-20 (el 0 es dato)', () => {
  it.each([[null], [undefined], [''], ['   '], ['\t\n']])('%j es vacío', (v) => expect(f('isEmpty', v)).toBe(true));
  it.each([[0], ['0'], [1], [-1], [' x '], [false], [true], [0.0]])('%j es dato', (v) => expect(f('isEmpty', v)).toBe(false));
  it('una fecha es dato', () => expect(f('isEmpty', new Date('2026-03-10'))).toBe(false));
});

describe('normalizarMes_', () => {
  it.each([
    ['MARZO', 'MARZO'], ['marzo', 'MARZO'], ['  Marzo ', 'MARZO'], ['Septiembre', 'SEPTIEMBRE'],
    ['3', 'MARZO'], ['03', 'MARZO'], ['12', 'DICIEMBRE'], ['1', 'ENERO'], [3, 'MARZO'],
    ['SETIEMBRE', 'SEPTIEMBRE'], ['Setiembre', 'SEPTIEMBRE'], ['sep', 'SEPTIEMBRE'],
    ['ene', 'ENERO'], ['Dic', 'DICIEMBRE'], ['mar', 'MARZO'], ['may', 'MAYO'], ['AGO', 'AGOSTO'],
    ['MARZO 2026', 'MARZO'],
  ])('%j → %j', (entrada, esperado) => expect(f('normalizarMes_', entrada)).toBe(esperado));
  it.each([[''], ['   '], [null], [undefined], ['0'], ['13'], ['00'], ['xx'], ['ma'], ['3abc'], ['ju'], ['Pepe'], ['-1']])('%j no es un mes', (entrada) => {
    expect(f('normalizarMes_', entrada)).toBeNull();
  });
  it('«JUN» y «JUL» se distinguen por sus tres primeras letras', () => {
    expect(f('normalizarMes_', 'jun')).toBe('JUNIO');
    expect(f('normalizarMes_', 'jul')).toBe('JULIO');
  });
  it('comportamiento actual: basta el prefijo de tres letras, así «Mayo-Junio» se lee como MAYO (laxo)', () => {
    expect(f('normalizarMes_', 'Mayo-Junio')).toBe('MAYO');
  });
  it('quita tildes antes de comparar', () => {
    expect(f('normalizarMes_', 'MÁRZO')).toBe('MARZO');
  });
});

describe('toDate_', () => {
  it('devuelve la misma fecha si ya es una fecha válida', () => {
    const d = new Date('2026-03-10T12:00:00Z');
    expect(f('toDate_', d).getTime()).toBe(d.getTime());
  });
  it('interpreta una cadena ISO', () => {
    expect(f('toDate_', '2026-03-10T12:00:00Z').toISOString()).toBe('2026-03-10T12:00:00.000Z');
  });
  it.each([[''], [null], [undefined]])('%j → null', (v) => expect(f('toDate_', v)).toBeNull());
  it.each([['no es fecha'], [new Date('x')]])('fecha inválida %j → null', (v) => expect(f('toDate_', v)).toBeNull());
});

describe('formatearFecha_', () => {
  it('formatea dd/MM/yyyy en la zona horaria del script', () => {
    expect(f('formatearFecha_', new Date('2026-03-10T23:30:00Z'))).toBe('11/03/2026');
  });
  it('depende de la zona del script, no de la del proceso', () => {
    const otra = entornoActividad();
    otra.google.global.Session.getScriptTimeZone = () => 'UTC';
    expect(otra.llamar('formatearFecha_', new Date('2026-03-10T23:30:00Z'))).toBe('10/03/2026');
  });
});

describe('mostrar_', () => {
  it.each([['', '(vacío)'], [null, '(vacío)'], [undefined, '(vacío)'], [0, 0], ['a', 'a'], [5, 5]])('%j → %j', (v, esperado) => expect(f('mostrar_', v)).toBe(esperado));
});

describe('esNumericoOVacio_ · RF-60', () => {
  it.each([[''], [null], [undefined], [0], [12.5], ['12'], ['12.5'], ['12,5'], ['  7 '], ['€ 12'], ['12€'], ['-3'], ['   '], ['1 000']])('%j se acepta', (v) => expect(f('esNumericoOVacio_', v)).toBe(true));
  it.each([['abc'], ['12abc'], ['1.234,5'], [NaN], [Infinity], [true], ['x1']])('%j se rechaza', (v) => expect(f('esNumericoOVacio_', v)).toBe(false));
});

describe('valoresIguales_ · RF-22 (solo se escribe lo que cambia)', () => {
  it.each([
    [1, 1], ['1', 1], [1, '1.0'], ['a', ' a '], ['', null], [null, undefined], ['', ''], [0, '0'], ['0', 0],
  ])('%j == %j', (a, b) => expect(f('valoresIguales_', a, b)).toBe(true));
  it.each([
    [1, 2], ['a', 'b'], [0, ''], ['', 0], [null, 0], ['1,5', 1.5], ['x', 1], [5, null],
  ])('%j != %j', (a, b) => expect(f('valoresIguales_', a, b)).toBe(false));
});

describe('nombreColumna_', () => {
  it('devuelve la cabecera recortada', () => expect(f('nombreColumna_', ['A', ' HORAS '], 2)).toBe('HORAS'));
  it.each([[[]], [['a', '']], [['a', null]], [['a', '   ']], [null], [undefined]])('sin cabecera utilizable %j → «col N»', (cab) => {
    expect(f('nombreColumna_', cab, 2)).toBe('col 2');
  });
  it('convierte cabeceras no textuales', () => expect(f('nombreColumna_', [7], 1)).toBe('7'));
});

describe('clasificarError_ · RF-48 (causa y posible solución)', () => {
  it.each([
    ['No existe la pestaña destino: "Hoja 1".', 'PESTANA_NO_ENCONTRADA', /SOURCE_SHEET_NAME/],
    ['Sin permisos para acceder', 'ACCESO_AL_DESTINO', /Editor/],
    ['Access denied', 'ACCESO_AL_DESTINO', /Editor/],
    ['Requested entity was not found', 'ACCESO_AL_DESTINO', /Editor/],
    ['Could not obtain lock', 'BLOQUEO', /Otra ejecución/],
    ['Se agotó el tiempo de espera del bloqueo.', 'BLOQUEO', /Otra ejecución/],
    ['Exceeded maximum execution time', 'TIEMPO_EXCEDIDO', /Vuelca por partes/],
    ['Se superó el tiempo de ejecución', 'TIEMPO_EXCEDIDO', /Vuelca por partes/],
    ['algo raro', 'NO_CLASIFICADO', /Ejecuciones/],
  ])('«%s» → %s', (mensaje, tipo, solucion) => {
    const r = plano(f('clasificarError_', new Error(mensaje)));
    expect(r.tipo).toBe(tipo);
    expect(r.solucion).toMatch(solucion);
  });
  it('acepta un error que es una cadena o un valor sin message', () => {
    expect(plano(f('clasificarError_', 'Access denied')).tipo).toBe('ACCESO_AL_DESTINO');
    expect(plano(f('clasificarError_', undefined)).tipo).toBe('NO_CLASIFICADO');
    expect(plano(f('clasificarError_', null)).tipo).toBe('NO_CLASIFICADO');
  });
  it('«no existe la pestaña» tiene prioridad sobre «not found»', () => {
    expect(plano(f('clasificarError_', new Error('No existe la pestaña X (not found)'))).tipo).toBe('PESTANA_NO_ENCONTRADA');
  });
});

describe('vapPeriodoPropuesto · RF-16 (mes en curso preseleccionado)', () => {
  it('propone el mes y año de la fecha de ejecución y los 12 meses', () => {
    const r = plano(entornoActividad({ ahora: '2026-03-15T10:00:00Z' }).llamar('vapPeriodoPropuesto'));
    expect(r.mes).toBe('MARZO');
    expect(r.anio).toBe(2026);
    expect(r.hoy).toBe('15/03/2026');
    expect(r.meses).toHaveLength(12);
  });
  it.each([['2026-01-15T12:00:00Z', 'ENERO', 2026], ['2026-12-15T12:00:00Z', 'DICIEMBRE', 2026], ['2027-07-15T12:00:00Z', 'JULIO', 2027]])('%s → %s %i', (ahora, mes, anio) => {
    const r = plano(entornoActividad({ ahora }).llamar('vapPeriodoPropuesto'));
    expect([r.mes, r.anio]).toStrictEqual([mes, anio]);
  });
});

describe('onOpen y abrirDialogoVolcado · SSD §7.4 flujo paso 1', () => {
  it('onOpen crea el menú «VAP_Acciones» con la opción «Volcar Actividad del mes...»', () => {
    const x = entornoActividad();
    x.llamar('onOpen');
    expect(plano(x.google.estado.menus)).toStrictEqual([{ nombre: 'VAP_Acciones', items: [{ texto: 'Volcar Actividad del mes...', funcion: 'abrirDialogoVolcado' }] }]);
  });
  it('abrirDialogoVolcado muestra la plantilla «DialogoVolcado» de 560x580 con su título', () => {
    const x = entornoActividad({ plantillasHtml: { DialogoVolcado: '<p>hola</p>' } });
    x.llamar('abrirDialogoVolcado');
    const [d] = x.google.estado.dialogos;
    expect(d.titulo).toBe('Volcar Actividad de Profesores');
    expect(d.salida.getContent()).toBe('<p>hola</p>');
    expect([d.salida._ancho, d.salida._alto]).toStrictEqual([560, 580]);
  });
  it('abrirDialogoVolcado falla si la plantilla no existe en el proyecto (nombre distinto de «DialogoVolcado»)', () => {
    const x = entornoActividad({ plantillasHtml: { OtroNombre: '' } });
    expect(() => x.llamar('abrirDialogoVolcado')).toThrow(/DialogoVolcado/);
    expect(x.google.estado.dialogos).toHaveLength(0);
  });
});
