# PRÓXIMOS PASOS — Sistema VAP

**Qué toca hacer ahora**, agrupado en sprints y en trozos lo bastante pequeños como para cerrarlos.

| | |
|---|---|
| **Versión** | 0.9 |
| **Fecha** | 16 noviembre 2026 |
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
| **`proximos_pasos.md`** *(este)* | **¿Qué hago ahora, y qué me lo impide?** |
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
| **1 · Contrastar el VAP con fuentes externas** | Comprobar lo que calcula el sistema contra ADESLAS, COBEE y el banco | OB-11, OB-12, OB-35, OB-36, OB-40, OB-44, OB-45 *(por colocar)* | 🟡 **En curso** — las cuatro fuentes ya analizadas (ADESLAS y SAGE a fondo; COBEE y banco con muestra incompleta) |
| **2 · Saldar la auditoría** | Cerrar lo que la auditoría de dos pasadas dejó al descubierto | OB-29 … OB-34, OB-37, OB-39 | 🟡 **En curso** — OB-29, OB-32, OB-33 y OB-37 cerrados; OB-31 a medias |
| **3 · Reorganizar el repositorio** | Ordenar la documentación por la pregunta a la que responde | OB-28 | 🟢 **Cerrado** |
| **4 · La webapp de coordinación** | Que el cierre se lance, se siga y se mida desde una pantalla | OB-07, OB-08, OB-20 … OB-22, OB-09, OB-10, OB-13, OB-14, OB-41, OB-42, OB-43, OB-46 | 🟡 **En curso** — esqueleto v0.1.0 escrito y probado; falta crear el libro y desplegarlo |
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
[`VAP_Script_Cruce_BBDD_Personas_SAGE.gs`](../docs_solutions/src/scripts_generales/VAP_Script_Cruce_BBDD_Personas_SAGE.gs) —
se reutiliza, no se duplica ([CLAUDE.md](../CLAUDE.md)).

**Se cierra cuando** hay una decisión escrita y validada, **y un ADR que la registre**.

> **Posición del desarrollo, 16 nov 2026:** cruzar el **último export de SAGE** con los datos de
> nómina y los **ficheros del banco** es una de las funcionalidades más esperadas, así que **la
> correspondencia persona ↔ cuenta se necesita desde el primer día**. La propuesta es una **hoja
> aparte con `id_personal` y una huella de la cuenta**, sin guardar el IBAN y sin el DNI en esa hoja.
> **Sigue pendiente de validar** con Gerencia y protección de datos, y de escribirse en el ADR.

### OB-45 · Crear `VAP_Pagos`, la huella y la carga inicial de cuentas — 🔵

| | |
|---|---|
| **Responde a** | [RF-86…RF-89](../docs_discovery/requisitos_funcionales.md) · [RNF-19 · RNF-20](../docs_discovery/requisitos_no_funcionales.md) · [HU-48](../docs_discovery/historias_usuarios.md) |
| **Depende de** | OB-36 (la decisión y su ADR) · **las decisiones de seguridad firmadas** · OB-46 para el mantenimiento mes a mes |
| **Sprint** | ⚠️ **Por colocar.** Decidido el 16 nov 2026 que va **al siguiente sprint**; falta abrirlo (ver nota) |

Un libro nuevo, **`VAP_Pagos`**, con el `id_personal` de cada persona y la **huella** de su cuenta, sin
IBAN, sin DNI y sin nombre. La clave con la que se calcula vive en la configuración del script. El
diseño completo está en [fuentes_de_contraste.md §12](docs_cruce/fuentes_de_contraste.md).

**La carga inicial es de uso único:** con el fichero completo del banco de cada empresa, el sistema
propone a la persona por empresa y nombre, comprueba que el importe coincide con su líquido en SAGE, y
**una persona confirma** antes de guardar (en bloque las de nombre único e importe coincidente, una a
una las demás). Después se retira: el mantenimiento pasa a ser Altas/bajas (OB-46).

> **Decisiones de seguridad que hay que firmar una a una antes de crear nada:** algoritmo de la huella
> (propuesta: HMAC-SHA256), **dónde y cómo se guarda la clave**, quién puede abrir `VAP_Pagos`, copia de
> seguridad de la clave (si se pierde, hay que repetir la carga inicial), plazo de conservación y si la
> pantalla enseña los últimos dígitos al confirmar.
>
> **Sobre el sprint:** la regla del proyecto es que el sprint nuevo entra **por arriba** y el resto
> baja, con la consecuencia de renumerar. Cambia cientos de referencias, así que **no se ha hecho** sin
> tu visto bueno.

**Se cierra cuando** `VAP_Pagos` existe con sus permisos, la huella se calcula sin que la cuenta salga
de memoria, y las cuentas de las personas actuales están cargadas con confirmación.

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

