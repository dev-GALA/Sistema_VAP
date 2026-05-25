# Sistema Valoración Actividad Productiva (VAP)
**ADR – Architecture Decision Record**
**Versión:** 1.5
**Fecha última actualización:** 25 Mayo 2026


## 1.Antecedentes

Hasta este momento el sistema consta de varias fuentes de datos provenientes de diferentes personas o departamentos, con diferentes formas de transmisión hacia la persona que los centraliza: formularios, emails, Google Sheets diversos. 

Todos estos datos deben ser "volcados" en un Google Sheet final para calcular los importes de los salarios mensuales de parte del personal.

Todo este proceso es complejo, actualmente tedioso de gestionar y requiere una inversión de tiempo elevada, la cual se puede reducir haciendo los procesos más eficaces y automatizados.


### Notas Importantes

Este sistema implica principalmente el cálculo de salarios mensuales de dos grupos de personal: **secretarias** y **profesores de autoescuelas**.

Para poder avanzar de forma ordenada, el proyecto se estructura en fases, mejorando primero el sistema para un grupo y después para el otro, dado que tanto los datos como sus fuentes no siempre coinciden entre ambos grupos.

---

## 2.Objetivos

1º Mejorar los procesos para actualizar los listados de personal a los cuales se les debe calcular los salarios mensualmente. 
2º Automatizar y mejorar las cargas de datos de las diferentes fuentes al proceso para el calculo final. 

---

## 3. Decisiones Técnicas

| # | Decisión | Justificación | Alternativas descartadas |
|---|----------|---------------|--------------------------|
| DT-01 | Usar Google Sheets como BBDD central de personal | Ya es la herramienta corporativa adoptada; no requiere infraestructura nueva | Airtable, Notion DB, base de datos SQL |
| DT-02 | Crear una Webapp propia para reporte de complementos | Los formularios nativos de Google clasificaban envíos masivos como SPAM y obligaban a resolver reCaptcha constantemente | Google Forms estándar |
| DT-03 | Asignar cada responsable a un complemento concreto en BBDD | Permite cambiar responsables o complementos sin tocar el código de la webapp | Hardcodear responsables en el script |
| DT-04 | Vincular el formulario de Horas Extras directamente a `VAP_Secretarias` | Evita tener que actualizar el formulario manualmente cada vez que hay altas o bajas de personal | Lista manual en el formulario |
| DT-05 | Gestionar envíos por mes + año en el timestamp | Hace el sistema duradero ante el paso de los años sin necesidad de reestructurar las hojas | Solo mes sin año |
| DT-06 | Separar la BBDD de personal (`VAP_BBDD_Personal`) del resto de hojas operativas | Centraliza las altas/bajas en un único punto, reduciendo errores de sincronización | Mantener listas dispersas por cada hoja operativa |
| DT-07 | Desplegar la sincronización de cada colectivo (secretarias / profesores) en un proyecto Apps Script independiente | Los scripts gemelos comparten nombres globales (`onFormSubmit`, `FORM_ID`…); en un mismo proyecto colisionarían | Un único proyecto Apps Script con todo el código |
| DT-08 | Reutilizar el patrón de sincronización de secretarias como gemelo para profesores | Mismo comportamiento ya probado; minimiza el coste de desarrollo y mantenimiento | Diseñar un mecanismo distinto para cada colectivo |


---

## 4. Estructura y Recursos

### 4.1 Estructura General
```
VAP
├── Secretarias
│   ├── Complementos Salariales
│   │   ├── Webapp Reporte Complementos (VAP_index_Reportar_Complementos_Secretarias)
│   │   ├── Webapp Consulta Envíos (VAP_index_Consulta_Complementos_Secretarias)
│   │   └── Google Sheet Carga Datos (VAP_Carga_Datos_Mensuales)
│   └── Horas Extras
│       ├── Formulario Horas Extra Secretarias (EXTRA SECRETARIAS 2026)
│       └── Script Volcado → VINCULACIÓN GASTOS PERSONAL
└── Profesores
    └── Formularios de Profesores
        ├── Formulario de Profesores (pregunta "SELECCIONE EL PROFESOR")
        └── Script Sincronización → VAP_Profesores (lista dinámica + ID_Profesor)
```

### 4.2 Recursos

**Carpeta raíz del proyecto:** `D. Data Sistema VAP` (Google Drive)

