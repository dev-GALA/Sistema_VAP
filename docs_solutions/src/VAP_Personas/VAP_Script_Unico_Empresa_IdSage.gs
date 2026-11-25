/**
 * =========================================================
 *  USO ÚNICO · CORREGIR Empresa E Id_Sage CON EL EXPORT DE SAGE
 *  (Mismo proyecto que los otros scripts de VAP_Personas. SE BORRA cuando termine.)
 * =========================================================
 *
 * Contrasta por NOMBRE (el export no trae DNI) las personas de Alta del maestro con el export de SAGE:
 *   - Si está en SAGE: pone en Empresa e Id_Sage lo que dice SAGE.
 *   - Si NO está y su número es de otra persona: le da un número provisional (9000, 9001…), amarillo y observación.
 *   - Si NO está y su número no lo usa nadie más: lo conserva, amarillo y observación.
 * Las empresas sin nómina en SAGE (JOSE e INTERCASTILLA) no se contrastan ni se marcan; solo reciben número provisional si dos
 * personas distintas comparten número.
 * Escribe solo Empresa, Id_Sage, el fondo amarillo de Id_Sage y la columna «Observaciones» (la crea si no existe),
 * celda a celda para no perder el desplegable de Empresa.
 *
 * Propiedad del script: ID_LIBRO_EXPORT_SAGE (libro VAP_Export_SAGE, hoja «bbdd_export_sage_laboral» con el export
 * de hoy). Funciones: `simularCorreccionEmpresaIdSage` (no escribe en las pestañas) y
 * `ejecutarCorreccionEmpresaIdSage`. Ambas dejan el detalle en la hoja «correccion_empresa_idsage».
 */

const PROPIEDAD_EXPORT_SAGE = 'ID_LIBRO_EXPORT_SAGE';
const HOJA_EXPORT_SAGE = 'bbdd_export_sage_laboral';
const HOJA_CORRECCION = 'correccion_empresa_idsage';
// Cómo llama SAGE a las empresas que en el maestro tienen otro nombre.
const EMPRESAS_SAGE_A_MAESTRO = { 'CTM MOTOR': 'MOTOR INTEGRAL' };
const EMPRESAS_SIN_SAGE = ['JOSE', 'INTERCASTILLA'];
const PRIMER_NUMERO_PROVISIONAL = 9000;
const COLOR_REVISAR = '#fff2cc';
const COLUMNA_OBSERVACIONES = 'Observaciones';
const MARCA_OBSERVACION = '[SAGE] '; // distingue lo que escribe este script de lo escrito a mano
const CABECERA_CORRECCION = ['accion', 'pestana', 'fila', 'nombre', 'empresa_actual', 'id_sage_actual',
  'empresa_nueva', 'id_sage_nuevo', 'observacion'];

function palabras_(nombre) {
  return String(nombre || '').replace(/ª/g, 'A').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}

/** Iguales salvo una letra cambiada, de más o de menos (erratas), solo en palabras largas. */
function casiIguales_(a, b) {
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i += 1;
  const resto = (palabra, salto) => palabra.slice(i + salto);
  return resto(a, 1) === resto(b, 1) || resto(a, 1) === resto(b, 0) || resto(a, 0) === resto(b, 1);
}

/** Una es la otra recortada o abreviada («ANT» y «ANTONIO», «M» y «MARIA»), o tiene una errata. */
function palabraCompatible_(a, b) {
  return a.indexOf(b) === 0 || b.indexOf(a) === 0 || casiIguales_(a, b);
}

/** Cuántas palabras de SAGE tienen su pareja (cada palabra del maestro se usa una vez). */
function palabrasEmparejadas_(delMaestro, deSage) {
  const libres = palabras_(delMaestro);
  return palabras_(deSage).filter(palabra => {
    let i = libres.indexOf(palabra);
    if (i === -1) i = libres.findIndex(otra => palabraCompatible_(palabra, otra));
    if (i === -1) return false;
    libres.splice(i, 1);
    return true;
  }).length;
}

/** Exigente: sirve para encontrar a la persona en cualquier empresa y número. */
function mismoNombreQueSage_(delMaestro, deSage) {
  if (nombreComparable_(delMaestro) === nombreComparable_(deSage)) return true;
  const total = palabras_(deSage).length;
  return total >= 3 && palabrasEmparejadas_(delMaestro, deSage) === total;
}

