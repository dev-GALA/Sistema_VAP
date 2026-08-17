# Problem Statement & Jobs To Be Done — Sistema VAP

| | |
|---|---|
| **Versión** | 0.1 — BORRADOR, pendiente de revisión |
| **Fecha** | 17 agosto 2026 |
| **Autor** | Fran Cañete (fcsainz) |
| **Estado** | Propuesta inicial para revisión |

---

## Cómo usar este documento

Este documento responde a **qué problema resuelve el Sistema VAP y para quién**, con independencia
de cómo esté construido. El "cómo" vive en [`SSD.md`](SSD.md) y en [`adr/`](adr/README_ADR.md).

**Regla de oro del JTBD:** un *job* describe el **progreso que alguien quiere lograr** en una
situación concreta, **no** la herramienta que usa para lograrlo. Si al escribir un apartado aparecen
las palabras "Google Sheets", "formulario" o "webapp", probablemente estés describiendo la solución
en lugar del problema. Las soluciones cambian; los *jobs* son estables durante años.

**Convenciones:**

- Cada apartado empieza con una nota en cursiva que explica **qué va ahí**. Puedes borrarla al
  cerrar el documento, o dejarla como guía para futuras revisiones.
- El texto normal es la **propuesta a revisar**.
- Las marcas 🔍 **Por validar** señalan lo que he inferido de la documentación existente y necesita
  tu confirmación, y los datos que no tengo (cifras, tiempos, nombres de rol).

---

## 1. Contexto

> *Qué es la organización, qué hace y en qué encaja este problema. Suficiente para que alguien
> ajeno entienda el resto del documento sin conocimiento previo.*

GALA Autoescuela gestiona una red de autoescuelas. Parte de su plantilla —**secretarias** y
**profesores**— no cobra un salario fijo: percibe una **retribución variable mensual** que depende
de la actividad realizada en el mes (horas extras, complementos por objetivos, actividad docente).

Calcular esa retribución exige reunir cada mes datos que **nacen dispersos**: los genera gente
distinta, en momentos distintos, en formatos distintos, y todos deben confluir en un cálculo único
antes del cierre de nómina. Ese ejercicio de consolidación mensual, con fecha límite y sin margen de
error, es el terreno del problema.

**Escala del problema:**

| | |
|---|---|
| Personas cuya retribución depende de este proceso | **~400** |
| Responsables que reportan datos cada mes | **6** |
| Autoescuelas de la red | 55 |

El ciclo completo se repite **doce veces al año**. La escala
es relevante para entender el problema: a ese volumen, la consolidación manual deja de ser una tarea
tediosa y pasa a ser un proceso donde el error no es una posibilidad remota sino una certeza
estadística, y donde revisar todo a mano antes del cierre resulta materialmente inviable.


---

## 2. El problema

### 2.1 Situación de partida

> *El "antes", descrito en términos de lo que le pasaba a la gente, no de lo que le faltaba al
> software. Un problema bien planteado no menciona la solución que echa en falta.*

Antes del Sistema VAP, los datos para calcular los salarios variables llegaban a la persona que los
centralizaba desde **fuentes y personas dispersas, por vías heterogéneas**: formularios, correos y
hojas de cálculo diversas. Esa persona debía **volcarlos a mano** en una hoja final para poder
calcular los importes.

El proceso era complejo, tedioso y consumía mucho tiempo, y se repetía **entero cada mes**.

**El arranque del proceso no ha cambiado.** Antes y ahora, el cierre empieza igual: la Responsable
de Administración **habla con** los Responsables/Managers, el Gestor de nóminas y el Gerente para
coordinar el envío de datos. Es una coordinación personal, y sigue siendo el punto de partida de
cada mes.

**El primer punto que se mejoró fue el envío de complementos.** Los Responsables reportaban mediante
un formulario de Google que obligaba a **enviar un formulario por cada persona**. Dos consecuencias:

- El volumen de envíos era enorme —un formulario por secretaria y concepto— y el trabajo de
  cumplimentarlo, desproporcionado.
- Los envíos **acababan clasificados como spam**, con lo que el dato podía sencillamente no llegar.
  Un fallo silencioso: nadie se enteraba de que faltaba algo hasta echarlo en falta.

Esa fue la primera pieza sustituida: hoy los Responsables reportan **de forma masiva** —todas sus
personas de una vez— a través de una aplicación propia. Lleva varios meses en uso.

