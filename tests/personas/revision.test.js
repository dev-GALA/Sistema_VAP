// Revisión de VAP_BBDD_Personas (fase 0 de la armonización de id_trabajador): solo lee y escribe la hoja de revisión.
// Datos 100 % ficticios.
import { describe, expect, it } from 'vitest';
import { CODIGO, cargarGs, plano } from '../soporte/cargar-gs.js';
import { crearGoogle } from '../soporte/google.js';

const ID_MAESTRO = 'maestro-prueba';
const DNI_1 = '11111111H';
const DNI_2 = '22222222J';
const DNI_3 = '33333333P';

const CAB = ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre', 'DNI', 'Alta'];
const fila = (empresa, idSage, id, nombre, dni, alta = true) => [empresa, idSage, id, nombre, dni, alta];
const buena = (empresa, n, dni) => fila(empresa, n, `${empresa}_${n}`, `Apellido ${n}, Nombre`, dni);

function entorno({ staff = [], secretarias = [], profesores = [], propiedades = {} } = {}) {
  const google = crearGoogle({ ahora: '2026-11-25T10:00:00Z' });
  const e = cargarGs(CODIGO.revisionPersonas, { google });
  const maestro = google.libro(ID_MAESTRO, 'VAP_BBDD_Personas_FICTICIA');
  maestro.conHoja('Config', [
    ['Notificacion', 'x', true],
    ['Empresas', 'GALA, CERVANTES, MOTOR INTEGRAL'],
  ]);
  maestro.conHoja('VAP_Staff', [CAB, ...staff]);
  maestro.conHoja('VAP_Secretarias', [
    ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre_Secretaria', 'DNI', 'Alta'],
    ...secretarias,
  ]);
  maestro.conHoja('VAP_Profesores', [CAB, ...profesores]);
  google.activar(maestro);
  Object.assign(google.estado.propiedadesScript, propiedades);
  return { ...e, google, maestro };
}

function revisar(e) {
  const resumen = plano(e.llamar('revisarPersonas'));
  const [cabecera, ...filas] = plano(e.maestro.getSheetByName('revision_ids').volcar());
  return {
    resumen,
    cabecera,
    filas: filas.map((f) => Object.fromEntries(cabecera.map((c, i) => [c, f[i]]))),
  };
}
const problemas = (r) => r.filas.map((f) => [f.problema, f.pestana, f.fila]);

describe('revisarPersonas · qué problemas detecta', () => {
  it('con todo bien no hay filas y el resumen sale a cero', () => {
    const r = revisar(entorno({ staff: [buena('GALA', 1, DNI_1)], profesores: [buena('CERVANTES', 2, DNI_2)] }));
    expect(r.filas).toEqual([]);
    expect(r.resumen).toMatchObject({ revisadas: 2, problemas: 0 });
    expect(r.cabecera).toContain('id_correcto');
  });

  it('un id que no es Empresa_Id_Sage dice cuál debería ser', () => {
    const r = revisar(entorno({ staff: [fila('MOTOR INTEGRAL', 8, 'CTM MOTOR INTEGRAL SLU_8', 'A, B', DNI_1)] }));
    expect(r.filas).toHaveLength(1);
    expect(r.filas[0]).toMatchObject({
      problema: 'ID_NO_CUMPLE_REGLA',
      pestana: 'VAP_Staff',
      fila: 2,
      id_actual: 'CTM MOTOR INTEGRAL SLU_8',
      id_correcto: 'MOTOR INTEGRAL_8',
    });
  });

  it('sin Id_Sage, sin id y con una empresa que no está en la lista', () => {
    const r = revisar(
      entorno({
        staff: [fila('GALA', '', 'GALA_', 'A, B', DNI_1), fila('OTRA', 3, '', 'C, D', DNI_2)],
      }),
    );
    expect(problemas(r)).toEqual(
      expect.arrayContaining([
        ['SIN_ID_SAGE', 'VAP_Staff', 2],
        ['EMPRESA_FUERA_DE_LISTA', 'VAP_Staff', 3],
        ['SIN_ID', 'VAP_Staff', 3],
      ]),
    );
  });

  it('un id repetido sale en cada aparición, diciendo dónde está la otra (aunque sea otra pestaña)', () => {
    const r = revisar(entorno({ staff: [buena('GALA', 1, DNI_1)], secretarias: [buena('GALA', 1, DNI_1)] }));
    const repetidos = r.filas.filter((f) => f.problema === 'ID_REPETIDO');
    expect(repetidos.map((f) => [f.pestana, f.fila])).toEqual([
      ['VAP_Staff', 2],
      ['VAP_Secretarias', 2],
    ]);
    expect(repetidos[0].detalle).toContain('VAP_Secretarias fila 2');
    expect(repetidos[0].detalle).toContain('mismo DNI');
  });

  it('el mismo id correcto para dos filas con distinto DNI se señala como conflicto', () => {
    const r = revisar(entorno({ staff: [buena('GALA', 1, DNI_1), buena('GALA', 1, DNI_2)] }));
    expect(r.filas.find((f) => f.problema === 'ID_REPETIDO').detalle).toContain('DNI DISTINTOS');
  });

  it('sin DNI no afirma que sea la misma persona', () => {
    const r = revisar(entorno({ staff: [buena('GALA', 1, ''), buena('GALA', 1, '')] }));
    expect(r.filas.find((f) => f.problema === 'ID_REPETIDO').detalle).toContain('falta algún DNI');
  });

  it('DNI y nombre solo se revisan en las personas con Alta', () => {
    const r = revisar(
      entorno({
        staff: [
          fila('GALA', 1, 'GALA_1', 'Sin Coma', '050986557L', true),
          fila('GALA', 2, 'GALA_2', 'Sin Coma', '', false),
        ],
      }),
    );
    expect(problemas(r)).toEqual([
      ['DNI_NO_VALIDO', 'VAP_Staff', 2],
      ['NOMBRE_SIN_FORMATO', 'VAP_Staff', 2],
    ]);
    expect(r.filas[0].detalle).toContain('10 caracteres');
  });

  it('el mismo DNI en dos filas activas de la MISMA empresa se señala; en empresas distintas no', () => {
    const r = revisar(
      entorno({
        staff: [buena('GALA', 1, DNI_1), buena('GALA', 2, DNI_1), buena('CERVANTES', 3, DNI_3), buena('GALA', 4, DNI_3)],
      }),
    );
    expect(problemas(r)).toEqual([
      ['DNI_REPETIDO_EN_EMPRESA', 'VAP_Staff', 2],
      ['DNI_REPETIDO_EN_EMPRESA', 'VAP_Staff', 3],
    ]);
  });

  it('ignora las filas vacías (las casillas sin marcar no cuentan como persona)', () => {
    const r = revisar(entorno({ staff: [['', '', '', '', '', false]] }));
    expect(r.resumen.revisadas).toBe(0);
    expect(r.filas).toEqual([]);
  });
});

