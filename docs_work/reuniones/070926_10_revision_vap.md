# Revisión VAP — reunión 10 · 7 septiembre 2026

| | |
|---|---|
| **Reunión nº** | 10 |
| **Fecha** | 7 septiembre 2026 |
| **Con** | *(pendiente de anotar)* |
| **Estado** | 🟡 **Acta en curso** · recogiendo lo tratado |
| **Código** | 🟢 **Modificado** en el repo · ⚠️ **sin desplegar** en Apps Script |
| **Relación** | Cubre temas que el guion de [`2026-09-07-revision-del-proceso.md`](2026-09-07-revision-del-proceso.md) no llegó a abordar |

## 🟢 Estado del código: MODIFICADO — 7 septiembre 2026

| | |
|---|---|
| **`VAP_script_export_SAGE.gs`** | **Modificado.** De 602 a 502 líneas. El menú pasa de **3 acciones a 2**; la acción `Calculo Salario Base` y todo lo suyo, eliminado. `node --check` correcto |
| **El salario base** | Ya no se calcula. `VINC_FIELDS` lo lee de la cabecera **`Líquido_a_percibir`** (columna M), donde antes leía `salario_base_bruto` (columna S) |
| **En producción** | ⏸ **NO, y a propósito.** Nada de esta tanda se despliega hasta estar seguros — ver *[Cómo trabajamos](#cómo-trabajamos-en-esta-tanda)* |

> ⏸ **Vaciar la columna S** de `bbdd_export_sage_laboral` (**C4**) va con el despliegue, no antes:
> mientras el script viejo siga en producción, es él quien la escribe.

---

> **Este documento es el registro de trabajo de esta tanda de cambios, no solo el acta.** Todo lo que
> quede por hacer —código, documentación o preguntas sin respuesta— se apunta aquí en el momento en
> que aparece. **Nada se lleva en la cabeza y nada se da por sabido.**

### Cómo trabajamos en esta tanda

**Nada pasa a producción hasta estar seguros.** Esto son notas de trabajo: se decide, se escribe y
—cuando el cambio es seguro y no depende de nada pendiente— **se aplica en el repositorio**. El paso
a producción es una decisión aparte, explícita, y se toma al final.

Puede hacerse así porque **este repositorio no se despliega solo**: no hay `clasp` ni CI, el código
se copia y pega a mano en los proyectos de Apps Script. Editar un archivo aquí **no cambia nada en
producción**, lo que convierte al repo en un banco de pruebas seguro.

| | Se puede hacer ya | Espera |
|---|---|---|
| **Documentación** (ADR, dudas, índices, este registro) | ✅ Siempre | — |
| **Código en el repo**, si el cambio está completo y verificado | ✅ Sí | — |
| **Código en el repo**, si depende de un dato que falta | — | ⏸ Hasta tenerlo |
| **Copiar y pegar en Apps Script** | — | ⏸ **Hasta el final, y con visto bueno** |
| **Tocar los Sheets** (vaciar columnas, borrar libros) | — | ⏸ Va con el despliegue |

> **Por qué importa el orden.** El sistema mueve nóminas reales. Un script a medias en producción no
> falla en pruebas: falla en el pago del mes.

### Cómo se usa

1. Cada decisión que salga se anota en **[Qué salió de aquí](#qué-salió-de-aquí)** y se desarrolla en
   **[Lo tratado](#lo-tratado)**.
2. Todo lo que esa decisión deje pendiente entra en **[Pendientes](#pendientes)**, en la tabla que le
   toque, con la decisión de la que viene.
3. Cuando llegue el momento de tocar el código o de actualizar la documentación de referencia, **se
   trabaja leyendo esas tablas**, no la memoria ni la conversación.
4. Una fila solo pasa a 🟢 cuando está hecha **y verificada**.

**Estados:** 🔴 pendiente · 🟡 en curso · 🟢 hecho · ⚪ bloqueado por una respuesta que falta · ⏸ **en espera deliberada** (se puede hacer, pero se hace al final)

---

## Qué salió de aquí

1. **El script SAGE deja de calcular el salario base.** La acción `Calculo Salario Base` se elimina:
   el dato ya viene de SAGE y la fórmula no era correcta.
2. **Se pasa de cinco libros a tres.** Los dos de Vinculación —netos y brutos— se eliminan y se
   sustituyen por uno solo, `Vinculación gastos personal 2026 completo`.

---

## Lo tratado

### 1 · Eliminar el cálculo del salario base del script SAGE

| | |
|---|---|
| **Decisión** | Quitar la acción `Calculo Salario Base` de `VAP_script_export_SAGE.gs`. El script pasa de tres acciones a dos |
| **Motivo** | Dos, y cualquiera de los dos basta: **el dato ya viene de origen** —SAGE lo trae en la **columna M**— y **la fórmula no era correcta** |
| **Afecta a** | [DUDA-0002](../dudas/0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md) · [SSD §7.5](../../docs_solutions/docs_design/SSD.md) · [FLUJO §6](../flujo_doc/FLUJO.md) · ADR nuevo |

**Qué se elimina:** la acción del menú, `calcularSalarioBaseBruto` / `calcularSalarioBaseBruto_`, las
cuatro constantes de cabecera que solo ella usa (`COL_TOTAL_BRUTO`, `COL_SEGURO_MEDICO`,
`COL_COBE_TRANSPORTE`, `COL_COBE_ALIMENTACION`) y `RESULT_COL` / `RESULT_HEADER`.

**La columna S deja de generarse.** Ya no se escribe ni su cabecera ni sus valores.

#### Lo que esto arrastra — 🟩 comprobado en el código

**El salario base pasa a leerse de la columna M.** `VINC_FIELDS` apunta hoy a la cabecera
`salario_base_bruto`, que es la que escribía la acción eliminada. Si se borra la acción sin repuntar
esa entrada, `volcarVinculacion_` lanza un error al no encontrar la cabecera y **Export Neto y Export
Bruto dejan de escribir nada** — no es que se salten el campo, es que abortan
([VAP_script_export_SAGE.gs:296-300](../../docs_solutions/src/scripts_generales/VAP_script_export_SAGE.gs)).

> 🔍 **Pendiente:** cómo se llama la **cabecera de la columna M** en `bbdd_export_sage_laboral`. El
> script localiza el origen por nombre, no por letra, así que sin ese nombre no se puede hacer el
> cambio. No consta en el SSD ni en el FLUJO: el inventario de columnas del origen nunca se escribió.

**Lo que ha estado llegando a nómina no era el dato de SAGE.** La acción escribía la columna S por
**posición fija** (`RESULT_COL = 19`), cabecera incluida, sobrescribiendo lo que hubiera. Como el
salario base bueno viene en la M, lo que ha viajado a `L · Salario Base` de los dos libros de
Vinculación —y de ahí a *Gastos de Personal*— es el **valor calculado con la fórmula incorrecta**.

> 🔍 **Sin decidir:** desde cuándo ocurre y si hay que revisar meses ya cerrados. Se agrava con lo
> que [FLUJO §6](../flujo_doc/FLUJO.md) ya recogía: hay bastantes más ejecuciones de *Export Neto* y *Export
> Bruto* que de *Calculo Salario Base*, así que unos meses llevan el valor calculado y otros el del
> mes anterior.

**Desaparece el orden de ejecución.** Hoy el proceso mensual tiene un paso 3 (*Calculo Salario Base*)
que debe ir antes del 4 y el 5, y [FLUJO §6](../flujo_doc/FLUJO.md) avisa de que no siempre se respeta. Con la
acción fuera, esa restricción se acaba: el proceso pasa de nueve a ocho pasos en ese tramo.

**La columna S del origen queda muerta.** Conserva la cabecera y los valores de la última ejecución.
Conviene vaciarla a mano para que nadie la lea como buena — no es un cambio de código.


### 2 · De cinco libros a tres

| | |
|---|---|
| **Decisión** | Un **único libro de Vinculación** como destino de todos los volcados. Netos y brutos desaparecen |
| **Responde a** | [DUDA-0001](../dudas/0001-RESUELTA-tres-libros-destino-de-los-volcados.md), que queda **cerrada** |
| **Registrada en** | [ADR-0016](../../docs_solutions/docs_design/adr/0016-un-unico-libro-de-vinculacion.md) |

**Hoy** — cinco libros:

| Libro | ID | Qué recibe |
|---|---|---|
| `export sage laboral` | `19edOEgwdT-Ab-0nEWRn4nrtN6IxxRc4CYu1XW4u0454` | Origen: el Excel de SAGE, pegado a mano |
| `Vinculacion gastos personal 2026 netos` | `1HDwgihfz91atsLE99Qu0k3kTyBKpo3Iu3SaUtVGMPTs` | Los 8 campos de nómina |
| `Vinculación gastos personal 2026 brutos` | `1eTVPws0NVRMIlXgZYsUZANdfMyFYQtDlEEK5ujFt04A` | Los **mismos** 8 campos |
| `Vinculación gastos personal 2026 completo` | 🔍 *(pendiente)* | — |
| `Gastos de Personal 2026` | 🔍 *(pendiente)* | El cálculo final. **Excel, fuera del sistema** |

**Objetivo** — tres libros:

```
export sage laboral  ──►  Vinculación gastos personal 2026 completo  ──🟨──►  Gastos de Personal 2026
                                        ▲
              horas extras + actividad de profesores
```

**`Gastos de Personal 2026` no se vincula a nada.** Es el punto final de almacenamiento de los datos
ya calculados, y el trasvase hasta él **sigue siendo manual** por ahora.

#### Lo que esto arrastra

**Captura y consolidación son capas distintas.** Lo de arriba son los libros de **consolidación**;
por debajo hay libros de **captura**, que reciben datos de formularios u otros sistemas y **no entran
en esta reorganización**:

| Capa | Libro | ID |
|---|---|---|
| Captura | Respuestas de `EXTRA SECRETARIAS 2026` | `1fW2bl9cVnDrTQei26S2qi4iZhT2OZnp-kNeFmVX5m0w` |
| Captura | Respuestas de `REGISTRO DE ACTIVIDAD DE PROFESORES 26` | `1qRUyzN1GZ4kUI7Rd5jrVPpZ0gTYXfFFz1o2f9sXVhMk` |
| Consolidación | `1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc` | 🔍 ver abajo |

> 🔍 **Un libro sin identificar: `1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc`.** No está en la lista
> de cinco, pero **no es un libro de captura**: los dos volcados le escriben, y los scripts lo llaman
> literalmente `"VINCULACIÓN GASTOS PERSONAL"`. Recibe horas extras (`AE`, `AH`) y actividad de
> profesores (`AC..CN`), y tiene libres justo las columnas de nómina (`G`…`T`).
>
> **Todo apunta a que es el "completo"** — pero hay que confirmarlo abriéndolo:
> `https://docs.google.com/spreadsheets/d/1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc/`
>
> Si lo es, **ya tenemos el ID de P6** y la migración se reduce a mover el script de SAGE: los otros
> dos volcados ya apuntarían bien. Si no lo es, hay un sexto libro y hay que repuntar cuatro scripts.
> Ver **P8**.

> 🔍 **Puede que sobre una acción de export.** *Export Neto* y *Export Bruto* vuelcan **los mismos 8
> campos con los mismos valores**. Con un destino único escribirían lo mismo en el mismo sitio: o
> sobra una, o la diferencia entre neto y bruto está en columnas que el script no toca y hay que
> ponerla por escrito — ver **P9**.

**Los dos libros que se eliminan hay que conservarlos** hasta cerrar el ejercicio: son el histórico
de todo lo volcado en 2026.

---

## Pendientes

Tres tablas: lo que hay que **tocar en el código**, lo que hay que **escribir en la documentación** y
lo que hay que **preguntar**. Se leen de arriba abajo cuando toque hacer cada cosa.

### A · Código

| # | Qué | Dónde | De | Estado |
|---|-----|-------|----|--------|
| C1 | Eliminar la acción `Calculo Salario Base`: ítem de menú, `calcularSalarioBaseBruto` / `calcularSalarioBaseBruto_`, las 4 constantes `COL_*` que solo ella usa y `RESULT_COL` / `RESULT_HEADER` | [`VAP_script_export_SAGE.gs`](../../docs_solutions/src/scripts_generales/VAP_script_export_SAGE.gs) | D1 | 🟢 |
| C2 | Repuntar `VINC_FIELDS` a la cabecera de la columna M: `Líquido_a_percibir` | Ídem, línea 63 | D1 | 🟢 |
| C3 | Actualizar la cabecera del archivo: el menú pasa de 3 acciones a 2, y desaparece la nota de "ejecutar Calculo Salario Base ANTES". Añadido un apartado **HISTÓRICO** con el porqué | Ídem, líneas 1-36 | D1 | 🟢 |
| C4 | Vaciar a mano la columna **S** de `bbdd_export_sage_laboral`, que queda muerta con cabecera y datos viejos | El Sheet, no el código | D1 | ⏸ Va con **C5** |
| C5 | **Desplegar**: copiar y pegar el archivo en el proyecto Apps Script de `VAP_Export_Sage`. Producción sigue con las 3 acciones hasta que se haga | Proyecto GAS | D1 | ⏸ **Al final, con visto bueno** |
| C6 | Dos funciones quedan **sin uso** tras la limpieza: `aNumero_` y `normalizarCabecera_`. Solo las llamaba la acción eliminada. No molestan, pero sobran | Ídem | D1 | 🔴 A decidir |
| C7 | Repuntar `TARGET_SPREADSHEET_ID` al libro **completo** en los scripts que corresponda. ⚠️ **Verificar antes de cambiar:** apuntar al libro equivocado manda la actividad de ~400 personas donde no debe | Volcados de horas extras y profesores · `VAP_script_export_SAGE.gs` | D2 | ⚪ Bloqueado por **P6** y **P8** |
| C8 | Unificar o no las acciones *Export Neto* / *Export Bruto*, según se resuelva **P9** | [`VAP_script_export_SAGE.gs`](../../docs_solutions/src/scripts_generales/VAP_script_export_SAGE.gs) | D2 | ⚪ Bloqueado por **P9** |
| C9 | Conservar los libros de netos y brutos hasta cerrar el ejercicio — **no borrarlos** al migrar | Drive | D2 | ⏸ Va con el despliegue |

### B · Documentación

Las filas 🔴 de esta tabla **se saldan todas juntas** cuando se toque el código, no antes: SSD y FLUJO
describen lo que el sistema *hace*, y adelantarlos es escribir algo falso en la referencia.

| # | Qué | Dónde | De | Estado |
|---|-----|-------|----|--------|
| B1 | La decisión, con su porqué y sus consecuencias | [ADR-0015](../../docs_solutions/docs_design/adr/0015-eliminar-calculo-salario-base-del-script-sage.md) | D1 | 🟢 |
| B2 | Cierre de la duda del signo, renombrada a `RESUELTA` | [DUDA-0002](../dudas/0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md) | D1 | 🟢 |
| B3 | Índices de dudas y de ADR | [README_dudas](../dudas/README_dudas.md) · [README_ADR](../../docs_solutions/docs_design/adr/README_ADR.md) | D1 | 🟢 |
| B4 | El menú pasa de 3 acciones a 2, y el mapeo del salario base cambia de origen | [SSD §7.5](../../docs_solutions/docs_design/SSD.md) | D1 | 🔴 Con el código |
| B5 | **12 puntos**, tres de ellos diagramas mermaid: vista general (§1), salario base (§6), secuencia (§9), tabla del proceso mensual (§7) y la nota del orden de pasos | [FLUJO.md](../flujo_doc/FLUJO.md) | D1 | 🔴 Con el código |
| B6 | Regenerar los diagramas afectados: **D1_vista_general**, **D3_proceso_paso_a_paso**, **D6_scripts_de_sage** (PDF y PNG). El `.docx` ya no está en el repo | [flujo_doc/](../flujo_doc/) | D1 | 🔴 Con el código |
| B7 | El requisito que materializa ADR-0015 — hoy es el único ADR sin requisito | [requisitos.md §5](../../docs_discovery/requisitos_funcionales.md) | D1 | 🔴 |
| B8 | Entrada del cambio | [CHANGELOG.md](../../CHANGELOG.md) | D1 | 🔴 Con el código |
| B9 | La decisión de unificar libros | [ADR-0016](../../docs_solutions/docs_design/adr/0016-un-unico-libro-de-vinculacion.md) | D2 | 🟢 |
| B10 | Cierre de la duda de los tres libros, renombrada a `RESUELTA` | [DUDA-0001](../dudas/0001-RESUELTA-tres-libros-destino-de-los-volcados.md) | D2 | 🟢 |
| B11 | El mapa de libros: **inventario de spreadsheets** (§10), destinos de los volcados (§6.3) y diagramas del flujo | [SSD](../../docs_solutions/docs_design/SSD.md) · [FLUJO](../flujo_doc/FLUJO.md) · [flujo_doc/](../flujo_doc/) | D2 | 🔴 Con el código |

### C · Preguntas abiertas

| # | Qué falta saber | A quién | Bloquea | Estado |
|---|-----------------|---------|---------|--------|
| P1 | **Cómo se llama la cabecera de la columna M** en `bbdd_export_sage_laboral` | — | — | 🟢 **`Líquido_a_percibir`** |
| P6 | **El ID de `Vinculación gastos personal 2026 completo`.** Sin él no se puede repuntar ningún script | Responsable de Administración | **C7**, y con él toda la migración | ⚪ Depende de **P8** |
| P7 | **El ID de `Gastos de Personal 2026`** — informativo: no se vincula, pero conviene tenerlo escrito | Responsable de Administración | Nada | 🔴 |
| P8 | **¿Qué es `1qK3…o8kc`?** Los scripts lo llaman `"VINCULACIÓN GASTOS PERSONAL"` y le vuelcan horas extras y actividad, pero no está en la lista de cinco. **No es captura: es consolidación.** ¿Es el "completo"? Decide si la migración toca **2 scripts o 4**, y puede resolver también **P6** | Se comprueba abriendo el Sheet | **C7** · **P6** | ⚪ **Pedido acceso** 7 sep · sin permiso para abrirlo |
| P9 | **¿Sobra una acción de export?** Neto y Bruto vuelcan los mismos 8 campos con los mismos valores. Con un destino único, o sobra una o la diferencia está en columnas que el script no toca | Responsable de Administración · Gestor de nóminas | **C8** | 🔴 |
| P5 | ⚠️ **`Líquido_a_percibir` alimenta ahora dos destinos**: `L · Salario Base` y `T · Nomina NETO`. Las dos columnas de Vinculación reciben **el mismo valor**. Se aplicó así por indicación expresa en la reunión; conviene confirmarlo al ver el resultado del primer volcado | Responsable de Administración | Nada; el script funciona | 🔴 |
| P2 | **Si se revisan meses ya cerrados.** A `L · Salario Base` ha llegado el valor calculado con la fórmula incorrecta, no el de SAGE | Decisión de negocio | Nada; es alcance | 🔴 |
| P3 | **El signo de ADESLAS y COBEE en Vinculación** — las tres preguntas que la [DUDA-0002](../dudas/0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md) deja sin responder. Hoy viven dentro de una ficha marcada como resuelta; si se quieren a la vista, necesitan ficha propia | Gestor de nóminas | Saber si los importes de Vinculación tienen el signo correcto | 🔴 |
| P4 | **El inventario de columnas de `bbdd_export_sage_laboral`** no está escrito en ninguna parte — ni SSD ni FLUJO: solo listan los 8 campos que viajan. Es justo lo que ha faltado en **P1** | Se levanta del Sheet | Nada hoy; volverá a faltar | 🔴 |

> ⚪ **El camino crítico pasa por un permiso.** `P8` es hoy lo que bloquea toda la migración de libros
> (**D2**): sin abrir `1qK3…o8kc` no se sabe si es el "completo", y sin saberlo no se puede repuntar
> ningún script. **Acceso solicitado el 7 de septiembre de 2026.** Mientras tanto, `D2` no avanza —
> `D1` sí está aplicada en el repositorio y no depende de esto.

---

## Decisiones de esta reunión

| # | Decisión | Registrada en |
|---|----------|---------------|
| **D1** | El script SAGE deja de calcular el salario base | [ADR-0015](../../docs_solutions/docs_design/adr/0015-eliminar-calculo-salario-base-del-script-sage.md) |
| **D2** | De cinco libros a tres: un único libro de Vinculación | [ADR-0016](../../docs_solutions/docs_design/adr/0016-un-unico-libro-de-vinculacion.md) |
