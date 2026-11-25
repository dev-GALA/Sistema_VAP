/**
 * =========================================================
 *  EXTRA SECRETARIAS 2026 -> VINCULACIÓN GASTOS PERSONAL
 *  (Instalar en el Spreadsheet de RESPUESTAS del formulario)
 * =========================================================
 *
 * ARCHIVOS DEL PROYECTO GAS:
 *   - Código.gs   <- este archivo
 *   - DialogoVolcado (HTML)  <- el desplegable de mes/año
 *
 * ORIGEN:
 *  - Spreadsheet: "EXTRA SECRETARIAS 2026 (respuestas)"
 *  - Hoja: "Respuestas de formulario"
 *      A  Marca temporal
 *      C  MES                  <- filtro de periodo
 *      E  SECRETARIA           <- cruce por nombre
 *      G  Nº HORAS EXTRA
 *      I  € OTROS EXTRAS
 *
 * DESTINO:
 *  - Spreadsheet: "VINCULACIÓN GASTOS PERSONAL"
 *  - Hoja: "Hoja 1"
 *  - Nombre empleado: Columna C
 *  - Volcado: Nº HORAS EXTRA -> AE ; € OTROS EXTRAS -> AH
 *
 * ── CÓMO SE USA ───────────────────────────────────────────
 *  1) Menú "VAP_Acciones" -> "Volcar Horas Extras del mes...".
 *  2) Se elige el mes en un DESPLEGABLE. Aparece preseleccionado
 *     el mes en curso según la fecha de ejecución.
 *  3) El script revisa la hoja de respuestas y muestra un informe
 *     de filas que coinciden y filas que no.
 *  4) La usuaria ACEPTA o CANCELA.
 *  5) Si acepta: exporta a VINCULACIÓN y copia las filas a
 *     la hoja "Anteriores".
 *
 * ── REGLAS DE VOLCADO ─────────────────────────────────────
 *  1) Una fila coincide cuando su MES (col C) es el mes elegido
 *     Y el año de su marca temporal es el año del periodo. Las
 *     que no coinciden se cuentan en el informe y no se tocan.
 *  2) Si una secretaria aparece varias veces en el mismo mes,
 *     gana el registro con la MARCA TEMPORAL más reciente.
 *     Así, reenviar el formulario funciona como corrección.
 *  3) Si la secretaria no existe en destino, se crea fila nueva.
 *  4) Las filas volcadas se COPIAN a la hoja "Anteriores".
 *
 * ── LA HOJA DE RESPUESTAS NO SE MODIFICA ──────────────────
 * El script NO borra ni mueve filas: solo lee. "Anteriores"
 * recibe una COPIA. Al filtrar por mes, ya no hace falta vaciar
 * la hoja de respuestas para que el volcado sea correcto.
 *
 * ── AUDITORÍA ─────────────────────────────────────────────
 * Todo queda en la hoja "LOG Volcado": los movimientos fila a
 * fila (antes→después) Y las incidencias y errores detectados
 * (filas sin mes, sin nombre, valores no numéricos, nombres
 * ambiguos en destino, fallos de acceso...). Cada ejecución se
 * identifica con un Run ID.
 */

/** === IDs (OBLIGATORIO) === */
const SOURCE_SPREADSHEET_ID = '1fW2bl9cVnDrTQei26S2qi4iZhT2OZnp-kNeFmVX5m0w';
const TARGET_SPREADSHEET_ID = '1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc';

// Hojas
const SOURCE_SHEET_NAME  = 'Respuestas de formulario';
const TARGET_SHEET_NAME  = 'Hoja 1';
const ARCHIVE_SHEET_NAME = 'Anteriores';
const LOG_SHEET_NAME     = 'LOG Volcado';
const SIM_SHEET_NAME     = 'simulacion_volcado';

// Columnas ORIGEN (1-based)
const SRC_TIMESTAMP_COL    = 1;  // A: Marca temporal
const SRC_MONTH_COL        = 3;  // C: MES
const SOURCE_NAME_COL      = 5;  // E: SECRETARIA
const SRC_HORAS_EXTRA_COL  = 7;  // G: Nº HORAS EXTRA
const SRC_OTROS_EXTRAS_COL = 9;  // I: € OTROS EXTRAS
const SRC_DNI_HEADER       = 'DNI_Secre'; // la escribe la sincronización; las respuestas antiguas no la tienen

