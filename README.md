# Sistema VAP — Valoración de Actividad Productiva

Sistema interno de **GALA Formación** para automatizar el cálculo de los salarios mensuales variables de dos colectivos: **secretarias** y **profesores de autoescuelas**.

Está construido sobre **Google Workspace**: Google Sheets como base de datos, Google Apps Script para la lógica y webapps propias para el reporte y la consulta de complementos. La fuente única de verdad del personal es el Google Sheet `VAP_BBDD_Personas`.

> 📐 La documentación de referencia vive en **[`docs/`](docs/)**:
> - **[docs/problem.md](docs/problem.md)** — qué problema resuelve el sistema y para quién (*Jobs To Be Done*).
> - **[docs/SSD.md](docs/SSD.md)** — especificación y diseño del sistema (arquitectura, datos, scripts, riesgos, glosario).
> - **[docs/adr/](docs/adr/README_ADR.md)** — decisiones de arquitectura, una por archivo (ADR-0001 … ADR-0014).
> - **[docs/ROADMAP.md](docs/ROADMAP.md)** — fases del proyecto y estado de avance.
> - **[CLAUDE.md](CLAUDE.md)** — contexto y convenciones para el trabajo asistido.
>
> Este README solo describe el contenido del repositorio.

> ⚠️ **Este repositorio no se despliega solo.** No hay `clasp` ni CI: el código se **copia y pega a
> mano** en los proyectos de Apps Script. Editar un archivo aquí no cambia nada en producción.

---

## Estructura del repositorio

```
Sistema_VAP
├── docs/                           # Documentación de referencia
│   ├── problem.md                  # El problema y los Jobs To Be Done
│   ├── SSD.md                      # Especificación + diseño del sistema
│   ├── ROADMAP.md                  # Fases y estado de avance
│   ├── adr/                        # Decisiones de arquitectura (ADR-0001 … ADR-0014)
│   └── dudas/                      # Cuestiones detectadas sin resolver
├── CLAUDE.md                       # Contexto y convenciones para el trabajo asistido
├── CHANGELOG.md                    # Registro de cambios (Keep a Changelog)
├── README.md                       # Este archivo
├── code_dev/                       # CÓDIGO — una carpeta por proyecto de Apps Script
│   ├── scripts_generales/          # Scripts transversales (no atados a un único colectivo)
│   │   └── VAP_script_export_SAGE.js   # Salario base + Export Neto/Bruto (menú "VAP_Acciones")
│   ├── VAP_script_secretarias/     # FASE 1 — Secretarias (en producción)
│   │   ├── VAP_Horas_Extras_Secretarias/    # → proyecto GAS de la hoja de respuestas
│   │   │   ├── VAP_Script_Actualizacion_Automatica_Secretarias.js  # Sincroniza el desplegable
│   │   │   ├── VAP_Script Volcado Horas Extras Secretarias.js      # Volcado por periodo
│   │   │   └── VAP_index_Dialogo_Volcado_Horas_Extras.html         # Diálogo (GAS: DialogoVolcado)
│   │   └── VAP_Complementos Secretarias/    # → proyecto GAS de la webapp de complementos
│   │       ├── VAP_Export_Complementos_Mensuales_Secretarias        # Code.gs (backend)
│   │       ├── VAP_index_Reportar_Complementos_Secretarias.html     # Webapp reporte
│   │       ├── VAP_index_Consultas_Envios_Complementos_Secretarias.html  # Webapp consulta
│   │       └── VAP_index_Portal_Complementos_Secretarias.html       # Portada / lanzador (GALA Hub)
│   └── VAP_scripts_profesores/     # FASE 2 — Profesores
│       ├── VAP_Script_Actualizacion_Automatica_Profesores.js        # Sincroniza el desplegable
│       ├── VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js     # Volcado por periodo
│       └── VAP_index_Dialogo_Volcado_Actividad_Profesores.html      # Diálogo (GAS: DialogoVolcado)
└── backup_old_js/                  # Respaldos de versiones anteriores (NO se ejecutan)
    ├── backup_VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js
    ├── script_vinculacion_gastos_personal_brutos_old.js  # volcado bruto previo (fusionado en SAGE)
    └── script_vinculacion_gastos_personal_neto_old.js    # volcado neto previo (fusionado en SAGE)
```

