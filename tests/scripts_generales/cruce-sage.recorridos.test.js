// RECORRIDOS (extremo a extremo del backend) de VAP_Script_Cruce_BBDD_Personas_SAGE.gs:
// cruzarBBDDConSage() desde el CSV de Drive y las hojas de la BBDD hasta las cuatro hojas nuevas.
// Datos 100% ficticios (DNI 0000000nX, nombres inventados). Referencias: SSD §7.6 · RF-04 · RNF-02 · RNF-12.
import { describe, expect, it } from 'vitest';
import { CAB_PROFESORES, CAB_SECRETARIAS, csvSage, ddmmyyyy, entornoCruce, plano } from './ayudas.js';

const GALA = 'AUTOESCUELA GALA S.L.';
const CERV = 'SERVICIOS EMPRESARIALES CERVANTES,';
const esFecha = (v) => Object.prototype.toString.call(v) === '[object Date]';
const tabla = (hoja) => hoja.volcar().map((fila) => fila.map((v) => (esFecha(v) ? ddmmyyyy(v) : v)));

const CSV = () => csvSage([
  [GALA, '10', 'PEREZ GOMEZ, ANA', '00000001A', '01/02/2020', ''],
  [GALA, '11', 'LEON DE TORIBIO, NURIA', '00000002B', '01/01/2019', ''],
  [CERV, '12', 'RUIZ SANZ, MARIA TERE', '00000003C', '01/01/2018', ''],
  [GALA, '13', 'LOPEZ RUIZ, JOSE', '00000004D', '01/01/2017', ''],
  [GALA, '14', 'STAFF UNO, LUIS', '00000005E', '01/01/2021', ''],
  [GALA, '1001', 'COLABORADOR UNO, PEPE', '00000006F', '01/01/2021', ''],
  [GALA, '15', 'NOTARIA DE PRUEBA', '00000007G', '01/01/2021', ''],
  [GALA, '16', 'ANTIGUO BAJA, MARTA', '00000008H', '01/01/2010', '01/01/2015'],
  ['OTRA EMPRESA AJENA SA', '17', 'AJENO UNO, PABLO', '00000009J', '01/01/2021', ''],
  [GALA, '18', '', '', '', ''],
]);
const SECRETARIAS = () => [CAB_SECRETARIAS,
  ['GALA', '10', 'S1', 'PEREZ GOMEZ, ANA', true, '', ''],
  ['GALA', '', 'S2', 'LEÓN TORIBIO, NURIA DE', true, '', ''],
  ['GALA', '99', 'S3', 'LOPEZ RUIZ, JOSE', true, '', ''],
  ['GALA', '', 'S4', 'FICTICIO NADIE, JUAN', true, '', ''],
  ['GALA', '10', 'S5', 'PEREZ GOMEZ, ANA', true, '', ''],
  ['', '', '', '', '', '', ''],
];
const PROFESORES = () => [CAB_PROFESORES,
  ['GALA', '12', 'P1', 'RUIZ SANZ, Mª TERESA', true, '', '', 'B'],
  ['GALA', '13', 'P2', 'LOPEZ RUIZ, JOSE', true, '', '', 'A'],
];
const entorno = (extra = {}) => entornoCruce({ csv: CSV(), secretarias: SECRETARIAS(), profesores: PROFESORES(), ...extra });
const NUEVAS = ['VAP_Secretarias_CRUCE', 'VAP_Profesores_CRUCE', 'VAP_Cruce_Incidencias', 'VAP_Staff'];
const nombresDeHojas = (ent) => ent.libro.getSheets().map((h) => h.getName());

const RESUMEN = [
  '── RESUMEN DEL CRUCE ──',
  'VAP_Secretarias: 5 filas · 4 con DNI · 1 sin match',
  'VAP_Profesores: 2 filas · 2 con DNI · 0 sin match',
  'INFO-NOMBRE: 1', 'P1: 1', 'P3: 1', 'P7: 1', 'P8: 2', 'P9-SOLO_EN_BBDD: 1', 'P9-SOLO_EN_SAGE-ALTA: 1',
].join('\n');

