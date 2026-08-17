# ROADMAP — Sistema VAP

Fases del proyecto y estado de avance. El detalle cronológico de cada cambio está en
[`../CHANGELOG.md`](../CHANGELOG.md); el diseño del sistema, en [`SSD.md`](SSD.md); las
decisiones, en [`adr/`](adr/README_ADR.md); las cuestiones sin resolver y la deuda técnica, en
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
| **3 — Nóminas y verificación** | **Todo el personal** | Salario base, volcado a Vinculación y controles de cuadre | 🔵 **En curso** | 3 / 13 |
| **3.A** · Salario base y volcado | | Cálculo del salario base y export Neto/Bruto | 🔵 En curso | 3 / 4 |
| **3.B** · Verificación del seguro médico | | Contrastar `SEGURO_MEDICO` con la póliza real | ⚪ Planificada | 0 / 3 |
| **3.C** · Verificación de COBEE | | Contrastar comida y transporte con lo que corresponde | ⚪ Planificada | 0 / 3 |
| **3.D** · Verificación de transferencias | | Cuadrar lo transferido con lo calculado | ⚪ Planificada | 0 / 3 |
| **4 — Documentación y deuda técnica** | Transversal | Poner por escrito el sistema y saldar la deuda | 🔵 **En curso** | 15 / 23 |
| **4.A** · Documentación | | Problema, diseño verificado, decisiones y dudas | 🔵 En curso | 15 / 17 |
| **4.B** · Deuda técnica | | Correcciones detectadas en la revisión | 🔴 Sin empezar | 0 / 6 |

**Total: 40 de 61 puntos completados.**

**Estados:** ✅ completada · 🔵 en curso · 🔴 sin empezar · ⚪ planificada, sin definir del todo

> **Por qué la Fase 3 es transversal.** El salario base y su verificación no son un asunto de
> secretarias ni de profesores: afectan a **todo el personal**, incluido el que cobra un **sueldo
> fijo** y no aparece en ninguno de los dos colectivos. En `bbdd_export_sage_laboral` hay **501
> empleados**, frente a los ~400 que gestiona el sistema VAP por complementos. Por eso deja de
> colgar de la Fase 2 y pasa a ser una fase propia.
>
> Además cambia de naturaleza a mitad de camino: **3.A mueve datos** (calcular y volcar), mientras
> que **3.B, 3.C y 3.D los comprueban**. Es la primera vez que el sistema verifica en lugar de
> transportar.

---

## FASE 1 — Secretarias *(en producción)*

### Fase 1.A — Complementos Salariales

- [x] `VAP_BBDD_Personas` como fuente única de verdad del personal activo ([ADR-0001](adr/0001-google-sheets-como-bbdd-central.md), [ADR-0006](adr/0006-separar-bbdd-de-personal.md))
- [x] Webapp de reporte masivo con lista dinámica de secretarias activas ([ADR-0002](adr/0002-webapp-propia-para-reporte-de-complementos.md))
- [x] Validación de que el responsable corresponde al complemento que reporta ([ADR-0003](adr/0003-responsable-asignado-a-complemento-en-bbdd.md))
- [x] Gestión de envíos y correcciones por mes/año ([ADR-0005](adr/0005-gestion-de-envios-por-mes-y-anio.md))
- [x] Email de confirmación al responsable y aviso al gestor en cada remesa
- [x] Webapp de consulta de envíos realizados
- [x] Exportación mensual a demanda de datos fusionados por secretaria y concepto

### Fase 1.B — Horas Extras

- [x] Vinculación del formulario `EXTRA SECRETARIAS 2026` a `VAP_Secretarias` (lista dinámica) ([ADR-0004](adr/0004-formulario-horas-extras-vinculado-a-bbdd.md))
- [x] ~~Volcado automático (`onFormSubmit`)~~ → sustituido por volcado **bajo demanda por periodo**
- [x] Volcado acotado al mes (col. `MES` + año de la marca temporal), con desplegable de periodo,
  informe previo y confirmación ([ADR-0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md))
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
- [x] Sincronización automática del desplegable "SELECCIONE EL PROFESOR" con profesores activos ([ADR-0008](adr/0008-reutilizar-patron-de-sincronizacion.md))
- [x] Escritura automática del `ID_Profesor` en las respuestas
- [x] Despliegue en proyecto Apps Script independiente ([ADR-0007](adr/0007-proyectos-apps-script-independientes.md))

### Fase 2.B — Volcado de actividad *(en curso)*

- [x] Acumulación **campo a campo** por (profesor + mes + año) ([ADR-0009](adr/0009-acumular-respuestas-por-mes-y-anio.md)):
  varias secretarias reportan partes distintas de la actividad del mismo profesor
- [x] Volcado **bajo demanda por periodo**, con desplegable de mes, informe previo y confirmación
  ([ADR-0014](adr/0014-volcado-actividad-profesores-por-periodo.md)) — antes solo se podía volcar el
  mes más reciente
