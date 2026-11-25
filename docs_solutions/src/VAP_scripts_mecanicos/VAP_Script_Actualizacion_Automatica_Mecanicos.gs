/****************************************************
 * VAP - SINCRONIZAR MECÁNICOS EN FORMULARIO REAL
 *
 * Gemelo de los scripts de Secretarias y Profesores (se mantienen separados a propósito).
 * Lee la pestaña VAP_Staff y precarga en el formulario a las personas de alta cuyo
 * Tipo sea MECÁNICO (sin distinguir mayúsculas ni tildes) y que tengan los datos
 * necesarios: id_trabajador, DNI válido y nombre en formato "APELLIDOS, NOMBRE".
 * Al responder el formulario guarda en la respuesta el id (ID_Mecanico) y el DNI
 * (DNI_Mecanico): el DNI es lo único unívoco por persona, cambie o no de empresa.
 ****************************************************/

const FORM_ID = "1iJoFCf6CcFyFnl5Qv5zHCcOYb-JUISlKgvi6s1G9D7E";
const SPREADSHEET_ID = "1HQMxubwPv-vrslsXj5DvsB0gJ9OyewVNDmbPg1hjmHk";
const SHEET_STAFF = "VAP_Staff";
const QUESTION_TITLE = "Seleccione el Mecánico";
const RESPONSE_ID_HEADER = "ID_Mecanico";
const RESPONSE_DNI_HEADER = "DNI_Mecanico";

const COL_ID = "id_trabajador";
const COL_NOMBRE = "Nombre";
const COL_DNI = "DNI";
const COL_TIPO = "Tipo";
const COL_ALTA = "Alta";
const TIPO_MECANICO = "MECANICO";

/****************************************************
 * 1) SINCRONIZACIÓN PRINCIPAL DEL FORMULARIO
 ****************************************************/
function actualizarPreguntaMecanicos() {
  try {
    const candidatos = leerMecanicosDeStaff_();
    anotarExcluidos_(candidatos);
    const opciones = nombresUnicosOrdenados_(candidatos.filter(p => !p.motivo));

    if (opciones.length === 0) {
      throw new Error("No se han encontrado mecánicos activos válidos");
    }

    const form = FormApp.openById(FORM_ID);
    const items = form.getItems(FormApp.ItemType.LIST);
    const item = items.find(i => esMismoTitulo_(i.getTitle(), QUESTION_TITLE));

    if (!item) {
      throw new Error(`No se encuentra la pregunta tipo lista con título "${QUESTION_TITLE}"`);
    }

    item.asListItem().setChoiceValues(opciones);

    Logger.log(`Formulario actualizado correctamente. Opciones cargadas: ${opciones.length}`);
  } catch (error) {
    Logger.log("ERROR actualizarPreguntaMecanicos: " + error.message);
    throw error;
  }
}

/****************************************************
 * 2) DISPARADOR POR EDICIÓN
 ****************************************************/
function onSpreadsheetEditTrigger(e) {
  try {
    if (!e || !e.range) return;

    const sheet = e.range.getSheet();
    if (!sheet || sheet.getName() !== SHEET_STAFF) return;

    if (!puedeEjecutarSincronizacion_()) return;

    Logger.log("Cambio detectado en VAP_Staff (edición). Sincronizando formulario...");
    actualizarPreguntaMecanicos();

  } catch (error) {
    Logger.log("ERROR onSpreadsheetEditTrigger: " + error.message);
    throw error;
  }
}

/****************************************************
 * 3) DISPARADOR POR CAMBIOS ESTRUCTURALES
 ****************************************************/
function onSpreadsheetChangeTrigger(e) {
  try {
    if (!e) return;

    const tiposRelevantes = ["INSERT_ROW", "REMOVE_ROW", "INSERT_GRID", "REMOVE_GRID"];
    if (!tiposRelevantes.includes(e.changeType)) return;

    if (!puedeEjecutarSincronizacion_()) return;

    Logger.log(`Cambio estructural detectado (${e.changeType}). Sincronizando formulario...`);
    actualizarPreguntaMecanicos();

  } catch (error) {
    Logger.log("ERROR onSpreadsheetChangeTrigger: " + error.message);
    throw error;
  }
}

/****************************************************
 * 4) AL ENVIAR EL FORMULARIO
 * Crea / rellena ID_Mecanico y DNI_Mecanico
 ****************************************************/
