# ADR-0015: Eliminar el cálculo del salario base del script SAGE

- **Estado:** Aceptada
- **Fecha:** 2026-09-07
- **Decisores:** [Reunión 10](../../../docs_work/reuniones/070926_10_revision_vap.md) — 7 septiembre 2026
- **Equivalencia:** —
- **Requisitos:** RF-21 *(afectado: ver nota en el índice)*, RF-22, RNF-02

## Contexto

`VAP_script_export_SAGE.gs` tenía tres acciones en su menú `VAP_Acciones`. La primera,
**Calculo Salario Base**, reconstruía el bruto antes de descuentos con esta fórmula:

```
salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|
```

y escribía el resultado en la **columna S** del origen (`bbdd_export_sage_laboral`). De ahí lo leían
*Export Neto* y *Export Bruto* para llevarlo a `L · Salario Base` de los dos libros de Vinculación, y
desde ellos llegaba a *Gastos de Personal*, que es donde se calcula la nómina.

Al revisarlo aparecen dos hechos, y cualquiera de los dos basta para retirar la acción:

1. **El dato ya venía de origen.** SAGE trae el salario base en la **columna M**. El script estaba
   calculando algo que el sistema de nóminas ya proporcionaba.
2. **La fórmula no era correcta.**

A ello se suman dos problemas de diseño de la propia acción:

- **Escribía por posición fija.** `RESULT_COL = 19` (columna S), cabecera incluida. Contradice a
  [ADR-0010](0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md), que estableció localizar las
  columnas de origen **por nombre de cabecera y no por índice**. Y como sobrescribía sin mirar, lo
  que el export de SAGE trajera en esa columna se destruía en cada ejecución.
- **Imponía un orden de ejecución que nadie garantizaba.** El paso 3 tenía que ir antes del 4 y el 5;
  [FLUJO §6](../../../docs_work/flujo_doc/FLUJO.md) ya recogía que hay bastantes más ejecuciones de los export
  que del cálculo, con lo que algunos meses volcaron el salario base del mes anterior.

El `Math.abs()` de la fórmula tenía además una cuestión abierta desde agosto:
[DUDA-0002](../../../docs_work/dudas/0002-RESUELTA-signo-de-seguro-medico-y-cobee-en-sage.md).

## Decisión

**El Sistema VAP deja de calcular el salario base.** Se elimina la acción *Calculo Salario Base* y
todo lo que solo ella usaba; el menú pasa de tres acciones a dos. La columna S deja de generarse.

El salario base se toma de la **columna M** del origen, que ya lo trae, repuntando a su cabecera la
entrada correspondiente de `VINC_FIELDS`. El volcado a `L · Salario Base` sigue existiendo: lo que
cambia es de dónde sale el dato, no a dónde va.

El criterio de fondo: **componer conceptos salariales es cosa de nóminas, no del VAP.** Este sistema
transporta y —cuando llegue la Fase 3.B–3.D— verifica; no calcula la nómina.

> **[ADR-0010](0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md) no se toca.** Sigue vigente y
> hay que respetarlo mientras no se decida lo contrario: script único con menú propio, y columnas de
> origen localizadas **por nombre de cabecera**. Esta decisión **no lo supera ni lo matiza** — al
> revés, retira la única escritura del script que lo contradecía. Por eso el salario base pasa a
> leerse de la cabecera de la columna M y no de la letra `M`: la letra es de dónde está hoy, el
> nombre es lo que el script debe buscar.

## Consecuencias

**Positivas**

- Deja de haber dos salarios base compitiendo, uno bueno y uno calculado, y de llegar el incorrecto
  a nómina.
- Desaparece la restricción de orden del proceso mensual: ese tramo pasa de tres pasos a dos.
- Desaparece el `Math.abs()`, y con él la mitad de la DUDA-0002 que dependía del cálculo.
- El script recupera la coherencia con [ADR-0010](0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md):
  ya no queda ninguna escritura por posición fija en el origen.

**Negativas y puntos de vigilancia**

- **`VINC_FIELDS` hay que repuntarlo en el mismo cambio.** Su entrada apunta hoy a la cabecera
  `salario_base_bruto`, que era la que escribía la acción eliminada. Si se borra la acción sin
  repuntarla, `volcarVinculacion_` lanza un error al no encontrarla y **Export Neto y Export Bruto
  abortan sin escribir nada** — no se saltan el campo, se caen enteros.
- **Lo ya volcado no se corrige solo.** El salario base que ha llegado a los libros de Vinculación y
  a *Gastos de Personal* hasta esta fecha es el calculado. Si se revisan meses cerrados y con qué
  alcance está **sin decidir**.
- **La columna S del origen queda muerta**, con la cabecera y los valores de la última ejecución.
  Hay que vaciarla a mano para que nadie la lea como buena; no es un cambio de código.
- **Aparece una dependencia nueva sobre la cabecera de la columna M.** Si SAGE la renombra, el
  volcado se cae — el mismo riesgo que [ADR-0010](0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md)
  ya asumía para el resto de campos.

## Alternativas descartadas

- **Corregir la fórmula.** No procede: aunque quedara bien, seguiría calculando un dato que el origen
  ya trae. Dos fuentes para el mismo número es el problema, no la fórmula.
- **Mantener el cálculo como verificación** —calcular y comparar con lo que trae SAGE, avisando si no
  cuadran— tiene valor, pero es **funcionalidad nueva de verificación**, no lo que la acción hacía.
  Encaja en [RF-31…RF-35](../../../docs_discovery/requisitos_funcionales.md), no en esta decisión.
- **Dejar la acción y no usarla.** Un menú con una opción que no debe pulsarse es una trampa: tarde o
  temprano alguien la pulsa y vuelve a pisar la columna S.
