# ADR-0002: Webapp propia para el reporte de complementos

- **Estado:** Aceptada
- **Fecha:** 2026-02-25
- **Equivalencia:** DT-02
- **Requisitos:** RF-05, RF-58

## Contexto

Los responsables (managers) deben reportar masivamente los complementos salariales de las
secretarias cada mes. La primera aproximación con formularios nativos de Google resultó
inviable: los envíos masivos se clasificaban como **SPAM** y obligaban a resolver reCaptcha
de forma constante, interrumpiendo el flujo de trabajo.

## Decisión

Crear una **webapp propia** con Google Apps Script (HTML servido por `doGet`) para el reporte
de complementos, en lugar de usar formularios nativos.

## Consecuencias

- **Positivo:** control total de la UX (validación de responsable, carga masiva por
  secretaria, correcciones); sin reCaptcha ni falsos positivos de SPAM.
- **Negativo:** hay que mantener el frontend HTML y el backend GAS; los permisos no se
  gestionan por rol nativo de Google (ver [R-02](../SSD.md#9-riesgos-y-limitaciones)),
  por lo que la autorización se valida internamente en el backend.

## Alternativas descartadas

- **Google Forms estándar:** clasificación como SPAM, reCaptcha constante y nula capacidad
  de validación responsable ↔ concepto.
