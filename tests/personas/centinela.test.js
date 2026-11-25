// Centinela de id_trabajador y corrector único de Empresa/Id_Sage (VAP_BBDD_Personas). Datos 100 % ficticios.
import { describe, expect, it } from 'vitest';
import { CODIGO, cargarGs, plano } from '../soporte/cargar-gs.js';
import { crearGoogle } from '../soporte/google.js';

const TABS = ['VAP_Staff', 'VAP_Secretarias', 'VAP_Profesores'];
const CAB = ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre', 'DNI', 'Alta'];
const CAB_SEC = ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre_Secretaria', 'DNI', 'Alta'];
const DNI_1 = '11111111H';
const DNI_2 = '22222222J';
const fila = (empresa, n, nombre, dni = DNI_1, alta = true) => [empresa, n, `${empresa}_${n}`, nombre, dni, alta];

function entorno({ staff = [], secretarias = [], profesores = [], sage } = {}) {
  const google = crearGoogle({ ahora: '2026-11-25T10:00:00Z' });
  const e = cargarGs(CODIGO.personas, { google });
  const maestro = google.libro('maestro', 'VAP_BBDD_Personas_FICTICIA');
  maestro.conHoja('Config', [['Empresas', 'GALA, CERVANTES, MOTOR INTEGRAL']]);
  maestro.conHoja('VAP_Staff', [CAB, ...staff]);
  maestro.conHoja('VAP_Secretarias', [CAB_SEC, ...secretarias]);
  maestro.conHoja('VAP_Profesores', [CAB, ...profesores]);
  google.activar(maestro);
  if (sage) {
    google.libro('sage', 'Export').conHoja('bbdd_export_sage_laboral', [['Empresa', 'Codigo_Empleado', 'Nombre_empleado'], ...sage]);
    google.estado.propiedadesScript.ID_LIBRO_EXPORT_SAGE = 'sage';
  }
  const hoja = (n) => maestro.getSheetByName(n);
  const volcado = (n) => plano(hoja(n).volcar());
  const editar = (pestana, f, col, nuevo, anterior) => {
    const rango = hoja(pestana).getRange(f, col);
    rango.setValue(nuevo);
    e.llamar('onEdit', { range: rango, oldValue: anterior, source: maestro });
  };
  return { ...e, google, maestro, hoja, volcado, editar };
}

