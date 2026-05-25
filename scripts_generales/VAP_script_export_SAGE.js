/****************************************************
 * VAP - CÁLCULOS SOBRE EXPORTACIÓN SAGE LABORAL
 * (Instalar en el Spreadsheet que contiene la pestaña
 *  "bbdd_export_sage_laboral". Script ENLAZADO a la hoja.)
 ****************************************************
 *
 * Este script agrupa varias acciones de cálculo accesibles
 * desde un menú propio en el Google Sheet. Se irá ampliando
 * por partes (una acción = una función + un ítem de menú).
 *
 * ── PARTE 1 ──────────────────────────────────────
 * Acción: "Calcular Salario Base bruto"
 *   1) Toma SEGURO_MEDICO y COBE (vienen como descuentos) y
 *      los transforma a POSITIVO (valor absoluto).
 *   2) Los SUMA a TOTAL_BRUTO.
 *   3) Escribe el resultado en la columna R con cabecera
 *      "salario_base_bruto".
 *
 *   Fórmula:
 *      salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE|
 */

/** === CONFIGURACIÓN === */
const SHEET_NAME = 'bbdd_export_sage_laboral';
const HEADER_ROW = 1; // fila de cabeceras (datos a partir de HEADER_ROW + 1)

// Cabeceras de origen (se localizan POR NOMBRE en la fila HEADER_ROW)
const COL_TOTAL_BRUTO   = 'TOTAL_BRUTO';
const COL_SEGURO_MEDICO = 'SEGURO_MEDICO';
const COL_COBE          = 'COBE';

// Columna de RESULTADO: posición fija R (= columna 18)
const RESULT_COL    = 18;                    // R
const RESULT_HEADER = 'salario_base_bruto';

/****************************************************
 * MENÚ DE LA HOJA
 * Se ejecuta automáticamente al abrir el Spreadsheet.
 *
 * Cómo crecer en el futuro:
 *   - Acción simple:  .addItem('Texto', 'nombreFuncion')
 *   - Submenú:        .addSubMenu(ui.createMenu('Grupo').addItem(...))
 *   - Separador:      .addSeparator()
 ****************************************************/
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('VAP_Acciones')
    .addItem('Calculo Salario Base', 'calcularSalarioBaseBruto')
    .addItem('Envio Datos (futuro)', 'enviarDatosFuturo')
    .addToUi();
}

/****************************************************
 * ACCIÓN 1: CALCULAR SALARIO BASE BRUTO
 * salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE|
 ****************************************************/
function calcularSalarioBaseBruto() {
  const ui = SpreadsheetApp.getUi();
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error(`No existe la pestaña "${SHEET_NAME}".`);

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow <= HEADER_ROW) {
      ui.alert('No hay filas de datos que calcular.');
      return;
    }

    // 1) Índice de cabeceras: nombre normalizado -> nº de columna (1-based)
    const headers = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0];
    const headerIndex = {};
    headers.forEach((h, i) => {
      const key = normalizarCabecera_(h);
      if (key && !(key in headerIndex)) headerIndex[key] = i + 1; // 1ª aparición gana
    });

    const colBruto  = headerIndex[normalizarCabecera_(COL_TOTAL_BRUTO)];
    const colSeguro = headerIndex[normalizarCabecera_(COL_SEGURO_MEDICO)];
    const colCobe   = headerIndex[normalizarCabecera_(COL_COBE)];

    const faltan = [];
    if (!colBruto)  faltan.push(COL_TOTAL_BRUTO);
    if (!colSeguro) faltan.push(COL_SEGURO_MEDICO);
    if (!colCobe)   faltan.push(COL_COBE);
    if (faltan.length) {
      throw new Error(`No se encuentran estas cabeceras en la fila ${HEADER_ROW}: ${faltan.join(', ')}`);
    }

    // 2) Asegurar que la hoja tiene al menos hasta la columna R y poner cabecera
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
      const vBruto  = aNumero_(row[colBruto  - 1]);
      const vSeguro = aNumero_(row[colSeguro - 1]);
      const vCobe   = aNumero_(row[colCobe   - 1]);

      // Si las tres columnas están vacías => fila sin datos: no se escribe nada.
      if (vBruto === null && vSeguro === null && vCobe === null) {
        out.push(['']);
        continue;
      }

      const total = (vBruto || 0) + Math.abs(vSeguro || 0) + Math.abs(vCobe || 0);
      out.push([total]);
      calculadas++;
    }

    // 4) Volcar resultados en bloque (columna R)
    sheet.getRange(startRow, RESULT_COL, out.length, 1).setValues(out);

    Logger.log(`"${RESULT_HEADER}" calculado en ${calculadas} fila(s).`);
    ui.alert(`Listo. Se ha calculado "${RESULT_HEADER}" en ${calculadas} fila(s).`);

  } catch (error) {
    Logger.log('ERROR calcularSalarioBaseBruto: ' + error.message);
    ui.alert('Error: ' + error.message);
    throw error;
  }
}

/****************************************************
 * ACCIÓN 2 (FUTURO): ENVÍO DE DATOS
 * Pendiente de desarrollo. De momento solo avisa.
 ****************************************************/
function enviarDatosFuturo() {
  SpreadsheetApp.getUi().alert('La acción "Envío de datos" todavía está en desarrollo.');
}

/****************************************************
 * HELPERS
 ****************************************************/

/**
 * Normaliza una cabecera para comparar de forma robusta:
 * trim, colapsa espacios, mayúsculas y sin tildes/diacríticos.
 * Así "SEGURO_MEDICO" == "Seguro Médico" == "seguro medico".
 */
function normalizarCabecera_(h) {
  return String(h || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Convierte un valor de celda a número.
 * - Devuelve null si la celda está vacía o no es interpretable.
 * - Si ya es número, lo devuelve tal cual.
 * - Si es texto, limpia símbolo € y espacios e interpreta formato es-ES:
 *     "1.234,56" -> 1234.56   |   "-50,00" -> -50   |   "123" -> 123
 *   (Si solo hay punto, se interpreta como separador decimal.)
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
    // Formato es-ES: punto = miles, coma = decimal
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (tieneComa) {
    // Solo coma: decimal
    s = s.replace(',', '.');
  }

  const n = Number(s);
  return isNaN(n) ? null : n;
}
