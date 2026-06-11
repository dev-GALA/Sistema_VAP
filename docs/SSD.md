# SSD — Sistema VAP (Valoración de Actividad Productiva)
**Software Specification & Design Document**
**Versión:** 2.0
**Fecha última actualización:** 11 junio 2026

> Documento único que cubre **especificación** (qué debe hacer el sistema) y **diseño**
> (cómo está construido). Las **decisiones de arquitectura** se registran aparte, una por
> archivo, en [`docs/adr/`](adr/README.md). Las **fases y el estado de avance** están en
> [`docs/ROADMAP.md`](ROADMAP.md). El **registro cronológico de cambios** está en
> [`../CHANGELOG.md`](../CHANGELOG.md).

---

## Índice

1. [Antecedentes y propósito](#1-antecedentes-y-propósito)
2. [Objetivos y alcance](#2-objetivos-y-alcance)
3. [Requisitos](#3-requisitos)
4. [Arquitectura general](#4-arquitectura-general)
5. [Recursos del sistema](#5-recursos-del-sistema)
6. [Modelo de datos](#6-modelo-de-datos)
7. [Componentes y scripts](#7-componentes-y-scripts)
8. [Flujos clave](#8-flujos-clave)
9. [Riesgos y limitaciones](#9-riesgos-y-limitaciones)
10. [Glosario](#10-glosario)
11. [Referencias](#11-referencias)

---

## 1. Antecedentes y propósito

Hasta la puesta en marcha de este sistema, los datos para calcular los salarios mensuales
variables provenían de fuentes y personas dispersas, con formas de transmisión heterogéneas
(formularios, emails, Google Sheets diversos) hacia la persona que los centralizaba.

Todos esos datos debían "volcarse" manualmente en un Google Sheet final para calcular los
importes de los salarios mensuales de parte del personal. El proceso era complejo, tedioso
de gestionar y consumía mucho tiempo, susceptible de reducirse haciéndolo más eficaz y
automatizado.

El sistema implica el cálculo de salarios mensuales de **dos colectivos**: **secretarias**
y **profesores de autoescuelas**. Para avanzar de forma ordenada, el proyecto se estructura
en fases, mejorando primero el sistema de un colectivo y después el del otro, dado que tanto
los datos como sus fuentes no siempre coinciden entre ambos grupos.

## 2. Objetivos y alcance

1. **Mejorar los procesos** para actualizar los listados de personal a los que se les debe
   calcular el salario mensualmente.
2. **Automatizar y mejorar** las cargas de datos desde las diferentes fuentes hacia el
   proceso de cálculo final.

**Dentro de alcance:** centralización del personal, reporte y consulta de complementos de
secretarias, sincronización de formularios, volcados a la hoja de Vinculación y los cálculos
sobre la exportación SAGE laboral.

**Fuera de alcance (por ahora):** cálculo final de nóminas de profesores (en curso, ver
[ROADMAP](ROADMAP.md)); gestión de permisos por rol nativo de Google (ver [R-02](#9-riesgos-y-limitaciones)).

## 3. Requisitos

### 3.1 Requisitos funcionales — Secretarias

- **RF-01** Centralizar el personal activo/inactivo en una única fuente de verdad.
- **RF-02** Permitir a cada responsable (manager) **reportar** complementos salariales de
  forma masiva por secretaria, mes y año, vía webapp propia.
- **RF-03** Validar que el responsable solo reporta los **conceptos que tiene asignados**.
- **RF-04** Gestionar **envíos** y **correcciones** (parcial/total) identificados por mes + año.
- **RF-05** Enviar **email de confirmación** al responsable y **aviso** al gestor en cada remesa.
- **RF-06** Permitir a cada responsable **consultar** sus envíos por período.
- **RF-07** **Exportar** mensualmente, a demanda, los datos fusionados por secretaria y concepto.
- **RF-08** Volcar las **horas extras** del formulario a la hoja de Vinculación.

### 3.2 Requisitos funcionales — Profesores

- **RF-09** Sincronizar automáticamente el desplegable de profesores del formulario con los
  profesores activos.
- **RF-10** Escribir automáticamente el `ID_Profesor` en las respuestas al enviar el formulario.
- **RF-11** Volcar la actividad de cada profesor a la hoja de Vinculación **acumulando** por
  (profesor + mes + año).

### 3.3 Requisitos funcionales — Transversales

- **RF-12** Calcular el salario base bruto sobre la exportación SAGE laboral.
- **RF-13** Volcar nóminas (neto y bruto) a las hojas de Vinculación.
- **RF-14** Auditar de forma centralizada las acciones y los errores.

### 3.4 Requisitos no funcionales

- **RNF-01** No requerir infraestructura nueva: todo sobre **Google Workspace**.
- **RNF-02** Robustez ante reordenación de columnas en las fuentes (cruce **por cabecera**).
- **RNF-03** Durabilidad temporal: el sistema distingue por **mes + año**, sin reestructurar
  hojas con el paso de los años.
- **RNF-04** Concurrencia segura en los volcados (`LockService`).
- **RNF-05** Trazabilidad: cada acción/volcado deja rastro auditable.

## 4. Arquitectura general

El sistema está construido íntegramente sobre **Google Workspace**:

- **Google Sheets** como base de datos (la fuente única de verdad del personal es
  `VAP_BBDD_Personas`).
- **Google Apps Script (GAS)** para toda la lógica (sincronización, volcados, cálculos,
  backend de webapps y envío de emails).
- **Webapps propias** (HTML servido por GAS) para el reporte y la consulta de complementos.
- **Google Forms** para la captura de horas extras (secretarias) y actividad (profesores).
- **Google Drive** para almacenar las exportaciones XLSX.

```
VAP
├── Secretarias
│   ├── Complementos Salariales
│   │   ├── Portada / Lanzador (GALA Hub)      (template GAS: Portal · ?page=portal)
│   │   ├── Webapp Reporte Complementos        (template GAS: Index · URL base)
│   │   ├── Webapp Consulta Envíos             (template GAS: Consultas · ?page=consultas)
│   │   └── Google Sheet Carga Datos           (VAP_Carga_Datos_Mensuales_Complementos_Secretarias)
│   └── Horas Extras
│       ├── Formulario Horas Extra             (EXTRA SECRETARIAS 2026)
│       └── Script Volcado → VINCULACIÓN GASTOS PERSONAL
├── Profesores
│   ├── Formulario de Profesores
│   │   ├── Sincronización desplegable → VAP_Profesores (lista dinámica + ID_Profesor)
│   │   └── Registro de Actividad → VINCULACIÓN GASTOS PERSONAL (acumulación mes/año)
└── Transversal
    └── VAP_Export_Sage (menú "VAP_Acciones": Salario Base, Export Neto, Export Bruto)
```

> Decisiones de arquitectura relevantes: [ADR-0001](adr/0001-google-sheets-como-bbdd-central.md)
> (Sheets como BBDD), [ADR-0002](adr/0002-webapp-propia-para-reporte-de-complementos.md)
> (webapp propia), [ADR-0006](adr/0006-separar-bbdd-de-personal.md) (BBDD separada),
> [ADR-0007](adr/0007-proyectos-apps-script-independientes.md) (proyectos GAS independientes).

## 5. Recursos del sistema

**Carpeta raíz del proyecto:** `D. Data Sistema VAP` (Google Drive)

| Recurso | Nombre | Descripción |
|---------|--------|-------------|
| BBDD Personal | `VAP_BBDD_Personas` | Google Sheet que centraliza todo el personal del sistema |
| Datos Mensuales Complementos | `VAP_Carga_Datos_Mensuales_Complementos_Secretarias` | Recibe los volcados de la webapp de complementos de secretarias |
| Portada / Lanzador | `VAP_index_Portal_Complementos_Secretarias` (template `Portal`, `?page=portal`) | Punto de entrada desde GALA Hub: elegir Reportar o Consultar |
| Webapp Reporte | `VAP_index_Reportar_Complementos_Secretarias` (template `Index`) | Reporte masivo de complementos por responsable |
| Webapp Consulta | `VAP_index_Consultas_Envios_Complementos_Secretarias` (template `Consultas`) | Consulta de envíos realizados por los responsables |
| Formulario HH.EE. Secretarias | `EXTRA SECRETARIAS 2026` | Formulario de horas extras vinculado a BBDD |
| Formulario de Profesores | (pregunta `SELECCIONE EL PROFESOR`) | Reporta datos de profesores; desplegable sincronizado con `VAP_Profesores` |
| Formulario Actividad Profesores | `REGISTRO DE ACTIVIDAD DE PROFESORES 26` | Captura la actividad mensual de profesores |
| Export SAGE | `VAP_Export_Sage` (pestaña `bbdd_export_sage_laboral`) | Origen de cálculos y volcados de nóminas; hojas `logs`/`errores` de auditoría |
| Carpeta export XLSX | (ID en `EXPORT_FOLDER_ID`) | Destino de los Excel mensuales generados |

> **Nota:** los IDs de spreadsheets, formularios y carpetas de Drive están **hardcodeados**
> en cada script (habitual en Apps Script). Tenerlo en cuenta si el repositorio se hace público.

## 6. Modelo de datos

### 6.1 Hojas de `VAP_BBDD_Personas`

| Hoja | Propósito |
|------|-----------|
| `VAP_Secretarias` | Listado de secretarias con estado activo/inactivo (`Alta`) |
| `VAP_Complementos_Secretarias` | Catálogo de complementos salariales disponibles |
| `VAP_Responsables` | Listado de responsables (managers) del sistema |
| `VAP_Responsables_Complementos` | Relación responsable ↔ complementos asignados |
| `VAP_Profesores` | Listado de profesores. Columnas: `Empresa`, `Id_Sage`, `ID_Profesor`, `Nombre`, `Tipología_Profesor`, `Alta`, `Fecha_Alta`, `Fecha_Baja` |
| `Config` | Valores de configuración para scripts varios (p. ej. emails de notificación por tipo) |

**Columnas clave usadas por el backend de complementos:**

- `VAP_Secretarias`: `ID_Secre`, `Nombre_Secretaria`, `Alta`.
- `VAP_Complementos_Secretarias`: `ID_Concepto`, `Concepto`, `Tipo_Valor`, `Activo`.
- `VAP_Responsables`: `ID_Respon`, `Nombre`, `Email`, `Activa`.
- `VAP_Responsables_Complementos`: `ID_Respon`, `ID_Concepto`, `Activa`.

### 6.2 Hojas de `VAP_Carga_Datos_Mensuales_Complementos_Secretarias`

| Hoja | Propósito | Columnas principales |
|------|-----------|----------------------|
| `Data` | Un registro por (envío, secretaria, concepto) | `Timestamp`, `Batch_ID`, `ID_Responsable`, `Nombre_Responsable`, `Email_Responsable`, `Año`, `Mes`, `ID_Concepto`, `Concepto`, `ID_Secretaria`, `Nombre_Secretaria`, `Tipo_Valor`, `Valor`, `Source`, `Modo`, `Corrige_Batch_ID` |
| `Logs` | Una fila por acción (envío/corrección) | `Timestamp`, `Batch_ID`, `ID_Responsable`, `Acción`, `Nº_Registros`, `Resultado`, `Mensaje`, `Tipo_Correccion` |
| `Errores` | Una fila por valor inválido | `Timestamp`, `Batch_ID`, `ID_Responsable`, `Mes`, `ID_Concepto`, `ID_Secretaria`, `Valor_Intentado`, `Error` |

> **Identidad de un envío:** `Batch_ID` (`BATCH_<yyyyMMdd_HHmmss>_<rnd>`). Las correcciones
> referencian el `Batch_ID` original en `Corrige_Batch_ID`; el tipo (PARCIAL/TOTAL) se guarda
> en `Logs.Tipo_Correccion`. Ver [ADR-0005](adr/0005-gestion-de-envios-por-mes-y-anio.md).

### 6.3 Hoja destino `VINCULACIÓN GASTOS PERSONAL`

Hoja final donde confluyen los volcados. Cabecera real en la **fila 6** (para Export
Neto/Bruto). Rangos relevantes:

- **Horas extras secretarias:** Nº horas → `AE`; € otros extras → `AH`; cruce por nombre en `C`.
- **Actividad profesores:** datos `F..BQ` (origen) → `AC..CN` (destino); cruce por nombre en `C`.
- **Nóminas (neto/bruto):** 8 campos a `G,H,I,L,P,Q,R,T`; cruce por `EMPRESA` (E) + `Nº EMPLEADO` (F).

### 6.4 Hojas de auditoría en `VAP_Export_Sage`

| Hoja | Contenido | Columnas |
|------|-----------|----------|
| `logs` | Una fila por acción ejecutada | Timestamp · Acción activada · Resultado · Registro de acciones · Run ID · Usuario · Duración (s) |
| `errores` | Una fila por fallo | Timestamp · Acción · Tipo de error · Descripción · Posible solución · Run ID · Usuario |

> El `Run ID` correlaciona `logs`, `errores` y los `LOG NETOS` / `LOG BRUTOS` de los destinos.
> Ver [ADR-0012](adr/0012-auditoria-centralizada-logs-y-errores.md).

## 7. Componentes y scripts

### 7.1 Complementos Salariales Secretarias

**`VAP_Export_Complementos_Mensuales_Secretarias`** (template GAS `Code.gs`, enlazado a
`VAP_Carga_Datos_Mensuales_Complementos_Secretarias`). Backend de **ambas** webapps, más la
exportación mensual y los emails.

| Función GAS | Webapp / Acción | Descripción |
|-------------|----------------|-------------|
| `doGet(e)` | Router | Sirve `Index` por defecto, `Consultas` con `?page=consultas` y `Portal` con `?page=portal` |
| `vap_bootstrapForEmail(email)` | Reporte | Valida responsable e inicializa sesión: conceptos asignados, secretarias activas y defaults mes/año |
| `vap_submitBatch(payload)` | Reporte | Guarda envío/corrección en `Data`; genera `Batch_ID`, escribe en `Logs`, envía emails |
| `vap_listCorrectionTargets(q)` | Reporte | Lista los `Batch_ID` previos corregibles por responsable/mes/año/concepto |
| `vap_consultaBootstrap(email)` | Consulta | Valida responsable y devuelve los períodos (año/mes) con envíos |
| `vap_consultaBatches(q)` | Consulta | Devuelve los últimos 5 envíos del período con detalle por secretaria |
| `vap_generarExcelMensual()` | Menú Sheet | Genera el Excel mensual fusionado (ID + Nombre + columna por concepto) en Drive |
| `onOpen()` | Sheet | Añade el menú "Sistema VAP → Generar Excel mensual" |

**Frontends (HTML):**

- `VAP_index_Reportar_Complementos_Secretarias.html` (template `Index`): reporte masivo por
  responsable, con envíos y correcciones por mes/año.
- `VAP_index_Consultas_Envios_Complementos_Secretarias.html` (template `Consultas`): consulta
  de los últimos envíos por período.
- `VAP_index_Portal_Complementos_Secretarias.html` (template `Portal`): **portada/lanzador**
  alineada con GALA Hub que presenta los dos accesos (**Reportar** y **Consultar**) como tarjetas;
  cada una enlaza al recurso que **ya existe** (Reportar → URL base; Consultar → `?page=consultas`),
  sin duplicar su lógica. La URL del webapp se inyecta con un scriptlet
  (`ScriptApp.getService().getUrl()`), por lo que no hay IDs de despliegue hardcodeados. Pensada
  como punto de entrada desde GALA Hub; los enlaces directos a las dos webapps siguen funcionando
  por separado. Se sirve con `?page=portal`.

> El nombre del **archivo** HTML del repo **no coincide** con el nombre del **template** dentro
> del proyecto GAS (`Index` / `Consultas`). El Excel ordena los conceptos así: `APTOS`,
> `FINANCIACIONES`, `RESEÑAS`, `SABADOS_50`, `SABADOS_60`, `HORAS_PUNTOS`.

### 7.2 Horas Extras Secretarias

| Script | Ubicación GAS | Descripción |
|--------|--------------|-------------|
| `VAP_Script_Actualizacion_Automatica_Secretarias` | Spreadsheet `VAP_BBDD_Personas` | Sincroniza la pregunta lista "SECRETARIA" del formulario `EXTRA SECRETARIAS 2026` con las secretarias activas; al enviar (`onFormSubmit`) escribe el `ID_Secre`. Cache 30 s + respaldo horario |
| `VAP_Script Volcado Horas Extras Secretarias` | Hoja de respuestas de `EXTRA SECRETARIAS 2026` | Vuelca (`onFormSubmit`) Nº horas (G→AE) y € otros extras (I→AH) a `VINCULACIÓN GASTOS PERSONAL`, último registro por empleado. Usa `LockService` |

**Triggers de `VAP_Script_Actualizacion_Automatica_Secretarias`:** `onFormSubmit` (forForm),
`onSpreadsheetEditTrigger` (onEdit), `onSpreadsheetChangeTrigger` (onChange),
`actualizarPreguntaSecretarias` (horario).

### 7.3 Profesores — Sincronización de formularios

| Script | Ubicación GAS | Descripción |
|--------|--------------|-------------|
| `VAP_Script_Actualizacion_Automatica_Profesores` | Proyecto Apps Script **independiente** vinculado al formulario de profesores | Gemelo del de secretarias. Sincroniza "SELECCIONE EL PROFESOR" con los profesores activos (`Alta = TRUE`) de `VAP_Profesores`; escribe `ID_Profesor` al enviar. Cache 30 s + respaldo horario |

> ⚠️ Debe vivir en un proyecto Apps Script **independiente** del de secretarias
> (ver [ADR-0007](adr/0007-proyectos-apps-script-independientes.md)): comparten nombres
> globales (`onFormSubmit`, `FORM_ID`…) y colisionarían.

### 7.4 Profesores — Registro de Actividad (acumulación)

**`VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26`** (hoja de respuestas de
`REGISTRO DE ACTIVIDAD DE PROFESORES 26`). Volcado **con acumulación por (profesor + mes + año)**
(ver [ADR-0009](adr/0009-acumular-respuestas-por-mes-y-anio.md)).

**Columnas origen:** A (marca temporal → año), C (mes seleccionado), E (nombre), F..BQ (64
columnas de datos). **Destino:** nombre en `C`, datos `F..BQ → AC..CN`.

**Lógica de acumulación:**
1. Lee todas las respuestas (filas ≥ 2).
2. Agrupa por `normalizeKey(nombre) + normalizeKey(mes) + año(marca temporal)`.
3. Por columna, la **última celda no vacía** gana; el vacío no pisa; el `0` es dato válido.
4. Por profesor, reduce a **un** grupo: el más reciente por timestamp.
5. En destino: actualiza la fila del profesor o crea una nueva.

**Auxiliares:** `isEmpty(v)` (trata `0` como dato), `getYear(v)`, `normalizeKey(name)`
(trim, espacios colapsados, minúsculas, sin tildes). Trigger: `onFormSubmit`. Usa `LockService`.

### 7.5 Transversal — Cálculos y volcado SAGE

**`scripts_generales/VAP_script_export_SAGE.js`** (Apps Script enlazado a `VAP_Export_Sage`).
Menú **"VAP_Acciones"** con 3 acciones, ampliable por partes
(ver [ADR-0010](adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md),
[ADR-0011](adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md)).

| Ítem de menú | Función | Descripción |
|--------------|---------|-------------|
| Calculo Salario Base | `calcularSalarioBaseBruto` | `salario_base_bruto = TOTAL_BRUTO + \|SEGURO_MEDICO\| + \|COBE_Transporte\| + \|COBE_Alimentacion\|` → columna **S** |
| Export Neto | `exportNeto` → `volcarVinculacion_` | Vuelca 8 campos a la Vinculación de **netos** (`…MPTs`, `Hoja 1`); LOG en `LOG NETOS` |
| Export Bruto | `exportBruto` → `volcarVinculacion_` | Igual contra la Vinculación de **brutos** (`…t04A`, `Hoja 1`); LOG en `LOG BRUTOS` |

**Mapeo de los 8 campos (origen `bbdd_export_sage_laboral` → destino):**

| Origen | → Columna · Cabecera destino |
|--------|------------------------------|
| `SEGURO_MEDICO` | G · ADESLAS |
| `COBE_Alimentacion` | H · COBEE COMIDA |
| `COBE_Transporte` | I · COBEE TRANSPORTE |
| `salario_base_bruto` | L · Salario Base |
| `SS_EMP` | P · SS Empresa |
| `SS_TRABAH` | Q · SS trabajador |
| `IRPF` | R · IRPF |
| `Líquido_a_percibir` | T · Nomina NETO |

- Cruce por `Empresa` + `Codigo_Empleado` (cabecera) → `EMPRESA` (E) + `Nº EMPLEADO` (F);
  cabecera real del destino en la **fila 6**.
- Comportamiento **SOBRESCRIBIR** (refresco mensual), escribiendo solo celdas que cambian;
  `% IRPF` (S) del destino no se toca.
- Las cabeceras de **origen** se localizan **por nombre**; el destino usa posiciones fijas
  (`VINC_FIELDS`).
- **Orden de uso:** ejecutar *Calculo Salario Base* **antes** que los export.
- Toda ejecución pasa por `ejecutarAccion_`, que registra en `logs`/`errores`
  (ver [ADR-0012](adr/0012-auditoria-centralizada-logs-y-errores.md)).

**Auxiliares:** `volcarVinculacion_`, `clasificarError_`, `normalizarCabecera_`/`normalizeText_`,
`aNumero_`/`toNumber_`, `makeKey_`, `hasValue_`, `valuesEqual_`, `getOrCreateLogSheet_`,
`appendLogRows_`. Trigger: `onOpen` (crea el menú).

## 8. Flujos clave

### 8.1 Reporte de complementos (manager)

1. La manager abre la **webapp de reporte** (URL base).
2. Introduce su email → `vap_bootstrapForEmail` valida contra `VAP_Responsables` y devuelve
   sus conceptos asignados y las secretarias activas.
3. Elige mes, concepto y tipo (envío nuevo / corrección parcial o total).
4. Rellena importes por secretaria → `vap_submitBatch` escribe en `Data`/`Logs`, genera
   `Batch_ID` y dispara los emails (confirmación al responsable + aviso al gestor).
5. El email incluye un botón **"Ver mis últimos envíos"** que abre la webapp de consulta
   (`?page=consultas`).

### 8.2 Consulta de envíos (manager)

1. La manager abre la **webapp de consulta** (desde el email o `?page=consultas`).
2. Valida email → `vap_consultaBootstrap` devuelve los períodos con envíos.
3. Elige año/mes → `vap_consultaBatches` devuelve los últimos 5 envíos con detalle.

### 8.3 Portal / lanzador (acceso desde GALA Hub)

1. Desde GALA Hub (recurso `rec-004`), la manager abre el **portal** (`?page=portal`).
2. Ve una portada con dos tarjetas y **elige**:
   - **Reportar complementos** → navega a la webapp de reporte (URL base, flujo 8.1).
   - **Consultar mis envíos** → navega a la webapp de consulta (`?page=consultas`, flujo 8.2).
3. Cada webapp pide validar el email al entrar (igual que en los accesos directos, que siguen
   funcionando por separado).

### 8.4 Exportación mensual (gestor)

Desde el menú "Sistema VAP" del Sheet de carga, `vap_generarExcelMensual` pivota el último
valor por (secretaria, concepto) del período y genera un XLSX en Drive (export robusto vía
`UrlFetchApp` + OAuth, sin Drive API).

### 8.5 Volcado SAGE (gestor)

Menú "VAP_Acciones": *Calculo Salario Base* → *Export Neto* / *Export Bruto*. Cada acción se
audita en `logs`/`errores` y deja LOG fila-a-fila (antes→después) en el destino.

## 9. Riesgos y limitaciones

| ID | Riesgo / Limitación | Impacto | Medida actual o propuesta |
|----|---------------------|---------|---------------------------|
| R-01 | Dependencia total de Google Workspace | Alto | Asumida como decisión corporativa. Documentar exportaciones periódicas |
| R-02 | Permisos de webapp no gestionados por rol nativo de Google | Medio | La webapp valida internamente que el responsable corresponde al complemento |
| R-03 | Cambio de nombre de una persona desvincula históricos y rompe el cruce por nombre | Medio | Usar siempre `ID_Secre` / `ID_Profesor`; mantener nombres únicos por colectivo |
| R-04 | ~~Volcado de horas extras manual~~ **RESUELTO** | ~~Medio~~ | Trigger `onFormSubmit` activo en `VAP_Script Volcado Horas Extras Secretarias` |
| R-05 | Scripts de sincronización comparten nombres globales | Bajo | Desplegar cada uno en proyecto Apps Script independiente ([ADR-0007](adr/0007-proyectos-apps-script-independientes.md)) |
| R-06 | El cruce por nombre exige que `Nombre` coincida con el texto del desplegable | Bajo | Mantener `Nombre` con el formato deseado (`APELLIDOS, NOMBRE`); no editar la lista a mano |
| R-07 | Export Neto/Bruto **sobrescriben** las 8 columnas; una edición manual se pierde al re-ejecutar | Medio | Tratar el bbdd como fuente de verdad; auditar con `LOG NETOS`/`LOG BRUTOS` y `logs` |
| R-08 | Export Neto/Bruto mapean al destino por **posición fija** (G,H,I,L,P,Q,R,T) | Medio | Mantener estable la estructura del destino; ante cambios, actualizar `VINC_FIELDS` |

## 10. Glosario

| Término | Definición |
|---------|------------|
| VAP | Sistema de Valoración de Actividad Productiva |
| BBDD | Base de Datos |
| Complemento salarial | Concepto variable que se suma al salario base mensual |
| Responsable / Manager | Persona autorizada a reportar un complemento concreto |
| `ID_Secre` | Identificador único de cada secretaria en la BBDD |
| `ID_Profesor` | Identificador único de cada profesor en la BBDD |
| `Batch_ID` | Identificador único de un envío de complementos |
| `Run ID` | Identificador que correlaciona una ejecución del script SAGE entre `logs`/`errores`/LOG |
| Webapp | Aplicación web generada con Google Apps Script |
| HH.EE. | Horas Extras |

## 11. Referencias

- **Decisiones de arquitectura:** [`docs/adr/`](adr/README.md) (ADR-0001 … ADR-0012)
- **Fases y avance:** [`docs/ROADMAP.md`](ROADMAP.md)
- **Cambios cronológicos:** [`../CHANGELOG.md`](../CHANGELOG.md)
- **Mapa del repositorio:** [`../README.md`](../README.md)
