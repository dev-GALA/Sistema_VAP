# Webapp del proceso mensual — v0.1.0 (esqueleto)

La primera pantalla del sistema para Administración: **Proceso mensual**, **Comprobaciones**,
**Registro de diferencias**, **Altas/bajas** y **Maestro de personal**.

> **Esta versión es un esqueleto, de solo lectura.** Existen las cinco pantallas y el acceso por rol, pero
> solo *Proceso mensual* muestra datos (los pasos del mes y su estado). **Nada escribe en ninguna hoja.**

Decisiones: [ADR-0017](../../docs_design/adr/0017-webapp-del-proceso-mensual-stack-y-estructura.md)
(stack y estructura) y [ADR-0018](../../docs_design/adr/0018-gsh-propio-de-la-webapp-propietario-y-accesos.md)
(libro propio, propietario y accesos). Ambos están en estado **Propuesta**.

## Estructura

Apps Script no tiene carpetas: el prefijo del archivo dice su capa, y **las dependencias apuntan hacia dentro**.

| Capa | Archivos | Qué hay |
|---|---|---|
| `dominio-` | `periodo`, `pantallas`, `acceso`, `pasos` | Reglas puras. Sin servicios de Google |
| `app-` | `contexto`, `proceso-mensual` | Casos de uso. Las dependencias llegan inyectadas |
| `infra-` | `configuracion`, `hojas`, `principal` | Hojas, propiedades y el punto de entrada (`doGet` y las `api…`) |
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

**Hoja `estado_pasos`** — el estado de cada paso; en la v1 solo se lee. Déjala **vacía, solo con la cabecera**:

| periodo | paso_id | estado | actualizado_por | actualizado_en |
|---|---|---|---|---|

- `periodo` con formato **Texto sin formato**, para que Sheets no convierta `2026-11` en una fecha (el código
  lo tolera, pero así es más limpio).
- `estado` admite `pendiente`, `hecho` o `con-incidencias`.
- `paso_id` es uno de: `actualizar-export-sage`, `actualizar-bbdd-personas`, `comprobar-concordancia`.

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

- Que `Session.getActiveUser()` identifique a la Responsable de Administración y a ti con el ajuste de despliegue elegido.
- Que el HTML se vea y funcione dentro del entorno real de Google (la ventana de seguridad de HtmlService).
- Que los permisos que pide el proyecto la primera vez sean los esperados.
- Que alguien que **no** está en la lista reciba «Sin acceso» con su propia cuenta.

## Siguiente

La v1 deja el terreno listo para: escribir el estado de los pasos (OB-22), la concordancia de identidad
(OB-44), *Comprobaciones* (OB-41), el registro de diferencias (OB-42) y *Altas/bajas* (OB-46).
