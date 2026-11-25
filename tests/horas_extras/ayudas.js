// Ayudas comunes de las pruebas de Horas Extras de Secretarias. Todos los datos son FICTICIOS.
// La hora se fija a Europe/Madrid para que `new Date(2026, 2, 31, 23, 30)` y getMonth()/getFullYear()
// sean repetibles en cualquier equipo (FIRST · Repeatable).
process.env.TZ = 'Europe/Madrid';

import { CODIGO, HTML, cargarGs } from '../soporte/cargar-gs.js';
import { crearGoogle } from '../soporte/google.js';

export { CODIGO, HTML, cargarGs };

// ── Datos de ejemplo (inventados) ───────────────────────────────────────────────────────────────
export const CAB_ORIGEN = [
  'Marca temporal', 'Dirección de correo electrónico', 'MES', 'SECRETARIA -old', 'SECRETARIA',
  'ID_Secre', 'Nº HORAS EXTRA', 'MOTIVO HORAS EXTRA', '€ OTROS EXTRAS', 'MOTIVO OTROS EXTRAS',
];
export const ANCHO_DESTINO = 34; // hasta la columna AH

/** Fecha local (huso del script). Mes en base 1. */
export const fecha = (anio, mes, dia, h = 9, mi = 0, s = 0) => new Date(anio, mes - 1, dia, h, mi, s);

/** Fila de la hoja «Respuestas de formulario» (A..J). */
export function filaOrigen({ ts = '', mes = '', nombre = '', horas = '', otros = '' } = {}) {
  return [ts, '', mes, '', nombre, '', horas, '', otros, ''];
}

/** Fila de «Hoja 1» de VINCULACIÓN (nombre en C, horas en AE, otros en AH). */
export function filaDestino({ nombre = '', horas = '', otros = '' } = {}) {
  const f = Array(ANCHO_DESTINO).fill('');
  f[2] = nombre;
  f[30] = horas;
  f[33] = otros;
  return f;
}
export const CAB_DESTINO = filaDestino({ nombre: 'EMPLEADO' });

// ── Entorno del volcado ─────────────────────────────────────────────────────────────────────────
/** Reemplaza el bloqueo por uno que anota esperas y liberaciones. Debe llamarse antes de cargar el .gs. */
export function espiarBloqueo(google) {
  const registro = { esperas: [], liberaciones: 0 };
  const original = google.global.LockService.getScriptLock;
  google.global.LockService.getScriptLock = () => {
    const bloqueo = original();
    return {
      ...bloqueo,
      waitLock(ms) { registro.esperas.push(ms); return bloqueo.waitLock(ms); },
      releaseLock() { registro.liberaciones++; },
    };
  };
  return registro;
}

/** UUID con prefijos distintos (el doble por defecto repite los 8 primeros caracteres). */
export function uuidsDistintos(google) {
  let n = 0;
  google.global.Utilities.getUuid = () => `run${String(++n).padStart(5, '0')}-0000-4000-8000-000000000000`;
}

/**
 * Carga el .gs del volcado con su origen y destino preparados.
 *  - origen / destino: filas (sin cabecera) o `false` para NO crear la hoja.
 *  - libroOrigen / libroDestino: false → el libro no existe.
 *  - archivo: filas previas de «Anteriores» (o undefined = sin hoja).  - log: filas previas del LOG.
 */
export function entornoVolcado({
  origen = [], destino = [], archivo, log, libroOrigen = true, libroDestino = true,
  ahora = '2026-03-15T10:00:00Z', zona = 'Europe/Madrid', usuario = 'gestora@gala.test',
  cabeceraOrigen = CAB_ORIGEN, cabeceraDestino = CAB_DESTINO,
  plantillasHtml = { DialogoVolcado: '<html><body>diálogo de prueba</body></html>' },
  espiar = false, uuidDistintos = true, rutas = [CODIGO.horasExtrasVolcado], respuestas,
} = {}) {
  const google = crearGoogle({ ahora, zona, usuario, plantillasHtml, respuestas });
  if (uuidDistintos) uuidsDistintos(google);
  const bloqueo = espiar ? espiarBloqueo(google) : null;
  const entorno = cargarGs(rutas, { google });
  return poblarVolcado(entorno, { origen, destino, archivo, log, libroOrigen, libroDestino, cabeceraOrigen, cabeceraDestino, bloqueo });
}

/**
 * Rellena un entorno YA cargado (el de cargarGs o el del arnés E2E) con el libro de origen y el de destino del volcado.
 * Devuelve el mismo entorno ampliado con libroOrigen, hojaOrigen, libroDestino, hojaDestino, verLog(), verArchivo()…
 */
export function poblarVolcado(entorno, {
  origen = [], destino = [], archivo, log, libroOrigen = true, libroDestino = true,
  cabeceraOrigen = CAB_ORIGEN, cabeceraDestino = CAB_DESTINO, bloqueo = null,
} = {}) {
  const google = entorno.google;
  const idOrigen = entorno.valor('SOURCE_SPREADSHEET_ID');
  const idDestino = entorno.valor('TARGET_SPREADSHEET_ID');
  const nombre = (c) => entorno.valor(c);
  const salida = Object.assign(entorno, { bloqueo, idOrigen, idDestino, estado: google.estado });

  if (libroOrigen) {
    salida.libroOrigen = google.libro(idOrigen, 'EXTRA SECRETARIAS 2026 (respuestas)');
    if (origen !== false) salida.hojaOrigen = salida.libroOrigen.conHoja(nombre('SOURCE_SHEET_NAME'), [cabeceraOrigen, ...origen]);
    if (archivo) salida.hojaArchivo = salida.libroOrigen.conHoja(nombre('ARCHIVE_SHEET_NAME'), archivo);
    if (log) salida.hojaLog = salida.libroOrigen.conHoja(nombre('LOG_SHEET_NAME'), log);
  }
  if (libroDestino) {
    salida.libroDestino = google.libro(idDestino, 'VINCULACIÓN GASTOS PERSONAL');
    if (destino !== false) salida.hojaDestino = salida.libroDestino.conHoja(nombre('TARGET_SHEET_NAME'), [cabeceraDestino, ...destino]);
  }
  /** Contenido actual del LOG (o null si no existe la hoja). */
  salida.verLog = () => salida.libroOrigen?.getSheetByName(nombre('LOG_SHEET_NAME'))?.volcar() ?? null;
  salida.verArchivo = () => salida.libroOrigen?.getSheetByName(nombre('ARCHIVE_SHEET_NAME'))?.volcar() ?? null;
  salida.celdaDestino = (fila, col) => salida.hojaDestino.getRange(fila, col).getValue();
  return salida;
}