/** Tolerante: solo sirve cuando además coinciden la empresa y el número. */
function nombreParecidoASage_(delMaestro, deSage) {
  return palabrasEmparejadas_(delMaestro, deSage) >= Math.max(2, palabras_(deSage).length - 1);
}

function leerSage_() {
  const idLibro = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_EXPORT_SAGE);
  if (!idLibro) throw new Error(`Falta la propiedad del script ${PROPIEDAD_EXPORT_SAGE}.`);
  const hoja = SpreadsheetApp.openById(idLibro).getSheetByName(HOJA_EXPORT_SAGE);
  if (!hoja) throw new Error(`En ese libro no existe la hoja «${HOJA_EXPORT_SAGE}».`);
  const valores = hoja.getDataRange().getValues();
  const cabecera = valores[0].map(texto_);
  const columna = nombre => {
    const i = cabecera.indexOf(nombre);
    if (i === -1) throw new Error(`En el export de SAGE falta la columna «${nombre}».`);
    return i;
  };
  const c = { empresa: columna('Empresa'), codigo: columna('Codigo_Empleado'), nombre: columna('Nombre_empleado') };
  return valores.slice(1)
    .map(f => ({
      empresa: EMPRESAS_SAGE_A_MAESTRO[texto_(f[c.empresa])] || texto_(f[c.empresa]),
      codigo: texto_(f[c.codigo]),
      nombre: texto_(f[c.nombre]),
    }))
    .filter(s => s.empresa && s.codigo && s.nombre);
}

function clave_(empresa, codigo) {
  return `${empresa}|${codigo}`;
}

/** Lo que SAGE dice de una persona: la clave «empresa|número» que le toca, o por qué no se sabe. */
function buscarEnSage_(persona, sage, empresas) {
  if (EMPRESAS_SIN_SAGE.indexOf(persona.empresa) !== -1) return { sinSage: true };
  const actual = clave_(persona.empresa, persona.idSage);
  if (sage.some(s => clave_(s.empresa, s.codigo) === actual && nombreParecidoASage_(persona.nombre, s.nombre))) {
    return { clave: actual };
  }
  const claves = [];
  sage.filter(s => mismoNombreQueSage_(persona.nombre, s.nombre)).forEach(s => {
    const clave = clave_(s.empresa, s.codigo);
    if (claves.indexOf(clave) === -1) claves.push(clave);
  });
  if (!claves.length) return { motivo: '' };
  const enSage = claves.map(k => k.replace('|', '_')).join(', ');
  if (claves.length > 1) return { motivo: `En SAGE aparece varias veces (${enSage}): elegir a mano` };
  if (empresas.indexOf(claves[0].split('|')[0]) === -1) {
    return { motivo: `En SAGE es ${enSage} y esa empresa no está en la lista` };
  }
  return { clave: claves[0] };
}

/** Una entrada por persona de Alta: qué empresa y número le quedan y qué observación lleva. */
function planCorreccion_(personas, sage, empresas) {
  const revisadas = personas.filter(p => p.alta && p.nombre)
    .map(persona => ({ persona, sage: buscarEnSage_(persona, sage, empresas) }));
  const duenos = {}; // clave -> personas que la tienen bien asignada
  revisadas.filter(r => r.sage.clave).forEach(r => {
    duenos[r.sage.clave] = (duenos[r.sage.clave] || []).concat([r.persona]);
  });
  const clavesDeSage = sage.map(s => clave_(s.empresa, s.codigo));
  const provisionales = [];
  let siguiente = personas.reduce((mayor, p) => Math.max(mayor, Number(p.idSage) + 1 || 0), PRIMER_NUMERO_PROVISIONAL);

  return revisadas.map(({ persona, sage: encontrado }) => {
    const queda = (accion, empresa, codigo, observacion) => ({ accion, persona, empresa, codigo, observacion });
    if (encontrado.clave) {
      const [empresa, codigo] = encontrado.clave.split('|');
      const cambia = empresa !== persona.empresa || codigo !== persona.idSage;
      return queda(cambia ? 'CAMBIAR' : 'CORRECTO', empresa, codigo, '');
    }
    const motivo = encontrado.motivo || 'No está en el export de SAGE';
    const actual = clave_(persona.empresa, persona.idSage);
    const otros = (duenos[actual] || []).filter(o => !esLaMismaPersona_(o, persona));
    const ocupado = persona.idSage && (otros.length > 0 || clavesDeSage.indexOf(actual) !== -1);
    if (!ocupado) {
      if (persona.idSage) duenos[actual] = (duenos[actual] || []).concat([persona]);
      if (encontrado.sinSage) return queda('SIN_SAGE', persona.empresa, persona.idSage, '');
      const falta = persona.idSage ? 'se conserva su número' : 'no tiene número';
      return queda('REVISAR', persona.empresa, persona.idSage, `${motivo}; ${falta}.`);
    }
    const previo = provisionales.find(x => x.clave === actual && esLaMismaPersona_(x.persona, persona));
    const numero = previo ? previo.numero : String(siguiente++);
    if (!previo) provisionales.push({ clave: actual, persona, numero });
    return queda('NUMERO_PROVISIONAL', persona.empresa, numero,
      `${motivo} y su número ${persona.idSage} es de otra persona: se le pone el provisional ${numero}.`);
  });
}

