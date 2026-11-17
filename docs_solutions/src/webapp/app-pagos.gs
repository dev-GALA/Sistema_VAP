// Casos de uso de las pantallas de Pagos (ADR-0019). HU-48 · HU-49 · HU-50 · RF-89 … RF-99.
//
// dependencias = { correoActual(), leerUsuarios(), leerConfiguracion(), ahora(), servicioPagosConfigurado(),
//                  llamarServicioPagos(accion, datos), leerFilasDelMaestro(config, empresas),
//                  leerFuenteDeImportes(config, empresa, periodo), marcarCuentaEnMaestro(config, empresas, persona) }
//
// El cálculo de la huella y la clave viven SOLO en el servicio VAP_Pagos: aquí no existen. La cuenta bancaria pasa
// por memoria hacia el servicio y no se escribe ni se devuelve a la pantalla (RNF-19).

const MENSAJE_SIN_SERVICIO = 'El servicio VAP_Pagos no está configurado todavía.';
const MENSAJE_SIN_FUENTE = 'Falta configurar la fuente de los importes esperados (Vinculación) en la hoja config.';
const MENSAJE_SIN_MAESTRO_PAGOS = 'El maestro de personas no está configurado todavía.';

function empresasConfiguradas_(config) {
  return parsearEmpresas_(config[CLAVE_CONFIG_EMPRESAS]);
}

function exigirEmpresa_(config, empresa) {
  const buscada = textoDe_(empresa).toLowerCase();
  const encontrada = empresasConfiguradas_(config).filter((e) => e.nombre.toLowerCase() === buscada)[0];
  if (!encontrada) throw new Error('La empresa no es una de las configuradas.');
  return encontrada.nombre;
}

function exigirServicioPagos_(dependencias) {
  if (!dependencias.servicioPagosConfigurado()) throw new Error(MENSAJE_SIN_SERVICIO);
}

/** Todas las personas del maestro de las empresas configuradas, con su estado de alta. */
function leerPersonas_(dependencias, config) {
  const empresas = empresasConfiguradas_(config);
  if (!maestroConfigurado_(config, empresas)) throw new Error(MENSAJE_SIN_MAESTRO_PAGOS);
  return dependencias
    .leerFilasDelMaestro(config, empresas)
    .reduce((todas, grupo) => todas.concat(personasDeEmpresa_(grupo.empresa, grupo.filas)), []);
}

function opcionesPagos_(dependencias) {
  exigirAcceso_(dependencias, 'cruzar-pagos');
  const config = dependencias.leerConfiguracion();
  return {
    empresas: empresasConfiguradas_(config).map((e) => e.nombre),
    servicioConfigurado: dependencias.servicioPagosConfigurado(),
    fuenteImportesConfigurada: fuenteImportesConfigurada_(config),
    formatosAceptados: FORMATOS_BANCO,
  };
}

function filasEnriquecidas_(filas, personas) {
  return enriquecerFilasDeInforme_(filas, indexarPersonasPorId_(personas));
}

/**
 * Cruza los ficheros del banco de UNA empresa: una llamada por empresa para no pasar el límite de tiempo (RNF-22).
 * Todos los ficheros se leen enteros o se rechazan. Devuelve el resumen y las filas del informe de esa empresa.
 */
function cruzarPagos_(dependencias, datos) {
  exigirAcceso_(dependencias, 'cruzar-pagos');
  exigirServicioPagos_(dependencias);
  const config = dependencias.leerConfiguracion();
  if (!fuenteImportesConfigurada_(config)) throw new Error(MENSAJE_SIN_FUENTE);
  const empresa = exigirEmpresa_(config, datos.empresa);
  const periodo = textoDe_(datos.periodo);

  const lectura = leerFicherosBanco_(datos.ficheros);
  if (lectura.errores.length > 0) throw new Error(lectura.errores.join(' '));

  const personas = leerPersonas_(dependencias, config).filter((p) => p.empresa === empresa);
  const fuente = textoDe_(config[CLAVE_CONFIG_VINCULACION_FUENTE]) || FUENTE_POR_DEFECTO;
  const importes = esperadosDeEmpresa_(
    personas.filter((p) => p.activa),
    dependencias.leerFuenteDeImportes(config, empresa, periodo),
  );

  const resumen = dependencias.llamarServicioPagos('cruzar', {
    periodo,
    empresa,
    fuente,
    pagos: lectura.pagos,
    esperados: importes.esperados,
    toleranciaCentimos: TOLERANCIA_CRUCE_CENTIMOS,
  });
  const filas = dependencias.llamarServicioPagos('informe', { periodo, empresa });
  const avisos = [];
  if (importes.dniSinPersona > 0)
    avisos.push(
      `${importes.dniSinPersona} filas de la fuente de importes no corresponden a una persona activa única de ${empresa}.`,
    );
  if (importes.dniRepetidos > 0)
    avisos.push(`${importes.dniRepetidos} filas de la fuente repiten un DNI y se han ignorado.`);
  return Object.assign({}, resumen, { avisos, filas: filasEnriquecidas_(filas, personas) });
}

function resumenDelPeriodo_(dependencias, config, periodo) {
  return dependencias.llamarServicioPagos('resumen', {
    periodo,
    empresas: empresasConfiguradas_(config).map((e) => e.nombre),
  });
}

