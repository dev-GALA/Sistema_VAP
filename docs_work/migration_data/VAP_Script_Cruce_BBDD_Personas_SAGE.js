/****************************************************************************************
 * VAP · CRUCE BBDD PERSONAS ↔ SAGE
 * ---------------------------------------------------------------------------------------
 * Uso único. Cruza VAP_Secretarias y VAP_Profesores con el export de empleados de SAGE
 * para asignar el DNI y revisar Id_Sage, Empresa y fechas de alta/baja.
 *
 * NO MODIFICA NINGUNA HOJA EXISTENTE. Crea tres hojas nuevas:
 *   · VAP_Secretarias_CRUCE   — copia de VAP_Secretarias, con DNI y datos de SAGE
 *   · VAP_Profesores_CRUCE    — copia de VAP_Profesores, con DNI y datos de SAGE
 *   · VAP_Cruce_Incidencias   — todo lo que no cuadra, con su tipo y el dato que difiere
 *   · VAP_Staff               — personal de alta en SAGE que no es secretaria ni profesor
 *
 * AVISO: crear hojas dispara onSpreadsheetChangeTrigger del proyecto de secretarias
 * (changeType INSERT_GRID, que no filtra por nombre de hoja) y resincroniza el
 * desplegable del formulario real. El efecto es inocuo —relee VAP_Secretarias, que no
 * cambia— pero conviene saberlo.
 *
 * Punto de entrada: cruzarBBDDConSage()
 ****************************************************************************************/

/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 1) CONFIGURACIÓN — lo que puede cambiar vive aquí, no en la lógica
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

const CFG = {
  SPREADSHEET_ID: '1HQMxubwPv-vrslsXj5DvsB0gJ9OyewVNDmbPg1hjmHk',

  // El CSV de SAGE en Drive. Si CSV_FILE_ID está relleno manda sobre el nombre.
  CSV_FILE_ID: '',
  CSV_NOMBRE: 'Empleados_070926.csv',
  CSV_SEPARADOR: ';',
  CSV_CHARSET: 'ISO-8859-1',

  // Cabeceras esperadas en el CSV de SAGE
  CSV_COL: {
    empresa: 'Razón social',
    codigo: 'Código',
    nombre: 'Apellidos y nombre',
    dni: 'Dni',
    alta: 'Alta',
    baja: 'Baja'
  },

  ORIGEN: {
    secretarias: { hoja: 'VAP_Secretarias', colNombre: 'Nombre_Secretaria', colId: 'ID_Secre',    colFechaAlta: 'Fecha Alta',  colFechaBaja: 'Fecha Baja',  tipologia: false },
    profesores:  { hoja: 'VAP_Profesores',  colNombre: 'Nombre',            colId: 'ID_Profesor', colFechaAlta: 'Fecha_Alta',  colFechaBaja: 'Fecha_Baja',  tipologia: true  }
  },

  DESTINO: {
    secretarias: 'VAP_Secretarias_CRUCE',
    profesores:  'VAP_Profesores_CRUCE',
    incidencias: 'VAP_Cruce_Incidencias',
    staff: 'VAP_Staff'
  },

  // P11 · no traer de SAGE gente de baja desde hace más de N años
  ANIOS_MAX_BAJA: 5,

  // En SAGE, la serie de códigos a partir de 1000 no es plantilla: son proveedores y
  // colaboradores (notarías, registros mercantiles, profesionales sueltos). 149 registros
  // del export. No se listan como altas pendientes de la BBDD.
  SERIE_PROVEEDORES_DESDE: 1000,

  // P10 · de dónde sale el nombre que se escribe en la copia:
  //   'BBDD_LIMPIO' — el de la BBDD, con espacios y comas normalizados y abreviaturas
  //                   desplegadas (Mª → MARIA, FCO. → FRANCISCO). Formato APELLIDOS, NOMBRE.
  //   'SAGE'        — literalmente el de SAGE. OJO: SAGE trunca el nombre de pila a 10
  //                   caracteres (367 de los 1.430 registros del export miden exactamente 10),
  //                   así que esto convierte "MARIA TERESA" en "MARIA TERE".
  NOMBRE_DESDE: 'BBDD_LIMPIO',

  COLORES: {
    P1_DUPLICADO:        '#FCE5CD', // naranja claro
    P2_SIN_BAJA_ANTERIOR:'#FFF2CC', // amarillo claro
    P3_EN_AMBAS_HOJAS:   '#D9D2E9', // morado
    P5_NO_ES_PERSONA:    '#F4CCCC', // rojo claro
    P8_DISCREPANCIA:     '#CFE2F3', // azul claro
    SIN_MATCH:           '#EFEFEF', // gris — no se ha encontrado en SAGE
    NINGUNO:             null
  },

  // Prioridad de pintado cuando una fila acumula varias incidencias.
  // Todas quedan igualmente listadas en la columna Revisión y en la hoja de incidencias.
  PRIORIDAD_COLOR: ['P5_NO_ES_PERSONA', 'P3_EN_AMBAS_HOJAS', 'P1_DUPLICADO', 'P2_SIN_BAJA_ANTERIOR', 'P8_DISCREPANCIA', 'SIN_MATCH']
};

/**
 * P6 · Armonización de empresas. Cada razón social de SAGE y cada variante escrita en la
 * BBDD se traduce a un único nombre canónico, que es el que se escribe en la copia y el
 * que alimenta el desplegable de la columna Empresa.
 */
