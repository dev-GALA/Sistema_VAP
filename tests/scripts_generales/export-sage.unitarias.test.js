// Pruebas UNITARIAS de VAP_script_export_SAGE.gs: funciones puras y auxiliares aisladas.
// Datos 100% ficticios. Referencias: RF-12, RF-13, RF-22, RF-46, RF-48 · RNF-02, RNF-08 · ADR-0010, 0011, 0012, 0015.
import { describe, expect, it } from 'vitest';
import { cargarGs, CODIGO, plano, relojQueAvanza } from './ayudas.js';

const nuevo = (opciones) => cargarGs(CODIGO.exportSage, opciones);

describe('constantes de configuración (ADR-0010 · ADR-0015)', () => {
  it('VINC_FIELDS mapea los 8 campos a G,H,I,L,P,Q,R,T (RF-12)', () => {
    const e = nuevo();
    expect(plano(e.valor('VINC_FIELDS')).map((f) => [f.srcHeader, f.dstCol])).toStrictEqual([
      ['SEGURO_MEDICO', 7], ['COBE_Alimentacion', 8], ['COBE_Transporte', 9], ['TOTAL_BRUTO', 12],
      ['SS_EMP', 16], ['SS_TRABAH', 17], ['IRPF', 18], ['Líquido_a_percibir', 20],
    ]);
  });
  it('ADR-0015 · el salario base sale de TOTAL_BRUTO ya calculado por SAGE, no de una fórmula propia', () => {
    const e = nuevo();
    expect(plano(e.valor('VINC_FIELDS')).find((f) => f.dstCol === 12).srcHeader).toBe('TOTAL_BRUTO');
    expect(e.valor("typeof calcularSalarioBaseBruto")).toBe('undefined');
  });
  it('VINC_MAX_DST_COL es la mayor columna de los campos y de las claves (se lee hasta T)', () => {
    const e = nuevo();
    const mayor = Math.max(e.valor('VINC_TGT_EMPRESA_COL'), e.valor('VINC_TGT_NUM_COL'), ...plano(e.valor('VINC_FIELDS')).map((f) => f.dstCol));
    expect(e.valor('VINC_MAX_DST_COL')).toBe(mayor);
    expect(mayor).toBe(20);
  });
  it('las claves del destino son EMPRESA (E=5) y Nº EMPLEADO (F=6)', () => {
    const e = nuevo();
    expect([e.valor('VINC_TGT_EMPRESA_COL'), e.valor('VINC_TGT_NUM_COL')]).toStrictEqual([5, 6]);
  });
  it('las cabeceras de auditoría coinciden con SSD §6.4 (ADR-0012)', () => {
    const e = nuevo();
    expect(plano(e.valor('APP_LOG_HEADERS'))).toStrictEqual(['Timestamp', 'Acción activada', 'Resultado', 'Registro de acciones', 'Run ID', 'Usuario', 'Duración (s)']);
    expect(plano(e.valor('APP_ERR_HEADERS'))).toStrictEqual(['Timestamp', 'Acción', 'Tipo de error', 'Descripción del error', 'Posible solución', 'Run ID', 'Usuario']);
    expect([e.valor('APP_LOG_SHEET_NAME'), e.valor('APP_ERR_SHEET_NAME')]).toStrictEqual(['logs', 'errores']);
  });
  it('el LOG detallado del destino tiene 9 columnas con Run ID para correlacionar (ADR-0012)', () => {
    const e = nuevo();
    expect(plano(e.valor('VINC_LOG_HEADERS'))).toStrictEqual(['Timestamp', 'Run ID', 'Tipo', 'Empresa', 'Nº Empleado', 'Fila origen', 'Fila destino', 'Campos cambiados', 'Detalle']);
  });
  it('los libros destino neto y bruto son distintos (estado actual; ADR-0016 pendiente de aplicar)', () => {
    const e = nuevo();
    expect(e.valor('VINC_NETO_TARGET_ID')).not.toBe(e.valor('VINC_BRUTO_TARGET_ID'));
  });
});

