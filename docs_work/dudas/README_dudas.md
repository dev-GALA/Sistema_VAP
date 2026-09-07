# Dudas abiertas — Sistema VAP

Cuestiones **detectadas pero no resueltas**: cosas que se han encontrado revisando el código o los
datos y que necesitan una respuesta del negocio antes de poder decidir nada.

Una duda por archivo, con el formato de [`0000-plantilla.md`](0000-plantilla.md).

## Convención de nombres

```
NNNN-titulo-breve.md              ← mientras está abierta
NNNN-RESUELTA-titulo-breve.md     ← al cerrarse
```

El número **no cambia nunca**: identifica la duda, y los documentos que la citan siguen hablando de
`DUDA-0002` aunque el archivo se renombre.

> **El estado vive en tres sitios a la vez** —el nombre del archivo, la cabecera de la ficha y el
> índice de abajo— y es a propósito: el nombre lo hace visible al listar la carpeta sin abrir nada.
> El coste es que **cerrar una duda son cuatro pasos**: renombrar, cambiar la cabecera, actualizar el
> índice y repuntar los enlaces de los documentos que la citaban.

## Para qué sirve esta carpeta

Separa tres cosas que se confunden con facilidad:

| | Dónde vive | Qué es |
|---|---|---|
| **Una duda** | `docs_work/dudas/` | Falta información para poder decidir |
| **Una decisión** | [`docs_solutions/docs_design/adr/`](../../docs_solutions/docs_design/adr/README_ADR.md) | Ya se decidió; queda registrado el porqué |
| **Una tarea** | [`retomar_trabajos.md`](../retomar_trabajos.md) | Se sabe qué hacer; falta hacerlo |

El recorrido habitual es **duda → decisión → tarea**. Cuando una duda se resuelve y da lugar a un
cambio de diseño, se crea el ADR correspondiente y se enlaza desde la duda.

## Índice

| # | Duda | Estado | Bloquea |
|---|------|--------|---------|
| [0001](0001-RESUELTA-tres-libros-destino-de-los-volcados.md) | Los volcados van a tres libros distintos | 🟢 **Resuelta** → [ADR-0016](../../docs_solutions/docs_design/adr/0016-un-unico-libro-de-vinculacion.md) | — · migración **pendiente de ejecutar** |
| [0002](0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md) | Con qué signo llegan de SAGE el seguro médico y COBEE | 🟢 **Resuelta** → [ADR-0015](../../docs_solutions/docs_design/adr/0015-eliminar-calculo-salario-base-del-script-sage.md) | — · el signo de los importes en Vinculación **sigue sin respuesta**, dentro de la propia ficha |
| [0003](0003-momentos-de-copia-y-pega-del-proceso.md) | Los momentos de copia y pega del proceso | 🔴 Abierta | Convertirlos en pasos semiautomáticos · saber cuándo entró cada dato |
| [0004](0004-formato-de-las-tres-fuentes-de-contraste.md) | El formato de las tres fuentes de contraste | 🔴 Abierta | Construir el contraste de ADESLAS, COBEE y banco |
| [0005](0005-identificar-a-la-persona-en-el-fichero-del-banco.md) | Cómo identificar a la persona en el fichero del banco | 🔴 Abierta | El contraste bancario · crear `VAP_BBDD_Personal` |
| [0006](0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) | Qué contienen hoy las columnas de contraste de Vinculación | 🔴 Abierta | Contra qué comparar los importes, y en qué pestaña |

> **0004, 0005 y 0006 se leen juntas.** Salen de la misma sesión: al recibir los tres ficheros de
> contraste y abrir Vinculación, aparecieron tres preguntas de naturaleza distinta —**el formato**
> de lo que llega, **el riesgo** de guardar la correspondencia con el banco, y **qué hay hoy** en las
> columnas contra las que habría que comparar—. Son el material de entrada del sprint de contraste
> en [`retomar_trabajos.md`](../retomar_trabajos.md).

## Deuda técnica

**[`deuda-tecnica.md`](deuda-tecnica.md)** — inventario de lo detectado revisando el código y los
datos: **20 entradas** clasificadas por prioridad y esfuerzo. Nada de ello impide que el sistema
funcione hoy; son cosas que **funcionan por casualidad, que se romperán al crecer, o que nadie sabe
explicar**.

Vive aquí y no entre los requisitos porque comparte naturaleza con las dudas: son **hallazgos**, no
trabajo planificado. Cuando se decide abordar una, pasa a
[`retomar_trabajos.md`](../retomar_trabajos.md) como objetivo de un sprint.

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