const EMPRESAS = {
  // Nombre canónico → variantes que hay que reconocer (SAGE y BBDD)
  'GALA':          ['AUTOESCUELA GALA S.L.', 'GALA'],
  'ARCOVIAL':      ['ARCO VIAL, S.L.', 'ARCOVIAL'],
  'CERVANTES':     ['SERVICIOS EMPRESARIALES CERVANTES,', 'SERVICIOS EMPRESARIALES CERVANTES', 'CERVANTES'],
  'VALDEARROYOS':  ['VALDEARROYOS, S.L.', 'VALDEARROYOS'],
  'DRIVERS':       ['DRIVERS FORMACION Y EMPLEO DE CONDUCTORES', 'DRIVERS'],
  'LOGYFOR':       ['LOGYFOR-ASOCIACION DE CENTROS DE FORMACION EN', 'LOGYFOR'],
  'INTERCASTILLA': ['INTERCASTILLA'],
  'JOSE':          ['JOSE']
};

/** Empresas dentro del ámbito del sistema VAP. Lo de fuera no se lista como alta pendiente. */
const EMPRESAS_EN_AMBITO = ['GALA', 'ARCOVIAL', 'CERVANTES', 'VALDEARROYOS', 'DRIVERS', 'LOGYFOR', 'INTERCASTILLA', 'JOSE'];

/** P5 · Patrones que delatan que una fila no es una persona física. */
const PATRONES_NO_PERSONA = [
  /\([^)]*\)/,        // alias entre paréntesis: LIMPIEZA PARLA (JHOANA).
                      // Un paréntesis sin cerrar suele ser solo la truncación de SAGE.
  /LIMPIEZA/i,
  /NOTARI/i,
  /REGISTRO/i,
  /MERCANTIL/i,
  /\bC\.?B\.?\b/i,
  /\bS\.?L\.?U?\b/i,
  /ASOCIACION/i
];

/** Partículas que se ignoran al comparar nombres: en SAGE viajan de sitio. */
const PARTICULAS = ['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y'];

/** Abreviaturas que sí se pueden desplegar sin inventar. */
const ABREVIATURAS = [
  [/\bM[ªº]\.?/gi, 'MARIA'], [/\bM\.ª\.?/gi, 'MARIA'], [/\bMA\.(?=\s|$)/gi, 'MARIA'],
  [/\bFCO\.?(?=\s|$)/gi, 'FRANCISCO'], [/\bFCA\.?(?=\s|$)/gi, 'FRANCISCA'],
  [/\bANT\.(?=\s|$)/gi, 'ANTONIO']
];


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 2) PUNTO DE ENTRADA
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function cruzarBBDDConSage() {
  const ss = SpreadsheetApp.openById(CFG.SPREADSHEET_ID);

  const sage = leerCsvSage_();
  Logger.log('SAGE: %s registros leídos', sage.length);

  const indices = indexarSage_(sage);

  const bloques = {};
  Object.keys(CFG.ORIGEN).forEach(function (clave) {
    bloques[clave] = leerHojaBBDD_(ss, CFG.ORIGEN[clave], clave);
    Logger.log('%s: %s filas leídas', CFG.ORIGEN[clave].hoja, bloques[clave].length);
  });

  // Emparejar cada fila de la BBDD con SAGE
  Object.keys(bloques).forEach(function (clave) {
    bloques[clave].forEach(function (fila) { emparejar_(fila, indices); });
  });

  const incidencias = detectarIncidencias_(bloques, sage);

  Object.keys(bloques).forEach(function (clave) {
    escribirHojaCopia_(ss, bloques[clave], CFG.ORIGEN[clave], CFG.DESTINO[clave]);
  });
  escribirIncidencias_(ss, incidencias);
  escribirStaff_(ss, construirStaff_(sage, bloques));

  const resumen = resumir_(bloques, incidencias);
  Logger.log(resumen);
  try { SpreadsheetApp.getActiveSpreadsheet().toast('Cruce terminado. Revisa VAP_Cruce_Incidencias.', 'VAP', 10); }
  catch (e) { /* script no vinculado a la hoja: el resumen queda en el Logger */ }
  return resumen;
}


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 3) LECTURA — BBDD
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function leerHojaBBDD_(ss, cfgOrigen, clave) {
  const hoja = ss.getSheetByName(cfgOrigen.hoja);
  if (!hoja) throw new Error('No existe la hoja "' + cfgOrigen.hoja + '"');

  const datos = hoja.getRange(1, 1, hoja.getLastRow(), hoja.getLastColumn()).getValues();
  const cab = datos[0].map(function (c) { return String(c).trim(); });

  const col = {
    empresa:    cab.indexOf('Empresa'),
    idSage:     cab.indexOf('Id_Sage'),
    id:         cab.indexOf(cfgOrigen.colId),
    nombre:     cab.indexOf(cfgOrigen.colNombre),
    alta:       cab.indexOf('Alta'),
    fechaAlta:  cab.indexOf(cfgOrigen.colFechaAlta),
    fechaBaja:  cab.indexOf(cfgOrigen.colFechaBaja),
    tipologia:  cab.indexOf('Tipología_Profesor')
  };
  ['empresa', 'idSage', 'id', 'nombre', 'alta'].forEach(function (k) {
    if (col[k] === -1) throw new Error('Falta la columna "' + k + '" en ' + cfgOrigen.hoja);
  });

  const filas = [];
  for (let i = 1; i < datos.length; i++) {
    const f = datos[i];
    const nombre = String(f[col.nombre] || '').trim();
    const empresa = String(f[col.empresa] || '').trim();
    if (!nombre && !empresa) continue; // fila vacía

    filas.push({
      origen: clave,
      filaOriginal: i + 1,
      empresaBBDD: empresa,
      empresaCanon: canonizarEmpresa_(empresa),
      idSageBBDD: normalizarCodigo_(f[col.idSage]),
      idBBDD: String(f[col.id] || '').trim(),
      nombreBBDD: nombre,
      nombreLimpio: limpiarNombre_(nombre),
      tokens: tokens_(nombre),
      altaBBDD: f[col.alta] === true,
      fechaAltaBBDD: f[col.fechaAlta],
      fechaBajaBBDD: f[col.fechaBaja],
      tipologia: col.tipologia !== -1 ? f[col.tipologia] : '',
      match: null,
      nivelMatch: '',
      viaMatch: '',
      candidatos: [],
      marcas: [],
      revision: [],
      avisos: []
    });
  }
  return filas;
}


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 4) LECTURA — CSV de SAGE
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function leerCsvSage_() {
  const archivo = localizarCsv_();
  let matriz;

  if (archivo.getMimeType() === MimeType.GOOGLE_SHEETS) {
    const hoja = SpreadsheetApp.openById(archivo.getId()).getSheets()[0];
    matriz = hoja.getRange(1, 1, hoja.getLastRow(), hoja.getLastColumn()).getValues()
      .map(function (f) { return f.map(function (c) { return c instanceof Date ? formatoFecha_(c) : String(c); }); });
  } else {
    const texto = archivo.getBlob().getDataAsString(CFG.CSV_CHARSET);
    matriz = Utilities.parseCsv(texto, CFG.CSV_SEPARADOR);
  }

  const cab = matriz[0].map(function (c) { return String(c).replace(/^﻿/, '').trim(); });
  const col = {};
  Object.keys(CFG.CSV_COL).forEach(function (k) {
    col[k] = cab.indexOf(CFG.CSV_COL[k]);
    if (col[k] === -1) throw new Error('El CSV no trae la columna "' + CFG.CSV_COL[k] + '". Cabeceras: ' + cab.join(' | '));
  });

  const registros = [];
  for (let i = 1; i < matriz.length; i++) {
    const f = matriz[i];
    const nombre = String(f[col.nombre] || '').trim();
    if (!nombre) continue; // filas de "Empresa demostración" sin nombre

    const empresaSage = String(f[col.empresa] || '').trim();
    registros.push({
      filaCsv: i + 1,
      empresaSage: empresaSage,
      empresaCanon: canonizarEmpresa_(empresaSage),
      codigo: normalizarCodigo_(f[col.codigo]),
      nombreSage: nombre,
      tokens: tokens_(nombre),
      dni: String(f[col.dni] || '').trim().toUpperCase(),
      fechaAlta: parsearFecha_(f[col.alta]),
      fechaBaja: parsearFecha_(f[col.baja])
    });
  }
  return registros;
}

