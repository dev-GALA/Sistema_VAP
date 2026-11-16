// Los pasos del proceso mensual y su estado. Reglas puras (ADR-0017). HU-45 · RF-79.
//
// El catálogo recoge, por ahora, el primer grupo de pasos acordado el 16 nov 2026. Los demás pasos
// del cierre (FLUJO.md §3, OB-22) se irán añadiendo aquí, como datos, de uno en uno.

const ESTADOS_PASO = ['pendiente', 'hecho', 'con-incidencias'];

const PASOS_PROCESO_MENSUAL = [
  {
    id: 'actualizar-export-sage',
    orden: 1,
    titulo: 'Actualizar a mano los datos de la primera exportación de SAGE',
    detalle: 'Vaciar y copiar los datos en VAP_Export_SAGE_Laboral.',
    tipo: 'manual',
    disponible: true,
  },
  {
    id: 'actualizar-bbdd-personas',
    orden: 2,
    titulo: 'Actualizar a mano VAP_BBDD_Personas con las altas y bajas',
    detalle: 'Reflejar las altas y bajas del mes en las pestañas que correspondan.',
    tipo: 'manual',
    disponible: true,
  },
  {
    id: 'comprobar-concordancia',
    orden: 3,
    titulo: 'Comprobar que el identificador y el DNI de cada persona coinciden',
    detalle: 'Se ejecutará desde esta pantalla en una versión posterior (OB-44).',
    tipo: 'ejecutable',
    disponible: false,
  },
];

const ESTADO_DESCONOCIDO = 'desconocido';

/**
 * Une el catálogo con el estado guardado de un periodo. `filas` son { periodo, pasoId, estado,
 * actualizadoPor, actualizadoEn }. Un paso sin fila está `pendiente`. Si hay varias filas del mismo paso
 * y periodo, manda la última. Un estado que no se reconoce se muestra como `desconocido`: nunca se
 * disfraza de pendiente ni de hecho.
 */
function combinarPasosConEstado_(catalogo, filas, periodo) {
  return catalogo.map((paso) => {
    const delPaso = filas.filter((f) => f.periodo === periodo && f.pasoId === paso.id);
    const fila = delPaso.length > 0 ? delPaso[delPaso.length - 1] : null;
    if (!fila) return Object.assign({}, paso, { estado: 'pendiente', actualizadoPor: '', actualizadoEn: '' });
    const reconocido = ESTADOS_PASO.indexOf(fila.estado) !== -1;
    return Object.assign({}, paso, {
      estado: reconocido ? fila.estado : ESTADO_DESCONOCIDO,
      actualizadoPor: fila.actualizadoPor,
      actualizadoEn: fila.actualizadoEn,
    });
  });
}
