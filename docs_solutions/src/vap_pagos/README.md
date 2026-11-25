# VAP_Pagos — el servicio de las cuentas y los pagos — v0.2.0

Proyecto de Apps Script **independiente**, subido a Google (no consta implementado como servicio web); la carga inicial se ejecutó en real el 25 nov 2026. Es el único sitio que conoce la **clave** con la que se calcula la huella de una cuenta
bancaria. La webapp lo llama; no al revés. Decisión: [ADR-0019](../../docs_design/adr/0019-vap-pagos-como-servicio-propio-con-huella-hmac.md) y [ADR-0020](../../docs_design/adr/0020-vap-pagos-identifica-por-dni-con-varios-id-trabajador.md) (Propuestas).
Requisitos: RF-86 … RF-99 · RF-102 · RNF-19 … RNF-23.

> **La cuenta bancaria solo existe en memoria** mientras se calcula su huella: no se escribe en hojas, registros ni mensajes de error. Se comprueba con pruebas.

## Qué hace

Una sola puerta, `doPost`, que atiende estas acciones (cada llamada trae el **token** y se rechaza sin él):

| Acción | Qué hace |
|---|---|
| `guardarCuenta` · `guardarCuentas` | Calcula la huella (HMAC-SHA256 de la cuenta, **sin** identificador ni empresa) y guarda DNI, id de trabajador, huella, últimos 4 dígitos, fecha y quién la guardó. Piden `idPersonal`, `dni`, `iban` y `usuario`. Un cambio de cuenta sustituye la anterior **en todas las filas de ese DNI**. Devuelven `avisos` si a un DNI se le añade otro id; se **rechaza** un id que ya consta con otro DNI |
| `cruzar` | Cruza los pagos de **una empresa** con las huellas y los importes esperados. Una fila por pago: **Parte 1** (la cuenta consta) o **Parte 2** (no consta, con nombre del banco, huella, últimos 4, importe y banco). Estados `Coincidente` / `Incorrecto`; las observaciones solo en los incorrectos |
| `informe` · `historialPersona` · `resumen` | Consulta. **Nunca devuelve la huella** |
| `subsanar` | Marca una fila `Incorrecto` con su resolución y motivo, **sin borrar el resultado original**; queda en `subsanaciones` |
| `fusionar` | Paso obligado: exige que estén todas las empresas del mes y deja constancia en la hoja `cierres` |
| `maestro` | Número, DNI, identificador, últimos 4 y fecha de cada cuenta registrada |

Estructura: capas por prefijo (`dominio-`, `app-`, `infra-`), igual que la webapp. Solo `doPost` es público; lo vigila `tests/pagos/arquitectura.test.js`.

## Lo que hay que crear en Google (decisiones tuyas marcadas)

> Los nombres de los menús de Google están dados de memoria y **no están verificados**: si alguno no coincide, dime qué ves.

1. **Libro `VAP_Pagos`** (Google Sheets, nuevo). Hojas **fijas**, con esta cabecera en la fila 1:
   - `huellas`: `id_pagos · dni · id_trabajador · huella · ultimos4 · actualizado_en · actualizado_por` (una fila por pareja DNI + id de trabajador; [ADR-0020](../../docs_design/adr/0020-vap-pagos-identifica-por-dni-con-varios-id-trabajador.md))
   - `subsanaciones`: `periodo · fila_id · id_pagos · momento · usuario · resolucion · asignada_a · motivo` (`fila_id` es la fila del informe; `id_pagos`, la fila de `huellas` de la persona afectada, vacío si el pago no tiene persona)
   - `cierres`: `periodo · momento · usuario · empresas · sin_resolver` (una fila por cierre de mes; no va ligada a una persona)
   - Las hojas `informe_AAAA-MM` las crea el servicio, una por mes.
2. **Proyecto de Apps Script nuevo, NO ligado al libro**, con los `.gs` de esta carpeta y `appsscript.json`. **Solo tú lo editas** (quien lo edita puede leer la clave).
3. **Propiedades del script:** `ID_LIBRO_PAGOS` (identificador del libro), `CLAVE_HUELLA` (la clave) y `TOKEN_SERVICIO` (el token compartido con la webapp).
   - La clave la generas **tú**, nunca pasa por el chat, y **su copia va al gestor de contraseñas de GALA**. Si se pierde hay que repetir la carga inicial.
