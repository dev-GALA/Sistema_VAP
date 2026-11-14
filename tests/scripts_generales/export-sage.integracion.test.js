// Pruebas de INTEGRACIÓN de VAP_script_export_SAGE.gs: volcarVinculacion_ contra libros en memoria.
// Datos 100% ficticios. Referencias: RF-12 · RF-13 · RF-22 · RNF-02 · RNF-04 · RNF-07 · RNF-08 · RNF-15 · ADR-0010/0011/0012.
import { describe, expect, it } from 'vitest';
import { CAB_DESTINO, CAB_ORIGEN, entornoExport, filaDestino, filaOrigen, plano, volcado } from './ayudas.js';

const RUN = 'run-test';
const volcar = (ent, id = ent.idNeto, log = 'LOG NETOS', etiqueta = 'NETO') => ent.e.llamar('volcarVinculacion_', id, log, etiqueta, RUN);
const logDetalle = (ent, libro = ent.neto.libro, nombre = 'LOG NETOS') => volcado(libro.getSheetByName(nombre)).slice(1);
const TS = '2026-03-15T10:00:00.000Z';
const destinoBasico = () => [CAB_DESTINO, filaDestino('GALA', '101'), filaDestino('GALA', '102')];
const escrituraDestino = (ent) => ent.google.estado.escrituras.filter((w) => w.hoja === 'Hoja 1');

describe('errores de estructura (RF-48 · RNF-02 · RNF-15)', () => {
  it('lanza si falta la pestaña origen', () => {
    const ent = entornoExport({ origen: null });
    expect(() => volcar(ent)).toThrow('No existe la pestaña origen: "bbdd_export_sage_laboral".');
  });
  it('lanza si el libro destino no existe o no hay acceso', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 1 })], sinLibroNeto: true });
    expect(() => volcar(ent)).toThrow(/no existe o no hay acceso/);
  });
  it('lanza si falta la pestaña "Hoja 1" en el destino, citando el ID del libro', () => {
    const ent = entornoExport({ destino: null });
    expect(() => volcar(ent, ent.idBruto)).toThrow(`No existe la pestaña destino "Hoja 1" en el libro ${ent.idBruto}.`);
  });
  it('lanza si falta la cabecera de la empresa en el origen', () => {
    const cab = CAB_ORIGEN.map((c) => (c === 'Empresa' ? 'Sociedad' : c));
    const ent = entornoExport({ origen: [cab, filaOrigen('GALA', '1', { irpf: 1 })] });
    expect(() => volcar(ent)).toThrow('No encuentro cabeceras de clave en origen: "Empresa" y "Codigo_Empleado".');
  });
  it('lanza si falta la cabecera del número de empleado', () => {
    const cab = CAB_ORIGEN.map((c) => (c === 'Codigo_Empleado' ? 'Codigo' : c));
    const ent = entornoExport({ origen: [cab, filaOrigen('GALA', '1', { irpf: 1 })] });
    expect(() => volcar(ent)).toThrow(/No encuentro cabeceras de clave/);
  });
  it('lanza listando TODAS las cabeceras de datos que faltan', () => {
    const cab = CAB_ORIGEN.filter((c) => c !== 'IRPF' && c !== 'SS_EMP');
    const ent = entornoExport({ origen: [cab, ['GALA', '1', 1, 1, 1, 1, 1, 1]] });
    expect(() => volcar(ent)).toThrow('No encuentro estas cabeceras de datos en el origen: SS_EMP, IRPF.');
  });
  it('un error de estructura no escribe nada en el destino ni en su LOG', () => {
    const cab = CAB_ORIGEN.filter((c) => c !== 'IRPF');
    const ent = entornoExport({ origen: [cab, ['GALA', '101', 1, 1, 1, 1, 1, 1, 1]], destino: destinoBasico() });
    expect(() => volcar(ent)).toThrow();
    expect(ent.neto.hoja.volcar()).toStrictEqual(destinoBasico());
    expect(plano(ent.neto.libro.getSheetByName('LOG NETOS').volcar())).toStrictEqual([plano(ent.e.valor('VINC_LOG_HEADERS'))]);
  });
  it.fails('DEFECTO (RNF-15): si la estructura del destino cambia (cabecera de la fila 6 distinta de la esperada) debería detectarse antes de escribir', () => {
    const destino = [[], [], [], [], [], filaDestino('EMPRESA', 'Nº EMPLEADO', { 7: 'COLUMNA DISTINTA' }), filaDestino('GALA', '101')];
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 9 })], destino });
    expect(() => volcar(ent)).toThrow();
  });
});

