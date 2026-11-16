# DUDA-0005: Cómo identificar a la persona en el fichero del banco

| | |
|---|---|
| **Estado** | 🔴 Abierta |
| **Detectada** | 7 septiembre 2026 |
| **Bloquea** | El contraste de transferencias emitidas · la creación de `VAP_BBDD_Personal` |
| **Quién puede responder** | Gerencia · quien lleve **protección de datos** en GALA · Responsable de Administración |

---

## El hallazgo

De las tres fuentes de contraste, **el banco es la única que no permite cruzar por DNI**: su fichero
solo trae el **nombre del beneficiario** y el **IBAN** ([DUDA-0004](0004-formato-de-las-tres-fuentes-de-contraste.md)).

Y el nombre es una clave mala: llega **sin eñes ni acentos**, con las **partículas desplazadas al
final** y **truncado a 28 caracteres**, lo que permite que dos personas de apellidos largos
parecidos colisionen. Cruzar por nombre **todos los meses** significa asumir ese riesgo **todos los
meses**, sobre unos 200 pagos, en el paso que comprueba que la gente ha cobrado lo que debía.

El IBAN, en cambio, es exacto y no cambia. Pero guardarlo significa **crear una tabla con nombre,
DNI y cuenta bancaria de toda la plantilla**, y ahí aparece la duda de verdad.

## Por qué importa

**No es un problema técnico, es una decisión sobre riesgo asumido.** Y tiene dos caras que conviene
no mezclar:

**La primera:** GALA **ya trata** estos datos. Nombre, DNI y cuenta están hoy en SAGE, en el banco,
en la gestoría y en el archivo donde se calcula la nómina —que además contiene los salarios, más
sensibles que un IBAN—. Ni el DNI ni el IBAN son *categoría especial* del artículo 9. La pregunta no
es «¿podemos tener estos datos?» sino **«¿cuánto riesgo añade esta tabla al que ya existe?»**.

**La segunda, que es la que pesa:** SAGE está detrás de usuario y contraseña; **un Google Sheet
tiene un botón de compartir al alcance de cualquier editor**, y un desplegable que dice «cualquier
persona de la organización». El fallo típico no es malicia: es un clic equivocado un martes por la
tarde, y nadie se entera. **El riesgo no está en el almacén, está en la superficie de
compartición.**

> Y hay un límite que no depende de ninguna de las dos: del fichero de ADESLAS **no debe copiarse la
> composición familiar**. Cónyuges e hijos no son empleados de GALA y no hay ninguna razón para que
> acaben en una hoja del sistema. Del contraste se guarda **el importe**, no quién lo compone.

## Las tres opciones, con su precio

### A · No guardar nada: cruzar por nombre cada mes

Cero datos almacenados. Es la única forma de que no se pueda filtrar lo que no existe.

**El precio:** trabajo manual recurrente sobre ~200 pagos, todos los meses, para siempre — y la
fragilidad del nombre descrita arriba, asumida cada vez.

### B · Guardar la correspondencia con el IBAN **en claro**

`VAP_BBDD_Personal` con nombre, DNI y cuenta. Cruce exacto y sin trabajo manual.

**El precio:** es exactamente el escenario que preocupa. Un error de permisos expone las cuentas
bancarias de toda la plantilla.

### C · Guardar la correspondencia con el IBAN **como huella** ⬅️ *la propuesta*

No se guarda el IBAN: se guarda `SHA-256(salt + IBAN normalizado)` y, como mucho, **los cuatro
últimos dígitos** para que una persona pueda revisar una incidencia. Cada mes llega el fichero con
los IBAN completos, se calculan las huellas al vuelo y se buscan. **El cruce funciona exactamente
igual, y es igual de exacto.**

- El `salt` vive en las **Script Properties** del proyecto, **nunca en la hoja**, con una copia
  guardada aparte: si se pierde, hay que reconstruir la tabla entera.
- Sin el salt, la huella no es reversible por fuerza bruta. **El salt es lo que hace que esto
  funcione**; sin él, el espacio de un IBAN español es lo bastante pequeño como para recorrerlo.
- Apps Script lo hace de serie con `Utilities.computeDigest`.

**Qué cambia:** si la hoja se abre por error, lo que se ve son huellas ilegibles. El daño de un
error de permisos pasa de *«se han filtrado las cuentas bancarias de la plantilla»* a *«se ha visto
una lista de nombres y DNIs»* — que sigue siendo grave, pero **es el mismo nivel de exposición que
ya tendrá `VAP_BBDD_Personas` en cuanto se le incorpore el DNI**. No se abre un frente nuevo.

> **Variante C+, que ataca de frente lo del botón de compartir:** que la correspondencia **no viva en
> ninguna hoja**. `PropertiesService` es un almacén de clave/valor **del proyecto de Apps Script**,
> no del documento: no aparece en Drive, no se puede enlazar, no sale en una búsqueda y para leerlo
> hay que ser **editor del proyecto**. Un mapa de 200-400 registros cabe de sobra, troceado en unas
> pocas claves. **Un error de permisos sobre un Sheet no puede exponer lo que no está en ningún
> Sheet.** Lo que se pierde es poder abrirlo y mirar; a cambio, el script genera un informe bajo
> demanda con los cuatro últimos dígitos, y se cierra al terminar.

