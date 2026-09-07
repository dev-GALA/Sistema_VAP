# Sistema VAP — Valoración de Actividad Productiva

Sistema interno de **GALA Formación** para automatizar el cálculo de los salarios mensuales variables de dos colectivos: **secretarias** y **profesores de autoescuelas**.

Está construido sobre **Google Workspace**: Google Sheets como base de datos, Google Apps Script para la lógica y webapps propias para el reporte y la consulta de complementos. La fuente única de verdad del personal es el Google Sheet `VAP_BBDD_Personas`.

> 📐 **La documentación está repartida en tres carpetas, según a qué pregunta responde.**
>
> **[`docs_discovery/`](docs_discovery/) — el problema.** Qué hace falta y para quién, antes de
> hablar de soluciones:
> - **[docs_discovery/problem.md](docs_discovery/problem.md)** — qué problema resuelve el sistema y
>   para quién (*Jobs To Be Done*).
> - **[docs_discovery/historias_usuarios.md](docs_discovery/historias_usuarios.md)** — historias de
>   usuario, con su criterio de aceptación.
> - **[docs_discovery/requisitos_funcionales.md](docs_discovery/requisitos_funcionales.md)** — qué debe
>   hacer el sistema, en enunciados atómicos y comprobables (**RF**).
> - **[docs_discovery/requisitos_no_funcionales.md](docs_discovery/requisitos_no_funcionales.md)** — bajo
>   qué condiciones debe hacerlo (**RNF**), cada uno ligado a un RF o justificando por qué existe sin él.
>
> **[`docs_solutions/`](docs_solutions/) — la solución.** Cómo está construido y con qué código:
> - **[docs_solutions/docs_design/SSD.md](docs_solutions/docs_design/SSD.md)** — especificación y
>   diseño (arquitectura, datos, scripts, riesgos, glosario).
> - **[docs_solutions/docs_design/adr/](docs_solutions/docs_design/adr/README_ADR.md)** — decisiones
>   de arquitectura, una por archivo.
> - **[docs_solutions/src/](docs_solutions/src/)** — el código: una carpeta por proyecto de Apps Script.
>
> **[`docs_work/`](docs_work/) — el proceso y el trabajo por delante.** Lo que se comparte y se
> revisa con quien opera el sistema:
> - **[docs_work/FLUJO.md](docs_work/flujo_doc/FLUJO.md)** — el mapa del proceso mensual: qué dato nace dónde, por qué
>   manos pasa y qué le ocurre hasta la transferencia.
> - **[docs_work/retomar_trabajos.md](docs_work/retomar_trabajos.md)** — qué toca hacer ahora, en objetivos pequeños y
>   cerrables, y qué lo bloquea.
> - **[docs_work/dudas/](docs_work/dudas/README_dudas.md)** — cuestiones detectadas sin resolver, y la deuda
>   técnica.
> - **[docs_work/reuniones/](docs_work/reuniones/README_reuniones.md)** — guion y acta de cada reunión: el
>   mismo archivo antes y después.
> - **[docs_work/flujo_doc/](docs_work/flujo_doc/)** — el mapa del flujo y los ocho diagramas en
>   archivos aparte, listos para revisar fuera del repositorio.
> - **[docs_work/items_v3.md](docs_work/items_v3.md)** — ideas sin trazabilidad, que por eso no
>   se planifican: solo se construye lo trazable.
>
> Y **[CLAUDE.md](CLAUDE.md)** — contexto y convenciones para el trabajo asistido.
>
> Este README solo describe el contenido del repositorio.

> ⚠️ **Este repositorio no se despliega solo.** No hay `clasp` ni CI: el código se **copia y pega a
> mano** en los proyectos de Apps Script. Editar un archivo aquí no cambia nada en producción.

---

## Estructura del repositorio

