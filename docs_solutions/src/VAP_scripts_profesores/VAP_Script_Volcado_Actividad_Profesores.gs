/**
 * =========================================================
 *  REGISTRO DE ACTIVIDAD DE PROFESORES 26
 *  -> VINCULACIÓN GASTOS PERSONAL
 *  (Instalar en el Spreadsheet de RESPUESTAS del formulario)
 * =========================================================
 *
 * ARCHIVOS DEL PROYECTO GAS:
 *   - Código.gs              <- este archivo
 *   - DialogoVolcado (HTML)  <- desplegable de mes/año e informe
 *
 * ORIGEN: "REGISTRO DE ACTIVIDAD DE PROFESORES 26 (respuestas)"
 *   Hoja "Respuestas de formulario 1"
 *     A   Marca temporal          <- año del periodo y orden de los envíos
 *     C   SELECCIONE EL MES       <- filtro de periodo
 *     D   SUCURSAL                <- informativo (no se vuelca)
 *     E   SELECCIONE EL PROFESOR  <- cruce por nombre
 *     F..BQ  64 columnas de actividad
 *     BR  OBSERVACIONES           <- no se vuelca
 *     BT  ID_Profesor             <- lo escribe el script de sincronización
 *
 * DESTINO: "VINCULACIÓN GASTOS PERSONAL", hoja "Hoja 1"
 *   Nombre del profesor en la columna C; datos en AC..CN.
 *
 * ARCHIVO HISTÓRICO: hoja "Hoja 1" de ESTE mismo libro
 *   (no confundir con la "Hoja 1" del libro destino).
 *
 * ── CÓMO SE USA ───────────────────────────────────────────
 *  1) Menú "VAP_Acciones" -> "Volcar Actividad del mes...".
 *  2) Se elige el periodo en un desplegable. Viene preseleccionado
 *     el mes en curso según la fecha de ejecución.
 *  3) El script revisa las respuestas y muestra un informe de
 *     filas que coinciden y filas que no.
 *  4) La usuaria ACEPTA o CANCELA.
 *  5) Si acepta: vuelca a VINCULACIÓN y copia las filas al
 *     histórico.
 *
 * ── ACUMULACIÓN POR CAMPO (ADR-0009) ──────────────────────
 * Varias secretarias reportan partes distintas de la actividad
 * del mismo profesor: en el histórico hay 122 pares
 * (profesor, mes) con más de un reporte. Por eso, dentro de un
 * mismo periodo se acumula CAMPO A CAMPO:
 *   - gana la última celda NO VACÍA (por marca temporal),
 *   - una celda vacía NO borra lo ya reportado,
 *   - el 0 es un dato válido y sí pisa.
 *
 * ── EL VACÍO NO PISA, TAMPOCO EN EL DESTINO ───────────────
 * Solo se escriben en VINCULACIÓN las columnas que el periodo
 * trae con valor:
 *   - si este mes no hay dato en un campo, no se escribe nada;
 *   - si en un volcado posterior sí lo hay, se escribe y
 *     sobrescribe lo que hubiera (incluido un 0);
 *   - dentro del mismo mes, entre 5 y 15 prevalece el último.
 *
 * PREMISA DEL PROCESO: cada mes se parte de una hoja de
 * VINCULACIÓN limpia. Por eso el contador "celdas conservadas"
 * del informe debería ser SIEMPRE 0. Si no lo es, el destino ya
 * tenía datos: probablemente se esté volcando sobre la hoja del
 * mes anterior. El informe lo avisa de forma destacada.
 *
 * ── LA HOJA DE RESPUESTAS NO SE MODIFICA ──────────────────
 * El script solo lee de ella. El histórico recibe una COPIA.
 *
 * ── AUDITORÍA ─────────────────────────────────────────────
 * Hoja "LOG Volcado": movimientos (antes→después, con el nombre
 * real de cada columna), incidencias y errores. Un Run ID por
 * ejecución.
 */

/** === IDs (OBLIGATORIO) === */
const SOURCE_SPREADSHEET_ID = '1qRUyzN1GZ4kUI7Rd5jrVPpZ0gTYXfFFz1o2f9sXVhMk';
const TARGET_SPREADSHEET_ID = '1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc';

// Hojas
const SOURCE_SHEET_NAME  = 'Respuestas de formulario 1';
const TARGET_SHEET_NAME  = 'Hoja 1';   // en el libro DESTINO
const ARCHIVE_SHEET_NAME = 'Hoja 1';   // en ESTE libro: histórico acumulado
const LOG_SHEET_NAME     = 'LOG Volcado';
const SIM_SHEET_NAME     = 'simulacion_volcado';

// Columnas ORIGEN (1-based)
const SRC_TIMESTAMP_COL = 1; // A
const SRC_MONTH_COL     = 3; // C  SELECCIONE EL MES
const SRC_SUCURSAL_COL  = 4; // D  SUCURSAL (informativo)
const SOURCE_NAME_COL   = 5; // E  SELECCIONE EL PROFESOR
const SRC_DNI_HEADER    = 'DNI_Profesor'; // la escribe la sincronización; las respuestas antiguas no la tienen

// Columna del nombre en el DESTINO
const TARGET_NAME_COL = 3; // C
const TARGET_DNI_COL  = 4; // D

