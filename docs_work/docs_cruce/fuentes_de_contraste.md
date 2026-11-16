# Las tres fuentes de contraste: qué traen y cómo se cruzan con el libro de gastos de personal

| | |
|---|---|
| **Versión** | 0.2 — BORRADOR |
| **Fecha** | 16 noviembre 2026 |
| **Se apoya en** | [DUDA-0004](../dudas/0004-formato-de-las-tres-fuentes-de-contraste.md) · [DUDA-0005](../dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md) · [DUDA-0006](../dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) |
| **Requisitos** | RF-31 … RF-35 · RF-72 … RF-89 · RNF-18 … RNF-20 · HU-23 · HU-24 · HU-25 · HU-42 … HU-48 |

> **Este documento describe formatos y cifras agregadas. No contiene datos de personas** (nombres, DNI,
> IBAN, importes nominativos): los ficheros reales viven en esta carpeta **solo en local** y no entran en
> el repositorio ([CLAUDE.md, segunda regla](../../CLAUDE.md)). Todo lo que sigue sale de leerlos con un
> lector de solo lectura; no se ha copiado ninguna fila.

## 1. Para qué sirve

La **webapp de administración** (Sprint 4) permitirá a la Responsable de Administración **subir los tres
ficheros** que llegan de fuera —ADESLAS, COBEE y el banco— y **comprobar que las cantidades del libro de
gastos de personal son correctas**. Son **dos comprobaciones distintas**:

| | Qué se compara | Contra qué | Requisito |
|---|---|---|---|
| **A · Lo calculado** | Las columnas **ADESLAS** y **COBEE** (comida, transporte) del libro | Lo que dicen los ficheros de **ADESLAS** y **COBEE** | RF-31 · RF-32 |
| **B · Lo pagado** | Los importes **ingresados** (la nómina que se paga) | Las transferencias del **banco** | RF-33 |

En las dos el informe es **de solo lectura** (RF-35) y **distingue los tipos de diferencia** (RF-34): una
persona que no se puede cruzar **se reporta como tal, nunca se descarta ni se da por buena en silencio**.

> **A confirmar — ¿qué libro es «gastos de personal»?** Hay dos con nombre parecido y no son lo mismo
> ([ADR-0016](../../docs_solutions/docs_design/adr/0016-un-unico-libro-de-vinculacion.md)):
> **`VINCULACIÓN GASTOS PERSONAL 2026`**, que **recibe los volcados** y tiene las columnas `ADESLAS`,
> `COBEE COMIDA`, `COBEE TRANSPORTE`, `Nomina NETO` y `EFECTIVO` con el `DNI` como clave
> ([DUDA-0006](../dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md)), y
> **`Gastos de Personal 2026`**, el archivo de cálculo final, que **no está vinculado a nada** y al que se
> traslada a mano. **Este documento asume el primero**, porque es el que tiene las columnas de contraste.
> Si la intención es contrastar contra el segundo, cambian las columnas y la clave.

## 2. Resumen de las tres fuentes

| | **ADESLAS** | **COBEE** | **Banco** |
|---|---|---|---|
| **Qué es** | Relación al contratante (informe `MCCI0552`) | Informe de ajustes de nómina (`payroll-report-adjustments`) | Listado de pagos (transferencias) |
| **Formato** | `.xls` (Excel antiguo) | `.csv` · `;` · UTF-8 | `.xls` (Excel antiguo) |
| **Una fila por…** | **Asegurado** (no empleado) | **Empleado** | **Pago** |
| **Cómo identifica a la persona** | `NIF` (y `Certif.` para agrupar) | **`DNI` propio**, más `Empleado` y `Email` | **Solo nombre e IBAN** |
| **¿Cruza por DNI con el libro?** | 🟡 Sí, **tras agrupar por certificado** | 🟢 Sí, directo | 🔴 No (ver [DUDA-0005](../dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md)) |
| **Periodo en el nombre o cabecera** | `2026/08` (año/mes del recibo) | `07_2026` | Fecha de pago `31-08-2026` |
| **Comprobación** | A · columna `ADESLAS` | A · `COBEE COMIDA` y `COBEE TRANSPORTE` | B · nómina pagada |

> **Los tres ficheros de la muestra no son del mismo mes** (julio, agosto y fin de agosto). Es un hecho
> de la muestra, pero el diseño debe darle respuesta: **la webapp tiene que pedir o detectar el periodo
> de cada fichero y no comparar si no coincide con el del libro** (ver §6).