describe('casos sin trabajo: se registra un RESUMEN y no se escribe (RF-13)', () => {
  it('origen solo con cabecera → "Origen sin datos."', () => {
    const ent = entornoExport({ destino: destinoBasico() });
    expect(volcar(ent)).toBe('Origen sin datos.');
    expect(logDetalle(ent)).toStrictEqual([[TS, RUN, 'RESUMEN', '', '', '', '', '', 'Origen sin datos.']]);
  });
  it('origen totalmente vacío → "Origen sin datos."', () => {
    const ent = entornoExport({ origen: [], destino: destinoBasico() });
    expect(volcar(ent)).toBe('Origen sin datos.');
  });
  it('origen con filas pero sin ningún valor que volcar → "Origen sin valores que volcar."', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('GALA', '101'), filaOrigen('GALA', '102', { irpf: '  ' })], destino: destinoBasico() });
    expect(volcar(ent)).toBe('Origen sin valores que volcar.');
    expect(logDetalle(ent)[0][2]).toBe('RESUMEN');
    expect(ent.neto.hoja.volcar()).toStrictEqual(destinoBasico());
  });
  it('origen con valores pero sin empresa o sin nº de empleado → se ignoran', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('', '101', { irpf: 5 }), filaOrigen('GALA', '', { irpf: 5 })], destino: destinoBasico() });
    expect(volcar(ent)).toBe('Origen sin valores que volcar.');
  });
  it('destino con solo la cabecera → "Destino sin filas."', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })], destino: [CAB_DESTINO] });
    expect(volcar(ent)).toBe('Destino sin filas.');
    expect(logDetalle(ent)).toStrictEqual([[TS, RUN, 'RESUMEN', '', '', '', '', '', 'Destino sin filas.']]);
  });
  it('destino vacío del todo → "Destino sin filas."', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })], destino: [] });
    expect(volcar(ent)).toBe('Destino sin filas.');
  });
  it('los duplicados del origen quedan en el LOG aunque el destino no tenga filas', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 }), filaOrigen('GALA', '101', { irpf: 6 })], destino: [CAB_DESTINO] });
    volcar(ent);
    expect(logDetalle(ent).map((f) => f[2])).toStrictEqual(['DUPLICADO_ORIGEN', 'RESUMEN']);
  });
});

