# RETOMAR TRABAJOS — Sistema VAP

**Qué toca hacer ahora**, agrupado en sprints y en trozos lo bastante pequeños como para cerrarlos.

| | |
|---|---|
| **Versión** | 0.8 |
| **Fecha** | 25 septiembre 2026 |
| **Se apoya en** | [FLUJO.md](flujo_doc/FLUJO.md) · [dudas/](dudas/README_dudas.md) |

---

## Para qué sirve este documento

Los [requisitos](../docs_discovery/requisitos_funcionales.md) dicen **qué hay que construir y por
qué**, y llevan el estado de cada uno. Pero un requisito no se puede empezar un martes por la mañana
sin más: este documento reparte el trabajo en **objetivos pequeños y cerrables**, agrupados en
**sprints**, y dice cuál toca ahora.

| | Responde a |
|---|---|
| [`requisitos_funcionales.md`](../docs_discovery/requisitos_funcionales.md) | ¿Qué hay que hacer, y por qué? |
| **`retomar_trabajos.md`** *(este)* | **¿Qué hago ahora, y qué me lo impide?** |
| [`dudas/`](dudas/README_dudas.md) | ¿Qué falta saber para poder decidir? |
| [`../docs_discovery/problem.md`](../docs_discovery/problem.md) | ¿Qué significa haberlo conseguido? *(resultados deseados)* |

**Reglas para que esto siga sirviendo:**

- Un objetivo que no se pueda cerrar en **una o dos sesiones de trabajo** es demasiado grande:
  pártelo.
- Cada objetivo dice **de qué depende**. Si depende de otra persona o de un documento de fuera, eso
  es lo primero que hay que mover.
- **Un sprint se cierra por objetivo cumplido, no por fecha.** El desarrollo lo lleva una sola
  persona compatibilizándolo con otras funciones, así que fijar quincenas rígidas solo serviría para
  arrastrar deuda de un sprint al siguiente.
- Cuando un objetivo se cierra, se marca 🟢 y **se anota qué salió de él** — normalmente una
  respuesta a una duda, o un requisito que pasa de 🔴 a ✅.

## Las tres vías

| Vía | Qué es | De qué depende |
|-----|--------|----------------|
| 🔵 **En solitario** | Construir, analizar y preparar | Solo del desarrollo |
| 🟣 **Conjunta** | Validar y resolver dudas **con la Responsable de Administración** | De acordar reunión |
| 🟠 **De terceros** | Documentos que emiten ADESLAS, COBEE y el banco | De que los envíen |

> **Lo que no depende de ti, muévelo primero.** Es la razón de que el **Sprint 6** sea entero 🟣 y
> 🟠: son las cosas con plazo ajeno, y parte de lo demás las espera. El **Sprint 1** ya no: sus tres
> documentos han llegado, así que pasa a ser trabajo 🔵 que se puede hacer en solitario.

---

## Los sprints de un vistazo

| Sprint | Objetivo del sprint | Objetivos | Estado |
|--------|---------------------|-----------|--------|
| **0 · Historias y requisitos** | Poner por escrito qué tiene que hacer el sistema y para quién | OB-15, OB-16 | 🟢 **Cerrado** |
| **1 · Contrastar el VAP con fuentes externas** | Comprobar lo que calcula el sistema contra ADESLAS, COBEE y el banco | OB-11, OB-12, OB-35, OB-36 | 🟡 **En curso** — las tres fuentes ya analizadas |
| **2 · Saldar la auditoría** | Cerrar lo que la auditoría de dos pasadas dejó al descubierto | OB-29 … OB-34, OB-37, OB-39 | 🟡 **En curso** — OB-29 y OB-33 cerrados |
| **3 · Reorganizar el repositorio** | Ordenar la documentación por la pregunta a la que responde | OB-28 | 🟢 **Cerrado** |
| **4 · La webapp de coordinación** | Que el cierre se lance, se siga y se mida desde una pantalla | OB-07, OB-08, OB-20 … OB-22, OB-09, OB-10, OB-13, OB-14 | 🟡 **En curso** |
| **5 · Saldar la deuda** | Que todo deje rastro, y limpiar las 20 entradas de deuda técnica | OB-17 … OB-19, OB-23 … OB-27, OB-38 | 🟡 **En curso** — OB-38 a medias |
| **6 · Lo que hay que pedir y preguntar** | Lo que no depende de nosotros: documentos de terceros y respuestas del negocio | OB-01 … OB-06 | 🟡 **En curso** — los tres documentos ya han llegado |

**Estados:** 🔴 pendiente · 🟡 en curso · 🟢 cerrado · ⚪ bloqueado

> **Cinco sprints activos y dos cerrados.** El 1 comprueba, el 2 salda lo que la auditoría destapó,
> el 4 construye, el 5 arregla y el 6 pregunta. El **Sprint 1 entra por arriba** porque lo que lo
> tenía parado —que llegaran los tres documentos de contraste— ya ha ocurrido, y porque es **el
> último paso del sistema**: lo único que hoy no tiene forma de detectar un error antes de que se
> pague.

---

# Sprint 0 · Historias y requisitos — 🟢 Cerrado

> **Objetivo del sprint:** poner por escrito **qué tiene que hacer el sistema y para quién**, con el
> detalle suficiente para poder construir sin volver a preguntar.

Lleva el número 0 porque es el punto de partida: no construye nada, pero es de donde salen los
criterios con los que se construye todo lo demás.

### OB-15 · Escribir las historias de usuario — 🔵 🟢 **Cerrado**

| | |
|---|---|
| **Responde a** | documentación |
| **Depende de** | Nada: se apoya en lo ya escrito |
| **Entregable** | [`../docs_discovery/historias_usuarios.md`](../docs_discovery/historias_usuarios.md) |

Derivar de las *job stories* de [`problem.md`](../docs_discovery/problem.md) y del proceso de
[`FLUJO.md`](flujo_doc/FLUJO.md) las historias de usuario, con **criterios de aceptación verificables**,
prioridad y estado. Con trazabilidad explícita hacia atrás, para poder ver qué *job* cubre cada
historia y detectar los que no cubre ninguna.

**Se cierra cuando** cada paso del proceso y cada rol tienen sus historias escritas, y ninguna *job
story* se ha quedado sin cubrir sin que conste el motivo.

> 🟢 **Cerrado el 18 agosto 2026.** Salieron **41 historias en 8 épicas**, con criterios de
> aceptación en formato Gherkin, prioridad MoSCoW y trazabilidad completa: las **once** *job
> stories* de `problem.md` quedan cubiertas.
>
> **Lo que dejó ver el reparto:** lo implementado está en *maestro de personal*, *captura* y
> *consolidación* —mover datos—, y lo pendiente en *verificar*, *coordinar* y *medir* —controlar el
> proceso—. Es la misma frontera que señalaba el mapa del flujo.
>
> Y **5 parciales que fallan todas por lo mismo**: el resultado es correcto pero no queda constancia
> de cómo se llegó a él. Entre ellas, dos que se creían terminadas — la comprobación de destino
> limpio (avisa pero no impide, y no en los export) y el rastro de ejecución (los scripts que se
> disparan solos no dejan ninguno).
>
> Deja además tres historias que **no se pueden cerrar sin negocio**: HU-12 (qué aporta el
> Gerente), HU-13 (si se pide declarar *no tengo nada*) y las prioridades, que son propuesta.

