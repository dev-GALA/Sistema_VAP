# ADR-0011: Fusionar el volcado de nóminas (neto y bruto) dentro del script SAGE

- **Estado:** Aceptada
- **Fecha:** 2026-05-25
- **Equivalencia:** DT-11
- **Requisitos:** RF-22, RNF-12

## Contexto

El volcado de nóminas a las hojas de Vinculación vivía en dos scripts standalone separados
(neto y bruto) que leían de un `Informe` externo. Mantener tres proyectos (SAGE + neto + bruto)
es costoso, y el personal completo ya vive en el `bbdd_export_sage_laboral` del propio libro.

## Decisión

Fusionar el volcado de nóminas **dentro** del script SAGE como dos acciones de menú
(**Export Neto** / **Export Bruto**), leyendo de `bbdd_export_sage_laboral` y **sobrescribiendo**
los 8 campos mapeados en cada hoja de Vinculación. Motor común `volcarVinculacion_` con dos
envoltorios finos. Cruce por `Empresa` + `Codigo_Empleado` → `EMPRESA` (E) + `Nº EMPLEADO` (F);
cabecera real del destino en la fila 6.

## Consecuencias

- **Positivo:** un solo proyecto que mantener en lugar de tres; origen único (el bbdd del
  propio libro); la sobrescritura permite el refresco mensual de nóminas; LOG fila-a-fila
  (antes→después) en `LOG NETOS`/`LOG BRUTOS`.
- **Negativo:** la sobrescritura pisa ediciones manuales en las 8 columnas
  (ver [R-07](../SSD.md#9-riesgos-y-limitaciones)); el mapeo al destino es por posición fija
  (ver [R-08](../SSD.md#9-riesgos-y-limitaciones)).
- **Dependencia:** la columna `Salario Base` (L) se alimenta del `salario_base_bruto`
  calculado, así que *Calculo Salario Base* debe ejecutarse antes.

## Alternativas descartadas

- **Mantener scripts standalone separados:** tres proyectos que mantener.
- **Leer del `Informe` externo:** fuente adicional frágil cuando el dato ya está en el libro.
- **Política "solo rellenar celdas vacías":** no permitiría refrescar las nóminas cada mes.