/** Posición de «Observaciones»; si no existe, la crea al final. */
function columnaObservaciones_(hoja) {
  const cabecera = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(texto_);
  const i = cabecera.indexOf(COLUMNA_OBSERVACIONES);
  if (i !== -1) return i + 1;
  const nueva = cabecera.length + 1;
  if (nueva > hoja.getMaxColumns()) hoja.insertColumnAfter(hoja.getMaxColumns());
  hoja.getRange(1, nueva).setValue(COLUMNA_OBSERVACIONES);
  return nueva;
}

function aplicar_(libro, plan) {
  const columnasDeHoja = {};
  plan.forEach(c => {
    const nombre = c.persona.pestana;
    const hoja = libro.getSheetByName(nombre);
    if (!columnasDeHoja[nombre]) {
      columnasDeHoja[nombre] = Object.assign(columnasDe_(hoja), { observaciones: columnaObservaciones_(hoja) });
    }
    const columnas = columnasDeHoja[nombre];
    const celda = columna => hoja.getRange(c.persona.fila, columna);
    if (c.empresa !== c.persona.empresa) celda(columnas.empresa).setValue(c.empresa);
    if (c.codigo !== c.persona.idSage) celda(columnas.idSage).setValue(Number(c.codigo));

    const anterior = texto_(celda(columnas.observaciones).getValue());
    const aMano = anterior.split(MARCA_OBSERVACION)[0].replace(/[\s|]+$/, '');
    const nuestra = c.observacion ? MARCA_OBSERVACION + c.observacion : '';
    const texto = [aMano, nuestra].filter(Boolean).join(' | ');
    if (texto !== anterior) celda(columnas.observaciones).setValue(texto);
    if (c.observacion) celda(columnas.idSage).setBackground(COLOR_REVISAR);
    else if (anterior.indexOf(MARCA_OBSERVACION) !== -1) celda(columnas.idSage).setBackground(null);
  });
}

function corregirEmpresaIdSage_(escribir) {
  const libro = SpreadsheetApp.getActive();
  const plan = planCorreccion_(leerPersonas_(libro), leerSage_(), leerEmpresas_(libro));

  const filas = plan.filter(c => c.accion !== 'CORRECTO' && c.accion !== 'SIN_SAGE').map(c => [c.accion, c.persona.pestana, c.persona.fila,
    c.persona.nombre, c.persona.empresa, c.persona.idSage, c.empresa, c.codigo, c.observacion]);
  const informe = libro.getSheetByName(HOJA_CORRECCION) || libro.insertSheet(HOJA_CORRECCION);
  informe.clearContents();
  const todas = [CABECERA_CORRECCION].concat(filas);
  informe.getRange(1, 1, todas.length, CABECERA_CORRECCION.length).setValues(todas);

  if (escribir) aplicar_(libro, plan);

  const cuantas = accion => plan.filter(c => c.accion === accion).length;
  const resumen = {
    escrito: escribir,
    correctas: cuantas('CORRECTO'),
    cambiar: cuantas('CAMBIAR'),
    numeroProvisional: cuantas('NUMERO_PROVISIONAL'),
    revisar: cuantas('REVISAR'),
    sinSage: cuantas('SIN_SAGE'),
  };
  Logger.log(JSON.stringify(resumen));
  return resumen;
}

/** Desde el editor: escribe solo el informe. */
function simularCorreccionEmpresaIdSage() {
  return corregirEmpresaIdSage_(false);
}

/** Desde el editor: aplica el informe en las pestañas. */
function ejecutarCorreccionEmpresaIdSage() {
  return corregirEmpresaIdSage_(true);
}
