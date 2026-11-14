// Pruebas del propio soporte: si los dobles mienten, todas las demás pruebas mienten.
import { describe, expect, it } from 'vitest';
import { crearGoogle, formatearFecha, analizarCsv } from './google.js';
import { evaluarPlantilla } from './plantilla.js';
import { CODIGO, cargarGs, plano } from './cargar-gs.js';

describe('dobles de hojas', () => {
  it('getValues devuelve vacíos fuera de lo escrito y setValues exige las mismas dimensiones', () => {
    const g = crearGoogle();
    const hoja = g.libro('L1').conHoja('H', [['a', 'b'], ['c']]);
    expect(hoja.getRange(1, 1, 2, 3).getValues()).toEqual([['a', 'b', ''], ['c', '', '']]);
    expect(() => hoja.getRange(1, 1, 1, 2).setValues([['x']])).toThrow(/2 columnas/);
  });
  it('getLastRow ignora filas vacías y appendRow escribe tras la última', () => {
    const hoja = crearGoogle().libro('L').conHoja('H', [['a'], [''], ['']]);
    expect(hoja.getLastRow()).toBe(1);
    hoja.appendRow(['b']);
    expect(hoja.volcar()).toEqual([['a'], ['b']]);
  });
  it('getSheetByName devuelve null si no existe y insertSheet rechaza duplicados', () => {
    const libro = crearGoogle().libro('L');
    expect(libro.getSheetByName('X')).toBeNull();
    libro.insertSheet('X');
    expect(() => libro.insertSheet('X')).toThrow(/Ya existe/);
  });
  it('openById falla con un ID desconocido', () => {
    expect(() => crearGoogle().global.SpreadsheetApp.openById('no')).toThrow(/no existe/);
  });
  it('acepta métodos de formato y los registra sin cambiar datos', () => {
    const g = crearGoogle();
    const hoja = g.libro('L').insertSheet('H');
    hoja.getRange('A1').setBackground('red').setFontWeight('bold');
    expect(hoja.getLastRow()).toBe(0);
    expect(g.estado.formato.map((f) => f.m)).toEqual(['setBackground', 'setFontWeight']);
  });
});

describe('utilidades puras', () => {
  it('formatearFecha respeta el huso horario y los literales', () => {
    const f = new Date('2026-03-15T23:30:00Z');
    expect(formatearFecha(f, 'Europe/Madrid', 'yyyy-MM-dd HH:mm')).toBe('2026-03-16 00:30');
    expect(formatearFecha(f, 'UTC', "dd/MM/yyyy 'a las' HH")).toBe('15/03/2026 a las 23');
    expect(formatearFecha(f, 'UTC', 'MMMM yyyy')).toBe('marzo 2026');
  });
  it('analizarCsv gestiona comillas, separador y saltos de línea', () => {
    expect(analizarCsv('a;"b;c";d\r\n1;2;3\n', ';')).toEqual([['a', 'b;c', 'd'], ['1', '2', '3']]);
  });
  it('evaluarPlantilla escapa <?= ?>, no escapa <?!= ?> y ejecuta <? ?>', () => {
    const html = '<? for (const x of xs) { ?><i><?= x ?></i><? } ?><?!= crudo ?>';
    expect(evaluarPlantilla(html, { xs: ['<a>', 'b'], crudo: '<b>' })).toBe('<i>&lt;a&gt;</i><i>b</i><b>');
  });
});

describe('cargador de .gs', () => {
  it('carga todos los archivos del repo sin modificarlos y deja sus funciones a mano', () => {
    for (const ruta of Object.values(CODIGO)) {
      const entorno = cargarGs(ruta);
      expect(entorno.google.estado.logs).toEqual([]);
    }
  });
  it('fija la hora: new Date() es repetible', () => {
    const e = cargarGs([], { ahora: '2026-01-02T03:04:05Z' });
    expect(plano(e.ejecutar('new Date().toISOString()'))).toBe('2026-01-02T03:04:05.000Z');
    expect(e.ejecutar('Date.now()')).toBe(new Date('2026-01-02T03:04:05Z').getTime());
  });
  it('los UUID son deterministas', () => {
    const g = crearGoogle();
    expect([g.global.Utilities.getUuid(), g.global.Utilities.getUuid()]).toEqual(['uuid-0001', 'uuid-0002']);
  });
});
