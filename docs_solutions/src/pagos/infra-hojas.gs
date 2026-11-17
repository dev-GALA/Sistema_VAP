// Adaptador del libro VAP_Pagos. Las columnas se localizan por el NOMBRE de su cabecera, no por posición.
// Lecturas y escrituras EN BLOQUE (un solo setValues), nunca fila a fila: es lo que más tiempo consume (RNF-22).

function libroPagos_() {
  return SpreadsheetApp.openById(propiedad_(PROPIEDAD_ID_LIBRO_PAGOS));
}

function esFecha_(valor) {
  return Object.prototype.toString.call(valor) === '[object Date]';
}

/** Google convierte «2026-11-17 12:30» en fecha al escribirla: se devuelve siempre como texto. */
function textoDeCelda_(valor) {
  if (esFecha_(valor)) return Utilities.formatDate(valor, Session.getScriptTimeZone(), FORMATO_FECHA_HORA);
  return String(valor === null || valor === undefined ? '' : valor).trim();
}

function hojaExistente_(libro, nombre) {
  const hoja = libro.getSheetByName(nombre);
  if (!hoja) throw errorDeConfiguracion_(`Falta la hoja «${nombre}» en VAP_Pagos.`);
  return hoja;
}

function indicesDeCabecera_(hoja, columnas) {
  const cabecera = hoja
    .getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1))
    .getValues()[0]
    .map((c) => textoDeCelda_(c).toLowerCase());
  const indices = {};
  const faltan = [];
  Object.keys(columnas).forEach((clave) => {
    const posicion = cabecera.indexOf(columnas[clave]);
    if (posicion === -1) faltan.push(columnas[clave]);
    else indices[clave] = posicion;
  });
  if (faltan.length > 0)
    throw errorDeConfiguracion_(`En la hoja «${hoja.getName()}» faltan las columnas: ${faltan.join(', ')}.`);
  return { indices, anchura: cabecera.length };
}

/** La hoja entera como lista de objetos { clave: texto }, con su número de fila para poder actualizarla. */
function leerTabla_(hoja, columnas) {
  const { indices } = indicesDeCabecera_(hoja, columnas);
  const valores = hoja.getDataRange().getValues();
  const filas = [];
  for (let i = 1; i < valores.length; i++) {
    if (!valores[i].some((c) => textoDeCelda_(c) !== '')) continue;
    const objeto = { _fila: i + 1 };
    Object.keys(indices).forEach((clave) => {
      objeto[clave] = textoDeCelda_(valores[i][indices[clave]]);
    });
    filas.push(objeto);
  }
  return filas;
}

/** Los códigos como «0123» o una huella tipo «1e5…» no deben convertirse en número: la columna va como texto. */
function ponerColumnaComoTexto_(hoja, numeroColumna) {
  hoja.getRange(1, numeroColumna, Math.max(hoja.getMaxRows(), 1), 1).setNumberFormat('@');
}

function anadirFila_(hoja, columnas, fila) {
  const { indices, anchura } = indicesDeCabecera_(hoja, columnas);
  const valores = [];
  for (let i = 0; i < anchura; i++) valores.push('');
  Object.keys(indices).forEach((clave) => {
    valores[indices[clave]] = fila[clave] === undefined ? '' : fila[clave];
  });
  hoja.appendRow(valores);
}

// ---- huellas -------------------------------------------------------------------------------------------------

function leerHuellas_() {
  const hoja = hojaExistente_(libroPagos_(), HOJA_HUELLAS);
  return leerTabla_(hoja, COLUMNAS_HUELLAS).map((f) => ({
    idPersonal: f.idPersonal,
    huella: f.huella,
    ultimos4: f.ultimos4.padStart(4, '0'),
    actualizadoEn: f.actualizadoEn,
  }));
}

