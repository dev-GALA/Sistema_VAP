/**
 * =========================================================
 *  USO ÚNICO · LLEVAR LOS id_trabajador NUEVOS A LAS HUELLAS Y A COMPLEMENTOS
 *  (Mismo proyecto que los otros scripts de VAP_Personas. SE BORRA cuando termine.)
 * =========================================================
 *
 * Se usa DESPUÉS de `instalarCentinela`, que deja en «copia_id_trabajador» el id anterior de cada fila. Cambia SOLO la
 * celda del id en:
 *   - VAP_Pagos, hoja «huellas» (columna id_trabajador). La huella no depende del id, así que sigue valiendo.
 *   - Complementos, hoja «Data» (columna ID_Secretaria).
 * Cada fila se empareja por id anterior + DNI. Lo que no se puede saber con seguridad no se toca y queda anotado.
 * Si dos huellas quedan con el mismo DNI y el mismo id (y la misma huella), se conserva una y SE BORRA la sobrante.
 *
 * Propiedades del script: ID_LIBRO_VAP_PAGOS e ID_LIBRO_COMPLEMENTOS. Funciones: `simularActualizacionIds` (solo el
 * informe, en la hoja «actualizacion_ids») y `ejecutarActualizacionIds`. Se puede repetir.
 */

const HOJA_ACTUALIZACION = 'actualizacion_ids';
const CABECERA_ACTUALIZACION = ['accion', 'libro', 'fila', 'id_anterior', 'id_nuevo', 'detalle'];
const DESTINOS_DE_ID = [
  { libro: 'VAP_Pagos', propiedad: PROPIEDAD_LIBRO_PAGOS, hoja: 'huellas', id: 'id_trabajador', dni: 'dni',
    sinRepetir: true },
  { libro: 'Complementos', propiedad: PROPIEDAD_LIBRO_COMPLEMENTOS, hoja: 'Data', id: 'ID_Secretaria',
    dni: 'DNI_Secretaria', pestanaPreferida: 'VAP_Secretarias' },
];

/**
 * Cambios que la copia no recoge: en estas filas de VAP_Profesores la columna id_trabajador ya se había recalculado
 * tras corregir Empresa e Id_Sage, antes de guardar «copia_id_trabajador».
 */
const CAMBIOS_FUERA_DE_LA_COPIA = [
  ['CERVANTES_154', 'DRIVERS_16'],
  ['ARCOVIAL_54', 'CERVANTES_626'],
  ['ARCOVIAL_44', 'VALDEARROYOS_231'],
  ['VALDEARROYOS_191', 'GALA_663'],
  ['ARCOVIAL_57', 'VALDEARROYOS_126'],
].map(([anterior, nuevo]) => ({ pestana: 'VAP_Profesores', anterior, nuevo, dni: '' }));

function dniLimpio_(valor) {
  return texto_(valor).toUpperCase().replace(/[\s-]/g, '');
}

/** Las parejas id anterior → id nuevo, una por fila del maestro que tenía id. */
function leerCambiosDeId_(libro) {
  const hoja = libro.getSheetByName(HOJA_COPIA_ID);
  if (!hoja) throw new Error(`No existe «${HOJA_COPIA_ID}»: ejecuta antes instalarCentinela.`);
  return hoja.getDataRange().getValues().slice(1)
    .map(f => ({
      pestana: texto_(f[0]), anterior: texto_(f[2]), dni: dniLimpio_(f[5]),
      nuevo: idCorrecto_({ empresa: texto_(f[3]), idSage: texto_(f[4]) }),
    }))
    .filter(c => c.anterior && c.nuevo)
    .concat(CAMBIOS_FUERA_DE_LA_COPIA);
}

function sinRepetidos_(lista) {
  return lista.filter((valor, i) => lista.indexOf(valor) === i);
}

/** Qué hacer con una fila de destino: { accion, nuevo, detalle }; null si no hay nada que decir. */
function decidirId_(id, dni, cambios, pestanaPreferida) {
  // Ya actualizada (permite repetir): esa persona tiene ese id como nuevo y no como anterior pendiente de cambiar.
  const yaEsNuevo = cambios.some(c => c.nuevo === id && (!dni || c.dni === dni));
  let candidatos = cambios.filter(c => c.anterior === id && (!dni || !c.dni || c.dni === dni));
  const quedaPendiente = candidatos.some(c => c.nuevo !== id);
  if (yaEsNuevo && (!quedaPendiente || (dni && cambios.some(c => c.nuevo === id && c.dni === dni)))) return null;
  if (!candidatos.length) {
    const detalle = cambios.some(c => c.anterior === id) ?
      'El DNI no coincide con el del maestro para ese id' : 'Ese id no está en el maestro';
    return { accion: 'REVISAR', nuevo: '', detalle };
  }
  if (yaEsNuevo && !dni) {
    return { accion: 'REVISAR', nuevo: '', detalle: 'Sin DNI y el id sirve a la vez de anterior y de nuevo' };
  }
  const preferidos = candidatos.filter(c => c.pestana === pestanaPreferida);
  if (preferidos.length) candidatos = preferidos;
  const nuevos = sinRepetidos_(candidatos.map(c => c.nuevo));
  if (nuevos.length > 1) {
    return { accion: 'REVISAR', nuevo: '', detalle: `Puede ser ${nuevos.join(' o ')}` };
  }
  return nuevos[0] === id ? null : { accion: 'CAMBIAR', nuevo: nuevos[0], detalle: '' };
}

