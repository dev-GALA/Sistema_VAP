// Casos de uso del acceso. Las dependencias llegan inyectadas (ADR-0017): este archivo no conoce
// ningún servicio de Google.
//
// dependencias = { correoActual(), leerUsuarios(), leerEstadoPasos() }

/** Quién es el usuario actual y qué pantallas puede ver. No lanza error si no tiene acceso. */
function obtenerContexto_(dependencias) {
  const correo = normalizarCorreo_(dependencias.correoActual());
  const acceso = decidirAcceso_(correo, dependencias.leerUsuarios());
  return {
    permitido: acceso.permitido,
    motivo: acceso.motivo,
    correo,
    rol: acceso.rol,
    pantallas: acceso.permitido ? pantallasPermitidas_(acceso.rol) : [],
  };
}

/**
 * Comprueba el acceso a una pantalla y devuelve el contexto, o lanza un error. El mensaje es el mismo
 * sea cual sea el motivo: no se cuenta a quien no entra por qué no entra.
 */
function exigirAcceso_(dependencias, idPantalla) {
  const contexto = obtenerContexto_(dependencias);
  if (!contexto.permitido || !puedeVerPantalla_(contexto.rol, idPantalla)) {
    throw new Error('No tienes acceso a esta pantalla.');
  }
  return contexto;
}
