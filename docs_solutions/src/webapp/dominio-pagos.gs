// Reglas puras de las pantallas de Pagos de la webapp: identificadores, importes esperados, nombres de las filas y
// carga inicial de cuentas (ADR-0019). HU-48 · HU-49 · HU-50 · RF-89 · RF-96 · RF-99. Sin servicios de Google.
//
// Esta capa NUNCA calcula una huella ni conoce la clave: eso vive solo en el servicio VAP_Pagos (RNF-21).

const SEPARADOR_ID_PERSONAL = '_';
const MAXIMO_CUENTAS_POR_LOTE = 200;

// Claves de la hoja `config` de la fuente de importes esperados (Vinculación). SUPUESTAS: DUDA-0006 sigue abierta.
const CLAVE_CONFIG_VINCULACION_LIBRO = 'vinculacion_libro_id';
const CLAVE_CONFIG_VINCULACION_HOJA = 'vinculacion_hoja';
const CLAVE_CONFIG_VINCULACION_COL_DNI = 'vinculacion_col_dni';
const CLAVE_CONFIG_VINCULACION_COL_IMPORTE = 'vinculacion_col_importe';
const CLAVE_CONFIG_VINCULACION_FUENTE = 'vinculacion_fuente';
const FUENTE_POR_DEFECTO = 'Vinculación';
const TOLERANCIA_CRUCE_CENTIMOS = 0;
/** Identificador de una persona en VAP_Pagos: empresa y nº de SAGE (SUPUESTO: se confirma con el maestro real). */
function idPersonalDe_(empresa, idTrabajador) {
  return `${textoDe_(empresa)}${SEPARADOR_ID_PERSONAL}${textoDe_(idTrabajador)}`;
}

function nombreCompleto_(persona) {
  return [textoDe_(persona.nombre), textoDe_(persona.apellidos)].filter((t) => t !== '').join(' ');
}

/**
 * De las filas de la pestaña de una empresa del maestro, las personas con identificador:
 * [{ idPersonal, idTrabajador, empresa, nombre, dni, activa }]. Activa = sin fecha de baja.
 */
function personasDeEmpresa_(empresa, filasMaestro) {
  return filasMaestro
    .filter((f) => textoDe_(f.idTrabajador) !== '')
    .map((f) => ({
      idPersonal: idPersonalDe_(empresa, f.idTrabajador),
      idTrabajador: textoDe_(f.idTrabajador),
      empresa,
      nombre: nombreCompleto_(f),
      dni: normalizarDni_(f.dni),
      activa: textoDe_(f.fechaBaja) === '',
    }));
}

/** La fuente de importes esperados está configurada si `config` trae el libro, la hoja y las dos columnas. */
function fuenteImportesConfigurada_(config) {
  return [
    CLAVE_CONFIG_VINCULACION_LIBRO,
    CLAVE_CONFIG_VINCULACION_HOJA,
    CLAVE_CONFIG_VINCULACION_COL_DNI,
    CLAVE_CONFIG_VINCULACION_COL_IMPORTE,
  ].every((clave) => textoDe_(config[clave]) !== '');
}

/** El nombre de la hoja de la fuente puede llevar {empresa} y {periodo}. */
function hojaDeFuente_(plantilla, empresa, periodo) {
  return textoDe_(plantilla).split('{empresa}').join(empresa).split('{periodo}').join(periodo);
}

/**
 * Lo que debía cobrar cada persona activa de la empresa según la fuente de importes (Vinculación): cruce por DNI.
 * Devuelve { esperados: [{ idPersonal, importe }], dniSinPersona, dniRepetidos } para poder avisar de lo que no casa.
 */
