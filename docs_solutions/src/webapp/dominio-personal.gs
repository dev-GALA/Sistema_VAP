// Alta y baja de personas: reglas puras, sin servicios de Google (ADR-0017). HU-47 · HU-48 · RF-82 · RF-84 · RF-86.
//
// Nada de lo que se valida aquí se escribe en mensajes: un error dice QUÉ campo falla, nunca su valor
// (el DNI y la cuenta bancaria son datos personales; RNF-19).

const ACCIONES_PERSONAL = ['alta', 'baja'];
const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
const LONGITUD_MAXIMA_TEXTO = 100;
const MAXIMO_REGISTROS_POR_ENVIO = 200;
const FORMATO_IDENTIFICADOR = /^[A-Za-z0-9._-]{1,30}$/;

// Claves de la hoja `config` para el maestro de personas. Sin ellas, la función no se activa.
const CLAVE_CONFIG_EMPRESAS = 'empresas';
const CLAVE_CONFIG_LIBRO_MAESTRO = 'maestro_libro_id';

/** El maestro está configurado si `config` trae el libro y hay al menos una empresa. */
function maestroConfigurado_(config, empresas) {
  return textoDe_(config[CLAVE_CONFIG_LIBRO_MAESTRO]) !== '' && empresas.length > 0;
}

function textoDe_(valor) {
  return String(valor === null || valor === undefined ? '' : valor).trim();
}

function normalizarAccion_(valor) {
  const accion = textoDe_(valor).toLowerCase();
  return ACCIONES_PERSONAL.indexOf(accion) !== -1 ? accion : '';
}

function normalizarDni_(valor) {
  return textoDe_(valor).toUpperCase().replace(/[\s-]/g, '');
}

/** DNI (8 cifras y letra) o NIE (X, Y o Z, 7 cifras y letra), con la letra de control comprobada. */
function esDniValido_(dni) {
  let numero;
  if (/^\d{8}[A-Z]$/.test(dni)) numero = dni.slice(0, 8);
  else if (/^[XYZ]\d{7}[A-Z]$/.test(dni)) numero = 'XYZ'.indexOf(dni[0]) + dni.slice(1, 8);
  else return false;
  return LETRAS_DNI[Number(numero) % 23] === dni[dni.length - 1];
}

/** «2026-11-03», «03/11/2026» o «03-11-2026» → «2026-11-03». Una fecha que no existe devuelve ''. */
function normalizarFecha_(valor) {
  const texto = textoDe_(valor);
  let anio;
  let mes;
  let dia;
  let coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (coincidencia) {
    [, anio, mes, dia] = coincidencia;
  } else {
    coincidencia = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(texto);
    if (!coincidencia) return '';
    [, dia, mes, anio] = coincidencia;
  }
  const fecha = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  const existe =
    fecha.getUTCFullYear() === Number(anio) &&
    fecha.getUTCMonth() === Number(mes) - 1 &&
    fecha.getUTCDate() === Number(dia);
  if (!existe) return '';
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function normalizarIban_(valor) {
  return textoDe_(valor).toUpperCase().replace(/\s/g, '');
}

/** IBAN con la forma de cualquier país y el dígito de control (módulo 97) comprobado. */
function esIbanValido_(iban) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const reordenado = iban.slice(4) + iban.slice(0, 4);
  let resto = 0;
  for (const caracter of reordenado) {
    const cifras = /\d/.test(caracter) ? caracter : String(caracter.charCodeAt(0) - 55);
    for (const cifra of cifras) resto = (resto * 10 + Number(cifra)) % 97;
  }
  return resto === 1;
}

/**
 * `texto` de la clave `empresas` de config: «Empresa A; Empresa B=Pestaña B». Se separa por punto y coma
 * (un nombre de empresa puede llevar comas). Sin «=», la pestaña del maestro se llama como la empresa.
 * Devuelve [{ nombre, pestana }].
 */
function parsearEmpresas_(texto) {
  return String(texto === null || texto === undefined ? '' : texto)
    .split(/[;\n]/)
    .map((trozo) => trozo.trim())
    .filter((trozo) => trozo !== '')
    .map((trozo) => {
      const partes = trozo.split('=');
      const nombre = partes[0].trim();
      const pestana = partes.length > 1 ? partes.slice(1).join('=').trim() : nombre;
      return { nombre, pestana: pestana || nombre };
    })
    .filter((empresa) => empresa.nombre !== '');
}

function textoObligatorio_(valor, etiqueta, errores) {
  const texto = textoDe_(valor);
  if (texto === '') errores.push(`Falta ${etiqueta}.`);
  else if (texto.length > LONGITUD_MAXIMA_TEXTO) errores.push(`${etiqueta} es demasiado largo.`);
  return texto;
}

/**
 * Valida y normaliza un registro de alta o baja. `empresas` es la lista de [{ nombre, pestana }].
 * Devuelve { errores: [texto], normalizado }. La empresa y el identificador son opcionales; la cuenta solo
 * vale en un alta y exige identificador (la huella se guarda junto a él).
 */
function validarRegistroPersonal_(registro, empresas) {
  const errores = [];
  const accion = normalizarAccion_(registro.accion);
  if (accion === '') errores.push('La acción debe ser «alta» o «baja».');

  const nombre = textoObligatorio_(registro.nombre, 'el nombre', errores);
  const apellidos = textoObligatorio_(registro.apellidos, 'los apellidos', errores);

  const dni = normalizarDni_(registro.dni);
  if (dni === '') errores.push('Falta el DNI.');
  else if (!esDniValido_(dni)) errores.push('El DNI no es válido.');

  const fecha = normalizarFecha_(registro.fecha);
  if (textoDe_(registro.fecha) === '') errores.push(`Falta la fecha de ${accion || 'alta o baja'}.`);
  else if (fecha === '') errores.push('La fecha no es válida (usa AAAA-MM-DD o DD/MM/AAAA).');

  let empresa = '';
  if (textoDe_(registro.empresa) !== '') {
    const buscada = textoDe_(registro.empresa).toLowerCase();
    const encontrada = empresas.filter((e) => e.nombre.toLowerCase() === buscada)[0];
    if (encontrada) empresa = encontrada.nombre;
    else errores.push('La empresa no es una de las configuradas.');
  }

  const idTrabajador = textoDe_(registro.idTrabajador);
  if (idTrabajador !== '' && !FORMATO_IDENTIFICADOR.test(idTrabajador)) errores.push('El identificador no es válido.');

  const iban = normalizarIban_(registro.iban);
  if (iban !== '') {
    if (accion === 'baja') errores.push('La cuenta bancaria solo se da en un alta.');
    else if (!esIbanValido_(iban)) errores.push('La cuenta bancaria no es válida.');
    if (idTrabajador === '') errores.push('Para guardar la cuenta hace falta el identificador de SAGE.');
  }

  return { errores, normalizado: { accion, nombre, apellidos, dni, fecha, empresa, idTrabajador, iban } };
}

/** Marca los DNI repetidos dentro de un mismo envío: devuelve los índices de las filas que repiten uno ya visto. */
function indicesConDniRepetido_(normalizados) {
  const vistos = {};
  const repetidos = [];
  normalizados.forEach((registro, indice) => {
    if (registro.dni === '') return;
    const clave = `${registro.empresa}|${registro.dni}|${registro.accion}`;
    if (vistos[clave]) repetidos.push(indice);
    else vistos[clave] = true;
  });
  return repetidos;
}
