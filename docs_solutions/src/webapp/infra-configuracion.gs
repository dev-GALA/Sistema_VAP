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

// Registro de altas y bajas (RF-84): una fila por cada paso del evento. SIN DNI, nombre ni cuenta
// (ADR-0018, punto 5): solo el identificador de la persona.
const HOJA_REGISTRO_PERSONAL = 'registro_personal';
const COLUMNAS_REGISTRO_PERSONAL = {
  eventoId: 'evento_id',
  momento: 'momento',
  usuario: 'usuario',
  accion: 'accion',
  empresa: 'empresa',
  idTrabajador: 'id_trabajador',
  estado: 'estado',
  detalle: 'detalle',
};

// Cabeceras que el maestro debe tener (se buscan por nombre; si falta una, se niega y dice cuál).
const COLUMNAS_MAESTRO = {
  idTrabajador: 'id_trabajador',
  nombre: 'nombre',
  apellidos: 'apellidos',
  dni: 'dni',
  fechaAlta: 'fecha_alta',
  fechaBaja: 'fecha_baja',
};

// Marca de «la cuenta consta en VAP_Pagos» (RF-97): solo se exige cuando se va a guardar una cuenta. SUPUESTO: el
// maestro real no se ha visto; se añaden estas dos columnas a cada pestaña.
const COLUMNAS_MARCA_CUENTA = { cuentaEnPagos: 'cuenta_en_pagos', cuentaEnPagosFecha: 'cuenta_en_pagos_fecha' };
const VALOR_CUENTA_EN_PAGOS = 'sí';

// El servicio VAP_Pagos (ADR-0019): su dirección y el token compartido viven en las propiedades del script, nunca
// en la hoja `config` (que varias personas pueden leer).
const PROPIEDAD_URL_SERVICIO_PAGOS = 'URL_SERVICIO_PAGOS';
const PROPIEDAD_TOKEN_SERVICIO_PAGOS = 'TOKEN_SERVICIO_PAGOS';
