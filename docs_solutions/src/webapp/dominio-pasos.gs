// Los pasos del proceso mensual y su estado. Reglas puras (ADR-0017). HU-45 · RF-79.
//
// El catálogo son DATOS: añadir un paso es añadir una entrada. Cada paso tiene:
//   numero   · lo que ve la persona («1.1»); orden · el número por el que se ordena
//   grupo    · id de GRUPOS_PASOS, o '' si va suelto
//   tipo     · «manual» (se marca a mano) o «ejecutable» (se lanza desde la pantalla, cuando el código lo sepa)
//   requiere · id del paso que debe estar hecho antes (opcional)
//   accion   · botón que lleva a otra pantalla: { pantalla, rotulo } (opcional)

const ESTADOS_PASO = ['pendiente', 'hecho', 'con-incidencias'];

const GRUPOS_PASOS = [{ id: 'acciones-1', titulo: 'Acciones 1' }];

const PASOS_PROCESO_MENSUAL = [
  {
    id: 'actualizar-bbdd-personas',
    orden: 1,
    numero: '1.1',
    grupo: 'acciones-1',
    titulo: 'Actualizar VAP BBDD Personas',
    detalle: 'Reflejar las altas y bajas del mes en las pestañas que correspondan.',
    tipo: 'manual',
    disponible: true,
    accion: { pantalla: 'altas-bajas', rotulo: 'Ir a Altas y bajas' },
  },
  {
    id: 'comprobar-concordancia',
    orden: 2,
    numero: '1.2',
    grupo: 'acciones-1',
    titulo: 'Comprobar id_trabajador y DNI',
    detalle:
      'Contrasta el identificador y el DNI de cada persona entre el export de SAGE y el maestro de personas, y lista las diferencias. Solo lee: no corrige nada. Se activa cuando el paso 1.1 está realizado (OB-44).',
    tipo: 'ejecutable',
    disponible: false,
    requiere: 'actualizar-bbdd-personas',
  },
  {
    id: 'actualizar-export-sage',
    orden: 3,
    numero: '3',
    grupo: '',
    titulo: 'Actualizar GSh Export SAGE Laboral',
    detalle: 'Vaciar y copiar los datos en VAP_Export_SAGE_Laboral.',
    tipo: 'manual',
    disponible: true,
  },
];

const ESTADO_DESCONOCIDO = 'desconocido';

function ultimaFilaDelPaso_(filas, periodo, pasoId) {
  const delPaso = filas.filter((f) => f.periodo === periodo && f.pasoId === pasoId);
  return delPaso.length > 0 ? delPaso[delPaso.length - 1] : null;
}

function estaHecho_(filas, periodo, pasoId) {
  const fila = ultimaFilaDelPaso_(filas, periodo, pasoId);
  return fila !== null && fila.estado === 'hecho';
}

/** Un paso sin requisito está desbloqueado; con requisito, solo si ese paso está hecho en el mismo periodo. */
function estaDesbloqueado_(paso, filas, periodo) {
  return !paso.requiere || estaHecho_(filas, periodo, paso.requiere);
}

/**
 * Une el catálogo con el estado guardado de un periodo. `filas` son { periodo, pasoId, estado,
 * actualizadoPor, actualizadoEn }. Un paso sin fila está `pendiente`. Si hay varias filas del mismo paso
 * y periodo, manda la última. Un estado que no se reconoce se muestra como `desconocido`: nunca se
 * disfraza de pendiente ni de hecho. `desbloqueado` dice si el paso ya puede actuarse.
 */
function combinarPasosConEstado_(catalogo, filas, periodo) {
  return catalogo.map((paso) => {
    const desbloqueado = estaDesbloqueado_(paso, filas, periodo);
    const fila = ultimaFilaDelPaso_(filas, periodo, paso.id);
    if (!fila) {
      return Object.assign({}, paso, { estado: 'pendiente', actualizadoPor: '', actualizadoEn: '', desbloqueado });
    }
    const reconocido = ESTADOS_PASO.indexOf(fila.estado) !== -1;
    return Object.assign({}, paso, {
      estado: reconocido ? fila.estado : ESTADO_DESCONOCIDO,
      actualizadoPor: fila.actualizadoPor,
      actualizadoEn: fila.actualizadoEn,
      desbloqueado,
    });
  });
}

/** ¿Se puede marcar este paso como realizado? Devuelve { permitido, motivo }. */
function decidirMarcaPaso_(catalogo, filas, periodo, pasoId) {
  const paso = catalogo.filter((p) => p.id === pasoId)[0];
  if (!paso) return { permitido: false, motivo: 'paso-desconocido' };
  if (paso.tipo !== 'manual') return { permitido: false, motivo: 'no-es-manual' };
  if (estaHecho_(filas, periodo, pasoId)) return { permitido: false, motivo: 'ya-hecho' };
  if (!estaDesbloqueado_(paso, filas, periodo)) return { permitido: false, motivo: 'bloqueado' };
  return { permitido: true, motivo: 'ok' };
}
