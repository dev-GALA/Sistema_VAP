# DUDA-0004: El formato de las tres fuentes de contraste

| | |
|---|---|
| **Estado** | 🔴 Abierta |
| **Detectada** | 7 septiembre 2026 |
| **Bloquea** | Construir el contraste de ADESLAS, COBEE y banco contra Vinculación |
| **Quién puede responder** | Responsable de Administración *(qué se pide y a quién)* · ADESLAS · COBEE · el banco |

---

## El hallazgo

Han llegado los tres documentos de contraste que pedía OB-01: una relación de asegurados de
**ADESLAS**, un informe de consumos de **COBEE** y un listado de transferencias del **banco**. Se
han examinado los tres.

> **Los ficheros no están en este repositorio y no deben estarlo** ([CLAUDE.md, segunda
> regla](../../CLAUDE.md)). Aquí se documenta **el formato**, nunca el contenido. Todas las cifras
> que siguen son recuentos y porcentajes, no datos de personas.

### La conclusión, primero

| Fuente | Identifica a la persona con | ¿Cruza por DNI? |
|--------|------------------------------|-----------------|
| **COBEE** | Columna `DNI` propia | 🟢 **Sí, directo** |
| **ADESLAS** | Columna `NIF`, una fila por asegurado | 🟡 **Sí, tras agrupar** |
| **Banco** | Solo nombre e IBAN | 🔴 **No** — ver [DUDA-0005](0005-identificar-a-la-persona-en-el-fichero-del-banco.md) |

### ADESLAS · una fila por asegurado, no por empleado

El informe (`MCCI0552`, *relación al contratante*) trae **12 líneas de preámbulo** antes de la fila
de cabecera, y un bloque de totales al final. La columna `Delegación` **solo aparece rellena en la
primera fila de cada bloque**: hay que arrastrarla hacia abajo.

Lo importante es que **cada fila es un asegurado, no un empleado**. Un trabajador con familia en su
póliza ocupa varias filas —`TITULAR`, `CONYUGE`, `HIJO/A`, `PAREJA DE HECHO`, `OTROS`— cada una con
su propio NIF y su propio importe. Para contrastar hace falta **fusionar por certificado**.

**La regla de fusión, y por qué no basta con ella.** El número de `Certif.` es el DNI del titular
sin la letra y sin el cero inicial. Revisando el fichero certificado a certificado, la regla se
cumple **en todos menos en dos casos**:

- **Los NIE también pierden la letra inicial**, así que reconstruir el DNI desde el certificado
  falla en ellos.
- **Un certificado no es un DNI: es el número de póliza.** Un alta reciente lo tiene como
  certificado, y el NIF de esa persona no guarda relación con él. Es un dato mal introducido en el
  alta de ADESLAS, no un problema del sistema — pero si el cruce dedujera el DNI del certificado,
  **esa persona se perdería en silencio**.

> **Decisión de diseño que se deriva:** `Certif.` sirve para **agrupar**, no para **identificar**.
> Se agrupa por certificado y el DNI se toma del **`NIF` de la fila cuyo `Parentesco` es
> `TITULAR`**. Así los dos casos de arriba dejan de importar y no hay que reconstruir ninguna letra.
> El `Certif.` queda como **comprobación**: si no casa con el NIF del titular, es una incidencia que
> se reporta, no un fallo del cruce.

Tres detalles más:

- El **`Importe Total Certificado`** ya viene calculado, pero **solo en la última fila del grupo**,
  no en la del titular. Sumar el `Importe Total` de todas las filas del certificado da lo mismo.
- Los **menores sin NIF** existen: varias filas de `HIJO/A` lo traen vacío. No importa, porque el
  DNI se toma del titular — pero descarta cualquier diseño que cruce fila a fila.
- **No todo `TITULAR` es empleado.** Hay familiares con certificado propio, y un mismo apellido
  aparece en varios certificados distintos. Quién es empleado lo decide el cruce contra la BBDD del
  sistema; lo que no case **se reporta, no se descarta**.

**Y una limitación de alcance que puede dejar fuera a la mayoría de la plantilla:** la póliza es de
**una sola empresa** del grupo, mientras que en Vinculación conviven **seis** (ver
[DUDA-0006](0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md)). O hay más pólizas que
no se han pedido, o el contraste de ADESLAS solo puede cubrir a una parte del personal.

### COBEE · la fuente buena, con la exportación rota

Trae **una fila por trabajador** —no hay que fusionar nada— y una **columna `DNI` propia**, en el
mismo formato que usa Vinculación. Es la fuente más sencilla de las tres. Pero el fichero recibido
tiene **dos defectos de exportación**, y ninguno es opinable:

