/**
 * =========================================================
 *  VOLCADO AUTOMÁTICO FORMULARIO -> VINCULACIÓN GASTOS PERSONAL
 *  (Instalar en el Spreadsheet ORIGEN y trigger "On form submit")
 * =========================================================
 *
 * ORIGEN:
 *  - Spreadsheet: "REGISTRO DE ACTIVIDAD DE PROFESORES 26 (respuestas)"
 *  - Hoja: "Respuestas de formulario 1"
 *  - Nombre empleado: Columna E
 *  - Valores: Columnas F..BQ (según mapeo)
 *
 * DESTINO:
 *  - Spreadsheet: "VINCULACIÓN GASTOS PERSONAL"
 *  - Hoja: "Hoja 1"
 *  - Buscar nombre empleado: Columna C
 *  - Volcado: Columnas AC..CN (según mapeo)
 */

/** === IDs (OBLIGATORIO) ===
 * En la URL del Sheet, el ID es lo que va entre /d/ y /edit
 */
const SOURCE_SPREADSHEET_ID = '1qRUyzN1GZ4kUI7Rd5jrVPpZ0gTYXfFFz1o2f9sXVhMk';
const TARGET_SPREADSHEET_ID = '1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc';

// Nombres de pestañas
const SOURCE_SHEET_NAME = 'Respuestas de formulario 1';
const TARGET_SHEET_NAME = 'Hoja 1';

// Columnas clave (1-based)
const SOURCE_NAME_COL = 5; // E en origen
const TARGET_NAME_COL = 3; // C en destino

/**
 * Mapeo origen -> destino
 * Origen: F(6) ... BQ(69)
 * Destino: AC(29) ... CN(92)
 */
const COLUMN_MAP = [
  { src: 6,  dst: 29 }, // F  -> AC
  { src: 7,  dst: 30 }, // G  -> AD
  { src: 8,  dst: 31 }, // H  -> AE
  { src: 9,  dst: 32 }, // I  -> AF
  { src: 10, dst: 33 }, // J  -> AG
  { src: 11, dst: 34 }, // K  -> AH
  { src: 12, dst: 35 }, // L  -> AI
  { src: 13, dst: 36 }, // M  -> AJ
  { src: 14, dst: 37 }, // N  -> AK
  { src: 15, dst: 38 }, // O  -> AL
  { src: 16, dst: 39 }, // P  -> AM
  { src: 17, dst: 40 }, // Q  -> AN
  { src: 18, dst: 41 }, // R  -> AO
  { src: 19, dst: 42 }, // S  -> AP
  { src: 20, dst: 43 }, // T  -> AQ
  { src: 21, dst: 44 }, // U  -> AR
  { src: 22, dst: 45 }, // V  -> AS
  { src: 23, dst: 46 }, // W  -> AT
  { src: 24, dst: 47 }, // X  -> AU
  { src: 25, dst: 48 }, // Y  -> AV
  { src: 26, dst: 49 }, // Z  -> AW
  { src: 27, dst: 50 }, // AA -> AX
  { src: 28, dst: 51 }, // AB -> AY
  { src: 29, dst: 52 }, // AC -> AZ
  { src: 30, dst: 53 }, // AD -> BA
  { src: 31, dst: 54 }, // AE -> BB
  { src: 32, dst: 55 }, // AF -> BC
  { src: 33, dst: 56 }, // AG -> BD
  { src: 34, dst: 57 }, // AH -> BE
  { src: 35, dst: 58 }, // AI -> BF
  { src: 36, dst: 59 }, // AJ -> BG
  { src: 37, dst: 60 }, // AK -> BH
  { src: 38, dst: 61 }, // AL -> BI
  { src: 39, dst: 62 }, // AM -> BJ
  { src: 40, dst: 63 }, // AN -> BK
  { src: 41, dst: 64 }, // AO -> BL
  { src: 42, dst: 65 }, // AP -> BM
  { src: 43, dst: 66 }, // AQ -> BN
  { src: 44, dst: 67 }, // AR -> BO
  { src: 45, dst: 68 }, // AS -> BP
  { src: 46, dst: 69 }, // AT -> BQ
  { src: 47, dst: 70 }, // AU -> BR
  { src: 48, dst: 71 }, // AV -> BS
  { src: 49, dst: 72 }, // AW -> BT
  { src: 50, dst: 73 }, // AX -> BU
  { src: 51, dst: 74 }, // AY -> BV
  { src: 52, dst: 75 }, // AZ -> BW
  { src: 53, dst: 76 }, // BA -> BX
  { src: 54, dst: 77 }, // BB -> BY
  { src: 55, dst: 78 }, // BC -> BZ
  { src: 56, dst: 79 }, // BD -> CA
  { src: 57, dst: 80 }, // BE -> CB
  { src: 58, dst: 81 }, // BF -> CC
  { src: 59, dst: 82 }, // BG -> CD
  { src: 60, dst: 83 }, // BH -> CE
  { src: 61, dst: 84 }, // BI -> CF
  { src: 62, dst: 85 }, // BJ -> CG
  { src: 63, dst: 86 }, // BK -> CH
  { src: 64, dst: 87 }, // BL -> CI
  { src: 65, dst: 88 }, // BM -> CJ
  { src: 66, dst: 89 }, // BN -> CK
  { src: 67, dst: 90 }, // BO -> CL
  { src: 68, dst: 91 }, // BP -> CM
  { src: 69, dst: 92 }, // BQ -> CN
];

