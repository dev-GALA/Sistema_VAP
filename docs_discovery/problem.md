# Problem Statement & Jobs To Be Done — Sistema VAP

| | |
|---|---|
| **Versión** | 0.4 — BORRADOR · con la comprobación mensual de concordancia y la lista única de empresas (19 nov 2026) |
| **Fecha** | 19 noviembre 2026 (versión 0.3: 17 noviembre 2026) |
| **Autor** | Fran Cañete (fcsainz) |
| **Estado** | Propuesta inicial para revisión |

---

## Cómo usar este documento

Este documento responde a **qué problema resuelve el Sistema VAP y para quién**, con independencia
de cómo esté construido. El "cómo" vive en [`SSD.md`](../docs_solutions/docs_design/SSD.md) y en [`adr/`](../docs_solutions/docs_design/adr/README_ADR.md).

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
| Responsables de complemento que reportan cada mes | **4** |
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
necesaria ([ADR-0013](../docs_solutions/docs_design/adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)).

**La actividad de los profesores sigue el mismo camino.** La reportan las secretarias mediante otro
formulario, y su volcado se ha rediseñado igual
([ADR-0014](../docs_solutions/docs_design/adr/0014-volcado-actividad-profesores-por-periodo.md)), con una diferencia que retrata
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
6. **El proceso no tiene principio visible ni marcador de avance.** El mes arranca con un acuerdo
   verbal que no queda registrado, así que quien no estuvo en esa conversación no sabe cuándo se
   cierra. Y durante el mes **no hay forma de saber qué falta**: solo consta lo que llega, nunca lo
   que no llega. De ahí que perseguir a cada fuente sea trabajo manual recurrente — y que el coste
   no esté tanto en consolidar como en **averiguar si ya se puede consolidar**.

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

Y el mes no se da por bueno cuando se valida, sino cuando se comprueba: **lo que cada persona recibe
coincide con lo que se calculó para ella**. Cerrar el circuito entre el cálculo y el cobro es parte
de la situación deseada, no un extra — porque es el único punto donde un error deja de ser una
hipótesis y pasa a ser dinero mal pagado.

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
| **Gestor de nóminas** | Emite un documento inicial de salario que envía a Responsable de Administración y, una vez cerrados los complementos, **recalcula IRPF y el resto de conceptos salariales** y devuelve los **importes netos a transferir** | Tener los datos completos, consolidados y fiables en la fecha de cierre |
| **Gerente** | Revisa el conjunto junto con Responsable de Administración; **aporta datos de origen propio introduciéndolos directamente en el archivo de cálculo** —sin pasar por ninguna vía de captura— y **modifica importes ya reportados por otras fuentes** cuando procede | Poder dar el mes por bueno, con los importes ajustados a lo que considera correcto |
| **Responsable de Administración** | **Coordina el proceso completo del cierre**, en buena parte de forma personal y presencial: persigue lo que falta, resuelve dudas con cada fuente y opera la consolidación. Además **verifica** los conceptos que se descuentan (seguro médico, COBEE, anticipos) y, tras el pago, **contrasta lo transferido con lo calculado** | Que el cierre salga a tiempo y cuadre, sin depender de que cada fuente se acuerde de reportar por su cuenta |

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
| **Dirección / RRHH** | No | Necesita que el sistema retributivo sea defendible ante una reclamación, y **poder valorar qué aporta**: tiempo ahorrado, errores evitados, descuadres detectados |
| **Departamento de Data** | No | Consume la actividad del proceso para analizarla, comparar periodos y detectar variaciones que merezcan explicación |
| **Quien mantiene el sistema** | Sí | Hoy, una sola persona: cualquier fallo o ausencia recae sobre ella |
| **Quien exporta de SAGE** | Sí | Hace cada mes la primera exportación laboral de la que parten los volcados y las comprobaciones. Hoy el export **no trae el DNI**, que es lo que permitiría identificar a cada persona en el resto de documentos (§4.4) |

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
- **Comprobar que lo efectivamente pagado coincide con lo calculado.**
- **Saber cuánto ha costado el cierre de este mes y cómo se compara con los anteriores.**
- **Poder explicar qué aporta el sistema** a quien no participa en el proceso.
- Incorporar un concepto retributivo nuevo sin rehacer el proceso.

