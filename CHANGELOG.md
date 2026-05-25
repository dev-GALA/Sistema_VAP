# Changelog

Todos los cambios relevantes de **Sistema VAP** se documentan en este archivo.

El formato sigue la convención de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Las decisiones de arquitectura que respaldan estos cambios están en [ADR.md](ADR.md).

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
- Mejoras futuras propuestas para el registro de actividad (ver ADR / README): destino con
  una fila por `(profesor, mes)` para histórico mensual, validación explícita de que el mes
  elegido coincide con el año de la marca temporal, y hoja de auditoría de cambios.
