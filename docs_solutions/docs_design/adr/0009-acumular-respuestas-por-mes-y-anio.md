# ADR-0009: Acumular respuestas de formulario por mes/año en lugar de reemplazar por la última

- **Estado:** Aceptada
- **Fecha:** 2026-05-25
- **Equivalencia:** DT-09

## Contexto

En el registro de actividad de profesores, un mismo profesor puede enviar **varias respuestas**
durante un mes, cada una con datos parciales. La arquitectura anterior ("último gana entero")
hacía que el último envío sobrescribiera la fila completa, **borrando** los datos parciales de
los envíos anteriores. Cada mes, además, es un ciclo independiente.

## Decisión

Acumular las respuestas por `(profesor + mes + año)`: agrupar por nombre normalizado + mes
seleccionado (col C) + año de la marca temporal (col A); por columna, la **última celda no
vacía** gana, el vacío **no** pisa y el `0` es dato válido. Por profesor se escribe en destino
el grupo más reciente (por timestamp).

## Consecuencias

- **Positivo:** se preservan los datos parciales de múltiples envíos; cada mes se trata como
  ciclo independiente; el `0` deja de perderse como si fuera vacío.
- **Negativo:** lógica de acumulación más compleja; depende de la correcta normalización de
  nombre/mes y de la extracción del año (`isEmpty`, `getYear`, `normalizeKey`).
- **Mejora futura:** una fila por (profesor, mes) en destino para histórico mensual, y
  validar que el mes elegido coincide con el año de la marca temporal.

## Alternativas descartadas

- **"Último gana entero":** borraba datos parciales de envíos previos.
- **Mezclar meses sin distinguir:** impediría tratar cada mes como ciclo independiente.
