// Adaptador de la CARGA INICIAL de cuentas, de USO ÚNICO (ADR-0020 · RF-89). Se ejecuta a mano desde el editor de Apps
// Script, con las funciones públicas `cargaInicialSimular` (no guarda nada) y `cargaInicialEjecutar`. Cuando termine la
// carga, este archivo y `app-carga.gs`/`dominio-carga.gs` se borran del proyecto.
//
// Necesita dos propiedades del script: ID_LIBRO_VAP_Personas (VAP_BBDD_Personas) e ID_LIBRO_CARGA_INICIAL (el Excel de la
// carga inicial convertido a hoja de Google, temporal). Las cuentas de ese Excel solo se leen: nunca se escriben.

/**
 * Las filas del Excel de la carga inicial (primera hoja del libro): { fila, nombre, dni, cuenta, empresa }.
 * El nombre está en la columna A y la empresa es el último título de empresa que precede a la fila.
 */
function leerCuentasDelExcel_() {
  const hoja = SpreadsheetApp.openById(propiedad_(PROPIEDAD_ID_LIBRO_CARGA_INICIAL)).getSheets()[0];
  const { indices } = indicesDeCabecera_(hoja, COLUMNAS_CARGA_INICIAL);
  const valores = hoja.getDataRange().getValues();
  const filas = [];
  let empresa = '';
  for (let i = 1; i < valores.length; i++) {
    const nombre = textoDeCelda_(valores[i][0]);
    const dni = textoDeCelda_(valores[i][indices.dni]);
    const cuenta = textoDeCelda_(valores[i][indices.cuenta]);
    if (nombre === '' && dni === '' && cuenta === '') continue;
    if (dni === '' && cuenta === '') empresa = nombre;
    filas.push({ fila: i + 1, nombre, dni, cuenta, empresa });
  }
  return filas;
}

/** La posición de la primera cabecera que exista entre los candidatos (o -1). */
function primeraColumna_(cabecera, candidatos) {
  const encontrada = candidatos.filter((c) => cabecera.indexOf(c) !== -1)[0];
  return encontrada === undefined ? -1 : cabecera.indexOf(encontrada);
}

/** Las personas de las tres pestañas del maestro, leídas por el nombre de sus cabeceras. */
function leerPersonasMaestro_() {
  const libro = SpreadsheetApp.openById(propiedad_(PROPIEDAD_ID_LIBRO_VAP_PERSONAS));
  return HOJAS_MAESTRO.reduce((todas, pestana) => {
    const hoja = hojaExistente_(libro, pestana);
    const { indices } = indicesDeCabecera_(hoja, COLUMNAS_MAESTRO);
    const cabecera = hoja
      .getRange(1, 1, 1, hoja.getLastColumn())
      .getValues()[0]
      .map((c) => textoDeCelda_(c).toLowerCase());
    const columnaNombre = primeraColumna_(cabecera, COLUMNAS_NOMBRE_MAESTRO);
    const columnaAlta = primeraColumna_(cabecera, COLUMNAS_FECHA_ALTA_MAESTRO);
    const columnaBaja = primeraColumna_(cabecera, COLUMNAS_FECHA_BAJA_MAESTRO);
    const texto = (fila, columna) => (columna === -1 ? '' : textoDeCelda_(fila[columna]));
    const valores = hoja.getDataRange().getValues();
    const personas = [];
    for (let i = 1; i < valores.length; i++) {
      const fila = valores[i];
      if (!fila.some((c) => textoDeCelda_(c) !== '')) continue;
      personas.push({
        idPersonal: texto(fila, indices.idPersonal),
        dni: texto(fila, indices.dni),
        empresa: texto(fila, indices.empresa),
        activa: texto(fila, indices.alta).toLowerCase() === 'true',
        nombre: texto(fila, columnaNombre),
        pestana,
        fila: i + 1,
        fechaAlta: texto(fila, columnaAlta),
        fechaBaja: texto(fila, columnaBaja),
      });
    }
    return todas.concat(personas);
  }, []);
}

