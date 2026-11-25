// El cruce de los pagos del banco con la base de huellas: reglas puras (ADR-0019). RF-88 · RF-91 · RF-99.
//
// Cada pago del fichero deja UNA fila en el informe: nada queda sin registrar (lo no comprobado nunca se
// presenta como comprobado). Dos partes: PARTE 1 · la cuenta consta en VAP_Pagos; PARTE 2 · no consta.
// Estados: «Coincidente» o «Incorrecto». Las observaciones solo se rellenan en los Incorrecto.

const ESTADO_COINCIDENTE = 'Coincidente';
const ESTADO_INCORRECTO = 'Incorrecto';
const PARTE_COINCIDE = 'coincide';
const PARTE_NO_EXISTE = 'no-existe';

function agruparPor_(lista, claveDe) {
  const grupos = {};
  lista.forEach((elemento) => {
    const clave = claveDe(elemento);
    if (!grupos[clave]) grupos[clave] = [];
    grupos[clave].push(elemento);
  });
  return grupos;
}

function filaBase_(contexto, pago) {
  return {
    periodo: contexto.periodo,
    empresa: contexto.empresa,
    parte: PARTE_COINCIDE,
    estado: ESTADO_COINCIDENTE,
    idPersonal: '',
    nombreBanco: '',
    huella: '',
    ultimos4: '',
    importeBanco: pago ? formatearCentimos_(aCentimos_(pago.importe)) : '',
    importeEsperado: '',
    banco: pago ? textoDe_(pago.banco) : '',
    referencia: pago ? textoDe_(pago.referencia) : '',
    fuente: contexto.fuente,
    observaciones: '',
  };
}

function incorrecto_(fila, observaciones) {
  return Object.assign(fila, { estado: ESTADO_INCORRECTO, observaciones });
}

function describirPago_(pago, fila) {
  const piezas = [`fichero «${textoDe_(pago.fichero)}»`];
  if (fila.referencia) piezas.push(`referencia «${fila.referencia}»`);
  if (fila.banco) piezas.push(`banco ${fila.banco}`);
  piezas.push(`fuente ${fila.fuente}`);
  return piezas.join(', ');
}

/** Pago cuya cuenta no es válida: no se puede calcular su huella, así que no existe en la base. */
function filaCuentaInvalida_(contexto, pago) {
  const fila = filaBase_(contexto, pago);
  fila.parte = PARTE_NO_EXISTE;
  fila.nombreBanco = textoDe_(pago.nombre);
  return incorrecto_(
    fila,
    `La cuenta del fichero no es un IBAN válido. Importe ${fila.importeBanco}; ${describirPago_(pago, fila)}.`,
  );
}

function filaNoExiste_(contexto, pago, huella) {
  const fila = filaBase_(contexto, pago);
  fila.parte = PARTE_NO_EXISTE;
  fila.nombreBanco = textoDe_(pago.nombre);
  fila.huella = huella;
  fila.ultimos4 = ultimosDigitos_(normalizarIban_(pago.iban));
  return incorrecto_(
    fila,
    `Cuenta no registrada en VAP_Pagos. Importe ${fila.importeBanco}; ${describirPago_(pago, fila)}.`,
  );
}

/** Compara el pago con lo esperado de una persona activa. */
function filaDePersona_(contexto, pago, huellaPersona, esperado) {
  const fila = filaBase_(contexto, pago);
  fila.idPersonal = esperado.idPersonal;
  fila.ultimos4 = huellaPersona.ultimos4;
  fila.importeEsperado = formatearCentimos_(aCentimos_(esperado.importe));
  const coincide = importesCoinciden_(
    aCentimos_(pago.importe),
    aCentimos_(esperado.importe),
    contexto.toleranciaCentimos,
  );
  if (coincide) return fila;
  return incorrecto_(
    fila,
    `El importe del banco (${fila.importeBanco}) no coincide con el esperado (${fila.importeEsperado}); ${describirPago_(pago, fila)}.`,
  );
}

/**
 * Cruza los pagos de UNA empresa.
 *  - pagos:     [{ nombre, iban, importe, referencia, banco, fichero }] tal como vienen del fichero.
 *  - esperados: personas ACTIVAS de la empresa con lo que debían cobrar: [{ idPersonal, importe }].
 *  - huellas:   lo que hay en VAP_Pagos: [{ idPersonal, huella, ultimos4 }].
 *  - contexto:  { periodo, empresa, fuente, toleranciaCentimos, huellaDe(iban) }.
 * Devuelve la lista de filas del informe (una por pago y una por cada esperado sin pago).
 */
function cruzarPagos_(pagos, esperados, huellas, contexto) {
  const esperadoPorId = {};
  esperados.forEach((e) => {
    esperadoPorId[e.idPersonal] = e;
  });
  const huellasPorValor = agruparPor_(huellas, (h) => h.huella);

  const filas = [];
  const pagosPorPersona = {};
  const resultados = pagos.map((pago) => {
    const iban = normalizarIban_(pago.iban);
    if (!esIbanValido_(iban)) return { pago, fila: filaCuentaInvalida_(contexto, pago) };
    const huella = contexto.huellaDe(iban);
    const candidatas = huellasPorValor[huella] || [];
    if (candidatas.length === 0) return { pago, fila: filaNoExiste_(contexto, pago, huella) };

    const activas = candidatas.filter((c) => esperadoPorId[c.idPersonal]);
    if (activas.length > 1) {
      const fila = filaBase_(contexto, pago);
      fila.ultimos4 = candidatas[0].ultimos4;
      return {
        pago,
        fila: incorrecto_(
          fila,
          `Cuenta ambigua: la comparten ${activas.length} personas activas. Importe ${fila.importeBanco}; ${describirPago_(pago, fila)}.`,
        ),
      };
    }
    if (activas.length === 0) {
      const fila = filaBase_(contexto, pago);
      fila.ultimos4 = candidatas[0].ultimos4;
      if (candidatas.length === 1) fila.idPersonal = candidatas[0].idPersonal;
      return {
        pago,
        fila: incorrecto_(
          fila,
          `La cuenta consta, pero su persona no figura entre las esperadas de ${contexto.empresa} este mes (baja, otra empresa o sin importe). Importe ${fila.importeBanco}; ${describirPago_(pago, fila)}.`,
        ),
      };
    }
    const persona = activas[0].idPersonal;
    pagosPorPersona[persona] = (pagosPorPersona[persona] || 0) + 1;
    return { pago, fila: filaDePersona_(contexto, pago, activas[0], esperadoPorId[persona]), persona };
  });

  resultados.forEach((r) => {
    if (r.persona && pagosPorPersona[r.persona] > 1) {
      incorrecto_(
        r.fila,
        `Hay ${pagosPorPersona[r.persona]} pagos a esta persona en el periodo: se revisan a mano. ${r.fila.observaciones}`.trim(),
      );
    }
    filas.push(r.fila);
  });

  esperados.forEach((e) => {
    if (pagosPorPersona[e.idPersonal]) return;
    const fila = filaBase_(contexto, null);
    fila.idPersonal = e.idPersonal;
    fila.importeEsperado = formatearCentimos_(aCentimos_(e.importe));
    const propia = huellas.filter((h) => h.idPersonal === e.idPersonal)[0];
    if (propia) fila.ultimos4 = propia.ultimos4;
    filas.push(
      incorrecto_(
        fila,
        `Esperada y sin pago en el banco. Importe esperado ${fila.importeEsperado}; fuente ${fila.fuente}.`,
      ),
    );
  });
  return filas;
}
