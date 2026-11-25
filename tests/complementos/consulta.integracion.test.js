// Integración · consulta de envíos propios por periodo (RF-09 · RNF-03 · ADR-0005).
import { describe, expect, it } from 'vitest';
import { cargarData, crearEntorno } from './ayudas.js';

describe('vap_consultaBootstrap · periodos con envíos del responsable', () => {
  it.each([[''], ['  '], [null]])('email «%s» → «Email vacío.»', (email) => {
    expect(crearEntorno().llamar('vap_consultaBootstrap', email)).toEqual({ ok: false, error: 'Email vacío.' });
  });
  it('rechaza emails desconocidos y responsables inactivos', () => {
    const env = crearEntorno();
    expect(env.llamar('vap_consultaBootstrap', 'intruso@gala.test')).toEqual({ ok: false, error: 'Email no autorizado o manager inactivo.' });
    expect(env.llamar('vap_consultaBootstrap', 'cleo@gala.test').ok).toBe(false);
  });
  it('devuelve el responsable y los periodos distintos, del más reciente al más antiguo', () => {
    const env = crearEntorno();
    cargarData(env, [
      { mes: 1, year: 2026, batch: 'A' }, { mes: 12, year: 2025, batch: 'B' }, { mes: 3, year: 2026, batch: 'C' },
      { mes: 3, year: 2026, batch: 'D' }, { mes: 'Febrero', year: 2026, batch: 'E' },
    ]);
    const r = env.llamar('vap_consultaBootstrap', ' ANA@gala.test ');
    expect(r.responsable).toEqual({ id: 'R1', nombre: 'Ana Prueba', email: 'ana@gala.test' });
    expect(r.periodos).toEqual([{ year: 2026, month: 3 }, { year: 2026, month: 2 }, { year: 2026, month: 1 }, { year: 2025, month: 12 }]);
  });
  it('RNF-09 · solo cuenta los envíos del propio responsable', () => {
    const env = crearEntorno();
    cargarData(env, [{ resp: 'R1', mes: 3 }, { resp: 'R2', mes: 4 }]);
    expect(env.llamar('vap_consultaBootstrap', 'ana@gala.test').periodos).toEqual([{ year: 2026, month: 3 }]);
  });
  it('ignora filas con año o mes ilegibles', () => {
    const env = crearEntorno();
    cargarData(env, [{ mes: 'xx' }, { year: 'abc', mes: 3 }, { year: '', mes: 3 }, { mes: 5 }]);
    expect(env.llamar('vap_consultaBootstrap', 'ana@gala.test').periodos).toEqual([{ year: 2026, month: 5 }]);
  });
  it('Data solo con cabecera → ok con periodos vacíos (estado vacío)', () => {
    const r = crearEntorno().llamar('vap_consultaBootstrap', 'ana@gala.test');
    expect(r).toEqual({ ok: true, responsable: { id: 'R1', nombre: 'Ana Prueba', email: 'ana@gala.test' }, periodos: [] });
  });
  it('sin hoja Data → error claro', () => {
    expect(crearEntorno({ sinHojas: ['Data'] }).llamar('vap_consultaBootstrap', 'ana@gala.test')).toEqual({ ok: false, error: 'No existe la hoja "Data".' });
  });
  it('si falta una hoja de la BBDD devuelve el error (no lanza)', () => {
    const r = crearEntorno({ sinHojas: ['VAP_Responsables'] }).llamar('vap_consultaBootstrap', 'ana@gala.test');
    expect(r).toEqual({ ok: false, error: 'Hoja no encontrada en BBDD.' });
  });
  it('Data sin columna ID_Responsable no da periodos ni falla', () => {
    const env = crearEntorno();
    env.data().cargar([['Año', 'Mes'], [2026, 3]]);
    expect(env.llamar('vap_consultaBootstrap', 'ana@gala.test').periodos).toEqual([]);
  });
});

