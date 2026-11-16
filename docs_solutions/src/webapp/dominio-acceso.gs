// Quién puede entrar. La lista de cuentas y roles es la barrera de acceso (ADR-0018, RNF-09).
// Regla de oro: ante cualquier duda, NO se entra. Reglas puras (ADR-0017).
//
// Los correos de cada rol viven en la hoja `config`, en la clave `email_<rol>`, separados por comas
// (la misma convención que BUCA): `email_administracion`, `email_desarrollo`.

function normalizarCorreo_(correo) {
  return String(correo === null || correo === undefined ? '' : correo)
    .trim()
    .toLowerCase();
}

function claveDeCorreosDelRol_(rol) {
  return `email_${rol}`;
}

/** «a@x.com, B@x.com;c@x.com» → ['a@x.com', 'b@x.com', 'c@x.com']. Sin vacíos. */
function listaDeCorreos_(valor) {
  return String(valor === null || valor === undefined ? '' : valor)
    .split(/[,;\n]/)
    .map(normalizarCorreo_)
    .filter((correo) => correo !== '');
}

/** De { clave: valor } de la hoja `config` a una lista de { correo, rol }, un elemento por correo y rol. */
function usuariosDeConfiguracion_(config) {
  const usuarios = [];
  Object.keys(PANTALLAS_POR_ROL).forEach((rol) => {
    listaDeCorreos_(config[claveDeCorreosDelRol_(rol)]).forEach((correo) => {
      usuarios.push({ correo, rol });
    });
  });
  return usuarios;
}

function denegar_(motivo) {
  return { permitido: false, rol: '', motivo };
}

/**
 * Decide si un correo entra. `usuarios` es una lista de { correo, rol }.
 * Devuelve { permitido, rol, motivo }. Un correo sin identificar, que no consta, que aparece en más de un
 * rol o con un rol que no existe NO entra.
 */
function decidirAcceso_(correo, usuarios) {
  const buscado = normalizarCorreo_(correo);
  if (buscado === '') return denegar_('sin-identificar');

  const coincidencias = usuarios.filter((u) => normalizarCorreo_(u.correo) === buscado);
  if (coincidencias.length === 0) return denegar_('no-registrado');
  if (coincidencias.length > 1) return denegar_('duplicado');

  const usuario = coincidencias[0];
  if (!PANTALLAS_POR_ROL[usuario.rol]) return denegar_('rol-desconocido');
  return { permitido: true, rol: usuario.rol, motivo: 'ok' };
}
