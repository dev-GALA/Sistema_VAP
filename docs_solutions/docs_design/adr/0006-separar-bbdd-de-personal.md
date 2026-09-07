# ADR-0006: Separar la BBDD de personal del resto de hojas operativas

- **Estado:** Aceptada
- **Fecha:** 2026-02-25
- **Equivalencia:** DT-06

## Contexto

El personal (altas/bajas, datos identificativos) se usa desde múltiples puntos del sistema:
webapps de complementos, formularios, volcados. Tener listas dispersas por cada hoja
operativa genera desincronización y errores difíciles de rastrear.

## Decisión

Centralizar todo el personal en una única BBDD (`VAP_BBDD_Personas`), separada de las hojas
operativas, como fuente única de verdad para altas y bajas.

## Consecuencias

- **Positivo:** las altas/bajas se gestionan en un solo lugar; menos errores de
  sincronización; el resto de componentes leen de la misma fuente.
- **Negativo:** introduce una dependencia común; un error en la BBDD se propaga a todos los
  consumidores.

## Alternativas descartadas

- **Mantener listas dispersas por cada hoja operativa:** duplicación, desincronización y
  mantenimiento multiplicado.
