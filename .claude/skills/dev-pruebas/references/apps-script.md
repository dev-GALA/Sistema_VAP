# Pruebas de código Apps Script (`.gs`)

Apps Script no tiene módulos: todos los archivos comparten el ámbito global. Para probarlo en Node se
carga cada `.gs` como lo haría la plataforma y se sustituyen los servicios de Google por dobles.

## Estructura recomendada

- Código en `src/*.gs` (el mismo archivo en local y en Apps Script). Pruebas en `tests/*.test.js`.
- Cada `.gs` termina con el bloque que lo hace cargable en Node y no afecta a Apps Script:

```js
if (typeof module !== 'undefined') module.exports = { funcionA, funcionB };
```

- Sintaxis **ES2019**: sin `??`, `?.`, `replaceAll` ni `Object.hasOwn`. No está verificada la versión de V8
  que usa Apps Script en la cuenta.
- **Capas por prefijo** si el repo las tiene (`dominio-`, `app-`, `infra-`, `ui-`): el dominio no nombra
  `SpreadsheetApp`, `DriveApp`, `MailApp`, `PropertiesService`, `LockService`, `UrlFetchApp`, `Utilities`…
  Se vigila con una prueba de arquitectura (la skill de cambio de código explica cómo).

## Cargar los `.gs` en las pruebas

La plantilla `ayuda` (se copia a `tests/ayuda.js`). Usa `createRequire` para cargar cada `.gs`
y publica sus exportaciones en `globalThis`, imitando el ámbito global compartido.

## Dobles en memoria

La plantilla `dobles` (se copia a `tests/dobles.js`): una tabla en memoria con la misma
interfaz que el adaptador de hojas (leer todas, añadir, actualizar, borrar, reemplazar). Con ella, los casos de
uso se prueban sin Google ni red. Hacen lo mismo el reloj (`ahora()` inyectado) y los generadores de ID.

## Comprobar la sintaxis de un `.gs`

Node no acepta `--check` sobre la extensión `.gs`. Se pasa por la entrada estándar:

```sh
node --check < src/mi-archivo.gs
```

## Herramientas habituales

Vitest (unitarias e integración), Biome o ESLint más formateador (calidad), Playwright (extremo a extremo
sobre la interfaz HTML con un servidor local en modo demo). Elegir y registrar por ADR; ninguna por moda.
La plantilla `vitest.config` es el mínimo de Vitest.

## Lo que no se prueba en local

Triggers (`onOpen`, `onEdit`, por tiempo, de formulario), cuotas y tiempos de ejecución de Google, permisos
y el comportamiento del editor web. Se declaran, se anotan en `docs_work/proximos_pasos.md` y se cubren con
una comprobación manual escrita paso a paso.