## 3. ADESLAS

**Estructura del `.xls`** (una hoja, `Informe Relacion al Contratante`):

- **12 filas de preámbulo** (compañía, informe, fecha y hora de generación, `Año / Mes`, número de
  recibo, título) antes de la cabecera. **Hay que localizar la cabecera buscando `Apellidos y Nombre`**,
  no por posición fija.
- **Cabecera de 18 columnas:** `Delegación`, `Certif.`, `Parentesco`, `Nº Orden`, `Apellidos y Nombre`,
  `Fecha de Nacimiento`, `NIF`, `Módulo`, `Fecha Alta`, `Fecha Baja`, `Prima Neta`,
  `Impuestos y Tasas`, `Prima Bruta`, `Nº Actos Copago`, `Importe Copago`, `Importe Total`,
  `Importe Total Certificado`, `Nº Referencia`.
- **Pie de totales:** `TOTAL SUBCOLECTIVO 01` y `TOTAL P. COLECTIVA`, con el importe en la última columna.
  **Son la comprobación de integridad del fichero:** la suma de `Importe Total` de las filas tiene que
  igualar el total del pie.
- **`Delegación`** solo viene rellena en pocas filas (una por bloque): se arrastra hacia abajo.
- **Tipos:** `Fecha Alta` es una **fecha real de Excel**; `Fecha de Nacimiento` es **texto**; los importes
  son números con decimales; `Certif.` y `Nº Orden` llegan como número.

**La muestra, en cifras** (agregadas):

| | |
|---|---|
| Filas de asegurados | 106 |
| Titulares · familiares | 71 · 35 (18 hijos/as, 12 cónyuges, 3 «otros», 2 parejas de hecho) |
| Pólizas · módulos | 1 subcolectivo · 1 módulo (`ADESLAS COMPLETA`) |
| Prima por asegurado | **uniforme**: 56,23 neta + 0,10 impuestos = **56,33 €** |
| Total del fichero | 5.970,98 € (= total subcolectivo = total póliza colectiva) |
| `Importe Total Certificado` | presente 71 veces (una por certificado): 56,33 × nº de asegurados del certificado (1 a 4) |
| Copagos · bajas | todo a cero · ninguna baja |

### 3.1 Los familiares y cómo se relacionan con el trabajador

**Sí: los familiares están en el mismo fichero y se relacionan con el trabajador, pero no por *su* DNI.**
Cada familiar tiene su **propio** NIF —y algunos, **ninguno** (4 en la muestra, no titulares)—, así que el
NIF de un familiar **no sirve** para llegar al empleado. El vínculo es el **certificado**:

1. **`Certif.` agrupa**: todas las filas de una misma familia comparten certificado (certificados de 1, 2,
   3 y 4 filas en la muestra; **ningún certificado con dos titulares**).
2. **El empleado es la fila con `Parentesco = TITULAR`**, y **su `NIF` es la clave** para cruzar con el
   libro. Todos los titulares de la muestra traen NIF.
3. **El importe que corresponde al empleado es el del certificado entero** (titular + familiares): suma de
   `Importe Total` de las filas del certificado, que coincide con `Importe Total Certificado`.
4. `Certif.` **solo se usa para agrupar y como comprobación**: en esta muestra es el DNI del titular **sin
   letra y sin ceros iniciales** en **68 de 71** titulares. En los **3** restantes no coincide (un NIE, un
   número de póliza mal dado de alta…). Si el diseño dedujera el DNI desde el certificado, **esas
   personas se perderían en silencio**.

> **Regla de diseño:** *agrupar por `Certif.`, identificar por el `NIF` del `TITULAR`, y reportar como
> incidencia cualquier certificado cuyo `Certif.` no case con ese NIF.* No todo titular es necesariamente
> un empleado del sistema: lo que no case contra el libro **se reporta, no se descarta** (RF-34).

### 3.2 La comprobación A (ADESLAS)

Por cada empleado del libro: **importe del certificado en el fichero ↔ columna `ADESLAS` del libro**.
Tipos de diferencia (RF-34): *importe distinto*, *en el libro pero sin cobertura en el fichero* y
*cobertura en el fichero pero sin alta en el libro*.

**Pendiente de decidir:** el **signo** (en el libro el seguro médico aparece en **negativo**; el fichero lo
trae en positivo) y **qué columnas del libro** son realmente importes hoy
([DUDA-0006](../dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md), preguntas 1 y 6).

## 4. COBEE

**Estructura del `.csv`:**

