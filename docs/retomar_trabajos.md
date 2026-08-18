# RETOMAR TRABAJOS — Sistema VAP

**Qué toca hacer ahora**, agrupado en sprints y en trozos lo bastante pequeños como para cerrarlos.

| | |
|---|---|
| **Versión** | 0.6 |
| **Fecha** | 18 agosto 2026 |
| **Se apoya en** | [ROADMAP.md](ROADMAP.md) · [FLUJO.md](FLUJO.md) · [dudas/](dudas/README_dudas.md) |

---

## Para qué sirve este documento

El [ROADMAP](ROADMAP.md) dice **qué hay que construir y por qué**, organizado por fases. Pero una
fase no se puede empezar un martes por la mañana: es demasiado grande. Este documento la parte en
**objetivos pequeños y cerrables**, agrupados en **sprints**, y dice cuál toca ahora.

| | Responde a |
|---|---|
| [`ROADMAP.md`](ROADMAP.md) | ¿Qué hay que hacer, en qué orden y por qué? |
| **`retomar_trabajos.md`** *(este)* | **¿Qué hago ahora, y qué me lo impide?** |
| [`dudas/`](dudas/README_dudas.md) | ¿Qué falta saber para poder decidir? |
| [`../docs_dev/problem.md`](../docs_dev/problem.md) | ¿Qué significa haberlo conseguido? *(resultados deseados)* |

**Reglas para que esto siga sirviendo:**

- Un objetivo que no se pueda cerrar en **una o dos sesiones de trabajo** es demasiado grande:
  pártelo.
- Cada objetivo dice **de qué depende**. Si depende de otra persona o de un documento de fuera, eso
  es lo primero que hay que mover.
- **Un sprint se cierra por objetivo cumplido, no por fecha.** El desarrollo lo lleva una sola
  persona compatibilizándolo con otras funciones, así que fijar quincenas rígidas solo serviría para
  arrastrar deuda de un sprint al siguiente.
- Cuando un objetivo se cierra, se marca 🟢 y **se anota qué salió de él** — normalmente una
  respuesta a una duda, o un punto del ROADMAP que ya se puede empezar.

## Las tres vías

| Vía | Qué es | De qué depende |
|-----|--------|----------------|
| 🔵 **En solitario** | Construir, analizar y preparar | Solo del desarrollo |
| 🟣 **Conjunta** | Validar y resolver dudas **con la Responsable de Administración** | De acordar reunión |
| 🟠 **De terceros** | Documentos que emiten ADESLAS, COBEE y el banco | De que los envíen |

> **Lo que no depende de ti, muévelo primero.** Es la razón de que el Sprint 2 sea entero 🟣 y 🟠:
> son las dos cosas con plazo ajeno, y todo lo demás las espera. El Sprint 1 se hace en paralelo,
> porque no depende de nadie.

---

## Los sprints de un vistazo

| Sprint | Objetivo del sprint | Objetivos | Estado |
|--------|---------------------|-----------|--------|
| **0 · Historias y requisitos** | Poner por escrito qué tiene que hacer el sistema y para quién | OB-15, OB-16 | 🟢 **Cerrado** |
| **1 · La webapp de coordinación** | Que el cierre se lance, se siga y se mida desde una pantalla | OB-07, OB-08, OB-20 … OB-22, OB-09, OB-10, OB-13, OB-14 | 🟡 **En curso** |
| **2 · Saldar la deuda** | Que todo deje rastro, y limpiar las 20 entradas de deuda técnica | OB-17 … OB-19, OB-23 … OB-27 | 🔴 Pendiente |
| **3 · Verificación de datos** | Comprobar seguro médico, COBEE y transferencias contra lo calculado | OB-01 … OB-06, OB-11, OB-12 | 🔴 Pendiente |

**Estados:** 🔴 pendiente · 🟡 en curso · 🟢 cerrado · ⚪ bloqueado

> **Tres sprints activos y uno cerrado.** El 1 construye, el 2 arregla y el 3 comprueba. Las
> dependencias van en ese orden: el panel del 1 deduce su información del rastro que arregla el 2, y
> las comprobaciones del 3 necesitan documentos que hay que pedir ya.

---

# Sprint 0 · Historias y requisitos — 🟢 Cerrado

> **Objetivo del sprint:** poner por escrito **qué tiene que hacer el sistema y para quién**, con el
> detalle suficiente para poder construir sin volver a preguntar.

Lleva el número 0 porque es el punto de partida: no construye nada, pero es de donde salen los
criterios con los que se construye todo lo demás.

### OB-15 · Escribir las historias de usuario — 🔵 🟢 **Cerrado**