| Recurso | Nombre | Descripción |
|---------|--------|-------------|
| BBDD Personal | `VAP_BBDD_Personas` | Google Sheet que centraliza todo el personal del sistema |
| Datos Mensual Complementos Salariales Secretarias | `VAP_Carga_Datos_Mensuales_Complementos_Secretarias` | Recibe los volcados de la webapp de complementos salariales secretarias |
| Webapp Reporte | `VAP_index_Reportar_Complementos_Secretarias` | Permite reporte masivo de complementos por responsable |
| Webapp Consulta | `VAP_index_Consulta_Complementos_Secretarias` | Permite a responsables consultar sus envíos realizados |
| Formulario HH.EE. Secretarias | `EXTRA SECRETARIAS 2026` | Formulario de horas extras vinculado a BBDD |
| Formulario de Profesores | (pregunta `SELECCIONE EL PROFESOR`) | Formulario que reporta datos de profesores; su desplegable se sincroniza con `VAP_Profesores` |


### 4.3 Scripts

#### Horas Extras Secretarias

| Script | Ubicación GAS | Descripción |
|--------|--------------|-------------|
| `VAP_Script_Actualizacion_Automatica_Secretarias` | Spreadsheet `VAP_BBDD_Personas` | Sincroniza la pregunta lista "SECRETARIA" del formulario `EXTRA SECRETARIAS 2026` con las secretarias activas de `VAP_Secretarias`. Al recibir un envío (`onFormSubmit`), busca el `ID_Secre` por nombre y lo escribe automáticamente en la hoja de respuestas. Incluye control de frecuencia (cache 30 s) y trigger de respaldo horario. |
| `VAP_Script Volcado Horas Extras Secretarias` | Hoja de respuestas de `EXTRA SECRETARIAS 2026` | Vuelca automáticamente (trigger `onFormSubmit`) los datos de horas extras al spreadsheet `VINCULACIÓN GASTOS PERSONAL`. Toma el **último** registro por empleado en caso de duplicados. Usa `LockService` para evitar escrituras concurrentes. |

**Columnas volcadas por `VAP_Script Volcado Horas Extras Secretarias`:**

| Concepto | Col. origen (`EXTRA SECRETARIAS 2026`) | Col. destino (`VINCULACIÓN GASTOS PERSONAL`) |
|----------|----------------------------------------|----------------------------------------------|
| Nº HORAS EXTRA | G | AE |
| € OTROS EXTRAS | I | AH |
| Nombre empleado | E | C (clave de cruce) |

**Triggers configurados en `VAP_Script_Actualizacion_Automatica_Secretarias`:**

| Función | Tipo de trigger | Evento |
|---------|----------------|--------|
| `onFormSubmit` | `forForm` | Al enviar el formulario |
| `onSpreadsheetEditTrigger` | `forSpreadsheet` | `onEdit` en `VAP_BBDD_Personas` |
| `onSpreadsheetChangeTrigger` | `forSpreadsheet` | `onChange` en `VAP_BBDD_Personas` (altas/bajas de filas) |
| `actualizarPreguntaSecretarias` | `timeBased` | Cada hora (respaldo) |

---

#### Complementos Salariales Secretarias

| Script | Ubicación GAS | Descripción |
|--------|--------------|-------------|
| `VAP_Export_Complementos_Mensuales_Secretarias` | `VAP_Carga_Datos_Mensuales_Complementos_Secretarias` | Script principal (`Code.gs`) que concentra la lógica de servidor de ambas webapps (reporte y consulta), la exportación mensual a XLSX y el envío de emails de confirmación/aviso. |

**Funciones expuestas por `VAP_Export_Complementos_Mensuales_Secretarias`:**

| Función GAS | Webapp / Acción | Descripción |
|-------------|----------------|-------------|
| `vap_bootstrapForEmail(email)` | Webapp Reporte | Valida el responsable contra `VAP_Responsables` e inicializa la sesión: devuelve sus complementos asignados, lista de secretarias activas y valores por defecto de mes/año |
| `vap_submitBatch(payload)` | Webapp Reporte | Guarda el envío o corrección de importes en la hoja `Data`; genera `Batch_ID` único, escribe en `Logs` y envía email de confirmación al responsable y aviso al gestor |
| `vap_listCorrectionTargets(params)` | Webapp Reporte | Devuelve los `Batch_ID` previos disponibles para corregir, filtrados por responsable, mes, año y concepto |
| `vap_consultaBootstrap(email)` | Webapp Consulta | Valida el responsable e inicializa la sesión de consulta: devuelve los períodos (año/mes) con envíos existentes |
| `vap_consultaBatches(params)` | Webapp Consulta | Devuelve los últimos 5 envíos del responsable para el período indicado, con detalle por secretaria |
| `vap_generarExcelMensual()` | Menú Google Sheet | Genera el Excel mensual fusionado (ID + Nombre de secretaria + columna por concepto) y lo guarda en la carpeta de Drive configurada |
| `onOpen()` | Google Sheet | Añade el menú "Sistema VAP → Generar Excel mensual" al abrir el spreadsheet |

