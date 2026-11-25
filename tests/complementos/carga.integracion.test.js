// Integración · escritura de un envío: Data, Logs y Errores (RF-05 · RF-60 · RF-61 · RNF-02 · RNF-04 · RNF-06 · RNF-07 · RNF-08).
import { describe, expect, it } from 'vitest';
import { CAB_DATA, CAB_ERRORES, CAB_LOGS, crearEntorno, envio, fijarHora } from './ayudas.js';

const enviar = (env, p) => env.llamar('vap_submitBatch', p);
const comoObjetos = (cab, filas) => filas.map((f) => Object.fromEntries(cab.map((c, i) => [c, f[i]])));
const datos = (env) => comoObjetos(CAB_DATA, env.data().volcar().slice(1));
const logs = (env) => comoObjetos(CAB_LOGS, env.logs().volcar().slice(1));
const errores = (env) => comoObjetos(CAB_ERRORES, env.errores().volcar().slice(1));
const BATCH = 'BATCH_20260315_110000_1000';

describe('envío mensual (NUEVO) · RF-05', () => {
  it('devuelve el Batch_ID y los contadores', () => {
    expect(enviar(crearEntorno(), envio())).toEqual({ ok: true, batchId: BATCH, written: 2, errors: 0 });
  });
  it('escribe un registro por secretaria con todos los campos de Data', () => {
    const env = crearEntorno();
    enviar(env, envio());
    const [a, b] = datos(env);
    expect(a.Timestamp.toISOString()).toBe('2026-03-15T10:00:00.000Z');
    const { Timestamp, ...resto } = a;
    expect(resto).toEqual({
      Batch_ID: BATCH, ID_Responsable: 'R1', Nombre_Responsable: 'Ana Prueba', Email_Responsable: 'ana@gala.test', Año: 2026, Mes: 3,
      ID_Concepto: 'C1', Concepto: 'Aptos', ID_Secretaria: 'S1', Nombre_Secretaria: 'Ficticia, Zoe', Tipo_Valor: 'IMPORTE', Valor: 100,
      Source: 'WEBAPP', Modo: 'NUEVO', Corrige_Batch_ID: '', DNI_Secretaria: '11111111H',
    });
    expect(b.ID_Secretaria).toBe('S2');
    expect(b.Valor).toBe(250.5);
  });
  it('todas las filas del mismo envío comparten Batch_ID y marca temporal', () => {
    const env = crearEntorno();
    enviar(env, envio());
    const [a, b] = datos(env);
    expect(a.Batch_ID).toBe(b.Batch_ID);
    expect(a.Timestamp.getTime()).toBe(b.Timestamp.getTime());
  });
  it('año y mes se guardan como NÚMEROS aunque lleguen como texto', () => {
    const env = crearEntorno();
    enviar(env, envio({ year: '2026', month: '3' }));
    expect(datos(env)[0].Año).toBe(2026);
    expect(datos(env)[0].Mes).toBe(3);
  });
  it('recorta espacios de ids y nombres y admite nombre ausente', () => {
    const env = crearEntorno();
    enviar(env, envio({ valores: [{ idSecretaria: ' S1 ', nombreSecretaria: '  Zoe  ', valorStr: ' 5 ' }, { idSecretaria: 'S2', valorStr: '6' }] }));
    expect(datos(env).map((d) => [d.ID_Secretaria, d.Nombre_Secretaria, d.Valor])).toEqual([['S1', 'Zoe', 5], ['S2', '', 6]]);
  });
  it('un concepto sin tipoValor guarda Tipo_Valor vacío y un responsable sin nombre guarda vacío', () => {
    const env = crearEntorno();
    enviar(env, envio({ concepto: { id: 'C1', concepto: 'Aptos' }, responsable: { id: 'R1', email: 'ana@gala.test' } }));
    expect(datos(env)[0].Tipo_Valor).toBe('');
    expect(datos(env)[0].Nombre_Responsable).toBe('');
  });
  it('añade DEBAJO de lo existente sin tocarlo', () => {
    const env = crearEntorno();
    const previa = [env.fecha('2026-02-01T08:00:00Z'), 'B_PREVIO', 'R1', 'Ana', 'ana@gala.test', 2026, 2, 'C1', 'Aptos', 'S1', 'Zoe', 'IMPORTE', 7, 'WEBAPP', 'NUEVO', ''];
    env.data().cargar([CAB_DATA, previa]);
    enviar(env, envio());
    const filas = env.data().volcar();
    expect(filas).toHaveLength(4);
    expect(filas[1]).toEqual(previa);
  });
  it('RNF-02 · escribe por nombre de cabecera: reordenar columnas de Data no descoloca los datos', () => {
    const env = crearEntorno();
    const invertida = [...CAB_DATA].reverse();
    env.data().cargar([invertida]);
    enviar(env, envio());
    const fila = env.data().volcar()[1];
    expect(fila[invertida.indexOf('Valor')]).toBe(100);
    expect(fila[invertida.indexOf('ID_Secretaria')]).toBe('S1');
    expect(fila[invertida.indexOf('Año')]).toBe(2026);
  });
  it('las columnas extra de Data quedan vacías', () => {
    const env = crearEntorno();
    env.data().cargar([[...CAB_DATA, 'Nota']]);
    enviar(env, envio());
    expect(env.data().volcar()[1].at(-1)).toBe('');
  });
  it('RNF-07 · escribe en bloque: una sola escritura en Data y una en Logs', () => {
    const env = crearEntorno();
    enviar(env, envio({ valores: Array.from({ length: 30 }, (_, i) => ({ idSecretaria: `S${i}`, nombreSecretaria: `N${i}`, valorStr: String(i + 1) })) }));
    const porHoja = env.g.estado.escrituras.reduce((a, w) => ({ ...a, [w.hoja]: (a[w.hoja] || 0) + 1 }), {});
    expect(porHoja).toEqual({ Data: 1, Logs: 1 });
  });
  it('registra el envío en Logs con acción ENVIO', () => {
    const env = crearEntorno();
    enviar(env, envio());
    const [log] = logs(env);
    expect(log).toMatchObject({ Batch_ID: BATCH, ID_Responsable: 'R1', 'Acción': 'ENVIO', 'Nº_Registros': 2, Resultado: 'OK', Mensaje: 'OK', Tipo_Correccion: '' });
  });
});

