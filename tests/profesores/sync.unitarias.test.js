// Unitarias de VAP_Script_Actualizacion_Automatica_Profesores.gs: funciones auxiliares y de lectura.
// Citan RF-01/02/03 (lista activa e ID), ADR-0007/0008 (gemelo independiente) y SSD §6.1.0 y §7.3.
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { CABECERA_PROFESORES, ESPIA_CACHE, entornoSync, eventoEnvio, profesor } from './ayudas.js';

describe('constantes de configuración', () => {
  it('apuntan a la hoja, pregunta y cabecera que documenta el SSD §7.3', () => {
    const e = entornoSync();
    expect(e.valor('SHEET_PROFESORES')).toBe('VAP_Profesores');
    expect(e.valor('QUESTION_TITLE')).toBe('SELECCIONE EL PROFESOR');
    expect(e.valor('RESPONSE_ID_HEADER')).toBe('ID_Profesor');
  });
});

describe('normalizarTexto_ (RF-03 · cruce estable por nombre)', () => {
  const e = entornoSync();
  it.each([
    ['  ana   pérez ', 'ANA PÉREZ'],
    ['ANA PÉREZ', 'ANA PÉREZ'],
    ['ana\tpérez\nlópez', 'ANA PÉREZ LÓPEZ'],
    ['', ''],
    [null, ''],
    [undefined, ''],
    [0, ''],
    [123, '123'],
  ])('normaliza %j como %j', (entrada, esperado) => {
    expect(e.llamar('normalizarTexto_', entrada)).toBe(esperado);
  });
  it('conserva las tildes (no las elimina, a diferencia de normalizeKey del volcado)', () => {
    expect(e.llamar('normalizarTexto_', 'José')).toBe('JOSÉ');
    expect(e.llamar('normalizarTexto_', 'Jose')).not.toBe(e.llamar('normalizarTexto_', 'José'));
  });
});

describe('obtenerRespuestaPorTitulo_ (RF-03)', () => {
  const e = entornoSync();
  it('devuelve la respuesta de la pregunta buscada, recortada', () => {
    const ev = eventoEnvio([['OTRA', 'x'], ['SELECCIONE EL PROFESOR', '  Ana Ficticia  ']]);
    expect(e.llamar('obtenerRespuestaPorTitulo_', ev, 'SELECCIONE EL PROFESOR')).toBe('Ana Ficticia');
  });
  it('devuelve cadena vacía si la pregunta no está entre las respuestas', () => {
    const ev = eventoEnvio([['OTRA', 'x']]);
    expect(e.llamar('obtenerRespuestaPorTitulo_', ev, 'SELECCIONE EL PROFESOR')).toBe('');
  });
  it('devuelve cadena vacía si no hay ninguna respuesta', () => {
    expect(e.llamar('obtenerRespuestaPorTitulo_', eventoEnvio([]), 'X')).toBe('');
  });
  it('una respuesta vacía, nula o 0 se trata como vacía', () => {
    for (const v of ['', null, undefined, 0]) {
      expect(e.llamar('obtenerRespuestaPorTitulo_', eventoEnvio([['P', v]]), 'P')).toBe('');
    }
  });
  it('usa la primera coincidencia si el título se repite', () => {
    const ev = eventoEnvio([['P', 'Primero'], ['P', 'Segundo']]);
    expect(e.llamar('obtenerRespuestaPorTitulo_', ev, 'P')).toBe('Primero');
  });
  it('el título se compara exactamente (sensible a mayúsculas)', () => {
    expect(e.llamar('obtenerRespuestaPorTitulo_', eventoEnvio([['p', 'x']]), 'P')).toBe('');
  });
});

