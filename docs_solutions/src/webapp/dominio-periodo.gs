// Periodos del proceso mensual. Reglas puras: sin servicios de Google (ADR-0017).
// Un periodo se escribe AAAA-MM, igual que el valor de un <input type="month">.

const FORMATO_PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

function esPeriodoValido_(periodo) {
  return typeof periodo === 'string' && FORMATO_PERIODO.test(periodo);
}

function periodoDeFecha_(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}`;
}
