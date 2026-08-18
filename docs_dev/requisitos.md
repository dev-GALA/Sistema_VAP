# Requisitos — Sistema VAP

| | |
|---|---|
| **Versión** | 0.4 — BORRADOR · confrontado con SSD y ADR |
| **Fecha** | 18 agosto 2026 |
| **Se deriva de** | [historias_usuarios.md](historias_usuarios.md) |
| **Responde a** | [Sprint 1 · OB-16](../docs/retomar_trabajos.md) |

---

## Cómo usar este documento

Este documento responde a **qué debe hacer el sistema**, en enunciados atómicos y comprobables uno a
uno. Es el último eslabón de la cadena documental:

| | Responde a |
|---|---|
| [`problem.md`](problem.md) | ¿Qué problema hay y para quién? |
| [`../docs/FLUJO.md`](../docs/FLUJO.md) | ¿Cómo funciona hoy el proceso? |
| [`historias_usuarios.md`](historias_usuarios.md) | ¿Qué necesita cada rol, y cómo se comprueba? |
| **`requisitos.md`** *(este)* | **¿Qué debe hacer el sistema?** |
| [`SSD.md`](SSD.md) | ¿Cómo está construido? |

### Historia de usuario ≠ requisito

Una **historia** describe una necesidad desde el punto de vista de alguien, y se negocia. Un
**requisito** es una afirmación sobre el sistema, y se cumple o no se cumple. Una historia suele dar
lugar a **varios** requisitos; un requisito puede servir a varias historias.

