// Unitarias de VAP_Script_Actualizacion_Automatica_Secretarias: lectura de la BBDD, búsqueda de ID,
// ayudas de formulario/respuestas y control de frecuencia. Datos ficticios. ADR-0004 · ADR-0008 · SSD §7.2.
import { describe, expect, it } from 'vitest';
import { CAB_SECRETARIAS, crearFormulario, entornoSync, eventoEnvio, fecha } from './ayudas.js';
import { plano } from '../soporte/cargar-gs.js';

const ana = ['S001', 'Ana Prueba', true];
const bea = ['S002', 'Bea Inventada', true];

describe('normalizarTexto_', () => {
  it.each([
    ['  Ana   Prueba ', 'ANA PRUEBA'], ['ana', 'ANA'], ['', ''], [null, ''], [undefined, ''], [12, '12'],
    ['Ana\tPrueba\n', 'ANA PRUEBA'],
  ])('«%s» → «%s»', (entrada, esperado) => {
    expect(entornoSync().llamar('normalizarTexto_', entrada)).toBe(esperado);
  });
  it('no quita tildes (caracterización: «PÉREZ» ≠ «PEREZ»)', () => {
    const e = entornoSync();
    expect(e.llamar('normalizarTexto_', 'Pérez')).not.toBe(e.llamar('normalizarTexto_', 'Perez'));
  });
});

describe('obtenerSecretariasActivasUnicas_ · lista del desplegable (ADR-0004)', () => {
  const lista = (secretarias, extra = {}) => plano(entornoSync({ secretarias, ...extra }).llamar('obtenerSecretariasActivasUnicas_'));

  it('devuelve solo las activas, ordenadas alfabéticamente en español', () => {
    expect(lista([['S3', 'Zoe Irreal', true], ['S1', 'Álex Falso', true], ['S2', 'Bea Inventada', true], ['S4', 'Cleo Falsa', false]]))
      .toEqual(['Álex Falso', 'Bea Inventada', 'Zoe Irreal']);
  });
  it('excluye filas sin ID, sin nombre o con ID de solo espacios', () => {
    expect(lista([['', 'Sin Id', true], ['S2', '', true], ['  ', 'Espacios Id', true], ana])).toEqual(['Ana Prueba']);
  });
  it('limpia espacios sobrantes del nombre y colapsa los internos', () => {
    expect(lista([['S1', '  Ana    Prueba  ', true]])).toEqual(['Ana Prueba']);
  });
  it('elimina duplicados exactos (misma secretaria dos veces)', () => {
    expect(lista([ana, ['S9', 'Ana   Prueba', true]])).toEqual(['Ana Prueba']);
  });
  it('caracterización: duplicados que solo difieren en mayúsculas NO se unifican', () => {
    expect(lista([ana, ['S9', 'ANA PRUEBA', true]])).toEqual(['Ana Prueba', 'ANA PRUEBA']);
  });
  it('«Alta» solo vale como booleano true: «TRUE» en texto, 1, "Sí" y vacío cuentan como NO alta (caracterización)', () => {
    expect(lista([['S1', 'Texto True', 'TRUE'], ['S2', 'Uno', 1], ['S3', 'Si', 'Sí'], ['S4', 'Vacia', ''], ['S5', 'Verdadero', true]]))
      .toEqual(['Verdadero']);
  });
  it('lista vacía: solo cabecera → []', () => {
    expect(lista([])).toEqual([]);
  });
  it('lista vacía: todas de baja → []', () => {
    expect(lista([['S1', 'Baja Uno', false], ['S2', 'Baja Dos', false]])).toEqual([]);
  });
  it('RNF-02 · localiza las columnas por NOMBRE de cabecera aunque estén en otro orden y haya extras', () => {
    expect(lista([['Ana Prueba', 'extra', true, 'S1']], { cabeceraSecretarias: ['Nombre_Secretaria', 'Otra', 'Alta', 'id_trabajador'] })).toEqual(['Ana Prueba']);
  });
  it.each([
    ['id_trabajador', ['Nombre_Secretaria', 'Alta'], 'No se encuentra la columna "id_trabajador"'],
    ['Nombre_Secretaria', ['id_trabajador', 'Alta'], 'No se encuentra la columna "Nombre_Secretaria"'],
    ['Alta', ['id_trabajador', 'Nombre_Secretaria'], 'No se encuentra la columna "Alta"'],
  ])('falta la cabecera %s → error claro', (_c, cabecera, mensaje) => {
    const e = entornoSync({ secretarias: [['a', 'b']], cabeceraSecretarias: cabecera });
    expect(() => e.llamar('obtenerSecretariasActivasUnicas_')).toThrow(mensaje);
  });
  it('una cabecera con espacio final no se reconoce (caracterización)', () => {
    const e = entornoSync({ secretarias: [['S1', 'Ana Prueba', true]], cabeceraSecretarias: ['id_trabajador', 'Nombre_Secretaria', 'Alta '] });
    expect(() => e.llamar('obtenerSecretariasActivasUnicas_')).toThrow('No se encuentra la columna "Alta"');
  });
  it('sin la hoja VAP_Secretarias → error claro', () => {
    expect(() => entornoSync({ hojaSecretarias: false }).llamar('obtenerSecretariasActivasUnicas_')).toThrow('No existe la hoja "VAP_Secretarias"');
  });
  it('sin el libro de la BBDD → error de acceso', () => {
    expect(() => entornoSync({ libroBbdd: false }).llamar('obtenerSecretariasActivasUnicas_')).toThrow(/no existe o no hay acceso/);
  });
  it('no escribe nada', () => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('obtenerSecretariasActivasUnicas_');
    expect(e.estado.escrituras).toEqual([]);
  });
});