### OB-40 · Definir las tres comprobaciones de ADESLAS y registrarlas en un ADR — 🔵

| | |
|---|---|
| **Responde a** | [RF-72…RF-75](../docs_discovery/requisitos_funcionales.md) · [HU-23](../docs_discovery/historias_usuarios.md) · [HU-42](../docs_discovery/historias_usuarios.md) |
| **Depende de** | OB-11 · una muestra **del segundo** export de SAGE (del primero ya hay una) · la respuesta a si el export de SAGE puede **incluir el DNI** *(pedido el 16 nov 2026)* |
| **Sale de aquí** | Un ADR *«Contraste con fuentes externas: lectores y fichas por comprobación»* |

El documento de ADESLAS se contrasta contra **tres orígenes**: primer export de SAGE, Vinculación de
gastos de personal y segundo export de SAGE. Cada una es una **ficha** que dice qué dos documentos
compara, por qué campo cruza, con qué signo y con qué tolerancia. El lector de ADESLAS es **uno solo**
y sirve a las tres.

**Ya se sabe del cruce de ADESLAS contra la Vinculación** (hoja `Hoja 1`, solo cifras agregadas):
agrupar por certificado e identificar por el `NIF` del titular **funciona** —68 de 71 titulares casan
por DNI—; el libro guarda `ADESLAS` **en negativo**; hace falta decidir una tolerancia (hay un caso de
1 céntimo); y el informe necesita separar «con 0 €», «con otro importe», «no está en el libro» y «en el
libro sin ser titular». Detalle en [fuentes_de_contraste.md §9](docs_cruce/fuentes_de_contraste.md).

**Preguntas sin contestar** (una por una, con quien corresponda):
1. ¿Qué hoja de la Vinculación es la del mes que se contrasta, y qué son `020326` y `COMPR`?
2. ¿Qué significan los importes de **+1,00 €** que aparecen en la columna `ADESLAS` del libro?
3. ¿Qué tolerancia se acepta?
4. ¿Dónde empiezan los datos de la Vinculación? Las pruebas dicen que en la **fila 7**, y
   [DUDA-0006](dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) dice la 9.
5. ¿Qué son las 5 columnas de más del fichero de ADESLAS (23 en el fichero, 18 en el documento)?
6. ¿Puede el export de SAGE incluir el DNI? Sin él, el cruce da un salto por la Vinculación
   (empresa + nº de empleado) y deja 22 personas sin pareja. **Pedido el 16 nov 2026.**
7. ¿La muestra de SAGE es el primer o el segundo export del mes? Los importes de **COBEE** llegan
   **vacíos** (493 de 493) y habría que saber si es lo esperado: [fuentes_de_contraste.md §10](docs_cruce/fuentes_de_contraste.md).

**Se cierra cuando** las tres fichas están escritas, probadas con ficheros ficticios y recogidas en un
ADR **aceptado**.

### OB-44 · Comprobar que cada persona sigue en concordancia entre SAGE y el maestro de personas — 🔵

| | |
|---|---|
| **Responde a** | [RF-80 · RF-81](../docs_discovery/requisitos_funcionales.md) · [HU-46](../docs_discovery/historias_usuarios.md) |
| **Depende de** | Ver las hojas de `VAP_BBDD_Personas` (**no se han visto**: hay varias pestañas y la comprobación toca más de una) · la respuesta sobre el **DNI en el export de SAGE** |
| **Es la base de** | OB-40 y OB-43: es la comprobación previa a las demás |

Al empezar el mes: actualizar a mano el export de SAGE y las altas y bajas del maestro de personas, y
**comprobar que `id_trabajador` y DNI coinciden**. Resultado **A** (todo correcto, se sigue) o **B**
(incidencias: **B.1** un DNI relacionado con otro identificador, **B.2** una persona en un origen y no
en el otro). Se corrige a mano en la hoja que proceda y **se repite hasta que sale todo correcto**. Las
palabras exactas están en [fuentes_de_contraste.md §11](docs_cruce/fuentes_de_contraste.md).

**Hay datos reales que ya apuntan a incidencias de los dos tipos** (cruce contra la Vinculación, no
contra el maestro): 22 personas de SAGE sin pareja, 32 de la Vinculación sin SAGE y una clave empresa +
nº con dos DNI. **No sé si el maestro de personas las tendría**, porque no lo he visto.

**Se cierra cuando** la comprobación se ejecuta sobre las hojas reales, en solo lectura, y lista las
incidencias de los dos tipos.

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

