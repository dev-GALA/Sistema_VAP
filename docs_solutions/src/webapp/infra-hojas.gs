// Adaptador de lectura del libro propio de la webapp (ADR-0018). Solo lee: la versión 1 no escribe.
// Las columnas se localizan por el NOMBRE de su cabecera, no por posición (RNF-02).

function esFecha_(valor) {
  // Se comprueba por el tipo y no con instanceof, que falla entre ámbitos distintos.
  return Object.prototype.toString.call(valor) === '[object Date]';
}

// Google Sheets convierte «2026-11» en una fecha al teclearlo. Se devuelve siempre como texto AAAA-MM.
function periodoDeCelda_(valor) {
  if (esFecha_(valor)) return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM');
  return String(valor).trim();
}

function textoDeCelda_(valor) {
  return String(valor === null || valor === undefined ? '' : valor).trim();
}

/**
 * Lee una hoja como lista de objetos. `columnas` asocia el nombre lógico con el de la cabecera.
 * Lanza un error de configuración si falta la hoja o alguna columna, y dice cuál.
 */
function leerTabla_(nombreHoja, columnas) {
  const libro = SpreadsheetApp.openById(idLibroWebapp_());
  const hoja = libro.getSheetByName(nombreHoja);
  if (!hoja) throw errorDeConfiguracion_(`Falta la hoja «${nombreHoja}» en el libro de la webapp.`);

  const valores = hoja.getDataRange().getValues();
  const cabecera = valores[0].map((c) => textoDeCelda_(c).toLowerCase());
  const indices = {};
  const faltan = [];
  Object.keys(columnas).forEach((clave) => {
    const posicion = cabecera.indexOf(columnas[clave]);
    if (posicion === -1) faltan.push(columnas[clave]);
    else indices[clave] = posicion;
  });
  if (faltan.length > 0) {
    throw errorDeConfiguracion_(`En la hoja «${nombreHoja}» faltan las columnas: ${faltan.join(', ')}.`);
  }

  return valores
    .slice(1)
    .filter((fila) => fila.some((celda) => textoDeCelda_(celda) !== ''))
    .map((fila) => {
      const objeto = {};
      Object.keys(indices).forEach((clave) => {
        objeto[clave] = fila[indices[clave]];
      });
      return objeto;
    });
}

/**
 * De la hoja `config` a { clave: valor }. Una clave repetida es un error de configuración: no se elige
 * una de las dos en silencio, porque la lista de correos con acceso depende de ellas.
 */
function leerConfiguracion_() {
  const config = {};
  leerTabla_(HOJA_CONFIG, COLUMNAS_CONFIG).forEach((fila) => {
    const clave = textoDeCelda_(fila.clave).toLowerCase();
    if (clave === '') return;
    if (Object.keys(config).indexOf(clave) !== -1) {
      throw errorDeConfiguracion_(`La clave «${clave}» está repetida en la hoja «${HOJA_CONFIG}».`);
    }
    config[clave] = textoDeCelda_(fila.valor);
  });
  return config;
}

function leerUsuarios_() {
  return usuariosDeConfiguracion_(leerConfiguracion_());
}

function leerEstadoPasos_() {
  return leerTabla_(HOJA_ESTADO_PASOS, COLUMNAS_ESTADO_PASOS).map((fila) => ({
    periodo: periodoDeCelda_(fila.periodo),
    pasoId: textoDeCelda_(fila.pasoId),
    estado: textoDeCelda_(fila.estado).toLowerCase(),
    actualizadoPor: textoDeCelda_(fila.actualizadoPor),
    actualizadoEn: textoDeCelda_(fila.actualizadoEn),
  }));
}
