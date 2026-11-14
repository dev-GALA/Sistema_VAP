// Unitarias · interpretación de importes y ayudas de tablas (RF-60 · RF-61 · RNF-08 · RNF-02).
import { describe, expect, it } from 'vitest';
import { CAB_DATA, crearEntorno, plano } from './ayudas.js';

const llamar = (nombre, ...args) => plano(crearEntorno().e.llamar(nombre, ...args));

describe('parseNumber_ · RNF-08 · importes con coma o punto decimal', () => {
  it.each([
    ['100', 100], ['0', 0], ['-5', -5], ['100,5', 100.5], ['100.5', 100.5], ['0,05', 0.05],
    ['1.234,56', 1234.56], ['1,234.56', 1234.56], ['  12 ', 12], ['1 234,5', 1234.5], ['1.234.567,89', 1234567.89],
    [5, 5], [0, 0],
  ])('«%s» → %s', (entrada, esperado) => {
    expect(llamar('parseNumber_', entrada)).toBe(esperado);
  });
  it.each([[''], ['   '], [null], [undefined], ['abc'], ['12abc'], ['1.2.3'], ['1,2,3'], ['€100'], ['--5'], ['1,2.3,4']])(
    '«%s» no es un importe → null (se anotará como incidencia, RF-60)', (entrada) => {
      expect(llamar('parseNumber_', entrada)).toBeNull();
    },
  );
  it('caracteriza: acepta negativos (no hay regla que los rechace)', () => {
    expect(llamar('parseNumber_', '-100,25')).toBe(-100.25);
  });
  it.fails('DEFECTO · RNF-08: «1.234» (miles en es-ES) se lee como 1,234 en lugar de 1234', () => {
    expect(llamar('parseNumber_', '1.234')).toBe(1234);
  });
  it.fails('DEFECTO · RF-60: «Infinity» se acepta como importe válido; debería registrarse como incidencia', () => {
    expect(crearEntorno().e.llamar('parseNumber_', 'Infinity')).toBeNull(); // sin plano(): JSON convertiría Infinity en null
  });
  it.fails('DEFECTO · RF-60: notación hexadecimal «0x10» se acepta como 16', () => {
    expect(llamar('parseNumber_', '0x10')).toBeNull();
  });
  it.fails('DEFECTO · RF-60: notación científica «1e3» se acepta como 1000', () => {
    expect(llamar('parseNumber_', '1e3')).toBeNull();
  });
});

describe('truthy_ · interpretación de las marcas Activo/Activa/Alta de la BBDD', () => {
  it.each([[true], ['true'], ['TRUE'], [' 1 '], [1], ['yes'], ['Si'], ['sí'], ['SÍ'], ['  si  ']])('«%s» es verdadero', (v) => {
    expect(llamar('truthy_', v)).toBe(true);
  });
  it.each([[false], [0], [''], [null], [undefined], ['no'], ['false'], ['x'], [2], ['0']])('«%s» es falso', (v) => {
    expect(llamar('truthy_', v)).toBe(false);
  });
});

describe('indexMap_ · RNF-02 · localizar por nombre de cabecera', () => {
  it('asigna cada nombre a su posición, recortando espacios', () => {
    expect(llamar('indexMap_', [' Año ', 'Mes', 'Valor'])).toEqual({ Año: 0, Mes: 1, Valor: 2 });
  });
  it('ignora cabeceras vacías', () => {
    expect(llamar('indexMap_', ['A', '', null, 'B'])).toEqual({ A: 0, B: 3 });
  });
  it('si un nombre se repite, gana la última columna', () => {
    expect(llamar('indexMap_', ['A', 'B', 'A'])).toEqual({ A: 2, B: 1 });
  });
  it('cabecera vacía → mapa vacío', () => {
    expect(llamar('indexMap_', [])).toEqual({});
  });
});

describe('normalizeConcept_ · orden preferido del Excel', () => {
  it.each([
    ['Aptos', 'APTOS'], ['apto individual', 'APTOS'], ['Financiaciones', 'FINANCIACIONES'], ['Financiación', 'FINANCIACIONES'],
    ['Reseñas', 'RESEÑAS'], ['Resenas', 'RESEÑAS'], ['Sábados 50', 'SABADOS_50'], ['sabados 60', 'SABADOS_60'],
    ['Sábados 50 y 60', 'SABADOS_50'], ['Horas puntos', 'HORAS_PUNTOS'], ['Puntos', 'HORAS_PUNTOS'],
  ])('«%s» → %s', (entrada, esperado) => {
    expect(llamar('normalizeConcept_', entrada)).toBe(esperado);
  });
  it('un concepto desconocido se convierte en MAYÚSCULAS_CON_GUION_BAJO sin símbolos', () => {
    expect(llamar('normalizeConcept_', 'Zeta Extra')).toBe('ZETA_EXTRA');
    expect(llamar('normalizeConcept_', 'a-b/c d')).toBe('ABC_D');
    expect(llamar('normalizeConcept_', 'Año extra')).toBe('AÑO_EXTRA');
  });
  it('«Sábados» sin importe no cae en SABADOS_50 ni en SABADOS_60', () => {
    expect(llamar('normalizeConcept_', 'Sábados')).toBe('SÁBADOS');
  });
  it('vacío, null y undefined → cadena vacía', () => {
    expect(llamar('normalizeConcept_', '')).toBe('');
    expect(llamar('normalizeConcept_', null)).toBe('');
    expect(llamar('normalizeConcept_', undefined)).toBe('');
  });
});

