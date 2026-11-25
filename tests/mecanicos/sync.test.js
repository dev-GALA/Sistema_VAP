// Pruebas de VAP_Script_Actualizacion_Automatica_Mecanicos.gs con dobles en memoria y datos FICTICIOS.
import { describe, expect, it } from 'vitest';
import { crearFormulario, eventoEnvio } from '../profesores/ayudas.js';
import { CODIGO, cargarGs, plano } from '../soporte/cargar-gs.js';
import { crearGoogle } from '../soporte/google.js';

const CABECERA = ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre', 'DNI', 'Tipo', 'Alta', 'Fecha_Alta', 'Revisión'];
const DNI_1 = '12345678Z';
const DNI_2 = '87654321X';
const persona = (nombre, id, tipo = 'MECÁNICO', alta = true, dni = DNI_1) => [
  'EMPRESA_A',
  '1',
  id,
  nombre,
  dni,
  tipo,
  alta,
  '',
  '',
];

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
    const e = entorno({
      filas: [
        persona('Zeta Ficticio, Óscar', 'A_1'),
        persona('Beta Ficticia, Ana', 'A_2'),
        persona('Beta Ficticia, Ana', 'A_2'),
        persona('Docente Ficticio, Dora', 'A_3', 'DOCENTE FORMACION'),
        persona('Baja Ficticia, Bea', 'A_4', 'MECÁNICO', false),
      ],
    });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual([
      'Beta Ficticia, Ana',
      'Zeta Ficticio, Óscar',
    ]);
  });
  it.each(['MECÁNICO', 'mecánico', 'MECANICO', ' Mecanico  CTM '])('Tipo «%s» cuenta como mecánico', (tipo) => {
    const e = entorno({ filas: [persona('Nombre Ficticio, Uno', 'A_1', tipo)] });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual(['Nombre Ficticio, Uno']);
  });
  it.each([
    ['texto TRUE', 'TRUE'],
    ['vacío', ''],
    ['false', false],
  ])('Alta = %s no cuenta', (_n, alta) => {
    const e = entorno({ filas: [persona('Nombre Ficticio, Uno', 'A_1', 'MECÁNICO', alta)] });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual([]);
  });
  it('sin id_trabajador o sin nombre no aparece', () => {
    const e = entorno({
      filas: [persona('Sin Id Ficticio, Ana', ''), persona('', 'A_1'), persona('Bien Ficticio, Ana', 'A_2')],
    });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual(['Bien Ficticio, Ana']);
  });
  it('localiza las columnas por cabecera: admite columnas nuevas y otro orden', () => {
    const e = entorno({
      cabecera: ['Nueva', 'Alta', 'Tipo', 'Nombre', 'id_trabajador', 'DNI'],
      filas: [['x', true, 'MECÁNICO', 'Reordenado Ficticio, Ana', 'A_9', DNI_1]],
    });
    expect(plano(e.llamar('obtenerMecanicosActivosUnicos_'))).toStrictEqual(['Reordenado Ficticio, Ana']);
  });
  it.each(['id_trabajador', 'Nombre', 'Tipo', 'Alta', 'DNI'])('lanza si falta la columna «%s»', (falta) => {
    const e = entorno({
      cabecera: CABECERA.filter((c) => c !== falta),
      filas: [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']],
    });
    expect(() => e.llamar('obtenerMecanicosActivosUnicos_')).toThrow(`No se encuentra la columna "${falta}"`);
  });
  it('lanza si no existe la hoja VAP_Staff', () => {
    expect(() => entorno({ conHoja: false }).llamar('obtenerMecanicosActivosUnicos_')).toThrow(
      'No existe la hoja "VAP_Staff"',
    );
  });
});

