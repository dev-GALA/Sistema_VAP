// Doble complementario de google.script.run para los E2E de profesores.
// El de tests/e2e/arnes.mjs solo es proxy en la raíz: tras `.withSuccessHandler(f)` devuelve un objeto plano y
// `.withFailureHandler(g).fn()` deja de funcionar. Este reemplaza `window.google` (ignora el que inyecta el arnés)
// y mantiene el mismo protocolo (POST /rpc/FN) y la marca window.__dialogoCerrado al cerrar.
export const SHIM_RUN = `(function () {
  function ejecutor(ok, ko, usuario) {
    return new Proxy({}, { get: function (_d, nombre) {
      if (nombre === 'withSuccessHandler') return function (f) { return ejecutor(f, ko, usuario); };
      if (nombre === 'withFailureHandler') return function (f) { return ejecutor(ok, f, usuario); };
      if (nombre === 'withUserObject') return function (o) { return ejecutor(ok, ko, o); };
      if (typeof nombre !== 'string' || nombre === 'then') return undefined;
      return function () {
        var args = Array.prototype.slice.call(arguments);
        fetch('/rpc/' + nombre, { method: 'POST', body: JSON.stringify(args) })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (j.error) { if (ko) ko(new Error(j.error), usuario); else console.error(j.error); }
            else if (ok) ok(j.valor, usuario);
          });
      };
    } });
  }
  var g = { script: { run: ejecutor(null, null, null),
    host: { close: function () { window.__dialogoCerrado = true; }, setHeight: function () {}, setWidth: function () {} } } };
  Object.defineProperty(window, 'google', { configurable: true, get: function () { return g; }, set: function () {} });
})();`;
