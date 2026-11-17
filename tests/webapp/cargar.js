// Soporte de las pruebas de la webapp (ADR-0017): carga el código de `docs_solutions/src/webapp/` en la caja de Node
// con los dobles de Google, y prepara el libro propio de la webapp (ADR-0018) en memoria.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cargarPagos, prepararPagos, TOKEN_PRUEBA } from '../pagos/cargar.js';
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
export const CABECERA_REGISTRO_PERSONAL = [
  'evento_id',
  'momento',
  'usuario',
  'accion',
  'empresa',
  'id_trabajador',
  'estado',
  'detalle',
];

export const ID_MAESTRO = 'libro-maestro-prueba';
export const ID_FUENTE = 'libro-fuente-importes-prueba';
export const CABECERA_MAESTRO = ['id_trabajador', 'nombre', 'apellidos', 'dni', 'fecha_alta', 'fecha_baja'];
// Con la marca de «la cuenta consta en VAP_Pagos» (RF-97): solo hace falta cuando se guarda una cuenta.
export const CABECERA_MAESTRO_CON_MARCA = [...CABECERA_MAESTRO, 'cuenta_en_pagos', 'cuenta_en_pagos_fecha'];
export const URL_SERVICIO_PRUEBA = 'https://servicio-pagos.prueba/exec';

/**
 * Prepara el maestro de personas (pestañas «Uno» y «Empresa Dos»), con datos INVENTADOS.
 * `marca: true` le añade las dos columnas de la marca de cuenta registrada.
 */
export function prepararPersonal(entorno, { maestro = true, marca = false, filasMaestro = [] } = {}) {
  if (!maestro) return;
  const cabecera = marca ? CABECERA_MAESTRO_CON_MARCA : CABECERA_MAESTRO;
  const libro = entorno.google.libro(ID_MAESTRO, 'VAP_BBDD_Personas');
  libro.conHoja('Uno', [cabecera, ...filasMaestro]);
  libro.conHoja('Empresa Dos', [cabecera]);
}

/** El libro de la fuente de importes (Vinculación) de prueba: una hoja por periodo, `2026-11`. */
export function prepararFuenteImportes(entorno, filas, { hoja = '2026-11', cabecera = ['DNI', 'EFECTIVO'] } = {}) {
  entorno.google.libro(ID_FUENTE, 'Vinculación de prueba').conHoja(hoja, [['Preámbulo'], cabecera, ...filas]);
}

/** Carga toda la webapp. `opciones` se pasa al Google falso (por ejemplo `usuario`). */
export function cargarWebapp(opciones = {}) {
  return cargarGs(ARCHIVOS_GS, { raiz: SRC_WEBAPP, plantillasHtml: CONTENIDO_HTML, ...opciones });
}

/**
 * Crea el libro propio de la webapp en el Google falso y fija su identificador en las propiedades del
 * script. Una hoja que no se pasa NO se crea (sirve para probar que falta).
 */
export function prepararLibro(
  entorno,
  { config, estadoPasos, registroPersonal, cabeceraConfig = CABECERA_CONFIG } = {},
) {
  const libro = entorno.google.libro(ID_LIBRO, 'VAP_Webapp');
  if (config !== undefined) libro.conHoja('config', [cabeceraConfig, ...config]);
  if (estadoPasos !== undefined) libro.conHoja('estado_pasos', [CABECERA_ESTADO_PASOS, ...estadoPasos]);
  if (registroPersonal !== undefined)
    libro.conHoja('registro_personal', [CABECERA_REGISTRO_PERSONAL, ...registroPersonal]);
  entorno.google.estado.propiedadesScript.ID_LIBRO_WEBAPP = ID_LIBRO;
  return libro;
}

/** La hoja `config` de un libro normal: una persona en cada rol. */
export const CONFIG_NORMAL = [
  ['email_administracion', 'sara@gala.test'],
  ['email_desarrollo', 'dev@gala.test'],
];

/** Config con empresas y maestro. Los identificadores de libro son los de los libros de prueba. */
export const CONFIG_PERSONAL = [
  ...CONFIG_NORMAL,
  ['empresas', 'Empresa Uno=Uno; Empresa Dos'],
  ['maestro_libro_id', ID_MAESTRO],
];

/** Además, la fuente de importes esperados (Vinculación) para el cruce de pagos. */
export const CONFIG_PAGOS = [
  ...CONFIG_PERSONAL,
  ['vinculacion_libro_id', ID_FUENTE],
  ['vinculacion_hoja', '{periodo}'],
  ['vinculacion_col_dni', 'DNI'],
  ['vinculacion_col_importe', 'EFECTIVO'],
];

/**
 * La webapp CONECTADA al servicio VAP_Pagos de verdad: dos proyectos de Apps Script separados, cada uno con su Google
 * falso (sus propias propiedades y libros), y la llamada HTTP de uno al otro hecha en memoria. Lo que se prueba es el
 * contrato real entre los dos. Devuelve { entorno, servicio }.
 */
export function cargarWebappConServicio(opciones = {}) {
  const servicio = cargarPagos();
  prepararPagos(servicio, opciones.pagos);
  const entorno = cargarWebapp({
    usuario: opciones.usuario,
    fetch: (url, enviado) => {
      if (url !== URL_SERVICIO_PRUEBA) return { codigo: 404, contenido: '' };
      const salida = servicio.llamar('doPost', { postData: { contents: enviado.payload } });
      return { codigo: 200, contenido: salida.getContent() };
    },
  });
  entorno.google.estado.propiedadesScript.URL_SERVICIO_PAGOS = URL_SERVICIO_PRUEBA;
  entorno.google.estado.propiedadesScript.TOKEN_SERVICIO_PAGOS = TOKEN_PRUEBA;
  return { entorno, servicio };
}