/**
 * Marca la casilla «Huella» de las personas indicadas, en la pestaña del maestro donde estén (por `id_trabajador`).
 * Solo pone en «marcada» lo que estaba sin marcar: no desmarca nada ni toca otra columna. Devuelve cuántas marcó.
 */
function marcarHuellaEnMaestro_(idsPersonal) {
  const libro = SpreadsheetApp.openById(propiedad_(PROPIEDAD_ID_LIBRO_VAP_PERSONAS));
  const buscados = {};
  idsPersonal.forEach((id) => {
    buscados[id] = true;
  });
  let marcadas = 0;
  HOJAS_MAESTRO.forEach((nombre) => {
    const hoja = hojaExistente_(libro, nombre);
    const { indices } = indicesDeCabecera_(hoja, COLUMNAS_MARCA_HUELLA);
    const filas = hoja.getLastRow() - 1;
    if (filas < 1) return;
    const ids = hoja.getRange(2, indices.idPersonal + 1, filas, 1).getValues();
    const rango = hoja.getRange(2, indices.huella + 1, filas, 1);
    const actuales = rango.getValues();
    let cambios = 0;
    const nuevos = actuales.map((valor, i) => {
      if (buscados[textoDeCelda_(ids[i][0])] === true && valor[0] !== true) {
        cambios += 1;
        return [true];
      }
      return valor;
    });
    if (cambios > 0) rango.setValues(nuevos);
    marcadas += cambios;
  });
  return marcadas;
}

/** Sustituye el contenido de la hoja `carga_inicial` (la crea si no existe). Lleva DNI y motivos, nunca la cuenta. */
function escribirInformeCarga_(filas) {
  const libro = libroPagos_();
  const hoja = libro.getSheetByName(HOJA_CARGA_INICIAL) || libro.insertSheet(HOJA_CARGA_INICIAL);
  hoja.clearContents();
  const todas = [CABECERA_CARGA_INICIAL].concat(filas);
  hoja.getRange(1, 1, todas.length, CABECERA_CARGA_INICIAL.length).setValues(todas);
}

/**
 * Escribe las hojas de detalle de la carga en el libro TEMPORAL del Excel (con nombre y DNI, sin cuentas). Cada hoja se
 * crea si no existe y se sustituye entera en cada ejecución.
 */
function escribirHojasDeCarga_(hojas) {
  const libro = SpreadsheetApp.openById(propiedad_(PROPIEDAD_ID_LIBRO_CARGA_INICIAL));
  hojas.forEach((detalle) => {
    const nombre = HOJAS_DETALLE_CARGA[detalle.clave];
    const hoja = libro.getSheetByName(nombre) || libro.insertSheet(nombre);
    hoja.clearContents();
    const todas = [detalle.cabecera].concat(detalle.filas);
    hoja.getRange(1, 1, todas.length, detalle.cabecera.length).setValues(todas);
  });
}

function dependenciasDeCarga_() {
  const inicio = new Date().getTime();
  return Object.assign(dependencias_(), {
    leerCuentasDelExcel: leerCuentasDelExcel_,
    leerPersonasMaestro: leerPersonasMaestro_,
    escribirInformeCarga: escribirInformeCarga_,
    escribirHojasDeCarga: escribirHojasDeCarga_,
    marcarHuellaEnMaestro: marcarHuellaEnMaestro_,
    quedaTiempo: () => new Date().getTime() - inicio < PRESUPUESTO_TIEMPO_CARGA_MS,
  });
}

function usuarioQueEjecuta_() {
  return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
}

function ejecutarCargaInicial_(simulacion) {
  const resultado = cargaInicial_(dependenciasDeCarga_(), { simulacion, usuario: usuarioQueEjecuta_() });
  Logger.log(JSON.stringify(resultado));
  return resultado;
}

/** PÚBLICA (uso único): cruza y cuenta, escribe el informe en `carga_inicial` y NO guarda ninguna huella. */
function cargaInicialSimular() {
  return ejecutarCargaInicial_(true);
}

/** PÚBLICA (uso único): guarda las huellas. Si se acaba el tiempo, para y se vuelve a ejecutar: continúa. */
function cargaInicialEjecutar() {
  return ejecutarCargaInicial_(false);
}
