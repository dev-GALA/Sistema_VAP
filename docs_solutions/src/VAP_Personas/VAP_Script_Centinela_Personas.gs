/**
 * =========================================================
 *  VAP_BBDD_Personas · CENTINELA DE ID_TRABAJADOR
 *  (Mismo proyecto de Apps Script que VAP_Script_Revision_Personas.gs: comparten funciones)
 * =========================================================
 *
 * 1) `instalarCentinela` (una vez, desde el editor): la columna id_trabajador pasa a generarse sola con una FÓRMULA en
 *    la cabecera (Empresa + "_" + Id_Sage) y queda protegida. Antes guarda los id antiguos en «copia_id_trabajador».
 *    La fórmula va en la fila 1 para que ordenar o filtrar las filas no la mueva.
 * 2) `onEdit` (automático, sin crear activadores): al cambiar Empresa o Id_Sage, si OTRA persona ya usa ese número en
 *    esa empresa (en cualquiera de las tres hojas) deshace el cambio y avisa de dónde está. Si se pegan varias celdas,
 *    las marca en rojo con una nota; la marca se quita sola al corregirlo.
 *
 * La MISMA persona (mismo DNI, o mismo nombre si falta el DNI) puede repetirlo, p. ej. en Staff y Secretarias.
 *
 * OJO: el propietario del libro siempre puede editar la columna protegida, y cualquier script que ESCRIBA en
 * id_trabajador rompería la fórmula.
 */

const COLOR_CONFLICTO = '#f4cccc';
const MARCA_NOTA = 'VAP_ID';
const DESCRIPCION_PROTECCION = 'VAP: id_trabajador se genera solo';
const HOJA_COPIA_ID = 'copia_id_trabajador';

/* ---------- instalación ---------- */

/** Se ejecuta desde el editor. Es repetible. */
function instalarCentinela() {
  const libro = SpreadsheetApp.getActive();
  PESTANAS_PERSONAS.forEach(pestana => repararCabeceraId_(libro.getSheetByName(pestana.nombre)));
  guardarCopiaDeIds_(libro);
  PESTANAS_PERSONAS.forEach(pestana => {
    const hoja = libro.getSheetByName(pestana.nombre);
    const columnas = columnasDe_(hoja);
    ponerFormulaId_(hoja, columnas);
    protegerColumna_(hoja, columnas.id);
  });
  Logger.log('Centinela instalado: columna id_trabajador generada y protegida en las tres hojas.');
}

/** Posiciones (desde 1) de las columnas que importan, por el nombre de su cabecera. */
function columnasDe_(hoja) {
  if (!hoja) throw new Error('Falta una pestaña de personas.');
  const cabecera = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(texto_);
  const columna = nombre => {
    const i = cabecera.indexOf(nombre);
    if (i === -1) throw new Error(`En «${hoja.getName()}» falta la columna «${nombre}».`);
    return i + 1;
  };
  return { empresa: columna('Empresa'), idSage: columna('Id_Sage'), id: columna('id_trabajador') };
}

/** Solo la primera vez: después de instalar, los textos antiguos ya no existen y no se deben pisar. */
function guardarCopiaDeIds_(libro) {
  if (libro.getSheetByName(HOJA_COPIA_ID)) return;
  const filas = leerPersonas_(libro).map(p => [p.pestana, p.fila, p.id, p.empresa, p.idSage, p.dni]);
  const hoja = libro.insertSheet(HOJA_COPIA_ID);
  const todas = [['pestana', 'fila', 'id_anterior', 'empresa', 'id_sage', 'dni']].concat(filas);
  hoja.getRange(1, 1, todas.length, 6).setValues(todas);
}

function letraDeColumna_(numero) {
  let letra = '';
  for (let n = numero; n > 0; n = Math.floor((n - 1) / 26)) {
    letra = String.fromCharCode(65 + ((n - 1) % 26)) + letra;
  }
  return letra;
}

/** Según la configuración regional, la hoja separa los argumentos con «;» o con «,». */
const SEPARADORES_DE_FORMULA = [';', ','];

function formulaDeId_(columnas, separador) {
  const rango = c => `${letraDeColumna_(c)}2:${letraDeColumna_(c)}`;
  const empresa = rango(columnas.empresa);
  const numero = rango(columnas.idSage);
  const si = [`(${empresa}="")+(${numero}="")`, '""', `TRIM(${empresa})&"_"&TRIM(${numero})`].join(separador);
  return `={"id_trabajador";ARRAYFORMULA(IF(${si}))}`;
}

/** Pone la fórmula y comprueba que la hoja la entiende; si no, deja los id escritos y avisa. */
function ponerFormulaId_(hoja, columnas) {
  const filas = hoja.getMaxRows() - 1;
  if (filas > 0) hoja.getRange(2, columnas.id, filas, 1).clearContent(); // la fórmula necesita la columna libre
  const cabecera = hoja.getRange(1, columnas.id);
  const funciona = SEPARADORES_DE_FORMULA.some(separador => {
    cabecera.setFormula(formulaDeId_(columnas, separador));
    SpreadsheetApp.flush();
    return texto_(cabecera.getValue()) === 'id_trabajador';
  });
  if (funciona) return;
  escribirIdsComoTexto_(hoja, columnas);
  throw new Error(`«${hoja.getName()}» no admite la fórmula: se han dejado los id escritos.`);
}