- **Separador `;`, UTF-8 sin BOM, una fila por línea con saltos de línea CR** (`\r`, no `\n` ni `\r\n`):
  el lector debe aceptar los tres terminadores.
- **25 columnas:** 7 de identificación (`ID interno`, `Centro de coste`, `Razón social empleador`,
  `Empleado`, `DNI`, `Email`, `¿Consumos en el ciclo?`) y **18 de importes** = 3 conceptos
  (**Comida**, **Transporte**, **Guardería**) × 6 variantes (`Flex EXENTO`, `Flex NO EXENTO`,
  `Beneficio Social`, `Beneficio Social NO EXENTO`, `Acumulado Recuperado`, `Beneficio Social Recuperado`).
- **Importes con coma decimal** (`123,45`), sin separador de miles en la muestra.
- Las campos vacíos de las primeras columnas producen secuencias `;;;`: **no son un defecto**.
- **El periodo va en el nombre del fichero** (`07_2026`) y la empresa (CIF) también: **no vienen dentro
  del contenido.**

**La muestra, en cifras:**

| | |
|---|---|
| Empleados (filas) | 62 · DNI y correo presentes en las 62 |
| `¿Consumos en el ciclo?` | 8 «Sí» · 54 «No» — **coinciden exactamente** con las 8 personas que tienen importe de comida |
| Importes | solo **`Comida Flex EXENTO`**: 8 personas, 1.171,50 € en total (valores de 6,80 a 214,74). **Todo lo demás, a cero**, incluidos transporte y guardería |
| `Razón social empleador` · `Centro de coste` | **vacíos en las 62 filas** |

**Dos consecuencias para el diseño:**

- Con este fichero **no se puede saber a qué empresa del grupo pertenece cada persona**: hay que sacarlo
  del libro (columna `EMPRESA`) por el DNI, no del fichero.
- **Hay que decidir qué variantes suman a «COBEE COMIDA» y «COBEE TRANSPORTE»** del libro (¿solo `Flex
  EXENTO`? ¿también `NO EXENTO`? ¿`Beneficio Social`? ¿`Recuperado` resta?). La muestra solo ejercita
  una columna y **no permite deducirlo**: es una pregunta para COBEE y Administración.

**Comprobación A (COBEE):** por DNI, **comida y transporte por separado** (RF-32), y distinguiendo **«el
concepto no aparece»** de **«aparece con importe cero»** (HU-24).

> **Este fichero (`_v2`) corrige los defectos del que describía la
> [DUDA-0004](../dudas/0004-formato-de-las-tres-fuentes-de-contraste.md):** codificación correcta y una
> fila por línea, y los nombres de empleado **no están truncados a 28 caracteres** (llegan a 34). Es una
> **exportación nueva**, y esa duda debe actualizarse con ello.

## 5. Banco

**Estructura del `.xls`** (una hoja):

- **Preámbulo de 4 líneas:** `Ordenante` (la cuenta de origen), `Número de pagos` e `Importe total`
  —con **separador de miles con punto y decimal con coma**, como texto— y una línea en blanco.
- **Cabecera:** `Beneficiario`, `Fecha de pago`, `Tipo de pago`, `Cuenta de abono`, `Estado`, `Importe`,
  `Divisa`. **Una fila por pago.**
- **Pie:** *«Solamente se muestran los pagos visibles en la pantalla»*.
- **Tipos:** `Importe` es número; `Fecha de pago` es **texto** `dd-mm-aaaa`; `Cuenta de abono` es un IBAN
  español con espacios (24 caracteres útiles).
- `Beneficiario` viene como **`APELLIDOS, NOMBRE`**, **sin eñes ni acentos**, **con partículas al final**
  y **truncado a 28 caracteres**.

**⚠️ El fichero de la muestra está incompleto:** la cabecera declara **208 pagos** y **265.610,65 €** y el
detalle trae **10 pagos** (101,00 €; **todos de 10,10 €**, de estado «abonada o emitida» y misma fecha).
*Qué concepto son esos 10,10 € no se sabe.* **Es el control más importante de la webapp:** compara el
**número de pagos y la suma del detalle contra la cabecera** y **se niega a continuar** si no cuadran.

**Cómo se identifica a la persona:** el fichero **no trae DNI**. Las vías, aún por decidir en
[DUDA-0005](../dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md): cruzar el nombre contra el
export de empleados de SAGE (que sí tiene DNI) con el motor del
[script de cruce](../../docs_solutions/src/scripts_generales/VAP_Script_Cruce_BBDD_Personas_SAGE.gs), o
cruzar por IBAN si el sistema llegara a tenerlo. **Lo que no se pueda cruzar sin ambigüedad se reporta
como «no cruzado por falta de correspondencia»** (RF-34), nunca se asigna a la persona más parecida en
silencio.