describe('buscarIdSecrePorNombre_ · ID de la secretaria que envía', () => {
  const buscar = (nombre, secretarias = [ana, bea], extra = {}) => entornoSync({ secretarias, ...extra }).llamar('buscarIdSecrePorNombre_', nombre);

  it('devuelve el ID de la secretaria activa', () => {
    expect(buscar('Ana Prueba')).toBe('S001');
  });
  it('ignora mayúsculas y espacios sobrantes', () => {
    expect(buscar('  ana    PRUEBA ')).toBe('S001');
  });
  it('caracterización: es sensible a las tildes («Pérez» ≠ «Perez»)', () => {
    expect(buscar('Ana Perez', [['S1', 'Ana Pérez', true]])).toBe('');
  });
  it('nombre desconocido → cadena vacía', () => {
    expect(buscar('Nadie Imaginario')).toBe('');
  });
  it('una secretaria de baja no se encuentra', () => {
    expect(buscar('Cleo Falsa', [['S3', 'Cleo Falsa', false]])).toBe('');
  });
  it('si el nombre está activo y de baja a la vez, devuelve el ID de la activa', () => {
    expect(buscar('Ana Prueba', [['S-vieja', 'Ana Prueba', false], ana])).toBe('S001');
  });
  it('varias activas con el mismo nombre → error (no se adivina)', () => {
    expect(() => buscar('Ana Prueba', [ana, ['S009', 'ana  prueba', true]])).toThrow('Hay varias secretarias activas con el mismo nombre: "Ana Prueba"');
  });
  it('ID con espacios se recorta; ID numérico se devuelve como texto', () => {
    expect(buscar('Ana Prueba', [['  S001  ', 'Ana Prueba', true]])).toBe('S001');
    expect(buscar('Ana Prueba', [[42, 'Ana Prueba', true]])).toBe('42');
  });
  it('activa pero sin ID → cadena vacía', () => {
    expect(buscar('Ana Prueba', [['', 'Ana Prueba', true]])).toBe('');
  });
  it('nombre buscado vacío o nulo → cadena vacía', () => {
    expect(buscar('')).toBe('');
    expect(buscar(null)).toBe('');
  });
  it.each([
    ['id_trabajador', ['Nombre_Secretaria', 'Alta']],
    ['Nombre_Secretaria', ['id_trabajador', 'Alta']],
    ['Alta', ['id_trabajador', 'Nombre_Secretaria']],
  ])('falta la cabecera %s → error claro', (c, cabecera) => {
    expect(() => buscar('Ana Prueba', [['a', 'b']], { cabeceraSecretarias: cabecera })).toThrow(`No se encuentra la columna "${c}"`);
  });
  it('sin la hoja → error claro', () => {
    expect(() => buscar('Ana Prueba', [], { hojaSecretarias: false })).toThrow('No existe la hoja "VAP_Secretarias"');
  });
  it('hoja completamente vacía → error (no devuelve un ID inventado)', () => {
    const e = entornoSync({ secretarias: [] });
    e.hojaSecretarias.cargar([]);
    expect(() => e.llamar('buscarIdSecrePorNombre_', 'Ana Prueba')).toThrow();
  });
});