function escribirIdsComoTexto_(hoja, columnas) {
  hoja.getRange(1, columnas.id).setValue('id_trabajador');
  const filas = hoja.getLastRow() - 1;
  if (filas < 1) return;
  const empresas = hoja.getRange(2, columnas.empresa, filas, 1).getValues();
  const numeros = hoja.getRange(2, columnas.idSage, filas, 1).getValues();
  hoja.getRange(2, columnas.id, filas, 1).setValues(empresas.map((f, i) => {
    const empresa = texto_(f[0]);
    const numero = texto_(numeros[i][0]);
    return [empresa && numero ? `${empresa}_${numero}` : ''];
  }));
}

/** Si una instalación anterior dejó la cabecera en error (#ERROR!, #REF!…), recupera su nombre. */
function repararCabeceraId_(hoja) {
  if (!hoja) return;
  const cabecera = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(texto_);
  const posterior = cabecera.indexOf('Id_Sage') + 1;
  if (posterior > 0 && String(cabecera[posterior]).charAt(0) === '#') {
    hoja.getRange(1, posterior + 1).setValue('id_trabajador');
  }
}

function protegerColumna_(hoja, columna) {
  hoja.getProtections(SpreadsheetApp.ProtectionType.RANGE)
    .filter(p => p.getDescription() === DESCRIPCION_PROTECCION)
    .forEach(p => p.remove());
  const proteccion = hoja.getRange(1, columna, hoja.getMaxRows(), 1).protect().setDescription(DESCRIPCION_PROTECCION);
  proteccion.removeEditors(proteccion.getEditors());
  if (proteccion.canDomainEdit()) proteccion.setDomainEdit(false);
}

/* ---------- reglas (sin servicios de Google) ---------- */

/** El nombre sin tildes, signos ni mayúsculas y con las palabras ordenadas. */
function nombreComparable_(nombre) {
  return String(nombre || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ').trim().split(' ').sort().join(' ');
}

function esLaMismaPersona_(a, b) {
  if (a.dni && b.dni) return a.dni === b.dni;
  return nombreComparable_(a.nombre) === nombreComparable_(b.nombre);
}

/** «pestaña|fila» -> explicación, para cada fila cuyo número de SAGE usa OTRA persona en la misma empresa. */
function conflictosIdSage_(personas) {
  const grupos = agrupar_(personas, p => (p.empresa && p.idSage ? `${p.empresa}|${p.idSage}` : ''));
  const conflictos = {};
  grupos.forEach(grupo => {
    grupo.forEach(persona => {
      const otras = grupo.filter(o => o !== persona && !esLaMismaPersona_(persona, o));
      if (!otras.length) return;
      conflictos[`${persona.pestana}|${persona.fila}`] = `${persona.empresa}_${persona.idSage} ya lo usa ` +
        otras.map(o => `${o.pestana} fila ${o.fila} (${o.nombre})`).join(', ');
    });
  });
  return conflictos;
}

/* ---------- al editar ---------- */

/** Pone la marca a las celdas de Id_Sage en conflicto y la quita a las que ya no lo están. */
function marcarConflictos_(libro, conflictos) {
  PESTANAS_PERSONAS.forEach(pestana => {
    const hoja = libro.getSheetByName(pestana.nombre);
    const filas = hoja.getLastRow() - 1;
    if (filas < 1) return;
    const columna = columnasDe_(hoja).idSage;
    const notas = hoja.getRange(2, columna, filas, 1).getNotes();
    notas.forEach((fila, i) => {
      const conflicto = conflictos[`${pestana.nombre}|${i + 2}`];
      const marcada = fila[0].indexOf(MARCA_NOTA) === 0;
      const celda = () => hoja.getRange(i + 2, columna);
      if (conflicto && fila[0] !== `${MARCA_NOTA}: ${conflicto}`) {
        celda().setBackground(COLOR_CONFLICTO);
        celda().setNote(`${MARCA_NOTA}: ${conflicto}`);
      } else if (!conflicto && marcada) {
        celda().setBackground(null);
        celda().setNote('');
      }
    });
  });
}

/** Disparador simple de Google: no hay que crear ningún activador. */
function onEdit(e) {
  if (!e || !e.range) return;
  const hoja = e.range.getSheet();
  if (!PESTANAS_PERSONAS.some(p => p.nombre === hoja.getName()) || e.range.getLastRow() < 2) return;
  const columnas = columnasDe_(hoja);
  const toca = c => c >= e.range.getColumn() && c <= e.range.getLastColumn();
  if (!toca(columnas.empresa) && !toca(columnas.idSage)) return;

  const libro = e.source || SpreadsheetApp.getActive();
  let conflictos = conflictosIdSage_(leerPersonas_(libro));
  const unaCelda = e.range.getNumRows() === 1 && e.range.getNumColumns() === 1;
  const conflicto = conflictos[`${hoja.getName()}|${e.range.getRow()}`];
  if (unaCelda && conflicto) {
    e.range.setValue(e.oldValue === undefined ? '' : e.oldValue);
    libro.toast(`No se guarda: ${conflicto}`, 'Número de SAGE ya usado', 20);
    conflictos = conflictosIdSage_(leerPersonas_(libro));
  }
  marcarConflictos_(libro, conflictos);
}

/** Desde el editor: marca todos los conflictos que haya ahora mismo. */
function marcarTodosLosConflictos() {
  const libro = SpreadsheetApp.getActive();
  const conflictos = conflictosIdSage_(leerPersonas_(libro));
  marcarConflictos_(libro, conflictos);
  Logger.log(`Filas en conflicto: ${Object.keys(conflictos).length}`);
}
