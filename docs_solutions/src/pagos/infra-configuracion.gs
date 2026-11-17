// Dónde está el libro VAP_Pagos y cómo se llaman sus hojas y columnas. Todo lo que puede cambiar va aquí, al
// principio, y no esparcido por la lógica (SOLID-D). ADR-0019.

const PROPIEDAD_ID_LIBRO_PAGOS = 'ID_LIBRO_PAGOS';
const PROPIEDAD_CLAVE_HUELLA = 'CLAVE_HUELLA';
const PROPIEDAD_TOKEN_SERVICIO = 'TOKEN_SERVICIO';

const FORMATO_FECHA_HORA = 'yyyy-MM-dd HH:mm';
const NOMBRE_ERROR_CONFIGURACION = 'ErrorDeConfiguracion';

const HOJA_HUELLAS = 'huellas';
const COLUMNAS_HUELLAS = {
  idPersonal: 'id_personal',
  huella: 'huella',
  ultimos4: 'ultimos4',
  actualizadoEn: 'actualizado_en',
};

const HOJA_SUBSANACIONES = 'subsanaciones';
const COLUMNAS_SUBSANACIONES = {
  periodo: 'periodo',
  filaId: 'fila_id',
  momento: 'momento',
  usuario: 'usuario',
  resolucion: 'resolucion',
  asignadaA: 'asignada_a',
  motivo: 'motivo',
};

const HOJA_FUSIONES = 'fusiones';
const COLUMNAS_FUSIONES = {
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
