# ADR-0016: Un único libro de Vinculación como destino de todos los volcados

- **Estado:** Aceptada — *decidida, pendiente de aplicar*
- **Fecha:** 2026-09-07
- **Decisores:** [Reunión 10](../../../docs_work/reuniones/070926_10_revision_vap.md) — 7 septiembre 2026
- **Equivalencia:** —

## Contexto

Los volcados del sistema no confluían en una sola hoja: escribían en **tres libros distintos**, cada
uno con una pestaña llamada `Hoja 1`, lo que hacía fácil confundirlos leyendo el código. Es el
hallazgo de [DUDA-0001](../../../docs_work/dudas/0001-RESUELTA-tres-libros-destino-de-los-volcados.md).

| Qué se vuelca | Destino hasta hoy |
|---|---|
| Horas extras de secretarias (`AE`, `AH`) | `1qK3…o8kc` |
| Actividad de profesores (`AC..CN`) | `1qK3…o8kc` |
| Nóminas **Neto** (`G,H,I,L,P,Q,R,T`) | `1HDw…MPTs` |
| Nóminas **Bruto** (las mismas 8 columnas) | `1eTV…t04A` |

La ficha ya había observado que **los rangos de columnas no se solapan** —nóminas de la 7 a la 20,
actividad de la 29 a la 92— y que la separación parecía accidental, no de diseño: los datos caben en
la misma hoja cruzando por la misma persona.

## Decisión

**Todos los volcados pasan a escribir en un único libro: `Vinculación gastos personal 2026 completo`.**
`Vinculación … netos` y `Vinculación … brutos` se eliminan.

El mapa de libros queda así:

| | Hoy | Objetivo |
|---|---|---|
| Origen | `export sage laboral` | `export sage laboral` |
| Vinculación | **netos** + **brutos** + `1qK3…o8kc` | **`Vinculación gastos personal 2026 completo`** |
| Cálculo final | `Gastos de Personal 2026` | `Gastos de Personal 2026` |

**`Gastos de Personal 2026` no se vincula a nada.** Es el punto final de almacenamiento de los datos
ya calculados, y el trasvase hasta él **sigue siendo manual** por ahora. Esta decisión no lo cambia.

## Consecuencias

**Positivas**

- Desaparece el reparto en libros que no se comunican, y con él la pregunta de si la actividad de
  ~400 personas llegaba o no al cálculo.
- Un solo destino que auditar, un solo `LOG` que leer, un solo libro al que dar permisos.
- Los cuatro volcados del sistema pasan a compartir destino, que es lo que el diseño de columnas ya
  sugería.

**Negativas y puntos de vigilancia**

- **Es un cambio de una línea por script, y por eso mismo peligroso.** Apuntar al libro equivocado
  manda la actividad de ~400 personas donde no debe, y alguien cobra mal al mes siguiente. Verificar
  antes de cambiar, no después.
- **Los dos libros que se eliminan hay que conservarlos**, al menos hasta cerrar el ejercicio: son el
  histórico de lo ya volcado.
- **Queda una pregunta de diseño abierta.** *Export Neto* y *Export Bruto* vuelcan **los mismos 8
  campos con los mismos valores** a dos libros distintos. Si el destino pasa a ser uno solo, las dos
  acciones escribirían lo mismo en el mismo sitio: o **sobra una**, o la diferencia entre neto y bruto
  está en columnas que el script no toca y hay que dejarla por escrito antes de unificar. Sin
  resolverlo, esta decisión no se puede aplicar del todo.
- El trasvase manual a `Gastos de Personal 2026` **sigue sin dejar rastro** — es el riesgo `R-19` del
  [SSD](../SSD.md#9-riesgos-y-limitaciones), que esta decisión no toca.

## Alternativas descartadas

- **Mantener netos y brutos separados y unificar solo la actividad.** Deja en pie la pregunta de por
  qué son dos libros, que nadie ha sabido responder, y sigue obligando a ejecutar dos volcados.
- **Vincular `Gastos de Personal 2026` al sistema.** Se descarta por ahora: es un archivo de
  almacenamiento final, no una pieza del flujo automatizado. Automatizar el trasvase es otra
  conversación — la que abre [DUDA-0003](../../../docs_work/dudas/0003-momentos-de-copia-y-pega-del-proceso.md).
