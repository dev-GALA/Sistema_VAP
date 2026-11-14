// Ayudas comunes de los E2E de complementos: arranca el arnés con el .gs real, las tres pantallas reales
// y la BBDD ficticia (la misma que usan las pruebas de Vitest).
import { iniciarAplicacion } from './arnes.mjs';
import { CODIGO, HTML } from '../soporte/cargar-gs.js';
import { cargarData, poblarEntorno } from '../complementos/ayudas.js';

export { cargarData };

/**
 * opciones: ahora, usuario, datos (filas para Data, formato de `filaData`), preparar(env), sinHojas, bbdd, azar.
 * Devuelve { url, env, llamadas, cerrar, entorno }; `env` da acceso a las hojas en memoria.
 */
export async function arrancar(opciones = {}) {
  const { ahora = '2026-03-15T10:00:00Z', usuario = 'gestor@gala.test', datos = [], preparar } = opciones;
  let env;
  const app = await iniciarAplicacion({
    codigo: [CODIGO.complementos],
    html: { Portal: HTML.complementosPortal, Index: HTML.complementosReportar, Consultas: HTML.complementosConsultas },
    google: { ahora, usuario },
    preparar: (entorno) => {
      env = poblarEntorno(entorno, opciones);
      if (datos.length) cargarData(env, datos);
      if (preparar) preparar(env);
    },
  });
  return { ...app, env };
}

export const URL_REPORTAR = (app) => `${app.url}/`;
export const URL_CONSULTAS = (app) => `${app.url}/?page=consultas`;
export const URL_PORTAL = (app) => `${app.url}/?page=portal`;

/** Valida el email en el paso 1 de Reportar y espera a que aparezca el paso 2. */
export async function validarEnReportar(page, email = 'ana@gala.test') {
  await page.locator('#email').fill(email);
  await page.locator('#btnValidate').click();
  await page.locator('#step2').waitFor({ state: 'visible' });
}

/** Valida el email en Consultas y espera al paso 2. */
export async function validarEnConsultas(page, email = 'ana@gala.test') {
  await page.locator('#email').fill(email);
  await page.locator('#btnVal').click();
  await page.locator('#step2').waitFor({ state: 'visible' });
}

/** Marca XSS: un <img onerror> que pone window.__xss. */
export const CARGA_XSS = '<img src=x onerror="window.__xss=1">';