**Comprobación B (banco):** por persona, **importe pagado ↔ importe ingresado/calculado** con **tolerancia
definida** para redondeos (RF-33), con los cuatro tipos de descuadre de HU-25: *pagado de más*, *pagado de
menos*, *persona pagada sin cálculo* y *persona calculada sin pago*. **Pendiente de decidir contra qué
columna** del libro se compara (`Nomina NETO` o `EFECTIVO`:
[DUDA-0006](../dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md), pregunta 5).

## 6. Qué tendrá que hacer la webapp (requisitos de diseño que salen de aquí)

**Entrada**

| # | Regla | Por qué |
|---|---|---|
| 1 | Aceptar los tres formatos tal como llegan: **`.xls`, `.csv`** (y por previsión `.xlsx`) | Es lo que emiten ADESLAS, COBEE y el banco |
| 2 | **Localizar la cabecera por su texto**, no por la posición | Hay 12 líneas de preámbulo en ADESLAS y 4 en el banco; en el libro la cabecera está en la fila 8 |
| 3 | Aceptar **saltos de línea CR, LF y CRLF**, **UTF-8** y **coma decimal** | Es lo que trae COBEE |
| 4 | **Verificar la integridad de cada fichero antes de usarlo**: total del pie en ADESLAS; nº de pagos e importe de la cabecera en el banco; nº de columnas en COBEE | El banco ya ha llegado incompleto; un cruce sobre un fichero parcial da un informe falso |
| 5 | **Comprobar el periodo** de cada fichero y de la pestaña del libro, y avisar si no coinciden | Los tres de la muestra son de meses distintos |
| 6 | **Localizar el DNI en el libro por la cabecera `DNI`** y leer el libro **sin escribir** en él | DUDA-0006: el libro no es nuestro |

> **Verificar antes de construir:** Apps Script **no lee `.xls` binario directamente**. La vía habitual es
> convertirlo a hoja de cálculo de Google mediante el servicio avanzado de Drive, o pedir `.xlsx`/`.csv`.
> **No se ha probado en este proyecto** y condiciona cómo se sube el fichero; hay que comprobarlo con un
> fichero de prueba **ficticio** antes de diseñar la pantalla.

**Cruce**

- **Clave: el DNI del libro.** ADESLAS la aporta tras agrupar (§3.1); COBEE directamente; el banco, no.
- **Normalizar al comparar:** DNI sin espacios y en mayúsculas; importes a número con 2 decimales;
  signo según la decisión de DUDA-0006; nombres sin acentos y por palabras, no por posición.
- **Tipos de diferencia** (RF-34): *importe distinto* · *solo en el fichero* · *solo en el libro* ·
  *no cruzado por falta de correspondencia*. **Nunca descartar en silencio** una fila.
- Las personas **sin DNI en el libro** (en la muestra de DUDA-0006, ~9 %) van al informe de incidencias.

**Salida**

- Informe **de solo lectura**, en una hoja o pantalla **aparte** del libro de gastos (RF-35).
- **Cada diferencia lleva el dato de ambos lados y su causa**, para que Administración pueda actuar.

**Protección de datos** (los ficheros llevan DNI, IBAN, correo y nóminas)

- El fichero subido se procesa **en memoria o en una carpeta de trabajo de acceso restringido** y **se borra
  al terminar**; el informe **no repite el IBAN** completo.
- Quién puede subir y ver el informe se decide **en el servidor**, no solo en pantalla
  ([RNF-09](../../docs_discovery/requisitos_no_funcionales.md)).
- **Los ficheros reales no entran en el repositorio** y esta carpeta no debe usarse como almacén
  permanente: ver el [README de `migration_data/`](../migration_data/README.md).

## 7. Lo que sigue sin saberse

