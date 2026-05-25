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
│   └── VAP_script_export_SAGE.js   # Cálculos sobre la exportación SAGE laboral (menú "VAP_Acciones")
├── VAP_script_secretarias/         # FASE 1 — Secretarias (en producción)
│   ├── VAP_Script_Actualizacion_Automatica_Secretarias.js
│   ├── VAP_Script Volcado Horas Extras Secretarias.js
│   └── VAP_Complementos Secretarias/
│       ├── VAP_Export_Complementos_Mensuales_Secretarias        # Code.gs (backend)
│       ├── VAP_index_Reportar_Complementos_Secretarias.html     # Webapp reporte
│       └── VAP_index_Consultas_Envios_Complementos_Secretarias.html  # Webapp consulta
└── VAP_scripts_profesores/         # FASE 2 — Profesores
    ├── VAP_Script_Actualizacion_Automatica_Profesores.js  # Sincronización del formulario (en producción)
    ├── script-netos.js             # Volcado de nóminas (trabajo inicial)
    ├── script-netos-v1.js          # copia/backup idéntica a script-netos.js
    ├── script-brutos.js            # Volcado de nóminas (trabajo inicial)
    └── script-brutos-v1.js         # copia/backup idéntica a script-brutos.js
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

### Volcado de nóminas (trabajo inicial, no formalizado en el ADR)

> Scripts standalone que cruzan por **Empresa + Nº empleado** y solo escriben en celdas vacías, con hoja de LOG de cambios.

| Archivo | Qué hace |
|---------|----------|
| [script-netos.js](VAP_scripts_profesores/script-netos.js) | Vuelca el **neto** de la nómina al destino (columna T). |
| [script-brutos.js](VAP_scripts_profesores/script-brutos.js) | Vuelca **bruto + IRPF** (importe y %) al destino (columnas L, R, S). |
| `script-netos-v1.js` / `script-brutos-v1.js` | Copias **idénticas** byte a byte de los anteriores (backups). |

---

## Scripts generales

Scripts transversales que operan sobre datos comunes a varios colectivos (p. ej. la exportación de SAGE laboral), agrupados en `scripts_generales/`.

| Archivo | Dónde vive en GAS | Qué hace |
|---------|-------------------|----------|
| [VAP_script_export_SAGE.js](scripts_generales/VAP_script_export_SAGE.js) | Apps Script **enlazado** al Spreadsheet que contiene la pestaña `bbdd_export_sage_laboral` | Herramienta de cálculos con menú propio **"VAP_Acciones"**, ampliable por partes. Acción **"Calculo Salario Base"**: localiza por nombre de cabecera `TOTAL_BRUTO`, `SEGURO_MEDICO` y `COBE`, pasa a positivo los dos descuentos y los suma al bruto → escribe `salario_base_bruto` en la columna **R** (`= TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE|`). Acción **"Envio Datos (futuro)"**: placeholder, por desarrollar. |

> El menú `onOpen` está preparado para crecer con más acciones (`addItem`) o submenús (`addSubMenu`). Las columnas de entrada se localizan **por nombre de cabecera** (robusto ante reordenación); solo la columna de resultado (R) es de posición fija.

---

## Notas

- Los IDs de spreadsheets, formularios y carpetas de Drive están **hardcodeados** en cada script (habitual en Apps Script). Tenerlo en cuenta si el repositorio se hace público.
- El nombre del archivo HTML de cada webapp **no coincide** con el nombre del template dentro del proyecto GAS (`Index` / `Consultas`); ver la columna correspondiente en las tablas de arriba.