/** Atajo: la fila del LOG sin su marca de tiempo → [runId, usuario, periodo, categoría, tipo, fila, secretaria, detalle]. */
export const sinHora = (filaLog) => filaLog.slice(1);

/** Filas del LOG de una categoría y tipo. */
export const filtrarLog = (log, categoria, tipo) =>
  (log || []).slice(1).filter((f) => f[4] === categoria && (tipo === undefined || f[5] === tipo));

// ── Entorno de la sincronización ────────────────────────────────────────────────────────────────
export const CAB_SECRETARIAS = ['id_trabajador', 'Nombre_Secretaria', 'Alta', 'DNI'];
/** DNI inventado y con forma válida: las filas de prueba de 3 columnas lo reciben por defecto. */
export const DNI_PRUEBA = '12345678Z';

/** Doble de formulario con lo que usa el script: getItems(tipo), getDestinationId(). */
export function crearFormulario({ id, items = [], destinationId = '' }) {
  const lista = items.map((i) => {
    const item = { tipo: i.tipo ?? 'LIST', titulo: i.titulo, opciones: i.opciones ?? [] };
    item.getTitle = () => item.titulo;
    item.asListItem = () => ({ setChoiceValues(valores) { item.opciones = [...valores]; return this; } });
    return item;
  });
  return {
    id, items: lista,
    getItems: (tipo) => (tipo === undefined ? lista : lista.filter((i) => i.tipo === tipo)),
    getDestinationId: () => destinationId,
  };
}

/** Evento onFormSubmit con una respuesta {título: valor} y marca temporal. */
export function eventoEnvio(respuestas, marca) {
  return {
    response: {
      getItemResponses: () => Object.entries(respuestas).map(([titulo, valor]) => ({
        getItem: () => ({ getTitle: () => titulo }),
        getResponse: () => valor,
      })),
      getTimestamp: () => marca,
    },
  };
}

/** Sustituye la caché por una que anota el tiempo de vida. Antes de cargar el .gs. */
export function espiarCache(google) {
  const puestas = [];
  const original = google.global.CacheService.getScriptCache();
  google.global.CacheService.getScriptCache = () => ({
    get: (k) => original.get(k),
    put(k, v, ttl) { puestas.push({ k, v, ttl }); original.put(k, v); },
    remove: (k) => original.remove(k),
  });
  return puestas;
}

/**
 * Carga el .gs de sincronización con su libro de BBDD (VAP_Secretarias), su formulario y la hoja de respuestas.
 *  - secretarias: filas (sin cabecera) de VAP_Secretarias, o false para no crear la hoja.
 *  - titulosLista: preguntas de tipo lista del formulario (por defecto, SECRETARIA).
 *  - conRespuestas: crea el libro de respuestas vinculado al formulario.
 */
export function entornoSync({
  secretarias = [], cabeceraSecretarias = CAB_SECRETARIAS, hojaSecretarias = true, libroBbdd = true,
  items = [{ titulo: 'SECRETARIA', opciones: ['(antigua)'] }], formulario = true,
  respuestas, destinoRespuestas = 'libro-respuestas-ficticio', espiarLaCache = false,
  zona = 'Europe/Madrid', ahora = '2026-03-15T10:00:00Z', rutas = [CODIGO.horasExtrasSync],
} = {}) {
  const google = crearGoogle({ ahora, zona });
  const puestasCache = espiarLaCache ? espiarCache(google) : null;
  const entorno = cargarGs(rutas, { google });
  const idBbdd = entorno.valor('SPREADSHEET_ID');
  const idForm = entorno.valor('FORM_ID');
  const salida = { ...entorno, estado: google.estado, idBbdd, idForm, puestasCache, destinoRespuestas };
  if (libroBbdd) {
    salida.libroBbdd = google.libro(idBbdd, 'VAP_BBDD_Personas (ficticia)');
    if (hojaSecretarias) {
      const conDni = cabeceraSecretarias === CAB_SECRETARIAS ? secretarias.map((f) => (f.length === 3 ? [...f, DNI_PRUEBA] : f)) : secretarias;
      salida.hojaSecretarias = salida.libroBbdd.conHoja(entorno.valor('SHEET_SECRETARIAS'), [cabeceraSecretarias, ...conDni]);
    }
  }
  if (formulario) {
    salida.formulario = crearFormulario({ id: idForm, items, destinationId: respuestas === undefined ? '' : destinoRespuestas });
    google.estado.formularios.set(idForm, salida.formulario);
  }
  if (respuestas !== undefined) {
    salida.libroRespuestas = google.libro(destinoRespuestas, 'Respuestas (ficticio)');
    salida.hojaRespuestas = salida.libroRespuestas.conHoja('Respuestas de formulario', respuestas);
  }
  salida.opcionesFormulario = () => salida.formulario.items[0].opciones;
  return salida;
}