| # | Pregunta | Quién | Dónde se registra |
|---|---|---|---|
| 1 | ¿Qué libro es «gastos de personal»: la Vinculación o el archivo de cálculo final? | Responsable de Administración | §1 de este documento |
| 2 | ¿Qué variantes de COBEE suman a «comida» y a «transporte»? | COBEE · Administración | Nueva (DUDA-0004) |
| 3 | ¿Contra qué columna del libro se compara el banco, y con qué tolerancia? | Administración | DUDA-0006 · RF-33 |
| 4 | ¿Qué significa y qué signo tiene hoy cada columna de contraste del libro? | Administración | DUDA-0006 · DUDA-0002 |
| 5 | ¿Cómo se identifica a la persona en el banco: nombre vía SAGE, IBAN u otra? | Administración · SAGE | DUDA-0005 |
| 6 | ¿Puede el banco dar la remesa **completa**? (208 pagos, no 10) | Banco | DUDA-0004 |
| 7 | ¿Hay más pólizas de ADESLAS para las demás empresas del grupo? | ADESLAS · Administración | DUDA-0004 |
| 8 | ¿Qué mes de nómina contrasta con cada fichero? | Administración | DUDA-0004 |
| 9 | ¿Cómo se sube un `.xls` a la webapp (conversión por Drive, o pedir `.xlsx`)? | Desarrollo | Prueba pendiente (§6) |
| 10 | ¿Qué son los 10,10 € de los pagos de la muestra del banco? | Administración | Nueva |
| 11 | ¿Puede el export de SAGE **incluir el DNI**? *(pedido el 16 nov 2026 a la persona que hace las exportaciones)* | Quien exporta de SAGE | §10 · OB-40 |
| 12 | ¿La muestra de SAGE es el **primer** o el **segundo** export del mes? | Administración | §10 |
| 13 | Si en SAGE los importes de COBEE llegan vacíos, ¿**dónde se descuenta** lo de COBEE? | Administración | §10 |
| 14 | ¿Qué son las 22 personas de SAGE sin pareja en la Vinculación y las 32 de la Vinculación sin SAGE? | Administración | §10 |
| 15 | ¿Qué hojas de `VAP_BBDD_Personas` intervienen en la concordancia de identidad, y cuál es la que manda? | Desarrollo | §11 · OB-44 |
| 16 | ~~¿El *Proceso mensual* es la misma pantalla que el tablero de los nueve pasos (OB-22)?~~ **Sí, la misma** (16 nov 2026) | — | §11 · OB-43 |

## 8. Ficheros de esta carpeta

Los ficheros reales (`.xls`, `.xlsx` y `.csv`) están **protegidos solo por su extensión** en
[`.gitignore`](../../.gitignore): ver el [README de `migration_data/`](../migration_data/README.md). Desde el 16 noviembre
2026 hay además el libro de la **Vinculación** (`.xlsx`) y un informe de trabajo con nombres y DNI
(`.xlsx`): **los dos con datos personales, los dos solo en local**.

## 9. El cruce ADESLAS ↔ Vinculación (16 noviembre 2026) y la pantalla «Comprobaciones»

*Solo cifras agregadas: ninguna fila, nombre ni DNI.* Registra una prueba hecha **en local y en solo
lectura** con los ficheros reales.

### 9.1 ADESLAS cuadra consigo mismo

| Nivel | Comprobación | Resultado |
|---|---|---|
| Fila | `Prima Neta` + `Impuestos y Tasas` = `Importe Total` | 0 diferencias en 106 filas |
| Certificado | suma de `Importe Total` = `Importe Total Certificado` | 0 diferencias en 71 certificados |
| Fichero | suma de filas = total del pie | 5.970,98 € = subcolectivo = póliza colectiva |

- **`Importe Total` es lo de una persona; `Importe Total Certificado` es lo del trabajador y su
  familia**, y viene **una sola vez** por certificado. Para el total del fichero se suma solo
  `Importe Total` por fila: sumar los dos mezclaría conceptos.
- Se compara contra `Importe Total`, **no** contra `Prima Neta`: sumar solo la neta da 10,60 € menos
  (106 × 0,10 € de impuestos).
- **Cabecera en la fila 13, con 23 columnas** (el §3 decía 18): las 5 de más, sin identificar.

### 9.2 Cruce con la hoja `Hoja 1` de la Vinculación

La Vinculación tiene **tres pestañas** con la misma cabecera (fila 6, **datos desde la fila 7**, no la 9
de [DUDA-0006](../dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md)).
La columna `ADESLAS` son **valores, no fórmulas**, y van **en negativo**. Solo `Hoja 1` se parece al
mes de ADESLAS; **no se sabe qué son `020326` y `COMPR`**.

| De los 71 titulares de ADESLAS | |
|---|---|
| Cuadran exactamente (libro = −importe del certificado) | **56** |
| En el libro con 0 € o vacío | 4 |
| En el libro con otro importe | 9 |
| No están en el libro por DNI | 2 |
| *Además: personas del libro con importe que no son titulares* | *3* |