> Los dos *jobs* en negrita corresponden al **ajuste de la revisión final** (§4.4) y son propios del Gerente y
> el Responsable de Administración. Se distinguen del segundo de la lista: *corregir* lo propio busca
> enmendar un error de quien lo reportó; *ajustar* lo ajeno es un acto de decisión sobre el importe.

### 4.4 Captura, consolidación, ajuste y verificación

> *Las cuatro partes del proceso que es fácil confundir, y que delimitan hasta dónde puede llegar el
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
| **Verificación** | Contrastar lo que entra y lo que sale contra una **fuente independiente**: lo que se descuenta contra lo que corresponde, y lo pagado contra lo calculado | Sí | **Sí — y hoy no se hace** |

Esta distinción delimita el alcance del sistema: **puede aspirar a que la captura, la consolidación
y la verificación sean completas y fiables; el ajuste es terreno humano y así se quiere.** El importe
final es el resultado de las cuatro, y todas menos el ajuste son reconstruibles a posteriori.

> **La verificación no estaba en la primera versión de este documento, y es la que más se echa en
> falta.** No reúne datos ni decide importes: **comprueba**. Y a diferencia del ajuste, es trazable y
> automatizable — lo que significa que el hueco que deja hoy no es un límite del problema, sino
> trabajo por hacer.
>
> **No es una idea de despacho:** salió como petición expresa en la última reunión de revisión. El
> primer paso es **pedir a cada proveedor el dato con el que contrastar** —la relación real de
> asegurados, las ayudas concedidas, el fichero de pagos del banco— para ver cómo vienen y decidir
> cómo cruzarlos. Sin esa fuente independiente no hay verificación posible: solo se estaría
> comparando el sistema consigo mismo.

> **Matiz que aporta el mapa del flujo** ([FLUJO.md](../docs_work/flujo_doc/FLUJO.md)): la consolidación **no está
> automatizada de extremo a extremo**. Los scripts dejan los datos en unos archivos intermedios, y
> de ahí alguien los **pega a mano** en el archivo donde se calcula. Ese tramo es tan manual y tan
> poco trazable como lo que había antes — solo que ahora está concentrado en un único salto en lugar
> de repartido por todo el proceso.
>
> Y hay **dos vías de captura que tampoco dejan rastro**: el volcado del Excel de nóminas y los datos
> que el Gerente introduce directamente en el archivo de cálculo. De ninguna de las dos consta qué
> entró ni cuándo.

> **Lo que se ha visto al probar la verificación con ficheros reales (16 nov 2026, solo cifras).** El
> hueco deja de ser una hipótesis. Con una muestra de un mes de ADESLAS, COBEE, banco y SAGE, y el libro
> de la Vinculación:
>
> - **ADESLAS es coherente consigo mismo** (106 asegurados, 71 titulares, total del pie cuadrado), pero
>   **al cruzarlo con la Vinculación solo cuadran 56 de los 71 titulares**: 4 constan con 0 €, 9 con otro
>   importe y 2 no se encuentran por DNI. Además hay 3 personas con importe que no son titulares.
> - **Esas diferencias no nacen del volcado:** el libro refleja fielmente lo que trae SAGE (473 de 474),
>   salvo retoques manuales posteriores y filas que no están en el export. Hoy **nada lo detecta**.
> - **Las ayudas de COBEE no llegan a SAGE ni al libro:** sus cuatro columnas vienen vacías en las 493
>   personas, mientras COBEE dice haber concedido comida a 8.
> - **Para cruzar hace falta una identidad común.** SAGE identifica a la persona por empresa y nº de
>   empleado y **no trae DNI**; ADESLAS y COBEE, por DNI; el banco, por nombre e IBAN. Antes de comparar
>   importes hay que comprobar que **cada persona sigue siendo la misma en todas partes**, incluso si ha
>   cambiado de empresa (HU-46).
>
> Son datos de **una sola muestra** y no se ha verificado que la hoja del libro sea la del mes
> contrastado: marcan el orden de magnitud, no una tasa. Detalle en
> [fuentes_de_contraste.md](../docs_work/docs_cruce/fuentes_de_contraste.md) §9 y §10.

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