describe('normalizeText_', () => {
  it.each([
    ['  Líquido   A  Percibir ', 'liquido a percibir'],
    ['ÁÉÍÓÚ ñ', 'aeiou n'],
    ['MAYÚSCULAS', 'mayusculas'],
    ['', ''], [null, ''], [undefined, ''], [0, ''],
    [123, '123'],
  ])('RNF-02 · normalizeText_(%j) = %j', (entrada, esperado) => {
    expect(nuevo().llamar('normalizeText_', entrada)).toBe(esperado);
  });
  it('colapsa tabuladores y saltos de línea como espacios', () => {
    expect(nuevo().llamar('normalizeText_', 'a\t\n b')).toBe('a b');
  });
});

describe('normalizeEmployeeNumber_', () => {
  it.each([
    [' 00-12 3 ', '00123'], ['AB-1', 'ab1'], ['', ''], [null, ''], [undefined, ''], [42, '42'],
    ['1 2\t3', '123'],
  ])('normalizeEmployeeNumber_(%j) = %j', (entrada, esperado) => {
    expect(nuevo().llamar('normalizeEmployeeNumber_', entrada)).toBe(esperado);
  });
  it('NO quita los ceros a la izquierda: "007" y 7 son claves distintas', () => {
    const e = nuevo();
    expect(e.llamar('normalizeEmployeeNumber_', '007')).not.toBe(e.llamar('normalizeEmployeeNumber_', 7));
  });
});

describe('makeKey_', () => {
  it('RF-04 · iguala mayúsculas, tildes, espacios y guiones del número', () => {
    const e = nuevo();
    expect(e.llamar('makeKey_', ' Gala  S.L. ', '12-3')).toBe(e.llamar('makeKey_', 'GALA S.L.', 123));
  });
  it('empresas distintas dan claves distintas aunque el número coincida', () => {
    const e = nuevo();
    expect(e.llamar('makeKey_', 'Gala', '1')).not.toBe(e.llamar('makeKey_', 'Cervantes', '1'));
  });
  it('usa el separador "__" entre empresa y número', () => {
    expect(nuevo().llamar('makeKey_', 'Gala', '7')).toBe('gala__7');
  });
  it('empresa sin tildes vs con tildes: misma clave', () => {
    const e = nuevo();
    expect(e.llamar('makeKey_', 'Fórmación', '1')).toBe(e.llamar('makeKey_', 'Formacion', '1'));
  });
});

describe('hasValue_', () => {
  it.each([
    [null, false], [undefined, false], ['', false], ['   ', false], ['\n\t', false],
    [0, true], [false, true], ['0', true], [' x ', true], [-1.5, true], [true, true],
  ])('RF-22 · hasValue_(%j) = %s (el cero es un valor)', (v, esperado) => {
    expect(nuevo().llamar('hasValue_', v)).toBe(esperado);
  });
});

describe('toNumber_', () => {
  it.each([
    [1234.5, 1234.5], [0, 0], ['12', 12], ['  12  ', 12], ['1234,56', 1234.56], ['1.234,56', 1234.56],
    ['-3,5', -3.5], ['1.000', 1000],
    [null, null], [undefined, null], ['', null], ['   ', null],
    ['abc', null], ['12abc', null], [NaN, null], [Infinity, null], [true, null], ['1,2,3', null],
  ])('RNF-08 · toNumber_(%j) = %j', (v, esperado) => {
    expect(nuevo().llamar('toNumber_', v)).toBe(esperado);
  });
  it.fails('DEFECTO (RNF-08): un decimal con punto escrito como texto ("12.5") debería leerse como 12.5, no como 125', () => {
    expect(nuevo().llamar('toNumber_', '12.5')).toBe(12.5);
  });
});

