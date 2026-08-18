# ROADMAP — Sistema VAP

Fases del proyecto y estado de avance. **Qué toca hacer ahora**, partido en objetivos pequeños
y cerrables, está en [`retomar_trabajos.md`](retomar_trabajos.md). El detalle cronológico de cada cambio está en
[`../CHANGELOG.md`](../CHANGELOG.md); el diseño del sistema, en [`SSD.md`](../docs_dev/SSD.md); las
decisiones, en [`adr/`](../docs_dev/adr/README_ADR.md); las cuestiones sin resolver y la deuda técnica, en
[`dudas/`](dudas/README_dudas.md).

Leyenda: `[x]` completado · `[ ]` pendiente.

---

## Resumen de fases

| Fase | Alcance | Qué cubre | Estado | Avance |
|------|---------|-----------|--------|--------|
| **1 — Secretarias** | Secretarias | Complementos, horas extras y portal de acceso | ✅ **En producción** | 13 / 13 |
| **1.A** · Complementos salariales | | Webapp de reporte, correcciones, emails y export mensual | ✅ Completada | 7 / 7 |
| **1.B** · Horas extras | | Formulario vinculado a BBDD y volcado por periodo | ✅ Completada | 5 / 5 |
| **1.C** · Portal (GALA Hub) | | Portada con acceso a reportar y consultar | ✅ Completada | 1 / 1 |
| **2 — Profesores** | Profesores | Sincronización del formulario y volcado de actividad | 🔵 **En curso** | 9 / 12 |
| **2.A** · Sincronización de formularios | | Desplegable dinámico y escritura del `ID_Profesor` | ✅ Completada | 4 / 4 |
| **2.B** · Volcado de actividad | | Acumulación por campo y volcado por periodo | 🔵 En curso | 5 / 8 |
| **3 — Nóminas y verificación** | **Todo el personal** | Salario base, volcado a Vinculación y controles de cuadre | 🔵 **En curso** | 3 / 16 |
| **3.A** · Salario base y volcado | | Cálculo del salario base y export Neto/Bruto | 🔵 En curso | 3 / 7 |
| **3.B** · Verificación del seguro médico | | Contrastar `SEGURO_MEDICO` con la póliza real | ⚪ Planificada | 0 / 3 |
| **3.C** · Verificación de COBEE | | Contrastar comida y transporte con lo que corresponde | ⚪ Planificada | 0 / 3 |
| **3.D** · Verificación de transferencias | | Cuadrar lo transferido con lo calculado | ⚪ Planificada | 0 / 3 |
| **4 — Documentación y deuda técnica** | Transversal | Poner por escrito el sistema y saldar la deuda | 🔵 **En curso** | 22 / 30 |
| **4.A** · Documentación | | Problema, flujo, diseño verificado, decisiones y dudas | 🔵 En curso | 21 / 23 |
| **4.B** · Deuda técnica | | Correcciones detectadas en la revisión | 🔵 En curso | 1 / 7 |
| **5 — Acompañamiento del cierre** | **El proceso** | Saber cuándo empieza, quién falta y si ha ido bien | ⚪ **Planificada** | 0 / 20 |
| **5.A** · Lanzamiento y avisos | | Registrar la fecha de cierre y avisar a las fuentes | ⚪ Planificada | 0 / 3 |
| **5.B** · Seguimiento de lo reportado | | Quién ha reportado y quién falta | ⚪ Planificada | 0 / 3 |
| **5.C** · Panel de coordinación | | Estado de los nueve pasos del cierre, con comentarios | ⚪ Planificada | 0 / 4 |
| **5.D** · Medición del proceso | | Ejecución, volumen, cobertura y puntualidad | ⚪ Planificada | 0 / 10 |

**Total: 47 de 91 puntos completados.**

**Estados:** ✅ completada · 🔵 en curso · 🔴 sin empezar · ⚪ planificada, sin definir del todo

