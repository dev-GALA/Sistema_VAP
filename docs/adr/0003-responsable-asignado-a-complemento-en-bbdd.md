# ADR-0003: Asignar cada responsable a un complemento concreto en BBDD

- **Estado:** Aceptada
- **Fecha:** 2026-02-25
- **Equivalencia:** DT-03

## Contexto

Cada responsable solo debe poder reportar los complementos que le corresponden. Esta relación
responsable ↔ complemento cambia con el tiempo (altas/bajas de managers, reasignación de
conceptos) y no debería requerir tocar el código de la webapp cada vez.

## Decisión

Modelar la relación **responsable ↔ complemento** como datos en la BBDD (hoja
`VAP_Responsables_Complementos`), no en el código. El backend (`vap_bootstrapForEmail`) lee
esa relación para devolver a cada responsable únicamente sus conceptos activos.

## Consecuencias

- **Positivo:** cambiar responsables o complementos es un cambio de datos, sin desplegar
  código; la validación responsable ↔ concepto es declarativa y auditable en la hoja.
- **Negativo:** la integridad depende de mantener la hoja correcta (IDs coherentes con
  `VAP_Responsables` y `VAP_Complementos_Secretarias`).

## Alternativas descartadas

- **Hardcodear responsables/conceptos en el script:** cada cambio organizativo obligaría a
  editar y redesplegar el código.
