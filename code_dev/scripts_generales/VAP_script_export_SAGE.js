/****************************************************
 * VAP - CÁLCULOS Y VINCULACIÓN SOBRE EXPORTACIÓN SAGE LABORAL
 * (Instalar en el Spreadsheet que contiene la pestaña
 *  "bbdd_export_sage_laboral". Script ENLAZADO a la hoja.)
 ****************************************************
 *
 * Este script agrupa varias acciones accesibles desde un
 * menú propio (VAP_Acciones) en el Google Sheet:
 *
 *   1) "Calculo Salario Base"  -> calcularSalarioBaseBruto()
 *   2) "Export Neto"           -> exportNeto()
 *   3) "Export Bruto"          -> exportBruto()
 *
 * AUDITORÍA CENTRALIZADA (en este mismo libro):
 *   - Hoja "logs":     una fila por cada acción ejecutada.
 *   - Hoja "errores":  una fila por cada acción que falla.
 *   Ambas se correlacionan con el detalle fila-a-fila
 *   (LOG NETOS / LOG BRUTOS de los destinos) por "Run ID".
 *
 * ── ACCIÓN 1: Calcular Salario Base bruto ─────────
 *   salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO|
 *                        + |COBE_Transporte| + |COBE_Alimentacion|
 *   Se escribe en la columna S de "bbdd_export_sage_laboral".
 *
 * ── ACCIONES 2 y 3: Export Neto / Bruto ───────────
 *   Vuelcan datos de personal desde "bbdd_export_sage_laboral"
 *   (este mismo libro) a la hoja de Vinculación de gastos de
 *   personal correspondiente, emparejando por
 *   EMPRESA (col E) + Nº EMPLEADO (col F) del destino.
 *
 *   IMPORTANTE: ejecuta "Calculo Salario Base" ANTES de los
 *   export, porque la columna "Salario Base" del destino se
 *   alimenta del salario_base_bruto que calcula la acción 1.
 *
 *   Comportamiento: SOBRESCRIBE (refresca cada vez). Solo
 *   escribe los campos que el origen trae con valor y que
 *   realmente cambian respecto al destino. Deja un LOG de
 *   antes/después en la propia hoja destino.
 ****************************************************/

/** === CONFIGURACIÓN GENERAL (origen / SAGE) === */
const SHEET_NAME = 'bbdd_export_sage_laboral';
const HEADER_ROW = 1; // fila de cabeceras (datos a partir de HEADER_ROW + 1)

// Cabeceras de origen (se localizan POR NOMBRE en la fila HEADER_ROW)
const COL_TOTAL_BRUTO       = 'TOTAL_BRUTO';
const COL_SEGURO_MEDICO     = 'SEGURO_MEDICO';
const COL_COBE_TRANSPORTE   = 'COBE_Transporte';
const COL_COBE_ALIMENTACION = 'COBE_Alimentacion';

// Columna de RESULTADO de la acción 1: posición fija S (= columna 19)
const RESULT_COL    = 19;                    // S
const RESULT_HEADER = 'salario_base_bruto';

/** === CONFIGURACIÓN VINCULACIÓN (acciones 2 y 3) === */

// Cabeceras de CLAVE en el origen (bbdd_export_sage_laboral)
const VINC_SRC_HEADER_EMPRESA = 'Empresa';
const VINC_SRC_HEADER_NUM     = 'Codigo_Empleado';

// DESTINO: hoja de Vinculación de gastos de personal
const VINC_TARGET_SHEET_NAME = 'Hoja 1';
const VINC_TGT_EMPRESA_COL   = 5;  // E
const VINC_TGT_NUM_COL       = 6;  // F

// IDs de los libros destino
const VINC_NETO_TARGET_ID  = '1HDwgihfz91atsLE99Qu0k3kTyBKpo3Iu3SaUtVGMPTs';
const VINC_BRUTO_TARGET_ID = '1eTVPws0NVRMIlXgZYsUZANdfMyFYQtDlEEK5ujFt04A';

