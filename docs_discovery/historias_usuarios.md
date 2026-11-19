# Historias de usuario — Sistema VAP

| | |
|---|---|
| **Versión** | 0.7 — BORRADOR · con la comprobación mensual (orden y obligatoriedad futura), la persona en dos empresas y la lista única de empresas (HU-46, HU-47) |
| **Fecha** | 19 noviembre 2026 (versión 0.6: 17 noviembre 2026) |
| **Se deriva de** | [problem.md](problem.md) · [../docs_work/FLUJO.md](../docs_work/flujo_doc/FLUJO.md) · [../docs_work/dudas/](../docs_work/dudas/README_dudas.md) |
| **Responde a** | [Sprint 0 · OB-15](../docs_work/proximos_pasos.md) |

---

## Cómo usar este documento

Este documento responde a **qué tiene que hacer el sistema, para quién y cómo se sabe que está
hecho**. Es el puente entre el problema y la construcción:

| | Responde a |
|---|---|
| [`problem.md`](problem.md) | ¿Qué problema hay y para quién? *(estable durante años)* |
| [`../docs_work/FLUJO.md`](../docs_work/flujo_doc/FLUJO.md) | ¿Cómo funciona hoy el proceso, paso a paso? |
| **`historias_usuarios.md`** *(este)* | **¿Qué tiene que hacer el sistema, y cómo se comprueba?** |
| [`SSD.md`](../docs_solutions/docs_design/SSD.md) | ¿Cómo está construido? |

### Job story ≠ historia de usuario