/**
 * Mapeo origen -> destino. Origen F(6)..BQ(69); destino AC(29)..CN(92).
 * Son 64 columnas correlativas: se genera para no mantener 64 líneas a mano.
 */
const SRC_FIRST_DATA_COL = 6;  // F
const SRC_LAST_DATA_COL  = 69; // BQ
const DST_FIRST_DATA_COL = 29; // AC

const COLUMN_MAP = (function () {
  const m = [];
  for (let s = SRC_FIRST_DATA_COL; s <= SRC_LAST_DATA_COL; s++) {
    m.push({ src: s, dst: DST_FIRST_DATA_COL + (s - SRC_FIRST_DATA_COL) });
  }
  return m;
})();

/** Copiar al histórico las filas exportadas. Es una COPIA. */
const COPIAR_A_HISTORICO = true;

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
               'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

const LOG_HEADERS = ['Timestamp', 'Run ID', 'Usuario', 'Periodo', 'Categoría',
                     'Tipo', 'Fila origen', 'Profesor', 'Detalle'];

/****************************************************
 * MENÚ Y DIÁLOGO
 ****************************************************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('VAP_Acciones')
    .addItem('Volcar Actividad del mes...', 'abrirDialogoVolcado')
    .addToUi();
}

function abrirDialogoVolcado() {
  const html = HtmlService.createHtmlOutputFromFile('DialogoVolcado')
    .setWidth(560)
    .setHeight(580);
  SpreadsheetApp.getUi().showModalDialog(html, 'Volcar Actividad de Profesores');
}

/** Periodo propuesto: el de la fecha de ejecución. Lo llama el diálogo. */
function vapPeriodoPropuesto() {
  const ahora = new Date();
  return {
    meses: MESES,
    mes: MESES[ahora.getMonth()],
    anio: ahora.getFullYear(),
    hoy: formatearFecha_(ahora)
  };
}

/** Analiza sin escribir nada. Lo llama el diálogo. */
function vapAnalizarPeriodo(mes, anio) {
  try {
    const plan = analizarVolcado_(mes, Number(anio));
    return {
      ok: true,
      mes: mes,
      anio: Number(anio),
      totalFilas: plan.totalFilas,
      coinciden: plan.filasMes.length,
      profesores: plan.aVolcar.length,
      multiReporte: plan.multiReporte.length,
      celdasConValor: plan.celdasConValor,
      destinoOcupado: plan.destinoOcupado,
      noCoinciden: plan.noCoinciden,
      porOtroMes: plan.porOtroMes,
      porOtroAnio: plan.porOtroAnio,
      sinMes: plan.sinMes,
      avisosFecha: plan.avisosFecha.length,
      incidencias: plan.incidencias.map(i => `${i.tipo} (fila ${i.fila}): ${i.detalle}`),
      yaArchivado: plan.yaArchivado,
      archivoNombre: ARCHIVE_SHEET_NAME
    };
  } catch (err) {
    registrarIncidenciaSuelta_('ANALISIS', err.message);
    return { ok: false, error: err.message };
  }
}