describe('obtenerRespuestaPorTitulo_', () => {
  const buscar = (respuestas, titulo = 'SECRETARIA') => entornoSync().llamar('obtenerRespuestaPorTitulo_', eventoEnvio(respuestas, fecha(2026, 3, 1)), titulo);
  it('devuelve la respuesta de la pregunta por su título, recortada', () => {
    expect(buscar({ MES: 'MARZO', SECRETARIA: '  Ana Prueba ' })).toBe('Ana Prueba');
  });
  it('pregunta ausente → cadena vacía', () => {
    expect(buscar({ MES: 'MARZO' })).toBe('');
  });
  it('respuesta nula/vacía → cadena vacía', () => {
    expect(buscar({ SECRETARIA: null })).toBe('');
    expect(buscar({ SECRETARIA: '' })).toBe('');
  });
  it('respuesta numérica se convierte a texto', () => {
    expect(buscar({ SECRETARIA: 7 })).toBe('7');
  });
  it('el título debe coincidir exactamente (mayúsculas)', () => {
    expect(buscar({ secretaria: 'Ana Prueba' })).toBe('');
  });
});

describe('obtenerHojaRespuestasDelFormulario_', () => {
  const CABECERA = ['Marca temporal', 'MES', 'SECRETARIA'];
  it('devuelve la hoja vinculada que tiene «SECRETARIA» y «Marca temporal»', () => {
    const e = entornoSync({ respuestas: [CABECERA] });
    expect(e.llamar('obtenerHojaRespuestasDelFormulario_').getName()).toBe('Respuestas de formulario');
  });
  it('salta hojas vacías y hojas que no son la de respuestas', () => {
    const e = entornoSync({ respuestas: [['Otra cosa']] });
    e.libroRespuestas.insertSheet('Vacia');
    e.libroRespuestas.conHoja('Buena', [CABECERA]);
    expect(e.llamar('obtenerHojaRespuestasDelFormulario_').getName()).toBe('Buena');
  });
  it('requiere AMBAS cabeceras', () => {
    const e = entornoSync({ respuestas: [['MES', 'SECRETARIA']] });
    expect(() => e.llamar('obtenerHojaRespuestasDelFormulario_')).toThrow('No se encontró la hoja de respuestas que contiene "SECRETARIA"');
  });
  it('formulario sin hoja vinculada → error claro', () => {
    expect(() => entornoSync().llamar('obtenerHojaRespuestasDelFormulario_')).toThrow('El formulario no tiene hoja de respuestas vinculada');
  });
  it('formulario inexistente → error de la plataforma', () => {
    expect(() => entornoSync({ formulario: false }).llamar('obtenerHojaRespuestasDelFormulario_')).toThrow(/No se puede abrir el formulario/);
  });
  it('libro de respuestas inexistente → error de acceso', () => {
    const e = entornoSync({ respuestas: [CABECERA] });
    e.estado.libros.delete(e.destinoRespuestas);
    expect(() => e.llamar('obtenerHojaRespuestasDelFormulario_')).toThrow(/no existe o no hay acceso/);
  });
});

