/****************************************************
 * VAP - SINCRONIZAR PROFESORES EN FORMULARIO REAL
 *
 * Lee la pestaña VAP_Profesores y precarga en el formulario a las personas de alta que
 * tengan los datos necesarios: id_trabajador, DNI válido y nombre en formato
 * "APELLIDOS, NOMBRE". Al responder el formulario guarda en la respuesta el id (ID_Profesor)
 * y el DNI (DNI_Profesor): el DNI es lo único unívoco por persona, cambie o no de empresa.
 ****************************************************/

const FORM_ID = "1Ys_fuRWc_Z9gh_RnHenF46GLuUoRgmxzVJw5E2Xbd5U";
const SPREADSHEET_ID = "1HQMxubwPv-vrslsXj5DvsB0gJ9OyewVNDmbPg1hjmHk";
const SHEET_PROFESORES = "VAP_Profesores";
const QUESTION_TITLE = "SELECCIONE EL PROFESOR";
const RESPONSE_ID_HEADER = "ID_Profesor";
const RESPONSE_DNI_HEADER = "DNI_Profesor";
const COL_ID_BBDD = "id_trabajador";
const COL_NOMBRE = "Nombre";
const COL_DNI = "DNI";
const COL_ALTA = "Alta";

/****************************************************
 * 1) SINCRONIZACIÓN PRINCIPAL DEL FORMULARIO
 ****************************************************/
function actualizarPreguntaProfesores() {
  try {
    const candidatos = leerProfesoresDeBBDD_();
    anotarExcluidos_(candidatos);
    const opciones = nombresUnicosOrdenados_(candidatos.filter(p => !p.motivo));

    if (opciones.length === 0) {
      throw new Error("No se han encontrado profesores activos válidos");
    }

    const form = FormApp.openById(FORM_ID);
    const items = form.getItems(FormApp.ItemType.LIST);
    const item = items.find(i => i.getTitle() === QUESTION_TITLE);

    if (!item) {
      throw new Error(`No se encuentra la pregunta tipo lista con título "${QUESTION_TITLE}"`);
    }

    item.asListItem().setChoiceValues(opciones);

    Logger.log(`Formulario actualizado correctamente. Opciones cargadas: ${opciones.length}`);
  } catch (error) {
    Logger.log("ERROR actualizarPreguntaProfesores: " + error.message);
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
    if (!sheet || sheet.getName() !== SHEET_PROFESORES) return;

    if (!puedeEjecutarSincronizacion_()) return;

    Logger.log("Cambio detectado en VAP_Profesores (edición). Sincronizando formulario...");
    actualizarPreguntaProfesores();

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
    actualizarPreguntaProfesores();

  } catch (error) {
    Logger.log("ERROR onSpreadsheetChangeTrigger: " + error.message);
    throw error;
  }
}

/****************************************************
 * 4) AL ENVIAR EL FORMULARIO
 * Crea / rellena ID_Profesor y DNI_Profesor
 ****************************************************/
function onFormSubmit(e) {
  try {
    Logger.log("1. Inicio onFormSubmit");

    const profesorNombre = obtenerRespuestaPorTitulo_(e, QUESTION_TITLE);
    if (!profesorNombre) {
      throw new Error(`No se encontró respuesta para la pregunta "${QUESTION_TITLE}"`);
    }
    Logger.log(`2. Profesor recibido: ${profesorNombre}`);

    const profesor = buscarProfesorPorNombre_(profesorNombre);
    if (!profesor) {
      throw new Error(`No se encontró el profesor "${profesorNombre}"`);
    }
    Logger.log(`3. Profesor localizado: ${profesor.id}`);

    const responseSheet = obtenerHojaRespuestasDelFormulario_();
    Logger.log(`4. Hoja de respuestas encontrada: ${responseSheet.getName()}`);

    const targetRow = localizarFilaRespuesta_(responseSheet, e.response);
    Logger.log(`5. Fila objetivo: ${targetRow}`);

    escribirEnColumna_(responseSheet, targetRow, RESPONSE_ID_HEADER, profesor.id);
    escribirEnColumna_(responseSheet, targetRow, RESPONSE_DNI_HEADER, profesor.dni);
    Logger.log(`6. ${RESPONSE_ID_HEADER} y ${RESPONSE_DNI_HEADER} escritos en la fila ${targetRow}`);

  } catch (error) {
    Logger.log("ERROR onFormSubmit: " + error.message);
    throw error;
  }
}