describe('recorrido feliz: cruzarBBDDConSage() con una BBDD y un CSV representativos', () => {
  it('devuelve y registra el resumen, avisa con un toast y crea exactamente las cuatro hojas nuevas', () => {
    const ent = entorno();
    const resumen = ent.e.llamar('cruzarBBDDConSage');
    expect(resumen).toBe(RESUMEN);
    expect(ent.google.estado.logs.at(-1)).toBe(RESUMEN);
    expect(ent.google.estado.logs[0]).toMatch(/SAGE: .*9/);          // 9 registros con nombre (se salta la fila vacía)
    expect(ent.google.estado.avisos).toStrictEqual([{ mensaje: 'Cruce terminado. Revisa VAP_Cruce_Incidencias.', titulo: 'VAP' }]);
    expect(nombresDeHojas(ent)).toStrictEqual(['VAP_Secretarias', 'VAP_Profesores', ...NUEVAS]);
  });

  it('NO MODIFICA ninguna hoja existente (SSD §7.6)', () => {
    const ent = entorno();
    const antes = { s: plano(ent.hoja('VAP_Secretarias').volcar()), p: plano(ent.hoja('VAP_Profesores').volcar()) };
    ent.e.llamar('cruzarBBDDConSage');
    expect(plano(ent.hoja('VAP_Secretarias').volcar())).toStrictEqual(antes.s);
    expect(plano(ent.hoja('VAP_Profesores').volcar())).toStrictEqual(antes.p);
  });

  it('VAP_Secretarias_CRUCE: DNI y datos de SAGE por persona, filas de origen y revisión', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    const t = tabla(ent.hoja('VAP_Secretarias_CRUCE'));
    expect(t[0]).toStrictEqual(['Empresa', 'Id_Sage', 'ID_Secre', 'Nombre_Secretaria', 'DNI', 'Alta', 'Fecha Alta', 'Fecha Baja', 'Nombre_SAGE', 'Match', 'Fila_Origen', 'Revisión']);
    expect(t).toHaveLength(6);
    const dup = 'DUPLICADA · 2 filas de esta misma persona en GALA 10. Están juntas aquí debajo. Vienen de las filas 2, 6 de VAP_Secretarias (ver columna Fila_Origen; NO son los números de fila de esta copia, que va reordenada)';
    expect(t[1]).toStrictEqual(['GALA', '10', 'GALA_10', 'PEREZ GOMEZ, ANA', '00000001A', true, '01/02/2020', '', 'PEREZ GOMEZ, ANA', 'exacto · empresa+id', 2, dup]);
    // el emparejado por nombre corrige el Id vacío y tolera que las partículas viajen de sitio
    expect(t[2]).toStrictEqual(['GALA', '11', 'GALA_11', 'LEÓN TORIBIO, NURIA DE', '00000002B', true, '01/01/2019', '', 'LEON DE TORIBIO, NURIA', 'exacto · nombre en empresa', 3, 'Id_Sage BBDD "" ≠ SAGE "11"']);
    // Id equivocado en la BBDD pero persona en las dos hojas
    expect(t[3].slice(0, 5)).toStrictEqual(['GALA', '13', 'GALA_13', 'LOPEZ RUIZ, JOSE', '00000004D']);
    expect(t[3][11]).toBe('EN LAS DOS HOJAS · la misma persona figura en VAP_Secretarias fila 4 y en VAP_Profesores fila 3 (filas de origen, ver columna Fila_Origen) | Id_Sage BBDD "99" ≠ SAGE "13"');
    // sin match
    expect(t[4]).toStrictEqual(['GALA', '', 'GALA_', 'FICTICIO NADIE, JUAN', '', true, '', '', '', 'SIN MATCH', 5, 'No se encuentra en SAGE']);
    expect(t[5][10]).toBe(6);
  });

  it('VAP_Profesores_CRUCE: añade la tipología y corrige la empresa con la de SAGE', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    const t = tabla(ent.hoja('VAP_Profesores_CRUCE'));
    expect(t[0]).toStrictEqual(['Empresa', 'Id_Sage', 'ID_Profesor', 'Nombre', 'DNI', 'Tipología_Profesor', 'Alta', 'Fecha_Alta', 'Fecha_Baja', 'Nombre_SAGE', 'Match', 'Fila_Origen', 'Revisión']);
    expect(t[1]).toStrictEqual(['CERVANTES', '12', 'CERVANTES_12', 'RUIZ SANZ, MARIA TERESA', '00000003C', 'B', true, '01/01/2018', '', 'RUIZ SANZ, MARIA TERE', 'normalizado · nombre global', 2, 'Empresa BBDD "GALA" ≠ SAGE "CERVANTES"']);
    expect(t[2].slice(0, 6)).toStrictEqual(['GALA', '13', 'GALA_13', 'LOPEZ RUIZ, JOSE', '00000004D', 'A']);
  });

  it('VAP_Cruce_Incidencias: una fila por incidencia, ordenadas por tipo', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    const t = tabla(ent.hoja('VAP_Cruce_Incidencias'));
    expect(t[0]).toStrictEqual(['Tipo', 'Hoja', 'Fila', 'Empresa', 'Id_Sage', 'Nombre', 'DNI', 'Detalle', 'Dato en BBDD', 'Dato en SAGE']);
    expect(t.slice(1).map((f) => f[0])).toStrictEqual(['P1', 'P3', 'P7', 'P8', 'P8', 'P9-SOLO_EN_BBDD', 'P9-SOLO_EN_SAGE-ALTA', 'INFO-NOMBRE']);
    expect(t[3]).toStrictEqual(['P7', 'VAP_Secretarias', 3, 'GALA', '11', 'LEÓN TORIBIO, NURIA DE', '00000002B', 'Id_Sage ausente en la BBDD', '', '11']);
    expect(t[7]).toStrictEqual(['P9-SOLO_EN_SAGE-ALTA', '(SAGE)', 6, 'GALA', '14', 'STAFF UNO, LUIS', '00000005E', 'Está en SAGE y no en la BBDD · en alta', '', `${GALA} 14 · alta 01/01/2021`]);
  });

  it('P9: no se listan proveedores (≥1000), no personas (notaría), bajas de más de 5 años ni empresas fuera de ámbito', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    const nombres = tabla(ent.hoja('VAP_Cruce_Incidencias')).filter((f) => f[1] === '(SAGE)').map((f) => f[5]);
    expect(nombres).toStrictEqual(['STAFF UNO, LUIS']);
  });

  it('VAP_Staff: el resto del personal de alta, sin filtro de empresa, con orden y avisos', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    const t = tabla(ent.hoja('VAP_Staff'));
    expect(t[0]).toStrictEqual(['Empresa', 'Id_Sage', 'ID_Staff', 'Nombre', 'DNI', 'Tipo', 'Alta', 'Fecha_Alta', 'Nombre_SAGE', 'Fila_CSV', 'Revisión']);
    expect(t.slice(1).map((f) => [f[1], f[5], f[10]])).toStrictEqual([
      ['14', 'PLANTILLA', ''], ['17', 'PLANTILLA', ''], ['1001', 'COLABORADOR', ''], ['15', 'PLANTILLA', 'No parece una persona física'],
    ]);
    // quien tiene baja (hace más de 5 años) o ya está en la BBDD no entra
    expect(t.map((f) => f[4])).not.toContain('00000008H');
    expect(t.map((f) => f[4])).not.toContain('00000001A');
  });

  it('los colores y formatos se aplican por hoja (prioridad de pintado)', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    const c = plano(ent.e.valor('CFG.COLORES'));
    const fondos = ent.formato.filter((x) => x.m === 'setBackgrounds' && x.hoja === 'VAP_Secretarias_CRUCE');
    expect(plano(fondos[0].a[0]).map((f) => f[0])).toStrictEqual([c.P1_DUPLICADO, c.P8_DISCREPANCIA, c.P3_EN_AMBAS_HOJAS, c.SIN_MATCH, c.P1_DUPLICADO]);
    const staff = ent.formato.find((x) => x.m === 'setBackgrounds' && x.hoja === 'VAP_Staff');
    expect(plano(staff.a[0]).map((f) => f[0])).toStrictEqual([null, null, null, c.P5_NO_ES_PERSONA]);
  });
});