function localizarCsv_() {
  if (CFG.CSV_FILE_ID) return DriveApp.getFileById(CFG.CSV_FILE_ID);
  const it = DriveApp.getFilesByName(CFG.CSV_NOMBRE);
  if (!it.hasNext()) throw new Error('No encuentro "' + CFG.CSV_NOMBRE + '" en Drive. Súbelo o rellena CFG.CSV_FILE_ID.');
  const archivo = it.next();
  if (it.hasNext()) throw new Error('Hay más de un archivo llamado "' + CFG.CSV_NOMBRE + '". Rellena CFG.CSV_FILE_ID con el que toca.');
  return archivo;
}


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 5) NORMALIZACIÓN Y COMPARACIÓN DE NOMBRES
 *
 * SAGE trunca el nombre de pila a 10 caracteres (367 de los 1.430 registros del export
 * miden exactamente 10). Por eso la comparación es por prefijo: "MARIA TERE" tiene que
 * casar con "MARIA TERESA". Además las partículas viajan de sitio entre los dos sistemas
 * ("LEÓN TORIBIO, NURIA DE" en la BBDD es "LEON DE TORIBIO, NURIA" en SAGE), así que se
 * compara por conjunto de tokens sin partículas, no por cadena.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function normalizar_(txt) {
  return String(txt || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // fuera tildes
    .replace(/ª/g, 'A').replace(/º/g, 'O')   // ª º
    .toUpperCase()
    .replace(/[^A-ZÑ0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandirAbreviaturas_(txt) {
  let s = String(txt || '');
  ABREVIATURAS.forEach(function (par) { s = s.replace(par[0], par[1]); });
  return s;
}

/** Nombre en formato "APELLIDOS, NOMBRE": espacios colapsados, coma bien puesta, abreviaturas desplegadas. */
function limpiarNombre_(nombre) {
  let s = expandirAbreviaturas_(String(nombre || ''))
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim()
    .replace(/,$/, '');
  return s;
}

function tokens_(nombre) {
  return normalizar_(expandirAbreviaturas_(nombre))
    .split(' ')
    .filter(function (t) { return t && PARTICULAS.indexOf(t) === -1; })
    .sort();
}

function levenshtein1_(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, dif = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++dif > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return dif + (a.length - i) + (b.length - j) <= 1;
}

function prefijoDe_(corto, largo) {
  return corto.length >= 1 && largo.indexOf(corto) === 0;
}

/**
 * ¿Pueden ser el mismo token? Devuelve 'exacto', 'prefijo', 'prefijo-debil' (1-2 caracteres,
 * típico de la truncación de SAGE y de iniciales tipo "M CARMEN" o "K. JULIANA"), o null.
 */
function tokensCompatibles_(a, b) {
  if (a === b) return 'exacto';
  const corto = a.length <= b.length ? a : b;
  const largo = a.length <= b.length ? b : a;
  if (prefijoDe_(corto, largo)) return corto.length >= 3 ? 'prefijo' : 'prefijo-debil';
  if (corto.length >= 4 && levenshtein1_(a, b)) return 'prefijo';   // errata de un carácter
  return null;
}

/**
 * Compara dos conjuntos de tokens en dos pasadas: primero los idénticos, después los
 * compatibles. Así "MARIA" no se come el hueco de "MARI" cuando ambos están presentes.
 *
 * Salvaguarda: si el emparejado se ha apoyado en algún prefijo de 1-2 caracteres, exige al
 * menos dos tokens idénticos. Sin ella, una inicial suelta casaría con medio censo.
 */
function compararTokens_(tA, tB) {
  if (!tA.length || !tB.length) return { nivel: null, sobran: 99, exactos: 0 };

  const corto = tA.length <= tB.length ? tA.slice() : tB.slice();
  const largo = tA.length <= tB.length ? tB.slice() : tA.slice();
  const usados = largo.map(function () { return false; });
  const resuelto = corto.map(function () { return false; });

  let exactos = 0, casados = 0, debiles = 0;

  for (let i = 0; i < corto.length; i++) {              // pasada 1: idénticos
    for (let j = 0; j < largo.length; j++) {
      if (usados[j] || corto[i] !== largo[j]) continue;
      usados[j] = true; resuelto[i] = true; exactos++; casados++;
      break;
    }
  }
  for (let i = 0; i < corto.length; i++) {              // pasada 2: compatibles
    if (resuelto[i]) continue;
    for (let j = 0; j < largo.length; j++) {
      if (usados[j]) continue;
      const tipo = tokensCompatibles_(corto[i], largo[j]);
      if (!tipo) continue;
      usados[j] = true; resuelto[i] = true; casados++;
      if (tipo === 'prefijo-debil') debiles++;
      break;
    }
  }

  if (resuelto.indexOf(false) !== -1) return { nivel: null, sobran: 99, exactos: exactos };
  if (casados < 2) return { nivel: null, sobran: 99, exactos: exactos };
  if (debiles > 0 && exactos < 2) return { nivel: null, sobran: 99, exactos: exactos };

  const sobran = largo.length - casados;
  if (sobran > 2) return { nivel: null, sobran: sobran, exactos: exactos };
  if (sobran === 0 && exactos === casados) return { nivel: 'exacto', sobran: 0, exactos: exactos };
  if (sobran === 0) return { nivel: 'normalizado', sobran: 0, exactos: exactos };
  return { nivel: 'parcial', sobran: sobran, exactos: exactos };
}

const PESO_NIVEL = { exacto: 4, normalizado: 3, parcial: 2, 'por-id': 1 };


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 6) EMPAREJADO
 *
 * Tres pasadas, de más fiable a menos:
 *   A · (empresa canónica + Id_Sage) y el nombre confirma
 *   B · nombre dentro de la misma empresa
 *   C · nombre en cualquier empresa  →  la empresa de la BBDD discrepa (P8)
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function indexarSage_(registros) {
  const porClave = {}, porEmpresa = {};
  registros.forEach(function (r) {
    const k = r.empresaCanon + '|' + r.codigo;
    (porClave[k] = porClave[k] || []).push(r);
    (porEmpresa[r.empresaCanon] = porEmpresa[r.empresaCanon] || []).push(r);
  });
  return { porClave: porClave, porEmpresa: porEmpresa, todos: registros };
}

function emparejar_(fila, indices) {
  // ── Pasada A: empresa + Id_Sage
  const porClave = fila.idSageBBDD ? (indices.porClave[fila.empresaCanon + '|' + fila.idSageBBDD] || []) : [];
  for (let i = 0; i < porClave.length; i++) {
    const cmp = compararTokens_(fila.tokens, porClave[i].tokens);
    if (cmp.nivel) { asignar_(fila, porClave[i], cmp.nivel, 'empresa+id'); return; }
  }
  // El identificador es clave fuerte: con dos tokens idénticos basta para aceptarlo,
  // pero queda marcado porque el nombre no confirma.
  for (let i = 0; i < porClave.length; i++) {
    if (compararTokens_(fila.tokens, porClave[i].tokens).exactos >= 2) {
      asignar_(fila, porClave[i], 'por-id', 'empresa+id');
      const aviso = 'Casa por Empresa+Id_Sage pero el nombre no confirma: BBDD "' + fila.nombreBBDD + '" vs SAGE "' + porClave[i].nombreSage + '"';
      fila.revision.push(aviso); fila.avisos.push(aviso);
      return;
    }
  }

  // ── Pasada B: nombre dentro de la empresa
  const enEmpresa = indices.porEmpresa[fila.empresaCanon] || [];
  if (elegirMejor_(fila, enEmpresa, 'nombre en empresa')) return;

  // ── Pasada C: nombre en cualquier empresa
  if (elegirMejor_(fila, indices.todos, 'nombre global')) return;

  // ── Sin match: si la pasada A tenía candidato por id pero el nombre no confirmaba, se anota
  if (porClave.length) {
    fila.candidatos = porClave.map(function (r) { return r.nombreSage + ' (' + r.empresaCanon + ' ' + r.codigo + ')'; });
  }
}

function elegirMejor_(fila, candidatos, via) {
  let mejores = [], mejorPeso = 0;
  for (let i = 0; i < candidatos.length; i++) {
    const cmp = compararTokens_(fila.tokens, candidatos[i].tokens);
    if (!cmp.nivel) continue;
    const peso = PESO_NIVEL[cmp.nivel];
    if (peso > mejorPeso) { mejorPeso = peso; mejores = [{ r: candidatos[i], nivel: cmp.nivel }]; }
    else if (peso === mejorPeso) mejores.push({ r: candidatos[i], nivel: cmp.nivel });
  }
  if (!mejores.length) return false;

  // Varias filas de SAGE para la misma persona: es lo normal si ha cambiado de empresa.
  // Se elige la del alta más reciente y se guardan las demás como historial.
  const dnis = {};
  mejores.forEach(function (m) { dnis[m.r.dni] = true; });

  mejores.sort(function (a, b) {
    return (b.r.fechaAlta ? b.r.fechaAlta.getTime() : 0) - (a.r.fechaAlta ? a.r.fechaAlta.getTime() : 0);
  });

  // Preferir, a igualdad de nivel, el registro de la misma empresa que la BBDD
  const mismaEmpresa = mejores.filter(function (m) { return m.r.empresaCanon === fila.empresaCanon; });
  const elegido = mismaEmpresa.length ? mismaEmpresa[0] : mejores[0];

  asignar_(fila, elegido.r, elegido.nivel, via);
  fila.candidatos = mejores.map(function (m) { return m.r.empresaCanon + ' ' + m.r.codigo + ' · ' + m.r.nombreSage + ' · ' + m.r.dni; });
  if (Object.keys(dnis).length > 1) {
    const aviso = 'AMBIGUO: ' + Object.keys(dnis).length + ' DNI distintos casan con este nombre';
    fila.revision.push(aviso); fila.avisos.push(aviso);
  }
  return true;
}

function asignar_(fila, registro, nivel, via) {
  fila.match = registro;
  fila.nivelMatch = nivel;
  fila.viaMatch = via;
}


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 7) INCIDENCIAS
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function detectarIncidencias_(bloques, sage) {
  const inc = [];
  const claves = Object.keys(bloques);
  const todas = [];
  claves.forEach(function (c) { bloques[c].forEach(function (f) { todas.push(f); }); });

  const claveDe = function (f) { return f.match ? 'DNI:' + f.match.dni : 'NOM:' + f.tokens.join(' '); };

  // Valores tal y como quedan escritos en la hoja copia, no como estaban en la BBDD.
  const empresaFinal = function (f) { return f.match ? f.match.empresaCanon : f.empresaCanon; };
  const idFinal = function (f) { return f.match ? f.match.codigo : f.idSageBBDD; };

  // ── P5 · filas que no son personas
  todas.forEach(function (f) {
    if (PATRONES_NO_PERSONA.some(function (re) { return re.test(f.nombreBBDD); })) {
      marcar_(f, 'P5_NO_ES_PERSONA', 'No parece una persona física');
      inc.push(fila_('P5', f, 'La fila no parece una persona física', f.nombreBBDD, ''));
    }
  });

  // ── P1 · duplicados dentro de la misma hoja Y la misma empresa
  claves.forEach(function (clave) {
    const grupos = agrupar_(bloques[clave], function (f) { return claveDe(f) + '|' + empresaFinal(f) + '|' + idFinal(f); });
    Object.keys(grupos).forEach(function (k) {
      const g = grupos[k];
      if (g.length < 2) return;
      const donde = empresaFinal(g[0]) + ' ' + idFinal(g[0]);
      const origen = g.map(function (x) { return x.filaOriginal; }).join(', ');
      g.forEach(function (f) {
        marcar_(f, 'P1_DUPLICADO', 'DUPLICADA · ' + g.length + ' filas de esta misma persona en ' + donde +
          '. Están juntas aquí debajo. Vienen de las filas ' + origen + ' de ' + CFG.ORIGEN[clave].hoja +
          ' (ver columna Fila_Origen; NO son los números de fila de esta copia, que va reordenada)');
      });
      inc.push(fila_('P1', g[0], g.length + ' filas duplicadas en ' + CFG.ORIGEN[clave].hoja + ' para ' + donde,
        'filas ' + origen + ' de ' + CFG.ORIGEN[clave].hoja, ''));
    });
  });

  // ── P2 · misma persona activa en más de una empresa (cambio sin baja en la anterior)
  const porPersona = agrupar_(todas, claveDe);
  Object.keys(porPersona).forEach(function (k) {
    const g = porPersona[k];
    const empresas = {};
    g.forEach(function (f) { empresas[empresaFinal(f)] = true; });
    if (Object.keys(empresas).length < 2) return;

    const activas = g.filter(function (f) { return estaActivo_(f); });
    const empresasActivas = {};
    activas.forEach(function (f) { empresasActivas[empresaFinal(f)] = true; });
    if (Object.keys(empresasActivas).length > 1) {
      const lista = Object.keys(empresasActivas).join(' + ');
      const origen = g.map(function (x) { return x.filaOriginal; }).join(', ');
      g.forEach(function (f) {
        marcar_(f, 'P2_SIN_BAJA_ANTERIOR', 'Activa a la vez en ' + lista +
          ' · son las filas ' + origen + ' de ' + CFG.ORIGEN[f.origen].hoja + ' (columna Fila_Origen)');
      });
      inc.push(fila_('P2', g[0], 'Persona activa a la vez en varias empresas sin baja en la anterior',
        g.map(function (x) { return x.empresaBBDD; }).join(' + '),
        activas.map(function (x) { return empresaFinal(x) + ' ' + idFinal(x); }).join(' + ')));
    }
  });

  // ── P3 · misma persona en las dos hojas
  Object.keys(porPersona).forEach(function (k) {
    const g = porPersona[k];
    const hojas = {};
    g.forEach(function (f) { hojas[f.origen] = true; });
    if (Object.keys(hojas).length > 1) {
      g.forEach(function (f) {
        marcar_(f, 'P3_EN_AMBAS_HOJAS', 'EN LAS DOS HOJAS · la misma persona figura en ' +
          g.map(function (x) { return CFG.ORIGEN[x.origen].hoja + ' fila ' + x.filaOriginal; }).join(' y en ') +
          ' (filas de origen, ver columna Fila_Origen)');
      });
      inc.push(fila_('P3', g[0], 'La misma persona figura en las dos hojas', 'secretarias + profesores', ''));
    }
  });

  // ── P4 / P7 / P8 · Id_Sage y Empresa contra SAGE
  todas.forEach(function (f) {
    if (!f.match) {
      marcar_(f, 'SIN_MATCH', 'No se encuentra en SAGE' + (f.candidatos.length ? '. Candidatos por Id: ' + f.candidatos.join(' ; ') : ''));
      inc.push(fila_('P9-SOLO_EN_BBDD', f, 'Está en la BBDD pero no en el export de SAGE', f.nombreBBDD, f.candidatos.join(' ; ')));
      return;
    }
    if (f.idSageBBDD !== f.match.codigo) {
      const tipo = f.idSageBBDD ? 'P8' : 'P7';
      marcar_(f, 'P8_DISCREPANCIA', 'Id_Sage BBDD "' + f.idSageBBDD + '" ≠ SAGE "' + f.match.codigo + '"');
      inc.push(fila_(tipo, f, f.idSageBBDD ? 'Id_Sage distinto' : 'Id_Sage ausente en la BBDD', f.idSageBBDD, f.match.codigo));
    }
    if (f.empresaCanon !== f.match.empresaCanon) {
      marcar_(f, 'P8_DISCREPANCIA', 'Empresa BBDD "' + f.empresaCanon + '" ≠ SAGE "' + f.match.empresaCanon + '"');
      inc.push(fila_('P8', f, 'Empresa distinta', f.empresaBBDD, f.match.empresaSage));
    }
    if (normalizar_(f.nombreBBDD) !== normalizar_(f.match.nombreSage) && f.nivelMatch !== 'exacto') {
      inc.push(fila_('INFO-NOMBRE', f, 'Nombre escrito distinto (' + f.nivelMatch + ', vía ' + f.viaMatch + ')', f.nombreBBDD, f.match.nombreSage));
    }
    f.avisos.forEach(function (r) { inc.push(fila_('P8', f, r, f.nombreBBDD, f.match.nombreSage)); });
  });

  // ── P9 · en SAGE pero no en la BBDD
  const dnisEnBBDD = {}, tokensEnBBDD = {};
  todas.forEach(function (f) {
    if (f.match) dnisEnBBDD[f.match.dni] = true;
    tokensEnBBDD[f.tokens.join(' ')] = true;
  });
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - CFG.ANIOS_MAX_BAJA);

  const yaListado = {};
  sage.forEach(function (r) {
    if (dnisEnBBDD[r.dni] || tokensEnBBDD[r.tokens.join(' ')]) return;
    if (EMPRESAS_EN_AMBITO.indexOf(r.empresaCanon) === -1) return;          // fuera del ámbito VAP
    if (parseInt(r.codigo, 10) >= CFG.SERIE_PROVEEDORES_DESDE) return;       // proveedor o colaborador, no plantilla
    if (r.fechaBaja && r.fechaBaja < limite) return;                        // P11 · baja de hace más de N años
    if (PATRONES_NO_PERSONA.some(function (re) { return re.test(r.nombreSage); })) return;
    if (yaListado[r.dni + '|' + r.empresaCanon]) return;
    yaListado[r.dni + '|' + r.empresaCanon] = true;

    inc.push({
      tipo: r.fechaBaja ? 'P9-SOLO_EN_SAGE-BAJA' : 'P9-SOLO_EN_SAGE-ALTA',
      hoja: '(SAGE)',
      fila: r.filaCsv,
      empresa: r.empresaCanon,
      idSage: r.codigo,
      nombre: r.nombreSage,
      dni: r.dni,
      detalle: 'Está en SAGE y no en la BBDD' + (r.fechaBaja ? ' · de baja el ' + formatoFecha_(r.fechaBaja) : ' · en alta'),
      datoBBDD: '',
      datoSage: r.empresaSage + ' ' + r.codigo + ' · alta ' + formatoFecha_(r.fechaAlta)
    });
  });

  return inc;
}

function marcar_(fila, marca, texto) {
  if (fila.marcas.indexOf(marca) === -1) fila.marcas.push(marca);
  if (fila.revision.indexOf(texto) === -1) fila.revision.push(texto);
}

function fila_(tipo, f, detalle, datoBBDD, datoSage) {
  return {
    tipo: tipo,
    hoja: CFG.ORIGEN[f.origen].hoja,
    fila: f.filaOriginal,
    empresa: f.match ? f.match.empresaCanon : f.empresaCanon,
    idSage: f.match ? f.match.codigo : f.idSageBBDD,
    nombre: f.nombreBBDD,
    dni: f.match ? f.match.dni : '',
    detalle: detalle,
    datoBBDD: datoBBDD,
    datoSage: datoSage
  };
}

function agrupar_(lista, fn) {
  const g = {};
  lista.forEach(function (x) { const k = fn(x); (g[k] = g[k] || []).push(x); });
  return g;
}

function estaActivo_(f) {
  const baja = f.match ? f.match.fechaBaja : parsearFecha_(f.fechaBajaBBDD);
  if (baja) return baja > new Date();
  return f.match ? true : f.altaBBDD;
}


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 7 bis) VAP_STAFF
 *
 * El resto del personal: quien está de alta en SAGE y no aparece ni en VAP_Secretarias ni
 * en VAP_Profesores. Gerencia, administración, responsables de complementos, limpieza y
 * también los colaboradores de la serie ≥1000 (notarías, registros, profesionales), que
 * entran a petición expresa. Sin filtro de empresa: entran todas las razones sociales.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function construirStaff_(sage, bloques) {
  const enBBDD = {};
  Object.keys(bloques).forEach(function (c) {
    bloques[c].forEach(function (f) { if (f.match) enBBDD[f.match.dni] = true; });
  });

  const vecesPorDni = {};
  sage.forEach(function (r) { if (!r.fechaBaja) vecesPorDni[r.dni] = (vecesPorDni[r.dni] || 0) + 1; });

  const filas = sage
    .filter(function (r) { return r.dni && !r.fechaBaja && !enBBDD[r.dni]; })
    .map(function (r) {
      const colaborador = parseInt(r.codigo, 10) >= CFG.SERIE_PROVEEDORES_DESDE;
      const noPersona = PATRONES_NO_PERSONA.some(function (re) { return re.test(r.nombreSage); });
      const avisos = [];
      if (noPersona) avisos.push('No parece una persona física');
      if (vecesPorDni[r.dni] > 1) avisos.push('De alta en ' + vecesPorDni[r.dni] + ' empresas a la vez');
      return {
        empresa: r.empresaCanon,
        codigo: r.codigo,
        nombre: limpiarNombre_(r.nombreSage),
        dni: r.dni,
        tipo: colaborador ? 'COLABORADOR' : 'PLANTILLA',
        fechaAlta: r.fechaAlta,
        nombreSage: r.nombreSage,
        filaCsv: r.filaCsv,
        marca: noPersona ? 'P5_NO_ES_PERSONA' : null,
        revision: avisos.join(' | ')
      };
    });

  // Mismo criterio que en las hojas copia: lo que hay que resolver, abajo.
  //   0 · limpia   1 · con aviso   2 · pintada (no es una persona)
  // Dentro de cada nivel: plantilla antes que colaboradores, y por empresa y nombre.
  const conflicto = function (f) { return f.marca ? 2 : (f.revision ? 1 : 0); };
  filas.sort(function (a, b) {
    if (conflicto(a) !== conflicto(b)) return conflicto(a) - conflicto(b);
    if (a.tipo !== b.tipo) return a.tipo === 'PLANTILLA' ? -1 : 1;
    if (a.empresa !== b.empresa) return a.empresa.localeCompare(b.empresa, 'es');
    return a.nombre.localeCompare(b.nombre, 'es');
  });
  return filas;
}