```
Sistema_VAP
├── docs_discovery/                 # EL PROBLEMA — qué hace falta y para quién
│   ├── problem.md                  # El problema y los Jobs To Be Done
│   ├── historias_usuarios.md       # Historias de usuario y criterio de aceptación
│   ├── requisitos_funcionales.md   # Qué debe hacer el sistema (RF)
│   └── requisitos_no_funcionales.md # Bajo qué condiciones (RNF)
├── docs_solutions/                 # LA SOLUCIÓN — cómo está construido, y con qué código
│   ├── docs_design/                # EL DISEÑO
│   │   ├── SSD.md                  # Especificación + diseño del sistema
│   │   └── adr/                    # Decisiones de arquitectura (ADR-0001 … ADR-0016)
│   └── src/                        # CÓDIGO — una carpeta por proyecto de Apps Script
│       ├── scripts_generales/      # Scripts transversales (no atados a un único colectivo)
│       │   └── VAP_script_export_SAGE.js   # Salario base + Export Neto/Bruto (menú "VAP_Acciones")
│       ├── VAP_script_secretarias/ # FASE 1 — Secretarias (en producción)
│       │   ├── VAP_Horas_Extras_Secretarias/    # → proyecto GAS de la hoja de respuestas
│       │   │   ├── VAP_Script_Actualizacion_Automatica_Secretarias.js  # Sincroniza el desplegable
│       │   │   ├── VAP_Script Volcado Horas Extras Secretarias.js      # Volcado por periodo
│       │   │   └── VAP_index_Dialogo_Volcado_Horas_Extras.html         # Diálogo (GAS: DialogoVolcado)
│       │   └── VAP_Complementos Secretarias/    # → proyecto GAS de la webapp de complementos
│       │       ├── VAP_Export_Complementos_Mensuales_Secretarias        # Code.gs (backend)
│       │       ├── VAP_index_Reportar_Complementos_Secretarias.html     # Webapp reporte
│       │       ├── VAP_index_Consultas_Envios_Complementos_Secretarias.html  # Webapp consulta
│       │       └── VAP_index_Portal_Complementos_Secretarias.html       # Portada / lanzador (GALA Hub)
│       ├── VAP_scripts_profesores/ # FASE 2 — Profesores
│       │   ├── VAP_Script_Actualizacion_Automatica_Profesores.js        # Sincroniza el desplegable
│       │   ├── VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js     # Volcado por periodo
│       │   └── VAP_index_Dialogo_Volcado_Actividad_Profesores.html      # Diálogo (GAS: DialogoVolcado)
│       └── backup_old_js/          # Respaldos de versiones anteriores (NO se ejecutan)
│           ├── backup_VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js
│           ├── script_vinculacion_gastos_personal_brutos_old.js  # volcado bruto previo (fusionado en SAGE)
│           └── script_vinculacion_gastos_personal_neto_old.js    # volcado neto previo (fusionado en SAGE)
├── docs_work/                      # EL PROCESO — lo que se revisa con quien opera el sistema
│   ├── retomar_trabajos.md         # Qué toca ahora, en sprints, y qué lo bloquea
│   ├── dudas/                      # Cuestiones sin resolver + deuda técnica
│   ├── migration_data/             # Código de migración de datos (OB-32: debe mudarse a src/)
│   ├── reuniones/                  # Guion y acta de cada reunión, una por archivo
│   ├── flujo_doc/                  # El mapa del flujo, listo para revisar fuera del repo
│   │   ├── FLUJO.md                # Mapa del proceso mensual, del dato a la nómina
│   │   └── diagramas/              # Los 8 diagramas, en PDF (para imprimir) y PNG
│   └── items_v3.md                 # Ideas sin trazabilidad: no se planifican
├── CLAUDE.md                       # Contexto y convenciones para el trabajo asistido
├── CHANGELOG.md                    # Registro de cambios (Keep a Changelog)
└── README.md                       # Este archivo
```

---

## Secretarias (Fase 1)

