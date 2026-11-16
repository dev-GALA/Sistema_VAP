// Carga archivos .gs en una caja aislada de Node (vm), como lo hace Apps Script: todos los archivos
// comparten un único ámbito global. El código NO se modifica ni necesita `module.exports`: lo que se
// prueba es exactamente lo que se despliega.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { crearGoogle } from './google.js';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SRC = join(RAIZ, 'docs_solutions', 'src');
// La webapp del proceso mensual (ADR-0017) es un proyecto más de `src/`; se carga con `{ raiz: SRC_WEBAPP }`.
export const SRC_WEBAPP = join(SRC, 'webapp');

export const CODIGO = {
  exportSage: 'scripts_generales/VAP_script_export_SAGE.gs',
  cruceSage: 'scripts_generales/VAP_Script_Cruce_BBDD_Personas_SAGE.gs',
  complementos: 'VAP_script_secretarias/VAP_Complementos Secretarias/VAP_Export_Complementos_Mensuales_Secretarias.gs',
  horasExtrasVolcado: 'VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_Script Volcado Horas Extras Secretarias.gs',
  horasExtrasSync: 'VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_Script_Actualizacion_Automatica_Secretarias.gs',
  profesoresSync: 'VAP_scripts_profesores/VAP_Script_Actualizacion_Automatica_Profesores.gs',
  profesoresActividad: 'VAP_scripts_profesores/VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.gs',
};

export const HTML = {
  complementosPortal: 'VAP_script_secretarias/VAP_Complementos Secretarias/VAP_index_Portal_Complementos_Secretarias.html',
  complementosReportar: 'VAP_script_secretarias/VAP_Complementos Secretarias/VAP_index_Reportar_Complementos_Secretarias.html',
  complementosConsultas: 'VAP_script_secretarias/VAP_Complementos Secretarias/VAP_index_Consultas_Envios_Complementos_Secretarias.html',
  horasExtrasDialogo: 'VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_index_Dialogo_Volcado_Horas_Extras.html',
  profesoresDialogo: 'VAP_scripts_profesores/VAP_index_Dialogo_Volcado_Actividad_Profesores.html',
};

export const leerFuente = (rutaRelativa) => readFileSync(join(SRC, rutaRelativa), 'utf8');

/**
 * Crea un entorno aislado con los servicios de Google falsos y carga en él los archivos pedidos.
 * Devuelve:
 *  - google: el doble (google.libro(id), google.estado…)
 *  - ejecutar(codigo): evalúa JS en el ámbito del script (sirve para leer `const` de nivel superior)
 *  - llamar(nombre, ...args): invoca una función del script
 *  - valor(expresion): atajo para leer una constante o variable del script
 * Los resultados se devuelven tal cual; usa `plano()` para compararlos con `toStrictEqual`.
 */
export function cargarGs(rutas, opciones = {}) {
  const google = opciones.google || crearGoogle(opciones);
  const ahoraMs = new Date(google.estado.ahora).getTime();
  const contexto = vm.createContext({ ...google.global, console });
  google.estado.evaluarEn = (codigo) => vm.runInContext(codigo, contexto);
  vm.runInContext(
    `(function(){ const Real = Date; class Fecha extends Real {
       constructor(...a){ if (a.length === 0) super(${ahoraMs}); else super(...a); }
       static now(){ return ${ahoraMs}; } }
     globalThis.Date = Fecha; })();`,
    contexto,
  );
  for (const ruta of [].concat(rutas)) {
    vm.runInContext(readFileSync(join(opciones.raiz || SRC, ruta), 'utf8'), contexto, { filename: ruta });
  }
  const ejecutar = (codigo) => vm.runInContext(codigo, contexto);
  return {
    google,
    contexto,
    ejecutar,
    valor: (expresion) => ejecutar(expresion),
    llamar: (nombre, ...args) => {
      contexto.__args = args;
      return ejecutar(`${nombre}(...__args)`);
    },
  };
}

/** Copia «plana» (JSON) de un valor creado dentro de la caja, para compararlo con `toStrictEqual`. */
export const plano = (valor) => JSON.parse(JSON.stringify(valor === undefined ? null : valor));
