# ADR-0008: Reutilizar el patrón de sincronización (gemelo) para profesores

- **Estado:** Aceptada
- **Fecha:** 2026-05-25
- **Equivalencia:** DT-08

## Contexto

La sincronización del formulario de secretarias con la BBDD ya estaba probada y en
producción. Profesores necesita el mismo comportamiento (lista dinámica + escritura de ID al
enviar), aunque sobre otra hoja (`VAP_Profesores`) y otra pregunta del formulario.

## Decisión

Reutilizar el patrón de sincronización de secretarias como **gemelo** para profesores
(`VAP_Script_Actualizacion_Automatica_Profesores`), en lugar de diseñar un mecanismo distinto.

## Consecuencias

- **Positivo:** comportamiento ya probado; mínimo coste de desarrollo y de mantenimiento
  conceptual.
- **Negativo:** dos copias de lógica casi idéntica; obliga a la separación en proyectos
  independientes (ver [ADR-0007](0007-proyectos-apps-script-independientes.md)).

## Alternativas descartadas

- **Diseñar un mecanismo distinto para cada colectivo:** mayor coste y superficie de error sin
  beneficio claro.
