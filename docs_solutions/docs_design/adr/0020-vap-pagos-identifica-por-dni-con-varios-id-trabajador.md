# ADR-0020: `VAP_Pagos` identifica a la persona por su DNI, con uno o varios identificadores de trabajador

- **Estado:** Propuesta
- **Fecha:** 2026-11-25
- **Decisores:** Desarrollo (decisión del usuario el 25 nov 2026, tras valorar las alternativas). La validación de Gerencia y de protección de datos **se da por conseguida por el usuario** el mismo día; consta aquí como decisión suya
- **Equivalencia:** —
- **Requisitos:** RF-86, RF-87, RF-97, RF-98, RF-102, RNF-19, RNF-20, RNF-21
- **Sustituye en parte a:** [ADR-0019](0019-vap-pagos-como-servicio-propio-con-huella-hmac.md), **solo su decisión 4** («qué se guarda por persona»). El resto de ese ADR sigue vigente

## Contexto

El ADR-0019 guarda en `VAP_Pagos` solo el `id_personal` (el identificador de trabajador, `EMPRESA_nº`), la huella, los últimos 4 dígitos y la fecha,
**sin DNI**. Al preparar el libro real aparecieron dos casos que ese diseño trata mal:

1. **Una persona con dos contratos** (dos empresas, o dos ingresos) tiene **dos `id_trabajador` y un solo DNI**.
2. **Una persona cambiada de empresa** pasa a tener otro `id_trabajador`: hay que poder contrastarlo y avisar si algo no cuadra.

El DNI es lo único estable que identifica a una persona en todo el sistema (el maestro, la Vinculación y el XML del banco lo usan).
Con solo `id_trabajador` como clave, «la misma persona» no existe como concepto en `VAP_Pagos`.

## Decisión

1. **La persona se identifica en `VAP_Pagos` por su DNI** (normalizado: mayúsculas, sin espacios ni guiones; se comprueba su forma de DNI o NIE).
2. **Una fila por pareja DNI + `id_trabajador`** en la hoja `huellas`, con las columnas
   `id_pagos · dni · id_trabajador · huella · ultimos4 · actualizado_en · actualizado_por`.
   - `id_pagos` es un **número correlativo por fila**, que **no se reutiliza**; se asigna dentro del bloqueo del servicio.
   - Todas las filas de un mismo DNI llevan **la misma huella**. Si la cuenta cambia, **se actualizan todas a la vez**.
3. **El `id_trabajador` sigue siendo la clave del cruce mensual** (los esperados de cada empresa se calculan por id), de modo que el cruce no cambia.
4. **Avisos para revisar** (no bloquean): si a un DNI que ya constaba se le añade otro `id_trabajador`, el servicio devuelve un aviso con **el DNI y los dos identificadores**
   («pueden ser correctos los dos, o uno no»), para que quien lo lee sepa de quién se habla.
5. **Conflicto:** un `id_trabajador` no puede tener dos DNI. Si ya consta con **otro DNI**, **no se guarda nada** y se avisa al usuario con el identificador y los dos DNI para que lo resuelva.
6. **Quién guardó la cuenta** queda en `actualizado_por` (el correo de quien usa la webapp).
7. **La huella sigue sin incluir identificador ni empresa** (RF-87) y **la cuenta sigue existiendo solo en memoria** (RNF-19).
8. **El DNI que se guarda sale del maestro**, no del Excel de la carga inicial: así coincide con el de `VAP_Personas`.

## Consecuencias

- **Positivas:** existe «la misma persona» en `VAP_Pagos`; los dos casos de contexto se resuelven; el cruce mensual no cambia; el aviso da un contraste útil.
- **Negativas:** **el libro `VAP_Pagos` pasa a contener DNI junto a huella y últimos 4 dígitos** (nunca el IBAN ni el nombre). Quien abra el libro puede ver
  qué DNI tiene cuenta registrada y sus últimos 4 dígitos. Lo ven solo el propietario y quienes lo editan (RNF-20); **riesgo R-25 ampliado**.
- **Negativas:** la huella está repetida en varias filas de un DNI: la coherencia la garantiza el servicio, no la hoja (se prueba; una edición manual podría romperla).
- **Negativas:** se lee la hoja entera por cada cuenta guardada (dentro del bloqueo). Con lotes de 200 debería caber en los 6 minutos de Apps Script;
  **no probado en Google real** (RNF-22).
- **A actualizar con este cambio:** servicio y webapp (hecho en código, **sin subir**), pruebas, `resumen_proteccion_datos.md`, SSD y requisitos.
- **La primera carga de cuentas se hace con un script de uso único** (`infra-carga.gs`, `app-carga.gs`, `dominio-carga.gs` en `src/vap_pagos/`), no con la pantalla de la webapp, porque esa lee un maestro con la estructura supuesta del 17 nov. Tiene simulación y carga real, es repetible y se borra al terminar. Para lanzarlo desde el editor de Apps Script tiene **dos funciones públicas** (`cargaInicialSimular`, `cargaInicialEjecutar`), **excepción autorizada por el usuario el 25 nov 2026** a la regla de «solo `doPost` es público»; se quita al borrar el script.
- **Pendiente · interfaz de incidencias:** hoy el conflicto y los avisos salen como **texto** con toda la información (id, DNI, fila, cuenta terminada en, quién y cuándo). Convertirlos en una pantalla donde resolverlos (con nombre de las personas, leído del maestro) **no se ha abordado**.
- **En la pantalla de altas se ve el DNI completo**; el **registro de eventos** de la webapp sigue sin llevar DNI (ADR-0018), ni el de la persona ni el de un conflicto.
- **Pendiente:** validación de Gerencia y de protección de datos por escrito; el usuario la ha dado por conseguida pero **no consta en el repositorio**.

## Alternativas descartadas

- **A · Clave `id_personal` (el ADR-0019 tal cual), con los avisos calculados desde el maestro.** No guarda DNI y mantiene la separación inicial, pero el
  contraste entre identificadores de una misma persona no queda guardado, sino que se calcula al consultar. Era mi recomendación; **el usuario eligió otra**.
- **C · Clave «huella del DNI»** (un código del DNI con una segunda clave). Una fila por persona sin DNI en claro, pero exige una **segunda clave que custodiar**
  y más código. Sin esa clave, un DNI es fácil de reconstruir por fuerza bruta.
- **Dejarlo como está (ADR-0019):** no resuelve los dos casos del contexto.