describe('revisarPersonas · cuánto histórico usa cada id', () => {
  it('sin los libros configurados lo dice en vez de poner un cero', () => {
    const r = revisar(entorno({ staff: [fila('GALA', 1, 'viejo_1', 'A, B', DNI_1)] }));
    expect(r.filas[0].huellas_con_id_actual).toBe('no comprobado');
    expect(r.filas[0].envios_complementos_con_id_actual).toBe('no comprobado');
  });

  it('con los libros configurados cuenta huellas y envíos antiguos del id actual', () => {
    const e = entorno({
      staff: [fila('GALA', 1, 'viejo_1', 'A, B', DNI_1)],
      propiedades: { ID_LIBRO_VAP_PAGOS: 'pagos', ID_LIBRO_COMPLEMENTOS: 'compl' },
    });
    e.google.libro('pagos', 'VAP_Pagos').conHoja('huellas', [['id_pagos', 'dni', 'id_trabajador'], [1, DNI_1, 'viejo_1']]);
    e.google
      .libro('compl', 'Complementos')
      .conHoja('Data', [['ID_Secretaria'], ['viejo_1'], ['viejo_1'], ['otro_9']]);
    const r = revisar(e);
    expect(r.filas[0].huellas_con_id_actual).toBe(1);
    expect(r.filas[0].envios_complementos_con_id_actual).toBe(2);
  });
});

describe('revisarPersonas · seguridad', () => {
  it('solo escribe la hoja de revisión: ninguna pestaña del maestro cambia', () => {
    const e = entorno({ staff: [fila('GALA', 1, 'mal', 'Sin Coma', '1', true)] });
    const antes = ['VAP_Staff', 'VAP_Secretarias', 'VAP_Profesores', 'Config'].map((n) =>
      JSON.stringify(e.maestro.getSheetByName(n).volcar()),
    );
    revisar(e);
    revisar(e); // repetirla sustituye la hoja, no la acumula
    const despues = ['VAP_Staff', 'VAP_Secretarias', 'VAP_Profesores', 'Config'].map((n) =>
      JSON.stringify(e.maestro.getSheetByName(n).volcar()),
    );
    expect(despues).toEqual(antes);
    expect(e.google.estado.logs.join(' ')).not.toContain('Sin Coma');
  });

  it('lanza si falta una pestaña, una columna o la lista de empresas', () => {
    const e = entorno();
    e.maestro.getSheetByName('Config').cargar([['Otra', 'x']]);
    expect(() => e.llamar('revisarPersonas')).toThrow('Empresas');
  });
});