// Mapeo de campos: cabecera en el ORIGEN -> columna FIJA en el DESTINO.
// (Verificado contra las hojas reales el 2026-05-25.)
//   dstCol: G=7, H=8, I=9, L=12, P=16, Q=17, R=18, T=20
const VINC_FIELDS = [
  { srcHeader: 'SEGURO_MEDICO',      dstCol: 7,  label: 'ADESLAS' },
  { srcHeader: 'COBE_Alimentacion',  dstCol: 8,  label: 'COBEE COMIDA' },
  { srcHeader: 'COBE_Transporte',    dstCol: 9,  label: 'COBEE TRANSPORTE' },
  { srcHeader: 'salario_base_bruto', dstCol: 12, label: 'Salario Base' },
  { srcHeader: 'SS_EMP',             dstCol: 16, label: 'SS Empresa' },
  { srcHeader: 'SS_TRABAH',          dstCol: 17, label: 'SS trabajador' },
  { srcHeader: 'IRPF',               dstCol: 18, label: 'IRPF' },
  { srcHeader: 'Líquido_a_percibir', dstCol: 20, label: 'Nomina NETO' },
];
// Hasta qué columna hay que leer del destino (la mayor de VINC_FIELDS y las claves)
const VINC_MAX_DST_COL = 20; // T

// LOG detallado (fila a fila) que vive en cada libro DESTINO
const VINC_LOG_HEADERS = [
  'Timestamp', 'Run ID', 'Tipo', 'Empresa', 'Nº Empleado',
  'Fila origen', 'Fila destino', 'Campos cambiados', 'Detalle'
];

/** === CONFIGURACIÓN AUDITORÍA CENTRALIZADA (este libro) === */
const APP_LOG_SHEET_NAME = 'logs';
const APP_ERR_SHEET_NAME = 'errores';

const APP_LOG_HEADERS = [
  'Timestamp', 'Acción activada', 'Resultado', 'Registro de acciones',
  'Run ID', 'Usuario', 'Duración (s)'
];
const APP_ERR_HEADERS = [
  'Timestamp', 'Acción', 'Tipo de error', 'Descripción del error',
  'Posible solución', 'Run ID', 'Usuario'
];

/****************************************************
 * MENÚ DE LA HOJA
 * Se ejecuta automáticamente al abrir el Spreadsheet.
 ****************************************************/
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('VAP_Acciones')
    .addItem('Calculo Salario Base', 'calcularSalarioBaseBruto')
    .addSeparator()
    .addItem('Export Neto', 'exportNeto')
    .addItem('Export Bruto', 'exportBruto')
    .addToUi();
}

/****************************************************
 * PUNTOS DE ENTRADA DEL MENÚ
 * Cada uno delega en ejecutarAccion_, que registra la
 * ejecución en "logs" y los fallos en "errores".
 ****************************************************/
function calcularSalarioBaseBruto() {
  ejecutarAccion_('Calculo Salario Base', calcularSalarioBaseBruto_);
}

function exportNeto() {
  ejecutarAccion_('Export Neto', function (runId) {
    return volcarVinculacion_(VINC_NETO_TARGET_ID, 'LOG NETOS', 'NETO', runId);
  });
}

function exportBruto() {
  ejecutarAccion_('Export Bruto', function (runId) {
    return volcarVinculacion_(VINC_BRUTO_TARGET_ID, 'LOG BRUTOS', 'BRUTO', runId);
  });
}

/**
 * Envoltorio común: ejecuta la acción, mide tiempo, registra en
 * "logs", y si falla registra en "errores" (y RELANZA la excepción).
 * La función `fn` recibe el runId y debe DEVOLVER un resumen (string).
 */
