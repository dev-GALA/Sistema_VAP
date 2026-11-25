// La huella de una cuenta bancaria y a quién se asocia: reglas puras, sin servicios de Google (ADR-0019 y ADR-0020).
// RF-86 · RF-87 · RF-98 · RF-102 · RNF-19.
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

/** DNI o NIE sin espacios ni guiones y en mayúsculas. Es la clave de la persona en VAP_Pagos (ADR-0020). */
function normalizarDni_(valor) {
  return textoDe_(valor).toUpperCase().replace(/[\s-]/g, '');
}

/** Solo la forma (8 cifras y letra, o X/Y/Z, 7 cifras y letra): evita crear una persona nueva por una errata de longitud. */
function esDniValido_(dni) {
  return /^(\d{8}|[XYZ]\d{7})[A-Z]$/.test(dni);
}

/** El siguiente número correlativo de `id_pagos`: el mayor que consta más uno. Nunca se reutiliza. */
function siguienteIdPagos_(existentes) {
  const mayor = existentes.reduce((maximo, fila) => Math.max(maximo, Number(fila.idPagos) || 0), 0);
  return String(mayor + 1);
}

function describirIds_(filas) {
  return filas.map((f) => f.idPersonal).join(', ');
}

/** Todo lo que consta de una fila de `huellas`, para que quien resuelve una incidencia sepa de qué se trata. */
function describirFila_(fila) {
  const quien = fila.actualizadoPor ? ` por ${fila.actualizadoPor}` : '';
  return `fila ${fila.idPagos} de VAP_Pagos, cuenta terminada en ${fila.ultimos4}, guardada el ${fila.actualizadoEn}${quien}`;
}

/**
 * Decide qué filas de `huellas` hay que escribir al guardar la cuenta de una persona (ADR-0020).
 *  - existentes: lo que ya hay en `huellas`.
 *  - persona:    { idPersonal, dni } con el DNI ya normalizado.
 *  - datos:      { huella, ultimos4, actualizadoEn, actualizadoPor }.
 * Una fila por pareja DNI + id de trabajador. Todas las filas de un DNI llevan la MISMA huella: si la cuenta cambia,
 * se actualizan todas a la vez. Devuelve { filas, avisos }; `filas` es lo que hay que escribir.
 */
function planificarGuardado_(existentes, persona, datos) {
  const conOtroDni = existentes.filter((f) => f.idPersonal === persona.idPersonal && f.dni !== persona.dni)[0];
  if (conOtroDni) {
    throw new Error(
      `El identificador ${persona.idPersonal} ya consta con el DNI ${conOtroDni.dni} (${describirFila_(conOtroDni)}) y ahora llega con el DNI ${persona.dni}. Un identificador no puede tener dos DNI: comprueba en el maestro cuál es el correcto y corrige el otro antes de guardar. No se ha guardado nada.`,
    );
  }
  const delDni = existentes.filter((f) => f.dni === persona.dni);
  const filas = delDni.map((f) => Object.assign({}, f, datos));
  const avisos = [];
  if (!delDni.some((f) => f.idPersonal === persona.idPersonal)) {
    filas.push(
      Object.assign(
        { idPagos: siguienteIdPagos_(existentes), dni: persona.dni, idPersonal: persona.idPersonal },
        datos,
      ),
    );
    if (delDni.length > 0) {
      const cuenta = delDni.every((f) => f.huella === datos.huella)
        ? 'con la misma cuenta'
        : `con una cuenta distinta (la nueva termina en ${datos.ultimos4}; se guarda en todas las filas de este DNI)`;
      avisos.push(
        `El DNI ${persona.dni} ya constaba con el identificador ${describirIds_(delDni)} (${delDni.map(describirFila_).join('; ')}) y ahora también con ${persona.idPersonal}, ${cuenta}. Pueden ser correctos los dos identificadores, o uno no: compruébalo en el maestro.`,
      );
    }
  }
  return { filas, avisos };
}
