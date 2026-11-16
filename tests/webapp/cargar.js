// Soporte de las pruebas de la webapp (ADR-0017): carga el código de `docs_solutions/src/webapp/` en la caja de Node
// con los dobles de Google, y prepara el libro propio de la webapp (ADR-0018) en memoria.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cargarGs, SRC_WEBAPP } from '../soporte/cargar-gs.js';

export const ID_LIBRO = 'libro-webapp-prueba';

export const ARCHIVOS = readdirSync(SRC_WEBAPP).sort();
export const ARCHIVOS_GS = ARCHIVOS.filter((f) => f.endsWith('.gs'));
export const ARCHIVOS_HTML = ARCHIVOS.filter((f) => f.endsWith('.html'));

/** { 'ui-index': 'ui-index.html', … }: lo que espera el arnés de extremo a extremo. */
export const RUTAS_HTML = Object.fromEntries(ARCHIVOS_HTML.map((f) => [f.replace(/\.html$/, ''), f]));

const CONTENIDO_HTML = Object.fromEntries(
  Object.entries(RUTAS_HTML).map(([nombre, ruta]) => [nombre, readFileSync(join(SRC_WEBAPP, ruta), 'utf8')]),
);

export const CABECERA_CONFIG = ['clave', 'valor'];
export const CABECERA_ESTADO_PASOS = ['periodo', 'paso_id', 'estado', 'actualizado_por', 'actualizado_en'];

/** Carga toda la webapp. `opciones` se pasa al Google falso (por ejemplo `usuario`). */
export function cargarWebapp(opciones = {}) {
  return cargarGs(ARCHIVOS_GS, { raiz: SRC_WEBAPP, plantillasHtml: CONTENIDO_HTML, ...opciones });
}

/**
 * Crea el libro propio de la webapp en el Google falso y fija su identificador en las propiedades del
 * script. Una hoja que no se pasa NO se crea (sirve para probar que falta).
 */
export function prepararLibro(entorno, { config, estadoPasos, cabeceraConfig = CABECERA_CONFIG } = {}) {
  const libro = entorno.google.libro(ID_LIBRO, 'VAP_Webapp');
  if (config !== undefined) libro.conHoja('config', [cabeceraConfig, ...config]);
  if (estadoPasos !== undefined) libro.conHoja('estado_pasos', [CABECERA_ESTADO_PASOS, ...estadoPasos]);
  entorno.google.estado.propiedadesScript.ID_LIBRO_WEBAPP = ID_LIBRO;
  return libro;
}

/** La hoja `config` de un libro normal: una persona en cada rol. */
export const CONFIG_NORMAL = [
  ['email_administracion', 'sara@gala.test'],
  ['email_desarrollo', 'dev@gala.test'],
];