function informePagos_(dependencias, periodo, empresa) {
  exigirAcceso_(dependencias, 'historico-pagos');
  exigirServicioPagos_(dependencias);
  const config = dependencias.leerConfiguracion();
  const filtro = textoDe_(empresa) === '' ? '' : exigirEmpresa_(config, empresa);
  const filas = dependencias.llamarServicioPagos('informe', { periodo, empresa: filtro });
  return {
    periodo,
    filas: filasEnriquecidas_(filas, leerPersonas_(dependencias, config)),
    resumen: resumenDelPeriodo_(dependencias, config, periodo),
  };
}

function subsanarPago_(dependencias, datos) {
  const contexto = exigirAcceso_(dependencias, 'cruzar-pagos');
  exigirServicioPagos_(dependencias);
  return dependencias.llamarServicioPagos('subsanar', {
    periodo: datos.periodo,
    filaId: datos.filaId,
    resolucion: datos.resolucion,
    asignadaA: datos.asignadaA,
    motivo: datos.motivo,
    usuario: contexto.correo,
  });
}

function fusionarInformes_(dependencias, periodo) {
  const contexto = exigirAcceso_(dependencias, 'cruzar-pagos');
  exigirServicioPagos_(dependencias);
  const config = dependencias.leerConfiguracion();
  return dependencias.llamarServicioPagos('fusionar', {
    periodo,
    empresas: empresasConfiguradas_(config).map((e) => e.nombre),
    usuario: contexto.correo,
  });
}

function maestroPagos_(dependencias) {
  exigirAcceso_(dependencias, 'maestro-pagos');
  exigirServicioPagos_(dependencias);
  const personas = leerPersonas_(dependencias, dependencias.leerConfiguracion());
  return maestroDePagosEnriquecido_(dependencias.llamarServicioPagos('maestro', {}), indexarPersonasPorId_(personas));
}

function historialPersonaPagos_(dependencias, idPersonal) {
  exigirAcceso_(dependencias, 'historico-pagos');
  exigirServicioPagos_(dependencias);
  const personas = leerPersonas_(dependencias, dependencias.leerConfiguracion());
  return filasEnriquecidas_(dependencias.llamarServicioPagos('historialPersona', { idPersonal }), personas);
}

// ---- carga inicial de cuentas (RF-89) --------------------------------------------------------------------------

function exigirLote_(filas) {
  if (!Array.isArray(filas) || filas.length === 0) throw new Error('No hay filas.');
  if (filas.length > MAXIMO_CUENTAS_POR_LOTE)
    throw new Error(`Hay demasiadas filas: el máximo por envío es ${MAXIMO_CUENTAS_POR_LOTE}.`);
}

function proponerLote_(dependencias, filas) {
  const config = dependencias.leerConfiguracion();
  const personasPorEmpresa = {};
  empresasConfiguradas_(config).forEach((e) => {
    personasPorEmpresa[e.nombre] = [];
  });
  leerPersonas_(dependencias, config)
    .filter((p) => p.activa)
    .forEach((p) => {
      personasPorEmpresa[p.empresa].push(p);
    });
  const registradas = dependencias.llamarServicioPagos('maestro', {}).map((m) => m.idPersonal);
  return { config, personasPorEmpresa, propuestas: proponerCargaInicial_(filas, personasPorEmpresa, registradas) };
}

/** Propone qué hacer con cada fila SIN guardar nada. La cuenta no vuelve a la pantalla. */
function validarCargaInicial_(dependencias, filas) {
  exigirAcceso_(dependencias, 'carga-inicial');
  exigirServicioPagos_(dependencias);
  exigirLote_(filas);
  return proponerLote_(dependencias, filas).propuestas;
}

/** Guarda solo las filas que siguen en estado «lista»: lo que la pantalla confirma se vuelve a comprobar aquí. */
function confirmarCargaInicial_(dependencias, filas) {
  exigirAcceso_(dependencias, 'carga-inicial');
  exigirServicioPagos_(dependencias);
  exigirLote_(filas);
  const { config, personasPorEmpresa, propuestas } = proponerLote_(dependencias, filas);
  const empresas = empresasConfiguradas_(config);
  const resultados = propuestas.map((p) => ({
    indice: p.indice,
    estado: 'error',
    detalle: `No procede: ${p.estado}.`,
  }));
  const listas = propuestas.filter((p) => p.estado === 'lista');
  if (listas.length === 0) return resultados;

  const guardadas = dependencias.llamarServicioPagos('guardarCuentas', {
    cuentas: listas.map((p) => ({ idPersonal: p.idPersonal, iban: filas[p.indice].cuenta })),
  });
  guardadas.forEach((guardada, posicion) => {
    const propuesta = listas[posicion];
    if (guardada.estado !== 'guardada') {
      resultados[propuesta.indice] = { indice: propuesta.indice, estado: 'error', detalle: guardada.detalle };
      return;
    }
    const persona = personasPorEmpresa[propuesta.empresa].filter((p) => p.idPersonal === propuesta.idPersonal)[0];
    try {
      dependencias.marcarCuentaEnMaestro(config, empresas, persona);
      resultados[propuesta.indice] = { indice: propuesta.indice, estado: 'guardada', detalle: '' };
    } catch (error) {
      resultados[propuesta.indice] = {
        indice: propuesta.indice,
        estado: 'error',
        detalle: `La cuenta se guardó en VAP_Pagos, pero no se pudo marcar en el maestro: ${error.message}`,
      };
    }
  });
  return resultados;
}
