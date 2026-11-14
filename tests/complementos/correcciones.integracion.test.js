// Integración · envíos disponibles para corregir: vap_listCorrectionTargets (RF-08 · ADR-0005).
import { describe, expect, it } from 'vitest';
import { CAB_DATA, cargarData, crearEntorno } from './ayudas.js';

const q = (cambios = {}) => ({ year: 2026, month: 3, idResponsable: 'R1', idConcepto: 'C1', ...cambios });

describe('vap_listCorrectionTargets', () => {
  it('lista los Batch_ID del responsable + año + mes + concepto, del más reciente al más antiguo', () => {
    const env = crearEntorno();
    cargarData(env, [
      { batch: 'B1', ts: '2026-03-05T09:00:00Z' },
      { batch: 'B3', ts: '2026-03-20T09:00:00Z' },
      { batch: 'B2', ts: '2026-03-10T18:30:00Z' },
    ]);
    const r = env.llamar('vap_listCorrectionTargets', q());
    expect(r.ok).toBe(true);
    expect(r.items.map((i) => i.batchId)).toEqual(['B3', 'B2', 'B1']);
    expect(r.items[1]).toEqual({ batchId: 'B2', concepto: 'Aptos', tsISO: '2026-03-10T18:30:00.000Z', tsText: '10/03/2026 19:30' });
  });
  it('un Batch_ID con varias filas aparece una sola vez, con la marca más reciente', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1', ts: '2026-03-05T09:00:00Z', idS: 'S1' }, { batch: 'B1', ts: '2026-03-05T09:00:05Z', idS: 'S2' }]);
    const items = env.llamar('vap_listCorrectionTargets', q()).items;
    expect(items).toHaveLength(1);
    expect(items[0].tsISO).toBe('2026-03-05T09:00:05.000Z');
  });
  it('ADR-0005 · distingue el mismo mes de años distintos', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B25', year: 2025 }, { batch: 'B26', year: 2026 }]);
    expect(env.llamar('vap_listCorrectionTargets', q()).items.map((i) => i.batchId)).toEqual(['B26']);
  });
  it('filtra por mes, aceptando Mes como número, texto o nombre', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'M3', mes: 3 }, { batch: 'MT', mes: '03' }, { batch: 'MN', mes: 'Marzo' }, { batch: 'M4', mes: 4 }, { batch: 'MX', mes: 'xx' }]);
    expect(env.llamar('vap_listCorrectionTargets', q()).items.map((i) => i.batchId).sort()).toEqual(['M3', 'MN', 'MT']);
  });
  it('no mezcla responsables: cada uno corrige solo sus envíos', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'DE_ANA', resp: 'R1' }, { batch: 'DE_BETO', resp: 'R2' }]);
    expect(env.llamar('vap_listCorrectionTargets', q()).items.map((i) => i.batchId)).toEqual(['DE_ANA']);
  });
  it('no mezcla conceptos', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'APTOS', idC: 'C1' }, { batch: 'SABADOS', idC: 'C2', conc: 'Sábados 50' }]);
    expect(env.llamar('vap_listCorrectionTargets', q({ idConcepto: 'C2' })).items.map((i) => [i.batchId, i.concepto])).toEqual([['SABADOS', 'Sábados 50']]);
  });
  it('ignora filas sin Batch_ID o sin marca temporal válida', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: '' }, { batch: 'SIN_TS', tsRaw: 'no es fecha' }, { batch: 'BUENO' }]);
    env.data().appendRow(['', 'VACIO_TS', 'R1', '', '', 2026, 3, 'C1', 'Aptos']);
    expect(env.llamar('vap_listCorrectionTargets', q()).items.map((i) => i.batchId)).toEqual(['BUENO']);
  });
  it('recorta espacios en los ids de la hoja', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: ' B1 ', resp: ' R1 ', idC: ' C1 ' }]);
    expect(env.llamar('vap_listCorrectionTargets', q()).items.map((i) => i.batchId)).toEqual(['B1']);
  });
  it.each([
    ['sin año', { year: undefined }], ['sin mes', { month: undefined }], ['sin responsable', { idResponsable: '' }], ['sin concepto', { idConcepto: '  ' }],
    ['año texto', { year: 'x' }], ['mes 0', { month: 0 }],
  ])('parámetros incompletos (%s) → lista vacía, sin error', (_n, cambio) => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1' }]);
    expect(env.llamar('vap_listCorrectionTargets', q(cambio))).toEqual({ ok: true, items: [] });
  });
  it('sin parámetros (undefined) → lista vacía', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1' }]);
    expect(env.llamar('vap_listCorrectionTargets', undefined)).toEqual({ ok: true, items: [] });
  });
  it('Data solo con cabecera → lista vacía', () => {
    expect(crearEntorno().llamar('vap_listCorrectionTargets', q())).toEqual({ ok: true, items: [] });
  });
  it('sin hoja Data → error claro, sin excepción', () => {
    expect(crearEntorno({ sinHojas: ['Data'] }).llamar('vap_listCorrectionTargets', q())).toEqual({ ok: false, error: 'No existe la hoja "Data".' });
  });
  it('si a Data le faltan columnas lo indica', () => {
    const env = crearEntorno();
    env.data().cargar([['Timestamp', 'Batch_ID'], ['x', 'y']]);
    const r = env.llamar('vap_listCorrectionTargets', q());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/^Faltan columnas en Data: Año, Mes, ID_Responsable, ID_Concepto, Concepto$/);
  });
  it('un fallo inesperado se devuelve como error y no como excepción', () => {
    const env = crearEntorno();
    env.e.ejecutar(`Utilities.formatDate = function(){ throw new Error('formato roto'); }`);
    cargarData(env, [{ batch: 'B1' }]);
    expect(env.llamar('vap_listCorrectionTargets', q())).toEqual({ ok: false, error: 'formato roto' });
  });
  it('la hora mostrada es la de Madrid (verano UTC+2)', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1', ts: '2026-07-01T22:30:00Z', mes: 7 }]);
    expect(env.llamar('vap_listCorrectionTargets', q({ month: 7 })).items[0].tsText).toBe('02/07/2026 00:30');
  });
  it('lee Data por cabecera aunque se reordenen las columnas (RNF-02)', () => {
    const env = crearEntorno();
    cargarData(env, [{ batch: 'B1' }]);
    const filas = env.data().volcar();
    env.data().cargar(filas.map((f) => [...f].reverse()));
    expect(env.llamar('vap_listCorrectionTargets', q()).items.map((i) => i.batchId)).toEqual(['B1']);
    expect(CAB_DATA.length).toBeGreaterThan(10);
  });
});
