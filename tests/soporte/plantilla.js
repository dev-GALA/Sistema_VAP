// Evalúa plantillas de Apps Script (scriptlets) como lo hace HtmlService.createTemplateFromFile().evaluate().
//   <?= expr ?>   imprime con escape HTML      <?!= expr ?>  imprime sin escape      <? codigo ?>  ejecuta JS
// Los datos de la plantilla (t.nombre = ...) llegan como variables sueltas.

const escaparHtml = (v) =>
  String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function evaluarPlantilla(html, datos = {}, incluir = () => '', evaluarEn = null) {
  const trozos = html.split(/(<\?!?=?[\s\S]*?\?>)/);
  let codigo = 'let __salida = "";\n';
  for (const trozo of trozos) {
    const m = /^<\?(!?=?)([\s\S]*?)\?>$/.exec(trozo);
    if (!m) codigo += `__salida += ${JSON.stringify(trozo)};\n`;
    else if (m[1] === '=') codigo += `__salida += __escapar(${m[2]});\n`;
    else if (m[1] === '!=') codigo += `__salida += (${m[2]});\n`;
    else codigo += `${m[2]}\n`;
  }
  codigo += 'return __salida;';
  if (evaluarEn) {
    // Dentro de la caja del script: la plantilla ve las funciones y constantes globales de los .gs.
    const f = evaluarEn(`(function(__escapar, include, __datos){ with (__datos) { ${codigo} } })`);
    return f(escaparHtml, incluir, datos);
  }
  const nombres = Object.keys(datos);
  const f = new Function('__escapar', 'include', ...nombres, codigo);
  return f(escaparHtml, incluir, ...nombres.map((n) => datos[n]));
}
