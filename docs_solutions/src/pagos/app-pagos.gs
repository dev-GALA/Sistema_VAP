// Casos de uso del servicio VAP_Pagos (ADR-0019). Las dependencias llegan inyectadas: este archivo no conoce
// ningún servicio de Google.
//
// dependencias = { clave(), calcularHmacHex(texto, clave), ahora(), nuevoId(), conBloqueo(accion),
//                  leerHuellas(), guardarHuella(fila), leerInforme(periodo), reemplazarInforme(periodo, empresa, fuente, filas),
//                  actualizarFilaInforme(periodo, fila), anadirSubsanacion(registro), anadirFusion(registro),
//                  leerTodosLosInformes() }
//
// LA CUENTA SOLO EXISTE EN MEMORIA mientras se calcula su huella (RNF-19): ninguna función de aquí la escribe ni la
// devuelve, y los mensajes de error no la contienen.

const MAXIMO_CUENTAS_POR_LLAMADA = 200;
const MAXIMO_PAGOS_POR_LLAMADA = 500;
const TOLERANCIA_POR_DEFECTO_CENTIMOS = 0;

function exigirTexto_(valor, etiqueta) {
  const texto = textoDe_(valor);
  if (texto === '') throw new Error(`Falta ${etiqueta}.`);
  return texto;
}

function exigirLista_(valor, etiqueta, maximo) {
  if (!Array.isArray(valor) || valor.length === 0) throw new Error(`Falta ${etiqueta}.`);
  if (valor.length > maximo)
    throw new Error(`Hay demasiados elementos en ${etiqueta}: el máximo por llamada es ${maximo}.`);
  return valor;
}

function exigirPeriodo_(periodo) {
  if (!periodoValido_(periodo)) throw new Error('El periodo debe tener la forma AAAA-MM.');
  return textoDe_(periodo);
}

function huellaDeCuentaCon_(dependencias, iban) {
  return huellaDeCuenta_(iban, dependencias.clave(), dependencias.calcularHmacHex);
}

/** Guarda (o sustituye) la huella de la cuenta de una persona. Devuelve solo los últimos 4 dígitos. */
function guardarCuenta_(dependencias, datos) {
  const idPersonal = exigirTexto_(datos.idPersonal, 'el identificador de la persona');
  const iban = normalizarIban_(datos.iban);
  const huella = huellaDeCuentaCon_(dependencias, iban);
  return dependencias.conBloqueo(() => {
    dependencias.guardarHuella({
      idPersonal,
      huella,
      ultimos4: ultimosDigitos_(iban),
      actualizadoEn: dependencias.ahora(),
    });
    return { idPersonal, ultimos4: ultimosDigitos_(iban) };
  });
}

/** Guarda varias cuentas (carga inicial): cada una por separado, de modo que una mala no impide las demás. */
function guardarCuentas_(dependencias, datos) {
  const cuentas = exigirLista_(datos.cuentas, 'las cuentas', MAXIMO_CUENTAS_POR_LLAMADA);
  return cuentas.map((cuenta, indice) => {
    try {
      const guardada = guardarCuenta_(dependencias, cuenta || {});
      return { indice, estado: 'guardada', idPersonal: guardada.idPersonal, ultimos4: guardada.ultimos4 };
    } catch (error) {
      return { indice, estado: 'error', detalle: error.message };
    }
  });
}

function resumenDeFilas_(filas) {
  return {
    total: filas.length,
    coincidentes: filas.filter((f) => f.estado === ESTADO_COINCIDENTE).length,
    incorrectos: filas.filter((f) => f.estado === ESTADO_INCORRECTO).length,
  };
}

/**
 * Cruza los pagos de UNA empresa y guarda sus filas en el informe del mes (sustituye las de esa empresa y fuente).
 * Se niega a sustituir si alguna ya está subsanada: la subsanación no se pierde en silencio (RF-93).
 */
function cruzar_(dependencias, datos) {
  const periodo = exigirPeriodo_(datos.periodo);
  const empresa = exigirTexto_(datos.empresa, 'la empresa');
  const fuente = exigirTexto_(datos.fuente, 'la fuente de los importes esperados');
  const pagos = exigirLista_(datos.pagos, 'los pagos', MAXIMO_PAGOS_POR_LLAMADA);
  const esperados = Array.isArray(datos.esperados) ? datos.esperados : [];
  const tolerancia = Number.isInteger(datos.toleranciaCentimos)
    ? datos.toleranciaCentimos
    : TOLERANCIA_POR_DEFECTO_CENTIMOS;

  const contexto = {
    periodo,
    empresa,
    fuente,
    toleranciaCentimos: tolerancia,
    huellaDe: (iban) => huellaDeCuentaCon_(dependencias, iban),
  };
  const filas = cruzarPagos_(pagos, esperados, dependencias.leerHuellas(), contexto);
  filas.forEach((fila) => {
    fila.filaId = dependencias.nuevoId();
  });
  dependencias.conBloqueo(() => dependencias.reemplazarInforme(periodo, empresa, fuente, filas));
  return Object.assign({ periodo, empresa }, resumenDeFilas_(filas));
}

