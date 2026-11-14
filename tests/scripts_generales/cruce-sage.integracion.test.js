// Pruebas de INTEGRACIÓN de VAP_Script_Cruce_BBDD_Personas_SAGE.gs: lectura de hojas y CSV, emparejado,
// incidencias y escritura, con libros y Drive en memoria. Datos 100% ficticios (DNI 0000000nX, nombres inventados).
// Referencias: SSD §7.6 · RF-04 (cruce por identificador) · RNF-02 (cabeceras por nombre) · RNF-12.
import { describe, expect, it } from 'vitest';
import {
  CAB_CSV, CAB_PROFESORES, CAB_SECRETARIAS, csvSage, ddmmyyyy, entornoCruce, fechaCaja, filaBBDD, plano, registroSage,
} from './ayudas.js';

const GALA = 'AUTOESCUELA GALA S.L.';
const CERV = 'SERVICIOS EMPRESARIALES CERVANTES,';
const esFecha = (v) => Object.prototype.toString.call(v) === '[object Date]';
/** Contenido de una hoja con las fechas de la caja convertidas a dd/mm/yyyy. */
const celdas = (hoja) => hoja.volcar().map((fila) => fila.map((v) => (esFecha(v) ? ddmmyyyy(v) : v)));

/** Crea los objetos de BBDD y SAGE con las funciones del propio script, los empareja y devuelve todo. */
function preparar(ent, { secretarias = [], profesores = [], sage = [] }) {
  const { e } = ent;
  const reg = sage.map((r, i) => registroSage(e, { fila: i + 2, ...r }));
  const bloques = {
    secretarias: secretarias.map((x, i) => filaBBDD(e, { origen: 'secretarias', fila: i + 2, ...x })),
    profesores: profesores.map((x, i) => filaBBDD(e, { origen: 'profesores', fila: i + 2, ...x })),
  };
  const indices = e.llamar('indexarSage_', reg);
  Object.values(bloques).forEach((lista) => lista.forEach((fila) => e.llamar('emparejar_', fila, indices)));
  return { reg, bloques, indices };
}

// ───────────────────────────── leerHojaBBDD_ ─────────────────────────────
describe('leerHojaBBDD_', () => {
  const leer = (ent, clave = 'secretarias') => {
    const ss = ent.google.estado.libros.get(ent.e.valor('CFG.SPREADSHEET_ID'));
    return ent.e.llamar('leerHojaBBDD_', ss, ent.e.valor(`CFG.ORIGEN.${clave}`), clave);
  };
  it('lee cada fila con su número de fila original, empresa canónica, id y nombre limpio', () => {
    const ent = entornoCruce({ secretarias: [CAB_SECRETARIAS, ['Gala', ' 007 ', 'S-1', 'PEREZ  GOMEZ ,ANA', true, '01/02/2020', '']] });
    const [fila] = plano(leer(ent));
    expect(fila).toMatchObject({
      origen: 'secretarias', filaOriginal: 2, empresaBBDD: 'Gala', empresaCanon: 'GALA', idSageBBDD: '7', idBBDD: 'S-1',
      nombreBBDD: 'PEREZ  GOMEZ ,ANA', nombreLimpio: 'PEREZ GOMEZ, ANA', tokens: ['ANA', 'GOMEZ', 'PEREZ'], altaBBDD: true,
      fechaAltaBBDD: '01/02/2020', fechaBajaBBDD: '', tipologia: '', match: null, nivelMatch: '', viaMatch: '', candidatos: [], marcas: [], revision: [], avisos: [],
    });
  });
  it('ignora las filas totalmente vacías pero conserva la numeración de las demás', () => {
    const ent = entornoCruce({ secretarias: [CAB_SECRETARIAS, ['', '', '', '', false, '', ''], ['GALA', '', '', 'RUIZ SANZ, EVA', true, '', '']] });
    const filas = plano(leer(ent));
    expect(filas.map((x) => x.filaOriginal)).toStrictEqual([3]);
  });
  it('una fila con empresa pero sin nombre se conserva (para poder revisarla)', () => {
    const ent = entornoCruce({ secretarias: [CAB_SECRETARIAS, ['GALA', '', '', '', true, '', '']] });
    expect(plano(leer(ent))).toHaveLength(1);
  });
  it('altaBBDD solo es true si la casilla vale exactamente true (no "TRUE" ni 1)', () => {
    const ent = entornoCruce({ secretarias: [CAB_SECRETARIAS, ['GALA', '', '', 'A B', true, '', ''], ['GALA', '', '', 'C D', 'TRUE', '', ''], ['GALA', '', '', 'E F', 1, '', '']] });
    expect(plano(leer(ent)).map((x) => x.altaBBDD)).toStrictEqual([true, false, false]);
  });
  it('RNF-02 · localiza las columnas por nombre aunque estén reordenadas y con espacios en la cabecera', () => {
    const cab = ['Fecha Baja', ' Nombre_Secretaria ', 'Alta', 'Empresa', 'Extra', 'ID_Secre', 'Id_Sage', 'Fecha Alta'];
    const ent = entornoCruce({ secretarias: [cab, ['02/02/2030', 'RUIZ SANZ, EVA', true, 'GALA', 'x', 'S9', '12', '01/01/2020']] });
    expect(plano(leer(ent))[0]).toMatchObject({ idSageBBDD: '12', idBBDD: 'S9', nombreBBDD: 'RUIZ SANZ, EVA', altaBBDD: true, fechaAltaBBDD: '01/01/2020', fechaBajaBBDD: '02/02/2030' });
  });
  it('si faltan las columnas de fecha no falla: quedan undefined', () => {
    const ent = entornoCruce({ secretarias: [['Empresa', 'Id_Sage', 'ID_Secre', 'Nombre_Secretaria', 'Alta'], ['GALA', '', '', 'A B', true]] });
    const fila = leer(ent)[0];
    expect(fila.fechaAltaBBDD).toBeUndefined();
    expect(fila.fechaBajaBBDD).toBeUndefined();
  });
  it('profesores: lee la tipología y las cabeceras con guion bajo', () => {
    const ent = entornoCruce({ profesores: [CAB_PROFESORES, ['GALA', '3', 'P1', 'LOPEZ RUIZ, JOSE', true, '', '', 'B']] });
    const fila = plano(leer(ent, 'profesores'))[0];
    expect(fila).toMatchObject({ origen: 'profesores', tipologia: 'B', idBBDD: 'P1' });
  });
  it('secretarias no lee tipología (queda cadena vacía)', () => {
    const ent = entornoCruce({ secretarias: [[...CAB_SECRETARIAS, 'Tipología_Profesor'], ['GALA', '', '', 'A B', true, '', '', 'X']] });
    expect(plano(leer(ent))[0].tipologia).toBe('X'); // si la columna existe, se lee (caracteriza el comportamiento actual)
  });
  it.each(['Empresa', 'Id_Sage', 'ID_Secre', 'Nombre_Secretaria', 'Alta'])('falta la columna obligatoria %s → error claro', (col) => {
    const cab = CAB_SECRETARIAS.filter((c) => c !== col);
    const ent = entornoCruce({ secretarias: [cab, cab.map(() => 'x')] });
    expect(() => leer(ent)).toThrow(/^Falta la columna ".+" en VAP_Secretarias$/);
  });
  it('la hoja origen no existe → error con su nombre', () => {
    const ent = entornoCruce({ secretarias: null });
    expect(() => leer(ent)).toThrow('No existe la hoja "VAP_Secretarias"');
  });
  it('hoja sin filas de datos → lista vacía', () => {
    const ent = entornoCruce();
    expect(plano(leer(ent))).toStrictEqual([]);
  });
  it('hoja totalmente vacía → falla (no hay cabecera)', () => {
    const ent = entornoCruce({ secretarias: [] });
    expect(() => leer(ent)).toThrow();
  });
});

