// Ayudas y fixtures FICTICIOS del módulo de profesores. Cada prueba monta su propio entorno (FIRST · Independent).
import { CODIGO, HTML, cargarGs } from '../soporte/cargar-gs.js';
import { crearGoogle } from '../soporte/google.js';

export const AHORA = '2026-03-15T10:00:00Z';

// ───────────────────────────── Sincronización del formulario ─────────────────────────────
export const CABECERA_PROFESORES = ['Empresa', 'Nombre', 'ID_Profesor', 'Id_Sage', 'Departamento', 'Notas', 'Alta'];

/** Fila de VAP_Profesores. `alta` puede ser true, false o el texto 'TRUE'. */
export const profesor = (nombre, id, alta = true) => ['EMPRESA_A', nombre, id, '1', 'Dpto Ficticio', '', alta];

/** Doble de formulario: una lista (la pregunta de profesores) y otros elementos. */
export function crearFormulario({ titulos = ['SELECCIONE EL PROFESOR'], destino = 'libro-respuestas' } = {}) {
  const form = { opcionesPorTitulo: {}, peticionesDeItems: [], destino };
  form.getItems = (tipo) => {
    form.peticionesDeItems.push(tipo);
    return titulos.map((t) => ({
      getTitle: () => t,
      asListItem: () => ({ setChoiceValues: (v) => { form.opcionesPorTitulo[t] = [...v]; } }),
    }));
  };
  form.getDestinationId = () => form.destino;
  return form;
}

/** Evento onFormSubmit con la respuesta de un profesor (o de cualquier lista de pares título/valor). */
export function eventoEnvio(respuestas, marca = new Date('2026-03-10T09:15:30Z')) {
  return {
    response: {
      getTimestamp: () => marca,
      getItemResponses: () => respuestas.map(([titulo, valor]) => ({
        getItem: () => ({ getTitle: () => titulo }),
        getResponse: () => valor,
      })),
    },
  };
}

export const ESPIA_CACHE = (google) => {
  const original = google.global.CacheService.getScriptCache();
  const puestas = [];
  google.global.CacheService.getScriptCache = () => ({
    get: (k) => original.get(k),
    put: (k, v, ttl) => { puestas.push({ k, v, ttl }); original.put(k, v); },
    remove: (k) => original.remove(k),
  });
  return puestas;
};

/**
 * Entorno de sincronización: libro de personal con VAP_Profesores, formulario registrado y libro
 * de respuestas con su hoja. Todo parametrizable.
 */
export function entornoSync({ profesores = [], cabecera = CABECERA_PROFESORES, conHojaProfesores = true, conFormulario = true, titulosFormulario, respuestas } = {}) {
  const google = crearGoogle({ ahora: AHORA });
  const entorno = cargarGs(CODIGO.profesoresSync, { google });
  const idLibro = entorno.valor('SPREADSHEET_ID');
  const idForm = entorno.valor('FORM_ID');
  const libro = google.libro(idLibro, 'VAP_BBDD_Personas_FICTICIA');
  const hojaProfesores = conHojaProfesores ? libro.conHoja('VAP_Profesores', [cabecera, ...profesores]) : null;

  const libroRespuestas = google.libro('libro-respuestas', 'Respuestas FICTICIAS');
  const hojaRespuestas = libroRespuestas.conHoja('Respuestas de formulario 1', respuestas || [['Marca temporal', 'SELECCIONE EL PROFESOR']]);
  const formulario = crearFormulario({ titulos: titulosFormulario });
  if (conFormulario) google.estado.formularios.set(idForm, formulario);
  return { ...entorno, google, libro, hojaProfesores, libroRespuestas, hojaRespuestas, formulario, idLibro, idForm };
}

export const logs = (e) => e.google.estado.logs;

// ───────────────────────────── Volcado de actividad ─────────────────────────────
export const N_CAMPOS = 64;
export const COL_ORIGEN_PRIMERA = 6;
export const COL_DESTINO_PRIMERA = 29;
export const ANCHO_ORIGEN = 69;
export const ANCHO_DESTINO = 92;

