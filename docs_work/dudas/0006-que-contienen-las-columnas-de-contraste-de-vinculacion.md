# DUDA-0006: Qué contienen hoy las columnas de contraste de Vinculación

| | |
|---|---|
| **Estado** | 🔴 Abierta |
| **Detectada** | 7 septiembre 2026 |
| **Bloquea** | Contra qué comparar los importes de ADESLAS, COBEE y banco · en qué pestaña |
| **Quién puede responder** | Responsable de Administración · Gerencia · la propietaria del libro |

---

## El hallazgo

Se ha abierto en **solo lectura** el libro **`VINCULACIÓN GASTOS PERSONAL 2026`**
(`1qK3J…iYo8kc`) para comprobar si el cruce por DNI tiene los dos extremos. **Los tiene**, y además
las tres fuentes ya tienen columna propia.

> **Alcance de la comprobación:** el conector de Drive devuelve una **vista truncada** de un libro de
> 421 KB. Se ha leído **la cabecera completa y unas 20 filas de cada pestaña**, no el libro entero.
> Lo que se afirma sobre **estructura** es firme; lo que se afirma sobre **calidad del dato** es de
> esa muestra y hay que confirmarlo sobre el libro completo.

### La estructura, que es la buena noticia

**La fila de cabecera es la 8**, no la 1. Las siete primeras filas son tablas de parámetros y
tarifas: `% límite 1/2/3`, `Límite 1/2`, porcentajes de SS, y dos filas de precios etiquetadas
`ARRIBA` y `85-15`. **Cualquier script debe anclarse buscando la cabecera `DNI`, nunca asumir que
los datos empiezan arriba.**

El libro va de la columna **A a la CN** (92 columnas), lo que encaja con lo que ya decía
[FLUJO.md §7](../flujo_doc/FLUJO.md) sobre el rango `AC..CN` que reciben los volcados.

| Col | Cabecera | Para qué sirve |
|---|---|---|
| **B** | *(centro)* | Turquía, Tomás, Albufera, Pesados… |
| **C** | *(nombre)* | `APELLIDOS, NOMBRE` — **con acentos**, al contrario que el banco |
| **D** | **`DNI`** | 🎯 **la clave de cruce** |
| **E** | `EMPRESA` | seis empresas del grupo |
| **F** | `Nº EMPLEADO` | |
| **G** | **`ADESLAS`** | 🎯 destino del contraste de ADESLAS |
| **H** | **`COBEE COMIDA`** | 🎯 destino del contraste de COBEE comida |
| **I** | **`COBEE TRANSPORTE`** | 🎯 destino del contraste de COBEE transporte |
| J…S | `% EFECTIVO` … `% IRPF` | cálculo de nómina |
| **T** | `Nomina NETO` | candidata para el contraste del banco |
| **U** | `EFECTIVO` | la otra candidata |
| V…CN | `TOTAL SALARIO` … conceptos de actividad | lo que escriben los volcados |

El `DNI` viene en el **mismo formato** que ADESLAS y COBEE —con letra y con los ceros iniciales—,
así que **el cruce es directo, sin normalizar**. En la muestra leída, el **91%** de las filas traía
un DNI bien formado.

### Y ahora los problemas

**Las tres columnas de destino hoy no contienen importes.** En la muestra, `ADESLAS` (G) tiene
valores como `0`, `1`, `2`, `-56` y `-68` — nada que se parezca a los importes reales del fichero de
ADESLAS, que van en decimales. Y hay filas donde **`COBEE COMIDA` (H) contiene el nombre de una
empresa y `COBEE TRANSPORTE` (I) un número de empleado**: alguien ha metido una segunda empresa y un
segundo número en las columnas de COBEE.

**Antes de contrastar contra esas columnas hay que saber qué se supone que va en ellas.** Ahora
mismo no está claro que se usen como importes, y comparar contra ellas produciría un informe de
diferencias que sería ruido de principio a fin.

> **De paso, esto confirma lo que quedó abierto dentro de
> [DUDA-0002](0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md):** los valores de ADESLAS
> aparecen **en negativo** en Vinculación. La pregunta del signo sigue viva y ahora tiene una
> observación que la respalda.

**Hay varias pestañas con la misma estructura.** Se han detectado **cuatro** en el trozo leído —una
titulada *«GASTOS PERSONAL 2026 (ANTIGUA)»*— con **fechas distintas** en su bloque de parámetros. La
hipótesis es **una pestaña por mes**, pero no está confirmada, y el script tiene que saber **contra
qué pestaña contrasta**.

**El banco no tiene columna de destino.** Habría que decidir si se contrasta contra `Nomina NETO`
(T), contra `EFECTIVO` (U), o contra una columna nueva.

**Detalles menores, pero reales:**

- Un **9% de las filas leídas no tiene DNI**. Esas quedan fuera del cruce y van al informe de
  incidencias — nunca se descartan en silencio.
- La columna `EMPRESA` tiene el valor `DRIVERSS` conviviendo con `DRIVERS`.
- **El libro no es nuestro**: pertenece a otra cuenta de la organización y está compartido. Ni se
  puede dar por supuesto el permiso de escritura, ni conviene: un motivo más para que el contraste
  **solo lea y escriba su informe aparte**.

## Por qué importa

Todo el contraste se apoya en dos supuestos: que existe una clave común y que hay algo con lo que
comparar. **El primero está confirmado** — la columna `DNI` existe y viene en el formato correcto,
así que el cruce técnico es viable.

**El segundo no.** Si las columnas `ADESLAS`, `COBEE COMIDA` y `COBEE TRANSPORTE` no contienen hoy
los importes que el sistema calcula, entonces el contraste no tiene contra qué comparar y hay que
decidir antes **qué es lo que se compara**: o esas columnas pasan a contener importes, o el
contraste apunta a otro sitio.

Es la diferencia entre poder empezar a programar y no poder.

## Preguntas concretas

1. **¿Qué se supone que va en las columnas `ADESLAS`, `COBEE COMIDA` y `COBEE TRANSPORTE`?**
   ¿Importes, marcas, o algo que ha cambiado de uso con el tiempo?
2. **¿Por qué hay una empresa y un número de empleado escritos en las columnas de COBEE** de algunas
   filas? ¿Es un apaño conocido para gente que trabaja en dos empresas?
3. **¿Cuántas pestañas tiene el libro y qué es cada una?** ¿Es una por mes? ¿Qué es la *(ANTIGUA)*?
4. **¿Contra qué pestaña se contrasta** el mes que se está cerrando?
5. **¿Contra qué columna se contrastan las transferencias del banco** — `Nomina NETO`, `EFECTIVO`, o
   una nueva?
6. **¿Por qué aparecen en negativo los importes de ADESLAS?** *(enlaza con
   [DUDA-0002](0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md))*
7. **¿Qué pasa con las filas sin DNI?** ¿Son personas reales, restos, o filas de trabajo?
8. **¿Quién puede dar permiso de escritura sobre el libro**, si algún día hiciera falta?

## Qué hace falta para cerrarla

- [ ] Recorrer el libro completo con la Responsable de Administración, pestaña por pestaña
- [ ] Saber qué significan hoy las tres columnas de contraste
- [ ] Decidir la columna de destino del contraste bancario
- [ ] Confirmar sobre el libro entero el porcentaje de filas con DNI
- [ ] Confirmar que el `DNI` de Vinculación y el de
      [`VAP_BBDD_Personas`](../../CHANGELOG.md) son el mismo dato

---

## Respuesta

> *(pendiente)*

## Decisión y acciones derivadas

> *(pendiente)*