| | |
|---|---|
| **Responde a** | ROADMAP Fase 4.A |
| **Depende de** | Nada: se apoya en lo ya escrito |
| **Entregable** | [`../docs_dev/historias_usuarios.md`](../docs_dev/historias_usuarios.md) |

Derivar de las *job stories* de [`problem.md`](../docs_dev/problem.md) y del proceso de
[`FLUJO.md`](FLUJO.md) las historias de usuario, con **criterios de aceptación verificables**,
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
| **Responde a** | ROADMAP Fase 4.A |
| **Depende de** | OB-15 |

El [SSD](../docs_dev/SSD.md) ya tiene requisitos, pero escritos **desde el código hacia arriba**:
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

# Sprint 1 · La webapp de coordinación

> **Objetivo del sprint:** que exista una pantalla desde la que la Responsable de Administración
> **lance el mes, lleve el control del cierre y vea cómo ha ido**. Es la webapp que coordina la
> generación de *Gastos de Personal*, el archivo del que salen los importes mensuales.

**Se empieza antes de la reunión del 7 de septiembre, y eso ordena el sprint en dos mitades.**

| Se construye ya | Espera a la reunión o al Sprint 2 |
|-----------------|-----------------------------------|
| **OB-07** dónde vive el estado · **OB-08** qué se mide | **OB-09** avisos — necesita el calendario (OB-06) |
| **OB-20** esqueleto · **OB-21** lanzar el mes | **OB-10** seguimiento — necesita decidir si se declara *"no tengo nada"* |
| **OB-22** tablero de los nueve pasos, a mano | **OB-13** deducir el estado — necesita OB-18 (Sprint 2) |
| | **OB-14** informes |

> **Hay un motivo para empezar antes y no después.** El bloque F de la
> [reunión](reuniones/2026-09-07-revision-del-proceso.md) es enseñarle esta pantalla. Con la primera
> mitad construida deja de ser *"te cuento una idea"* y pasa a ser *"míralo y dime qué te falta"*.
>
> El riesgo es rehacer algo si su respuesta no encaja. Se acota no construyendo nada que dependa de
> lo que ella tiene que contestar: los nueve pasos salen de [`FLUJO.md`](FLUJO.md), verificado contra
> el código.

## Primera mitad — antes de la reunión

### OB-07 · Diseñar dónde vive el estado del cierre — 🔵

| | |
|---|---|
| **Responde a** | ROADMAP Fase 5.C |
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
| **Responde a** | ROADMAP Fase 5.D · [problem.md §6.1](../docs_dev/problem.md) |
| **Depende de** | Nada |

Las cinco familias —volumen, ejecución, cobertura, puntualidad y valor— ya están definidas. Falta
concretar **qué campo alimenta cada indicador** y **dónde se guarda el histórico**, para que comparar
un trimestre con otro no dependa de que nadie haya sobrescrito una hoja.

**Se cierra cuando** están decididos el almacén y qué se escribe en él tras cada cierre.

### OB-20 · El esqueleto de la webapp — 🔵

| | |
|---|---|
| **Responde a** | ROADMAP Fase 5.C · [HU-36](../docs_dev/historias_usuarios.md) |
| **Depende de** | Nada |

Acceso, portada y navegación, reutilizando el patrón de las webapps que ya existen —el portal de
complementos ya resuelve el enrutado y la validación por email—. **No inventar uno nuevo.**

**Se cierra cuando** se entra, se identifica quién entra y se navega entre las secciones vacías.

### OB-21 · Lanzar el mes y registrar sus fechas — 🔵

| | |
|---|---|
| **Responde a** | ROADMAP Fase 5.A · [HU-26](../docs_dev/historias_usuarios.md) · [RF-36, RF-37](../docs_dev/requisitos.md) |
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
| **Responde a** | ROADMAP Fase 5.C · [HU-29, HU-30](../docs_dev/historias_usuarios.md) · [RF-42, RF-45](../docs_dev/requisitos.md) |
| **Depende de** | OB-07 y OB-21 |
| **Es la primera parte de** | OB-13 — deducir el estado del registro viene después |

Los nueve pasos del cierre ([FLUJO.md §3](FLUJO.md)) con su estado —pendiente, lanzado, completado,
con incidencias— **marcados a mano**, y notas por paso y por mes.

> **Marcar a mano no es una versión pobre: es el punto de partida correcto.** Deducir el estado del
> registro exige antes decidir dónde vive (OB-07) y que los procesos dejen rastro (OB-18). Mientras
> tanto, un tablero manual ya sustituye a lo que hoy vive en la cabeza de una persona.
>
> Y cuando llegue la deducción automática, [RF-43](../docs_dev/requisitos.md) exige que se distinga
> lo deducido de lo marcado a mano — así que la marca manual **no se tira**, se queda.