function esperadosDeEmpresa_(personasActivas, filasFuente) {
  const porDni = {};
  personasActivas.forEach((p) => {
    if (p.dni === '') return;
    if (!porDni[p.dni]) porDni[p.dni] = [];
    porDni[p.dni].push(p);
  });
  const esperados = [];
  const vistos = {};
  let dniSinPersona = 0;
  let dniRepetidos = 0;
  filasFuente.forEach((fila) => {
    const dni = normalizarDni_(fila.dni);
    const centimos = aCentimos_(fila.importe);
    if (dni === '' || !Number.isInteger(centimos) || centimos <= 0) return;
    const personas = porDni[dni] || [];
    if (personas.length !== 1) {
      dniSinPersona += 1;
      return;
    }
    if (vistos[dni]) {
      dniRepetidos += 1;
      return;
    }
    vistos[dni] = true;
    esperados.push({ idPersonal: personas[0].idPersonal, importe: formatearCentimos_(centimos) });
  });
  return { esperados, dniSinPersona, dniRepetidos };
}

/** Añade nombre y DNI a las filas del informe leyéndolos de las personas: NO se guardan en VAP_Pagos (RF-96). */
function enriquecerFilasDeInforme_(filas, personasPorId) {
  return filas.map((fila) => {
    const persona = fila.idPersonal ? personasPorId[fila.idPersonal] : null;
    const nombre = persona ? persona.nombre : fila.nombreBanco;
    const resultado = Object.assign({}, fila, { nombre, dni: persona ? persona.dni : '' });
    delete resultado.nombreBanco;
    delete resultado.huella;
    return resultado;
  });
}

function indexarPersonasPorId_(personas) {
  const indice = {};
  personas.forEach((p) => {
    indice[p.idPersonal] = p;
  });
  return indice;
}

/** Une el Maestro de Pagos del servicio con los nombres y DNI de las personas. Quien no consta se muestra sin nombre. */
function maestroDePagosEnriquecido_(registros, personasPorId) {
  return registros.map((r) => {
    const persona = personasPorId[r.idPersonal];
    return {
      idPersonal: r.idPersonal,
      nombre: persona ? persona.nombre : '',
      dni: persona ? persona.dni : '',
      empresa: persona ? persona.empresa : '',
      ultimos4: r.ultimos4,
      actualizadoEn: r.actualizadoEn,
    };
  });
}

/**
 * Carga inicial: decide qué hacer con cada fila { empresa, nombre, dni, cuenta } SIN guardar nada.
 * `personasPorEmpresa` es { nombreEmpresa: [personas activas] } y `yaRegistradas` la lista de idPersonal con cuenta.
 * Devuelve [{ indice, estado, idPersonal, empresa, ultimos4 }]. La cuenta no sale de aquí.
 */
function proponerCargaInicial_(filas, personasPorEmpresa, yaRegistradas) {
  const registradas = {};
  yaRegistradas.forEach((id) => {
    registradas[id] = true;
  });
  const vistas = {};
  return filas.map((fila, indice) => {
    const empresa =
      Object.keys(personasPorEmpresa).filter((e) => e.toLowerCase() === textoDe_(fila.empresa).toLowerCase())[0] || '';
    const dni = normalizarDni_(fila.dni);
    const iban = normalizarIban_(fila.cuenta);
    const base = { indice, idPersonal: '', empresa, ultimos4: '' };
    if (!esIbanValido_(iban)) return Object.assign(base, { estado: 'cuenta-invalida' });
    base.ultimos4 = iban.slice(-4);
    const clave = `${empresa}|${dni}`;
    if (vistas[clave]) return Object.assign(base, { estado: 'repetida' });
    vistas[clave] = true;
    const candidatas = empresa === '' || dni === '' ? [] : personasPorEmpresa[empresa].filter((p) => p.dni === dni);
    if (candidatas.length === 0) return Object.assign(base, { estado: 'sin-persona' });
    if (candidatas.length > 1) return Object.assign(base, { estado: 'ambigua' });
    base.idPersonal = candidatas[0].idPersonal;
    return Object.assign(base, { estado: registradas[base.idPersonal] ? 'ya-registrada' : 'lista' });
  });
}