describe('volcado: sobrescribe y escribe solo lo que cambia (RF-22)', () => {
  it('escribe los 8 campos en sus columnas G,H,I,L,P,Q,R,T y registra antes→después', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 10, alim: 20, transp: 30, bruto: 2000, ssEmp: 600, ssTrab: 130, irpf: 300, liquido: 1500 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101')],
    });
    const resumen = volcar(ent);
    const fila = ent.neto.hoja.volcar()[1];
    expect([7, 8, 9, 12, 16, 17, 18, 20].map((c) => fila[c - 1])).toStrictEqual([10, 20, 30, 2000, 600, 130, 300, 1500]);
    expect(resumen).toBe('Actualizados=1 | SinCambio=0 | NoEncontrados=0 | BloqueadosDuplicadoDestino=0 | DuplicadosOrigen=0 | DuplicadosDestino=0');
    expect(logDetalle(ent)[0]).toStrictEqual([TS, RUN, 'ACTUALIZADO', 'GALA', '101', 2, 2,
      'ADESLAS: ∅→10 | COBEE COMIDA: ∅→20 | COBEE TRANSPORTE: ∅→30 | Salario Base: ∅→2000 | SS Empresa: ∅→600 | SS trabajador: ∅→130 | IRPF: ∅→300 | Nomina NETO: ∅→1500', '']);
  });
  it('escribe SOLO las celdas que cambian: el resto del destino no se toca', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 10, irpf: 300 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101', { 7: 10, 18: 250 })],
    });
    volcar(ent);
    expect(escrituraDestino(ent).map((w) => w.rango)).toStrictEqual(['R2']);
    expect(logDetalle(ent)[0][7]).toBe('IRPF: 250→300');
  });
  it('si no cambia nada devuelve SIN_CAMBIO y no escribe celdas en el destino', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 10 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101', { 7: 10 })],
    });
    const resumen = volcar(ent);
    expect(resumen).toMatch(/Actualizados=0 \| SinCambio=1/);
    expect(escrituraDestino(ent)).toHaveLength(0);
    expect(logDetalle(ent)[0]).toStrictEqual([TS, RUN, 'SIN_CAMBIO', 'GALA', '101', 2, 2, '', '']);
  });
  it('nunca toca columnas que no son de VINC_FIELDS (p. ej. % IRPF en S y el resto)', () => {
    const base = { 1: 'x', 2: 'y', 13: 'm', 19: '15%', 14: 'n' };
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 99, liquido: 1 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101', base)],
    });
    volcar(ent);
    const fila = ent.neto.hoja.volcar()[1];
    expect([fila[0], fila[1], fila[12], fila[18], fila[13]]).toStrictEqual(['x', 'y', 'm', '15%', 'n']);
  });
  it('RF-20 (campo a campo) · un campo vacío en el origen NO borra el valor del destino', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 99 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101', { 7: 55, 20: 777 })],
    });
    volcar(ent);
    const fila = ent.neto.hoja.volcar()[1];
    expect([fila[6], fila[19], fila[17]]).toStrictEqual([55, 777, 99]);
  });
  it('el cero es un valor: se escribe sobre una celda vacía (∅→0) y sobre otra con dato', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 0, irpf: 0 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101', { 18: 12 })],
    });
    volcar(ent);
    const fila = ent.neto.hoja.volcar()[1];
    expect([fila[6], fila[17]]).toStrictEqual([0, 0]);
    expect(logDetalle(ent)[0][7]).toBe('ADESLAS: ∅→0 | IRPF: 12→0');
  });
  it('un valor de texto en el origen se escribe tal cual', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 'N/A' })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101')],
    });
    volcar(ent);
    expect(ent.neto.hoja.volcar()[1][6]).toBe('N/A');
  });
  it('RNF-08 · "1.234,50" (texto, coma decimal) y 1234.5 (número) son el mismo importe: SIN_CAMBIO', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { bruto: '1.234,50', irpf: '12,5' })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101', { 12: 1234.5, 18: 12.5 })],
    });
    expect(volcar(ent)).toMatch(/Actualizados=0 \| SinCambio=1/);
  });
  it('un número en origen sobre texto equivalente en destino no reescribe ("5" vs 5)', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 5 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101', { 7: '5' })],
    });
    expect(volcar(ent)).toMatch(/SinCambio=1/);
  });
  it.fails('DEFECTO (RNF-08): origen 12.5 (número) y destino "12.5" (texto con punto) no deberían contarse como cambio', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 12.5 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101', { 18: '12.5' })],
    });
    expect(volcar(ent)).toMatch(/SinCambio=1/);
  });
  it.fails('DEFECTO (RNF-07): las escrituras deberían hacerse en bloque; hoy se escribe celda a celda (3 cambios → 3 escrituras)', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 1, alim: 2, transp: 3 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101')],
    });
    volcar(ent);
    expect(escrituraDestino(ent)).toHaveLength(1);
  });
  it('es idempotente: ejecutar dos veces seguidas deja SIN_CAMBIO la segunda y no repite escrituras', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 10, irpf: 3 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101')],
    });
    volcar(ent);
    const antes = escrituraDestino(ent).length;
    expect(volcar(ent)).toMatch(/Actualizados=0 \| SinCambio=1/);
    expect(escrituraDestino(ent)).toHaveLength(antes);
  });
  it('el LOG del destino se acumula entre ejecuciones sin repetir la cabecera', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { seguro: 10 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101')],
    });
    volcar(ent); volcar(ent);
    const filas = volcado(ent.neto.libro.getSheetByName('LOG NETOS'));
    expect(filas.map((f) => f[2])).toStrictEqual(['Tipo', 'ACTUALIZADO', 'RESUMEN', 'SIN_CAMBIO', 'RESUMEN']);
    expect(ent.neto.libro.getSheetByName('LOG NETOS').getFrozenRows()).toBe(1);
  });
  it('mezcla: una fila se actualiza, otra no cambia, otra no está en el destino', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 }), filaOrigen('GALA', '102', { irpf: 7 }), filaOrigen('GALA', '999', { irpf: 1 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101'), filaDestino('GALA', '102', { 18: 7 })],
    });
    expect(volcar(ent)).toBe('Actualizados=1 | SinCambio=1 | NoEncontrados=1 | BloqueadosDuplicadoDestino=0 | DuplicadosOrigen=0 | DuplicadosDestino=0');
    expect(logDetalle(ent).map((f) => f[2])).toStrictEqual(['ACTUALIZADO', 'SIN_CAMBIO', 'NO_ENCONTRADO_DESTINO', 'RESUMEN']);
    expect(logDetalle(ent)[2]).toStrictEqual([TS, RUN, 'NO_ENCONTRADO_DESTINO', 'GALA', '999', 4, '', '', 'No existe clave (empresa+nº) en destino.']);
  });
  it('el destino sin correspondencia en el origen no se toca ni se registra', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101'), filaDestino('GALA', '555', { 18: 1 })],
    });
    volcar(ent);
    expect(ent.neto.hoja.volcar()[2][17]).toBe(1);
    expect(logDetalle(ent).filter((f) => f[4] === '555')).toHaveLength(0);
  });
  it('las filas del destino sin empresa o sin número se ignoran', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })],
      destino: [CAB_DESTINO, filaDestino('', '101'), filaDestino('GALA', ''), filaDestino('GALA', '101')],
    });
    volcar(ent);
    expect(ent.neto.hoja.volcar().map((f) => f[17])).toStrictEqual(['', '', '', 5]);
  });
  it('la fila de datos del destino empieza en la 2: la cabecera (fila 1) no se interpreta como persona', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('EMPRESA', 'Nº EMPLEADO', { irpf: 5 })], destino: [CAB_DESTINO] });
    expect(volcar(ent)).toBe('Destino sin filas.');
  });
});

