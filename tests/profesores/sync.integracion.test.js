// Integración de la sincronización: funciones con efectos sobre formulario, hojas, caché y disparadores.
// RF-02 (lista sincronizada) · RF-03 (ID en la respuesta) · RF-47 (traza) · ADR-0007/0008.
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { entornoSync, eventoEnvio, profesor } from './ayudas.js';

const PROFES = [profesor('Ana Beta Ficticia', 'A_1'), profesor('Carlos Dos Ficticio', 'B_2'), profesor('Baja Ficticia', 'C_3', false)];

describe('actualizarPreguntaProfesores · RF-02', () => {
  it('carga en la pregunta «SELECCIONE EL PROFESOR» los nombres activos y deja traza', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('actualizarPreguntaProfesores');
    expect(e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']).toStrictEqual(['Ana Beta Ficticia', 'Carlos Dos Ficticio']);
    expect(e.google.estado.logs).toContain('Formulario actualizado correctamente. Opciones cargadas: 2');
  });
  it('pide al formulario solo preguntas de tipo lista', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('actualizarPreguntaProfesores');
    expect(e.formulario.peticionesDeItems).toStrictEqual(['LIST']);
  });
  it('solo modifica la pregunta de profesores, no otras listas del formulario', () => {
    const e = entornoSync({ profesores: PROFES, titulosFormulario: ['OTRA LISTA', 'SELECCIONE EL PROFESOR'] });
    e.llamar('actualizarPreguntaProfesores');
    expect(Object.keys(e.formulario.opcionesPorTitulo)).toStrictEqual(['SELECCIONE EL PROFESOR']);
  });
  it('es idempotente: ejecutarla dos veces deja el mismo estado', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('actualizarPreguntaProfesores');
    const primera = [...e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']];
    e.llamar('actualizarPreguntaProfesores');
    expect(e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']).toStrictEqual(primera);
  });
  it('una baja posterior (casilla Alta desmarcada) desaparece de la lista en la siguiente sincronización', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('actualizarPreguntaProfesores');
    e.hojaProfesores.getRange(2, 7).setValue(false);
    e.llamar('actualizarPreguntaProfesores');
    expect(e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']).toStrictEqual(['Carlos Dos Ficticio']);
  });
  it('sin profesores activos lanza y NO toca el formulario (no vacía la lista por error)', () => {
    const e = entornoSync({ profesores: [profesor('Baja Ficticia', 'A_1', false)] });
    e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR'] = ['Previa'];
    expect(() => e.llamar('actualizarPreguntaProfesores')).toThrow('No se han encontrado profesores activos válidos');
    expect(e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']).toStrictEqual(['Previa']);
    expect(e.google.estado.logs).toContain('ERROR actualizarPreguntaProfesores: No se han encontrado profesores activos válidos');
  });
  it('lanza si el formulario no tiene la pregunta lista con ese título', () => {
    const e = entornoSync({ profesores: PROFES, titulosFormulario: ['OTRA'] });
    expect(() => e.llamar('actualizarPreguntaProfesores')).toThrow('No se encuentra la pregunta tipo lista con título "SELECCIONE EL PROFESOR"');
  });
  it('lanza si el formulario no se puede abrir (error del servicio) y registra el error', () => {
    const e = entornoSync({ profesores: PROFES, conFormulario: false });
    expect(() => e.llamar('actualizarPreguntaProfesores')).toThrow(/No se puede abrir el formulario/);
    expect(e.google.estado.logs.some((l) => l.startsWith('ERROR actualizarPreguntaProfesores:'))).toBe(true);
  });
  it('propaga el error si falla la hoja de personal', () => {
    const e = entornoSync({ conHojaProfesores: false });
    expect(() => e.llamar('actualizarPreguntaProfesores')).toThrow('No existe la hoja "VAP_Profesores"');
  });
  it('no escribe nada en las hojas (solo cambia el formulario)', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('actualizarPreguntaProfesores');
    expect(e.google.estado.escrituras).toStrictEqual([]);
  });
});