describe('vap_consultaBatches · detalle de los envíos de un periodo', () => {
  const q = (c = {}) => ({ idResponsable: 'R1', year: 2026, month: 3, ...c });
  it.each([
    ['sin responsable', { idResponsable: '' }], ['sin año', { year: 0 }], ['sin mes', { month: undefined }], ['año texto', { year: 'x' }],
  ])('%s → «Parámetros inválidos.»', (_n, cambio) => {
    expect(crearEntorno().llamar('vap_consultaBatches', q(cambio))).toEqual({ ok: false, error: 'Parámetros inválidos.' });
  });
  it('sin parámetros → «Parámetros inválidos.»', () => {
    expect(crearEntorno().llamar('vap_consultaBatches', undefined)).toEqual({ ok: false, error: 'Parámetros inválidos.' });
  });
  it('sin hoja Data → error claro', () => {
    expect(crearEntorno({ sinHojas: ['Data'] }).llamar('vap_consultaBatches', q())).toEqual({ ok: false, error: 'No existe la hoja "Data".' });
  });
  it('Data vacía → lista vacía (estado vacío)', () => {
    expect(crearEntorno().llamar('vap_consultaBatches', q())).toEqual({ ok: true, batches: [] });
  });
  it('agrupa por Batch_ID con sus secretarias y el número de registros', () => {
    const env = crearEntorno();
    cargarData(env, [
      { batch: 'B1', idS: 'S1', nomS: 'Ficticia, Zoe', valor: 10 },
      { batch: 'B1', idS: 'S2', nomS: 'Falso, Álvaro', valor: 0 },
    ]);
    const [b] = env.llamar('vap_consultaBatches', q()).batches;
    expect(b).toEqual({
      batchId: 'B1', tsText: '10/03/2026 10:00', concepto: 'Aptos', modo: 'NUEVO', tipoCorreccion: '', corrigeBatchId: '', nRegistros: 2,
      secretarias: [
        { idSecretaria: 'S1', nombreSecretaria: 'Ficticia, Zoe', valor: 10 },
        { idSecretaria: 'S2', nombreSecretaria: 'Falso, Álvaro', valor: 0 },
      ],
    });
  });
  it('ordena del envío más reciente al más antiguo', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'VIEJO', ts: '2026-03-01T09:00:00Z' }, { batch: 'NUEVO', ts: '2026-03-12T09:00:00Z' }, { batch: 'MEDIO', ts: '2026-03-06T09:00:00Z' }]);
    expect(env.llamar('vap_consultaBatches', q()).batches.map((b) => b.batchId)).toEqual(['NUEVO', 'MEDIO', 'VIEJO']);
  });
  it('la hora de un envío es la mayor de sus filas', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1', ts: '2026-03-10T09:00:00Z' }, { batch: 'B1', ts: '2026-03-10T09:00:30Z', idS: 'S2' }, { batch: 'B1', ts: '2026-03-10T08:00:00Z', idS: 'S4' }]);
    expect(env.llamar('vap_consultaBatches', q()).batches[0].tsText).toBe('10/03/2026 10:00');
  });
  it('filtra por responsable, año y mes (ADR-0005)', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'OK' }, { batch: 'OTRO_RESP', resp: 'R2' }, { batch: 'OTRO_AÑO', year: 2025 }, { batch: 'OTRO_MES', mes: 4 }, { batch: 'MES_TEXTO', mes: 'Marzo' }]);
    expect(env.llamar('vap_consultaBatches', q()).batches.map((b) => b.batchId).sort()).toEqual(['MES_TEXTO', 'OK']);
  });
  it('conserva el modo CORRECCION y el lote al que corrige; el tipo sale de Logs', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1' }, { batch: 'B2', ts: '2026-03-11T09:00:00Z', modo: 'correccion', corrige: 'B1' }]);
    env.logs().appendRow([env.fecha('2026-03-11T09:00:00Z'), 'B2', 'R1', 'CORRECCION', 1, 'OK', 'OK', 'TOTAL']);
    env.logs().appendRow([env.fecha('2026-03-10T09:00:00Z'), 'B1', 'R1', 'ENVIO', 1, 'OK', 'OK', '']);
    const [b2, b1] = env.llamar('vap_consultaBatches', q()).batches;
    expect(b2).toMatchObject({ batchId: 'B2', modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion: 'TOTAL' });
    expect(b1).toMatchObject({ batchId: 'B1', modo: 'NUEVO', tipoCorreccion: '' });
  });
  it('sin la columna Modo se asume NUEVO', () => {
    const env = crearEntorno();
    env.data().cargar([['Timestamp', 'Batch_ID', 'ID_Responsable', 'Año', 'Mes', 'Concepto', 'ID_Secretaria', 'Nombre_Secretaria', 'Valor'],
      [env.fecha('2026-03-10T09:00:00Z'), 'B1', 'R1', 2026, 3, 'Aptos', 'S1', 'Zoe', 5]]);
    expect(env.llamar('vap_consultaBatches', q()).batches[0].modo).toBe('NUEVO');
  });
  it('sin hoja Logs sigue funcionando (tipo vacío)', () => {
    const env = crearEntorno({ sinHojas: ['Logs'] });
    cargarData(env, [{ batch: 'B1', modo: 'CORRECCION', corrige: 'B0' }]);
    expect(env.llamar('vap_consultaBatches', q()).batches[0].tipoCorreccion).toBe('');
  });
  it('si Logs no tiene las columnas esperadas se ignora el tipo sin fallar', () => {
    const env = crearEntorno();
    env.logs().cargar([['A', 'B'], ['B1', 'TOTAL']]);
    cargarData(env, [{ batch: 'B1' }]);
    expect(env.llamar('vap_consultaBatches', q()).batches[0].tipoCorreccion).toBe('');
  });
  it('ignora filas sin Batch_ID o con fecha ilegible', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: '' }, { batch: 'X', tsRaw: 'basura' }, { batch: 'OK' }]);
    expect(env.llamar('vap_consultaBatches', q()).batches.map((b) => b.batchId)).toEqual(['OK']);
  });
  it('un fallo inesperado se devuelve como {ok:false,error}', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1' }]);
    env.e.ejecutar(`Utilities.formatDate = function(){ throw new Error('formato roto'); }`);
    expect(env.llamar('vap_consultaBatches', q())).toEqual({ ok: false, error: 'formato roto' });
  });
  it('conserva los nombres tal cual vienen (con caracteres HTML) para que la pantalla los escape', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1', nomS: '<b>Zoe</b> & Co' }]);
    expect(env.llamar('vap_consultaBatches', q()).batches[0].secretarias[0].nombreSecretaria).toBe('<b>Zoe</b> & Co');
  });
});