describe('localizarFilaRespuesta_ · fila del envío por su marca temporal', () => {
  const T = fecha(2026, 3, 10, 9, 5, 7);
  const respuesta = (t) => ({ getTimestamp: () => t });
  const CAB = ['Marca temporal', 'SECRETARIA'];
  const localizar = (filas, t = T, opciones = {}) => {
    const e = entornoSync({ respuestas: [CAB, ...filas], ...opciones });
    return e.llamar('localizarFilaRespuesta_', e.hojaRespuestas, respuesta(t));
  };
  it('encuentra la fila cuya marca (dd/MM/yyyy HH:mm:ss) coincide', () => {
    expect(localizar([['09/03/2026 08:00:00', 'a'], ['10/03/2026 09:05:07', 'b'], ['11/03/2026 10:00:00', 'c']])).toBe(3);
  });
  it('recorta espacios en la celda', () => {
    expect(localizar([['  10/03/2026 09:05:07 ', 'b']])).toBe(2);
  });
  it('si hay dos coincidencias, devuelve la última (recorre de abajo arriba)', () => {
    expect(localizar([['10/03/2026 09:05:07', 'a'], ['10/03/2026 09:05:07', 'b']])).toBe(3);
  });
  it('sin coincidencia → última fila con datos (respaldo)', () => {
    expect(localizar([['01/01/2026 00:00:00', 'a'], ['02/01/2026 00:00:00', 'b']])).toBe(3);
  });
  it('la marca se interpreta en el huso del script', () => {
    const t = new Date('2026-03-10T08:05:07Z'); // 09:05:07 en Madrid (CET)
    expect(localizar([['10/03/2026 09:05:07', 'a'], ['otra', 'b']], t)).toBe(2);
    expect(localizar([['10/03/2026 08:05:07', 'a'], ['otra', 'b']], t, { zona: 'UTC' })).toBe(2);
  });
  it.fails('DEFECTO: con solo la cabecera (la respuesta aún no está escrita) no debería devolver la fila 1 (cabecera)', () => {
    expect(localizar([])).not.toBe(1);
  });
});

describe('puedeEjecutarSincronizacion_ · control de frecuencia 30 s (SSD §7.2)', () => {
  it('la primera vez permite y la siguiente dentro de la ventana la omite', () => {
    const e = entornoSync();
    expect(e.llamar('puedeEjecutarSincronizacion_')).toBe(true);
    expect(e.llamar('puedeEjecutarSincronizacion_')).toBe(false);
    expect(e.estado.logs).toContain('Sincronización omitida por control de frecuencia');
  });
  it('marca la caché con la clave vap_sync_secretarias_lock durante 30 segundos', () => {
    const e = entornoSync({ espiarLaCache: true });
    e.llamar('puedeEjecutarSincronizacion_');
    expect(e.puestasCache).toEqual([{ k: 'vap_sync_secretarias_lock', v: '1', ttl: 30 }]);
  });
  it('pasada la ventana (caducada la caché) vuelve a permitir', () => {
    const e = entornoSync();
    e.llamar('puedeEjecutarSincronizacion_');
    delete e.estado.cache.vap_sync_secretarias_lock; // el doble no caduca solo: simulamos los 30 s
    expect(e.llamar('puedeEjecutarSincronizacion_')).toBe(true);
  });
  it('omitir no renueva la ventana (no hay nuevas escrituras en la caché)', () => {
    const e = entornoSync({ espiarLaCache: true });
    e.llamar('puedeEjecutarSincronizacion_');
    e.llamar('puedeEjecutarSincronizacion_');
    expect(e.puestasCache).toHaveLength(1);
  });
});

describe('constantes', () => {
  it('apuntan a la pregunta SECRETARIA, la hoja VAP_Secretarias y la columna ID_Secre', () => {
    const e = entornoSync();
    expect(['QUESTION_TITLE', 'SHEET_SECRETARIAS', 'RESPONSE_ID_HEADER'].map((c) => e.valor(c))).toEqual(['SECRETARIA', 'VAP_Secretarias', 'ID_Secre']);
  });
  it('la BBDD y el formulario son recursos distintos', () => {
    const e = entornoSync();
    expect(e.valor('FORM_ID')).not.toBe(e.valor('SPREADSHEET_ID'));
  });
  it('el doble de formulario de las pruebas filtra por tipo como FormApp', () => {
    const f = crearFormulario({ id: 'x', items: [{ titulo: 'A', tipo: 'LIST' }, { titulo: 'B', tipo: 'TEXT' }] });
    expect(f.getItems('LIST').map((i) => i.getTitle())).toEqual(['A']);
  });
  it('CAB_SECRETARIAS (ayuda de pruebas) coincide con las cabeceras que exige el script', () => {
    expect(CAB_SECRETARIAS).toEqual(['id_trabajador', 'Nombre_Secretaria', 'Alta']);
  });
});