// Columnas DESTINO (1-based)
const TARGET_NAME_COL      = 3;  // C
const TARGET_DNI_COL       = 4;  // D
const DST_HORAS_EXTRA_COL  = 31; // AE
const DST_OTROS_EXTRAS_COL = 34; // AH

/** Copiar a "Anteriores" las filas exportadas. Es una COPIA. */
const COPIAR_A_ANTERIORES = true;

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
               'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

const LOG_HEADERS = ['Timestamp', 'Run ID', 'Usuario', 'Periodo', 'Categoría',
                     'Tipo', 'Fila origen', 'Secretaria', 'Detalle'];

/****************************************************
 * MENÚ Y DIÁLOGO
 ****************************************************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('VAP_Acciones')
    .addItem('Volcar Horas Extras del mes...', 'abrirDialogoVolcado')
    .addToUi();
}

function abrirDialogoVolcado() {
  const html = HtmlService.createHtmlOutputFromFile('DialogoVolcado')
    .setWidth(520)
    .setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, 'Volcar Horas Extras');
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

/** Analiza sin escribir nada y devuelve el informe. Lo llama el diálogo. */
function vapAnalizarPeriodo(mes, anio) {
  try {
    const plan = analizarVolcado_(mes, Number(anio));
    return {
      ok: true,
      mes: mes,
      anio: Number(anio),
      totalFilas: plan.totalFilas,
      coinciden: plan.filasMes.length,
      secretarias: plan.aVolcar.length,
      corregidas: plan.corregidas.length,
      noCoinciden: plan.noCoinciden,
      porOtroMes: plan.porOtroMes,
      porOtroAnio: plan.porOtroAnio,
      sinMes: plan.sinMes,
      avisosFecha: plan.avisosFecha.length,
      incidencias: plan.incidencias.map(i => `${i.tipo} (fila ${i.fila}): ${i.detalle}`),
      destinoOcupado: plan.destinoOcupado,
      yaArchivado: plan.yaArchivado
    };
  } catch (err) {
    registrarIncidenciaSuelta_('ANALISIS', err.message);
    return { ok: false, error: err.message };
  }
}

/** Ejecuta la exportación. Lo llama el diálogo tras confirmar. */
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
    aVolcar: [], filasMes: [], corregidas: [], avisosFecha: [], incidencias: [],
    noCoinciden: 0, porOtroMes: 0, porOtroAnio: 0, sinMes: 0,
    totalFilas: 0, yaArchivado: false
  };

  const lastRow = srcSheet.getLastRow();
  if (lastRow < 2) return vacio;

  const lastCol = Math.max(srcSheet.getLastColumn(), SRC_OTROS_EXTRAS_COL);
  const values = srcSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const columnaDni = srcSheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf(SRC_DNI_HEADER);

  const envios = [];
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

    // Fila completamente vacía: se ignora en silencio.
    if (!displayName && !mesCrudo && !ts) continue;

    if (!displayName) {
      incidencias.push({ tipo: 'SIN_NOMBRE', fila: filaReal, secretaria: '',
        detalle: 'La columna E (SECRETARIA) está vacía. Fila descartada.' });
      continue;
    }

    if (!mesFila) {
      sinMes++;
      incidencias.push({ tipo: 'MES_NO_RECONOCIDO', fila: filaReal, secretaria: displayName,
        detalle: `La columna C dice "${mesCrudo}". No coincide con ningún mes.` });
      continue;
    }

    if (mesFila !== mesObjetivo) { porOtroMes++; continue; }

    const anioFila = ts ? ts.getFullYear() : null;
    if (anioFila !== null && anioFila !== anioObjetivo) { porOtroAnio++; continue; }

    if (!ts) {
      incidencias.push({ tipo: 'SIN_MARCA_TEMPORAL', fila: filaReal, secretaria: displayName,
        detalle: 'Sin marca temporal: no se puede validar el año. Se exporta igualmente.' });
    }

    filasMes.push(filaReal);

    // Coherencia entre el mes declarado y la marca temporal.
    if (ts && Math.abs(ts.getMonth() - MESES.indexOf(mesObjetivo)) > 1) {
      avisosFecha.push({ fila: filaReal, nombre: displayName,
        detalle: `Declara ${mesObjetivo} pero la marca temporal es ${formatearFecha_(ts)}` });
    }

    // Valores no numéricos: se exportan tal cual, pero se avisa.
    const horas = row[SRC_HORAS_EXTRA_COL - 1];
    const otros = row[SRC_OTROS_EXTRAS_COL - 1];
    if (!esNumericoOVacio_(horas)) {
      incidencias.push({ tipo: 'VALOR_NO_NUMERICO', fila: filaReal, secretaria: displayName,
        detalle: `Nº HORAS EXTRA = "${horas}" no es un número.` });
    }
    if (!esNumericoOVacio_(otros)) {
      incidencias.push({ tipo: 'VALOR_NO_NUMERICO', fila: filaReal, secretaria: displayName,
        detalle: `€ OTROS EXTRAS = "${otros}" no es un número.` });
    }

    const dni = columnaDni === -1 ? '' : normalizarDni_(row[columnaDni]);
    envios.push({ displayName, horas, otros, ts, fila: filaReal, dni: esDniValido_(dni) ? dni : '' });
  }

  const porSecretaria = agruparPorPersona_(envios, incidencias);

  const aVolcar = [];
  const corregidas = [];
  porSecretaria.forEach(v => {
    aVolcar.push({ clave: normalizeKey(v.displayName), ...v });
    if (v.filas.length > 1) corregidas.push({ nombre: v.displayName, filas: v.filas });
  });

  return {
    aVolcar, filasMes, corregidas, avisosFecha, incidencias,
    noCoinciden: porOtroMes + porOtroAnio + sinMes,
    porOtroMes, porOtroAnio, sinMes,
    totalFilas: values.length,
    destinoOcupado: contarCeldasOcupadasDestino_(aVolcar),
    yaArchivado: yaArchivado_(mesObjetivo, anioObjetivo)
  };
}

