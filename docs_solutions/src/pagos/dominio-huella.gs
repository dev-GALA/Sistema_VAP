// La huella de una cuenta bancaria: reglas puras, sin servicios de Google (ADR-0019). RF-86 · RF-87 · RF-98 · RNF-19.
//
// NINGÚN mensaje de error de este archivo contiene la cuenta: dicen QUÉ falla, nunca su valor.

const LONGITUD_ULTIMOS_DIGITOS = 4;

function textoDe_(valor) {
  return String(valor === null || valor === undefined ? '' : valor).trim();
}

function normalizarIban_(valor) {
  return textoDe_(valor).toUpperCase().replace(/\s/g, '');
}

/** IBAN con la forma de cualquier país y el dígito de control (módulo 97) comprobado. */
function esIbanValido_(iban) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const reordenado = iban.slice(4) + iban.slice(0, 4);
  let resto = 0;
  for (const caracter of reordenado) {
    const cifras = /\d/.test(caracter) ? caracter : String(caracter.charCodeAt(0) - 55);
    for (const cifra of cifras) resto = (resto * 10 + Number(cifra)) % 97;
  }
  return resto === 1;
}

function ultimosDigitos_(iban) {
  return iban.slice(-LONGITUD_ULTIMOS_DIGITOS);
}

/**
 * Huella de la cuenta: HMAC-SHA256 con la clave secreta, SIN el identificador de la persona ni su empresa
 * (RF-87). `calcularHmacHex(texto, clave)` llega inyectada: el dominio no conoce `Utilities`.
 */
function huellaDeCuenta_(iban, clave, calcularHmacHex) {
  if (!clave) throw new Error('Falta la clave de la huella.');
  const normalizado = normalizarIban_(iban);
  if (!esIbanValido_(normalizado)) throw new Error('La cuenta bancaria no es válida.');
  return calcularHmacHex(normalizado, clave);
}