function ejecutarAccion_(nombreAccion, fn) {
  const runId = Utilities.getUuid();
  const inicio = new Date();
  let usuario = '';
  try { usuario = Session.getActiveUser().getEmail() || ''; } catch (e) { usuario = ''; }

  try {
    const resumen = fn(runId) || '';
    const dur = (new Date() - inicio) / 1000;
    registrarLog_(inicio, nombreAccion, 'OK', resumen, runId, usuario, dur);
    alertSafe_(`"${nombreAccion}" completado.\n${resumen}`);
    return resumen;
  } catch (error) {
    const dur = (new Date() - inicio) / 1000;
    const desc = (error && error.message) ? error.message : String(error);
    const info = clasificarError_(error);
    registrarError_(new Date(), nombreAccion, info.tipo, desc, info.solucion, runId, usuario);
    registrarLog_(inicio, nombreAccion, 'ERROR', `Falló: ${desc}`, runId, usuario, dur);
    alertSafe_(`Error en "${nombreAccion}":\n${desc}\n\nTipo: ${info.tipo}\nPosible solución: ${info.solucion}`);
    throw error; // registrar + relanzar
  }
}

/****************************************************
 * ACCIÓN 1: CALCULAR SALARIO BASE BRUTO
 * salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO|
 *                      + |COBE_Transporte| + |COBE_Alimentacion|
 * Devuelve un resumen (string). Lanza Error si algo falla.
 ****************************************************/
function calcularSalarioBaseBruto_(runId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`No existe la pestaña "${SHEET_NAME}".`);

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= HEADER_ROW) {
    return 'No hay filas de datos que calcular.';
  }

  // 1) Índice de cabeceras: nombre normalizado -> nº de columna (1-based)
  const headers = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
  const headerIndex = {};
  headers.forEach((h, i) => {
    const key = normalizarCabecera_(h);
    if (key && !(key in headerIndex)) headerIndex[key] = i + 1; // 1ª aparición gana
  });

  const colBruto      = headerIndex[normalizarCabecera_(COL_TOTAL_BRUTO)];
  const colSeguro     = headerIndex[normalizarCabecera_(COL_SEGURO_MEDICO)];
  const colCobeTransp = headerIndex[normalizarCabecera_(COL_COBE_TRANSPORTE)];
  const colCobeAlim   = headerIndex[normalizarCabecera_(COL_COBE_ALIMENTACION)];

  const faltan = [];
  if (!colBruto)      faltan.push(COL_TOTAL_BRUTO);
  if (!colSeguro)     faltan.push(COL_SEGURO_MEDICO);
  if (!colCobeTransp) faltan.push(COL_COBE_TRANSPORTE);
  if (!colCobeAlim)   faltan.push(COL_COBE_ALIMENTACION);
  if (faltan.length) {
    throw new Error(`No se encuentran estas cabeceras en la fila ${HEADER_ROW}: ${faltan.join(', ')}`);
  }

  // 2) Asegurar que la hoja tiene al menos hasta la columna S y poner cabecera
  if (sheet.getMaxColumns() < RESULT_COL) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), RESULT_COL - sheet.getMaxColumns());
  }
  sheet.getRange(HEADER_ROW, RESULT_COL).setValue(RESULT_HEADER);

  // 3) Leer datos y calcular
  const startRow = HEADER_ROW + 1;
  const numRows  = lastRow - HEADER_ROW;
  const data = sheet.getRange(startRow, 1, numRows, lastCol).getValues();

  const out = [];
  let calculadas = 0;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const vBruto       = aNumero_(row[colBruto      - 1]);
    const vSeguro      = aNumero_(row[colSeguro     - 1]);
    const vCobeTransp  = aNumero_(row[colCobeTransp - 1]);
    const vCobeAlim    = aNumero_(row[colCobeAlim   - 1]);

    // Si las cuatro columnas están vacías => fila sin datos: no se escribe nada.
    if (vBruto === null && vSeguro === null && vCobeTransp === null && vCobeAlim === null) {
      out.push(['']);
      continue;
    }

    const total = (vBruto || 0)
                + Math.abs(vSeguro || 0)
                + Math.abs(vCobeTransp || 0)
                + Math.abs(vCobeAlim || 0);
    out.push([total]);
    calculadas++;
  }

  // 4) Volcar resultados en bloque (columna S)
  sheet.getRange(startRow, RESULT_COL, out.length, 1).setValues(out);

  Logger.log(`"${RESULT_HEADER}" calculado en ${calculadas} fila(s).`);
  return `"${RESULT_HEADER}" calculado en ${calculadas} fila(s).`;
}

