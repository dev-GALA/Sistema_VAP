# SSD — Sistema VAP (Valoración de Actividad Productiva)
**Software Specification & Design Document**
**Versión:** 2.0
**Fecha última actualización:** 25 septiembre 2026

> Documento único que cubre **especificación** (qué debe hacer el sistema) y **diseño**
> (cómo está construido). Las **decisiones de arquitectura** se registran aparte, una por
> archivo, en [`docs_solutions/docs_design/adr/`](adr/README_ADR.md). Las **fases y el estado de avance** están en
> los requisitos, con su estado. El **registro cronológico de cambios** está en
> [`../../CHANGELOG.md`](../../CHANGELOG.md).

---

## Índice

1. [Antecedentes y propósito](#1-antecedentes-y-propósito)
2. [Objetivos y alcance](#2-objetivos-y-alcance)
3. [Requisitos](#3-requisitos) → `requisitos_funcionales.md` · `requisitos_no_funcionales.md`
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
[RF](../../docs_discovery/requisitos_funcionales.md)); gestión de permisos por rol nativo de Google (ver [R-02](#9-riesgos-y-limitaciones)).

## 3. Requisitos

> **Los requisitos ya no viven aquí.** La referencia canónica es
> **[`requisitos_funcionales.md`](../../docs_discovery/requisitos_funcionales.md)**, derivado de las
> [historias de usuario](../../docs_discovery/historias_usuarios.md), con el estado de cumplimiento de cada uno.

Este apartado contenía 14 requisitos funcionales y 5 no funcionales, escritos **desde el código hacia
arriba**: describían lo ya construido. Los de `requisitos_funcionales.md` van en sentido contrario —describen lo
que debe cumplirse— y por eso son muchos más: la diferencia son los que **aún no tienen código
detrás**.

**Ninguno de los 14 antiguos se ha perdido ni contradicho**: todos están absorbidos, y la
correspondencia entre una numeración y otra está en
[`requisitos_funcionales.md` §4](../../docs_discovery/requisitos_funcionales.md#4-correspondencia-con-los-requisitos-del-ssd).

> Se mantiene el apartado, en lugar de borrarlo, para que quien llegue a este documento buscando
> requisitos no concluya que no los hay.

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

> Estructura **verificada contra el Spreadsheet real el 17 agosto 2026**. Los recuentos de filas son
> de esa fecha y solo dan idea de la escala.

| Hoja | Propósito | Columnas (en orden) | Filas |
|------|-----------|---------------------|-------|
| `VAP_Secretarias` | Listado de secretarias con estado activo/inactivo | `Empresa`, `Id_Sage`, `ID_Secre`, `Nombre_Secretaria`, `Alta`, `Fecha Alta`, `Fecha Baja` | 110 · **106 de alta** |
| `VAP_Profesores` | Listado de profesores | `Empresa`, `Id_Sage`, `ID_Profesor`, `Nombre`, `DNI`, `Tipologia_Profesor`, `Alta`, `Fecha_Alta`, `Fecha_Baja` *(columnas verificadas el 25 sep 2026; ver 6.1.0)* | 293 · **280 de alta** |
| `VAP_Complementos_Secretarias` | Catálogo de complementos salariales | `ID_Concepto`, `Concepto`, `Tipo_Valor`, `Activo` | 7 |
| `VAP_Responsables` | Listado de responsables (managers) | `ID_Respon`, `Nombre `, `Email`, `Activa` | 5 |
| `VAP_Responsables_Complementos` | Relación responsable ↔ complementos asignados | `ID_Respon`, `ID_Concepto`, `Activa` | 6 |
| `Config` | Destinatarios de notificaciones por tipo (ver 6.1.2) | *(posicionales, ver abajo)* | 3 |

> ⚠️ **Dos irregularidades en las cabeceras reales**, ambas inofensivas hoy pero frágiles:
>
> 1. **`VAP_Responsables` tiene la cabecera `"Nombre "` con un espacio final.** No rompe nada porque
>    el backend la lee con `readTable_`, que aplica `trim()` a las cabeceras. Cualquier código nuevo
>    que use `headers.indexOf("Nombre")` sin `trim` **fallaría en silencio**.
> 2. **Las hojas de personal no nombran igual las mismas columnas:** `VAP_Secretarias` usa
>    `Fecha Alta` / `Fecha Baja` (con espacio) y `VAP_Profesores` usa `Fecha_Alta` / `Fecha_Baja`
>    (con guion bajo). Ninguna se usa hoy en código, pero conviene saberlo antes de escribirlo.

**Escala del personal** (17 agosto 2026): **403 personas** en total — 110 secretarias (106 de alta) y
293 profesores (280 de alta), **386 activas**. Las bajas se conservan en la hoja con `Alta = FALSE`;
no se eliminan filas.

**Dos campos que conviene aclarar:**

- **`Empresa`** toma **9 valores distintos** en secretarias y **10** en profesores. No se corresponde
  con las autoescuelas de la red (55): apunta a la **sociedad mercantil** de la que depende cada
  persona, no al centro donde trabaja. Es la clave que usa el volcado SAGE junto a `Id_Sage`.
- **`Tipologia_Profesor`** *(la cabecera real va sin tilde)* solo toma los valores **`1`** (122 profesores) y **`2`** (171). Son
  códigos numéricos **cuyo significado no está documentado en ninguna parte** ni se usa hoy en
  ningún script. 🔍 *Pendiente de aclarar qué distingue una tipología de otra: si condiciona la
  retribución, es un dato relevante para el cálculo.*

#### 6.1.0 Reglas de entrada de `VAP_Profesores`

Desde el **25 de septiembre de 2026** la hoja tiene tres reglas que impiden los errores de escritura
más frecuentes. Viven **en la hoja**, no en el código: los scripts no han cambiado.

| Columna | Regla | Por qué |
|---------|-------|---------|
| `Empresa` (A) | **Desplegable** con las empresas válidas, aplicado a `A2:A` y con *Rechazar los datos introducidos* | La empresa forma parte del ID: una errata o un espacio de más genera un ID distinto |
| `ID_Profesor` (C) | **Calculado**: `ARRAYFORMULA` en `C2` que compone `Empresa_Id_Sage`. Si falta la empresa o el `Id_Sage`, deja el ID **vacío** | El ID se escribía a mano. Con el ID vacío la persona no aparece en el formulario: un `Id_Sage` olvidado se nota en lugar de colarse un ID a medias |
| `Alta` (G) | **Casilla de verificación** en `G2:G`, con *Rechazar los datos introducidos* y sin valores personalizados | El script exige el valor verdadero (`=== true`). Un texto "TRUE" pegado se ve igual y **excluía a la persona del formulario sin avisar** |

La fórmula de `C2` es:

```
=ARRAYFORMULA(SI((A2:A="")+(B2:B="");"";ESPACIOS(A2:A)&"_"&ESPACIOS(B2:B)))
```

> ⚠️ **Tres cosas que hay que saber al mantener la hoja:**
>
> 1. **No se escribe nada en `C3` ni más abajo.** Cualquier valor escrito ahí impide que la fórmula
>    se expanda y la columna entera pasa a `#REF!`.
> 2. **Se pega con Ctrl+Mayús+V** (solo valores). Pegar celdas completas desde otro libro arrastra
>    su formato y puede borrar la validación de esas celdas.
> 3. **Si un profesor cambia de empresa, no se edita su fila:** se le da de baja y se crea una
>    nueva. Cambiar la empresa cambia su ID, y sus respuestas anteriores se quedarían con el viejo
>    (ver R-21).
>
> `VAP_Secretarias` **todavía no tiene estas reglas**: es parte de
> [OB-38](../../docs_work/retomar_trabajos.md).

**Columnas clave usadas por el backend de complementos** (constantes `COL_*` del `Code.gs`):

- `VAP_Secretarias`: `ID_Secre`, `Nombre_Secretaria`, `Alta`.
- `VAP_Complementos_Secretarias`: `ID_Concepto`, `Concepto`, `Tipo_Valor`, `Activo`.
- `VAP_Responsables`: `ID_Respon`, `Nombre`, `Email`, `Activa`.
- `VAP_Responsables_Complementos`: `ID_Respon`, `ID_Concepto`, `Activa`.

#### 6.1.1 Catálogo de complementos (`VAP_Complementos_Secretarias`)

| ID_Concepto | Concepto | Tipo_Valor | Activo |
|-------------|----------|------------|--------|
| `CON_SECR_01` | APTOS | € | TRUE |
| `CON_SECR_02` | FINANCIACIONES | € | TRUE |
| `CON_SECR_03` | RESEÑAS | € | TRUE |
| `CON_SECR_04` | SABADOS_50 | € | TRUE |
| `CON_SECR_05` | SABADOS_60 | € | TRUE |
| `CON_SECR_06` | HORAS_PUNTOS | HORAS | TRUE |
| `CON_SECR_07` | PRUEBA_DATA | € | TRUE |

- `Tipo_Valor` distingue importes en **€** de cantidades en **HORAS**; la webapp lo usa para
  etiquetar el campo de entrada.
- La constante `CONCEPT_ORDER` del backend fija el orden de los conceptos en el Excel mensual y
  contiene **6**: los `CON_SECR_01` a `CON_SECR_06`. Un concepto fuera de esa lista se exporta
  igualmente, pero al final y por orden alfabético.

> ⚠️ **`PRUEBA_DATA` (`CON_SECR_07`) está marcado como activo** y, por tanto, se ofrece como
> concepto reportable a quien lo tenga asignado. Es un concepto de pruebas vivo en producción.

**Asignación responsable ↔ concepto** (`VAP_Responsables_Complementos`): 6 relaciones activas.
Responsable `1` → `CON_SECR_01`; `2` → `CON_SECR_02` y `CON_SECR_03`; `3` → `CON_SECR_04` y
`CON_SECR_05`; `4` → `CON_SECR_06`. El responsable `5` **no tiene ningún concepto asignado**, por lo
que `vap_bootstrapForEmail` lo rechazaría con *"Manager válido, pero sin conceptos activos
asignados"*.

#### 6.1.2 Hoja `Config` — destinatarios de notificaciones

Estructura **posicional** (no se lee por cabecera): la fila 1 es un título (`Config_Notificaciones`)
y los datos empiezan en la fila 2, con tres columnas: **A** tipo · **B** email · **C** activo.
La lee `getNotificationEmailsByType_`, que descarta las filas con la columna C a falso.

| Tipo | Efecto en el email de confirmación |
|------|-----------------------------------|
| `GESTION_SEGUIMIENTO_COMPLEMENTOS_SECRETARIAS` | Se añade al **Para**, junto a la responsable que reporta |
| `COPIA_GENERAL_COMPLEMENTOS_SECRETARIAS` | Se añade en **CC** |

> Cambiar quién recibe los avisos **no requiere tocar código**: basta con editar esta hoja. Como se
> lee por posición y no por cabecera, **no se deben reordenar sus columnas**.
>
> Estado actual: un único destinatario activo en `GESTION_SEGUIMIENTO`; `COPIA_GENERAL` sin
> destinatarios activos.

### 6.2 Hojas de `VAP_Carga_Datos_Mensuales_Complementos_Secretarias`

| Hoja | Propósito | Columnas principales |
|------|-----------|----------------------|
| `Data` | Un registro por (envío, secretaria, concepto) | `Timestamp`, `Batch_ID`, `ID_Responsable`, `Nombre_Responsable`, `Email_Responsable`, `Año`, `Mes`, `ID_Concepto`, `Concepto`, `ID_Secretaria`, `Nombre_Secretaria`, `Tipo_Valor`, `Valor`, `Source`, `Modo`, `Corrige_Batch_ID` |
| `Logs` | Una fila por acción (envío/corrección) | `Timestamp`, `Batch_ID`, `ID_Responsable`, `Acción`, `Nº_Registros`, `Resultado`, `Mensaje`, `Tipo_Correccion` |
| `Errores` | Una fila por valor inválido | `Timestamp`, `Batch_ID`, `ID_Responsable`, `Mes`, `ID_Concepto`, `ID_Secretaria`, `Valor_Intentado`, `Error` |

> **Identidad de un envío:** `Batch_ID` (`BATCH_<yyyyMMdd_HHmmss>_<rnd>`). Las correcciones
> referencian el `Batch_ID` original en `Corrige_Batch_ID`; el tipo (PARCIAL/TOTAL) se guarda
> en `Logs.Tipo_Correccion`. Ver [ADR-0005](adr/0005-gestion-de-envios-por-mes-y-anio.md).

**Estado verificado el 17 agosto 2026** (Spreadsheet `VAP_Carga_Datos_Mensuales_Complementos_Secretarias`):
las tres hojas existen con exactamente las columnas documentadas arriba. Volumen acumulado desde la
puesta en producción, con datos de **febrero a julio de 2026**:

| Hoja | Filas | Detalle |
|------|-------|---------|
| `Data` | 1.724 | 41 `Batch_ID` distintos · 107 secretarias · 4 responsables · 1.616 en modo `NUEVO` y 108 en `CORRECCION` |
| `Logs` | 65 | 44 `ENVIO` · 7 `CORRECCION` · 14 `EXPORT_OK` — **todas con resultado `OK`** |
| `Errores` | 0 | Ningún valor rechazado por no numérico desde el arranque |

> La hoja `Errores` vacía indica que **el mecanismo de validación de entrada nunca ha rechazado un
> valor**. Mide que la webapp no recibe basura, no que los importes sean correctos: un dato erróneo
> pero bien formado se registra sin incidencia.

### 6.3 Hoja destino `VINCULACIÓN GASTOS PERSONAL`

Hoja final donde confluyen los volcados. Cabecera real en la **fila 6** (para Export
Neto/Bruto). Rangos relevantes:

- **Horas extras secretarias:** Nº horas → `AE`; € otros extras → `AH`; cruce por nombre en `C`.
- **Actividad profesores:** datos `F..BQ` (origen) → `AC..CN` (destino); cruce por nombre en `C`.
- **Nóminas (neto/bruto):** 8 campos a `G,H,I,L,P,Q,R,T`; cruce por `EMPRESA` (E) + `Nº EMPLEADO` (F).

> **Premisa del proceso: cada mes se parte de una hoja limpia.** La hoja de Vinculación no se
> reutiliza arrastrando los datos del mes anterior. De ahí que los volcados puedan escribir **solo
> los campos que el periodo trae con valor** sin riesgo de mezclar meses: lo que no se reporta queda
> vacío porque la hoja ya lo estaba.
>
> Es una premisa **de la que depende la corrección del resultado**, así que los volcados de horas
> extras y de actividad la comprueban antes de escribir: cuentan las celdas del rango destino que ya
> tienen dato para las personas del periodo y avisan si no son cero
> ([ADR-0014](adr/0014-volcado-actividad-profesores-por-periodo.md)).

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
| `vap_consultaBatches(q)` | Consulta | Devuelve todos los envíos del período con detalle por secretaria |
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
| `VAP_Script Volcado Horas Extras Secretarias` + plantilla `DialogoVolcado` | Hoja de respuestas de `EXTRA SECRETARIAS 2026` | Volcado **bajo demanda** desde el menú `VAP_Acciones`: se elige el periodo en un desplegable, se revisa el informe y solo entonces se escriben Nº horas (G→AE) y € otros extras (I→AH) en `VINCULACIÓN GASTOS PERSONAL`. Usa `LockService`. Ver [ADR-0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md) |

**Quién reporta:** las **propias secretarias**, mediante el formulario `EXTRA SECRETARIAS 2026`.

#### Estructura del Spreadsheet de respuestas *(verificada el 17 agosto 2026)*

Dos pestañas:

**`Respuestas de formulario`** — la que lee el script. 26 respuestas, del 24 al 27 de julio de 2026.

| Col | Cabecera | ¿La usa el script de volcado? |
|-----|----------|-------------------------------|
| A | Marca temporal | **Sí** — su año acota el periodo y decide qué envío es el más reciente |
| B | Dirección de correo electrónico | No |
| **C** | **MES** | **Sí** — filtro de periodo |
| D | SECRETARIA -old | No (residuo de la migración del formulario) |
| E | SECRETARIA | **Sí** — cruce por nombre contra la col. `C` del destino |
| F | ID_Secre | No (lo escribe `VAP_Script_Actualizacion_Automatica_Secretarias`) |
| G | Nº HORAS EXTRA | **Sí** → destino `AE` |
| H | MOTIVO HORAS EXTRA | No |
| I | € OTROS EXTRAS | **Sí** → destino `AH` |
| J | MOTIVO OTROS EXTRAS | No |

**`Anteriores`** — archivo histórico. 162 filas iniciales, de enero a julio de 2026, **sin fila de
cabeceras** y con una estructura que **no coincide** con la pestaña activa (`A` marca temporal ·
`B` email · `C` nombre · `D` mes · `E` nº horas · `F` motivo): corresponde al **formulario anterior**,
previo a la migración.

Desde [ADR-0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md), cada exportación
**añade una copia** de las filas exportadas al final de esta hoja, con la estructura de la pestaña
activa más tres columnas de trazabilidad: `ARCHIVADO <MES> <AÑO>`, fecha de copia y `Run ID`.

> Hasta agosto de 2026, las respuestas antiguas se **movían a mano** a esta hoja para vaciar la
> pestaña activa: era lo que evitaba que el volcado arrastrase datos de meses pasados. **Ese
> mantenimiento manual ya no es necesario**: el filtro por periodo lo sustituye, y la hoja de
> respuestas conserva el histórico íntegro.

#### Flujo del volcado *(desde ADR-0013)*

1. Menú **`VAP_Acciones` → "Volcar Horas Extras del mes..."** abre un diálogo `HtmlService`
   (plantilla `DialogoVolcado`).
2. Se elige **mes y año** en sendos desplegables, con el **mes en curso preseleccionado** según la
   fecha de ejecución.
3. `vapAnalizarPeriodo` revisa la hoja **sin escribir nada** y devuelve el informe: filas que
   coinciden con el periodo y filas que no, desglosadas por motivo (otro mes, otro año, mes no
   reconocible), más las incidencias detectadas.
4. La usuaria **acepta o cancela**.
5. Si acepta, `vapEjecutarExportacion` escribe en el destino y copia las filas a `Anteriores`.

**Criterio de coincidencia:** `MES` (col. C) = mes elegido **Y** año de la marca temporal = año del
periodo. **Envíos múltiples:** si una secretaria aparece varias veces en el periodo, gana el de
**marca temporal más reciente** — reenviar el formulario funciona como corrección.

#### Auditoría: hoja `LOG Volcado`

Se crea automáticamente en el Spreadsheet de respuestas. Columnas: `Timestamp`, `Run ID`, `Usuario`,
`Periodo`, `Categoría`, `Tipo`, `Fila origen`, `Secretaria`, `Detalle`.

| Categoría | Qué recoge |
|-----------|------------|
| `MOVIMIENTO` | `ACTUALIZADO` (con valor antes→después por columna), `SIN_CAMBIO`, `FILA_NUEVA`, `COPIA_ARCHIVO` |
| `INCIDENCIA` | `MES_NO_RECONOCIDO`, `SIN_NOMBRE`, `SIN_MARCA_TEMPORAL`, `VALOR_NO_NUMERICO`, `MARCA_TEMPORAL_FUERA_DE_MES`, `VARIOS_ENVIOS` |
| `ERROR` | `NOMBRE_DUPLICADO_DESTINO`, `ACCESO_AL_DESTINO`, `PESTANA_NO_ENCONTRADA`, `BLOQUEO`, `TIEMPO_EXCEDIDO`, `NO_CLASIFICADO` — con tipo y solución sugerida |
| `RESUMEN` | Una fila por ejecución con el recuento total |

> **Nombre duplicado en destino:** si una secretaria aparece más de una vez en `VINCULACIÓN GASTOS
> PERSONAL`, su fila **no se escribe** y se registra el error. El script no elige por su cuenta cuál
> de las dos es la correcta.

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

**`VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26`** + plantilla `DialogoVolcado` (hoja de
respuestas de `REGISTRO DE ACTIVIDAD DE PROFESORES 26`). Volcado **bajo demanda por periodo**, con
**acumulación campo a campo** ([ADR-0009](adr/0009-acumular-respuestas-por-mes-y-anio.md),
[ADR-0014](adr/0014-volcado-actividad-profesores-por-periodo.md)).

**Quién reporta:** las **secretarias**, sobre la actividad del profesorado que gestionan. El
profesorado no reporta su propia actividad.

#### Estructura del Spreadsheet de respuestas *(verificada el 17 agosto 2026)*

| Col | Cabecera | Uso |
|-----|----------|-----|
| A | Marca temporal | Año del periodo y orden entre reportes |
| B | Dirección de correo electrónico | — |
| **C** | SELECCIONE EL MES | **Filtro de periodo** |
| D | SUCURSAL | Informativo (53 valores distintos); se anota en el log |
| E | SELECCIONE EL PROFESOR | Cruce por nombre contra la col. `C` del destino |
| F..BQ | 64 columnas de actividad | **Se vuelcan** → `AC..CN` |
| BR | OBSERVACIONES | No se vuelca (texto libre) |
| BS | *(sin nombre)* | No se usa |
| BT | ID_Profesor | Lo escribe `VAP_Script_Actualizacion_Automatica_Profesores` |

**`Hoja 1`** (de este mismo libro) es el **archivo histórico**: 1.730 filas de enero a julio de 2026,
295 profesores, 53 sucursales. Cada exportación le **añade una copia** de las filas volcadas, sellada
con periodo, fecha y `Run ID`. No confundir con la `Hoja 1` del libro **destino**.

> ⚠️ `Hoja 1` conserva las cabeceras del **formulario anterior** (`HORA EXTRA TALLER` /
> `SÁBADOS TALLER`) mientras el formulario actual dice `HORA EXTRA MECÁNICO` / `SÁBADOS MECÁNICOS`.
> Las copias se añaden **por posición**: conviene confirmar que son el mismo concepto renombrado.

#### Flujo del volcado

1. Menú **`VAP_Acciones` → "Volcar Actividad del mes..."** abre el diálogo `DialogoVolcado`.
2. Se elige **mes y año**, con el mes en curso preseleccionado.
3. `vapAnalizarPeriodo` revisa **sin escribir** y devuelve el informe: filas que coinciden y que no,
   profesores implicados, campos con dato, reportes múltiples e incidencias.
4. La usuaria **acepta o cancela**.
5. `vapEjecutarExportacion` escribe en el destino y copia las filas al histórico.

#### Lógica de acumulación *(ADR-0009, intacta)*

1. Se filtran las respuestas del periodo: `MES` (col. C) = mes elegido **y** año de la marca temporal
   = año del periodo.
2. Se agrupan por profesor (`normalizeKey` del nombre).
3. **Por columna, gana la última celda no vacía** según marca temporal; el vacío **no** pisa; el `0`
   es dato válido y sí pisa. Es lo que permite que **varias secretarias reporten partes distintas**
   de la actividad del mismo profesor: en el histórico hay 122 pares (profesor, mes) con más de un
   reporte.
4. En destino se escriben **solo las columnas con valor**; las demás conservan lo que hubiera.

#### Comprobación de destino limpio

El proceso **parte cada mes de una hoja de `VINCULACIÓN` limpia** (ver §6.3). Por eso, antes de
escribir, `contarCeldasOcupadasDestino_` cuenta cuántas celdas del rango `AC..CN` ya tienen datos
para los profesores del periodo. El resultado esperado es **0**; si no lo es, el informe avisa de
que probablemente se esté volcando **sobre la hoja del mes anterior**. La misma comprobación existe
en el volcado de horas extras, adaptada a sus columnas `AE`/`AH`.

#### Auditoría: hoja `LOG Volcado`

Mismo esquema que en horas extras (§7.2). Particularidades de este script:

- El detalle usa el **nombre real de cada columna** leído de la cabecera del formulario
  (`HORA TEÓRICA PRESENCIAL B L-V: (vacío) → 12`), no su posición. Con 64 campos, un log posicional
  sería ilegible. Se recorta a 12 campos por fila con un contador del resto.
- Incidencia `VARIOS_REPORTES`: profesor con más de un reporte en el periodo, indicando las filas y
  las sucursales de origen.
- Incidencia `VALOR_SOBRESCRITO`: dos reportes traen valores distintos para el mismo campo; se anota
  cuál ha ganado y desde qué fila.

**Auxiliares:** `isEmpty(v)` (trata `0` como dato), `normalizeKey(name)`, `normalizarMes_`,
`nombreColumna_`, `clasificarError_`. Usa `LockService`. El `COLUMN_MAP` (64 entradas) se **genera**
a partir de `SRC_FIRST_DATA_COL`/`SRC_LAST_DATA_COL`/`DST_FIRST_DATA_COL` en lugar de mantenerse a
mano.

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
3. Elige año/mes → `vap_consultaBatches` devuelve todos los envíos del período con detalle; si hay más de un concepto, se puede filtrar por concepto.

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

> **Cada riesgo tiene ahora un requisito detrás, o no lo tiene y eso también consta.** Al confrontar
> esta tabla con [`requisitos_funcionales.md`](../../docs_discovery/requisitos_funcionales.md) aparecieron tres riesgos que faltaban —R-18, R-19 y
> R-20— y dos que nadie había convertido en requisito: los duplicados del histórico (R-11) y las
> cabeceras del histórico de profesores (R-16). Ambos son ya [RF-70 y RF-71](../../docs_discovery/requisitos_funcionales.md).

| ID | Riesgo / Limitación | Impacto | Medida actual o propuesta |
|----|---------------------|---------|---------------------------|
| R-01 | Dependencia total de Google Workspace | Alto | Asumida como decisión corporativa. Documentar exportaciones periódicas |
| R-02 | Permisos de webapp no gestionados por rol nativo de Google | Medio | La webapp valida internamente que el responsable corresponde al complemento |
| R-03 | Cambio de nombre de una persona desvincula históricos y rompe el cruce por nombre | Medio | Usar siempre `ID_Secre` / `ID_Profesor`; mantener nombres únicos por colectivo |
| R-04 | Volcado de horas extras: **bajo demanda por decisión de diseño** (antes automático vía `onFormSubmit`) | Bajo | Acción de menú con informe y confirmación previa ([ADR-0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)). Ver R-09 |
| R-05 | Scripts de sincronización comparten nombres globales | Bajo | Desplegar cada uno en proyecto Apps Script independiente ([ADR-0007](adr/0007-proyectos-apps-script-independientes.md)) |
| R-06 | El cruce por nombre exige que `Nombre` coincida con el texto del desplegable | Bajo | Mantener `Nombre` con el formato deseado (`APELLIDOS, NOMBRE`); no editar la lista a mano |
| R-07 | Export Neto/Bruto **sobrescriben** las 8 columnas; una edición manual se pierde al re-ejecutar | Medio | Tratar el bbdd como fuente de verdad; auditar con `LOG NETOS`/`LOG BRUTOS` y `logs` |
| R-08 | Export Neto/Bruto mapean al destino por **posición fija** (G,H,I,L,P,Q,R,T) | Medio | **Matiza a [RNF-02](../../docs_discovery/requisitos_no_funcionales.md):** el cruce por cabecera protege el **origen**, no el destino. | Mantener estable la estructura del destino; ante cambios, actualizar `VINC_FIELDS` |
| R-09 | **Ambos volcados dependen de que alguien pulse el botón**: si no se ejecutan, no se vuelca nada y no hay aviso | Medio | **No es solo un riesgo: es [RNF-05](../../docs_discovery/requisitos_no_funcionales.md)**, elevado a requisito — nada que escriba se ejecuta sin confirmación humana. El riesgo residual (que nadie lo pulse) se mitiga con el seguimiento del cierre, [HU-29](../../docs_discovery/historias_usuarios.md). Es el precio de la revisión previa. Incluir el paso en el procedimiento de cierre mensual ([ADR-0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md), [ADR-0014](adr/0014-volcado-actividad-profesores-por-periodo.md)) |
| R-10 | ~~El volcado de actividad de profesores no deja rastro~~ **RESUELTO** (17 ago 2026) | ~~Alto~~ | Hoja `LOG Volcado` con movimientos, incidencias y errores ([ADR-0014](adr/0014-volcado-actividad-profesores-por-periodo.md)) |
| R-11 | Ejecutar dos veces el mismo periodo **duplica** las filas en el histórico (`Anteriores` / `Hoja 1`) | Bajo | El informe avisa antes de confirmar si ya existen filas de ese periodo; no se impide |
| R-12 | La plantilla HTML del diálogo se localiza **por nombre** (`DialogoVolcado`): renombrarla rompe el menú. Además, **ambos proyectos usan el mismo nombre de plantilla** con contenido distinto | Bajo | Documentado en el README y en cada script. Son proyectos GAS independientes ([ADR-0007](adr/0007-proyectos-apps-script-independientes.md)), así que no colisionan |
| R-16 | `Hoja 1` (histórico de profesores) conserva las cabeceras del formulario **anterior** (`TALLER`) mientras el formulario dice `MECÁNICO`; las copias se añaden **por posición** | Medio | Confirmar si son el mismo concepto renombrado. Si no lo fueran, el histórico mezclaría significados |
| R-17 | La premisa **"cada mes se parte de hoja limpia"** (§6.3) no está garantizada por ningún automatismo | Medio | Los volcados **comprueban y avisan** si el destino ya tiene datos, pero no lo impiden ([ADR-0014](adr/0014-volcado-actividad-profesores-por-periodo.md)) |
| R-13 | El repositorio y los proyectos GAS se sincronizan **copiando y pegando a mano**: pueden divergir sin que nadie lo detecte | Medio | Verificar contra el proyecto GAS ante cualquier duda; alternativa evaluable: `clasp` |
| R-14 | `toNumber_` del script SAGE elimina el punto decimal antes de convertir (`"1234.56"` → `123456`), y alimenta la comparación que decide si una celda cambió | Medio | Solo afecta a celdas con formato texto. Pendiente de unificar con `aNumero_`. Ver [RNF-08](../../docs_discovery/requisitos_no_funcionales.md) |
| R-18 | **Los procesos que se ejecutan solos no dejan rastro consultable.** Los dos scripts de sincronización de formularios escriben únicamente en el registro interno de la plataforma, que se borra | Alto | Pendiente: [RF-47](../../docs_discovery/requisitos_funcionales.md). Son justo los que deciden **quién aparece en los formularios**, y nadie está delante cuando fallan |
| R-19 | **Los movimientos de datos entre libros se hacen copiando y pegando**, y ninguno deja constancia de qué se movió ni cuándo | Alto | Pendiente: [RF-25](../../docs_discovery/requisitos_funcionales.md), [DUDA-0003](../../docs_work/dudas/0003-momentos-de-copia-y-pega-del-proceso.md). Rompe la cadena de trazabilidad justo en el punto donde el dato sale del sistema |
| R-20 | **El archivo donde se calcula la nómina está fuera del sistema**: no consta su estructura y no se controla lo que entra en él | Alto | Pendiente: [DUDA-0001](../../docs_work/dudas/0001-RESUELTA-tres-libros-destino-de-los-volcados.md). Es el supuesto S-06 de [`problem.md`](../../docs_discovery/problem.md) |
| R-21 | **El `ID_Profesor` se deriva de la empresa y del `Id_Sage`.** Si se edita la empresa de un profesor, su ID cambia y sus respuestas anteriores quedan con el antiguo | Medio | Procedimiento: al cambiar de empresa, baja y fila nueva, nunca editar la existente ([§6.1.0](#610-reglas-de-entrada-de-vap_profesores)) |
| R-15 | Export Neto/Bruto escribe **celda a celda** (filas × 8 campos): riesgo de agotar el tiempo máximo de ejecución al crecer el volumen | Medio | Pendiente de optimizar con escritura por rangos. Ver [RNF-08](../../docs_discovery/requisitos_no_funcionales.md) |

## 10. Glosario

| Término | Definición |
|---------|------------|
| VAP | Sistema de Valoración de Actividad Productiva |
| BBDD | Base de Datos |
| Complemento salarial | Concepto variable que se suma al salario base mensual |
| Responsable / Manager | Persona autorizada a reportar un complemento concreto |
| `ID_Secre` | Identificador único de cada secretaria en la BBDD |
| `ID_Profesor` | Identificador único de cada profesor en la BBDD. Se calcula en la hoja como `Empresa_Id_Sage` (ver 6.1.0) |
| `Batch_ID` | Identificador único de un envío de complementos |
| `Run ID` | Identificador que correlaciona una ejecución del script SAGE entre `logs`/`errores`/LOG |
| Webapp | Aplicación web generada con Google Apps Script |
| HH.EE. | Horas Extras |

## 11. Referencias

- **Decisiones de arquitectura:** [`docs_solutions/docs_design/adr/`](adr/README_ADR.md) (ADR-0001 … ADR-0016)
- **Requisitos y su estado:** [`requisitos_funcionales.md`](../../docs_discovery/requisitos_funcionales.md) · [`requisitos_no_funcionales.md`](../../docs_discovery/requisitos_no_funcionales.md)
- **Trabajo en curso:** [`retomar_trabajos.md`](../../docs_work/retomar_trabajos.md)
- **Cambios cronológicos:** [`../../CHANGELOG.md`](../../CHANGELOG.md)
- **Mapa del repositorio:** [`../../README.md`](../../README.md)

---

## 12. Trazabilidad completa

### Decisiones de arquitectura

Cada [ADR aceptado](adr/README_ADR.md) debe tener al menos un requisito que lo materialice. Si no lo
tiene, o la decisión no llegó a aplicarse, o falta escribir el requisito:

| ADR | Decisión | Requisitos |
|-----|----------|------------|
| [0001](adr/0001-google-sheets-como-bbdd-central.md) | Sheets como BBDD central | RNF-01 |
| [0002](adr/0002-webapp-propia-para-reporte-de-complementos.md) | Webapp propia de reporte | RF-05, RF-58 |
| [0003](adr/0003-responsable-asignado-a-complemento-en-bbdd.md) | Responsable ↔ complemento en BBDD | RF-06, RF-57 |
| [0004](adr/0004-formulario-horas-extras-vinculado-a-bbdd.md) | Formulario vinculado a la BBDD | RF-02 |
| [0005](adr/0005-gestion-de-envios-por-mes-y-anio.md) | Envíos por mes + año | RNF-03 |
| [0006](adr/0006-separar-bbdd-de-personal.md) | BBDD de personal separada | RF-01 |
| [0007](adr/0007-proyectos-apps-script-independientes.md) | Un proyecto por colectivo | RNF-12 |
| [0008](adr/0008-reutilizar-patron-de-sincronizacion.md) | Reutilizar el patrón de sincronización | RF-02, RNF-12 |
| [0009](adr/0009-acumular-respuestas-por-mes-y-anio.md) | Acumular por mes/año | RF-11, RF-20 |
| [0010](adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md) | Cruce por cabecera | RNF-02 |
| [0011](adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md) | Volcado de nóminas fusionado | RF-22, RNF-12 |
| [0012](adr/0012-auditoria-centralizada-logs-y-errores.md) | Auditoría en `logs` / `errores` | RF-46, RF-48 |
| [0013](adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md) | Volcado por periodo, bajo demanda | RF-16, RF-17, RF-18, RNF-05 |
| [0014](adr/0014-volcado-actividad-profesores-por-periodo.md) | Volcado de actividad por periodo | RF-16, RF-20, RF-23, RF-63 |

**Los 14 ADR aceptados tienen requisito.** Ninguna decisión se ha quedado sin materializar, y ningún
requisito contradice una decisión tomada.

> **Y al revés, un aviso para el futuro:** si un requisito nuevo choca con un ADR, **no se cambia el
> ADR** — los ADR son inmutables. Se escribe uno nuevo que supere al anterior. Que un requisito
> contradiga en silencio una decisión aceptada es la forma más rápida de que la arquitectura deje de
> significar nada.

### Riesgos del SSD

Los riesgos de [`SSD.md` §9](SSD.md#9-riesgos-y-limitaciones) y el requisito que los aborda:

| Riesgo | De qué va | Requisito | ¿Cubierto? |
|--------|-----------|-----------|------------|
| R-01 | Dependencia de la plataforma | RNF-01 | Asumido por decisión |
| R-02 | Permisos no gestionados por rol nativo | RNF-09 | Parcial · fuera de alcance |
| R-03, R-06 | El cruce por nombre se rompe si cambia el nombre | **RF-04** | 🔴 No |
| R-07 | Los export sobrescriben | RF-23, RF-24 | 🔴 En curso |
| R-08 | Destino por posición fija | **RNF-15** | 🔴 No |
| R-09 | Los volcados dependen de que alguien los lance | RNF-05 | ✅ Es un requisito, no un fallo |
| R-11 | Volcar dos veces duplica el histórico | **RF-70** | 🟡 Avisa |
| R-12 | La plantilla se localiza por nombre | — | Detalle de implementación |
| R-13 | Repositorio y producción se sincronizan a mano | RNF-11 | 🟡 Parcial |
| R-14 | Los decimales con punto se corrompen | RNF-08 | 🔴 No |
| R-15 | Escritura celda a celda | RNF-07, RNF-13 | 🔴 No |
| R-16 | Cabeceras del histórico de profesores | **RF-71** | 🔴 No |
| R-17 | La hoja limpia no está garantizada | RF-23, RF-24 | 🟡 Avisa, no impide |
| R-18 | Los procesos automáticos no dejan rastro | RF-47 | 🔴 No |
| R-19 | Los movimientos entre libros no dejan constancia | RF-25 | 🔴 No |
| R-20 | El archivo de cálculo está fuera del sistema | — | Duda abierta |
| R-21 | El ID del profesor cambia si cambia su empresa | RF-04 | 🟡 Cubierto por procedimiento, no por el sistema |

> **Tres riesgos no tenían requisito y ahora lo tienen** (RF-70, RF-71, RNF-15). Y **tres riesgos
> nuevos** salieron de esta confrontación y se han añadido al SSD: R-18, R-19 y R-20 — los tres de
> impacto alto, y los tres sobre lo mismo: **el dato sale del sistema y deja de haber rastro**.
>
> Solo dos riesgos se quedan sin requisito, y con motivo: R-12 es un detalle de implementación y R-20
> es una duda abierta, no algo que se pueda exigir todavía.

---

### La cadena, de punta a punta

```
problem.md  ──►  historias_usuarios.md  ──►  requisitos_funcionales.md  ──►  ADR
                                                        │                     ▲
                                                        ▼                     │
                                           requisitos_no_funcionales.md  ─────┘
```

| Eslabón | Dónde se declara la relación |
|---|---|
| HU → `problem.md` | En [`historias_usuarios.md`](../../docs_discovery/historias_usuarios.md) |
| RF → HU | Columna *Origen* de [`requisitos_funcionales.md`](../../docs_discovery/requisitos_funcionales.md) |
| RNF → RF | Columna *Relación con RF* de [`requisitos_no_funcionales.md`](../../docs_discovery/requisitos_no_funcionales.md), o su justificación **J-nn** si no la hay |
| ADR → RF/RNF | **Dentro de cada ADR**, según [MADR](adr/README_ADR.md) |
| Todo junto | **Esta sección** |