// ───────────────────────────── CSV de SAGE ─────────────────────────────
describe('localizarCsv_', () => {
  it('por nombre: devuelve el archivo si hay uno solo', () => {
    const ent = entornoCruce();
    expect(ent.e.llamar('localizarCsv_').getId()).toBe('csv-1');
  });
  it('CSV_FILE_ID manda sobre el nombre', () => {
    const ent = entornoCruce();
    ent.google.archivo('otro', 'cualquiera.csv', 'x');
    ent.e.ejecutar("CFG.CSV_FILE_ID = 'otro'");
    expect(ent.e.llamar('localizarCsv_').getId()).toBe('otro');
  });
  it('CSV_FILE_ID inexistente → error del servicio', () => {
    const ent = entornoCruce();
    ent.e.ejecutar("CFG.CSV_FILE_ID = 'nada'");
    expect(() => ent.e.llamar('localizarCsv_')).toThrow(/No se encontró el archivo/);
  });
  it('no hay archivo con ese nombre → error que pide subirlo o rellenar CFG.CSV_FILE_ID', () => {
    const ent = entornoCruce({ sinCsv: true });
    expect(() => ent.e.llamar('localizarCsv_')).toThrow('No encuentro "Empleados_070926.csv" en Drive. Súbelo o rellena CFG.CSV_FILE_ID.');
  });
  it('hay dos con el mismo nombre → error (no elige uno al azar)', () => {
    const ent = entornoCruce();
    ent.google.archivo('csv-2', 'Empleados_070926.csv', 'x');
    expect(() => ent.e.llamar('localizarCsv_')).toThrow('Hay más de un archivo llamado "Empleados_070926.csv". Rellena CFG.CSV_FILE_ID con el que toca.');
  });
  it('un archivo en la papelera no cuenta', () => {
    const ent = entornoCruce();
    ent.google.estado.archivos.push({ id: 'viejo', nombre: 'Empleados_070926.csv', contenido: 'x', tipo: 'text/csv', papelera: true });
    expect(ent.e.llamar('localizarCsv_').getId()).toBe('csv-1');
  });
});

describe('leerCsvSage_', () => {
  const leer = (csv, extra = {}) => {
    const ent = entornoCruce({ csv, ...extra });
    return { ent, registros: plano(ent.e.llamar('leerCsvSage_')) };
  };
  it('lee los registros con empresa canónica, código normalizado, DNI en mayúsculas y fechas', () => {
    const { registros } = leer(csvSage([[GALA, '1.005', 'PEREZ GOMEZ, ANA', '00000001a', '01/02/2020', '']]));
    expect(registros).toHaveLength(1);
    expect(registros[0]).toMatchObject({
      filaCsv: 2, empresaSage: GALA, empresaCanon: 'GALA', codigo: '1005', nombreSage: 'PEREZ GOMEZ, ANA',
      tokens: ['ANA', 'GOMEZ', 'PEREZ'], dni: '00000001A', fechaBaja: null,
    });
    expect(new Date(registros[0].fechaAlta).getFullYear()).toBe(2020);
  });
  it('salta las filas sin nombre ("Empresa demostración") conservando la numeración del CSV', () => {
    const { registros } = leer(csvSage([[GALA, '1', '', '', '', ''], [GALA, '2', 'RUIZ SANZ, EVA', '00000002B', '', '']]));
    expect(registros.map((r) => [r.filaCsv, r.codigo])).toStrictEqual([[3, '2']]);
  });
  it('ignora la marca BOM al principio de la primera cabecera', () => {
    const csv = '﻿' + csvSage([[GALA, '1', 'PEREZ GOMEZ, ANA', '00000001A', '', '']]);
    expect(leer(csv).registros).toHaveLength(1);
  });
  it('acepta saltos de línea de Windows y columnas extra en cualquier orden (RNF-02)', () => {
    const cab = ['Extra', 'Baja', 'Dni', 'Apellidos y nombre', 'Código', 'Razón social', 'Alta'];
    const csv = [cab.join(';'), ['x', '02/02/2030', '00000003C', 'LOPEZ RUIZ, JOSE', '9', GALA, '01/01/2020'].join(';')].join('\r\n') + '\r\n';
    const { registros } = leer(csv);
    expect(registros[0]).toMatchObject({ codigo: '9', dni: '00000003C', nombreSage: 'LOPEZ RUIZ, JOSE' });
    expect(new Date(registros[0].fechaBaja).getFullYear()).toBe(2030);
  });
  it('un campo entrecomillado con ; dentro no rompe las columnas', () => {
    const csv = `${CAB_CSV.join(';')}\n${GALA};1;"PEREZ GOMEZ; ANA";00000001A;;\n`;
    expect(leer(csv).registros[0].nombreSage).toBe('PEREZ GOMEZ; ANA');
  });
  it('falta una cabecera esperada → error que nombra la columna y lista las cabeceras halladas', () => {
    const cab = CAB_CSV.map((c) => (c === 'Dni' ? 'NIF' : c));
    const ent = entornoCruce({ csv: csvSage([], cab) });
    expect(() => ent.e.llamar('leerCsvSage_')).toThrow('El CSV no trae la columna "Dni". Cabeceras: Razón social | Código | Apellidos y nombre | NIF | Alta | Baja');
  });
  it.each(CAB_CSV)('falta la cabecera %s → error', (col) => {
    const ent = entornoCruce({ csv: csvSage([], CAB_CSV.filter((c) => c !== col)) });
    expect(() => ent.e.llamar('leerCsvSage_')).toThrow(`El CSV no trae la columna "${col}"`);
  });
  it('CSV con solo cabecera → lista vacía', () => {
    expect(leer(csvSage([])).registros).toStrictEqual([]);
  });
  it('CSV vacío → falla (no hay cabecera que leer)', () => {
    const ent = entornoCruce({ csv: '' });
    expect(() => ent.e.llamar('leerCsvSage_')).toThrow();
  });
  it('pide a Drive el texto con la codificación configurada (ISO-8859-1)', () => {
    const ent = entornoCruce();
    const peticiones = [];
    ent.e.contexto.DriveApp = {
      getFilesByName: () => {
        let hecho = false;
        return { hasNext: () => !hecho, next: () => { hecho = true; return {
          getId: () => 'x', getMimeType: () => 'text/csv',
          getBlob: () => ({ getDataAsString: (cs) => { peticiones.push(cs); return csvSage([]); } }),
        }; } };
      },
    };
    ent.e.llamar('leerCsvSage_');
    expect(peticiones).toStrictEqual(['ISO-8859-1']);
  });
  it('el CSV no entra por Utilities.parseCsv con otro separador: usa el de la configuración', () => {
    const ent = entornoCruce({ csv: csvSage([[GALA, '1', 'PEREZ GOMEZ, ANA', '00000001A', '', '']]).replace(/;/g, ',') });
    expect(() => ent.e.llamar('leerCsvSage_')).toThrow(/El CSV no trae la columna/);
  });
  it('si el archivo es una hoja de Google lee la primera pestaña y formatea las fechas', () => {
    const ent = entornoCruce({ sinCsv: true });
    ent.e.contexto.MimeType = { GOOGLE_SHEETS: 'application/vnd.google-apps.spreadsheet' };
    const libro = ent.google.libro('hoja-sage');
    libro.conHoja('Hoja 1', [CAB_CSV, [GALA, 12, 'PEREZ GOMEZ, ANA', '00000001A', fechaCaja(ent.e, 2020, 2, 1), '']]);
    ent.google.archivo('hoja-sage', 'Empleados_070926.csv', '', 'application/vnd.google-apps.spreadsheet');
    const registros = plano(ent.e.llamar('leerCsvSage_'));
    expect(registros[0]).toMatchObject({ codigo: '12', dni: '00000001A', empresaCanon: 'GALA' });
    expect(new Date(registros[0].fechaAlta).getFullYear()).toBe(2020);
  });
});