1. **Codificación equivocada.** El contenido es UTF-8 servido como Latin-1: las eñes y los acentos
   llegan rotos, tanto en cabeceras como en nombres. Se arregla forzando el charset al leer, igual
   que ya se hace con el CSV de SAGE.
2. **No tiene saltos de línea.** Todos los registros vienen en **una sola línea**, separados por
   `;;;`, con el último importe de cada registro **pegado al primer campo del siguiente**. Es
   reconstruible, pero programar contra esa forma sería construir sobre un fallo del export.

De las 24 columnas de conceptos, el contraste solo necesita las de **comida** y **transporte**; en
el mes examinado, las de transporte venían todas a cero.

> **Antes de escribir el lector de COBEE hay que pedir el export bien hecho.** Si el defecto es del
> propio panel de COBEE y no hay forma de evitarlo, entonces se documenta y el lector lo compensa —
> pero eso se decide después de preguntar, no antes.

### Banco · incompleto, y sin forma de identificar a nadie

El fichero recibido **no es la remesa**: la cabecera declara **208 pagos**, el detalle trae **10
filas**, y el pie dice literalmente *«solamente se muestran los pagos visibles en la pantalla»*. Es
un volcado de lo que había en pantalla. **Hay que pedir la exportación completa.**

Y trae **cuatro líneas de preámbulo** (ordenante, número de pagos, importe total) antes de la
cabecera.

Lo que no trae es **ninguna forma fiable de identificar a la persona**: solo `Beneficiario` —el
nombre— y el `IBAN`. Y el nombre viene maltratado de tres maneras a la vez:

- **sin eñes ni acentos**, sustituidos por su letra base;
- **con las partículas desplazadas al final** (`APELLIDOS, NOMBRE DE`);
- **truncado a 28 caracteres**, con lo que dos personas de apellidos largos parecidos **pueden
  llegar a colisionar**.

> **Un hallazgo útil:** ese truncado es **el mismo** que aparece en los nombres de COBEE, y afecta a
> las mismas personas por el mismo sitio. Los dos ficheros beben de la misma fuente —SAGE—, que
> recorta el campo de nombre. Eso abre la vía de cruzar el banco contra el export de empleados de
> SAGE, que sí tiene DNI. Es lo que discute [DUDA-0005](0005-identificar-a-la-persona-en-el-fichero-del-banco.md).

### Y los tres no son del mismo mes

Los ficheros de ADESLAS y COBEE corresponden a un mes, y el del banco **al siguiente**. Además, el
informe de ADESLAS de un mes viene **generado a finales del mes anterior**. Antes de contrastar hay
que fijar **qué fichero contrasta con qué mes de nómina**, o el informe de diferencias será ruido.

## Por qué importa

Es la primera vez que el sistema **comprueba** en lugar de transportar, y todo el valor del Sprint
depende de que las tres fuentes se puedan leer sin ambigüedad. Dos de los defectos encontrados
—el fichero del banco incompleto y el export de COBEE sin saltos de línea— **no se arreglan
programando**: se arreglan pidiendo bien el fichero. Programar alrededor de ellos sería consolidar
un error de origen y pagarlo cada mes.

Y el tercero —la fusión de ADESLAS— sí es diseño, y conviene fijarlo por escrito antes de escribir
la primera línea: agrupar por certificado pero **identificar por el NIF del titular** es lo que hace
que dos casos reales del fichero no rompan el cruce.

## Preguntas concretas

1. **¿Puede el banco exportar la remesa completa** —los 208 pagos— y no solo lo visible en pantalla?
2. **¿Puede COBEE exportar con codificación correcta y con saltos de línea?** Si no, ¿es el panel el
   que lo hace mal, o hay otra opción de descarga?
3. **¿Hay más pólizas de ADESLAS** para las otras empresas del grupo, o la póliza cubre solo a una?
4. **¿Qué mes de nómina contrasta con cada fichero?** El informe de ADESLAS lleva su propio
   `Año / Mes`, pero se genera antes de que termine el mes anterior.
5. **¿Con qué periodicidad y por qué vía llega cada uno**, y quién los recibe?
6. **¿Cuánto tiempo deben conservarse** una vez hecho el contraste?

## Qué hace falta para cerrarla

- [ ] Exportación **completa** de la remesa del banco
- [ ] Exportación de COBEE bien codificada y con saltos de línea
- [ ] Saber si hay pólizas de ADESLAS para el resto de empresas del grupo
- [ ] Fijar la correspondencia fichero ↔ mes de nómina
- [ ] Acordar plazo de conservación de los ficheros

---

## Respuesta

> *(pendiente)*

## Decisión y acciones derivadas

> *(pendiente — la regla de fusión de ADESLAS, si se confirma, debería quedar como ADR)*