/****************************************************
 * ACCIONES 2 y 3: lógica común de volcado a Vinculación.
 * Devuelve un resumen (string). Lanza Error si algo falla.
 * @param {string} targetSpreadsheetId  ID del libro destino.
 * @param {string} logSheetName         Pestaña de LOG detallado en el destino.
 * @param {string} etiqueta             NETO / BRUTO (informativo).
 * @param {string} runId                ID de ejecución (compartido con logs/errores).
 ****************************************************/
function volcarVinculacion_(targetSpreadsheetId, logSheetName, etiqueta, runId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const now = new Date();

  try {
    // ---- ORIGEN: bbdd_export_sage_laboral (libro activo) ----
    const srcSS = SpreadsheetApp.getActiveSpreadsheet();
    const srcSheet = srcSS.getSheetByName(SHEET_NAME);
    if (!srcSheet) throw new Error(`No existe la pestaña origen: "${SHEET_NAME}".`);

    // ---- DESTINO ----
    const tgtSS = SpreadsheetApp.openById(targetSpreadsheetId);
    const tgtSheet = tgtSS.getSheetByName(VINC_TARGET_SHEET_NAME);
    if (!tgtSheet) throw new Error(`No existe la pestaña destino "${VINC_TARGET_SHEET_NAME}" en el libro ${targetSpreadsheetId}.`);

    const logSheet = getOrCreateLogSheet_(tgtSS, logSheetName, VINC_LOG_HEADERS);
    const logRows = [];

    // ---- Leer ORIGEN ----
    const srcLastRow = srcSheet.getLastRow();
    const srcLastCol = srcSheet.getLastColumn();
    if (srcLastRow <= HEADER_ROW) {
      logRows.push(makeVincLogRow_(now, runId, 'RESUMEN', '', '', '', '', '', 'Origen sin datos.'));
      appendLogRows_(logSheet, logRows);
      return 'Origen sin datos.';
    }
    const srcValues = srcSheet.getRange(1, 1, srcLastRow, srcLastCol).getValues();

    // Cabeceras del origen (fila HEADER_ROW)
    const headers = srcValues[HEADER_ROW - 1].map(h => (h || '').toString().trim());
    const srcEmpresaCol = findHeaderCol_(headers, VINC_SRC_HEADER_EMPRESA);
    const srcNumCol     = findHeaderCol_(headers, VINC_SRC_HEADER_NUM);
    if (!srcEmpresaCol || !srcNumCol) {
      throw new Error(`No encuentro cabeceras de clave en origen: "${VINC_SRC_HEADER_EMPRESA}" y "${VINC_SRC_HEADER_NUM}".`);
    }

    // Resolver la columna de cada campo por su cabecera
    const fieldCols = VINC_FIELDS.map(f => ({ dstCol: f.dstCol, label: f.label, srcCol: findHeaderCol_(headers, f.srcHeader) }));
    const missing = VINC_FIELDS.filter((f, i) => !fieldCols[i].srcCol).map(f => f.srcHeader);
    if (missing.length) {
      throw new Error(`No encuentro estas cabeceras de datos en el origen: ${missing.join(', ')}.`);
    }

    // srcMap: key -> { empresaDisp, numDisp, srcRow, vals: {dstCol: valor} }
    const srcMap = new Map();
    const srcDupes = new Map();

    for (let r = HEADER_ROW; r < srcValues.length; r++) { // datos desde la fila siguiente a la cabecera
      const row = srcValues[r];
      const empresaDisp = (row[srcEmpresaCol - 1] || '').toString().trim();
      const numDisp     = (row[srcNumCol - 1] || '').toString().trim();
      if (!empresaDisp || !numDisp) continue;

      const vals = {};
      let anyVal = false;
      fieldCols.forEach(f => {
        const v = row[f.srcCol - 1];
        if (hasValue_(v)) { vals[f.dstCol] = v; anyVal = true; }
      });
      if (!anyVal) continue; // la fila no aporta ningún campo

      const key = makeKey_(empresaDisp, numDisp);
      if (srcMap.has(key)) srcDupes.set(key, (srcDupes.get(key) || 1) + 1);

      // Última fila gana, combinando por campo (no vacío)
      const existing = srcMap.get(key) || { vals: {} };
      srcMap.set(key, {
        empresaDisp, numDisp, srcRow: r + 1,
        vals: Object.assign({}, existing.vals, vals)
      });
    }

    srcDupes.forEach((count, key) => {
      const last = srcMap.get(key);
      logRows.push(makeVincLogRow_(now, runId, 'DUPLICADO_ORIGEN', last.empresaDisp, last.numDisp, last.srcRow, '', '', `Aparece ${count} veces. Se usa el último valor por campo (no vacío).`));
    });

    if (srcMap.size === 0) {
      logRows.push(makeVincLogRow_(now, runId, 'RESUMEN', '', '', '', '', '', 'Origen sin valores que volcar.'));
      appendLogRows_(logSheet, logRows);
      return 'Origen sin valores que volcar.';
    }

    // ---- Leer DESTINO ----
    const tgtLastRow = tgtSheet.getLastRow();
    if (tgtLastRow < 2) {
      logRows.push(makeVincLogRow_(now, runId, 'RESUMEN', '', '', '', '', '', 'Destino sin filas.'));
      appendLogRows_(logSheet, logRows);
      return 'Destino sin filas.';
    }
    const tgtValues = tgtSheet.getRange(2, 1, tgtLastRow - 1, VINC_MAX_DST_COL).getValues();

    // Índice de destino + detección de duplicados
    const tgtRowByKey = new Map();
    const tgtDupes = new Map();
    for (let i = 0; i < tgtValues.length; i++) {
      const row = tgtValues[i];
      const empresaT = (row[VINC_TGT_EMPRESA_COL - 1] || '').toString().trim();
      const numT     = (row[VINC_TGT_NUM_COL - 1] || '').toString().trim();
      if (!empresaT || !numT) continue;

      const key = makeKey_(empresaT, numT);
      const rowNum = i + 2;
      if (tgtRowByKey.has(key)) {
        const prev = tgtRowByKey.get(key);
        tgtDupes.set(key, (tgtDupes.get(key) || [prev]).concat([rowNum]));
      } else {
        tgtRowByKey.set(key, rowNum);
      }
    }

    tgtDupes.forEach((rowsArr, key) => {
      const src = srcMap.get(key);
      logRows.push(makeVincLogRow_(
        now, runId, 'DUPLICADO_DESTINO',
        src ? src.empresaDisp : '', src ? src.numDisp : '', src ? src.srcRow : '',
        rowsArr.join(','), '',
        `Clave repetida en destino (filas ${rowsArr.join(', ')}). NO se escribe hasta corregir.`
      ));
    });

    // ---- Volcado: SOBRESCRIBE, escribiendo solo las celdas que cambian ----
    let updated = 0, same = 0, notFound = 0, blocked = 0;

    for (let i = 0; i < tgtValues.length; i++) {
      const row = tgtValues[i];
      const empresaT = (row[VINC_TGT_EMPRESA_COL - 1] || '').toString().trim();
      const numT     = (row[VINC_TGT_NUM_COL - 1] || '').toString().trim();
      if (!empresaT || !numT) continue;

      const key = makeKey_(empresaT, numT);
      const destRowNum = i + 2;

      if (tgtDupes.has(key)) { blocked++; continue; }

      const src = srcMap.get(key);
      if (!src) continue;

      const cambios = [];
      VINC_FIELDS.forEach(f => {
        if (!(f.dstCol in src.vals)) return; // el origen no trae valor para este campo
        const after  = src.vals[f.dstCol];
        const before = row[f.dstCol - 1];
        if (!valuesEqual_(before, after)) {
          tgtSheet.getRange(destRowNum, f.dstCol).setValue(after);
          const antes = (before === '' || before === null || before === undefined) ? '∅' : before;
          cambios.push(`${f.label}: ${antes}→${after}`);
        }
      });

      if (cambios.length) {
        updated++;
        logRows.push(makeVincLogRow_(now, runId, 'ACTUALIZADO', src.empresaDisp, src.numDisp, src.srcRow, destRowNum, cambios.join(' | '), ''));
      } else {
        same++;
        logRows.push(makeVincLogRow_(now, runId, 'SIN_CAMBIO', src.empresaDisp, src.numDisp, src.srcRow, destRowNum, '', ''));
      }
    }

    // Origen que NO existe en destino
    srcMap.forEach((src, key) => {
      if (tgtDupes.has(key)) return;
      if (!tgtRowByKey.has(key)) {
        notFound++;
        logRows.push(makeVincLogRow_(now, runId, 'NO_ENCONTRADO_DESTINO', src.empresaDisp, src.numDisp, src.srcRow, '', '', 'No existe clave (empresa+nº) en destino.'));
      }
    });

    const resumen = `Actualizados=${updated} | SinCambio=${same} | NoEncontrados=${notFound} | BloqueadosDuplicadoDestino=${blocked} | DuplicadosOrigen=${srcDupes.size} | DuplicadosDestino=${tgtDupes.size}`;
    logRows.push(makeVincLogRow_(now, runId, 'RESUMEN', '', '', '', '', '', resumen));

    appendLogRows_(logSheet, logRows);
    return resumen;

  } finally {
    lock.releaseLock();
  }
}

