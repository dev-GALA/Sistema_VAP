// Pruebas de VAP_Script_Actualizacion_Automatica_Mecanicos.gs con dobles en memoria y datos FICTICIOS.
import { describe, expect, it } from 'vitest';
import { CODIGO, cargarGs, plano } from '../soporte/cargar-gs.js';
import { crearGoogle } from '../soporte/google.js';
import { crearFormulario, eventoEnvio } from '../profesores/ayudas.js';

const CABECERA = ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre', 'DNI', 'Tipo', 'Alta', 'Fecha_Alta', 'Revisión'];
const persona = (nombre, id, tipo = 'MECÁNICO', alta = true) => ['EMPRESA_A', '1', id, nombre, 'DNI_FICTICIO', tipo, alta, '', ''];

function entorno({ filas = [], cabecera = CABECERA, conHoja = true } = {}) {
  const google = crearGoogle({ ahora: '2026-03-15T10:00:00Z' });
  const e = cargarGs(CODIGO.mecanicosSync, { google });
  const libro = google.libro(e.valor('SPREADSHEET_ID'), 'VAP_BBDD_Personas_FICTICIA');
  if (conHoja) libro.conHoja('VAP_Staff', [cabecera, ...filas]);
  const libroResp = google.libro('libro-respuestas', 'Respuestas FICTICIAS');
  const hojaResp = libroResp.conHoja('Respuestas de formulario 1', [['Marca temporal', 'Seleccione el Mecánico']]);
  const formulario = crearFormulario({ titulos: ['Seleccione el Mecánico'] });
  google.estado.formularios.set(e.valor('FORM_ID'), formulario);
  return { ...e, google, formulario, hojaResp };
}

