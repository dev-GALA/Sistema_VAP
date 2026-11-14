// Integración · quién puede reportar y qué (RF-06 · RF-57 · RNF-09 · ADR-0003 · ADR-0002).
import { describe, expect, it } from 'vitest';
import { crearEntorno, RESPONSABLES } from './ayudas.js';

describe('vap_bootstrapForEmail · validación del responsable (RF-06 · ADR-0003)', () => {
  it.each([[''], ['   '], [null], [undefined]])('email «%s» → «Email vacío.»', (email) => {
    expect(crearEntorno().llamar('vap_bootstrapForEmail', email)).toEqual({ ok: false, error: 'Email vacío.' });
  });
  it('un email que no está en la BBDD no se autoriza', () => {
    expect(crearEntorno().llamar('vap_bootstrapForEmail', 'intruso@gala.test'))
      .toEqual({ ok: false, error: 'Email no autorizado o manager inactivo en BBDD.' });
  });
  it('un responsable INACTIVO no se autoriza aunque tenga conceptos', () => {
    expect(crearEntorno().llamar('vap_bootstrapForEmail', 'cleo@gala.test').ok).toBe(false);
  });
  it('ignora mayúsculas y espacios del email tecleado', () => {
    const r = crearEntorno().llamar('vap_bootstrapForEmail', '  ANA@Gala.TEST ');
    expect(r.ok).toBe(true);
    expect(r.responsable).toEqual({ id: 'R1', nombre: 'Ana Prueba', email: 'ana@gala.test' });
  });
  it('también casa si la BBDD guarda el email con mayúsculas y espacios', () => {
    const env = crearEntorno({ bbdd: { VAP_Responsables: [...RESPONSABLES, ['R9', ' Eva Prueba ', '  EVA@Gala.Test ', true]] } });
    env.bbddHoja('VAP_Responsables_Complementos').appendRow(['R9', 'C1', true]);
    const r = env.llamar('vap_bootstrapForEmail', 'eva@gala.test');
    expect(r.responsable).toEqual({ id: 'R9', nombre: 'Eva Prueba', email: 'EVA@Gala.Test' });
  });
  it('devuelve solo los conceptos ACTIVOS asignados y ACTIVOS (ni concepto retirado ni asignación inactiva), ordenados por nombre', () => {
    const r = crearEntorno().llamar('vap_bootstrapForEmail', 'ana@gala.test');
    expect(r.conceptos).toEqual([
      { id: 'C1', concepto: 'Aptos', tipoValor: 'IMPORTE' },
      { id: 'C2', concepto: 'Sábados 50', tipoValor: 'IMPORTE' },
    ]);
  });
  it('un responsable no ve conceptos que son de otro (R2 solo ve Reseñas)', () => {
    const r = crearEntorno().llamar('vap_bootstrapForEmail', 'beto@gala.test');
    expect(r.conceptos.map((c) => c.id)).toEqual(['C3']);
  });
  it('acepta marcas «SI» en Activa (truthy_)', () => {
    expect(crearEntorno().llamar('vap_bootstrapForEmail', 'beto@gala.test').ok).toBe(true);
  });
  it('RF-06 · un responsable válido sin conceptos asignados recibe un aviso explícito', () => {
    expect(crearEntorno().llamar('vap_bootstrapForEmail', 'dani@gala.test'))
      .toEqual({ ok: false, error: 'Manager válido, pero sin conceptos activos asignados.' });
  });
  it('si todas sus asignaciones están inactivas también se informa de que no tiene ninguno', () => {
    const env = crearEntorno();
    env.bbddHoja('VAP_Responsables_Complementos').cargar([['ID_Respon', 'ID_Concepto', 'Activa'], ['R1', 'C1', false]]);
    expect(env.llamar('vap_bootstrapForEmail', 'ana@gala.test').error).toMatch(/sin conceptos/);
  });
  it('descarta conceptos sin id o sin nombre y recorta espacios', () => {
    const env = crearEntorno();
    env.bbddHoja('VAP_Complementos_Secretarias').cargar([
      ['ID_Concepto', 'Concepto', 'Tipo_Valor', 'Activo'],
      [' C1 ', ' Aptos ', '', true], ['', 'Sin id', 'X', true], ['C2', '', 'X', true],
    ]);
    const r = env.llamar('vap_bootstrapForEmail', 'ana@gala.test');
    expect(r.conceptos).toEqual([{ id: 'C1', concepto: 'Aptos', tipoValor: '' }]);
  });
  it('RF-57 · dar de alta y asignar un concepto nuevo es solo cambiar datos', () => {
    const env = crearEntorno();
    env.bbddHoja('VAP_Complementos_Secretarias').appendRow(['C9', 'Concepto Nuevo', 'IMPORTE', true]);
    env.bbddHoja('VAP_Responsables_Complementos').appendRow(['R1', 'C9', true]);
    expect(env.llamar('vap_bootstrapForEmail', 'ana@gala.test').conceptos.map((c) => c.id)).toEqual(['C1', 'C9', 'C2']);
  });
  it('lista solo secretarias de ALTA con id y nombre, ordenadas alfabéticamente en español', () => {
    const r = crearEntorno().llamar('vap_bootstrapForEmail', 'ana@gala.test');
    expect(r.secretarias).toEqual([
      { id: 'S2', nombre: 'Álvaro Falso' },
      { id: 'S4', nombre: 'Ñoño Inventado' },
      { id: 'S1', nombre: 'Zoe Ficticia' },
    ]);
  });
  it('incluye los valores por defecto de año y mes', () => {
    expect(crearEntorno().llamar('vap_bootstrapForEmail', 'ana@gala.test').defaults).toEqual({ year: 2026, month: 3 });
  });
  it('si falta una hoja de la BBDD el error se propaga con un mensaje claro (la pantalla lo muestra)', () => {
    const env = crearEntorno({ sinHojas: ['VAP_Secretarias'] });
    expect(() => env.e.llamar('vap_bootstrapForEmail', 'ana@gala.test')).toThrow('Hoja no encontrada en BBDD.');
  });
  it('si no se puede abrir la BBDD el error se propaga', () => {
    const env = crearEntorno();
    env.g.estado.libros.delete(env.e.valor('BBDD_SPREADSHEET_ID'));
    expect(() => env.e.llamar('vap_bootstrapForEmail', 'ana@gala.test')).toThrow(/no existe o no hay acceso/);
  });
  it('una BBDD de responsables vacía no autoriza a nadie', () => {
    const env = crearEntorno({ bbdd: { VAP_Responsables: [['ID_Respon', 'Nombre', 'Email', 'Activa']] } });
    expect(env.llamar('vap_bootstrapForEmail', 'ana@gala.test').ok).toBe(false);
  });
  it('lee por nombre de cabecera: reordenar columnas de la BBDD no cambia el resultado (RNF-02)', () => {
    const env = crearEntorno({ bbdd: { VAP_Responsables: [['Activa', 'Email', 'Nombre', 'ID_Respon'], [true, 'ana@gala.test', 'Ana Prueba', 'R1']] } });
    expect(env.llamar('vap_bootstrapForEmail', 'ana@gala.test').responsable.id).toBe('R1');
  });
});

