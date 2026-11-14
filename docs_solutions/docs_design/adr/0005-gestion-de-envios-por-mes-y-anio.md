# ADR-0005: Gestionar envíos por mes + año

- **Estado:** Aceptada
- **Fecha:** 2026-02-25
- **Equivalencia:** DT-05
- **Requisitos:** RNF-03

## Contexto

Los complementos se reportan mensualmente y se repiten año tras año. El sistema debe poder
distinguir el mismo mes de años distintos sin reestructurar hojas ni colisionar datos con el
paso del tiempo.

## Decisión

Identificar cada envío por **mes + año** (con el año extraído del timestamp), almacenándolo
explícitamente en la hoja `Data`. Las correcciones referencian el `Batch_ID` original y se
filtran por responsable + mes + año + concepto.

## Consecuencias

- **Positivo:** el sistema es duradero a lo largo de los años sin migraciones; las consultas
  y exportaciones se acotan limpiamente por período.
- **Negativo:** todas las operaciones (envío, corrección, consulta, exportación) deben
  arrastrar y respetar el par (mes, año) de forma consistente.

## Alternativas descartadas

- **Solo mes sin año:** obligaría a reestructurar las hojas cada ejercicio y a arriesgar
  colisiones entre años.
