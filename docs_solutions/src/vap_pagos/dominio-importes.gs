// Importes en céntimos enteros: nunca se comparan decimales (0,1 + 0,2 ≠ 0,3). Reglas puras (ADR-0019). RF-99.

/**
 * «1.234,56», «1234,56», «1234.56» o un número → céntimos enteros. Un valor que no es un importe devuelve NaN.
 * Con coma, el punto es separador de miles; sin coma, el punto es el decimal.
 */
function aCentimos_(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? Math.round(valor * 100) : NaN;
  let texto = textoDe_(valor).replace(/[€\s]/g, '');
  if (texto === '' || !/^-?[\d.,]+$/.test(texto)) return NaN;
  texto = texto.indexOf(',') !== -1 ? texto.replace(/\./g, '').replace(',', '.') : texto;
  const numero = Number(texto);
  return Number.isFinite(numero) ? Math.round(numero * 100) : NaN;
}

function importesCoinciden_(centimosA, centimosB, toleranciaCentimos) {
  if (!Number.isInteger(centimosA) || !Number.isInteger(centimosB)) return false;
  return Math.abs(centimosA - centimosB) <= toleranciaCentimos;
}

/** 123456 → «1234,56». Para las observaciones del informe. */
function formatearCentimos_(centimos) {
  if (!Number.isInteger(centimos)) return '';
  const signo = centimos < 0 ? '-' : '';
  const absoluto = Math.abs(centimos);
  return `${signo}${Math.floor(absoluto / 100)},${String(absoluto % 100).padStart(2, '0')}`;
}
