// Dónde está el libro VAP_Pagos y cómo se llaman sus hojas y columnas. Todo lo que puede cambiar va aquí, al
// principio, y no esparcido por la lógica (SOLID-D). ADR-0019.

const PROPIEDAD_ID_LIBRO_PAGOS = 'ID_LIBRO_PAGOS';
const PROPIEDAD_CLAVE_HUELLA = 'CLAVE_HUELLA';
const PROPIEDAD_TOKEN_SERVICIO = 'TOKEN_SERVICIO';

// Carga inicial de cuentas (uso único, ADR-0020): dónde están el Excel de la carga inicial y el maestro de personas.
const PROPIEDAD_ID_LIBRO_VAP_PERSONAS = 'ID_LIBRO_VAP_Personas';
const PROPIEDAD_ID_LIBRO_CARGA_INICIAL = 'ID_LIBRO_CARGA_INICIAL';
const HOJAS_MAESTRO = ['VAP_Staff', 'VAP_Secretarias', 'VAP_Profesores'];
const COLUMNAS_MAESTRO = { empresa: 'empresa', idPersonal: 'id_trabajador', dni: 'dni', alta: 'alta' };
const COLUMNAS_MARCA_HUELLA = { idPersonal: 'id_trabajador', huella: 'huella' }; // la casilla «Huella» de cada pestaña
const COLUMNAS_CARGA_INICIAL = { dni: 'dni', cuenta: 'nº de cuenta bancaria' };
const HOJA_CARGA_INICIAL = 'carga_inicial';
// Hojas de DETALLE de la carga (con nombre y DNI): van en el libro TEMPORAL del Excel, no en VAP_Pagos, para que los nombres
// desaparezcan cuando se borre ese libro. La clave es la de `informesDeCarga_`.
const HOJAS_DETALLE_CARGA = {
  repetidas: 'repetidas_carga_inicial',
  'dni-invalido': 'dni_invalido_carga_inicial',
  'id-repetido': 'id_repetido_carga_inicial',
  'sin-cuenta': 'sin_cuenta_carga_inicial',
  'sin-persona-activa': 'sin_persona_activa_carga_inicial',
  'cuentas-distintas': 'cuentas_distintas_carga_inicial',
  'sin-cuenta-en-excel': 'sin_cuenta_en_excel_carga_inicial',
  'con-huella': 'con_huella_carga_inicial',
};
const COLUMNAS_NOMBRE_MAESTRO = ['nombre', 'nombre_secretaria', 'nombre_profesores'];
const COLUMNAS_FECHA_ALTA_MAESTRO = ['fecha_alta', 'fecha alta'];
const COLUMNAS_FECHA_BAJA_MAESTRO = ['fecha_baja', 'fecha baja'];
const CABECERA_CARGA_INICIAL = ['tipo', 'fila_excel', 'dni', 'id_trabajador', 'detalle'];
const PRESUPUESTO_TIEMPO_CARGA_MS = 270000; // 4,5 minutos de los 6 que da Google

const FORMATO_FECHA_HORA = 'yyyy-MM-dd HH:mm';
const NOMBRE_ERROR_CONFIGURACION = 'ErrorDeConfiguracion';

const HOJA_HUELLAS = 'huellas';
const COLUMNAS_HUELLAS = {
  idPagos: 'id_pagos',
  dni: 'dni',
  idPersonal: 'id_trabajador',
  huella: 'huella',
  ultimos4: 'ultimos4',
  actualizadoEn: 'actualizado_en',
  actualizadoPor: 'actualizado_por',
};

const HOJA_SUBSANACIONES = 'subsanaciones';
const COLUMNAS_SUBSANACIONES = {
  periodo: 'periodo',
  filaId: 'fila_id',
  idPagos: 'id_pagos',
  momento: 'momento',
  usuario: 'usuario',
  resolucion: 'resolucion',
  asignadaA: 'asignada_a',
  motivo: 'motivo',
};

const HOJA_CIERRES = 'cierres';
const COLUMNAS_CIERRES = {
  periodo: 'periodo',
  momento: 'momento',
  usuario: 'usuario',
  empresas: 'empresas',
  sinResolver: 'sin_resolver',
};

/** Un informe por mes, en una sola hoja: `informe_2026-11`. */
function nombreHojaInforme_(periodo) {
  return `informe_${periodo}`;
}

/** Un fallo de configuración (falta una propiedad, una hoja o una columna) se distingue de uno inesperado. */
function errorDeConfiguracion_(mensaje) {
  const error = new Error(mensaje);
  error.name = NOMBRE_ERROR_CONFIGURACION;
  return error;
}

function propiedad_(nombre) {
  const valor = PropertiesService.getScriptProperties().getProperty(nombre);
  if (!valor) throw errorDeConfiguracion_(`Falta la propiedad del script ${nombre}.`);
  return valor;
}
