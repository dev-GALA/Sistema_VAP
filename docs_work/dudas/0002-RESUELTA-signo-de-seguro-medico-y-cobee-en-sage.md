# DUDA-0002: Con qué signo llegan de SAGE el seguro médico y COBEE

| | |
|---|---|
| **Estado** | 🟢 **Resuelta** — 7 septiembre 2026 |
| **Detectada** | 18 agosto 2026 |
| **Resuelta por** | [Reunión 10](../reuniones/070926_10_revision_vap.md) → [ADR-0015](../../docs_solutions/docs_design/adr/0015-eliminar-calculo-salario-base-del-script-sage.md) |
| **Bloqueaba** | Dar por correcta la fórmula del salario base · saber si los importes que llegan a Vinculación tienen el signo que deben |
| **Quién podía responder** | Gestor de nóminas · Responsable de Administración |

> ⚠️ **Se resuelve por eliminación, no por respuesta.** La fórmula del salario base deja de existir,
> así que la pregunta sobre el `Math.abs()` se queda sin objeto. Lo que **no** responde esta ficha es
> con qué signo llegan de SAGE los tres importes que **siguen viajando a Vinculación**. Ver
> *[Lo que esta ficha no resuelve](#lo-que-esta-ficha-no-resuelve)* al final.

---

## El hallazgo

El script `VAP_script_export_SAGE.js` aplica **`Math.abs()`** a los tres conceptos que suma al
`TOTAL_BRUTO` para calcular el salario base:

```js
const total = (vBruto || 0)
            + Math.abs(vSeguro || 0)
            + Math.abs(vCobeTransp || 0)
            + Math.abs(vCobeAlim || 0);
```

La sospecha de quien lo escribió es que **ese `Math.abs()` se puso porque desde SAGE los importes
venían con un signo incorrecto**. No consta en ningún sitio: ni en el código, ni en un ADR, ni en un
comentario.

### Qué hace exactamente el script hoy — 🟩 comprobado en el código

**Acción `Calculo Salario Base`** (`calcularSalarioBaseBruto_`):

| | |
|---|---|
| **Origen** | `bbdd_export_sage_laboral`, en `VAP_Export_Sage` |
| **Columnas que lee** | `TOTAL_BRUTO`, `SEGURO_MEDICO`, `COBE_Transporte`, `COBE_Alimentacion` — localizadas **por nombre** en la fila de cabeceras |
| **Fórmula** | `TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|` |
| **Dónde escribe** | Columna **S** (posición fija), con la cabecera `salario_base_bruto` |
| **Si las cuatro columnas están vacías** | No escribe nada en esa fila |
| **Conversión previa** | `aNumero_()` — quita `€` y espacios, y resuelve coma/punto decimal. **No toca el signo** |

**Consecuencias directas de usar `Math.abs()`:**

1. El resultado es **siempre mayor o igual que `TOTAL_BRUTO`**. Nunca resta.
2. El cálculo es **insensible al signo**: da exactamente lo mismo que en SAGE el seguro médico
   figure como `120` o como `-120`.
3. Por tanto, **si el signo cambiara en origen, el salario base no cambiaría** y nadie se enteraría.

### El detalle que hace la duda más grave — 🟩 comprobado en el código

**Las mismas tres columnas viajan a Vinculación sin `Math.abs()`**, con el signo que traigan:

```js
const VINC_FIELDS = [
  { srcHeader: 'SEGURO_MEDICO',      dstCol: 7,  label: 'ADESLAS' },
  { srcHeader: 'COBE_Alimentacion',  dstCol: 8,  label: 'COBEE COMIDA' },
  { srcHeader: 'COBE_Transporte',    dstCol: 9,  label: 'COBEE TRANSPORTE' },
  { srcHeader: 'salario_base_bruto', dstCol: 12, label: 'Salario Base' },
  ...
];
```

El volcado copia el valor tal cual, sin transformarlo.

**Es decir: el mismo script trata los mismos tres importes de dos maneras distintas.** En la columna
`L` (Salario Base) entran **en valor absoluto**; en las columnas `G`, `H` e `I` entran **con su
signo original**. Si vienen negativos, en la hoja de cálculo conviven un salario base que los ha
sumado en positivo y tres columnas que los muestran en negativo.

## Por qué importa

Los tres conceptos **entran en la fórmula del salario base**, así que su tratamiento se propaga a
todo lo que se calcula después. Y hay dos escenarios con consecuencias opuestas:

- **Si el `Math.abs()` está corrigiendo un signo erróneo de SAGE**, funciona — pero es un **parche
  silencioso**: enmascara un problema del origen en lugar de señalarlo. El día que SAGE se corrija,
  el parche seguirá ahí, ya innecesario, y nadie sabrá que puede quitarse.
- **Si el signo de SAGE es correcto y significa algo** (por ejemplo, que es un descuento), entonces
  el `Math.abs()` está **borrando información**, y el salario base puede estar sumando lo que
  debería restar.

En cualquiera de los dos casos, la combinación de *valor absoluto en `L`* y *signo original en
`G`/`H`/`I`* es **incoherente dentro del mismo volcado**, y quien lea la hoja de Vinculación no
tiene forma de saberlo.

> Esta duda es además la puerta de entrada a otra pregunta abierta: **`ANTICIPO_NOM` y `EMBARGO` no
> entran en la fórmula ni viajan a Vinculación**, pese a que en la revisión mensual se comprueban
> junto al seguro médico y COBEE. Si esos dos sí deben restarse en algún punto, hace falta saber
> antes con qué signo llega cada cosa.

## Preguntas concretas

1. **¿Con qué signo llegan hoy de SAGE** `SEGURO_MEDICO`, `COBE_Transporte` y `COBE_Alimentacion`:
   positivo, negativo, o depende de la fila?
2. **¿Ese signo es el correcto**, o es el error que el `Math.abs()` vino a tapar?
3. **¿Qué representa el importe**: un coste que la empresa suma al bruto, o un descuento que se
   resta? De la respuesta depende si la fórmula debe sumar o restar.
4. **¿Es intencionado** que en Vinculación las columnas `G`, `H` e `I` reciban el signo original
   mientras `L` recibe el valor absoluto?
5. Si el signo de SAGE es incorrecto, **¿puede corregirse en el origen** en lugar de compensarlo en
   el script?

## Qué hace falta para cerrarla

- [ ] Mirar en `bbdd_export_sage_laboral` el signo real de las tres columnas en una exportación
      reciente, y comprobar si es **uniforme** en todas las filas
- [ ] Confirmar con el Gestor de nóminas qué significa ese signo en SAGE
- [ ] Comprobar en la hoja de cálculo (*Gastos de Personal*) si las columnas `ADESLAS`,
      `COBEE COMIDA` y `COBEE TRANSPORTE` se **restan** o se **suman** en la fórmula final
- [ ] Decidir si el `Math.abs()` se mantiene, se sustituye por una regla explícita de signo, o se
      corrige el origen

> El tercer punto es el que cierra el círculo: si en *Gastos de Personal* esas tres columnas se
> restan, queda confirmado que el script las suma **para que allí puedan restarse desglosadas**, y
> el `Math.abs()` pasa de sospechoso a decisión de diseño — que entonces conviene escribir como ADR.

---

## Respuesta

**No se ha averiguado con qué signo llegan.** La duda se cierra porque **desaparece la mitad que la
motivaba**: en la [Reunión 10](../reuniones/070926_10_revision_vap.md) se decidió que el Sistema VAP
deje de calcular el salario base.

Los dos hechos que lo motivan responden, de rebote, a la sospecha que abría esta ficha:

| | |
|---|---|
| **El dato ya venía de origen** | SAGE trae el salario base en la **columna M**. El script calculaba algo que el sistema de nóminas ya daba |
| **La fórmula no era correcta** | Confirmado en la reunión. Con lo que el `Math.abs()` no era un parche que funcionara: formaba parte de un cálculo que no debía hacerse |

Y aclara la pregunta 4 de esta ficha —*¿es intencionado que `G`/`H`/`I` lleven el signo original
mientras `L` lleva el valor absoluto?*— con un **no**: no era una decisión de diseño, era el efecto
de un cálculo que sobraba.

Queda además a la vista algo que la ficha no llegó a plantear: la acción escribía la columna **S**
por posición fija, cabecera incluida, **sobrescribiendo lo que hubiera**. Como el salario base bueno
viene en la M, lo que ha viajado a `L · Salario Base` de los dos libros de Vinculación —y de ahí a
*Gastos de Personal*— ha sido el **valor calculado con la fórmula incorrecta**.

## Decisión y acciones derivadas

**[ADR-0015 · Eliminar el cálculo del salario base del script SAGE](../../docs_solutions/docs_design/adr/0015-eliminar-calculo-salario-base-del-script-sage.md)**

Acciones que se derivan, ninguna hecha todavía:

- [ ] Eliminar del script la acción `Calculo Salario Base` y todo lo que solo ella usa
- [ ] **Repuntar `VINC_FIELDS` a la cabecera de la columna M** — sin esto, Export Neto y Export Bruto
      abortan al no encontrar `salario_base_bruto`
- [ ] Vaciar a mano la columna S de `bbdd_export_sage_laboral`, que queda muerta con datos viejos
- [ ] Actualizar [SSD §7.5](../../docs_solutions/docs_design/SSD.md) y [FLUJO §6](../flujo_doc/FLUJO.md) cuando
      el código esté cambiado, no antes
- [ ] 🔍 **Sin decidir:** si hay que revisar meses ya cerrados, dado lo que ha estado llegando a nómina

> 🔍 **Falta un dato para poder ejecutar la primera acción:** cómo se llama la **cabecera de la
> columna M** en `bbdd_export_sage_laboral`. El script localiza el origen por nombre y no por letra,
> y el inventario de columnas del origen no está escrito en ninguna parte.

---

## Lo que esta ficha no resuelve

Esta duda cubría **dos cosas distintas** que compartían los mismos tres importes. Solo muere una.

| | Qué era | Después de ADR-0015 |
|---|---|---|
| **El cálculo** | `SEGURO_MEDICO`, `COBE_Alimentacion` y `COBE_Transporte` se **sumaban** al bruto en valor absoluto | 🟢 **Desaparece.** Ya no se suman en ningún sitio |
| **El volcado** | Los mismos tres importes se **copian** a `G · ADESLAS`, `H · COBEE COMIDA` e `I · COBEE TRANSPORTE` tal cual llegan | 🔴 **Sigue igual.** Es otra parte del script, y no se toca |

De las cinco preguntas de arriba, tres siguen sin respuesta y **todas afectan al volcado, no al
cálculo**: con qué signo llegan hoy (1), si ese importe representa un coste que suma o un descuento
que resta (3), y si el signo puede corregirse en origen (5).

**Por qué sigue importando.** Si el seguro médico de una persona llega de SAGE como `-120`, ese
`-120` se copia a la columna `G` de Vinculación y de ahí pasa a *Gastos de Personal*. Si allí la
columna ADESLAS **se resta**, esa persona acaba con 120 € descontados dos veces. Si llega como `120`,
no pasa nada. Hoy nadie sabe cuál de las dos cosas ocurre.

Sigue en pie, por tanto, el punto que esta ficha llamaba *"el que cierra el círculo"*: **comprobar en
*Gastos de Personal* si esas tres columnas se suman o se restan**. Es pregunta para el Gestor de
nóminas — el mismo al que hay que preguntarle lo del
[Bloque D del guion anterior](../reuniones/2026-09-07-revision-del-proceso.md).

> Estas tres preguntas se quedan **dentro de una ficha marcada como resuelta**, que es donde nadie
> vuelve a mirar. Si se quiere que sigan a la vista, el sitio es una ficha propia en esta misma
> carpeta.