Las 9 de «otro importe» son de **cinco tipos**: 5 con **+1,00 €**, una con solo el titular descontado
(familia sin descontar), una a la mitad, una con importe distinto de 112,66 y una de **1 céntimo**.
Una persona aparece a la vez entre las «no están» y entre las «sin titular»: **su DNI no coincide en
los dos ficheros**, lo que un cruce solo por DNI da como «no está».

**Qué enseña a las reglas:** el cruce por DNI **sirve** (68 de 71); el signo es un hecho (negativo en
el libro); hay que fijar una **tolerancia**; y el informe necesita **cuatro clases de diferencia** más
una sugerencia por nombre para los casos de DNI distinto, **que se muestra y no se aplica**.

### 9.3 La pantalla «Comprobaciones»

Se dibuja con la Responsable de Administración. El usuario **elige la comprobación** de una lista
**cerrada** —solo el desarrollo la amplía— y **sube los dos documentos**; el sistema **verifica por el
contenido** que cada uno es del tipo esperado y comprueba su integridad y su mes **antes** de comparar.
El resultado tiene arriba las cifras y debajo **solo lo que no cuadra**, con un icono para **copiar al
correo** (por defecto el resumen, sin nombres) y queda **registrado** en un sistema consultable desde
otra pantalla, donde se marca como resuelto.

| Comprobación | Documento A | Documento B |
|---|---|---|
| 1 | Primer export de SAGE | ADESLAS |
| 2 | Vinculación de gastos de personal | ADESLAS |
| 3 | Segundo export de SAGE | ADESLAS |

Las tres comparten **un único lector de ADESLAS**. De los exports de SAGE **no se ha visto ninguna
muestra**. Los requisitos están en [RF-72…RF-78](../../docs_discovery/requisitos_funcionales.md) y
[RNF-18](../../docs_discovery/requisitos_no_funcionales.md); el trabajo, en
[OB-40, OB-41 y OB-42](../proximos_pasos.md).

## 10. El export de SAGE (16 noviembre 2026)

*Solo cifras agregadas.* Prueba en local y solo lectura con una muestra del export de SAGE
(`bbdd_export_sage_laboral`, el que alimenta el volcado a la Vinculación,
[ADR-0010](../../docs_solutions/docs_design/adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md)).

### 10.1 Formato

`.csv` con separador `,`, UTF-8 sin BOM, 493 personas y 18 columnas: `Empresa`, `Codigo_Empleado`,
`Nombre_empleado`, `Fecha_alta`, `Porcentaje_de_jornada`, `TOTAL_BRUTO`, `SEGURO_MEDICO`,
`COBE_Transporte`, `COBE_Alimentacion`, `PRODUCTIVIDAD`, `ANTICIPO_NOM`, `EMBARGO`,
`Líquido_a_percibir`, `SS_EMP`, `SS_TRABAH`, `IRPF`, `COMIDA_EXENTO`, `TRANSPORTE_EXENTO`. Los importes
llevan **coma decimal y punto de miles**. **No trae DNI.**

### 10.2 Cómo se llega al DNI hoy

La persona se identifica por **`Empresa` + `Codigo_Empleado`** (el nº solo es único dentro de cada
empresa). El DNI solo se obtiene **dando un salto por la Vinculación**, que tiene esas dos columnas y el
DNI:

| | |
|---|---|
| Personas de SAGE con pareja en la Vinculación | 471 de 493 |
| Sin pareja | 22 |
| De la Vinculación sin pareja en SAGE | 32 |
| Claves empresa + nº con **dos DNI** en la Vinculación | 1 |

**Pedido el 16 noviembre 2026 a la persona que hace las exportaciones: incluir el DNI en el export.**
Si se hace, desaparece el salto y su fuente de personas sin pareja, y de paso ayuda a identificar al
banco (DUDA-0005, vía el nombre). Hasta entonces, el salto es la vía.

### 10.3 Qué importes trae

| Columna | Valores |
|---|---|
| `SEGURO_MEDICO` | 59 importes, **todos negativos**, suma −4.816,23 € |
| `COBE_Alimentacion`, `COBE_Transporte`, `COMIDA_EXENTO`, `TRANSPORTE_EXENTO` | **vacías en las 493 filas** |

**COBEE no llega en esta muestra.** COBEE dice que se concedieron 1.171,50 € de comida a 8 personas, y
no aparece en SAGE ni, por tanto, en la Vinculación. Hay que saber si es el primer o el segundo export
del mes (preguntas 12 y 13).

