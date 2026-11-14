// Integración · validación de un envío en vap_submitBatch antes de escribir (RF-05 · RF-08 · RF-60 · RNF-03).
import { describe, expect, it } from 'vitest';
import { CAB_DATA, CAB_LOGS, crearEntorno, envio } from './ayudas.js';

const enviar = (env, p) => env.llamar('vap_submitBatch', p);
const sinEscrituras = (env) => {
  expect(env.data().volcar()).toEqual([CAB_DATA]);
  expect(env.errores().getLastRow()).toBe(1);
  expect(env.logs().getLastRow()).toBe(1);
};

describe('hojas obligatorias', () => {
  it.each([['Data'], ['Logs'], ['Errores']])('si falta la hoja %s se rechaza con su nombre y no se escribe', (hoja) => {
    const env = crearEntorno({ sinHojas: [hoja] });
    expect(enviar(env, envio())).toEqual({ ok: false, error: `No existe hoja "${hoja}".` });
    expect(env.g.estado.escrituras).toEqual([]);
  });
  it('si Data no tiene las columnas necesarias lo dice y no escribe nada', () => {
    const env = crearEntorno();
    env.data().cargar([['Timestamp', 'Batch_ID', 'Valor']]);
    const r = enviar(env, envio());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/^Faltan columnas en Data: .*ID_Responsable.*Corrige_Batch_ID/);
    expect(env.data().volcar()).toEqual([['Timestamp', 'Batch_ID', 'Valor']]);
  });
  it('Data completamente vacía (sin cabecera) también se detecta como columnas ausentes', () => {
    const env = crearEntorno();
    env.data().cargar([]);
    expect(enviar(env, envio()).error).toMatch(/Faltan columnas en Data/);
  });
});

describe('periodo (RNF-03)', () => {
  it.each([
    ['sin año', { year: undefined }], ['año 0', { year: 0 }], ['año texto', { year: 'abc' }], ['sin mes', { month: undefined }],
    ['mes 0', { month: 0 }], ['mes 13', { month: 13 }], ['mes negativo', { month: -1 }], ['mes texto', { month: 'marzo' }],
  ])('%s → «Año/mes inválidos.» y nada escrito', (_n, cambio) => {
    const env = crearEntorno();
    expect(enviar(env, envio(cambio))).toEqual({ ok: false, error: 'Año/mes inválidos.' });
    sinEscrituras(env);
  });
  it('acepta año y mes como texto numérico (vienen del formulario)', () => {
    expect(enviar(crearEntorno(), envio({ year: '2026', month: '12' })).ok).toBe(true);
  });
  it.fails('DEFECTO · RNF-03: un mes no entero (1,5) se acepta y se guarda como Mes=1.5', () => {
    expect(enviar(crearEntorno(), envio({ month: 1.5 })).ok).toBe(false);
  });
  it.fails('DEFECTO · RNF-03: un año absurdo (1) se acepta; la exportación solo admite 2000..2100', () => {
    expect(enviar(crearEntorno(), envio({ year: 1 })).ok).toBe(false);
  });
});

describe('responsable, concepto y modo', () => {
  it.each([
    ['sin responsable', { responsable: undefined }], ['responsable sin id', { responsable: { email: 'ana@gala.test' } }],
    ['responsable sin email', { responsable: { id: 'R1' } }],
  ])('%s → «Responsable inválido.»', (_n, cambio) => {
    const env = crearEntorno();
    expect(enviar(env, envio(cambio))).toEqual({ ok: false, error: 'Responsable inválido.' });
    sinEscrituras(env);
  });
  it.each([
    ['sin concepto', { concepto: undefined }], ['concepto sin id', { concepto: { concepto: 'Aptos' } }], ['concepto sin nombre', { concepto: { id: 'C1' } }],
  ])('%s → «Concepto inválido.»', (_n, cambio) => {
    const env = crearEntorno();
    expect(enviar(env, envio(cambio))).toEqual({ ok: false, error: 'Concepto inválido.' });
    sinEscrituras(env);
  });
  it.each([[''], ['BORRAR'], [undefined], ['nuevo2']])('modo «%s» → «Modo inválido.»', (modo) => {
    const env = crearEntorno();
    expect(enviar(env, envio({ modo }))).toEqual({ ok: false, error: 'Modo inválido.' });
    sinEscrituras(env);
  });
  it('el modo se acepta en minúsculas y con espacios', () => {
    expect(enviar(crearEntorno(), envio({ modo: ' nuevo ' })).ok).toBe(true);
  });
});

