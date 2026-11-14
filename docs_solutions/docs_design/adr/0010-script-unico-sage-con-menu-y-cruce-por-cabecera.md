# ADR-0010: Script único SAGE con menú propio y cruce de columnas por cabecera

- **Estado:** Aceptada
- **Fecha:** 2026-05-25
- **Equivalencia:** DT-10
- **Requisitos:** RNF-02

## Contexto

Los cálculos y volcados sobre la exportación SAGE laboral irán creciendo por partes (salario
base, volcados de nóminas, etc.). Se necesita un punto de entrada único para el usuario y una
forma de localizar columnas que resista las reordenaciones del export.

## Decisión

Agrupar todos los cálculos en un **único Apps Script enlazado** a `VAP_Export_Sage` con un
**menú propio** ("VAP_Acciones"), ampliable por acciones/submenús; y localizar las columnas de
origen **por nombre de cabecera** (no por índice fijo).

## Consecuencias

- **Positivo:** un solo punto de entrada para el usuario; fácil de extender por partes sin
  tocar la estructura; el cruce por cabecera resiste reordenaciones de columnas en el export.
- **Negativo:** las cabeceras deben mantenerse con un nombre estable y reconocible; el mapeo
  al **destino** sigue usando posiciones fijas (ver [R-08](../SSD.md#9-riesgos-y-limitaciones)
  y [ADR-0011](0011-fusionar-volcado-de-nominas-en-el-script-sage.md)).

## Alternativas descartadas

- **Un script/proyecto por cálculo:** fragmentación y más proyectos que mantener.
- **Fórmulas nativas en celdas:** frágiles, difíciles de auditar y versionar.
- **Localizar columnas por letra/posición fija en el origen:** se rompería ante cualquier
  reordenación del export.