/****************************************************
 * 5) LEER PROFESORES DE VAP_PROFESORES
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

/** Por qué una persona de alta NO puede aparecer en la lista ("" si puede). */
function motivoDeExclusion_(p) {
  if (!p.id) return "sin id_trabajador";
  if (!p.nombre) return "sin nombre";
  if (!tieneFormatoApellidosNombre_(p.nombre)) return 'nombre sin el formato "APELLIDOS, NOMBRE"';
  if (!p.dni) return "sin DNI";
  if (!esDniValido_(p.dni)) return "DNI con forma no válida";
  return "";
}

/** Las personas de alta de VAP_Profesores, cada una con su `motivo` de exclusión (vacío si es válida). */
function leerProfesoresDeBBDD_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_PROFESORES);

  if (!sheet) {
    throw new Error(`No existe la hoja "${SHEET_PROFESORES}"`);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 2) return [];

  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0];

  const colId = headers.indexOf(COL_ID_BBDD);
  const colNombre = headers.indexOf(COL_NOMBRE);
  const colDni = headers.indexOf(COL_DNI);
  const colAlta = headers.indexOf(COL_ALTA);

  if (colId === -1) throw new Error(`No se encuentra la columna "${COL_ID_BBDD}"`);
  if (colNombre === -1) throw new Error(`No se encuentra la columna "${COL_NOMBRE}"`);
  if (colDni === -1) throw new Error(`No se encuentra la columna "${COL_DNI}"`);
  if (colAlta === -1) throw new Error(`No se encuentra la columna "${COL_ALTA}"`);

  return data
    .slice(1)
    .map((row, i) => ({
      fila: i + 2,
      id: String(row[colId] || "").trim(),
      nombre: String(row[colNombre] || "").trim().replace(/\s+/g, " "),
      dni: normalizarDni_(row[colDni]),
      alta: row[colAlta] === true
    }))
    .filter(p => p.alta)
    .map(p => Object.assign(p, { motivo: motivoDeExclusion_(p) }));
}

function leerProfesoresActivos_() {
  return leerProfesoresDeBBDD_().filter(p => !p.motivo);
}

/** Deja en el registro a quien está de alta pero se queda fuera de la lista, con su fila, su id y el motivo. */
function anotarExcluidos_(candidatos) {
  const excluidos = candidatos.filter(p => p.motivo);
  if (excluidos.length === 0) return;

  Logger.log(`Profesores de alta que NO aparecen en el formulario: ${excluidos.length}`);
  excluidos.forEach(p => {
    Logger.log(`  fila ${p.fila} (${p.id || "sin id"}): ${p.motivo}`);
  });
}

function nombresUnicosOrdenados_(personas) {
  return [...new Set(personas.map(p => p.nombre))].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );
}

function obtenerProfesoresActivosUnicos_() {
  return nombresUnicosOrdenados_(leerProfesoresActivos_());
}

/****************************************************
 * 6) BUSCAR POR NOMBRE
 ****************************************************/
/** La persona { id, dni } con ese nombre entre los profesores válidos, o null si no existe. */
function buscarProfesorPorNombre_(nombreBuscado) {
  const nombreNormalizado = normalizarTexto_(nombreBuscado);

  const coincidencias = leerProfesoresActivos_()
    .filter(p => normalizarTexto_(p.nombre) === nombreNormalizado);

  if (coincidencias.length === 0) return null;
  if (coincidencias.length > 1) {
    throw new Error(`Hay varios profesores activos con el mismo nombre: "${nombreBuscado}"`);
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

    if (title === questionTitle) {
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
    if (headers.includes(QUESTION_TITLE) && headers.includes("Marca temporal")) {
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

/****************************************************
 * 8) CONTROL DE FRECUENCIA
 ****************************************************/
function puedeEjecutarSincronizacion_() {
  const cache = CacheService.getScriptCache();
  const key = "vap_sync_profesores_lock";
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
  ScriptApp.newTrigger("actualizarPreguntaProfesores")
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