🟡 **En espera (14 nov 2026):** se pospone hasta decidir el despliegue, porque la producción sigue con la acción
antigua. Mientras, [FLUJO.md](flujo_doc/FLUJO.md) lleva un aviso visible de que describe la versión desplegada.
Queda por hacer: quitar ese aviso y corregir los 28 puntos cuando se despliegue.

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

### OB-31 · Cerrar la trazabilidad de los ADR — 🔵 🟡 **A medias**

🟢 **Hecho el 14 nov 2026:** la plantilla tiene la línea `Requisitos:`; los 16 ADR la declaran; SSD §12 y el
índice están al día (16 filas). Se halló una **contradicción abierta**: **RF-21** («calculará el salario base»,
✅) describe lo que el ADR-0015 retira; va a OB-39. El ADR-0011 se declara superado en parte por el 0015 **en
el índice**, sin editarlo.
🔴 **Queda** pasar los ADR a **MADR estricto** (*Decision Drivers*, *Considered Options*…) y renombrarlos con el
estado en el nombre del fichero: depende de la migración a la estructura estándar, que **no se ha decidido**.

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

### OB-32 · Documentar el script de cruce y colocarlo donde toca — 🔵 🟢 **Cerrado**

🟢 **Hecho el 14 nov 2026:** el script se mudó a `docs_solutions/src/scripts_generales/`, su cabecera dice
«cuatro hojas» y los enlaces están actualizados. 🟢 **Documentado el 14 nov 2026:** SSD §7.6 y fila en el README.

| | |
|---|---|
| **Prioridad** | 🔸 Should |

`VAP_Script_Cruce_BBDD_Personas_SAGE.gs` (905 líneas, 32 funciones) vive en `docs_work/migration_data/`
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

### OB-37 · Crear el `.gitignore` y sacar la configuración local del repositorio — 🔵 🟢 **Cerrado**

🟢 **Hecho el 14 nov 2026:** `.gitignore` creado; `docs_work/migration_data/` pasa a ser **solo para datos**
(ignorada, con README y `.gitkeep`); `settings.local.json` fuera del control de versiones; un CSV de prueba
no aparece en `git status`.

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
[`VAP_script_export_SAGE.gs`](../docs_solutions/src/scripts_generales/VAP_script_export_SAGE.gs),
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

### OB-20 · El esqueleto de la webapp — 🔵 🟡 **Código hecho, sin desplegar**

| | |
|---|---|
| **Responde a** | [RF-42…RF-45](../docs_discovery/requisitos_funcionales.md) · [HU-36](../docs_discovery/historias_usuarios.md) |
| **Depende de** | Nada |
| **Sale de aquí** | [`docs_solutions/src/webapp/`](../docs_solutions/src/webapp/README.md) v0.1.0 · [ADR-0017](../docs_solutions/docs_design/adr/0017-webapp-del-proceso-mensual-stack-y-estructura.md) · [ADR-0018](../docs_solutions/docs_design/adr/0018-gsh-propio-de-la-webapp-propietario-y-accesos.md) *(ambos Propuesta)* |

Acceso, portada y navegación. **Se ha hecho el 16 nov 2026**, con las cinco pantallas (OB-43, OB-41, OB-42,
OB-46 y el maestro) como esqueleto de **solo lectura**: acceso por rol comprobado en el servidor, hoja
`config` con los correos de cada rol, y *Proceso mensual* mostrando los tres pasos del primer grupo.

> **Cambia respecto a lo previsto:** el texto original decía *reutilizar el patrón del portal de
> complementos*. No se hizo: la webapp nueva sigue el modelo de **BUCA** (capas por prefijo, `api…` con
> comprobación de rol, pruebas de arquitectura), que ya estaba probado y es lo que registra el ADR-0017.
> El portal de complementos sigue como está.

**Se cierra cuando** está **desplegada** y la Responsable de Administración entra con su cuenta, se
identifica quién entra y navega entre las pantallas. Falta: crear el libro `VAP_Webapp`, el proyecto de
Apps Script y la propiedad `ID_LIBRO_WEBAPP`, y probar en Google real (ver *Pendientes del 16 nov*).

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

