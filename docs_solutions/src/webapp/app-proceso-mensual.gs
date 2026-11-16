// Casos de uso de la pantalla «Proceso mensual». Solo lectura en la versión 1 (ADR-0017).
// HU-45 · RF-79.

/** Los pasos del mes con su estado. */
function pasosDelPeriodo_(dependencias, periodo) {
  exigirAcceso_(dependencias, 'proceso-mensual');
  if (!esPeriodoValido_(periodo)) {
    throw new Error('El periodo debe tener la forma AAAA-MM, por ejemplo 2026-11.');
  }
  const filas = dependencias.leerEstadoPasos();
  return { periodo, pasos: combinarPasosConEstado_(PASOS_PROCESO_MENSUAL, filas, periodo) };
}
