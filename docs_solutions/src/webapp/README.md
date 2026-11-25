# Webapp del proceso mensual — v0.4.0

La primera pantalla del sistema para Administración: **Proceso mensual**, **Comprobaciones**,
**Registro de diferencias**, **Altas/bajas** y **Maestro de personal**.

> **Solo *Proceso mensual* funciona** (las otras cuatro pantallas son esqueleto). Muestra los pasos del mes
> en grupos (*Acciones 1*: 1.1 y 1.2; y el paso 3 suelto). **Lo único que escribe la webapp** es una fila en
> `estado_pasos` al pulsar *Marcar como realizado* en un paso manual, tras confirmarlo, con quién y cuándo.
> El paso 1.2 (*Comprobar*) se activa cuando el 1.1 está realizado, pero **la comprobación aún no existe** (OB-44).
> *Altas/bajas* y *Maestro de personal* cuelgan del submenú **Gestión Personal**.
>
> **Pagos (v0.4.0, sin desplegar)**: el submenú **Pagos** trae *Cruzar Pagos*, *Históricos de Pagos*, *Maestro de Pagos* y
> *Carga inicial de cuentas*. Todo lo que toca cuentas bancarias lo hace el **servicio `VAP_Pagos`**
> ([`../vap_pagos/`](../vap_pagos/README.md), [ADR-0019](../../docs_design/adr/0019-vap-pagos-como-servicio-propio-con-huella-hmac.md)):
> la webapp **ya no calcula ninguna huella ni conoce la clave**. Ver la sección «Pagos» más abajo.
>
> **Altas/bajas (v0.3.0)** funciona de dos formas: **a mano** (formulario) y **subiendo una plantilla CSV** con
> previsualización, corrección y verificación por fila. Escribe en el **maestro de personas** (`VAP_BBDD_Personas`)
> y, si se da la cuenta bancaria, **solo su huella** en `VAP_Pagos`. **Hasta que se configure lo de la sección
> «Altas y bajas» más abajo, la pantalla se niega a guardar y lo dice.** *Maestro de personal* sigue siendo esqueleto.
>
> ⚠️ **Altas/bajas supone una estructura del maestro que NO es la real** (una pestaña por empresa y nombre y apellidos separados; el maestro real tiene una pestaña por tipo, `Empresa` como columna y «APELLIDOS, NOMBRE»). **Hay que rehacerla antes de activarla**: ver *Pendientes del 17 nov 2026 (tarde)* en [`proximos_pasos.md`](../../../docs_work/proximos_pasos.md).

Decisiones: [ADR-0017](../../docs_design/adr/0017-webapp-del-proceso-mensual-stack-y-estructura.md)
(stack y estructura) y [ADR-0018](../../docs_design/adr/0018-gsh-propio-de-la-webapp-propietario-y-accesos.md)
(libro propio, propietario y accesos). Ambos están en estado **Propuesta**.

## Estructura

Apps Script no tiene carpetas: el prefijo del archivo dice su capa, y **las dependencias apuntan hacia dentro**.

| Capa | Archivos | Qué hay |
|---|---|---|
| `dominio-` | `periodo`, `pantallas`, `acceso`, `pasos`, `personal`, `importes`, `banco`, `pagos` | Reglas puras. Sin servicios de Google |
| `app-` | `contexto`, `proceso-mensual`, `personal`, `pagos` | Casos de uso. Las dependencias llegan inyectadas |
| `infra-` | `configuracion`, `hojas`, `personal`, `pagos`, `principal` | Hojas, propiedades y el punto de entrada (`doGet` y las `api…`) |
| `ui-` | `index`, `aviso`, `estilos`, `cliente` | Pantallas HTML. El estilo es una copia de `carfa` (identidad SIFAF) |

Solo `doGet` y las funciones `api…` se pueden llamar desde el navegador, y **cada una comprueba el acceso en el
servidor**. Todas las demás terminan en `_`. Lo vigila `tests/webapp/arquitectura.test.js`.

## Lo que hay que crear en Google

> Los nombres de los menús de Google están dados de memoria y **no están verificados**: si alguno no
> coincide, no insistas en él y dime qué ves.

### 1. El libro propio (`VAP_Webapp`, nombre provisional)

Un Google Sheets **nuevo, propiedad de tu cuenta**, independiente de todos los demás. Con **dos hojas**, con
estos nombres exactos y esta cabecera exacta **en la fila 1**:

**Hoja `config`** — los parámetros, como clave/valor (la misma convención que BUCA):