/** Ejecuta el volcado. Lo llama el diálogo tras confirmar. */
function vapEjecutarExportacion(mes, anio) {
  try {
    const plan = analizarVolcado_(mes, Number(anio));
    if (!plan.filasMes.length) return { ok: false, error: 'No hay filas que coincidan con el periodo.' };
    const r = ejecutarVolcado_(plan, mes, Number(anio));
    return { ok: true, ...r };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/****************************************************
 * ANÁLISIS (no escribe nada)
 ****************************************************/
function analizarVolcado_(mesObjetivo, anioObjetivo) {
  if (MESES.indexOf(mesObjetivo) === -1) throw new Error(`Mes no válido: "${mesObjetivo}".`);

  const srcSheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID)
    .getSheetByName(SOURCE_SHEET_NAME);
  if (!srcSheet) throw new Error(`No existe la pestaña origen: "${SOURCE_SHEET_NAME}".`);

  const vacio = {
    aVolcar: [], filasMes: [], multiReporte: [], avisosFecha: [], incidencias: [],
    noCoinciden: 0, porOtroMes: 0, porOtroAnio: 0, sinMes: 0,
    totalFilas: 0, celdasConValor: 0, yaArchivado: false, cabeceras: []
  };

  const lastRow = srcSheet.getLastRow();
  if (lastRow < 2) return vacio;

  const lastCol = Math.max(srcSheet.getLastColumn(), SRC_LAST_DATA_COL);
  const cabeceras = srcSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = srcSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  // grupo por profesor (por DNI y, si no lo hay, por nombre): acumulación campo a campo (ADR-0009)
  const grupos = new Map();
  const columnaDni = cabeceras.indexOf(SRC_DNI_HEADER);
  const dniDeFila = row => {
    const dni = columnaDni === -1 ? '' : normalizarDni_(row[columnaDni]);
    return esDniValido_(dni) ? dni : '';
  };
  const dnisPorNombre = dnisDelPeriodoPorNombre_(values, dniDeFila, mesObjetivo, anioObjetivo);
  const filasMes = [];
  const avisosFecha = [];
  const incidencias = [];
  let porOtroMes = 0, porOtroAnio = 0, sinMes = 0;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const filaReal = i + 2;

    const displayName = (row[SOURCE_NAME_COL - 1] || '').toString().trim();
    const mesCrudo = (row[SRC_MONTH_COL - 1] || '').toString().trim();
    const mesFila = normalizarMes_(mesCrudo);
    const ts = toDate_(row[SRC_TIMESTAMP_COL - 1]);

    if (!displayName && !mesCrudo && !ts) continue; // fila vacía

    if (!displayName) {
      incidencias.push({ tipo: 'SIN_PROFESOR', fila: filaReal,
        detalle: 'La columna E (SELECCIONE EL PROFESOR) está vacía. Fila descartada.' });
      continue;
    }
    if (!mesFila) {
      sinMes++;
      incidencias.push({ tipo: 'MES_NO_RECONOCIDO', fila: filaReal, profesor: displayName,
        detalle: `La columna C dice "${mesCrudo}". No coincide con ningún mes.` });
      continue;
    }
    if (mesFila !== mesObjetivo) { porOtroMes++; continue; }

    const anioFila = ts ? ts.getFullYear() : null;
    if (anioFila !== null && anioFila !== anioObjetivo) { porOtroAnio++; continue; }

    if (!ts) {
      incidencias.push({ tipo: 'SIN_MARCA_TEMPORAL', fila: filaReal, profesor: displayName,
        detalle: 'Sin marca temporal: no se puede ordenar frente a otros reportes del mismo profesor.' });
    }
    if (ts && Math.abs(ts.getMonth() - MESES.indexOf(mesObjetivo)) > 1) {
      avisosFecha.push({ fila: filaReal, nombre: displayName,
        detalle: `Declara ${mesObjetivo} pero la marca temporal es ${formatearFecha_(ts)}` });
    }

    filasMes.push(filaReal);

    let dni = dniDeFila(row);
    const dnisDelNombre = dnisPorNombre.get(normalizeKey(displayName));
    if (!dni && dnisDelNombre && dnisDelNombre.size === 1) dni = Array.from(dnisDelNombre)[0];
    if (!dni && dnisDelNombre && dnisDelNombre.size > 1) {
      incidencias.push({ tipo: 'DNI_AMBIGUO', fila: filaReal, profesor: displayName,
        detalle: 'Envío sin DNI y ese nombre tiene varios DNI en el periodo: se cruza por nombre.' });
    }
    const clave = dni ? `d:${dni}` : `n:${normalizeKey(displayName)}`;
    let g = grupos.get(clave);
    if (!g) {
      g = { displayName, dni, valores: {}, filas: [], sucursales: {}, ultimoTs: null };
      grupos.set(clave, g);
    }
    g.displayName = displayName;
    g.filas.push(filaReal);

    const suc = (row[SRC_SUCURSAL_COL - 1] || '').toString().trim();
    if (suc) g.sucursales[suc] = true;

    // ACUMULACIÓN: gana la última celda NO VACÍA; el vacío no pisa; el 0 sí.
    const esPosterior = !g.ultimoTs || !ts || ts.getTime() >= g.ultimoTs.getTime();
    COLUMN_MAP.forEach(m => {
      const v = row[m.src - 1];
      if (isEmpty(v)) return;                       // el vacío nunca pisa
      const yaHay = g.valores.hasOwnProperty(m.dst);
      if (!yaHay || esPosterior) {
        if (yaHay && !valoresIguales_(g.valores[m.dst].valor, v)) {
          incidencias.push({ tipo: 'VALOR_SOBRESCRITO', fila: filaReal, profesor: displayName,
            detalle: `"${nombreColumna_(cabeceras, m.src)}": ${mostrar_(g.valores[m.dst].valor)} → ` +
                     `${mostrar_(v)} (reporte posterior de la fila ${filaReal}).` });
        }
        g.valores[m.dst] = { valor: v, src: m.src };
      }
      if (!esNumericoOVacio_(v)) {
        incidencias.push({ tipo: 'VALOR_NO_NUMERICO', fila: filaReal, profesor: displayName,
          detalle: `"${nombreColumna_(cabeceras, m.src)}" = "${v}" no es un número.` });
      }
    });
    if (ts && esPosterior) g.ultimoTs = ts;
  }

  const aVolcar = [];
  const multiReporte = [];
  let celdasConValor = 0;
  grupos.forEach(g => {
    const nCeldas = Object.keys(g.valores).length;
    celdasConValor += nCeldas;
    aVolcar.push({ clave: normalizeKey(g.displayName), dni: g.dni, displayName: g.displayName, valores: g.valores,
                   filas: g.filas, nCeldas: nCeldas,
                   sucursales: Object.keys(g.sucursales) });
    if (g.filas.length > 1) {
      multiReporte.push({ nombre: g.displayName, filas: g.filas,
                          sucursales: Object.keys(g.sucursales) });
    }
  });

  return {
    aVolcar, filasMes, multiReporte, avisosFecha, incidencias, cabeceras,
    noCoinciden: porOtroMes + porOtroAnio + sinMes,
    porOtroMes, porOtroAnio, sinMes,
    totalFilas: values.length,
    celdasConValor,
    destinoOcupado: contarCeldasOcupadasDestino_(aVolcar),
    yaArchivado: yaArchivado_(mesObjetivo, anioObjetivo)
  };
}