`problem.md` contiene **job stories** (*"Cuando [situación], quiero [motivación], para
[resultado]"*): describen una situación y el progreso buscado, **sin mencionar rol ni solución**.
Sirven para decidir **si algo merece existir**.

Las **historias de usuario** son otra cosa y se derivan de ellas: sí nombran al rol, sí admiten
solución y llevan **criterios de aceptación verificables**. Sirven para **construir**.

> Una *job story* puede dar lugar a varias historias, y una historia puede servir a varios *jobs*.
> La correspondencia está en la [matriz de trazabilidad](#matriz-de-trazabilidad).

### Formato

Cada historia sigue el formato **Connextra**, el habitual del sector:

> **Como** \<rol\>, **quiero** \<capacidad\>, **para** \<beneficio\>.

Y sus criterios de aceptación el formato **Gherkin** —*Dado / Cuando / Entonces*—, porque obliga a
escribir condiciones **comprobables** en lugar de deseos.

Las historias buenas cumplen **INVEST**: independientes, negociables, valiosas, estimables,
pequeñas y verificables. Si una historia no se puede verificar, es que está mal escrita.

### Convenciones

| Campo | Valores |
|-------|---------|
| **Estado** | ✅ Implementada · 🟡 Parcial · 🔴 Pendiente · ⚪ En decisión |
| **Prioridad** | 🔺 Imprescindible · 🔸 Importante · 🔹 Deseable · ⬜ No ahora *(MoSCoW)* |
| **Origen** | La *job story* de `problem.md` y/o el paso de `FLUJO.md` del que sale |

**Nivel de detalle:** las historias **ya implementadas** llevan criterios resumidos —el código es su
especificación real—. Las **pendientes** llevan el detalle completo, porque son las que hay que
construir y ahí es donde la imprecisión cuesta dinero.

### Cuándo una historia está lista para construirse

Antes de empezar a construir una historia, debe cumplir las cinco condiciones:

- [ ] Los **criterios de aceptación** están escritos y son comprobables uno a uno.
- [ ] Las **dudas de las que depende** están resueltas, o se ha decidido construir sin esperar a
      ellas asumiendo el riesgo por escrito.
- [ ] Se sabe **quién la acepta**: quién dirá que está bien.
- [ ] Está claro **qué pasa cuando algo va mal**, no solo cuando todo va bien.
- [ ] Cabe en el sprint. Si no cabe, se parte antes de empezar, no a mitad.

### Cuándo una historia está terminada

- [ ] Todos los criterios de aceptación se cumplen, **comprobados sobre datos reales**, no de prueba.
- [ ] La acción **deja rastro** consultable (RNF-05 y RF-46), o consta por escrito por qué no.
- [ ] El código está en el repositorio **y desplegado**: son dos pasos distintos y el repositorio no
      despliega solo.
- [ ] La documentación afectada está actualizada: este documento, los requisitos y, si hubo una
      decisión de diseño, su ADR.
- [ ] El estado del requisito correspondiente está actualizado.

> **La cuarta condición de "terminada" es la que más se salta**, y es la que hace que un sistema
> documentado deje de estarlo en tres meses.

---

## Los roles

Son los mismos de [`problem.md` §3](problem.md), que a su vez salen del proceso real.

| Rol | Qué hace en el sistema |
|-----|------------------------|
| **Responsable de complemento** | Reporta los importes del complemento que gestiona |
| **Secretaria** | Reporta sus horas extras y parte de la actividad del profesorado |
| **Gestor de nóminas** | Aporta los datos de nómina y produce el cálculo final |
| **Gerente** | Aporta datos propios, ajusta importes y valida el cierre |
| **Responsable de Administración** | Coordina el cierre completo, opera el sistema y verifica |
| **Departamento de Data** | Consume la actividad del proceso para analizarla |
| **Dirección** | Valora qué aporta el sistema |

> **El profesorado no es un rol de este documento**: no interactúa con el sistema. Es el colectivo
> más expuesto —su retribución la determinan datos que reportan otros— y esa asimetría es la razón
> de que la trazabilidad (É7) y la verificación (É5) importen tanto.

## Las épicas

| # | Épica | De qué va | Historias |
|---|-------|-----------|-----------|
| **É1** | Maestro de personal y conceptos | Quién existe para el sistema, y qué se le puede pagar | HU-01 … HU-03, HU-41 |
| **É2** | Captura | Que el dato llegue, de quien sea | HU-04 … HU-13, HU-36 … HU-38 |
| **É3** | Consolidación | Reunir los datos y calcular | HU-14 … HU-20, HU-39, HU-40 |
| **É4** | Ajuste y cierre | Decidir el importe final y dar el mes por bueno | HU-21, HU-22 |
| **É5** | Verificación | Comprobar contra una fuente independiente | HU-23 … HU-25 |
| **É6** | Coordinación del cierre | Saber que ha empezado, quién falta y por dónde va | HU-26 … HU-30 |
| **É7** | Trazabilidad y consulta | Responder a "¿de dónde salió esta cifra?" | HU-31, HU-32 |
| **É8** | Medición e informes | Saber qué se mueve y qué aporta | HU-33 … HU-35 |

---

# É1 · Maestro de personal y conceptos

### HU-01 · Mantener quién está activo

**Como** Responsable de Administración, **quiero** dar de alta y de baja a secretarias y profesores
en un único sitio, **para** que quien ya no está deje de aparecer en cualquier formulario y cálculo.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-05 · FLUJO paso 1 |

- **Dado** que marco a una persona como no activa, **cuando** se sincronizan los formularios,
  **entonces** deja de aparecer en los desplegables.
- **Dado** que doy de alta a alguien nuevo, **entonces** aparece disponible para reportar sobre él.

### HU-02 · Ver solo personas que existen

**Como** secretaria, **quiero** que el desplegable del formulario muestre únicamente personas
activas, **para** no reportar sobre alguien que ya no está.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-05 |

- **Dado** que abro el formulario, **entonces** la lista corresponde a las personas activas en ese
  momento.

### HU-03 · Identificar a la persona sin depender del nombre

**Como** Responsable de Administración, **quiero** que cada respuesta quede asociada al
identificador de la persona, **para** que el cruce no dependa de cómo se haya escrito el nombre.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | FLUJO paso 1 |

- **Dado** que se envía un formulario, **entonces** se escribe el identificador junto a la respuesta.

> 🔍 **Deuda conocida:** el volcado posterior **sigue cruzando por nombre**, no por ese
> identificador. Mientras eso siga así, esta historia está implementada pero no aprovechada.

### HU-41 · Incorporar un concepto retributivo nuevo

**Como** Responsable de Administración, **quiero** dar de alta un concepto retributivo nuevo sin que
haya que tocar el código, **para** que un cambio en la política de retribución no dependa de una
intervención técnica.

| Estado | Prioridad | Origen |
|---|---|---|
| 🟡 Parcial | 🔸 Importante | problem.md §4.3 |

- **Dado** que añado un concepto al catálogo y se lo asigno a un responsable, **entonces** ese
  responsable puede reportarlo sin ningún cambio en el código.
- 🔴 **Dado** que el concepto nuevo debe llegar al cálculo final, **entonces** debería hacerlo sin
  intervención técnica.

> **Se cumple a medias, y el corte está en un punto concreto:** el catálogo de conceptos y su
> asignación a responsables **son datos**, así que reportar uno nuevo funciona sin tocar nada. Pero
> el recorrido posterior hasta el cálculo no está igual de abierto.
>
> Era un *job* recogido en `problem.md` —*"incorporar un concepto retributivo nuevo sin rehacer el
> proceso"*— que se había quedado sin historia.

### HU-47 · Dar de alta, baja y modificar a una persona desde una pantalla

**Como** Responsable de Administración, **quiero** una pantalla de *Altas/bajas* desde la que dar de
alta, dar de baja y modificar a una persona, y ver todo el maestro respetando sus pestañas, **para**
mantenerlo al día sin tocar las hojas a mano y dejando constancia de cada cambio.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔸 Importante | JS-05 |

- **Dado** un alta, **entonces** me piden empresa, identificador de SAGE, nombre, DNI y fecha de alta, y
  la **cuenta bancaria** puede darse en ese momento o más tarde.
- **Dado** una baja, **entonces** la persona deja de estar activa y **no se borra**.
- **Dado** que veo el maestro, **entonces** veo **todas sus pestañas** tal como están y puedo
  **modificar la empresa o la cuenta** de una persona.
- **Dado** que una persona cambia de empresa, **entonces** se registra como **baja en la empresa de
  origen y alta en la de destino**: su historial queda partido.
- **Dado** cualquier alta, baja o modificación, **entonces** queda registrada con quién, cuándo, qué
  cambió y el valor anterior y el nuevo, **sin la cuenta ni su huella**.
- **Dado** que un cambio afecta a más de un libro, **entonces** no puede quedar a medias sin que se
  avise.
- **Dado** que elijo una empresa o un tipo, **entonces** la lista sale **de un único sitio** (`Config` del
  maestro), la misma para todas las pestañas y para la pantalla, y las pestañas comparten **las mismas
  cabeceras** (RF-100, RF-101).

> **Con este modelo, un mismo DNI puede figurar dos veces** (una fila de baja y otra de alta). La
> concordancia de [HU-46](#hu-46--comprobar-que-cada-persona-sigue-en-concordancia-entre-sage-y-el-maestro-de-personas)
> solo debe dar por incidencia **dos filas activas** con el mismo DNI **en la misma empresa**.
>
> **Matiz del 19 nov 2026:** una persona **puede estar de alta a la vez en dos empresas** (sobre todo en Staff; la pestaña
> real ya lo señala con «De alta en N empresas a la vez»). Eso **no es un error por sí solo**: son dos filas, cada una con su
> `id_trabajador` (`EMPRESA_IdSage`), y el DNI las une. Qué se avisa y qué se da por incidencia en cada tipo de pestaña
> **está sin decidir** (ver `proximos_pasos.md`, «Pendientes del 19 nov 2026»).
>
> **Lista de empresas (19 nov 2026):** cerrada en 11 y puesta en `Config` del maestro; las tres pestañas ya la leen (RF-100).

---

# É2 · Captura

### HU-04 · Reportar a todo mi equipo de una vez

**Como** responsable de complemento, **quiero** introducir de una sola vez los importes de todas mis
personas, **para** no tener que enviar un formulario por cada una.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-01 · FLUJO vía 1 |

- **Dado** que entro con mi email, **entonces** veo la lista completa de mis personas y un campo por
  cada una.
- **Dado** que envío, **entonces** todos los importes quedan registrados en una sola remesa
  identificada.

### HU-05 · Reportar solo lo que me corresponde

**Como** responsable de complemento, **quiero** que solo se me ofrezcan los conceptos que gestiono,
**para** no reportar por error algo que no es mío.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-01 |

- **Dado** que tengo dos conceptos asignados, **entonces** solo puedo elegir entre esos dos.
- **Dado** que no tengo ninguno asignado, **entonces** el sistema me lo dice en lugar de dejarme
  entrar y fallar después.

### HU-06 · Tener constancia de lo que envié

**Como** responsable de complemento, **quiero** recibir confirmación de lo enviado, **para** poder
desentenderme sabiendo que ha quedado registrado.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-01 |

- **Dado** que completo un envío, **entonces** recibo un correo con el identificador de la remesa y
  el resumen de lo enviado.

### HU-07 · Corregir sin borrar lo anterior

**Como** responsable de complemento, **quiero** rectificar un envío anterior sin que desaparezca el
registro de lo que envié antes, **para** corregir el dato sin borrar la historia.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-02 |

- **Dado** que corrijo una remesa, **entonces** la corrección queda enlazada a la original y ambas
  se conservan.
- **Dado** que la corrección es total, **entonces** sustituye a la anterior por completo; si es
  parcial, solo a los importes que indico.

### HU-08 · Consultar lo que ya envié

**Como** responsable de complemento, **quiero** consultar mis envíos por periodo, **para**
comprobar qué reporté sin tener que preguntar.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔸 Importante | JS-01 · JS-04 |

- **Dado** que elijo un mes y año, **entonces** veo mis remesas de ese periodo con su detalle.

### HU-09 · Reportar mis horas extras

**Como** secretaria, **quiero** reportar las horas extras del mes, **para** que se me paguen.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | FLUJO vía 2 |

- **Dado** que envío el formulario indicando el mes, **entonces** queda registrado con mi
  identificador y la marca temporal.

### HU-10 · Reportar la actividad del profesorado que gestiono

**Como** secretaria, **quiero** reportar la actividad de los profesores que gestiono **sabiendo que
otra secretaria puede reportar otra parte del mismo profesor**, **para** que no se pise nuestro
trabajo.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | FLUJO vía 3 |

- **Dado** que dos secretarias reportan campos distintos del mismo profesor y mes, **entonces**
  ambos conjuntos de datos sobreviven.
- **Dado** que dos reportan **el mismo campo**, **entonces** vale el último con dato y queda
  registrado que hubo más de un reporte.

### HU-11 · Incorporar los datos de nómina

**Como** gestor de nóminas, **quiero** incorporar los datos exportados del sistema de nóminas,
**para** que el cálculo pueda partir de ellos.

| Estado | Prioridad | Origen |
|---|---|---|
| 🟡 Parcial | 🔺 Imprescindible | FLUJO vía 4 |

- **Dado** que incorporo los datos, **entonces** quedan disponibles para el cálculo.
- 🔴 **Dado** que los incorporo, **entonces** queda registrado qué periodo, cuántas personas y
  cuándo.
- 🔴 **Dado** que ya se habían incorporado datos de ese periodo, **entonces** se me advierte antes de
  reemplazarlos.

> 🟥 **Hoy es un copiar y pegar que no deja constancia** de qué se incorporó ni cuándo. La historia
> se cumple en el resultado pero no en la trazabilidad. Ver [HU-19](#hu-19--mover-los-datos-al-cálculo-dejando-constancia).

### HU-12 · Aportar datos propios al cálculo

**Como** gerente, **quiero** incorporar datos que solo yo tengo, **para** que se tengan en cuenta en
el importe final.

| Estado | Prioridad | Origen |
|---|---|---|
| 🟡 Parcial | 🔸 Importante | FLUJO vía 5 |

- **Dado** que aporto un dato, **entonces** se refleja en el cálculo del mes.

> 🔍 **Es la única vía de captura de la que no se sabe qué contiene.** No pasa por ninguna
> validación, no queda registrada y no se conoce ni qué datos son ni sobre qué personas. Antes de
> escribir criterios de aceptación de verdad hay que responder a la
> [zona oscura de FLUJO §4](../docs_work/flujo_doc/FLUJO.md).

### HU-13 · Declarar que este mes no tengo nada

**Como** secretaria, **quiero** poder indicar que este mes **no tengo nada que reportar**, **para**
que conste que no se me ha olvidado.

| Estado | Prioridad | Origen |
|---|---|---|
| ⚪ En decisión | 🔸 Importante | JS-03 · FLUJO paso 2.1 |

- **Dado** que no tengo actividad que reportar, **cuando** lo declaro, **entonces** cuento como
  "ha respondido" a efectos de seguimiento.
- **Dado** que no he enviado nada **ni** he declarado nada, **entonces** aparezco como pendiente.

> **Es la historia que decide si el seguimiento es posible.** Hoy *no haber enviado* y *no tener
> nada que reportar* son indistinguibles, y sin resolver eso no se puede medir la cobertura de
> secretarias ni profesores. El coste es real —pedir una acción a quien no tiene nada que decir— y
> **la decisión es de negocio, no técnica**.

### HU-36 · Entrar a lo mío desde un único sitio

**Como** responsable de complemento, **quiero** un único punto de entrada desde el que elegir qué
quiero hacer, **para** no tener que guardar varios enlaces ni recordar cuál es cuál.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔹 Deseable | FLUJO vía 1 |

- **Dado** que entro por el acceso corporativo, **entonces** puedo elegir entre reportar y consultar.
- **Dado** que uso un enlace directo antiguo, **entonces** sigue funcionando.

### HU-37 · Enterarme de que ha llegado un reporte

**Como** Responsable de Administración, **quiero** recibir aviso cada vez que una fuente envía sus
datos, **para** ir sabiendo lo que va llegando sin tener que mirar.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔸 Importante | JS-03 |

- **Dado** que se registra una remesa, **entonces** recibo un aviso con quién la ha enviado, de qué
  concepto y cuántos registros trae.
- **Dado** que la remesa contenía valores rechazados, **entonces** el aviso lo indica.

> **Es el precedente de [HU-28](#hu-28--ver-quién-ha-reportado-y-quién-no)**: hoy el aviso llega,
> pero **de uno en uno y sin acumularse**. Dice lo que ha llegado, nunca lo que falta — que es
> justamente la diferencia entre un aviso y un seguimiento.

### HU-38 · Que un valor mal escrito no se pierda en silencio

**Como** Responsable de Administración, **quiero** que un importe que no se puede interpretar quede
registrado como incidencia en lugar de descartarse, **para** poder reclamarlo en vez de descubrir el
hueco al cuadrar.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-01 |

- **Dado** que un valor enviado no es numérico, **entonces** queda registrado como error con la
  persona, el concepto y el valor que se intentó guardar.
- **Dado** que el resto de la remesa es correcta, **entonces** se guarda igualmente: un valor malo no
  tumba el envío entero.

---

# É3 · Consolidación

### HU-14 · Volcar las horas extras de las secretarias

**Como** Responsable de Administración, **quiero** volcar **las horas extras que han reportado las
secretarias** en el mes que elija, revisando antes qué se va a escribir, **para** no escribir a
ciegas.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | FLUJO paso 3.1 |

- **Dado** que elijo mes y año, **entonces** veo cuántas filas coinciden y cuáles no, con el motivo,
  **sin que se haya escrito nada todavía**.
- **Dado** que cancelo, **entonces** no se modifica nada.

### HU-15 · Volcar la actividad del profesorado, acumulando por campo

**Como** Responsable de Administración, **quiero** volcar **la actividad del profesorado** del mes
acumulando campo a campo, **para** no perder lo que reportó una secretaria al llegar el reporte de
otra sobre el mismo profesor.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | FLUJO paso 3.1 |

- **Dado** que un profesor tiene varios reportes en el mes, **entonces** se conserva el dato de cada
  campo aunque venga de reportes distintos.

### HU-16 · Calcular el salario base

**Como** Responsable de Administración, **quiero** calcular el salario base de toda la plantilla,
**para** que los volcados posteriores partan de un valor actualizado.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | FLUJO §6 |

- **Dado** que ejecuto el cálculo, **entonces** se escribe el resultado para todas las filas con
  datos.

> 🔍 **Con una duda abierta encima:** [DUDA-0002](../docs_work/dudas/0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md)
> — el signo con que llegan los conceptos que entran en la fórmula.

### HU-17 · Volcar los datos de nómina

**Como** Responsable de Administración, **quiero** llevar los datos de nómina a las hojas de
vinculación, **para** que estén junto a la actividad de cada persona.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | FLUJO §6 |

- **Dado** que ejecuto el volcado, **entonces** solo se escriben las celdas que realmente cambian.

### HU-18 · Que me avisen si el destino no está limpio

**Como** Responsable de Administración, **quiero** que el sistema compruebe que el destino está
vacío antes de escribir, **para** no mezclar dos meses sin darme cuenta.

| Estado | Prioridad | Origen |
|---|---|---|
| 🟡 Parcial | 🔺 Imprescindible | FLUJO paso 3.1 |

- **Dado** que el destino ya tiene datos, **entonces** se me advierte **antes** de escribir, y se me
  dice cuántas celdas están ocupadas.
- **Dado** que la comprobación no se ha podido hacer, **entonces** el informe lo indica en lugar de
  dar por bueno que está limpio.
- 🔴 **Dado** que el destino no está limpio, **entonces** debería poder **impedir** la escritura, no
  solo avisar.
- 🔴 **Dado** que ejecuto **cualquiera** de los volcados, **entonces** la comprobación debería
  hacerse siempre.

> **Qué falta exactamente, comprobado en el código:**
>
> | | Comprueba el destino |
> |---|---|
> | Volcado de horas extras | Sí — cuenta las celdas ocupadas y avisa |
> | Volcado de actividad | Sí — igual |
> | **Export Neto y Export Bruto** | **No.** Sobrescriben sin mirar |
>
> Y donde existe, **avisa pero no impide**: el aviso aparece en el informe previo y la exportación
> sigue estando disponible. Depende de que quien lo lee se detenga. Para un proceso que mueve
> nóminas, la diferencia entre *avisar* y *bloquear* no es un matiz.

### HU-19 · Mover los datos al cálculo dejando constancia

**Como** Responsable de Administración, **quiero** llevar los datos consolidados al archivo de
cálculo con una acción que yo lanzo y que deje constancia, **para** que ese paso deje de ser un
copiar y pegar invisible.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | FLUJO §1 · [DUDA-0003](../docs_work/dudas/0003-momentos-de-copia-y-pega-del-proceso.md) |

- **Dado** que lanzo la acción, **entonces** veo qué se va a mover **antes** de que se escriba nada.
- **Dado** que confirmo, **entonces** se escribe y queda registrado qué se movió, cuándo y quién lo
  lanzó.
- **Dado** que **no** confirmo, **entonces** no se modifica nada y no queda rastro de ejecución.
- **Dado** que el movimiento ya se hizo este mes, **entonces** se me avisa antes de repetirlo.

> **La acción la lanza ella, no el sistema.** No es un matiz de implementación: es la condición para
> que automatizar este paso no se perciba como perder el control sobre datos sensibles
> ([problem.md §7](problem.md)). El patrón —preparar, mostrar, confirmar, escribir— ya existe en los
> tres volcados.

### HU-20 · Saber qué hizo cada ejecución

**Como** Responsable de Administración, **quiero** que cada ejecución quede registrada con quién,
cuándo y qué cambió, **para** poder reconstruir después lo que pasó.

| Estado | Prioridad | Origen |
|---|---|---|
| 🟡 Parcial | 🔺 Imprescindible | JS-04 |

- **Dado** que ejecuto un volcado o un envío, **entonces** queda una entrada con identificador de
  ejecución, usuario, momento y resultado.
- **Dado** que falla, **entonces** el error queda registrado con su causa y una posible solución.
- 🔴 **Dado** que se ejecuta **cualquier** proceso del sistema —incluidos los que se disparan solos—,
  **entonces** debería quedar rastro consultable.

> **Hay procesos que no dejan ninguno.** Los dos scripts que sincronizan los desplegables de los
> formularios con el personal activo se ejecutan **por trigger, sin que nadie los lance**, y solo
> escriben en el registro interno de Apps Script — que se borra solo y no se puede consultar después.
>
> Es el punto ciego más incómodo, porque **son justo los que deciden quién aparece en los
> formularios**: si un día dejan de funcionar o cambian una lista, no hay dónde mirarlo. Y a
> diferencia de los volcados, nadie está delante cuando ocurren.
>
> A esto se suman los **movimientos manuales** de [HU-19](#hu-19--mover-los-datos-al-cálculo-dejando-constancia)
> y [DUDA-0003](../docs_work/dudas/0003-momentos-de-copia-y-pega-del-proceso.md), que tampoco dejan
> constancia. Sumando ambas cosas, la trazabilidad cubre **lo que se lanza a mano desde un menú**, no
> el proceso entero.

### HU-39 · Sacar los datos consolidados del mes

**Como** Responsable de Administración, **quiero** obtener a demanda los datos del mes ya fusionados
por persona y concepto, **para** llevarlos al cálculo sin recomponerlos a mano.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-01 |

- **Dado** que pido la exportación de un periodo, **entonces** obtengo un dato por persona y
  concepto, con las correcciones ya aplicadas.
- **Dado** que hubo correcciones, **entonces** prevalece el valor corregido, no el original.

### HU-40 · Conservar copia de lo que se volcó

**Como** Responsable de Administración, **quiero** que lo volcado quede copiado en un histórico,
**para** poder mirar atrás sin depender de que la hoja de respuestas siga intacta.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔸 Importante | JS-04 |

- **Dado** que se ejecuta un volcado, **entonces** las filas volcadas se copian al histórico.
- **Dado** que la copia falla, **entonces** se me avisa y **el volcado no se deshace**: se informa de
  que los datos sí llegaron a su destino.

> El segundo criterio evita el peor final posible: creer que no se ha volcado nada porque falló la
> copia, y volver a volcarlo.

---

# É4 · Ajuste y cierre

### HU-21 · Ajustar un importe en la revisión

**Como** gerente, **quiero** modificar un importe durante la revisión sin devolver el dato a su
origen, **para** resolverlo en el momento y no retrasar el cierre.

| Estado | Prioridad | Origen |
|---|---|---|
| ✅ Implementada | 🔺 Imprescindible | JS-06 |

- **Dado** que modifico un importe, **entonces** el cálculo lo toma sin más trámite.

> 🟥 **Deliberadamente sin trazabilidad.** Es un [anti-objetivo declarado](problem.md): lo que motiva
> un ajuste nace fuera del sistema. La consecuencia —que el importe final puede no coincidir con lo
> que reportó su fuente— está aceptada y escrita.

### HU-22 · Dar el mes por cerrado

**Como** Responsable de Administración **y** gerente, **queremos** marcar el mes como cerrado,
**para** que conste que lo revisado estaba completo y nadie siga tocándolo.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔸 Importante | JS-07 |

- **Dado** que quedan pasos del cierre sin completar, **entonces** el sistema me lo advierte antes
  de dejarme cerrar.
- **Dado** que cerramos el mes, **entonces** queda registrado quién y cuándo.
- **Dado** que un mes está cerrado, **entonces** se distingue claramente de uno en curso.

---

# É5 · Verificación

Las tres primeras historias de esta épica (HU-23, HU-24, HU-25) dependen de **un documento que emite
un tercero**. Sin él no hay verificación posible: comparar el sistema consigo mismo no verifica nada.
Las tres siguientes (HU-42, HU-43, HU-44) describen **cómo se usan** esas comprobaciones: la pantalla
*Comprobaciones*, el resultado que se copia a un correo y el seguimiento de las diferencias. La última
(HU-46) es la comprobación **previa a todas**: que cada persona siga en concordancia entre SAGE y el
maestro de personas.

### HU-23 · Comprobar el seguro médico

**Como** Responsable de Administración, **quiero** contrastar el importe de seguro médico de cada
persona con la relación real de asegurados, **para** que un error no se propague al salario base.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | FLUJO paso 4.1 |

- **Dado** el documento de la aseguradora, **cuando** ejecuto la comprobación, **entonces** veo un
  informe con tres tipos de diferencia: **importe distinto**, **alta sin cobertura** y **cobertura
  sin alta**.
- **Dado** que hay personas que no casan por identificador, **entonces** aparecen aparte en lugar de
  desaparecer del informe.
- **Dado** que reviso el informe, **entonces** no se ha modificado ningún dato: solo informa.
- **Dado** el documento de la aseguradora, **entonces** puedo contrastarlo, con la misma pauta y por
  separado, contra **tres orígenes**: el **primer export de SAGE** (principio del proceso mensual), la
  **Vinculación de gastos de personal** y el **segundo export de SAGE**.

### HU-24 · Comprobar las ayudas de comida y transporte

**Como** Responsable de Administración, **quiero** contrastar los dos conceptos de ayudas con lo
concedido realmente, **para** detectar diferencias antes del cierre.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | FLUJO paso 4.1 |

- **Dado** el documento del proveedor, **entonces** veo las diferencias por persona y por cada uno
  de los dos conceptos, por separado.
- **Dado** que un concepto no aparece para una persona, **entonces** se distingue de que aparezca
  con importe cero.

### HU-25 · Comprobar que lo pagado es lo calculado

**Como** Responsable de Administración, **quiero** contrastar las transferencias emitidas con los
importes calculados, **para** detectar un pago equivocado antes de que lo detecte la persona
afectada.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | JS-10 · FLUJO paso 6 |

- **Dado** el fichero del banco, **entonces** veo cuatro tipos de descuadre: **pagado de más**,
  **pagado de menos**, **persona pagada sin cálculo** y **persona calculada sin pago**.
- **Dado** que hay diferencias de redondeo, **entonces** se aplica una tolerancia definida y las
  que caen dentro no se reportan como error.
- **Dado** que la identificación del banco no coincide con la del sistema, **entonces** esas líneas
  aparecen como *no existentes* (Parte 2 del informe, HU-49) en lugar de como *correctas*.

> **Es la única comprobación que mira el resultado final.** Cierra el circuito entre lo que el
> sistema calcula y lo que la persona recibe — hoy nadie verifica ese tramo.

### HU-42 · Elegir qué comprobar y subir los dos documentos

**Como** Responsable de Administración, **quiero** elegir una comprobación de una lista y subir los dos
documentos que compara, **para** contrastar un mes sin depender de nadie y sin comparar por error un
documento con otro que no es.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | JS-09 · JS-10 |

- **Dado** que abro *Comprobaciones*, **entonces** veo la lista de comprobaciones disponibles, y cada
  una dice **qué dos documentos** espera.
- **Dado** que subo un documento que no es el que la comprobación espera, **entonces** el sistema me
  lo dice con claridad —por ejemplo, que parece de otro proveedor— y no continúa.
- **Dado** que un documento está incompleto o es de otro periodo que el elegido, **entonces** el
  sistema se niega a comparar y dice **qué comprobación previa falló**.
- **Dado** que necesito una comprobación que no está en la lista, **entonces** no puedo añadirla yo:
  la incorpora el desarrollo, porque exige escribir sus reglas de cruce.
- **Dado** que he corregido el documento de origen, **entonces** puedo **volver a comprobar** y ver el
  resultado actualizado.

> **La lista es cerrada a propósito.** Cada comprobación lleva sus propias reglas —cómo se lee cada
> documento, por qué campo se cruza, qué signo y qué tolerancia—, y eso no se configura desde la
> pantalla: se escribe, se prueba y se registra.

### HU-43 · Llevar el resultado a un correo

**Como** Responsable de Administración, **quiero** copiar el resultado de una comprobación para
pegarlo en un correo, **para** avisar a quien tiene que corregir sin tener que reescribirlo a mano.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔹 Deseable | JS-09 · JS-10 |

- **Dado** un resultado, **cuando** pulso el icono de copiar, **entonces** queda en el portapapeles un
  texto listo para pegar en un correo.
- **Dado** que copio sin más, **entonces** el texto lleva el **resumen** —cifras por tipo de
  diferencia—, y **no** nombres ni DNI.
- **Dado** que quiero incluir la lista de personas, **entonces** lo elijo de forma expresa.

> **Por qué el resumen es lo predeterminado.** Un correo con nombres y DNI sale de la plataforma y
> ya no se controla: es la superficie de compartición de la que habla la
> [segunda regla de CLAUDE.md](../CLAUDE.md).

### HU-44 · Dejar constancia de las diferencias y marcarlas como resueltas

**Como** Responsable de Administración, **quiero** que las diferencias encontradas queden registradas
y poder marcarlas como resueltas, **para** saber qué queda por corregir y no depender de mi memoria ni
de un correo.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔸 Importante | JS-09 · JS-10 |

- **Dado** que se ejecuta una comprobación, **entonces** cada diferencia queda registrada y la puedo
  consultar después desde **otra pantalla**, distinta de la de comprobar.
- **Dado** una diferencia registrada, **entonces** puedo marcarla como **resuelta**, y queda quién la
  marcó y cuándo.
- **Dado** que repito la misma comprobación tras corregir el documento, **entonces** las diferencias
  que ya no aparecen se cierran indicando que **desaparecieron al comprobar de nuevo**, y las que
  siguen **no se duplican**.
- **Dado** que consulto el registro, **entonces** solo veo datos personales si tengo derecho a ello.

> **Esto guarda nombres y DNI de forma duradera**, a diferencia de la pantalla de comprobar, que no
> necesita conservar nada. Antes de construirlo hay que decidir dónde se guarda, quién lo ve y cuánto
> tiempo se conserva ([RNF-18](requisitos_no_funcionales.md)).

### HU-46 · Comprobar que cada persona sigue en concordancia entre SAGE y el maestro de personas

**Como** Responsable de Administración, **quiero** comprobar, al empezar el mes, que el identificador de
cada trabajador (empresa y nº de SAGE) y su DNI siguen en concordancia entre el export de SAGE y el
maestro de personas, **para** corregir antes de seguir cualquier alta, baja o cambio de empresa que no
esté reflejado.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | JS-05 · JS-09 |

- **Dado** el export de SAGE del mes y el maestro de personas con las altas y bajas ya actualizadas,
  **cuando** lanzo la comprobación, **entonces** veo que todo es correcto o la lista de incidencias.
- **Dado** que un **DNI está relacionado con un identificador distinto** en cada origen, **entonces**
  aparece como incidencia con los datos de los dos lados.
- **Dado** que una persona **está en un origen y no en el otro**, **entonces** aparece como incidencia
  y dice de qué lado falta.
- **Dado** que corrijo a mano los datos en la hoja que proceda y repito la comprobación, **entonces**
  el resultado se actualiza, y se repite **hasta que todo sea correcto**.
- **Dado** que una persona cambia de empresa, **entonces** la comprobación lo detecta en lugar de dar
  por buena la relación anterior.
- **Dado** que reviso el resultado, **entonces** no se ha modificado ninguna hoja: solo informa.
- **Dado** el cierre de un mes, **entonces** la comprobación se hace **después** de actualizar el maestro de personas y **después**
  de actualizar el export de SAGE, en ese orden (19 nov 2026). Es **opcional por ahora y será obligatoria** para dar el paso por
  superado.
- **Dado** que una persona está en **dos empresas** (sobre todo en Staff), **entonces** aparece en **dos filas** identificadas
  cada una por su `id_trabajador`, y la comprobación **no las confunde ni las da por duplicado** solo por compartir DNI.
- **Dado** que una empresa se escribe distinto en cada origen (p. ej. MOTOR INTEGRAL, CTM MOTOR o CTM MOTOR INTEGRAL SLU),
  **entonces** la comprobación las reconoce como la **misma empresa** y no inventa una incidencia por el nombre.

> **Hoy el export de SAGE no trae DNI.** Sin él, la primera incidencia (DNI con otro identificador) solo
> se puede **aproximar por el nombre**. Se ha pedido a quien exporta que lo incluya (16 nov 2026). La
> segunda sí se puede comprobar ya.

### HU-48 · Reconocer a la persona en el fichero del banco sin guardar su cuenta

**Como** Responsable de Administración, **quiero** que el sistema reconozca a quién corresponde cada
pago del fichero del banco sin que nadie guarde las cuentas, **para** comprobar lo pagado sin crear una
lista de IBAN.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | JS-10 |

- **Dado** el fichero del banco, **entonces** cada cuenta se reconoce por su **huella** entre las
  personas **activas**, y la que no se reconoce o es ambigua **no se descarta**: aparece en la **Parte 2
  («no existen»)** del informe, con su nombre del banco, sus últimos 4 dígitos, el importe y la entidad.
- **Dado** que una persona cambia de empresa, **entonces** su cuenta se sigue reconociendo.
- **Dado** que alguien cambia de cuenta, **entonces** la antigua deja de valer y la nueva se reconoce.
- **Dado** que arranco el sistema con las personas ya existentes, **entonces** puedo cargar sus cuentas
  **una sola vez** desde el fichero del banco, con una propuesta por empresa y nombre, comprobando el
  importe y con **confirmación mía** antes de guardar.
- **Dado** que se usa el sistema, **entonces** la cuenta no aparece en ningún registro, mensaje ni hoja.
- **Dado** que una cuenta queda registrada, **entonces** `VAP_Personas` lo anota (**`cuenta_en_pagos`** y su
  fecha), sin huella, y `VAP_Pagos` guarda además los **últimos 4 dígitos** para poder comprobarla.

> **La huella vive solo en `VAP_Pagos`**, junto al identificador de la persona, y **no en el maestro**
> con los DNI. Se calcula con una clave secreta guardada en el **proyecto propio de `VAP_Pagos`**, y **no
> incluye el identificador**, así que un cambio de empresa no la altera.

### HU-49 · Cruzar los pagos del banco y subsanar el informe

**Como** Responsable de Administración, **quiero** subir el fichero del banco de cada empresa y obtener un
informe de qué se ha pagado a cada persona, con lo incorrecto a la vista y la posibilidad de subsanarlo,
**para** detectar un pago equivocado antes de que lo detecte la persona afectada.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | JS-10 |

- **Dado** una empresa, **entonces** puedo cargar **uno o varios** ficheros del banco en **XML, CSV o Excel**
  y pulsar *Cruce*; el informe de esa empresa aparece debajo y se puede **plegar a una línea**.
- **Dado** que he cruzado todas las empresas, **entonces** debo **fusionar los informes en uno** antes de dar
  el paso por hecho.
- **Dado** el informe, **entonces** veo en la **Parte 1** los pagos que coinciden con `VAP_Pagos`
  (*Coincidente* o *Incorrecto*, con Observaciones solo en los incorrectos) y en la **Parte 2** los que no
  existen en `VAP_Pagos`. **Ningún pago se queda sin fila.**
- **Dado** que el importe del banco no coincide con el de la Vinculación, **entonces** es *Incorrecto* y sus
  Observaciones dicen importes, referencias y fuente.
- **Dado** un pago *Incorrecto*, **entonces** puedo **volver a él y subsanarlo** sin perder el resultado
  original: la resolución queda con quién, cuándo y el motivo.
- **Dado** un volumen grande de ficheros, **entonces** el cruce se hace **por empresa**, sin acercarse al
  límite de 6 minutos de la plataforma.

> **El fichero del banco contiene cuentas y nombres en claro.** El sistema no lo guarda; quien lo sube lo
> elimina cuando proceda (RNF-23).

### HU-50 · Consultar el histórico y el maestro de pagos

**Como** Responsable de Administración, **quiero** consultar qué se pagó a una persona en un mes y ver el
maestro de cuentas registradas **desde la webapp, en una sola pantalla**, **para** responder a una duda sin
abrir el libro ni mirar tres tablas.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔸 Importante | JS-10 |

- **Dado** el histórico, **entonces** elijo **año y mes**, pulso *Cargar* y veo el informe de ese mes; después
  puedo **buscar por DNI o nombre**.
- **Dado** el Maestro de Pagos, **entonces** veo nombre, DNI, últimos 4 dígitos y fecha de última
  actualización, y un buscador que **ofrece candidatos mientras escribo**.
- **Dado** que veo un nombre o un DNI, **entonces** se han leído de `VAP_Personas` en ese momento: **no se
  guardan en `VAP_Pagos`**. **La huella no se muestra.**

---

# É6 · Coordinación del cierre

### HU-26 · Lanzar el cierre del mes

**Como** Responsable de Administración, **quiero** lanzar el cierre indicando hasta cuándo se puede
reportar y para cuándo tiene que estar el documento final, **para** que el proceso deje de depender
de un acuerdo verbal.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | JS-08 · FLUJO paso 2 |

- **Dado** que lanzo el mes, **entonces** indico la **fecha tope de reporte** y la de **entrega del
  documento final**, y el sistema registra por su cuenta la **fecha de lanzamiento**.
- **Dado** que el mes ya está lanzado, **entonces** no se puede lanzar dos veces.
- **Dado** que consulto después, **entonces** las tres fechas siguen constando.

### HU-27 · Enterarme de que tengo que reportar

**Como** responsable de complemento o secretaria, **quiero** recibir aviso de que el cierre ha
empezado y hasta cuándo tengo, **para** no depender de que alguien me lo diga en persona.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | JS-08 · FLUJO paso 2 |

- **Dado** que se lanza el mes, **entonces** recibo un aviso con **qué se espera de mí** y **la
  fecha tope**.
- **Dado** que el aviso incluye un acceso directo, **entonces** puedo reportar sin buscar el enlace.

### HU-28 · Ver quién ha reportado y quién no

**Como** Responsable de Administración, **quiero** ver en cualquier momento quién ha reportado y
quién falta, **para** perseguir solo lo que falta en lugar de revisarlo todo.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | JS-03 · FLUJO paso 2.1 |

- **Dado** que consulto durante el mes, **entonces** veo por cada responsable de complemento si ha
  enviado, cuándo y cuántos registros.
- **Dado** que una cuenta es de pruebas, **entonces** no cuenta en el total de esperados.
- **Dado** que el colectivo no permite conocer el denominador, **entonces** el panel **lo dice
  explícitamente** en lugar de mostrar una cobertura engañosa.

> El último criterio es el importante: **es preferible declarar que no se puede medir a mostrar un
> número que parece medido**.

### HU-29 · Ver por dónde va el cierre

**Como** Responsable de Administración, **quiero** ver el estado de cada paso del cierre, **para**
saber qué está hecho, qué se está ejecutando y qué falta.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔺 Imprescindible | FLUJO §3 |

- **Dado** que abro el panel, **entonces** veo los pasos del cierre con su estado: pendiente,
  lanzado, completado o con incidencias.
- **Dado** que un paso deja rastro en el sistema, **entonces** su estado se deduce solo, sin que
  nadie tenga que marcarlo.
- **Dado** que un paso **no** deja rastro, **entonces** puedo marcarlo a mano y se distingue de los
  deducidos.
- **Dado** que un paso se ha ejecutado fuera de orden, **entonces** se señala.

### HU-30 · Dejar constancia de lo que no funcionó

**Como** Responsable de Administración, **quiero** dejar comentarios por paso y por mes, **para**
recoger lo que falló y mejorarlo al mes siguiente.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔹 Deseable | FLUJO §3 |

- **Dado** que escribo un comentario, **entonces** queda asociado a ese paso y a ese mes.
- **Dado** que abro un mes anterior, **entonces** veo los comentarios que se dejaron.

### HU-45 · Seguir el proceso mensual paso a paso desde una pantalla

**Como** Responsable de Administración, **quiero** una pantalla de *Proceso mensual* con los pasos del
mes, unos manuales y otros que se lanzan desde la propia pantalla, **para** saber en qué paso estoy y
ejecutar los que se pueden sin salir de ella.

| Estado | Prioridad | Origen |
|---|---|---|
| 🟡 Parcial | 🔸 Importante | JS-03 · JS-08 |

- **Dado** que abro *Proceso mensual*, **entonces** veo los pasos del mes en orden y, de cada uno, si es
  **manual** o **ejecutable desde la pantalla**.
- **Dado** un paso manual, **entonces** lo marco como hecho y queda quién y cuándo.
- **Dado** un paso ejecutable, **entonces** lo lanzo desde la pantalla, veo su resultado y sus
  incidencias, y puedo repetirlo.
- **Dado** que un paso tiene incidencias sin resolver, **entonces** no figura como superado.
- **Dado** que los pasos se irán incorporando de uno en uno, **entonces** añadir un paso no obliga a
  rehacer los anteriores.

> **Es la primera pantalla de la webapp, y es la misma que el *tablero de los nueve pasos*** de
> [OB-22](../docs_work/proximos_pasos.md) y de [HU-29](#hu-29--ver-por-dónde-va-el-cierre):
> *Proceso mensual* es el nombre con el que la llama quien la usa. **Decidido el 16 nov 2026.** Lo que
> añade esta historia a HU-29 es que **algunos pasos se ejecutan desde la propia pantalla**.

---

# É7 · Trazabilidad y consulta

### HU-31 · Reconstruir de dónde salió un importe

**Como** Responsable de Administración, **quiero** reconstruir de dónde salió el importe que cobró
una persona en un mes pasado, **para** resolver una reclamación con hechos y no con memoria.

| Estado | Prioridad | Origen |
|---|---|---|
| 🟡 Parcial | 🔺 Imprescindible | JS-04 |

- **Dado** un mes y una persona, **entonces** puedo ver **qué reportó cada fuente** sobre ella y
  cuándo, **sin tener que abrir varios archivos**.
- **Dado** que un dato se corrigió, **entonces** veo el valor original, el corregido y cuál de los
  dos se usó.
- **Dado** que una fuente no reportó nada sobre esa persona, **entonces** se distingue de que
  reportara cero.
- **Dado** que consulto un periodo del que ya no hay detalle, **entonces** el sistema lo dice, en
  lugar de devolver un resultado vacío que parece un "no había nada".

> **El límite está declarado y conviene no olvidarlo:** la reconstrucción llega **hasta lo que se
> reportó**, no hasta el importe final. Si hubo ajuste en la revisión, esa diferencia **no es
> reconstruible** — y es una decisión deliberada, no un fallo ([problem.md §8](problem.md)).
>
> Lo que sí falta hoy es que esa consulta sea **cómoda**: la información existe, pero repartida en
> varios sitios.

### HU-32 · Consultar un periodo cerrado sin tocarlo

**Como** Responsable de Administración, **quiero** consultar los datos de un mes ya cerrado sin
riesgo de modificarlo, **para** poder mirar atrás con tranquilidad.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔹 Deseable | JS-04 · JS-07 |

- **Dado** que abro un mes cerrado, **entonces** la consulta es de solo lectura y se indica
  visiblemente que lo es.
- **Dado** que intento modificar algo de un mes cerrado, **entonces** el sistema lo impide y explica
  por qué.
- **Dado** que hay que corregir algo de un mes cerrado, **entonces** existe una forma explícita de
  reabrirlo que **deja constancia** de quién lo reabrió y cuándo.

---

# É8 · Medición e informes

### HU-33 · El informe del mes, para actuar

**Como** Responsable de Administración, **quiero** un resumen del cierre del mes, **para** ver de un
vistazo qué faltó, qué falló y cuánto se ha movido.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔸 Importante | JS-11 |

- **Dado** que cierro el mes, **entonces** dispongo de un resumen con **volumen, ejecución,
  cobertura y puntualidad**.
- **Dado** que un indicador mide el mecanismo y no la corrección de los importes, **entonces** el
  informe **lo advierte junto al dato**.

> El segundo criterio no es cosmético: sin él, un informe con todo en verde puede convivir
> perfectamente con una nómina mal calculada ([problem.md §6.1](problem.md)).

### HU-34 · El dato en bruto, para analizar

**Como** Departamento de Data, **quiero** los datos de actividad en bruto y comparables entre
periodos, **para** analizarlos por mi cuenta sin depender de un informe cerrado.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔸 Importante | JS-11 |

- **Dado** que consulto varios periodos, **entonces** las cifras son comparables entre sí porque se
  han calculado igual.
- **Dado** que un periodo ya pasó, **entonces** sus datos **no cambian** aunque se reprocese el mes.

> El segundo criterio es el que hace posible comparar: si el histórico se recalcula, las tendencias
> dejan de significar nada.

### HU-35 · El resumen y la tendencia, para decidir

**Como** dirección, **quiero** ver qué mueve el sistema y qué ahorra, **para** valorar qué aporta y
decidir dónde invertir.

| Estado | Prioridad | Origen |
|---|---|---|
| 🔴 Pendiente | 🔹 Deseable | JS-11 |

- **Dado** que consulto el trimestre o el año, **entonces** veo la evolución del volumen tratado, de
  la cobertura y de los descuadres detectados.
- **Dado** que hay una variación fuera de lo corriente, **entonces** se señala en lugar de quedar
  diluida en el total.

---

## Matriz de trazabilidad

De cada *job story* de [`problem.md`](problem.md) a las historias que la cubren:

| Job story | Qué pedía | Historias |
|---|---|---|
| **JS-01** | Reportar la actividad del equipo | HU-04, HU-05, HU-06, HU-08 |
| **JS-02** | Corregir un error propio | HU-07 |
| **JS-03** | Saber qué falta | HU-13, HU-28, HU-45 |
| **JS-04** | Responder a una reclamación | HU-08, HU-20, HU-31, HU-32 |
| **JS-05** | Dar de alta a alguien nuevo | HU-01, HU-02, HU-46, HU-47 |
| **JS-06** | Ajustar un importe en la revisión | HU-21 |
| **JS-07** | Dar el mes por cerrado | HU-22, HU-32 |
| **JS-08** | Dar la salida del mes | HU-26, HU-27, HU-45 |
| **JS-09** | Confiar en lo que se descuenta | HU-23, HU-24, HU-42, HU-43, HU-44, HU-46 |
| **JS-10** | Confirmar que lo pagado es lo calculado | HU-25, HU-42, HU-43, HU-44, HU-48, HU-49, HU-50 |
| **JS-11** | Saber si este mes ha sido normal | HU-33, HU-34, HU-35 |

**Las once *job stories* están cubiertas.** Y en sentido contrario, las historias que **no** salen
de ninguna *job story* sino del proceso real: HU-03, HU-09 … HU-12, HU-14 … HU-20, HU-29, HU-30.

> Eso no es un defecto: `problem.md` describe el problema desde quien lo sufre, y hay trabajo —los
> volcados, el maestro de personal— que nadie pide como *job* pero sin el cual nada funciona.

**Y un *job* relacionado que sí estaba escrito y se había quedado sin historia:** *incorporar un
concepto retributivo nuevo sin rehacer el proceso* (`problem.md` §4.3) → ahora **HU-41**.

## Resumen por estado

| Estado | Historias | |
|---|---|---|
| ✅ **Implementadas** | HU-01 … HU-10, HU-14 … HU-17, HU-21, HU-36 … HU-40 | **20** |
| 🟡 **Parciales** | HU-11, HU-12, HU-18, HU-20, HU-31, HU-41, HU-45 | **7** |
| 🔴 **Pendientes** | HU-19, HU-22 … HU-30, HU-32 … HU-35, HU-42 … HU-44, HU-46 … HU-50 | **22** |
| ⚪ **En decisión** | HU-13 | **1** |

**Lo que enseña este reparto:** lo implementado está en **maestro de personal, captura y
consolidación** — mover datos. Lo pendiente está en **verificar, coordinar y medir** — controlar el
proceso. Es la misma frontera que señalaba el mapa del flujo, ahora en forma de lista de trabajo.

**Y las cinco parciales dicen dónde está la fragilidad**, porque ninguna lo es por falta de tiempo:

| Historia | Qué le falta |
|---|---|
| HU-11 · Incorporar los datos de nómina | Funciona, pero **sin dejar constancia** de qué se incorporó |
| HU-12 · Datos propios del Gerente | Funciona, pero **no se sabe qué contiene** |
| HU-18 · Destino limpio | Avisa, pero **no impide**, y no en todos los volcados |
| HU-20 · Rastro de cada ejecución | Cubre lo que se lanza a mano, **no lo automático** |
| HU-31 · Reconstruir un importe | La información existe, pero **repartida** |

> Las cinco fallan por lo mismo: **el resultado es correcto, pero no queda constancia de cómo se
> llegó a él**. No son funcionalidades a medias, son **agujeros de trazabilidad** — y por eso no se
> notan hasta el día que hay que explicar algo.

## Orden de construcción y dependencias

**Sobre la prioridad y sobre qué universo se mide.** Contando todas las historias, el 68 % son
imprescindibles — lo que parecería indicar que la priorización no prioriza. Pero **es la medida
equivocada**: las ya construidas son casi todas imprescindibles por definición, porque se
construyeron primero justamente por eso. Medido sobre **lo pendiente**, que es lo único priorizable,
el reparto queda dentro de la regla de [CLAUDE.md](../CLAUDE.md).

Dicho eso, la prioridad indica **cuánto duele que falte**; **cuándo se hace** lo decide esta tabla: **en qué sprint entra cada historia pendiente**, según
[`proximos_pasos.md`](../docs_work/proximos_pasos.md).

| Sprint | Historias | Objetivos |
|--------|-----------|-----------|
| **1** · La webapp de coordinación | HU-26 … HU-30, HU-33 … HU-35, HU-45, HU-47 | OB-07, OB-08, OB-20 … OB-22, OB-09, OB-10, OB-13, OB-14, OB-43, OB-46 |
| **2** · Saldar la deuda | HU-18, HU-19, HU-20 | OB-17 … OB-19, OB-23 … OB-27 |
| **3** · Verificación de datos | HU-23, HU-24, HU-25, HU-42, HU-43, HU-44, HU-46, HU-48, HU-49, HU-50 | OB-01 … OB-06, OB-11, OB-12, OB-40 … OB-42, OB-44, OB-45, OB-47 |
| **Sin sprint asignado** | HU-11, HU-12, HU-13, HU-22, HU-31, HU-32, HU-41 | — |

**El Sprint 3 existe por estas tres historias.** HU-18, HU-19 y HU-20 no construyen nada nuevo:
arreglan que el sistema no deje rastro de lo que hace y que pueda escribir encima de datos buenos.
Van **antes** de dar por terminada la webapp, porque el panel y los informes del Sprint 2 deducen su
información de ese rastro: hacerlos sobre un registro con agujeros sería construir sobre arena.

> ⚠️ **Siete historias pendientes siguen sin sprint**, y no es lo mismo unas que otras:
>
> - **HU-11, HU-12, HU-13** dependen de **decisiones que no son técnicas**: qué aporta el Gerente y
>   si se pide declarar *no tengo nada*.
> - **HU-22, HU-31, HU-32 y HU-41** no dependen de nada y simplemente **no se han programado**. Son
>   las que hay que colocar conscientemente en un sprint o mover al backlog — dejarlas en tierra de
>   nadie es como se pierden.

**Dependencias que condicionan el orden:**

| Historia | No se puede construir sin |
|----------|---------------------------|
| HU-27 · Avisos | HU-26 — hay que tener fechas de las que avisar |
| HU-28 · Quién ha reportado | HU-26 — y **HU-13** si se quiere medir a secretarias y profesorado |
| HU-29 · Estado del cierre | HU-20 — el estado se deduce del rastro; sin rastro hay que marcarlo todo a mano |
| HU-23, HU-24, HU-25 · Verificaciones | Los documentos de las entidades. No dependen del sistema |
| HU-23 · contra los dos exports de SAGE | Una **muestra de cada export** de SAGE: aún no se han visto |
| HU-44 · Registro de diferencias | Decidir dónde se guardan, quién los ve y cuánto se conservan (RNF-18) |
| HU-33, HU-34, HU-35 · Informes | HU-20 y la decisión de dónde se guarda el histórico |
| HU-19 · Traslado con constancia | Saber cuáles son los archivos de destino (DUDA-0001) |

> **HU-20 aparece dos veces como bloqueante**, y es el de los procesos que hoy no dejan rastro: es la
> historia con más cosas colgando de ella. Por eso encabeza el **Sprint 3**.

## Historias que no se van a escribir

Por decisión, no por olvido:

| No se hará | Por qué |
|---|---|
| Registrar quién ajustó un importe y por qué | [Anti-objetivo declarado](problem.md): lo que motiva el ajuste nace fuera del sistema |
| Que el profesorado reporte su propia actividad | No está en el alcance: la reportan las secretarias |
| Sustituir el sistema de nóminas | El Sistema VAP alimenta el cálculo, no lo reemplaza |
| Gestionar permisos con roles nativos de Google | Fuera de alcance por ahora |

## Qué falta por definir

1. **HU-12** — no se puede escribir bien hasta saber qué datos aporta el Gerente.
2. **HU-13** — decisión de negocio pendiente: ¿se pide declarar "no tengo nada"?
3. **HU-23, HU-24, HU-25** — los criterios están escritos sobre cómo *deberían* venir los
   documentos. Al recibirlos habrá que revisarlos.
4. **Estimación y orden dentro de cada épica** — este documento prioriza, pero no estima.
5. 🔍 **Validar las prioridades con negocio.** Las de aquí son propuesta: quien decide qué es
   imprescindible no es quien lo construye.