function escribirStaff_(ss, filas) {
  const hoja = prepararHoja_(ss, CFG.DESTINO.staff);
  const cab = ['Empresa', 'Id_Sage', 'ID_Staff', 'Nombre', 'DNI', 'Tipo', 'Alta', 'Fecha_Alta', 'Nombre_SAGE', 'Fila_CSV', 'Revisión'];

  hoja.getRange(1, 1, 1, cab.length).setValues([cab])
      .setFontWeight('bold').setBackground('#434343').setFontColor('#FFFFFF');
  if (!filas.length) return;

  const cuerpo = filas.map(function (f) {
    return [f.empresa, f.codigo, f.empresa + '_' + f.codigo, f.nombre, f.dni, f.tipo, true,
            f.fechaAlta, f.nombreSage, f.filaCsv, f.revision];
  });
  hoja.getRange(2, 1, cuerpo.length, cab.length).setValues(cuerpo);
  hoja.getRange(2, 1, cuerpo.length, cab.length).setBackgrounds(filas.map(function (f) {
    const c = f.marca ? CFG.COLORES[f.marca] : null;
    return cab.map(function () { return c; });
  }));
  hoja.getRange(2, cab.indexOf('Fecha_Alta') + 1, cuerpo.length, 1).setNumberFormat('dd/mm/yyyy');
  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, cab.length);
}


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 8) ESCRITURA
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function escribirHojaCopia_(ss, filas, cfgOrigen, nombreDestino) {
  const hoja = prepararHoja_(ss, nombreDestino);

  const cab = ['Empresa', 'Id_Sage', cfgOrigen.colId, cfgOrigen.colNombre, 'DNI'];
  if (cfgOrigen.tipologia) cab.push('Tipología_Profesor');
  cab.push('Alta', cfgOrigen.colFechaAlta, cfgOrigen.colFechaBaja, 'Nombre_SAGE', 'Match', 'Fila_Origen', 'Revisión');

  const cuerpo = [], fondos = [];
  filas.forEach(function (f) {
    const m = f.match;
    const empresa = m ? m.empresaCanon : f.empresaCanon;
    const idSage = m ? m.codigo : f.idSageBBDD;
    const fila = [
      empresa,
      idSage,
      empresa + '_' + idSage,
      (CFG.NOMBRE_DESDE === 'SAGE' && m) ? m.nombreSage : f.nombreLimpio,
      m ? m.dni : ''
    ];
    if (cfgOrigen.tipologia) fila.push(f.tipologia);
    fila.push(
      estaActivo_(f),
      m ? m.fechaAlta : parsearFecha_(f.fechaAltaBBDD),
      m ? m.fechaBaja : parsearFecha_(f.fechaBajaBBDD),
      m ? m.nombreSage : '',
      m ? f.nivelMatch + ' · ' + f.viaMatch : 'SIN MATCH',
      f.filaOriginal,
      f.revision.join(' | ')
    );
    cuerpo.push(fila);

    const color = colorDe_(f.marcas);
    fondos.push(fila.map(function () { return color; }));
  });

  hoja.getRange(1, 1, 1, cab.length).setValues([cab])
      .setFontWeight('bold').setBackground('#434343').setFontColor('#FFFFFF');

  if (cuerpo.length) {
    hoja.getRange(2, 1, cuerpo.length, cab.length).setValues(cuerpo);
    hoja.getRange(2, 1, cuerpo.length, cab.length).setBackgrounds(fondos);

    const colAlta = cab.indexOf(cfgOrigen.colFechaAlta) + 1;
    hoja.getRange(2, colAlta, cuerpo.length, 2).setNumberFormat('dd/mm/yyyy');

    // P6 · desplegable de empresas armonizadas
    const regla = SpreadsheetApp.newDataValidation()
      .requireValueInList(Object.keys(EMPRESAS), true)
      .setAllowInvalid(true)
      .setHelpText('Empresas armonizadas del sistema VAP')
      .build();
    hoja.getRange(2, 1, cuerpo.length, 1).setDataValidation(regla);
  }

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, cab.length);
}