---

## Secretarias (Fase 1)

### Horas Extras

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_Script_Actualizacion_Automatica_Secretarias.js](code_dev/VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_Script_Actualizacion_Automatica_Secretarias.js) | Spreadsheet `VAP_BBDD_Personas` | Sincroniza la pregunta lista "SECRETARIA" del formulario `EXTRA SECRETARIAS 2026` con las secretarias activas, y al recibir un envío busca el `ID_Secre` por nombre y lo escribe en la hoja de respuestas. Triggers por edición/cambio + respaldo horario; control de frecuencia (caché 30 s). |
| [VAP_Script Volcado Horas Extras Secretarias.js](code_dev/VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_Script%20Volcado%20Horas%20Extras%20Secretarias.js) | Hoja de respuestas de `EXTRA SECRETARIAS 2026` (`Código.gs`) | Volcado **bajo demanda** de las horas extras a `VINCULACIÓN GASTOS PERSONAL`: Nº horas (G→AE) y € otros extras (I→AH). Filtra por el `MES` de la columna C y el año de la marca temporal; muestra un informe y pide confirmación antes de escribir. Audita en la hoja `LOG Volcado`. Usa `LockService`. |
| [VAP_index_Dialogo_Volcado_Horas_Extras.html](code_dev/VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_index_Dialogo_Volcado_Horas_Extras.html) | Mismo proyecto GAS, template **`DialogoVolcado`** | Diálogo del volcado: desplegables de mes y año (mes en curso preseleccionado), informe de filas que coinciden y que no, y botón de exportación. |

**Cómo se usa el volcado de horas extras** (desde [ADR-0013](docs/adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)):

1. En el Sheet de respuestas: menú **`VAP_Acciones` → "Volcar Horas Extras del mes..."**.
2. Elegir **mes** y **año** (viene preseleccionado el mes en curso) y pulsar **Revisar**.
3. El informe muestra cuántas filas **coinciden** con el periodo y cuántas **no**, con el motivo.
4. **Exportar** escribe en `VINCULACIÓN GASTOS PERSONAL` y copia las filas a la pestaña `Anteriores`.

> La hoja de respuestas **no se modifica**: `Anteriores` recibe una copia. Si una secretaria envía
> el formulario dos veces en el mismo mes, vale el de **marca temporal más reciente**.

**Instalación:** el proyecto GAS del Sheet de respuestas necesita **dos archivos** — el `.js` como
`Código.gs` y el `.html` con el nombre exacto **`DialogoVolcado`** (el script lo busca por ese
nombre). Después hay que **recargar el Spreadsheet** para que aparezca el menú.

### Complementos Salariales

| Archivo | Nombre en el proyecto GAS | Qué hace |
|---------|---------------------------|----------|
| [VAP_Export_Complementos_Mensuales_Secretarias](code_dev/VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_Export_Complementos_Mensuales_Secretarias) | `Code.gs` | Backend de las tres webapps (reporte, consulta y portal), exportación mensual a XLSX en Drive y envío de emails de confirmación/aviso. `doGet` enruta por `?page=`: por defecto `Index`, `?page=consultas`, `?page=portal`. |
| [VAP_index_Reportar_Complementos_Secretarias.html](code_dev/VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_index_Reportar_Complementos_Secretarias.html) | `Index` | Webapp de reporte masivo de complementos por responsable, con envíos y correcciones por mes/año (URL base). |
| [VAP_index_Consultas_Envios_Complementos_Secretarias.html](code_dev/VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_index_Consultas_Envios_Complementos_Secretarias.html) | `Consultas` | Webapp para que cada responsable consulte sus últimos envíos por período (`?page=consultas`; es el botón del email de confirmación). |
| [VAP_index_Portal_Complementos_Secretarias.html](code_dev/VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_index_Portal_Complementos_Secretarias.html) | `Portal` | **Portada/lanzador** (acceso desde GALA Hub, `?page=portal`): dos tarjetas para elegir **Reportar** o **Consultar**, que enlazan a las webapps existentes. No duplica lógica ni modifica las dos webapps anteriores; la URL se inyecta con `ScriptApp.getService().getUrl()`. |

