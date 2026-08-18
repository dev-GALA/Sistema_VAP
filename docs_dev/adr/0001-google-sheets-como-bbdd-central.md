# ADR-0001: Google Sheets como BBDD central de personal

- **Estado:** Aceptada
- **Fecha:** 2026-02-25
- **Equivalencia:** DT-01

## Contexto

El sistema necesita una base de datos del personal (secretarias y profesores) que sea la
fuente única de verdad para el cálculo de salarios. La organización ya trabaja sobre Google
Workspace y no se quiere introducir infraestructura nueva ni costes de mantenimiento de
servidores o bases de datos externas.

## Decisión

Usar **Google Sheets** como base de datos central de personal (`VAP_BBDD_Personas`).

## Consecuencias

- **Positivo:** sin infraestructura nueva; herramienta corporativa ya adoptada; edición
  directa por usuarios no técnicos; integración nativa con Apps Script.
- **Negativo:** límites de escala y concurrencia propios de Sheets; dependencia total de
  Google Workspace (ver [R-01](../SSD.md#9-riesgos-y-limitaciones)).

## Alternativas descartadas

- **Airtable / Notion DB:** introducen una herramienta y coste nuevos.
- **Base de datos SQL:** requiere infraestructura y mantenimiento que no se justifican para
  el volumen y el contexto corporativo.