function escribirIncidencias_(ss, incidencias) {
  const hoja = prepararHoja_(ss, CFG.DESTINO.incidencias);
  const cab = ['Tipo', 'Hoja', 'Fila', 'Empresa', 'Id_Sage', 'Nombre', 'DNI', 'Detalle', 'Dato en BBDD', 'Dato en SAGE'];

  const orden = ['P1', 'P2', 'P3', 'P4', 'P5', 'P7', 'P8', 'P9-SOLO_EN_BBDD', 'P9-SOLO_EN_SAGE-ALTA', 'P9-SOLO_EN_SAGE-BAJA', 'INFO-NOMBRE'];
  incidencias.sort(function (a, b) {
    const d = orden.indexOf(a.tipo) - orden.indexOf(b.tipo);
    return d !== 0 ? d : String(a.nombre).localeCompare(String(b.nombre), 'es');
  });

  const cuerpo = incidencias.map(function (i) {
    return [i.tipo, i.hoja, i.fila, i.empresa, i.idSage, i.nombre, i.dni, i.detalle, i.datoBBDD, i.datoSage];
  });

  hoja.getRange(1, 1, 1, cab.length).setValues([cab])
      .setFontWeight('bold').setBackground('#434343').setFontColor('#FFFFFF');

  if (cuerpo.length) {
    hoja.getRange(2, 1, cuerpo.length, cab.length).setValues(cuerpo);
    const colores = { P1: 'P1_DUPLICADO', P2: 'P2_SIN_BAJA_ANTERIOR', P3: 'P3_EN_AMBAS_HOJAS', P5: 'P5_NO_ES_PERSONA', P7: 'P8_DISCREPANCIA', P8: 'P8_DISCREPANCIA' };
    hoja.getRange(2, 1, cuerpo.length, 1).setBackgrounds(incidencias.map(function (i) {
      return [colores[i.tipo] ? CFG.COLORES[colores[i.tipo]] : null];
    }));
  }

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, cab.length);
}

