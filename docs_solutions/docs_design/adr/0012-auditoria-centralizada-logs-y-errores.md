# ADR-0012: Auditoría centralizada en hojas `logs` / `errores`

- **Estado:** Aceptada
- **Fecha:** 2026-05-25
- **Equivalencia:** DT-12
- **Requisitos:** RF-46, RF-48

## Contexto

Las acciones del script SAGE (salario base, export neto/bruto) modifican datos sensibles de
nóminas. Se necesita trazabilidad de quién ejecutó qué y cuándo, y diagnóstico de fallos, sin
mezclar el resumen de la acción con el detalle de cambios fila-a-fila.

## Decisión

Registrar la auditoría en **dos hojas centralizadas** del libro `VAP_Export_Sage`: `logs`
(una fila por acción) y `errores` (una fila por fallo, con tipo y solución sugerida vía
`clasificarError_`). Todo se canaliza por el envoltorio `ejecutarAccion_`, que mide tiempo,
registra y **relanza** la excepción. Un `Run ID` correlaciona `logs`, `errores` y los
`LOG NETOS` / `LOG BRUTOS` de los destinos.

## Consecuencias

- **Positivo:** trazabilidad completa y diagnóstico de fallos con tipo y solución; separación
  entre resumen de acción y detalle de cambios; correlación extremo a extremo por `Run ID`.
- **Negativo:** añade hojas y escrituras a cada ejecución; hay que mantener el esquema de
  columnas de `logs`/`errores`.

## Alternativas descartadas

- **Solo el LOG fila-a-fila en cada destino:** sin visión de "quién ejecutó qué" ni de
  errores clasificados.
- **Depender únicamente del registro de ejecuciones de Apps Script:** poco legible para el
  gestor y sin correlación con el detalle de cambios.
