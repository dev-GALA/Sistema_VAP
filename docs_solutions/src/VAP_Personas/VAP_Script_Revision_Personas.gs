/**
 * =========================================================
 *  VAP_BBDD_Personas · REVISIÓN DE DATOS E ID_TRABAJADOR
 *  (Instalar en el proyecto de Apps Script del libro VAP_BBDD_Personas)
 * =========================================================
 *
 * Fase 0 de la armonización de id_trabajador: SOLO LEE las pestañas y escribe el resultado en la pestaña
 * «revision_ids» (la sustituye en cada ejecución). No cambia ningún dato ni pinta celdas.
 *
 * CÓMO SE USA: en el editor de Apps Script, función `revisarPersonas` -> Ejecutar. No tiene activadores.
 *
 * REGLA: id_trabajador = Empresa + "_" + Id_Sage, con una de las empresas de la lista de la hoja Config.
 *
 * OPCIONAL (propiedades del script), para saber cuánto histórico usa cada id que habría que cambiar:
 *   ID_LIBRO_VAP_PAGOS      -> libro VAP_Pagos (hoja «huellas»)
 *   ID_LIBRO_COMPLEMENTOS   -> libro de Complementos de secretarias (hoja «Data»)
 * Sin ellas, esas columnas dicen «no comprobado».
 */

const PESTANAS_PERSONAS = [
  { nombre: 'VAP_Staff', columnaNombre: 'Nombre' },
  { nombre: 'VAP_Secretarias', columnaNombre: 'Nombre_Secretaria' },
  { nombre: 'VAP_Profesores', columnaNombre: 'Nombre' },
];
const HOJA_CONFIG = 'Config';
const CLAVE_CONFIG_EMPRESAS = 'Empresas';
const HOJA_REVISION = 'revision_ids';

const CABECERA_REVISION = ['problema', 'pestana', 'fila', 'empresa', 'id_sage', 'id_actual', 'id_correcto', 'nombre',
  'dni', 'alta', 'detalle', 'huellas_con_id_actual', 'envios_complementos_con_id_actual'];

const PROPIEDAD_LIBRO_PAGOS = 'ID_LIBRO_VAP_PAGOS';
const PROPIEDAD_LIBRO_COMPLEMENTOS = 'ID_LIBRO_COMPLEMENTOS';
const NO_COMPROBADO = 'no comprobado';

/** Se ejecuta a mano desde el editor. Devuelve el resumen (solo cifras). */
function revisarPersonas() {
  const libro = SpreadsheetApp.getActive();
  const empresas = leerEmpresas_(libro);
  const personas = leerPersonas_(libro);
  const usos = {
    huellas: contarPorId_(PROPIEDAD_LIBRO_PAGOS, 'huellas', 'id_trabajador'),
    envios: contarPorId_(PROPIEDAD_LIBRO_COMPLEMENTOS, 'Data', 'ID_Secretaria'),
  };
  const filas = detectarProblemas_(personas, empresas)
    .map(p => filaDeRevision_(p, usos));
  escribirRevision_(libro, filas);

  const porProblema = {};
  filas.forEach(f => { porProblema[f[0]] = (porProblema[f[0]] || 0) + 1; });
  const resumen = { revisadas: personas.length, problemas: filas.length, porProblema };
  Logger.log(JSON.stringify(resumen));
  return resumen;
}

/* ---------- lectura ---------- */

function texto_(valor) {
  return String(valor === null || valor === undefined ? '' : valor).trim();
}

/** La lista de empresas de Config: la fila cuya columna A es «Empresas», con la lista separada por comas en B. */
function leerEmpresas_(libro) {
  const hoja = libro.getSheetByName(HOJA_CONFIG);
  if (!hoja) throw new Error(`No existe la hoja «${HOJA_CONFIG}».`);
  const fila = hoja.getDataRange().getValues().filter(f => texto_(f[0]) === CLAVE_CONFIG_EMPRESAS)[0];
  const empresas = fila ? texto_(fila[1]).split(/[,;]/).map(texto_).filter(Boolean) : [];
  if (!empresas.length) throw new Error(`Falta la lista de ${CLAVE_CONFIG_EMPRESAS} en la hoja «${HOJA_CONFIG}».`);
  return empresas;
}

/** Las filas de las tres pestañas que tienen algún dato de persona (las casillas sueltas no cuentan). */
function leerPersonas_(libro) {
  return PESTANAS_PERSONAS.reduce((todas, pestana) => {
    const hoja = libro.getSheetByName(pestana.nombre);
    if (!hoja) throw new Error(`No existe la hoja «${pestana.nombre}».`);
    const valores = hoja.getDataRange().getValues();
    const cabecera = valores[0].map(texto_);
    const columna = nombre => {
      const i = cabecera.indexOf(nombre);
      if (i === -1) throw new Error(`En «${pestana.nombre}» falta la columna «${nombre}».`);
      return i;
    };
    const c = {
      empresa: columna('Empresa'), idSage: columna('Id_Sage'), id: columna('id_trabajador'),
      nombre: columna(pestana.columnaNombre), dni: columna('DNI'), alta: columna('Alta'),
    };
    const personas = valores.slice(1)
      .map((f, i) => ({
        pestana: pestana.nombre, fila: i + 2,
        empresa: texto_(f[c.empresa]), idSage: texto_(f[c.idSage]), id: texto_(f[c.id]),
        nombre: texto_(f[c.nombre]), dni: texto_(f[c.dni]).toUpperCase().replace(/[\s-]/g, ''),
        alta: f[c.alta] === true,
      }))
      .filter(p => p.empresa || p.idSage || p.id || p.nombre || p.dni);
    return todas.concat(personas);
  }, []);
}