function onFormSubmit(e) {
  try {
    Logger.log("1. Inicio onFormSubmit");

    const mecanicoNombre = obtenerRespuestaPorTitulo_(e, QUESTION_TITLE);
    if (!mecanicoNombre) {
      throw new Error(`No se encontró respuesta para la pregunta "${QUESTION_TITLE}"`);
    }
    Logger.log(`2. Mecánico recibido: ${mecanicoNombre}`);

    const mecanico = buscarMecanicoPorNombre_(mecanicoNombre);
    if (!mecanico) {
      throw new Error(`No se encontró el mecánico "${mecanicoNombre}"`);
    }
    Logger.log(`3. Mecánico localizado: ${mecanico.id}`);

    const responseSheet = obtenerHojaRespuestasDelFormulario_();
    Logger.log(`4. Hoja de respuestas encontrada: ${responseSheet.getName()}`);

    const targetRow = localizarFilaRespuesta_(responseSheet, e.response);
    Logger.log(`5. Fila objetivo: ${targetRow}`);

    escribirEnColumna_(responseSheet, targetRow, RESPONSE_ID_HEADER, mecanico.id);
    escribirEnColumna_(responseSheet, targetRow, RESPONSE_DNI_HEADER, mecanico.dni);
    Logger.log(`6. ${RESPONSE_ID_HEADER} y ${RESPONSE_DNI_HEADER} escritos en la fila ${targetRow}`);

  } catch (error) {
    Logger.log("ERROR onFormSubmit: " + error.message);
    throw error;
  }
}

/****************************************************
 * 5) LEER MECÁNICOS DE VAP_STAFF
 ****************************************************/
function normalizarDni_(texto) {
  return String(texto || "").toUpperCase().replace(/[\s-]/g, "");
}

/** Solo la forma: DNI (8 cifras y letra) o NIE (X, Y o Z, 7 cifras y letra). */
function esDniValido_(dni) {
  return /^(\d{8}|[XYZ]\d{7})[A-Z]$/.test(dni);
}

/** «APELLIDOS, NOMBRE»: una sola coma, con texto a los dos lados. */
function tieneFormatoApellidosNombre_(nombre) {
  return /^[^,]+,[^,]+$/.test(nombre);
}

/** Por qué una persona de alta y de tipo mecánico NO puede aparecer en la lista ("" si puede). */
function motivoDeExclusion_(p) {
  if (!p.id) return "sin id_trabajador";
  if (!p.nombre) return "sin nombre";
  if (!tieneFormatoApellidosNombre_(p.nombre)) return 'nombre sin el formato "APELLIDOS, NOMBRE"';
  if (!p.dni) return "sin DNI";
  if (!esDniValido_(p.dni)) return "DNI con forma no válida";
  return "";
}

/** Las personas de alta y tipo mecánico, cada una con su `motivo` de exclusión (vacío si es válida). */
function leerMecanicosDeStaff_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_STAFF);

  if (!sheet) {
    throw new Error(`No existe la hoja "${SHEET_STAFF}"`);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 2) return [];

  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0];

  const colId = headers.indexOf(COL_ID);
  const colNombre = headers.indexOf(COL_NOMBRE);
  const colDni = headers.indexOf(COL_DNI);
  const colTipo = headers.indexOf(COL_TIPO);
  const colAlta = headers.indexOf(COL_ALTA);

  if (colId === -1) throw new Error(`No se encuentra la columna "${COL_ID}"`);
  if (colNombre === -1) throw new Error(`No se encuentra la columna "${COL_NOMBRE}"`);
  if (colDni === -1) throw new Error(`No se encuentra la columna "${COL_DNI}"`);
  if (colTipo === -1) throw new Error(`No se encuentra la columna "${COL_TIPO}"`);
  if (colAlta === -1) throw new Error(`No se encuentra la columna "${COL_ALTA}"`);

  return data
    .slice(1)
    .map((row, i) => ({
      fila: i + 2,
      id: String(row[colId] || "").trim(),
      nombre: String(row[colNombre] || "").trim().replace(/\s+/g, " "),
      dni: normalizarDni_(row[colDni]),
      tipo: normalizarTextoSinTildes_(row[colTipo]),
      alta: row[colAlta] === true
    }))
    .filter(p => p.alta && p.tipo.startsWith(TIPO_MECANICO))
    .map(p => Object.assign(p, { motivo: motivoDeExclusion_(p) }));
}

function leerMecanicosActivos_() {
  return leerMecanicosDeStaff_().filter(p => !p.motivo);
}

/** Deja en el registro a quien está de alta como mecánico pero se queda fuera de la lista, con su id y el motivo. */
function anotarExcluidos_(candidatos) {
  const excluidos = candidatos.filter(p => p.motivo);
  if (excluidos.length === 0) return;

  Logger.log(`Mecánicos de alta que NO aparecen en el formulario: ${excluidos.length}`);
  excluidos.forEach(p => {
    Logger.log(`  fila ${p.fila} (${p.id || "sin id"}): ${p.motivo}`);
  });
}