describe('obtenerMecanicosActivosUnicos_', () => {
  it('solo mecánicos de alta, sin duplicados y ordenados en español', () => {
    const e = entorno({ filas: [
      persona('Óscar Zeta Ficticio', 'A_1'),
      persona('Ana Beta Ficticia', 'A_2'),
      persona('Ana Beta Ficticia', 'A_2'),
      persona('Docente Ficticio', 'A_3', 'DOCENTE FORMACION'),
      persona('Baja Ficticia', 'A_4', 'MECÁNICO', false),
    ] });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual(['Ana Beta Ficticia', 'Óscar Zeta Ficticio']);
  });
  it.each(['MECÁNICO', 'mecánico', 'MECANICO', ' Mecanico  CTM '])('Tipo «%s» cuenta como mecánico', (tipo) => {
    const e = entorno({ filas: [persona('Nombre Ficticio', 'A_1', tipo)] });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual(['Nombre Ficticio']);
  });
  it.each([['texto TRUE', 'TRUE'], ['vacío', ''], ['false', false]])('Alta = %s no cuenta', (_n, alta) => {
    const e = entorno({ filas: [persona('Nombre Ficticio', 'A_1', 'MECÁNICO', alta)] });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual([]);
  });
  it('sin id_trabajador o sin nombre no aparece', () => {
    const e = entorno({ filas: [persona('Sin Id Ficticio', ''), persona('', 'A_1'), persona('Bien Ficticio', 'A_2')] });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual(['Bien Ficticio']);
  });
  it('localiza las columnas por cabecera: admite columnas nuevas y otro orden', () => {
    const e = entorno({ cabecera: ['Nueva', 'Alta', 'Tipo', 'Nombre', 'id_trabajador'], filas: [['x', true, 'MECÁNICO', 'Reordenado Ficticio', 'A_9']] });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual(['Reordenado Ficticio']);
  });
  it.each(['id_trabajador', 'Nombre', 'Tipo', 'Alta'])('lanza si falta la columna «%s»', (falta) => {
    const e = entorno({ cabecera: CABECERA.filter((c) => c !== falta), filas: [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']] });
    expect(() => e.llamar('obtenerMecanicosActivosUnicos_')).toThrow(`No se encuentra la columna "${falta}"`);
  });
  it('lanza si no existe la hoja VAP_Staff', () => {
    expect(() => entorno({ conHoja: false }).llamar('obtenerMecanicosActivosUnicos_')).toThrow('No existe la hoja "VAP_Staff"');
  });
});

describe('actualizarPreguntaMecanicos', () => {
  it('carga la lista en la pregunta del formulario', () => {
    const e = entorno({ filas: [persona('Ana Ficticia', 'A_1'), persona('Beto Ficticio', 'A_2')] });
    e.llamar('actualizarPreguntaMecanicos');
    expect(e.formulario.opcionesPorTitulo['Seleccione el Mecánico']).toStrictEqual(['Ana Ficticia', 'Beto Ficticio']);
  });
  it('no toca el formulario si no hay mecánicos activos', () => {
    const e = entorno({ filas: [persona('Docente Ficticio', 'A_1', 'DOCENTE')] });
    expect(() => e.llamar('actualizarPreguntaMecanicos')).toThrow('No se han encontrado mecánicos activos válidos');
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
});

describe('buscarIdMecanicoPorNombre_ y onFormSubmit', () => {
  it('devuelve el id sin distinguir mayúsculas ni espacios', () => {
    const e = entorno({ filas: [persona('Ana Ficticia', 'A_1')] });
    expect(e.llamar('buscarIdMecanicoPorNombre_', '  ana   ficticia ')).toBe('A_1');
  });
  it('cadena vacía si no existe; error si el nombre está repetido entre activos', () => {
    const e = entorno({ filas: [persona('Ana Ficticia', 'A_1'), persona('Ana Ficticia', 'B_1')] });
    expect(e.llamar('buscarIdMecanicoPorNombre_', 'Otra Persona')).toBe('');
    expect(() => e.llamar('buscarIdMecanicoPorNombre_', 'Ana Ficticia')).toThrow(/varios mecánicos activos/);
  });
  it('un docente no se localiza aunque exista con ese nombre', () => {
    const e = entorno({ filas: [persona('Docente Ficticio', 'A_1', 'DOCENTE')] });
    expect(e.llamar('buscarIdMecanicoPorNombre_', 'Docente Ficticio')).toBe('');
  });
  it('al enviar escribe ID_Mecanico en la hoja de respuestas', () => {
    const e = entorno({ filas: [persona('Ana Ficticia', 'A_1')] });
    e.hojaResp.getRange(2, 1).setValue('10/03/2026 09:15:30');
    e.llamar('onFormSubmit', eventoEnvio([['Seleccione el Mecánico', 'Ana Ficticia']]));
    const datos = e.hojaResp.volcar();
    expect(datos[0]).toContain('ID_Mecanico');
    expect(datos[1][datos[0].indexOf('ID_Mecanico')]).toBe('A_1');
  });
  it('si no hay respuesta o el mecánico no existe, lanza', () => {
    const e = entorno({ filas: [persona('Ana Ficticia', 'A_1')] });
    expect(() => e.llamar('onFormSubmit', eventoEnvio([]))).toThrow(/No se encontró respuesta/);
    expect(() => e.llamar('onFormSubmit', eventoEnvio([['Seleccione el Mecánico', 'Nadie']]))).toThrow(/No se encontró ID_Mecanico/);
  });
});

describe('título de la pregunta: no distingue mayúsculas ni tildes', () => {
  it.each(['Seleccione el Mecánico', 'seleccione el mecanico', 'Seleccione el Mecánico'])('el formulario titulado «%s» se carga y se responde', (titulo) => {
    const e = entorno({ filas: [persona('Ana Ficticia', 'A_1')] });
    const form = crearFormulario({ titulos: [titulo] });
    e.google.estado.formularios.set(e.valor('FORM_ID'), form);
    e.hojaResp.getRange(1, 2).setValue(titulo);
    e.hojaResp.getRange(2, 1).setValue('10/03/2026 09:15:30');
    e.llamar('actualizarPreguntaMecanicos');
    expect(form.opcionesPorTitulo[titulo]).toStrictEqual(['Ana Ficticia']);
    e.llamar('onFormSubmit', eventoEnvio([[titulo, 'Ana Ficticia']]));
    const datos = e.hojaResp.volcar();
    expect(datos[1][datos[0].indexOf('ID_Mecanico')]).toBe('A_1');
  });
});

describe('disparadores', () => {
  it('ignora ediciones de otras hojas y cambios no estructurales', () => {
    const e = entorno({ filas: [persona('Ana Ficticia', 'A_1')] });
    e.llamar('onSpreadsheetEditTrigger', { range: { getSheet: () => ({ getName: () => 'Otra' }) } });
    e.llamar('onSpreadsheetChangeTrigger', { changeType: 'FORMAT' });
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
  it('una edición en VAP_Staff sincroniza y el control de frecuencia evita la segunda en 30 s', () => {
    const e = entorno({ filas: [persona('Ana Ficticia', 'A_1')] });
    const ev = { range: { getSheet: () => ({ getName: () => 'VAP_Staff' }) } };
    e.llamar('onSpreadsheetEditTrigger', ev);
    expect(e.formulario.opcionesPorTitulo['Seleccione el Mecánico']).toStrictEqual(['Ana Ficticia']);
    e.formulario.opcionesPorTitulo = {};
    e.llamar('onSpreadsheetEditTrigger', ev);
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
});