**JS-08 — Dar la salida del mes**
Cuando queda fijada la fecha de cierre, quiero que todo el que deba reportar se entere de que el
proceso ha empezado, para no tener que avisar a cada uno personalmente ni arriesgarme a que alguien
no se dé por enterado.

**JS-09 — Confiar en lo que se descuenta**
Cuando reviso el mes, quiero contrastar los importes que se restan —seguro médico, ayudas a comida y
transporte, anticipos— con lo que realmente corresponde a cada persona, para que un error en ellos no
se propague a todo lo demás.

**JS-10 — Confirmar que lo pagado es lo calculado**
Cuando ya se han hecho las transferencias, quiero comprobar que lo que ha salido coincide con lo que
se calculó, para detectar un pago equivocado antes de que lo detecte la persona afectada.

**JS-11 — Saber si este mes ha sido normal**
Cuando termino el cierre, quiero ver cómo se compara con los meses anteriores, para detectar a
tiempo lo que se sale de lo corriente en vez de enterarme cuando alguien lo pregunte.

> **JS-08, JS-09 y JS-10 salen del mapa del flujo** ([FLUJO.md](../docs_work/flujo_doc/FLUJO.md)) y son las tres situaciones
> del proceso que hoy **no tienen ningún apoyo**: el arranque, la verificación de lo que se descuenta
> y la comprobación del pago. Las tres son del Responsable de Administración, el rol peor cubierto.

> **JS-06 y JS-07 corresponden al ajuste y cierre del mes** (§3.1, §4.4) y no existían en la primera
> versión del documento. Nótese que JS-06 pide **rapidez y autonomía** —resolver sin volver al
> origen— mientras que JS-02 pide **conservar el rastro**. No son contradictorios porque hablan de
> momentos distintos del proceso, pero la diferencia es deliberada y conviene no unificarlos.

> **Cómo se sirven hoy estas situaciones tras el diseño del 16 nov 2026.**
>
> - **JS-03 y JS-08** (saber qué falta, dar la salida) se sirven con **una sola pantalla**, *Proceso mensual*,
>   que es el tablero de los nueve pasos con otro nombre: unos pasos son manuales y otros se ejecutan desde
>   ella (HU-45).
> - **JS-05** no es solo el alta: abarca **bajas y cambios de empresa o de cuenta**. Un cambio de empresa
>   se trata como **baja en una y alta en otra**, y su historial queda partido (HU-47; el riesgo R-21 del
>   SSD ya lo describía para los profesores).
> - **JS-05 también depende de que el maestro de personas sea coherente** (visto el 17 nov 2026): la lista de empresas está en
>   **dos sitios que no coinciden** (7 en `Config`, 9 en un desplegable) y las tres pestañas llaman distinto a las mismas columnas, así que
>   un alta hecha desde una pantalla puede quedar mal en una de ellas (HU-47; RF-100 y RF-101).
>   **Actualizado el 19 nov 2026:** la lista de empresas **queda cerrada en 11** y vive en un solo sitio (`Config` del maestro);
>   los desplegables de las tres pestañas ya leen de ahí. Una misma empresa se escribe de **tres maneras** según el origen
>   (maestro, export de SAGE y Vinculación), y esa diferencia es una fuente de descuadres silenciosos (HU-46; RF-80 y RF-100).
> - **JS-09 y JS-10** necesitan, antes que nada, que la identidad de cada persona concuerde entre SAGE y el
>   maestro de personas (HU-46) y que el pago se reconozca sin guardar la cuenta (HU-48). **JS-10** se sirve
>   además con el **cruce mensual del fichero del banco**, su informe subsanable (HU-49) y la consulta del
>   histórico y del Maestro de Pagos (HU-50), decididos el 17 nov 2026.
> - **La comprobación de concordancia (HU-46) es mensual** (decidido el 19 nov 2026): primero se actualiza el maestro de personas,
>   después el export de SAGE y por último se cruzan. Hoy es **opcional** y **en el futuro será obligatoria** para dar el mes por bueno.
>   Una persona puede estar en **dos empresas** (sobre todo el Staff): en todo el recorrido hay **dos filas**, cada una con su
>   identificador de trabajador, y el DNI es lo que las une.

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
| RD-07 | Minimizar el **tiempo hasta saber qué fuentes faltan** por reportar | Días desde el inicio del cierre hasta tener la lista de quién falta | 🔍 hoy no se sabe |
| RD-08 | Minimizar los **descuadres entre lo calculado y lo pagado** | Nº e importe de diferencias detectadas tras la transferencia | 🔍 hoy nadie lo comprueba |
| RD-09 | Maximizar la **capacidad de comparar** un periodo con otro | ¿Se puede responder "¿este mes es normal?" sin rehacer el análisis a mano? | 🔍 hoy no |
| RD-10 | Minimizar el **esfuerzo de justificar** qué aporta el sistema | Tiempo en producir el informe de actividad y ahorro | 🔍 hoy no existe |