/****************************************************
 * AUDITORÍA CENTRALIZADA (hojas "logs" y "errores")
 ****************************************************/

function registrarLog_(ts, accion, resultado, registro, runId, usuario, duracionSeg) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = getOrCreateLogSheet_(ss, APP_LOG_SHEET_NAME, APP_LOG_HEADERS);
    const dur = (typeof duracionSeg === 'number' && isFinite(duracionSeg)) ? Math.round(duracionSeg * 100) / 100 : '';
    sh.appendRow([ts, accion || '', resultado || '', registro || '', runId || '', usuario || '', dur]);
  } catch (e) {
    Logger.log(`No se pudo escribir en "${APP_LOG_SHEET_NAME}": ${e.message}`);
  }
}

function registrarError_(ts, accion, tipo, descripcion, solucion, runId, usuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = getOrCreateLogSheet_(ss, APP_ERR_SHEET_NAME, APP_ERR_HEADERS);
    sh.appendRow([ts, accion || '', tipo || '', descripcion || '', solucion || '', runId || '', usuario || '']);
  } catch (e) {
    Logger.log(`No se pudo escribir en "${APP_ERR_SHEET_NAME}": ${e.message}`);
  }
}

/**
 * Clasifica un error en un tipo legible y propone una posible solución.
 */
