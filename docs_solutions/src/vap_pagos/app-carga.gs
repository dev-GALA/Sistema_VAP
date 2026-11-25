// Caso de uso de la CARGA INICIAL de cuentas, de uso único (ADR-0020 · RF-89). Las dependencias llegan inyectadas.
//
// dependencias = las de `guardarCuentas_` más { leerCuentasDelExcel(), leerPersonasMaestro(), escribirInformeCarga(filas),
//                                                 escribirHojasDeCarga(hojas), marcarHuellaEnMaestro(ids), quedaTiempo() }
//
// LA CUENTA SOLO EXISTE EN MEMORIA (RNF-19): ni el informe ni el resultado la contienen.

const TAMANO_LOTE_CARGA = 20;

function lineasDeResumen_(simulacion, resumen, guardadas, pendientes, errores, avisos, marcadas) {
  const lineas = [
    ['Modo', simulacion ? 'SIMULACIÓN (no se ha guardado nada)' : 'CARGA REAL'],
    ['Filas leídas del Excel de la carga inicial', resumen.filasLeidas],
    ['Filas ignoradas (títulos o vacías)', resumen.ignoradas],
    ['DNI repetidos con la misma cuenta', resumen.repetidas],
    ['Ids repetidos en el maestro (se cargan una vez)', resumen.idsRepetidosEnMaestro],
    ['Ya registradas (no se tocan)', resumen.yaRegistradas],
    ['Cuentas a cargar', resumen.cuentasACargar],
    ['Guardadas en esta ejecución', guardadas],
    ['Pendientes (vuelve a ejecutar si quedan)', pendientes],
    ['Errores al guardar', errores],
    ['Avisos del servicio', avisos],
    ['Casillas «Huella» marcadas en el maestro', marcadas],
  ];
  return lineas.map((l) => ['RESUMEN', '', '', '', `${l[0]}: ${l[1]}`]);
}

/** Guarda un lote y devuelve las filas de informe de lo que no fue limpio (errores y avisos). */
function guardarLote_(dependencias, lote, usuario) {
  const resultados = guardarCuentas_(dependencias, {
    usuario,
    cuentas: lote.map((c) => ({ idPersonal: c.idPersonal, dni: c.dni, iban: c.iban })),
  });
  const informe = [];
  let guardadas = 0;
  let errores = 0;
  let avisos = 0;
  resultados.forEach((resultado, posicion) => {
    const cuenta = lote[posicion];
    if (resultado.estado === 'guardada') {
      guardadas += 1;
      (resultado.avisos || []).forEach((aviso) => {
        avisos += 1;
        informe.push(['aviso', cuenta.fila, cuenta.dni, cuenta.idPersonal, aviso]);
      });
      return;
    }
    errores += 1;
    informe.push(['error-al-guardar', cuenta.fila, cuenta.dni, cuenta.idPersonal, resultado.detalle]);
  });
  return { informe, guardadas, errores, avisos };
}

/**
 * Cruza el Excel de la carga inicial con el maestro y, si no es simulación, guarda las cuentas por lotes mientras quede tiempo.
 * Es repetible: lo ya registrado no se toca, así que tras un corte por tiempo basta volver a ejecutarla.
 * Devuelve solo cifras: { simulacion, guardadas, pendientes, erroresAlGuardar, avisos, marcadas, resumen }.
 */
function cargaInicial_(dependencias, datos) {
  const simulacion = datos.simulacion !== false;
  const usuario = exigirTexto_(datos.usuario, 'quién carga las cuentas');
  const tamanoLote = Number.isInteger(datos.tamanoLote) && datos.tamanoLote > 0 ? datos.tamanoLote : TAMANO_LOTE_CARGA;
  const registradas = dependencias.leerHuellas().map((h) => h.idPersonal);
  const filasDelExcel = dependencias.leerCuentasDelExcel();
  const personas = dependencias.leerPersonasMaestro();
  const plan = planCargaInicial_(filasDelExcel, personas, registradas);

  let guardadas = 0;
  let errores = 0;
  let avisos = 0;
  let pendientes = plan.cuentas.length;
  let marcadas = 0;
  const incidenciasDeGuardado = [];
  if (!simulacion) {
    let posicion = 0;
    while (posicion < plan.cuentas.length && dependencias.quedaTiempo()) {
      const lote = plan.cuentas.slice(posicion, posicion + tamanoLote);
      const resultado = guardarLote_(dependencias, lote, usuario);
      guardadas += resultado.guardadas;
      errores += resultado.errores;
      avisos += resultado.avisos;
      resultado.informe.forEach((fila) => {
        incidenciasDeGuardado.push(fila);
      });
      posicion += lote.length;
    }
    pendientes = plan.cuentas.length - posicion;
    // Se marcan TODAS las personas con huella (no solo las de esta ejecución): así se corrige un corte entre guardar y marcar.
    try {
      marcadas = dependencias.marcarHuellaEnMaestro(dependencias.leerHuellas().map((h) => h.idPersonal));
    } catch (error) {
      incidenciasDeGuardado.push([
        'error-al-marcar',
        '',
        '',
        '',
        `Las huellas están guardadas, pero no se pudo marcar la casilla Huella en el maestro: ${error.message}`,
      ]);
    }
  }

  // Las incidencias van en las hojas de detalle (con nombre y DNI); aquí solo el resumen y lo que falló al guardar o marcar.
  dependencias.escribirInformeCarga(
    lineasDeResumen_(simulacion, plan.resumen, guardadas, pendientes, errores, avisos, marcadas).concat(
      incidenciasDeGuardado,
    ),
  );
  const idsConHuella = simulacion ? registradas : dependencias.leerHuellas().map((h) => h.idPersonal);
  dependencias.escribirHojasDeCarga(informesDeCarga_(filasDelExcel, personas, plan, idsConHuella, simulacion));
  return { simulacion, guardadas, pendientes, erroresAlGuardar: errores, avisos, marcadas, resumen: plan.resumen };
}