---

## Profesores (Fase 2)

### Sincronización de formularios (Fase 2.A — en producción)

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_Script_Actualizacion_Automatica_Profesores.js](code_dev/VAP_scripts_profesores/VAP_Script_Actualizacion_Automatica_Profesores.js) | Proyecto Apps Script independiente, vinculado al formulario de profesores | Gemelo del de secretarias. Sincroniza la pregunta lista "SELECCIONE EL PROFESOR" con los profesores activos (`Alta = TRUE`) de `VAP_Profesores`, y al recibir un envío busca el `ID_Profesor` por nombre y lo escribe en la hoja de respuestas. Triggers por edición/cambio + respaldo horario; control de frecuencia (caché 30 s). |

> ⚠️ Debe desplegarse en un proyecto Apps Script **independiente** del de secretarias: ambos comparten nombres globales (`onFormSubmit`, `FORM_ID`…) y colisionarían en el mismo proyecto.

### Volcado de actividad — Registro de Actividad de Profesores

**Quién reporta:** las **secretarias**, sobre la actividad del profesorado que gestionan. El
profesorado no reporta su propia actividad.

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js](code_dev/VAP_scripts_profesores/VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js) | Hoja de respuestas de `REGISTRO DE ACTIVIDAD DE PROFESORES 26` (`Código.gs`) | Volcado **bajo demanda** de las 64 columnas de actividad (`F..BQ` → `AC..CN`) a `VINCULACIÓN GASTOS PERSONAL`. Filtra por el `MES` de la columna C y el año de la marca temporal; muestra un informe y pide confirmación. **Acumula campo a campo** ([ADR-0009](docs/adr/0009-acumular-respuestas-por-mes-y-anio.md)). Audita en `LOG Volcado`. Usa `LockService`. |
| [VAP_index_Dialogo_Volcado_Actividad_Profesores.html](code_dev/VAP_scripts_profesores/VAP_index_Dialogo_Volcado_Actividad_Profesores.html) | Mismo proyecto GAS, template **`DialogoVolcado`** | Diálogo del volcado: desplegables de mes y año, informe de coincidencias e incidencias, y botón de exportación. |

**Cómo se usa** (desde [ADR-0014](docs/adr/0014-volcado-actividad-profesores-por-periodo.md)):

1. En el Sheet de respuestas: menú **`VAP_Acciones` → "Volcar Actividad del mes..."**.
2. Elegir **mes** y **año** (viene preseleccionado el mes en curso) y pulsar **Revisar**.
3. El informe muestra las filas que **coinciden** y las que **no**, los profesores implicados, los
   campos con dato y las incidencias detectadas.
4. **Exportar** escribe en `VINCULACIÓN GASTOS PERSONAL` y copia las filas al histórico (`Hoja 1`).

> **Acumulación campo a campo.** Varias secretarias reportan partes distintas de la actividad del
> mismo profesor: por cada columna vale la última celda **con dato**; una celda vacía **no borra** lo
> ya reportado, y el `0` sí cuenta. En destino solo se escriben las columnas que el mes trae con
> valor.

> **Comprobación de destino limpio.** El proceso parte cada mes de una hoja de Vinculación vacía. El
> script lo verifica antes de escribir y **avisa en rojo** si el destino ya tiene datos: suele
> significar que se está volcando sobre la hoja del mes anterior.

**Instalación:** dos archivos en el proyecto GAS de la hoja de respuestas — el `.js` como `Código.gs`
y el `.html` con el nombre exacto **`DialogoVolcado`**. Recargar el Spreadsheet para ver el menú. La
cuenta que ejecuta necesita **acceso de Editor** al spreadsheet de destino.

> ⚠️ Si el proyecto conserva el antiguo activador `onFormSubmit`, **hay que borrarlo**: apunta a una
> función que ya no existe. Se conserva un backup de la versión anterior en `backup_old_js/`.

### Volcado de nóminas → Vinculación (fusionado en el script SAGE)