export const CABECERAS_ORIGEN = (() => {
  const c = ['Marca temporal', 'Dirección de correo electrónico', 'SELECCIONE EL MES', 'SUCURSAL', 'SELECCIONE EL PROFESOR'];
  for (let i = COL_ORIGEN_PRIMERA; i <= ANCHO_ORIGEN; i++) c.push(`CAMPO_${i}`);
  return c;
})();

export const CABECERAS_DESTINO = (() => {
  const c = Array(ANCHO_DESTINO).fill('');
  c[2] = 'Nombre';
  for (let i = COL_DESTINO_PRIMERA; i <= ANCHO_DESTINO; i++) c[i - 1] = `DEST_${i}`;
  return c;
})();

/**
 * Fila de respuesta ficticia. `datos` = { colOrigen: valor }. `ts` puede ser Date, cadena ISO, '' o null.
 */
export function filaOrigen({ ts = '2026-03-10T12:00:00Z', mes = 'MARZO', sucursal = 'Sucursal Uno', profesor = 'Profesor Uno Ficticio', datos = {} } = {}) {
  const fila = Array(ANCHO_ORIGEN).fill('');
  fila[0] = typeof ts === 'string' && ts ? new Date(ts) : ts;
  fila[2] = mes;
  fila[3] = sucursal;
  fila[4] = profesor;
  Object.entries(datos).forEach(([col, v]) => { fila[Number(col) - 1] = v; });
  return fila;
}

/** Fila del destino: nombre en C y valores en las columnas AC.. indicadas. */
export function filaDestino(nombre, datos = {}) {
  const fila = Array(ANCHO_DESTINO).fill('');
  fila[2] = nombre;
  Object.entries(datos).forEach(([col, v]) => { fila[Number(col) - 1] = v; });
  return fila;
}

/**
 * Entorno del volcado: libro de respuestas (con histórico opcional), libro destino y HTML del diálogo.
 * `origen` y `destino` son filas de datos (sin cabecera). `destino: null` = sin hoja destino.
 */
export function entornoActividad({ usuario = 'gestor@gala.test', ahora = AHORA, plantillasHtml = {}, ...datos } = {}) {
  const google = crearGoogle({ ahora, usuario, plantillasHtml });
  const entorno = cargarGs(CODIGO.profesoresActividad, { google });
  return poblarActividad(entorno, datos);
}

/** Rellena los libros del volcado en un entorno ya cargado (lo usa también el E2E con el arnés). */
export function poblarActividad(entorno, { origen = [], destino = [], historico, cabeceraDestino = CABECERAS_DESTINO, sinHojaOrigen = false } = {}) {
  const google = entorno.google;
  const libroOrigen = google.libro(entorno.valor('SOURCE_SPREADSHEET_ID'), 'Respuestas FICTICIAS');
  const hojaOrigen = sinHojaOrigen ? null : libroOrigen.conHoja('Respuestas de formulario 1', [CABECERAS_ORIGEN, ...origen]);
  const hojaHistorico = historico === undefined ? null : libroOrigen.conHoja('Hoja 1', historico);
  const libroDestino = google.libro(entorno.valor('TARGET_SPREADSHEET_ID'), 'VINCULACION FICTICIA');
  const hojaDestino = destino === null ? null : libroDestino.conHoja('Hoja 1', [cabeceraDestino, ...destino]);
  google.activar(libroOrigen);
  Object.assign(entorno, { libroOrigen, hojaOrigen, hojaHistorico, libroDestino, hojaDestino });
  return entorno;
}

/** Filas del LOG Volcado como objetos. */
export function leerLog(e) {
  const hoja = e.libroOrigen.getSheetByName('LOG Volcado');
  if (!hoja) return [];
  const [cab, ...filas] = hoja.volcar();
  return filas.map((f) => Object.fromEntries(cab.map((c, i) => [c, f[i]])));
}

export const SELECTOR = { CODIGO, HTML };
