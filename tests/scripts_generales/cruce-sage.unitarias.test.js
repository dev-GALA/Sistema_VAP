// Pruebas UNITARIAS de VAP_Script_Cruce_BBDD_Personas_SAGE.gs: funciones puras.
// Datos 100% ficticios. Referencias: SSD §7.6 · RF-04 (identificar por identificador) · RNF-16 (una responsabilidad por función).
import { describe, expect, it } from 'vitest';
import { CODIGO, cargarGs, ddmmyyyy, fechaCaja, filaBBDD, plano, registroSage } from './ayudas.js';

const nuevo = (opciones) => cargarGs(CODIGO.cruceSage, opciones);
const e = nuevo(); // las funciones puras no comparten estado: se puede reutilizar para llamar
const f = (nombre, ...args) => plano(e.llamar(nombre, ...args));

describe('configuración (CFG)', () => {
  it('los destinos son las cuatro hojas nuevas y los orígenes las dos de la BBDD (SSD §7.6)', () => {
    expect(f('Object.keys', e.valor('CFG.DESTINO'))).toStrictEqual(['secretarias', 'profesores', 'incidencias', 'staff']);
    expect(plano(e.valor('CFG.DESTINO'))).toStrictEqual({ secretarias: 'VAP_Secretarias_CRUCE', profesores: 'VAP_Profesores_CRUCE', incidencias: 'VAP_Cruce_Incidencias', staff: 'VAP_Staff' });
    expect([e.valor('CFG.ORIGEN.secretarias.hoja'), e.valor('CFG.ORIGEN.profesores.hoja')]).toStrictEqual(['VAP_Secretarias', 'VAP_Profesores']);
  });
  it('solo profesores lleva columna de tipología', () => {
    expect([e.valor('CFG.ORIGEN.secretarias.tipologia'), e.valor('CFG.ORIGEN.profesores.tipologia')]).toStrictEqual([false, true]);
  });
  it('el CSV es ; en ISO-8859-1 y la serie de proveedores arranca en 1000', () => {
    expect([e.valor('CFG.CSV_SEPARADOR'), e.valor('CFG.CSV_CHARSET'), e.valor('CFG.SERIE_PROVEEDORES_DESDE'), e.valor('CFG.ANIOS_MAX_BAJA')]).toStrictEqual([';', 'ISO-8859-1', 1000, 5]);
  });
  it('toda razón social canónica está en el ámbito VAP y hay un color por cada prioridad', () => {
    expect(plano(e.valor('EMPRESAS_EN_AMBITO'))).toStrictEqual(Object.keys(plano(e.valor('EMPRESAS'))));
    plano(e.valor('CFG.PRIORIDAD_COLOR')).forEach((m) => expect(plano(e.valor('CFG.COLORES'))[m]).toMatch(/^#[0-9A-F]{6}$/));
  });
  it('el peso de los niveles de emparejado es exacto > normalizado > parcial > por-id', () => {
    const p = plano(e.valor('PESO_NIVEL'));
    expect(p.exacto).toBeGreaterThan(p.normalizado);
    expect(p.normalizado).toBeGreaterThan(p.parcial);
    expect(p.parcial).toBeGreaterThan(p['por-id']);
  });
});

describe('normalizar_', () => {
  it.each([
    ['  Pérez   Gómez, Ana ', 'PEREZ GOMEZ ANA'],
    ['MUÑOZ', 'MUNOZ'],
    ['O\'Brien-Ruiz', 'O BRIEN RUIZ'],
    ['Mª Carmen', 'MA CARMEN'],
    ['Mº', 'MO'],
    ['ç ü ï', 'C U I'],
    ['a1b2', 'A1B2'],
    ['', ''], [null, ''], [undefined, ''], [0, ''], [12, '12'],
    ['...', ''],
  ])('normalizar_(%j) = %j', (entrada, esperado) => {
    expect(f('normalizar_', entrada)).toBe(esperado);
  });
});

describe('expandirAbreviaturas_', () => {
  it.each([
    ['Mª', 'MARIA'], ['mª', 'MARIA'], ['Mº', 'MARIA'], ['M.ª', 'MARIA'], ['Mª.', 'MARIA'],
    ['FCO.', 'FRANCISCO'], ['Fco', 'FRANCISCO'], ['FCA.', 'FRANCISCA'], ['Fca', 'FRANCISCA'],
    ['ANT.', 'ANTONIO'], ['MA.', 'MARIA'],
    ['MARTINEZ, Mª CARMEN', 'MARTINEZ, MARIA CARMEN'],
    ['GARCIA FCO. JAVIER', 'GARCIA FRANCISCO JAVIER'],
    ['ANA', 'ANA'], ['', ''], [null, ''],
  ])('expandirAbreviaturas_(%j) = %j', (entrada, esperado) => {
    expect(f('expandirAbreviaturas_', entrada)).toBe(esperado);
  });
  it('no inventa: "ANT" sin punto o "FCOSTA" no se despliegan', () => {
    expect(f('expandirAbreviaturas_', 'ANT')).toBe('ANT');
    expect(f('expandirAbreviaturas_', 'FCOSTA')).toBe('FCOSTA');
    expect(f('expandirAbreviaturas_', 'MAYA')).toBe('MAYA');
  });
});

describe('limpiarNombre_ (P10)', () => {
  it.each([
    ['PEREZ  GOMEZ ,ANA', 'PEREZ GOMEZ, ANA'],
    ['  PEREZ GOMEZ,ANA  ', 'PEREZ GOMEZ, ANA'],
    ['PEREZ GOMEZ, ANA,', 'PEREZ GOMEZ, ANA'],
    ['PEREZ GOMEZ, Mª ANGELES', 'PEREZ GOMEZ, MARIA ANGELES'],
    ['', ''], [null, ''], [undefined, ''],
  ])('limpiarNombre_(%j) = %j', (entrada, esperado) => {
    expect(f('limpiarNombre_', entrada)).toBe(esperado);
  });
  it('conserva tildes y mayúsculas/minúsculas: solo normaliza espacios, comas y abreviaturas', () => {
    expect(f('limpiarNombre_', 'Pérez Gómez,Ana')).toBe('Pérez Gómez, Ana');
  });
});

describe('tokens_', () => {
  it('normaliza, quita partículas y ordena: el orden de los apellidos no importa', () => {
    expect(f('tokens_', 'LEÓN TORIBIO, NURIA DE')).toStrictEqual(['LEON', 'NURIA', 'TORIBIO']);
    expect(f('tokens_', 'LEON DE TORIBIO, NURIA')).toStrictEqual(['LEON', 'NURIA', 'TORIBIO']);
  });
  it.each(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y'])('ignora la partícula %s', (p) => {
    expect(f('tokens_', `ANA ${p} PEREZ`)).toStrictEqual(['ANA', 'PEREZ']);
  });
  it('despliega las abreviaturas antes de tokenizar', () => {
    expect(f('tokens_', 'RUIZ, Mª CARMEN')).toStrictEqual(['CARMEN', 'MARIA', 'RUIZ']);
  });
  it('vacío, nulo o solo partículas → lista vacía', () => {
    expect(f('tokens_', '')).toStrictEqual([]);
    expect(f('tokens_', null)).toStrictEqual([]);
    expect(f('tokens_', 'DE LA Y')).toStrictEqual([]);
  });
  it('conserva tokens repetidos', () => {
    expect(f('tokens_', 'ANA ANA RUIZ')).toStrictEqual(['ANA', 'ANA', 'RUIZ']);
  });
});

describe('levenshtein1_', () => {
  it.each([
    ['ABCD', 'ABCD', true],      // iguales
    ['ABCD', 'ABXD', true],      // sustitución
    ['ABCD', 'ABC', true],       // borrado al final
    ['ABCD', 'BCD', true],       // borrado al principio
    ['ABCD', 'ACD', true],       // borrado en medio
    ['ACD', 'ABCD', true],       // inserción (b más largo)
    ['ABCD', 'ABXYD', false],    // dos inserciones
    ['ABCD', 'ABDC', false],     // transposición = 2 ediciones
    ['ABCD', 'WXYZ', false],
    ['ABCD', 'AB', false],       // diferencia de longitud > 1
    ['', '', true], ['', 'A', true], ['', 'AB', false],
    ['ABCDEF', 'ABCXEF', true],
    ['ABCDEF', 'AXCYEF', false], // dos sustituciones
  ])('levenshtein1_(%j, %j) = %s', (a, b, esperado) => {
    expect(f('levenshtein1_', a, b)).toBe(esperado);
    expect(f('levenshtein1_', b, a)).toBe(esperado); // simétrica
  });
});

describe('prefijoDe_', () => {
  it.each([
    ['MAR', 'MARIA', true], ['MARIA', 'MARIA', true], ['A', 'ANA', true],
    ['ANA', 'MARIA', false], ['', 'MARIA', false], ['MARIAS', 'MARIA', false],
  ])('prefijoDe_(%j, %j) = %s', (c, l, esperado) => {
    expect(f('prefijoDe_', c, l)).toBe(esperado);
  });
});

describe('tokensCompatibles_', () => {
  it.each([
    ['MARIA', 'MARIA', 'exacto'],
    ['MARI', 'MARIA', 'prefijo'],           // truncación de SAGE (≥3)
    ['MARIA', 'MARI', 'prefijo'],           // simétrico
    ['MAR', 'MARIA', 'prefijo'],            // 3 caracteres ya es prefijo fuerte
    ['MA', 'MARIA', 'prefijo-debil'],       // 2 caracteres
    ['M', 'MARIA', 'prefijo-debil'],        // inicial
    ['K', 'KATIA', 'prefijo-debil'],
    ['GARCIA', 'GARCIO', 'prefijo'],        // errata de un carácter (≥4)
    ['GARCIA', 'GARCIAS', 'prefijo'],       // prefijo
    ['PEREZ', 'PEREA', 'prefijo'],          // sustitución en token de 5
    ['ANA', 'ANO', null],                   // errata en token corto: no se acepta
    ['LUIS', 'LUCAS', null],
    ['MARIA', 'PEDRO', null],
    ['ANA', 'ELENA', null],
  ])('tokensCompatibles_(%j, %j) = %j', (a, b, esperado) => {
    expect(f('tokensCompatibles_', a, b)).toBe(esperado);
  });
});

describe('compararTokens_', () => {
  const cmp = (a, b) => f('compararTokens_', a, b);
  it('lista vacía en cualquiera de los lados → sin nivel', () => {
    expect(cmp([], ['A'])).toStrictEqual({ nivel: null, sobran: 99, exactos: 0 });
    expect(cmp(['A'], [])).toStrictEqual({ nivel: null, sobran: 99, exactos: 0 });
    expect(cmp([], [])).toStrictEqual({ nivel: null, sobran: 99, exactos: 0 });
  });
  it('conjuntos idénticos → exacto', () => {
    expect(cmp(['ANA', 'GOMEZ', 'PEREZ'], ['ANA', 'GOMEZ', 'PEREZ'])).toStrictEqual({ nivel: 'exacto', sobran: 0, exactos: 3 });
  });
  it('mismo número de tokens pero uno con prefijo → normalizado', () => {
    expect(cmp(['ANA', 'GOMEZ', 'MARIA'], ['ANA', 'GOMEZ', 'MARI'])).toStrictEqual({ nivel: 'normalizado', sobran: 0, exactos: 2 });
  });
  it('sobran 1 o 2 tokens en el más largo → parcial', () => {
    expect(cmp(['ANA', 'PEREZ'], ['ANA', 'GOMEZ', 'PEREZ'])).toStrictEqual({ nivel: 'parcial', sobran: 1, exactos: 2 });
    expect(cmp(['ANA', 'PEREZ'], ['ANA', 'GOMEZ', 'LOPEZ', 'PEREZ'])).toStrictEqual({ nivel: 'parcial', sobran: 2, exactos: 2 });
  });
  it('sobran más de 2 → sin nivel', () => {
    const r = cmp(['ANA', 'PEREZ'], ['ANA', 'A1', 'A2', 'A3', 'PEREZ']);
    expect(r.nivel).toBeNull();
    expect(r.sobran).toBe(3);
  });
  it('es simétrica: el orden de los argumentos no cambia el resultado', () => {
    expect(cmp(['ANA', 'GOMEZ', 'PEREZ'], ['ANA', 'PEREZ'])).toStrictEqual(cmp(['ANA', 'PEREZ'], ['ANA', 'GOMEZ', 'PEREZ']));
  });
  it('un token del conjunto corto sin pareja → sin nivel (pero cuenta los exactos)', () => {
    expect(cmp(['ANA', 'RUIZ'], ['ANA', 'PEREZ'])).toStrictEqual({ nivel: null, sobran: 99, exactos: 1 });
  });
  it('con un solo token casado no basta (mínimo dos)', () => {
    expect(cmp(['ANA'], ['ANA'])).toStrictEqual({ nivel: null, sobran: 99, exactos: 1 });
    expect(cmp(['ANA'], ['ANA', 'PEREZ']).nivel).toBeNull();
  });
  it('salvaguarda: un prefijo débil (inicial) exige al menos dos tokens idénticos', () => {
    // "M GARCIA" contra "MARIA GARCIA": solo 1 exacto + 1 débil → rechazado
    expect(cmp(['GARCIA', 'M'], ['GARCIA', 'MARIA']).nivel).toBeNull();
    // con dos idénticos y una inicial sí
    expect(cmp(['GARCIA', 'LOPEZ', 'M'], ['GARCIA', 'LOPEZ', 'MARIA']).nivel).toBe('normalizado');
  });
  it('las dos pasadas evitan que MARIA se coma el hueco de MARI cuando ambos están presentes', () => {
    const r = cmp(['LOPEZ', 'MARI', 'MARIA'], ['LOPEZ', 'MARI', 'MARIA']);
    expect(r).toStrictEqual({ nivel: 'exacto', sobran: 0, exactos: 3 });
    const r2 = cmp(['LOPEZ', 'MARI', 'MARIA'], ['LOPEZ', 'MARIA', 'MARIA']);
    expect(r2.nivel).toBe('normalizado');
  });
  it('la truncación de SAGE a 10 caracteres casa con el nombre completo', () => {
    const bbdd = f('tokens_', 'RUIZ SANZ, MARIA TERESA');
    const sage = f('tokens_', 'RUIZ SANZ, MARIA TERE');
    expect(cmp(bbdd, sage).nivel).toBe('normalizado');
  });
  it('una errata de un carácter en un token ≥4 se tolera (normalizado)', () => {
    expect(cmp(['GARCIA', 'LOPEZ', 'ANA'], ['GARCIO', 'LOPEZ', 'ANA']).nivel).toBe('normalizado');
  });
  it('el mismo token no se reutiliza para dos del otro lado: el segundo ANA queda como sobrante', () => {
    expect(cmp(['ANA', 'ANA', 'RUIZ'], ['ANA', 'RUIZ'])).toStrictEqual({ nivel: 'parcial', sobran: 1, exactos: 2 });
    expect(cmp(['ANA', 'RUIZ'], ['ANA', 'ANA'])).toStrictEqual({ nivel: null, sobran: 99, exactos: 1 });
  });
});

describe('canonizarEmpresa_ (P6)', () => {
  it.each([
    ['AUTOESCUELA GALA S.L.', 'GALA'], ['gala', 'GALA'], ['  Gala ', 'GALA'],
    ['ARCO VIAL, S.L.', 'ARCOVIAL'], ['arcovial', 'ARCOVIAL'],
    ['SERVICIOS EMPRESARIALES CERVANTES,', 'CERVANTES'], ['Servicios Empresariales Cervantes', 'CERVANTES'], ['Cervantes', 'CERVANTES'],
    ['VALDEARROYOS, S.L.', 'VALDEARROYOS'],
    ['DRIVERS FORMACION Y EMPLEO DE CONDUCTORES', 'DRIVERS'], ['Drivers Formación y Empleo de Conductores', 'DRIVERS'],
    ['LOGYFOR-ASOCIACION DE CENTROS DE FORMACION EN', 'LOGYFOR'],
    ['INTERCASTILLA', 'INTERCASTILLA'], ['JOSE', 'JOSE'],
  ])('canonizarEmpresa_(%j) = %j', (entrada, esperado) => {
    expect(f('canonizarEmpresa_', entrada)).toBe(esperado);
  });
  it('una empresa desconocida se conserva tal cual (recortada) para que se vea', () => {
    expect(f('canonizarEmpresa_', '  EMPRESA RARA SA ')).toBe('EMPRESA RARA SA');
  });
  it('vacío o solo signos → cadena vacía', () => {
    expect(f('canonizarEmpresa_', '')).toBe('');
    expect(f('canonizarEmpresa_', null)).toBe('');
    expect(f('canonizarEmpresa_', '  ')).toBe('');
  });
});

describe('normalizarCodigo_', () => {
  it.each([
    ['648', '648'], [648, '648'], ['1.000 ', '1000'], ['007', '7'], ['000', '0'], ['0', '0'],
    ['-', ''], ['', ''], [null, ''], [undefined, ''], ['  ', ''],
    ['A-12', 'A-12'],
  ])('normalizarCodigo_(%j) = %j', (entrada, esperado) => {
    expect(f('normalizarCodigo_', entrada)).toBe(esperado);
  });
});

describe('parsearFecha_', () => {
  const p = (v) => {
    const r = e.llamar('parsearFecha_', v);
    return r === null ? null : ddmmyyyy(r);
  };
  it.each([
    ['24/04/2026', '24/04/2026'],
    ['01/11/2021 0:00:00', '01/11/2021'],
    ['1/2/2020', '01/02/2020'],
    ['26/08/26', '26/08/2026'],
    ['  05/05/2005  ', '05/05/2005'],
  ])('texto %j → %j', (entrada, esperado) => {
    expect(p(entrada)).toBe(esperado);
  });
  it.each([[''], [null], [undefined], ['   '], ['abc'], ['2026-04-24'], ['24-04-2026'], [45000]])('%j → null', (v) => {
    expect(p(v)).toBeNull();
  });
  it('una fecha de la hoja (Date) se devuelve tal cual', () => {
    const d = fechaCaja(e, 2024, 2, 29);
    expect(e.llamar('parsearFecha_', d)).toBe(d);
  });
  it('un Date inválido → null', () => {
    expect(e.ejecutar('parsearFecha_(new Date("no"))')).toBeNull();
  });
  it('año de 2 dígitos se interpreta como 20xx', () => {
    expect(p('01/01/99')).toBe('01/01/2099');
  });
  it.fails('DEFECTO: una fecha imposible ("31/02/2024") debería dar null; hoy "rueda" a otra fecha (02/03/2024)', () => {
    expect(p('31/02/2024')).toBeNull();
  });
  it.fails('DEFECTO: mes 13 ("15/13/2024") debería dar null; hoy rueda a enero del año siguiente', () => {
    expect(p('15/13/2024')).toBeNull();
  });
});

describe('formatoFecha_', () => {
  it('formatea dd/MM/yyyy', () => {
    expect(e.ejecutar('formatoFecha_(new Date(2026, 3, 5))')).toBe('05/04/2026');
  });
  it.each([[null], [undefined], ['01/01/2020'], [0]])('%j → cadena vacía', (v) => {
    expect(e.llamar('formatoFecha_', v)).toBe('');
  });
  it('Date inválido → cadena vacía', () => {
    expect(e.ejecutar('formatoFecha_(new Date("no"))')).toBe('');
  });
});

describe('colorDe_ (prioridad de pintado)', () => {
  const colores = () => plano(e.valor('CFG.COLORES'));
  it('sin marcas → null (sin color)', () => {
    expect(e.llamar('colorDe_', [])).toBeNull();
  });
  it('una marca → su color', () => {
    expect(e.llamar('colorDe_', ['P1_DUPLICADO'])).toBe(colores().P1_DUPLICADO);
    expect(e.llamar('colorDe_', ['SIN_MATCH'])).toBe(colores().SIN_MATCH);
  });
  it('con varias gana la de mayor prioridad: P5 > P3 > P1 > P2 > P8 > SIN_MATCH', () => {
    const orden = ['P5_NO_ES_PERSONA', 'P3_EN_AMBAS_HOJAS', 'P1_DUPLICADO', 'P2_SIN_BAJA_ANTERIOR', 'P8_DISCREPANCIA', 'SIN_MATCH'];
    orden.forEach((marca, i) => {
      const inferiores = orden.slice(i + 1);
      expect(e.llamar('colorDe_', [...inferiores, marca])).toBe(colores()[marca]);
    });
  });
  it('una marca desconocida no pinta', () => {
    expect(e.llamar('colorDe_', ['OTRA'])).toBeNull();
  });
});

describe('marcar_', () => {
  it('añade la marca y el texto de revisión', () => {
    const fila = { marcas: [], revision: [] };
    e.contexto.__fila = fila;
    e.ejecutar("marcar_(__fila, 'P1_DUPLICADO', 'texto')");
    expect(plano(fila)).toStrictEqual({ marcas: ['P1_DUPLICADO'], revision: ['texto'] });
  });
  it('no repite ni la marca ni el texto si se marca dos veces', () => {
    const fila = { marcas: [], revision: [] };
    e.contexto.__fila = fila;
    e.ejecutar("marcar_(__fila, 'P1_DUPLICADO', 'texto'); marcar_(__fila, 'P1_DUPLICADO', 'texto')");
    expect(plano(fila)).toStrictEqual({ marcas: ['P1_DUPLICADO'], revision: ['texto'] });
  });
  it('misma marca con distinto texto: una marca y dos textos', () => {
    const fila = { marcas: [], revision: [] };
    e.contexto.__fila = fila;
    e.ejecutar("marcar_(__fila, 'P8_DISCREPANCIA', 'a'); marcar_(__fila, 'P8_DISCREPANCIA', 'b')");
    expect(plano(fila)).toStrictEqual({ marcas: ['P8_DISCREPANCIA'], revision: ['a', 'b'] });
  });
});

describe('agrupar_', () => {
  it('agrupa por la clave que devuelve la función y conserva el orden', () => {
    e.contexto.__lista = [1, 2, 3, 4, 5];
    expect(plano(e.ejecutar('agrupar_(__lista, function (x) { return x % 2 ? "impar" : "par"; })'))).toStrictEqual({ impar: [1, 3, 5], par: [2, 4] });
  });
  it('lista vacía → objeto vacío', () => {
    e.contexto.__lista = [];
    expect(plano(e.ejecutar('agrupar_(__lista, function (x) { return x; })'))).toStrictEqual({});
  });
});

describe('estaActivo_ (ahora = 15/03/2026)', () => {
  const activo = (extra, match = null) => {
    const fila = filaBBDD(e, { nombre: 'PEREZ GOMEZ, ANA', ...extra });
    fila.match = match;
    return e.llamar('estaActivo_', fila);
  };
  it('con match y sin baja en SAGE → activo', () => {
    expect(activo({}, registroSage(e, { nombre: 'PEREZ GOMEZ, ANA' }))).toBe(true);
  });
  it('con match y baja pasada → inactivo', () => {
    expect(activo({}, registroSage(e, { nombre: 'PEREZ GOMEZ, ANA', baja: fechaCaja(e, 2026, 3, 14) }))).toBe(false);
  });
  it('con match y baja futura → sigue activo', () => {
    expect(activo({}, registroSage(e, { nombre: 'PEREZ GOMEZ, ANA', baja: fechaCaja(e, 2026, 12, 31) }))).toBe(true);
  });
  it('SAGE manda sobre la BBDD: baja pasada en SAGE aunque la BBDD diga Alta=true', () => {
    expect(activo({ alta: true, fechaBaja: '' }, registroSage(e, { nombre: 'PEREZ GOMEZ, ANA', baja: fechaCaja(e, 2020, 1, 1) }))).toBe(false);
  });
  it('sin match: la fecha de baja de la BBDD pasada → inactivo; futura → activo', () => {
    expect(activo({ fechaBaja: '01/01/2020' })).toBe(false);
    expect(activo({ fechaBaja: '01/01/2030' })).toBe(true);
  });
  it('sin match y sin baja: lo decide la casilla Alta de la BBDD', () => {
    expect(activo({ alta: true })).toBe(true);
    expect(activo({ alta: false })).toBe(false);
  });
  it('sin match: una fecha de baja ilegible se ignora y decide Alta', () => {
    expect(activo({ fechaBaja: 'cualquier cosa', alta: true })).toBe(true);
  });
});

describe('asignar_', () => {
  it('rellena match, nivel y vía en la fila', () => {
    const fila = { match: null, nivelMatch: '', viaMatch: '' };
    e.contexto.__fila = fila;
    e.contexto.__reg = { dni: 'X' };
    e.ejecutar("asignar_(__fila, __reg, 'exacto', 'empresa+id')");
    expect(plano(fila)).toStrictEqual({ match: { dni: 'X' }, nivelMatch: 'exacto', viaMatch: 'empresa+id' });
  });
});

describe('fila_ (fila de la hoja de incidencias)', () => {
  it('sin match usa los datos de la BBDD y DNI vacío', () => {
    const fila = filaBBDD(e, { nombre: 'PEREZ GOMEZ, ANA', empresa: 'Cervantes', idSage: '12', fila: 7 });
    expect(f('fila_', 'P1', fila, 'det', 'a', 'b')).toStrictEqual({
      tipo: 'P1', hoja: 'VAP_Secretarias', fila: 7, empresa: 'CERVANTES', idSage: '12', nombre: 'PEREZ GOMEZ, ANA', dni: '', detalle: 'det', datoBBDD: 'a', datoSage: 'b',
    });
  });
  it('con match usa la empresa, el código y el DNI de SAGE', () => {
    const fila = filaBBDD(e, { origen: 'profesores', nombre: 'PEREZ GOMEZ, ANA', empresa: 'GALA', idSage: '1' });
    fila.match = registroSage(e, { empresa: 'ARCO VIAL, S.L.', codigo: '55', nombre: 'PEREZ GOMEZ, ANA', dni: '00000001A' });
    const r = f('fila_', 'P8', fila, 'd', '', '');
    expect([r.hoja, r.empresa, r.idSage, r.dni]).toStrictEqual(['VAP_Profesores', 'ARCOVIAL', '55', '00000001A']);
  });
});

describe('resumir_', () => {
  it('cuenta filas, con DNI, sin match y las incidencias por tipo (ordenadas)', () => {
    const a = filaBBDD(e, { nombre: 'A B' }); a.match = { dni: '1' };
    const b = filaBBDD(e, { nombre: 'C D' });
    const c = filaBBDD(e, { origen: 'profesores', nombre: 'E F' }); c.match = { dni: '2' };
    e.contexto.__bloques = { secretarias: [a, b], profesores: [c] };
    e.contexto.__inc = [{ tipo: 'P8' }, { tipo: 'P1' }, { tipo: 'P8' }];
    expect(e.ejecutar('resumir_(__bloques, __inc)')).toBe([
      '── RESUMEN DEL CRUCE ──',
      'VAP_Secretarias: 2 filas · 1 con DNI · 1 sin match',
      'VAP_Profesores: 1 filas · 1 con DNI · 0 sin match',
      'P1: 1', 'P8: 2',
    ].join('\n'));
  });
  it('sin filas ni incidencias solo deja la cabecera y los ceros', () => {
    e.contexto.__bloques = { secretarias: [], profesores: [] };
    e.contexto.__inc = [];
    expect(e.ejecutar('resumir_(__bloques, __inc)')).toBe(['── RESUMEN DEL CRUCE ──', 'VAP_Secretarias: 0 filas · 0 con DNI · 0 sin match', 'VAP_Profesores: 0 filas · 0 con DNI · 0 sin match'].join('\n'));
  });
});

describe('PATRONES_NO_PERSONA (P5)', () => {
  const noPersona = (n) => e.ejecutar(`PATRONES_NO_PERSONA.some(function (re) { return re.test(${JSON.stringify(n)}); })`);
  it.each([
    'LIMPIEZA PARLA (JHOANA)', 'LIMPIEZAS DEL SUR', 'NOTARIA FICTICIA', 'NOTARIO PEREZ', 'REGISTRO MERCANTIL DE NADA',
    'MERCANTIL DE PRUEBA', 'SERVICIOS PRUEBA S.L.', 'SERVICIOS PRUEBA SL', 'PRUEBA SLU', 'GESTION FICTICIA C.B.', 'FICTICIA CB',
    'ASOCIACION DE PRUEBA', 'ALGO (ALIAS)',
  ])('%s no es una persona', (n) => expect(noPersona(n)).toBe(true));
  it.each([
    'PEREZ GOMEZ, ANA', 'LOPEZ RUIZ, JOSE LUIS', 'MUNOZ SANZ, MARIA', 'GARCIA PRIETO, CARLOS', 'RUIZ (SAGE TRUNCA', 'FERNANDEZ LUIS, SOLEDAD',
  ])('%s sí es una persona', (n) => expect(noPersona(n)).toBe(false));
  it('un paréntesis sin cerrar (truncación de SAGE) no marca como no persona', () => {
    expect(noPersona('PEREZ GOMEZ, ANA (ALI')).toBe(false);
  });
});
