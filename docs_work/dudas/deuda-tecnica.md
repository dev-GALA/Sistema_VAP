# Deuda técnica — Sistema VAP

Inventario de lo detectado revisando el código y los datos reales. **Nada de esto impide que el
sistema funcione hoy**: son cosas que funcionan por casualidad, que se romperán al crecer, o que
nadie sabe explicar.

| | |
|---|---|
| **Última revisión** | 17 agosto 2026 |
| **Alcance** | Los 8 archivos JavaScript del repositorio y los 4 Spreadsheets accesibles |
| **Verificado con** | `node --check` + lectura de los Sheets reales |

**Prioridad:** 🔴 alta (puede dar un resultado incorrecto) · 🟡 media (se romperá al crecer o al
cambiar algo) · 🟢 baja (higiene)

---

## Resumen

| # | Deuda | Prioridad | Esfuerzo |
|---|-------|-----------|----------|
| [DT-01](#dt-01--tonumber_-corrompe-decimales-con-punto) | `toNumber_` corrompe decimales con punto | 🔴 | Bajo |
| [DT-02](#dt-02--escritura-celda-a-celda-en-export-netobruto) | Escritura celda a celda en Export Neto/Bruto | 🟡 | Medio |
| [DT-03](#dt-03--tres-parsers-de-número-distintos) | Tres parsers de número distintos | 🟡 | Bajo |
| [DT-04](#dt-04--el-mapeo-de-destino-va-por-posición-fija) | El mapeo de destino va por posición fija | 🟡 | Medio |
| [DT-05](#dt-05--consulta_url-hardcodeada-en-los-emails) | `CONSULTA_URL` hardcodeada en los emails | 🟡 | Bajo |
| [DT-06](#dt-06--vinculo_columnas-duplica-el-mapeo-del-código) | `vinculo_columnas` duplica el mapeo del código | 🟢 | Bajo |
| [DT-07](#dt-07--cabeceras-de-personal-inconsistentes) | Cabeceras de personal inconsistentes | 🟢 | Bajo |
| [DT-08](#dt-08--taller-vs-mecánico-en-el-histórico-de-profesores) | `TALLER` vs `MECÁNICO` en el histórico | 🔴 | Bajo |
| [DT-09](#dt-09--prueba_data-activo-en-producción) | `PRUEBA_DATA` activo en producción | 🟡 | Trivial |
| [DT-10](#dt-10--responsables-que-no-cuadran) | Responsables que no cuadran | 🟡 | Bajo |
| [DT-11](#dt-11--tipología_profesor-sin-significado-conocido) | `Tipología_Profesor` sin significado conocido | 🟡 | Bajo |
| [DT-12](#dt-12--el-repositorio-y-gas-se-sincronizan-a-mano) | El repositorio y GAS se sincronizan a mano | 🟡 | Alto |
| [DT-13](#dt-13--vap_submitbatch-sin-lockservice) | `vap_submitBatch` sin `LockService` | 🟢 | Bajo |
| [DT-14](#dt-14--log_-escribe-por-posición-en-el-backend-de-complementos) | `log_()` escribe por posición | 🟢 | Bajo |
| [DT-15](#dt-15--el-backend-de-complementos-no-tiene-extensión) | El backend de complementos no tiene extensión | 🟢 | Trivial |
| [DT-16](#dt-16--falta-el-mapa-del-flujo-de-datos-y-usuarios) | ~~Falta el mapa del flujo de datos y usuarios~~ **v0.1 en `FLUJO.md`** | 🟢 | — |
| [DT-17](#dt-17--no-hay-tests-ni-linter) | No hay tests ni linter | 🟡 | Medio |
| [DT-18](#dt-18--funciones-que-hacen-demasiadas-cosas) | Funciones que hacen demasiadas cosas | 🟡 | Medio |
| [DT-19](#dt-19--el-mismo-código-copiado-en-varios-scripts) | El mismo código copiado en varios scripts | 🟡 | Medio |
| [DT-20](#dt-20--el-id-del-libro-destino-está-escrito-en-dos-scripts) | El ID del libro destino está escrito en dos scripts | 🔴 | Trivial |

---

## Corrección funcional

### DT-01 · `toNumber_` corrompe decimales con punto

**Dónde:** `docs_solutions/src/scripts_generales/VAP_script_export_SAGE.js`

```js
const normalized = s.replace(/\./g, '').replace(',', '.');
```

Elimina **todos** los puntos antes de convertir, así que `"1234.56"` se interpreta como `123456`.
Alimenta `valuesEqual_`, que decide si una celda ha cambiado: una comparación errónea provoca
escrituras espurias o cambios que no se detectan.

**Alcance real:** solo afecta a celdas con **formato texto** — las numéricas salen antes por el
`typeof`. Por eso no ha dado la cara.

**Agravante:** en el mismo archivo convive `aNumero_`, que sí distingue el separador de miles del
decimal. Dos funciones para lo mismo, con semánticas distintas.

**Arreglo:** unificar en `aNumero_` y eliminar `toNumber_`.

---

### DT-08 · `TALLER` vs `MECÁNICO` en el histórico de profesores

**Dónde:** hoja `Hoja 1` del libro de respuestas de `REGISTRO DE ACTIVIDAD DE PROFESORES 26`

El histórico conserva las cabeceras del **formulario anterior** (`HORA EXTRA TALLER`,
`SÁBADOS TALLER`) mientras el formulario actual dice `HORA EXTRA MECÁNICO`, `SÁBADOS MECÁNICOS`.
Las copias que añade el volcado se escriben **por posición**, así que van a esas columnas.

**Riesgo:** si no son el mismo concepto renombrado, el histórico estaría mezclando dos cosas
distintas en la misma columna, y cualquier análisis posterior sería erróneo.

**Arreglo:** confirmar con el negocio. Si son lo mismo, renombrar la cabecera del histórico. Si no,
separar las columnas.

---

### DT-16 · Falta el mapa del flujo de datos y usuarios

> 🟢 **Resuelto en v0.1 — 17 agosto 2026.** Creado [`docs_work/FLUJO.md`](../flujo_doc/FLUJO.md) con 9 diagramas
> Mermaid y el recorrido completo del proceso. **Quedan 8 zonas oscuras señaladas** en su §9, y el
> calendario del mes (§10) es todavía una inferencia. Se mantiene esta ficha hasta que el documento
> esté revisado y sin zonas oscuras.

**No existía ningún documento que describa el recorrido completo del dato**, desde que alguien lo
reporta hasta que se calcula la nómina. La información está repartida entre el SSD, los ADR, el
`problem.md` y varios Sheets, y **nadie puede ver el conjunto de una vez**.

Es la deuda con más impacto de esta lista: sin ese mapa, cada decisión sobre el sistema se toma
mirando una pieza aislada. [DUDA-0001](0001-RESUELTA-tres-libros-destino-de-los-volcados.md) —tres libros
destino y nadie sabe cuál alimenta el cálculo— es exactamente el tipo de problema que un mapa
habría hecho evidente hace meses.

**Lo que hacía falta: un documento textual y gráfico** que recorra el proceso **del momento cero al
cálculo final de nóminas**, cubriendo a la vez:

- **El flujo de datos** — qué dato nace dónde, por qué manos pasa, en qué hoja aterriza y con qué
  transformación en cada salto. Incluyendo los tramos manuales: el Excel que el Gestor de nóminas
  pega en `bbdd_export_sage_laboral`, y el retorno de `PRODUCTIVIDAD`.
- **El flujo de usuarios** — quién hace qué y en qué momento del mes: secretarias, responsables de
  complemento, Gestor de nóminas, Gerente y Responsable de Administración.
- **Los puntos de control** — dónde se verifica hoy y dónde no se verifica nada.
- **Las fronteras del sistema** — qué entra en el Sistema VAP y qué queda fuera (el ajuste final, el
  cálculo en SAGE, la transferencia bancaria).

**Formato sugerido:** un `docs_work/FLUJO.md` con el recorrido explicado en texto más uno o varios
diagramas. Sirve Mermaid, que se renderiza en GitHub y se versiona como texto plano — a diferencia
de una imagen, se puede revisar en un diff.

**Por dónde empezar:** el flujo de las secretarias, que es el único que conocemos de punta a punta.
El de profesores y el tramo final de nóminas tienen huecos que habrá que resolver antes.

---

## Robustez

### DT-02 · Escritura celda a celda en Export Neto/Bruto

**Dónde:** `VAP_script_export_SAGE.js`, dentro de `volcarVinculacion_`

```js
tgtSheet.getRange(destRowNum, f.dstCol).setValue(after);
```

Un `setValue()` por campo dentro de un doble bucle (filas × 8 campos). Con 501 empleados son hasta
**4.008 llamadas individuales** a la API de Sheets en una ejecución. Es el cuello de botella clásico
de Apps Script, y el propio script ya lo anticipa: `clasificarError_` contempla el error
*"Maximum execution time"*.

**Arreglo:** leer el bloque completo, modificarlo en memoria y escribir por rangos. Es el patrón que
ya usan los volcados de horas extras y profesores tras el rediseño.

---

### DT-04 · El mapeo de destino va por posición fija

**Dónde:** `VINC_FIELDS` en `VAP_script_export_SAGE.js`

Las cabeceras del **origen** se localizan por nombre (robusto ante reordenaciones), pero el
**destino** usa números de columna fijos (`G=7, H=8, I=9, L=12, P=16, Q=17, R=18, T=20`). Insertar
una columna en la hoja de Vinculación desplaza todo y el volcado escribe en el sitio equivocado
**sin dar ningún error**.

Lo mismo aplica a los volcados de horas extras (`AE`, `AH`) y actividad (`AC..CN`).

**Arreglo:** localizar también el destino por cabecera. La cabecera real está en la **fila 6**, no en
la 1, lo que complica un poco la implementación.

---

### DT-05 · `CONSULTA_URL` hardcodeada en los emails

**Dónde:** `sendNotificationEmail_`, en el backend de complementos

La URL del botón *"Ver mis últimos envíos"* de los emails de confirmación es una constante fija. Si
se re-despliega la webapp creando una implementación **nueva**, la URL cambia y el botón deja de
funcionar para todos los emails futuros.

El template `Portal` no tiene este problema: resuelve su URL en caliente con
`ScriptApp.getService().getUrl()`.

**Arreglo:** usar el mismo mecanismo. Mientras tanto, re-desplegar siempre **editando** la
implementación existente.

---

### DT-17 · No hay tests ni linter

La única verificación automática disponible es de sintaxis:

```bash
find . -name "*.js" -not -path "./.git/*" -print0 | while IFS= read -r -d '' f; do
  node --check "$f" && echo "OK  $f"
done
```

Nada comprueba la **lógica**: ni la acumulación campo a campo, ni el filtrado por periodo, ni el
cálculo del salario base. Cada cambio se valida ejecutándolo contra datos reales de producción.

### DT-18 · Funciones que hacen demasiadas cosas

Contra el principio de **responsabilidad única** ([CLAUDE.md](../../CLAUDE.md)). Las funciones más
largas del sistema:

| Función | Líneas | Cuántas cosas hace |
|---------|--------|--------------------|
| `volcarVinculacion_` | 185 | Lee origen, cruza, compara, escribe destino y escribe log |
| `vap_generarExcelMensual` | 165 | Consulta, fusiona, da formato, crea el archivo y lo guarda |
| `vap_submitBatch` | 155 | **Cinco**: valida, escribe datos, escribe log, escribe errores y envía correo |
| `ejecutarVolcado_` | 149 | Escribe destino, copia al histórico y registra |
| `analizarVolcado_` | 134 | Lee, filtra por periodo, cruza y compone el informe |

**Por qué importa aquí y no es una cuestión de estilo:** ninguna de estas funciones se puede probar
por partes. Para comprobar que el cruce por nombre funciona hay que ejecutar el volcado entero contra
datos reales — que es exactamente lo que dice [DT-17](#dt-17--no-hay-tests-ni-linter) que no se puede
hacer. Las dos deudas se sostienen la una a la otra: **no hay tests porque no hay nada del tamaño de
un test**.

`vap_submitBatch` es el caso más claro: si mañana falla el envío del correo, el fallo vive en la
misma función que decide si el dato se guarda.

### DT-19 · El mismo código copiado en varios scripts

| Función | En cuántos scripts |
|---------|--------------------|
| `normalizeKey` | **3** |
| `contarCeldasOcupadasDestino_` | 2 |
| `escribirLog_` | 2 |
| `formatearFecha_` | 2 |

Los dos volcados son **gemelos por decisión** ([ADR-0008](../../docs_solutions/docs_design/adr/0008-reutilizar-patron-de-sincronizacion.md)):
reutilizar el patrón fue deliberado y acertado. Lo que no se decidió es que la reutilización fuera
**copiando el código**.

La consecuencia se ve en lo ya ocurrido: `contarCeldasOcupadasDestino_` está en los dos volcados de
actividad y **no en los export**, que es justamente el agujero que hay que tapar. Con una función
copiada, una corrección se aplica donde uno se acuerda.

> Apps Script permite **bibliotecas compartidas**. Es la vía natural, y su coste es que crea una
> dependencia entre proyectos que hay que versionar con cuidado. Decisión pendiente, y merece un ADR.

### DT-20 · El ID del libro destino está escrito en dos scripts

`TARGET_SPREADSHEET_ID` con el mismo valor aparece en el volcado de horas extras **y** en el de
actividad. Cambiar de libro destino exige **acordarse de tocar los dos**.

Es trivial de arreglar y está marcado en rojo por una razón: es el mecanismo concreto por el que
[DUDA-0001](0001-RESUELTA-tres-libros-destino-de-los-volcados.md) se vuelve peligrosa. Si al resolverla hay
que reapuntar los volcados y solo se cambia uno, **la mitad de la actividad de la plantilla acaba en
un libro y la otra mitad en otro** — y ningún aviso lo delata, porque los dos escriben sin error.

**Contra el principio de inversión de dependencias:** lo que puede cambiar debe estar en un solo
sitio del que dependan los demás, no repetido en cada consumidor.

**Dificultad:** el código depende de `SpreadsheetApp`, que no existe fuera de Apps Script. Habría que
separar la lógica pura (normalización, acumulación, comparación) de la que toca Sheets, y probar solo
la primera. Es viable, pero es un rediseño.

---

## Consistencia de los datos

### DT-07 · Cabeceras de personal inconsistentes

**Dónde:** `VAP_BBDD_Personas`

- **`VAP_Responsables`** tiene la cabecera **`"Nombre "` con un espacio final**. Hoy no rompe nada
  porque el backend la lee con `readTable_`, que aplica `trim()`. Cualquier código nuevo que use
  `headers.indexOf("Nombre")` sin `trim` **fallaría en silencio**.
- **`VAP_Secretarias`** usa `Fecha Alta` / `Fecha Baja` (con espacio) y **`VAP_Profesores`** usa
  `Fecha_Alta` / `Fecha_Baja` (con guion bajo), para la misma columna.

**Arreglo:** normalizar las cabeceras. Ninguna de las dos de fecha se usa hoy en código, así que el
cambio es seguro; la de `"Nombre "` hay que hacerla comprobando que nada la lea sin `trim`.

---

### DT-09 · `PRUEBA_DATA` activo en producción

**Dónde:** `VAP_Complementos_Secretarias`, concepto `CON_SECR_07`

Marcado como `Activo = TRUE`, lo que significa que **se ofrece como concepto reportable** a quien lo
tenga asignado. Nunca se ha usado en los 1.724 registros acumulados.

**Arreglo:** ponerlo a `FALSE`, o eliminarlo si no hace falta.

---

### DT-10 · Responsables que no cuadran

**Dónde:** `VAP_Responsables` y `VAP_Responsables_Complementos`

Tres cifras que no coinciden: **6 responsables** mencionados, **5** dados de alta en la BBDD, y solo
**4** han reportado alguna vez.

Además, el responsable `5` **no tiene ningún concepto asignado**: si intentara entrar en la webapp,
sería rechazado con *"Manager válido, pero sin conceptos activos asignados"*.

**Arreglo:** revisar el alta de responsables y sus asignaciones.

---

### DT-11 · `Tipología_Profesor` sin significado conocido

**Dónde:** `VAP_Profesores`, columna E

Solo toma dos valores: **`1`** (122 profesores) y **`2`** (171). No está documentado en ninguna parte
qué distingue una tipología de otra, y **ningún script la usa**.

**Riesgo:** si condiciona la retribución, es un dato relevante para el cálculo que hoy nadie está
teniendo en cuenta.

**Arreglo:** documentar su significado. Si no lo tiene, eliminarla.

---

### DT-06 · `vinculo_columnas` duplica el mapeo del código

**Dónde:** pestaña `vinculo_columnas` de `VAP_Export_Sage`

Contiene el mapeo origen→destino de los 8 campos y **coincide exactamente** con el `VINC_FIELDS` del
script — cotejado campo por campo. Está bien mantenida, pero **el script no la lee**: es una copia
manual que puede divergir sin que nadie se entere.

**Arreglo:** o el script lee esa hoja como fuente de verdad del mapeo (lo que además resolvería
DT-04), o se marca claramente como documentación de apoyo, no normativa.

---

## Higiene

### DT-03 · Tres parsers de número distintos

Entre los scripts hay **tres funciones** que convierten texto a número, cada una con reglas propias:

| Función | Dónde | Comportamiento |
|---------|-------|----------------|
| `aNumero_` | `VAP_script_export_SAGE.js` | Distingue miles de decimales. **Correcta** |
| `toNumber_` | `VAP_script_export_SAGE.js` | Elimina todos los puntos. **Incorrecta** (DT-01) |
| `parseNumber_` | Backend de complementos | Decide por la posición del último separador. Correcta |

**Arreglo:** quedarse con una y usarla en todas partes. Al no haber módulos en Apps Script, habría
que replicarla en cada proyecto o publicarla como biblioteca.

---

### DT-13 · `vap_submitBatch` sin `LockService`

**Dónde:** backend de complementos

Escribe en `Data` calculando `getLastRow() + 1`. Dos responsables enviando a la vez podrían competir
por la misma fila. El resto de volcados del sistema sí usan `LockService`.

**Riesgo real bajo:** 4 responsables activos y envíos esporádicos. Pero es una inconsistencia con el
patrón del resto del sistema.

---

### DT-14 · `log_()` escribe por posición en el backend de complementos

Mientras `vap_submitBatch` construye sus filas con `buildRowByHeaders_` (robusto ante reordenación),
la función `log_()` hace un `appendRow` con 8 valores posicionales. Si alguien reordena las columnas
de `Logs`, esa función escribe mal y las otras no.

---

### DT-15 · El backend de complementos no tiene extensión

**Dónde:** `docs_solutions/src/VAP_script_secretarias/VAP_Complementos Secretarias/VAP_Export_Complementos_Mensuales_Secretarias`

1.133 líneas de JavaScript **sin extensión `.js`**: sin resaltado de sintaxis, sin `node --check`,
sin lint. Es el archivo más grande del repositorio y el único que no se puede verificar.

**Arreglo:** `git mv` añadiendo `.js`. No afecta a producción — en GAS el archivo se llama `Code.gs`
igualmente.

---

## Proceso

### DT-12 · El repositorio y GAS se sincronizan a mano

No hay `clasp` ni CI: el código se **copia y pega** entre este repositorio y los proyectos de Apps
Script. Nada garantiza que lo que hay aquí sea lo que está corriendo en producción.

Con 6 proyectos GAS y archivos que ahora van en pareja (script + plantilla HTML), la probabilidad de
que algo divergja crece.

**Arreglo:** evaluar `clasp`. Coste alto (configuración, autenticación, cambio de hábitos) pero
elimina toda una clase de problemas.

---

## Cómo usar este documento

- **Al detectar algo nuevo**, añadir una entrada `DT-NN` y su fila en el resumen.
- **Al resolver una**, tacharla e indicar en qué versión o ADR se corrigió, en lugar de borrarla:
  saber qué se arregló y cuándo tiene valor.
- Las entradas que necesiten una **respuesta del negocio** antes de poder actuar (DT-08, DT-10,
  DT-11) pueden acabar convertidas en una ficha propia de [`dudas/`](README_dudas.md).
