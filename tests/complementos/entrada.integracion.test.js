// Integración · doGet (varias páginas) y menú (RF-58 · ADR-0002 · RNF-12).
import { describe, expect, it } from 'vitest';
import { crearEntorno, plantillasReales } from './ayudas.js';

const pagina = (env, parametros) => env.e.llamar('doGet', parametros);

describe('doGet · enrutado de páginas', () => {
  it('?page=portal sirve el portal con su título (RF-58)', () => {
    const p = pagina(crearEntorno({ plantillas: true }), { parameter: { page: 'portal' } });
    expect(p.getTitle()).toBe('VAP - Portal Complementos Secretarias');
    expect(p.getContent()).toContain('Reportar complementos');
  });
  it('?page=consultas sirve la consulta de envíos', () => {
    const p = pagina(crearEntorno({ plantillas: true }), { parameter: { page: 'consultas' } });
    expect(p.getTitle()).toBe('VAP - Consulta de envíos');
    expect(p.getContent()).toContain('Consulta de Envíos');
  });
  it('sin parámetros sirve el reporte (acceso directo existente, RF-58)', () => {
    const p = pagina(crearEntorno({ plantillas: true }), { parameter: {} });
    expect(p.getTitle()).toBe('VAP - Reporte Managers');
    expect(p.getContent()).toContain('Reporte de Complementos');
  });
  it('sin evento (e undefined) o sin parameter también sirve el reporte', () => {
    const env = crearEntorno({ plantillas: true });
    expect(pagina(env, undefined).getTitle()).toBe('VAP - Reporte Managers');
    expect(pagina(env, {}).getTitle()).toBe('VAP - Reporte Managers');
  });
  it('una página desconocida cae en el reporte, nunca en un error', () => {
    const env = crearEntorno({ plantillas: true });
    expect(pagina(env, { parameter: { page: 'nada' } }).getTitle()).toBe('VAP - Reporte Managers');
  });
  it('caracteriza: el nombre de página distingue mayúsculas («PORTAL» no es el portal)', () => {
    expect(pagina(crearEntorno({ plantillas: true }), { parameter: { page: 'PORTAL' } }).getTitle()).toBe('VAP - Reporte Managers');
  });
  it('las tres páginas permiten incrustarse (ALLOWALL)', () => {
    const env = crearEntorno({ plantillas: true });
    for (const page of ['portal', 'consultas', 'index']) expect(pagina(env, { parameter: { page } })._xframe).toBe('ALLOWALL');
  });
  it('el portal resuelve la URL de la webapp en los dos enlaces sin IDs fijos (RF-58)', () => {
    const env = crearEntorno({ plantillas: true });
    const html = pagina(env, { parameter: { page: 'portal' } }).getContent();
    const base = env.g.estado.urlWebapp;
    expect(html).toContain(`href="${base}"`);
    expect(html).toContain(`href="${base}?page=consultas"`);
  });
  it('si falta el HTML correspondiente, doGet falla con el nombre del archivo', () => {
    const env = crearEntorno();
    expect(() => pagina(env, { parameter: { page: 'portal' } })).toThrow(/Portal/);
  });
  it('las plantillas reales tienen los tres nombres que usa doGet', () => {
    expect(Object.keys(plantillasReales()).sort()).toEqual(['Consultas', 'Index', 'Portal']);
  });
});

describe('onOpen · menú de la hoja', () => {
  it('crea el menú «Sistema VAP» con una única acción: generar el Excel mensual', () => {
    const env = crearEntorno();
    env.e.llamar('onOpen');
    expect(env.g.estado.menus).toEqual([{ nombre: 'Sistema VAP', items: [{ texto: 'Generar Excel mensual', funcion: 'vap_generarExcelMensual' }] }]);
  });
  it('cada función enlazada desde el menú existe en el script', () => {
    const env = crearEntorno();
    env.e.llamar('onOpen');
    for (const item of env.g.estado.menus[0].items) expect(env.e.ejecutar(`typeof ${item.funcion}`)).toBe('function');
  });
  it('onOpen no escribe nada en las hojas', () => {
    const env = crearEntorno();
    env.e.llamar('onOpen');
    expect(env.g.estado.escrituras).toEqual([]);
  });
});