| clave | valor |
|---|---|
| `email_administracion` | *el correo de la Responsable de Administración* |
| `email_desarrollo` | *tu correo* |

- Cada clave admite **varios correos separados por comas**: `sara@…, otra@…`.
- Quitar un correo de la lista **le quita el acceso**.
- Un correo que no esté, que esté en los dos roles o que Google no identifique **no entra**.
- Las claves no distinguen mayúsculas. Una clave **repetida** hace que la aplicación se niegue a abrirse.

**Hoja `estado_pasos`** — el estado de cada paso. La app añade una fila cada vez que se marca un paso. Déjala **vacía, solo con la cabecera**:

| periodo | paso_id | estado | actualizado_por | actualizado_en |
|---|---|---|---|---|

- `periodo` con formato **Texto sin formato**, para que Sheets no convierta `2026-11` en una fecha (el código
  lo tolera, pero así es más limpio).
- `estado` admite `pendiente`, `hecho` (se muestra como *Realizado*) o `con-incidencias`.
- `actualizado_en` lleva fecha y hora (`AAAA-MM-DD HH:MM`).
- `paso_id` es uno de: `actualizar-bbdd-personas`, `comprobar-concordancia`, `actualizar-export-sage`.

**El libro no debe guardar nunca** DNI, cuentas bancarias ni huellas.

### 2. El proyecto de Apps Script

Un proyecto **nuevo e independiente**, con los archivos de esta carpeta (todos los `.gs` y `.html`, y el
manifiesto `appsscript.json`).

### 3. La propiedad del script

Una propiedad del script llamada **`ID_LIBRO_WEBAPP`**, con el identificador del libro (el trozo de la URL
entre `/d/` y `/edit`). Sin ella, la aplicación **se niega a abrirse** y lo dice.

### 4. Implementar como aplicación web — **decisión tuya, aún abierta (ADR-0018)**

Hay dos ajustes de seguridad que **no elijo yo por defecto**:

- **Ejecutar como:** tú, o quien accede.
- **Quién tiene acceso.**

Un aviso **no verificado en vuestro dominio**: si se ejecuta como tú, `Session.getActiveUser()` puede devolver
vacío según cómo se despliegue. El código lo trata como «no identificado» y **deniega a todos**. Si pasa, no es
un fallo de la aplicación sino del ajuste: se prueba entrando con la cuenta de la Responsable de Administración.

## Altas y bajas: lo que hay que configurar (nada se activa sin esto)

> **Los nombres de las pestañas y las cabeceras del maestro están SUPUESTOS**: no he visto `VAP_BBDD_Personas`.
> Si no coinciden, la app se niega y dice cuál falta; no escribe nada. Ajustar es cambiar un nombre en
> `infra-configuracion.gs`.

**Hoja `config`** (más claves; las de acceso no cambian):

| clave | valor |
|---|---|
| `empresas` | Empresas del desplegable, **separadas por `;`** (un nombre puede llevar comas). `Empresa A; Empresa B=Pestaña B`: sin `=`, la pestaña del maestro se llama como la empresa |
| `maestro_libro_id` | Identificador del libro `VAP_BBDD_Personas` |

**Libro `VAP_Webapp`: hoja nueva `registro_personal`**, con esta cabecera en la fila 1 (una fila por cada paso de cada alta o baja;
**sin DNI, nombre ni cuenta**, solo el identificador): `evento_id · momento · usuario · accion · empresa · id_trabajador · estado · detalle`.

**Cada pestaña del maestro** debe tener estas cabeceras: `id_trabajador · nombre · apellidos · dni · fecha_alta · fecha_baja`.
**Para guardar una cuenta**, cada pestaña del maestro necesita además las columnas `cuenta_en_pagos` y `cuenta_en_pagos_fecha` (RF-97: «sí» y la fecha;
**sin huella ni dígitos**). Si faltan, el alta queda en `error` y lo dice (la cuenta ya consta en `VAP_Pagos`).

**Propiedades del script `URL_SERVICIO_PAGOS` y `TOKEN_SERVICIO_PAGOS`**: dirección del servicio `VAP_Pagos` y el token compartido con él. **Sin ellas
no se guarda ninguna cuenta** (la pantalla lo dice). Viven en las propiedades y no en `config`, que más personas pueden leer.

**Estados de cada evento:** `registrado` → `aplicado` (maestro hecho) → `completo` (con cuenta, o una baja) · `sin-aplicar` (falta la
empresa: queda registrado y **no** se toca el maestro) · `error` (algo falló a medias; el detalle dice qué).

