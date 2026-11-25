// Carga inicial de cuentas, de USO ÚNICO (ADR-0020 · RF-89): decide qué cuentas se cargan y qué incidencias hay, con
// reglas puras y sin servicios de Google. Cruza el Excel de la carga inicial con el maestro POR DNI.
//
// LA CUENTA SOLO EXISTE EN MEMORIA (RNF-19): ninguna incidencia ni resumen de este archivo la contiene.

const INCIDENCIA_SIN_DNI = 'sin-dni';
const INCIDENCIA_DNI_INVALIDO = 'dni-invalido';
const INCIDENCIA_SIN_CUENTA = 'sin-cuenta';
const INCIDENCIA_CUENTA_INVALIDA = 'cuenta-invalida';
const INCIDENCIA_CUENTAS_DISTINTAS = 'cuentas-distintas';
const INCIDENCIA_SIN_PERSONA_ACTIVA = 'sin-persona-activa';
const INCIDENCIA_SIN_CUENTA_EN_EXCEL = 'sin-cuenta-en-excel';

/** La cuenta como viene en el Excel: sin espacios, guiones ni puntos, en mayúsculas. */
function normalizarCuentaDelExcel_(valor) {
  return textoDe_(valor)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function incidencia_(tipo, detalle, extra) {
  return Object.assign({ tipo, fila: '', dni: '', idPersonal: '', detalle }, extra);
}

/** Una fila del Excel de la carga inicial: o se ignora (título o vacía), o tiene una incidencia, o es { dni, iban } utilizable. */
function clasificarFilaDelExcel_(fila) {
  const dni = normalizarDni_(fila.dni);
  const cuenta = normalizarCuentaDelExcel_(fila.cuenta);
  const donde = { fila: fila.fila, dni };
  if (dni === '' && cuenta === '') return { ignorada: true };
  if (dni === '') {
    return { incidencia: incidencia_(INCIDENCIA_SIN_DNI, 'Hay una cuenta en esta fila pero no DNI.', donde) };
  }
  if (!esDniValido_(dni)) {
    return {
      incidencia: incidencia_(
        INCIDENCIA_DNI_INVALIDO,
        'El DNI o NIE no tiene una forma válida (8 cifras y letra).',
        donde,
      ),
    };
  }
  if (cuenta === '') {
    return { incidencia: incidencia_(INCIDENCIA_SIN_CUENTA, 'Hay un DNI en esta fila pero no cuenta.', donde) };
  }
  if (!esIbanValido_(cuenta)) {
    return {
      incidencia: incidencia_(
        INCIDENCIA_CUENTA_INVALIDA,
        'La cuenta no es un IBAN válido: comprueba los dígitos y la longitud.',
        donde,
      ),
    };
  }
  return { dni, iban: cuenta };
}

/** Los `idPersonal` que salen más de una vez en el maestro (en cualquier pestaña), sin repetirlos. */
function idsRepetidos_(personas) {
  const veces = {};
  personas.forEach((p) => {
    if (p.idPersonal !== '') veces[p.idPersonal] = (veces[p.idPersonal] || 0) + 1;
  });
  return Object.keys(veces).filter((id) => veces[id] > 1);
}

/**
 * Qué se carga y qué hay que revisar.
 *  - filasDelExcel: [{ fila, dni, cuenta }] del Excel de la carga inicial (`fila` = número de fila en esa hoja).
 *  - personas:     [{ idPersonal, dni, empresa, activa }] de las pestañas del maestro.
 *  - registradas:  los `idPersonal` que ya constan en `huellas` (no se tocan: la carga se puede repetir).
 * Devuelve { cuentas: [{ idPersonal, dni, iban, fila }], incidencias, repetidasDetalle, resumen }.
 */
function planCargaInicial_(filasDelExcel, personas, registradas) {
  const incidencias = [];
  const porDni = {};
  let ignoradas = 0;
  let repetidas = 0;
  const repetidasDetalle = [];
  filasDelExcel.forEach((fila) => {
    const clasificada = clasificarFilaDelExcel_(fila);
    if (clasificada.ignorada) {
      ignoradas += 1;
      return;
    }
    if (clasificada.incidencia) {
      incidencias.push(clasificada.incidencia);
      return;
    }
    const previa = porDni[clasificada.dni];
    if (!previa) {
      porDni[clasificada.dni] = { iban: clasificada.iban, filas: [fila.fila], conflicto: false };
      return;
    }
    previa.filas.push(fila.fila);
    if (previa.iban === clasificada.iban) {
      repetidas += 1;
      repetidasDetalle.push({ dni: clasificada.dni, fila: fila.fila, filaOriginal: previa.filas[0] });
    } else {
      previa.conflicto = true;
    }
  });

  const activas = personas.filter((p) => p.activa);
  activas
    .filter((p) => !esDniValido_(normalizarDni_(p.dni)))
    .forEach((p) => {
      incidencias.push(
        incidencia_(INCIDENCIA_DNI_INVALIDO, `El DNI del maestro (${p.empresa}) no es válido: no se puede cruzar.`, {
          dni: normalizarDni_(p.dni),
          idPersonal: p.idPersonal,
        }),
      );
    });
  const activasPorDni = agruparPor_(
    activas.filter((p) => esDniValido_(normalizarDni_(p.dni))),
    (p) => normalizarDni_(p.dni),
  );

  const yaRegistrada = {};
  registradas.forEach((id) => {
    yaRegistrada[id] = true;
  });
  const cuentas = [];
  const yaIncluida = {};
  let yaRegistradas = 0;
  Object.keys(porDni).forEach((dni) => {
    const entrada = porDni[dni];
    if (entrada.conflicto) {
      entrada.filas.forEach((fila) => {
        incidencias.push(
          incidencia_(
            INCIDENCIA_CUENTAS_DISTINTAS,
            `Este DNI aparece con cuentas distintas en las filas ${entrada.filas.join(', ')}: no se carga ninguna hasta resolverlo.`,
            { fila, dni },
          ),
        );
      });
      return;
    }
    const delDni = activasPorDni[dni] || [];
    if (delDni.length === 0) {
      incidencias.push(
        incidencia_(
          INCIDENCIA_SIN_PERSONA_ACTIVA,
          'Ninguna persona ACTIVA del maestro tiene este DNI (baja, DNI distinto o error).',
          { fila: entrada.filas[0], dni },
        ),
      );
      return;
    }
    delDni.forEach((persona) => {
      // Un id repetido en el maestro es UNA persona: se carga una sola vez.
      if (yaIncluida[persona.idPersonal]) return;
      yaIncluida[persona.idPersonal] = true;
      if (yaRegistrada[persona.idPersonal]) {
        yaRegistradas += 1;
        return;
      }
      cuentas.push({ idPersonal: persona.idPersonal, dni, iban: entrada.iban, fila: entrada.filas[0] });
    });
  });

  Object.keys(activasPorDni)
    .filter((dni) => !porDni[dni])
    .forEach((dni) => {
      activasPorDni[dni].forEach((persona) => {
        incidencias.push(
          incidencia_(
            INCIDENCIA_SIN_CUENTA_EN_EXCEL,
            `Persona activa del maestro (${persona.empresa}) sin cuenta utilizable en el Excel: no está, o su fila tiene una incidencia.`,
            { dni, idPersonal: persona.idPersonal },
          ),
        );
      });
    });

  const incidenciasPorTipo = {};
  incidencias.forEach((i) => {
    incidenciasPorTipo[i.tipo] = (incidenciasPorTipo[i.tipo] || 0) + 1;
  });
  return {
    cuentas,
    incidencias,
    repetidasDetalle,
    resumen: {
      filasLeidas: filasDelExcel.length,
      ignoradas,
      repetidas,
      cuentasACargar: cuentas.length,
      yaRegistradas,
      idsRepetidosEnMaestro: idsRepetidos_(personas).length,
      incidenciasPorTipo,
    },
  };
}