function planDeDestino_(destino, cambios) {
  const idLibro = PropertiesService.getScriptProperties().getProperty(destino.propiedad);
  if (!idLibro) throw new Error(`Falta la propiedad del script ${destino.propiedad}.`);
  const hoja = SpreadsheetApp.openById(idLibro).getSheetByName(destino.hoja);
  if (!hoja) throw new Error(`En ${destino.libro} no existe la hoja «${destino.hoja}».`);
  const valores = hoja.getDataRange().getValues();
  const cabecera = valores[0].map(texto_);
  const columnaId = cabecera.indexOf(destino.id);
  if (columnaId === -1) throw new Error(`En «${destino.hoja}» falta la columna «${destino.id}».`);
  const columnaDni = cabecera.indexOf(destino.dni);

  const filas = valores.slice(1).map((f, i) => {
    const id = texto_(f[columnaId]);
    const dni = columnaDni === -1 ? '' : dniLimpio_(f[columnaDni]);
    const decision = id ? decidirId_(id, dni, cambios, destino.pestanaPreferida) : null;
    const huella = texto_(f[cabecera.indexOf('huella')]);
    return { fila: i + 2, id, dni, huella, decision };
  });
  if (destino.sinRepetir) resolverParejasRepetidas_(filas);
  return { destino, hoja, columna: columnaId + 1, filas: filas.filter(f => f.decision) };
}

/** En «huellas» solo puede haber una fila por pareja DNI + id: de las que coincidirían queda una. */
function resolverParejasRepetidas_(filas) {
  const cambia = f => Boolean(f.decision) && f.decision.accion === 'CAMBIAR';
  const grupos = agrupar_(filas, f => (f.id ? `${f.dni}|${cambia(f) ? f.decision.nuevo : f.id}` : ''));
  grupos.forEach(grupo => {
    if (grupo.length < 2 || !grupo.some(cambia)) return;
    const idFinal = grupo.filter(cambia)[0].decision.nuevo;
    const segura = grupo.every(f => f.dni && f.huella && f.huella === grupo[0].huella);
    if (!segura) {
      grupo.filter(cambia).forEach(f => {
        f.decision = { accion: 'REVISAR', nuevo: '',
          detalle: `Quedarían dos filas con ${idFinal} y no tienen el mismo DNI y huella` };
      });
      return;
    }
    const queda = grupo.filter(f => !cambia(f))[0] || grupo[0];
    grupo.filter(f => f !== queda).forEach(f => {
      f.decision = { accion: 'BORRAR', nuevo: '', detalle: `Sobra: la fila ${queda.fila} queda con ${idFinal}` };
    });
  });
}

function actualizarIds_(escribir) {
  const libro = SpreadsheetApp.getActive();
  const cambios = leerCambiosDeId_(libro);
  // Primero se leen todos los destinos: si falta algo, no se escribe en ninguno.
  const planes = DESTINOS_DE_ID.map(destino => planDeDestino_(destino, cambios));

  const detalle = [];
  const resumen = { escrito: escribir };
  planes.forEach(plan => {
    const cuenta = { cambiar: 0, borrar: 0, revisar: 0 };
    plan.filas.forEach(f => {
      const d = f.decision;
      detalle.push([d.accion, plan.destino.libro, f.fila, f.id, d.nuevo, d.detalle]);
      if (d.accion === 'CAMBIAR') {
        cuenta.cambiar += 1;
        if (escribir) plan.hoja.getRange(f.fila, plan.columna).setValue(d.nuevo);
      } else if (d.accion === 'BORRAR') cuenta.borrar += 1;
      else cuenta.revisar += 1;
    });
    // De abajo arriba, para que borrar una fila no mueva las que faltan.
    if (escribir) plan.filas.filter(f => f.decision.accion === 'BORRAR').reverse()
      .forEach(f => plan.hoja.deleteRow(f.fila));
    resumen[plan.destino.libro] = cuenta;
  });

  const informe = libro.getSheetByName(HOJA_ACTUALIZACION) || libro.insertSheet(HOJA_ACTUALIZACION);
  informe.clearContents();
  const todas = [CABECERA_ACTUALIZACION].concat(detalle);
  informe.getRange(1, 1, todas.length, CABECERA_ACTUALIZACION.length).setValues(todas);
  Logger.log(JSON.stringify(resumen));
  return resumen;
}

/** Desde el editor: escribe solo el informe. */
function simularActualizacionIds() {
  return actualizarIds_(false);
}

/** Desde el editor: cambia los id en VAP_Pagos y en Complementos. */
function ejecutarActualizacionIds() {
  return actualizarIds_(true);
}