describe('quién entra en la lista: DNI válido y nombre «APELLIDOS, NOMBRE» (RF-102)', () => {
  const lista = (filas) => plano(entorno({ filas }).llamar('obtenerMecanicosActivosUnicos_'));

  it('sin DNI o con un DNI de forma incorrecta no aparece', () => {
    expect(
      lista([
        persona('Bien Ficticio, Ana', 'A_1'),
        persona('Sin Dni Ficticio, Ana', 'A_2', 'MECÁNICO', true, ''),
        persona('Dni Largo Ficticio, Ana', 'A_3', 'MECÁNICO', true, '050986557L'),
        persona('Dni Corto Ficticio, Ana', 'A_4', 'MECÁNICO', true, '1234567Z'),
      ]),
    ).toStrictEqual(['Bien Ficticio, Ana']);
  });

  it('acepta un DNI con espacios, guiones o minúsculas, y un NIE', () => {
    expect(
      lista([
        persona('Uno Ficticio, Ana', 'A_1', 'MECÁNICO', true, ' 1234-5678z '),
        persona('Dos Ficticio, Ana', 'A_2', 'MECÁNICO', true, 'X1234567L'),
      ]),
    ).toStrictEqual(['Dos Ficticio, Ana', 'Uno Ficticio, Ana']);
  });

  it('un nombre sin formato «APELLIDOS, NOMBRE» no aparece', () => {
    expect(
      lista([
        persona('Bien Ficticio, Ana', 'A_1'),
        persona('Sin Coma Ficticio Ana', 'A_2'),
        persona('Dos, Comas, Ficticio', 'A_3'),
        persona(', Ana', 'A_4'),
        persona('Ficticio,', 'A_5'),
      ]),
    ).toStrictEqual(['Bien Ficticio, Ana']);
  });

  it('el registro anota a quien se queda fuera con su id y el motivo, sin nombre ni DNI', () => {
    const e = entorno({
      filas: [
        persona('Bien Ficticio, Ana', 'A_1'),
        persona('Sin Dni Ficticio, Beto', 'A_2', 'MECÁNICO', true, ''),
        persona('Sin Coma Ficticio Carla', 'A_3'),
        persona('Baja Ficticia, Dora', 'A_4', 'MECÁNICO', false, ''),
      ],
    });
    e.llamar('actualizarPreguntaMecanicos');
    const registro = JSON.stringify(e.google.estado.logs);
    expect(registro).toContain('A_2');
    expect(registro).toContain('A_3');
    expect(registro).not.toContain('A_4'); // una baja no es una exclusión que avisar
    expect(registro).not.toContain(DNI_1);
    expect(registro).not.toContain('Sin Dni Ficticio');
  });
});