describe('repetibilidad y datos a medias', () => {
  it('ejecutarlo dos veces da exactamente el mismo resultado y no duplica hojas ni filas', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    const uno = NUEVAS.map((n) => tabla(ent.hoja(n)));
    const resumen2 = ent.e.llamar('cruzarBBDDConSage');
    expect(resumen2).toBe(RESUMEN);
    expect(NUEVAS.map((n) => tabla(ent.hoja(n)))).toStrictEqual(uno);
    expect(nombresDeHojas(ent)).toHaveLength(6);
  });

  it('si la BBDD cambia entre ejecuciones, la copia refleja el cambio y no quedan filas viejas', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    ent.hoja('VAP_Secretarias').cargar([CAB_SECRETARIAS, ['GALA', '10', 'S1', 'PEREZ GOMEZ, ANA', true, '', '']]);
    ent.e.llamar('cruzarBBDDConSage');
    expect(tabla(ent.hoja('VAP_Secretarias_CRUCE'))).toHaveLength(2);
    expect(tabla(ent.hoja('VAP_Cruce_Incidencias')).map((f) => f[0])).not.toContain('P1');
  });

  it('una persona de la BBDD que pasa a figurar en SAGE con baja pasa a Alta = false en la copia', () => {
    const csv = csvSage([[GALA, '10', 'PEREZ GOMEZ, ANA', '00000001A', '01/02/2020', '01/03/2026']]);
    const ent = entornoCruce({ csv, secretarias: [CAB_SECRETARIAS, ['GALA', '10', 'S1', 'PEREZ GOMEZ, ANA', true, '', '']] });
    ent.e.llamar('cruzarBBDDConSage');
    const fila = tabla(ent.hoja('VAP_Secretarias_CRUCE'))[1];
    expect([fila[5], fila[7]]).toStrictEqual([false, '01/03/2026']);
  });

  it('sin el CSV falla ANTES de crear o tocar ninguna hoja', () => {
    const ent = entorno({ sinCsv: true });
    expect(() => ent.e.llamar('cruzarBBDDConSage')).toThrow(/No encuentro "Empleados_070926.csv" en Drive/);
    expect(nombresDeHojas(ent)).toStrictEqual(['VAP_Secretarias', 'VAP_Profesores']);
    expect(ent.google.estado.avisos).toHaveLength(0);
  });

  it('con una cabecera del CSV renombrada falla antes de escribir', () => {
    const ent = entorno({ csv: csvSage([], ['Sociedad', 'Código', 'Apellidos y nombre', 'Dni', 'Alta', 'Baja']) });
    expect(() => ent.e.llamar('cruzarBBDDConSage')).toThrow(/El CSV no trae la columna "Razón social"/);
    expect(nombresDeHojas(ent)).toHaveLength(2);
  });

  it('si falta VAP_Profesores falla sin dejar a medias la copia de VAP_Secretarias', () => {
    const ent = entorno({ profesores: null });
    expect(() => ent.e.llamar('cruzarBBDDConSage')).toThrow('No existe la hoja "VAP_Profesores"');
    expect(nombresDeHojas(ent)).toStrictEqual(['VAP_Secretarias']);
  });

  it('si falta una columna obligatoria de la BBDD falla con su nombre y no escribe nada', () => {
    const ent = entorno({ secretarias: [CAB_SECRETARIAS.filter((c) => c !== 'Id_Sage'), ['GALA', 'S1', 'A B', true, '', '']] });
    expect(() => ent.e.llamar('cruzarBBDDConSage')).toThrow('Falta la columna "idSage" en VAP_Secretarias');
    expect(nombresDeHojas(ent)).toHaveLength(2);
  });

  it('script no vinculado a la hoja (sin libro activo): el cruce termina igualmente y el resumen queda en el registro', () => {
    const ent = entorno();
    ent.google.activar(null);
    expect(ent.e.llamar('cruzarBBDDConSage')).toBe(RESUMEN);
    expect(ent.google.estado.avisos).toHaveLength(0);
  });

  it('con BBDD y CSV vacíos termina con resumen a cero y las cuatro hojas solo con cabecera', () => {
    const ent = entornoCruce();
    const resumen = ent.e.llamar('cruzarBBDDConSage');
    expect(resumen).toBe(['── RESUMEN DEL CRUCE ──', 'VAP_Secretarias: 0 filas · 0 con DNI · 0 sin match', 'VAP_Profesores: 0 filas · 0 con DNI · 0 sin match'].join('\n'));
    NUEVAS.forEach((n) => expect(ent.hoja(n).volcar()).toHaveLength(1));
  });
});