describe('valuesEqual_', () => {
  it.each([
    [5, 5, true], ['5', 5, true], [5, '5,0', true], ['1.234,50', 1234.5, true], [1234.5, '1234,5', true],
    [5, 6, false], ['5', '6', false],
    ['a', 'a', true], [' a ', 'a', true], ['a', 'b', false],
    ['', null, true], [null, undefined, true], ['', undefined, true], ['   ', '', true],
    [0, '', false], ['', 0, false], [null, 0, false],
    ['abc', 5, false],
  ])('valuesEqual_(%j, %j) = %s', (a, b, esperado) => {
    expect(nuevo().llamar('valuesEqual_', a, b)).toBe(esperado);
  });
  it('RNF-08 · trata igual el número 1234.5 y el texto con coma "1234,5"', () => {
    expect(nuevo().llamar('valuesEqual_', 1234.5, '1234,5')).toBe(true);
  });
  it.fails('DEFECTO (RNF-08): el número 12.5 y el texto "12.5" deberían ser iguales', () => {
    expect(nuevo().llamar('valuesEqual_', 12.5, '12.5')).toBe(true);
  });
  it('dos fechas iguales (objetos distintos) se consideran iguales', () => {
    const e = nuevo();
    expect(e.ejecutar('valuesEqual_(new Date(2026,0,1), new Date(2026,0,1))')).toBe(true);
    expect(e.ejecutar('valuesEqual_(new Date(2026,0,1), new Date(2026,0,2))')).toBe(false);
  });
});

describe('findHeaderCol_', () => {
  it('RNF-02 · devuelve la columna (base 1) ignorando mayúsculas, tildes y espacios extra', () => {
    const e = nuevo();
    expect(e.llamar('findHeaderCol_', ['A', ' LIQUIDO_A_PERCIBIR ', 'C'], 'Líquido_a_percibir')).toBe(2);
  });
  it('devuelve null si la cabecera no existe', () => {
    expect(nuevo().llamar('findHeaderCol_', ['A', 'B'], 'C')).toBeNull();
  });
  it('con cabeceras repetidas devuelve la primera', () => {
    expect(nuevo().llamar('findHeaderCol_', ['X', 'a', 'A'], 'a')).toBe(2);
  });
  it('lista vacía devuelve null', () => {
    expect(nuevo().llamar('findHeaderCol_', [], 'a')).toBeNull();
  });
  it('la columna 1 se devuelve como 1 (no como falsy 0)', () => {
    expect(nuevo().llamar('findHeaderCol_', ['Empresa'], 'empresa')).toBe(1);
  });
});

describe('makeVincLogRow_', () => {
  it('RF-13 · compone la fila de 9 columnas en el orden de VINC_LOG_HEADERS', () => {
    const e = nuevo();
    const fila = plano(e.llamar('makeVincLogRow_', 'TS', 'run-1', 'ACTUALIZADO', 'GALA', '7', 3, 9, 'ADESLAS: ∅→5', 'det'));
    expect(fila).toStrictEqual(['TS', 'run-1', 'ACTUALIZADO', 'GALA', '7', 3, 9, 'ADESLAS: ∅→5', 'det']);
  });
  it('rellena con cadena vacía los campos ausentes o falsy', () => {
    const e = nuevo();
    expect(plano(e.llamar('makeVincLogRow_', 'TS', 'r', 'RESUMEN', '', '', '', '', '', 'x'))).toStrictEqual(['TS', 'r', 'RESUMEN', '', '', '', '', '', 'x']);
    expect(plano(e.llamar('makeVincLogRow_', 'TS', 'r', 'T', undefined, null, 0, 0, undefined, undefined))).toStrictEqual(['TS', 'r', 'T', '', '', '', '', '', '']);
  });
});