function nombresUnicosOrdenados_(personas) {
  return [...new Set(personas.map(p => p.nombre))].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

function obtenerMecanicosActivosUnicos_() {
  return nombresUnicosOrdenados_(leerMecanicosActivos_());
}

/****************************************************
 * 6) BUSCAR POR NOMBRE
 ****************************************************/
/** La persona { id, dni } con ese nombre entre los mecánicos válidos, o null si no existe. */
function buscarMecanicoPorNombre_(nombreBuscado) {
  const nombreNormalizado = normalizarTexto_(nombreBuscado);

  const coincidencias = leerMecanicosActivos_()
    .filter(p => normalizarTexto_(p.nombre) === nombreNormalizado);

  if (coincidencias.length === 0) return null;
  if (coincidencias.length > 1) {
    throw new Error(`Hay varios mecánicos activos con el mismo nombre: "${nombreBuscado}"`);
  }

  return { id: coincidencias[0].id, dni: coincidencias[0].dni };
}

/****************************************************
 * 7) HELPERS FORMULARIO / RESPUESTAS
 ****************************************************/
function obtenerRespuestaPorTitulo_(e, questionTitle) {
  const itemResponses = e.response.getItemResponses();

  for (let i = 0; i < itemResponses.length; i++) {
    const item = itemResponses[i].getItem();
    const title = item.getTitle();
    const response = itemResponses[i].getResponse();

    if (esMismoTitulo_(title, questionTitle)) {
      return String(response || "").trim();
    }
  }

  return "";
}

/** Escribe el valor en la columna con esa cabecera (la crea al final si no existe). */
function escribirEnColumna_(hoja, fila, cabecera, valor) {
  const lastCol = hoja.getLastColumn();
  const headers = hoja.getRange(1, 1, 1, lastCol).getValues()[0];

  let col = headers.indexOf(cabecera) + 1;
  if (col === 0) {
    col = lastCol + 1;
    hoja.getRange(1, col).setValue(cabecera);
    Logger.log(`Columna ${cabecera} creada en posición ${col}`);
  }

  hoja.getRange(fila, col).setValue(valor);
}

function obtenerHojaRespuestasDelFormulario_() {
  const form = FormApp.openById(FORM_ID);
  const destinationId = form.getDestinationId();

  if (!destinationId) {
    throw new Error("El formulario no tiene hoja de respuestas vinculada");
  }

  const ss = SpreadsheetApp.openById(destinationId);
  const sheets = ss.getSheets();

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) continue;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    if (headers.some(h => esMismoTitulo_(h, QUESTION_TITLE)) && headers.includes("Marca temporal")) {
      return sheet;
    }
  }

  throw new Error(`No se encontró la hoja de respuestas que contiene "${QUESTION_TITLE}"`);
}

function localizarFilaRespuesta_(responseSheet, formResponse) {
  const timestamp = formResponse.getTimestamp();
  const tz = Session.getScriptTimeZone();

  const timestampStr = Utilities.formatDate(timestamp, tz, "dd/MM/yyyy HH:mm:ss");

  const lastRow = responseSheet.getLastRow();
  const data = responseSheet.getRange(2, 1, Math.max(lastRow - 1, 0), 1).getDisplayValues();

  for (let i = data.length - 1; i >= 0; i--) {
    if (String(data[i][0]).trim() === timestampStr) {
      return i + 2;
    }
  }

  return lastRow;
}

function normalizarTexto_(texto) {
  return String(texto || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/** Los títulos de pregunta se comparan sin distinguir mayúsculas ni tildes. */
function esMismoTitulo_(a, b) {
  return normalizarTextoSinTildes_(a) === normalizarTextoSinTildes_(b);
}

function normalizarTextoSinTildes_(texto) {
  return normalizarTexto_(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/****************************************************
 * 8) CONTROL DE FRECUENCIA
 ****************************************************/
function puedeEjecutarSincronizacion_() {
  const cache = CacheService.getScriptCache();
  const key = "vap_sync_mecanicos_lock";
  const locked = cache.get(key);

  if (locked) {
    Logger.log("Sincronización omitida por control de frecuencia");
    return false;
  }

  cache.put(key, "1", 30);
  return true;
}

/****************************************************
 * 9) CREACIÓN DE TRIGGERS
 ****************************************************/
function crearTriggersProduccion() {
  borrarTriggers();

  const form = FormApp.openById(FORM_ID);

  ScriptApp.newTrigger("onFormSubmit")
    .forForm(form)
    .onFormSubmit()
    .create();

  ScriptApp.newTrigger("onSpreadsheetEditTrigger")
    .forSpreadsheet(SPREADSHEET_ID)
    .onEdit()
    .create();

  ScriptApp.newTrigger("onSpreadsheetChangeTrigger")
    .forSpreadsheet(SPREADSHEET_ID)
    .onChange()
    .create();

  Logger.log("Triggers de producción creados correctamente");
}

function crearTriggerHorarioRespaldo() {
  ScriptApp.newTrigger("actualizarPreguntaMecanicos")
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log("Trigger horario de respaldo creado correctamente");
}

function borrarTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log("Todos los triggers han sido eliminados");
}

function verTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    Logger.log(`Función: ${t.getHandlerFunction()} | Evento: ${t.getEventType()}`);
  });
}