describe('obtenerProfesoresActivosUnicos_ (RF-02 · lista dinámica; SSD §6.1.0)', () => {
  it('devuelve solo activos con ID y nombre, sin duplicados y ordenados en español', () => {
    const e = entornoSync({ profesores: [
      profesor('Óscar Zeta Ficticio', 'A_1'),
      profesor('Ana Beta Ficticia', 'A_2'),
      profesor('Ana Beta Ficticia', 'A_2'),
      profesor('Álvaro Alfa Ficticio', 'A_3'),
      profesor('Baja Ficticia', 'A_4', false),
    ] });
    expect(plano(e.llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual([
      'Álvaro Alfa Ficticio', 'Ana Beta Ficticia', 'Óscar Zeta Ficticio',
    ]);
  });
  it('SSD §6.1.0 · Alta como texto "TRUE" NO cuenta: el script exige true booleano', () => {
    const e = entornoSync({ profesores: [profesor('Texto Ficticio', 'A_1', 'TRUE'), profesor('Casilla Ficticia', 'A_2', true)] });
    expect(plano(e.llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual(['Casilla Ficticia']);
  });
  it.each([['"true" en minúsculas', 'true'], ['número 1', 1], ['cadena vacía', ''], ['false', false], ['"SI"', 'SI']])('Alta = %s no cuenta como alta', (_n, alta) => {
    const e = entornoSync({ profesores: [profesor('Nombre Ficticio', 'A_1', alta)] });
    expect(plano(e.llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual([]);
  });
  it('SSD §6.1.0 · con ID_Profesor vacío la persona no aparece (un Id_Sage olvidado se nota)', () => {
    const e = entornoSync({ profesores: [profesor('Sin Id Ficticio', ''), profesor('Con Id Ficticio', 'A_1'), profesor('Solo Espacios', '   ')] });
    expect(plano(e.llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual(['Con Id Ficticio']);
  });
  it('una persona sin nombre no aparece', () => {
    const e = entornoSync({ profesores: [profesor('', 'A_1'), profesor('   ', 'A_2')] });
    expect(plano(e.llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual([]);
  });
  it('colapsa los espacios internos y recorta antes de deduplicar', () => {
    const e = entornoSync({ profesores: [profesor('  Ana   Beta  Ficticia ', 'A_1'), profesor('Ana Beta Ficticia', 'A_2')] });
    expect(plano(e.llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual(['Ana Beta Ficticia']);
  });
  it('RNF-02 · localiza las columnas por cabecera, no por posición', () => {
    const e = entornoSync({
      cabecera: ['Alta', 'Notas', 'Nombre', 'ID_Profesor'],
      profesores: [[true, '', 'Reordenada Ficticia', 'A_9']],
    });
    expect(plano(e.llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual(['Reordenada Ficticia']);
  });
  it('solo cabecera o hoja vacía: lista vacía', () => {
    expect(plano(entornoSync().llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual([]);
    const e = entornoSync(); e.hojaProfesores.clear();
    expect(plano(e.llamar('obtenerProfesoresActivosUnicos_'))).toStrictEqual([]);
  });
  it.each(['ID_Profesor', 'Nombre', 'Alta'])('lanza si falta la columna «%s»', (falta) => {
    const cabecera = CABECERA_PROFESORES.filter((c) => c !== falta);
    const e = entornoSync({ cabecera, profesores: [['x', 'y', 'z', 'w', 'v', 'u']] });
    expect(() => e.llamar('obtenerProfesoresActivosUnicos_')).toThrow(`No se encuentra la columna "${falta}"`);
  });
  it('lanza si no existe la hoja VAP_Profesores', () => {
    expect(() => entornoSync({ conHojaProfesores: false }).llamar('obtenerProfesoresActivosUnicos_')).toThrow('No existe la hoja "VAP_Profesores"');
  });
  it('lanza si el libro de personal no es accesible (error del servicio)', () => {
    const e = entornoSync();
    e.google.estado.libros.delete(e.idLibro);
    expect(() => e.llamar('obtenerProfesoresActivosUnicos_')).toThrow(/no existe o no hay acceso/);
  });
});

describe('buscarIdProfesorPorNombre_ (RF-03 · ID asociado a la respuesta)', () => {
  const base = [profesor('Ana Beta Ficticia', 'A_1'), profesor('Carlos Dos Ficticio', ' B_2 ')];
  it('encuentra el ID ignorando mayúsculas y espacios y lo devuelve recortado', () => {
    const e = entornoSync({ profesores: base });
    expect(e.llamar('buscarIdProfesorPorNombre_', '  ANA   beta ficticia ')).toBe('A_1');
    expect(e.llamar('buscarIdProfesorPorNombre_', 'Carlos Dos Ficticio')).toBe('B_2');
  });
  it('si no hay coincidencia devuelve cadena vacía', () => {
    expect(entornoSync({ profesores: base }).llamar('buscarIdProfesorPorNombre_', 'Nadie Ficticio')).toBe('');
  });
  it('una persona de baja no se encuentra aunque exista', () => {
    const e = entornoSync({ profesores: [profesor('Baja Ficticia', 'A_1', false)] });
    expect(e.llamar('buscarIdProfesorPorNombre_', 'Baja Ficticia')).toBe('');
  });
  it('Alta como texto "TRUE" tampoco se encuentra (coherente con la lista)', () => {
    const e = entornoSync({ profesores: [profesor('Texto Ficticio', 'A_1', 'TRUE')] });
    expect(e.llamar('buscarIdProfesorPorNombre_', 'Texto Ficticio')).toBe('');
  });
  it('lanza si hay varios activos con el mismo nombre (ambigüedad)', () => {
    const e = entornoSync({ profesores: [profesor('Repetida Ficticia', 'A_1'), profesor('repetida  ficticia', 'A_2')] });
    expect(() => e.llamar('buscarIdProfesorPorNombre_', 'Repetida Ficticia')).toThrow('Hay varios profesores activos con el mismo nombre: "Repetida Ficticia"');
  });
  it('un duplicado de baja NO provoca ambigüedad: solo cuentan los activos', () => {
    const e = entornoSync({ profesores: [profesor('Repetida Ficticia', 'A_1'), profesor('Repetida Ficticia', 'A_2', false)] });
    expect(e.llamar('buscarIdProfesorPorNombre_', 'Repetida Ficticia')).toBe('A_1');
  });
  it('un activo con ID vacío devuelve cadena vacía (sin ID asignable)', () => {
    const e = entornoSync({ profesores: [profesor('Sin Id Ficticio', '')] });
    expect(e.llamar('buscarIdProfesorPorNombre_', 'Sin Id Ficticio')).toBe('');
  });
  it('lanza si falta una columna obligatoria o la hoja', () => {
    const sinAlta = entornoSync({ cabecera: ['Nombre', 'ID_Profesor'], profesores: [['x', 'y']] });
    expect(() => sinAlta.llamar('buscarIdProfesorPorNombre_', 'x')).toThrow('No se encuentra la columna "Alta"');
    const sinNombre = entornoSync({ cabecera: ['ID_Profesor', 'Alta'], profesores: [['y', true]] });
    expect(() => sinNombre.llamar('buscarIdProfesorPorNombre_', 'x')).toThrow('No se encuentra la columna "Nombre"');
    const sinId = entornoSync({ cabecera: ['Nombre', 'Alta'], profesores: [['y', true]] });
    expect(() => sinId.llamar('buscarIdProfesorPorNombre_', 'x')).toThrow('No se encuentra la columna "ID_Profesor"');
    expect(() => entornoSync({ conHojaProfesores: false }).llamar('buscarIdProfesorPorNombre_', 'x')).toThrow('No existe la hoja "VAP_Profesores"');
  });
});

describe('localizarFilaRespuesta_ (RF-03 · fila exacta de la respuesta)', () => {
  const marca = new Date('2026-03-10T09:15:30Z'); // 10/03/2026 10:15:30 en Europe/Madrid
  const respuesta = { getTimestamp: () => marca };
  const hoja = (e, filas) => e.libroRespuestas.getSheetByName('Respuestas de formulario 1').cargar(filas);

  it('devuelve la fila cuya marca temporal coincide (formato dd/MM/yyyy HH:mm:ss en la zona del script)', () => {
    const e = entornoSync();
    const h = hoja(e, [['Marca temporal'], ['09/03/2026 08:00:00'], ['10/03/2026 10:15:30'], ['11/03/2026 08:00:00']]);
    expect(e.llamar('localizarFilaRespuesta_', h, respuesta)).toBe(3);
  });
  it('si hay marcas repetidas toma la última (recorre de abajo arriba)', () => {
    const e = entornoSync();
    const h = hoja(e, [['Marca temporal'], ['10/03/2026 10:15:30'], ['10/03/2026 10:15:30'], ['otra']]);
    expect(e.llamar('localizarFilaRespuesta_', h, respuesta)).toBe(3);
  });
  it('tolera espacios alrededor de la marca de la hoja', () => {
    const e = entornoSync();
    const h = hoja(e, [['Marca temporal'], ['  10/03/2026 10:15:30 ']]);
    expect(e.llamar('localizarFilaRespuesta_', h, respuesta)).toBe(2);
  });
  it('si no encuentra la marca, usa la última fila de la hoja', () => {
    const e = entornoSync();
    const h = hoja(e, [['Marca temporal'], ['01/01/2026 00:00:00'], ['02/01/2026 00:00:00']]);
    expect(e.llamar('localizarFilaRespuesta_', h, respuesta)).toBe(3);
  });
  it('hoja con solo cabecera: devuelve 1 (no hay datos; fila de cabecera)', () => {
    const e = entornoSync();
    const h = hoja(e, [['Marca temporal']]);
    expect(e.llamar('localizarFilaRespuesta_', h, respuesta)).toBe(1);
  });
  it('respeta la zona horaria del script (otra zona cambia la hora comparada)', () => {
    const e = entornoSync();
    e.google.global.Session.getScriptTimeZone = () => 'UTC';
    const h = hoja(e, [['Marca temporal'], ['10/03/2026 09:15:30'], ['10/03/2026 10:15:30']]);
    expect(e.llamar('localizarFilaRespuesta_', h, respuesta)).toBe(2);
  });
});

describe('puedeEjecutarSincronizacion_ (control de frecuencia de 30 s · SSD §7.3)', () => {
  it('la primera llamada se permite y deja una marca en caché de 30 s', () => {
    const e = entornoSync();
    const puestas = ESPIA_CACHE(e.google);
    expect(e.llamar('puedeEjecutarSincronizacion_')).toBe(true);
    expect(puestas).toStrictEqual([{ k: 'vap_sync_profesores_lock', v: '1', ttl: 30 }]);
  });
  it('la segunda llamada con la marca presente se omite y deja traza en el log', () => {
    const e = entornoSync();
    e.llamar('puedeEjecutarSincronizacion_');
    expect(e.llamar('puedeEjecutarSincronizacion_')).toBe(false);
    expect(e.google.estado.logs).toContain('Sincronización omitida por control de frecuencia');
  });
  it('al caducar la marca (se retira de la caché) vuelve a permitirse', () => {
    const e = entornoSync();
    e.llamar('puedeEjecutarSincronizacion_');
    delete e.google.estado.cache.vap_sync_profesores_lock;
    expect(e.llamar('puedeEjecutarSincronizacion_')).toBe(true);
  });
});