/**
 * Cuenta las celdas de AE y AH que YA tienen dato en el destino, para las
 * secretarias que se van a volcar.
 *
 * El proceso parte cada mes de una hoja de VINCULACIÓN limpia, así que el
 * resultado esperado es 0. Un número distinto indica que el destino conserva
 * datos de un volcado anterior: probablemente sea la hoja del mes pasado.
 * Se avisa ANTES de escribir nada.
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

    const ancho = DST_OTROS_EXTRAS_COL - DST_HORAS_EXTRA_COL + 1;
    const nombres = tgtSheet.getRange(2, TARGET_NAME_COL, lastRow - 1, 1).getValues();
    const datos = tgtSheet.getRange(2, DST_HORAS_EXTRA_COL, lastRow - 1, ancho).getValues();
    const iOtros = DST_OTROS_EXTRAS_COL - DST_HORAS_EXTRA_COL;

    let ocupadas = 0;
    for (let r = 0; r < nombres.length; r++) {
      const n = (nombres[r][0] || '').toString().trim();
      if (!n || !claves[normalizeKey(n)]) continue;
      if (!vacio_(datos[r][0]))      ocupadas++;   // AE
      if (!vacio_(datos[r][iOtros])) ocupadas++;   // AH
    }
    return ocupadas;
  } catch (e) {
    return -1; // no se ha podido comprobar; el informe lo indica
  }
}

/** ¿Está la celda vacía? El 0 cuenta como dato. */
function vacio_(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  return false;
}