**Orden de conceptos en el Excel exportado:** `APTOS`, `FINANCIACIONES`, `RESEÑAS`, `SABADOS_50`, `SABADOS_60`, `HORAS_PUNTOS`

---

#### Sincronización de Profesores

| Script | Ubicación GAS | Descripción |
|--------|--------------|-------------|
| `VAP_Script_Actualizacion_Automatica_Profesores` | Proyecto Apps Script independiente, vinculado al formulario de profesores | Gemelo del de secretarias. Sincroniza la pregunta lista "SELECCIONE EL PROFESOR" con los profesores activos (`Alta = TRUE`) de `VAP_Profesores`. Al recibir un envío (`onFormSubmit`), busca el `ID_Profesor` por nombre y lo escribe en la hoja de respuestas. Incluye control de frecuencia (cache 30 s) y trigger de respaldo horario. |

**Triggers configurados en `VAP_Script_Actualizacion_Automatica_Profesores`:**

| Función | Tipo de trigger | Evento |
|---------|----------------|--------|
| `onFormSubmit` | `forForm` | Al enviar el formulario |
| `onSpreadsheetEditTrigger` | `forSpreadsheet` | `onEdit` en `VAP_BBDD_Personas` |
| `onSpreadsheetChangeTrigger` | `forSpreadsheet` | `onChange` en `VAP_BBDD_Personas` (altas/bajas de filas) |
| `actualizarPreguntaProfesores` | `timeBased` | Cada hora (respaldo) |

> ⚠️ Debe vivir en un proyecto Apps Script **independiente** del de secretarias (ver DT-07): ambos comparten nombres globales y colisionarían en el mismo proyecto.


### 4.4 Hojas dentro de `VAP_BBDD_Personas`

| Hoja | Propósito |
|------|-----------|
| `VAP_Secretarias` | Listado de secretarias con estado activo/inactivo |
| `VAP_Complementos_Secretarias` | Catálogo de complementos salariales disponibles |
| `VAP_Responsables` | Listado de responsables (managers) del sistema |
| `VAP_Responsables_Complementos` | Relación entre responsables y complementos asignados |
| `VAP_Profesores` | Listado de profesores con estado activo/inactivo. Columnas: `Empresa`, `Id_Sage`, `ID_Profesor`, `Nombre`, `Tipología_Profesor`, `Alta`, `Fecha_Alta`, `Fecha_Baja` |
| `Config` | Listado de valores necesarios para script varios |

---

## 5. Fases del Proyecto

### FASE 1 – Secretarias

#### Fase 1.A – Complementos Salariales

- [x] Creación de `VAP_BBDD_Personas` como fuente única de verdad para el personal activo
- [x] Webapp de reporte masivo de complementos con lista dinámica de secretarias activas
- [x] Validación de que el responsable corresponde al complemento que reporta
- [x] Gestión de envíos y correcciones por mes/año
- [x] Email de confirmación al responsable y aviso al gestor al recibir nueva remesa
- [x] Webapp de consulta de envíos realizados por los responsables
- [x] Exportación mensual a demanda de datos fusionados por secretaria y complemento

#### Fase 1.B – Horas Extras de Secretarias

- [x] Vinculación del formulario `EXTRA SECRETARIAS 2026` a `VAP_Secretarias` (lista dinámica, sin mantenimiento manual)
- [x] Actualización del script de volcado para aceptar las nuevas columnas del formulario
- [x] Volcado de datos hacia `VINCULACIÓN GASTOS PERSONAL`

### FASE 2 – Profesores

#### Fase 2.A – Sincronización de formularios

- [x] Revisión y carga de la hoja `VAP_Profesores` en `VAP_BBDD_Personas` (con estado `Alta`)
- [x] Sincronización automática del desplegable "SELECCIONE EL PROFESOR" con los profesores activos de `VAP_Profesores` (lista dinámica, sin mantenimiento manual)
- [x] Escritura automática del `ID_Profesor` en la hoja de respuestas al enviar el formulario

#### Fase 2.B – Pendiente

