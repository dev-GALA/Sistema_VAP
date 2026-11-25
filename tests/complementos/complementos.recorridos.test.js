// Recorridos de extremo a extremo del BACKEND: doGet → validación → carga → corrección → consulta → exportación → correo.
// RF-05 · RF-07 · RF-08 · RF-09 · RF-60 · RF-61 · RNF-06 · ADR-0005 · ADR-0009
import { describe, expect, it } from 'vitest';
import { colaPrompt, crearEntorno, envio, fetchXlsxOk, fijarHora, registrarTemporal } from './ayudas.js';

const valores = (...pares) => pares.map(([id, nombre, valorStr]) => ({ idSecretaria: id, nombreSecretaria: nombre, valorStr }));
const exportar = (env) => {
  env.idTemporal = registrarTemporal(env);
  env.e.llamar('vap_generarExcelMensual');
  // sin la columna DNI (la última), que se comprueba en las pruebas de exportación
  return env.g.estado.libros.get(env.idTemporal).getSheets()[0].volcar().map((fila) => fila.slice(0, -1));
};

describe('recorrido · un manager reporta, corrige y se exporta', () => {
  it('pantalla → validación → envío → corrección parcial → consulta → Excel final → correos', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('2026', 'Marzo') }, fetch: fetchXlsxOk, plantillas: true });
    // 1. el manager abre el reporte y valida su email
    expect(env.e.llamar('doGet', { parameter: {} }).getTitle()).toBe('VAP - Reporte Managers');
    const arranque = env.llamar('vap_bootstrapForEmail', 'ana@gala.test');
    expect(arranque.ok).toBe(true);
    const [aptos] = arranque.conceptos;
    const [alvaro, zoe] = arranque.secretarias;
    // 2. envío mensual (Álvaro 100, Zoe 250,5)
    const r1 = env.llamar('vap_submitBatch', envio({ concepto: aptos, valores: valores([alvaro.id, alvaro.nombre, '100'], [zoe.id, zoe.nombre, '250,5']) }));
    expect(r1).toMatchObject({ ok: true, written: 2, errors: 0 });
    // 3. al día siguiente ve su envío como corregible y corrige solo a Zoe
    fijarHora(env, '2026-03-16T10:00:00Z');
    env.e.ejecutar('Math.random = () => 0.5');
    const dianas = env.llamar('vap_listCorrectionTargets', { year: 2026, month: 3, idResponsable: 'R1', idConcepto: aptos.id });
    expect(dianas.items.map((i) => i.batchId)).toEqual([r1.batchId]);
    const r2 = env.llamar('vap_submitBatch', envio({
      concepto: aptos, modo: 'CORRECCION', corrigeBatchId: dianas.items[0].batchId, tipoCorreccion: 'PARCIAL',
      valores: valores([alvaro.id, alvaro.nombre, ''], [zoe.id, zoe.nombre, '300']),
    }));
    expect(r2).toMatchObject({ ok: true, written: 1 });
    expect(r2.batchId).not.toBe(r1.batchId);
    // 4. la consulta muestra ambos envíos, el corregido y el nuevo, con el original intacto
    const periodos = env.llamar('vap_consultaBootstrap', 'ana@gala.test').periodos;
    expect(periodos).toEqual([{ year: 2026, month: 3 }]);
    const { batches } = env.llamar('vap_consultaBatches', { idResponsable: 'R1', year: 2026, month: 3 });
    expect(batches.map((b) => [b.batchId, b.modo, b.tipoCorreccion, b.corrigeBatchId, b.nRegistros]))
      .toEqual([[r2.batchId, 'CORRECCION', 'PARCIAL', r1.batchId, 1], [r1.batchId, 'NUEVO', '', '', 2]]);
    expect(batches[1].secretarias.map((s) => s.valor)).toEqual([100, 250.5]);
    // 5. el Excel recoge el último valor de cada secretaria y conserva lo no corregido
    expect(exportar(env)).toEqual([
      ['ID_Secretaria', 'Secretaria', 'Aptos'],
      ['S2', 'Falso, Álvaro', 100],
      ['S1', 'Ficticia, Zoe', 300],
    ]);
    // 6. trazabilidad: Logs en orden y un correo por cada envío; el Excel deja EXPORT_OK
    expect(env.logs().volcar().slice(1).map((f) => f[3])).toEqual(['ENVIO', 'CORRECCION', 'EXPORT_OK']);
    expect(env.g.estado.correos.map((c) => c.subject)).toEqual([
      expect.stringContaining(r1.batchId), expect.stringContaining(r2.batchId),
    ]);
    expect(env.g.estado.archivos.some((a) => a.nombre === 'VAP_COMPLEMENTOS_2026_03.xlsx' && a.carpeta)).toBe(true);
  });
});