### Horas Extras

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_Script_Actualizacion_Automatica_Secretarias.js](docs_solutions/src/VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_Script_Actualizacion_Automatica_Secretarias.js) | Spreadsheet `VAP_BBDD_Personas` | Sincroniza la pregunta lista "SECRETARIA" del formulario `EXTRA SECRETARIAS 2026` con las secretarias activas, y al recibir un envío busca el `ID_Secre` por nombre y lo escribe en la hoja de respuestas. Triggers por edición/cambio + respaldo horario; control de frecuencia (caché 30 s). |
| [VAP_Script Volcado Horas Extras Secretarias.js](docs_solutions/src/VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_Script%20Volcado%20Horas%20Extras%20Secretarias.js) | Hoja de respuestas de `EXTRA SECRETARIAS 2026` (`Código.gs`) | Volcado **bajo demanda** de las horas extras a `VINCULACIÓN GASTOS PERSONAL`: Nº horas (G→AE) y € otros extras (I→AH). Filtra por el `MES` de la columna C y el año de la marca temporal; muestra un informe y pide confirmación antes de escribir. Audita en la hoja `LOG Volcado`. Usa `LockService`. |
| [VAP_index_Dialogo_Volcado_Horas_Extras.html](docs_solutions/src/VAP_script_secretarias/VAP_Horas_Extras_Secretarias/VAP_index_Dialogo_Volcado_Horas_Extras.html) | Mismo proyecto GAS, template **`DialogoVolcado`** | Diálogo del volcado: desplegables de mes y año (mes en curso preseleccionado), informe de filas que coinciden y que no, y botón de exportación. |

**Cómo se usa el volcado de horas extras** (desde [ADR-0013](docs_solutions/docs_design/adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)):

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
| [VAP_Export_Complementos_Mensuales_Secretarias](docs_solutions/src/VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_Export_Complementos_Mensuales_Secretarias) | `Code.gs` | Backend de las tres webapps (reporte, consulta y portal), exportación mensual a XLSX en Drive y envío de emails de confirmación/aviso. `doGet` enruta por `?page=`: por defecto `Index`, `?page=consultas`, `?page=portal`. |
| [VAP_index_Reportar_Complementos_Secretarias.html](docs_solutions/src/VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_index_Reportar_Complementos_Secretarias.html) | `Index` | Webapp de reporte masivo de complementos por responsable, con envíos y correcciones por mes/año (URL base). |
| [VAP_index_Consultas_Envios_Complementos_Secretarias.html](docs_solutions/src/VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_index_Consultas_Envios_Complementos_Secretarias.html) | `Consultas` | Webapp para que cada responsable consulte sus últimos envíos por período (`?page=consultas`; es el botón del email de confirmación). |
| [VAP_index_Portal_Complementos_Secretarias.html](docs_solutions/src/VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_index_Portal_Complementos_Secretarias.html) | `Portal` | **Portada/lanzador** (acceso desde GALA Hub, `?page=portal`): dos tarjetas para elegir **Reportar** o **Consultar**, que enlazan a las webapps existentes. No duplica lógica ni modifica las dos webapps anteriores; la URL se inyecta con `ScriptApp.getService().getUrl()`. |

---

## Profesores (Fase 2)

### Sincronización de formularios (Fase 2.A — en producción)

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_Script_Actualizacion_Automatica_Profesores.js](docs_solutions/src/VAP_scripts_profesores/VAP_Script_Actualizacion_Automatica_Profesores.js) | Proyecto Apps Script independiente, vinculado al formulario de profesores | Gemelo del de secretarias. Sincroniza la pregunta lista "SELECCIONE EL PROFESOR" con los profesores activos (`Alta = TRUE`) de `VAP_Profesores`, y al recibir un envío busca el `ID_Profesor` por nombre y lo escribe en la hoja de respuestas. Triggers por edición/cambio + respaldo horario; control de frecuencia (caché 30 s). |

> ⚠️ Debe desplegarse en un proyecto Apps Script **independiente** del de secretarias: ambos comparten nombres globales (`onFormSubmit`, `FORM_ID`…) y colisionarían en el mismo proyecto.

### Volcado de actividad — Registro de Actividad de Profesores