describe('onSpreadsheetEditTrigger · disparador por edición', () => {
  const evento = (e, nombreHoja) => ({ range: { getSheet: () => ({ getName: () => nombreHoja }) } });
  it.each([[undefined], [null], [{}]])('evento %j sin rango: no hace nada', (ev) => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetEditTrigger', ev);
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
  it('una edición en otra hoja se ignora y no consume la ventana de frecuencia', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetEditTrigger', evento(e, 'Otra hoja'));
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
    expect(e.google.estado.cache).toStrictEqual({});
  });
  it('una hoja sin objeto hoja (getSheet nulo) se ignora', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetEditTrigger', { range: { getSheet: () => null } });
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
  it('una edición en VAP_Profesores sincroniza el formulario y anota la causa', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetEditTrigger', evento(e, 'VAP_Profesores'));
    expect(e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']).toHaveLength(2);
    expect(e.google.estado.logs).toContain('Cambio detectado en VAP_Profesores (edición). Sincronizando formulario...');
  });
  it('dos ediciones seguidas dentro de 30 s: solo la primera sincroniza', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetEditTrigger', evento(e, 'VAP_Profesores'));
    e.hojaProfesores.appendRow(profesor('Nueva Ficticia', 'D_4'));
    e.llamar('onSpreadsheetEditTrigger', evento(e, 'VAP_Profesores'));
    expect(e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']).toHaveLength(2);
    expect(e.google.estado.logs).toContain('Sincronización omitida por control de frecuencia');
  });
  it('si la sincronización falla, relanza el error y lo registra', () => {
    const e = entornoSync({ conHojaProfesores: false });
    expect(() => e.llamar('onSpreadsheetEditTrigger', evento(e, 'VAP_Profesores'))).toThrow('No existe la hoja');
    expect(e.google.estado.logs.some((l) => l.startsWith('ERROR onSpreadsheetEditTrigger:'))).toBe(true);
  });
});

describe('onSpreadsheetChangeTrigger · cambios estructurales', () => {
  it.each(['INSERT_ROW', 'REMOVE_ROW', 'INSERT_GRID', 'REMOVE_GRID'])('%s sincroniza', (tipo) => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetChangeTrigger', { changeType: tipo });
    expect(e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']).toHaveLength(2);
    expect(e.google.estado.logs).toContain(`Cambio estructural detectado (${tipo}). Sincronizando formulario...`);
  });
  it.each(['EDIT', 'FORMAT', 'OTHER', 'INSERT_COLUMN', 'REMOVE_COLUMN', undefined])('el tipo %s se ignora', (tipo) => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetChangeTrigger', { changeType: tipo });
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
  it('sin evento no hace nada', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetChangeTrigger');
    e.llamar('onSpreadsheetChangeTrigger', null);
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
  it('comparte la ventana de 30 s con el disparador de edición', () => {
    const e = entornoSync({ profesores: PROFES });
    e.llamar('onSpreadsheetEditTrigger', { range: { getSheet: () => ({ getName: () => 'VAP_Profesores' }) } });
    e.hojaProfesores.appendRow(profesor('Nueva Ficticia', 'D_4'));
    e.llamar('onSpreadsheetChangeTrigger', { changeType: 'INSERT_ROW' });
    expect(e.formulario.opcionesPorTitulo['SELECCIONE EL PROFESOR']).toHaveLength(2);
  });
  it('relanza y registra los errores', () => {
    const e = entornoSync({ conHojaProfesores: false });
    expect(() => e.llamar('onSpreadsheetChangeTrigger', { changeType: 'INSERT_ROW' })).toThrow();
    expect(e.google.estado.logs.some((l) => l.startsWith('ERROR onSpreadsheetChangeTrigger:'))).toBe(true);
  });
});

describe('obtenerHojaRespuestasDelFormulario_', () => {
  it('devuelve la hoja del libro vinculado que tiene la pregunta y «Marca temporal»', () => {
    const e = entornoSync();
    e.libroRespuestas.conHoja('Resumen', [['otra']]);
    expect(e.llamar('obtenerHojaRespuestasDelFormulario_').getName()).toBe('Respuestas de formulario 1');
  });
  it('salta hojas vacías', () => {
    const e = entornoSync();
    e.libroRespuestas.insertSheet('Vacía');
    expect(e.llamar('obtenerHojaRespuestasDelFormulario_').getName()).toBe('Respuestas de formulario 1');
  });
  it('lanza si el formulario no tiene hoja de respuestas vinculada', () => {
    const e = entornoSync();
    e.formulario.destino = '';
    expect(() => e.llamar('obtenerHojaRespuestasDelFormulario_')).toThrow('El formulario no tiene hoja de respuestas vinculada');
  });
  it('lanza si ninguna hoja tiene la pregunta y la marca temporal', () => {
    const e = entornoSync({ respuestas: [['Marca temporal', 'OTRA']] });
    expect(() => e.llamar('obtenerHojaRespuestasDelFormulario_')).toThrow('No se encontró la hoja de respuestas que contiene "SELECCIONE EL PROFESOR"');
  });
  it('lanza si falta «Marca temporal» aunque esté la pregunta', () => {
    const e = entornoSync({ respuestas: [['SELECCIONE EL PROFESOR']] });
    expect(() => e.llamar('obtenerHojaRespuestasDelFormulario_')).toThrow(/No se encontró la hoja de respuestas/);
  });
  it('lanza si el libro de respuestas no es accesible', () => {
    const e = entornoSync();
    e.google.estado.libros.delete('libro-respuestas');
    expect(() => e.llamar('obtenerHojaRespuestasDelFormulario_')).toThrow(/no existe o no hay acceso/);
  });
});

describe('onFormSubmit · RF-03 (ID_Profesor en la respuesta)', () => {
  const respuestas = [['Marca temporal', 'SELECCIONE EL PROFESOR'], ['09/03/2026 08:00:00', 'Carlos Dos Ficticio'], ['10/03/2026 10:15:30', 'Ana Beta Ficticia']];
  const ev = () => eventoEnvio([['SELECCIONE EL PROFESOR', 'Ana Beta Ficticia']]);

  it('crea la columna ID_Profesor si no existe y escribe el ID en la fila de la respuesta', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    e.llamar('onFormSubmit', ev());
    expect(e.hojaRespuestas.volcar()).toStrictEqual([
      ['Marca temporal', 'SELECCIONE EL PROFESOR', 'ID_Profesor'],
      ['09/03/2026 08:00:00', 'Carlos Dos Ficticio'],
      ['10/03/2026 10:15:30', 'Ana Beta Ficticia', 'A_1'],
    ]);
  });
  it('si la columna ID_Profesor ya existe la reutiliza sin crear otra', () => {
    const e = entornoSync({ profesores: PROFES, respuestas: [['Marca temporal', 'SELECCIONE EL PROFESOR', 'Otra', 'ID_Profesor'], ['10/03/2026 10:15:30', 'Ana Beta Ficticia', '', '']] });
    e.llamar('onFormSubmit', ev());
    expect(e.hojaRespuestas.volcar()[1]).toStrictEqual(['10/03/2026 10:15:30', 'Ana Beta Ficticia', '', 'A_1']);
    expect(e.hojaRespuestas.volcar()[0]).toHaveLength(4);
  });
  it('escribe solo en la fila de la respuesta: no toca las demás', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    e.llamar('onFormSubmit', ev());
    expect(e.hojaRespuestas.getRange(2, 3).getValue()).toBe('');
  });
  it('deja la traza numerada del proceso', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    e.llamar('onFormSubmit', ev());
    const l = e.google.estado.logs;
    expect(l[0]).toBe('1. Inicio onFormSubmit');
    expect(l).toContain('3. ID encontrado: A_1');
    expect(l).toContain('5. Fila objetivo: 3');
    expect(l.at(-1)).toBe('7. ID_Profesor escrito correctamente en fila 3');
  });
  it('un nombre con otra capitalización o espacios extra resuelve igual', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    e.llamar('onFormSubmit', eventoEnvio([['SELECCIONE EL PROFESOR', '  ANA  beta FICTICIA ']]));
    expect(e.hojaRespuestas.getRange(3, 3).getValue()).toBe('A_1');
  });
  it('sin respuesta a la pregunta lanza y no escribe nada', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    expect(() => e.llamar('onFormSubmit', eventoEnvio([['OTRA', 'x']]))).toThrow('No se encontró respuesta para la pregunta "SELECCIONE EL PROFESOR"');
    expect(e.hojaRespuestas.volcar()).toStrictEqual(respuestas);
  });
  it('profesor sin ID (inexistente o de baja) lanza y no escribe', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    expect(() => e.llamar('onFormSubmit', eventoEnvio([['SELECCIONE EL PROFESOR', 'Baja Ficticia']]))).toThrow('No se encontró ID_Profesor para "Baja Ficticia"');
    expect(e.hojaRespuestas.volcar()).toStrictEqual(respuestas);
  });
  it('profesor ambiguo (dos activos con el mismo nombre) lanza y no escribe', () => {
    const e = entornoSync({ profesores: [profesor('Repetida Ficticia', 'A_1'), profesor('Repetida Ficticia', 'A_2')], respuestas });
    expect(() => e.llamar('onFormSubmit', eventoEnvio([['SELECCIONE EL PROFESOR', 'Repetida Ficticia']]))).toThrow(/varios profesores activos/);
    expect(e.hojaRespuestas.volcar()).toStrictEqual(respuestas);
  });
  it('si no localiza la marca temporal escribe en la última fila', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    e.llamar('onFormSubmit', eventoEnvio([['SELECCIONE EL PROFESOR', 'Ana Beta Ficticia']], new Date('2026-01-01T00:00:00Z')));
    expect(e.hojaRespuestas.getRange(3, 3).getValue()).toBe('A_1');
  });
  it('registra el error y lo relanza si falla (formulario sin hoja vinculada)', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    e.formulario.destino = '';
    expect(() => e.llamar('onFormSubmit', ev())).toThrow('El formulario no tiene hoja de respuestas vinculada');
    expect(e.google.estado.logs.some((l) => l.startsWith('ERROR onFormSubmit:'))).toBe(true);
  });
  it('un evento sin respuesta (undefined) falla con error registrado, sin escribir', () => {
    const e = entornoSync({ profesores: PROFES, respuestas });
    expect(() => e.llamar('onFormSubmit', undefined)).toThrow();
    expect(e.google.estado.logs.some((l) => l.startsWith('ERROR onFormSubmit:'))).toBe(true);
    expect(e.hojaRespuestas.volcar()).toStrictEqual(respuestas);
  });
});