describe('autorización en el servidor · ADR-0002 · RNF-09', () => {
  it.fails('DEFECTO · ADR-0002/RF-06: vap_submitBatch acepta un responsable que no existe en la BBDD', () => {
    const env = crearEntorno();
    const r = env.llamar('vap_submitBatch', {
      year: 2026, month: 3, responsable: { id: 'R99', nombre: 'Falso', email: 'falso@gala.test' },
      concepto: { id: 'C1', concepto: 'Aptos' }, modo: 'NUEVO', valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: '1' }],
    });
    expect(r.ok).toBe(false);
  });
  it.fails('DEFECTO · RF-06: vap_submitBatch acepta un concepto que el responsable NO tiene asignado (R2 reporta «Aptos»)', () => {
    const env = crearEntorno();
    const r = env.llamar('vap_submitBatch', {
      year: 2026, month: 3, responsable: { id: 'R2', nombre: 'Beto Prueba', email: 'beto@gala.test' },
      concepto: { id: 'C1', concepto: 'Aptos' }, modo: 'NUEVO', valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: '1' }],
    });
    expect(r.ok).toBe(false);
  });
  it.fails('DEFECTO · RNF-09: vap_submitBatch acepta a un responsable INACTIVO (baja) con solo conocer su id y email', () => {
    const env = crearEntorno();
    const r = env.llamar('vap_submitBatch', {
      year: 2026, month: 3, responsable: { id: 'R3', nombre: 'Cleo Inactiva', email: 'cleo@gala.test' },
      concepto: { id: 'C1', concepto: 'Aptos' }, modo: 'NUEVO', valores: [{ idSecretaria: 'S1', nombreSecretaria: 'Zoe', valorStr: '1' }],
    });
    expect(r.ok).toBe(false);
  });
  it.fails('DEFECTO · RNF-09: vap_consultaBatches devuelve los envíos de CUALQUIER responsable a quien solo conozca su id', () => {
    const env = crearEntorno({ usuario: 'beto@gala.test' });
    env.data().cargar([
      ['Timestamp', 'Batch_ID', 'ID_Responsable', 'Año', 'Mes', 'Concepto', 'Modo', 'Corrige_Batch_ID', 'ID_Secretaria', 'Nombre_Secretaria', 'Valor'],
      [env.fecha('2026-03-10T09:00:00Z'), 'B1', 'R1', 2026, 3, 'Aptos', 'NUEVO', '', 'S1', 'Zoe Ficticia', 10],
    ]);
    const r = env.llamar('vap_consultaBatches', { idResponsable: 'R1', year: 2026, month: 3 });
    expect(r.ok).toBe(false); // Beto (sesión activa) no debería ver lo de Ana
  });
});
