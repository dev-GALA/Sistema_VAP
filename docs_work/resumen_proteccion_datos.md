# Resumen para Gerencia y protección de datos — Pagos y cuentas bancarias (VAP)

*17 noviembre 2026 · Propuesta pendiente de validar · Ficha técnica: [ADR-0019](../docs_solutions/docs_design/adr/0019-vap-pagos-como-servicio-propio-con-huella-hmac.md)*

## Qué se quiere hacer

Cada mes el banco emite un fichero con las transferencias de nómina. Hoy **nadie comprueba** que lo pagado es lo calculado.
Para hacerlo hay que saber **a qué persona corresponde cada cuenta**. Se propone **no guardar nunca la cuenta bancaria**, sino
una **huella**: un código que identifica la cuenta pero **de la que no se puede volver a la cuenta**.

## Qué se guarda y dónde

| Dato | Dónde | Comentario |
|---|---|---|
| Nombre, DNI | Maestro de personas (como hoy) | No cambia |
| **Huella** de la cuenta, **últimos 4 dígitos** y fecha, junto al identificador de la persona | Libro `VAP_Pagos` | **Sin DNI ni nombre** de las personas registradas |
| Marca «tiene cuenta registrada» (sí/no y fecha) | Maestro de personas | **Sin la huella ni la cuenta** |
| Informe mensual de pagos | `VAP_Pagos` | Pagos que no se reconocen llevan **nombre del beneficiario según el banco**, huella, últimos 4 dígitos, importe y entidad |
| **Clave secreta** con la que se calcula la huella | Proyecto de programación de `VAP_Pagos` | Copia en el **gestor de contraseñas de GALA** |

## Qué NO se guarda

- **La cuenta bancaria completa**: solo existe en memoria mientras se calcula la huella. No va a registros ni a mensajes de error.
- La huella **no se muestra** en pantalla. Nombre y DNI se consultan al maestro **en el momento** y no se copian a `VAP_Pagos`.
- El sistema **no guarda los ficheros del banco**.

## Quién puede ver qué

- **Libro `VAP_Pagos`:** el desarrollador y la Responsable de Administración, ambos editores. **Uso normal, solo desde la webapp**;
  abrir el libro es excepcional. **Ambos pueden ver huellas, últimos 4 dígitos y nombres de los pagos no reconocidos.**
- **Clave y programa de `VAP_Pagos`:** solo el propietario del proyecto (el desarrollador).
- La webapp comprueba en el servidor el acceso de cada persona.

## Riesgos y medidas

| Riesgo | Medida |
|---|---|
| Que se filtre el libro por un clic de compartir equivocado | No hay cuentas completas: solo huellas (inútiles sin la clave) y 4 dígitos. Acceso por cuentas nominales |
| Que alguien lea la clave | Está en un proyecto aparte, no en la webapp; solo la ve su propietario |
| **Perder la clave** | Copia en el gestor de contraseñas; sin ella hay que repetir la carga inicial |
| **Ficheros con cuentas en claro** (los del banco y el Excel de altas) | Los **borra el usuario a mano** cuando proceda; el Excel de altas, al verificar la carga. **No hay borrado automático: quedan en Drive hasta entonces** |
| Una confirmación equivocada asocia una cuenta a otra persona | Se comprueba el importe y una persona confirma; se puede anular |

## Qué no se ha probado todavía

La conexión entre la webapp y el proyecto de `VAP_Pagos`, los permisos y los tiempos **en Google real**. Todo lo demás se ha
probado con datos inventados.

## Qué se pide validar

1. ¿Se acepta guardar la **correspondencia persona–cuenta como huella**, con los **últimos 4 dígitos**?
2. ¿Se acepta que, en los pagos no reconocidos, se guarde el **nombre del beneficiario** del banco?
3. ¿Se acepta que **dos personas** (desarrollador y Responsable de Administración) puedan ver ese libro?
4. ¿Cuánto tiempo se **conservan los informes mensuales**?
5. ¿Consta este tratamiento en el **registro de actividades de tratamiento**, o hay que añadirlo?

**Hasta que se responda, no se cargan datos reales.**