> Es un dato revelador sobre dónde estaba el dolor real: el primer problema que se atacó no fue el
> cálculo ni la consolidación, sino **que el dato llegara**. Ver §4.4.

**Las horas extras las reportan las propias secretarias** mediante un formulario aparte, y ahí el
trabajo manual sobrevivía en un sitio poco visible: alguien tenía que **vaciar periódicamente la
hoja de respuestas**, moviendo las de meses anteriores a otra pestaña, porque si no el volcado
reutilizaba valores del mes pasado. Una tarea de mantenimiento invisible, no escrita en ningún
procedimiento, **de la que dependía que las nóminas salieran bien**.

Desde agosto de 2026 esa dependencia desaparece: el volcado acota por mes y la limpieza deja de ser
necesaria ([ADR-0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)).

**La actividad de los profesores sigue el mismo camino.** La reportan las secretarias mediante otro
formulario, y su volcado se ha rediseñado igual
([ADR-0014](adr/0014-volcado-actividad-profesores-por-periodo.md)), con una diferencia que retrata
bien el problema: como **varias secretarias reportan partes distintas** de la actividad del mismo
profesor, no vale quedarse con el último envío. Hay que **acumular campo a campo**. En el histórico
hay 122 casos de un mismo profesor con más de un reporte en el mismo mes.

> Dicho de otro modo: el dato de una persona **no tiene un único autor**. Esa es una característica
> del problema, no del sistema — y explica por qué la consolidación no es un simple *copiar y pegar*.

> Merece la pena retener el patrón, porque probablemente se repita en otros puntos del proceso: **el
> trabajo manual no siempre está donde se ve**. Aquí no estaba en teclear datos, sino en acordarse
> de limpiar una hoja — y su coste no era el tiempo que llevaba, sino lo que pasaba si se olvidaba.

### 2.2 Por qué duele

> *El coste de no resolverlo, desglosado. Conviene separar el coste de tiempo del coste de riesgo:
> son problemas distintos y se resuelven de forma distinta.*

1. **Coste de tiempo recurrente.** La consolidación manual se rehace cada mes, y crece con la
   plantilla. Es tiempo cualificado dedicado a copiar datos de un sitio a otro.
2. **Riesgo de error en dinero real.** Todo volcado manual introduce la posibilidad de equivocarse.
   El resultado no es un informe: es **lo que cobra una persona**. Un error se detecta tarde —cuando
   alguien reclama— y erosiona la confianza en el sistema retributivo.
3. **Cuello de botella en una sola persona.** El conocimiento de cómo se consolida vive en quien lo
   hace. Si esa persona falta en la semana de cierre, el proceso se para.
4. **Ausencia de rastro en lo reportado.** Con datos llegando por correo y hojas sueltas,
   reconstruir *quién reportó qué y cuándo* meses después es difícil o imposible. Ante una
   discrepancia sobre un dato de origen, no hay a qué agarrarse.
5. **Fricción para quien reporta.** Los responsables que envían los datos tampoco tenían constancia
   de lo enviado ni forma de corregirlo con garantías.