describe('emparejado por clave EMPRESA + Nº EMPLEADO (RF-04 · RNF-02)', () => {
  it('ignora mayúsculas, tildes, espacios y guiones al emparejar', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('  Gala  Formación ', '10-1', { irpf: 5 })],
      destino: [CAB_DESTINO, filaDestino('GALA FORMACION', '101')],
    });
    volcar(ent);
    expect(ent.neto.hoja.volcar()[1][17]).toBe(5);
  });
  it('número numérico en origen y texto en destino (y al revés) empareja', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', 101, { irpf: 5 }), filaOrigen('GALA', '102', { irpf: 6 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101'), filaDestino('GALA', 102)],
    });
    volcar(ent);
    expect(ent.neto.hoja.volcar().map((f) => f[17])).toStrictEqual(['', 5, 6]);
  });
  it('misma persona en dos empresas: cada clave va a su fila', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '1', { irpf: 5 }), filaOrigen('CERVANTES', '1', { irpf: 9 })],
      destino: [CAB_DESTINO, filaDestino('CERVANTES', '1'), filaDestino('GALA', '1')],
    });
    volcar(ent);
    expect(ent.neto.hoja.volcar().slice(1).map((f) => f[17])).toStrictEqual([9, 5]);
  });
  it('las cabeceras del origen se localizan por nombre aunque estén reordenadas, con otras columnas y acentos distintos', () => {
    const cab = ['Extra', 'LIQUIDO_A_PERCIBIR', 'irpf', 'SS_TRABAH', 'SS_EMP', 'TOTAL_BRUTO', 'COBE_Transporte', 'COBE_Alimentacion', 'SEGURO_MEDICO', ' Codigo_Empleado ', 'empresa'];
    const fila = ['z', 1500, 300, 130, 600, 2000, 30, 20, 10, '101', 'GALA'];
    const ent = entornoExport({ origen: [cab, fila], destino: [CAB_DESTINO, filaDestino('GALA', '101')] });
    volcar(ent);
    expect([7, 8, 9, 12, 16, 17, 18, 20].map((c) => ent.neto.hoja.volcar()[1][c - 1])).toStrictEqual([10, 20, 30, 2000, 600, 130, 300, 1500]);
  });
  it('una columna nueva insertada en el origen no desplaza los datos (RNF-02)', () => {
    const cab = ['Empresa', 'NUEVA', 'Codigo_Empleado', ...CAB_ORIGEN.slice(2)];
    const fila = ['GALA', 'basura', '101', 10, 20, 30, 2000, 600, 130, 300, 1500];
    const ent = entornoExport({ origen: [cab, fila], destino: [CAB_DESTINO, filaDestino('GALA', '101')] });
    volcar(ent);
    expect(ent.neto.hoja.volcar()[1][6]).toBe(10);
  });
});

