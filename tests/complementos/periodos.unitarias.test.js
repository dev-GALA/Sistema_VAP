// Unitarias · fechas, meses y periodos (RNF-03 · ADR-0005: todo se identifica por mes + año).
import { describe, expect, it } from 'vitest';
import { crearEntorno, plano } from './ayudas.js';

const llamar = (nombre, ...args) => {
  const env = crearEntorno();
  return plano(env.e.llamar(nombre, ...args));
};

describe('normalizeMonth_ · RNF-03 · acepta nombre o número y devuelve el nombre canónico', () => {
  it.each([
    ['1', 'Enero'], ['03', 'Marzo'], ['12', 'Diciembre'], [' 7 ', 'Julio'], [9, 'Septiembre'],
    ['enero', 'Enero'], ['MARZO', 'Marzo'], ['  abril ', 'Abril'], ['Diciembre', 'Diciembre'],
  ])('«%s» → %s', (entrada, esperado) => {
    expect(llamar('normalizeMonth_', entrada)).toBe(esperado);
  });
  it('acepta la variante «setiembre»', () => {
    expect(llamar('normalizeMonth_', 'setiembre')).toBe('Septiembre');
  });
  it.each([[''], [null], [undefined], ['0'], ['13'], ['-1'], ['xyz'], ['Sept'], ['marzoo']])('«%s» no es un mes → null', (entrada) => {
    expect(llamar('normalizeMonth_', entrada)).toBeNull();
  });
  it('caracteriza: un texto que EMPIEZA por un número válido («5abc») se lee como ese mes (parseInt laxo)', () => {
    expect(llamar('normalizeMonth_', '5abc')).toBe('Mayo');
  });
});

describe('numToMonth_ / monthToNum_', () => {
  it('numToMonth_ da los doce nombres en orden', () => {
    const env = crearEntorno();
    const nombres = Array.from({ length: 12 }, (_, i) => env.e.llamar('numToMonth_', i + 1));
    expect(nombres).toEqual(['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']);
  });
  it('numToMonth_ fuera de rango devuelve undefined', () => {
    expect(llamar('numToMonth_', 0)).toBeNull(); // plano(undefined) → null
    expect(llamar('numToMonth_', 13)).toBeNull();
  });
  it('monthToNum_ devuelve el número con dos cifras (se usa en el nombre del XLSX)', () => {
    expect(llamar('monthToNum_', 'Enero')).toBe('01');
    expect(llamar('monthToNum_', 'Marzo')).toBe('03');
    expect(llamar('monthToNum_', 'Diciembre')).toBe('12');
  });
  it('monthToNum_ exige el nombre canónico: en minúsculas o desconocido devuelve «00»', () => {
    expect(llamar('monthToNum_', 'marzo')).toBe('00');
    expect(llamar('monthToNum_', 'xx')).toBe('00');
    expect(llamar('monthToNum_', undefined)).toBe('00');
  });
});

describe('monthToNumSafe_ · acepta «Febrero», «2» y «02» (celdas de Data escritas a mano o por la webapp)', () => {
  it.each([['Febrero', 2], ['2', 2], ['02', 2], [2, 2], ['diciembre', 12], ['12', 12], ['Setiembre', 9], [7, 7]])('«%s» → %s', (e, n) => {
    expect(llamar('monthToNumSafe_', e)).toBe(n);
  });
  it.each([[''], [null], [undefined], ['xx'], ['13'], ['0'], [0], [13], ['2026-03']])('«%s» → 0', (e) => {
    expect(llamar('monthToNumSafe_', e)).toBe(0);
  });
});

describe('sameMonth_', () => {
  it('compara tras normalizar: número, nombre y mayúsculas son el mismo mes', () => {
    const env = crearEntorno();
    expect(env.e.llamar('sameMonth_', '3', 'Marzo')).toBe(true);
    expect(env.e.llamar('sameMonth_', 'marzo', 'Marzo')).toBe(true);
    expect(env.e.llamar('sameMonth_', 'Abril', 'Marzo')).toBe(false);
  });
  it('un mes ilegible nunca coincide, ni siquiera con otro ilegible', () => {
    const env = crearEntorno();
    expect(env.e.llamar('sameMonth_', 'xx', 'Marzo')).toBe(false);
    expect(env.e.llamar('sameMonth_', '', '')).toBe(false);
  });
});

describe('vap_getUiDefaults_ · año y mes por defecto en huso Europe/Madrid', () => {
  it('toma el mes de «ahora»', () => {
    const env = crearEntorno({ ahora: '2026-03-15T10:00:00Z' });
    expect(env.llamar('vap_getUiDefaults_')).toEqual({ year: 2026, month: 3 });
  });
  it('en la medianoche del 31-dic UTC ya es 1-ene en Madrid: cambia de año', () => {
    const env = crearEntorno({ ahora: '2026-12-31T23:30:00Z' });
    expect(env.llamar('vap_getUiDefaults_')).toEqual({ year: 2027, month: 1 });
  });
  it('en verano (UTC+2) el último día del mes a las 22:30 UTC ya es el mes siguiente', () => {
    const env = crearEntorno({ ahora: '2026-06-30T22:30:00Z' });
    expect(env.llamar('vap_getUiDefaults_')).toEqual({ year: 2026, month: 7 });
  });
  it('el huso del script es Europe/Madrid', () => {
    expect(crearEntorno().e.valor('TZ')).toBe('Europe/Madrid');
  });
});

describe('parseTimestamp_', () => {
  it('devuelve tal cual una fecha de la hoja', () => {
    const env = crearEntorno();
    const d = env.fecha('2026-03-10T09:00:00Z');
    expect(env.e.llamar('parseTimestamp_', d)).toBe(d);
  });
  it('interpreta un texto ISO', () => {
    const env = crearEntorno();
    expect(env.e.llamar('parseTimestamp_', '2026-03-10T09:00:00Z').toISOString()).toBe('2026-03-10T09:00:00.000Z');
  });
  it.each([[''], ['   '], [null], [undefined], ['no es fecha'], ['2026-13-45']])('«%s» no es fecha → null', (e) => {
    expect(llamar('parseTimestamp_', e)).toBeNull();
  });
});

describe('generateBatchId_ · identidad de un envío BATCH_<yyyyMMdd_HHmmss>_<rnd>', () => {
  it('usa la hora de Madrid y un sufijo de 4 cifras', () => {
    const env = crearEntorno({ ahora: '2026-03-15T10:00:00Z', azar: 0 });
    expect(env.llamar('generateBatchId_')).toBe('BATCH_20260315_110000_1000');
  });
  it('el sufijo aleatorio abarca 1000..9999', () => {
    const alto = crearEntorno({ azar: 0.9999999 });
    expect(alto.llamar('generateBatchId_')).toMatch(/_9999$/);
    const medio = crearEntorno({ azar: 0.5 });
    expect(medio.llamar('generateBatchId_')).toMatch(/_5500$/);
  });
  it('tiene siempre el mismo formato', () => {
    const env = crearEntorno({ azar: 0.123 });
    expect(env.llamar('generateBatchId_')).toMatch(/^BATCH_\d{8}_\d{6}_\d{4}$/);
  });
});
