// Punto de entrada del servicio VAP_Pagos: la única capa que conoce a la vez los casos de uso y los servicios de
// Google (ADR-0019). Se despliega como aplicación web y la webapp lo llama con una petición POST.
//
// Defensa en dos capas: (1) el despliegue limita quién puede llamar (ajuste del despliegue, decisión del
// propietario, aún abierta) y (2) cada llamada trae un TOKEN compartido que se comprueba aquí.

const ESPERA_BLOQUEO_MS = 10000;

function ahora_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), FORMATO_FECHA_HORA);
}

function conBloqueo_(accion) {
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(ESPERA_BLOQUEO_MS);
  try {
    return accion();
  } finally {
    bloqueo.releaseLock();
  }
}

/** HMAC-SHA256 en hexadecimal. Los bytes de Google llegan con signo (-128…127). */
function calcularHmacHex_(texto, clave) {
  return Utilities.computeHmacSha256Signature(texto, clave)
    .map((byte) => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0'))
    .join('');
}

function dependencias_() {
  return {
    clave: () => propiedad_(PROPIEDAD_CLAVE_HUELLA),
    calcularHmacHex: calcularHmacHex_,
    ahora: ahora_,
    nuevoId: Utilities.getUuid,
    conBloqueo: conBloqueo_,
    leerHuellas: leerHuellas_,
    guardarHuella: guardarHuella_,
    leerInforme: leerInforme_,
    reemplazarInforme: reemplazarInforme_,
    actualizarFilaInforme: actualizarFilaInforme_,
    anadirSubsanacion: anadirSubsanacion_,
    anadirFusion: anadirFusion_,
    leerTodosLosInformes: leerTodosLosInformes_,
  };
}

function respuestaJson_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

/** Mensajes que NO se cuentan al que llama: no se le dice por qué no entra. */
const ERROR_NO_AUTORIZADO = 'No autorizado.';
const ERROR_PETICION_NO_VALIDA = 'Petición no válida.';
const ERROR_INESPERADO = 'Error inesperado en VAP_Pagos.';

function doPost(evento) {
  let peticion;
  try {
    peticion = JSON.parse(evento && evento.postData ? evento.postData.contents : '');
  } catch (error) {
    return respuestaJson_({ ok: false, error: ERROR_PETICION_NO_VALIDA });
  }
  try {
    if (!tokenValido_(peticion.token, PropertiesService.getScriptProperties().getProperty(PROPIEDAD_TOKEN_SERVICIO))) {
      Logger.log('Llamada rechazada (token)');
      return respuestaJson_({ ok: false, error: ERROR_NO_AUTORIZADO });
    }
    return respuestaJson_(atenderLlamada_(dependencias_(), peticion.accion, peticion.datos));
  } catch (error) {
    // Se registra el tipo de fallo, nunca el contenido de la petición (podría llevar cuentas).
    Logger.log(`Error en el servicio (${error.name})`);
    return respuestaJson_({
      ok: false,
      error: error.name === NOMBRE_ERROR_CONFIGURACION ? error.message : ERROR_INESPERADO,
    });
  }
}
