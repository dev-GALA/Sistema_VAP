// Integración · correo de confirmación de cada envío (RF-07 · RF-59 · RNF-12 · SSD §6.1.2).
import { describe, expect, it } from 'vitest';
import { CONFIG, CONC1, RESP1, crearEntorno, envio } from './ayudas.js';

const enviar = (env, p = envio()) => env.llamar('vap_submitBatch', p);

describe('destinatarios · SSD §6.1.2', () => {
  it('RF-07 · se manda un correo por envío: Para = responsable + seguimiento activo; CC = copia general', () => {
    const env = crearEntorno();
    enviar(env);
    expect(env.g.estado.correos).toHaveLength(1);
    const [c] = env.g.estado.correos;
    expect(c.to).toBe('ana@gala.test,seguimiento@gala.test');
    expect(c.cc).toBe('copia@gala.test');
  });
  it('las filas inactivas, de otro tipo o sin email de Config no reciben nada', () => {
    const env = crearEntorno();
    enviar(env);
    const { to, cc } = env.g.estado.correos[0];
    for (const no of ['apagado@gala.test', 'otro@gala.test']) expect(`${to},${cc}`).not.toContain(no);
  });
  it('sin hoja Config solo recibe el responsable y no hay CC', () => {
    const env = crearEntorno({ sinHojas: ['Config'] });
    enviar(env);
    expect(env.g.estado.correos[0].to).toBe('ana@gala.test');
    expect(env.g.estado.correos[0]).not.toHaveProperty('cc');
  });
  it('sin copia general activa no se añade CC', () => {
    const env = crearEntorno({ bbdd: { Config: CONFIG.filter((f) => f[0] !== 'COPIA_GENERAL_COMPLEMENTOS_SECRETARIAS') } });
    enviar(env);
    expect(env.g.estado.correos[0]).not.toHaveProperty('cc');
  });
  it('una fila de Config con email vacío se descarta y se recortan espacios', () => {
    const env = crearEntorno({ bbdd: { Config: [['t', '', ''],
      ['GESTION_SEGUIMIENTO_COMPLEMENTOS_SECRETARIAS', '', true],
      [' GESTION_SEGUIMIENTO_COMPLEMENTOS_SECRETARIAS ', ' gestion@gala.test ', 'si']] } });
    enviar(env);
    expect(env.g.estado.correos[0].to).toBe('ana@gala.test,gestion@gala.test');
  });
  it('getNotificationEmailsByType_ devuelve [] para un tipo sin filas', () => {
    expect(crearEntorno().llamar('getNotificationEmailsByType_', 'NO_EXISTE')).toEqual([]);
  });
  it('getNotificationEmailsByType_ lee posicionalmente: la fila 1 (título) nunca cuenta', () => {
    const env = crearEntorno({ bbdd: { Config: [['GESTION_SEGUIMIENTO_COMPLEMENTOS_SECRETARIAS', 'titulo@gala.test', true], ['GESTION_SEGUIMIENTO_COMPLEMENTOS_SECRETARIAS', 'dato@gala.test', true]] } });
    expect(env.llamar('getNotificationEmailsByType_', 'GESTION_SEGUIMIENTO_COMPLEMENTOS_SECRETARIAS')).toEqual(['dato@gala.test']);
  });
});

