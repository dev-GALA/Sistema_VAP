// Arnés de extremo a extremo: sirve las páginas HTML REALES y encamina cada `google.script.run.fn(...)`
// al .gs REAL, que corre en la caja de Node con los servicios de Google falsos (hojas en memoria).
// Así se prueba el recorrido completo —pantalla → servidor → hoja— sin tocar Google ni datos reales.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SRC, cargarGs, plano } from '../soporte/cargar-gs.js';

const SHIM = `<script>
(function () {
  // Cada eslabón de la cadena (run.withSuccessHandler(f).withFailureHandler(g).funcion(...)) es un
  // proxy: lo que no es un método de configuración es una llamada al servidor.
  function ejecutor(ok, ko, usuario) {
    return new Proxy({}, {
      get: function (_d, nombre) {
        if (typeof nombre !== 'string') return undefined;
        if (nombre === 'withSuccessHandler') return function (f) { return ejecutor(f, ko, usuario); };
        if (nombre === 'withFailureHandler') return function (f) { return ejecutor(ok, f, usuario); };
        if (nombre === 'withUserObject') return function (o) { return ejecutor(ok, ko, o); };
        return function () {
          var args = Array.prototype.slice.call(arguments);
          fetch('/rpc/' + nombre, { method: 'POST', body: JSON.stringify(args) })
            .then(function (r) { return r.json(); })
            .then(function (j) {
              if (j.error) { if (ko) ko(new Error(j.error), usuario); else console.error(j.error); }
              else if (ok) ok(j.valor, usuario);
            });
        };
      }
    });
  }
  window.google = {
    script: {
      run: ejecutor(null, null, null),
      host: { close: function () { window.__dialogoCerrado = true; }, setHeight: function () {}, setWidth: function () {} }
    }
  };
})();
</script>`;

/**
 * Arranca una aplicación de prueba.
 *  - codigo: rutas de .gs (relativas a docs_solutions/src) cargadas en la caja.
 *  - html: { NombreEnApps Script: 'ruta/relativa.html' } con los archivos HTML del proyecto.
 *  - preparar(entorno): rellena el Google falso (libros, hojas, propiedades…) antes de servir.
 * Rutas del servidor:
 *  - GET /            → llama a `doGet({ parameter: query })` del script y sirve su HTML.
 *  - GET /archivo/NOMBRE → sirve el HTML tal cual (diálogos que abre el menú con showModalDialog).
 *  - POST /rpc/FUNCION → ejecuta la función del .gs con los argumentos JSON; devuelve {valor} o {error}.
 * Devuelve { url, entorno, llamadas, cerrar }. `llamadas` registra cada `google.script.run`.
 */
export async function iniciarAplicacion({ codigo, html = {}, preparar = () => {}, google = {} }) {
  const plantillasHtml = Object.fromEntries(Object.entries(html).map(([n, r]) => [n, readFileSync(join(SRC, r), 'utf8')]));
  const entorno = cargarGs(codigo, { plantillasHtml, ...google });
  preparar(entorno);
  const llamadas = [];

  const servidor = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'POST' && url.pathname.startsWith('/rpc/')) {
        let cuerpo = '';
        for await (const trozo of req) cuerpo += trozo;
        const nombre = decodeURIComponent(url.pathname.slice(5));
        const args = JSON.parse(cuerpo || '[]');
        llamadas.push({ nombre, args });
        try {
          const valor = entorno.llamar(nombre, ...args);
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ valor: plano(valor) }));
        } catch (error) {
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
        return;
      }
      let pagina;
      if (url.pathname.startsWith('/archivo/')) pagina = plantillasHtml[decodeURIComponent(url.pathname.slice(9))];
      else pagina = entorno.llamar('doGet', { parameter: Object.fromEntries(url.searchParams) }).getContent();
      if (pagina === undefined) { res.statusCode = 404; res.end('No existe'); return; }
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(SHIM + pagina);
    } catch (error) {
      res.statusCode = 500;
      res.end(`Error en el servidor de prueba: ${error.message}`);
    }
  });
  await new Promise((resuelve) => servidor.listen(0, '127.0.0.1', resuelve));
  const { port } = servidor.address();
  return { url: `http://127.0.0.1:${port}`, entorno, llamadas, cerrar: () => new Promise((r) => servidor.close(r)) };
}
