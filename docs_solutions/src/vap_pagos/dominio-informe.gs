// El informe mensual: columnas, subsanación y fusión. Reglas puras (ADR-0019). RF-91 · RF-92 · RF-93 · RF-94.

const COLUMNAS_INFORME = [
  'fila_id',
  'periodo',
  'empresa',
  'parte',
  'estado',
  'id_personal',
  'nombre_banco',
  'huella',
  'ultimos4',
  'importe_banco',
  'importe_esperado',
  'banco',
  'referencia',
  'fuente',
  'observaciones',
  'resolucion',
  'asignada_a',
  'resuelto_por',
  'resuelto_en',
  'motivo_resolucion',
];

const RESOLUCIONES = ['asignado', 'aceptado', 'corregido-en-origen', 'descartado'];
const FORMATO_PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

function periodoValido_(periodo) {
  return FORMATO_PERIODO.test(textoDe_(periodo));
}

/** Una fila lógica del informe → los valores de la hoja, en el orden de COLUMNAS_INFORME. */
function filaDeInformeAValores_(fila) {
  const porColumna = {
    fila_id: fila.filaId,
    periodo: fila.periodo,
    empresa: fila.empresa,
    parte: fila.parte,
    estado: fila.estado,
    id_personal: fila.idPersonal,
    nombre_banco: fila.nombreBanco,
    huella: fila.huella,
    ultimos4: fila.ultimos4,
    importe_banco: fila.importeBanco,
    importe_esperado: fila.importeEsperado,
    banco: fila.banco,
    referencia: fila.referencia,
    fuente: fila.fuente,
    observaciones: fila.observaciones,
    resolucion: fila.resolucion || '',
    asignada_a: fila.asignadaA || '',
    resuelto_por: fila.resueltoPor || '',
    resuelto_en: fila.resueltoEn || '',
    motivo_resolucion: fila.motivoResolucion || '',
  };
  return COLUMNAS_INFORME.map((c) => (porColumna[c] === undefined ? '' : porColumna[c]));
}

function valoresAFilaDeInforme_(valores) {
  const v = {};
  COLUMNAS_INFORME.forEach((c, i) => {
    v[c] = textoDe_(valores[i]);
  });
  return {
    filaId: v.fila_id,
    periodo: v.periodo,
    empresa: v.empresa,
    parte: v.parte,
    estado: v.estado,
    idPersonal: v.id_personal,
    nombreBanco: v.nombre_banco,
    huella: v.huella,
    ultimos4: v.ultimos4,
    importeBanco: v.importe_banco,
    importeEsperado: v.importe_esperado,
    banco: v.banco,
    referencia: v.referencia,
    fuente: v.fuente,
    observaciones: v.observaciones,
    resolucion: v.resolucion,
    asignadaA: v.asignada_a,
    resueltoPor: v.resuelto_por,
    resueltoEn: v.resuelto_en,
    motivoResolucion: v.motivo_resolucion,
  };
}

/** Valida una subsanación. Solo se subsana un Incorrecto. Devuelve la lista de errores (vacía si vale). */
function validarSubsanacion_(fila, subsanacion) {
  const errores = [];
  if (!fila) return ['No existe esa fila del informe.'];
  if (fila.estado !== ESTADO_INCORRECTO) errores.push('Solo se pueden subsanar las filas Incorrecto.');
  if (RESOLUCIONES.indexOf(subsanacion.resolucion) === -1) errores.push('La resolución no es válida.');
  if (textoDe_(subsanacion.motivo) === '') errores.push('Falta el motivo de la subsanación.');
  if (subsanacion.resolucion === 'asignado' && textoDe_(subsanacion.asignadaA) === '')
    errores.push('Para asignar el pago hay que decir a qué persona.');
  return errores;
}

/**
 * Resumen por empresa del informe de un mes. `empresasEsperadas` son las que DEBEN tener informe.
 * La fusión exige que no falte ninguna; las incidencias sin resolver no la impiden pero se cuentan.
 */
function resumenDeInforme_(filas, empresasEsperadas) {
  const porEmpresa = {};
  filas.forEach((f) => {
    if (!porEmpresa[f.empresa])
      porEmpresa[f.empresa] = { empresa: f.empresa, coincidentes: 0, incorrectos: 0, sinResolver: 0 };
    const r = porEmpresa[f.empresa];
    if (f.estado === ESTADO_COINCIDENTE) r.coincidentes += 1;
    else {
      r.incorrectos += 1;
      if (f.resolucion === '') r.sinResolver += 1;
    }
  });
  const empresas = Object.keys(porEmpresa).map((e) => porEmpresa[e]);
  const faltan = empresasEsperadas.filter((e) => !porEmpresa[e]);
  return {
    empresas,
    faltan,
    puedeFusionarse: faltan.length === 0 && empresas.length > 0,
    sinResolver: empresas.reduce((suma, r) => suma + r.sinResolver, 0),
  };
}