/** Inserta o sustituye la huella de una persona (cambio de cuenta: la antigua deja de valer). */
function guardarHuella_(fila) {
  const hoja = hojaExistente_(libroPagos_(), HOJA_HUELLAS);
  const { indices } = indicesDeCabecera_(hoja, COLUMNAS_HUELLAS);
  ['huella', 'ultimos4', 'actualizadoEn'].forEach((c) => {
    ponerColumnaComoTexto_(hoja, indices[c] + 1);
  });
  const existente = leerTabla_(hoja, COLUMNAS_HUELLAS).filter((f) => f.idPersonal === fila.idPersonal)[0];
  if (!existente) {
    anadirFila_(hoja, COLUMNAS_HUELLAS, fila);
    return;
  }
  Object.keys(COLUMNAS_HUELLAS).forEach((clave) => {
    if (clave !== 'idPersonal') hoja.getRange(existente._fila, indices[clave] + 1).setValue(fila[clave]);
  });
}

// ---- informe mensual -----------------------------------------------------------------------------------------

function hojaDeInforme_(libro, periodo, crear) {
  const nombre = nombreHojaInforme_(periodo);
  let hoja = libro.getSheetByName(nombre);
  if (!hoja && crear) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(COLUMNAS_INFORME);
    ['huella', 'ultimos4', 'importe_banco', 'importe_esperado', 'referencia', 'resuelto_en'].forEach((c) => {
      ponerColumnaComoTexto_(hoja, COLUMNAS_INFORME.indexOf(c) + 1);
    });
  }
  return hoja;
}

function leerInforme_(periodo) {
  const hoja = hojaDeInforme_(libroPagos_(), periodo, false);
  if (!hoja) return [];
  const valores = hoja.getDataRange().getValues();
  return valores
    .slice(1)
    .filter((f) => f.some((c) => textoDeCelda_(c) !== ''))
    .map((f) => valoresAFilaDeInforme_(f.map(textoDeCelda_)));
}

/** Las filas de todos los informes mensuales (hojas `informe_AAAA-MM`). */
function leerTodosLosInformes_() {
  return libroPagos_()
    .getSheets()
    .filter((hoja) => /^informe_\d{4}-\d{2}$/.test(hoja.getName()))
    .reduce((todas, hoja) => todas.concat(leerInforme_(hoja.getName().slice('informe_'.length))), []);
}

function escribirInforme_(hoja, filas) {
  const anterior = Math.max(hoja.getLastRow() - 1, 0);
  if (anterior > 0) hoja.getRange(2, 1, anterior, COLUMNAS_INFORME.length).clearContent();
  if (filas.length > 0)
    hoja.getRange(2, 1, filas.length, COLUMNAS_INFORME.length).setValues(filas.map(filaDeInformeAValores_));
}

/** Sustituye en el informe del mes las filas de esa empresa y fuente. Se niega si alguna ya está subsanada. */
function reemplazarInforme_(periodo, empresa, fuente, filasNuevas) {
  const hoja = hojaDeInforme_(libroPagos_(), periodo, true);
  const actuales = leerInforme_(periodo);
  const propias = (f) => f.empresa === empresa && f.fuente === fuente;
  if (actuales.some((f) => propias(f) && f.resolucion !== '')) {
    throw new Error(
      'Ya hay filas subsanadas de esa empresa en este periodo: no se sustituye el informe para no perder la subsanación.',
    );
  }
  escribirInforme_(hoja, actuales.filter((f) => !propias(f)).concat(filasNuevas));
}

function actualizarFilaInforme_(periodo, fila) {
  const hoja = hojaDeInforme_(libroPagos_(), periodo, false);
  const actuales = leerInforme_(periodo);
  const posicion = actuales.map((f) => f.filaId).indexOf(fila.filaId);
  if (posicion === -1) throw new Error('No existe esa fila del informe.');
  actuales[posicion] = fila;
  escribirInforme_(hoja, actuales);
}

// ---- historiales ---------------------------------------------------------------------------------------------

function anadirSubsanacion_(registro) {
  anadirFila_(hojaExistente_(libroPagos_(), HOJA_SUBSANACIONES), COLUMNAS_SUBSANACIONES, registro);
}

function anadirFusion_(registro) {
  anadirFila_(hojaExistente_(libroPagos_(), HOJA_FUSIONES), COLUMNAS_FUSIONES, registro);
}
