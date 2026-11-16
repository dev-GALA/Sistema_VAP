// Las pantallas de la webapp y quién puede ver cada una. Son DATOS: ampliar la webapp es añadir una
// entrada aquí, no tocar la lógica que las recorre (SOLID-O). Reglas puras (ADR-0017).

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
    disponible: false,
  },
  {
    id: 'maestro',
    titulo: 'Maestro de personal',
    resumen: 'Ver todo el maestro de personas respetando sus pestañas.',
    requisitos: 'HU-47 · RF-82',
    disponible: false,
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