/**
 * Cuenta las celdas del rango AC..CN que YA tienen dato en el destino,
 * para los profesores que se van a volcar.
 *
 * El proceso parte cada mes de una hoja de VINCULACIÓN limpia, así que
 * el resultado esperado es 0. Un número distinto indica que el destino
 * conserva datos de un volcado anterior: probablemente sea la hoja del
 * mes pasado. Se avisa ANTES de escribir nada.
 */
function contarCeldasOcupadasDestino_(aVolcar) {
  try {
    if (!aVolcar.length) return 0;

    const tgtSheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID)
      .getSheetByName(TARGET_SHEET_NAME);
    if (!tgtSheet) return 0;

    const lastRow = tgtSheet.getLastRow();
    if (lastRow < 2) return 0;

    const claves = {};
    aVolcar.forEach(i => { claves[i.clave] = true; });

    const nombres = tgtSheet.getRange(2, TARGET_NAME_COL, lastRow - 1, 1).getValues();
    const datos = tgtSheet.getRange(2, DST_FIRST_DATA_COL, lastRow - 1, COLUMN_MAP.length).getValues();

    let ocupadas = 0;
    for (let r = 0; r < nombres.length; r++) {
      const n = (nombres[r][0] || '').toString().trim();
      if (!n || !claves[normalizeKey(n)]) continue;
      for (let c = 0; c < datos[r].length; c++) {
        if (!isEmpty(datos[r][c])) ocupadas++;
      }
    }
    return ocupadas;
  } catch (e) {
    return -1; // no se ha podido comprobar; el informe lo indica
  }
}

/** ¿Hay ya filas de este periodo en el histórico? Avisa de duplicados. */
function yaArchivado_(mesObjetivo, anioObjetivo) {
  try {
    const arch = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID).getSheetByName(ARCHIVE_SHEET_NAME);
    if (!arch) return false;
    const lastRow = arch.getLastRow(), lastCol = arch.getLastColumn();
    if (lastRow < 1 || lastCol < 1) return false;
    const marca = `ARCHIVADO ${mesObjetivo} ${anioObjetivo}`;
    return arch.getRange(1, 1, lastRow, lastCol).getValues()
      .some(r => r.some(c => (c || '').toString().trim() === marca));
  } catch (e) {
    return false;
  }
}

/****************************************************
 * EJECUCIÓN (escribe)
 ****************************************************/
