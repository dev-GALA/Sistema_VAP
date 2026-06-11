# ADR-0007: Un proyecto Apps Script independiente por colectivo

- **Estado:** Aceptada
- **Fecha:** 2026-05-25
- **Equivalencia:** DT-07

## Contexto

Los scripts de sincronización de secretarias y de profesores son **gemelos**: comparten
nombres globales (`onFormSubmit`, `FORM_ID`, etc.). Si conviven en el mismo proyecto Apps
Script, esos nombres colisionan y el comportamiento se vuelve impredecible.

## Decisión

Desplegar la sincronización de **cada colectivo** (secretarias / profesores) en un **proyecto
Apps Script independiente**, vinculado a su propio formulario.

## Consecuencias

- **Positivo:** sin colisiones de nombres; cada colectivo evoluciona por separado; despliegue
  y permisos aislados.
- **Negativo:** dos proyectos que mantener con lógica muy similar; el mismo cambio puede tener
  que aplicarse en ambos (ver [ADR-0008](0008-reutilizar-patron-de-sincronizacion.md)).
- **Riesgo asociado:** [R-05](../SSD.md#9-riesgos-y-limitaciones).

## Alternativas descartadas

- **Un único proyecto Apps Script con todo el código:** colisión de nombres globales entre los
  scripts gemelos.