> **Por qué la Fase 3 es transversal.** El salario base y su verificación no son un asunto de
> secretarias ni de profesores: afectan a **todo el personal**, incluido el que cobra un **sueldo
> fijo** y no aparece en ninguno de los dos colectivos: la exportación de nóminas cubre **más
> personas** que las que el sistema VAP gestiona por complementos. Por eso deja de colgar de la
> Fase 2 y pasa a ser una fase propia.
>
> Además cambia de naturaleza a mitad de camino: **3.A mueve datos** (calcular y volcar), mientras
> que **3.B, 3.C y 3.D los comprueban**. Es la primera vez que el sistema verifica en lugar de
> transportar.

> **Y la Fase 5 cambia de objeto.** Las cuatro primeras se ocupan de **los datos**; la quinta, del
> **proceso** que los produce: cuándo empieza, quién falta, por dónde va y si salió bien. Nace del
> mapa del flujo, que dejó ver que **cuatro de los nueve pasos del cierre no existen** — y que los
> que faltan no son los que mueven datos, sino los que dan control.

---

## FASE 1 — Secretarias *(en producción)*

### Fase 1.A — Complementos Salariales

- [x] `VAP_BBDD_Personas` como fuente única de verdad del personal activo ([ADR-0001](../docs_dev/adr/0001-google-sheets-como-bbdd-central.md), [ADR-0006](../docs_dev/adr/0006-separar-bbdd-de-personal.md))
- [x] Webapp de reporte masivo con lista dinámica de secretarias activas ([ADR-0002](../docs_dev/adr/0002-webapp-propia-para-reporte-de-complementos.md))
- [x] Validación de que el responsable corresponde al complemento que reporta ([ADR-0003](../docs_dev/adr/0003-responsable-asignado-a-complemento-en-bbdd.md))
- [x] Gestión de envíos y correcciones por mes/año ([ADR-0005](../docs_dev/adr/0005-gestion-de-envios-por-mes-y-anio.md))
- [x] Email de confirmación al responsable y aviso al gestor en cada remesa
- [x] Webapp de consulta de envíos realizados
- [x] Exportación mensual a demanda de datos fusionados por secretaria y concepto

### Fase 1.B — Horas Extras

- [x] Vinculación del formulario `EXTRA SECRETARIAS 2026` a `VAP_Secretarias` (lista dinámica) ([ADR-0004](../docs_dev/adr/0004-formulario-horas-extras-vinculado-a-bbdd.md))
- [x] ~~Volcado automático (`onFormSubmit`)~~ → sustituido por volcado **bajo demanda por periodo**
- [x] Volcado acotado al mes (col. `MES` + año de la marca temporal), con desplegable de periodo,
  informe previo y confirmación ([ADR-0013](../docs_dev/adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md))
- [x] Copia automática a `Anteriores`; la hoja de respuestas ya no necesita vaciarse a mano
- [x] Auditoría en la hoja `LOG Volcado`: movimientos, incidencias y errores

### Fase 1.C — Portal / lanzador de complementos (GALA Hub)

- [x] Portal (template `Portal`, `?page=portal`): portada alineada con GALA Hub con dos accesos
  (Reportar / Consultar) que enlazan a las webapps existentes, sin duplicar lógica ni modificar
  las dos webapps anteriores. Punto de entrada del recurso `rec-004` de GALA Hub

---

## FASE 2 — Profesores

### Fase 2.A — Sincronización de formularios *(en producción)*

- [x] Carga de `VAP_Profesores` en `VAP_BBDD_Personas` (con estado `Alta`)
- [x] Sincronización automática del desplegable "SELECCIONE EL PROFESOR" con profesores activos ([ADR-0008](../docs_dev/adr/0008-reutilizar-patron-de-sincronizacion.md))
- [x] Escritura automática del `ID_Profesor` en las respuestas
- [x] Despliegue en proyecto Apps Script independiente ([ADR-0007](../docs_dev/adr/0007-proyectos-apps-script-independientes.md))

### Fase 2.B — Volcado de actividad *(en curso)*

- [x] Acumulación **campo a campo** por (profesor + mes + año) ([ADR-0009](../docs_dev/adr/0009-acumular-respuestas-por-mes-y-anio.md)):
  varias secretarias reportan partes distintas de la actividad del mismo profesor