function clasificarError_(error) {
  const msg = ((error && error.message) ? error.message : String(error)).toLowerCase();
  if (msg.indexOf('no existe la pestaña') > -1) {
    return { tipo: 'Pestaña no encontrada', solucion: 'Revisa el nombre de la pestaña (origen o destino) y las constantes SHEET_NAME / VINC_TARGET_SHEET_NAME.' };
  }
  if (msg.indexOf('cabecera') > -1) {
    return { tipo: 'Cabecera no encontrada', solucion: 'Comprueba que las cabeceras del origen (bbdd) coinciden con VINC_SRC_HEADER_* y VINC_FIELDS.' };
  }
  if (msg.indexOf('openbyid') > -1 || msg.indexOf('not found') > -1 || msg.indexOf('permis') > -1 || msg.indexOf('access') > -1) {
    return { tipo: 'Acceso al libro destino', solucion: 'Verifica el ID del libro destino y que la cuenta tenga permiso de edición sobre él.' };
  }
  if (msg.indexOf('lock') > -1 || msg.indexOf('bloque') > -1) {
    return { tipo: 'Bloqueo de ejecución', solucion: 'Otra ejecución está en curso. Espera unos segundos y vuelve a intentarlo.' };
  }
  if (msg.indexOf('maximum execution time') > -1 || msg.indexOf('tiempo de ejecución') > -1) {
    return { tipo: 'Tiempo de ejecución excedido', solucion: 'Hay demasiadas filas/escrituras. Avisa para optimizar el volcado o reduce el lote.' };
  }
  return { tipo: 'Error no clasificado', solucion: 'Revisa la descripción y el registro de ejecuciones de Apps Script (Ejecuciones / Ver registros).' };
}