describe('correcciones · RF-08', () => {
  it('una corrección sin Corrige_Batch_ID se rechaza', () => {
    const env = crearEntorno();
    expect(enviar(env, envio({ modo: 'CORRECCION', tipoCorreccion: 'TOTAL', corrigeBatchId: '  ' })))
      .toEqual({ ok: false, error: 'En corrección es obligatorio Corrige_Batch_ID.' });
    sinEscrituras(env);
  });
  it.each([[''], ['MEDIA'], [undefined]])('tipo de corrección «%s» → debe ser PARCIAL o TOTAL', (tipoCorreccion) => {
    const env = crearEntorno();
    expect(enviar(env, envio({ modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion })))
      .toEqual({ ok: false, error: 'Tipo de corrección debe ser PARCIAL o TOTAL.' });
    sinEscrituras(env);
  });
  it('el tipo de corrección se acepta en minúsculas', () => {
    expect(enviar(crearEntorno(), envio({ modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion: 'parcial' })).ok).toBe(true);
  });
  it('en modo NUEVO se ignoran Corrige_Batch_ID y tipo aunque lleguen informados', () => {
    const env = crearEntorno();
    enviar(env, envio({ corrigeBatchId: 'B1', tipoCorreccion: 'TOTAL' }));
    const fila = env.data().volcar()[1];
    expect(fila[CAB_DATA.indexOf('Corrige_Batch_ID')]).toBe('');
    expect(env.logs().volcar()[1][CAB_LOGS.indexOf('Tipo_Correccion')]).toBe('');
  });
  it.fails('DEFECTO · RF-08: se acepta corregir un Batch_ID que NO existe (el enlace con la remesa original queda roto)', () => {
    const env = crearEntorno();
    expect(enviar(env, envio({ modo: 'CORRECCION', corrigeBatchId: 'BATCH_INVENTADO', tipoCorreccion: 'PARCIAL' })).ok).toBe(false);
  });
  it.fails('DEFECTO · RF-08/ADR-0005: se acepta corregir el Batch_ID de OTRO responsable', () => {
    const env = crearEntorno();
    env.data().cargar([CAB_DATA, [env.fecha('2026-03-01T09:00:00Z'), 'B_AJENO', 'R2', 'Beto', 'beto@gala.test', 2026, 3, 'C3', 'Reseñas', 'S1', 'Zoe', 'X', 5, 'WEBAPP', 'NUEVO', '']]);
    expect(enviar(env, envio({ modo: 'CORRECCION', corrigeBatchId: 'B_AJENO', tipoCorreccion: 'PARCIAL' })).ok).toBe(false);
  });
});

describe('remesa vacía', () => {
  it('sin valores → «No hay registros para enviar (todo vacío).»', () => {
    const env = crearEntorno();
    expect(enviar(env, envio({ valores: [] }))).toEqual({ ok: false, error: 'No hay registros para enviar (todo vacío).' });
    sinEscrituras(env);
  });
  it('sin la propiedad valores se trata igual que vacío', () => {
    expect(enviar(crearEntorno(), envio({ valores: undefined })).error).toBe('No hay registros para enviar (todo vacío).');
  });
  it('todo en blanco en envío nuevo o corrección PARCIAL → nada que enviar', () => {
    const valores = [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: '' }, { idSecretaria: 'S2', nombreSecretaria: 'Álvaro', valorStr: '   ' }];
    expect(enviar(crearEntorno(), envio({ valores })).ok).toBe(false);
    expect(enviar(crearEntorno(), envio({ valores, modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion: 'PARCIAL' })).ok).toBe(false);
  });
  it('las líneas sin idSecretaria se ignoran siempre', () => {
    const env = crearEntorno();
    const r = enviar(env, envio({ valores: [{ idSecretaria: '  ', nombreSecretaria: 'X', valorStr: '10' }, { nombreSecretaria: 'Y', valorStr: '10' }] }));
    expect(r.ok).toBe(false);
    sinEscrituras(env);
  });
});

describe('fallo interno', () => {
  it('un payload nulo no rompe al cliente: «Fallo interno» y la causa queda en Logs', () => {
    const env = crearEntorno();
    expect(enviar(env, null)).toEqual({ ok: false, error: 'Fallo interno al guardar. Revisa Logs.' });
    const log = env.logs().volcar()[1];
    expect(log.slice(1)).toEqual(['BATCH_20260315_110000_1000', '', 'ERROR', 0, 'ERROR', expect.stringContaining('null'), '']);
    expect(env.data().getLastRow()).toBe(1);
  });
  it('si falla la escritura en Data, devuelve error genérico y registra el ERROR (sin datos a medias en Data)', () => {
    const env = crearEntorno();
    env.e.ejecutar(`(function(){ const h = SpreadsheetApp.openById('libro-datos').getSheetByName('Data');
      const orig = h.getRange.bind(h);
      h.getRange = function(f, c, nf, nc){ if (f > 1 && nf >= 1) throw new Error('cuota agotada'); return orig(f, c, nf, nc); }; })()`);
    const r = enviar(env, envio());
    expect(r).toEqual({ ok: false, error: 'Fallo interno al guardar. Revisa Logs.' });
    expect(env.data().getLastRow()).toBe(1);
    expect(env.logs().volcar()[1][CAB_LOGS.indexOf('Mensaje')]).toBe('cuota agotada');
    expect(env.logs().volcar()[1][CAB_LOGS.indexOf('Acción')]).toBe('ERROR');
    expect(env.g.estado.correos).toEqual([]);
  });
});
