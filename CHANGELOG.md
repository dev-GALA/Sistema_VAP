# Changelog

Todos los cambios relevantes de **Sistema VAP** se documentan en este archivo.

El formato sigue la convención de [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
Las decisiones de arquitectura que respaldan estos cambios están en [`docs_solutions/docs_design/adr/`](docs_solutions/docs_design/adr/README_ADR.md);
el diseño del sistema, en [`docs_solutions/docs_design/SSD.md`](docs_solutions/docs_design/SSD.md); el estado de cada requisito, en [`requisitos_funcionales.md`](docs_discovery/requisitos_funcionales.md).

---

## [Sin publicar] · Lista única de empresas y casillas de `Alta` en el maestro (hecho en Google, sin código)

### Hecho en `VAP_BBDD_Personas` (libro real; no hay cambio de código ni de scripts)
- **Lista de empresas cerrada en 11** y escrita **una sola vez** en `Config` (A5 `Empresas`, B5 la lista separada por comas), con una **celda auxiliar** (`G1`/`G2`) que la reparte en vertical. Fórmula **verificada en el libro real**: nombres de función **en inglés** y separador de argumentos **`;`** → `=TRANSPOSE(SPLIT(B5;","))`.
- Los desplegables de **`VAP_Staff`, `VAP_Secretarias` y `VAP_Profesores`** leen ahora de `Config!G2:G30` y no de una lista escrita a mano en cada regla.
- **`Alta` pasa a casilla** en `VAP_Secretarias`. `VAP_Staff` ya la tenía.
- En `VAP_Staff`, **«CTM MOTOR INTEGRAL SLU» se unifica como «MOTOR INTEGRAL»** (empresa e `id_trabajador`) con buscar y reemplazar en esa hoja. **Pasos dados; el resultado (8 cambios) no se ha confirmado.**

### Decidido
- **La comprobación de concordancia SAGE ↔ maestro es mensual**, en este orden: maestro, export de SAGE, cruce. **Opcional por ahora y obligatoria en el futuro** ([RF-80](docs_discovery/requisitos_funcionales.md), HU-46).
- **Una persona puede estar en dos empresas** (sobre todo en Staff): dos filas, cada una con su `id_trabajador`.
- **Nombre canónico `MOTOR INTEGRAL`**; JOSE, CASTA y NESSUN entran en la lista.

### Cambiado (documentación)
- [`problem.md`](docs_discovery/problem.md) 0.4, [`historias_usuarios.md`](docs_discovery/historias_usuarios.md) 0.7 (HU-46, HU-47), [`requisitos_funcionales.md`](docs_discovery/requisitos_funcionales.md) 0.9 (RF-80, RF-100 → 🟡, RF-101 con el inventario de scripts) y SSD 2.2 (riesgo **R-30**: tres grafías de una misma empresa).
- El **resumen de `requisitos_funcionales.md`** decía 99 requisitos y hay **101**: corregido (25 cumplidos, 10 parciales, 65 no cumplidos, 1 en decisión).
- `valor_dev.md` 0.4: revisión sin cifras nuevas. `proximos_pasos.md` 0.12: bloque «Pendientes del 19 nov 2026».

### Pendiente
- Tabla única de **equivalencias de nombre de empresa**, el **cruce mensual** (dónde vive y qué es incidencia con una persona en dos empresas), lista de **tipos de Staff**, las **demás pestañas** con empresa y retirar la columna E antigua de `Config`. Ver `proximos_pasos.md`.

---

## [Sin publicar] · El maestro de personas real obliga a rehacer Altas/bajas (documentado, sin código)

### Descubierto
- Al ver `VAP_BBDD_Personas`: una pestaña **por tipo** (Staff, Secretarías, Profesores), `Empresa` como columna, nombre en una sola columna («APELLIDOS, NOMBRE») y `id_trabajador` = `EMPRESA_IdSage`. **La v0.3.0 de Altas/bajas supuso otra estructura** y hay que rehacerla; mientras no esté configurada, **no escribe**.

### Añadido
- **RF-100** (listas únicas de empresas y tipos, en `Config` del maestro, clave y valor separados por comas) y **RF-101** (cabeceras homogéneas, `Alta` como casilla, `Fecha_Alta`/`Fecha_Baja` y `Observaciones` en todas, marca de cuenta), ambos en HU-47, con una condición nueva en sus criterios.
- `proximos_pasos.md`: bloque **«Pendientes del 17 nov (tarde)»** con las decisiones tomadas, ocho puntos sin resolver y lo que hay que rehacer en la webapp.

### Pendiente
- Cerrar la lista de empresas (7 en `Config`, 9 en el desplegable de Staff) y el resto de puntos antes de tocar el código.

---

## [Sin publicar] · `VAP_Pagos` y el cruce de pagos: diseño documentado

### Añadido (código, sin desplegar)
- **Servicio `VAP_Pagos` v0.1.0** (`docs_solutions/src/pagos/`): proyecto de Apps Script propio con la huella HMAC-SHA256 de la cuenta, los últimos 4 dígitos, el cruce por empresa en dos partes (*Coincidente*/*Incorrecto*), la subsanación sin sobrescribir, la fusión obligatoria y el historial. Token en cada llamada. 68 pruebas.
- **Webapp v0.4.0**: submenú **Pagos** con *Cruzar Pagos*, *Históricos de Pagos*, *Maestro de Pagos* y *Carga inicial de cuentas*; lectura de ficheros del banco **XML (ISO 20022), CSV y TXT** que se rechazan si no cuadran con lo que declaran; marca `cuenta_en_pagos` en el maestro. **La webapp ya no calcula huellas ni conoce la clave.** Pruebas que unen los dos proyectos en memoria y 12 de Playwright.
- `biome.json` ampliado a los proyectos nuevos.

### Añadido
- **[ADR-0019](docs_solutions/docs_design/adr/0019-vap-pagos-como-servicio-propio-con-huella-hmac.md)** (Propuesta): `VAP_Pagos` como **proyecto de Apps Script propio**, huella **HMAC-SHA256** de la cuenta con la clave solo en ese proyecto (copia en el gestor de contraseñas de GALA), últimos 4 dígitos junto a la huella, libro editable por el desarrollador y la Responsable de Administración.
- **Historias HU-49 y HU-50, requisitos RF-90 a RF-99 y RNF-21 a RNF-23**: cruce de pagos por empresa con XML, CSV o Excel; informe en **dos partes** (*Coincidente*/*Incorrecto* y «no existen»), subsanable sin sobrescribir; histórico por año y mes; Maestro de Pagos; marca `cuenta_en_pagos` en `VAP_Personas`. Objetivo **OB-47**.
- [`docs_work/resumen_proteccion_datos.md`](docs_work/resumen_proteccion_datos.md): una página para Gerencia y protección de datos.
- SSD: riesgos **R-28** (conexión entre webapp y `VAP_Pagos` sin verificar) y **R-29** (cuentas en claro en los ficheros del banco hasta que se borren).

### Cambiado
- **RF-88** y **HU-48**: lo que no se reconoce ya no es «no cruzado», va a la **Parte 2 («no existen»)** del informe. **RNF-20** reescrito (libro con dos editores, clave solo en el proyecto). DUDA-0005, OB-45, OB-46, [ADR-0018](docs_solutions/docs_design/adr/0018-gsh-propio-de-la-webapp-propietario-y-accesos.md) y SSD actualizados.
- **La clave de la huella deja de estar en la webapp** (decisión; el código de la v0.3.0 aún la tiene en `CLAVE_HUELLA`, anotado en OB-46).

### Pendiente
- Firma de Gerencia y de protección de datos antes de cargar datos reales. (`*.xml` ya está en `.gitignore`: la remesa real del banco ya no se puede subir por error.)

---

## [2026-11-17] · Webapp desplegada en pruebas, grupos de pasos, submenú y marca de pasos manuales

### Añadido
- **Webapp v0.2.0 desplegada** (con `clasp`, desde su carpeta; `.clasp.json` por proyecto y fuera de git).
- **Submenú «Gestión Personal»** (Altas/bajas y Maestro de personal) y **grupos de pasos**: *Acciones 1* (1.1 Actualizar VAP BBDD Personas, 1.2 Comprobar id_trabajador y DNI) y el paso 3 (Export SAGE Laboral).
- **Marcar un paso manual como realizado**, con confirmación, quién y cuándo (**primera escritura de la webapp**: una fila en `estado_pasos`, bajo bloqueo y comprobada en el servidor). El 1.2 («Comprobar») se activa al realizar el 1.1; la comprobación en sí aún no existe (OB-44).

- **Webapp v0.3.0 · Altas/bajas** (HU-47, HU-48; RF-82, RF-84, RF-85, RF-86, RF-87; RNF-19): alta o baja **a mano** y por **plantilla CSV** con previsualización, corrección y verificación por fila (y «verificar todos»). Escribe en el maestro de personas y, con cuenta, **solo la huella** (HMAC con clave secreta) en `VAP_Pagos`; cada paso queda en `registro_personal` **sin DNI, nombre ni cuenta**. **Se niega a guardar mientras no esté configurado** (empresas, libros y clave en `config` y propiedades del script). Pestañas y cabeceras del maestro **supuestas**, sin ver el libro real.
- Pruebas: +25 de Playwright y +90 de Vitest (validación de DNI/NIE y IBAN, casos de uso, integración contra libros falsos). Se comprobó que detectan un volcado de la cuenta al registro.

### Cambiado
- El catálogo de pasos cambia de orden y de textos; «Hecho» se muestra como «Realizado».

---

## [2026-11-16] · Webapp del proceso mensual (esqueleto), verificación con ficheros reales y requisitos de Comprobaciones, Altas/bajas y `VAP_Pagos`

### Añadido
- **Webapp del proceso mensual v0.1.0** en [`docs_solutions/src/webapp/`](docs_solutions/src/webapp/README.md): cinco pantallas (Proceso mensual, Comprobaciones, Registro de diferencias, Altas/bajas y Maestro), **solo lectura**, con acceso por rol comprobado en el servidor y la lista de correos en la hoja `config` de su **libro propio**. 396 líneas de `.gs` en tres capas y 315 de HTML. **Sin desplegar.**
- **ADR-0017** (stack y estructura de la webapp) y **ADR-0018** (libro propio, propietario y accesos), ambos en **Propuesta**; índice de ADR y SSD (§4, §5, §7.7, riesgos R-22 a R-27 y §12).
- **Pruebas de la webapp:** 97 de Vitest (dominio, casos de uso, integración y una **prueba de arquitectura**) y 9 de Playwright. Se comprobó que detectan seis roturas hechas a propósito. Suite completa: 1.790 de Vitest (41 son defectos conocidos) y 202 de Playwright.
- **Biome 2.6.3** (`npm run lint`, `npm run formato`), limitado a la webapp y sus pruebas.
- **Historias HU-42 a HU-48, requisitos RF-72 a RF-89 y RNF-18 a RNF-20** (Comprobaciones, Proceso mensual, concordancia de identidad, Altas/bajas, `VAP_Pagos` y la huella de la cuenta bancaria); objetivos OB-40 a OB-46.
- **Análisis con ficheros reales** (solo cifras): ADESLAS cuadra consigo mismo, 56 de 71 titulares cuadran con la Vinculación, el export de SAGE no trae DNI y las ayudas de COBEE llegan vacías. En [`fuentes_de_contraste.md`](docs_work/docs_cruce/fuentes_de_contraste.md) §9 a §12 y en las actualizaciones de DUDA-0004, 0005 y 0006.

### Cambiado
- `problem.md` v0.2: lo visto con ficheros reales, el actor «quien exporta de SAGE», tres restricciones nuevas, dos anti-objetivos nuevos y las preguntas abiertas y resueltas.
- `valor_dev.md` re-medido: de 255 – 356 h (≈ 21.000 €) a **364 – 521 h (≈ 30.300 €)**. **El salto es sobre todo corrección**: la suite de pruebas del 14 nov no estaba en la cifra. El trabajo del 16 nov son ≈ 49 – 75 h.
- `tests/soporte/cargar-gs.js` y `tests/e2e/arnes.mjs`: opción `raiz` para cargar otro proyecto (compatible: los 193 e2e existentes siguen pasando).
- `README.md`, `CLAUDE.md` (recuento de pruebas, `npm run lint`, fila de la estructura estándar) y `proximos_pasos.md` (OB-20, OB-36, OB-40 a OB-46 y el bloque «Pendientes del 16 nov»).

### Corregido
- **DUDA-0006:** los datos de la Vinculación empiezan en la **fila 7**, no en la 9.
- Enlaces de `fuentes_de_contraste.md` al `README.md` de `docs_cruce/`, que se borró: ahora apuntan al de `migration_data/`.
- Un identificador real de persona usado como ejemplo se sustituyó por uno inventado.

### Pendiente (ver `proximos_pasos.md`)
- Crear el libro `VAP_Webapp`, el proyecto de Apps Script y desplegar; decisiones de seguridad de la webapp y de `VAP_Pagos`; `clasp`; si se abre un sprint nuevo para OB-45; qué hacer con los ficheros reales de `docs_cruce/`.

---

## [2026-11-14] · Nombre de `proximos_pasos.md`, skills, LICENSE y `.gitignore`

### Cambiado
- `docs_work/retomar_trabajos.md` pasa a llamarse **`docs_work/proximos_pasos.md`**, igual que en el resto de repos de dev.
- `docs_work/migration_data/` pasa a ser carpeta **solo de datos, ignorada por git**; el script de cruce se mudó a `docs_solutions/src/scripts_generales/` (OB-32, a medias).
- `CLAUDE.md`: sección «Normas globales y skills de desarrollo».

### Añadido
- **`LICENSE`** propietaria, a imagen de la de BUCA, con la cláusula de datos personales y de nómina.
- **`.claude/skills/`** con las skills de desarrollo (incluida `dev-licencia`).
- **`.gitignore`** (OB-37 cerrado): carpeta de datos, exports tabulares y configuración local.

- **ADR:** línea `Requisitos:` en la plantilla y en los 16 ADR (OB-31, a medias); notas del índice sobre ADR-0011 y RF-21; SSD §12 con 16 filas.
- **SSD §7.6** y fila en el README para el script de cruce (OB-32 cerrado).

- **Extensión `.gs`** en todo el código de Apps Script (6 `.js` y el backend de complementos, que no tenía extensión), para pasarlo al proyecto tal cual. `backup_old_js/` se queda en `.js`: son copias históricas que no se despliegan. Node no acepta `--check` sobre `.gs`: se usa `node --check < fichero.gs`.

- **`scripts/verificar_trazabilidad.py`** y sus 11 pruebas (`unittest`): comprueba JS → HU → RF, RNF → RF/J-nn, que cada ADR declare requisitos y figure en el índice y en SSD §12, que ningún ID citado esté sin definir y que no haya enlaces rotos. Primera ejecución: **0 errores, 18 avisos**.
- **Pruebas de todo el código de `src/`** (14 nov 2026): `tests/` con Vitest (28 ficheros, **1.652 pasan + 41 defectos documentados**) y Playwright (**193**), sobre los 7 `.gs` y los 5 HTML. Los `.gs` **no se modifican**: se cargan en una caja de Node con dobles de Google (`tests/soporte/`). Generadas con cuatro agentes en paralelo y verificadas ejecutando toda la suite. Salen **~50 defectos** que **no se han corregido**; están en `docs_work/proximos_pasos.md` (DEF-01 … DEF-31).
- **`docs_work/docs_cruce/fuentes_de_contraste.md`**: formato de ADESLAS, COBEE y banco y cómo se cruzan con el libro (familiares de ADESLAS por certificado, no por DNI). Sin datos personales.
- **Skill `dev-pruebas`** (global y en `.claude/skills/`): niveles, FIRST, pruebas de Apps Script en Node, blindaje y plantillas.

### Eliminado
- `.claude/settings.local.json` deja de estar versionado (sigue en el disco local).

---

## [2026-09-25] · Reglas de entrada en `VAP_Profesores`, y revisión del commit v2.3

**Varios profesores no aparecían en el formulario.** Su columna `Alta` contenía el **texto** "TRUE"
en lugar del valor verdadero: en pantalla se ven igual, pero el script de sincronización compara con
`=== true` y los descartaba sin avisar. No era un fallo del código, sino de la entrada de datos. Por
eso se ha corregido en la hoja, y los scripts no cambian.

### Cambiado · en la hoja `VAP_Profesores` (fuera del repositorio)

- **`Alta`** pasa a ser **casilla de verificación** en `G2:G`, rechazando cualquier otro valor.
- **`ID_Profesor`** deja de escribirse a mano: lo **calcula una fórmula** en `C2` como
  `Empresa_Id_Sage`, y lo deja vacío si falta alguno de los dos.
- **`Empresa`** se elige de un **desplegable** en `A2:A`, rechazando lo que no esté en la lista.

Documentado en [SSD §6.1.0](docs_solutions/docs_design/SSD.md#610-reglas-de-entrada-de-vap_profesores)
y, para quien mantiene la hoja, en el paso 1 de [FLUJO.md](docs_work/flujo_doc/FLUJO.md).

### Añadido

- **Riesgo R-21** en el [SSD](docs_solutions/docs_design/SSD.md): como el ID se deriva de la
  empresa, **editar la empresa de un profesor cambia su ID** y desvincula sus respuestas anteriores.
  Se cubre por procedimiento: baja y fila nueva.
- **OB-37** en [`proximos_pasos.md`](docs_work/proximos_pasos.md): el repositorio **no tiene
  `.gitignore`**, y `.claude/settings.local.json` está versionado.
- **OB-38**: blindar las hojas de personal. Hecho en `VAP_Profesores`; falta `VAP_Secretarias` y
  que los scripts **avisen** de un `Alta` mal escrito en lugar de descartarlo en silencio.

### Revisado

- **Revisión del commit v2.3.** Sin datos personales en el diff, 0 enlaces rotos y todos los `.js`
  pasan `node --check`. Lo que encontró se ha anotado en OB-31 (las ADR 0015 y 0016 no están en la
  matriz de trazabilidad del SSD, y la plantilla de ADR no tiene sección de requisitos), en OB-32
  (la cabecera del script de cruce anuncia tres hojas y crea cuatro) y en OB-37.

### Corregido

- **SSD:** la estructura de `VAP_Profesores` ahora incluye la columna `DNI`, y la cabecera
  `Tipologia_Profesor` aparece sin tilde, como está en la hoja. La referencia a los ADR llega hasta
  la 0016, no hasta la 0012. La fecha de actualización se había quedado en junio.
- **[DT-11](docs_work/dudas/deuda-tecnica.md):** `Tipologia_Profesor` está en la columna **F**, no en
  la E.

---

## [2026-09-07] · Las tres fuentes de contraste, y la regla de los datos personales

**El último paso del sistema empieza a tener forma.** Han llegado los tres documentos con los que
contrastar lo que el VAP calcula —relación de asegurados de **ADESLAS**, consumos de **COBEE** y
transferencias emitidas del **banco**— y se ha abierto en lectura
`VINCULACIÓN GASTOS PERSONAL 2026` para comprobar si el cruce por DNI tiene los dos extremos.

**Los tiene.** La columna `DNI` existe en Vinculación y las tres fuentes ya tienen columna propia.

> **Ningún dato personal ha entrado en el repositorio, y no debe entrar.** Lo que se documenta aquí
> es el **formato** de cada fuente: cabeceras, reglas de fusión, recuentos y porcentajes. Nunca una
> fila real.

### Añadido

- **[CLAUDE.md](CLAUDE.md) · segunda regla: los datos personales nunca entran en el repositorio.**
  DNI/NIE, IBAN, email personal, fecha de nacimiento e importes nominativos —de empleados **y de sus
  familiares**— quedan fuera del control de versiones, también como ejemplo dentro de un `.md`.
  Git no olvida: borrar del árbol no saca del historial, así que la regla se aplica **antes** de
  escribir.

- **Tres fichas de duda nuevas**, que se leen juntas:

  | Ficha | Qué recoge |
  |---|---|
  | [DUDA-0004](docs_work/dudas/0004-formato-de-las-tres-fuentes-de-contraste.md) | El **formato** de ADESLAS, COBEE y banco |
  | [DUDA-0005](docs_work/dudas/0005-identificar-a-la-persona-en-el-fichero-del-banco.md) | Cómo **identificar a la persona** en el fichero del banco, y a qué riesgo obliga |
  | [DUDA-0006](docs_work/dudas/0006-que-contienen-las-columnas-de-contraste-de-vinculacion.md) | Qué contienen hoy las **columnas de contraste** de Vinculación |

- **Sprint 1 · Contrastar el VAP con fuentes externas**, en
  [`proximos_pasos.md`](docs_work/proximos_pasos.md), con **OB-35** (los tres lectores
  normalizadores) y **OB-36** (resolver la identificación en el fichero del banco).

### Averiguado

- **El mapa de columnas de Vinculación.** La cabecera está en la **fila 8**, no en la 1: encima hay
  tablas de parámetros y tarifas. `DNI` en la **D**, `ADESLAS` en la **G**, `COBEE COMIDA` en la
  **H**, `COBEE TRANSPORTE` en la **I**; el libro va de la **A a la CN**, coherente con el rango
  `AC..CN` que ya describía [FLUJO.md](docs_work/flujo_doc/FLUJO.md). El `DNI` viene en el mismo
  formato que ADESLAS y COBEE: **el cruce no necesita normalizar**.

- **ADESLAS trae una fila por asegurado, no por empleado.** Se fusiona por `Certif.`, que es el DNI
  del titular sin letra ni cero inicial — **pero `Certif.` agrupa, no identifica**: los NIE pierden
  también la letra inicial y hay un certificado que es el número de póliza. El DNI se toma del
  `NIF` de la fila `TITULAR`.

- **COBEE es la fuente más limpia**: una fila por trabajador y columna `DNI` propia.

- **El banco no permite cruzar por DNI**: solo nombre e IBAN, y el nombre llega sin eñes, con las
  partículas al final y truncado a 28 caracteres.

### Pendiente de arreglar en origen

Dos de los tres ficheros vienen mal servidos, y **no se arregla programando**:

- **El del banco no es la remesa.** Declara 208 pagos y trae 10 filas.
- **El de COBEE llega con la codificación rota y sin saltos de línea.**

Y en Vinculación, las columnas `ADESLAS`, `COBEE COMIDA` y `COBEE TRANSPORTE` **hoy no contienen
importes** — hay incluso nombres de empresa escritos en las de COBEE. Es lo que bloquea OB-12.

### Cambiado

- **Renumerados los sprints** al entrar el nuevo por arriba: 1→2, 2→3, 3→4, 4→5, 5→6. Los `OB-xx`
  **no se renumeran** — identifican, no ordenan. **OB-11** y **OB-12** se mudan al Sprint 1, y el
  antiguo sprint de verificación pasa a llamarse **Sprint 6 · Lo que hay que pedir y preguntar**.
- **OB-01** pasa a 🟡 *a medias*: los tres documentos han llegado, pero dos vienen incompletos.
- Repuestas las citas rotas por la renumeración en
  [`requisitos_funcionales.md`](docs_discovery/requisitos_funcionales.md) y
  [`requisitos_no_funcionales.md`](docs_discovery/requisitos_no_funcionales.md).

### Corregido — auditoría de dos pasadas

Repetida antes de cerrar, según la regla del [CLAUDE.md](CLAUDE.md). **Estructura: sin hallazgos**
—41 documentos, cero enlaces rotos, cero anclas rotas, índices completos, nomenclatura correcta y
numeración de `OB`, `RF`, `RNF` y `DT` sin huecos ni duplicados—. En **coherencia** aparecieron cinco:

- **El Sprint 2 se declaraba 🔴 pendiente en su titular y 🟡 en curso en la tabla resumen.** Ahora
  🟡 en los dos sitios, y los siete titulares de sprint llevan su estado: antes solo lo llevaban tres.
- **El [README](README.md) anunciaba `ADR-0001 … ADR-0014`** cuando hay **dieciséis**.
- **`docs_work/migration_data/` no figuraba en el árbol del README**, existiendo desde el 7 de
  septiembre.
- **El [SSD](docs_solutions/docs_design/SSD.md) llamaba `requisitos.md`** —cuatro veces— a un archivo
  que se partió en dos en OB-33. Los enlaces apuntaban bien; el nombre, no.
- **OB-32 afirmaba que el script de cruce no consta «ni en el CHANGELOG»**, y desde hoy sí consta.

Y uno que **no se subsana aquí**, anotado como próximo paso en **OB-02**: [FLUJO.md](docs_work/flujo_doc/FLUJO.md)
sigue marcando el bloque 4 como 🔍 *sin verificar* y da `Hoja 1` como destino, pero el libro tiene
**varias pestañas** con la misma estructura. Cuál es la buena se decide con la Responsable de
Administración, no desde aquí — así que la marca 🔍 se queda hasta entonces.

---

## [2026-09-07] · Cruce de la BBDD de personas con SAGE

**Migración de datos, no cambio de sistema.** Se cruza la BBDD de personas del sistema
(`VAP_BBDD_Personas`) con el export de empleados de SAGE para **asignar el DNI**, que hasta hoy no
figuraba en ninguna de las dos hojas, y de paso revisar el `Id_Sage` y la empresa de cada persona.

**Nada se ha escrito en producción.** `VAP_BBDD_Personas` queda intacto: el resultado vive en un
libro aparte, en la misma carpeta de Drive.

### Añadido

- **`docs_work/migration_data/VAP_Script_Cruce_BBDD_Personas_SAGE.js`** — el motor del cruce, en una
  carpeta nueva `docs_work/migration_data/` para el código de migración de datos, que no es parte
  del sistema en ejecución y no debe mezclarse con `docs_solutions/src/`.

  Escrito como Apps Script ejecutable desde el propio Spreadsheet, con toda la configuración en
  constantes al principio del archivo ([CLAUDE.md](CLAUDE.md), principio SOLID-D): identificadores
  de hojas, tabla de empresas, colores, umbrales y patrones son datos, no lógica. Genera cuatro
  hojas y no modifica ninguna existente.

- **Libro de resultados en Drive**, en `D. Data Sistema VAP` junto al original:
  [`VAP_BBDD_Personas_CRUCE`](https://drive.google.com/file/d/1Qq4hI4GKz-YJ8rDL9Tk02umhSFIvc-tD/view)
  (formato `.xlsx`, se abre y edita en Google Sheets). Cuatro hojas:

  | Hoja | Filas | Contenido |
  |---|---|---|
  | `VAP_Secretarias_CRUCE` | 111 | Copia con DNI y datos de SAGE. **108 con DNI** |
  | `VAP_Profesores_CRUCE` | 294 | Ídem. **289 con DNI** |
  | `VAP_Staff` | 293 | Personal de alta en SAGE que no es secretaria ni profesor |
  | `VAP_Cruce_Incidencias` | 596 | Todo lo que no cuadra, con su tipo y el dato que difiere |

  **397 de las 405 filas de la BBDD quedan con DNI (98%).** Las 8 restantes no están en SAGE.

- **Hoja `VAP_Staff`** (nombre provisional): 293 filas y 269 personas de alta en SAGE que no
  aparecían en ninguna de las dos hojas — gerencia, administración, responsables de complementos,
  limpieza— más los colaboradores de la serie ≥1000. Con la misma estructura de columnas que las
  otras dos, para que encaje sin retoques si algún día alimenta al sistema.

### Corregido en los datos

Lo detectado por el cruce. **Corregido en las hojas copia, no en producción**:

- **La empresa `JOSE` no existe en SAGE.** Sus 11 filas eran todas erróneas: cinco personas reales
  que en SAGE son `GALA 283`, `GALA 1094`, `VALDEARROYOS 255`, `CERVANTES 644` y `VALDEARROYOS 260`;
  cuatro que no están en SAGE; y dos filas de limpieza que no son nómina. De aquí salían **12 de las
  20 discrepancias** de empresa e `Id_Sage`.
- **Colisión de identificador resuelta**: `JOSE_10` designaba a dos personas distintas en las dos
  hojas. Al corregir la empresa desde SAGE, la colisión desaparece.
- **`INTERCASTILLA`**: `ALONSO ARROYO, JUAN` es en realidad `GALA 1`. Las otras dos filas de esa
  empresa no están en SAGE.
- **Armonización de empresas**: `VALDEARROYOS, S.L.` → `VALDEARROYOS`, `SERVICIOS EMPRESARIALES
  CERVANTES` → `CERVANTES`. La columna `Empresa` de las copias lleva desplegable de validación.
- **7 grupos de filas duplicadas** y **1 persona presente en las dos hojas**, marcados por color y
  con las filas del duplicado contiguas para poder verlas de un vistazo. **Pendientes de decisión.**

### Aprendido sobre SAGE

Dos hallazgos que condicionan cualquier trabajo futuro con este export:

- **SAGE trunca el nombre de pila a 10 caracteres.** 367 de los 1.430 registros miden exactamente
  10: `MARIA TERESA` se guarda como `MARIA TERE`, `MIGUEL ÁNGEL` como `MIGUEL ANG`. Por eso el
  nombre de las copias **sale de la BBDD y no de SAGE** —con las abreviaturas desplegadas, `Mª` →
  `MARIA`— y el de SAGE se conserva aparte en `Nombre_SAGE`. Configurable en `CFG.NOMBRE_DESDE`.
- **La serie de códigos ≥1000 no es plantilla**: son proveedores y colaboradores (notarías,
  registros mercantiles, profesionales). 159 registros del export.

### Cobertura del censo

De las **1.152 personas** del export de SAGE, las tres hojas cubren **657**. Quedan 495 fuera y
**todas están de baja: ninguna persona activa se queda sin cubrir**, que es la comprobación de que
el cruce está completo. De esas 495, 281 causaron baja en los últimos 5 años y 236 antes.

### Cómo se validó

El emparejado no es trivial: además de la truncación, las partículas viajan de sitio entre los dos
sistemas (`LEÓN TORIBIO, NURIA DE` en la BBDD es `LEON DE TORIBIO, NURIA` en SAGE). Se compara por
conjunto de tokens sin partículas, con tolerancia a prefijo y a errata de un carácter. Dos pruebas
antes de dar el resultado por bueno:

- **50 casos difíciles** tomados de la BBDD real: **47 casan**. Los 3 restantes, correctamente — no
  están en SAGE.
- **Leave-one-out sobre las 1.152 personas**: se retira a cada una del censo y se comprueba si su
  nombre casa erróneamente con otra. **16 colisiones, ninguna un fallo del algoritmo**: 6 son la
  misma persona con dos documentos (NIE → DNI) y el resto homónimos reales que el desempate por
  nivel de coincidencia resuelve.

### Pendiente de decisión

- **`FERNÁNDEZ NEGRETE, MARINA`** (`CERVANTES 632`) figura en las dos hojas: ¿doble rol real o error?
- **Los 7 grupos de duplicados**: fusionar, quedarse con la fila más reciente, o dejarlos marcados.
- **`OCARIZ GUIJARRO, SUSANA ANDREA`** en la BBDD contra `OCARIZ GUAJARDO, SUSANA AN` en SAGE:
  casan por empresa e `Id_Sage`, pero el apellido no es el mismo.
- Si las hojas del libro de cruce deben acabar sustituyendo a las de producción — y qué hacer
  entonces con `ID_Secre`/`ID_Profesor`, que son la clave con la que las respuestas históricas de
  los formularios se vinculan a cada persona.

---

## [2026-09-07]

Reorganización de las carpetas del repositorio: la documentación pasa a ordenarse por **la pregunta
a la que responde** —el problema, la solución, el trabajo— en lugar de por si es "de proceso" o "de
desarrollo". Ningún contenido se ha modificado: son movimientos de carpeta y la actualización de
todas las referencias cruzadas.

### Cambiado

- **`requisitos.md` partido en dos**, con la trazabilidad explícita que fija ahora `CLAUDE.md`:
  [`requisitos_funcionales.md`](docs_discovery/requisitos_funcionales.md) (71 RF, cada uno ligado a
  sus historias) y [`requisitos_no_funcionales.md`](docs_discovery/requisitos_no_funcionales.md)
  (17 RNF, cada uno ligado a un RF o **justificando por qué existe sin él**: siete lo hacen).
- **`ROADMAP.md` eliminado.** Sus 93 puntos ya vivían en los requisitos —que llevan el estado de cada
  uno— o en la deuda técnica: mantenerlos también en el ROADMAP duplicaba el estado en dos sitios, y
  dos sitios que dicen lo mismo acaban diciendo cosas distintas. Los **seis puntos sin trazabilidad**
  pasaron a [`items_v3.md`](docs_work/items_v3.md).
- **La matriz de trazabilidad, al SSD** ([§12](docs_solutions/docs_design/SSD.md)): la cadena
  `problem → HU → RF/RNF → ADR` y dónde se declara cada eslabón.
- **`CLAUDE.md`** incorpora KISS, DRY, YAGNI, Clean Code y Clean Architecture junto a SOLID; los
  estándares **arc42** (SSD) y **MADR** (ADR); la cadena de trazabilidad; y la **auditoría de dos
  pasadas**.
- **Estructura de carpetas**, en cuatro movimientos:

  | Antes | Ahora | Qué contiene |
  |---|---|---|
  | `docs_dev/problem.md`, `historias_usuarios.md`, `requisitos.md` | `docs_discovery/` | El problema: qué hace falta y para quién |
  | `docs_dev/SSD.md`, `docs_dev/adr/` | `docs_solutions/docs_design/` | El diseño: cómo está construido y por qué |
  | `code_dev/` | `docs_solutions/src/` | El código de los proyectos de Apps Script |
  | `docs/` | `docs_work/` | El proceso y el trabajo por delante |

  El cambio de fondo es que **`docs_dev/` se parte en dos**: mezclaba el problema (`problem.md`,
  historias, requisitos) con la solución (SSD, ADR), que son dos preguntas distintas y se revisan en
  momentos distintos. Y el código deja de vivir aparte: pasa a colgar de `docs_solutions/` junto al
  diseño que lo justifica.
- **149 referencias cruzadas actualizadas** en 16 archivos. Además de las rutas evidentes, la
  división de `docs_dev/` rompió una clase de enlace que no se veía venir: los que apuntaban al
  **mismo directorio** (`requisitos_funcionales.md` → `SSD.md`, `problem.md` → `adr/`) y que ahora cruzan de
  `docs_discovery/` a `docs_solutions/`.
- **`README.md`**: árbol del repositorio y mapa de la documentación reescritos a tres carpetas. De
  paso queda corregido que `backup_old_js/` cuelga del código (hoy `docs_solutions/src/`) y no de la
  raíz, como decía el árbol.
- **`CLAUDE.md`**: la sección de documentación de referencia pasa de dos bloques a tres, y añade
  `docs_discovery/requisitos.md` y `docs_solutions/src/`, que no figuraban.

---

## [2026-08-17]

Retomado el proyecto. Dos frentes: **rediseño del volcado de horas extras de secretarias**
(ya probado y funcionando) y **documentación del problema y del modelo de datos real**.

### Añadido

- **Volcado de Horas Extras bajo demanda** ([ADR-0013](docs_solutions/docs_design/adr/0013-volcado-horas-extras-por-periodo-bajo-demanda.md)).
  Nueva acción de menú `VAP_Acciones → "Volcar Horas Extras del mes..."` en el Spreadsheet de
  respuestas, para que la Responsable de Administración pueda lanzarlo cuando lo necesite:
  - **Filtrado por periodo**: solo se exportan las respuestas cuyo `MES` (columna C) coincide con el
    mes elegido **y** cuyo año de marca temporal coincide con el del periodo.
  - **Desplegable de mes y año** en un diálogo `HtmlService`, con el **mes en curso preseleccionado**
    según la fecha de ejecución. Se puede elegir otro mes: el cierre suele hacerse a principios del
    mes siguiente.
  - **Informe previo**: cuántas filas coinciden y cuántas no, desglosadas por motivo (otro mes, otro
    año, mes no reconocible). **Nada se escribe hasta confirmar.**
  - **Reenvío como corrección**: si una secretaria aparece varias veces en el periodo, gana el envío
    de **marca temporal más reciente**.
  - **Copia a `Anteriores`** de las filas exportadas, sellada con periodo, fecha y `Run ID`.
- **Nuevo archivo `VAP_index_Dialogo_Volcado_Horas_Extras.html`** (template GAS `DialogoVolcado`):
  el diálogo del volcado. El proyecto GAS pasa a tener dos archivos.
- **Volcado de Actividad de Profesores bajo demanda** ([ADR-0014](docs_solutions/docs_design/adr/0014-volcado-actividad-profesores-por-periodo.md)),
  con el mismo patrón que horas extras y las adaptaciones que exige el caso:
  - **Se conserva íntegra la acumulación campo a campo** de
    [ADR-0009](docs_solutions/docs_design/adr/0009-acumular-respuestas-por-mes-y-anio.md): por cada una de las 64 columnas
    gana la última celda **no vacía**; el vacío no borra lo ya reportado; el `0` sí cuenta. Es lo que
    permite que **varias secretarias reporten partes distintas** del mismo profesor — en el histórico
    hay **122 pares (profesor, mes) con más de un reporte**.
  - **En destino solo se escriben las columnas con valor**; las demás conservan lo que hubiera.
  - **`Hoja 1` del libro de respuestas se adopta como histórico**: ya cumplía esa función con 1.730
    filas de enero a julio de 2026. No se crea pestaña nueva.
  - Antes se reducía cada profesor **al mes más reciente**, sin poder elegir el periodo a volcar.
- **Nuevo archivo `VAP_index_Dialogo_Volcado_Actividad_Profesores.html`** (template GAS
  `DialogoVolcado` de su propio proyecto).
- **Comprobación de destino limpio en ambos volcados.** El proceso parte cada mes de una hoja de
  Vinculación vacía; antes de escribir, los scripts cuentan cuántas celdas del rango destino ya
  tienen dato para las personas del periodo y **avisan en rojo** si no son cero. Detecta el error más
  probable del flujo: ejecutar contra la hoja del mes anterior.
- **Log con el nombre real de cada columna** en el volcado de profesores
  (`HORA TEÓRICA PRESENCIAL B L-V: (vacío) → 12`), leído de la cabecera del formulario. Con 64
  campos, un registro posicional sería ilegible. Incidencias propias: `VARIOS_REPORTES` (profesor con
  más de un reporte, con las sucursales de origen) y `VALOR_SOBRESCRITO` (dos reportes con valores
  distintos para el mismo campo).
- **Hoja de auditoría `LOG Volcado`**, creada automáticamente en el Spreadsheet de respuestas.
  Registra tres categorías: `MOVIMIENTO` (cambios antes→después), `INCIDENCIA` (mes no reconocido,
  fila sin nombre, sin marca temporal, valor no numérico, marca temporal fuera de mes, envíos
  múltiples) y `ERROR` (nombre duplicado en destino, acceso, bloqueo, tiempo excedido), estos
  últimos con tipo y solución sugerida. Extiende a este script el patrón de
  [ADR-0012](docs_solutions/docs_design/adr/0012-auditoria-centralizada-logs-y-errores.md).
- **Bloqueo por ambigüedad**: si una secretaria aparece más de una vez en la hoja de destino, su
  fila **no se escribe** y se registra el error. Antes se escribía a ciegas en la primera
  coincidencia.
- **`docs_discovery/problem.md`** — *Problem Statement & Jobs To Be Done*: el problema que resuelve el sistema,
  con independencia de cómo esté construido. Combina los marcos de Ulwick (enunciado del *job* y
  *desired outcomes*) y Klement/Intercom (*job stories*). Incluye el histórico del proceso, los cinco
  roles ejecutores, la distinción entre captura, consolidación y ajuste, restricciones,
  anti-objetivos, supuestos y preguntas abiertas.
- **`CLAUDE.md`** — contexto del proyecto para el trabajo asistido.
- **SSD §6.1.1 y §6.1.2** — catálogo de complementos y estructura de la hoja `Config`.
- **SSD §6.3** — la premisa **"cada mes se parte de una hoja de Vinculación limpia"**, de la que
  depende que los volcados sean correctos y que no estaba escrita en ninguna parte.
- **SSD §7.2** — estructura real del Spreadsheet de respuestas de horas extras, flujo del volcado y
  esquema de la hoja `LOG Volcado`.
- **SSD §7.4** — estructura del formulario de profesores (72 cabeceras), flujo del volcado,
  acumulación campo a campo, comprobación de destino limpio e incidencias propias.
- **SSD §9** — riesgos **R-09 … R-17** procedentes de la revisión del código y de los datos.
- **`docs_work/FLUJO.md`** — mapa del flujo de datos y usuarios, **del momento cero al cálculo final de
  nóminas**. Nueve diagramas Mermaid y el recorrido explicado: quién reporta qué, dónde aterriza,
  qué script lo consolida y a qué hoja va. Cada nodo va **codificado por color** según lo que se ha
  podido verificar: verde comprobado, amarillo paso manual, discontinuo sin confirmar, rojo sin
  trazabilidad. Deja **8 zonas oscuras señaladas** en su §9, y advierte de que el calendario del mes
  (§10) es todavía una inferencia.
- **`docs_work/dudas/`** — carpeta para las cuestiones detectadas y **sin resolver**, con plantilla e
  índice. Separa tres cosas que se confunden: una **duda** (falta información para decidir), una
  **decisión** (ya tomada, en `adr/`) y una **tarea** (ya se sabe qué hacer, en `proximos_pasos.md`).
- **[DUDA-0001](docs_work/dudas/0001-RESUELTA-tres-libros-destino-de-los-volcados.md)** — los volcados escriben en
  **tres libros distintos**: horas extras y actividad en `1qK3…o8kc`, las nóminas en los libros de
  neto y bruto. Los rangos de columnas **no se solapan** (7-20 frente a 29-92), así que cabrían en
  la misma hoja. No consta cuál de los tres alimenta el cálculo final.
- **[`docs_work/dudas/deuda-tecnica.md`](docs_work/dudas/deuda-tecnica.md)** — inventario de **17 entradas**
  detectadas revisando el código y los datos, clasificadas por prioridad y esfuerzo. Nada impide que
  el sistema funcione hoy: son cosas que funcionan por casualidad, que se romperán al crecer, o que
  nadie sabe explicar.

### Cambiado

- **`VAP_Script Volcado Horas Extras Secretarias.js` reescrito.** El trigger `onFormSubmit` deja de
  usarse para el volcado (se conserva la función, desactivada por la constante
  `AUTO_VOLCADO_AL_ENVIAR`). La regla *"último registro por empleada sin mirar el mes"* se sustituye
  por el filtrado por periodo.
- **`VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js` reescrito.** El trigger `onFormSubmit`
  deja de usarse: **si sigue instalado en el proyecto GAS hay que borrarlo**, porque apunta a una
  función que ya no existe. El `COLUMN_MAP` de 64 entradas ahora se **genera** a partir de tres
  constantes en lugar de mantenerse a mano (verificado que produce el mismo mapeo `F..BQ → AC..CN`).
- **Reorganizados los archivos de horas extras** en `VAP_script_secretarias/VAP_Horas_Extras_Secretarias/`,
  agrupando por proyecto GAS igual que `VAP_Complementos Secretarias/`.
- **La hoja de respuestas ya no necesita vaciarse.** Hasta ahora, las respuestas antiguas se movían
  a mano a `Anteriores` para que el volcado no arrastrase datos de meses pasados: era un
  mantenimiento del que dependía la corrección del resultado y que no estaba documentado. El filtro
  por periodo lo hace innecesario, y el histórico se conserva íntegro.
- **SSD verificado contra los Spreadsheets reales** (`VAP_BBDD_Personas` y
  `VAP_Carga_Datos_Mensuales_Complementos_Secretarias`): columnas, catálogo de conceptos, relación
  responsable↔concepto y volúmenes.
- **Riesgo R-04 reformulado**: el volcado de horas extras vuelve a ser manual, pero por decisión de
  diseño y con revisión previa, no por falta de automatización. **R-09 y R-10 cerrados** por los
  ADR-0013 y 0014.
- **ROADMAP reorganizado**, con una **tabla resumen de fases** al principio (estado y avance por
  subfase, 40 de 61 puntos):
  - El volcado y cálculo de nóminas **deja de colgar de la Fase 2** y pasa a ser la **Fase 3,
    transversal**: afecta a todo el personal, incluido el de **sueldo fijo** que no está en ninguno
    de los dos colectivos. En `bbdd_export_sage_laboral` hay **501 empleados** frente a los ~400 que
    gestiona el sistema por complementos.
  - Las **verificaciones** (seguro médico, COBEE y transferencias) se **fusionan en esa Fase 3** como
    3.B, 3.C y 3.D, en lugar de ser una fase aparte. La fase cambia de naturaleza a mitad: 3.A mueve
    datos, 3.B-3.D los comprueban.
  - **Documentación y deuda técnica** pasa a ser la **Fase 4**, con 4.A desgranada en 17 puntos
    agrupados por bloque (el problema, el SSD verificado, decisiones y dudas, el repositorio).
- **Código reorganizado bajo `docs_solutions/src/`**, con una carpeta por proyecto de Apps Script. Antes los
  scripts colgaban de la raíz del repositorio.
- **Índices renombrados** a `README_ADR.md` y `README_dudas.md`, para no tener varios `README.md`
  indistinguibles en el editor. Actualizados los enlaces en los 8 documentos que los referenciaban.
- **`docs_discovery/problem.md`**: eliminados el **mapa del *job*** (§4.4) y las **fuerzas del progreso** (§6),
  por no aportar valor al caso. Se conserva la distinción **captura / consolidación / ajuste**, que
  delimita el alcance del sistema y de la que dependen el anti-objetivo de §8 y el supuesto S-05.
  Secciones renumeradas y referencias cruzadas corregidas.

### Corregido

- **El mes del formulario se ignoraba.** El formulario de horas extras captura el mes en la columna
  C desde siempre, pero el script no la leía: un envío de un mes podía sobrescribir el de otro. En
  la verificación previa al cambio ya convivían 25 respuestas de `JULIO` con 1 de `JUNIO`.

### Detectado

Inventario completo, con prioridad y esfuerzo, en
**[`docs_work/dudas/deuda-tecnica.md`](docs_work/dudas/deuda-tecnica.md)** (17 entradas). Lo más relevante:

**En el código**

- **`toNumber_` del script SAGE corrompe decimales con punto** (`"1234.56"` → `123456`) y alimenta la
  comparación que decide si una celda cambió (DT-01 · R-14). Convive con `aNumero_`, que sí parsea
  bien: dos funciones para lo mismo con semánticas distintas.
- **Export Neto/Bruto escribe celda a celda**: hasta **4.008 llamadas** individuales a la API con 501
  empleados, con riesgo de agotar el tiempo de ejecución (DT-02 · R-15).
- **Tres parsers de número distintos** entre los scripts: `aNumero_`, `toNumber_` y `parseNumber_`
  (DT-03).
- **El mapeo de destino va por posición fija**: insertar una columna en Vinculación desplaza todo y
  el volcado escribe en el sitio equivocado **sin dar error** (DT-04 · R-08).

**En los datos**

- **`TALLER` vs `MECÁNICO`** (DT-08 · R-16): el histórico de profesores conserva las cabeceras del
  formulario anterior (`HORA EXTRA TALLER`) mientras el actual dice `MECÁNICO`. Las copias se añaden
  **por posición**: si no son el mismo concepto renombrado, el histórico mezclaría significados.
- **`PRUEBA_DATA` (`CON_SECR_07`) está activo en producción** y se ofrece como concepto reportable.
  Nunca se ha usado en 1.724 registros (DT-09).
- **El responsable `5` no tiene ningún concepto asignado**: si entrara en la webapp, sería rechazado.
  Solo **4** responsables han reportado alguna vez, de 5 dados de alta y 6 mencionados (DT-10).
- **`Tipología_Profesor` solo toma los valores `1` y `2`**, sin significado documentado y sin uso en
  ningún script. Si condiciona la retribución, es relevante para el cálculo (DT-11).
- **Cabeceras inconsistentes** (DT-07): `VAP_Responsables` tiene `"Nombre "` con un espacio final —
  hoy no rompe nada porque `readTable_` aplica `trim()`, pero cualquier código nuevo sin `trim`
  fallaría en silencio; y `VAP_Secretarias` usa `Fecha Alta` donde `VAP_Profesores` usa `Fecha_Alta`.

**En `VAP_Export_Sage`** *(verificado por primera vez en esta sesión)*

- **501 empleados**, ~100 más que los ~400 que gestiona el sistema VAP: SAGE incluye personal que no
  entra en ninguno de los dos colectivos.
- **El cálculo del salario base es correcto**: 498 de 501 filas cuadran exactamente con la fórmula;
  las 3 restantes no tienen datos en esas columnas.
- **El orden de uso no se está siguiendo**: 9 Export Neto y 7 Export Bruto frente a solo **2 Calculo
  Salario Base** entre mayo y julio, cuando la documentación pide calcular antes de cada export.
- **`vinculo_columnas` duplica el mapeo del código** (DT-06): coincide exactamente con `VINC_FIELDS`,
  pero el script no la lee. Es una copia manual que puede divergir sin que nadie se entere.
- **`PRODUCTIVIDAD` (col. J) no se vuelca a Vinculación** pese a ser donde acaba todo lo que produce
  este sistema. Debe volver a nóminas por otra vía, sin documentar.
- **`Porcentaje_de_jornada` no se usa en ningún cálculo**, con 153 de 501 personas a jornada parcial.

**En el proceso**

- **Los volcados escriben en tres libros distintos** y no consta cuál alimenta el cálculo final
  ([DUDA-0001](docs_work/dudas/0001-RESUELTA-tres-libros-destino-de-los-volcados.md)).
- **La premisa "cada mes se parte de hoja limpia" no la garantiza ningún automatismo** (R-17): los
  volcados comprueban y avisan, pero no lo impiden.
- **El repositorio y los proyectos GAS se sincronizan copiando y pegando a mano** (DT-12 · R-13).
- **No hay tests ni linter** (DT-17): la única verificación automática es de sintaxis.

---

## [2026-06-11]

Reorganización de la documentación y nueva portada/lanzador de complementos de secretarias para GALA Hub.

### Añadido

- **Portal / lanzador de complementos (secretarias)**
  `VAP_script_secretarias/VAP_Complementos Secretarias/VAP_index_Portal_Complementos_Secretarias.html`
  (template GAS `Portal`): **portada alineada con GALA Hub** con dos tarjetas para **elegir**
  Reportar o Consultar, que **enlazan a las webapps existentes** (Reportar → URL base; Consultar →
  `?page=consultas`). No duplica la lógica de las webapps ni las modifica; la URL del webapp se
  inyecta con `ScriptApp.getService().getUrl()` (sin IDs hardcodeados). Es el punto de entrada del
  recurso `rec-004` de GALA Hub; los enlaces directos siguen funcionando por separado.
- **`doGet` del backend**: caso aditivo `?page=portal` que sirve el template `Portal` (las rutas
  `Index` por defecto y `?page=consultas` siguen intactas).
- **Documentación de referencia** (entonces bajo `docs/`; hoy repartida como se indica):
  - **`docs_solutions/docs_design/SSD.md`** — *Software Specification & Design Document*: documento único que cubre
    especificación (antecedentes, objetivos, requisitos) y diseño (arquitectura, recursos,
    modelo de datos, componentes/scripts, flujos, riesgos y glosario).
  - **`docs_solutions/docs_design/adr/`** — decisiones de arquitectura, **una por archivo** (`ADR-0001` … `ADR-0012`,
    equivalentes a las antiguas `DT-01` … `DT-12`), con índice (`README.md`) y plantilla
    (`0000-plantilla.md`).
  - **`docs_work/ROADMAP.md`** — fases del proyecto y estado de avance, más un backlog de mejoras
    propuestas.

### Cambiado

- **Eliminado `ADR.md`** de la raíz: su contenido se ha repartido entre `docs_solutions/docs_design/SSD.md` (diseño,
  riesgos, glosario), `docs_solutions/docs_design/adr/` (decisiones) y el ROADMAP de entonces (fases). El registro de
  trabajo por sesiones del antiguo ADR se consolida en este `CHANGELOG`.
- **`README.md`**: actualizados el árbol del repositorio y todas las referencias para apuntar a
  las carpetas de documentación (antes apuntaban a `ADR.md` / `DT-NN`).

---

## [2026-05-25]

Trabajo centrado en la **Fase 2 (Profesores)**: alta del script de sincronización del
formulario de profesores y rediseño del volcado del registro de actividad para que
**acumule** los datos por mes/año en lugar de reemplazarlos.

### Añadido

#### Script de Actualización Automática de Profesores
- **Nuevo script `VAP_scripts_profesores/VAP_Script_Actualizacion_Automatica_Profesores.js`**:
  sincronización del formulario de profesores, gemelo del de secretarias.
  - Rellena la pregunta tipo lista **"SELECCIONE EL PROFESOR"** del formulario con los
    profesores activos (`Alta = TRUE`) de la hoja `VAP_Profesores`, de forma única,
    ordenada y normalizada.
  - Al enviar el formulario (`onFormSubmit`), busca el `ID_Profesor` por nombre y lo
    escribe en la columna `ID_Profesor` de la hoja de respuestas (la crea si no existe).
  - Disparadores: por edición (`onSpreadsheetEditTrigger`), por cambios estructurales
    de filas/hojas (`onSpreadsheetChangeTrigger`) y respaldo horario
    (`actualizarPreguntaProfesores` cada hora).
  - Control de frecuencia mediante `CacheService` (bloqueo de 30 s) para evitar
    sincronizaciones en cascada.
  - Funciones de gestión de triggers: `crearTriggersProduccion`,
    `crearTriggerHorarioRespaldo`, `borrarTriggers` y `verTriggers`.
  - Validación de nombres duplicados: si hay dos profesores activos con el mismo nombre,
    lanza error en lugar de elegir uno al azar.
  - ⚠️ Debe desplegarse en un **proyecto Apps Script independiente** del de secretarias
    (comparten nombres globales como `onFormSubmit` / `FORM_ID` y colisionarían).

#### Registro de Actividad de Profesores
- **Nuevo backup `VAP_scripts_profesores/backup_VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js`**:
  copia de la versión anterior (estrategia "último gana entero") para poder revertir.
- **Funciones auxiliares** en el script de registro de actividad para mayor robustez:
  - `isEmpty(v)`: trata `null`, `undefined`, `''` y espacios como vacío, **pero `0`
    (y `"0"`) se consideran dato válido y sí pisan.
  - `getYear(v)`: extrae el año de la marca temporal admitiendo `Date` o texto; si no se
    puede interpretar, devuelve `''` para no romper la agrupación.

#### Cálculos sobre Exportación SAGE Laboral
- **Nuevo script `scripts_generales/VAP_script_export_SAGE.js`** (Apps Script **enlazado**
  al Spreadsheet que contiene la pestaña `bbdd_export_sage_laboral`): primera pieza de una
  herramienta de cálculos accesible desde un menú propio **"VAP_Acciones"**, diseñada para
  crecer por partes (una acción = una función + un ítem de menú).
  - **Acción "Calculo Salario Base"** (`calcularSalarioBaseBruto`): localiza por **nombre de
    cabecera** las columnas `TOTAL_BRUTO`, `SEGURO_MEDICO` y `COBE`; transforma a positivo
    (valor absoluto) los dos descuentos y los suma al total bruto. Escribe el resultado en
    la columna **S** con cabecera `salario_base_bruto`.
    Fórmula: `salario_base_bruto = TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|`.
    Las filas vacías en las tres columnas no se tocan; el volcado se hace en bloque.
  - **Acción "Envio Datos (futuro)"** (`enviarDatosFuturo`): placeholder; por ahora solo
    avisa de que está en desarrollo.
  - **Funciones auxiliares**: `normalizarCabecera_` (compara cabeceras sin tildes, en
    mayúsculas y sin espacios sobrantes) y `aNumero_` (convierte texto a número admitiendo
    formato es-ES, p. ej. `"1.234,56 €"` → `1234.56`).
  - Las columnas de entrada se localizan **por nombre de cabecera** (robusto ante
    reordenación); solo la columna de resultado (S) es de posición fija.

#### Vinculación de gastos de personal — acciones "Export Neto" y "Export Bruto" (fusión)
- **Fusionados los scripts de volcado de nóminas (neto y bruto) dentro de
  `scripts_generales/VAP_script_export_SAGE.js`** como dos acciones nuevas del menú
  `VAP_Acciones`: **"Export Neto"** y **"Export Bruto"**. Sustituyen a los scripts
  standalone `script-netos*.js` / `script-brutos*.js` (archivados en `backup_old_js/`),
  para mantener **un solo proyecto** en lugar de tres.
  - **Origen**: la pestaña `bbdd_export_sage_laboral` de este mismo libro (antes los
    scripts leían de un `Informe` externo). Clave de cruce: `Empresa` + `Codigo_Empleado`
    (por cabecera) contra `EMPRESA` (col E) + `Nº EMPLEADO` (col F) del destino.
  - **Destinos** (sin cambios): neto → libro de Vinculación `…MPTs`; bruto → `…t04A`;
    ambos con pestaña `Hoja 1` (verificado) y cabecera real en la fila 6.
  - **8 campos mapeados** (verificados contra las hojas reales) origen → destino:
    `SEGURO_MEDICO`→ADESLAS (G), `COBE_Alimentacion`→COBEE COMIDA (H),
    `COBE_Transporte`→COBEE TRANSPORTE (I), `salario_base_bruto`→Salario Base (L),
    `SS_EMP`→SS Empresa (P), `SS_TRABAH`→SS trabajador (Q), `IRPF`→IRPF (R),
    `Líquido_a_percibir`→Nomina NETO (T). Cada botón vuelca los 8 campos a su hoja.
  - **Comportamiento SOBRESCRIBIR** (refresca cada vez), escribiendo solo las celdas que
    cambian (preserva fórmulas/formato del resto). La columna `% IRPF` (S) del destino ya
    no se toca (no tiene origen en el bbdd).
  - **Controles**: duplicados en origen/destino (los de destino bloquean la escritura),
    `NO_ENCONTRADO_DESTINO`, y LOG fila-a-fila `LOG NETOS` / `LOG BRUTOS` (antes→después)
    en cada libro destino.
  - **Función compartida** `volcarVinculacion_(targetId, logName, etiqueta, runId)` con
    dos envoltorios finos `exportNeto()` / `exportBruto()`.

#### Auditoría centralizada (hojas `logs` y `errores`)
- **Nuevo registro de auditoría centralizado** en el libro `VAP_Export_Sage`, vía el
  envoltorio `ejecutarAccion_(nombre, fn)` que envuelve las tres acciones del menú:
  - Hoja **`logs`**: una fila por acción ejecutada — `Timestamp`, `Acción activada`,
    `Resultado` (OK/ERROR), `Registro de acciones`, `Run ID`, `Usuario`, `Duración (s)`.
  - Hoja **`errores`**: una fila por fallo — `Timestamp`, `Acción`, `Tipo de error`,
    `Descripción del error`, `Posible solución`, `Run ID`, `Usuario`. `clasificarError_()`
    deduce el tipo y una solución sugerida.
  - **Correlación por `Run ID`** entre `logs`, `errores` y los `LOG NETOS`/`LOG BRUTOS`.
  - Política ante error: **registrar + relanzar** la excepción.

#### Documentación
- **Nuevo `VAP_scripts_profesores/README.md`**: guía completa del script de registro de
  actividad (qué hace, flujo de datos, lógica de acumulación con ejemplo, instalación
  paso a paso, configuración del trigger, permisos, solución de problemas, validaciones
  internas y detalles técnicos).
- **`README.md`** raíz: reescrito desde un esbozo (`# Sistema_VAP`) a una descripción
  completa del repositorio (estructura, secretarias Fase 1, profesores Fase 2 y notas).
- **`ADR.md`**: añadida la decisión técnica **DT-09** (acumular respuestas por mes/año en
  lugar de reemplazar por la última), la descripción detallada del volcado de actividad
  (columnas origen/destino, lógica de acumulación, funciones auxiliares y triggers) y la
  entrada de la **Sesión 5 — 25/05/26**.
- **`.claude/settings.local.json`**: añadido con la lista de permisos locales de la sesión.
- **Documentación del script SAGE** (`scripts_generales/VAP_script_export_SAGE.js`): entrada
  en este `CHANGELOG`, nueva sección **"Scripts generales"** en `README.md` (con el árbol del
  repositorio actualizado) y, en `ADR.md`, la decisión técnica **DT-10**, la subsección 4.3
  del script y la entrada de la **Sesión 6 — 25/05/26**.
- **Documentación de la fusión neto/bruto + auditoría**: decisiones técnicas **DT-11**
  (fusionar el volcado de nóminas en el script SAGE, origen `bbdd_export_sage_laboral`,
  cruce por cabecera y sobrescritura) y **DT-12** (auditoría centralizada `logs`/`errores`
  correlacionada por `Run ID`) en `ADR.md`; actualización de la subsección 4.3 (acciones,
  mapeo de 8 campos, hojas de log), del árbol del repo en `README.md` y entrada de la
  **Sesión 7 — 25/05/26**.

### Cambiado

#### Script SAGE — menú y columna de resultado
- Eliminado el ítem de menú **"Envio Datos (futuro)"** y su función `enviarDatosFuturo()`:
  su hueco lo cubren las nuevas acciones **Export Neto** / **Export Bruto**.
- Corregida la columna de resultado de **Calculo Salario Base**: `salario_base_bruto` se
  escribe en la columna **S** (no R), y la fórmula suma los **dos** descuentos COBE:
  `= TOTAL_BRUTO + |SEGURO_MEDICO| + |COBE_Transporte| + |COBE_Alimentacion|`.

#### Organización del repositorio (nóminas y documentación)
- Movidos a `backup_old_js/` los scripts de volcado de nóminas previos
  (`script_vinculacion_gastos_personal_brutos_old.js`,
  `script_vinculacion_gastos_personal_neto_old.js`) y retirados del repo los
  `script-netos*.js` / `script-brutos*.js`, ya consolidados en el script SAGE.
- Retirado `VAP_scripts_profesores/README.md` (guía del registro de actividad): su
  contenido vive ya en `ADR.md` (subsección 4.3) y en el `README.md` raíz.

#### Registro de Actividad de Profesores — `VAP_scripts_profesores/VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js`
- **Cambio de arquitectura de "último gana entero" a acumulación por
  `(profesor + mes + año)` (DT-09).** Antes, el último envío de un profesor sobrescribía
  la fila completa, borrando los datos de envíos anteriores; ahora los datos se acumulan.
  - **Agrupación**: por `nombre normalizado + mes seleccionado (col C) + año de la marca
    temporal (col A)`. Se añadieron las constantes `SOURCE_TIMESTAMP_COL` (A) y
    `SOURCE_MONTH_COL` (C).
  - **Acumulación columna a columna** (F..BQ → AC..CN): dentro de cada grupo, la última
    celda **no vacía** gana; una celda vacía **no borra** lo anterior; el `0` cuenta como dato.
  - **Reducción por profesor**: se escribe en destino el grupo (mes/año) más reciente
    según la marca temporal, preservando los datos parciales de múltiples envíos.
  - Se mantiene el uso de `LockService` (espera de 30 s) para evitar escrituras concurrentes,
    y la creación de una fila nueva en destino si el profesor no existe.

#### Organización del repositorio (secretarias)
- Renombrados (sin cambios de contenido) los scripts de secretarias para unificar la
  nomenclatura con prefijo `VAP_`:
  - `Script Volcado Horas Extras Secretarias.js` →
    `VAP_Script Volcado Horas Extras Secretarias.js`
  - `Scripts Formulario Horas Extras Secretarias.js` →
    `VAP_Script_Actualizacion_Automatica_Secretarias.js`

### Notas
- Los IDs de spreadsheets, formularios y carpetas de Drive están **hardcodeados** en cada
  script (habitual en Apps Script); tenerlo en cuenta si el repositorio se hace público.
- Mejoras futuras propuestas para el registro de actividad (ver `docs_solutions/docs_design/SSD.md` / `docs_solutions/docs_design/adr/`):
  destino con una fila por `(profesor, mes)` para histórico mensual, validación explícita de
  que el mes elegido coincide con el año de la marca temporal, y hoja de auditoría de cambios.

---

## [2026-03-24]

Sesión centrada en notificaciones, consulta de envíos y horas extras de secretarias.

### Añadido

- Emails de **confirmación** al responsable y **aviso** al gestor al recibir una remesa.
- Webapp de **consulta de envíos** (`VAP_index_Consultas_Envios_Complementos_Secretarias`).
- Vinculación del formulario `EXTRA SECRETARIAS 2026` con `VAP_Secretarias` y actualización del
  script de volcado de horas extras y de la validación de respuestas.

---

## [2026-02-25]

Sesión inicial: análisis del sistema y primera versión de complementos de secretarias.

### Añadido

- Análisis del sistema existente y definición de objetivos.
- Creación de `VAP_BBDD_Personas` y sus hojas internas.
- Webapp de **reporte de complementos** (`VAP_index_Reportar_Complementos_Secretarias`) con
  validación responsable ↔ complemento y gestión de envíos/correcciones por mes/año.
- Backend `VAP_Export_Complementos_Mensuales_Secretarias` (`Code.gs`).
