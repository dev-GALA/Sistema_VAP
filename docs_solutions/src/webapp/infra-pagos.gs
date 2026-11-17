// Adaptadores de las pantallas de Pagos: el cliente del servicio VAP_Pagos, la lectura del maestro y de la fuente de
// importes, y la marca de cuenta registrada (ADR-0019). Solo esta capa conoce los libros y la dirección del servicio.
//
// LA CUENTA BANCARIA NO SE ESCRIBE NUNCA (RNF-19): ni en hojas ni en registros ni en mensajes de error.

function hayServicioPagos_() {
  const propiedades = PropertiesService.getScriptProperties();
  return (
    !!propiedades.getProperty(PROPIEDAD_URL_SERVICIO_PAGOS) && !!propiedades.getProperty(PROPIEDAD_TOKEN_SERVICIO_PAGOS)
  );
}

/** Llama al servicio VAP_Pagos. Devuelve `datos` o lanza un error con el mensaje del servicio (sin datos de la petición). */
function llamarServicioPagos_(accion, datos) {
  const propiedades = PropertiesService.getScriptProperties();
  const url = propiedades.getProperty(PROPIEDAD_URL_SERVICIO_PAGOS);
  const token = propiedades.getProperty(PROPIEDAD_TOKEN_SERVICIO_PAGOS);
  if (!url || !token) throw errorDeConfiguracion_('Faltan las propiedades del servicio VAP_Pagos.');
  const respuesta = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ token, accion, datos }),
    muteHttpExceptions: true,
    followRedirects: true,
  });
  if (respuesta.getResponseCode() !== 200) {
    throw new Error(`El servicio VAP_Pagos no ha respondido correctamente (código ${respuesta.getResponseCode()}).`);
  }
  let cuerpo;
  try {
    cuerpo = JSON.parse(respuesta.getContentText());
  } catch (error) {
    throw new Error('El servicio VAP_Pagos ha devuelto una respuesta que no se entiende.');
  }
  if (!cuerpo.ok) throw new Error(cuerpo.error || 'El servicio VAP_Pagos ha fallado.');
  return cuerpo.datos;
}

/** Las filas del maestro de cada empresa configurada: [{ empresa, filas: [{ idTrabajador, nombre, apellidos, dni, fechaBaja }] }]. */
function leerFilasDelMaestro_(config, empresas) {
  return empresas.map((empresa) => {
    const hoja = hojaDelMaestro_(config, empresa.nombre, empresas);
    const valores = hoja.getDataRange().getValues();
    const indices = indicesDeColumnas_(valores[0], COLUMNAS_MAESTRO, hoja.getName());
    const filas = valores.slice(1).map((fila) => ({
      idTrabajador: textoDeCelda_(fila[indices.idTrabajador]),
      nombre: textoDeCelda_(fila[indices.nombre]),
      apellidos: textoDeCelda_(fila[indices.apellidos]),
      dni: textoDeCelda_(fila[indices.dni]),
      fechaBaja: textoDeCelda_(fila[indices.fechaBaja]),
    }));
    return { empresa: empresa.nombre, filas };
  });
}

/** Marca en el maestro que la cuenta de la persona consta en VAP_Pagos: «sí» y la fecha. Sin huella ni dígitos (RF-97). */
function marcarCuentaEnMaestro_(config, empresas, persona) {
  const hoja = hojaDelMaestro_(config, persona.empresa, empresas);
  const valores = hoja.getDataRange().getValues();
  const indices = indicesDeColumnas_(
    valores[0],
    Object.assign({}, COLUMNAS_MAESTRO, COLUMNAS_MARCA_CUENTA),
    hoja.getName(),
  );
  const filas = [];
  for (let fila = 1; fila < valores.length; fila++) {
    if (textoDeCelda_(valores[fila][indices.idTrabajador]) === persona.idTrabajador) filas.push(fila);
  }
  if (filas.length !== 1) throw new Error('No se encuentra a la persona en el maestro de forma única.');
  hoja.getRange(filas[0] + 1, indices.cuentaEnPagos + 1).setValue(VALOR_CUENTA_EN_PAGOS);
  hoja.getRange(filas[0] + 1, indices.cuentaEnPagosFecha + 1).setValue(ahora_());
}

/** Importes esperados de una empresa y un periodo según la fuente configurada: [{ dni, importe }]. */
function leerFuenteDeImportes_(config, empresa, periodo) {
  const libro = SpreadsheetApp.openById(textoDeCelda_(config[CLAVE_CONFIG_VINCULACION_LIBRO]));
  const nombreHoja = hojaDeFuente_(config[CLAVE_CONFIG_VINCULACION_HOJA], empresa, periodo);
  const hoja = libro.getSheetByName(nombreHoja);
  if (!hoja) throw errorDeConfiguracion_(`Falta la hoja «${nombreHoja}» en el libro de la fuente de importes.`);
  const valores = hoja.getDataRange().getValues();
  const columnas = {
    dni: textoDeCelda_(config[CLAVE_CONFIG_VINCULACION_COL_DNI]).toLowerCase(),
    importe: textoDeCelda_(config[CLAVE_CONFIG_VINCULACION_COL_IMPORTE]).toLowerCase(),
  };
  // La cabecera se localiza por su TEXTO, no por la posición de la fila.
  const filaCabecera = valores.findIndex((f) => {
    const nombres = f.map((c) => textoDeCelda_(c).toLowerCase());
    return nombres.indexOf(columnas.dni) !== -1 && nombres.indexOf(columnas.importe) !== -1;
  });
  if (filaCabecera === -1)
    throw errorDeConfiguracion_(
      `En la hoja «${nombreHoja}» no se encuentran las columnas «${columnas.dni}» y «${columnas.importe}».`,
    );
  const nombres = valores[filaCabecera].map((c) => textoDeCelda_(c).toLowerCase());
  return valores
    .slice(filaCabecera + 1)
    .map((fila) => ({ dni: fila[nombres.indexOf(columnas.dni)], importe: fila[nombres.indexOf(columnas.importe)] }));
}