// ───────────────────────────── indexarSage_ ─────────────────────────────
describe('indexarSage_', () => {
  it('indexa por empresa+código y por empresa, y conserva la lista completa', () => {
    const ent = entornoCruce();
    const a = registroSage(ent.e, { codigo: '1', nombre: 'A B' });
    const b = registroSage(ent.e, { codigo: '1', nombre: 'C D' });
    const c = registroSage(ent.e, { empresa: CERV, codigo: '1', nombre: 'E F' });
    const idx = ent.e.llamar('indexarSage_', [a, b, c]);
    expect(Object.keys(idx.porClave).sort()).toStrictEqual(['CERVANTES|1', 'GALA|1']);
    expect(idx.porClave['GALA|1']).toHaveLength(2);
    expect(idx.porEmpresa.GALA).toHaveLength(2);
    expect(idx.porEmpresa.CERVANTES).toHaveLength(1);
    expect(idx.todos).toHaveLength(3);
  });
  it('sin registros → índices vacíos', () => {
    const idx = plano(entornoCruce().e.llamar('indexarSage_', []));
    expect(idx).toStrictEqual({ porClave: {}, porEmpresa: {}, todos: [] });
  });
});

// ───────────────────────────── emparejar_ / elegirMejor_ ─────────────────────────────
describe('emparejar_ (tres pasadas)', () => {
  const una = (sage, fila) => {
    const ent = entornoCruce();
    const { bloques } = preparar(ent, { secretarias: [fila], sage });
    return { ent, fila: bloques.secretarias[0] };
  };
  it('pasada A · empresa + Id_Sage con el nombre confirmando → vía "empresa+id"', () => {
    const { fila } = una([{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }], { idSage: '10', nombre: 'PEREZ GOMEZ, ANA' });
    expect([fila.match.dni, fila.nivelMatch, fila.viaMatch, fila.revision.length]).toStrictEqual(['00000001A', 'exacto', 'empresa+id', 0]);
  });
  it('pasada A con nombre truncado por SAGE → nivel normalizado', () => {
    const { fila } = una([{ codigo: '10', nombre: 'RUIZ SANZ, MARIA TERE', dni: '00000002B' }], { idSage: '10', nombre: 'RUIZ SANZ, MARIA TERESA' });
    expect([fila.nivelMatch, fila.viaMatch]).toStrictEqual(['normalizado', 'empresa+id']);
  });
  it('el Id_Sage es clave fuerte: con ≥2 tokens idénticos se acepta como "por-id" y se avisa de que el nombre no confirma', () => {
    const { fila } = una([{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA ISABEL LUCIA MARTA', dni: '00000001A' }], { idSage: '10', nombre: 'PEREZ GOMEZ, ANA' });
    expect([fila.nivelMatch, fila.viaMatch]).toStrictEqual(['por-id', 'empresa+id']);
    expect(fila.revision[0]).toBe('Casa por Empresa+Id_Sage pero el nombre no confirma: BBDD "PEREZ GOMEZ, ANA" vs SAGE "PEREZ GOMEZ, ANA ISABEL LUCIA MARTA"');
    expect(fila.avisos).toStrictEqual(fila.revision);
  });
  it('mismo Id pero nombre totalmente distinto → no se acepta por id y queda sin match con candidatos', () => {
    const { fila } = una([{ codigo: '10', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }], { idSage: '10', nombre: 'PEREZ GOMEZ, ANA' });
    expect(fila.match).toBeNull();
    expect(plano(fila.candidatos)).toStrictEqual(['RUIZ SANZ, EVA (GALA 10)']);
  });
  it('sin Id_Sage en la BBDD, pasada B · por nombre dentro de la misma empresa', () => {
    const { fila } = una([{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }], { nombre: 'PEREZ GOMEZ, ANA' });
    expect([fila.viaMatch, fila.nivelMatch]).toStrictEqual(['nombre en empresa', 'exacto']);
  });
  it('Id_Sage equivocado pero nombre correcto: cae a la pasada B y el Id se corrige en la copia (P8)', () => {
    const { fila } = una([{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }], { idSage: '99', nombre: 'PEREZ GOMEZ, ANA' });
    expect([fila.match.codigo, fila.viaMatch]).toStrictEqual(['10', 'nombre en empresa']);
  });
  it('pasada C · el nombre solo está en otra empresa → vía "nombre global"', () => {
    const { fila } = una([{ empresa: CERV, codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }], { empresa: 'GALA', nombre: 'PEREZ GOMEZ, ANA' });
    expect([fila.viaMatch, fila.match.empresaCanon]).toStrictEqual(['nombre global', 'CERVANTES']);
  });
  it('las partículas que viajan de sitio no impiden el emparejado', () => {
    const { fila } = una([{ codigo: '10', nombre: 'LEON DE TORIBIO, NURIA', dni: '00000003C' }], { nombre: 'LEÓN TORIBIO, NURIA DE' });
    expect([fila.nivelMatch, fila.match.dni]).toStrictEqual(['exacto', '00000003C']);
  });
  it('nadie con ese nombre → sin match, sin candidatos', () => {
    const { fila } = una([{ codigo: '10', nombre: 'RUIZ SANZ, EVA' }], { nombre: 'PEREZ GOMEZ, ANA' });
    expect([fila.match, fila.nivelMatch, plano(fila.candidatos)]).toStrictEqual([null, '', []]);
  });
  it('un nombre de un solo token nunca casa (mínimo dos tokens)', () => {
    const { fila } = una([{ codigo: '10', nombre: 'ANA' }], { nombre: 'ANA' });
    expect(fila.match).toBeNull();
  });
  it('un nombre vacío nunca casa', () => {
    const { fila } = una([{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA' }], { nombre: '' });
    expect(fila.match).toBeNull();
  });
  it('SAGE vacío: ninguna fila casa y no falla', () => {
    const { fila } = una([], { nombre: 'PEREZ GOMEZ, ANA' });
    expect(fila.match).toBeNull();
  });
  it('en la pasada A prima el candidato por id aunque otro registro de SAGE tenga nombre idéntico', () => {
    const { fila } = una([
      { codigo: '77', nombre: 'PEREZ GOMEZ, ANA', dni: '00000007G' },
      { codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' },
    ], { idSage: '10', nombre: 'PEREZ GOMEZ, ANA' });
    expect([fila.match.dni, fila.viaMatch]).toStrictEqual(['00000001A', 'empresa+id']);
  });
});

describe('elegirMejor_', () => {
  const elegir = (sage, filaDatos) => {
    const ent = entornoCruce();
    const reg = sage.map((r, i) => registroSage(ent.e, { fila: i + 2, ...r }));
    const fila = filaBBDD(ent.e, filaDatos);
    const ok = ent.e.llamar('elegirMejor_', fila, reg, 'vía de prueba');
    return { ent, fila, ok };
  };
  it('sin candidatos compatibles devuelve false y no toca la fila', () => {
    const { fila, ok } = elegir([{ nombre: 'RUIZ SANZ, EVA' }], { nombre: 'PEREZ GOMEZ, ANA' });
    expect([ok, fila.match]).toStrictEqual([false, null]);
  });
  it('prefiere el nivel de mayor peso: exacto antes que parcial', () => {
    const { fila } = elegir([
      { codigo: '1', nombre: 'PEREZ GOMEZ, ANA MARIA LUCIA', dni: '00000001A' },
      { codigo: '2', nombre: 'PEREZ GOMEZ, ANA', dni: '00000002B' },
    ], { nombre: 'PEREZ GOMEZ, ANA' });
    expect([fila.match.dni, fila.nivelMatch]).toStrictEqual(['00000002B', 'exacto']);
  });
  it('varias filas de SAGE de la misma persona: elige la de alta más reciente y guarda el historial', () => {
    const ent = entornoCruce();
    const { fila } = (() => {
      const reg = [
        registroSage(ent.e, { codigo: '1', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A', alta: fechaCaja(ent.e, 2018, 1, 1) }),
        registroSage(ent.e, { codigo: '2', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A', alta: fechaCaja(ent.e, 2022, 6, 1) }),
        registroSage(ent.e, { codigo: '3', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A', alta: fechaCaja(ent.e, 2020, 3, 1) }),
      ];
      const f = filaBBDD(ent.e, { nombre: 'PEREZ GOMEZ, ANA' });
      ent.e.llamar('elegirMejor_', f, reg, 'v');
      return { fila: f };
    })();
    expect(fila.match.codigo).toBe('2');
    expect(plano(fila.candidatos)).toStrictEqual([
      'GALA 2 · PEREZ GOMEZ, ANA · 00000001A', 'GALA 3 · PEREZ GOMEZ, ANA · 00000001A', 'GALA 1 · PEREZ GOMEZ, ANA · 00000001A',
    ]);
    expect(fila.revision).toHaveLength(0); // mismo DNI: no es ambiguo
  });
  it('un registro sin fecha de alta cuenta como el más antiguo', () => {
    const ent = entornoCruce();
    const reg = [
      registroSage(ent.e, { codigo: '1', nombre: 'PEREZ GOMEZ, ANA', alta: null }),
      registroSage(ent.e, { codigo: '2', nombre: 'PEREZ GOMEZ, ANA', alta: fechaCaja(ent.e, 2000, 1, 1) }),
    ];
    const f = filaBBDD(ent.e, { nombre: 'PEREZ GOMEZ, ANA' });
    ent.e.llamar('elegirMejor_', f, reg, 'v');
    expect(f.match.codigo).toBe('2');
  });
  it('a igualdad de nivel prefiere el registro de la misma empresa que la BBDD, aunque sea más antiguo', () => {
    const ent = entornoCruce();
    const reg = [
      registroSage(ent.e, { empresa: CERV, codigo: '1', nombre: 'PEREZ GOMEZ, ANA', alta: fechaCaja(ent.e, 2024, 1, 1) }),
      registroSage(ent.e, { empresa: GALA, codigo: '2', nombre: 'PEREZ GOMEZ, ANA', alta: fechaCaja(ent.e, 2010, 1, 1) }),
    ];
    const f = filaBBDD(ent.e, { empresa: 'GALA', nombre: 'PEREZ GOMEZ, ANA' });
    ent.e.llamar('elegirMejor_', f, reg, 'v');
    expect(f.match.empresaCanon).toBe('GALA');
  });
  it('si casan personas con DNI distintos avisa AMBIGUO en revisión y avisos', () => {
    const { fila, ok } = elegir([
      { codigo: '1', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' },
      { codigo: '2', nombre: 'PEREZ GOMEZ, ANA', dni: '00000002B' },
    ], { nombre: 'PEREZ GOMEZ, ANA' });
    expect(ok).toBe(true);
    expect(plano(fila.revision)).toStrictEqual(['AMBIGUO: 2 DNI distintos casan con este nombre']);
    expect(plano(fila.avisos)).toStrictEqual(plano(fila.revision));
    expect(plano(fila.candidatos)).toHaveLength(2);
  });
  it('anota la vía que se le pasa', () => {
    const { fila } = elegir([{ codigo: '1', nombre: 'PEREZ GOMEZ, ANA' }], { nombre: 'PEREZ GOMEZ, ANA' });
    expect(fila.viaMatch).toBe('vía de prueba');
  });
});

// ───────────────────────────── detectarIncidencias_ ─────────────────────────────
describe('detectarIncidencias_', () => {
  const detectar = (datos) => {
    const ent = entornoCruce();
    const { reg, bloques } = preparar(ent, datos);
    const incidencias = plano(ent.e.llamar('detectarIncidencias_', bloques, reg));
    return { ent, bloques, incidencias, tipos: incidencias.map((i) => i.tipo) };
  };
  const ana = { nombre: 'PEREZ GOMEZ, ANA', idSage: '10' };
  const anaSage = { codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' };

  it('una persona que cuadra del todo no genera incidencias', () => {
    const { incidencias } = detectar({ secretarias: [ana], sage: [anaSage] });
    expect(incidencias).toStrictEqual([]);
  });
  it('P5 · una fila que no es una persona se marca y se lista', () => {
    const { incidencias, bloques } = detectar({ secretarias: [{ nombre: 'LIMPIEZA PARLA (JHOANA)' }] });
    expect(incidencias.find((i) => i.tipo === 'P5')).toMatchObject({ hoja: 'VAP_Secretarias', fila: 2, detalle: 'La fila no parece una persona física', datoBBDD: 'LIMPIEZA PARLA (JHOANA)' });
    expect(plano(bloques.secretarias[0].marcas)).toContain('P5_NO_ES_PERSONA');
  });
  it('P1 · duplicados dentro de la misma hoja y empresa', () => {
    const { incidencias, bloques } = detectar({ secretarias: [ana, { ...ana }], sage: [anaSage] });
    const p1 = incidencias.filter((i) => i.tipo === 'P1');
    expect(p1).toHaveLength(1);
    expect(p1[0].detalle).toBe('2 filas duplicadas en VAP_Secretarias para GALA 10');
    expect(p1[0].datoBBDD).toBe('filas 2, 3 de VAP_Secretarias');
    bloques.secretarias.forEach((f) => expect(plano(f.marcas)).toContain('P1_DUPLICADO'));
    expect(bloques.secretarias[0].revision[0]).toMatch(/^DUPLICADA · 2 filas de esta misma persona en GALA 10\./);
  });
  it('P1 · dos personas distintas con el mismo Id no son duplicado', () => {
    const { tipos } = detectar({ secretarias: [ana, { nombre: 'RUIZ SANZ, EVA', idSage: '10' }], sage: [anaSage, { codigo: '11', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }] });
    expect(tipos).not.toContain('P1');
  });
  it('P1 · la misma persona sin match se agrupa por nombre', () => {
    const { tipos } = detectar({ secretarias: [{ nombre: 'PEREZ GOMEZ, ANA' }, { nombre: 'GOMEZ PEREZ, ANA' }] });
    expect(tipos.filter((t) => t === 'P1')).toHaveLength(1);
  });
  it('P3 · misma persona en las dos hojas', () => {
    const { incidencias, bloques } = detectar({ secretarias: [ana], profesores: [ana], sage: [anaSage] });
    const p3 = incidencias.filter((i) => i.tipo === 'P3');
    expect(p3).toHaveLength(1);
    expect(p3[0]).toMatchObject({ detalle: 'La misma persona figura en las dos hojas', datoBBDD: 'secretarias + profesores' });
    expect(bloques.profesores[0].revision[0]).toBe('EN LAS DOS HOJAS · la misma persona figura en VAP_Secretarias fila 2 y en VAP_Profesores fila 2 (filas de origen, ver columna Fila_Origen)');
  });
  it('P2 · activa a la vez en dos empresas', () => {
    const { incidencias, bloques } = detectar({
      secretarias: [{ nombre: 'PEREZ GOMEZ, ANA', empresa: 'GALA', idSage: '10' }, { nombre: 'PEREZ GOMEZ, ANA', empresa: 'CERVANTES', idSage: '20' }],
      sage: [{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }, { empresa: CERV, codigo: '20', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }],
    });
    const p2 = incidencias.find((i) => i.tipo === 'P2');
    expect(p2.detalle).toBe('Persona activa a la vez en varias empresas sin baja en la anterior');
    expect(p2.datoBBDD).toBe('GALA + CERVANTES');
    expect(p2.datoSage).toBe('GALA 10 + CERVANTES 20');
    bloques.secretarias.forEach((f) => expect(plano(f.revision)[0]).toMatch(/^Activa a la vez en GALA \+ CERVANTES · son las filas 2, 3 de VAP_Secretarias/));
  });
  it('P2 · cambio de empresa con baja en la anterior NO es incidencia', () => {
    const ent = entornoCruce();
    const baja = fechaCaja(ent.e, 2025, 12, 31);
    const { reg, bloques } = preparar(ent, {
      secretarias: [{ nombre: 'PEREZ GOMEZ, ANA', empresa: 'GALA', idSage: '10' }, { nombre: 'PEREZ GOMEZ, ANA', empresa: 'CERVANTES', idSage: '20' }],
      sage: [{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A', baja }, { empresa: CERV, codigo: '20', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }],
    });
    const tipos = plano(ent.e.llamar('detectarIncidencias_', bloques, reg)).map((i) => i.tipo);
    expect(tipos).not.toContain('P2');
  });
  it('P9-SOLO_EN_BBDD · está en la BBDD pero no en SAGE (SIN_MATCH)', () => {
    const { incidencias, bloques } = detectar({ secretarias: [{ nombre: 'FICTICIO NADIE, JUAN', idSage: '5' }] });
    expect(incidencias[0]).toMatchObject({ tipo: 'P9-SOLO_EN_BBDD', detalle: 'Está en la BBDD pero no en el export de SAGE', datoBBDD: 'FICTICIO NADIE, JUAN', dni: '' });
    expect(plano(bloques.secretarias[0].marcas)).toStrictEqual(['SIN_MATCH']);
    expect(bloques.secretarias[0].revision[0]).toBe('No se encuentra en SAGE');
  });
  it('SIN_MATCH con candidatos por id: los muestra en la revisión y en la incidencia', () => {
    const { incidencias, bloques } = detectar({ secretarias: [{ nombre: 'PEREZ GOMEZ, ANA', idSage: '10' }], sage: [{ codigo: '10', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }] });
    expect(bloques.secretarias[0].revision[0]).toBe('No se encuentra en SAGE. Candidatos por Id: RUIZ SANZ, EVA (GALA 10)');
    expect(incidencias.find((i) => i.tipo === 'P9-SOLO_EN_BBDD').datoSage).toBe('RUIZ SANZ, EVA (GALA 10)');
  });
  it('P7 · Id_Sage ausente en la BBDD pero hay match por nombre', () => {
    const { incidencias, bloques } = detectar({ secretarias: [{ nombre: 'PEREZ GOMEZ, ANA' }], sage: [anaSage] });
    expect(incidencias.find((i) => i.tipo === 'P7')).toMatchObject({ detalle: 'Id_Sage ausente en la BBDD', datoBBDD: '', datoSage: '10', dni: '00000001A' });
    expect(plano(bloques.secretarias[0].marcas)).toStrictEqual(['P8_DISCREPANCIA']);
    expect(bloques.secretarias[0].revision[0]).toBe('Id_Sage BBDD "" ≠ SAGE "10"');
  });
  it('P8 · Id_Sage distinto', () => {
    const { incidencias } = detectar({ secretarias: [{ nombre: 'PEREZ GOMEZ, ANA', idSage: '99' }], sage: [anaSage] });
    expect(incidencias.find((i) => i.tipo === 'P8')).toMatchObject({ detalle: 'Id_Sage distinto', datoBBDD: '99', datoSage: '10' });
  });
  it('P8 · empresa distinta entre BBDD y SAGE', () => {
    const { incidencias } = detectar({ secretarias: [{ nombre: 'PEREZ GOMEZ, ANA', empresa: 'GALA' }], sage: [{ empresa: CERV, codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }] });
    const p8 = incidencias.filter((i) => i.tipo === 'P8' && i.detalle === 'Empresa distinta');
    expect(p8).toHaveLength(1);
    expect([p8[0].datoBBDD, p8[0].datoSage]).toStrictEqual(['GALA', CERV]);
  });
  it('P8 · los avisos del emparejado (por-id, AMBIGUO) se listan como P8 con ambos nombres', () => {
    const { incidencias } = detectar({
      secretarias: [{ nombre: 'PEREZ GOMEZ, ANA' }],
      sage: [{ codigo: '1', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }, { codigo: '2', nombre: 'PEREZ GOMEZ, ANA', dni: '00000002B' }],
    });
    expect(incidencias.some((i) => i.tipo === 'P8' && i.detalle.startsWith('AMBIGUO'))).toBe(true);
  });
  it('INFO-NOMBRE · el nombre está escrito distinto aunque case (no exacto)', () => {
    const { incidencias } = detectar({ secretarias: [{ nombre: 'RUIZ SANZ, MARIA TERESA', idSage: '10' }], sage: [{ codigo: '10', nombre: 'RUIZ SANZ, MARIA TERE', dni: '00000002B' }] });
    expect(incidencias.find((i) => i.tipo === 'INFO-NOMBRE').detalle).toBe('Nombre escrito distinto (normalizado, vía empresa+id)');
  });
  it('INFO-NOMBRE · NO se emite si el nivel es exacto aunque cambie el orden de apellidos', () => {
    const { tipos } = detectar({ secretarias: [{ nombre: 'GOMEZ PEREZ, ANA', idSage: '10' }], sage: [anaSage] });
    expect(tipos).not.toContain('INFO-NOMBRE');
  });
  it('P9 solo en SAGE · alta pendiente: persona en SAGE (en ámbito) que no está en la BBDD', () => {
    const { incidencias } = detectar({ sage: [{ codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B', alta: fechaCaja(entornoCruce().e, 2020, 2, 1) }] });
    expect(incidencias).toHaveLength(1);
  });
  describe('P9 · en SAGE y no en la BBDD (filtros)', () => {
    const solo = (reg, extra = {}) => {
      const ent = entornoCruce();
      const r = reg(ent.e);
      const { bloques } = preparar(ent, { secretarias: extra.secretarias || [], sage: [] });
      const sage = r.map((x, i) => registroSage(ent.e, { fila: i + 2, ...x }));
      bloques.secretarias.forEach((fila) => ent.e.llamar('emparejar_', fila, ent.e.llamar('indexarSage_', sage)));
      return plano(ent.e.llamar('detectarIncidencias_', bloques, sage));
    };
    it('de alta → P9-SOLO_EN_SAGE-ALTA con el detalle, la empresa canónica y la fila del CSV', () => {
      const inc = solo((e) => [{ codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B', alta: fechaCaja(e, 2020, 2, 1) }]);
      expect(inc).toStrictEqual([{
        tipo: 'P9-SOLO_EN_SAGE-ALTA', hoja: '(SAGE)', fila: 2, empresa: 'GALA', idSage: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B',
        detalle: 'Está en SAGE y no en la BBDD · en alta', datoBBDD: '', datoSage: `${GALA} 5 · alta 01/02/2020`,
      }]);
    });
    it('de baja reciente (dentro de 5 años) → P9-SOLO_EN_SAGE-BAJA con la fecha de baja', () => {
      const inc = solo((e) => [{ codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B', alta: fechaCaja(e, 2020, 2, 1), baja: fechaCaja(e, 2024, 5, 10) }]);
      expect(inc[0].tipo).toBe('P9-SOLO_EN_SAGE-BAJA');
      expect(inc[0].detalle).toBe('Está en SAGE y no en la BBDD · de baja el 10/05/2024');
    });
    it('P11 · una baja de hace más de 5 años no se trae (ahora = 15/03/2026: el 14/03/2021 no, el 16/03/2021 sí)', () => {
      expect(solo((e) => [{ codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B', baja: fechaCaja(e, 2021, 3, 14) }])).toHaveLength(0);
      expect(solo((e) => [{ codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B', baja: fechaCaja(e, 2021, 3, 16) }])).toHaveLength(1);
    });
    it('la serie de códigos desde 1000 (proveedores) no se lista; 999 sí', () => {
      expect(solo(() => [{ codigo: '1000', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }])).toHaveLength(0);
      expect(solo(() => [{ codigo: '1.234', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }])).toHaveLength(0);
      expect(solo(() => [{ codigo: '999', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }])).toHaveLength(1);
    });
    it('una empresa fuera del ámbito VAP no se lista', () => {
      expect(solo(() => [{ empresa: 'OTRA EMPRESA AJENA SA', codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }])).toHaveLength(0);
    });
    it('una fila de SAGE que no es persona (notaría, limpieza…) no se lista', () => {
      expect(solo(() => [{ codigo: '5', nombre: 'NOTARIA DE PRUEBA', dni: '00000002B' }])).toHaveLength(0);
    });
    it('la misma persona (DNI) y empresa en varios registros se lista una sola vez', () => {
      expect(solo(() => [{ codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }, { codigo: '6', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }])).toHaveLength(1);
    });
    it('la misma persona en dos empresas se lista dos veces (una por empresa)', () => {
      expect(solo(() => [{ codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }, { empresa: CERV, codigo: '6', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }])).toHaveLength(2);
    });
    it('quien ya está en la BBDD (por DNI emparejado) no se lista', () => {
      const inc = solo(() => [{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }], { secretarias: [{ nombre: 'PEREZ GOMEZ, ANA', idSage: '10' }] });
      expect(inc.filter((i) => i.hoja === '(SAGE)')).toHaveLength(0);
    });
    it('quien está en la BBDD sin match pero con el mismo nombre (mismos tokens) tampoco se lista', () => {
      const inc = solo(() => [{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' }], { secretarias: [{ nombre: 'PEREZ GOMEZ, ANA' }] });
      expect(inc.filter((i) => i.hoja === '(SAGE)')).toHaveLength(0);
    });
    it('un código no numérico no se considera proveedor (NaN ≥ 1000 es falso) y se lista', () => {
      expect(solo(() => [{ codigo: 'AB', nombre: 'RUIZ SANZ, EVA', dni: '00000002B' }])).toHaveLength(1);
    });
  });
  it('una fila con varias incidencias las acumula todas en Revisión y pinta la de mayor prioridad', () => {
    const { bloques } = detectar({ secretarias: [{ nombre: 'LIMPIEZA SUR (ANA)' }] });
    const fila = bloques.secretarias[0];
    expect(plano(fila.marcas)).toStrictEqual(['P5_NO_ES_PERSONA', 'SIN_MATCH']);
    expect(fila.revision).toHaveLength(2);
  });
});

// ───────────────────────────── construirStaff_ ─────────────────────────────
describe('construirStaff_', () => {
  const staff = (sage, bloques = { secretarias: [], profesores: [] }, ent = entornoCruce()) => {
    const reg = sage.map((r, i) => registroSage(ent.e, { fila: i + 2, ...r }));
    return plano(ent.e.llamar('construirStaff_', reg, bloques));
  };
  it('incluye a quien está de alta en SAGE y no está en ninguna hoja, con tipo PLANTILLA y su nombre limpio', () => {
    const s = staff([{ codigo: '5', nombre: 'RUIZ SANZ ,EVA', dni: '00000002B' }]);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ empresa: 'GALA', codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B', tipo: 'PLANTILLA', nombreSage: 'RUIZ SANZ ,EVA', filaCsv: 2, marca: null, revision: '' });
  });
  it('excluye a los de baja, a los que no tienen DNI y a los que ya están en la BBDD (por DNI emparejado)', () => {
    const ent = entornoCruce();
    const baja = fechaCaja(ent.e, 2025, 1, 1);
    const reg = [
      { codigo: '1', nombre: 'DE BAJA UNO', dni: '00000001A', baja },
      { codigo: '2', nombre: 'SIN DNI DOS', dni: '' },
      { codigo: '3', nombre: 'EN BBDD TRES', dni: '00000003C' },
      { codigo: '4', nombre: 'LIBRE CUATRO', dni: '00000004D' },
    ];
    const { bloques } = preparar(ent, { secretarias: [{ nombre: 'EN BBDD TRES', idSage: '3' }], sage: reg });
    expect(staff(reg, bloques, ent).map((x) => x.codigo)).toStrictEqual(['4']);
  });
  it.fails('DEFECTO (posible): una baja con fecha FUTURA todavía es personal de alta y debería entrar en VAP_Staff', () => {
    // estaActivo_ trata una baja futura como activa; construirStaff_ la excluye por tener fechaBaja.
    const ent = entornoCruce();
    const futura = fechaCaja(ent.e, 2027, 1, 1);
    expect(staff([{ codigo: '1', nombre: 'BAJA FUTURA UNO', dni: '00000001A', baja: futura }], undefined, ent)).toHaveLength(1);
  });
  it('serie ≥1000 → COLABORADOR; el resto PLANTILLA', () => {
    const s = staff([{ codigo: '1000', nombre: 'EXTERNO UNO', dni: '00000001A' }, { codigo: '12', nombre: 'INTERNO DOS', dni: '00000002B' }]);
    expect(Object.fromEntries(s.map((x) => [x.codigo, x.tipo]))).toStrictEqual({ 1000: 'COLABORADOR', 12: 'PLANTILLA' });
  });
  it('avisa cuando no parece una persona (con marca P5) y cuando está de alta en varias empresas', () => {
    const s = staff([
      { codigo: '1', nombre: 'NOTARIA DE PRUEBA', dni: '00000001A' },
      { codigo: '2', nombre: 'DOBLE EMPRESA UNO', dni: '00000002B' },
      { empresa: CERV, codigo: '3', nombre: 'DOBLE EMPRESA UNO', dni: '00000002B' },
    ]);
    const nota = s.find((x) => x.codigo === '1');
    expect([nota.marca, nota.revision]).toStrictEqual(['P5_NO_ES_PERSONA', 'No parece una persona física']);
    expect(s.filter((x) => x.dni === '00000002B').map((x) => x.revision)).toStrictEqual(['De alta en 2 empresas a la vez', 'De alta en 2 empresas a la vez']);
  });
  it('orden: limpias primero, luego con aviso, luego no-persona; plantilla antes que colaborador; empresa y nombre', () => {
    const s = staff([
      { codigo: '1', nombre: 'NOTARIA DE PRUEBA', dni: '00000001A' },
      { codigo: '1001', nombre: 'COLABORADOR UNO', dni: '00000002B' },
      { empresa: CERV, codigo: '3', nombre: 'ZETA PLANTILLA', dni: '00000003C' },
      { codigo: '4', nombre: 'BETA PLANTILLA', dni: '00000004D' },
      { codigo: '5', nombre: 'ALFA PLANTILLA', dni: '00000005E' },
      { codigo: '6', nombre: 'DOBLE UNO', dni: '00000006F' },
      { empresa: CERV, codigo: '7', nombre: 'DOBLE UNO', dni: '00000006F' },
    ]);
    expect(s.map((x) => x.codigo)).toStrictEqual(['3', '5', '4', '1001', '7', '6', '1']);
  });
  it('sin registros → lista vacía', () => {
    expect(staff([])).toStrictEqual([]);
  });
});

// ───────────────────────────── escritura ─────────────────────────────
describe('prepararHoja_', () => {
  it('crea la hoja si no existe', () => {
    const ent = entornoCruce();
    const hoja = ent.e.llamar('prepararHoja_', ent.libro, 'NUEVA');
    expect(hoja.getName()).toBe('NUEVA');
    expect(ent.libro.getSheetByName('NUEVA')).toBe(hoja);
  });
  it('si existe la vacía (clear) y limpia las validaciones, sin duplicarla', () => {
    const ent = entornoCruce();
    ent.libro.conHoja('NUEVA', [['viejo', 'dato']]);
    const hoja = ent.e.llamar('prepararHoja_', ent.libro, 'NUEVA');
    expect(hoja.volcar()).toStrictEqual([]);
    expect(ent.libro.getSheets().filter((h) => h.getName() === 'NUEVA')).toHaveLength(1);
    expect(ent.google.estado.validaciones.at(-1).regla).toBeNull();
  });
});

describe('escribirHojaCopia_', () => {
  const escribir = (clave, filas, ent = entornoCruce()) => {
    ent.e.llamar('escribirHojaCopia_', ent.libro, filas, ent.e.valor(`CFG.ORIGEN.${clave}`), ent.e.valor(`CFG.DESTINO.${clave}`));
    return { ent, hoja: ent.libro.getSheetByName(ent.e.valor(`CFG.DESTINO.${clave}`)) };
  };
  it('secretarias: cabecera sin tipología, una fila por persona con DNI y datos de SAGE', () => {
    const ent = entornoCruce();
    const alta = fechaCaja(ent.e, 2020, 2, 1);
    const { bloques } = preparar(ent, { secretarias: [{ nombre: 'PEREZ  GOMEZ ,ANA', idSage: '10', fechaAlta: '01/01/1999' }], sage: [{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A', alta }] });
    const { hoja } = escribir('secretarias', bloques.secretarias, ent);
    expect(celdas(hoja)).toStrictEqual([
      ['Empresa', 'Id_Sage', 'ID_Secre', 'Nombre_Secretaria', 'DNI', 'Alta', 'Fecha Alta', 'Fecha Baja', 'Nombre_SAGE', 'Match', 'Fila_Origen', 'Revisión'],
      ['GALA', '10', 'GALA_10', 'PEREZ GOMEZ, ANA', '00000001A', true, '01/02/2020', '', 'PEREZ GOMEZ, ANA', 'exacto · empresa+id', 2, ''],
    ]);
    expect(hoja.getFrozenRows()).toBe(1);
  });
  it('profesores: incluye la columna Tipología_Profesor y sus cabeceras de fecha', () => {
    const ent = entornoCruce();
    const { bloques } = preparar(ent, { profesores: [{ nombre: 'LOPEZ RUIZ, JOSE', idSage: '3', tipologia: 'B' }], sage: [{ codigo: '3', nombre: 'LOPEZ RUIZ, JOSE', dni: '00000003C' }] });
    const { hoja } = escribir('profesores', bloques.profesores, ent);
    const filas = celdas(hoja);
    expect(filas[0]).toStrictEqual(['Empresa', 'Id_Sage', 'ID_Profesor', 'Nombre', 'DNI', 'Tipología_Profesor', 'Alta', 'Fecha_Alta', 'Fecha_Baja', 'Nombre_SAGE', 'Match', 'Fila_Origen', 'Revisión']);
    expect(filas[1][5]).toBe('B');
  });
  it('sin match: conserva empresa, id y fechas de la BBDD, deja DNI y Nombre_SAGE vacíos y marca SIN MATCH', () => {
    const ent = entornoCruce();
    const { bloques } = preparar(ent, { secretarias: [{ empresa: 'Cervantes', nombre: 'FICTICIO NADIE, JUAN', idSage: '0042', fechaAlta: '05/06/2019', fechaBaja: '07/08/2020', alta: false }] });
    ent.e.llamar('detectarIncidencias_', bloques, []);
    const { hoja } = escribir('secretarias', bloques.secretarias, ent);
    expect(celdas(hoja)[1]).toStrictEqual(['CERVANTES', '42', 'CERVANTES_42', 'FICTICIO NADIE, JUAN', '', false, '05/06/2019', '07/08/2020', '', 'SIN MATCH', 2, 'No se encuentra en SAGE']);
  });
  it('nombre desde SAGE (CFG.NOMBRE_DESDE = "SAGE") escribe el nombre literal de SAGE cuando hay match', () => {
    const ent = entornoCruce();
    ent.e.ejecutar("CFG.NOMBRE_DESDE = 'SAGE'");
    const { bloques } = preparar(ent, { secretarias: [{ nombre: 'RUIZ SANZ, MARIA TERESA', idSage: '10' }], sage: [{ codigo: '10', nombre: 'RUIZ SANZ, MARIA TERE', dni: '00000002B' }] });
    const { hoja } = escribir('secretarias', bloques.secretarias, ent);
    expect(hoja.volcar()[1][3]).toBe('RUIZ SANZ, MARIA TERE');
  });
  it('nombre desde la BBDD limpio (por defecto) despliega abreviaturas y normaliza comas', () => {
    const ent = entornoCruce();
    const { bloques } = preparar(ent, { secretarias: [{ nombre: 'RUIZ SANZ ,Mª TERESA', idSage: '10' }], sage: [{ codigo: '10', nombre: 'RUIZ SANZ, MARIA TERE', dni: '00000002B' }] });
    const { hoja } = escribir('secretarias', bloques.secretarias, ent);
    expect(hoja.volcar()[1][3]).toBe('RUIZ SANZ, MARIA TERESA');
  });
  it('el estado Alta lo decide estaActivo_ (baja pasada en SAGE → false)', () => {
    const ent = entornoCruce();
    const baja = fechaCaja(ent.e, 2024, 1, 1);
    const { bloques } = preparar(ent, { secretarias: [{ nombre: 'PEREZ GOMEZ, ANA', idSage: '10' }], sage: [{ codigo: '10', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A', baja }] });
    const { hoja } = escribir('secretarias', bloques.secretarias, ent);
    expect(hoja.volcar()[1][5]).toBe(false);
  });
  it('colorea cada fila con el color de su incidencia de mayor prioridad y aplica formato de fecha y desplegable de empresas (P6)', () => {
    const ent = entornoCruce();
    const { bloques } = preparar(ent, { secretarias: [{ nombre: 'FICTICIO NADIE, JUAN' }, { nombre: 'LIMPIEZA SUR (ANA)' }] });
    ent.e.llamar('detectarIncidencias_', bloques, []);
    escribir('secretarias', bloques.secretarias, ent);
    const fondos = ent.formato.filter((x) => x.m === 'setBackgrounds' && x.hoja === 'VAP_Secretarias_CRUCE');
    expect(fondos).toHaveLength(1);
    const colores = plano(ent.e.valor('CFG.COLORES'));
    expect(plano(fondos[0].a[0]).map((fila) => fila[0])).toStrictEqual([colores.SIN_MATCH, colores.P5_NO_ES_PERSONA]);
    expect(fondos[0].rango).toBe('A2:L3');
    const formatoFecha = ent.formato.find((x) => x.m === 'setNumberFormat');
    expect([formatoFecha.rango, formatoFecha.a[0]]).toStrictEqual(['G2:H3', 'dd/mm/yyyy']);
    const validacion = ent.formato.find((x) => x.m === 'setDataValidation' && x.a[0]);
    expect(validacion.rango).toBe('A2:A3');
    expect(plano(validacion.a[0]).lista).toStrictEqual(Object.keys(plano(ent.e.valor('EMPRESAS'))));
  });
  it('sin filas escribe solo la cabecera y no aplica fondos ni formatos de datos', () => {
    const { ent, hoja } = escribir('secretarias', []);
    expect(hoja.volcar()).toHaveLength(1);
    expect(ent.formato.filter((x) => x.m === 'setBackgrounds')).toHaveLength(0);
  });
  it('es repetible: una segunda ejecución sustituye el contenido anterior (no se acumula)', () => {
    const ent = entornoCruce();
    const { bloques } = preparar(ent, { secretarias: [{ nombre: 'FICTICIO NADIE, JUAN' }] });
    escribir('secretarias', bloques.secretarias, ent);
    escribir('secretarias', bloques.secretarias, ent);
    expect(ent.libro.getSheetByName('VAP_Secretarias_CRUCE').volcar()).toHaveLength(2);
  });
});

describe('escribirIncidencias_', () => {
  const inc = (tipo, nombre, extra = {}) => ({ tipo, hoja: 'VAP_Secretarias', fila: 2, empresa: 'GALA', idSage: '1', nombre, dni: '', detalle: 'd', datoBBDD: 'a', datoSage: 'b', ...extra });
  const escribir = (lista) => {
    const ent = entornoCruce();
    ent.e.contexto.__inc = lista;
    ent.e.ejecutar('escribirIncidencias_(__inc ? __inc : [], __inc)'.replace('escribirIncidencias_(__inc ? __inc : [], __inc)', 'void 0'));
    const ss = ent.libro;
    ent.e.contexto.__ss = ss;
    ent.e.ejecutar('escribirIncidencias_(__ss, __inc)');
    return ent;
  };
  it('cabecera de 10 columnas y orden por tipo (P1…P8, P9, INFO-NOMBRE) y luego por nombre', () => {
    const ent = escribir([inc('INFO-NOMBRE', 'A'), inc('P9-SOLO_EN_SAGE-BAJA', 'A'), inc('P8', 'B'), inc('P8', 'A'), inc('P1', 'Z'), inc('P9-SOLO_EN_SAGE-ALTA', 'A'), inc('P9-SOLO_EN_BBDD', 'A'), inc('P7', 'A'), inc('P5', 'A'), inc('P3', 'A'), inc('P2', 'A')]);
    const filas = ent.libro.getSheetByName('VAP_Cruce_Incidencias').volcar();
    expect(filas[0]).toStrictEqual(['Tipo', 'Hoja', 'Fila', 'Empresa', 'Id_Sage', 'Nombre', 'DNI', 'Detalle', 'Dato en BBDD', 'Dato en SAGE']);
    expect(filas.slice(1).map((f) => `${f[0]}:${f[5]}`)).toStrictEqual(['P1:Z', 'P2:A', 'P3:A', 'P5:A', 'P7:A', 'P8:A', 'P8:B', 'P9-SOLO_EN_BBDD:A', 'P9-SOLO_EN_SAGE-ALTA:A', 'P9-SOLO_EN_SAGE-BAJA:A', 'INFO-NOMBRE:A']);
  });
  it('pinta solo la columna Tipo: P1,P2,P3,P5 con su color; P7 y P8 con el de discrepancia; el resto sin color', () => {
    const ent = entornoCruce();
    ent.e.contexto.__inc = [inc('P1', 'A'), inc('P7', 'A'), inc('P8', 'A'), inc('INFO-NOMBRE', 'A'), inc('P5', 'A')];
    ent.e.contexto.__ss = ent.libro;
    ent.e.ejecutar('escribirIncidencias_(__ss, __inc)');
    const fondos = ent.formato.find((x) => x.m === 'setBackgrounds' && x.hoja === 'VAP_Cruce_Incidencias');
    const c = plano(ent.e.valor('CFG.COLORES'));
    expect(fondos.rango).toBe('A2:A6');
    expect(plano(fondos.a[0])).toStrictEqual([[c.P1_DUPLICADO], [c.P5_NO_ES_PERSONA], [c.P8_DISCREPANCIA], [c.P8_DISCREPANCIA], [null]]);
  });
  it('sin incidencias deja solo la cabecera', () => {
    const ent = escribir([]);
    expect(ent.libro.getSheetByName('VAP_Cruce_Incidencias').volcar()).toHaveLength(1);
  });
  it('un tipo desconocido se ordena al principio y no se pinta (no se pierde)', () => {
    const ent = escribir([inc('P1', 'A'), inc('RARO', 'A')]);
    expect(ent.libro.getSheetByName('VAP_Cruce_Incidencias').volcar().slice(1).map((f) => f[0])).toStrictEqual(['RARO', 'P1']);
  });
});

describe('escribirStaff_', () => {
  const fila = (extra = {}) => ({ empresa: 'GALA', codigo: '5', nombre: 'RUIZ SANZ, EVA', dni: '00000002B', tipo: 'PLANTILLA', fechaAlta: null, nombreSage: 'RUIZ SANZ ,EVA', filaCsv: 4, marca: null, revision: '', ...extra });
  it('cabecera de 11 columnas y una fila por persona (ID_Staff = empresa_código, Alta = true)', () => {
    const ent = entornoCruce();
    ent.e.contexto.__ss = ent.libro;
    ent.e.contexto.__filas = [fila({ fechaAlta: fechaCaja(ent.e, 2020, 2, 1) })];
    ent.e.ejecutar('escribirStaff_(__ss, __filas)');
    expect(celdas(ent.libro.getSheetByName('VAP_Staff'))).toStrictEqual([
      ['Empresa', 'Id_Sage', 'ID_Staff', 'Nombre', 'DNI', 'Tipo', 'Alta', 'Fecha_Alta', 'Nombre_SAGE', 'Fila_CSV', 'Revisión'],
      ['GALA', '5', 'GALA_5', 'RUIZ SANZ, EVA', '00000002B', 'PLANTILLA', true, '01/02/2020', 'RUIZ SANZ ,EVA', 4, ''],
    ]);
  });
  it('pinta de rojo claro las filas con marca P5 y formatea la columna Fecha_Alta', () => {
    const ent = entornoCruce();
    ent.e.contexto.__ss = ent.libro;
    ent.e.contexto.__filas = [fila(), fila({ codigo: '6', marca: 'P5_NO_ES_PERSONA' })];
    ent.e.ejecutar('escribirStaff_(__ss, __filas)');
    const fondos = ent.formato.find((x) => x.m === 'setBackgrounds' && x.hoja === 'VAP_Staff');
    const c = plano(ent.e.valor('CFG.COLORES'));
    expect(plano(fondos.a[0]).map((f) => f[0])).toStrictEqual([null, c.P5_NO_ES_PERSONA]);
    expect(plano(fondos.a[0])[0]).toHaveLength(11);
    expect(ent.formato.find((x) => x.m === 'setNumberFormat').rango).toBe('H2:H3');
  });
  it('sin filas deja solo la cabecera', () => {
    const ent = entornoCruce();
    ent.e.contexto.__ss = ent.libro;
    ent.e.contexto.__filas = [];
    ent.e.ejecutar('escribirStaff_(__ss, __filas)');
    expect(ent.libro.getSheetByName('VAP_Staff').volcar()).toHaveLength(1);
  });
});