/** Sin la huella: quien consulta el informe no la necesita (mínimo acceso). */
function sinHuella_(fila) {
  return Object.assign({}, fila, { huella: '' });
}

function informe_(dependencias, datos) {
  const periodo = exigirPeriodo_(datos.periodo);
  const empresa = textoDe_(datos.empresa);
  return dependencias
    .leerInforme(periodo)
    .filter((f) => empresa === '' || f.empresa === empresa)
    .map(sinHuella_);
}

function subsanar_(dependencias, datos) {
  const periodo = exigirPeriodo_(datos.periodo);
  const filaId = exigirTexto_(datos.filaId, 'la fila');
  const subsanacion = {
    resolucion: textoDe_(datos.resolucion),
    asignadaA: textoDe_(datos.asignadaA),
    motivo: textoDe_(datos.motivo),
  };
  const usuario = exigirTexto_(datos.usuario, 'quién subsana');
  return dependencias.conBloqueo(() => {
    const fila = dependencias.leerInforme(periodo).filter((f) => f.filaId === filaId)[0];
    const errores = validarSubsanacion_(fila, subsanacion);
    if (errores.length > 0) throw new Error(errores.join(' '));
    const momento = dependencias.ahora();
    // El historial se anota ANTES: si falla la actualización, queda constancia de lo intentado.
    dependencias.anadirSubsanacion({
      periodo,
      filaId,
      momento,
      usuario,
      resolucion: subsanacion.resolucion,
      asignadaA: subsanacion.asignadaA,
      motivo: subsanacion.motivo,
    });
    dependencias.actualizarFilaInforme(
      periodo,
      Object.assign({}, fila, {
        resolucion: subsanacion.resolucion,
        asignadaA: subsanacion.asignadaA,
        resueltoPor: usuario,
        resueltoEn: momento,
        motivoResolucion: subsanacion.motivo,
      }),
    );
    return { filaId, resolucion: subsanacion.resolucion };
  });
}

/** Paso obligado al terminar todas las empresas: comprueba que no falta ninguna y deja constancia. */
function fusionar_(dependencias, datos) {
  const periodo = exigirPeriodo_(datos.periodo);
  const empresas = exigirLista_(datos.empresas, 'las empresas esperadas', 100);
  const usuario = exigirTexto_(datos.usuario, 'quién fusiona');
  const resumen = resumenDeInforme_(dependencias.leerInforme(periodo), empresas);
  if (!resumen.puedeFusionarse) {
    throw new Error(
      `No se puede fusionar: faltan los informes de ${resumen.faltan.join(', ') || 'todas las empresas'}.`,
    );
  }
  dependencias.conBloqueo(() =>
    dependencias.anadirFusion({
      periodo,
      momento: dependencias.ahora(),
      usuario,
      empresas: resumen.empresas.length,
      sinResolver: resumen.sinResolver,
    }),
  );
  return resumen;
}

/** Cuántas filas hay por empresa y qué empresas faltan. La webapp lo usa para saber si se puede fusionar. */
function resumen_(dependencias, datos) {
  const periodo = exigirPeriodo_(datos.periodo);
  const empresas = Array.isArray(datos.empresas) ? datos.empresas : [];
  return resumenDeInforme_(dependencias.leerInforme(periodo), empresas);
}

/** Todo lo que consta de una persona en los informes de todos los meses, ordenado por periodo. Sin huella. */
function historialDePersona_(dependencias, datos) {
  const idPersonal = exigirTexto_(datos.idPersonal, 'el identificador de la persona');
  return dependencias
    .leerTodosLosInformes()
    .filter((f) => f.idPersonal === idPersonal)
    .sort((a, b) => (a.periodo < b.periodo ? -1 : a.periodo > b.periodo ? 1 : 0))
    .map(sinHuella_);
}

/** El Maestro de Pagos del servicio: identificador, últimos 4 dígitos y fecha. La huella no sale. */
function maestroDePagos_(dependencias) {
  return dependencias
    .leerHuellas()
    .map((h) => ({ idPersonal: h.idPersonal, ultimos4: h.ultimos4, actualizadoEn: h.actualizadoEn }));
}

// Acciones que el servicio atiende desde fuera. Ampliar es añadir una entrada aquí (SOLID-O).
const ACCIONES_SERVICIO = {
  guardarCuenta: guardarCuenta_,
  guardarCuentas: guardarCuentas_,
  cruzar: cruzar_,
  informe: informe_,
  subsanar: subsanar_,
  fusionar: fusionar_,
  resumen: resumen_,
  historialPersona: historialDePersona_,
  maestro: (dependencias) => maestroDePagos_(dependencias),
};

/** Atiende una llamada ya autenticada. Devuelve { ok, datos } o { ok: false, error }. */
function atenderLlamada_(dependencias, accion, datos) {
  if (Object.keys(ACCIONES_SERVICIO).indexOf(accion) === -1) return { ok: false, error: 'Acción desconocida.' };
  try {
    return { ok: true, datos: ACCIONES_SERVICIO[accion](dependencias, datos || {}) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