- [x] Volcado **bajo demanda por periodo**, con desplegable de mes, informe previo y confirmación
  ([ADR-0014](../docs_dev/adr/0014-volcado-actividad-profesores-por-periodo.md)) — antes solo se podía volcar el
  mes más reciente
- [x] Copia automática al histórico (`Hoja 1`); la hoja de respuestas no se modifica
- [x] Auditoría en `LOG Volcado`, con el nombre real de cada columna de actividad
- [x] Comprobación de que el destino está limpio antes de escribir *(en ambos volcados: 1.B y 2.B)*
- [ ] Identificar todas las fuentes de datos actuales de profesores y su estructura
- [ ] Definir complementos salariales específicos del colectivo
- [ ] Evaluar reutilización de la webapp de secretarias o necesidad de versión propia

---

## FASE 3 — Nóminas y verificación *(en curso · transversal)*

Afecta a **todo el personal**: secretarias, profesores y quienes cobran un **sueldo fijo** sin
complementos. El origen es `bbdd_export_sage_laboral`.

### Fase 3.A — Salario base y volcado a Vinculación

- [x] Acción **Calculo Salario Base** sobre la exportación SAGE laboral ([ADR-0010](../docs_dev/adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md)):
  `salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|`
- [x] Acciones **Export Neto** / **Export Bruto** a las hojas de Vinculación ([ADR-0011](../docs_dev/adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md))
- [x] Auditoría centralizada `logs` / `errores` correlacionada por `Run ID` ([ADR-0012](../docs_dev/adr/0012-auditoria-centralizada-logs-y-errores.md))
- [ ] Completar el flujo de volcado hacia el cálculo final de nóminas
      *(bloqueado por [DUDA-0001](dudas/0001-tres-libros-destino-de-los-volcados.md), **reformulada
      el 18 ago 2026**: ya se sabe que el cálculo se hace en un archivo aparte, `Gastos de Personal`,
      al que los datos llegan **pegados a mano**; lo que ahora no consta es **cuáles son realmente
      los archivos de destino y cuántos son**. Requiere revisión con la Responsable de
      Administración)*
- [ ] **Export Neto y Export Bruto escriben sin comprobar si el destino ya tiene datos.** Los dos
      volcados de actividad sí lo comprueban; estos no. Añadirles la misma comprobación y, en los
      cuatro, permitir que el aviso **impida** la escritura en lugar de solo advertirla
      *(ver [HU-18](../docs_dev/historias_usuarios.md) · programado en el primer sprint con código)*
- [ ] Convertir el **pegado manual** entre los archivos de vinculación y el archivo de cálculo en un
      proceso **semiautomático**: una acción que la Responsable de Administración **lanza cuando lo
      considera**, que prepara el movimiento, lo muestra y solo escribe si ella confirma. No un
      automatismo que se dispare solo. Es el único salto de toda la cadena que no deja rastro
      *(bloqueado por [DUDA-0001](dudas/0001-tres-libros-destino-de-los-volcados.md) y
      [DUDA-0003](dudas/0003-momentos-de-copia-y-pega-del-proceso.md))*
- [ ] Resolver [DUDA-0002](dudas/0002-signo-de-seguro-medico-y-cobee-en-sage.md): **con qué signo
      llegan de SAGE** el seguro médico y COBEE. El cálculo del salario base les aplica valor
      absoluto, mientras que el volcado a Vinculación los copia con su signo original

### Fase 3.B — Verificación del seguro médico

Contrastar el `SEGURO_MEDICO` (col. G del origen → *ADESLAS* en Vinculación) con quién debe tenerlo
realmente contratado.

- [ ] **Solicitar a ADESLAS** el documento con la relación real de asegurados y su importe, y ver
      cómo viene: formato, campos, con qué se puede cruzar y cada cuánto se emite
- [ ] Detectar diferencias por persona: importe distinto del esperado, alta sin cobertura, cobertura
      sin alta
- [ ] Informe de diferencias antes del cierre, con la misma pauta que los volcados: revisar primero,
      escribir después

### Fase 3.C — Verificación de COBEE