/** id -> cuántas filas lo usan en otro libro; null si ese libro no está configurado. */
function contarPorId_(propiedad, nombreHoja, nombreColumna) {
  const idLibro = PropertiesService.getScriptProperties().getProperty(propiedad);
  if (!idLibro) return null;
  const hoja = SpreadsheetApp.openById(idLibro).getSheetByName(nombreHoja);
  if (!hoja) throw new Error(`En el libro de ${propiedad} no existe la hoja «${nombreHoja}».`);
  const valores = hoja.getDataRange().getValues();
  const i = valores[0].map(texto_).indexOf(nombreColumna);
  if (i === -1) throw new Error(`En «${nombreHoja}» falta la columna «${nombreColumna}».`);
  const cuenta = {};
  valores.slice(1).forEach(f => {
    const id = texto_(f[i]);
    if (id) cuenta[id] = (cuenta[id] || 0) + 1;
  });
  return cuenta;
}

/* ---------- reglas (sin servicios de Google) ---------- */

/** El id que le corresponde, o '' si faltan datos para componerlo. */
function idCorrecto_(persona) {
  return persona.empresa && /^\d+$/.test(persona.idSage) ? `${persona.empresa}_${persona.idSage}` : '';
}

function motivoDniNoValido_(dni) {
  if (!dni) return 'Sin DNI';
  if (dni.length !== 9) return `Tiene ${dni.length} caracteres y debería tener 9`;
  return /^(\d{8}|[XYZ]\d{7})[A-Z]$/.test(dni) ? '' : 'No tiene la forma de un DNI ni de un NIE';
}

function agrupar_(lista, claveDe) {
  const grupos = new Map();
  lista.forEach(p => {
    const clave = claveDe(p);
    if (!clave) return;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(p);
  });
  return grupos;
}

function dondeEsta_(personas) {
  return personas.map(p => `${p.pestana} fila ${p.fila}`).join(', ');
}

/** Los problemas, en el orden de las pestañas y filas. Los de id miran todas las personas; DNI y nombre, las de Alta. */
function detectarProblemas_(personas, empresas) {
  const problemas = [];
  const anota = (persona, problema, detalle) => problemas.push({ persona, problema, detalle: detalle || '' });
  // Dos filas «son el mismo id» si comparten el actual o el que les correspondería.
  const porId = agrupar_(personas, p => idCorrecto_(p) || p.id);
  const porDniYEmpresa = agrupar_(personas.filter(p => p.alta && !motivoDniNoValido_(p.dni)),
    p => `${p.empresa}|${p.dni}`);

  personas.forEach(p => {
    if (empresas.indexOf(p.empresa) === -1) {
      anota(p, 'EMPRESA_FUERA_DE_LISTA', `«${p.empresa}» no está en la lista de Config`);
    }
    if (!/^\d+$/.test(p.idSage)) anota(p, 'SIN_ID_SAGE', 'Falta el número de empleado de SAGE (o no es un número)');
    const correcto = idCorrecto_(p);
    if (!p.id) anota(p, 'SIN_ID', correcto ? `Debería ser ${correcto}` : '');
    else if (correcto && p.id !== correcto) anota(p, 'ID_NO_CUMPLE_REGLA', `Debería ser ${correcto}`);

    const mismos = porId.get(correcto || p.id) || [];
    if (mismos.length > 1) {
      const dnis = new Set(mismos.map(m => m.dni));
      let conclusion = 'DNI DISTINTOS: conflicto';
      if (dnis.has('')) conclusion = 'falta algún DNI: comprobar a mano';
      else if (dnis.size === 1) conclusion = 'mismo DNI en todas';
      anota(p, 'ID_REPETIDO', `También en ${dondeEsta_(mismos.filter(m => m !== p))} · ${conclusion}`);
    }

    if (!p.alta) return;
    const motivo = motivoDniNoValido_(p.dni);
    if (motivo) anota(p, 'DNI_NO_VALIDO', motivo);
    if (!/^[^,]+,[^,]+$/.test(p.nombre)) {
      anota(p, 'NOMBRE_SIN_FORMATO', 'Debe ser «APELLIDOS, NOMBRE», con una sola coma');
    }
    const mismoDni = motivo ? [] : porDniYEmpresa.get(`${p.empresa}|${p.dni}`) || [];
    if (mismoDni.length > 1) {
      anota(p, 'DNI_REPETIDO_EN_EMPRESA', `También en ${dondeEsta_(mismoDni.filter(m => m !== p))}`);
    }
  });
  return problemas;
}

function filaDeRevision_(problema, usos) {
  const p = problema.persona;
  const uso = cuenta => (cuenta === null ? NO_COMPROBADO : cuenta[p.id] || 0);
  return [problema.problema, p.pestana, p.fila, p.empresa, p.idSage, p.id, idCorrecto_(p), p.nombre, p.dni,
    p.alta ? 'sí' : 'no', problema.detalle, uso(usos.huellas), uso(usos.envios)];
}

/* ---------- escritura ---------- */

/** Sustituye la hoja «revision_ids». Es lo ÚNICO que este script escribe. */
function escribirRevision_(libro, filas) {
  const hoja = libro.getSheetByName(HOJA_REVISION) || libro.insertSheet(HOJA_REVISION);
  hoja.clearContents();
  const todas = [CABECERA_REVISION].concat(filas);
  hoja.getRange(1, 1, todas.length, CABECERA_REVISION.length).setValues(todas);
}
