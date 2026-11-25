// Casos de uso de «Altas/bajas». HU-47 · HU-48 · RF-82 · RF-84 · RF-85 · RF-86.
//
// dependencias = { correoActual(), leerUsuarios(), leerConfiguracion(), servicioPagosConfigurado(), ahora(), nuevoId(),
//                  conBloqueo(accion), anadirEvento(evento), aplicarEnMaestro(config, empresas, registro),
//                  llamarServicioPagos(accion, datos), marcarCuentaEnMaestro(config, empresas, persona) }
//
// Orden de cada alta o baja (RF-85): se REGISTRA el evento, se aplica al maestro, se guarda la cuenta en el servicio
// VAP_Pagos (que calcula la huella), se marca en el maestro que la cuenta consta y se anota el resultado. Si algo falla a medias, queda anotado como error y no pasa en silencio.

const ESTADO_EVENTO = {
  registrado: 'registrado',
  sinAplicar: 'sin-aplicar',
  aplicado: 'aplicado',
  completo: 'completo',
  error: 'error',
};

const MENSAJE_SIN_MAESTRO = 'El maestro de personas no está configurado todavía.';
const MENSAJE_SIN_EMPRESA = 'Falta la empresa: el evento queda registrado pero NO se aplica al maestro.';
const MENSAJE_SIN_CUENTA = 'Aplicado al maestro. Falta la cuenta bancaria.';

/** Lo que la pantalla necesita para pintarse: las empresas y qué está configurado. Nunca devuelve ids de libros. */
function opcionesPersonal_(dependencias) {
  exigirAcceso_(dependencias, 'altas-bajas');
  const config = dependencias.leerConfiguracion();
  const empresas = parsearEmpresas_(config[CLAVE_CONFIG_EMPRESAS]);
  return {
    empresas: empresas.map((e) => e.nombre),
    maestroConfigurado: maestroConfigurado_(config, empresas),
    cuentaConfigurada: maestroConfigurado_(config, empresas) && dependencias.servicioPagosConfigurado(),
    maximoPorEnvio: MAXIMO_REGISTROS_POR_ENVIO,
  };
}

function exigirListaDeRegistros_(registros) {
  if (!Array.isArray(registros) || registros.length === 0) throw new Error('No hay registros.');
  if (registros.length > MAXIMO_REGISTROS_POR_ENVIO) {
    throw new Error(`Hay demasiados registros: el máximo por envío es ${MAXIMO_REGISTROS_POR_ENVIO}.`);
  }
}

/** Valida sin escribir nada. Devuelve, por registro, sus errores y el registro normalizado SIN la cuenta. */
function validarPersonas_(dependencias, registros) {
  exigirAcceso_(dependencias, 'altas-bajas');
  exigirListaDeRegistros_(registros);
  const empresas = parsearEmpresas_(dependencias.leerConfiguracion()[CLAVE_CONFIG_EMPRESAS]);
  const validados = registros.map((r) => validarRegistroPersonal_(r || {}, empresas));
  const repetidos = indicesConDniRepetido_(validados.map((v) => v.normalizado));
  return validados.map((v, indice) => {
    const errores = v.errores.slice();
    if (repetidos.indexOf(indice) !== -1) errores.push('Este DNI está repetido en el envío.');
    const normalizado = Object.assign({}, v.normalizado, { tieneCuenta: v.normalizado.iban !== '' });
    delete normalizado.iban;
    return { indice, errores, normalizado };
  });
}

/** Para la PANTALLA: la cuenta nunca se muestra, pero el DNI sí (quien da de alta debe poder resolver el conflicto). */
function sinCuenta_(mensaje, registro) {
  const texto = String(mensaje);
  return registro.iban ? texto.split(registro.iban).join('***') : texto;
}

/** Para el REGISTRO de eventos (ADR-0018): ni la cuenta ni ningún DNI, ni el de la persona ni el de un conflicto. */
function sinDatosPersonales_(mensaje, registro) {
  return sinCuenta_(mensaje, registro)
    .split(registro.dni || '\u0000')
    .join('***')
    .replace(/\b(?:\d{8}|[XYZ]\d{7})[A-Z]\b/g, '***');
}