> **Desde el 16 nov 2026 esta pantalla se llama «Proceso mensual»** y sus pasos son **manuales o
> ejecutables desde ella** ([OB-43](#ob-43--la-pantalla-proceso-mensual--)). Los pasos ejecutables
> se irán incorporando de uno en uno; el tablero manual sigue siendo el punto de partida.

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

## El proceso mensual

### OB-43 · La pantalla «Proceso mensual» — 🔵

| | |
|---|---|
| **Responde a** | [RF-79](../docs_discovery/requisitos_funcionales.md) · [HU-45](../docs_discovery/historias_usuarios.md) |
| **Depende de** | OB-44 (es su primer grupo de pasos) · OB-21 y OB-22 |
| **Decidido el 16 nov 2026** | Es **la misma pantalla que OB-22**: «Proceso mensual» es su nombre de uso. **No se construye una segunda** |

Será **la primera pantalla** de la webapp. Una lista de pasos del mes, **unos manuales y otros
ejecutables desde la propia pantalla**, a los que se irán añadiendo más. El primer grupo, que se puede
ejecutar desde ella porque sus dos fuentes son hojas de Google gestionadas por este sistema, es:

1. Actualizar a mano los datos mensuales del primer export en `VAP_Export_SAGE_Laboral`.
2. Actualizar a mano `VAP_BBDD_Personas` con las altas y bajas.
3. Comprobar la concordancia de `id_trabajador` y DNI (**OB-44**).

> **Es OB-22 con otro nombre.** Lo que OB-43 añade al tablero es que **algunos pasos se ejecutan desde
> la propia pantalla**, no solo se marcan. OB-22 lo recoge con una nota.

**Se cierra cuando** la pantalla de OB-22 muestra los pasos como manuales o ejecutables y ejecuta el
primer grupo.

## Altas, bajas y modificaciones

### OB-46 · La pantalla «Altas/bajas» y el registro de cambios — 🔵

| | |
|---|---|
| **Responde a** | [RF-82…RF-85](../docs_discovery/requisitos_funcionales.md) · [HU-47](../docs_discovery/historias_usuarios.md) |
| **Depende de** | OB-45 (donde se guarda la huella) · ver **todas las pestañas** de `VAP_BBDD_Personas` (no se han visto) |

Una pantalla para **dar de alta, de baja y modificar** a una persona, y para ver todo el maestro
respetando sus pestañas. Un alta pide **empresa, identificador de SAGE, nombre, DNI y fecha de alta**; la
cuenta se puede dar en ese momento o después. Un **cambio de empresa es una baja y un alta**.

Cada cambio queda registrado en **una hoja nueva de `VAP_BBDD_Personas`** con quién, cuándo, la acción,
el identificador y el valor anterior y el nuevo, **sin la cuenta ni su huella**. El orden de las
escrituras es: **evento, cambios en los dos libros, y comprobación de que concuerdan** (RF-85).

> **Con las bajas y altas por cambio de empresa, un mismo DNI aparece dos veces.** [OB-44](#ob-44--comprobar-que-cada-persona-sigue-en-concordancia-entre-sage-y-el-maestro-de-personas--)
> debe dar por incidencia solo dos filas **activas**. Y `VAP_Pagos` tendrá dos filas con la misma
> huella (una de baja): la búsqueda mira solo las activas.

**Se cierra cuando** se da de alta, de baja y se modifica desde la pantalla, y cada cambio deja su
registro sin que un fallo a mitad de camino quede sin avisar.

## La pantalla de Comprobaciones

Salen de hablar el diseño con la Responsable de Administración el 16 noviembre 2026. Dependen del
trabajo de contraste del **Sprint 1** (OB-40) y se construyen **después** de él.

### OB-41 · La pantalla «Comprobaciones» — 🔵

| | |
|---|---|
| **Responde a** | [RF-72…RF-76](../docs_discovery/requisitos_funcionales.md) · [HU-42](../docs_discovery/historias_usuarios.md) · [HU-43](../docs_discovery/historias_usuarios.md) |
| **Depende de** | OB-40 · OB-35 · la decisión de **cómo entra la Vinculación** (se sube como Excel o se lee de Drive) |

Una pantalla para elegir la comprobación de una lista **cerrada** (solo la amplía el desarrollo), subir
los dos documentos, ver las comprobaciones previas de cada uno (integridad y mes), y recibir el
resultado con un icono para **copiar al correo**, que por defecto lleva solo el resumen.

**Sin verificar:** que Apps Script pueda leer un `.xls` o un `.xlsx` de 1,3 MB con tres pestañas.
Condiciona todo el diseño de la subida y hay que probarlo **con ficheros ficticios** antes de dibujar
nada definitivo.

**Preguntas abiertas:** ¿se sube la Vinculación o se lee de Drive? Al volver a comprobar, ¿se vuelve a
subir el documento externo o se conserva un rato (son datos personales)? ¿El mes lo elige la
Responsable o se detecta del fichero?

**Se cierra cuando** la Responsable elige una comprobación, sube dos ficheros y obtiene su resultado
sin ayuda.

### OB-42 · El registro de diferencias, consultable y marcable como resuelto — 🔵

| | |
|---|---|
| **Responde a** | [RF-77 · RF-78 · RNF-18](../docs_discovery/requisitos_funcionales.md) · [HU-44](../docs_discovery/historias_usuarios.md) |
| **Depende de** | OB-41 · **una decisión escrita sobre protección de datos** |
| **Va el primero** | Es un ADR: dónde se guardan, quién los ve y cuánto se conservan |

Cada diferencia se guarda, identificada por **comprobación + periodo + persona + tipo**, con estado
abierta o resuelta. Al volver a comprobar, las que ya no salen se cierran y las que siguen no se
duplican. **Se consulta desde otra pantalla.**

> **Es la primera vez que el sistema guarda nombres y DNI de forma duradera para esta función.** Lo que
> se dijo antes —procesar y borrar— ya no vale para este registro, y hay que decidirlo y escribirlo
> antes de construir nada: el registro se ve desde otra pantalla, así que es otra superficie de
> compartición.

**Se cierra cuando** hay un ADR aceptado con esa decisión, y se puede marcar una diferencia como
resuelta y consultarla después.

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
   [`VAP_Script_Actualizacion_Automatica_Profesores.gs`](../docs_solutions/src/VAP_scripts_profesores/VAP_Script_Actualizacion_Automatica_Profesores.gs)
   y en
   [`VAP_Script_Actualizacion_Automatica_Secretarias.gs`](../docs_solutions/src/VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_Script_Actualizacion_Automatica_Secretarias.gs):
   **el cambio va en las dos**, o se corrige una y se olvida la otra ([CLAUDE.md](../CLAUDE.md), DRY).

**Se cierra cuando** las dos hojas tienen las tres reglas, y una fila con `Alta` en texto aparece en
el registro de ejecución de los dos scripts.

---

# Sprint 6 · Lo que hay que pedir y preguntar — 🟡 En curso

> **Objetivo del sprint:** reunir lo que **no depende de nosotros** — los documentos que emiten
> ADESLAS, COBEE y el banco, y las respuestas que solo puede dar quien opera el sistema cada mes.

Aquí no se construye nada: se pide y se pregunta. Todo lo que se construye con estas respuestas está
en el **[Sprint 1](#sprint-1--contrastar-el-vap-con-fuentes-externas--en-curso)**.

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


## Pendientes que salen del trabajo del 14 nov 2026

| Qué | Por qué | Decide |
|---|---|---|
| ~~**Base de pruebas del código** (`package.json`, Vitest, Biome, `tests/`)~~ **Hecho** | Vitest y Playwright existen desde el 14 nov, y **Biome desde el 16 nov, solo para `docs_solutions/src/webapp/` y `tests/webapp/`** (el código antiguo no se reformatea). Sigue sin poder probarse en local: triggers, cuotas y permisos de Apps Script (comprobación manual escrita). | — |
| **Gancho `pre-commit`** que ejecute `scripts/` | Para que nadie olvide la trazabilidad (plantilla en `dev-pruebas`) | Tú: se activa con `git config core.hooksPath .githooks` |
| **Migrar la estructura al estándar** (`docs_dev/`, `sdd.md` + `arquitectura.md`, ADR con estado en el nombre) | Las skills presuponen esa estructura; ver CLAUDE.md. Incluye OB-34 (arc42) y el MADR estricto de OB-31 | Tú |
| ~~**JS-09 no la recoge ninguna HU**~~ **Resuelto el 16 nov** | La recogen HU-23, HU-24, HU-42, HU-43, HU-44 y HU-46 | — |
| **17 HU sin JS** (HU-03, 09 a 12, 14 a 19, 23, 24, 29, 30, 36, 41; las nuevas HU-42 a HU-48 sí citan JS) | El documento dice que nacen del proceso real; el verificador lo deja en aviso | Tú: ¿se declara explícitamente «proceso real» en su Origen? |
| **RF-21 contradice ADR-0015** | RF-21 «calculará el salario base» (✅); el 0015 lo retira | Va con OB-39 |
| **MoSCoW: «Won't»** | El CLAUDE.md local lo usa para «no entra»; el global dice que MoSCoW solo ordena | Tú |
| **Prueba en sesión nueva** de `dev-licencia` y `dev-pruebas` | Se crearon sin probar con casos reales | Tú |

## Pendientes que salen del trabajo del 16 nov 2026

La jornada diseñó la verificación con ficheros reales (ADESLAS, COBEE, banco, SAGE y la Vinculación), la
webapp del proceso mensual, `VAP_Pagos` con la huella y *Altas/bajas*. Esto queda **por decidir o por hacer**:

| Qué | Por qué | Decide / hace |
|---|---|---|
| **Crear el libro `VAP_Webapp`** (hojas `config` y `estado_pasos`), el proyecto de Apps Script, la propiedad `ID_LIBRO_WEBAPP` y desplegar | Sin ello el esqueleto no se puede enseñar. Estructura exacta en el [README de la webapp](../docs_solutions/src/webapp/README.md). Los nombres de los menús de Google **no están verificados**: se hace paso a paso, con captura | **Tú**, el 17 nov, guiado por Claude |
| **Decisiones de seguridad de la webapp:** «ejecutar como» (tú o quien accede), quién tiene acceso, segundo editor, frecuencia de la copia | Bloquean aceptar [ADR-0017](../docs_solutions/docs_design/adr/0017-webapp-del-proceso-mensual-stack-y-estructura.md) y [ADR-0018](../docs_solutions/docs_design/adr/0018-gsh-propio-de-la-webapp-propietario-y-accesos.md), ambos en Propuesta. Riesgos R-22 y R-23 | Tú |
| **`clasp`: ¿se adopta?** | El despliegue sigue siendo copiar y pegar (R-13). Su inicio de sesión es una credencial: se decide cada parámetro antes de usarlo | Tú |
| **¿Abrir un sprint nuevo para OB-45 (`VAP_Pagos` y la carga inicial)?** | Dijiste «el siguiente sprint». La regla del proyecto es que el sprint nuevo entra **por arriba** y el resto baja, con renumeración de cientos de referencias; **no se ha hecho**. Alternativa: colgarlo del Sprint 1 | Tú |
| **Decisiones de seguridad de `VAP_Pagos`:** algoritmo de la huella (propuesta HMAC-SHA256), dónde y cómo se guarda la clave, quién abre el libro, copia de la clave, plazo de conservación, si se enseñan los últimos dígitos | Sin ellas no se escribe el ADR de OB-36 y OB-45. Riesgo R-25 | Tú, con Gerencia y protección de datos |
| **Ficheros reales en `docs_work/docs_cruce/`** (ADESLAS, COBEE, banco, SAGE y la Vinculación) | Solo los protege la extensión en `.gitignore` (R-24). El `README.md` de esa carpeta se borró y sus enlaces se repuntaron al de `migration_data/`. ¿Mover los ficheros a `migration_data/`, o declarar `docs_cruce/` ignorada dejando pasar solo los `.md`? | Tú |
| **Skill `dev-apps-script`** | Las convenciones de Apps Script solo viven en el CLAUDE.md de BUCA. Contenido propuesto: capas y prefijos, ES2019, seguridad (`api…` y `_`), configuración, pruebas, despliegue y límites de la plataforma | Tú; se crea con `dev-nueva-skill` |
| **Prueba en Google real de la webapp** | **No se puede automatizar:** `Session.getActiveUser()`, permisos y ventana de seguridad de HtmlService. Alternativa: la lista de comprobación manual del README de la webapp, antes de cada despliegue | Tú, con la cuenta de la Responsable |
| **Preguntas a Administración y a quien exporta de SAGE** | Hoja de la Vinculación del mes, significado de los +1,00 €, tolerancia, DNI en el export de SAGE (pedido), primer o segundo export, dónde se descuenta COBEE. Ver OB-40 y [fuentes_de_contraste.md §7](docs_cruce/fuentes_de_contraste.md) | Administración · quien exporta |
| **Remesa completa del banco** (y saber si hay un fichero por empresa) | La muestra trae 10 pagos de 208; la carga inicial de `VAP_Pagos` se mide con el fichero entero | Banco · Administración |
| **FLUJO.md no refleja la pantalla *Proceso mensual*** | Describe el proceso a mano y la versión desplegada; sigue en espera de OB-30 | Va con OB-30 |
| **Cifras antiguas en `valor_dev.md`** | Se actualizaron el 16 nov; se vuelven a desfasar con cada requisito nuevo | Mantener |

## Mejoras detectadas por las pruebas — **hacer antes del siguiente sprint**

*(14 nov 2026. Salen de las pruebas generadas por cuatro agentes (**~50 defectos distintos, en los cuatro módulos**) sobre todo el código de `src/`. Ninguno de estos
defectos se ha corregido: los `.gs` y los HTML mueven nóminas y la producción tiene otra versión. Cada prueba que
lo documenta está marcada `it.fails('DEFECTO: …')` o `test.fail(…)`: **cuando se corrija el código, esa prueba
empezará a fallar y habrá que quitarle la marca**. Orden propuesto: primero lo que puede pagar mal, después lo que
solo deja sin rastro, después lo visual.)*

### A · Puede afectar a lo que se paga

| ID | Dónde | Defecto | Requisito |
|---|---|---|---|
| DEF-01 | `exportNeto` / `exportBruto` (SAGE) | Escriben **sin pedir confirmación ni permitir cancelar** | RNF-05 · RF-17 · RF-18 |
| DEF-02 | `toNumber_` (SAGE) | El texto «12.5» se lee como **125**: un decimal con punto multiplica por 10 | RNF-08 · R-14 |
| DEF-03 | `parsearFecha_` (cruce SAGE) | «31/02/2024» pasa a 02/03/2024 y «15/13/2024» a enero del año siguiente: debería devolver «no válida» | — |
| DEF-04 | `analizarVolcado_` (profesores) | «DICIEMBRE» enviado en enero cae en «otro año» en vez de diciembre del año anterior | RF-16 |
| DEF-05 | `vapAnalizarPeriodo` (horas extras) | Un año no numérico no se valida: todo cae en «otro año» y **las filas sin marca temporal se exportan** | RF-16 · RF-17 |
| DEF-06 | `onFormSubmit` (horas extras) | **Dos envíos en el mismo segundo:** el ID del primero se escribe en la fila del segundo | RF-03 |
| DEF-07 | `localizarFilaRespuesta_` (horas extras) | Con solo la cabecera devuelve la fila 1: el ID se escribiría **encima de la cabecera** | RF-03 |
| DEF-08 | volcado de horas extras | Las filas de una secretaria **bloqueada por nombre duplicado** en destino se archivan igualmente como «ARCHIVADO» | RF-17 |
| DEF-09 | `contarCeldasOcupadasDestino_` (profesores) | Si falta la pestaña destino devuelve 0 («limpio»); debería ser «no comprobable» | RF-23 |
| DEF-10 | `construirStaff_` (cruce SAGE) | Excluye a quien tiene baja **futura**, aunque `estaActivo_` lo trata como activo *(dudoso: no hay documento que lo respalde; decidir)* | — |

### B · Pueden dejar a medias o sin rastro

| ID | Dónde | Defecto | Requisito |
|---|---|---|---|
| DEF-11 | Volcados de **profesores y horas extras** | Con el bloqueo ocupado, `waitLock` queda fuera del `try`: **no deja traza** en el LOG | RF-48 |
| DEF-12 | `vapEjecutarExportacion` (**profesores y horas extras**) | Si falla el análisis no se escribe nada en el LOG (`vapAnalizarPeriodo` sí lo hace) | RF-48 |
| DEF-13 | `valuesEqual_` / `volcarVinculacion_` (SAGE) | El número 12.5 y el texto «12.5» se ven distintos: **se reescriben celdas que no cambian** | RF-22 · RNF-08 |
| DEF-14 | `volcarVinculacion_` (SAGE) | Escribe **celda a celda** (también horas extras: 80 escrituras para 40 personas) | RNF-07 |
| DEF-15 | `volcarVinculacion_` (SAGE) | **No lee las cabeceras del destino**, así que no detecta que su estructura cambió | RNF-15 · R-08 |
| DEF-16 | `crearTriggersProduccion` (horas extras) | Borra los disparadores **antes** de abrir el formulario: si falla, se pierden. También borra el de respaldo y los ajenos | RNF-12 |
| DEF-17 | volcado de horas extras | Si el destino falla, las incidencias del análisis no llegan al LOG | RF-48 |

### C · Seguridad y accesibilidad de las pantallas

| ID | Dónde | Defecto |
|---|---|---|
| DEF-18 | **Diálogos de profesores y de horas extras** | El informe usa `innerHTML` **sin escapar** lo que viene de la hoja o escriben las secretarias: se puede inyectar HTML ([RNF-09](../docs_discovery/requisitos_no_funcionales.md)) |
| DEF-19 | Los mismos diálogos y el portal | Falta `<html lang="es">` y `aria-live`/`role` en el informe y en los errores |

> **DEF-11, 12, 18 y 19 están en dos módulos a la vez** (copias del mismo código): confirma la deuda
> DRY de RNF-17. Al corregirlos, hacerlo **en un solo punto compartido**, no dos veces.

### D · Observaciones (no son defectos de la prueba, pero conviene decidir)

- `normalizarMes_` es laxo: «Mayo-Junio» se lee como MAYO, y cualquier palabra con las tres letras de un mes único se acepta («Martes» da MARZO).
- Un envío sin marca temporal pisa a uno con marca.
- Una persona sin `Id_Sage` y sin coincidencia recibe el ID `GALA_` en la copia del cruce.
- Una baja exactamente a 5 años queda excluida por la hora del día.
- Tras exportar con éxito, «Revisar» queda desactivado.
- `crearTriggerHorarioRespaldo` no es idempotente: duplica.
- Un fallo agota la ventana de 30 s de la caché.
- **El SSD §6.3, §7.5 y §8.5 sigue hablando de *Calculo Salario Base* y de tres acciones** (entra en OB-30, en espera).

### E · Lo que **no** se puede probar en local (hay que comprobar a mano antes de cada despliegue)

Disparadores reales (`onOpen` por el menú, `onChange`, `onFormSubmit`, horarios), cuotas y tiempo máximo de ejecución,
permisos reales, caducidad real de la caché, textos reales de error de Google (en inglés, y el código clasifica
errores por texto), decodificación ISO-8859-1 real y conversión de `.xls`. **Hay que escribir una lista de
comprobación manual paso a paso** (pendiente).

### F · Limitaciones de los dobles (riesgo de falsa seguridad)

- `getRange` con 0 o negativas filas: el doble lo acepta y **Google real lanza error**; el caso «destino solo con cabecera» no es verificable en local (DEF afecta a profesores y horas extras).
- `getDisplayValues` devuelve ISO para las fechas, y la caché no caduca sola; `Utilities.getUuid().slice(0,8)` es idéntico en todas las ejecuciones.
- Los errores del doble están en español y no activan los clasificadores del código; `getEventType` da `UNKNOWN` para `onEdit`; `getDataAsString` ignora el charset.
- **Mejora del soporte:** llevar a `tests/soporte/` lo que cada agente hubo de crear aparte (`espiarFormato`, `fechaCaja`, `relojQueAvanza`, dobles de `FormApp`, `MimeType`, espías de caché y bloqueo) para no repetirlo en cada módulo.

### H · Módulo de complementos de secretarias (informe del cuarto agente, 14 nov 2026)

20 defectos documentados en Vitest y 15 en Playwright. Los de seguridad y permisos van **primero**:

| ID | Dónde | Defecto | Requisito |
|---|---|---|---|
| DEF-20 | `vap_submitBatch` | **No valida el responsable ni el concepto contra la BBDD:** acepta un responsable inexistente o inactivo y un concepto que no tiene asignado | ADR-0002 · RF-06 · RNF-09 |
| DEF-21 | `vap_consultaBatches` | Da los envíos de **cualquier** id de responsable | RNF-09 |
| DEF-22 | Correcciones | Aceptan un `Batch_ID` inexistente o **de otro responsable** | RF-08 |
| DEF-23 | Reporte | **No usa `LockService`:** con el bloqueo ocupado sigue escribiendo | RNF-04 |
| DEF-24 | `parseNumber_` / `normalizeMoneyStr` | Aceptan «Infinity», «0x10» y «1e3»; «1.234» vale 1,234; «doce» se pierde sin incidencia y «12abc» se guarda como 12 | RNF-08 · RF-60 |
| DEF-25 | Validación | Mes no entero (1,5) y año 1 se aceptan | RF-60 |
| DEF-26 | Correo | HTML sin escapar (nombre del responsable y concepto) y **URL de consulta fija en el código** | RNF-09 |
| DEF-27 | Exportación | Tras un error HTTP **el libro temporal queda en Drive** y el error es una excepción en bruto, sin alerta ni fila de ERROR en `Logs` | RF-48 |
| DEF-28 | `vap_rellenarNombresSecretariaFaltantes` | Escribe celda a celda; además **no está en el menú** | RNF-07 |
| DEF-29 | Consultas y desplegable de correcciones | **XSS por `innerHTML`** sin escapar (Batch_ID, concepto, nombre e id de secretaria) | RNF-09 |
| DEF-30 | Consultas | Un envío vacío no muestra ningún aviso | RF-66 |
| DEF-31 | Las 3 pantallas | Sin `lang`; `<label>` sin `for`; importes sin `aria-label`; mensajes sin `aria-live`; la cabecera del envío no se abre con teclado | — |

**Observaciones:** el año del envío es siempre el actual; no se avisa si el correo falla; se aceptan importes negativos.
**No probable:** cuotas, permisos OAuth reales, XLSX real de Google, entrega real del correo, menú real de Sheets, `<title>` (el arnés no lo sirve).
**Límites de los dobles:** `SpreadsheetApp.create` no crea la primera hoja; el libro temporal no está en Drive; la hora queda fija al cargar.

> **DEF-20, 21 y 22 son de acceso, no de formato:** hoy la web de reporte confía en el id que manda el navegador. Es el
> mismo riesgo que R-02 del SSD (permisos no gestionados por rol nativo) y debería ir **el primero** de la lista A.

### G · Decisiones que necesitan tu OK

1. ¿Se corrigen los defectos de la tabla A, y en qué orden? Cada uno es un cambio en código que mueve nóminas: **uno a uno, con prueba y con aviso de despliegue**.
2. ¿DEF-01 (confirmación antes de escribir) se hace antes que cualquier otro? Contradice un requisito que está marcado ✅ para los otros volcados.
3. DEF-10: ¿una baja futura cuenta como activa o no?
4. ¿Se sube una **comprobación manual** (lista paso a paso) a la skill `dev-pre-produccion` para lo no probable?

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