> 🔍 **Por validar — sigue faltando la línea de base.** Hay datos de cómo funciona hoy el sistema,
> pero **no hay dato del "antes"**: cuánto tiempo consumía el cierre manual, cuántos errores
> aparecían. Sin ese punto de partida se puede describir cómo funciona hoy el sistema, pero no
> demostrar cuánto ha mejorado. Una estimación tuya ("antes eran unas 3 jornadas, ahora media") ya
> sirve.

> **Qué miden y qué no.** Conviene tener presente al leer cualquiera de estos resultados: medir que
> **el mecanismo de reporte no falla** no es lo mismo que medir que **los importes sean correctos**.
> Un dato erróneo bien formado se registra sin incidencia alguna. Del mismo modo, las correcciones
> que alguien envía solo capturan los errores **que alguien detectó y quiso enmendar**: son una
> medida indirecta, no la tasa de error real.

### 6.1 Qué habría que medir

> *Los resultados deseados de arriba dicen **qué significa haberlo conseguido**. Este apartado dice
> **qué hay que recoger** para poder afirmarlo. No lleva valores: los valores se generan y se guardan
> aparte.*

**Cinco familias.** Las cuatro primeras describen el proceso; la quinta es la que permite defenderlo.

| Familia | Qué recoge | Para qué sirve |
|---------|------------|----------------|
| **Volumen** | Cuánta información se ha tratado: registros por concepto y por responsable, **personas cubiertas**, y cuánto dato se genera **por persona** | Dimensionar el trabajo real y ver si crece |
| **Ejecución** | Qué se lanzó, cuándo, con qué resultado y cuántas incidencias | Saber que el proceso se ha ejecutado, y que ha ido bien |
| **Cobertura** | Cuántas fuentes reportaron de las esperadas, y quién faltó | **Medir lo que no llegó** — hoy no se mide nada de esto |
| **Puntualidad** | Cuándo ocurrió cada paso respecto a la fecha acordada | Detectar el retraso mientras se puede corregir |
| **Valor** | Tiempo dedicado al cierre, errores evitados, **descuadres detectados** entre lo calculado y lo pagado | Responder a *"¿qué nos está aportando esto?"* con datos |

**Tres periodicidades**, porque no responden a lo mismo:

| | Qué pregunta responde |
|---|---|
| **Mensual** | ¿El cierre de este mes ha ido bien y está completo? |
| **Trimestral** | ¿Qué está **variando**? Es donde se ven las tendencias que un mes suelto esconde |
| **Anual** | ¿Cuánto ha movido el sistema en el año y qué ha ahorrado? |

**Tres destinatarios distintos**, y conviene no darles el mismo informe:

- **Responsable de Administración** — necesita el detalle **del mes en curso**, para actuar: qué falta, qué falló, qué hay que perseguir.
- **Departamento de Data** — necesita el dato **en bruto y comparable entre periodos**, para analizarlo por su cuenta.
- **Gerencia** — necesita el **resumen y la tendencia**: cuánto se mueve, cuánto se ahorra, dónde están los riesgos.

> ⚠️ **Cada indicador tiene que decir qué mide y qué no.** Que el mecanismo de reporte no falle no
> significa que los importes sean correctos: un dato erróneo bien formado se registra sin incidencia.
> Un panel en verde puede convivir perfectamente con una nómina mal calculada. Sin esa advertencia al
> lado, la medición **da una falsa sensación de seguridad** — que es peor que no medir.