### OB-16 · Derivar los requisitos funcionales y no funcionales — 🔵 🟢 **Cerrado**

| | |
|---|---|
| **Responde a** | documentación |
| **Depende de** | OB-15 |

El [SSD](../docs_solutions/docs_design/SSD.md) ya tiene requisitos, pero escritos **desde el código hacia arriba**:
describen lo que el sistema hace. Los que salgan de las historias van en sentido contrario, y serán
más y distintos — aparecerán requisitos **sin implementar**.

**Se cierra cuando** existe la matriz `historia → requisito → estado` y está decidido qué hacer con
los requisitos que ya tiene el SSD.

> 🟢 **Cerrado el 18 agosto 2026.** Salieron **71 requisitos funcionales y 15 no funcionales**, con
> matriz completa en los dos sentidos: ninguna historia sin requisito, ningún requisito sin historia.
>
> El SSD §3 pasa a ser un puntero a `requisitos.md`; los 14 requisitos antiguos quedan absorbidos y
> su correspondencia documentada. **Los 14 ADR aceptados tienen requisito**, así que ninguna decisión
> de arquitectura se había quedado sin aplicar.
>
> Al confrontarlo apareció lo que no cuadraba: un riesgo del SSD que en realidad era un requisito
> (R-09), un requisito que protegía solo la mitad del recorrido (RNF-02), tres riesgos sin requisito
> —ahora RF-70, RF-71 y RNF-15— y **tres riesgos que el SSD no conocía**: R-18, R-19 y R-20, los
> tres de impacto alto y los tres sobre lo mismo — *el dato sale del sistema y deja de haber rastro*.

---

# Sprint 1 · Contrastar el VAP con fuentes externas — 🟡 En curso

> **Objetivo del sprint:** que el sistema **compruebe**, contra documentos que emiten terceros, que
> el seguro médico, las ayudas de COBEE y las transferencias emitidas coinciden con lo que ha
> calculado. Es **el último paso del proceso** y la primera vez que el sistema comprueba en lugar de
> transportar.

**Entra por arriba porque lo que lo tenía parado ya ha ocurrido:** los tres documentos de contraste
han llegado (OB-01). Hasta ahora este trabajo esperaba a terceros; hoy es trabajo 🔵 que se puede
hacer en solitario.

> **Con una dependencia que apunta hacia atrás y conviene tener presente:** OB-35 necesita los
> ficheros de banco y COBEE **bien exportados**, y eso es la mitad que le queda a OB-01, que vive en
> el **Sprint 6**. Se puede diseñar y escribir el lector mientras tanto; no se puede dar por
> terminado hasta que lleguen bien.

## Lo que ya se sabe, y dónde está escrito

Al recibir los tres ficheros y abrir Vinculación en lectura, quedó documentado esto:

| Ficha | Qué recoge |
|---|---|
| [DUDA-0004](dudas/0004-formato-de-las-tres-fuentes-de-contraste.md) | **El formato de las tres fuentes**: la fusión de ADESLAS por certificado y sus dos excepciones, los dos defectos del export de COBEE, y por qué el fichero del banco no sirve tal cual |
| [DUDA-0005](dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md) | **El banco no trae DNI**: las tres opciones para identificar a la persona y el riesgo de protección de datos de cada una |
| [DUDA-0006](dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) | **El mapa de columnas de Vinculación**: `DNI` en la D, `ADESLAS` en la G, `COBEE COMIDA` y `COBEE TRANSPORTE` en la H y la I — y qué contienen hoy en realidad |

**La conclusión que ordena el sprint:** el cruce por DNI **es viable** —la clave existe en los dos
extremos y en el mismo formato— para ADESLAS y COBEE. Para el banco **no**, y esa es una decisión
que no es técnica.

> **Ningún fichero de contraste entra en este repositorio.** Ni para probar
> ([CLAUDE.md, segunda regla](../CLAUDE.md)). Lo que se documenta es el formato; los datos viven
> fuera, o en una carpeta ignorada por git.

## Lo que se construye

### OB-11 · Analizar cada documento y decidir la clave de cruce — 🟠 🟡 **A medias**