**Quién reporta:** las **secretarias**, sobre la actividad del profesorado que gestionan. El
profesorado no reporta su propia actividad.

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js](docs_solutions/src/VAP_scripts_profesores/VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js) | Hoja de respuestas de `REGISTRO DE ACTIVIDAD DE PROFESORES 26` (`Código.gs`) | Volcado **bajo demanda** de las 64 columnas de actividad (`F..BQ` → `AC..CN`) a `VINCULACIÓN GASTOS PERSONAL`. Filtra por el `MES` de la columna C y el año de la marca temporal; muestra un informe y pide confirmación. **Acumula campo a campo** ([ADR-0009](docs_solutions/docs_design/adr/0009-acumular-respuestas-por-mes-y-anio.md)). Audita en `LOG Volcado`. Usa `LockService`. |
| [VAP_index_Dialogo_Volcado_Actividad_Profesores.html](docs_solutions/src/VAP_scripts_profesores/VAP_index_Dialogo_Volcado_Actividad_Profesores.html) | Mismo proyecto GAS, template **`DialogoVolcado`** | Diálogo del volcado: desplegables de mes y año, informe de coincidencias e incidencias, y botón de exportación. |

**Cómo se usa** (desde [ADR-0014](docs_solutions/docs_design/adr/0014-volcado-actividad-profesores-por-periodo.md)):

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
> función que ya no existe. Se conserva un backup de la versión anterior en `docs_solutions/src/backup_old_js/`.

### Volcado de nóminas → Vinculación (fusionado en el script SAGE)

> Los antiguos scripts standalone de volcado de nóminas (neto y bruto) se han **fusionado** en [scripts_generales/VAP_script_export_SAGE.js](docs_solutions/src/scripts_generales/VAP_script_export_SAGE.js) como las acciones **Export Neto** y **Export Bruto** del menú `VAP_Acciones` (ver [Scripts generales](#scripts-generales) y [ADR-0011](docs_solutions/docs_design/adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md)). Cruzan por `Empresa` + `Codigo_Empleado` (origen `bbdd_export_sage_laboral`) contra `EMPRESA` (E) + `Nº EMPLEADO` (F) del destino y **sobrescriben** los 8 campos mapeados, con LOG fila-a-fila en `LOG NETOS` / `LOG BRUTOS`. Las versiones previas se conservan en `docs_solutions/src/backup_old_js/`.

---

## Scripts generales

Scripts transversales que operan sobre datos comunes a varios colectivos (p. ej. la exportación de SAGE laboral), agrupados en `docs_solutions/src/scripts_generales/`.

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_script_export_SAGE.js](docs_solutions/src/scripts_generales/VAP_script_export_SAGE.js) | Apps Script **enlazado** al Spreadsheet `VAP_Export_Sage` (pestaña `bbdd_export_sage_laboral`) | Herramienta con menú **"VAP_Acciones"** y **3 acciones**: Calculo Salario Base, Export Neto y Export Bruto. Toda ejecución se registra en las hojas `logs` / `errores` del libro (correlación por `Run ID`). |

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
> Las cabeceras del **origen** se localizan **por nombre** (robusto ante reordenación); el mapeo al **destino** usa posiciones de columna fijas (`VINC_FIELDS`). La columna `% IRPF` (S) del destino no se toca. Detalle completo en [SSD §7.5](docs_solutions/docs_design/SSD.md#75-transversal--cálculos-y-volcado-sage) y los ADR [0010](docs_solutions/docs_design/adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md) / [0011](docs_solutions/docs_design/adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md) / [0012](docs_solutions/docs_design/adr/0012-auditoria-centralizada-logs-y-errores.md).

---

## Notas

- Los IDs de spreadsheets, formularios y carpetas de Drive están **hardcodeados** en cada script (habitual en Apps Script). Tenerlo en cuenta si el repositorio se hace público.
- El nombre del archivo HTML de cada webapp **no coincide** con el nombre del template dentro del proyecto GAS (`Index` / `Consultas`); ver la columna correspondiente en las tablas de arriba.