describe('importes · RNF-08', () => {
  it.each([['100', 100], ['100,5', 100.5], ['100.5', 100.5], ['1.234,56', 1234.56], ['1,234.56', 1234.56], ['0', 0], ['-20', -20]])(
    '«%s» se guarda como %s', (valorStr, esperado) => {
      const env = crearEntorno();
      enviar(env, envio({ valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr }] }));
      expect(datos(env)[0].Valor).toBe(esperado);
    },
  );
  it('el cero escrito («0») es un dato válido, no un vacío', () => {
    const env = crearEntorno();
    expect(enviar(env, envio({ valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: '0' }] })).written).toBe(1);
  });
  it('un valorStr numérico (no texto) también se acepta', () => {
    const env = crearEntorno();
    enviar(env, envio({ valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: 42 }] }));
    expect(datos(env)[0].Valor).toBe(42);
  });
});

describe('valores vacíos', () => {
  const valores = [
    { idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: '10' },
    { idSecretaria: 'S2', nombreSecretaria: 'Álvaro', valorStr: '' },
    { idSecretaria: 'S4', nombreSecretaria: 'Ñoño', valorStr: '  ' },
  ];
  it('en envío nuevo los vacíos se omiten', () => {
    const env = crearEntorno();
    expect(enviar(env, envio({ valores })).written).toBe(1);
  });
  it('RF-08 · en corrección PARCIAL los vacíos se omiten', () => {
    const env = crearEntorno();
    enviar(env, envio({ valores, modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion: 'PARCIAL' }));
    expect(datos(env).map((d) => d.ID_Secretaria)).toEqual(['S1']);
  });
  it('RF-08 · en corrección TOTAL los vacíos se guardan como 0 (reemplazo completo)', () => {
    const env = crearEntorno();
    const r = enviar(env, envio({ valores, modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion: 'TOTAL' }));
    expect(r.written).toBe(3);
    expect(datos(env).map((d) => [d.ID_Secretaria, d.Valor])).toEqual([['S1', 10], ['S2', 0], ['S4', 0]]);
  });
  it('en TOTAL sigue sin escribirse la línea sin idSecretaria', () => {
    const env = crearEntorno();
    const r = enviar(env, envio({ valores: [...valores, { idSecretaria: '', valorStr: '' }], modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion: 'TOTAL' }));
    expect(r.written).toBe(3);
  });
});