describe('contenido del correo · RF-07 · RF-59', () => {
  it('el asunto lleva periodo, concepto y Batch_ID', () => {
    const env = crearEntorno();
    const r = enviar(env);
    expect(env.g.estado.correos[0].subject).toBe(`VAP | Confirmación | 03/2026 | Aptos | ${r.batchId}`);
  });
  it('el periodo siempre lleva el mes con dos cifras', () => {
    const env = crearEntorno();
    enviar(env, envio({ month: 12 }));
    expect(env.g.estado.correos[0].subject).toContain('| 12/2026 |');
  });
  it('el cuerpo resume el envío: Batch_ID, responsable, periodo, registros, errores y hora de Madrid', () => {
    const env = crearEntorno();
    const r = enviar(env, envio({ valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: '5' }, { idSecretaria: 'S2', nombreSecretaria: 'Á', valorStr: 'x' }] }));
    const html = env.g.estado.correos[0].htmlBody;
    expect(html).toContain(r.batchId);
    expect(html).toContain('Ana Prueba (ana@gala.test)');
    expect(html).toContain('ENVÍO MENSUAL');
    expect(html).toMatch(/Nº registros<\/td>\s*<td[^>]*>1</);
    expect(html).toMatch(/Nº errores<\/td>\s*<td[^>]*>1</);
    expect(html).toContain('15/03/2026 11:00:00');
  });
  it('en una corrección indica CORRECCIÓN, el tipo y el lote corregido', () => {
    const env = crearEntorno();
    enviar(env, envio({ modo: 'CORRECCION', corrigeBatchId: 'BATCH_ORIGINAL', tipoCorreccion: 'TOTAL' }));
    const html = env.g.estado.correos[0].htmlBody;
    expect(html).toContain('CORRECCIÓN');
    expect(html).toMatch(/Tipo corrección<\/td>\s*<td[^>]*>TOTAL</);
    expect(html).toMatch(/Corrige Batch_ID<\/td>\s*<td[^>]*>BATCH_ORIGINAL</);
  });
  it('en un envío nuevo, tipo y lote corregido salen como «—»', () => {
    const env = crearEntorno();
    enviar(env);
    const html = env.g.estado.correos[0].htmlBody;
    expect(html).toMatch(/Tipo corrección<\/td>\s*<td[^>]*>—</);
    expect(html).toMatch(/Corrige Batch_ID<\/td>\s*<td[^>]*>—</);
  });
  it('un envío rechazado por validación NO manda correo', () => {
    const env = crearEntorno();
    enviar(env, envio({ month: 13 }));
    expect(env.g.estado.correos).toEqual([]);
  });
  it('sendNotificationEmail_ sin email del responsable devuelve false y no envía', () => {
    const env = crearEntorno();
    const ok = env.e.llamar('sendNotificationEmail_', { ...envio(), responsable: { id: 'R1', nombre: 'Ana', email: '  ' } }, { batchId: 'B', written: 1, errors: 0 });
    expect(ok).toBe(false);
    expect(env.g.estado.correos).toEqual([]);
  });
  it('sendNotificationEmail_ usa el id del concepto si falta su nombre, y «-» si faltan ambos', () => {
    const env = crearEntorno();
    env.e.llamar('sendNotificationEmail_', { ...envio(), concepto: { id: 'C7' } }, { batchId: 'B', written: 1, errors: 0 });
    env.e.llamar('sendNotificationEmail_', { ...envio(), concepto: {} }, { batchId: 'B', written: 1, errors: 0 });
    expect(env.g.estado.correos.map((c) => c.subject.split(' | ')[3])).toEqual(['C7', '-']);
  });
  it('sendNotificationEmail_ devuelve true si lo envía', () => {
    const env = crearEntorno();
    expect(env.e.llamar('sendNotificationEmail_', envio(), { batchId: 'B', written: 1, errors: 0 })).toBe(true);
  });
  it('el correo enlaza a la consulta de envíos y recuerda conservarlo 3 meses', () => {
    const env = crearEntorno();
    enviar(env);
    expect(env.g.estado.correos[0].htmlBody).toContain('?page=consultas');
    expect(env.g.estado.correos[0].htmlBody).toContain('máximo 3 meses');
  });
});

describe('fallos del correo · RNF-12 · el envío ya guardado no se pierde', () => {
  const romperCorreo = (env) => env.e.ejecutar(`MailApp.sendEmail = function(){ throw new Error('cuota de correo agotada'); }`);
  it('si MailApp falla, el envío sigue siendo correcto y los datos quedan guardados', () => {
    const env = crearEntorno();
    romperCorreo(env);
    const r = enviar(env);
    expect(r).toMatchObject({ ok: true, written: 2, errors: 0 });
    expect(env.data().getLastRow()).toBe(3);
    expect(env.logs().getLastRow()).toBe(2);
  });
  it('el fallo del correo deja rastro en el registro de Apps Script', () => {
    const env = crearEntorno();
    romperCorreo(env);
    enviar(env);
    expect(env.g.estado.logs.join('\n')).toContain('cuota de correo agotada');
  });
  it('si falla la lectura de Config tampoco se pierde el envío', () => {
    const env = crearEntorno();
    env.g.estado.libros.delete(env.e.valor('BBDD_SPREADSHEET_ID'));
    expect(enviar(env).ok).toBe(true);
    expect(env.g.estado.correos).toEqual([]);
  });
  it('sendNotificationEmail_ devuelve false (no lanza) cuando el envío falla', () => {
    const env = crearEntorno();
    romperCorreo(env);
    expect(env.e.llamar('sendNotificationEmail_', envio(), { batchId: 'B', written: 1, errors: 0 })).toBe(false);
  });
  it('un payload sin responsable no rompe el cálculo del correo', () => {
    const env = crearEntorno();
    expect(env.e.llamar('sendNotificationEmail_', { year: 2026, month: 3 }, { batchId: 'B', written: 0, errors: 0 })).toBe(false);
  });
});

describe('seguridad del contenido · RNF-09', () => {
  it.fails('DEFECTO · el nombre del responsable se inserta SIN escapar en el HTML del correo (inyección de HTML)', () => {
    const env = crearEntorno();
    enviar(env, envio({ responsable: { ...RESP1, nombre: '<img src=x onerror=alert(1)>' } }));
    expect(env.g.estado.correos[0].htmlBody).not.toContain('<img src=x');
  });
  it.fails('DEFECTO · el nombre del concepto se inserta SIN escapar en el HTML del correo', () => {
    const env = crearEntorno();
    enviar(env, envio({ concepto: { ...CONC1, concepto: '<script>alert(1)</script>' } }));
    expect(env.g.estado.correos[0].htmlBody).not.toContain('<script>alert(1)</script>');
  });
  it.fails('DEFECTO · RF-58: el enlace del correo es una URL de despliegue fija en el código, no la de la webapp actual', () => {
    const env = crearEntorno();
    enviar(env);
    expect(env.g.estado.correos[0].htmlBody).toContain(`${env.g.estado.urlWebapp}?page=consultas`);
  });
});