Igual para los dos conceptos de COBEE: `COBE_Alimentacion` (→ *COBEE COMIDA*) y `COBE_Transporte`
(→ *COBEE TRANSPORTE*).

- [ ] **Solicitar a COBEE** el documento de ayudas concedidas de comida y transporte, y ver cómo
      viene: formato, campos, con qué se puede cruzar y cada cuánto se emite
- [ ] Detectar diferencias por persona y por concepto
- [ ] Informe de diferencias antes del cierre

> **3.B y 3.C no son verificaciones cosméticas.** Los tres conceptos entran en la fórmula del salario
> base, así que un error en cualquiera de ellos **se propaga al salario base** de esa persona.

### Fase 3.D — Verificación de transferencias

El control de cierre: comprobar que **lo efectivamente transferido coincide con lo calculado**.

- [ ] **Solicitar al banco** el fichero de transferencias emitidas, y ver cómo viene: formato,
      campos y **con qué se identifica a cada persona** — que es lo que decide si el cruce es
      posible o hay que construir una correspondencia a mano
- [ ] Contrastar contra el `Líquido_a_percibir` calculado, con tolerancia definida para redondeos
- [ ] Informe de descuadres: pagado de más, pagado de menos, persona pagada sin cálculo, persona
      calculada sin pago

> Es la única comprobación que mira **el resultado final** en lugar de un dato intermedio. Cierra el
> circuito entre lo que el sistema calcula y lo que la persona recibe — hoy nadie verifica ese último
> tramo de forma sistemática.

> **Las tres verificaciones dependen de lo mismo: un documento de fuera.** ADESLAS, COBEE y el
> banco. Hasta tenerlos y ver cómo vienen, no se puede diseñar ningún cruce — así que **pedirlos es
> el primer paso de las tres fases**, y se puede hacer ya, en paralelo a cualquier otra cosa.
>
> Verificar contra un dato del propio sistema no es verificar: es comprobar que coincide consigo
> mismo.

**Quién y cuándo, según el mapa del flujo** ([FLUJO.md §3](FLUJO.md)):

| Fase | Quién la ejecuta | En qué momento del cierre |
|------|------------------|---------------------------|
| **3.B** y **3.C** · seguro médico y COBEE | Responsable de Administración | **Paso 4.1**, durante la revisión con Gerencia, antes de dar los importes por buenos |
| **3.D** · transferencias | Responsable de Administración | **Paso 6**, ya ejecutados los pagos, con los archivos del banco |

**Lo que sigue sin decidir:** 🔍 si los informes son solo de lectura o pueden corregir, y qué se hace
cuando aparece una diferencia — ¿bloquea el cierre, o solo avisa?

---

## FASE 4 — Documentación y deuda técnica *(en curso)*

### Fase 4.A — Documentación

**El problema y el diseño**

- [x] **`docs/problem.md`** — enunciado del problema y *Jobs To Be Done*: contexto y escala,
  situación de partida, los cinco roles ejecutores, la distinción captura/consolidación/ajuste,
  *job stories*, restricciones, anti-objetivos, supuestos y preguntas abiertas
- [x] **`CLAUDE.md`** — contexto del proyecto y convenciones para el trabajo asistido
- [ ] Completar la **línea de base** de `problem.md` §6: tiempo y errores del proceso **anterior**
      (sin ese dato no se puede demostrar cuánto ha mejorado el sistema)

**El SSD, verificado contra los Sheets reales**

- [x] **§6.1** — modelo de datos de `VAP_BBDD_Personas`: columnas reales de las 6 pestañas, catálogo
  de los 7 complementos, relación responsable↔concepto y estructura posicional de `Config`
- [x] **§6.2** — volumen real de `VAP_Carga_Datos_Mensuales`: 1.724 registros, 41 envíos, 0 errores
- [x] **§6.3** — la premisa **"cada mes se parte de una hoja limpia"**, de la que depende que los
  volcados sean correctos y que no estaba escrita en ninguna parte