**Plantilla CSV** (primera fila, separada por `;` o `,`): `accion;nombre;apellidos;dni;fecha;empresa;id_trabajador`. Obligatorias:
`accion` (alta o baja), `nombre`, `apellidos`, `dni`, `fecha` (`AAAA-MM-DD` o `DD/MM/AAAA`). **La cuenta bancaria no va en la plantilla** (si
trae una columna de cuenta, se rechaza sin enviarla). Máximo 200 filas por envío. El archivo **no se guarda**: se lee en el navegador.

## Pagos: lo que hay que configurar (nada se activa sin esto)

> **Supuestos sin verificar:** el formato real de la fuente de importes (**Vinculación**, DUDA-0006 abierta), la forma de `id_personal`
> (`Empresa_nº`) y las columnas nuevas del maestro. Si algo no coincide, la pantalla se niega y dice qué falta; no escribe nada.

**Hoja `config`** (más claves):

| clave | valor |
|---|---|
| `vinculacion_libro_id` | Identificador del libro con los importes esperados |
| `vinculacion_hoja` | Nombre de la hoja. Admite `{empresa}` y `{periodo}` (`2026-11`) |
| `vinculacion_col_dni` · `vinculacion_col_importe` | Texto de la cabecera de las dos columnas. La cabecera se localiza **por su texto**, no por la fila |
| `vinculacion_fuente` | Opcional. Cómo se llama la fuente en el informe. Por defecto `Vinculación` |

**Ficheros del banco:** `.xml` (remesa ISO 20022 `pain.001.001.09`), `.csv` y `.txt` (listado del banco). **El Excel (`.xls`, `.xlsx`) aún no se lee:**
guárdalo como CSV. Un fichero se lee **entero o se rechaza** (si declara más pagos o más importe de los que trae). Se leen en el navegador y no se guardan.

**Flujo mensual:** *Cruzar Pagos* → elegir periodo y empresa → cargar el/los ficheros → *Cruzar* (una empresa por llamada, para no pasar el límite de
6 minutos) → revisar y subsanar → repetir por empresa → *Fusionar informes* (obligatorio, exige todas las empresas). El informe de cada mes vive en una hoja
de `VAP_Pagos`.

## Pruebas

```sh
npm test                                # Vitest: dominio, casos de uso, integración y arquitectura
npm run e2e -- tests/e2e/webapp.e2e.mjs # Playwright: las pantallas HTML reales contra el .gs real
npm run lint                            # Biome (solo esta carpeta y tests/webapp)
npm run sintaxis                        # node --check de todos los .gs
```

El código se carga **tal cual se despliega** (sin pies `module.exports`) en una caja de Node con dobles de
Google en memoria. **Los dobles aproximan Google, no lo sustituyen.**

## Lo que NO se prueba en automático (se comprueba a mano antes de cada despliegue)

- **Todo lo de Altas y bajas contra los libros reales**: la escritura en el maestro (pestañas y cabeceras supuestas) y en `registro_personal`; que descargar o leer un archivo funcione dentro del marco de seguridad de Apps Script.
- **La llamada entre los dos proyectos** (`UrlFetchApp` → `doPost` de `VAP_Pagos`): el despliegue real, quién puede llamar, la redirección de Google y el token. En las pruebas está unida en memoria.
- **Los tiempos de los cruces** frente al límite de 6 minutos con ficheros reales, y la lectura real de la fuente de importes (Vinculación).
- Que **escribir** en `estado_pasos` funcione con la cuenta real y que el bloqueo (`LockService`) se comporte igual que en los dobles.
- Que Sheets convierta el periodo y la hora en fechas y se lean de vuelta bien (el código lo tolera, pero solo está probado con dobles).
- Que `Session.getActiveUser()` identifique a la Responsable de Administración y a ti con el ajuste de despliegue elegido.
- Que el HTML se vea y funcione dentro del entorno real de Google (la ventana de seguridad de HtmlService).
- Que los permisos que pide el proyecto la primera vez sean los esperados.
- Que alguien que **no** está en la lista reciba «Sin acceso» con su propia cuenta.

## Siguiente

Queda: el catálogo de pasos leído de la hoja `config` (anotado en `proximos_pasos.md`), la concordancia de identidad
(OB-44), *Comprobaciones* (OB-41), el registro de diferencias (OB-42) y *Altas/bajas* (OB-46).