### 10.4 ADESLAS ↔ SAGE

De los 71 titulares de ADESLAS: **54** cuadran (en valor absoluto), **5** con SAGE a 0 o vacío, **3** con
otro importe y **9** sin pareja por el salto vía la Vinculación.

### 10.5 El libro frente a SAGE

El seguro de `Hoja 1` es igual al de SAGE en **473 de 474** personas que están en los dos, y el neto en
472 de 474. Las diferencias de §9.2 salen de **fuera del volcado**: los 7 valores positivos del libro (todos de +1,00 €) son
de personas que **no están en este export**, y el de −67,60 está en SAGE a 0. **Parecen retoques
manuales o filas de otra procedencia; no está comprobado.**

### 10.6 Para las comprobaciones 1 y 3 de ADESLAS

Son viables con el salto actual. Para COBEE contra SAGE, **no con esta muestra**.

## 11. El proceso mensual y la concordancia de identidad (16 noviembre 2026)

Recoge, **tal como lo planteó el desarrollo**, el diseño que condiciona las partes afectadas. *Solo
cambian los nombres de las personas, sustituidos por su función, y erratas evidentes.*

### 11.1 Lo planteado

> **Concordancia.** Siempre que haya los dos datos —identificador de trabajador (empresa + nº de SAGE) y
> DNI— se debe comprobar que **siguen en concordancia**, porque hay veces que un trabajador puede cambiar
> de empresa por diversos motivos.
>
> **Una nueva interfaz, la primera, que se llamará «Proceso Mensual»**, a la que se irán incluyendo
> pasos: algunos serán **manuales** y otros **ejecutables desde la propia interfaz**. El que sigue podrá
> ser ejecutable desde ella porque **ambas fuentes de datos son hojas de Google online y gestionadas por
> este proceso**:
>
> - `VAP_Export_SAGE_Laboral`: la [Responsable de Administración] lo vacía y copia los datos cuando
>   [quien exporta de SAGE] hace la primera exportación.
> - `VAP_BBDD_Personas`: aquí se actualizan altas y bajas que aplican a diferentes funcionalidades del
>   sistema. **La información a cruzar está en diferentes hojas de esa hoja de cálculo.**
>
> **Pasos de este subgrupo:**
> 1. Actualizar a mano los datos mensuales de la primera exportación de `VAP_Export_SAGE_Laboral`.
> 2. Actualizar a mano `VAP_BBDD_Personas` con altas y bajas.
> 3. Comprobar que `id_trabajador` y DNI coinciden.
>
> **Posibles resultados:**
> - **A.** Todo correcto: se puede proseguir con el resto de pasos.
> - **B.** Incidencias.
>   - **B.1.** Hay datos cuyo DNI no coincide, relacionado con otro `id_trabajador`: la Responsable lo
>     modifica a mano como proceda, en la hoja que proceda.
>   - **B.2.** Hay datos que no están en uno u otro origen: la Responsable lo modifica a mano como
>     proceda, en la hoja que proceda.
>
> Una vez resueltas todas las incidencias, **se vuelve a comprobar hasta que sale todo correcto.**

### 11.2 Lo que hay que tener en cuenta (observaciones, no decisiones)

- **El `id_personal` es `EMPRESA_nº`** (por ejemplo, `GALA_999`) y coincide con la clave del export de
  SAGE, que es la pareja empresa + `Codigo_Empleado`. Ahí vive también el DNI y el nombre.
