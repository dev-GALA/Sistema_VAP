// Punto de entrada de la webapp: la única capa que conoce a la vez los casos de uso y los servicios de
// Google (ADR-0017). Solo `doGet` y las funciones `api…` son llamables desde el navegador, y TODAS
// comprueban el acceso en el servidor.

const VERSION_WEBAPP = '0.1.0';
const TITULO_WEBAPP = 'VAP · Proceso mensual';

const MENSAJE_SIN_ACCESO = 'No tienes acceso a esta aplicación. Si deberías tenerlo, avisa a desarrollo.';
const MENSAJE_SIN_CONFIGURAR = 'La aplicación aún no está configurada. Avisa a desarrollo.';
const MENSAJE_ERROR_INESPERADO = 'Ha ocurrido un error inesperado. Avisa a desarrollo.';

function include_(nombre) {
  return HtmlService.createHtmlOutputFromFile(nombre).getContent();
}

function correoActual_() {
  return Session.getActiveUser().getEmail();
}

function dependencias_() {
  return { correoActual: correoActual_, leerUsuarios: leerUsuarios_, leerEstadoPasos: leerEstadoPasos_ };
}

function paginaAviso_(titulo, mensaje, correo) {
  const plantilla = HtmlService.createTemplateFromFile('ui-aviso');
  plantilla.titulo = titulo;
  plantilla.mensaje = mensaje;
  plantilla.sesion = correo ? `Sesión iniciada como ${correo}` : '';
  return plantilla.evaluate().setTitle(TITULO_WEBAPP);
}

function doGet() {
  try {
    const contexto = obtenerContexto_(dependencias_());
    if (!contexto.permitido) {
      // Se registra el motivo, no el correo: no hace falta para diagnosticar y es un dato personal.
      Logger.log(`Acceso denegado (${contexto.motivo})`);
      return paginaAviso_('Sin acceso', MENSAJE_SIN_ACCESO, contexto.correo);
    }
    const plantilla = HtmlService.createTemplateFromFile('ui-index');
    plantilla.version = VERSION_WEBAPP;
    return plantilla.evaluate().setTitle(TITULO_WEBAPP);
  } catch (error) {
    Logger.log(`Error al abrir la webapp: ${error.message}`);
    const mensaje = error.name === NOMBRE_ERROR_CONFIGURACION ? MENSAJE_SIN_CONFIGURAR : MENSAJE_ERROR_INESPERADO;
    return paginaAviso_('No se puede abrir', mensaje, '');
  }
}

function apiContexto() {
  return obtenerContexto_(dependencias_());
}

function apiPasosDelPeriodo(periodo) {
  return pasosDelPeriodo_(dependencias_(), periodo);
}
