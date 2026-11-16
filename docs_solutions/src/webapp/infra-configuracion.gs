// Dónde está el libro de la webapp y cómo se llaman sus hojas y columnas. Todo lo que puede cambiar va
// aquí, al principio, y no esparcido por la lógica (SOLID-D). ADR-0018.

const PROPIEDAD_ID_LIBRO = 'ID_LIBRO_WEBAPP';

// La hoja `config` guarda los parámetros como clave/valor, igual que BUCA.
const HOJA_CONFIG = 'config';
const COLUMNAS_CONFIG = { clave: 'clave', valor: 'valor' };

const HOJA_ESTADO_PASOS = 'estado_pasos';
const COLUMNAS_ESTADO_PASOS = {
  periodo: 'periodo',
  pasoId: 'paso_id',
  estado: 'estado',
  actualizadoPor: 'actualizado_por',
  actualizadoEn: 'actualizado_en',
};

const NOMBRE_ERROR_CONFIGURACION = 'ErrorDeConfiguracion';

/** Un fallo de configuración (falta el libro, una hoja o una columna) se distingue de un fallo inesperado. */
function errorDeConfiguracion_(mensaje) {
  const error = new Error(mensaje);
  error.name = NOMBRE_ERROR_CONFIGURACION;
  return error;
}

function idLibroWebapp_() {
  const id = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_ID_LIBRO);
  if (!id) {
    throw errorDeConfiguracion_(
      `Falta la propiedad del script ${PROPIEDAD_ID_LIBRO} con el identificador del libro de la webapp.`,
    );
  }
  return id;
}
