# Sistema VAP — Valoración de Actividad Productiva

Sistema interno de **GALA Formación** para automatizar el cálculo de los salarios mensuales variables de dos colectivos: **secretarias** y **profesores de autoescuelas**.

Está construido sobre **Google Workspace**: Google Sheets como base de datos, Google Apps Script para la lógica y webapps propias para el reporte y la consulta de complementos. La fuente única de verdad del personal es el Google Sheet `VAP_BBDD_Personas`.

> 📐 Las decisiones de arquitectura, las fases del proyecto, los riesgos y el glosario están en **[ADR.md](ADR.md)**, que es el documento de referencia. Este README solo describe el contenido del repositorio.

---

## Estructura del repositorio

```
Sistema_VAP
├── ADR.md                          # Architecture Decision Record (documento de referencia)
├── CHANGELOG.md                    # Registro de cambios (Keep a Changelog)
├── README.md                       # Este archivo
├── scripts_generales/              # Scripts transversales (no atados a un único colectivo)
│   └── VAP_script_export_SAGE.js   # Salario base + Export Neto/Bruto a Vinculación (menú "VAP_Acciones")
├── VAP_script_secretarias/         # FASE 1 — Secretarias (en producción)
│   ├── VAP_Script_Actualizacion_Automatica_Secretarias.js
│   ├── VAP_Script Volcado Horas Extras Secretarias.js
│   └── VAP_Complementos Secretarias/
│       ├── VAP_Export_Complementos_Mensuales_Secretarias        # Code.gs (backend)
│       ├── VAP_index_Reportar_Complementos_Secretarias.html     # Webapp reporte
│       └── VAP_index_Consultas_Envios_Complementos_Secretarias.html  # Webapp consulta
├── VAP_scripts_profesores/         # FASE 2 — Profesores
│   ├── VAP_Script_Actualizacion_Automatica_Profesores.js  # Sincronización del formulario (en producción)
│   └── VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js  # Volcado de actividad, acumulación por mes/año (DT-09)
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
| [VAP_Script_Actualizacion_Automatica_Secretarias.js](VAP_script_secretarias/VAP_Script_Actualizacion_Automatica_Secretarias.js) | Spreadsheet `VAP_BBDD_Personas` | Sincroniza la pregunta lista "SECRETARIA" del formulario `EXTRA SECRETARIAS 2026` con las secretarias activas, y al recibir un envío busca el `ID_Secre` por nombre y lo escribe en la hoja de respuestas. Triggers por edición/cambio + respaldo horario; control de frecuencia (caché 30 s). |
| [VAP_Script Volcado Horas Extras Secretarias.js](VAP_script_secretarias/VAP_Script%20Volcado%20Horas%20Extras%20Secretarias.js) | Hoja de respuestas de `EXTRA SECRETARIAS 2026` | Vuelca automáticamente (`onFormSubmit`) las horas extras a `VINCULACIÓN GASTOS PERSONAL`: Nº horas (G→AE) y € otros extras (I→AH), tomando el último registro por empleado. Usa `LockService`. |

### Complementos Salariales

| Archivo | Nombre en el proyecto GAS | Qué hace |
|---------|---------------------------|----------|
| [VAP_Export_Complementos_Mensuales_Secretarias](VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_Export_Complementos_Mensuales_Secretarias) | `Code.gs` | Backend de ambas webapps (reporte y consulta), exportación mensual a XLSX en Drive y envío de emails de confirmación/aviso. |
| [VAP_index_Reportar_Complementos_Secretarias.html](VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_index_Reportar_Complementos_Secretarias.html) | `Index` | Webapp de reporte masivo de complementos por responsable, con envíos y correcciones por mes/año. |
| [VAP_index_Consultas_Envios_Complementos_Secretarias.html](VAP_script_secretarias/VAP_Complementos%20Secretarias/VAP_index_Consultas_Envios_Complementos_Secretarias.html) | `Consultas` | Webapp para que cada responsable consulte sus últimos envíos por período. |

---

## Profesores (Fase 2)

### Sincronización de formularios (Fase 2.A — en producción)

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_Script_Actualizacion_Automatica_Profesores.js](VAP_scripts_profesores/VAP_Script_Actualizacion_Automatica_Profesores.js) | Proyecto Apps Script independiente, vinculado al formulario de profesores | Gemelo del de secretarias. Sincroniza la pregunta lista "SELECCIONE EL PROFESOR" con los profesores activos (`Alta = TRUE`) de `VAP_Profesores`, y al recibir un envío busca el `ID_Profesor` por nombre y lo escribe en la hoja de respuestas. Triggers por edición/cambio + respaldo horario; control de frecuencia (caché 30 s). |

> ⚠️ Debe desplegarse en un proyecto Apps Script **independiente** del de secretarias: ambos comparten nombres globales (`onFormSubmit`, `FORM_ID`…) y colisionarían en el mismo proyecto.

### Volcado de actividad — Registro de Actividad de Profesores (DT-09)

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js](VAP_scripts_profesores/VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js) | Hoja de respuestas del formulario `REGISTRO DE ACTIVIDAD DE PROFESORES 26` | Vuelca la actividad de cada profesor a `VINCULACIÓN GASTOS PERSONAL` **acumulando por (profesor + mes + año)**: la última celda *no vacía* gana, el vacío no pisa y el `0` es dato válido. Trigger `onFormSubmit`; usa `LockService`. Detalle técnico completo (columnas, lógica, funciones auxiliares) en [ADR.md](ADR.md) (DT-09). |

**Instalación (resumen):** copiar el script a la hoja de respuestas (`Herramientas → Editor de secuencias de comandos`), guardar y crear un activador con función `onFormSubmit`, origen *"Desde una hoja de cálculo"*, tipo *"Al enviar el formulario"*. La cuenta que ejecuta necesita **acceso de Editor** al spreadsheet de destino. Se conserva un backup de la versión anterior en `backup_old_js/`.

**Troubleshooting rápido:**
- *"You do not have permission to access the requested document"* → la cuenta que ejecuta no tiene acceso de Editor al destino; pide el permiso y reinténtalo.
- *"No existe la pestaña origen/destino"* → revisa `SOURCE_SHEET_NAME` / `TARGET_SHEET_NAME` en las primeras líneas del script.
- *Se ejecuta pero no vuelca nada* → falta el activador `onFormSubmit`.

### Volcado de nóminas → Vinculación (fusionado en el script SAGE)

> Los antiguos scripts standalone de volcado de nóminas (neto y bruto) se han **fusionado** en [scripts_generales/VAP_script_export_SAGE.js](scripts_generales/VAP_script_export_SAGE.js) como las acciones **Export Neto** y **Export Bruto** del menú `VAP_Acciones` (ver [Scripts generales](#scripts-generales) y DT-11 en [ADR.md](ADR.md)). Cruzan por `Empresa` + `Codigo_Empleado` (origen `bbdd_export_sage_laboral`) contra `EMPRESA` (E) + `Nº EMPLEADO` (F) del destino y **sobrescriben** los 8 campos mapeados, con LOG fila-a-fila en `LOG NETOS` / `LOG BRUTOS`. Las versiones previas se conservan en `backup_old_js/`.

---

## Scripts generales

Scripts transversales que operan sobre datos comunes a varios colectivos (p. ej. la exportación de SAGE laboral), agrupados en `scripts_generales/`.

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_script_export_SAGE.js](scripts_generales/VAP_script_export_SAGE.js) | Apps Script **enlazado** al Spreadsheet `VAP_Export_Sage` (pestaña `bbdd_export_sage_laboral`) | Herramienta con menú **"VAP_Acciones"** y **3 acciones**: Calculo Salario Base, Export Neto y Export Bruto. Toda ejecución se registra en las hojas `logs` / `errores` del libro (correlación por `Run ID`). |

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
> Las cabeceras del **origen** se localizan **por nombre** (robusto ante reordenación); el mapeo al **destino** usa posiciones de columna fijas (`VINC_FIELDS`). La columna `% IRPF` (S) del destino no se toca. Detalle completo en [ADR.md](ADR.md) (DT-10/DT-11/DT-12).

---

## Notas

- Los IDs de spreadsheets, formularios y carpetas de Drive están **hardcodeados** en cada script (habitual en Apps Script). Tenerlo en cuenta si el repositorio se hace público.
- El nombre del archivo HTML de cada webapp **no coincide** con el nombre del template dentro del proyecto GAS (`Index` / `Consultas`); ver la columna correspondiente en las tablas de arriba.