> **Este documento es la referencia canónica de requisitos.** El [SSD §3](SSD.md) contiene una lista
> anterior, escrita **desde el código hacia arriba** —describía lo ya construido—. La correspondencia
> entre ambas está en [§4](#4-correspondencia-con-los-requisitos-del-ssd).

### Convenciones

| Campo | Valores |
|-------|---------|
| **Estado** | ✅ Cumplido · 🟡 Parcial · 🔴 No cumplido · ⚪ En decisión |
| **Prioridad** | 🔺 Imprescindible · 🔸 Importante · 🔹 Deseable *(MoSCoW)* |
| **Origen** | La historia o historias de las que sale |

> **Cómo leer la prioridad, y sobre qué universo.** Contando todos los requisitos, el 64 % son
> imprescindibles, lo que parece indicar que la priorización no prioriza. **Pero es la medida
> equivocada:** los ya construidos son casi todos imprescindibles por definición — se construyeron
> primero justamente por eso.
>
> Medido sobre **lo que queda por hacer**, que es lo único que se puede priorizar, el reparto es
> **50 % Must, 39 % Should, 11 % Could**: dentro de la regla que fija
> [CLAUDE.md](../CLAUDE.md) —*si más de la mitad de lo pendiente es Must, hay que revisarla*—.
>
> Aun así, la prioridad dice **cuánto duele que falte**, no **cuándo se hace**. Lo segundo lo decide
> el orden de construcción de [`historias_usuarios.md`](historias_usuarios.md).

> **Las cifras de este documento no se citan en otros.** Al revisar apareció que cuatro documentos
> repetían el número de historias o de requisitos, y **todos se habían quedado obsoletos** en cuanto
> se añadió algo. La regla que evita que vuelva a pasar: los demás documentos **enlazan aquí**, no
> copian el recuento.

Los requisitos se enuncian en **futuro imperativo** —*"el sistema registrará…"*—, que es la forma
convencional y la que obliga a comprometerse: un requisito escrito como *"sería conveniente que…"* no
se puede dar por incumplido.

---

## 1. Requisitos funcionales

### A · Maestro de personal

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RF-01** | El sistema mantendrá un registro único de personas por colectivo, con un estado que determine si están activas | ✅ | 🔺 | HU-01 |
| **RF-02** | El sistema sincronizará las listas de los formularios con las personas activas, sin intervención manual | ✅ | 🔺 | HU-01, HU-02 |
| **RF-03** | El sistema asociará cada respuesta recibida al identificador de la persona | ✅ | 🔺 | HU-03 |
| **RF-04** | El sistema identificará a cada persona **por su identificador** en todos los cruces entre origen y destino | 🔴 | 🔸 | HU-03 |

| **RF-57** | El sistema permitirá dar de alta un concepto retributivo nuevo y asignarlo a un responsable **como configuración, sin cambios en el código** | 🟡 | 🔸 | HU-41 |

> **RF-04 está sin cumplir y es deuda conocida.** El identificador se escribe (RF-03) pero los
> volcados **siguen cruzando por nombre**. Mientras siga así, un cambio de grafía en un nombre puede
> hacer que una persona deje de casar.

### B · Captura de datos

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RF-05** | El sistema permitirá a un responsable reportar de una sola vez los importes de todas las personas de su ámbito, en una remesa identificada | ✅ | 🔺 | HU-04 |
| **RF-06** | El sistema restringirá a cada responsable los conceptos que tiene asignados, e informará si no tiene ninguno | ✅ | 🔺 | HU-05 |
| **RF-07** | El sistema enviará confirmación de cada remesa a quien la envía, con su identificador y resumen | ✅ | 🔺 | HU-06 |
| **RF-08** | El sistema admitirá correcciones **parciales y totales**, enlazadas a la remesa original y conservando ambas | ✅ | 🔺 | HU-07 |
| **RF-09** | El sistema permitirá consultar las remesas propias por periodo | ✅ | 🔸 | HU-08 |
| **RF-10** | El sistema captará las horas extras declaradas por cada secretaria, con periodo y marca temporal | ✅ | 🔺 | HU-09 |
| **RF-11** | El sistema admitirá **varios reportes de actividad sobre el mismo profesor y periodo**, procedentes de secretarias distintas | ✅ | 🔺 | HU-10 |
| **RF-12** | El sistema permitirá incorporar los datos de nómina procedentes del sistema externo | 🟡 | 🔺 | HU-11 |
| **RF-13** | El sistema registrará cada incorporación de datos externos: qué se incorporó, cuándo y quién | 🔴 | 🔺 | HU-11, HU-12 |
| **RF-68** | El sistema advertirá antes de reemplazar datos externos ya incorporados para el mismo periodo | 🔴 | 🔺 | HU-11 |
| **RF-14** | El sistema permitirá declarar explícitamente que **no hay nada que reportar** en un periodo, y lo contabilizará como respuesta | ⚪ | 🔸 | HU-13 |
| **RF-15** | El sistema registrará qué datos aporta cada fuente directamente sobre el archivo de cálculo | 🔴 | 🔸 | HU-12 |

| **RF-58** | El sistema ofrecerá un punto de entrada único desde el que acceder a las funciones disponibles para cada rol, sin invalidar los accesos directos existentes | ✅ | 🔹 | HU-36 |
| **RF-59** | El sistema avisará a quien coordina el proceso cada vez que se registre una remesa, indicando origen, concepto y volumen | ✅ | 🔸 | HU-37 |
| **RF-69** | El aviso de remesa indicará si contenía valores rechazados | 🟡 | 🔸 | HU-37 |
| **RF-60** | Los valores que no puedan interpretarse como número **se registrarán como incidencia** —con persona, concepto y valor recibido— en lugar de descartarse | ✅ | 🔺 | HU-38 |
| **RF-61** | Un valor inválido no impedirá el registro del resto de la remesa | ✅ | 🔺 | HU-38 |

> **RF-14 está en decisión, no pendiente.** Es la que hace posible medir la cobertura de secretarias
> y profesorado, y su coste es real: pedir una acción a quien no tiene nada que decir. **La decisión
> es de negocio.**

### C · Consolidación

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RF-16** | Todo volcado se ejecutará **bajo demanda**, acotado a un periodo elegido por quien lo lanza | ✅ | 🔺 | HU-14, HU-15 |
| **RF-17** | Todo volcado presentará un **informe previo** —qué coincide, qué no y por qué— y no escribirá nada hasta que se confirme | ✅ | 🔺 | HU-14, HU-15 |
| **RF-18** | Al cancelar un volcado, el sistema no modificará ningún dato | ✅ | 🔺 | HU-14 |
| **RF-19** | En el volcado de horas extras, si una persona ha reportado varias veces en el periodo, prevalecerá el envío más reciente | ✅ | 🔺 | HU-14 |
| **RF-20** | En el volcado de actividad, los datos se acumularán **campo a campo**: un campo vacío no borrará un valor ya presente | ✅ | 🔺 | HU-15 |
| **RF-21** | El sistema calculará el salario base de toda la plantilla a partir de los datos de nómina | ✅ | 🔺 | HU-16 |
| **RF-22** | Los volcados de nómina escribirán únicamente las celdas cuyo valor cambia | ✅ | 🔸 | HU-17 |
| **RF-23** | **Antes de escribir, todo volcado comprobará si el destino ya contiene datos** e informará del resultado | 🟡 | 🔺 | HU-18 |
| **RF-24** | Cuando el destino no esté limpio, el sistema podrá **impedir** la escritura, no solo advertirla | 🔴 | 🔺 | HU-18 |
| **RF-25** | El traslado de datos consolidados al archivo de cálculo se realizará mediante una acción **lanzada por la persona responsable**, que muestre el efecto antes de aplicarlo y deje constancia | 🔴 | 🔺 | HU-19 |
| **RF-26** | El sistema advertirá si un traslado ya se ha realizado en el mismo periodo | 🔴 | 🔸 | HU-19 |
| **RF-62** | El sistema producirá, a demanda, los datos consolidados de un periodo **fusionados por persona y concepto**, con las correcciones aplicadas | ✅ | 🔺 | HU-39 |
| **RF-63** | Todo volcado copiará las filas volcadas a un histórico, sin modificar el origen | ✅ | 🔸 | HU-40 |
| **RF-64** | Si falla la copia al histórico, el sistema lo advertirá **sin deshacer** el volcado ya realizado | ✅ | 🔸 | HU-40 |
| **RF-70** | Si un periodo ya se ha volcado antes, el sistema lo advertirá para no **duplicar** las filas del histórico | 🟡 | 🔸 | HU-40 · [R-11](SSD.md#9-riesgos-y-limitaciones) |
| **RF-71** | Las columnas del histórico corresponderán a los mismos conceptos que las del formulario vigente; si dejan de hacerlo, el sistema lo detectará en lugar de copiar por posición | 🔴 | 🔸 | HU-40 · [R-16](SSD.md#9-riesgos-y-limitaciones) |

> **RF-23 se cumple en los dos volcados de actividad y no en los dos export de nómina**, que
> sobrescriben sin mirar. Junto con RF-24, es la corrección programada para el primer sprint que
> abra código.

### D · Ajuste y cierre

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RF-27** | El sistema permitirá modificar importes ya consolidados durante la revisión final, sin exigir justificación ni devolver el dato a su origen | ✅ | 🔺 | HU-21 |
| **RF-28** | El sistema permitirá marcar un periodo como cerrado, registrando quién y cuándo | 🔴 | 🔸 | HU-22 |
| **RF-29** | Antes de permitir el cierre, el sistema advertirá de los pasos del proceso que no consten completados | 🔴 | 🔸 | HU-22 |
| **RF-30** | El sistema distinguirá visiblemente un periodo cerrado de uno en curso | 🔴 | 🔹 | HU-22 |

> **RF-27 es deliberadamente permisivo.** No registra autor ni motivo porque lo que motiva un ajuste
> nace fuera del sistema: es un [anti-objetivo declarado](problem.md), no una carencia. Se enuncia
> como requisito **para que conste que es intencionado** y nadie lo "corrija" más adelante.
>
> ⚠️ **Y contradice aparentemente a [RF-46](#g--trazabilidad-y-consulta)**, que exige que toda
> ejecución deje registro. No hay tal contradicción, pero **solo porque el ajuste ocurre fuera del
> sistema**: se hace directamente sobre el archivo de cálculo, no a través de ninguna función. El día
> que el ajuste se hiciera desde el sistema, las dos reglas chocarían de verdad y **habría que elegir
> conscientemente**, no descubrirlo al implementarlo.
>
> Queda anotado aquí precisamente para eso: para que la excepción sea visible en lugar de emerger
> como sorpresa.

### E · Verificación

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RF-31** | El sistema contrastará el importe de seguro médico de cada persona con la relación facilitada por la aseguradora | 🔴 | 🔺 | HU-23 |
| **RF-32** | El sistema contrastará los importes de ayuda de comida y transporte con lo concedido por el proveedor, **por separado** | 🔴 | 🔺 | HU-24 |
| **RF-33** | El sistema contrastará las transferencias emitidas con los importes calculados, aplicando una **tolerancia definida** para redondeos | 🔴 | 🔺 | HU-25 |
| **RF-34** | Los informes de verificación distinguirán los tipos de diferencia: importe distinto, presente en un origen y no en el otro, y **no cruzado por falta de correspondencia** | 🔴 | 🔺 | HU-23, HU-24, HU-25 |
| **RF-35** | Los informes de verificación serán de **solo lectura**: no modificarán ningún dato | 🔴 | 🔺 | HU-23, HU-24, HU-25 |

> **RF-34 es el que evita el peor fallo posible en una verificación:** que una persona que no casa
> por identificador desaparezca del informe y se cuente como correcta. Lo *no comprobado* nunca debe
> presentarse como *comprobado*.

### F · Coordinación del cierre

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RF-36** | El sistema permitirá iniciar el proceso de un periodo, registrando la **fecha tope de reporte**, la de **entrega final** y, automáticamente, la de **inicio** | 🔴 | 🔺 | HU-26 |
| **RF-37** | El sistema impedirá iniciar dos veces el mismo periodo | 🔴 | 🔸 | HU-26 |
| **RF-38** | Al iniciarse un periodo, el sistema avisará a cada fuente de qué se espera de ella y hasta cuándo, con acceso directo al medio de reporte | 🔴 | 🔺 | HU-27 |
| **RF-39** | El sistema mostrará, en cualquier momento del periodo, **quién ha reportado y quién no**, con la fecha y el volumen de cada envío | 🔴 | 🔺 | HU-28 |
| **RF-40** | El sistema excluirá del cómputo de cobertura las cuentas de prueba | 🔴 | 🔸 | HU-28 |
| **RF-41** | Cuando no sea posible conocer el conjunto de fuentes esperadas, el sistema lo **declarará explícitamente** en lugar de mostrar una cobertura calculada sobre un total desconocido | 🔴 | 🔺 | HU-28 |
| **RF-42** | El sistema mostrará el estado de cada paso del proceso: pendiente, lanzado, completado o con incidencias | 🔴 | 🔺 | HU-29 |
| **RF-43** | El estado de un paso se deducirá del registro del sistema siempre que ese paso deje rastro; los que no lo dejen podrán marcarse manualmente y se distinguirán de los deducidos | 🔴 | 🔺 | HU-29 |
| **RF-44** | El sistema señalará los pasos ejecutados fuera del orden establecido | 🔴 | 🔸 | HU-29 |
| **RF-45** | El sistema permitirá registrar comentarios asociados a un paso y a un periodo, consultables después | 🔴 | 🔹 | HU-30 |

> **RF-41 es una decisión de honestidad, no de funcionalidad.** Es preferible declarar que no se
> puede medir a mostrar un número que parece medido: un panel que dice "85 % de cobertura" cuando el
> denominador es desconocido es peor que uno que dice "no se puede saber".

### G · Trazabilidad y consulta

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RF-46** | Toda ejecución **realizada a través del sistema** dejará registro con identificador, usuario, momento, resultado y alcance de lo modificado | 🟡 | 🔺 | HU-20 |
| **RF-47** | El registro alcanzará también a los procesos **que se ejecutan sin intervención humana** | 🔴 | 🔺 | HU-20 |
| **RF-48** | Los fallos dejarán registro con su causa y, cuando se pueda determinar, una posible solución | 🟡 | 🔸 | HU-20 |
| **RF-49** | El sistema permitirá consultar, para una persona y un periodo, **qué reportó cada fuente sobre ella y cuándo** | 🟡 | 🔺 | HU-31 |
| **RF-50** | La consulta de periodos cerrados será de solo lectura, y se indicará visiblemente que lo es | 🔴 | 🔹 | HU-32 |
| **RF-65** | Existirá una forma explícita de **reabrir** un periodo cerrado, que deje constancia de quién lo reabrió y cuándo | 🔴 | 🔹 | HU-32 |
| **RF-66** | Cuando se consulte un periodo del que ya no se conserve detalle, el sistema lo **indicará**, en lugar de devolver un resultado vacío | 🔴 | 🔸 | HU-31 |
| **RF-67** | La consulta del origen de un importe no exigirá abrir varios archivos distintos | 🔴 | 🔸 | HU-31 |

> ⚠️ **RNF-04 y RF-48 estaban marcados como cumplidos y el código dice otra cosa:**
>
> - **RNF-04** — de los cuatro componentes que escriben, **tres usan bloqueo y uno no**: la webapp de
>   complementos guarda sin él. Es justo la que usan varias personas a la vez desde fuera, que es
>   donde la concurrencia deja de ser teórica. Ya estaba detectado como deuda técnica (DT-13), pero
>   el requisito lo daba por cumplido.
> - **RF-48** — la columna de *posible solución* existe en los tres scripts de hoja de cálculo y **no
>   en la webapp**. La causa sí se registra en los cuatro.
>
> Los dos se corrigieron al confrontar el documento con el código. Es la razón de que el estado de un
> requisito **no deba escribirse de memoria**.

> **RF-47 es el punto ciego actual.** Los procesos que sincronizan las listas de los formularios se
> disparan solos y solo dejan rastro en el registro interno de la plataforma, que se borra y no se
> puede consultar. Son justo los que deciden **quién aparece en los formularios**.
>
> **Y el alcance de RF-49 tiene un límite declarado:** llega hasta lo reportado, no hasta el importe
> final. Si hubo ajuste (RF-27), esa diferencia no es reconstruible — y es intencionado.

### H · Medición e informes

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RF-51** | El sistema recogerá, por periodo, indicadores de **volumen, ejecución, cobertura, puntualidad y valor** | 🔴 | 🔸 | HU-33 |
| **RF-52** | Los indicadores incluirán el volumen de datos tratado **por persona**, además del total | 🔴 | 🔹 | HU-33 |
| **RF-53** | El histórico de indicadores será **inmutable**: reprocesar un periodo no alterará las cifras ya registradas de periodos anteriores | 🔴 | 🔺 | HU-34 |
| **RF-54** | El sistema producirá informes **mensual, trimestral y anual**, adaptados a su destinatario | 🔴 | 🔸 | HU-33, HU-34, HU-35 |
| **RF-55** | Todo indicador irá acompañado de la advertencia de **qué mide y qué no** | 🔴 | 🔺 | HU-33 |
| **RF-56** | El sistema señalará las variaciones que se salgan de lo habitual en lugar de diluirlas en el total | 🔴 | 🔹 | HU-35 |

> **RF-53 es el que hace posible comparar.** Si el histórico se recalcula, las tendencias dejan de
> significar nada: un trimestre no se puede comparar con otro que ya no es el que fue.
>
> **Y RF-55 no es cosmético.** Que el mecanismo de reporte no falle no significa que los importes
> sean correctos: un dato erróneo bien formado se registra sin incidencia. Sin esa advertencia, un
> informe en verde convive perfectamente con una nómina mal calculada.

---

## 2. Requisitos no funcionales

| # | Requisito | Estado | Prio | Origen |
|---|-----------|--------|------|--------|
| **RNF-01** | El sistema se construirá sobre la plataforma corporativa existente, sin requerir infraestructura nueva | ✅ | 🔺 | [problem.md §7](problem.md) |
| **RNF-02** | Los datos **de origen** se localizarán por **nombre de cabecera**, no por posición, para resistir reordenaciones de columnas | 🟡 | 🔺 | ADR-0010 · SSD |
| **RNF-15** | Cuando el **destino** se direccione por posición fija, cualquier cambio en su estructura deberá detectarse antes de escribir | 🔴 | 🔸 | [R-08](SSD.md#9-riesgos-y-limitaciones) |
| **RNF-16** | Cada función tendrá **una sola responsabilidad**, de forma que pueda comprobarse por separado | 🔴 | 🔸 | CLAUDE.md · DT-18 |
| **RNF-17** | Una misma lógica **no se duplicará** entre proyectos: se comparte o se aísla en un solo punto | 🔴 | 🔸 | CLAUDE.md · DT-19, DT-20 |
| **RNF-03** | El sistema distinguirá los datos por **periodo (mes y año)**, sin necesidad de reestructurarse con el paso de los años | ✅ | 🔺 | SSD |
| **RNF-04** | Las operaciones de escritura serán seguras ante ejecuciones concurrentes | 🟡 | 🔺 | SSD · DT-13 |
| **RNF-05** | **Ninguna acción que escriba datos se ejecutará sin confirmación humana explícita** | 🟡 | 🔺 | [problem.md §7](problem.md) |
| **RNF-06** | Ninguna operación **del sistema** destruirá datos reportados: las correcciones se añaden, no sustituyen | ✅ | 🔺 | HU-07 |
| **RNF-07** | Las escrituras se realizarán **en bloque**, no celda a celda, para no degradarse al crecer el volumen | 🔴 | 🔸 | Deuda técnica |
| **RNF-08** | La interpretación de valores numéricos será correcta con independencia del separador decimal empleado | 🔴 | 🔺 | Deuda técnica |
| **RNF-09** | El sistema tratará datos retributivos y de carácter personal, y su acceso estará limitado a quien deba tenerlo | 🟡 | 🔺 | [problem.md §7](problem.md) |
| **RNF-10** | Quien use el sistema seguirá trabajando de forma reconocible: no se le exigirá aprender una herramienta compleja | ✅ | 🔺 | [problem.md §8](problem.md) |
| **RNF-11** | El sistema será mantenible por **una sola persona** compatibilizándolo con otras funciones | 🟡 | 🔸 | [problem.md §7](problem.md) |
| **RNF-12** | Cada componente será independiente de los demás, de modo que el fallo de uno no impida operar el resto | ✅ | 🔸 | SSD |
| **RNF-13** | Ninguna operación superará el **límite de tiempo de ejecución** de la plataforma, con el volumen previsible de la plantilla | 🟡 | 🔺 | Deuda técnica |
| **RNF-14** | El registro de ejecuciones se conservará el tiempo suficiente para responder a una reclamación sobre un periodo pasado | 🟡 | 🔸 | HU-31 |

> **RNF-16 y RNF-17 no son estética.** Las funciones del sistema llegan a **185 líneas** y hacen
> hasta cinco cosas distintas, y hay lógica copiada en hasta tres scripts. Las dos cosas tienen
> consecuencia medible: no hay nada del tamaño de un test —de ahí que no haya tests—, y una
> corrección aplicada en un script se olvida en su gemelo. Ya ha pasado: la comprobación de destino
> limpio está en dos volcados y falta en los otros dos.

> **RNF-13 no es teórico.** La plataforma corta las ejecuciones que se alargan, y hay un volcado que
> escribe **celda a celda**: hoy funciona, pero es de las cosas que dejan de funcionar al crecer, y lo
> hacen a mitad de escritura. Un volcado cortado por la mitad es peor que uno que no arranca.

> **RNF-05 es el requisito no funcional más importante de este documento**, y el menos evidente. No
> nace de una limitación técnica sino de una condición de aceptación: quien opera el cierre maneja
> datos muy sensibles y necesita conservar el control de cuándo ocurre cada cosa.
>
> Se cumple hoy en los volcados —que preparan, informan y esperan confirmación— y **no** en los
> procesos que se disparan por sí solos ni en los export, que escriben sin preguntar. Todo lo que se
> construya de aquí en adelante debe cumplirlo: **automatizar el trabajo, no la decisión de
> hacerlo**.

---

## 3. Resumen

| Estado | Funcionales | No funcionales |
|---|---|---|
| ✅ **Cumplidos** | 25 | 5 |
| 🟡 **Parciales** | 8 | 7 |
| 🔴 **No cumplidos** | 37 | 5 |
| ⚪ **En decisión** | 1 | — |
| | **71** | **17** |

*Los dos requisitos no funcionales sin cumplir —escritura en bloque y precisión numérica— son deuda
técnica ya inventariada, no funcionalidad ausente.*

**Cómo se reparte lo que falta:**

| Bloque | Cumplidos | Total |
|---|---|---|
| A · Maestro de personal | 3 | 5 |
| B · Captura de datos | 11 | 17 |
| C · Consolidación | 10 | 16 |
| D · Ajuste y cierre | 1 | 4 |
| E · Verificación | **0** | 5 |
| F · Coordinación del cierre | **0** | 10 |
| G · Trazabilidad y consulta | **0** | 8 |
| H · Medición e informes | **0** | 6 |

> **Tres bloques enteros a cero**, y no es casualidad: verificación, coordinación y medición son
> justo los que **no mueven datos, sino que controlan que el proceso vaya bien**. Lo construido hasta
> hoy transporta información con solvencia; lo que falta es todo lo que permite **saber que ha ido
> bien**.

---

## 3.bis Trazabilidad hacia las historias

Cada requisito indica de qué historia sale. En sentido contrario, **las 41 historias tienen al menos
un requisito que las implementa**:

| Historia | | Requisitos |
|---|---|---|
| **HU-01** | Mantener quién está activo | RF-01, RF-02 |
| **HU-02** | Ver solo personas que existen | RF-02 |
| **HU-03** | Identificar a la persona sin depender del nombre | RF-03, RF-04 |
| **HU-04** | Reportar a todo mi equipo de una vez | RF-05 |
| **HU-05** | Reportar solo lo que me corresponde | RF-06 |
| **HU-06** | Tener constancia de lo que envié | RF-07 |
| **HU-07** | Corregir sin borrar lo anterior | RF-08 |
| **HU-08** | Consultar lo que ya envié | RF-09 |
| **HU-09** | Reportar mis horas extras | RF-10 |
| **HU-10** | Reportar la actividad del profesorado que gestiono | RF-11 |
| **HU-11** | Incorporar los datos de nómina | RF-12, RF-13, RF-68 |
| **HU-12** | Aportar datos propios al cálculo | RF-13, RF-15 |
| **HU-13** | Declarar que este mes no tengo nada | RF-14 |
| **HU-14** | Volcar las horas extras de las secretarias | RF-16, RF-17, RF-18, RF-19 |
| **HU-15** | Volcar la actividad del profesorado, acumulando por campo | RF-16, RF-17, RF-20 |
| **HU-16** | Calcular el salario base | RF-21 |
| **HU-17** | Volcar los datos de nómina | RF-22 |
| **HU-18** | Que me avisen si el destino no está limpio | RF-23, RF-24 |
| **HU-19** | Mover los datos al cálculo dejando constancia | RF-25, RF-26 |
| **HU-20** | Saber qué hizo cada ejecución | RF-46, RF-47, RF-48 |
| **HU-21** | Ajustar un importe en la revisión | RF-27 |
| **HU-22** | Dar el mes por cerrado | RF-28, RF-29, RF-30 |
| **HU-23** | Comprobar el seguro médico | RF-31, RF-34, RF-35 |
| **HU-24** | Comprobar las ayudas de comida y transporte | RF-32, RF-34, RF-35 |
| **HU-25** | Comprobar que lo pagado es lo calculado | RF-33, RF-34, RF-35 |
| **HU-26** | Lanzar el cierre del mes | RF-36, RF-37 |
| **HU-27** | Enterarme de que tengo que reportar | RF-38 |
| **HU-28** | Ver quién ha reportado y quién no | RF-39, RF-40, RF-41 |
| **HU-29** | Ver por dónde va el cierre | RF-42, RF-43, RF-44 |
| **HU-30** | Dejar constancia de lo que no funcionó | RF-45 |
| **HU-31** | Reconstruir de dónde salió un importe | RF-49, RF-66, RF-67 |
| **HU-32** | Consultar un periodo cerrado sin tocarlo | RF-50, RF-65 |
| **HU-33** | El informe del mes, para actuar | RF-51, RF-52, RF-54, RF-55 |
| **HU-34** | El dato en bruto, para analizar | RF-53, RF-54 |
| **HU-35** | El resumen y la tendencia, para decidir | RF-54, RF-56 |
| **HU-36** | Entrar a lo mío desde un único sitio | RF-58 |
| **HU-37** | Enterarme de que ha llegado un reporte | RF-59, RF-69 |
| **HU-38** | Que un valor mal escrito no se pierda en silencio | RF-60, RF-61 |
| **HU-39** | Sacar los datos consolidados del mes | RF-62 |
| **HU-40** | Conservar copia de lo que se volcó | RF-63, RF-64, RF-70, RF-71 |
| **HU-41** | Incorporar un concepto retributivo nuevo | RF-57 |

> Comprobado sobre el propio documento: **ninguna historia se ha quedado sin requisito**, y ningún
> requisito existe sin una historia que lo justifique. Si en el futuro aparece un requisito sin
> historia, la pregunta correcta no es de dónde ha salido, sino **quién lo necesita**.

---

## 4. Correspondencia con los requisitos del SSD

El [SSD §3](SSD.md) contiene una lista anterior de 14 requisitos funcionales y 5 no funcionales,
escritos desde el código. Esta es su correspondencia con la numeración de este documento:

| SSD | Qué decía | Aquí |
|---|---|---|
| RF-01 | Fuente única de verdad del personal activo | RF-01 |
| RF-02 | Reporte masivo por webapp | RF-05 |
| RF-03 | Validar los conceptos del responsable | RF-06 |
| RF-04 | Envíos y correcciones por mes y año | RF-08 |
| RF-05 | Email de confirmación y aviso | RF-07 |
| RF-06 | Consulta de envíos por periodo | RF-09 |
| RF-07 | Exportación mensual a demanda | RF-09 *(parcial)* |
| RF-08 | Volcar las horas extras | RF-10, RF-16, RF-19 |
| RF-09 | Sincronizar el desplegable de profesores | RF-02 |
| RF-10 | Escribir el identificador en las respuestas | RF-03 |
| RF-11 | Volcar la actividad acumulando | RF-11, RF-20 |
| RF-12 | Calcular el salario base | RF-21 |
| RF-13 | Volcar nóminas a Vinculación | RF-22 |
| RF-14 | Auditoría centralizada | RF-46, RF-48 |
| RNF-01 … RNF-05 | Plataforma, cabeceras, periodo, concurrencia, trazabilidad | RNF-01 … RNF-04, RF-46 |

**Los 14 requisitos del SSD siguen vigentes: ninguno se contradice, todos se han absorbido.** La
diferencia es de dirección — aquellos describían **lo construido**, estos describen **lo que debe
cumplirse**, y por eso son muchos más: la diferencia son los que **aún no tienen código detrás**.

> 🔍 **Pendiente de decidir:** si el [SSD §3](SSD.md) se reduce a un enlace a este documento —lo
> recomendable, para no mantener dos listas— o se conserva como registro histórico de lo que se
> especificó en su día.

---

## 5. Trazabilidad hacia las decisiones y los riesgos

### Decisiones de arquitectura

Cada [ADR aceptado](adr/README_ADR.md) debe tener al menos un requisito que lo materialice. Si no lo
tiene, o la decisión no llegó a aplicarse, o falta escribir el requisito:

| ADR | Decisión | Requisitos |
|-----|----------|------------|
| [0001](adr/0001-google-sheets-como-bbdd-central.md) | Sheets como BBDD central | RNF-01 |
| [0002](adr/0002-webapp-propia-para-reporte-de-complementos.md) | Webapp propia de reporte | RF-05, RF-58 |
| [0003](adr/0003-responsable-asignado-a-complemento-en-bbdd.md) | Responsable ↔ complemento en BBDD | RF-06, RF-57 |
| [0004](adr/0004-formulario-horas-extras-vinculado-a-bbdd.md) | Formulario vinculado a la BBDD | RF-02 |
| [0005](adr/0005-gestion-de-envios-por-mes-y-anio.md) | Envíos por mes + año | RNF-03 |
| [0006](adr/0006-separar-bbdd-de-personal.md) | BBDD de personal separada | RF-01 |
| [0007](adr/0007-proyectos-apps-script-independientes.md) | Un proyecto por colectivo | RNF-12 |
| [0008](adr/0008-reutilizar-patron-de-sincronizacion.md) | Reutilizar el patrón de sincronización | RF-02, RNF-12 |
| [0009](adr/0009-acumular-respuestas-por-mes-y-anio.md) | Acumular por mes/año | RF-11, RF-20 |
| [0010](adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md) | Cruce por cabecera | RNF-02 |
| [0011](adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md) | Volcado de nóminas fusionado | RF-22, RNF-12 |
| [0012](adr/0012-auditoria-centralizada-logs-y-errores.md) | Auditoría en `logs` / `errores` | RF-46, RF-48 |
| [0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md) | Volcado por periodo, bajo demanda | RF-16, RF-17, RF-18, RNF-05 |
| [0014](adr/0014-volcado-actividad-profesores-por-periodo.md) | Volcado de actividad por periodo | RF-16, RF-20, RF-23, RF-63 |

**Los 14 ADR aceptados tienen requisito.** Ninguna decisión se ha quedado sin materializar, y ningún
requisito contradice una decisión tomada.

> **Y al revés, un aviso para el futuro:** si un requisito nuevo choca con un ADR, **no se cambia el
> ADR** — los ADR son inmutables. Se escribe uno nuevo que supere al anterior. Que un requisito
> contradiga en silencio una decisión aceptada es la forma más rápida de que la arquitectura deje de
> significar nada.

### Riesgos del SSD

Los riesgos de [`SSD.md` §9](SSD.md#9-riesgos-y-limitaciones) y el requisito que los aborda:

| Riesgo | De qué va | Requisito | ¿Cubierto? |
|--------|-----------|-----------|------------|
| R-01 | Dependencia de la plataforma | RNF-01 | Asumido por decisión |
| R-02 | Permisos no gestionados por rol nativo | RNF-09 | Parcial · fuera de alcance |
| R-03, R-06 | El cruce por nombre se rompe si cambia el nombre | **RF-04** | 🔴 No |
| R-07 | Los export sobrescriben | RF-23, RF-24 | 🔴 En curso |
| R-08 | Destino por posición fija | **RNF-15** | 🔴 No |
| R-09 | Los volcados dependen de que alguien los lance | RNF-05 | ✅ Es un requisito, no un fallo |
| R-11 | Volcar dos veces duplica el histórico | **RF-70** | 🟡 Avisa |
| R-12 | La plantilla se localiza por nombre | — | Detalle de implementación |
| R-13 | Repositorio y producción se sincronizan a mano | RNF-11 | 🟡 Parcial |
| R-14 | Los decimales con punto se corrompen | RNF-08 | 🔴 No |
| R-15 | Escritura celda a celda | RNF-07, RNF-13 | 🔴 No |
| R-16 | Cabeceras del histórico de profesores | **RF-71** | 🔴 No |
| R-17 | La hoja limpia no está garantizada | RF-23, RF-24 | 🟡 Avisa, no impide |
| R-18 | Los procesos automáticos no dejan rastro | RF-47 | 🔴 No |
| R-19 | Los movimientos entre libros no dejan constancia | RF-25 | 🔴 No |
| R-20 | El archivo de cálculo está fuera del sistema | — | Duda abierta |

> **Tres riesgos no tenían requisito y ahora lo tienen** (RF-70, RF-71, RNF-15). Y **tres riesgos
> nuevos** salieron de esta confrontación y se han añadido al SSD: R-18, R-19 y R-20 — los tres de
> impacto alto, y los tres sobre lo mismo: **el dato sale del sistema y deja de haber rastro**.
>
> Solo dos riesgos se quedan sin requisito, y con motivo: R-12 es un detalle de implementación y R-20
> es una duda abierta, no algo que se pueda exigir todavía.

---

## 6. Qué falta por definir

1. **RF-14** — decisión de negocio: ¿se pide declarar "no tengo nada que reportar"?
2. **RF-15** — no se puede concretar hasta saber qué datos aporta el Gerente.
3. **RF-31 … RF-35** — escritos sobre cómo *deberían* venir los documentos de las entidades. Habrá
   que revisarlos al recibirlos.
4. **RF-24** — falta decidir si el bloqueo es absoluto o admite una excepción justificada.
5. **RNF-09** — el alcance real del control de acceso está sin definir, y tratándose de datos
   retributivos conviene concretarlo.
6. 🔍 **Validar las prioridades con negocio.** Las de este documento son propuesta de quien lo
   escribe, no decisión de quien lo usa.