function anotarEvento_(dependencias, contexto, eventoId, registro, estado, detalle) {
  dependencias.anadirEvento({
    eventoId,
    momento: dependencias.ahora(),
    usuario: contexto.correo,
    accion: registro.accion,
    empresa: registro.empresa,
    idTrabajador: registro.idTrabajador,
    estado,
    detalle: detalle || '',
  });
}

function aplicarEvento_(dependencias, contexto, config, empresas, registro) {
  const eventoId = dependencias.nuevoId();
  const anotar = (estado, detalle) => anotarEvento_(dependencias, contexto, eventoId, registro, estado, detalle);
  anotar(ESTADO_EVENTO.registrado);

  if (registro.empresa === '') {
    anotar(ESTADO_EVENTO.sinAplicar, MENSAJE_SIN_EMPRESA);
    return { eventoId, estado: ESTADO_EVENTO.sinAplicar, detalle: MENSAJE_SIN_EMPRESA };
  }

  try {
    dependencias.aplicarEnMaestro(config, empresas, registro);
  } catch (error) {
    const detalle = sinDatosPersonales_(error.message, registro);
    anotar(ESTADO_EVENTO.error, detalle);
    return { eventoId, estado: ESTADO_EVENTO.error, detalle };
  }
  anotar(ESTADO_EVENTO.aplicado);

  if (registro.iban === '') {
    if (registro.accion === 'baja') {
      anotar(ESTADO_EVENTO.completo);
      return { eventoId, estado: ESTADO_EVENTO.completo, detalle: '' };
    }
    return { eventoId, estado: ESTADO_EVENTO.aplicado, detalle: MENSAJE_SIN_CUENTA };
  }

  const persona = {
    idPersonal: idPersonalDe_(registro.empresa, registro.idTrabajador),
    idTrabajador: registro.idTrabajador,
    empresa: registro.empresa,
  };
  try {
    dependencias.llamarServicioPagos('guardarCuenta', {
      idPersonal: persona.idPersonal,
      dni: registro.dni,
      usuario: contexto.correo,
      iban: registro.iban,
    });
  } catch (error) {
    const inicio = 'Aplicado al maestro, pero la cuenta NO se guardó: ';
    anotar(ESTADO_EVENTO.error, inicio + sinDatosPersonales_(error.message, registro));
    return { eventoId, estado: ESTADO_EVENTO.error, detalle: inicio + sinCuenta_(error.message, registro) };
  }
  try {
    dependencias.marcarCuentaEnMaestro(config, empresas, persona);
  } catch (error) {
    const detalle = `La cuenta se guardó en VAP_Pagos, pero NO se pudo marcar en el maestro: ${sinDatosPersonales_(error.message, registro)}`;
    anotar(ESTADO_EVENTO.error, detalle);
    return { eventoId, estado: ESTADO_EVENTO.error, detalle };
  }
  anotar(ESTADO_EVENTO.completo);
  return { eventoId, estado: ESTADO_EVENTO.completo, detalle: '' };
}

/**
 * Registra y aplica cada alta o baja por separado: que una falle no impide las demás. Los rechazados por
 * validación no dejan rastro ni escriben nada. Devuelve un resultado por registro, en el mismo orden.
 */
function registrarPersonas_(dependencias, registros) {
  const contexto = exigirAcceso_(dependencias, 'altas-bajas');
  exigirListaDeRegistros_(registros);
  const config = dependencias.leerConfiguracion();
  const empresas = parsearEmpresas_(config[CLAVE_CONFIG_EMPRESAS]);
  if (!maestroConfigurado_(config, empresas)) throw new Error(MENSAJE_SIN_MAESTRO);

  const validados = registros.map((r) => validarRegistroPersonal_(r || {}, empresas));
  const repetidos = indicesConDniRepetido_(validados.map((v) => v.normalizado));
  return validados.map((validado, indice) => {
    if (validado.errores.length > 0 || repetidos.indexOf(indice) !== -1) {
      const errores = validado.errores.concat(repetidos.indexOf(indice) !== -1 ? ['DNI repetido en el envío.'] : []);
      return { indice, estado: 'rechazado', detalle: errores.join(' ') };
    }
    const resultado = dependencias.conBloqueo(() =>
      aplicarEvento_(dependencias, contexto, config, empresas, validado.normalizado),
    );
    return Object.assign({ indice }, resultado);
  });
}