describe('buildRowByHeaders_', () => {
  it('coloca cada valor bajo su cabecera, sea cual sea el orden de columnas (RNF-02)', () => {
    expect(llamar('buildRowByHeaders_', ['B', 'A', 'C'], { A: 1, B: 2, C: 3 })).toEqual([2, 1, 3]);
  });
  it('las cabeceras sin dato quedan vacías y los datos sin cabecera se ignoran', () => {
    expect(llamar('buildRowByHeaders_', ['A', 'Z'], { A: 1, Q: 9 })).toEqual([1, '']);
  });
  it('conserva el 0, el vacío y false como valores propios', () => {
    expect(llamar('buildRowByHeaders_', ['A', 'B', 'C'], { A: 0, B: '', C: false })).toEqual([0, '', false]);
  });
});

describe('readTable_ y getHeaders_ sobre hojas', () => {
  it('readTable_ rechaza una hoja inexistente con un mensaje claro', () => {
    const env = crearEntorno();
    expect(() => env.e.llamar('readTable_', null)).toThrow('Hoja no encontrada en BBDD.');
  });
  it('readTable_ con solo cabecera o sin filas devuelve lista vacía', () => {
    const env = crearEntorno();
    expect(plano(env.e.llamar('readTable_', env.libroBbdd.conHoja('Solo', [['A', 'B']])))).toEqual([]);
    expect(plano(env.e.llamar('readTable_', env.libroBbdd.conHoja('Nada', [])))).toEqual([]);
  });
  it('readTable_ recorta cabeceras, omite filas totalmente vacías y rellena con vacío lo que falta', () => {
    const env = crearEntorno();
    const hoja = env.libroBbdd.conHoja('T', [[' A ', 'B', 'C'], [1, 2, 3], ['', '', ''], [null, null, null], [4, 5]]);
    expect(plano(env.e.llamar('readTable_', hoja))).toEqual([{ A: 1, B: 2, C: 3 }, { A: 4, B: 5, C: '' }]);
  });
  it('getHeaders_ lee la fila 1 recortada', () => {
    const env = crearEntorno();
    expect(plano(env.e.llamar('getHeaders_', env.libroDatos.conHoja('H', [[' X ', 'Y']])))).toEqual(['X', 'Y']);
    expect(plano(env.e.llamar('getHeaders_', env.data()))).toEqual(CAB_DATA);
  });
  it('getHeaders_ de una hoja vacía no revienta: devuelve ninguna cabecera', () => {
    const env = crearEntorno();
    expect(plano(env.e.llamar('getHeaders_', env.libroDatos.insertSheet('Vacia')))).toEqual([]);
  });
});

describe('include_ y log_', () => {
  it('include_ devuelve el contenido de otro archivo HTML', () => {
    const env = crearEntorno({ plantillas: true });
    expect(env.e.llamar('include_', 'Portal')).toContain('Complementos Salariales Secretarias');
  });
  it('include_ de un archivo inexistente falla con su nombre', () => {
    expect(() => crearEntorno().e.llamar('include_', 'NoExiste')).toThrow(/NoExiste/);
  });
  it('log_ añade una fila posicional [hora, "", "", acción, n, resultado, mensaje, ""]', () => {
    const env = crearEntorno();
    env.e.llamar('log_', env.libroDatos, { action: 'EXPORT_OK', n: 3, result: 'OK', message: 'hecho' });
    const fila = env.logs().volcar()[1];
    expect(fila.slice(1)).toEqual(['', '', 'EXPORT_OK', 3, 'OK', 'hecho', '']);
    expect(fila[0].toISOString()).toBe('2026-03-15T10:00:00.000Z');
  });
  it('log_ rellena con 0 y vacío lo que no se informa', () => {
    const env = crearEntorno();
    env.e.llamar('log_', env.libroDatos, { action: 'X' });
    expect(env.logs().volcar()[1].slice(3)).toEqual(['X', 0, '', '', '']);
  });
  it('log_ no hace nada si no existe la hoja Logs (no rompe la exportación)', () => {
    const env = crearEntorno({ sinHojas: ['Logs'] });
    expect(() => env.e.llamar('log_', env.libroDatos, { action: 'X' })).not.toThrow();
  });
});