function alertSafe_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

/****************************************************
 * HELPERS - SAGE (acción 1)
 ****************************************************/

/**
 * Normaliza una cabecera para comparar de forma robusta:
 * trim, colapsa espacios, mayúsculas y sin tildes/diacríticos.
 */
function normalizarCabecera_(h) {
  return String(h || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Convierte un valor de celda a número (formato es-ES).
 * Devuelve null si está vacío o no es interpretable.
 */
function aNumero_(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;

  let s = String(v).trim();
  if (s === '') return null;

  s = s.replace(/[€\s]/g, '');

  const tieneComa  = s.indexOf(',') > -1;
  const tienePunto = s.indexOf('.') > -1;
  if (tieneComa && tienePunto) {
    s = s.replace(/\./g, '').replace(',', '.'); // punto=miles, coma=decimal
  } else if (tieneComa) {
    s = s.replace(',', '.');
  }

  const n = Number(s);
  return isNaN(n) ? null : n;
}

/****************************************************
 * HELPERS - VINCULACIÓN (acciones 2 y 3)
 ****************************************************/

function getOrCreateLogSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function appendLogRows_(logSheet, rows) {
  if (!rows || rows.length === 0) return;
  const startRow = logSheet.getLastRow() + 1;
  logSheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

function makeVincLogRow_(ts, runId, tipo, empresa, num, filaOrigen, filaDestino, cambios, detalle) {
  return [
    ts, runId, tipo,
    empresa || '', num || '',
    filaOrigen || '', filaDestino || '',
    cambios || '', detalle || ''
  ];
}

function findHeaderCol_(headers, headerName) {
  const needle = normalizeText_(headerName);
  for (let i = 0; i < headers.length; i++) {
    if (normalizeText_(headers[i]) === needle) return i + 1;
  }
  return null;
}

function makeKey_(empresa, numEmpleado) {
  return `${normalizeText_(empresa)}__${normalizeEmployeeNumber_(numEmpleado)}`;
}

function normalizeText_(s) {
  const cleaned = (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
  return cleaned.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizeEmployeeNumber_(s) {
  return (s || '').toString().trim().replace(/\s+/g, '').replace(/-/g, '').toLowerCase();
}

function hasValue_(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  return true;
}

function valuesEqual_(a, b) {
  if (a === b) return true;
  const na = toNumber_(a);
  const nb = toNumber_(b);
  if (na !== null && nb !== null) return na === nb;
  return (a ?? '').toString().trim() === (b ?? '').toString().trim();
}

function toNumber_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = v.toString().trim();
  if (!s) return null;
  const normalized = s.replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}