describe('clasificarError_ (RF-48 · ADR-0012)', () => {
  it.each([
    ['No existe la pestaña origen: "x".', 'Pestaña no encontrada'],
    ['NO EXISTE LA PESTAÑA destino', 'Pestaña no encontrada'],
    ['No encuentro cabeceras de clave en origen', 'Cabecera no encontrada'],
    ['No encuentro estas cabeceras de datos en el origen: IRPF.', 'Cabecera no encontrada'],
    ['Exception: Unexpected error while getting the method or property openById on object SpreadsheetApp.', 'Acceso al libro destino'],
    ['Requested entity was not found', 'Acceso al libro destino'],
    ['No tienes permisos para abrir el libro', 'Acceso al libro destino'],
    ['Access denied: DriveApp', 'Acceso al libro destino'],
    ['Could not obtain lock after 30000 ms', 'Bloqueo de ejecución'],
    ['Se agotó el tiempo de espera del bloqueo.', 'Bloqueo de ejecución'],
    ['Exceeded maximum execution time', 'Tiempo de ejecución excedido'],
    ['Se superó el tiempo de ejecución', 'Tiempo de ejecución excedido'],
    ['cualquier otra cosa', 'Error no clasificado'],
  ])('clasifica «%s» como «%s»', (mensaje, tipo) => {
    const info = plano(nuevo().llamar('clasificarError_', new Error(mensaje)));
    expect(info.tipo).toBe(tipo);
    expect(info.solucion.length).toBeGreaterThan(10); // siempre hay una posible solución
  });
  it('acepta una cadena, null y undefined sin lanzar', () => {
    const e = nuevo();
    expect(plano(e.llamar('clasificarError_', 'lock agotado')).tipo).toBe('Bloqueo de ejecución');
    expect(plano(e.llamar('clasificarError_', null)).tipo).toBe('Error no clasificado');
    expect(plano(e.llamar('clasificarError_', undefined)).tipo).toBe('Error no clasificado');
    expect(plano(e.llamar('clasificarError_', {})).tipo).toBe('Error no clasificado');
  });
  it('si coinciden dos reglas manda la primera: pestaña antes que cabecera', () => {
    expect(plano(nuevo().llamar('clasificarError_', new Error('No existe la pestaña con cabecera'))).tipo).toBe('Pestaña no encontrada');
  });
  it('la solución de pestaña cita las constantes a revisar', () => {
    expect(plano(nuevo().llamar('clasificarError_', new Error('No existe la pestaña x'))).solucion).toMatch(/SHEET_NAME/);
  });
});

describe('getOrCreateLogSheet_', () => {
  it('crea la hoja, escribe la cabecera y congela la fila 1', () => {
    const e = nuevo();
    const libro = e.google.libro('L');
    const hoja = e.llamar('getOrCreateLogSheet_', libro, 'logs', ['A', 'B']);
    expect(hoja.getName()).toBe('logs');
    expect(hoja.volcar()).toStrictEqual([['A', 'B']]);
    expect(hoja.getFrozenRows()).toBe(1);
  });
  it('reutiliza la hoja existente con datos sin tocar la cabecera ni las filas', () => {
    const e = nuevo();
    const libro = e.google.libro('L');
    libro.conHoja('logs', [['X'], ['dato']]);
    const hoja = e.llamar('getOrCreateLogSheet_', libro, 'logs', ['A', 'B']);
    expect(hoja.volcar()).toStrictEqual([['X'], ['dato']]);
    expect(libro.getSheets()).toHaveLength(1);
  });
  it('si la hoja existe pero está vacía le pone la cabecera', () => {
    const e = nuevo();
    const libro = e.google.libro('L');
    libro.insertSheet('logs');
    const hoja = e.llamar('getOrCreateLogSheet_', libro, 'logs', ['A']);
    expect(hoja.volcar()).toStrictEqual([['A']]);
  });
  it('llamarla dos veces no duplica la cabecera', () => {
    const e = nuevo();
    const libro = e.google.libro('L');
    e.llamar('getOrCreateLogSheet_', libro, 'logs', ['A']);
    const hoja = e.llamar('getOrCreateLogSheet_', libro, 'logs', ['A']);
    expect(hoja.volcar()).toStrictEqual([['A']]);
  });
});

describe('appendLogRows_', () => {
  const hojaCon = (e, filas) => e.google.libro('L').conHoja('log', filas);
  it('añade las filas a continuación de la última con un único setValues (RNF-07)', () => {
    const e = nuevo();
    const hoja = hojaCon(e, [['h'], ['a']]);
    e.llamar('appendLogRows_', hoja, [['b'], ['c']]);
    expect(hoja.volcar()).toStrictEqual([['h'], ['a'], ['b'], ['c']]);
    expect(e.google.estado.escrituras).toHaveLength(1);
  });
  it.each([[null], [undefined], [[]]])('no escribe nada con %j', (filas) => {
    const e = nuevo();
    const hoja = hojaCon(e, [['h']]);
    e.llamar('appendLogRows_', hoja, filas);
    expect(hoja.volcar()).toStrictEqual([['h']]);
    expect(e.google.estado.escrituras).toHaveLength(0);
  });
});

