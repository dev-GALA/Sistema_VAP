# ADR-0004: Vincular el formulario de Horas Extras directamente a la BBDD

- **Estado:** Aceptada
- **Fecha:** 2026-03-24
- **Equivalencia:** DT-04
- **Requisitos:** RF-02

## Contexto

El formulario de horas extras de secretarias (`EXTRA SECRETARIAS 2026`) contiene una pregunta
tipo lista con las secretarias. Mantener esa lista a mano implica actualizar el formulario en
cada alta o baja de personal, lo que es propenso a errores y olvidos.

## Decisión

Sincronizar automáticamente la pregunta lista "SECRETARIA" del formulario con las secretarias
activas de la BBDD (`VAP_Secretarias`), mediante un script
(`VAP_Script_Actualizacion_Automatica_Secretarias`) con triggers de edición/cambio y respaldo
horario.

## Consecuencias

- **Positivo:** la lista del formulario se mantiene sola; las altas/bajas se gestionan en un
  único punto (la BBDD).
- **Negativo:** el cruce posterior depende de que el `Nombre` coincida con el texto del
  desplegable (ver [R-06](../SSD.md#9-riesgos-y-limitaciones)); la lista no debe editarse a
  mano porque se sobrescribe en cada sincronización.

## Alternativas descartadas

- **Lista manual en el formulario:** mantenimiento recurrente y riesgo de desincronización
  con el personal real.