/** ¿Hay ya filas de este periodo en el archivo? Avisa de duplicados. */
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
  const anota = (categoria, tipo, fila, secretaria, detalle) =>
    logRows.push([ahora, runId, usuario, periodo, categoria, tipo,
                  fila || '', secretaria || '', detalle || '']);

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

    // --- Incidencias detectadas en el análisis ---
    plan.incidencias.forEach(i => anota('INCIDENCIA', i.tipo, i.fila, i.secretaria, i.detalle));
    plan.avisosFecha.forEach(a => anota('INCIDENCIA', 'MARCA_TEMPORAL_FUERA_DE_MES', a.fila, a.nombre, a.detalle));
    plan.corregidas.forEach(c => anota('INCIDENCIA', 'VARIOS_ENVIOS', c.filas.join(','), c.nombre,
      'Vale el envío con marca temporal más reciente.'));

    let actualizadas = 0, sinCambios = 0, creadas = 0, bloqueadas = 0;

    plan.aVolcar.forEach(item => {
      const destino = resolverDestino_(item, indice);
      destino.avisos.forEach(a => anota(destino.accion === 'bloquear' ? 'ERROR' : 'INCIDENCIA', a.tipo, '',
        item.displayName, a.detalle));
      if (destino.accion === 'bloquear') {
        bloqueadas++;
        return;
      }

      let tgtRow = destino.fila;

      if (destino.accion === 'crear') {
        tgtRow = tgtSheet.getLastRow() + 1;
        tgtSheet.insertRowAfter(tgtSheet.getLastRow());
        tgtSheet.getRange(tgtRow, TARGET_NAME_COL).setValue(item.displayName);
        if (item.dni) tgtSheet.getRange(tgtRow, TARGET_DNI_COL).setValue(item.dni);
        anadirAlIndice_(indice, tgtRow, item.displayName, item.dni);
        creadas++;
        anota('MOVIMIENTO', 'FILA_NUEVA', '', item.displayName, `Creada en la fila ${tgtRow} del destino.`);
      }

      const antesHoras = tgtSheet.getRange(tgtRow, DST_HORAS_EXTRA_COL).getValue();
      const antesOtros = tgtSheet.getRange(tgtRow, DST_OTROS_EXTRAS_COL).getValue();

      const cambios = [];
      if (!valoresIguales_(antesHoras, item.horas)) {
        tgtSheet.getRange(tgtRow, DST_HORAS_EXTRA_COL).setValue(item.horas);
        cambios.push(`Nº horas (AE): ${mostrar_(antesHoras)} → ${mostrar_(item.horas)}`);
      }
      if (!valoresIguales_(antesOtros, item.otros)) {
        tgtSheet.getRange(tgtRow, DST_OTROS_EXTRAS_COL).setValue(item.otros);
        cambios.push(`€ otros (AH): ${mostrar_(antesOtros)} → ${mostrar_(item.otros)}`);
      }

      if (cambios.length) {
        actualizadas++;
        anota('MOVIMIENTO', 'ACTUALIZADO', '', item.displayName, `Fila ${tgtRow}. ${cambios.join(' | ')}`);
      } else {
        sinCambios++;
        anota('MOVIMIENTO', 'SIN_CAMBIO', '', item.displayName, `Fila ${tgtRow}. Ya tenía esos valores.`);
      }
    });

    // Copia al archivo.
    let copiadas = 0;
    if (COPIAR_A_ANTERIORES && plan.filasMes.length) {
      try {
        copiadas = copiarAAnteriores_(plan.filasMes, mesObjetivo, anioObjetivo, runId);
        anota('MOVIMIENTO', 'COPIA_ARCHIVO', '', '',
          `${copiadas} fila(s) copiadas a "${ARCHIVE_SHEET_NAME}".`);
      } catch (errCopia) {
        anota('ERROR', 'COPIA_ARCHIVO', '', '',
          `No se pudo copiar a "${ARCHIVE_SHEET_NAME}": ${errCopia.message}. ` +
          `El volcado a VINCULACIÓN sí se ha realizado.`);
      }
    }

    anota('RESUMEN', 'OK', '', '',
      `Actualizadas=${actualizadas} | SinCambio=${sinCambios} | Creadas=${creadas} | ` +
      `Bloqueadas=${bloqueadas} | Copiadas=${copiadas} | ` +
      `Coinciden=${plan.filasMes.length} | NoCoinciden=${plan.noCoinciden} | ` +
      `Incidencias=${plan.incidencias.length}`);

    escribirLog_(logRows);
    return { actualizadas, sinCambios, creadas, bloqueadas, copiadas,
             incidencias: plan.incidencias.length };

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

/**
 * Un grupo por persona: por DNI cuando lo hay. Los envíos sin DNI (antiguos) se unen al DNI de su nombre si ese
 * nombre solo tiene uno en el periodo. Vale el envío con la marca temporal más reciente.
 */
