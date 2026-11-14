# Las tres fuentes de contraste: qué traen y cómo se cruzan con el libro de gastos de personal

| | |
|---|---|
| **Versión** | 0.1 — BORRADOR |
| **Fecha** | 14 noviembre 2026 |
| **Se apoya en** | [DUDA-0004](../dudas/0004-formato-de-las-tres-fuentes-de-contraste.md) · [DUDA-0005](../dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md) · [DUDA-0006](../dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) |
| **Requisitos** | RF-31 · RF-32 · RF-33 · RF-34 · RF-35 · HU-23 · HU-24 · HU-25 |

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
  permanente: ver el [README](README.md).

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

## 8. Ficheros de esta carpeta

Los ficheros reales (`.xls` y `.csv`) están **protegidos solo por su extensión** en
[`.gitignore`](../../.gitignore): ver el [README](README.md) de esta carpeta.
