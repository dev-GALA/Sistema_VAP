# ADR-0019: `VAP_Pagos` como servicio propio con la huella HMAC de la cuenta

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Decisores:** Desarrollo. Los parámetros de seguridad se fijaron uno a uno con quien lleva el desarrollo; **falta la validación de Gerencia y de protección de datos** (ver «Abierto»)
- **Equivalencia:** —
- **Requisitos:** RF-86, RF-87, RF-88, RF-89, RF-90, RF-91, RF-92, RF-93, RF-94, RF-95, RF-96, RF-97, RF-98, RF-99, RNF-09, RNF-12, RNF-13, RNF-19, RNF-20, RNF-21, RNF-22, RNF-23

> **Decisión 4 sustituida por [ADR-0020](0020-vap-pagos-identifica-por-dni-con-varios-id-trabajador.md)** (25 nov 2026): `VAP_Pagos` guarda ahora el **DNI** y una fila por pareja DNI + `id_trabajador`. El resto de este ADR sigue vigente.

## Contexto

El fichero del banco solo trae **nombre e IBAN**, y se necesita reconocer a quién se pagó **sin guardar la
cuenta y sin juntarla con el DNI** ([DUDA-0005](../../../docs_work/dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md)).
La webapp ([ADR-0017](0017-webapp-del-proceso-mensual-stack-y-estructura.md),
[ADR-0018](0018-gsh-propio-de-la-webapp-propietario-y-accesos.md)) ya da altas y bajas y, hasta ahora, calcula
la huella con una clave que vive **en sus propias propiedades**. Eso significa que **quien edite la webapp
puede leer la clave**. Hay que decidir:

- **Dónde vive el código que calcula la huella y la clave**, y quién puede leerla.
- **Qué se guarda de cada cuenta** y quién ve el libro.
- **Cómo se cruza cada mes** el fichero del banco sin pasar del límite de 6 minutos de Apps Script y sin
  dejar ninguna cuenta en un registro (RNF-19, RNF-22).

## Decisión

1. **`VAP_Pagos` es un proyecto de Apps Script propio e independiente**, **no ligado al libro** ni a la
   webapp, más un libro de Google Sheets del mismo nombre. **Solo el propietario edita el proyecto** (RNF-21).
   La webapp lo llama **como servicio** (despliegue web propio con identificación entre proyectos) y le pasa
   la cuenta **solo en memoria**; el servicio no la devuelve ni la escribe.
2. **La huella es HMAC-SHA256** (en hexadecimal) del IBAN normalizado con una **clave secreta**, **sin el
   identificador ni la empresa** (RF-86, RF-87), de modo que un cambio de empresa no la altera.
3. **La clave vive solo en las Script Properties del proyecto `VAP_Pagos`.** La genera el desarrollador
   (nunca pasa por el chat, el repositorio ni la hoja) y **se guarda una copia en el gestor de contraseñas de
   GALA**; quién ve esa entrada se fija al crearla. Si se pierde, hay que repetir la carga inicial (RNF-20).
4. **Qué se guarda por persona:** `id_personal`, la huella, **los últimos 4 dígitos de la cuenta** y la fecha
   de última actualización (RF-98). **No se guarda la cuenta, ni el DNI, ni el nombre** de las personas
   registradas.
5. **`VAP_Personas` lleva una marca `cuenta_en_pagos`** (sí/no, con fecha), **sin huella** (RF-97).
6. **El cruce mensual** recibe los ficheros del banco en **XML (ISO 20022 `pain.001.001.09`), CSV o Excel**,
   **por empresa, en llamadas separadas**, con lecturas y escrituras en bloque, y exige **fusionar** los
   informes al terminar (RF-90, RF-92, RNF-22).
7. **El informe tiene dos partes** (RF-91): **Parte 1**, pagos que coinciden con una huella (`id_personal`,
   importe, estado *Coincidente* o *Incorrecto*, y **Observaciones solo si es Incorrecto**, con importes,
   referencias y fuente); **Parte 2**, pagos que **no existen** en `VAP_Pagos` (**nombre del beneficiario del
   banco**, huella, últimos 4 dígitos, importe y entidad). **Todo pago deja una fila**: no hay «no cruzado».
   Se compara además el importe con el de la Vinculación (RF-99). *Forma concreta en el libro (una hoja por mes
   y una hoja de resoluciones que solo se añade): provisional, la fija la implementación.*
8. **Subsanar no sobrescribe** (RF-93): la resolución se añade con quién, cuándo y motivo.
9. **Quién ve qué:** el **libro lo editan el desarrollador y la Responsable de Administración**; el uso normal
   es **solo por la webapp**, y la edición directa es excepcional. La pantalla de consulta muestra **nombre y
   DNI leyéndolos de `VAP_Personas` en el momento** (RF-96); **la huella no se muestra**.