function ejecutarVolcado_(plan, mesObjetivo, anioObjetivo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const runId = Utilities.getUuid().slice(0, 8);
  const ahora = new Date();
  const periodo = `${mesObjetivo} ${anioObjetivo}`;
  let usuario = '';
  try { usuario = Session.getActiveUser().getEmail() || ''; } catch (e) { usuario = ''; }

  const logRows = [];
  const anota = (categoria, tipo, fila, profesor, detalle) =>
    logRows.push([ahora, runId, usuario, periodo, categoria, tipo,
                  fila || '', profesor || '', detalle || '']);

  try {
    const tgtSS = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
    const tgtSheet = tgtSS.getSheetByName(TARGET_SHEET_NAME);
    if (!tgtSheet) throw new Error(`No existe la pestaña destino: "${TARGET_SHEET_NAME}".`);

    let tgtLastRow = tgtSheet.getLastRow();
    if (tgtLastRow < 2) {
      tgtSheet.insertRowsAfter(1, 1);
      tgtLastRow = tgtSheet.getLastRow();
    }

    const indice = indiceDestino_(tgtSheet);

    // Incidencias del análisis
    plan.incidencias.forEach(i => anota('INCIDENCIA', i.tipo, i.fila, i.profesor, i.detalle));
    plan.avisosFecha.forEach(a => anota('INCIDENCIA', 'MARCA_TEMPORAL_FUERA_DE_MES', a.fila, a.nombre, a.detalle));
    plan.multiReporte.forEach(m => anota('INCIDENCIA', 'VARIOS_REPORTES', m.filas.join(','), m.nombre,
      `${m.filas.length} reportes acumulados por campo` +
      (m.sucursales.length > 1 ? ` desde ${m.sucursales.length} sucursales: ${m.sucursales.join(' · ')}` : '')));

    let actualizados = 0, sinCambios = 0, creados = 0, bloqueados = 0;
    let celdasEscritas = 0, celdasConservadas = 0;

    const anchoDst = COLUMN_MAP.length; // AC..CN

    plan.aVolcar.forEach(item => {
      const destino = resolverDestino_(item, indice);
      destino.avisos.forEach(a => anota(destino.accion === 'bloquear' ? 'ERROR' : 'INCIDENCIA', a.tipo,
        item.filas.join(','), item.displayName, a.detalle));
      if (destino.accion === 'bloquear') {
        bloqueados++;
        return;
      }

      let tgtRow = destino.fila;
      if (destino.accion === 'crear') {
        tgtRow = tgtSheet.getLastRow() + 1;
        tgtSheet.insertRowAfter(tgtSheet.getLastRow());
        tgtSheet.getRange(tgtRow, TARGET_NAME_COL).setValue(item.displayName);
        if (item.dni) tgtSheet.getRange(tgtRow, TARGET_DNI_COL).setValue(item.dni);
        anadirAlIndice_(indice, tgtRow, item.displayName, item.dni);
        creados++;
        anota('MOVIMIENTO', 'FILA_NUEVA', '', item.displayName, `Creada en la fila ${tgtRow} del destino.`);
      }

      // Lectura y escritura en bloque del rango AC..CN.
      const rango = tgtSheet.getRange(tgtRow, DST_FIRST_DATA_COL, 1, anchoDst);
      const antes = rango.getValues()[0];
      const { despues, cambios, conservadas } = calcularCambios_(antes, item, plan.cabeceras);
      celdasConservadas += conservadas;
      celdasEscritas += cambios.length;

      if (cambios.length) {
        rango.setValues([despues]);
        actualizados++;
        // El detalle puede ser largo: se recorta para que la celda del log siga siendo legible.
        const detalle = cambios.length <= 12
          ? cambios.join(' | ')
          : cambios.slice(0, 12).join(' | ') + ` | … y ${cambios.length - 12} campo(s) más`;
        anota('MOVIMIENTO', 'ACTUALIZADO', item.filas.join(','), item.displayName,
          `Fila ${tgtRow}. ${cambios.length} campo(s). ${detalle}`);
      } else {
        sinCambios++;
        anota('MOVIMIENTO', 'SIN_CAMBIO', item.filas.join(','), item.displayName,
          `Fila ${tgtRow}. Los ${item.nCeldas} campo(s) reportados ya tenían ese valor.`);
      }
    });

    // Copia al histórico
    let copiadas = 0;
    if (COPIAR_A_HISTORICO && plan.filasMes.length) {
      try {
        copiadas = copiarAHistorico_(plan.filasMes, mesObjetivo, anioObjetivo, runId);
        anota('MOVIMIENTO', 'COPIA_HISTORICO', '', '',
          `${copiadas} fila(s) copiadas a "${ARCHIVE_SHEET_NAME}".`);
      } catch (errCopia) {
        anota('ERROR', 'COPIA_HISTORICO', '', '',
          `No se pudo copiar a "${ARCHIVE_SHEET_NAME}": ${errCopia.message}. ` +
          `El volcado a VINCULACIÓN sí se ha realizado.`);
      }
    }

    anota('RESUMEN', 'OK', '', '',
      `Actualizados=${actualizados} | SinCambio=${sinCambios} | Creados=${creados} | ` +
      `Bloqueados=${bloqueados} | CeldasEscritas=${celdasEscritas} | ` +
      `CeldasConservadas=${celdasConservadas} | Copiadas=${copiadas} | ` +
      `Coinciden=${plan.filasMes.length} | NoCoinciden=${plan.noCoinciden} | ` +
      `Incidencias=${plan.incidencias.length}`);

    escribirLog_(logRows);
    return { actualizados, sinCambios, creados, bloqueados, copiadas,
             celdasEscritas, celdasConservadas, incidencias: plan.incidencias.length };

  } catch (err) {
    const info = clasificarError_(err);
    anota('ERROR', info.tipo, '', '', `${err.message} — Posible solución: ${info.solucion}`);
    anota('RESUMEN', 'ERROR', '', '', `Ejecución interrumpida: ${err.message}`);
    escribirLog_(logRows);
    throw err;
  } finally {
    lock.releaseLock();
  }
}

/****************************************************
 * CRUCE CON LA VINCULACIÓN: POR DNI Y, SI NO LO HAY, POR NOMBRE
 * Lo usan el volcado real y la simulación: lo que se ve al simular es lo que se escribe.
 ****************************************************/
function normalizarDni_(valor) {
  return String(valor === null || valor === undefined ? '' : valor).toUpperCase().replace(/[\s-]/g, '');
}

/** Solo la forma: DNI (8 cifras y letra) o NIE (X, Y o Z, 7 cifras y letra). */
function esDniValido_(dni) {
  return /^(\d{8}|[XYZ]\d{7})[A-Z]$/.test(dni);
}

/** El nombre sin tildes, comas ni mayúsculas y con las palabras ordenadas: solo para decir si «difiere». */
function nombreComparable_(nombre) {
  return normalizeKey(nombre).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').sort().join(' ');
}

function anadirAlIndice_(indice, fila, nombre, dni) {
  indice.filas.set(fila, { nombre, dni });
  const apuntar = (mapa, clave) => mapa.set(clave, (mapa.get(clave) || []).concat([fila]));
  if (nombre) apuntar(indice.porNombre, normalizeKey(nombre));
  if (esDniValido_(dni)) apuntar(indice.porDni, dni);
}

/** Las filas de la Vinculación por nombre (columna C) y por DNI (columna D). */
function indiceDestino_(tgtSheet) {
  const indice = { porNombre: new Map(), porDni: new Map(), filas: new Map() };
  const total = tgtSheet.getLastRow() - 1;
  if (total < 1) return indice;
  const nombres = tgtSheet.getRange(2, TARGET_NAME_COL, total, 1).getValues();
  const dnis = tgtSheet.getRange(2, TARGET_DNI_COL, total, 1).getValues();
  nombres.forEach((fila, i) => {
    anadirAlIndice_(indice, i + 2, (fila[0] || '').toString().trim(), normalizarDni_(dnis[i][0]));
  });
  return indice;
}

