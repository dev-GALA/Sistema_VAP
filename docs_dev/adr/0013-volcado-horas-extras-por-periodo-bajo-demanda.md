# ADR-0013: Volcado de Horas Extras por periodo y bajo demanda

- **Estado:** Aceptada
- **Fecha:** 2026-08-17
- **Equivalencia:** — (posterior a la numeración `DT-NN`)

## Contexto

El volcado de horas extras de secretarias se disparaba con un trigger `onFormSubmit` y aplicaba la
regla *"último registro por empleada"* **sin mirar el mes**. El formulario **sí captura el mes** en
la columna C de la hoja de respuestas, pero el script no la leía.

Consecuencias de ese diseño:

1. **Una respuesta de un mes podía sobrescribir la de otro.** En la verificación del 17 de agosto de
   2026 ya convivían 25 respuestas de `JULIO` con 1 de `JUNIO` en la misma pestaña.
2. **La corrección dependía de una tarea manual no documentada:** vaciar periódicamente la hoja de
   respuestas moviendo las filas antiguas a la pestaña `Anteriores`. Si se olvidaba, el volcado del
   mes siguiente reutilizaba valores del anterior para quien no hubiera vuelto a reportar.
3. **El volcado no dejaba rastro.** Corría desatendido y no escribía en ninguna hoja de registro: un
   fallo solo era visible en el panel *Ejecuciones* de Apps Script.
4. **La Responsable de Administración no podía lanzarlo** cuando lo necesitaba: dependía de que
   alguien enviara el formulario.

## Decisión

Reemplazar el volcado automático por una **acción explícita, acotada a un periodo y con
confirmación previa**, accesible desde el menú `VAP_Acciones` del Spreadsheet de respuestas.

1. **Filtrado por periodo.** Una respuesta entra en el volcado cuando su `MES` (columna C) coincide
   con el mes elegido **y** el año de su marca temporal coincide con el del periodo.
2. **Selección del mes mediante desplegable** en un diálogo `HtmlService`, con el **mes en curso
   preseleccionado** según la fecha de ejecución. Se permite elegir otro mes y el año, porque el
   cierre puede hacerse a principios del mes siguiente.
3. **Informe previo y confirmación.** Antes de escribir nada se muestra cuántas filas coinciden con
   el periodo y cuántas no, desglosadas por motivo. La exportación solo ocurre si se confirma.
4. **Reenvío como corrección.** Si una secretaria aparece varias veces en el mismo periodo, gana el
   registro con la **marca temporal más reciente**.
5. **La hoja de respuestas no se modifica.** `Anteriores` recibe una **copia** de las filas
   exportadas, sellada con periodo, fecha y `Run ID`. No se borra ni se mueve nada.
6. **Auditoría propia** en la hoja `LOG Volcado`, con tres categorías: `MOVIMIENTO` (cambios
   antes→después), `INCIDENCIA` (mes no reconocido, fila sin nombre, valor no numérico, marca
   temporal fuera de mes, envíos múltiples) y `ERROR` (nombre duplicado en destino, fallo de acceso,
   fallo al copiar), estos últimos con tipo y solución sugerida.
7. **Nombre ambiguo en destino = no se escribe.** Si una secretaria aparece más de una vez en la
   hoja de destino, la fila se bloquea y se registra el error en lugar de escribir a ciegas.

El trigger `onFormSubmit` deja de usarse para el volcado.

## Consecuencias

- **Positivo:** desaparece el riesgo de que un mes pise a otro; **el archivado manual deja de ser
  necesario** para la corrección del resultado, porque el filtro por periodo lo sustituye; la
  Responsable de Administración lanza el volcado cuando lo necesita; nada se escribe sin revisión
  previa; toda ejecución queda auditada; la hoja de respuestas conserva el histórico íntegro.
- **Negativo:** el volcado **deja de ser automático** — si nadie pulsa el botón, no se vuelca nada;
  el proyecto Apps Script pasa a tener **dos archivos** (script + plantilla HTML), y el nombre de la
  plantilla (`DialogoVolcado`) queda acoplado al código; ejecutar dos veces el mismo periodo
  duplica las filas en `Anteriores` (se avisa en el informe, pero no se impide).

## Alternativas descartadas

- **Mantener `onFormSubmit` añadiendo el filtro por mes.** Resolvía el problema del periodo, pero no
  daba control a la Responsable de Administración ni permitía revisar antes de escribir. Se conserva
  la función desactivada por una constante, por si se quisiera recuperar.
- **Pedir el mes con `ui.prompt`.** Es un solo archivo y no requiere HTML, pero obliga a teclear el
  mes —con el riesgo de error que eso implica en una tarea mensual— y no permite mostrar el informe
  y la confirmación en la misma ventana.
- **Mover las filas a `Anteriores` automáticamente al volcar.** Automatizaba la tarea manual
  existente, pero **borra** de la hoja de respuestas. Se descartó por irreversible y porque, con el
  filtro por periodo, vaciar la hoja ya no aporta nada.

## Relación con otros ADR

- Extiende el patrón de auditoría de [ADR-0012](0012-auditoria-centralizada-logs-y-errores.md) a un
  script que hasta ahora no dejaba rastro.
- Aplica al colectivo de secretarias el mismo principio de **acotar por mes + año** que
  [ADR-0009](0009-acumular-respuestas-por-mes-y-anio.md) estableció para profesores, aunque con
  resolución distinta: allí se **acumula** por campo, aquí gana el **envío más reciente** completo.
- No altera [ADR-0004](0004-formulario-horas-extras-vinculado-a-bbdd.md): el formulario sigue
  vinculado a la BBDD y su desplegable se sincroniza igual.