10. **Los ficheros del banco no los guarda el sistema** (se leen en el navegador); **los borra el usuario a mano
    cuando proceda**, sin borrado automático. El Excel de altas con cuentas en claro se borra tras verificar la
    carga inicial (RNF-23).
11. **Carga inicial de uso único** (RF-89): se cruza por DNI el fichero de altas con el maestro de personas,
    se calcula la huella en memoria y **una persona confirma** antes de guardar (en bloque lo claro, una a una
    lo dudoso). Después se retira; el mantenimiento pasa a las altas de la webapp.

## Consecuencias

- **Positivas:** la clave no la ve quien edita la webapp; la cuenta existe solo en memoria (RNF-19); el
  informe deja huella de cada pago y se puede subsanar sin perder el original; cada llamada trabaja por empresa
  y cabe en el tiempo; un error de permisos sobre un libro no expone cuentas completas.
- **Negativas:**
  - **Dos proyectos que desplegar** y una conexión entre ellos que no se ha probado en Google real.
  - **Quien edite el libro ve** huellas, últimos 4 dígitos y los nombres de los «no existentes»: la
    Responsable de Administración, al ser editora, **también**. Se declara a protección de datos (RNF-20).
  - **Dependencia de una persona**: el proyecto y la clave son de la cuenta del desarrollador (R-22, R-25).
  - **Duplicación inevitable (RNF-17):** la normalización y la validación del IBAN existen en la webapp y hacen
    falta en el servicio. *Alternativa:* que **solo el servicio** valide la cuenta y la webapp la envíe sin
    validar; el coste es que el aviso de formato llega tras la llamada.
  - Las cuentas en claro **quedan en Drive** en los ficheros del banco hasta que el usuario los borre.
- **Seguridad:** HMAC con clave secreta (un resumen sin clave no vale: los IBAN son predecibles); clave solo
  en el proyecto del propietario; la cuenta no sale de memoria ni a registros ni a mensajes de error, y una
  prueba lo comprueba; acceso por cuentas nominales; el servicio comprueba en el servidor quién le llama.
- **Copias de seguridad:** de la **clave**, en el gestor de contraseñas de GALA; del **libro**, la copia
  periódica del libro que ya prevé el [ADR-0018](0018-gsh-propio-de-la-webapp-propietario-y-accesos.md)
  (frecuencia por decidir). Sin la clave, el libro de huellas **no sirve**: hay que reconstruirlo.
- **Resiliencia:** una escritura que toca dos libros se ordena como en RF-85: evento, escrituras y
  comprobación de que concuerdan (marca en `VAP_Personas` y fila en `VAP_Pagos`), con aviso si no. Un fallo a
  mitad de un cruce solo afecta a la empresa en curso. Falta un procedimiento de transferencia de la propiedad.
- **Abierto, y debe cerrarse antes de aceptar este ADR:**
  - **Validación de Gerencia y de protección de datos** y su registro de actividades de tratamiento. **No
    bloquea escribir ni probar el código con datos inventados; sí bloquea cargar datos reales.**
  - Quién ve la entrada del gestor de contraseñas, y quién es el segundo editor del proyecto (R-22).
  - Plazo de conservación de los informes.
- **Lo que no se prueba en automático:** la identificación entre proyectos y los permisos reales de Google, los
  tiempos reales frente al límite de 6 minutos, la lectura de Excel (`.xls` y `.xlsx`) en el navegador y los
  triggers. Se cubren con una comprobación manual escrita ([proximos_pasos.md](../../../docs_work/proximos_pasos.md)).

## Alternativas descartadas

- **B · `VAP_Pagos` como librería de Apps Script.** Más simple de conectar, pero **creo que una librería lee las
  Script Properties del proyecto que la llama**, no las suyas: la clave acabaría en la webapp y se perdería la
  separación. **No está verificado**; si se comprobase que no es así, volvería a ser una opción.
- **C · Todo en el proyecto de la webapp.** Un solo despliegue, pero **quien edita la webapp ve la clave** y se
  mezclan pagos con el resto. Es lo que había hasta ahora (v0.3.0), y se **sustituye**.
- **Guardar el IBAN en claro, o no guardar nada y cruzar por nombre:** descartadas en la
  [DUDA-0005](../../../docs_work/dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md) por exponer las
  cuentas o por depender de un cruce por nombre mensual.
- **Guardar la huella en `VAP_Personas`** junto al DNI: debilita la separación que se busca (RF-86).