/**
 * Dónde va una persona: { accion: 'actualizar' | 'crear' | 'bloquear', fila, metodo: 'DNI' | 'NOMBRE' | 'NUEVA', avisos }.
 * Regla acordada: si el DNI coincide y el nombre no, SE VUELCA y se avisa. Si el nombre coincide y el DNI no, no.
 */
function resolverDestino_(item, indice) {
  const porNombre = indice.porNombre.get(item.clave) || [];
  const bloquear = (tipo, detalle) => ({ accion: 'bloquear', fila: 0, metodo: '', avisos: [{ tipo, detalle }] });
  const nombreRepetido = () => bloquear('NOMBRE_DUPLICADO_DESTINO',
    `Aparece en las filas ${porNombre.join(', ')} del destino. NO se escribe hasta resolver la ambigüedad.`);
  const nueva = { accion: 'crear', fila: 0, metodo: 'NUEVA', avisos: [] };

  if (!item.dni) {
    if (porNombre.length > 1) return nombreRepetido();
    return porNombre.length ? { accion: 'actualizar', fila: porNombre[0], metodo: 'NOMBRE', avisos: [] } : nueva;
  }

  const porDni = indice.porDni.get(item.dni) || [];
  if (porDni.length > 1) {
    return bloquear('DNI_REPETIDO_DESTINO',
      `El DNI ${item.dni} aparece en las filas ${porDni.join(', ')} del destino. NO se escribe hasta resolverlo.`);
  }
  if (porDni.length === 1) {
    const enDestino = indice.filas.get(porDni[0]).nombre;
    const avisos = nombreComparable_(enDestino) === nombreComparable_(item.displayName) ? [] : [{
      tipo: 'NOMBRE_DISTINTO',
      detalle: `Fila ${porDni[0]}: coincide el DNI ${item.dni}, pero en el destino figura «${enDestino}» y en la ` +
        `respuesta «${item.displayName}». Se vuelca.` }];
    return { accion: 'actualizar', fila: porDni[0], metodo: 'DNI', avisos };
  }
  if (porNombre.length > 1) return nombreRepetido();
  if (!porNombre.length) return nueva;
  const dniDestino = indice.filas.get(porNombre[0]).dni;
  if (esDniValido_(dniDestino)) {
    return bloquear('DNI_DISTINTO',
      `Fila ${porNombre[0]}: el nombre coincide, pero su DNI es ${dniDestino} y el de la respuesta ${item.dni}. NO se escribe.`);
  }
  return { accion: 'actualizar', fila: porNombre[0], metodo: 'NOMBRE', avisos: [{ tipo: 'SIN_DNI_EN_DESTINO',
    detalle: `Fila ${porNombre[0]}: la fila del destino no tiene un DNI válido; se cruza por nombre.` }] };
}

/** Los DNI que aparecen con cada nombre en las respuestas del periodo (para unir envíos antiguos sin DNI). */
function dnisDelPeriodoPorNombre_(values, dniDeFila, mesObjetivo, anioObjetivo) {
  const porNombre = new Map();
  values.forEach(row => {
    const nombre = (row[SOURCE_NAME_COL - 1] || '').toString().trim();
    const dni = dniDeFila(row);
    const ts = toDate_(row[SRC_TIMESTAMP_COL - 1]);
    const delPeriodo = normalizarMes_((row[SRC_MONTH_COL - 1] || '').toString().trim()) === mesObjetivo &&
      (!ts || ts.getFullYear() === anioObjetivo);
    if (!nombre || !dni || !delPeriodo) return;
    const k = normalizeKey(nombre);
    if (!porNombre.has(k)) porNombre.set(k, new Set());
    porNombre.get(k).add(dni);
  });
  return porNombre;
}

/** Qué cambiaría en las celdas AC..CN de una fila: lo usan el volcado y la simulación. */
function calcularCambios_(antes, item, cabeceras) {
  const despues = antes.slice();
  const cambios = [];
  let conservadas = 0;
  COLUMN_MAP.forEach(m => {
    const idx = m.dst - DST_FIRST_DATA_COL;
    const entrada = item.valores[m.dst];
    if (!entrada) {                       // el periodo no trae valor: NO se pisa
      if (!isEmpty(antes[idx])) conservadas++;
      return;
    }
    if (!valoresIguales_(antes[idx], entrada.valor)) {
      despues[idx] = entrada.valor;
      cambios.push(`${nombreColumna_(cabeceras, entrada.src)}: ${mostrar_(antes[idx])} → ${mostrar_(entrada.valor)}`);
    }
  });
  return { despues, cambios, conservadas };
}

/****************************************************
 * SIMULACIÓN (no escribe en la Vinculación ni en el histórico)
 ****************************************************/
const SIM_HEADERS = ['Profesor', 'DNI', 'Filas respuesta', 'Cómo cruza', 'Fila destino', 'Celdas que cambian',
                     'Cambios (antes → después)', 'Incidencias'];

