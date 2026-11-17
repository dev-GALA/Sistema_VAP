# VAP_Pagos — el servicio de las cuentas y los pagos — v0.1.0

Proyecto de Apps Script **independiente**, sin desplegar. Es el único sitio que conoce la **clave** con la que se calcula la huella de una cuenta
bancaria. La webapp lo llama; no al revés. Decisión: [ADR-0019](../../docs_design/adr/0019-vap-pagos-como-servicio-propio-con-huella-hmac.md) (Propuesta).
Requisitos: RF-86 … RF-99 · RNF-19 … RNF-23.

> **La cuenta bancaria solo existe en memoria** mientras se calcula su huella: no se escribe en hojas, registros ni mensajes de error. Se comprueba con pruebas.

## Qué hace

Una sola puerta, `doPost`, que atiende estas acciones (cada llamada trae el **token** y se rechaza sin él):

| Acción | Qué hace |
|---|---|
| `guardarCuenta` · `guardarCuentas` | Calcula la huella (HMAC-SHA256 de la cuenta, **sin** identificador ni empresa) y guarda huella, últimos 4 dígitos y fecha. Un cambio de cuenta sustituye la anterior |
| `cruzar` | Cruza los pagos de **una empresa** con las huellas y los importes esperados. Una fila por pago: **Parte 1** (la cuenta consta) o **Parte 2** (no consta, con nombre del banco, huella, últimos 4, importe y banco). Estados `Coincidente` / `Incorrecto`; las observaciones solo en los incorrectos |
| `informe` · `historialPersona` · `resumen` | Consulta. **Nunca devuelve la huella** |
| `subsanar` | Marca una fila `Incorrecto` con su resolución y motivo, **sin borrar el resultado original**; queda en `subsanaciones` |
| `fusionar` | Paso obligado: exige que estén todas las empresas del mes y deja constancia en `fusiones` |
| `maestro` | Identificador, últimos 4 y fecha de cada cuenta registrada |

Estructura: capas por prefijo (`dominio-`, `app-`, `infra-`), igual que la webapp. Solo `doPost` es público; lo vigila `tests/pagos/arquitectura.test.js`.

## Lo que hay que crear en Google (decisiones tuyas marcadas)

> Los nombres de los menús de Google están dados de memoria y **no están verificados**: si alguno no coincide, dime qué ves.

1. **Libro `VAP_Pagos`** (Google Sheets, nuevo). Hojas **fijas**, con esta cabecera en la fila 1:
   - `huellas`: `id_personal · huella · ultimos4 · actualizado_en`
   - `subsanaciones`: `periodo · fila_id · momento · usuario · resolucion · asignada_a · motivo`
   - `fusiones`: `periodo · momento · usuario · empresas · sin_resolver`
   - Las hojas `informe_AAAA-MM` las crea el servicio, una por mes.
2. **Proyecto de Apps Script nuevo, NO ligado al libro**, con los `.gs` de esta carpeta y `appsscript.json`. **Solo tú lo editas** (quien lo edita puede leer la clave).
3. **Propiedades del script:** `ID_LIBRO_PAGOS` (identificador del libro), `CLAVE_HUELLA` (la clave) y `TOKEN_SERVICIO` (el token compartido con la webapp).
   - La clave la generas **tú**, nunca pasa por el chat, y **su copia va al gestor de contraseñas de GALA**. Si se pierde hay que repetir la carga inicial.
4. **Implementar como aplicación web** y pasar su dirección a la webapp (`URL_SERVICIO_PAGOS`). **Decisión tuya, abierta:** «ejecutar como» y «quién tiene acceso». El token se comprueba siempre.
5. **Quién abre el libro:** tú y Sara Casillas como editores (uso normal solo por la webapp). Consecuencia: pueden ver huellas, últimos 4 dígitos y nombres de los «no existentes».

## Pruebas

```sh
npx vitest run tests/pagos    # dominio, casos de uso, integración (Google falso) y arquitectura
```

`tests/webapp/pagos.test.js` conecta **los dos proyectos en memoria** y prueba el recorrido completo. **No se prueba en automático:** el despliegue real y su
autenticación, los tiempos frente a los 6 minutos de Google, los permisos reales del libro y el comportamiento real de `Utilities.computeHmacSha256Signature`
(los dobles usan el de Node).

> **Duplicación entre proyectos:** `dominio-importes.gs` es idéntico en `webapp/` y aquí (dos proyectos de Apps Script no comparten archivos). Una prueba comprueba que
> no divergen. La validación de IBAN también está duplicada (anotado en `docs_work/proximos_pasos.md`).