- [x] **§7.2** — estructura del formulario de horas extras, flujo del volcado y esquema de `LOG Volcado`
- [x] **§7.4** — estructura del formulario de profesores (72 cabeceras), acumulación campo a campo,
  comprobación de destino limpio e incidencias propias
- [x] **§9** — riesgos **R-09 … R-17**, con R-09 y R-10 cerrados por los ADR-0013 y 0014

**Decisiones y dudas**

- [x] **[ADR-0013](../docs_dev/adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)** — volcado de horas
  extras por periodo y bajo demanda
- [x] **[ADR-0014](../docs_dev/adr/0014-volcado-actividad-profesores-por-periodo.md)** — volcado de actividad de
  profesores por periodo, conservando la acumulación por campo
- [x] **[`docs/dudas/`](dudas/README_dudas.md)** — carpeta para cuestiones detectadas sin resolver, con
  plantilla e índice
- [x] **[DUDA-0001](dudas/0001-tres-libros-destino-de-los-volcados.md)** — los volcados escriben en
  tres libros distintos
- [x] **[Deuda técnica](dudas/deuda-tecnica.md)** — inventario de lo detectado en la revisión

**El repositorio**

- [x] **`README.md`** — estructura actualizada, aviso de que el repo no se despliega solo, y cómo se
  usa cada volcado