> 📊 **Los datos de operación no viven en este documento.** Las cifras de actividad —registros,
> remesas, cobertura por mes, uso por concepto— se generan y se guardan aparte. Este documento
> plantea el problema y define qué habría que medir; **los valores medidos van en la medición del
> proceso** ([RF-51…RF-56](requisitos_funcionales.md)).

---

## 7. Restricciones

> *Los límites reales dentro de los que hay que resolver el problema. Distingue las que vienen
> impuestas de las que son decisión propia: las segundas se pueden revisar.*

| Tipo | Restricción |
|------|-------------|
| **Impuesta** | El resultado debe encajar con el proceso de nómina existente y sus fechas de cierre |
| **Impuesta** | Los datos son de personal: retributivos y de carácter personal |
| **Decisión** | Todo se construye sobre Google Workspace, sin infraestructura nueva ([ADR-0001](../docs_solutions/docs_design/adr/0001-google-sheets-como-bbdd-central.md)) |
| **Decisión** | Avance por fases y por colectivos, en lugar de un despliegue único |
| **De facto** | Desarrollo y mantenimiento a cargo de una sola persona, compatibilizado con otras funciones |
| **De facto** | **La automatización tiene un techo de aceptación.** Quien opera el cierre maneja datos retributivos muy sensibles y necesita seguir **teniendo el control** de cuándo ocurre cada cosa |
| **Impuesta** | Los ficheros de ADESLAS, COBEE, banco y SAGE y los libros con nóminas contienen **datos personales** (DNI, IBAN, correo, importes nominativos): no entran en el repositorio ni se copian a la documentación ([CLAUDE.md](../CLAUDE.md), segunda regla) |
| **Decisión** | La webapp nueva tiene **su propio libro, propiedad de la cuenta del desarrollador** y no de la cuenta compartida del grupo, porque la información es muy delicada ([ADR-0018](../docs_solutions/docs_design/adr/0018-gsh-propio-de-la-webapp-propietario-y-accesos.md), propuesta) |
| **Decisión** *(17 nov 2026; pendiente de la firma de Gerencia y protección de datos)* | De la cuenta bancaria **solo se guarda una huella** (más los últimos 4 dígitos), nunca la cuenta, y **no en el mismo libro que el DNI**, en un **proyecto de Apps Script propio** que guarda la clave (RF-86, RF-98, RNF-21) |

> **Sobre el techo de automatización.** No es una limitación técnica ni una resistencia al cambio:
> es una consecuencia razonable de lo que está en juego. Un paso que se dispara solo, en un proceso
> que decide lo que cobra la gente, quita a quien responde de él la posibilidad de mirarlo antes.
>
> De ahí una pauta de diseño que conviene respetar en todo lo que se construya: **automatizar el
> trabajo, no la decisión de hacerlo**. Que el sistema prepare, calcule y avise; que **ella pulse**.
> Es exactamente el patrón que ya siguen los volcados —analizar, mostrar el informe, y escribir solo
> si se confirma— y que conviene extender al resto en lugar de inventar otro.

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
- **No corregir por su cuenta** *(decidido el 16 nov 2026)*. Las comprobaciones **solo informan**: la
  Responsable de Administración corrige en el documento de origen y repite la comprobación. Un informe que
  corrigiera solo sería un paso más que se dispara solo, contra la pauta de §7 (RF-35).
- **No guardar la cuenta bancaria de las personas** *(propuesta, pendiente de validar)*. Para reconocer un
  pago basta una huella: el sistema no necesita volver a leer la cuenta (RF-86, RNF-19).

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
| S-01 | El problema principal es la **consolidación** de datos, no su **captura** | Habría que mirar aguas arriba: quizá el dolor está en que los datos se generan mal desde el origen. **El mapa del flujo lo pone en duda**: dos de las cinco vías de captura no dejan ningún rastro (§4.4) |
| S-02 | Los responsables están dispuestos a reportar con método si es cómodo | La adopción sería el problema real, no la automatización |
| S-03 | Las reglas de cálculo son estables mes a mes | Haría falta un sistema configurable, no automatizado sobre reglas fijas |
| S-04 | Secretarias y profesores comparten suficiente estructura para un enfoque común | Serían dos problemas distintos que conviene no forzar a converger |
| S-05 | Existe una parte del importe final que **no es sistematizable**: responde a gestiones puntuales y personales que nacen fuera del sistema (§4.4) | Si en realidad fuera capturable, parte de esos ajustes serían evitables mejorando la captura, y el sistema podría llegar más lejos de lo que hoy se asume |
| S-06 | El archivo donde se calcula la nómina está **fuera del alcance del sistema**, y los datos llegan a él por medios que el sistema no controla | Desaparecería el único tramo sin auditar de toda la cadena, y el sistema podría llegar bastante más lejos de lo que hoy se asume |

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
6. ¿Puede el export de SAGE incluir el DNI, y llegan las ayudas de COBEE en el segundo export? *(→ §4.4;
   [fuentes_de_contraste.md](../docs_work/docs_cruce/fuentes_de_contraste.md) §7, preguntas 11 a 13)*