**Se cierra cuando** se ve el estado del mes en curso y se pueden dejar notas.

## Segunda mitad — después de la reunión

### OB-09 · Construir el lanzamiento del cierre y los avisos — 🔵

| | |
|---|---|
| **Responde a** | ROADMAP Fase 5.A |
| **Depende de** | OB-06 |

Una webapp desde la que la Responsable de Administración **lanza el mes**, indicando la fecha tope de
reporte y la de entrega del documento final. La fecha de lanzamiento la toma el sistema. A partir de
ahí, aviso automático a responsables y secretarias con qué se espera de cada uno y hasta cuándo.

**Se cierra cuando** el mes se puede lanzar desde ahí y los avisos salen solos.

### OB-10 · Construir el seguimiento de lo reportado — 🔵

| | |
|---|---|
| **Responde a** | ROADMAP Fase 5.B |
| **Depende de** | OB-09 |

Ver **quién ha reportado y quién no** durante los días de recogida. Para los responsables de
complemento es directo. Para secretarias y profesores hay que resolver antes el problema del
denominador: hoy *no haber enviado* y *no tener nada que reportar* son **indistinguibles**.

**Se cierra cuando** se ve la lista de quién falta, o se ha decidido conscientemente que en esos dos
colectivos no se va a medir.

### OB-13 · Construir el panel de coordinación — 🔵

| | |
|---|---|
| **Responde a** | ROADMAP Fase 5.C |
| **Depende de** | OB-07 |

Estado de cada uno de los **nueve pasos** del cierre: pendiente, lanzado, completado, con
incidencias. Deduce del registro lo que ya consta y pide a mano solo lo que no deja rastro. Con
**comentarios** por paso y por mes, para recoger lo que no funcionó.

**Se cierra cuando** se ve el estado del mes en curso sin abrir ninguna hoja.

### OB-14 · Los informes del proceso — 🔵

| | |
|---|---|
| **Responde a** | ROADMAP Fase 5.D |
| **Depende de** | OB-08 |

Mensual para actuar, trimestral para ver variaciones, anual para valorar. Cada destinatario recibe lo
suyo: **Administración** el detalle del mes, **Data** el dato en bruto y comparable, **Gerencia** el
resumen y la tendencia.

**Se cierra cuando** los tres informes se generan solos y cada uno llega a quien le sirve.

---

# Sprint 2 · Saldar la deuda

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
| **Responde a** | ROADMAP Fase 3.A · [HU-18](../docs_dev/historias_usuarios.md) · [RF-23, RF-24](../docs_dev/requisitos.md) · R-07, R-17 |
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
| **Responde a** | [HU-20](../docs_dev/historias_usuarios.md) · [RF-47](../docs_dev/requisitos.md) · R-18 |
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
| **Responde a** | ROADMAP Fase 3.A · [HU-19](../docs_dev/historias_usuarios.md) · [RF-25, RF-26](../docs_dev/requisitos.md) · R-19 |
| **Depende de** | **OB-03 y OB-04** — saber cuáles son los archivos y cuándo se mueve cada cosa |

Los movimientos de datos entre libros se hacen **copiando y pegando**, y ninguno deja constancia. Es
el punto donde el dato sale del sistema y se corta la cadena de trazabilidad.

La acción prepara el movimiento, muestra qué va a cambiar y **solo escribe si se confirma** — el
mismo patrón de los volcados, no uno nuevo. Y avisa si ese traslado ya se hizo este mes.

> **La lanza ella, no el sistema.** Es la condición para que automatizar este paso no se perciba como
> perder el control sobre datos sensibles ([RNF-05](../docs_dev/requisitos.md)).

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

---

# Sprint 3 · Verificación de datos

> **Objetivo del sprint:** comprobar contra una **fuente independiente** que el seguro médico, las
> ayudas de COBEE y las transferencias emitidas coinciden con lo calculado. Es la primera vez que el
> sistema **comprueba** en lugar de transportar.

Este sprint tiene dos naturalezas y conviene no confundirlas: una parte es **preguntar** —a las
entidades y a la Responsable de Administración— y otra es **construir** con lo que se obtenga. Lo
primero no depende de nosotros y por eso va delante.

> **Verificar contra un dato del propio sistema no es verificar**, es comprobar que coincide consigo
> mismo. De ahí que todo este sprint dependa de documentos que emiten terceros.

## Lo que hay que pedir y preguntar

### OB-01 · Solicitar los tres documentos de contraste — 🟠

| | |
|---|---|
| **Responde a** | ROADMAP Fases 3.B, 3.C y 3.D |
| **Depende de** | Que las entidades los envíen |

