// Hojas de detalle de la CARGA INICIAL (uso único, ADR-0020): para cada tema, los datos que hacen falta para subsanarlo.
// Reglas puras: devuelven [{ clave, cabecera, filas }] y es la infraestructura quien las escribe en hojas.
//
// Llevan NOMBRE y DNI (lo pide quien subsana), pero NUNCA la cuenta completa: solo cómo termina (RNF-19).
//
// filasDelExcel: [{ fila, nombre, dni, cuenta, empresa }]  (`empresa` = el título de empresa bajo el que está la fila)
// personas:      [{ idPersonal, nombre, dni, empresa, activa, pestana, fila, fechaAlta, fechaBaja }]

const CABECERA_REPETIDAS = [
  'dni',
  'fila_excel',
  'nombre_excel',
  'empresa_excel',
  'cuenta_termina_en',
  'repite_la_fila',
  'personas_activas_del_maestro_con_ese_dni',
];
const CABECERA_DNI_INVALIDO = [
  'origen',
  'fila_excel',
  'nombre_excel',
  'empresa_excel',
  'dni_tal_como_viene',
  'motivo',
  'id_trabajador',
  'empresa_maestro',
  'pestana',
  'fila_maestro',
  'nombre_maestro',
  'posible_pareja_por_nombre',
];
const CABECERA_ID_REPETIDO = [
  'id_trabajador',
  'situacion',
  'pestana',
  'fila_maestro',
  'empresa',
  'nombre',
  'dni',
  'activa',
  'fecha_alta',
  'fecha_baja',
];
const CABECERA_SIN_CUENTA = ['fila_excel', 'nombre_excel', 'empresa_excel', 'dni', 'personas_del_maestro_con_ese_dni'];
const CABECERA_SIN_PERSONA_ACTIVA = [
  'fila_excel',
  'nombre_excel',
  'empresa_excel',
  'dni',
  'cuenta_termina_en',
  'en_el_maestro_con_ese_dni',
  'posible_pareja_por_nombre',
];
const CABECERA_CUENTAS_DISTINTAS = [
  'dni',
  'fila_excel',
  'nombre_excel',
  'empresa_excel',
  'cuenta_termina_en',
  'personas_activas_del_maestro_con_ese_dni',
];
const CABECERA_SIN_CUENTA_EN_EXCEL = [
  'pestana',
  'fila_maestro',
  'id_trabajador',
  'empresa',
  'nombre',
  'dni',
  'fecha_alta',
  'posible_fila_en_el_excel_por_nombre',
];
const CABECERA_CON_HUELLA = ['pestana', 'fila_maestro', 'id_trabajador', 'empresa', 'nombre', 'dni', 'estado'];