/**
 * =========================================================
 * FUNCIÓN PARA EL TRIGGER "AL ENVIAR FORMULARIO"
 * Configura el trigger para que ejecute ESTA función.
 * =========================================================
 */
function onFormSubmit(e) {
  // Puedes usar e para optimizar (solo última fila), pero para máxima robustez
  // (y cumplir "si un empleado aparece varias veces, gana el último registro")
  // sincronizamos por "último registro por nombre".
  syncRegistroToVinculacion();
}

/**
 * Sincroniza todos los empleados tomando el último registro por nombre
 * y volcando en destino. Si el empleado no existe, crea una nueva fila.
 */
function syncRegistroToVinculacion() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    // ORIGEN
    const srcSS = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const srcSheet = srcSS.getSheetByName(SOURCE_SHEET_NAME);
    if (!srcSheet) throw new Error(`No existe la pestaña origen: ${SOURCE_SHEET_NAME}`);

    const srcLastRow = srcSheet.getLastRow();
    if (srcLastRow < 2) return; // sin datos

    const srcLastCol = srcSheet.getLastColumn();
    const srcValues = srcSheet.getRange(2, 1, srcLastRow - 1, srcLastCol).getValues();

    // 1) Último registro por empleado (si se repite, el último sobrescribe)
    const latestByName = new Map(); // key(normalizada) -> {displayName, rowValues}
    for (let i = 0; i < srcValues.length; i++) {
      const row = srcValues[i];
      const nameRaw = row[SOURCE_NAME_COL - 1];
      const displayName = (nameRaw || '').toString().trim();
      if (!displayName) continue;

      const key = normalizeKey(displayName);
      latestByName.set(key, { displayName, row });
    }

    if (latestByName.size === 0) return;

    // DESTINO
    const tgtSS = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
    const tgtSheet = tgtSS.getSheetByName(TARGET_SHEET_NAME);
    if (!tgtSheet) throw new Error(`No existe la pestaña destino: ${TARGET_SHEET_NAME}`);

    // 2) Índice de destino por nombre (col C)
    let tgtLastRow = tgtSheet.getLastRow();

    // Si no hay filas de datos aún, dejamos preparada la primera fila de datos en la 2
    if (tgtLastRow < 2) {
      // Asegura al menos 1 fila para escribir (si la hoja está vacía)
      tgtSheet.insertRowsAfter(1, 1);
      tgtLastRow = tgtSheet.getLastRow();
    }

    const tgtNames = tgtSheet.getRange(2, TARGET_NAME_COL, tgtLastRow - 1, 1).getValues();

    const tgtRowByName = new Map(); // key -> rowNumber
    for (let r = 0; r < tgtNames.length; r++) {
      const nameRaw = tgtNames[r][0];
      const name = (nameRaw || '').toString().trim();
      if (!name) continue;
      tgtRowByName.set(normalizeKey(name), r + 2);
    }

    // 3) Precalcular mapping destino->origen para volcado AC..CN
    const firstDstCol = 29; // AC
    const lastDstCol  = 92; // CN
    const width = lastDstCol - firstDstCol + 1;

    const srcByDst = {};
    COLUMN_MAP.forEach(m => { srcByDst[m.dst] = m.src; });

    // 4) Aplicar actualizaciones
    latestByName.forEach(({ displayName, row: srcRow }, key) => {
      let tgtRow = tgtRowByName.get(key);

      // Si no existe en destino => crear fila nueva al final
      if (!tgtRow) {
        tgtRow = tgtSheet.getLastRow() + 1;
        tgtSheet.insertRowAfter(tgtSheet.getLastRow());

        // Escribir el nombre en la columna C (TARGET_NAME_COL)
        tgtSheet.getRange(tgtRow, TARGET_NAME_COL).setValue(displayName);

        // Actualizar índice en memoria
        tgtRowByName.set(key, tgtRow);
      }

      // Construir el array AC..CN
      const out = new Array(width).fill('');
      for (let dst = firstDstCol; dst <= lastDstCol; dst++) {
        const srcCol = srcByDst[dst];
        if (!srcCol) continue;
        out[dst - firstDstCol] = srcRow[srcCol - 1];
      }

      // Volcar valores en AC..CN
      tgtSheet.getRange(tgtRow, firstDstCol, 1, width).setValues([out]);
    });

  } finally {
    lock.releaseLock();
  }
}

/**
 * Normaliza nombres:
 * - trim
 * - colapsa espacios múltiples
 * - minúsculas
 * - ignora tildes/diacríticos
 */
function normalizeKey(name) {
  const cleaned = name.toString().trim().replace(/\s+/g, ' ').toLowerCase();
  // Quitar tildes/diacríticos
  return cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}