describe('registrarLog_ y registrarError_ (RF-46 · RF-48 · ADR-0012)', () => {
  const entorno = () => {
    const e = nuevo();
    e.google.activar(e.google.libro('ORIGEN'));
    return e;
  };
  it('registrarLog_ crea "logs" con cabecera y añade una fila con los 7 campos', () => {
    const e = entorno();
    e.llamar('registrarLog_', 'TS', 'Export Neto', 'OK', 'resumen', 'run-1', 'ana@gala.test', 1.2);
    const hoja = e.google.estado.libroActivo.getSheetByName('logs');
    expect(plano(hoja.volcar())).toStrictEqual([
      ['Timestamp', 'Acción activada', 'Resultado', 'Registro de acciones', 'Run ID', 'Usuario', 'Duración (s)'],
      ['TS', 'Export Neto', 'OK', 'resumen', 'run-1', 'ana@gala.test', 1.2],
    ]);
  });
  it('redondea la duración a 2 decimales', () => {
    const e = entorno();
    e.llamar('registrarLog_', 'TS', 'a', 'OK', '', 'r', 'u', 1.23456);
    expect(e.google.estado.libroActivo.getSheetByName('logs').volcar()[1][6]).toBe(1.23);
  });
  it.each([['3'], [undefined], [null], [NaN], [Infinity]])('una duración no numérica (%j) se escribe vacía', (dur) => {
    const e = entorno();
    e.llamar('registrarLog_', 'TS', 'a', 'OK', '', 'r', 'u', dur);
    expect(e.google.estado.libroActivo.getSheetByName('logs').volcar()[1][6]).toBe('');
  });
  it('los campos de texto ausentes se escriben vacíos', () => {
    const e = entorno();
    e.llamar('registrarLog_', 'TS');
    expect(plano(e.google.estado.libroActivo.getSheetByName('logs').volcar()[1])).toStrictEqual(['TS', '', '', '', '', '', '']);
  });
  it('varias llamadas acumulan filas bajo una sola cabecera', () => {
    const e = entorno();
    e.llamar('registrarLog_', 'T1', 'a', 'OK', '', 'r1', 'u', 0);
    e.llamar('registrarLog_', 'T2', 'b', 'ERROR', '', 'r2', 'u', 0);
    expect(e.google.estado.libroActivo.getSheetByName('logs').volcar()).toHaveLength(3);
  });
  it('si no puede escribir (sin libro activo) no lanza: lo deja en Logger', () => {
    const e = nuevo(); // sin libro activo
    expect(() => e.llamar('registrarLog_', 'TS', 'a', 'OK', '', 'r', 'u', 0)).not.toThrow();
    expect(e.google.estado.logs[0]).toMatch(/No se pudo escribir en "logs"/);
  });
  it('registrarError_ crea "errores" y escribe los 7 campos', () => {
    const e = entorno();
    e.llamar('registrarError_', 'TS', 'Export Bruto', 'Cabecera no encontrada', 'desc', 'sol', 'run-2', 'ana@gala.test');
    expect(plano(e.google.estado.libroActivo.getSheetByName('errores').volcar())).toStrictEqual([
      ['Timestamp', 'Acción', 'Tipo de error', 'Descripción del error', 'Posible solución', 'Run ID', 'Usuario'],
      ['TS', 'Export Bruto', 'Cabecera no encontrada', 'desc', 'sol', 'run-2', 'ana@gala.test'],
    ]);
  });
  it('registrarError_ con campos ausentes escribe vacíos y no lanza sin libro activo', () => {
    const e = entorno();
    e.llamar('registrarError_', 'TS');
    expect(plano(e.google.estado.libroActivo.getSheetByName('errores').volcar()[1])).toStrictEqual(['TS', '', '', '', '', '', '']);
    const sin = nuevo();
    expect(() => sin.llamar('registrarError_', 'TS')).not.toThrow();
    expect(sin.google.estado.logs[0]).toMatch(/No se pudo escribir en "errores"/);
  });
});