### Y en cualquiera de los tres casos

Lo que es higiene y no depende de la opción elegida: acceso **solo por cuentas nominales**, nunca
«cualquiera con el enlace»; descarga, copia e impresión desactivadas para quien solo lee; la hoja en
una **unidad compartida con miembros nominales**; «compartir fuera de la organización» desactivado
a nivel de Workspace; y un **plazo de borrado** para los CSV mensuales, que son lo más peligroso de
todo esto y no tienen por qué vivir eternamente en un Drive.

## Cómo se construiría la correspondencia (opciones B y C)

El nombre sirve para **construir la tabla una vez**, no para cruzar cada mes:

1. **Una sola vez**, se cruzan los beneficiarios del banco contra el export de empleados de SAGE
   —que es de donde salen esos nombres, con el mismo truncado—. Lo que casa limpio, casa; lo dudoso
   se lista para que **una persona lo confirme a mano**.
2. De ahí sale la tabla **DNI ↔ huella de IBAN**, revisada.
3. **Desde el mes siguiente el cruce es por huella**: exacto, sin nombres, sin acentos, sin
   truncados. Solo se vuelve al nombre cuando aparece una cuenta nueva.

> **No habría que escribir el motor de nombres.**
> [`VAP_Script_Cruce_BBDD_Personas_SAGE.gs`](../../docs_solutions/src/scripts_generales/VAP_Script_Cruce_BBDD_Personas_SAGE.gs)
> ya normaliza, tokeniza, puntúa candidatos y marca `AMBIGUO` cuando varios DNIs casan con un mismo
> nombre — y ya está probado contra ese mismo formato de SAGE. Sería **reutilizarlo, no duplicarlo**
> ([CLAUDE.md](../../CLAUDE.md), la regla de no duplicar).

## Preguntas concretas

1. **¿Se asume el riesgo de guardar una correspondencia persona ↔ cuenta**, aunque sea como huella?
2. **Si se asume: ¿opción C (huella en una hoja) o C+ (huella en `PropertiesService`)?**
3. **¿Quién lleva protección de datos en GALA** y valida esta decisión? ¿Hay asesoría externa?
4. **¿Está el tratamiento recogido en el registro de actividades de tratamiento**, o habría que
   añadirlo?
5. **¿Cuánto se conservan los ficheros mensuales del banco** una vez hecho el contraste?
6. Si la respuesta es **no guardar nada** (opción A): ¿quién revisa cada mes las coincidencias
   dudosas, y cuánto tiempo está dispuesto a dedicarle?

## Qué hace falta para cerrarla

- [ ] Decisión de Gerencia sobre qué opción se adopta
- [ ] Validación de quien lleve protección de datos
- [ ] Si se adopta C o C+: decidir dónde se custodia el `salt` y quién tiene copia
- [ ] Comprobar los permisos actuales de los libros del sistema y de la unidad de Drive
- [ ] Fijar el plazo de conservación de los ficheros mensuales

---

## Respuesta

> *(pendiente)*

## Decisión y acciones derivadas

> *(pendiente — decida lo que decida, **esto tiene que acabar en un ADR**: es exactamente el tipo de
> decisión que dentro de un año nadie recordará por qué se tomó)*

## Actualización · 16 noviembre 2026

La propuesta del desarrollo, **pendiente de validar con Gerencia y protección de datos**, es una cuarta vía
que combina las opciones 2 y 3: guardar **solo una huella de la cuenta** (nunca la cuenta), en un libro
aparte, `VAP_Pagos`, junto al `id_personal` y **sin el DNI**.

- La huella se calcula con una **clave secreta** guardada en la configuración del script, y **no incluye el
  identificador de la persona**, así que un cambio de empresa no la altera.
- Entra al dar de alta a la persona (pantalla *Altas/bajas*) y, **una sola vez**, en una carga inicial a
  partir del fichero completo del banco, con confirmación humana.
- Cada mes, el fichero del banco se cruza por la huella solo entre personas **activas**; lo que no se
  reconoce o es ambiguo se reporta como **no cruzado**.
- En la muestra, la identificación **por empresa y nombre** funcionó en 10 de 10 pagos, pero son demasiado
  pocos para decidir por ellos.

Diseño en [fuentes_de_contraste.md](../docs_cruce/fuentes_de_contraste.md) §12; requisitos RF-86 a RF-89, RNF-19
y RNF-20; trabajo en OB-36 y OB-45. **Sigue abierta**: falta la decisión y un ADR. Las decisiones de seguridad
(algoritmo, dónde se guarda la clave, quién abre el libro, copia de la clave, plazo de conservación) se firman
una a una antes de crear nada.
