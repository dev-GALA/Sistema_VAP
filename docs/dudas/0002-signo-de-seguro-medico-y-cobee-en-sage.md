# DUDA-0002: Con qué signo llegan de SAGE el seguro médico y COBEE

| | |
|---|---|
| **Estado** | 🔴 Abierta |
| **Detectada** | 18 agosto 2026 |
| **Bloquea** | Dar por correcta la fórmula del salario base · saber si los importes que llegan a Vinculación tienen el signo que deben |
| **Quién puede responder** | Gestor de nóminas · Responsable de Administración |

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

> *(pendiente)*

## Decisión y acciones derivadas

> *(pendiente — si acaba en un cambio de diseño, crear un ADR y enlazarlo aquí)*
