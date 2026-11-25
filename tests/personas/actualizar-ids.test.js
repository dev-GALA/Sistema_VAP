// Actualización única de id_trabajador en las huellas de VAP_Pagos y en Complementos. Datos 100 % ficticios.
import { describe, expect, it } from 'vitest';
import { CODIGO, cargarGs, plano } from '../soporte/cargar-gs.js';
import { crearGoogle } from '../soporte/google.js';

const DNI_1 = '11111111H';
const DNI_2 = '22222222J';
const CAB = ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre', 'DNI', 'Alta'];
const CAB_SEC = ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre_Secretaria', 'DNI', 'Alta'];

function entorno({ staff = [], secretarias = [], huellas = [], data = [] }) {
  const google = crearGoogle({ ahora: '2026-11-25T10:00:00Z' });
  const e = cargarGs(CODIGO.personas, { google });
  const maestro = google.libro('maestro', 'VAP_BBDD_Personas_FICTICIA');
  maestro.conHoja('Config', [['Empresas', 'GALA, CERVANTES']]);
  maestro.conHoja('VAP_Staff', [CAB, ...staff]);
  maestro.conHoja('VAP_Secretarias', [CAB_SEC, ...secretarias]);
  maestro.conHoja('VAP_Profesores', [CAB]);
  google.activar(maestro);
  const pagos = google.libro('pagos', 'VAP_Pagos');
  pagos.conHoja('huellas', [['id_pagos', 'dni', 'id_trabajador', 'huella'], ...huellas]);
  google.libro('compl', 'Complementos').conHoja('Data', [['ID_Secretaria', 'Valor', 'DNI_Secretaria'], ...data]);
  Object.assign(google.estado.propiedadesScript, { ID_LIBRO_VAP_PAGOS: 'pagos', ID_LIBRO_COMPLEMENTOS: 'compl' });
  return { ...e, google, maestro, pagos };
}
const persona = (empresa, n, anterior, dni) => [empresa, n, anterior, 'A, B', dni, true];

describe('actualizar ids · huellas y Complementos', () => {
  const montar = () =>
    entorno({
      // Dos secretarias con los id cruzados: la 1 tenía SLU_14 y es la 6; la 2 tenía SLU_7 y es la 14.
      secretarias: [persona('GALA', 6, 'SLU_14', DNI_1), persona('GALA', 'SLU', '', ''), persona('GALA', 7, 'GALA_7', DNI_2)],
      staff: [persona('CERVANTES', 3, 'viejo_3', DNI_2)],
      huellas: [
        [1, DNI_1, 'SLU_14', 'h1'],
        [2, DNI_2, 'viejo_3', 'h2'],
        [3, DNI_2, 'GALA_7', 'h2'],
        [4, DNI_1, 'viejo_3', 'h1'], // DNI que no corresponde
      ],
      data: [
        ['SLU_14', 10, DNI_1],
        ['SLU_14', 20, ''],
        ['no_existe', 30, ''],
        ['GALA_7', 40, DNI_2],
      ],
    });
  const preparar = () => {
    const e = montar();
    e.llamar('instalarCentinela');
    return e;
  };

  it('sin haber instalado el centinela lo dice', () => {
    expect(() => montar().llamar('simularActualizacionIds')).toThrow('instalarCentinela');
  });

  it('simular no escribe en los otros libros y deja el informe', () => {
    const e = preparar();
    const r = plano(e.llamar('simularActualizacionIds'));
    expect(r).toEqual({
      escrito: false,
      VAP_Pagos: { cambiar: 2, borrar: 0, revisar: 1 },
      Complementos: { cambiar: 2, borrar: 0, revisar: 1 },
    });
    expect(e.google.estado.escrituras.filter((w) => w.hoja === 'huellas' || w.hoja === 'Data')).toEqual([]);
    expect(e.maestro.getSheetByName('actualizacion_ids').volcar()).toHaveLength(1 + 6);
  });

  it('ejecutar cambia solo la celda del id, y repetirlo no cambia nada más', () => {
    const e = preparar();
    e.llamar('ejecutarActualizacionIds');
    const escritas = () =>
      e.google.estado.escrituras.filter((w) => w.hoja === 'huellas' || w.hoja === 'Data').map((w) => w.rango);
    expect(escritas().sort()).toEqual(['A2', 'A3', 'C2', 'C3']);
    const r = plano(e.llamar('ejecutarActualizacionIds'));
    expect(r.VAP_Pagos.cambiar + r.Complementos.cambiar).toBe(0);
  });

  const repetidas = (huellas) =>
    entorno({ staff: [persona('GALA', 1, 'viejo_a', DNI_1), persona('GALA', 1, 'viejo_b', DNI_1)], huellas });
  const quedan = (e) => plano(e.pagos.getSheetByName('huellas').volcar()).slice(1);

  it('de dos huellas iguales que quedarían repetidas deja una y borra la sobrante', () => {
    const e = repetidas([
      [1, DNI_1, 'viejo_a', 'h'],
      [2, DNI_1, 'viejo_b', 'h'],
      [3, DNI_2, 'otra_9', 'z'],
      [4, DNI_1, 'viejo_a', 'h'],
    ]);
    e.llamar('instalarCentinela');
    expect(plano(e.llamar('ejecutarActualizacionIds')).VAP_Pagos).toMatchObject({ cambiar: 1, borrar: 2 });
    expect(quedan(e).map((f) => [f[0], f[2]])).toEqual([
      [1, 'GALA_1'],
      [3, 'otra_9'],
    ]);
  });

  it('si ya hay una con el id nuevo, conserva esa', () => {
    const e = repetidas([
      [1, DNI_1, 'viejo_a', 'h'],
      [2, DNI_1, 'GALA_1', 'h'],
    ]);
    e.llamar('instalarCentinela');
    e.llamar('ejecutarActualizacionIds');
    expect(quedan(e).map((f) => [f[0], f[2]])).toEqual([[2, 'GALA_1']]);
  });

  it('si las huellas son distintas no borra ni cambia nada', () => {
    const e = repetidas([
      [1, DNI_1, 'viejo_a', 'h1'],
      [2, DNI_1, 'viejo_b', 'h2'],
    ]);
    e.llamar('instalarCentinela');
    expect(plano(e.llamar('ejecutarActualizacionIds')).VAP_Pagos).toEqual({ cambiar: 0, borrar: 0, revisar: 2 });
    expect(quedan(e)).toHaveLength(2);
  });

  it('aplica los cambios de profesores que la copia no recoge', () => {
    const e = entorno({ huellas: [[1, DNI_2, 'ARCOVIAL_54', 'h']] });
    e.llamar('instalarCentinela');
    e.llamar('ejecutarActualizacionIds');
    expect(quedan(e)[0][2]).toBe('CERVANTES_626');
  });
});