- **El export de SAGE no trae DNI** ([§10.1](#101-formato)): la incidencia B.1 solo se puede aproximar
  por el nombre hasta que lo incluya. Pedido el 16 noviembre 2026.
- **El maestro tiene varias hojas** y no se han visto: hay que saber cuáles intervienen antes de
  escribir la comprobación.
- **Es lo mismo que OB-22** (el tablero de los nueve pasos), con otro nombre: **decidido el 16 noviembre
  2026**. Lo que añade [OB-43](../proximos_pasos.md) es que algunos pasos se ejecutan desde la pantalla.
- Requisitos: [RF-79, RF-80, RF-81](../../docs_discovery/requisitos_funcionales.md) · historias:
  [HU-45, HU-46](../../docs_discovery/historias_usuarios.md) · trabajo: [OB-43, OB-44](../proximos_pasos.md).

## 12. El banco: `VAP_Pagos`, la huella y Altas/bajas (16 noviembre 2026)

Es la salida a [DUDA-0005](../dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md): el banco
solo trae **nombre e IBAN**, y se necesita reconocer a la persona **sin guardar la cuenta ni juntarla
con el DNI**. **Propuesta del desarrollo, pendiente de validar** con Gerencia y protección de datos, y de
un ADR ([OB-36](../proximos_pasos.md), [OB-45](../proximos_pasos.md)).

### 12.1 Dónde vive cada dato

| Dato | Dónde vive | Quién lo ve |
|---|---|---|
| Nombre, DNI, `id_personal` (`EMPRESA_nº`) | `VAP_BBDD_Personas` (ya existe, con varias pestañas) | Como hoy |
| **La cuenta (IBAN)** | **En ningún sitio.** Entra por la pantalla o por el fichero del banco, se usa en memoria y se descarta | — |
| **Huella + `id_personal`** | **`VAP_Pagos`**, libro nuevo. Sin DNI, sin nombre, sin IBAN | Solo el sistema y el desarrollo |
| **Clave secreta** | Configuración del script de la webapp | Quien edita ese proyecto |
| Registro de altas, bajas y modificaciones | Hoja nueva de `VAP_BBDD_Personas`. **Sin cuenta ni huella** | Según la decisión de acceso |
| Fichero del banco | Se sube, se procesa y se borra | Quien lo sube |

**La huella solo vive en `VAP_Pagos`**, nunca en el libro con los DNI: junto al DNI debilitaría la
separación que se busca. Su auditoría se hace en `VAP_Pagos`.

### 12.2 Qué es la huella

Un código calculado a partir de la cuenta **con la clave secreta**: la misma cuenta da siempre el mismo
código, del código no se puede volver a la cuenta y sin la clave nadie puede calcularlo. **No incluye el
identificador ni la empresa**: así un cambio de empresa no la altera y se puede buscar sin saber de quién
es. Un resumen sin clave **no vale**, porque los IBAN son predecibles.

### 12.3 La operativa

| Cuándo | Qué pasa |
|---|---|
| **Una sola vez: carga inicial** | Para las personas ya existentes. Con el fichero completo del banco de cada empresa, el sistema propone a la persona por empresa y nombre, comprueba que el **importe coincide con su líquido en SAGE** y una persona confirma: **en bloque** las de nombre único e importe coincidente, **una a una** las demás |
| **Alta** | Desde *Altas/bajas*: empresa, identificador de SAGE, nombre, DNI y fecha de alta. La cuenta se da entonces o después; si se da, se calcula la huella y se guarda en `VAP_Pagos` |
| **Baja** | La persona deja de estar activa, no se borra |
| **Cambio de cuenta** | Desde la vista del maestro: huella nueva; la antigua deja de valer |
| **Cambio de empresa** | **Baja en la de origen y alta en la de destino.** La huella no cambia; el historial queda partido |
| **Cada mes** | El fichero del banco se cruza con `VAP_Pagos` por la huella, **solo entre personas activas**. Lo que no se reconoce o es ambiguo se reporta como **no cruzado**, nunca se asigna |

**Riesgos y cómo se cierran:**

- **Datos a medias** (se escribe en dos libros): primero el evento, después las dos escrituras y luego
  una comprobación de que concuerdan, con aviso si no.
- **La cuenta en un registro:** no debe aparecer en el registro de ejecuciones ni en mensajes de error
  ([RNF-19](../../docs_discovery/requisitos_no_funcionales.md)), y se comprueba con una prueba.
- **Una confirmación equivocada** asociaría una cuenta a otra persona sin avisar: de ahí el control del
  importe y que se pueda **anular** una confirmación.
- **Perder la clave** obliga a repetir la carga inicial: por eso lleva copia de seguridad
  ([RNF-20](../../docs_discovery/requisitos_no_funcionales.md)).

### 12.4 Pendiente

Las **decisiones de seguridad** (algoritmo, dónde y cómo se guarda la clave, quién abre `VAP_Pagos`,
copia de seguridad de la clave, plazo de conservación y si se enseñan los últimos dígitos al confirmar), el
**fichero completo del banco** para medir la carga inicial, si el banco emite **uno por empresa**, y el
nombre definitivo de los libros. Requisitos: [RF-82…RF-89](../../docs_discovery/requisitos_funcionales.md) ·
historias: [HU-47, HU-48](../../docs_discovery/historias_usuarios.md) · trabajo:
[OB-45, OB-46](../proximos_pasos.md).