4. **Implementar como aplicación web** y pasar su dirección a la webapp (`URL_SERVICIO_PAGOS`). **Decisión tuya, abierta:** «ejecutar como» y «quién tiene acceso». El token se comprueba siempre.
5. **Quién abre el libro:** tú y Sara Casillas como editores (uso normal solo por la webapp). Consecuencia: pueden ver huellas, últimos 4 dígitos y nombres de los «no existentes».

## Carga inicial de las huellas de los trabajadores actuales (uso único)

Tres ficheros temporales (`dominio-carga.gs`, `app-carga.gs`, `infra-carga.gs`) que **se borran del proyecto al terminar la carga**. Se lanzan a mano
desde el editor de Apps Script ([ADR-0020](../../docs_design/adr/0020-vap-pagos-identifica-por-dni-con-varios-id-trabajador.md)); sus dos funciones públicas son
una excepción autorizada a «solo `doPost` es público».

- **Propiedades del script que necesita:** `ID_LIBRO_PAGOS`, `CLAVE_HUELLA`, `ID_LIBRO_VAP_Personas` (el maestro) e `ID_LIBRO_CARGA_INICIAL` (el Excel de los
  trabajadores actuales, convertido a hoja de Google, temporal y solo del usuario).
- **`cargaInicialSimular`:** cruza por DNI con las tres pestañas del maestro (solo personas con `Alta`) y escribe la hoja `carga_inicial` con un resumen y las
  incidencias (DNI sin pareja, cuentas distintas, DNI mal formados, personas sin cuenta…). **No guarda nada y no marca nada.**
- **`cargaInicialEjecutar`:** guarda las huellas por lotes y **marca la casilla `Huella`** de cada persona en su pestaña de `VAP_BBDD_Personas` (por `id_trabajador`).
  Se detiene sola a los 4,5 minutos; **se vuelve a ejecutar y continúa**: lo ya guardado no se toca.
- **Hojas de detalle** (en el libro TEMPORAL del Excel, con nombre y DNI, **sin cuentas**; desaparecen al borrarlo): `repetidas_carga_inicial`,
  `dni_invalido_carga_inicial`, `id_repetido_carga_inicial` (ids que salen más de una vez en el maestro), `sin_cuenta_carga_inicial`, `sin_persona_activa_carga_inicial`, `cuentas_distintas_carga_inicial`,
  `sin_cuenta_en_excel_carga_inicial` y `con_huella_carga_inicial`. Cada una da lo necesario para subsanar: fila del Excel y del maestro,
  pestaña, empresa, cómo termina la cuenta, y una posible pareja por nombre. En `VAP_Pagos` solo quedan el resumen y los errores (`carga_inicial`).
- **Cabecera exigida en el maestro:** una columna `Huella` (casilla) en `VAP_Staff`, `VAP_Secretarias` y `VAP_Profesores`, además de `Empresa`, `id_trabajador`, `DNI` y `Alta`.
- **El Excel de la carga inicial lleva cuentas en claro:** el script solo lo lee. Al terminar se borra y se vacía la papelera.

## Pruebas

```sh
npx vitest run tests/pagos    # dominio, casos de uso, integración (Google falso) y arquitectura
```

`tests/webapp/pagos.test.js` conecta **los dos proyectos en memoria** y prueba el recorrido completo. **No se prueba en automático:** el despliegue real y su
autenticación, los tiempos frente a los 6 minutos de Google, los permisos reales del libro y el comportamiento real de `Utilities.computeHmacSha256Signature`
(los dobles usan el de Node).

> **Duplicación entre proyectos:** `dominio-importes.gs` es idéntico en `webapp/` y aquí (dos proyectos de Apps Script no comparten archivos). Una prueba comprueba que
> no divergen. La validación de IBAN también está duplicada (anotado en `docs_work/proximos_pasos.md`).