/** Calcula lo que haría el volcado y lo deja en la hoja «simulacion_volcado» de este libro. */
function simularVolcado_(mes, anio) {
  try {
    const plan = analizarVolcado_(mes, Number(anio));
    const tgtSheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID).getSheetByName(TARGET_SHEET_NAME);
    if (!tgtSheet) throw new Error(`No existe la pestaña destino: "${TARGET_SHEET_NAME}".`);
    const indice = indiceDestino_(tgtSheet);
    let siguiente = tgtSheet.getLastRow() + 1;
    let bloqueadas = 0, conAvisos = 0;

    const filas = plan.aVolcar.map(item => {
      const destino = resolverDestino_(item, indice);
      const avisos = destino.avisos.map(a => `${a.tipo}: ${a.detalle}`).join(' | ');
      if (destino.avisos.length) conAvisos++;
      let fila = destino.fila, como = destino.metodo, cambios = [];
      if (destino.accion === 'bloquear') {
        bloqueadas++;
        como = 'NO CRUZA';
      } else {
        let antes = Array(COLUMN_MAP.length).fill('');
        if (destino.accion === 'crear') {
          fila = siguiente++;
          como = 'FILA NUEVA';
          anadirAlIndice_(indice, fila, item.displayName, item.dni);
        } else {
          antes = tgtSheet.getRange(fila, DST_FIRST_DATA_COL, 1, COLUMN_MAP.length).getValues()[0];
        }
        cambios = calcularCambios_(antes, item, plan.cabeceras).cambios;
      }
      return [item.displayName, item.dni, item.filas.join(' y '), como, fila || '', cambios.length,
              cambios.join(' | '), avisos];
    });

    const libro = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const hoja = libro.getSheetByName(SIM_SHEET_NAME) || libro.insertSheet(SIM_SHEET_NAME);
    hoja.clearContents();
    const incidencias = plan.incidencias.map(i =>
      [i.profesor || '', '', i.fila, 'INCIDENCIA', '', '', '', `${i.tipo}: ${i.detalle}`]);
    const todas = [SIM_HEADERS].concat(filas, incidencias);
    hoja.getRange(1, 1, todas.length, SIM_HEADERS.length).setValues(todas);

    return { ok: true, personas: filas.length, bloqueadas, conAvisos, incidencias: incidencias.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * SIMULAR: se ejecuta desde el editor de Apps Script (no está en el menú). Pide «MES AÑO» en la hoja de cálculo,
 * calcula lo que haría el volcado sin escribirlo y deja el detalle en la hoja «simulacion_volcado».
 */
function simularVolcado() {
  const ui = SpreadsheetApp.getUi();
  const respuesta = ui.prompt('Simular volcado', 'Escribe el mes y el año, por ejemplo: MARZO 2026', ui.ButtonSet.OK_CANCEL);
  if (respuesta.getSelectedButton() !== ui.Button.OK) return;
  const partes = respuesta.getResponseText().trim().split(/\s+/);
  const r = simularVolcado_(normalizarMes_(partes[0]) || partes[0], partes[1] || new Date().getFullYear());
  ui.alert(r.ok
    ? `Simulación hecha (no se ha escrito en la Vinculación).\nPersonas: ${r.personas}\nNo cruzan: ${r.bloqueadas}\n` +
      `Con avisos: ${r.conAvisos}\nRevisa la hoja «${SIM_SHEET_NAME}».`
    : `No se pudo simular: ${r.error}`);
}

/**
 * Separa las columnas «DNI_…» del resto. Se archivan DETRÁS del Run ID para no desplazar las columnas que ya tiene
 * el histórico.
 */
function separarColumnasDni_(cabeceraOrigen, fila) {
  const esDni = (i) => String(cabeceraOrigen[i] || '').indexOf('DNI_') === 0;
  return {
    base: fila.filter((_, i) => !esDni(i)),
    dni: fila.filter((_, i) => esDni(i))
  };
}

/**
 * COPIA las filas indicadas al histórico de ESTE libro.
 * NO borra ni modifica la hoja de respuestas.
 */
function copiarAHistorico_(filas, mesObjetivo, anioObjetivo, runId) {
  const srcSS = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  const srcSheet = srcSS.getSheetByName(SOURCE_SHEET_NAME);
  let arch = srcSS.getSheetByName(ARCHIVE_SHEET_NAME);
  const lastCol = Math.max(srcSheet.getLastColumn(), SRC_LAST_DATA_COL);
  const cabeceraOrigen = srcSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const cabecera = separarColumnasDni_(cabeceraOrigen, cabeceraOrigen);

  if (!arch) {
    // Si el histórico no existe, se crea con las cabeceras del formulario.
    arch = srcSS.insertSheet(ARCHIVE_SHEET_NAME);
    const cab = cabecera.base.concat(['Archivado en', 'Fecha de archivo', 'Run ID'], cabecera.dni);
    arch.getRange(1, 1, 1, cab.length).setValues([cab]);
    arch.setFrozenRows(1);
  } else if (cabecera.dni.length) {
    // Histórico anterior a las columnas DNI: se les pone cabecera detrás del Run ID, solo si ese hueco está libre.
    const hueco = arch.getRange(1, cabecera.base.length + 4, 1, cabecera.dni.length);
    if (hueco.getValues()[0].every((v) => v === '')) hueco.setValues([cabecera.dni]);
  }

  const ordenadas = filas.slice().sort((a, b) => a - b);
  const primera = ordenadas[0];
  const ultima = ordenadas[ordenadas.length - 1];
  const bruto = srcSheet.getRange(primera, 1, ultima - primera + 1, lastCol).getValues();

  const sello = `ARCHIVADO ${mesObjetivo} ${anioObjetivo}`;
  const bloque = ordenadas.map(f => {
    const fila = separarColumnasDni_(cabeceraOrigen, bruto[f - primera]);
    return fila.base.concat([sello, new Date(), runId], fila.dni);
  });

  arch.getRange(arch.getLastRow() + 1, 1, bloque.length, bloque[0].length).setValues(bloque);
  return bloque.length;
}

/****************************************************
 * LOG
 ****************************************************/
function escribirLog_(rows) {
  if (!rows || !rows.length) return;
  try {
    const ss = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    let sh = ss.getSheetByName(LOG_SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(LOG_SHEET_NAME);
      sh.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]);
      sh.setFrozenRows(1);
    }
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  } catch (e) {
    Logger.log(`No se pudo escribir en "${LOG_SHEET_NAME}": ${e.message}`);
  }
}

