# ADR-0014: Volcado de Actividad de Profesores por periodo y bajo demanda

- **Estado:** Aceptada
- **Fecha:** 2026-08-17
- **Equivalencia:** — (posterior a la numeración `DT-NN`)
- **Requisitos:** RF-16, RF-20, RF-23, RF-63

## Contexto

El volcado de actividad de profesores se disparaba con `onFormSubmit` y, aunque **sí** agrupaba por
(profesor + mes + año) como establece [ADR-0009](0009-acumular-respuestas-por-mes-y-anio.md), después
reducía cada profesor **al grupo más reciente**: el destino solo podía contener el último mes
reportado, sin posibilidad de elegir cuál volcar. Además reprocesaba la hoja de respuestas completa
en cada envío y no dejaba rastro en ninguna hoja de registro.

Tras aplicar [ADR-0013](0013-volcado-horas-extras-por-periodo-bajo-demanda.md) a horas extras, se
decide llevar el mismo patrón —menú, selección de periodo, informe previo, confirmación, copia al
histórico y auditoría— al formulario de profesores, **respetando las diferencias del caso**.

Diferencias verificadas contra los datos reales (17 agosto 2026):

- El histórico contiene **122 pares (profesor, mes) con más de un reporte**: varias secretarias
  reportan **partes distintas** de la actividad del mismo profesor. La acumulación campo a campo de
  ADR-0009 no es un detalle, es el núcleo del caso.
- Son **64 columnas** de actividad (`F..BQ` → `AC..CN`), frente a las 2 de horas extras.
- La hoja `Hoja 1` del libro de respuestas **ya cumplía la función de histórico**, con 1.730 filas
  de enero a julio de 2026. No hacía falta crear una pestaña nueva.

## Decisión

Aplicar el patrón de ADR-0013 con tres adaptaciones propias del caso.

1. **Se mantiene la acumulación campo a campo** dentro del periodo
   ([ADR-0009](0009-acumular-respuestas-por-mes-y-anio.md)): por cada columna gana la última celda
   **no vacía** según marca temporal; una celda vacía **no** borra lo ya reportado; el `0` es dato
   válido y sí pisa. **No** se adopta el criterio de horas extras ("gana el envío completo más
   reciente"): perdería los reportes parciales.
2. **El vacío tampoco pisa en el destino.** Solo se escriben en `VINCULACIÓN GASTOS PERSONAL` las
   columnas que el periodo trae con valor:
   - si este mes un campo no trae dato, no se escribe nada en él;
   - si un volcado posterior sí lo trae, lo escribe y **sobrescribe** lo que hubiera, incluido un `0`;
   - dentro del mismo mes, entre `5` y `15` prevalece el último por marca temporal.
3. **Se usa `Hoja 1` como histórico**, en lugar de crear una pestaña nueva, para no partir en dos el
   archivo existente. Recibe una **copia** sellada con periodo, fecha y `Run ID`.

Además, y como consecuencia de que **el proceso parte cada mes de una hoja de Vinculación limpia**,
se añade una **comprobación previa**: antes de escribir, el script cuenta cuántas celdas del rango
destino ya tienen datos para los profesores del periodo. El resultado esperado es **0**; si no lo es,
el informe avisa en rojo de que probablemente se esté volcando sobre la hoja del mes anterior. La
misma comprobación se incorpora al script de horas extras (ADR-0013), adaptada a sus dos columnas.

El log usa el **nombre real de cada columna**, leído de la cabecera del formulario: con 64 campos, un
registro posicional sería ilegible. Se recorta a 12 campos por fila con un contador del resto.

El trigger `onFormSubmit` deja de usarse.

## Consecuencias

- **Positivo:** se puede volcar cualquier mes, no solo el último reportado; los reportes parciales de
  varias secretarias se conservan; nada se escribe sin revisión previa; la comprobación de destino
  vacío detecta el error más probable del flujo (ejecutar contra la hoja equivocada) **antes** de
  escribir; ambos formularios se operan igual, lo que reduce el coste de aprendizaje.
- **Negativo:** el volcado **deja de ser automático**; el proyecto GAS pasa a tener dos archivos con
  el nombre de la plantilla acoplado al código (`DialogoVolcado`); el análisis lee ahora también el
  destino, lo que añade una llamada por revisión; ejecutar dos veces el mismo periodo duplica las
  filas en el histórico (se avisa, no se impide).
- **A vigilar:** `Hoja 1` conserva las cabeceras del formulario **anterior** (`HORA EXTRA TALLER` /
  `SÁBADOS TALLER`) mientras el formulario actual dice `MECÁNICO` / `MECÁNICOS`. Las copias se añaden
  por posición: si no son el mismo concepto renombrado, el histórico mezclaría significados.

## Alternativas descartadas

- **Copiar literalmente el criterio de horas extras** (gana el envío completo más reciente). Habría
  hecho los dos scripts idénticos, pero **destruye la acumulación parcial**: el reporte de una
  secretaria borraría el de otra sobre el mismo profesor.
- **Escribir siempre las 64 columnas, incluidas las vacías.** Dejaría el destino como reflejo exacto
  del mes, pero contradice el principio "el vacío no pisa" de ADR-0009 y borraría campos que otra
  fuente pudiera aportar más tarde.
- **Crear una pestaña `Anteriores` nueva.** Habría dejado dos históricos paralelos (`Hoja 1` con
  enero-julio y `Anteriores` con lo posterior) sin ganar nada.

## Relación con otros ADR

- Aplica el patrón de [ADR-0013](0013-volcado-horas-extras-por-periodo-bajo-demanda.md) al segundo
  colectivo, y le devuelve la comprobación de destino vacío.
- **Conserva íntegro** [ADR-0009](0009-acumular-respuestas-por-mes-y-anio.md): lo que cambia es
  **qué** periodo se vuelca, no **cómo** se acumula.
- Extiende la auditoría de [ADR-0012](0012-auditoria-centralizada-logs-y-errores.md) a este script.
- No altera [ADR-0008](0008-reutilizar-patron-de-sincronizacion.md): el script de sincronización del
  desplegable sigue igual y en su propio proyecto ([ADR-0007](0007-proyectos-apps-script-independientes.md)).