describe('alertSafe_', () => {
  it('muestra el mensaje en un diálogo', () => {
    const e = nuevo();
    e.llamar('alertSafe_', 'hola');
    expect(e.google.estado.alertas).toStrictEqual([['hola']]);
  });
  it('si el diálogo falla (sin interfaz) no lanza y deja el mensaje en Logger', () => {
    const e = nuevo({ respuestas: { alert: () => { throw new Error('sin UI'); } } });
    expect(() => e.llamar('alertSafe_', 'hola')).not.toThrow();
    expect(e.google.estado.logs).toStrictEqual(['hola']);
  });
});

describe('onOpen', () => {
  it('crea el menú VAP_Acciones con exactamente Export Neto y Export Bruto (ADR-0010 · ADR-0015)', () => {
    const e = nuevo();
    e.llamar('onOpen');
    expect(e.google.estado.menus).toHaveLength(1);
    expect(plano(e.google.estado.menus[0])).toStrictEqual({
      nombre: 'VAP_Acciones',
      items: [{ texto: 'Export Neto', funcion: 'exportNeto' }, { texto: 'Export Bruto', funcion: 'exportBruto' }],
    });
  });
  it('cada función del menú existe en el script', () => {
    const e = nuevo();
    e.llamar('onOpen');
    e.google.estado.menus[0].items.forEach((i) => expect(e.valor(`typeof ${i.funcion}`)).toBe('function'));
  });
});