describe('recorrido · valores inválidos mezclados (RF-60 · RF-61)', () => {
  it('los válidos llegan al Excel y los inválidos quedan solo en Errores', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('2026', '3') }, fetch: fetchXlsxOk });
    const r = env.llamar('vap_submitBatch', envio({ valores: valores(['S1', 'Ficticia, Zoe', '10'], ['S2', 'Falso, Álvaro', 'mucho'], ['S4', 'Inventado, Ñoño', '1.250,75']) }));
    expect(r).toMatchObject({ written: 2, errors: 1 });
    expect(exportar(env)).toEqual([
      ['ID_Secretaria', 'Secretaria', 'Aptos'],
      ['S1', 'Ficticia, Zoe', 10],
      ['S4', 'Inventado, Ñoño', 1250.75],
    ]);
    expect(env.errores().volcar()[1].slice(5, 8)).toEqual(['S2', 'mucho', 'Valor no numérico']);
    expect(env.g.estado.correos[0].htmlBody).toMatch(/Nº errores<\/td>\s*<td[^>]*>1</);
  });
});

describe('recorrido · varios responsables y conceptos en un mismo mes', () => {
  it('el Excel junta los conceptos de cada manager, con los preferidos en su orden', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('2026', 'Marzo') }, fetch: fetchXlsxOk });
    const ana = { id: 'R1', nombre: 'Ana Prueba', email: 'ana@gala.test' };
    const beto = { id: 'R2', nombre: 'Beto Prueba', email: 'beto@gala.test' };
    env.llamar('vap_submitBatch', envio({ responsable: ana, concepto: { id: 'C2', concepto: 'Sábados 50' }, valores: valores(['S1', 'Ficticia, Zoe', '5']) }));
    env.llamar('vap_submitBatch', envio({ responsable: beto, concepto: { id: 'C3', concepto: 'Reseñas' }, valores: valores(['S1', 'Ficticia, Zoe', '7'], ['S2', 'Falso, Álvaro', '9']) }));
    env.llamar('vap_submitBatch', envio({ responsable: ana, concepto: { id: 'C1', concepto: 'Aptos' }, valores: valores(['S2', 'Falso, Álvaro', '1']) }));
    expect(exportar(env)).toEqual([
      ['ID_Secretaria', 'Secretaria', 'Aptos', 'Reseñas', 'Sábados 50'],
      ['S2', 'Falso, Álvaro', 1, 9, ''],
      ['S1', 'Ficticia, Zoe', '', 7, 5],
    ]);
  });
});

describe('recorrido · ADR-0005 · el mismo mes de dos años no se mezcla', () => {
  it('marzo de 2025 y marzo de 2026 conviven y cada exportación toma solo el suyo', () => {
    const env2026 = crearEntorno({ respuestas: { prompt: colaPrompt('2026', 'Marzo') }, fetch: fetchXlsxOk });
    env2026.llamar('vap_submitBatch', envio({ year: 2025, valores: valores(['S1', 'Ficticia, Zoe', '1']) }));
    env2026.llamar('vap_submitBatch', envio({ year: 2026, valores: valores(['S1', 'Ficticia, Zoe', '2']) }));
    expect(exportar(env2026)[1][2]).toBe(2);
    expect(env2026.llamar('vap_consultaBootstrap', 'ana@gala.test').periodos).toEqual([{ year: 2026, month: 3 }, { year: 2025, month: 3 }]);
    expect(env2026.llamar('vap_consultaBatches', { idResponsable: 'R1', year: 2025, month: 3 }).batches).toHaveLength(1);
  });
});

describe('recorrido · corrección TOTAL con ceros (RF-08)', () => {
  it('una corrección total pone a 0 lo no informado y el Excel lo refleja', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('2026', 'Marzo') }, fetch: fetchXlsxOk });
    const original = env.llamar('vap_submitBatch', envio({ valores: valores(['S1', 'Ficticia, Zoe', '10'], ['S2', 'Falso, Álvaro', '20']) }));
    fijarHora(env, '2026-03-16T10:00:00Z');
    env.llamar('vap_submitBatch', envio({
      modo: 'CORRECCION', corrigeBatchId: original.batchId, tipoCorreccion: 'TOTAL', valores: valores(['S1', 'Ficticia, Zoe', '15'], ['S2', 'Falso, Álvaro', '']),
    }));
    expect(exportar(env).slice(1)).toEqual([['S2', 'Falso, Álvaro', 0], ['S1', 'Ficticia, Zoe', 15]]);
    expect(env.data().getLastRow()).toBe(5); // cabecera + 2 originales + 2 de corrección: nada se borró
  });
});

describe('recorrido · resiliencia (RNF-12)', () => {
  it('con el correo caído el reporte y la exportación siguen funcionando', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('2026', 'Marzo') }, fetch: fetchXlsxOk });
    env.e.ejecutar(`MailApp.sendEmail = function(){ throw new Error('sin correo'); }`);
    expect(env.llamar('vap_submitBatch', envio()).ok).toBe(true);
    expect(exportar(env)).toHaveLength(3);
    expect(env.g.estado.correos).toEqual([]);
  });
  it('si Drive responde 500 la exportación falla pero Data y Logs de envíos quedan intactos', () => {
    const env = crearEntorno({ respuestas: { prompt: colaPrompt('2026', 'Marzo') }, fetch: () => ({ codigo: 500, contenido: 'x' }) });
    env.llamar('vap_submitBatch', envio());
    const antes = env.data().volcar();
    env.idTemporal = registrarTemporal(env);
    expect(() => env.e.llamar('vap_generarExcelMensual')).toThrow(/HTTP 500/);
    expect(env.data().volcar()).toEqual(antes);
    expect(env.logs().volcar().map((f) => f[3])).toEqual(['Acción', 'ENVIO']);
  });
});