describe('instalarCentinela · columna id_trabajador generada y protegida', () => {
  it('pone la fórmula en C1, vacía los textos antiguos y guarda copia de ellos', () => {
    const e = entorno({ staff: [['GALA', 5, 'viejo_5', 'A, B', DNI_1, true]] });
    e.llamar('instalarCentinela');
    for (const n of TABS) {
      const formula = e.hoja(n)._formulas.C1;
      expect(formula).toContain('"id_trabajador"');
      expect(formula).toContain('A2:A');
      expect(formula).toContain('B2:B');
    }
    expect(e.volcado('VAP_Staff')[1][2]).toBe('');
    expect(e.volcado('VAP_Staff')[0][2]).toBe('id_trabajador');
    const copia = e.volcado('copia_id_trabajador');
    expect(copia[1]).toEqual(['VAP_Staff', 2, 'viejo_5', 'GALA', '5', DNI_1]);
  });

  it('usa «;» y, si la hoja no lo entiende, prueba con «,»', () => {
    const e = entorno({ staff: [fila('GALA', 5, 'A, B')] });
    e.llamar('instalarCentinela');
    expect(e.hoja('VAP_Staff')._formulas.C1).toContain('="");""');
    const otra = entorno({ staff: [fila('GALA', 5, 'A, B')] });
    otra.google.estado.rechazaFormula = (f) => f.includes(';""');
    otra.llamar('instalarCentinela');
    expect(otra.volcado('VAP_Staff')[0][2]).toBe('id_trabajador');
    expect(otra.hoja('VAP_Staff')._formulas.C1).toContain('=""),""');
  });

  it('si la hoja no admite ninguna, deja los id escritos y lo dice', () => {
    const e = entorno({ staff: [fila('GALA', 5, 'A, B')] });
    e.google.estado.rechazaFormula = () => true;
    expect(() => e.llamar('instalarCentinela')).toThrow('no admite la fórmula');
    expect(e.volcado('VAP_Staff')[0][2]).toBe('id_trabajador');
    expect(e.volcado('VAP_Staff')[1][2]).toBe('GALA_5');
  });

  it('repara una cabecera que quedó en error y conserva la copia de los id antiguos', () => {
    const e = entorno({ staff: [['GALA', 5, 'viejo_5', 'A, B', DNI_1, true]] });
    e.llamar('instalarCentinela');
    for (const n of TABS) e.hoja(n).getRange(1, 3).setValue('#ERROR!');
    e.llamar('instalarCentinela');
    expect(e.volcado('VAP_Secretarias')[0][2]).toBe('id_trabajador');
    expect(e.volcado('copia_id_trabajador')[1][2]).toBe('viejo_5');
  });

  it('no toca las columnas A y B (conservan su desplegable) ni ninguna otra', () => {
    const e = entorno({ staff: [fila('GALA', 5, 'A, B')] });
    const antes = e.volcado('VAP_Staff')[1];
    e.llamar('instalarCentinela');
    const despues = e.volcado('VAP_Staff')[1];
    expect([despues[0], despues[1], ...despues.slice(3)]).toEqual([antes[0], antes[1], ...antes.slice(3)]);
    const escritas = e.google.estado.escrituras.filter((w) => TABS.includes(w.hoja)).map((w) => w.rango[0]);
    expect(new Set(escritas)).toEqual(new Set(['C']));
  });

  it('protege la columna C de las tres hojas sin editores, y repetirlo no duplica ni pisa la copia', () => {
    const e = entorno({ staff: [['GALA', 5, 'viejo_5', 'A, B', DNI_1, true]] });
    e.llamar('instalarCentinela');
    e.llamar('instalarCentinela');
    for (const n of TABS) {
      const protecciones = e.hoja(n).getProtections();
      expect(protecciones).toHaveLength(1);
      expect(protecciones[0].rango.startsWith('C1')).toBe(true);
      expect(protecciones[0].editores).toEqual([]);
    }
    expect(e.volcado('copia_id_trabajador')[1][2]).toBe('viejo_5');
  });
});

describe('centinela al editar · un Id_Sage por empresa y persona', () => {
  const base = () =>
    entorno({
      staff: [fila('GALA', 5, 'Uno, Ana', DNI_1)],
      secretarias: [['GALA', 8, 'GALA_8', 'Dos, Bea', DNI_2, true]],
    });

  it('deshace el cambio si otra persona ya usa ese número en la empresa (aunque sea otra hoja) y dice dónde', () => {
    const e = base();
    e.editar('VAP_Secretarias', 2, 2, 5, 8);
    expect(e.volcado('VAP_Secretarias')[1][1]).toBe(8);
    const aviso = e.google.estado.avisos.at(-1);
    expect(aviso.mensaje).toContain('GALA_5');
    expect(aviso.mensaje).toContain('VAP_Staff fila 2');
  });

  it('el mismo número en OTRA empresa se acepta', () => {
    const e = base();
    e.editar('VAP_Secretarias', 2, 1, 'CERVANTES', 'GALA');
    e.editar('VAP_Secretarias', 2, 2, 5, 8);
    expect(e.volcado('VAP_Secretarias')[1].slice(0, 2)).toEqual(['CERVANTES', 5]);
    expect(e.google.estado.avisos).toEqual([]);
  });

  it('la MISMA persona (mismo DNI) puede repetirlo en dos hojas', () => {
    const e = entorno({
      staff: [fila('GALA', 5, 'Uno, Ana', DNI_1)],
      secretarias: [['GALA', 8, 'x', 'Uno García, Ana', DNI_1, true]],
    });
    e.editar('VAP_Secretarias', 2, 2, 5, 8);
    expect(e.volcado('VAP_Secretarias')[1][1]).toBe(5);
  });

  it('sin DNI compara el nombre, sin importar tildes, comas ni orden', () => {
    const e = entorno({
      staff: [fila('GALA', 5, 'Pérez, Ana', '')],
      secretarias: [['GALA', 8, 'x', 'ANA PEREZ', '', true]],
    });
    e.editar('VAP_Secretarias', 2, 2, 5, 8);
    expect(e.volcado('VAP_Secretarias')[1][1]).toBe(5);
  });

  it('al pegar varias celdas no deshace: marca con nota, y la nota se quita al corregirlo', () => {
    const e = base();
    const rango = e.hoja('VAP_Secretarias').getRange(2, 1, 1, 2);
    rango.setValues([['GALA', 5]]);
    e.llamar('onEdit', { range: rango, source: e.maestro });
    expect(e.volcado('VAP_Secretarias')[1][1]).toBe(5);
    expect(e.hoja('VAP_Secretarias').getRange(2, 2).getNotes()[0][0]).toContain('VAP_ID');
    e.editar('VAP_Secretarias', 2, 2, 9, 5);
    expect(e.hoja('VAP_Secretarias').getRange(2, 2).getNotes()[0][0]).toBe('');
    expect(e.hoja('VAP_Staff').getRange(2, 2).getNotes()[0][0]).toBe('');
  });

  it('ignora otras hojas, otras columnas y la cabecera', () => {
    const e = base();
    e.llamar('onEdit', { range: e.hoja('Config').getRange(1, 1), source: e.maestro });
    e.llamar('onEdit', { range: e.hoja('VAP_Staff').getRange(2, 4), source: e.maestro });
    e.llamar('onEdit', { range: e.hoja('VAP_Staff').getRange(1, 2), source: e.maestro });
    e.llamar('onEdit', undefined);
    expect(e.google.estado.avisos).toEqual([]);
  });
});