function agruparPorPersona_(envios, incidencias) {
  const dnisPorNombre = new Map();
  envios.filter(e => e.dni).forEach(e => {
    const k = normalizeKey(e.displayName);
    if (!dnisPorNombre.has(k)) dnisPorNombre.set(k, new Set());
    dnisPorNombre.get(k).add(e.dni);
  });

  const grupos = new Map();
  envios.forEach(e => {
    const dnis = dnisPorNombre.get(normalizeKey(e.displayName));
    let dni = e.dni;
    if (!dni && dnis && dnis.size === 1) dni = Array.from(dnis)[0];
    if (!dni && dnis && dnis.size > 1) {
      incidencias.push({ tipo: 'DNI_AMBIGUO', fila: e.fila, secretaria: e.displayName,
        detalle: 'Envío sin DNI y ese nombre tiene varios DNI en el periodo: se cruza por nombre.' });
    }
    const clave = dni ? `d:${dni}` : `n:${normalizeKey(e.displayName)}`;
    const previo = grupos.get(clave);
    if (!previo) {
      grupos.set(clave, { displayName: e.displayName, dni, horas: e.horas, otros: e.otros, ts: e.ts, filas: [e.fila] });
      return;
    }
    previo.filas.push(e.fila);
    if (!previo.ts || !e.ts || e.ts.getTime() >= previo.ts.getTime()) {
      Object.assign(previo, { displayName: e.displayName, horas: e.horas, otros: e.otros, ts: e.ts });
    }
  });
  return grupos;
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

/****************************************************
 * SIMULACIÓN (no escribe en la Vinculación ni en el histórico)
 ****************************************************/
const SIM_HEADERS = ['Secretaria', 'DNI', 'Filas respuesta', 'Cómo cruza', 'Fila destino', 'Horas antes',
                     'Horas nuevas', 'Otros antes', 'Otros nuevos', 'Incidencias'];

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
      let fila = destino.fila, antesHoras = '', antesOtros = '', como = destino.metodo;
      if (destino.accion === 'bloquear') {
        bloqueadas++;
        como = 'NO CRUZA';
      } else if (destino.accion === 'crear') {
        fila = siguiente++;
        como = 'FILA NUEVA';
        anadirAlIndice_(indice, fila, item.displayName, item.dni);
      } else {
        antesHoras = tgtSheet.getRange(fila, DST_HORAS_EXTRA_COL).getValue();
        antesOtros = tgtSheet.getRange(fila, DST_OTROS_EXTRAS_COL).getValue();
      }
      return [item.displayName, item.dni, item.filas.join(' y '), como, fila || '', antesHoras, item.horas,
              antesOtros, item.otros, avisos];
    });

    const libro = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
    const hoja = libro.getSheetByName(SIM_SHEET_NAME) || libro.insertSheet(SIM_SHEET_NAME);
    hoja.clearContents();
    const incidencias = plan.incidencias.map(i =>
      [i.secretaria || '', '', i.fila, 'INCIDENCIA', '', '', '', '', '', `${i.tipo}: ${i.detalle}`]);
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
 * COPIA las filas indicadas a la hoja de archivo.
 * NO borra ni modifica la hoja de respuestas: solo lee de ella.
 */
function copiarAAnteriores_(filas, mesObjetivo, anioObjetivo, runId) {
  const srcSS = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID);
  const srcSheet = srcSS.getSheetByName(SOURCE_SHEET_NAME);
  let arch = srcSS.getSheetByName(ARCHIVE_SHEET_NAME);
  if (!arch) arch = srcSS.insertSheet(ARCHIVE_SHEET_NAME);

  const lastCol = Math.max(srcSheet.getLastColumn(), SRC_OTROS_EXTRAS_COL);
  const ordenadas = filas.slice().sort((a, b) => a - b);

  const primera = ordenadas[0];
  const ultima = ordenadas[ordenadas.length - 1];
  const bruto = srcSheet.getRange(primera, 1, ultima - primera + 1, lastCol).getValues();

  const sello = `ARCHIVADO ${mesObjetivo} ${anioObjetivo}`;
  const cabeceraOrigen = srcSheet.getRange(1, 1, 1, lastCol).getValues()[0];
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

/** Registra un fallo ocurrido fuera de una ejecución (p. ej. en el análisis). */
function registrarIncidenciaSuelta_(tipo, detalle) {
  let usuario = '';
  try { usuario = Session.getActiveUser().getEmail() || ''; } catch (e) { usuario = ''; }
  escribirLog_([[new Date(), '-', usuario, '-', 'ERROR', tipo, '', '', detalle]]);
}

/** Traduce un error a un tipo legible con una posible solución. */
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
      solucion: 'Demasiadas filas. Avisa para optimizar el volcado.' };
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

/** Devuelve el mes en el formato de MESES, o null si no se reconoce. */
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

/** Vacío o interpretable como número (admite coma decimal y €). */
function esNumericoOVacio_(v) {
  if (v === '' || v === null || v === undefined) return true;
  if (typeof v === 'number') return isFinite(v);
  const s = v.toString().trim().replace(/[€\s]/g, '').replace(',', '.');
  return s === '' || !isNaN(Number(s));
}

/** Compara tratando 3 y "3" como iguales; '' y null como equivalentes. */
function valoresIguales_(a, b) {
  if (a === b) return true;
  const va = (a === null || a === undefined) ? '' : a;
  const vb = (b === null || b === undefined) ? '' : b;
  if (va === '' && vb === '') return true;
  const na = Number(va), nb = Number(vb);
  if (va !== '' && vb !== '' && !isNaN(na) && !isNaN(nb)) return na === nb;
  return va.toString().trim() === vb.toString().trim();
}
