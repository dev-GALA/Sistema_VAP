// Soporte de las pruebas del servicio VAP_Pagos (ADR-0019): carga su código en la caja de Node con los dobles de
// Google y prepara su libro en memoria. Todo con datos INVENTADOS.
import { readdirSync } from 'node:fs';
import { cargarGs, SRC_PAGOS } from '../soporte/cargar-gs.js';

export const ARCHIVOS = readdirSync(SRC_PAGOS).sort();
export const ARCHIVOS_GS = ARCHIVOS.filter((f) => f.endsWith('.gs'));

export const ID_LIBRO_PAGOS = 'libro-pagos-prueba';
export const CLAVE_PRUEBA = 'clave-de-prueba-no-real';
export const TOKEN_PRUEBA = 'token-de-prueba-no-real';

export const CABECERA_HUELLAS = [
  'id_pagos',
  'dni',
  'id_trabajador',
  'huella',
  'ultimos4',
  'actualizado_en',
  'actualizado_por',
];

// DNI y usuario INVENTADOS para las pruebas.
export const DNI_1 = '12345678Z';
export const DNI_2 = '87654321X';
export const USUARIO_PRUEBA = 'responsable@prueba.invalid';
export const CABECERA_SUBSANACIONES = [
  'periodo',
  'fila_id',
  'id_pagos',
  'momento',
  'usuario',
  'resolucion',
  'asignada_a',
  'motivo',
];
export const CABECERA_CIERRES = ['periodo', 'momento', 'usuario', 'empresas', 'sin_resolver'];

/** IBAN español INVENTADO pero con dígito de control válido, a partir de un número de cuenta de 20 cifras. */
export function ibanDePrueba(semilla) {
  const cuenta = String(semilla).padStart(20, '0');
  const reordenado = `${cuenta}142800`; // «ES» = 14 28, y 00 provisional
  let resto = 0;
  for (const cifra of reordenado) resto = (resto * 10 + Number(cifra)) % 97;
  return `ES${String(98 - resto).padStart(2, '0')}${cuenta}`;
}

export function cargarPagos(opciones = {}) {
  return cargarGs(ARCHIVOS_GS, { raiz: SRC_PAGOS, ...opciones });
}

/** Crea VAP_Pagos en memoria con sus hojas fijas y fija las tres propiedades del script. */
export function prepararPagos(entorno, { huellas = [], clave = true, token = true } = {}) {
  const libro = entorno.google.libro(ID_LIBRO_PAGOS, 'VAP_Pagos');
  libro.conHoja('huellas', [CABECERA_HUELLAS, ...huellas]);
  libro.conHoja('subsanaciones', [CABECERA_SUBSANACIONES]);
  libro.conHoja('cierres', [CABECERA_CIERRES]);
  const propiedades = entorno.google.estado.propiedadesScript;
  propiedades.ID_LIBRO_PAGOS = ID_LIBRO_PAGOS;
  if (clave) propiedades.CLAVE_HUELLA = CLAVE_PRUEBA;
  if (token) propiedades.TOKEN_SERVICIO = TOKEN_PRUEBA;
  return libro;
}

/** Llama al servicio como lo haría la webapp: un POST con el token, la acción y los datos. */
export function llamarServicio(entorno, accion, datos, token = TOKEN_PRUEBA) {
  const salida = entorno.llamar('doPost', { postData: { contents: JSON.stringify({ token, accion, datos }) } });
  return JSON.parse(salida.getContent());
}
