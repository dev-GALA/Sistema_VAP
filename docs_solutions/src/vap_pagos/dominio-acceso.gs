// Quién puede llamar al servicio: la comprobación del token compartido. Reglas puras (ADR-0019). RNF-21.

/** Compara dos textos sin cortar en la primera diferencia (no da pistas por el tiempo). */
function textosIguales_(a, b) {
  const x = String(a);
  const y = String(b);
  let diferencia = x.length === y.length ? 0 : 1;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diferencia |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return diferencia === 0;
}

function tokenValido_(recibido, esperado) {
  return textoDe_(esperado) !== '' && textosIguales_(recibido, esperado);
}