describe('duplicados (RF-13)', () => {
  it('duplicado en el ORIGEN: gana el último valor NO vacío por campo y se avisa con el nº de apariciones', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN,
        filaOrigen('GALA', '101', { seguro: 1, irpf: 100 }),
        filaOrigen('GALA', '101', { seguro: 2 }),
        filaOrigen('GALA', '101', { alim: 7 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101')],
    });
    const resumen = volcar(ent);
    const fila = ent.neto.hoja.volcar()[1];
    expect([fila[6], fila[7], fila[17]]).toStrictEqual([2, 7, 100]);
    expect(resumen).toMatch(/DuplicadosOrigen=1/);
    const dup = logDetalle(ent).find((f) => f[2] === 'DUPLICADO_ORIGEN');
    expect(dup).toStrictEqual([TS, RUN, 'DUPLICADO_ORIGEN', 'GALA', '101', 4, '', '', 'Aparece 3 veces. Se usa el último valor por campo (no vacío).']);
  });
  it('un duplicado de origen sin valores no cuenta como duplicado (la fila se descarta antes)', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 }), filaOrigen('GALA', '101')],
      destino: [CAB_DESTINO, filaDestino('GALA', '101')],
    });
    expect(volcar(ent)).toMatch(/DuplicadosOrigen=0/);
  });
  it('duplicado en el DESTINO: no se escribe en ninguna de sus filas y se cuentan como bloqueadas', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101'), filaDestino('GALA', '101'), filaDestino('GALA', '101')],
    });
    const resumen = volcar(ent);
    expect(ent.neto.hoja.volcar().slice(1).map((f) => f[17])).toStrictEqual(['', '', '']);
    expect(resumen).toBe('Actualizados=0 | SinCambio=0 | NoEncontrados=0 | BloqueadosDuplicadoDestino=3 | DuplicadosOrigen=0 | DuplicadosDestino=1');
    const dup = logDetalle(ent).find((f) => f[2] === 'DUPLICADO_DESTINO');
    expect(dup).toStrictEqual([TS, RUN, 'DUPLICADO_DESTINO', 'GALA', '101', 2, '2,3,4', '', 'Clave repetida en destino (filas 2, 3, 4). NO se escribe hasta corregir.']);
    expect(escrituraDestino(ent)).toHaveLength(0);
  });
  it('un duplicado en el destino sin correspondencia en el origen se registra con empresa y nº vacíos', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101'), filaDestino('CERVANTES', '7'), filaDestino('CERVANTES', '7')],
    });
    volcar(ent);
    const dup = logDetalle(ent).find((f) => f[2] === 'DUPLICADO_DESTINO');
    expect(dup.slice(3, 7)).toStrictEqual(['', '', '', '3,4']);
  });
  it('un duplicado en el destino no se cuenta además como NO_ENCONTRADO', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101'), filaDestino('GALA', '101')],
    });
    volcar(ent);
    expect(logDetalle(ent).map((f) => f[2])).not.toContain('NO_ENCONTRADO_DESTINO');
  });
  it('los duplicados de claves equivalentes (otra escritura de la misma clave) también se detectan', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })],
      destino: [CAB_DESTINO, filaDestino('Gala', '10-1'), filaDestino('GALA ', '101')],
    });
    expect(volcar(ent)).toMatch(/DuplicadosDestino=1/);
  });
});

