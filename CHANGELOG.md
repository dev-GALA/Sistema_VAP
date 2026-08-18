# Changelog

Todos los cambios relevantes de **Sistema VAP** se documentan en este archivo.

El formato sigue la convención de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Las decisiones de arquitectura que respaldan estos cambios están en [`docs/adr/`](docs_dev/adr/README_ADR.md);
el diseño del sistema, en [`docs/SSD.md`](docs_dev/SSD.md); las fases, en [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## [2026-08-17]

Retomado el proyecto. Dos frentes: **rediseño del volcado de horas extras de secretarias**
(ya probado y funcionando) y **documentación del problema y del modelo de datos real**.

### Añadido

- **Volcado de Horas Extras bajo demanda** ([ADR-0013](docs_dev/adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)).
  Nueva acción de menú `VAP_Acciones → "Volcar Horas Extras del mes..."` en el Spreadsheet de
  respuestas, para que la Responsable de Administración pueda lanzarlo cuando lo necesite:
  - **Filtrado por periodo**: solo se exportan las respuestas cuyo `MES` (columna C) coincide con el
    mes elegido **y** cuyo año de marca temporal coincide con el del periodo.
  - **Desplegable de mes y año** en un diálogo `HtmlService`, con el **mes en curso preseleccionado**
    según la fecha de ejecución. Se puede elegir otro mes: el cierre suele hacerse a principios del
    mes siguiente.
  - **Informe previo**: cuántas filas coinciden y cuántas no, desglosadas por motivo (otro mes, otro
    año, mes no reconocible). **Nada se escribe hasta confirmar.**
  - **Reenvío como corrección**: si una secretaria aparece varias veces en el periodo, gana el envío
    de **marca temporal más reciente**.
  - **Copia a `Anteriores`** de las filas exportadas, sellada con periodo, fecha y `Run ID`.
- **Nuevo archivo `VAP_index_Dialogo_Volcado_Horas_Extras.html`** (template GAS `DialogoVolcado`):
  el diálogo del volcado. El proyecto GAS pasa a tener dos archivos.
- **Volcado de Actividad de Profesores bajo demanda** ([ADR-0014](docs_dev/adr/0014-volcado-actividad-profesores-por-periodo.md)),
  con el mismo patrón que horas extras y las adaptaciones que exige el caso:
  - **Se conserva íntegra la acumulación campo a campo** de
    [ADR-0009](docs_dev/adr/0009-acumular-respuestas-por-mes-y-anio.md): por cada una de las 64 columnas
    gana la última celda **no vacía**; el vacío no borra lo ya reportado; el `0` sí cuenta. Es lo que
    permite que **varias secretarias reporten partes distintas** del mismo profesor — en el histórico
    hay **122 pares (profesor, mes) con más de un reporte**.
  - **En destino solo se escriben las columnas con valor**; las demás conservan lo que hubiera.
  - **`Hoja 1` del libro de respuestas se adopta como histórico**: ya cumplía esa función con 1.730
    filas de enero a julio de 2026. No se crea pestaña nueva.
  - Antes se reducía cada profesor **al mes más reciente**, sin poder elegir el periodo a volcar.
- **Nuevo archivo `VAP_index_Dialogo_Volcado_Actividad_Profesores.html`** (template GAS
  `DialogoVolcado` de su propio proyecto).
- **Comprobación de destino limpio en ambos volcados.** El proceso parte cada mes de una hoja de
  Vinculación vacía; antes de escribir, los scripts cuentan cuántas celdas del rango destino ya
  tienen dato para las personas del periodo y **avisan en rojo** si no son cero. Detecta el error más
  probable del flujo: ejecutar contra la hoja del mes anterior.
- **Log con el nombre real de cada columna** en el volcado de profesores
  (`HORA TEÓRICA PRESENCIAL B L-V: (vacío) → 12`), leído de la cabecera del formulario. Con 64
  campos, un registro posicional sería ilegible. Incidencias propias: `VARIOS_REPORTES` (profesor con
  más de un reporte, con las sucursales de origen) y `VALOR_SOBRESCRITO` (dos reportes con valores
  distintos para el mismo campo).
- **Hoja de auditoría `LOG Volcado`**, creada automáticamente en el Spreadsheet de respuestas.
  Registra tres categorías: `MOVIMIENTO` (cambios antes→después), `INCIDENCIA` (mes no reconocido,
  fila sin nombre, sin marca temporal, valor no numérico, marca temporal fuera de mes, envíos
  múltiples) y `ERROR` (nombre duplicado en destino, acceso, bloqueo, tiempo excedido), estos
  últimos con tipo y solución sugerida. Extiende a este script el patrón de
  [ADR-0012](docs_dev/adr/0012-auditoria-centralizada-logs-y-errores.md).
- **Bloqueo por ambigüedad**: si una secretaria aparece más de una vez en la hoja de destino, su
  fila **no se escribe** y se registra el error. Antes se escribía a ciegas en la primera
  coincidencia.
- **`docs/problem.md`** — *Problem Statement & Jobs To Be Done*: el problema que resuelve el sistema,
  con independencia de cómo esté construido. Combina los marcos de Ulwick (enunciado del *job* y
  *desired outcomes*) y Klement/Intercom (*job stories*). Incluye el histórico del proceso, los cinco
  roles ejecutores, la distinción entre captura, consolidación y ajuste, restricciones,
  anti-objetivos, supuestos y preguntas abiertas.
- **`CLAUDE.md`** — contexto del proyecto para el trabajo asistido.
- **SSD §6.1.1 y §6.1.2** — catálogo de complementos y estructura de la hoja `Config`.
- **SSD §6.3** — la premisa **"cada mes se parte de una hoja de Vinculación limpia"**, de la que
  depende que los volcados sean correctos y que no estaba escrita en ninguna parte.
- **SSD §7.2** — estructura real del Spreadsheet de respuestas de horas extras, flujo del volcado y
  esquema de la hoja `LOG Volcado`.
- **SSD §7.4** — estructura del formulario de profesores (72 cabeceras), flujo del volcado,
  acumulación campo a campo, comprobación de destino limpio e incidencias propias.
- **SSD §9** — riesgos **R-09 … R-17** procedentes de la revisión del código y de los datos.
- **`docs/FLUJO.md`** — mapa del flujo de datos y usuarios, **del momento cero al cálculo final de
  nóminas**. Nueve diagramas Mermaid y el recorrido explicado: quién reporta qué, dónde aterriza,
  qué script lo consolida y a qué hoja va. Cada nodo va **codificado por color** según lo que se ha
  podido verificar: verde comprobado, amarillo paso manual, discontinuo sin confirmar, rojo sin
  trazabilidad. Deja **8 zonas oscuras señaladas** en su §9, y advierte de que el calendario del mes
  (§10) es todavía una inferencia.
- **`docs/dudas/`** — carpeta para las cuestiones detectadas y **sin resolver**, con plantilla e
  índice. Separa tres cosas que se confunden: una **duda** (falta información para decidir), una
  **decisión** (ya tomada, en `adr/`) y una **tarea** (ya se sabe qué hacer, en el ROADMAP).
- **[DUDA-0001](docs/dudas/0001-tres-libros-destino-de-los-volcados.md)** — los volcados escriben en
  **tres libros distintos**: horas extras y actividad en `1qK3…o8kc`, las nóminas en los libros de
  neto y bruto. Los rangos de columnas **no se solapan** (7-20 frente a 29-92), así que cabrían en
  la misma hoja. No consta cuál de los tres alimenta el cálculo final.
- **[`docs/dudas/deuda-tecnica.md`](docs/dudas/deuda-tecnica.md)** — inventario de **17 entradas**
  detectadas revisando el código y los datos, clasificadas por prioridad y esfuerzo. Nada impide que
  el sistema funcione hoy: son cosas que funcionan por casualidad, que se romperán al crecer, o que
  nadie sabe explicar.

### Cambiado

- **`VAP_Script Volcado Horas Extras Secretarias.js` reescrito.** El trigger `onFormSubmit` deja de
  usarse para el volcado (se conserva la función, desactivada por la constante
  `AUTO_VOLCADO_AL_ENVIAR`). La regla *"último registro por empleada sin mirar el mes"* se sustituye
  por el filtrado por periodo.
- **`VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js` reescrito.** El trigger `onFormSubmit`
  deja de usarse: **si sigue instalado en el proyecto GAS hay que borrarlo**, porque apunta a una
  función que ya no existe. El `COLUMN_MAP` de 64 entradas ahora se **genera** a partir de tres
  constantes en lugar de mantenerse a mano (verificado que produce el mismo mapeo `F..BQ → AC..CN`).
- **Reorganizados los archivos de horas extras** en `VAP_script_secretarias/VAP_Horas_Extras_Secretarias/`,
  agrupando por proyecto GAS igual que `VAP_Complementos Secretarias/`.
- **La hoja de respuestas ya no necesita vaciarse.** Hasta ahora, las respuestas antiguas se movían
  a mano a `Anteriores` para que el volcado no arrastrase datos de meses pasados: era un
  mantenimiento del que dependía la corrección del resultado y que no estaba documentado. El filtro
  por periodo lo hace innecesario, y el histórico se conserva íntegro.
- **SSD verificado contra los Spreadsheets reales** (`VAP_BBDD_Personas` y
  `VAP_Carga_Datos_Mensuales_Complementos_Secretarias`): columnas, catálogo de conceptos, relación
  responsable↔concepto y volúmenes.
- **Riesgo R-04 reformulado**: el volcado de horas extras vuelve a ser manual, pero por decisión de
  diseño y con revisión previa, no por falta de automatización. **R-09 y R-10 cerrados** por los
  ADR-0013 y 0014.
- **ROADMAP reorganizado**, con una **tabla resumen de fases** al principio (estado y avance por
  subfase, 40 de 61 puntos):
  - El volcado y cálculo de nóminas **deja de colgar de la Fase 2** y pasa a ser la **Fase 3,
    transversal**: afecta a todo el personal, incluido el de **sueldo fijo** que no está en ninguno
    de los dos colectivos. En `bbdd_export_sage_laboral` hay **501 empleados** frente a los ~400 que
    gestiona el sistema por complementos.
  - Las **verificaciones** (seguro médico, COBEE y transferencias) se **fusionan en esa Fase 3** como
    3.B, 3.C y 3.D, en lugar de ser una fase aparte. La fase cambia de naturaleza a mitad: 3.A mueve
    datos, 3.B-3.D los comprueban.
  - **Documentación y deuda técnica** pasa a ser la **Fase 4**, con 4.A desgranada en 17 puntos
    agrupados por bloque (el problema, el SSD verificado, decisiones y dudas, el repositorio).
- **Código reorganizado bajo `code_dev/`**, con una carpeta por proyecto de Apps Script. Antes los
  scripts colgaban de la raíz del repositorio.
- **Índices renombrados** a `README_ADR.md` y `README_dudas.md`, para no tener varios `README.md`
  indistinguibles en el editor. Actualizados los enlaces en los 8 documentos que los referenciaban.
- **`docs/problem.md`**: eliminados el **mapa del *job*** (§4.4) y las **fuerzas del progreso** (§6),
  por no aportar valor al caso. Se conserva la distinción **captura / consolidación / ajuste**, que
  delimita el alcance del sistema y de la que dependen el anti-objetivo de §8 y el supuesto S-05.
  Secciones renumeradas y referencias cruzadas corregidas.

### Corregido

- **El mes del formulario se ignoraba.** El formulario de horas extras captura el mes en la columna
  C desde siempre, pero el script no la leía: un envío de un mes podía sobrescribir el de otro. En
  la verificación previa al cambio ya convivían 25 respuestas de `JULIO` con 1 de `JUNIO`.

### Detectado

Inventario completo, con prioridad y esfuerzo, en
**[`docs/dudas/deuda-tecnica.md`](docs/dudas/deuda-tecnica.md)** (17 entradas). Lo más relevante:

**En el código**

- **`toNumber_` del script SAGE corrompe decimales con punto** (`"1234.56"` → `123456`) y alimenta la
  comparación que decide si una celda cambió (DT-01 · R-14). Convive con `aNumero_`, que sí parsea
  bien: dos funciones para lo mismo con semánticas distintas.
- **Export Neto/Bruto escribe celda a celda**: hasta **4.008 llamadas** individuales a la API con 501
  empleados, con riesgo de agotar el tiempo de ejecución (DT-02 · R-15).
- **Tres parsers de número distintos** entre los scripts: `aNumero_`, `toNumber_` y `parseNumber_`
  (DT-03).
- **El mapeo de destino va por posición fija**: insertar una columna en Vinculación desplaza todo y
  el volcado escribe en el sitio equivocado **sin dar error** (DT-04 · R-08).

**En los datos**

- **`TALLER` vs `MECÁNICO`** (DT-08 · R-16): el histórico de profesores conserva las cabeceras del
  formulario anterior (`HORA EXTRA TALLER`) mientras el actual dice `MECÁNICO`. Las copias se añaden
  **por posición**: si no son el mismo concepto renombrado, el histórico mezclaría significados.
- **`PRUEBA_DATA` (`CON_SECR_07`) está activo en producción** y se ofrece como concepto reportable.
  Nunca se ha usado en 1.724 registros (DT-09).
- **El responsable `5` no tiene ningún concepto asignado**: si entrara en la webapp, sería rechazado.
  Solo **4** responsables han reportado alguna vez, de 5 dados de alta y 6 mencionados (DT-10).
- **`Tipología_Profesor` solo toma los valores `1` y `2`**, sin significado documentado y sin uso en
  ningún script. Si condiciona la retribución, es relevante para el cálculo (DT-11).
- **Cabeceras inconsistentes** (DT-07): `VAP_Responsables` tiene `"Nombre "` con un espacio final —
  hoy no rompe nada porque `readTable_` aplica `trim()`, pero cualquier código nuevo sin `trim`
  fallaría en silencio; y `VAP_Secretarias` usa `Fecha Alta` donde `VAP_Profesores` usa `Fecha_Alta`.

**En `VAP_Export_Sage`** *(verificado por primera vez en esta sesión)*

- **501 empleados**, ~100 más que los ~400 que gestiona el sistema VAP: SAGE incluye personal que no
  entra en ninguno de los dos colectivos.
- **El cálculo del salario base es correcto**: 498 de 501 filas cuadran exactamente con la fórmula;
  las 3 restantes no tienen datos en esas columnas.
- **El orden de uso no se está siguiendo**: 9 Export Neto y 7 Export Bruto frente a solo **2 Calculo
  Salario Base** entre mayo y julio, cuando la documentación pide calcular antes de cada export.
- **`vinculo_columnas` duplica el mapeo del código** (DT-06): coincide exactamente con `VINC_FIELDS`,
  pero el script no la lee. Es una copia manual que puede divergir sin que nadie se entere.
- **`PRODUCTIVIDAD` (col. J) no se vuelca a Vinculación** pese a ser donde acaba todo lo que produce
  este sistema. Debe volver a nóminas por otra vía, sin documentar.
- **`Porcentaje_de_jornada` no se usa en ningún cálculo**, con 153 de 501 personas a jornada parcial.

**En el proceso**

- **Los volcados escriben en tres libros distintos** y no consta cuál alimenta el cálculo final
  ([DUDA-0001](docs/dudas/0001-tres-libros-destino-de-los-volcados.md)).
- **La premisa "cada mes se parte de hoja limpia" no la garantiza ningún automatismo** (R-17): los
  volcados comprueban y avisan, pero no lo impiden.
- **El repositorio y los proyectos GAS se sincronizan copiando y pegando a mano** (DT-12 · R-13).
- **No hay tests ni linter** (DT-17): la única verificación automática es de sintaxis.

---

## [2026-06-11]

Reorganización de la documentación y nueva portada/lanzador de complementos de secretarias para GALA Hub.

### Añadido

- **Portal / lanzador de complementos (secretarias)**
  `VAP_script_secretarias/VAP_Complementos Secretarias/VAP_index_Portal_Complementos_Secretarias.html`
  (template GAS `Portal`): **portada alineada con GALA Hub** con dos tarjetas para **elegir**
  Reportar o Consultar, que **enlazan a las webapps existentes** (Reportar → URL base; Consultar →
  `?page=consultas`). No duplica la lógica de las webapps ni las modifica; la URL del webapp se
  inyecta con `ScriptApp.getService().getUrl()` (sin IDs hardcodeados). Es el punto de entrada del
  recurso `rec-004` de GALA Hub; los enlaces directos siguen funcionando por separado.
- **`doGet` del backend**: caso aditivo `?page=portal` que sirve el template `Portal` (las rutas
  `Index` por defecto y `?page=consultas` siguen intactas).
- **Carpeta `docs/`** con la documentación de referencia:
  - **`docs/SSD.md`** — *Software Specification & Design Document*: documento único que cubre
    especificación (antecedentes, objetivos, requisitos) y diseño (arquitectura, recursos,
    modelo de datos, componentes/scripts, flujos, riesgos y glosario).
  - **`docs/adr/`** — decisiones de arquitectura, **una por archivo** (`ADR-0001` … `ADR-0012`,
    equivalentes a las antiguas `DT-01` … `DT-12`), con índice (`README.md`) y plantilla
    (`0000-plantilla.md`).
  - **`docs/ROADMAP.md`** — fases del proyecto y estado de avance, más un backlog de mejoras
    propuestas.

### Cambiado

- **Eliminado `ADR.md`** de la raíz: su contenido se ha repartido entre `docs/SSD.md` (diseño,
  riesgos, glosario), `docs/adr/` (decisiones) y `docs/ROADMAP.md` (fases). El registro de
  trabajo por sesiones del antiguo ADR se consolida en este `CHANGELOG`.
- **`README.md`**: actualizados el árbol del repositorio y todas las referencias para apuntar a
  `docs/` (antes apuntaban a `ADR.md` / `DT-NN`).

---

## [2026-05-25]

Trabajo centrado en la **Fase 2 (Profesores)**: alta del script de sincronización del
formulario de profesores y rediseño del volcado del registro de actividad para que
**acumule** los datos por mes/año en lugar de reemplazarlos.

### Añadido

#### Script de Actualización Automática de Profesores
- **Nuevo script `VAP_scripts_profesores/VAP_Script_Actualizacion_Automatica_Profesores.js`**:
  sincronización del formulario de profesores, gemelo del de secretarias.
  - Rellena la pregunta tipo lista **"SELECCIONE EL PROFESOR"** del formulario con los
    profesores activos (`Alta = TRUE`) de la hoja `VAP_Profesores`, de forma única,
    ordenada y normalizada.
  - Al enviar el formulario (`onFormSubmit`), busca el `ID_Profesor` por nombre y lo
    escribe en la columna `ID_Profesor` de la hoja de respuestas (la crea si no existe).
  - Disparadores: por edición (`onSpreadsheetEditTrigger`), por cambios estructurales
    de filas/hojas (`onSpreadsheetChangeTrigger`) y respaldo horario
    (`actualizarPreguntaProfesores` cada hora).
  - Control de frecuencia mediante `CacheService` (bloqueo de 30 s) para evitar
    sincronizaciones en cascada.
  - Funciones de gestión de triggers: `crearTriggersProduccion`,
    `crearTriggerHorarioRespaldo`, `borrarTriggers` y `verTriggers`.
  - Validación de nombres duplicados: si hay dos profesores activos con el mismo nombre,
    lanza error en lugar de elegir uno al azar.
  - ⚠️ Debe desplegarse en un **proyecto Apps Script independiente** del de secretarias
    (comparten nombres globales como `onFormSubmit` / `FORM_ID` y colisionarían).

#### Registro de Actividad de Profesores
- **Nuevo backup `VAP_scripts_profesores/backup_VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js`**:
  copia de la versión anterior (estrategia "último gana entero") para poder revertir.
- **Funciones auxiliares** en el script de registro de actividad para mayor robustez:
  - `isEmpty(v)`: trata `null`, `undefined`, `''` y espacios como vacío, **pero `0`
    (y `"0"`) se consideran dato válido y sí pisan.
  - `getYear(v)`: extrae el año de la marca temporal admitiendo `Date` o texto; si no se
    puede interpretar, devuelve `''` para no romper la agrupación.

#### Cálculos sobre Exportación SAGE Laboral
- **Nuevo script `scripts_generales/VAP_script_export_SAGE.js`** (Apps Script **enlazado**
  al Spreadsheet que contiene la pestaña `bbdd_export_sage_laboral`): primera pieza de una
  herramienta de cálculos accesible desde un menú propio **"VAP_Acciones"**, diseñada para
  crecer por partes (una acción = una función + un ítem de menú).
  - **Acción "Calculo Salario Base"** (`calcularSalarioBaseBruto`): localiza por **nombre de
    cabecera** las columnas `TOTAL_BRUTO`, `SEGURO_MEDICO` y `COBE`; transforma a positivo
    (valor absoluto) los dos descuentos y los suma al total bruto. Escribe el resultado en
    la columna **S** con cabecera `salario_base_bruto`.
    Fórmula: `salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|`.
    Las filas vacías en las tres columnas no se tocan; el volcado se hace en bloque.
  - **Acción "Envio Datos (futuro)"** (`enviarDatosFuturo`): placeholder; por ahora solo
    avisa de que está en desarrollo.
  - **Funciones auxiliares**: `normalizarCabecera_` (compara cabeceras sin tildes, en
    mayúsculas y sin espacios sobrantes) y `aNumero_` (convierte texto a número admitiendo
    formato es-ES, p. ej. `"1.234,56 €"` → `1234.56`).
  - Las columnas de entrada se localizan **por nombre de cabecera** (robusto ante
    reordenación); solo la columna de resultado (S) es de posición fija.

#### Vinculación de gastos de personal — acciones "Export Neto" y "Export Bruto" (fusión)
- **Fusionados los scripts de volcado de nóminas (neto y bruto) dentro de
  `scripts_generales/VAP_script_export_SAGE.js`** como dos acciones nuevas del menú
  `VAP_Acciones`: **"Export Neto"** y **"Export Bruto"**. Sustituyen a los scripts
  standalone `script-netos*.js` / `script-brutos*.js` (archivados en `backup_old_js/`),
  para mantener **un solo proyecto** en lugar de tres.
  - **Origen**: la pestaña `bbdd_export_sage_laboral` de este mismo libro (antes los
    scripts leían de un `Informe` externo). Clave de cruce: `Empresa` + `Codigo_Empleado`
    (por cabecera) contra `EMPRESA` (col E) + `Nº EMPLEADO` (col F) del destino.
  - **Destinos** (sin cambios): neto → libro de Vinculación `…MPTs`; bruto → `…t04A`;
    ambos con pestaña `Hoja 1` (verificado) y cabecera real en la fila 6.
  - **8 campos mapeados** (verificados contra las hojas reales) origen → destino:
    `SEGURO_MEDICO`→ADESLAS (G), `COBE_Alimentacion`→COBEE COMIDA (H),
    `COBE_Transporte`→COBEE TRANSPORTE (I), `salario_base_bruto`→Salario Base (L),
    `SS_EMP`→SS Empresa (P), `SS_TRABAH`→SS trabajador (Q), `IRPF`→IRPF (R),
    `Líquido_a_percibir`→Nomina NETO (T). Cada botón vuelca los 8 campos a su hoja.
  - **Comportamiento SOBRESCRIBIR** (refresca cada vez), escribiendo solo las celdas que
    cambian (preserva fórmulas/formato del resto). La columna `% IRPF` (S) del destino ya
    no se toca (no tiene origen en el bbdd).
  - **Controles**: duplicados en origen/destino (los de destino bloquean la escritura),
    `NO_ENCONTRADO_DESTINO`, y LOG fila-a-fila `LOG NETOS` / `LOG BRUTOS` (antes→después)
    en cada libro destino.
  - **Función compartida** `volcarVinculacion_(targetId, logName, etiqueta, runId)` con
    dos envoltorios finos `exportNeto()` / `exportBruto()`.

#### Auditoría centralizada (hojas `logs` y `errores`)
- **Nuevo registro de auditoría centralizado** en el libro `VAP_Export_Sage`, vía el
  envoltorio `ejecutarAccion_(nombre, fn)` que envuelve las tres acciones del menú:
  - Hoja **`logs`**: una fila por acción ejecutada — `Timestamp`, `Acción activada`,
    `Resultado` (OK/ERROR), `Registro de acciones`, `Run ID`, `Usuario`, `Duración (s)`.
  - Hoja **`errores`**: una fila por fallo — `Timestamp`, `Acción`, `Tipo de error`,
    `Descripción del error`, `Posible solución`, `Run ID`, `Usuario`. `clasificarError_()`
    deduce el tipo y una solución sugerida.
  - **Correlación por `Run ID`** entre `logs`, `errores` y los `LOG NETOS`/`LOG BRUTOS`.
  - Política ante error: **registrar + relanzar** la excepción.

#### Documentación
- **Nuevo `VAP_scripts_profesores/README.md`**: guía completa del script de registro de
  actividad (qué hace, flujo de datos, lógica de acumulación con ejemplo, instalación
  paso a paso, configuración del trigger, permisos, solución de problemas, validaciones
  internas y detalles técnicos).
- **`README.md`** raíz: reescrito desde un esbozo (`# Sistema_VAP`) a una descripción
  completa del repositorio (estructura, secretarias Fase 1, profesores Fase 2 y notas).
- **`ADR.md`**: añadida la decisión técnica **DT-09** (acumular respuestas por mes/año en
  lugar de reemplazar por la última), la descripción detallada del volcado de actividad
  (columnas origen/destino, lógica de acumulación, funciones auxiliares y triggers) y la
  entrada de la **Sesión 5 — 25/05/26**.
- **`.claude/settings.local.json`**: añadido con la lista de permisos locales de la sesión.
- **Documentación del script SAGE** (`scripts_generales/VAP_script_export_SAGE.js`): entrada
  en este `CHANGELOG`, nueva sección **"Scripts generales"** en `README.md` (con el árbol del
  repositorio actualizado) y, en `ADR.md`, la decisión técnica **DT-10**, la subsección 4.3
  del script y la entrada de la **Sesión 6 — 25/05/26**.
- **Documentación de la fusión neto/bruto + auditoría**: decisiones técnicas **DT-11**
  (fusionar el volcado de nóminas en el script SAGE, origen `bbdd_export_sage_laboral`,
  cruce por cabecera y sobrescritura) y **DT-12** (auditoría centralizada `logs`/`errores`
  correlacionada por `Run ID`) en `ADR.md`; actualización de la subsección 4.3 (acciones,
  mapeo de 8 campos, hojas de log), del árbol del repo en `README.md` y entrada de la
  **Sesión 7 — 25/05/26**.

### Cambiado

#### Script SAGE — menú y columna de resultado
- Eliminado el ítem de menú **"Envio Datos (futuro)"** y su función `enviarDatosFuturo()`:
  su hueco lo cubren las nuevas acciones **Export Neto** / **Export Bruto**.
- Corregida la columna de resultado de **Calculo Salario Base**: `salario_base_bruto` se
  escribe en la columna **S** (no R), y la fórmula suma los **dos** descuentos COBE:
  `= TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|`.

#### Organización del repositorio (nóminas y documentación)
- Movidos a `backup_old_js/` los scripts de volcado de nóminas previos
  (`script_vinculacion_gastos_personal_brutos_old.js`,
  `script_vinculacion_gastos_personal_neto_old.js`) y retirados del repo los
  `script-netos*.js` / `script-brutos*.js`, ya consolidados en el script SAGE.
- Retirado `VAP_scripts_profesores/README.md` (guía del registro de actividad): su
  contenido vive ya en `ADR.md` (subsección 4.3) y en el `README.md` raíz.

#### Registro de Actividad de Profesores — `VAP_scripts_profesores/VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js`
- **Cambio de arquitectura de "último gana entero" a acumulación por
  `(profesor + mes + año)` (DT-09).** Antes, el último envío de un profesor sobrescribía
  la fila completa, borrando los datos de envíos anteriores; ahora los datos se acumulan.
  - **Agrupación**: por `nombre normalizado + mes seleccionado (col C) + año de la marca
    temporal (col A)`. Se añadieron las constantes `SOURCE_TIMESTAMP_COL` (A) y
    `SOURCE_MONTH_COL` (C).
  - **Acumulación columna a columna** (F..BQ → AC..CN): dentro de cada grupo, la última
    celda **no vacía** gana; una celda vacía **no borra** lo anterior; el `0` cuenta como dato.
  - **Reducción por profesor**: se escribe en destino el grupo (mes/año) más reciente
    según la marca temporal, preservando los datos parciales de múltiples envíos.
  - Se mantiene el uso de `LockService` (espera de 30 s) para evitar escrituras concurrentes,
    y la creación de una fila nueva en destino si el profesor no existe.

#### Organización del repositorio (secretarias)
- Renombrados (sin cambios de contenido) los scripts de secretarias para unificar la
  nomenclatura con prefijo `VAP_`:
  - `Script Volcado Horas Extras Secretarias.js` →
    `VAP_Script Volcado Horas Extras Secretarias.js`
  - `Scripts Formulario Horas Extras Secretarias.js` →
    `VAP_Script_Actualizacion_Automatica_Secretarias.js`

### Notas
- Los IDs de spreadsheets, formularios y carpetas de Drive están **hardcodeados** en cada
  script (habitual en Apps Script); tenerlo en cuenta si el repositorio se hace público.
- Mejoras futuras propuestas para el registro de actividad (ver `docs/SSD.md` / `docs/adr/`):
  destino con una fila por `(profesor, mes)` para histórico mensual, validación explícita de
  que el mes elegido coincide con el año de la marca temporal, y hoja de auditoría de cambios.

---

## [2026-03-24]

Sesión centrada en notificaciones, consulta de envíos y horas extras de secretarias.

### Añadido

- Emails de **confirmación** al responsable y **aviso** al gestor al recibir una remesa.
- Webapp de **consulta de envíos** (`VAP_index_Consultas_Envios_Complementos_Secretarias`).
- Vinculación del formulario `EXTRA SECRETARIAS 2026` con `VAP_Secretarias` y actualización del
  script de volcado de horas extras y de la validación de respuestas.

---

## [2026-02-25]

Sesión inicial: análisis del sistema y primera versión de complementos de secretarias.

### Añadido

- Análisis del sistema existente y definición de objetivos.
- Creación de `VAP_BBDD_Personas` y sus hojas internas.
- Webapp de **reporte de complementos** (`VAP_index_Reportar_Complementos_Secretarias`) con
  validación responsable ↔ complemento y gestión de envíos/correcciones por mes/año.
- Backend `VAP_Export_Complementos_Mensuales_Secretarias` (`Code.gs`).