| Entidad | Qué se pide | Para qué |
|---------|-------------|----------|
| **ADESLAS** | Relación real de asegurados con su importe | Contrastar el seguro médico |
| **COBEE** | Ayudas concedidas de comida y transporte | Contrastar los dos conceptos de COBEE |
| **Banco** | Fichero de transferencias emitidas | Contrastar lo pagado con lo calculado |

> **Va el primero de todo el documento a propósito:** no depende de nosotros y puede tardar. Mientras
> no lleguen, las tres fases de verificación están paradas — **verificar contra un dato del propio
> sistema no es verificar**, es comprobar que coincide consigo mismo.

**Se cierra cuando** los tres están pedidos y hay fecha estimada de entrega.

### OB-02 · Validar el mapa del flujo — 🟣

| | |
|---|---|
| **Responde a** | ROADMAP Fase 4.A |
| **Depende de** | Nada: el material ya está listo |
| **Material** | [`flujo_doc/`](flujo_doc/) — el documento y los ocho diagramas |

Contrastar el recorrido completo con quien lo ejecuta cada mes. El documento lleva al final una lista
de **diez puntos a validar**, ordenados por importancia.

**Se cierra cuando** el mapa refleja el proceso real, y las marcas de *sin confirmar* han
desaparecido o se han convertido en dudas con ficha propia.

### OB-03 · Averiguar qué es *Gastos de Personal* — 🟣

| | |
|---|---|
| **Responde a** | [DUDA-0001](dudas/0001-tres-libros-destino-de-los-volcados.md) · desbloquea Fases 3.A y 5.C |
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
| **Responde a** | [DUDA-0002](dudas/0002-signo-de-seguro-medico-y-cobee-en-sage.md) |
| **Depende de** | Hablar también con el Gestor de nóminas |

El cálculo del salario base **suma** esos importes en valor absoluto, mientras que el volcado a
Vinculación los copia con el signo que traigan.

**Se cierra cuando** se sabe si el valor absoluto es una decisión de diseño —y entonces se escribe un
ADR— o un parche que tapa un error del origen, y entonces se corrige.

### OB-06 · Fijar y escribir el calendario del cierre — 🟣

| | |
|---|---|
| **Responde a** | ROADMAP Fase 5.A · [FLUJO.md §8](FLUJO.md) |
| **Depende de** | Nada más que acordarlo |

Hoy el calendario del mapa es **una inferencia**. Hace falta el real: qué día se pega el Excel de
SAGE, cuándo se lanzan los volcados, cuándo es la revisión con Gerencia, cuál es la fecha tope — y
**quién avisa a quién** de que puede empezar cada paso.

**Se cierra cuando** el calendario está escrito y validado. Sin él no se puede hacer el Sprint 4.

> **Los cinco objetivos 🟣 se resuelven en una sola reunión** —la del
> [7 de septiembre](reuniones/2026-09-07-revision-del-proceso.md)— si se lleva con guion. No son
> cinco reuniones.

## Lo que se construye con las respuestas

### OB-11 · Analizar cada documento y decidir la clave de cruce — 🟠

| | |
|---|---|
| **Responde a** | ROADMAP Fases 3.B, 3.C y 3.D |
| **Depende de** | OB-01 |

De cada documento hay que ver **formato, campos, periodicidad y con qué se identifica a cada
persona**. Esa última es la que decide si el cruce es viable o hay que construir una correspondencia
a mano — y es la que más problemas suele dar.

**Se cierra cuando** de cada documento se sabe qué campo cruza con cuál del sistema, y qué porcentaje
de personas casan.

### OB-12 · Construir las tres comprobaciones — 🔵

| | |
|---|---|
| **Responde a** | ROADMAP Fases 3.B, 3.C y 3.D |
| **Depende de** | OB-11 |

Informe de diferencias por persona y concepto, con la misma pauta que los volcados: **revisar
primero, escribir después**. Queda por decidir si los informes solo avisan o pueden corregir, y si
una diferencia bloquea el cierre.

**Se cierra cuando** las tres comprobaciones producen su informe de diferencias.

---

## Una pauta que atraviesa todos los sprints

**Automatizar el trabajo, no la decisión de hacerlo.** Nada de lo que se construya aquí debe
dispararse solo: prepara, muestra y espera confirmación. Es el patrón que ya siguen los tres
volcados, y el que hace que automatizar no se sienta como perder el control sobre datos sensibles
([problem.md §7](../docs_dev/problem.md)).

## Cómo mantener este documento

Cuando aparece trabajo nuevo, se añade como objetivo pequeño en lugar de engordar uno existente. Si
un objetivo lleva semanas sin moverse, casi siempre es que **está bloqueado y no se ha marcado**, o
que es demasiado grande: las dos cosas se ven mirando la columna de dependencias.