> **Alcance de la trazabilidad.** El rastro que se busca es el de **lo que cada fuente reportó**.
> El **ajuste de la revisión final** (§3.1, §4.4) queda deliberadamente fuera: responde a gestiones
> puntuales que nacen fuera del sistema, de modo que no es una carencia sino un límite consciente.
> Se recoge como anti-objetivo en [§8](#8-fuera-de-alcance-y-anti-objetivos).
>
> Conviene tenerlo presente al leer el resto del documento: significa que el importe final de un
> concepto **puede diferir** del que reportó su fuente, y que esa diferencia no es reconstruible a
> posteriori. Cualquier medición de "errores" (§6) se refiere, por tanto, a la cadena que va del
> reporte a la consolidación, no al importe último.


### 2.3 Situación deseada

> *El "después" en términos de resultado observable. Debe poder comprobarse si se ha conseguido o no.*

Cada mes, los datos de actividad de secretarias y profesores llegan **consolidados, trazables y
verificables** al punto de revisión, sin que nadie tenga que copiarlos a mano y sin que su exactitud
dependa de la vigilancia de una persona concreta.

Sobre esa base ya fiable, Gerente y Responsable de Administración **revisan, ajustan lo que proceda
y validan** el cierre del mes. La automatización no sustituye ese juicio: su función es garantizar
que lo que llega a la mesa de revisión está completo y es correcto, para que la revisión se dedique
a decidir y no a detectar fallos de transcripción.

### 2.4 Enunciado del problema

> *Una sola frase. Si no cabe en una frase, el problema no está lo bastante acotado.*

**Reunir cada mes, a tiempo y sin errores, los datos de actividad dispersos que determinan la
retribución variable de secretarias y profesores exige un trabajo manual costoso, difícil de
auditar y dependiente de una sola persona.**

---

## 3. Para quién — Ejecutores del *job*

> *Quién tiene el problema. En JTBD interesa el **rol en la situación**, no el cargo ni el perfil
> demográfico. Distingue a quien ejecuta el trabajo de quien se ve afectado por él.*

### 3.1 Ejecutores principales

| Rol | Situación en la que aparece | Qué necesita lograr |
|-----|------------------------------|---------------------|
| **Responsable / Manager** | Cierre de mes: debe reportar la actividad de las personas del complemento salarial que gestiona | Dejar reportado lo que le corresponde, con constancia de haberlo hecho y posibilidad de rectificar |
| **Secretarias** | Reportan parte de su propia actividad, y también parte de la actividad del profesorado que gestionan | Que quede registrado y se pague correctamente, tanto lo suyo como lo del profesorado |
| **Gestor de nóminas** | Emite un documento inicial de salario que envía a Responsable de Administración, y produce el cálculo final | Tener los datos completos, consolidados y fiables en la fecha de cierre |
| **Gerente** | Revisa el conjunto junto con Responsable de Administración; aporta datos de origen propio y **modifica importes ya reportados por otras fuentes** cuando procede | Poder dar el mes por bueno, con los importes ajustados a lo que considera correcto |
| **Responsable de Administración** | **Coordina el proceso completo del cierre**, en buena parte de forma personal y presencial: persigue lo que falta, resuelve dudas con cada fuente y opera la consolidación de los datos | Que el cierre salga a tiempo y cuadre, sin depender de que cada fuente se acuerde de reportar por su cuenta |

**Notas sobre los roles:**

- **Responsable / Manager** y **Responsable de Administración** son roles distintos pese a la
  similitud del nombre: el primero reporta **un complemento concreto** del que es responsable; el
  segundo **coordina el proceso entero**.
- **El cierre se valida de forma conjunta.** Gerente y Responsable de Administración revisan juntos,
  el Gerente modifica lo que proceda y **ambos validan** para dar el mes por cerrado. No es una
  cadena de aprobación jerárquica, sino un acto de revisión compartido.
- **Las secretarias son a la vez ejecutoras y afectadas** (ver §3.2): reportan datos al sistema y su
  propia retribución depende de él. Reportar sobre uno mismo es una situación distinta a reportar
  sobre terceros, y conviene no perder ese matiz.
- **El profesorado no reporta su propia actividad.** Parte la reportan las secretarias que lo
  gestionan; el resto llega por el Gerente o por otras vías. Es el único colectivo afectado que no
  interviene en la captura de sus propios datos.

### 3.2 Afectados

> *Quienes sufren las consecuencias del problema. Algunos son además ejecutores; conviene
> distinguirlo, porque quien reporta sobre sí mismo vive el trabajo de otra manera.*

| Afectado | ¿Es también ejecutor? | Cómo le afecta |
|----------|----------------------|----------------|
| **Profesorado** | **No** | Su retribución depende íntegramente de datos que reportan otros. Es el colectivo más expuesto a un error: no interviene en la captura ni tiene forma directa de verificarla |
| **Secretarias** | **Sí** (ver §3.1) | Reportan parte de sus propios datos y su retribución depende del resultado |
| **Dirección / RRHH** | No | Necesita que el sistema retributivo sea defendible ante una reclamación |
| **Quien mantiene el sistema** | Sí | Hoy, una sola persona: cualquier fallo o ausencia recae sobre ella |

> El caso del **profesorado** merece atención: es el único colectivo cuya retribución se determina
> sin que participe en el proceso ni pueda contrastar lo que se ha reportado sobre él. Cualquier
> error en su cadena de datos solo puede detectarlo alguien distinto de la persona afectada.

---

## 4. Job To Be Done

### 4.1 *Job* principal

> *Formato Ulwick: **verbo + objeto + clarificador de contexto**. Sin adjetivos valorativos y sin
> mencionar solución alguna. Debe seguir siendo válido dentro de diez años.*

> **Determinar la retribución variable mensual de cada empleado de forma que refleje fielmente la
> actividad que ha realizado.**

Es el trabajo que existía antes del Sistema VAP, que existiría si mañana desapareciera, y que
seguiría existiendo si se rehiciera sobre una tecnología completamente distinta.

### 4.2 Las tres dimensiones

> *Todo job tiene una dimensión funcional (la tarea), una emocional (cómo quiere sentirse el
> ejecutor) y una social (cómo quiere que le vean los demás). Las dos últimas se olvidan a menudo y
> suelen explicar por qué una solución técnicamente correcta no se adopta.*

| Dimensión | Enunciado |
|-----------|-----------|
| **Funcional** | Consolidar datos de actividad de origen diverso y convertirlos en importes correctos antes de la fecha de cierre |
| **Emocional** | Llegar al cierre **tranquilo**: sin la sospecha de que algo se ha quedado por el camino ni el temor a que aparezca un error dentro de tres meses |
| **Social** | Que quien reporta pueda **demostrar** que reportó lo que le correspondía, y que quien coordina pueda **responder** de que el proceso se ha seguido |

> 🔍 **Por validar:** la dimensión emocional es una inferencia mía a partir de "complejo y tedioso
> de gestionar" del SSD. Si el dolor real es otro —la presión de la fecha límite, las reclamaciones
> posteriores, las interrupciones para perseguir datos que no llegan— conviene decirlo con
> precisión, porque es lo que determina si la solución se percibe como un alivio o como un trámite
> más.

### 4.3 *Jobs* relacionados

> *Trabajos adyacentes que aparecen alrededor del principal. Ayudan a decidir el alcance: cuáles
> entran y cuáles no.*

- Mantener actualizada la lista de quién está activo y cobra cada concepto.
- Corregir un dato propio ya enviado sin perder el rastro de lo que se envió antes.
- **Ajustar un importe reportado por otra fuente**, cuando la revisión final determina que procede.
- **Dar el mes por cerrado** con la confianza de que lo revisado está completo.
- Consultar qué se reportó en un mes pasado.
- Justificar ante una reclamación por qué alguien cobró lo que cobró.
- Incorporar un concepto retributivo nuevo sin rehacer el proceso.

> Los dos *jobs* en negrita corresponden al **ajuste de la revisión final** (§4.4) y son propios del Gerente y
> el Responsable de Administración. Se distinguen del segundo de la lista: *corregir* lo propio busca
> enmendar un error de quien lo reportó; *ajustar* lo ajeno es un acto de decisión sobre el importe.

### 4.4 Captura, consolidación y ajuste

> *Las tres partes del proceso que es fácil confundir, y que delimitan hasta dónde puede llegar el
> sistema.*

**El ajuste no corrige errores de captura:** incorpora información que **nunca entró en el sistema
porque nace fuera de él** — gestiones puntuales, acuerdos y circunstancias personales que se
resuelven de forma directa. Que no quede registrado (§8) no significa que el sistema haya perdido un
dato, sino que ese dato **nunca fue suyo**.

| | Qué es | ¿Trazable? | ¿Automatizable? |
|---|--------|-----------|-----------------|
| **Captura** | Los datos de actividad que cada fuente reporta | Sí | Parcialmente: depende de que cada fuente reporte |
| **Consolidación** | Reunir esos datos y calcular los importes | Sí | Sí — es donde el sistema aporta más |
| **Ajuste** | La decisión final sobre el importe, informada por circunstancias externas al sistema | **No, por naturaleza** | **No, ni se pretende** |

Esta distinción delimita el alcance del sistema: **puede aspirar a que la captura y la consolidación
sean completas y fiables; el ajuste es terreno humano y así se quiere.** El importe final es el
resultado de las tres, y solo las dos primeras son reconstruibles a posteriori.

---

## 5. *Job stories*

> *Formato Intercom: **Cuando [situación], quiero [motivación], para [resultado esperado]**.
> A diferencia de las user stories, no mencionan rol ni solución: describen una situación y el
> progreso buscado. Sirven para decidir si una funcionalidad concreta merece existir.*

**JS-01 — Reportar la actividad del equipo**
Cuando llega el cierre de mes y debo reportar la actividad de mi equipo, quiero introducir todos los
importes de una vez y recibir constancia de lo enviado, para poder desentenderme sabiendo que ha
quedado registrado.

**JS-02 — Corregir un error propio**
Cuando descubro que me he equivocado en algo que ya envié, quiero rectificarlo sin que se pierda el
registro de lo anterior, para corregir el dato sin borrar la historia de lo ocurrido.

**JS-03 — Saber qué falta**
Cuando se acerca la fecha de cierre, quiero ver de un vistazo qué se ha reportado y qué no, para
perseguir solo lo que falta en lugar de revisarlo todo.

**JS-04 — Responder a una reclamación**
Cuando alguien reclama un importe de hace meses, quiero reconstruir de dónde salió esa cifra, para
resolver la duda con hechos y no con memoria.

**JS-05 — Dar de alta a alguien nuevo**
Cuando entra o sale una persona, quiero que deje de aparecer o empiece a aparecer donde corresponda,
para que nadie quede fuera del cálculo ni se reporte de quien ya no está.

**JS-06 — Ajustar un importe en la revisión final**
Cuando reviso el conjunto del mes y detecto un importe que no se corresponde con lo que debe
pagarse, quiero modificarlo directamente sin devolver el dato a su origen, para resolverlo en el
momento y no retrasar el cierre.

**JS-07 — Dar el mes por cerrado**
Cuando hemos terminado de revisar y ajustar, quiero cerrar el mes con la certeza de que lo revisado
estaba completo, para poder darlo por bueno sin la duda de si faltaba algo por llegar.

> **JS-06 y JS-07 corresponden al ajuste y cierre del mes** (§3.1, §4.4) y no existían en la primera
> versión del documento. Nótese que JS-06 pide **rapidez y autonomía** —resolver sin volver al
> origen— mientras que JS-02 pide **conservar el rastro**. No son contradictorios porque hablan de
> momentos distintos del proceso, pero la diferencia es deliberada y conviene no unificarlos.

> 🔍 **Por validar:** ¿faltan situaciones? Las candidatas que se me ocurren y no he escrito: el mes
> en que un concepto retributivo cambia de criterio, y el momento en que alguien nuevo asume el rol
> de gestor y tiene que aprender el proceso.

---

## 6. Resultados deseados

> *Formato Ulwick: **dirección de mejora + métrica + objeto + contexto**. Son medibles y no
> mencionan solución. Aquí se define qué significa "haberlo conseguido".*

| # | Resultado deseado | Cómo se mediría | Situación hoy |
|---|-------------------|-----------------|---------------|
| RD-01 | Minimizar el **tiempo** de consolidar los datos de todas las fuentes en un mes | Horas dedicadas al cierre | 🔍 sin dato |
| RD-02 | Minimizar la **frecuencia de errores** que llegan a la nómina | Nº de correcciones tras el cierre | 🔍 sin dato |
| RD-03 | Minimizar el **tiempo hasta detectar** un dato incorrecto | Días entre el error y su detección | 🔍 sin dato |
| RD-04 | Minimizar el **esfuerzo de reconstruir** el origen de un importe pasado | Tiempo en responder a una reclamación | 🔍 sin dato |
| RD-05 | Minimizar la **dependencia de una persona** concreta para cerrar el mes | ¿Podría otra persona cerrar el mes sin ayuda? | 🔍 sin dato |
| RD-06 | Minimizar el **esfuerzo de reportar** para quien envía los datos | Minutos por responsable y mes | 🔍 sin dato |

> 🔍 **Por validar — sigue faltando la línea de base.** Las cifras de operación ya están (abajo),
> pero **no hay dato del "antes"**: cuánto tiempo consumía el cierre manual, cuántos errores
> aparecían. Sin ese punto de partida se puede describir cómo funciona hoy el sistema, pero no
> demostrar cuánto ha mejorado. Una estimación tuya ("antes eran unas 3 jornadas, ahora media") ya
> sirve.

### 6.1 Datos de operación (medidos)

> *Extraídos de las hojas de registro del sistema el 17 agosto 2026. Son datos de **cómo funciona
> hoy**, no de la situación previa.*

**Actividad de reporte de complementos** — periodo **febrero a julio de 2026** (6 meses):

| Métrica | Valor |
|---------|-------|
| Registros de complemento acumulados | **1.724** |
| Envíos (remesas) realizados | **41** |
| Acciones registradas | **65** — 44 envíos · 7 correcciones · 14 exportaciones |
| Acciones con resultado de error | **0** |
| Valores rechazados por no numéricos | **0** |
| Registros que son corrección | **108 de 1.724 (6,3 %)** |
| Tipo de corrección | 5 parciales · 2 totales |
| Secretarias distintas reportadas | **107** |
| Responsables que han reportado | **4** |

**Cobertura por mes** (registros): feb 261 · mar 276 · abr 290 · may 286 · jun 211 · **jul 400**

**Uso por concepto:** RESEÑAS 567 · FINANCIACIONES 552 · APTOS 422 · HORAS_PUNTOS 131 ·
SABADOS_50 47 · SABADOS_60 5

### 6.2 Qué dicen estas cifras

- **Cero errores en 65 acciones.** Ni una sola acción fallida ni un valor rechazado en seis meses.
  Es una señal buena, pero conviene leerla con cuidado: mide que **el mecanismo de reporte no
  falla**, no que los importes sean correctos. Un dato erróneo bien formado se registra sin
  incidencia.
- **6,3 % de correcciones.** Aproximadamente uno de cada dieciséis registros se corrige. Es la
  única medida indirecta de tasa de error que existe hoy, y solo captura los errores **que alguien
  detectó y quiso enmendar**.
- **Julio se dispara a 400 registros** frente a una media de ~265. Merece una explicación:
  ¿un mes con más actividad, un concepto nuevo, o una recuperación de datos atrasados?
- **Solo 4 responsables han reportado**, de 5 dados de alta y 6 que mencionamos en §1. Conviene
  cuadrar esa diferencia (§10).
- **SABADOS_60 con 5 registros en seis meses** es prácticamente residual, frente a los 567 de
  RESEÑAS. Puede indicar un concepto que apenas se aplica.

---

## 7. Restricciones

> *Los límites reales dentro de los que hay que resolver el problema. Distingue las que vienen
> impuestas de las que son decisión propia: las segundas se pueden revisar.*

| Tipo | Restricción |
|------|-------------|
| **Impuesta** | El resultado debe encajar con el proceso de nómina existente y sus fechas de cierre |
| **Impuesta** | Los datos son de personal: retributivos y de carácter personal |
| **Decisión** | Todo se construye sobre Google Workspace, sin infraestructura nueva ([ADR-0001](adr/0001-google-sheets-como-bbdd-central.md)) |
| **Decisión** | Avance por fases y por colectivos, en lugar de un despliegue único |
| **De facto** | Desarrollo y mantenimiento a cargo de una sola persona, compatibilizado con otras funciones |

> 🔍 **Por validar:** ¿hay restricciones de cumplimiento (RGPD, convenio colectivo, auditoría
> laboral) que deban constar explícitamente? No aparecen en ningún documento y, tratándose de datos
> retributivos, llama la atención su ausencia.

---

## 8. Fuera de alcance y anti-objetivos

> *Igual de importante que el alcance. **Fuera de alcance** = no ahora. **Anti-objetivo** = no,
> deliberadamente, aunque parezca una buena idea.*

**Fuera de alcance (por ahora):**

- El cálculo final de la nómina de profesores (en curso).
- La gestión de permisos mediante roles nativos de Google.

**Anti-objetivos:**

- **No registrar el ajuste final.** Las modificaciones de importes que se realizan en la etapa de
  la **revisión final** (§3.1) **no dejan constancia de quién las hizo, cuándo ni por qué**, y así se quiere
  mantener. Es una **decisión deliberada del negocio**, no una limitación técnica pendiente de
  resolver: lo que motiva un ajuste son gestiones puntuales y personales que **nacen fuera del
  sistema** y no son sistematizables. No es un dato que se pierda, sino uno que nunca fue del
  sistema.
- **No** sustituir al sistema de nóminas: el Sistema VAP alimenta el cálculo, no lo reemplaza.
- **No** convertirse en un ERP de RRHH.
- **No** exigir que los usuarios aprendan una herramienta nueva compleja: deben seguir trabajando de
  forma reconocible.

> **Sobre el primer anti-objetivo.** Queda escrito aquí precisamente porque su consecuencia no es
> obvia: el importe final de un concepto **puede no coincidir** con el que reportó su fuente, y esa
> diferencia no es reconstruible después. Tres implicaciones que conviene tener presentes al leer el
> resto del documento:
>
> 1. La trazabilidad del sistema cubre **del reporte a la consolidación**, no hasta el importe
>    último (§2.2).
> 2. JS-04 —*responder a una reclamación*— puede reconstruir **lo que se reportó**, pero no por qué
>    el importe final difiere si fue ajustado.
> 3. Las métricas de error de §6 miden la cadena automatizada, no el resultado final.
>
> Dejarlo escrito evita que en el futuro alguien lo interprete como un fallo por corregir.

> 🔍 **Por validar:** los tres anti-objetivos restantes son propuesta mía. Merece la pena decidirlos
> conscientemente ahora, porque son los que permiten decir que no más adelante sin rediscutirlo cada
> vez.

---

## 9. Supuestos y riesgos del planteamiento

> *Aquello sobre lo que se apoya el problema tal y como está enunciado. Si un supuesto resulta
> falso, hay que revisar el documento entero.*

| # | Supuesto | Si resultara falso… |
|---|----------|---------------------|
| S-01 | El problema principal es la **consolidación** de datos, no su **captura** | Habría que mirar aguas arriba: quizá el dolor está en que los datos se generan mal desde el origen |
| S-02 | Los responsables están dispuestos a reportar con método si es cómodo | La adopción sería el problema real, no la automatización |
| S-03 | Las reglas de cálculo son estables mes a mes | Haría falta un sistema configurable, no automatizado sobre reglas fijas |
| S-04 | Secretarias y profesores comparten suficiente estructura para un enfoque común | Serían dos problemas distintos que conviene no forzar a converger |
| S-05 | Existe una parte del importe final que **no es sistematizable**: responde a gestiones puntuales y personales que nacen fuera del sistema (§4.4) | Si en realidad fuera capturable, parte de esos ajustes serían evitables mejorando la captura, y el sistema podría llegar más lejos de lo que hoy se asume |

---

## 10. Preguntas abiertas

> *Lo que hay que averiguar antes de dar por cerrado el documento. Cada respuesta debería
> incorporarse al apartado que le corresponda.*

**Pendientes:**

1. ¿Cuánto tiempo consumía el cierre antes, y cuánto consume ahora? *(→ §6)*
2. ¿Con qué frecuencia aparecen errores, y cuánto tardan en detectarse? *(→ §6)*
3. ¿Podría hoy otra persona cerrar el mes sin ayuda? *(→ §6, RD-05)*
4. ¿Hay requisitos de cumplimiento (RGPD, convenio, auditoría laboral) que deban constar? *(→ §7)*
5. De lo que hoy se resuelve en el ajuste final, ¿hay algo que **sí sería sistematizable** y
   simplemente nunca se ha intentado capturar? *(→ §4.4 · supuesto S-05)* — no para
   eliminar el ajuste, que es terreno humano por diseño, sino para saber si el límite actual del
   sistema está donde debe estar.

**Resueltas:**

| Pregunta | Respuesta | Recogida en |
|----------|-----------|-------------|
| ¿Cuántas personas, responsables y autoescuelas hay implicadas? | ~400 personas · 6 responsables · 55 autoescuelas | §1 |
| ¿Quién reporta la actividad del profesorado? | Las secretarias que lo gestionan reportan parte; el resto llega por el Gerente u otras vías. El profesorado **no** reporta su propia actividad | §3.1, §3.2 |
| ¿El Gerente puede modificar datos reportados por otros? | Sí, en la etapa de revisión final | §3.1 |
| ¿Queda constancia de esas modificaciones? | No, y es una **decisión deliberada** | §2.2, §8 |

---

## Anexo — Glosario JTBD

| Término | Qué significa |
|---------|---------------|
| **JTBD** (*Jobs To Be Done*) | Marco que analiza el **progreso que alguien busca** en una situación, en lugar de sus características como usuario. Premisa: la gente "contrata" productos para hacer un trabajo |
| **Job** | El progreso buscado. Estable en el tiempo, independiente de la tecnología |
| **Job performer** | Quien ejecuta el trabajo. Es un rol en una situación, no un cargo |
| **Job story** | *Cuando [situación], quiero [motivación], para [resultado]*. Sin rol ni solución |
| **Desired outcome** | Resultado medible: *dirección + métrica + objeto + contexto* |
| **Anti-objetivo** | Algo que se decide deliberadamente no hacer |

**Referencias del marco:**

- Clayton Christensen — *Competing Against Luck* (formulación original del JTBD)
- Tony Ulwick — *Jobs to be Done: Theory to Practice* (job statements y desired outcomes)
- Alan Klement — *When Coffee and Kale Compete* (job stories)
