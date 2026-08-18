# Dudas abiertas — Sistema VAP

Cuestiones **detectadas pero no resueltas**: cosas que se han encontrado revisando el código o los
datos y que necesitan una respuesta del negocio antes de poder decidir nada.

Una duda por archivo, con el formato de [`0000-plantilla.md`](0000-plantilla.md).

## Para qué sirve esta carpeta

Separa tres cosas que se confunden con facilidad:

| | Dónde vive | Qué es |
|---|---|---|
| **Una duda** | `docs/dudas/` | Falta información para poder decidir |
| **Una decisión** | [`docs/adr/`](../../docs_dev/adr/README_ADR.md) | Ya se decidió; queda registrado el porqué |
| **Una tarea** | [`docs/ROADMAP.md`](../ROADMAP.md) | Se sabe qué hacer; falta hacerlo |

El recorrido habitual es **duda → decisión → tarea**. Cuando una duda se resuelve y da lugar a un
cambio de diseño, se crea el ADR correspondiente y se enlaza desde la duda.

## Índice

| # | Duda | Estado | Bloquea |
|---|------|--------|---------|
| [0001](0001-tres-libros-destino-de-los-volcados.md) | Los volcados van a tres libros distintos | 🔴 Abierta | Unificar el destino de los volcados · cerrar la Fase 3.A |
| [0002](0002-signo-de-seguro-medico-y-cobee-en-sage.md) | Con qué signo llegan de SAGE el seguro médico y COBEE | 🔴 Abierta | Dar por correcta la fórmula del salario base · el signo de los importes en Vinculación |
| [0003](0003-momentos-de-copia-y-pega-del-proceso.md) | Los momentos de copia y pega del proceso | 🔴 Abierta | Convertirlos en pasos semiautomáticos · saber cuándo entró cada dato |

## Deuda técnica

**[`deuda-tecnica.md`](deuda-tecnica.md)** — inventario de lo detectado revisando el código y los
datos: **20 entradas** clasificadas por prioridad y esfuerzo. Nada de ello impide que el sistema
funcione hoy; son cosas que **funcionan por casualidad, que se romperán al crecer, o que nadie sabe
explicar**.

Vive aquí y no en el ROADMAP porque comparte naturaleza con las dudas: son **hallazgos**, no tareas
planificadas. Cuando se decide abordar una, pasa al ROADMAP como punto de la
[Fase 4.B](../ROADMAP.md).

Las tres de prioridad más alta:

| # | Deuda | Por qué |
|---|-------|---------|
| [DT-16](deuda-tecnica.md#dt-16--falta-el-mapa-del-flujo-de-datos-y-usuarios) | Falta el mapa del flujo de datos y usuarios | Sin él, cada decisión se toma mirando una pieza aislada |
| [DT-01](deuda-tecnica.md#dt-01--tonumber_-corrompe-decimales-con-punto) | `toNumber_` corrompe decimales con punto | Alimenta la comparación que decide si una celda cambió |
| [DT-08](deuda-tecnica.md#dt-08--taller-vs-mecánico-en-el-histórico-de-profesores) | `TALLER` vs `MECÁNICO` en el histórico | Las copias se añaden por posición: podría mezclar conceptos |

## Estados

- 🔴 **Abierta** — sin respuesta todavía.
- 🟡 **En verificación** — hay una respuesta provisional, falta comprobarla.
- 🟢 **Resuelta** — respondida. Si derivó en un cambio, se enlaza el ADR.
- ⚪ **Descartada** — dejó de ser relevante. Se anota por qué.

## Cómo escribir una duda que sirva

- **Distingue lo comprobado de lo supuesto.** Es lo que hace que la ficha siga siendo fiable dentro
  de seis meses.
- **Pregunta cosas respondibles.** "¿De qué libro sale la nómina?" se puede contestar; "¿cómo
  funciona el proceso?" no.
- **Explica la consecuencia.** Si no la tiene, seguramente no merece una ficha.
- **Anota qué haría falta para cerrarla**: un acceso, un dato, una comprobación concreta.
