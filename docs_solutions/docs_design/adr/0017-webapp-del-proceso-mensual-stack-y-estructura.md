# ADR-0017: Webapp del proceso mensual: stack y estructura del código

- **Estado:** Propuesta
- **Fecha:** 2026-11-16
- **Decisores:** Desarrollo, con la Responsable de Administración como usuaria
- **Equivalencia:** —
- **Requisitos:** RF-72, RF-73, RF-79, RF-82, RNF-09, RNF-11, RNF-16, RNF-17

## Contexto

Hace falta una webapp única desde la que la Responsable de Administración siga el proceso mensual,
lance comprobaciones contra los documentos de terceros, consulte sus diferencias y dé de alta, de baja y
modifique a las personas. Cuatro fuerzas condicionan cómo se construye:

- **Mueve datos de nóminas.** Un fallo de acceso o de escritura tiene consecuencias reales (RNF-09).
- **La mantiene una sola persona** (RNF-11), y el repositorio ya arrastra deuda por funciones largas y
  lógica duplicada entre scripts (RNF-16, RNF-17).
- **Ya existe un modelo probado** en el repositorio hermano `gala_buca`, también una webapp de Apps Script
  con Google Sheets: capas por prefijo de archivo, pruebas de arquitectura, Biome, Vitest y Playwright.
- **La parte gráfica ya está definida** en SIFAF, y la heredan `gala_buca` y `carfa`.

Hoy no hay `clasp` ni integración continua: el código se copia y pega a mano entre este repositorio y los
proyectos de Apps Script (riesgo R-13 del SSD).

## Decisión

**La webapp es un proyecto de Apps Script nuevo e independiente, cuyo código vive en `docs_solutions/src/webapp/`**, como un proyecto más de `src/` (una carpeta por proyecto de Apps Script), con
estas reglas:

1. **Estructura plana con prefijo por capa**, porque Apps Script no tiene carpetas: `dominio-*.gs`
   (reglas puras, sin servicios de Google), `app-*.gs` (casos de uso, con las dependencias inyectadas),
   `infra-*.gs` (adaptadores y punto de entrada) y `ui-*.html`. **Las dependencias apuntan hacia dentro.**
2. **Sintaxis ES2019** en los `.gs` (sin `?.`, `??`, `replaceAll`…): la versión de V8 de Apps Script no está
   verificada.
3. **Solo las funciones `api…` y `doGet` son llamables desde el navegador**, y **cada una comprueba el rol
   en el servidor**. Todas las demás terminan en `_`, que Apps Script no expone.
4. **Versión 1: el esqueleto con todas las pantallas** —Proceso mensual, Comprobaciones, Registro de
   diferencias, Altas/bajas y Maestro de personal—, con el acceso por rol. Empezó en solo lectura; desde la v0.2.0 *Proceso mensual* escribe una fila en `estado_pasos` al marcar un paso manual. Ninguna
   pantalla escribe todavía.
5. **Pruebas:** Vitest para dominio, casos de uso e infraestructura sobre los dobles de Google que ya existen
   en `tests/soporte/`; el arnés y Playwright para las pantallas; y una **prueba de arquitectura** nueva que
   vigila los prefijos, la regla de dependencias, la sintaxis ES2019 y que solo `api…` quede expuesta. El
   código se carga **tal cual se despliega**, sin pies `module.exports`, como ya hace el cargador del repo.
6. **Las plantillas HTML solo usan *scriptlets* para incluir archivos y para datos simples.** La lógica de
   la pantalla va en funciones de JavaScript, no en la plantilla.
7. **Estilo: copia del de `carfa`** (identidad de SIFAF: negro, amarillo GALA y gris, Segoe UI a 14 px), con
   su origen anotado en un comentario. Sin gráficas en la versión 1.
8. **Herramientas nuevas en este repositorio: Biome**, limitado a `docs_solutions/src/webapp/` y `tests/webapp/` para no
   reformatear el código existente. **`clasp` queda como decisión abierta**: su inicio de sesión es una
   credencial, y se decide parámetro a parámetro antes de usarla. Mientras, el despliegue es manual.

## Consecuencias

- **Positivas:** un modelo ya probado en otro proyecto; reglas vigiladas por una prueba en lugar de por la
  memoria de quien programa; la webapp no toca ni arriesga los scripts que hoy mueven nóminas.
- **Negativas:** una herramienta nueva (Biome) que mantener; y, sin `clasp`, el despliegue sigue siendo
  manual y puede divergir del repositorio (R-13). Se probó primero ponerla en una carpeta `src/` en la raíz,
  y se descartó: el repositorio guarda su código en `docs_solutions/src/` y esa convención manda hasta que se
  migre la estructura.
- **Neutras:** el estilo se copia y no se comparte; si cambia el origen, hay que actualizarlo a mano.
- **Lo que no se prueba en automático:** el comportamiento real dentro de Google (permisos, ventana de
  seguridad de HtmlService, «ejecutar como»). Se comprueba a mano antes de cada despliegue.

## Alternativas descartadas

- **Ampliar los proyectos de Apps Script existentes.** Acopla lo nuevo con lo que ya mueve nóminas y obliga
  a probar los dos juntos.
- **Un framework de interfaz.** No hay equipo que lo mantenga (RNF-11) y `gala_buca` demuestra que HTML y
  JavaScript sin compilar bastan.
- **Una librería de Apps Script compartida para el estilo.** Añade un punto de fallo y una dependencia de
  despliegue para evitar copiar un archivo (KISS).
- **Pies `module.exports` como en `gala_buca`.** El cargador de este repositorio ya prueba el código tal
  cual se despliega, así que el pie sería ruido.
