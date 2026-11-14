# Items v3 — Sistema VAP

Ideas y mejoras **sin trazabilidad**: no se puede rastrear ninguna hasta un problema declarado en
[`problem.md`](../docs_discovery/problem.md), una historia de usuario o un requisito.

Por eso viven aquí y no entre el trabajo planificado. Lo que sí está trazado se sigue en
[`requisitos_funcionales.md`](../docs_discovery/requisitos_funcionales.md) y
[`requisitos_no_funcionales.md`](../docs_discovery/requisitos_no_funcionales.md) —que llevan el
estado de cada uno— y se organiza en sprints en
[`proximos_pasos.md`](proximos_pasos.md).

> **Cómo sale un item de aquí.** Cuando una idea encuentra su origen —un *job story* de
> `problem.md`, una historia de usuario— se escribe como **RF o RNF** con su trazabilidad, y deja de
> ser un item v3. Mientras tanto se queda, sin caducar y sin estorbar.

**Estados:** 💡 idea · 🔍 falta saber algo para poder valorarla · ⬜ *Won't* — decidido que no entra

---

## Del antiguo ROADMAP (7 septiembre 2026)

El `ROADMAP.md` se eliminó al aplicar la regla de trazabilidad: sus puntos ya vivían en los
requisitos —con su estado— o en la deuda técnica, y mantenerlos también allí era duplicar el estado
en dos sitios. Estos son los que **no tenían dónde ir**, porque no se pueden rastrear hasta ningún
problema declarado.

### Del backlog de "Mejoras propuestas"

- **Registro de actividad de profesores:** destino con una fila por (profesor, mes) para
  histórico mensual; validar que el mes elegido coincide con el año de la marca temporal; hoja
  de auditoría de cambios (ver [ADR-0009](../docs_solutions/docs_design/adr/0009-acumular-respuestas-por-mes-y-anio.md)).
- **Aviso de volcado pendiente:** los volcados ya no son automáticos
  ([R-09](../docs_solutions/docs_design/SSD.md#9-riesgos-y-limitaciones)); evaluar un recordatorio si un periodo con respuestas
  no se ha exportado.
- **Sincronización repo ↔ GAS:** evaluar `clasp` para eliminar el copiar y pegar manual
  ([R-13](../docs_solutions/docs_design/SSD.md#9-riesgos-y-limitaciones)).

---

## Detectados en la auditoría del 7 septiembre 2026

- 💡 **Librería compartida para las funciones gemelas.** 31 funciones están duplicadas entre scripts
  —`clasificarError_` y `onOpen` en tres archivos, 29 más en dos—. Es consecuencia consciente de
  [ADR-0007](../docs_solutions/docs_design/adr/0007-proyectos-apps-script-independientes.md) y
  [ADR-0008](../docs_solutions/docs_design/adr/0008-reutilizar-patron-de-sincronizacion.md): proyectos
  Apps Script independientes no comparten globales. Pero choca de frente con **DRY**, que es regla del
  proyecto. Apps Script permite **librerías compartidas**; habría que evaluar si compensan su coste de
  despliegue. Mientras no se decida, **hace falta un ADR que reconozca la duplicación como aceptada**,
  para que no parezca un descuido.

### De las fases, sin requisito que los respalde

- 💡 **Identificar todas las fuentes de datos actuales de profesores y su estructura.** *(era Fase
  2.B)* Trabajo de descubrimiento: hasta saber qué hay, no se puede escribir el requisito.
- 🔍 **Definir los complementos salariales específicos del profesorado.** *(era Fase 2.B)* Decisión de
  negocio pendiente. Sin ella no hay nada que construir.
- 💡 **Evaluar si el profesorado reutiliza la webapp de secretarias o necesita versión propia.**
  *(era Fase 2.B)* Depende del punto anterior.
- 🔍 **Completar la línea de base de [`problem.md` §6](../docs_discovery/problem.md):** tiempo y
  errores del proceso **anterior** al sistema. *(era Fase 4.A)* Sin ese dato no se puede demostrar
  cuánto ha mejorado nada — pero nadie lo midió en su momento, y reconstruirlo puede no ser posible.
- 🔍 **Decidir de dónde lee el estado del cierre.** *(era Fase 5.C)* Los registros viven hoy en varios
  libros distintos. Se solapa con
  [ADR-0016](../docs_solutions/docs_design/adr/0016-un-unico-libro-de-vinculacion.md), que reduce los
  libros de Vinculación a uno: conviene decidirlo **después** de esa migración.
- 🔍 **Decidir dónde se almacena el histórico de indicadores.** *(era Fase 5.D)* `RF-53` exige que sea
  inmutable, pero **no dice dónde vive**. Comparar periodos depende de esa decisión.