describe('bloqueo de ejecución (RNF-04)', () => {
  const espiaBloqueo = (ent, { falla = false } = {}) => {
    const llamadas = [];
    ent.e.contexto.LockService = { getScriptLock: () => ({
      waitLock: (ms) => { llamadas.push(['waitLock', ms]); if (falla) throw new Error('Could not obtain lock'); },
      releaseLock: () => llamadas.push(['releaseLock']),
    }) };
    return llamadas;
  };
  it('toma el bloqueo del script esperando hasta 30 s y lo libera al terminar', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })], destino: destinoBasico() });
    const llamadas = espiaBloqueo(ent);
    volcar(ent);
    expect(llamadas).toStrictEqual([['waitLock', 30000], ['releaseLock']]);
  });
  it('libera el bloqueo aunque el volcado falle', () => {
    const ent = entornoExport({ origen: null });
    const llamadas = espiaBloqueo(ent);
    expect(() => volcar(ent)).toThrow();
    expect(llamadas.at(-1)).toStrictEqual(['releaseLock']);
  });
  it('si el bloqueo está ocupado falla sin leer ni escribir nada', () => {
    const ent = entornoExport({ origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })], destino: destinoBasico() });
    ent.google.estado.bloqueoOcupado = true;
    expect(() => volcar(ent)).toThrow('Se agotó el tiempo de espera del bloqueo.');
    expect(ent.google.estado.escrituras).toHaveLength(0);
    expect(ent.neto.libro.getSheetByName('LOG NETOS')).toBeNull();
  });
  it('si no se puede obtener el bloqueo no se libera (no se tiene)', () => {
    const ent = entornoExport();
    const llamadas = espiaBloqueo(ent, { falla: true });
    expect(() => volcar(ent)).toThrow('Could not obtain lock');
    expect(llamadas).toStrictEqual([['waitLock', 30000]]);
  });
});

describe('Neto y Bruto usan libros y LOG distintos (ADR-0011)', () => {
  it('exportNeto escribe en el libro neto y LOG NETOS; exportBruto en el bruto y LOG BRUTOS', () => {
    const ent = entornoExport({
      origen: [CAB_ORIGEN, filaOrigen('GALA', '101', { irpf: 5 })],
      destino: [CAB_DESTINO, filaDestino('GALA', '101')],
    });
    ent.e.llamar('exportNeto');
    expect(ent.neto.hoja.volcar()[1][17]).toBe(5);
    expect(ent.bruto.hoja.volcar()[1][17]).toBe('');
    expect(ent.bruto.libro.getSheetByName('LOG BRUTOS')).toBeNull();
    ent.e.llamar('exportBruto');
    expect(ent.bruto.hoja.volcar()[1][17]).toBe(5);
    expect(ent.neto.libro.getSheetByName('LOG BRUTOS')).toBeNull();
    expect(ent.bruto.libro.getSheetByName('LOG NETOS')).toBeNull();
  });
});
