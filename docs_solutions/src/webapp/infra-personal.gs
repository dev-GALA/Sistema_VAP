// Adaptadores del alta y la baja de personas: el maestro de personas y el registro de eventos. Solo esta capa conoce
// los libros (ADR-0017, ADR-0018). La huella de la cuenta ya NO se calcula aquí: lo hace el servicio VAP_Pagos (ADR-0019).
//
// LA CUENTA BANCARIA NO SE ESCRIBE NUNCA (RNF-19): solo existe en memoria mientras se calcula su huella.

function indicesDeColumnas_(cabecera, columnas, nombreHoja) {
  const nombres = cabecera.map((c) => textoDeCelda_(c).toLowerCase());
  const indices = {};
  const faltan = [];
  Object.keys(columnas).forEach((clave) => {
    const posicion = nombres.indexOf(columnas[clave]);
    if (posicion === -1) faltan.push(columnas[clave]);
    else indices[clave] = posicion;
  });
  if (faltan.length > 0) {
    throw errorDeConfiguracion_(`En la hoja «${nombreHoja}» faltan las columnas: ${faltan.join(', ')}.`);
  }
  return indices;
}

function hojaDelMaestro_(config, empresa, empresas) {
  const destino = empresas.filter((e) => e.nombre === empresa)[0];
  if (!destino) throw errorDeConfiguracion_('La empresa no está en la configuración.');
  const libro = SpreadsheetApp.openById(textoDeCelda_(config[CLAVE_CONFIG_LIBRO_MAESTRO]));
  const hoja = libro.getSheetByName(destino.pestana);
  if (!hoja) throw errorDeConfiguracion_(`Falta la pestaña «${destino.pestana}» en el maestro de personas.`);
  return hoja;
}

function filaDeLaPersona_(valores, indices, dni) {
  const coincidencias = [];
  for (let fila = 1; fila < valores.length; fila++) {
    if (normalizarDni_(valores[fila][indices.dni]) === dni) coincidencias.push(fila);
  }
  return coincidencias;
}

/** Alta: añade la persona al final de la pestaña de su empresa. Baja: pone la fecha de baja. */
function aplicarEnMaestro_(config, empresas, registro) {
  const hoja = hojaDelMaestro_(config, registro.empresa, empresas);
  const valores = hoja.getDataRange().getValues();
  const indices = indicesDeColumnas_(valores[0], COLUMNAS_MAESTRO, hoja.getName());
  const filas = filaDeLaPersona_(valores, indices, registro.dni);

  if (registro.accion === 'alta') {
    if (filas.length > 0) throw new Error('Esa persona ya consta en la pestaña de esa empresa.');
    const nueva = valores[0].map(() => '');
    nueva[indices.idTrabajador] = registro.idTrabajador;
    nueva[indices.nombre] = registro.nombre;
    nueva[indices.apellidos] = registro.apellidos;
    nueva[indices.dni] = registro.dni;
    nueva[indices.fechaAlta] = registro.fecha;
    hoja.appendRow(nueva);
    return;
  }

  if (filas.length === 0) throw new Error('No se encuentra a esa persona en la pestaña de esa empresa.');
  if (filas.length > 1) throw new Error('Esa persona aparece más de una vez: no se puede dar de baja sin ambigüedad.');
  if (textoDeCelda_(valores[filas[0]][indices.fechaBaja]) !== '')
    throw new Error('Esa persona ya tiene fecha de baja.');
  hoja.getRange(filas[0] + 1, indices.fechaBaja + 1).setValue(registro.fecha);
}

function anadirEventoPersonal_(evento) {
  anadirFila_(SpreadsheetApp.openById(idLibroWebapp_()), HOJA_REGISTRO_PERSONAL, COLUMNAS_REGISTRO_PERSONAL, evento);
}