describe('corrector único de Empresa e Id_Sage con el export de SAGE', () => {
  const montar = () =>
    entorno({
      staff: [
        fila('GALA', 1, 'Correcta Prueba, Ana', DNI_1), // 2
        fila('GALA', 99, 'Mueve Numero, Beto', DNI_2), // 3 · está en SAGE con otro número
        fila('GALA', 1017, 'Cambia Empresa, Carla', '33333333P'), // 4 · SAGE manda, aunque sea 1000+
        fila('GALA', 4, 'Ocupante Fuera, Dora', '44444444A'), // 5 · no está y su número es de otra persona
        fila('GALA', 1050, 'Externa Libre, Eva', '55555555K'), // 6 · no está y su número no lo usa nadie
        fila('GALA', 70, 'De Baja, Fran', '66666666Q', false), // 7 · no se toca
        fila('JOSE', 11, 'Limpieza Uno, Gil', ''), // 8 · sin SAGE: ni se toca ni se marca
        fila('JOSE', 11, 'Limpieza Dos, Hugo', ''), // 9 · mismo número que la 8: provisional
        fila('CERVANTES', 3, 'Rodriguez De Paterna Segura, Luis Jorge', '99999999R'), // 10 · recortado
        fila('CERVANTES', 5, 'Abreviada Gomez, María Pamela', '77777777B'), // 11 · Mª
        fila('GALA', 60, 'Dos Contratos, Eva', '88888888Y'), // 12 · varias veces en SAGE
      ],
      sage: [
        ['GALA', 1, 'CORRECTA PRUEBA, ANA'],
        ['GALA', 2, 'MUEVE NUMERO, BETO'],
        ['CTM MOTOR', 8, 'CAMBIA EMPRESA, CARLA'],
        ['GALA', 4, 'DUENA REAL, INES'],
        ['GALA', 71, 'DE BAJA, FRAN'],
        ['CERVANTES', 3, 'RODRIGUEZ DE PA SEGURA, LUIS JORGE'],
        ['CERVANTES', 5, 'ABREVIADA GOMES, Mª PAMELA'],
        ['GALA', 61, 'DOS CONTRATOS, EVA'],
        ['CERVANTES', 62, 'DOS CONTRATOS, EVA'],
      ],
    });
  const COL_OBS = 6;
  const quedan = (e) => e.volcado('VAP_Staff').slice(1).map((f) => [f[0], String(f[1]), f[COL_OBS] || '']);

  it('simular no cambia las pestañas y cuenta cada caso', () => {
    const e = montar();
    const antes = JSON.stringify(e.volcado('VAP_Staff'));
    const r = plano(e.llamar('simularCorreccionEmpresaIdSage'));
    expect(JSON.stringify(e.volcado('VAP_Staff'))).toBe(antes);
    expect(r).toEqual({ escrito: false, correctas: 3, cambiar: 2, numeroProvisional: 2, revisar: 2, sinSage: 1 });
    expect(e.volcado('correccion_empresa_idsage')).toHaveLength(1 + 6);
  });

  it('con nombre en SAGE pone lo de SAGE; sin él conserva el número o pone provisional', () => {
    const e = montar();
    e.llamar('ejecutarCorreccionEmpresaIdSage');
    const q = quedan(e);
    expect(q[0]).toEqual(['GALA', '1', '']);
    expect(q[1]).toEqual(['GALA', '2', '']);
    expect(q[2]).toEqual(['MOTOR INTEGRAL', '8', '']);
    expect(q[3].slice(0, 2)).toEqual(['GALA', '9000']);
    expect(q[3][2]).toContain('es de otra persona');
    expect(q[4].slice(0, 2)).toEqual(['GALA', '1050']);
    expect(q[4][2]).toContain('se conserva su número');
    expect(q[5]).toEqual(['GALA', '70', '']);
    expect(q[6]).toEqual(['JOSE', '11', '']);
    expect(q[7].slice(0, 2)).toEqual(['JOSE', '9001']);
    expect(q[8]).toEqual(['CERVANTES', '3', '']);
    expect(q[9]).toEqual(['CERVANTES', '5', '']);
    expect(q[10][2]).toContain('varias veces');
    expect(e.volcado('VAP_Staff')[0][COL_OBS]).toBe('Observaciones');
  });

  it('marca en amarillo solo las celdas de número revisadas y escribe únicamente A, B y Observaciones', () => {
    const e = montar();
    e.llamar('ejecutarCorreccionEmpresaIdSage');
    const columnas = e.google.estado.escrituras.filter((w) => w.hoja === 'VAP_Staff').map((w) => w.rango[0]);
    expect([...new Set(columnas)].sort()).toEqual(['A', 'B', 'G']);
    const amarillas = e.google.estado.formato.filter((x) => JSON.stringify(x).includes('#fff2cc'));
    expect(amarillas).toHaveLength(4);
  });

  it('repetirlo no vuelve a numerar ni duplica observaciones, y respeta lo escrito a mano', () => {
    const e = montar();
    e.hoja('VAP_Staff').getRange(1, 7).setValue('Observaciones');
    e.hoja('VAP_Staff').getRange(6, 7).setValue('nota a mano');
    e.llamar('ejecutarCorreccionEmpresaIdSage');
    const primera = quedan(e);
    e.llamar('ejecutarCorreccionEmpresaIdSage');
    expect(quedan(e).map((f) => f.slice(0, 2))).toEqual(primera.map((f) => f.slice(0, 2)));
    expect(quedan(e)[4][2]).toBe('nota a mano | [SAGE] No está en el export de SAGE; se conserva su número.');
  });

  it('una persona de JOSE no se mueve aunque su nombre esté en SAGE', () => {
    const e = entorno({ staff: [fila('JOSE', 13, 'Tambien En Sage, Ana')], sage: [['CERVANTES', 62, 'TAMBIEN EN SAGE, ANA']] });
    e.llamar('ejecutarCorreccionEmpresaIdSage');
    expect(e.volcado('VAP_Staff')[1].slice(0, 2)).toEqual(['JOSE', 13]);
  });

  it('INTERCASTILLA se trata igual que JOSE: ni se contrasta ni se marca', () => {
    const e = entorno({ staff: [fila('INTERCASTILLA', 2, 'Fuera De Sage, Ana')], sage: [['GALA', 1, 'OTRA, PERSONA']] });
    expect(plano(e.llamar('ejecutarCorreccionEmpresaIdSage'))).toMatchObject({ revisar: 0, sinSage: 1 });
  });

  it('sin el libro de SAGE configurado lo dice y no escribe', () => {
    const e = entorno({ staff: [fila('GALA', 1, 'A, B')] });
    expect(() => e.llamar('simularCorreccionEmpresaIdSage')).toThrow('ID_LIBRO_EXPORT_SAGE');
  });
});