| | |
|---|---|
| **Responde a** | [RF-31…RF-35](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-01 |
| **Sale de aquí** | [DUDA-0004](dudas/0004-formato-de-las-tres-fuentes-de-contraste.md) · [DUDA-0005](dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md) · [DUDA-0006](dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) |

De cada documento hay que ver **formato, campos, periodicidad y con qué se identifica a cada
persona**. Esa última es la que decide si el cruce es viable o hay que construir una correspondencia
a mano — y es la que más problemas ha dado, exactamente como se esperaba.

**Lo hecho** 🟩 — la clave de cruce de cada fuente:

| Fuente | Clave | Cómo |
|--------|-------|------|
| **COBEE** | `DNI` | Directo: una fila por trabajador, mismo formato que Vinculación |
| **ADESLAS** | `NIF` del titular | Agrupando por `Certif.`, que **agrupa pero no identifica** |
| **Banco** | — | Solo nombre e IBAN: sin resolver, es OB-36 |

**Lo que falta** 🔍 para cerrarlo: el **porcentaje de personas que casan**. No se puede calcular
todavía porque el fichero del banco está incompleto y el de COBEE mal exportado.

**Se cierra cuando** de cada documento se sabe qué campo cruza con cuál del sistema **y qué
porcentaje de personas casan**, medido sobre los ficheros completos.

### OB-35 · Escribir los tres lectores normalizadores — 🔵

| | |
|---|---|
| **Responde a** | [RF-31…RF-35](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-11 · **lo que queda de OB-01** (Sprint 6): los exports completos de banco y COBEE |

Un lector por fuente, todos con **la misma salida**: filas de `(DNI, concepto, importe)`, más una
lista de lo que no ha podido normalizarse. Nada más — ni comparan, ni escriben, ni deciden. Una
función, una cosa ([CLAUDE.md](../CLAUDE.md), SOLID-S).

Lo que cada uno tiene que resolver está en [DUDA-0004](dudas/0004-formato-de-las-tres-fuentes-de-contraste.md), y hay tres reglas que no son opinables:

- **ADESLAS** — agrupar por `Certif.`, tomar el DNI del **`NIF` de la fila `TITULAR`**, sumar el
  certificado. El `Certif.` se usa como **comprobación**, nunca para deducir el DNI: hay NIEs y hay
  al menos un certificado que es el número de póliza. **De los familiares sale el importe, nunca el
  nombre ni el NIF.**
- **COBEE** — forzar el charset y reconstruir los registros mientras el export siga llegando en una
  sola línea.
- **Banco** — cuatro líneas de preámbulo, y **rechazar el fichero si el número de filas no coincide
  con el recuento de pagos de su cabecera**. Es lo que habría detectado que el primero venía
  truncado.

Los identificadores de fichero, columnas y separadores van en **constantes al principio**, como en
el resto del proyecto ([CLAUDE.md](../CLAUDE.md), SOLID-D).

**Se cierra cuando** los tres lectores devuelven filas normalizadas sobre ficheros reales completos,
y lo que no casa aparece listado en lugar de desaparecer.

### OB-36 · Resolver cómo se identifica a la persona en el fichero del banco — 🟣

| | |
|---|---|
| **Responde a** | [DUDA-0005](dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md) |
| **Depende de** | Una decisión de Gerencia y de protección de datos |

El banco solo trae **nombre e IBAN**, y el nombre llega sin eñes, con las partículas al final y
truncado a 28 caracteres. Hay tres salidas —no guardar nada y cruzar por nombre cada mes, guardar la
cuenta, o guardar **una huella** de la cuenta— y **la elección no es técnica**: es cuánto riesgo se
asume.

> **No es un objetivo de programación, es uno de decisión.** Va aquí y no en el Sprint 6 porque
> bloquea a OB-12: sin él, dos de las tres comprobaciones se pueden construir y la tercera no.

Si la decisión permite construir la correspondencia, el motor de cruce por nombre **ya existe** en
[`VAP_Script_Cruce_BBDD_Personas_SAGE.js`](migration_data/VAP_Script_Cruce_BBDD_Personas_SAGE.js) —
se reutiliza, no se duplica ([CLAUDE.md](../CLAUDE.md)).

**Se cierra cuando** hay una decisión escrita y validada, **y un ADR que la registre**.

### OB-12 · Construir las tres comprobaciones — 🔵

| | |
|---|---|
| **Responde a** | [RF-31…RF-35](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-35 · OB-36 · las respuestas de [DUDA-0006](dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) |

Informe de diferencias por persona y concepto, con la misma pauta que los volcados: **revisar
primero, escribir después**. Queda por decidir si los informes solo avisan o pueden corregir, y si
una diferencia bloquea el cierre.

Tres cosas que ya se sabe que hay que respetar:

- **Anclar la cabecera buscando `DNI`**, nunca asumir la fila 1: en Vinculación los datos empiezan
  en la fila 9, y encima hay tablas de parámetros.
- **Solo leer.** El libro pertenece a otra cuenta y el informe vive aparte. Es además la pauta del
  proyecto: preparar, mostrar y esperar confirmación.
- **Las filas sin DNI se reportan, no se descartan.**

> **Está bloqueado por [DUDA-0006](dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md)**, y conviene no saltárselo: las columnas `ADESLAS`,
> `COBEE COMIDA` y `COBEE TRANSPORTE` **hoy no contienen importes**. Comparar contra ellas antes de
> saber qué se supone que guardan produciría un informe que sería ruido entero.

**Se cierra cuando** las tres comprobaciones producen su informe de diferencias sobre un mes real.

---

# Sprint 2 · Saldar la auditoría — 🟡 En curso

> **Objetivo del sprint:** dejar el repositorio **coherente consigo mismo** antes de seguir
> construyendo: sin enlaces rotos, sin documentos que describan un sistema que ya no existe y con la
> cadena de trazabilidad completa.

Sale de la **auditoría de dos pasadas** del 7 de septiembre de 2026
([regla en CLAUDE.md](../CLAUDE.md)). Va en primera posición porque toca los mismos documentos que
van a modificar todos los sprints siguientes.

### OB-29 · Reparar los 42 enlaces rotos por el movimiento de `FLUJO.md` — 🔵 🟢 **Cerrado**

| | |
|---|---|
| **Vía** | 🔵 En solitario |
| **Depende de** | Nada |
| **Prioridad** | 🔺 Must |

`FLUJO.md` pasó de `docs_work/` a `docs_work/flujo_doc/`. **42 enlaces en 15 archivos** apuntan al
sitio viejo, y los del propio `FLUJO.md` a sus vecinos (`dudas/`, los requisitos) también, porque ahora
está un nivel más abajo.

**Se cierra cuando** el verificador de enlaces da 0 rotos. 🟢 **Hecho el 7 sep 2026: 0 de 416.**

Se cerraron en la misma pasada tres hallazgos menores de la auditoría:

- **Las referencias al `.docx` desaparecido** (árbol del `README` y fila `B6` del registro).
- **El inventario de recursos**, que no tenía los IDs de **los dos formularios** ni constancia del
  origen heredado `1bUt5…SK7Fog`, vivo solo en `backup_old_js/`.
- **La convención de nombres de `dudas/`**, ahora escrita en su README con su coste: cerrar una duda
  son cuatro pasos.

> **Un hallazgo del informe era falso.** El ID `1HQMx…hjmHk` **sí estaba documentado** como
> `VAP_BBDD_Personas`: la comprobación buscaba el ID completo y el inventario los abrevia.

### OB-30 · Poner al día lo que el código ya no hace — 🔵

| | |
|---|---|
| **Depende de** | Que se decida desplegar (registro de la reunión 10, **C5**) |
| **Prioridad** | 🔺 Must |

**28 puntos en 6 documentos** siguen describiendo la acción `Calculo Salario Base` y la columna `S`,
que el código ya no tiene: `README.md`, `SSD.md` §7.5, `FLUJO.md` (12 puntos, 3 diagramas),
`ADR-0011` y el `CHANGELOG`.

> **`ADR-0011` es caso aparte:** un ADR es inmutable. Su dependencia con *Calculo Salario Base* la
> **supera** [ADR-0015](../docs_solutions/docs_design/adr/0015-eliminar-calculo-salario-base-del-script-sage.md),
> y eso hay que declararlo en el índice, no editando el 0011.

### OB-31 · Cerrar la trazabilidad de los ADR — 🔵

| | |
|---|---|
| **Depende de** | OB-33 (partir requisitos) |
| **Prioridad** | 🔺 Must |

**Cuatro ADR sin requisito** —0013, 0014, 0015 y 0016—, y el índice afirma lo contrario. Además, los
16 ADR hay que **rehacerlos en formato MADR** y que cada uno declare con qué RF y RNF se relaciona.

> **Confirmado en la revisión del commit v2.3 (25 sep 2026):**
>
> - La tabla de [SSD §12](../docs_solutions/docs_design/SSD.md#12-trazabilidad-completa) termina
>   en la 0014 y sigue diciendo *«Los 14 ADR aceptados tienen requisito»*. Ya hay **16 aceptados**:
>   faltan la 0015 y la 0016.
> - Ninguna de las dos declara sus RF/RNF. La 0016 no cita ninguno, y la 0015 solo cita RF-31…35
>   para decir que *no* son de esa decisión.
> - El origen está en la plantilla: [`0000-plantilla.md`](../docs_solutions/docs_design/adr/0000-plantilla.md)
>   **no tiene sección de requisitos relacionados**, y por eso ningún ADR la tiene. Hay que
>   corregir la plantilla primero, y después los ADR.

### OB-32 · Documentar el script de cruce y colocarlo donde toca — 🔵

| | |
|---|---|
| **Prioridad** | 🔸 Should |

`VAP_Script_Cruce_BBDD_Personas_SAGE.js` (905 líneas, 32 funciones) vive en `docs_work/migration_data/`
—una carpeta de trabajo— cuando **el código va en `docs_solutions/src/`**. No está en el SSD, y en el
README solo figura la carpeta, no el script.

> 🟡 **Desde el 7 de septiembre sí consta en el [CHANGELOG](../CHANGELOG.md)**, y el script se cita
> desde [DUDA-0005](dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md) como el motor de
> cruce por nombre que hay que **reutilizar y no duplicar**. Eso refuerza el objetivo en lugar de
> vaciarlo: si va a usarse otra vez, con más razón tiene que vivir donde vive el código.

Al moverlo, corregir también su cabecera: dice *«Crea tres hojas»* y luego enumera **cuatro**
(falta contar `VAP_Staff`).

### OB-33 · Partir `requisitos.md` en RF y RNF, con su trazabilidad — 🔵 🟢 **Cerrado**

| | |
|---|---|
| **Prioridad** | 🔺 Must |
| **Es la base de** | OB-31 y OB-34 |

Dos archivos: [`requisitos_funcionales.md`](../docs_discovery/requisitos_funcionales.md) (71 RF) y
[`requisitos_no_funcionales.md`](../docs_discovery/requisitos_no_funcionales.md) (17 RNF). Cada **RF**
enlaza a sus **HU** por la columna *Origen*; cada **RNF**, a un RF por la columna *Relación con RF* y,
si no la hay, a una justificación **J-01…J-07** de por qué existe. 🟢 **Hecho el 7 sep 2026** —
**diez** RNF cuelgan de un RF, **siete** existen por sí mismos con su justificación escrita.

### OB-34 · Llevar la matriz de trazabilidad al SSD y adoptar arc42 — 🔵 🟡 **A medias**

| | |
|---|---|
| **Depende de** | OB-31 y OB-33 |
| **Prioridad** | 🔸 Should |

🟢 **La matriz está en el SSD** ([§12 Trazabilidad completa](../docs_solutions/docs_design/SSD.md)),
con la cadena entera y una tabla que dice dónde se declara cada eslabón.

🟢 **`ROADMAP.md` eliminado.** Sus puntos ya vivían en los requisitos —con su estado— o en la deuda
técnica; mantenerlos también allí duplicaba el estado en dos sitios. Los **seis sin trazabilidad**
pasaron a [`items_v3.md`](items_v3.md).

🔴 **Queda reestructurar el SSD según arc42.**

### OB-37 · Crear el `.gitignore` y sacar la configuración local del repositorio — 🔵

| | |
|---|---|
| **Responde a** | [CLAUDE.md, segunda regla](../CLAUDE.md) |
| **Depende de** | Nada |
| **Prioridad** | 🔺 Must |

Sale de la revisión del commit v2.3 (25 sep 2026). **El repositorio no tiene `.gitignore`**, y la
segunda regla pide que los ficheros de trabajo vivan en una carpeta ignorada y **declarada en
`.gitignore`**. Hoy no hay ninguna.

El riesgo está en [`migration_data/`](migration_data/): por el nombre, es fácil que alguien deje
ahí un export de SAGE (el script de cruce busca `Empleados_<fecha>.csv`), y un `git add .` lo
subiría. **Hoy no hay datos personales versionados**: se comprobó en todo el diff del commit.

Dos cosas:

- **Crear el `.gitignore`** con una carpeta de datos de trabajo ignorada y, por si acaso, las
  extensiones de export (`*.csv`, `*.xlsx`, `*.xls`, `*.ods`). Hay que decidir si `migration_data/`
  sigue guardando código (ver OB-32) o pasa a ser solo para datos.
- **Dejar de versionar `.claude/settings.local.json`.** Es la configuración de permisos de una
  máquina concreta. Hoy no contiene nada sensible, pero no pinta nada en el repositorio.

**Se cierra cuando** existe el `.gitignore`, un CSV de prueba en la carpeta de trabajo no aparece
en `git status`, y `settings.local.json` ya no está versionado.

### OB-39 · Decidir de dónde sale el salario base y alinear el ADR-0015 — 🔵

| | |
|---|---|
| **Responde a** | [ADR-0015](../docs_solutions/docs_design/adr/0015-eliminar-calculo-salario-base-del-script-sage.md) |
| **Depende de** | Nada |
| **Prioridad** | 🔺 Must |

**Lo que pasó (28 sep 2026):** en `VINC_FIELDS` de
[`VAP_script_export_SAGE.js`](../docs_solutions/src/scripts_generales/VAP_script_export_SAGE.js),
`L · Salario Base` apuntaba a `Líquido_a_percibir`, **el neto**, que ya va a `T · Nomina NETO`. Salario
base y nómina neta recibían el mismo importe. Se ha repuntado a **`TOTAL_BRUTO`** (columna F del
origen).

**El código y el ADR ya no dicen lo mismo.** El ADR-0015 decidió que el salario base se toma de la
**columna M** de SAGE; el código lo toma ahora de `TOTAL_BRUTO`. Hay que mirar con calma:

1. **Cuál es el dato correcto**, `TOTAL_BRUTO` o la cabecera de la columna M, y por qué.
2. **Registrarlo sin editar el 0015:** si queda `TOTAL_BRUTO`, un ADR nuevo que lo supere en ese punto;
   si queda la M, repuntar el código.

> **Producción sigue con la versión antigua.** El 28 sep el menú de Apps Script aún mostraba
> *Calculo Salario Base*: el repositorio y lo que se ejecuta no coinciden (DT-12, OB-27). Hasta
> desplegar, el salario base que llega a Vinculación es el calculado con la fórmula que el ADR-0015
> da por incorrecta.

**Se cierra cuando** está decidido el origen del salario base, el código lo refleja, hay un ADR que lo
registra y la versión está desplegada.

---

# Sprint 3 · Reorganizar el repositorio — 🟢 Cerrado

> **Objetivo del sprint:** que la documentación se ordene por **la pregunta a la que responde** —el
> problema, la solución, el trabajo— y no por si es "de proceso" o "de desarrollo".

Entra por delante de la webapp porque toca **todos** los documentos a la vez: hacerlo más tarde
habría obligado a rehacer las referencias de lo que se escriba en los sprints siguientes.

### OB-28 · Reordenar las carpetas y rehacer las referencias — 🔵 🟢 **Cerrado**

| | |
|---|---|
| **Vía** | 🔵 En solitario |
| **Depende de** | Nada |
| **Entregable** | La nueva estructura de carpetas y los enlaces al día |

`docs_dev/` mezclaba dos preguntas distintas: **el problema** (`problem.md`, historias, requisitos) y
**la solución** (SSD, ADR). Se revisan en momentos distintos y con criterios distintos, así que se
parten. El código deja de vivir aparte y pasa a colgar del diseño que lo justifica.

| Antes | Ahora |
|---|---|
| `docs_dev/problem.md`, `historias_usuarios.md`, `requisitos.md` | `docs_discovery/` |
| `docs_dev/SSD.md`, `docs_dev/adr/` | `docs_solutions/docs_design/` |
| `code_dev/` | `docs_solutions/src/` |
| `docs/` | `docs_work/` |

**Se cierra cuando** las carpetas están movidas y **todos** los enlaces relativos resuelven. Hecho:
149 referencias en 16 archivos. Lo que no se veía venir es que partir `docs_dev/` rompió también los
enlaces **al mismo directorio** (`requisitos_funcionales.md` → `SSD.md`, `problem.md` → `adr/`), que ahora cruzan
de `docs_discovery/` a `docs_solutions/`.

> **Lo que dejó abierto:** al repasar las referencias aparecieron **citas a sprints por número que ya
> estaban desincronizadas** antes de este cambio, y que no se pueden corregir sin decidir a qué
> apuntaban. Están recogidas al final de este documento.

---

# Sprint 4 · La webapp de coordinación — 🟡 En curso

> **Objetivo del sprint:** que exista una pantalla desde la que la Responsable de Administración
> **lance el mes, lleve el control del cierre y vea cómo ha ido**. Es la webapp que coordina la
> generación de *Gastos de Personal*, el archivo del que salen los importes mensuales.

**Se empieza antes de la reunión del 7 de septiembre, y eso ordena el sprint en dos mitades.**

| Se construye ya | Espera a la reunión o al Sprint 5 |
|-----------------|-----------------------------------|
| **OB-07** dónde vive el estado · **OB-08** qué se mide | **OB-09** avisos — necesita el calendario (OB-06) |
| **OB-20** esqueleto · **OB-21** lanzar el mes | **OB-10** seguimiento — necesita decidir si se declara *"no tengo nada"* |
| **OB-22** tablero de los nueve pasos, a mano | **OB-13** deducir el estado — necesita OB-18 (Sprint 5) |
| | **OB-14** informes |

> **Hay un motivo para empezar antes y no después.** El bloque F de la
> [reunión](reuniones/2026-09-07-revision-del-proceso.md) es enseñarle esta pantalla. Con la primera
> mitad construida deja de ser *"te cuento una idea"* y pasa a ser *"míralo y dime qué te falta"*.
>
> El riesgo es rehacer algo si su respuesta no encaja. Se acota no construyendo nada que dependa de
> lo que ella tiene que contestar: los nueve pasos salen de [`FLUJO.md`](flujo_doc/FLUJO.md), verificado contra
> el código.

## Primera mitad — antes de la reunión

### OB-07 · Diseñar dónde vive el estado del cierre — 🔵

| | |
|---|---|
| **Responde a** | [RF-42…RF-45](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | Nada para empezar · OB-03 para cerrarlo |
| **Va el primero** | Es un ADR: se decide antes de escribir código |

Buena parte del estado del cierre **ya es deducible** de lo que el sistema registra hoy. El problema
es que esos registros viven en **cinco libros distintos**, y leerlos todos en cada carga es lento y
frágil.

La decisión: ¿el panel los lee al vuelo, o cada script escribe además una línea en un **registro
central**? Es la decisión de arquitectura de esta pieza y **merece un ADR antes que código**.

**Se cierra cuando** hay un ADR con el modelo de datos decidido.

### OB-08 · Definir qué se mide y dónde se guarda — 🔵

| | |
|---|---|
| **Responde a** | [RF-51…RF-56](../docs_discovery/requisitos_funcionales.md) · [problem.md §6.1](../docs_discovery/problem.md) |
| **Depende de** | Nada |

Las cinco familias —volumen, ejecución, cobertura, puntualidad y valor— ya están definidas. Falta
concretar **qué campo alimenta cada indicador** y **dónde se guarda el histórico**, para que comparar
un trimestre con otro no dependa de que nadie haya sobrescrito una hoja.

**Se cierra cuando** están decididos el almacén y qué se escribe en él tras cada cierre.

### OB-20 · El esqueleto de la webapp — 🔵

| | |
|---|---|
| **Responde a** | [RF-42…RF-45](../docs_discovery/requisitos_funcionales.md) · [HU-36](../docs_discovery/historias_usuarios.md) |
| **Depende de** | Nada |

Acceso, portada y navegación, reutilizando el patrón de las webapps que ya existen —el portal de
complementos ya resuelve el enrutado y la validación por email—. **No inventar uno nuevo.**

**Se cierra cuando** se entra, se identifica quién entra y se navega entre las secciones vacías.

### OB-21 · Lanzar el mes y registrar sus fechas — 🔵

| | |
|---|---|
| **Responde a** | [RF-36…RF-38](../docs_discovery/requisitos_funcionales.md) · [HU-26](../docs_discovery/historias_usuarios.md) · [RF-36, RF-37](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-20 |
| **Es la primera parte de** | OB-09 — los avisos automáticos vienen después |

Lanzar el periodo indicando **fecha tope de reporte** y **fecha de entrega del documento final**. La
de lanzamiento la toma el sistema. Y no se puede lanzar dos veces el mismo mes.

> Con esto solo, el arranque del mes **deja de ser un acuerdo verbal** — que es hoy el paso 0 del
> proceso y el único que no deja ni rastro ni fecha.

**Se cierra cuando** un mes se puede lanzar y las tres fechas quedan registradas y consultables.

### OB-22 · El tablero de los nueve pasos — 🔵

| | |
|---|---|
| **Responde a** | [RF-42…RF-45](../docs_discovery/requisitos_funcionales.md) · [HU-29, HU-30](../docs_discovery/historias_usuarios.md) · [RF-42, RF-45](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-07 y OB-21 |
| **Es la primera parte de** | OB-13 — deducir el estado del registro viene después |

Los nueve pasos del cierre ([FLUJO.md §3](flujo_doc/FLUJO.md)) con su estado —pendiente, lanzado, completado,
con incidencias— **marcados a mano**, y notas por paso y por mes.

> **Marcar a mano no es una versión pobre: es el punto de partida correcto.** Deducir el estado del
> registro exige antes decidir dónde vive (OB-07) y que los procesos dejen rastro (OB-18). Mientras
> tanto, un tablero manual ya sustituye a lo que hoy vive en la cabeza de una persona.
>
> Y cuando llegue la deducción automática, [RF-43](../docs_discovery/requisitos_funcionales.md) exige que se distinga
> lo deducido de lo marcado a mano — así que la marca manual **no se tira**, se queda.

**Se cierra cuando** se ve el estado del mes en curso y se pueden dejar notas.

## Segunda mitad — después de la reunión

### OB-09 · Construir el lanzamiento del cierre y los avisos — 🔵

| | |
|---|---|
| **Responde a** | [RF-36…RF-38](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-06 |

Una webapp desde la que la Responsable de Administración **lanza el mes**, indicando la fecha tope de
reporte y la de entrega del documento final. La fecha de lanzamiento la toma el sistema. A partir de
ahí, aviso automático a responsables y secretarias con qué se espera de cada uno y hasta cuándo.

**Se cierra cuando** el mes se puede lanzar desde ahí y los avisos salen solos.

### OB-10 · Construir el seguimiento de lo reportado — 🔵

| | |
|---|---|
| **Responde a** | [RF-39…RF-41](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-09 |

Ver **quién ha reportado y quién no** durante los días de recogida. Para los responsables de
complemento es directo. Para secretarias y profesores hay que resolver antes el problema del
denominador: hoy *no haber enviado* y *no tener nada que reportar* son **indistinguibles**.

**Se cierra cuando** se ve la lista de quién falta, o se ha decidido conscientemente que en esos dos
colectivos no se va a medir.

### OB-13 · Construir el panel de coordinación — 🔵

| | |
|---|---|
| **Responde a** | [RF-42…RF-45](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-07 |

Estado de cada uno de los **nueve pasos** del cierre: pendiente, lanzado, completado, con
incidencias. Deduce del registro lo que ya consta y pide a mano solo lo que no deja rastro. Con
**comentarios** por paso y por mes, para recoger lo que no funcionó.

**Se cierra cuando** se ve el estado del mes en curso sin abrir ninguna hoja.

### OB-14 · Los informes del proceso — 🔵

| | |
|---|---|
| **Responde a** | [RF-51…RF-56](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | OB-08 |

Mensual para actuar, trimestral para ver variaciones, anual para valorar. Cada destinatario recibe lo
suyo: **Administración** el detalle del mes, **Data** el dato en bruto y comparable, **Gerencia** el
resumen y la tendencia.

**Se cierra cuando** los tres informes se generan solos y cada uno llega a quien le sirve.

---

# Sprint 5 · Saldar la deuda — 🟡 En curso

> **Objetivo del sprint:** que **todo lo que ocurre en el sistema deje rastro**, que nada escriba
> encima de datos buenos sin avisar, y liquidar las **20 entradas** del inventario de
> [deuda técnica](dudas/deuda-tecnica.md).

No construye nada nuevo: **arregla lo que ya existe**. Va después del arranque de la webapp y antes
de darla por terminada, porque el panel y los informes deducen su información del rastro que este
sprint repara.

> **Una advertencia sobre este sprint:** toca **código en producción que mueve nóminas**. Cada
> objetivo debe cerrarse comprobado sobre datos reales, y ninguno debe mezclarse con otro en el mismo
> cambio. Si algo sale mal, hay que poder saber cuál de los arreglos lo causó.

## Trazabilidad

### OB-17 · Que los export no sobrescriban sin mirar — 🔵

| | |
|---|---|
| **Responde a** | [RF-21…RF-26](../docs_discovery/requisitos_funcionales.md) · [HU-18](../docs_discovery/historias_usuarios.md) · [RF-23, RF-24](../docs_discovery/requisitos_funcionales.md) · R-07, R-17 |
| **Depende de** | Nada |

**Export Neto** y **Export Bruto** escriben en el destino **sin comprobar si ya tiene datos**. Los
otros dos volcados sí lo comprueban: cuentan las celdas ocupadas y avisan. Estos no miran.

- Añadirles la comprobación que ya tienen los otros dos, para no inventar un mecanismo nuevo.
- Y en los cuatro, que el aviso pueda **impedir** la escritura, no solo advertirla.

> Va el primero del sprint. Hoy se puede escribir encima del mes anterior sin que nada lo impida, en
> un proceso que mueve nóminas.

### OB-18 · Dejar rastro de los procesos que se ejecutan solos — 🔵

| | |
|---|---|
| **Responde a** | [HU-20](../docs_discovery/historias_usuarios.md) · [RF-47](../docs_discovery/requisitos_funcionales.md) · R-18 |
| **Depende de** | Nada |
| **Desbloquea** | HU-29 (panel), HU-33 … HU-35 (informes) |

Los dos scripts que sincronizan las listas de los formularios con el personal activo **no dejan
ningún rastro consultable**: escriben solo en el registro interno de la plataforma, que se borra.

Son justo los que deciden **quién aparece en los formularios**. Si un día dejan de funcionar o
cambian una lista, no hay dónde mirarlo — y a diferencia de los volcados, **nadie está delante**
cuando ocurren.

- Que cada ejecución deje entrada con momento, resultado y qué cambió.
- Y que se pueda ver **cuándo fue la última vez que funcionaron**, que es la pregunta que se hace
  cuando algo falla.

> **Es el objetivo con más cosas colgando de él** de todo el plan: el panel del cierre y los tres
> informes deducen su información de este rastro.

### OB-19 · Convertir el traslado al archivo de cálculo en una acción con constancia — 🔵

| | |
|---|---|
| **Responde a** | [RF-21…RF-26](../docs_discovery/requisitos_funcionales.md) · [HU-19](../docs_discovery/historias_usuarios.md) · [RF-25, RF-26](../docs_discovery/requisitos_funcionales.md) · R-19 |
| **Depende de** | **OB-03 y OB-04** — saber cuáles son los archivos y cuándo se mueve cada cosa |

Los movimientos de datos entre libros se hacen **copiando y pegando**, y ninguno deja constancia. Es
el punto donde el dato sale del sistema y se corta la cadena de trazabilidad.

La acción prepara el movimiento, muestra qué va a cambiar y **solo escribe si se confirma** — el
mismo patrón de los volcados, no uno nuevo. Y avisa si ese traslado ya se hizo este mes.

> **La lanza ella, no el sistema.** Es la condición para que automatizar este paso no se perciba como
> perder el control sobre datos sensibles ([RNF-05](../docs_discovery/requisitos_no_funcionales.md)).

## Deuda técnica — las 20 entradas

Agrupadas como en [`deuda-tecnica.md`](dudas/deuda-tecnica.md), para poder cerrarlas por bloques en
lugar de una a una.

### OB-23 · Corrección funcional — 🔵

| | |
|---|---|
| **Cubre** | DT-01, DT-03, DT-08, DT-16 |
| **Depende de** | DT-08 necesita la respuesta de la reunión (¿`TALLER` y `MECÁNICO` son el mismo concepto?) |

Lo que puede **dar un número equivocado**: el parser que corrompe los decimales con punto, los tres
parsers distintos conviviendo, y las cabeceras del histórico de profesores que se copian por
posición.

> Va el primero del bloque. Es el único grupo cuyo fallo se traduce **directamente en un importe
> mal calculado**.

**Se cierra cuando** hay un solo parser de números en todo el sistema y el histórico de profesores
no puede mezclar conceptos.

### OB-24 · Robustez y diseño — 🔵

| | |
|---|---|
| **Cubre** | DT-02, DT-04, DT-05, DT-17, DT-18, DT-19, DT-20 |
| **Depende de** | DT-20 necesita saber cuáles son los archivos de destino (OB-03) |

Lo que **se rompe al crecer** o al tocarlo: la escritura celda a celda, el mapeo por posición fija,
la URL escrita a mano en los correos, la ausencia de tests — y las tres deudas de diseño que salieron
de aplicar SOLID: funciones que hacen demasiado, código copiado entre scripts y el ID del libro
destino repetido en dos sitios.

> **DT-19 exige una decisión antes que código:** compartir lógica entre proyectos de Apps Script
> pasa por una biblioteca, y eso crea una dependencia que hay que versionar. **Merece un ADR.**

**Se cierra cuando** ninguna lógica vive duplicada y las escrituras no dependen del volumen.

### OB-25 · Consistencia de los datos — 🔵

| | |
|---|---|
| **Cubre** | DT-06, DT-07, DT-09, DT-10, DT-11 |
| **Depende de** | DT-11 necesita respuesta de negocio (¿qué significa `Tipología_Profesor`?) |

Lo que **nadie sabe explicar del todo**: el mapeo duplicado entre código y hoja, las cabeceras de
personal inconsistentes, el concepto de prueba activo en producción, la cuenta de pruebas entre los
responsables y una columna cuyo significado no consta.

**Se cierra cuando** no queda ningún dato en producción cuyo significado no esté escrito.

### OB-26 · Higiene del código — 🔵

| | |
|---|---|
| **Cubre** | DT-13, DT-14, DT-15 |
| **Depende de** | Nada |

El bloqueo que le falta a la webapp de complementos —la única que escribe sin él, y la que usan
varias personas a la vez—, el registro que escribe por posición y el archivo de backend sin
extensión.

> Es el bloque más barato del sprint y el que menos se nota. Entra porque **DT-13 es el único punto
> del sistema donde dos personas pueden pisarse el dato**.

**Se cierra cuando** las cuatro piezas que escriben lo hacen con bloqueo y por nombre de columna.

### OB-27 · Repositorio y despliegue — 🔵

| | |
|---|---|
| **Cubre** | DT-12 |
| **Depende de** | Nada |

El repositorio y los proyectos de Apps Script se sincronizan **copiando y pegando**, y pueden
divergir sin que nadie lo note. Evaluar `clasp`.

> Es el más caro de los cinco y el único que no arregla un fallo, sino que **evita una clase entera
> de fallos futuros**: los que vienen de que el código revisado y el código que se ejecuta no sean el
> mismo.

**Se cierra cuando** existe una forma comprobable de saber si repositorio y producción coinciden.

### OB-38 · Blindar las hojas de personal contra errores de entrada — 🔵 🟡 **A medias**

| | |
|---|---|
| **Responde a** | [RF-01, RF-02](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | Nada · la parte de código conviene hacerla junto con DT-19 (OB-24), porque toca código duplicado |
| **Prioridad** | 🔸 Should |

**Lo que pasó (25 sep 2026):** varias filas de `VAP_Profesores` no aparecían en el formulario. Su
columna `Alta` contenía el **texto** "TRUE" y no el valor verdadero. En pantalla se ven igual, pero
el script compara con `=== true` y **las descartaba sin avisar**. Nadie lo supo hasta que alguien
echó en falta un nombre.

**Lo hecho** 🟩 — `VAP_Profesores` tiene desde ese día tres reglas en la hoja, sin tocar código
(detalle en [SSD §6.1.0](../docs_solutions/docs_design/SSD.md#610-reglas-de-entrada-de-vap_profesores)):

| Columna | Regla |
|---------|-------|
| `Empresa` | Desplegable en `A2:A`, rechaza lo que no esté en la lista |
| `ID_Profesor` | Calculado en `C2` como `Empresa_Id_Sage`; vacío si falta alguno de los dos |
| `Alta` | Casilla en `G2:G`, rechaza lo que no sea verdadero o falso |

**Lo que falta** 🔍:

1. **Las mismas reglas en `VAP_Secretarias`.** Antes de calcular `ID_Secre` con fórmula, comprobar
   que los IDs actuales siguen la regla `Empresa_Id_Sage`: el ID viaja a las respuestas, y cambiar
   uno desvincula su histórico.
2. **Proteger `C2:C` de `VAP_Profesores`** (*Datos → Proteger hojas e intervalos*, con advertencia).
   Escribir a mano en esa columna rompe la fórmula entera.
3. **La red en el código:** que `obtenerProfesoresActivosUnicos_()` y su gemela de secretarias
   **registren** cada fila con `ID` y `Nombre` cuyo `Alta` no sea ni verdadero ni falso, indicando
   la fila. **No hay que aceptar el texto "TRUE" sin más**: eso escondería el error en vez de
   mostrarlo. La misma función está copiada en
   [`VAP_Script_Actualizacion_Automatica_Profesores.js`](../docs_solutions/src/VAP_scripts_profesores/VAP_Script_Actualizacion_Automatica_Profesores.js)
   y en
   [`VAP_Script_Actualizacion_Automatica_Secretarias.js`](../docs_solutions/src/VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_Script_Actualizacion_Automatica_Secretarias.js):
   **el cambio va en las dos**, o se corrige una y se olvida la otra ([CLAUDE.md](../CLAUDE.md), DRY).

**Se cierra cuando** las dos hojas tienen las tres reglas, y una fila con `Alta` en texto aparece en
el registro de ejecución de los dos scripts.

---

# Sprint 6 · Lo que hay que pedir y preguntar — 🟡 En curso

> **Objetivo del sprint:** reunir lo que **no depende de nosotros** — los documentos que emiten
> ADESLAS, COBEE y el banco, y las respuestas que solo puede dar quien opera el sistema cada mes.

Aquí no se construye nada: se pide y se pregunta. Todo lo que se construye con estas respuestas está
en el **[Sprint 1](#sprint-1--contrastar-el-vap-con-fuentes-externas)**.

> **Verificar contra un dato del propio sistema no es verificar**, es comprobar que coincide consigo
> mismo. De ahí que el contraste dependa de documentos que emiten terceros.

## Lo que hay que pedir y preguntar

### OB-01 · Solicitar los tres documentos de contraste — 🟠 🟡 **A medias**

| | |
|---|---|
| **Responde a** | [RF-31…RF-35](../docs_discovery/requisitos_funcionales.md) |
| **Depende de** | Que las entidades los envíen |

| Entidad | Qué se pide | Para qué |
|---------|-------------|----------|
| **ADESLAS** | Relación real de asegurados con su importe | Contrastar el seguro médico |
| **COBEE** | Ayudas concedidas de comida y transporte | Contrastar los dos conceptos de COBEE |
| **Banco** | Fichero de transferencias emitidas | Contrastar lo pagado con lo calculado |

> **🟡 7 de septiembre: los tres han llegado y están analizados** — ver
> [DUDA-0004](dudas/0004-formato-de-las-tres-fuentes-de-contraste.md). Es lo que desbloquea el
> Sprint 1 y lo que hace que entre por arriba.
>
> **Pero dos de los tres vienen mal servidos**, y eso no se arregla programando:
>
> - **El del banco no es la remesa.** Declara 208 pagos y trae 10 filas: es un volcado de lo que
>   había en pantalla. Hay que **pedir la exportación completa**.
> - **El de COBEE llega con la codificación rota y sin saltos de línea** — todos los registros en
>   una sola línea. Hay que **pedir el export bien hecho** antes de programar contra él.
> - Falta saber si **hay más pólizas de ADESLAS**: la recibida cubre una sola de las seis empresas
>   que aparecen en Vinculación.

**Se cierra cuando** los tres ficheros están completos y bien formados, y se sabe con qué
periodicidad llegan.

### OB-02 · Validar el mapa del flujo — 🟣

| | |
|---|---|
| **Responde a** | documentación |
| **Depende de** | Nada: el material ya está listo |
| **Material** | [`flujo_doc/`](flujo_doc/) — el documento y los ocho diagramas |

Contrastar el recorrido completo con quien lo ejecuta cada mes. El documento lleva al final una lista
de **diez puntos a validar**, ordenados por importancia.

> **🔍 Un punto más, del 7 de septiembre.** Se ha abierto en lectura
> `VINCULACIÓN GASTOS PERSONAL 2026` y parte del **bloque 4** de
> [FLUJO.md](flujo_doc/FLUJO.md) ya no está sin verificar: el libro existe, sus columnas son las que
> describe [DUDA-0006](dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) y el
> rango `AC..CN` cuadra. **Pero FLUJO.md dice que el destino es `Hoja 1`, y el libro tiene varias
> pestañas** con la misma estructura y fechas distintas. Hay que resolver cuál es la buena **antes**
> de quitarle la marca 🔍 al bloque — y por eso no se ha tocado el mapa aquí.

**Se cierra cuando** el mapa refleja el proceso real, y las marcas de *sin confirmar* han
desaparecido o se han convertido en dudas con ficha propia.

### OB-03 · Averiguar qué es *Gastos de Personal* — 🟣

| | |
|---|---|
| **Responde a** | [DUDA-0001](dudas/0001-RESUELTA-tres-libros-destino-de-los-volcados.md) · desbloquea Fases 3.A y 5.C |
| **Depende de** | Conseguir acceso de lectura al archivo |

Es **la mayor laguna del mapa**: el archivo donde se calcula la nómina, del que no consta ni el
nombre completo ni la estructura. Y con él, la pregunta mayor: **cuáles son de verdad los archivos de
destino y cuántos son** — puede que haya varios Excel distintos en juego.

**Se cierra cuando** se sabe qué archivos son, cómo se llaman y cuál alimenta el cálculo final.

### OB-04 · Recorrer los momentos de copia y pega — 🟣

| | |
|---|---|
| **Responde a** | [DUDA-0003](dudas/0003-momentos-de-copia-y-pega-del-proceso.md) · desbloquea Fase 3.A |
| **Depende de** | OB-03 |

Hay **al menos cuatro momentos** en que alguien mueve datos a mano y ninguno deja rastro. Hay que
averiguar **cuándo ocurre cada uno y en qué orden** — sobre todo si el Excel de SAGE se pega antes o
después de rellenar la productividad, porque hacerlo al revés **borra el trabajo del mes**.

Y de paso, plantear la alternativa: convertirlos en **acciones que ella lanza cuando quiere**, que
preparan el movimiento y solo escriben si confirma.

**Se cierra cuando** los cuatro movimientos están fechados y ella ha dicho si la versión
semiautomática le encaja.

### OB-05 · Aclarar el signo del seguro médico y COBEE — 🟣

| | |
|---|---|
| **Responde a** | [DUDA-0002](dudas/0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md) |
| **Depende de** | Hablar también con el Gestor de nóminas |

El cálculo del salario base **suma** esos importes en valor absoluto, mientras que el volcado a
Vinculación los copia con el signo que traigan.

**Se cierra cuando** se sabe si el valor absoluto es una decisión de diseño —y entonces se escribe un
ADR— o un parche que tapa un error del origen, y entonces se corrige.

### OB-06 · Fijar y escribir el calendario del cierre — 🟣

| | |
|---|---|
| **Responde a** | [RF-36…RF-38](../docs_discovery/requisitos_funcionales.md) · [FLUJO.md §8](flujo_doc/FLUJO.md) |
| **Depende de** | Nada más que acordarlo |

Hoy el calendario del mapa es **una inferencia**. Hace falta el real: qué día se pega el Excel de
SAGE, cuándo se lanzan los volcados, cuándo es la revisión con Gerencia, cuál es la fecha tope — y
**quién avisa a quién** de que puede empezar cada paso.

**Se cierra cuando** el calendario está escrito y validado. Sin él no se puede hacer el Sprint 4.

> **Los cinco objetivos 🟣 se resuelven en una sola reunión** —la del
> [7 de septiembre](reuniones/2026-09-07-revision-del-proceso.md)— si se lleva con guion. No son
> cinco reuniones.

> **OB-11 y OB-12 ya no están aquí.** Se han mudado al **Sprint 1**, que es donde se construye el
> contraste ahora que los documentos han llegado. Los identificadores no cambian: identifican, no
> ordenan.

---

## Una pauta que atraviesa todos los sprints

**Automatizar el trabajo, no la decisión de hacerlo.** Nada de lo que se construya aquí debe
dispararse solo: prepara, muestra y espera confirmación. Es el patrón que ya siguen los tres
volcados, y el que hace que automatizar no se sienta como perder el control sobre datos sensibles
([problem.md §7](../docs_discovery/problem.md)).

## Citas a sprints pendientes de aclarar

Al reorganizar el repositorio (OB-28) se repasaron todas las referencias cruzadas. Estas citan un
sprint **por un número que no le corresponde**, y corregirlas exige decidir a qué apuntaban. Se
dejan anotadas en lugar de adivinarlas.

> Al entrar el Sprint 1 por arriba (7 septiembre 2026) se renumeró el resto y se repusieron las
> citas que **esa** renumeración rompió — las de `requisitos_funcionales.md` y
> `requisitos_no_funcionales.md`, que ahora apuntan al Sprint 2. Las de abajo ya estaban torcidas
> antes y siguen sin tocarse.

| Dónde | Qué dice | El problema |
|---|---|---|
| OB-06, *"Se cierra cuando"* | *"Sin él no se puede hacer el Sprint 4"* | Con la numeración de hoy, OB-06 está en el Sprint 6 y el 4 es la webapp. Si lo que bloquea el calendario son los avisos (OB-09), la cita apunta al Sprint 4 |
| [Acta del 7 de septiembre](reuniones/2026-09-07-revision-del-proceso.md) | *"Bloquea todo el Sprint 5"* | Se escribió cuando no había Sprint 5. Hoy el 5 es *Saldar la deuda*, que no es lo que el acta quería decir. **Es un acta: no se toca sin decidirlo** |
| [`historias_usuarios.md`](../docs_discovery/historias_usuarios.md) *(tres citas)* | *"El Sprint 3 existe por estas tres historias"* · *"los informes del Sprint 2"* · *"encabeza el Sprint 3"* | Las tres hablan de **la webapp**, que hoy es el Sprint 4 — pero ya se contradecían entre sí antes de renumerar. Hay que decidir a qué apuntan las tres a la vez |

## Cómo mantener este documento

Cuando aparece trabajo nuevo, se añade como objetivo pequeño en lugar de engordar uno existente. Si
un objetivo lleva semanas sin moverse, casi siempre es que **está bloqueado y no se ha marcado**, o
que es demasiado grande: las dos cosas se ven mirando la columna de dependencias.