describe('actualizarPreguntaMecanicos', () => {
  it('carga la lista en la pregunta del formulario', () => {
    const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1'), persona('Ficticio, Beto', 'A_2')] });
    e.llamar('actualizarPreguntaMecanicos');
    expect(e.formulario.opcionesPorTitulo['Seleccione el Mecánico']).toStrictEqual(['Ficticia, Ana', 'Ficticio, Beto']);
  });
  it('no toca el formulario si no hay mecánicos activos', () => {
    const e = entorno({ filas: [persona('Docente Ficticio, Dora', 'A_1', 'DOCENTE')] });
    expect(() => e.llamar('actualizarPreguntaMecanicos')).toThrow('No se han encontrado mecánicos activos válidos');
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
});

describe('buscarMecanicoPorNombre_ y onFormSubmit', () => {
  it('devuelve el id y el DNI normalizado, sin distinguir mayúsculas ni espacios', () => {
    const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1', 'MECÁNICO', true, ' 1234-5678z ')] });
    expect(plano(e.llamar('buscarMecanicoPorNombre_', '  ficticia,   ana '))).toStrictEqual({ id: 'A_1', dni: DNI_1 });
  });
  it('null si no existe; error si el nombre está repetido entre activos', () => {
    const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1'), persona('Ficticia, Ana', 'B_1', 'MECÁNICO', true, DNI_2)] });
    expect(e.llamar('buscarMecanicoPorNombre_', 'Otra, Persona')).toBeNull();
    expect(() => e.llamar('buscarMecanicoPorNombre_', 'Ficticia, Ana')).toThrow(/varios mecánicos activos/);
  });
  it('un docente no se localiza aunque exista con ese nombre', () => {
    const e = entorno({ filas: [persona('Docente Ficticio, Dora', 'A_1', 'DOCENTE')] });
    expect(e.llamar('buscarMecanicoPorNombre_', 'Docente Ficticio, Dora')).toBeNull();
  });
  it('al enviar escribe ID_Mecanico y DNI_Mecanico en la hoja de respuestas', () => {
    const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1')] });
    e.hojaResp.getRange(2, 1).setValue('10/03/2026 09:15:30');
    e.llamar('onFormSubmit', eventoEnvio([['Seleccione el Mecánico', 'Ficticia, Ana']]));
    const datos = e.hojaResp.volcar();
    expect(datos[0]).toContain('ID_Mecanico');
    expect(datos[0]).toContain('DNI_Mecanico');
    expect(datos[1][datos[0].indexOf('ID_Mecanico')]).toBe('A_1');
    expect(datos[1][datos[0].indexOf('DNI_Mecanico')]).toBe(DNI_1);
  });
  it('si las columnas ya existen las reutiliza en vez de crear otras', () => {
    const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1'), persona('Ficticio, Beto', 'B_1', 'MECÁNICO', true, DNI_2)] });
    e.hojaResp.getRange(2, 1).setValue('10/03/2026 09:15:30');
    e.hojaResp.getRange(3, 1).setValue('10/03/2026 09:16:00');
    e.llamar('onFormSubmit', eventoEnvio([['Seleccione el Mecánico', 'Ficticia, Ana']]));
    e.llamar('onFormSubmit', eventoEnvio([['Seleccione el Mecánico', 'Ficticio, Beto']], new Date('2026-03-10T09:16:00Z')));
    const datos = e.hojaResp.volcar();
    expect(datos[0].filter((c) => c === 'DNI_Mecanico')).toHaveLength(1);
    expect(datos[0].filter((c) => c === 'ID_Mecanico')).toHaveLength(1);
  });
  it('si no hay respuesta o el mecánico no existe, lanza', () => {
    const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1')] });
    expect(() => e.llamar('onFormSubmit', eventoEnvio([]))).toThrow(/No se encontró respuesta/);
    expect(() => e.llamar('onFormSubmit', eventoEnvio([['Seleccione el Mecánico', 'Nadie, Nadie']]))).toThrow(
      /No se encontró el mecánico/,
    );
  });
});

describe('título de la pregunta: no distingue mayúsculas ni tildes', () => {
  it.each(['Seleccione el Mecánico', 'seleccione el mecanico', 'Seleccione el Mecánico'])(
    'el formulario titulado «%s» se carga y se responde',
    (titulo) => {
      const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1')] });
      const form = crearFormulario({ titulos: [titulo] });
      e.google.estado.formularios.set(e.valor('FORM_ID'), form);
      e.hojaResp.getRange(1, 2).setValue(titulo);
      e.hojaResp.getRange(2, 1).setValue('10/03/2026 09:15:30');
      e.llamar('actualizarPreguntaMecanicos');
      expect(form.opcionesPorTitulo[titulo]).toStrictEqual(['Ficticia, Ana']);
      e.llamar('onFormSubmit', eventoEnvio([[titulo, 'Ficticia, Ana']]));
      const datos = e.hojaResp.volcar();
      expect(datos[1][datos[0].indexOf('ID_Mecanico')]).toBe('A_1');
    },
  );
});

describe('disparadores', () => {
  it('ignora ediciones de otras hojas y cambios no estructurales', () => {
    const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1')] });
    e.llamar('onSpreadsheetEditTrigger', { range: { getSheet: () => ({ getName: () => 'Otra' }) } });
    e.llamar('onSpreadsheetChangeTrigger', { changeType: 'FORMAT' });
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
  it('una edición en VAP_Staff sincroniza y el control de frecuencia evita la segunda en 30 s', () => {
    const e = entorno({ filas: [persona('Ficticia, Ana', 'A_1')] });
    const ev = { range: { getSheet: () => ({ getName: () => 'VAP_Staff' }) } };
    e.llamar('onSpreadsheetEditTrigger', ev);
    expect(e.formulario.opcionesPorTitulo['Seleccione el Mecánico']).toStrictEqual(['Ficticia, Ana']);
    e.formulario.opcionesPorTitulo = {};
    e.llamar('onSpreadsheetEditTrigger', ev);
    expect(e.formulario.opcionesPorTitulo).toStrictEqual({});
  });
});