- [x] **`CHANGELOG.md`** — entrada del 17 agosto 2026 con lo añadido, cambiado, corregido y detectado
- [x] **[`docs/FLUJO.md`](FLUJO.md)** — mapa del flujo de datos y usuarios, textual y gráfico, del
  momento cero a la transferencia y el cierre. Resuelve
  [DT-16](dudas/deuda-tecnica.md#dt-16--falta-el-mapa-del-flujo-de-datos-y-usuarios)
- [x] **`FLUJO.md` v0.2 — revisado punto por punto** (18 ago 2026): recorrido completo hasta el pago,
  con una **quinta vía de captura** (el Gerente, que escribe directamente en el archivo de cálculo),
  el **pegado manual** entre los archivos de vinculación y `Gastos de Personal`, y un apartado nuevo
  —**el proceso mensual paso a paso**— con los archivos y scripts de cada paso, pensado como guía de
  trabajo. Sin cifras: los datos de operación se llevarán a otro sitio
- [x] **`docs/flujo_doc/`** — versión del mapa del flujo lista para revisar fuera del repositorio:
  el texto en un documento y los **ocho diagramas en archivos sueltos**, cada uno montado en su
  página (seis en A4, dos en A3) y con una versión en imagen para pantalla
- [x] **[`docs_dev/historias_usuarios.md`](../docs_dev/historias_usuarios.md)** — historias de
  usuario en 8 épicas, derivadas de las *job stories* y del mapa del flujo, con criterios de
  aceptación verificables, prioridad y estado. Las 11 *job stories* quedan cubiertas
- [x] **[`docs_dev/requisitos.md`](../docs_dev/requisitos.md)** — requisitos funcionales y no
  funcionales derivados de las historias, con matriz en los dos sentidos y estado de cumplimiento.
  El [SSD §3](../docs_dev/SSD.md) pasa a ser un puntero: los 14 requisitos antiguos quedan absorbidos
- [x] **Confrontación de historias y requisitos con el SSD y los ADR**: los 14 ADR aceptados tienen
  requisito; se corrigieron un riesgo que era un requisito (R-09) y un requisito que solo protegía la
  mitad del recorrido (RNF-02); y se añadieron al SSD tres riesgos de impacto alto que no constaban
  —**R-18, R-19 y R-20**— los tres sobre lo mismo: el dato sale del sistema y deja de haber rastro
- [ ] Validar `FLUJO.md` **con la Responsable de Administración** en reunión

### Fase 4.B — Deuda técnica

El inventario completo, con prioridad y esfuerzo estimado, está en
**[`dudas/deuda-tecnica.md`](dudas/deuda-tecnica.md)**. Los seis puntos que conviene atacar primero:

- [ ] **`toNumber_` corrompe decimales con punto** (DT-01): `"1234.56"` se lee como `123456` y
  alimenta la comparación que decide si una celda cambió
- [ ] **Escritura celda a celda en Export Neto/Bruto** (DT-02): riesgo de agotar el tiempo de
  ejecución al crecer el volumen
- [ ] **Confirmar `TALLER` vs `MECÁNICO`** (DT-08): el histórico de profesores mezcla cabeceras de
  dos versiones del formulario y las copias se añaden por posición
- [ ] **`PRUEBA_DATA` (`CON_SECR_07`) activo en producción** (DT-09)
- [x] ~~**Cuadrar los responsables** (DT-10)~~ → **explicado el 18 ago 2026**: los responsables
  reales son **4**; el quinto de alta es la **cuenta de pruebas** de quien mantiene el sistema, y por
  eso no tiene conceptos asignados. Queda pendiente decidir si esa cuenta se marca de algún modo para
  que no contamine las métricas de cobertura
- [ ] **Aclarar `Tipología_Profesor`** (DT-11): solo vale `1` o `2`, sin significado documentado
- [ ] **Los procesos que se ejecutan solos no dejan rastro consultable** (R-18): los dos scripts de
      sincronización de formularios escriben únicamente en el registro interno de la plataforma, que
      se borra. Son los que deciden **quién aparece en los formularios**, y nadie está delante cuando
      fallan *(programado en el Sprint 4 · OB-18)*

---

## FASE 5 — Acompañamiento del cierre *(planificada)*

Las cuatro fases anteriores mueven y comprueban **datos**. Esta acompaña el **proceso**: que se sepa
cuándo empieza, quién falta, por dónde va y si ha ido bien.

Sale del mapa del flujo ([FLUJO.md §3](FLUJO.md)), que identifica **nueve pasos en el cierre mensual
y cuatro sin construir** — y los que faltan no son los que mueven datos, sino justamente los que dan
control sobre el proceso.

> **Por qué es una fase y no una mejora suelta.** Los cuatro puntos comparten una misma carencia: el
> sistema **solo registra lo que llega, nunca lo que falta**. Resolver eso en un sitio y no en los
> demás no sirve de nada, porque el valor está en tener la foto completa del mes.

**Cómo se organiza el trabajo.** Lo que viene se separa en dos vías que avanzan a distinto ritmo:

| Vía | Qué incluye | De quién depende |
|-----|-------------|------------------|
| **En solitario** | Construir la Fase 5, y preparar los cruces automáticos **en cuanto lleguen** los documentos de ADESLAS, COBEE y el banco (Fases 3.B, 3.C y 3.D) | Solo del desarrollo |
| **Conjunta** | Revisar el mapa del flujo y las dudas abiertas **con la Responsable de Administración**, y validar el proceso paso a paso | De acordar reunión |

La vía conjunta **desbloquea** buena parte de la otra: sin saber qué es *Gastos de Personal* ni
cuáles son de verdad los archivos de destino, hay piezas de la Fase 5 que no se pueden terminar.

> **Y una pauta que atraviesa toda la fase:** automatizar el trabajo, **no la decisión de hacerlo**.
> Nada de lo que se construya aquí debe dispararse solo — prepara, muestra y espera a que la
> Responsable de Administración confirme. Es el patrón que ya siguen los volcados, y el que hace que
> automatizar no se sienta como perder el control sobre datos sensibles
> ([problem.md §7](../docs_dev/problem.md)).

### Fase 5.A — Lanzamiento y avisos

- [ ] Que la Responsable de Administración **lance el proceso** del mes desde la webapp, y que al
      hacerlo indique **dos fechas**: la de tope para que todos hayan reportado, y la de entrega del
      documento final. La **fecha de lanzamiento la toma el sistema** automáticamente
- [ ] **Aviso automático** a responsables y secretarias de que el cierre ha comenzado, qué se espera
      de cada uno y **hasta cuándo**. El sistema ya envía correos en otros momentos: el mecanismo
      está probado
- [ ] Con esas tres fechas registradas, el proceso deja de depender de un acuerdo verbal: se puede
      avisar, recordar y **medir si hay retraso** mientras aún se puede corregir

### Fase 5.B — Seguimiento de lo reportado

- [ ] **Quién ha reportado y quién no**, actualizado durante los días de recogida
- [ ] Resolver el problema del denominador en horas extras y actividad: hoy *no haber enviado* y *no
      tener nada que reportar* son **indistinguibles**. Decidir si se pide una declaración explícita
      de "este mes no tengo nada" o se renuncia a medir la cobertura de esos dos colectivos
- [ ] Excluir del cómputo la **cuenta de pruebas** del responsable `5`, para que no falsee la medida

### Fase 5.C — Panel de coordinación del cierre

- [ ] Estado de cada uno de los **nueve pasos** del cierre: pendiente, lanzado, completado, con
      incidencias
- [ ] Deducir del registro lo que ya consta —volcados ejecutados, remesas recibidas— y pedir a mano
      solo lo que no deja rastro: el Excel pegado, la revisión hecha, el mes cerrado
- [ ] **Comentarios** por paso y por mes, para recoger lo que no funcionó y mejorarlo al siguiente
- [ ] Decidir de dónde lee el estado: los registros viven hoy en **cinco libros distintos**, y
      leerlos todos en cada carga es lento y frágil. Es la decisión de arquitectura de esta pieza y
      merece un ADR

### Fase 5.D — Medición del proceso e informes

Dónde viven a partir de ahora los datos de operación, que se han sacado de `problem.md` y de este
documento. Las cinco familias y su justificación están en
[problem.md §6.1](../docs_dev/problem.md).

**Recoger y guardar**

- [ ] **Volumen**: registros por concepto y responsable, personas cubiertas y **cuánto dato se
      genera por persona** — para dimensionar el trabajo real y ver si crece
- [ ] **Ejecución**: qué se lanzó, cuándo, con qué resultado y cuántas incidencias
- [ ] **Cobertura**: cuántas fuentes reportaron de las esperadas y quién faltó — el único indicador
      que mide **lo que no llegó**, y hoy no existe
- [ ] **Puntualidad**: cada paso frente a las fechas que se fijaron en 5.A
- [ ] **Valor**: tiempo dedicado al cierre, errores evitados y **descuadres detectados** entre lo
      calculado y lo pagado
- [ ] Decidir **dónde se almacena** el histórico, para que comparar periodos no dependa de que
      nadie haya sobrescrito una hoja

**Informes**

- [ ] **Mensual** — ¿el cierre ha ido bien y está completo? Detalle accionable para la Responsable
      de Administración: qué falta, qué falló, qué hay que perseguir
- [ ] **Trimestral** — ¿qué está **variando**? Es donde se ven las tendencias que un mes suelto
      esconde
- [ ] **Anual** — cuánto ha movido el sistema y qué ha ahorrado
- [ ] Que cada destinatario reciba lo suyo y no el mismo informe: **Administración** el detalle del
      mes, **Data** el dato en bruto y comparable, **Gerencia** el resumen y la tendencia

> ⚠️ **Que quede escrito qué mide cada indicador y qué no.** Que el mecanismo de reporte no falle no
> significa que los importes sean correctos: un dato erróneo bien formado se registra sin incidencia.
> **Un panel en verde puede convivir con una nómina mal calculada.** Sin esa advertencia al lado, la
> medición da una falsa sensación de seguridad, que es peor que no medir.

---

## Mejoras propuestas (backlog)

- **Registro de actividad de profesores:** destino con una fila por (profesor, mes) para
  histórico mensual; validar que el mes elegido coincide con el año de la marca temporal; hoja
  de auditoría de cambios (ver [ADR-0009](../docs_dev/adr/0009-acumular-respuestas-por-mes-y-anio.md)).
- **Aviso de volcado pendiente:** los volcados ya no son automáticos
  ([R-09](../docs_dev/SSD.md#9-riesgos-y-limitaciones)); evaluar un recordatorio si un periodo con respuestas
  no se ha exportado.
- **Sincronización repo ↔ GAS:** evaluar `clasp` para eliminar el copiar y pegar manual
  ([R-13](../docs_dev/SSD.md#9-riesgos-y-limitaciones)).