function registrarIncidenciaSuelta_(tipo, detalle) {
  let usuario = '';
  try { usuario = Session.getActiveUser().getEmail() || ''; } catch (e) { usuario = ''; }
  escribirLog_([[new Date(), '-', usuario, '-', 'ERROR', tipo, '', '', detalle]]);
}

function clasificarError_(error) {
  const msg = ((error && error.message) ? error.message : String(error)).toLowerCase();
  if (msg.indexOf('no existe la pestaña') > -1) {
    return { tipo: 'PESTANA_NO_ENCONTRADA',
      solucion: 'Revisa SOURCE_SHEET_NAME / TARGET_SHEET_NAME en las constantes del script.' };
  }
  if (msg.indexOf('permis') > -1 || msg.indexOf('access') > -1 || msg.indexOf('not found') > -1) {
    return { tipo: 'ACCESO_AL_DESTINO',
      solucion: 'La cuenta que ejecuta necesita permiso de Editor sobre VINCULACIÓN GASTOS PERSONAL.' };
  }
  if (msg.indexOf('lock') > -1 || msg.indexOf('bloque') > -1) {
    return { tipo: 'BLOQUEO',
      solucion: 'Otra ejecución está en curso. Espera unos segundos y reinténtalo.' };
  }
  if (msg.indexOf('maximum execution time') > -1 || msg.indexOf('tiempo de ejecución') > -1) {
    return { tipo: 'TIEMPO_EXCEDIDO',
      solucion: 'Demasiadas filas. Vuelca por partes o avisa para optimizar.' };
  }
  return { tipo: 'NO_CLASIFICADO',
    solucion: 'Revisa el detalle y el registro de Ejecuciones de Apps Script.' };
}

/****************************************************
 * HELPERS
 ****************************************************/

/** Normaliza nombres: trim, espacios colapsados, minúsculas, sin tildes. */
function normalizeKey(name) {
  const cleaned = (name || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
  return cleaned.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * ¿La celda está "vacía"? '', null, undefined y espacios cuentan como vacío,
 * PERO el número 0 (y el texto "0") son DATO válido y sí pisan.
 */
function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  return false; // números (incluido 0), fechas y booleanos son dato
}

/** Nombre legible de una columna de origen, para el log. */
function nombreColumna_(cabeceras, srcCol) {
  const c = (cabeceras && cabeceras[srcCol - 1]) ? cabeceras[srcCol - 1].toString().trim() : '';
  return c || `col ${srcCol}`;
}

function normalizarMes_(v) {
  const s = (v || '').toString().trim();
  if (!s) return null;

  const n = parseInt(s, 10);
  if (n >= 1 && n <= 12 && String(n) === s.replace(/^0+/, '')) return MESES[n - 1];

  const limpio = s.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (MESES.indexOf(limpio) > -1) return limpio;
  if (limpio.indexOf('SET') === 0) return 'SEPTIEMBRE';
  if (limpio.length >= 3) {
    const cand = MESES.filter(m => m.indexOf(limpio.slice(0, 3)) === 0);
    if (cand.length === 1) return cand[0];
  }
  return null;
}

function toDate_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (v === null || v === undefined || v === '') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function formatearFecha_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function mostrar_(v) {
  return (v === '' || v === null || v === undefined) ? '(vacío)' : v;
}

function esNumericoOVacio_(v) {
  if (v === '' || v === null || v === undefined) return true;
  if (typeof v === 'number') return isFinite(v);
  const s = v.toString().trim().replace(/[€\s]/g, '').replace(',', '.');
  return s === '' || !isNaN(Number(s));
}

function valoresIguales_(a, b) {
  if (a === b) return true;
  const va = (a === null || a === undefined) ? '' : a;
  const vb = (b === null || b === undefined) ? '' : b;
  if (va === '' && vb === '') return true;
  const na = Number(va), nb = Number(vb);
  if (va !== '' && vb !== '' && !isNaN(na) && !isNaN(nb)) return na === nb;
  return va.toString().trim() === vb.toString().trim();
}