- [x] Copia automática al histórico (`Hoja 1`); la hoja de respuestas no se modifica
- [x] Auditoría en `LOG Volcado`, con el nombre real de cada una de las 64 columnas
- [x] Comprobación de que el destino está limpio antes de escribir *(en ambos volcados: 1.B y 2.B)*
- [ ] Identificar todas las fuentes de datos actuales de profesores y su estructura
- [ ] Definir complementos salariales específicos del colectivo
- [ ] Evaluar reutilización de la webapp de secretarias o necesidad de versión propia

---

## FASE 3 — Nóminas y verificación *(en curso · transversal)*

Afecta a **todo el personal**: secretarias, profesores y quienes cobran un **sueldo fijo** sin
complementos. El origen es `bbdd_export_sage_laboral`, con **501 empleados**.

### Fase 3.A — Salario base y volcado a Vinculación

- [x] Acción **Calculo Salario Base** sobre la exportación SAGE laboral ([ADR-0010](adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md)):
  `salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|`
- [x] Acciones **Export Neto** / **Export Bruto** a las hojas de Vinculación ([ADR-0011](adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md))
- [x] Auditoría centralizada `logs` / `errores` correlacionada por `Run ID` ([ADR-0012](adr/0012-auditoria-centralizada-logs-y-errores.md))
- [ ] Completar el flujo de volcado hacia el cálculo final de nóminas
      *(bloqueado por [DUDA-0001](dudas/0001-tres-libros-destino-de-los-volcados.md): los volcados
      escriben en tres libros distintos y no consta cuál alimenta el cálculo)*

### Fase 3.B — Verificación del seguro médico

Contrastar el `SEGURO_MEDICO` (col. G del origen → *ADESLAS* en Vinculación) con quién debe tenerlo
realmente contratado.

- [ ] Definir la **fuente de contraste**: de dónde sale la relación fiable de asegurados y su importe
- [ ] Detectar diferencias por persona: importe distinto del esperado, alta sin cobertura, cobertura
      sin alta
- [ ] Informe de diferencias antes del cierre, con la misma pauta que los volcados: revisar primero,
      escribir después

### Fase 3.C — Verificación de COBEE

Igual para los dos conceptos de COBEE: `COBE_Alimentacion` (→ *COBEE COMIDA*) y `COBE_Transporte`
(→ *COBEE TRANSPORTE*).

- [ ] Definir la **fuente de contraste** de cada uno
- [ ] Detectar diferencias por persona y por concepto
- [ ] Informe de diferencias antes del cierre

> **3.B y 3.C no son verificaciones cosméticas.** Los tres conceptos entran en la fórmula del salario
> base, así que un error en cualquiera de ellos **se propaga al salario base** de esa persona.

### Fase 3.D — Verificación de transferencias

El control de cierre: comprobar que **lo efectivamente transferido coincide con lo calculado**.

- [ ] Definir el **origen del dato de lo transferido** (remesa bancaria, extracto, fichero de pagos)
      y cómo se cruza con cada persona
- [ ] Contrastar contra el `Líquido_a_percibir` calculado, con tolerancia definida para redondeos
- [ ] Informe de descuadres: pagado de más, pagado de menos, persona pagada sin cálculo, persona
      calculada sin pago

> Es la única comprobación que mira **el resultado final** en lugar de un dato intermedio. Cierra el
> circuito entre lo que el sistema calcula y lo que la persona recibe — hoy nadie verifica ese último
> tramo de forma sistemática.

**Pendiente de definir en 3.B, 3.C y 3.D:** 🔍 quién ejecuta cada verificación y en qué momento del
cierre; si los informes son solo de lectura o pueden corregir; y qué se hace cuando aparece una
diferencia (¿bloquea el cierre, o solo avisa?).

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

- [x] **[ADR-0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)** — volcado de horas
  extras por periodo y bajo demanda
- [x] **[ADR-0014](adr/0014-volcado-actividad-profesores-por-periodo.md)** — volcado de actividad de
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
- [x] **[`docs/FLUJO.md`](FLUJO.md)** — mapa del flujo de datos y usuarios, textual y gráfico (9
  diagramas Mermaid), del momento cero al cálculo final. Resuelve
  [DT-16](dudas/deuda-tecnica.md#dt-16--falta-el-mapa-del-flujo-de-datos-y-usuarios); quedan 8 zonas
  oscuras señaladas

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
- [ ] **Cuadrar los responsables** (DT-10): 5 dados de alta, 4 con envíos, 6 mencionados; el
  responsable `5` no tiene conceptos asignados y sería rechazado al entrar
- [ ] **Aclarar `Tipología_Profesor`** (DT-11): solo vale `1` o `2`, sin significado documentado

---

## Mejoras propuestas (backlog)

- **Registro de actividad de profesores:** destino con una fila por (profesor, mes) para
  histórico mensual; validar que el mes elegido coincide con el año de la marca temporal; hoja
  de auditoría de cambios (ver [ADR-0009](adr/0009-acumular-respuestas-por-mes-y-anio.md)).
- **Aviso de volcado pendiente:** los volcados ya no son automáticos
  ([R-09](SSD.md#9-riesgos-y-limitaciones)); evaluar un recordatorio si un periodo con respuestas
  no se ha exportado.
- **Sincronización repo ↔ GAS:** evaluar `clasp` para eliminar el copiar y pegar manual
  ([R-13](SSD.md#9-riesgos-y-limitaciones)).