describe('valores no numéricos · RF-60 · RF-61', () => {
  const mezcla = [
    { idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: '10' },
    { idSecretaria: 'S2', nombreSecretaria: 'Álvaro', valorStr: 'doce' },
    { idSecretaria: 'S4', nombreSecretaria: 'Ñoño', valorStr: '1,2,3' },
  ];
  it('RF-61 · un valor inválido no impide registrar el resto de la remesa', () => {
    const env = crearEntorno();
    expect(enviar(env, envio({ valores: mezcla }))).toEqual({ ok: true, batchId: BATCH, written: 1, errors: 2 });
    expect(datos(env).map((d) => d.ID_Secretaria)).toEqual(['S1']);
  });
  it('RF-60 · cada inválido queda como incidencia con persona, concepto y valor recibido', () => {
    const env = crearEntorno();
    enviar(env, envio({ valores: mezcla }));
    expect(errores(env).map(({ Timestamp, ...r }) => r)).toEqual([
      { Batch_ID: BATCH, ID_Responsable: 'R1', Mes: 3, ID_Concepto: 'C1', ID_Secretaria: 'S2', Valor_Intentado: 'doce', Error: 'Valor no numérico' },
      { Batch_ID: BATCH, ID_Responsable: 'R1', Mes: 3, ID_Concepto: 'C1', ID_Secretaria: 'S4', Valor_Intentado: '1,2,3', Error: 'Valor no numérico' },
    ]);
  });
  it('el log indica cuántos errores hubo y mantiene Resultado OK si algo se escribió', () => {
    const env = crearEntorno();
    enviar(env, envio({ valores: mezcla }));
    expect(logs(env)[0]).toMatchObject({ 'Nº_Registros': 1, Resultado: 'OK', Mensaje: 'OK con 2 error(es) en Errores.' });
  });
  it('si TODO es inválido no se escribe Data, se registran los errores y el log queda como ERROR (ok:true, written 0)', () => {
    const env = crearEntorno();
    const r = enviar(env, envio({ valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: 'x' }] }));
    expect(r).toEqual({ ok: true, batchId: BATCH, written: 0, errors: 1 });
    expect(env.data().getLastRow()).toBe(1);
    expect(logs(env)[0]).toMatchObject({ 'Nº_Registros': 0, Resultado: 'ERROR', Mensaje: 'OK con 1 error(es) en Errores.' });
  });
  it('en TOTAL un valor inválido sigue siendo error (no se convierte en 0)', () => {
    const env = crearEntorno();
    const r = enviar(env, envio({ modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion: 'TOTAL', valores: mezcla }));
    expect(r.errors).toBe(2);
    expect(r.written).toBe(1);
  });
  it('los errores se añaden sin pisar incidencias anteriores', () => {
    const env = crearEntorno();
    env.errores().appendRow(['t', 'B0', 'R1', 2, 'C1', 'S1', 'zz', 'Valor no numérico']);
    enviar(env, envio({ valores: mezcla }));
    expect(env.errores().getLastRow()).toBe(4);
    expect(env.errores().volcar()[1][1]).toBe('B0');
  });
});

describe('correcciones · RF-08 · RNF-06 · una corrección AÑADE, no sustituye', () => {
  it('conserva el envío original intacto y añade las filas enlazadas con Modo y Corrige_Batch_ID', () => {
    const env = crearEntorno();
    const original = enviar(env, envio());
    env.e.ejecutar('Math.random = () => 0.5');
    fijarHora(env, '2026-03-16T10:00:00Z');
    const antes = env.data().volcar().map((f) => [...f]);
    const corr = enviar(env, envio({ modo: 'CORRECCION', corrigeBatchId: original.batchId, tipoCorreccion: 'PARCIAL', valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Ficticia, Zoe', valorStr: '120' }] }));
    const despues = env.data().volcar();
    expect(despues.slice(0, antes.length)).toEqual(antes);
    expect(despues).toHaveLength(antes.length + 1);
    expect(datos(env).at(-1)).toMatchObject({ Batch_ID: corr.batchId, Modo: 'CORRECCION', Corrige_Batch_ID: BATCH, Valor: 120 });
  });
  it('el log distingue la acción CORRECCION y guarda el tipo (PARCIAL/TOTAL en mayúsculas)', () => {
    const env = crearEntorno();
    enviar(env, envio({ modo: 'CORRECCION', corrigeBatchId: 'B1', tipoCorreccion: 'total' }));
    expect(logs(env)[0]).toMatchObject({ 'Acción': 'CORRECCION', Tipo_Correccion: 'TOTAL' });
  });
  it('reenviar el mismo mes/año/concepto en modo NUEVO no sobrescribe: añade otra remesa', () => {
    const env = crearEntorno();
    enviar(env, envio());
    enviar(env, envio({ valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Ficticia, Zoe', valorStr: '999' }] }));
    expect(datos(env).map((d) => d.Valor)).toEqual([100, 250.5, 999]);
    expect(logs(env)).toHaveLength(2);
  });
});

describe('concurrencia · RNF-04', () => {
  it.fails('DEFECTO · RNF-04: la escritura no toma el bloqueo del script (dos envíos simultáneos pueden pisarse la misma fila)', () => {
    const env = crearEntorno();
    env.e.ejecutar(`globalThis.__bloqueos = 0; (function(){ const orig = LockService.getScriptLock;
      LockService.getScriptLock = function(){ __bloqueos++; return orig(); }; })()`);
    enviar(env, envio());
    expect(env.e.valor('__bloqueos')).toBeGreaterThan(0);
  });
  it.fails('DEFECTO · RNF-04: con el bloqueo ocupado el envío debería rechazarse sin escribir', () => {
    const env = crearEntorno();
    env.g.estado.bloqueoOcupado = true;
    const r = enviar(env, envio());
    expect(r.ok).toBe(false);
  });
});