describe('creación y gestión de disparadores · SSD §7.3', () => {
  it('crearTriggersProduccion crea tres disparadores: envío del formulario, edición y cambio del libro', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    const d = plano(e.google.estado.disparadores.map((t) => ({ h: t.handler, id: t.forSpreadsheet, ed: t.onEdit, ch: t.onChange, fs: t.onFormSubmit })));
    expect(d).toStrictEqual([
      { h: 'onFormSubmit', fs: true },
      { h: 'onSpreadsheetEditTrigger', id: e.idLibro, ed: true },
      { h: 'onSpreadsheetChangeTrigger', id: e.idLibro, ch: true },
    ]);
    expect(e.google.estado.disparadores[0].forForm).toBe(e.formulario);
    expect(e.google.estado.logs).toContain('Triggers de producción creados correctamente');
  });
  it('crearTriggersProduccion es idempotente: borra los previos y no duplica', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    e.llamar('crearTriggersProduccion');
    expect(e.google.estado.disparadores).toHaveLength(3);
  });
  it('crearTriggersProduccion borra también disparadores ajenos (comportamiento actual)', () => {
    const e = entornoSync();
    e.google.global.ScriptApp.newTrigger('otraFuncion').timeBased().everyHours(1).create();
    e.llamar('crearTriggersProduccion');
    expect(e.google.estado.disparadores.map((t) => t.handler)).not.toContain('otraFuncion');
  });
  it('crearTriggersProduccion con el formulario inaccesible lanza tras borrar los previos', () => {
    const e = entornoSync({ conFormulario: false });
    e.google.global.ScriptApp.newTrigger('x').timeBased().create();
    expect(() => e.llamar('crearTriggersProduccion')).toThrow(/No se puede abrir el formulario/);
    expect(e.google.estado.disparadores).toHaveLength(0);
  });
  it('crearTriggerHorarioRespaldo crea un disparador horario de actualizarPreguntaProfesores cada hora', () => {
    const e = entornoSync();
    e.llamar('crearTriggerHorarioRespaldo');
    const [t] = e.google.estado.disparadores;
    expect(t.handler).toBe('actualizarPreguntaProfesores');
    expect(t.timeBased).toBe(true);
    expect(t.everyHours).toBe(1);
    expect(e.google.estado.logs).toContain('Trigger horario de respaldo creado correctamente');
  });
  it('crearTriggerHorarioRespaldo llamado dos veces duplica el respaldo (comportamiento actual, no idempotente)', () => {
    const e = entornoSync();
    e.llamar('crearTriggerHorarioRespaldo');
    e.llamar('crearTriggerHorarioRespaldo');
    expect(e.google.estado.disparadores).toHaveLength(2);
  });
  it('borrarTriggers elimina todos', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    e.llamar('crearTriggerHorarioRespaldo');
    e.llamar('borrarTriggers');
    expect(e.google.estado.disparadores).toHaveLength(0);
    expect(e.google.estado.logs).toContain('Todos los triggers han sido eliminados');
  });
  it('borrarTriggers sin disparadores no falla', () => {
    const e = entornoSync();
    expect(() => e.llamar('borrarTriggers')).not.toThrow();
  });
  it('verTriggers lista función y evento de cada disparador', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    e.llamar('crearTriggerHorarioRespaldo');
    e.llamar('verTriggers');
    expect(e.google.estado.logs).toEqual(expect.arrayContaining([
      'Función: onFormSubmit | Evento: ON_FORM_SUBMIT',
      'Función: onSpreadsheetChangeTrigger | Evento: ON_CHANGE',
      'Función: actualizarPreguntaProfesores | Evento: CLOCK',
    ]));
  });
});