describe('ejecutarAccion_ (envoltorio de auditoría)', () => {
  const entorno = (opciones) => {
    const e = nuevo(opciones);
    e.google.activar(e.google.libro('ORIGEN'));
    return e;
  };
  const hoja = (e, n) => e.google.estado.libroActivo.getSheetByName(n);

  it('éxito · pasa el runId al callback, devuelve el resumen, escribe en logs y avisa (RF-46)', () => {
    const e = entorno({ usuario: 'ana@gala.test' });
    e.contexto.__fn = (runId) => `resumen de ${runId}`;
    const resumen = e.ejecutar("ejecutarAccion_('Mi acción', __fn)");
    expect(resumen).toBe('resumen de uuid-0001');
    const fila = plano(hoja(e, 'logs').volcar()[1]);
    expect(fila).toStrictEqual(['2026-03-15T10:00:00.000Z', 'Mi acción', 'OK', 'resumen de uuid-0001', 'uuid-0001', 'ana@gala.test', 0]);
    expect(e.google.estado.alertas[0][0]).toBe('"Mi acción" completado.\nresumen de uuid-0001');
    expect(hoja(e, 'errores')).toBeNull();
  });
  it('éxito con callback que devuelve undefined: resumen vacío', () => {
    const e = entorno();
    e.contexto.__fn = () => undefined;
    expect(e.ejecutar("ejecutarAccion_('A', __fn)")).toBe('');
    expect(plano(hoja(e, 'logs').volcar()[1])[3]).toBe('');
  });
  it('fallo · registra en errores y en logs con el mismo Run ID, avisa y RELANZA el mismo error (RF-48)', () => {
    const e = entorno({ usuario: 'ana@gala.test' });
    const error = new Error('No existe la pestaña origen: "x".');
    e.contexto.__fn = () => { throw error; };
    expect(() => e.ejecutar("ejecutarAccion_('Export Neto', __fn)")).toThrow(error);
    const err = plano(hoja(e, 'errores').volcar()[1]);
    expect(err).toStrictEqual(['2026-03-15T10:00:00.000Z', 'Export Neto', 'Pestaña no encontrada', 'No existe la pestaña origen: "x".',
      plano(e.llamar('clasificarError_', error)).solucion, 'uuid-0001', 'ana@gala.test']);
    const log = plano(hoja(e, 'logs').volcar()[1]);
    expect(log.slice(1, 6)).toStrictEqual(['Export Neto', 'ERROR', 'Falló: No existe la pestaña origen: "x".', 'uuid-0001', 'ana@gala.test']);
    const alerta = e.google.estado.alertas[0][0];
    expect(alerta).toMatch(/Error en "Export Neto":\nNo existe la pestaña/);
    expect(alerta).toMatch(/Tipo: Pestaña no encontrada\nPosible solución: /);
  });
  it('un valor lanzado que no es Error (cadena) se describe con String()', () => {
    const e = entorno();
    e.contexto.__fn = () => { throw 'texto plano'; };
    expect(() => e.ejecutar("ejecutarAccion_('A', __fn)")).toThrow('texto plano');
    expect(plano(hoja(e, 'errores').volcar()[1])[3]).toBe('texto plano');
  });
  it('throw null no rompe el envoltorio y queda registrado', () => {
    const e = entorno();
    e.contexto.__fn = () => { throw null; };
    expect(() => e.ejecutar("ejecutarAccion_('A', __fn)")).toThrow();
    expect(plano(hoja(e, 'errores').volcar()[1])[3]).toBe('null');
  });
  it('si no se puede leer el usuario activo, el usuario queda vacío y la acción sigue', () => {
    const e = entorno();
    e.contexto.Session = { getActiveUser: () => { throw new Error('sin permiso'); } };
    e.contexto.__fn = () => 'ok';
    e.ejecutar("ejecutarAccion_('A', __fn)");
    expect(plano(hoja(e, 'logs').volcar()[1])[5]).toBe('');
  });
  it('un usuario con correo vacío queda como cadena vacía', () => {
    const e = entorno({ usuario: '' });
    e.contexto.__fn = () => 'ok';
    e.ejecutar("ejecutarAccion_('A', __fn)");
    expect(plano(hoja(e, 'logs').volcar()[1])[5]).toBe('');
  });
  it('mide la duración en segundos (reloj simulado: 1,5 s por lectura de hora)', () => {
    const e = entorno();
    relojQueAvanza(e, 1500);
    e.contexto.__fn = () => 'ok'; // no lee la hora: inicio=t, fin=t+1500 → 1,5 s
    e.ejecutar("ejecutarAccion_('A', __fn)");
    expect(plano(hoja(e, 'logs').volcar()[1])[6]).toBe(1.5);
  });
  it('la duración también se registra cuando falla', () => {
    const e = entorno();
    relojQueAvanza(e, 2000);
    e.contexto.__fn = () => { throw new Error('x'); };
    expect(() => e.ejecutar("ejecutarAccion_('A', __fn)")).toThrow();
    expect(plano(hoja(e, 'logs').volcar()[1])[6]).toBe(2);
  });
  it('un fallo al escribir en logs/errores no tapa el resultado de la acción (devuelve el resumen)', () => {
    const e = nuevo(); // sin libro activo: registrarLog_ falla por dentro y lo deja en Logger
    e.contexto.__fn = () => 'ok';
    expect(e.ejecutar("ejecutarAccion_('A', __fn)")).toBe('ok');
    expect(e.google.estado.logs.some((l) => l.includes('No se pudo escribir en "logs"'))).toBe(true);
  });
  it('si el aviso en pantalla falla, la acción no se considera fallida', () => {
    const e = entorno({ respuestas: { alert: () => { throw new Error('sin UI'); } } });
    e.contexto.__fn = () => 'ok';
    expect(e.ejecutar("ejecutarAccion_('A', __fn)")).toBe('ok');
    expect(plano(hoja(e, 'logs').volcar()[1])[2]).toBe('OK');
  });
  it('cada ejecución obtiene un Run ID nuevo', () => {
    const e = entorno();
    e.contexto.__fn = (id) => id;
    expect([e.ejecutar("ejecutarAccion_('A', __fn)"), e.ejecutar("ejecutarAccion_('A', __fn)")]).toStrictEqual(['uuid-0001', 'uuid-0002']);
  });
});