7. ¿Validan Gerencia y protección de datos guardar solo una huella de la cuenta bancaria? *(→ §7, §8;
   OB-36)*
8. ¿Qué hoja de la Vinculación es la del mes que se contrasta, y qué significan los importes de +1,00 € de
   su columna ADESLAS? *(→ §4.4)*

**Resueltas:**

| Pregunta | Respuesta | Recogida en |
|----------|-----------|-------------|
| ¿Cuántas personas, responsables y autoescuelas hay implicadas? | ~400 personas · **4 responsables de complemento** · 55 autoescuelas | §1 |
| ¿Por qué no cuadraban los responsables dados de alta con los que reportan? | El quinto de alta es una **cuenta de pruebas** de quien mantiene el sistema | §3.1 |
| ¿Dónde se calcula realmente la nómina? | En un archivo aparte, **Gastos de Personal**, al que llegan **pegados a mano** los datos que los scripts consolidan | [FLUJO.md](../docs_work/flujo_doc/FLUJO.md) |
| ¿Qué ocurre entre el cálculo y el pago? | Los complementos vuelven al archivo de nómina, el Gestor recalcula IRPF y demás y devuelve los **netos a transferir** | [FLUJO.md](../docs_work/flujo_doc/FLUJO.md) |
| ¿Quién reporta la actividad del profesorado? | Las secretarias que lo gestionan reportan parte; el resto llega por el Gerente u otras vías. El profesorado **no** reporta su propia actividad | §3.1, §3.2 |
| ¿El Gerente puede modificar datos reportados por otros? | Sí, en la etapa de revisión final | §3.1 |
| ¿Queda constancia de esas modificaciones? | No, y es una **decisión deliberada** | §2.2, §8 |
| ¿El *Proceso mensual* y el tablero de los nueve pasos son dos pantallas? | **Una sola**, con dos nombres (16 nov 2026) | HU-45 |
| ¿Un cambio de empresa es la misma persona con otro identificador? | No: **baja en una empresa y alta en otra**; el historial queda partido (16 nov 2026) | HU-47 · RF-83 · R-21 |
| ¿Cuántas empresas hay y cómo se llama cada una? | **11**: ARCOVIAL, CASTA, CERVANTES, DRIVERS, GALA, INTERCASTILLA, JOSE, LOGYFOR, MOTOR INTEGRAL, NESSUN y VALDEARROYOS; JOSE se entiende como empresa a nivel interno (19 nov 2026). MOTOR INTEGRAL se escribe **CTM MOTOR** en el export de SAGE y **CTM MOTOR INTEGRAL SLU** en otra hoja | HU-47 · RF-100 |
| ¿La comprobación de concordancia es obligatoria? | **Mensual; opcional por ahora y obligatoria en el futuro** (19 nov 2026). Orden: maestro, export de SAGE y cruce | HU-46 · RF-80 |
| ¿Una persona puede tener dos identificadores? | Sí, si está en **dos empresas** (sobre todo Staff): **dos filas**, cada una con su `id_trabajador`; el DNI las une (19 nov 2026) | HU-46 · RF-80 · RF-83 |
| ¿De quién es la webapp nueva y dónde guarda su estado? | En **un libro propio**, de la cuenta del desarrollador (16 nov 2026, propuesta) | [ADR-0018](../docs_solutions/docs_design/adr/0018-gsh-propio-de-la-webapp-propietario-y-accesos.md) |

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