> Los antiguos scripts standalone de volcado de nóminas (neto y bruto) se han **fusionado** en [scripts_generales/VAP_script_export_SAGE.js](code_dev/scripts_generales/VAP_script_export_SAGE.js) como las acciones **Export Neto** y **Export Bruto** del menú `VAP_Acciones` (ver [Scripts generales](#scripts-generales) y [ADR-0011](docs/adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md)). Cruzan por `Empresa` + `Codigo_Empleado` (origen `bbdd_export_sage_laboral`) contra `EMPRESA` (E) + `Nº EMPLEADO` (F) del destino y **sobrescriben** los 8 campos mapeados, con LOG fila-a-fila en `LOG NETOS` / `LOG BRUTOS`. Las versiones previas se conservan en `backup_old_js/`.

---

## Scripts generales

Scripts transversales que operan sobre datos comunes a varios colectivos (p. ej. la exportación de SAGE laboral), agrupados en `scripts_generales/`.

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_script_export_SAGE.js](code_dev/scripts_generales/VAP_script_export_SAGE.js) | Apps Script **enlazado** al Spreadsheet `VAP_Export_Sage` (pestaña `bbdd_export_sage_laboral`) | Herramienta con menú **"VAP_Acciones"** y **3 acciones**: Calculo Salario Base, Export Neto y Export Bruto. Toda ejecución se registra en las hojas `logs` / `errores` del libro (correlación por `Run ID`). |

**Acciones del menú `VAP_Acciones`:**

| Acción | Qué hace |
|--------|----------|
| **Calculo Salario Base** | Localiza por cabecera `TOTAL_BRUTO`, `SEGURO_MEDICO`, `COBE_Transporte` y `COBE_Alimentacion`, pasa a positivo los tres descuentos y los suma al bruto → escribe `salario_base_bruto` en la columna **S** (`= TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|`). |
| **Export Neto** | Vuelca 8 campos del `bbdd_export_sage_laboral` a la hoja de Vinculación de **netos** (`…MPTs`, `Hoja 1`), cruzando por `Empresa` + `Codigo_Empleado` → `EMPRESA` (E) + `Nº EMPLEADO` (F). **Sobrescribe**; LOG fila-a-fila en `LOG NETOS`. |
| **Export Bruto** | Igual, contra la hoja de Vinculación de **brutos** (`…t04A`, `Hoja 1`); LOG en `LOG BRUTOS`. |

**Mapeo de los 8 campos (origen → destino), verificado contra las hojas reales:**

| Origen (`bbdd_export_sage_laboral`) | → Destino (col · cabecera) |
|-------------------------------------|----------------------------|
| `SEGURO_MEDICO` | G · ADESLAS |
| `COBE_Alimentacion` | H · COBEE COMIDA |
| `COBE_Transporte` | I · COBEE TRANSPORTE |
| `salario_base_bruto` | L · Salario Base |
| `SS_EMP` | P · SS Empresa |
| `SS_TRABAH` | Q · SS trabajador |
| `IRPF` | R · IRPF |
| `Líquido_a_percibir` | T · Nomina NETO |

> **Orden de uso:** ejecutar **Calculo Salario Base** antes que los export (la columna "Salario Base" del destino se alimenta del `salario_base_bruto` calculado).
> Las cabeceras del **origen** se localizan **por nombre** (robusto ante reordenación); el mapeo al **destino** usa posiciones de columna fijas (`VINC_FIELDS`). La columna `% IRPF` (S) del destino no se toca. Detalle completo en [SSD §7.5](docs/SSD.md#75-transversal--cálculos-y-volcado-sage) y los ADR [0010](docs/adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md) / [0011](docs/adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md) / [0012](docs/adr/0012-auditoria-centralizada-logs-y-errores.md).

---

## Notas

- Los IDs de spreadsheets, formularios y carpetas de Drive están **hardcodeados** en cada script (habitual en Apps Script). Tenerlo en cuenta si el repositorio se hace público.
- El nombre del archivo HTML de cada webapp **no coincide** con el nombre del template dentro del proyecto GAS (`Index` / `Consultas`); ver la columna correspondiente en las tablas de arriba.
