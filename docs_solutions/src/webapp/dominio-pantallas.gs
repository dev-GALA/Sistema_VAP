// Las pantallas de la webapp y quién puede ver cada una. Son DATOS: ampliar la webapp es añadir una
// entrada aquí, no tocar la lógica que las recorre (SOLID-O). Reglas puras (ADR-0017).

// Las pantallas con `grupo` cuelgan de un submenú con ese nombre; las demás van sueltas en el menú.
const GRUPO_GESTION_PERSONAL = 'Gestión Personal';
const GRUPO_PAGOS = 'Pagos';

const PANTALLAS = [
  {
    id: 'proceso-mensual',
    titulo: 'Proceso mensual',
    resumen: 'Los pasos del mes en orden, unos manuales y otros que se lanzan desde la propia pantalla.',
    requisitos: 'HU-29 · HU-45 · RF-79',
    disponible: true,
  },
  {
    id: 'comprobaciones',
    titulo: 'Comprobaciones',
    resumen: 'Contrastar un documento de un tercero (ADESLAS, COBEE, banco) con los datos del sistema.',
    requisitos: 'HU-42 · HU-43 · RF-72 … RF-76',
    disponible: false,
  },
  {
    id: 'diferencias',
    titulo: 'Registro de diferencias',
    resumen: 'Consultar las diferencias encontradas y marcarlas como resueltas.',
    requisitos: 'HU-44 · RF-77 · RF-78',
    disponible: false,
  },
  {
    id: 'altas-bajas',
    titulo: 'Altas/bajas',
    resumen: 'Dar de alta, de baja y modificar a una persona, con registro de cada cambio.',
    requisitos: 'HU-47 · RF-82 … RF-85',
    grupo: GRUPO_GESTION_PERSONAL,
    disponible: true,
  },
  {
    id: 'maestro',
    titulo: 'Maestro de personal',
    resumen: 'Ver todo el maestro de personas respetando sus pestañas.',
    requisitos: 'HU-47 · RF-82',
    grupo: GRUPO_GESTION_PERSONAL,
    disponible: false,
  },
  {
    id: 'cruzar-pagos',
    titulo: 'Cruzar Pagos',
    resumen: 'Subir los ficheros del banco por empresa, cruzarlos con la base de cuentas y generar el informe del mes.',
    requisitos: 'HU-49 · RF-90 … RF-94 · RF-99',
    grupo: GRUPO_PAGOS,
    disponible: true,
  },
  {
    id: 'historico-pagos',
    titulo: 'Históricos de Pagos',
    resumen: 'Consultar los informes de pagos de un mes o lo que cobró una persona.',
    requisitos: 'HU-50 · RF-95',
    grupo: GRUPO_PAGOS,
    disponible: true,
  },
  {
    id: 'maestro-pagos',
    titulo: 'Maestro de Pagos',
    resumen: 'Quién tiene cuenta registrada, con los últimos 4 dígitos y la fecha de la última actualización.',
    requisitos: 'HU-50 · RF-96 · RF-98',
    grupo: GRUPO_PAGOS,
    disponible: true,
  },
  {
    id: 'carga-inicial',
    titulo: 'Carga inicial de cuentas',
    resumen: 'De uso único: cargar las cuentas de las personas ya existentes desde un CSV, con confirmación.',
    requisitos: 'HU-48 · RF-89',
    grupo: GRUPO_PAGOS,
    disponible: true,
  },
];

const IDS_PANTALLAS = PANTALLAS.map((p) => p.id);

// Qué pantallas ve cada rol. Hoy los dos roles las ven todas; está separado para poder acotarlo después.
const PANTALLAS_POR_ROL = {
  administracion: IDS_PANTALLAS,
  desarrollo: IDS_PANTALLAS,
};

function puedeVerPantalla_(rol, idPantalla) {
  const permitidas = PANTALLAS_POR_ROL[rol] || [];
  return permitidas.indexOf(idPantalla) !== -1;
}

function pantallasPermitidas_(rol) {
  return PANTALLAS.filter((p) => puedeVerPantalla_(rol, p.id));
}