describe('variantes de entrada', () => {
  it('el CSV puede identificarse por CFG.CSV_FILE_ID en vez de por nombre', () => {
    const ent = entorno({ sinCsv: true });
    ent.google.archivo('id-concreto', 'otro_nombre.csv', CSV());
    ent.e.ejecutar("CFG.CSV_FILE_ID = 'id-concreto'");
    expect(ent.e.llamar('cruzarBBDDConSage')).toBe(RESUMEN);
  });
  it('el export de SAGE puede ser una hoja de Google en lugar de un CSV', () => {
    const ent = entorno({ sinCsv: true });
    const libro = ent.google.libro('sage-hoja');
    const filas = CSV().trim().split('\n').map((l) => l.split(';'));
    libro.conHoja('Hoja 1', filas);
    ent.google.archivo('sage-hoja', 'Empleados_070926.csv', '', 'application/vnd.google-apps.spreadsheet');
    expect(ent.e.llamar('cruzarBBDDConSage')).toBe(RESUMEN);
  });
  it('CFG.NOMBRE_DESDE = "SAGE" escribe los nombres literales de SAGE en las copias', () => {
    const ent = entorno();
    ent.e.ejecutar("CFG.NOMBRE_DESDE = 'SAGE'");
    ent.e.llamar('cruzarBBDDConSage');
    expect(tabla(ent.hoja('VAP_Profesores_CRUCE'))[1][3]).toBe('RUIZ SANZ, MARIA TERE');
  });
  it('las hojas CRUCE ya existentes con datos viejos se vacían y se reescriben', () => {
    const ent = entorno();
    ent.libro.conHoja('VAP_Staff', [['basura', 'vieja'], ['x', 'y'], ['z', 'w']]);
    ent.e.llamar('cruzarBBDDConSage');
    expect(ent.hoja('VAP_Staff').volcar()[0][0]).toBe('Empresa');
    expect(ent.hoja('VAP_Staff').volcar()).toHaveLength(5);
  });
  it('la fecha de «hoy» es la fijada por el entorno (P11 repetible): con otra fecha cambia qué bajas se traen', () => {
    // El 14/03/2021 es de baja: con "hoy" = 2026 queda fuera (>5 años); con "hoy" = 2024 entra.
    const csv = csvSage([[GALA, '5', 'ANTIGUO BAJA, MARTA', '00000008H', '01/01/2010', '14/03/2021']]);
    const en2026 = entornoCruce({ csv });
    en2026.e.llamar('cruzarBBDDConSage');
    expect(tabla(en2026.hoja('VAP_Cruce_Incidencias'))).toHaveLength(1);
    const en2024 = entornoCruce({ csv, opciones: { ahora: '2024-03-15T10:00:00Z' } });
    en2024.e.llamar('cruzarBBDDConSage');
    expect(tabla(en2024.hoja('VAP_Cruce_Incidencias'))[1][0]).toBe('P9-SOLO_EN_SAGE-BAJA');
  });
});

describe('observaciones de comportamiento (sin requisito que las respalde)', () => {
  it('una persona sin Id_Sage y sin match recibe el identificador "EMPRESA_" (vacío tras el guion bajo)', () => {
    const ent = entorno();
    ent.e.llamar('cruzarBBDDConSage');
    expect(tabla(ent.hoja('VAP_Secretarias_CRUCE'))[4][2]).toBe('GALA_');
  });
});