function prepararHoja_(ss, nombre) {
  let hoja = ss.getSheetByName(nombre);
  if (hoja) hoja.clear({ contentsOnly: false });
  else hoja = ss.insertSheet(nombre);
  hoja.getDataRange().setDataValidation(null);
  return hoja;
}

function colorDe_(marcas) {
  for (let i = 0; i < CFG.PRIORIDAD_COLOR.length; i++) {
    if (marcas.indexOf(CFG.PRIORIDAD_COLOR[i]) !== -1) return CFG.COLORES[CFG.PRIORIDAD_COLOR[i]];
  }
  return null;
}


/* ═══════════════════════════════════════════════════════════════════════════════════════
 * 9) UTILIDADES
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

function canonizarEmpresa_(valor) {
  const v = normalizar_(valor);
  if (!v) return '';
  const claves = Object.keys(EMPRESAS);
  for (let i = 0; i < claves.length; i++) {
    const variantes = EMPRESAS[claves[i]];
    for (let j = 0; j < variantes.length; j++) {
      if (normalizar_(variantes[j]) === v) return claves[i];
    }
  }
  return String(valor).trim();  // empresa desconocida: se conserva tal cual para que se vea
}

/** "1.000 " → "1000"; "648" → "648"; "-" o vacío → "" */
function normalizarCodigo_(valor) {
  const s = String(valor === null || valor === undefined ? '' : valor).trim().replace(/\./g, '');
  if (!s || s === '-') return '';
  return s.replace(/^0+(?=\d)/, '');
}

/** Acepta Date, "01/11/2021 0:00:00", "24/04/2026", "26/08/26" y devuelve Date o null. */
function parsearFecha_(valor) {
  if (valor instanceof Date && !isNaN(valor)) return valor;
  const s = String(valor || '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  let anio = parseInt(m[3], 10);
  if (anio < 100) anio += 2000;
  const d = new Date(anio, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  return isNaN(d) ? null : d;
}

function formatoFecha_(d) {
  if (!(d instanceof Date) || isNaN(d)) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function resumir_(bloques, incidencias) {
  const lineas = ['── RESUMEN DEL CRUCE ──'];
  Object.keys(bloques).forEach(function (c) {
    const filas = bloques[c];
    const con = filas.filter(function (f) { return f.match; }).length;
    lineas.push(CFG.ORIGEN[c].hoja + ': ' + filas.length + ' filas · ' + con + ' con DNI · ' + (filas.length - con) + ' sin match');
  });
  const porTipo = agrupar_(incidencias, function (i) { return i.tipo; });
  Object.keys(porTipo).sort().forEach(function (t) { lineas.push(t + ': ' + porTipo[t].length); });
  return lineas.join('\n');
}