- [ ] Identificar todas las fuentes de datos actuales de profesores y su estructura
- [ ] Definir complementos salariales específicos del colectivo
- [ ] Evaluar reutilización de la webapp de secretarias o necesidad de versión propia
- [ ] Diseñar el flujo de volcado hacia el cálculo final de nóminas

---

## 6. Registro de Trabajo

### Sesión 1 - 25/02/26
- Análisis del sistema existente y definición de objetivos
- Creación de `VAP_BBDD_Personas` y sus hojas internas
- Diseño inicial de la webapp de reporte de complementos
- Desarrollo y despliegue de `VAP_index_Reportar_Complementos_Secretarias`
- Implementación de la lógica de validación responsable ↔ complemento
- Implementación de gestión de envíos y correcciones por mes/año
- Desarrollo y despliegue script `VAP_Export_Complementos_Mensuales_Secretarias`


### Sesión 2 - 24/03/26
- Implementación de emails de confirmación y aviso al gestor
- Desarrollo y despliegue de `VAP_index_Consulta_Complementos_Secretarias`
- Vinculación del formulario `EXTRA SECRETARIAS 2026` con `VAP_Secretarias`
- Actualización del script de volcado de horas extras con las nuevas columnas con script `VAP_Script Volcado Horas Extras Secretarias`
- Actualización de validación de respuestas en formulario `EXTRA SECRETARIAS 2026` con script `VAP_Script_Actualizacion_Automatica_Secretarias`

### Sesión 3 - 25/05/26
- Limpieza del repositorio: eliminado el archivo duplicado del script de sincronización del formulario; se conserva `VAP_Script_Actualizacion_Automatica_Secretarias` como nombre único
- Alineación de los nombres de scripts del ADR con los archivos reales del repositorio (prefijo `VAP_`)
- Creación de `README.md` con la descripción del proyecto y el mapa de archivos

### Sesión 4 - 25/05/26
- Desarrollo de `VAP_Script_Actualizacion_Automatica_Profesores` (gemelo del de secretarias) para el formulario de profesores
- Sincronización del desplegable "SELECCIONE EL PROFESOR" con `VAP_Profesores` (filtrando `Alta = TRUE`) y escritura del `ID_Profesor` en las respuestas
- Despliegue en un proyecto Apps Script independiente vinculado al formulario; triggers de producción + respaldo horario activos (248 profesores activos cargados en la primera sincronización)
- Documentación del nuevo script en el ADR y el README

---

## 7. Riesgos y Limitaciones Conocidas

| ID | Riesgo / Limitación | Impacto | Medida actual o propuesta |
|----|---------------------|---------|---------------------------|
| R-01 | Dependencia total de Google Workspace | Alto | Asumida como decisión corporativa. Documentar exportaciones periódicas |
| R-02 | Permisos de acceso a la webapp no gestionados por rol de Google | Medio | La webapp valida internamente que el responsable corresponde al complemento |
| R-03 | Si una persona (secretaria o profesor) cambia de nombre en BBDD, los registros históricos quedan desvinculados y el cruce por nombre del formulario falla | Medio | Usar siempre `ID_Secre` / `ID_Profesor` como clave primaria; mantener nombres únicos por colectivo |
| R-04 | ~~El script de volcado de horas extras es manual (no automático)~~ **RESUELTO** | ~~Medio~~ | El script `VAP_Script Volcado Horas Extras Secretarias` tiene trigger `onFormSubmit` activo: el volcado se ejecuta automáticamente al recibir cada envío del formulario |
| R-05 | Los scripts de sincronización de secretarias y profesores comparten nombres globales (`onFormSubmit`, `FORM_ID`…) | Bajo | Desplegar cada uno en un proyecto Apps Script independiente (ver DT-07); no pegar ambos en el mismo proyecto |
| R-06 | El cruce por nombre exige que el `Nombre` de `VAP_Profesores` coincida con el texto del desplegable; al sincronizar, la lista del formulario se sobrescribe con la columna `Nombre` | Bajo | Mantener `Nombre` con el formato deseado (`APELLIDOS, NOMBRE`) y no editar la lista del formulario a mano |

---

## 8. Glosario

| Término | Definición |
|---------|------------|
| VAP | Sistema de Valoración de Actividad Productiva |
| BBDD | Base de Datos |
| Complemento salarial | Concepto variable que se suma al salario base mensual |
| Responsable / Manager | Persona autorizada a reportar un complemento concreto |
| `ID_Secre` | Identificador único de cada secretaria en la BBDD |
| `ID_Profesor` | Identificador único de cada profesor en la BBDD |
| Webapp | Aplicación web generada con Google Apps Script |
| HH.EE. | Horas Extras |