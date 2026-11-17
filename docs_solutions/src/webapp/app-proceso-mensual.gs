// Casos de uso de la pantalla «Proceso mensual». HU-45 · RF-79.
//
// dependencias = { correoActual(), leerUsuarios(), leerEstadoPasos(), ahora(), conBloqueo(accion),
//                  anadirEstadoPaso(fila) }

const MENSAJES_MARCA_RECHAZADA = {
  'paso-desconocido': 'Ese paso no existe.',
  'no-es-manual': 'Ese paso no es manual: no se marca a mano.',
  'ya-hecho': 'Ese paso ya está realizado en este periodo.',
  bloqueado: 'Antes hay que realizar el paso anterior.',
};

function exigirPeriodoValido_(periodo) {
  if (!esPeriodoValido_(periodo)) {
    throw new Error('El periodo debe tener la forma AAAA-MM, por ejemplo 2026-11.');
  }
}

function resultadoDelPeriodo_(filas, periodo) {
  return { periodo, grupos: GRUPOS_PASOS, pasos: combinarPasosConEstado_(PASOS_PROCESO_MENSUAL, filas, periodo) };
}

/** Los pasos del mes con su estado. */
function pasosDelPeriodo_(dependencias, periodo) {
  exigirAcceso_(dependencias, 'proceso-mensual');
  exigirPeriodoValido_(periodo);
  return resultadoDelPeriodo_(dependencias.leerEstadoPasos(), periodo);
}

/**
 * Marca un paso manual como realizado, con quién y cuándo. La decisión y la escritura van juntas dentro del
 * bloqueo: dos personas a la vez no pueden marcar el mismo paso dos veces. Devuelve los pasos ya actualizados.
 */
function marcarPasoRealizado_(dependencias, periodo, pasoId) {
  const contexto = exigirAcceso_(dependencias, 'proceso-mensual');
  exigirPeriodoValido_(periodo);
  return dependencias.conBloqueo(() => {
    const filas = dependencias.leerEstadoPasos();
    const decision = decidirMarcaPaso_(PASOS_PROCESO_MENSUAL, filas, periodo, pasoId);
    if (!decision.permitido) throw new Error(MENSAJES_MARCA_RECHAZADA[decision.motivo]);
    dependencias.anadirEstadoPaso({
      periodo,
      pasoId,
      estado: 'hecho',
      actualizadoPor: contexto.correo,
      actualizadoEn: dependencias.ahora(),
    });
    return resultadoDelPeriodo_(dependencias.leerEstadoPasos(), periodo);
  });
}