/** El nombre sin tildes, en mayúsculas y con un solo espacio, para comparar «Pérez, Ana» con «PEREZ  ANA». */
function nombreNormalizado_(valor) {
  return textoDe_(valor)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

const PARTICULAS_DE_NOMBRE = ['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y'];
const LONGITUD_MINIMA_PARA_ERRATA = 5;

/** Las palabras del nombre, ya normalizado y sin partículas: «GARCIA DE LA TORRE, ANA» → [GARCIA, TORRE, ANA]. */
function palabrasDeNombre_(valor) {
  return nombreNormalizado_(valor)
    .split(' ')
    .filter((palabra) => palabra !== '' && PARTICULAS_DE_NOMBRE.indexOf(palabra) === -1);
}

/** Dos palabras difieren como mucho en UNA letra (cambiada, sobrante o que falta). */
function difierenEnUnaLetra_(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  const [corta, larga] = a.length < b.length ? [a, b] : [b, a];
  return corta.slice(i) === larga.slice(i + 1);
}

function palabrasSimilares_(a, b) {
  const lasDos = Math.min(a.length, b.length) >= LONGITUD_MINIMA_PARA_ERRATA;
  return a === b || (lasDos && difierenEnUnaLetra_(a, b));
}

/** «igual»: las mismas palabras, en cualquier orden. «parecido»: todas las del nombre más corto (2 o más) están en el otro, con alguna errata. */
function parecidoDeNombres_(palabrasA, palabrasB) {
  if (palabrasA.length === 0 || palabrasB.length === 0) return '';
  if (palabrasA.slice().sort().join(' ') === palabrasB.slice().sort().join(' ')) return 'igual';
  const [pequena, grande] = palabrasA.length <= palabrasB.length ? [palabrasA, palabrasB] : [palabrasB, palabrasA];
  if (pequena.length < 2) return '';
  return pequena.every((p) => grande.some((g) => palabrasSimilares_(p, g))) ? 'parecido' : '';
}

/** Los candidatos con nombre igual o parecido, primero los iguales: «[igual] descripción | [parecido] descripción». */
function parejasPorNombre_(nombre, candidatos, nombreDe, describir) {
  const palabras = palabrasDeNombre_(nombre);
  const encontrados = { igual: [], parecido: [] };
  candidatos.forEach((candidato) => {
    const grado = parecidoDeNombres_(palabras, palabrasDeNombre_(nombreDe(candidato)));
    if (grado !== '') encontrados[grado].push(`[${grado}] ${describir(candidato)}`);
  });
  return encontrados.igual.concat(encontrados.parecido).join(' | ');
}

function terminaEn_(cuenta) {
  return normalizarCuentaDelExcel_(cuenta).slice(-LONGITUD_ULTIMOS_DIGITOS);
}

function descripcionDePersona_(persona) {
  const estado = persona.activa ? 'activa' : `de baja${persona.fechaBaja ? ` ${persona.fechaBaja}` : ''}`;
  return `${persona.idPersonal} · ${persona.empresa} · ${persona.pestana} · fila ${persona.fila} · ${estado}`;
}

function descripcionDePersonas_(personas, vacio) {
  return personas.length === 0 ? vacio : personas.map(descripcionDePersona_).join(' | ');
}

function descripcionConDni_(persona) {
  return `${descripcionDePersona_(persona)} · DNI ${persona.dni}`;
}

function descripcionDeFilaDelExcel_(fila) {
  return `fila ${fila.fila} · DNI ${fila.dni} · cuenta termina en ${terminaEn_(fila.cuenta)} · ${fila.empresa}`;
}

function motivoDeDniInvalido_(dni) {
  const limpio = normalizarDni_(dni);
  if (limpio === '') return 'Está vacío';
  if (limpio.length !== 9) return `Tiene ${limpio.length} caracteres y debería tener 9`;
  return 'No tiene la forma de un DNI (8 cifras y letra) ni de un NIE (X, Y o Z, 7 cifras y letra)';
}

/**
 * Las hojas de detalle de la carga.
 *  - plan:        lo que devuelve `planCargaInicial_`.
 *  - idsConHuella: los `idPersonal` que ya tienen huella (en simulación, los ya registrados; en real, todos los de `huellas`).
 *  - simulacion:  true si no se ha guardado nada.
 */
function informesDeCarga_(filasDelExcel, personas, plan, idsConHuella, simulacion) {
  const excelPorFila = {};
  filasDelExcel.forEach((f) => {
    excelPorFila[f.fila] = f;
  });
  const personaPorId = {};
  personas.forEach((p) => {
    personaPorId[p.idPersonal] = p;
  });
  const personasPorDni = agruparPor_(
    personas.filter((p) => normalizarDni_(p.dni) !== ''),
    (p) => normalizarDni_(p.dni),
  );
  const activasDelDni = (dni) => (personasPorDni[dni] || []).filter((p) => p.activa);
  const filasConDatos = filasDelExcel.filter((f) => f.dni !== '' || f.cuenta !== '');
  const parejasDelMaestro = (nombre) => parejasPorNombre_(nombre, personas, (p) => p.nombre, descripcionConDni_);
  const parejasDelExcel = (nombre) =>
    parejasPorNombre_(nombre, filasConDatos, (f) => f.nombre, descripcionDeFilaDelExcel_);
  const delExcel = (fila) => excelPorFila[fila] || { fila, nombre: '', dni: '', cuenta: '', empresa: '' };
  const incidenciasDe = (tipo) => plan.incidencias.filter((i) => i.tipo === tipo);
  const hoja = (clave, cabecera, filas) => ({ clave, cabecera, filas });

  const repetidas = plan.repetidasDetalle.map((r) => {
    const f = delExcel(r.fila);
    return [
      r.dni,
      f.fila,
      f.nombre,
      f.empresa,
      terminaEn_(f.cuenta),
      r.filaOriginal,
      descripcionDePersonas_(activasDelDni(r.dni), 'Ninguna'),
    ];
  });

  const dniInvalido = incidenciasDe(INCIDENCIA_DNI_INVALIDO).map((i) => {
    if (i.fila !== '') {
      const f = delExcel(i.fila);
      return [
        'Excel',
        f.fila,
        f.nombre,
        f.empresa,
        f.dni,
        motivoDeDniInvalido_(f.dni),
        '',
        '',
        '',
        '',
        '',
        parejasDelMaestro(f.nombre),
      ];
    }
    const p = personaPorId[i.idPersonal] || {};
    return [
      'Maestro',
      '',
      '',
      '',
      textoDe_(p.dni),
      motivoDeDniInvalido_(p.dni),
      p.idPersonal,
      p.empresa,
      p.pestana,
      p.fila,
      p.nombre,
      parejasDelExcel(p.nombre),
    ];
  });

  const sinCuenta = incidenciasDe(INCIDENCIA_SIN_CUENTA).map((i) => {
    const f = delExcel(i.fila);
    return [
      f.fila,
      f.nombre,
      f.empresa,
      i.dni,
      descripcionDePersonas_(personasPorDni[i.dni] || [], 'No consta en el maestro'),
    ];
  });

  const sinPersonaActiva = incidenciasDe(INCIDENCIA_SIN_PERSONA_ACTIVA).map((i) => {
    const f = delExcel(i.fila);
    return [
      f.fila,
      f.nombre,
      f.empresa,
      i.dni,
      terminaEn_(f.cuenta),
      descripcionDePersonas_(personasPorDni[i.dni] || [], 'No consta en el maestro'),
      parejasDelMaestro(f.nombre),
    ];
  });

  const cuentasDistintas = incidenciasDe(INCIDENCIA_CUENTAS_DISTINTAS).map((i) => {
    const f = delExcel(i.fila);
    return [
      i.dni,
      f.fila,
      f.nombre,
      f.empresa,
      terminaEn_(f.cuenta),
      descripcionDePersonas_(activasDelDni(i.dni), 'Ninguna'),
    ];
  });

  const sinCuentaEnExcel = incidenciasDe(INCIDENCIA_SIN_CUENTA_EN_EXCEL).map((i) => {
    const p = personaPorId[i.idPersonal] || {};
    return [p.pestana, p.fila, p.idPersonal, p.empresa, p.nombre, p.dni, p.fechaAlta, parejasDelExcel(p.nombre)];
  });

  const idRepetido = [];
  idsRepetidos_(personas).forEach((id) => {
    const apariciones = personas.filter((p) => p.idPersonal === id);
    const dnis = {};
    apariciones.forEach((p) => {
      dnis[normalizarDni_(p.dni)] = true;
    });
    const situacion =
      Object.keys(dnis).length === 1
        ? 'Mismo DNI en todas las apariciones'
        : 'DNI DISTINTOS: conflicto, hay que resolverlo antes de cargar';
    apariciones.forEach((p) => {
      idRepetido.push([
        id,
        situacion,
        p.pestana,
        p.fila,
        p.empresa,
        p.nombre,
        p.dni,
        p.activa ? 'sí' : 'no',
        p.fechaAlta,
        p.fechaBaja,
      ]);
    });
  });

  const conHuella = [];
  const hayHuella = {};
  idsConHuella.forEach((id) => {
    hayHuella[id] = true;
  });
  const seCargara = {};
  plan.cuentas.forEach((c) => {
    seCargara[c.idPersonal] = true;
  });
  personas.forEach((p) => {
    let estado = '';
    if (hayHuella[p.idPersonal]) estado = simulacion ? 'Ya tenía huella' : 'Con huella';
    else if (simulacion && seCargara[p.idPersonal]) estado = 'Se cargará';
    if (estado !== '') conHuella.push([p.pestana, p.fila, p.idPersonal, p.empresa, p.nombre, p.dni, estado]);
  });

  return [
    hoja('repetidas', CABECERA_REPETIDAS, repetidas),
    hoja('dni-invalido', CABECERA_DNI_INVALIDO, dniInvalido),
    hoja('id-repetido', CABECERA_ID_REPETIDO, idRepetido),
    hoja('sin-cuenta', CABECERA_SIN_CUENTA, sinCuenta),
    hoja('sin-persona-activa', CABECERA_SIN_PERSONA_ACTIVA, sinPersonaActiva),
    hoja('cuentas-distintas', CABECERA_CUENTAS_DISTINTAS, cuentasDistintas),
    hoja('sin-cuenta-en-excel', CABECERA_SIN_CUENTA_EN_EXCEL, sinCuentaEnExcel),
    hoja('con-huella', CABECERA_CON_HUELLA, conHuella),
  ];
}
