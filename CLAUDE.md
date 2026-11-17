# CLAUDE.md

## Regla principal: no actúes sin permiso explícito

**No ejecutes nada que no se te haya pedido explícitamente.**

Si te piden leer, analizar, revisar o informar sobre algo, **la respuesta es el informe**. Ahí
termina el trabajo. No es una invitación a arreglar lo que encuentres.

Antes de **cualquier** mejora, corrección, actualización, refactor, creación de archivos,
renombrado o cambio de documentación —por evidente, pequeño o beneficioso que te parezca—:

1. **Explica** qué propones y por qué.
2. **Pregunta** y espera mi visto bueno.
3. Solo entonces, actúa.

Esto aplica también a lo que parezca trivial: crear un `.gitignore`, renombrar un archivo, añadir
una entrada al `CHANGELOG` o corregir una errata. Si no te lo he pedido, pregunta primero.

**Qué sí puedes hacer sin preguntar:** leer archivos, buscar en el código, ejecutar comandos de
solo lectura (`git status`, `git log`, `node --check`) y responderme.

**Qué no:** escribir o modificar archivos, renombrar, borrar, hacer commits, o cualquier operación
que deje rastro en el repositorio.

Ante la duda, pregunta. Prefiero una pregunta de más que un cambio que no he pedido.

---

## Segunda regla: los datos personales nunca entran en el repositorio

Los ficheros de **ADESLAS, COBEE, los bancos y SAGE**, y cualquier export con **DNI/NIE, IBAN,
email personal, fecha de nacimiento o importes de nómina nominativos** —de empleados **o de sus
familiares**— **no entran en el repositorio bajo ningún concepto**. Ni versionados, ni
«temporalmente», ni pegados como ejemplo dentro de un `.md`.

Git no olvida: borrar un archivo del árbol **no lo saca del historial**. Por eso esta regla se
aplica antes de escribir, no después.

**Qué significa en la práctica:**

| | |
|---|---|
| **En documentación y ADR** | Describe el **formato**, no los datos: cabeceras, tipos y, si hace falta un ejemplo, **inventado**. Nunca una fila real copiada |
| **En código y comentarios** | Nada de DNIs de ejemplo sacados de un fichero real. Los identificadores de hojas y libros sí pueden ir: no son datos personales |
| **En ficheros de trabajo** | Viven **fuera del repositorio**, o dentro de una carpeta ignorada por git y declarada en `.gitignore` |
| **Al analizar un fichero real** | Léelo desde su ruta y **no lo copies aquí dentro**. Los agregados y los porcentajes sí se pueden documentar; las filas, no |

**Si encuentras datos personales ya versionados, no los borres por tu cuenta:** avísame. Sacarlos
del árbol no basta y hay que decidir qué se hace con el historial.

> Esto no es celo excesivo. **El riesgo real no es el almacén, es la superficie de compartición**:
> nadie filtra una nómina a propósito, se filtra con un clic en el sitio equivocado. La forma de
> que ese clic no importe es que no haya nada legible que filtrar.

---

## El proyecto

**Sistema VAP** (Valoración de Actividad Productiva) — sistema interno de **GALA Formación** que
automatiza el cálculo de los salarios mensuales variables de secretarias y profesores de
autoescuelas. Construido sobre Google Workspace: Sheets como base de datos, Google Apps Script para
la lógica, webapps GAS propias para reporte y consulta.

**Está en producción y mueve nóminas reales.** Razón de más para no tocar nada por iniciativa propia.

Documentación de referencia:

**`docs_discovery/` — el problema** (qué hace falta y para quién, antes de hablar de soluciones):

- [docs_discovery/problem.md](docs_discovery/problem.md) — el problema y los *Jobs To Be Done*
- [docs_discovery/historias_usuarios.md](docs_discovery/historias_usuarios.md) — historias de usuario
- [docs_discovery/requisitos_funcionales.md](docs_discovery/requisitos_funcionales.md) — qué debe hacer el sistema (RF)
- [docs_discovery/requisitos_no_funcionales.md](docs_discovery/requisitos_no_funcionales.md) — bajo qué condiciones (RNF)

**`docs_solutions/` — la solución** (cómo está construido, y con qué código):

- [docs_solutions/docs_design/SSD.md](docs_solutions/docs_design/SSD.md) — especificación y diseño
- [docs_solutions/docs_design/adr/](docs_solutions/docs_design/adr/README_ADR.md) — decisiones de arquitectura
- [docs_solutions/src/](docs_solutions/src/) — el código, una carpeta por proyecto de Apps Script
- [docs_solutions/src/webapp/](docs_solutions/src/webapp/README.md) — la **webapp del proceso mensual** (v0.3.0, desplegada en pruebas: marca pasos y da de alta/baja personas (maestro y huella en `VAP_Pagos`) solo si está configurada; [ADR-0017](docs_solutions/docs_design/adr/0017-webapp-del-proceso-mensual-stack-y-estructura.md) y [ADR-0018](docs_solutions/docs_design/adr/0018-gsh-propio-de-la-webapp-propietario-y-accesos.md) en Propuesta). Sigue las convenciones de BUCA: capas por prefijo, solo `api…` pública y con rol comprobado en el servidor, ES2019

**`docs_work/` — el proceso y el trabajo por delante** (lo que se revisa con quien opera el sistema):

- [docs_work/FLUJO.md](docs_work/flujo_doc/FLUJO.md) — el mapa del proceso mensual, del dato a la nómina
- [docs_work/proximos_pasos.md](docs_work/proximos_pasos.md) — qué toca hacer ahora, agrupado en sprints
- [docs_work/dudas/](docs_work/dudas/README_dudas.md) — cuestiones sin resolver y deuda técnica
- [docs_work/reuniones/](docs_work/reuniones/README_reuniones.md) — guion y acta de cada reunión

Y [README.md](README.md) — mapa del repositorio · [CHANGELOG.md](CHANGELOG.md) — registro de cambios

---

## Cómo se organiza el trabajo

El trabajo avanza por **sprints**, definidos en [docs_work/proximos_pasos.md](docs_work/proximos_pasos.md). Tres reglas
que hay que respetar sin que haga falta recordarlas:

1. **El sprint nuevo entra por arriba.** Cuando se decide abordar algo, se registra como sprint
   nuevo en primera posición y **el resto baja**: lo que era Sprint 1 pasa a ser Sprint 2, y así
   sucesivamente. Los identificadores de los objetivos (`OB-xx`) **no se renumeran**: identifican, no
   ordenan. El orden lo da el sprint.

2. **Lo que se cierra se marca en el requisito, no en una lista aparte.** El estado de cada RF y
   RNF vive en [`requisitos_funcionales.md`](docs_discovery/requisitos_funcionales.md) y
   [`requisitos_no_funcionales.md`](docs_discovery/requisitos_no_funcionales.md), y **es el único
   sitio donde se lleva**. No hay ROADMAP: se eliminó porque duplicaba ese estado en dos lugares, y
   dos lugares que dicen lo mismo acaban diciendo cosas distintas.

3. **Un objetivo cerrado deja rastro de qué salió de él.** Normalmente una respuesta a una duda, un
   ADR nuevo, o un requisito que pasa de 🔴 a ✅.

Un sprint se cierra **por objetivo cumplido, no por fecha**: el desarrollo lo lleva una sola persona
compatibilizándolo con otras funciones.

---

## Normas globales y skills de desarrollo

Las preferencias generales del dispositivo están en `~/.claude/CLAUDE.md` y aplican todas: ADR en
MADR con el estado en el nombre del fichero, SDD y arc42, pruebas con cada cambio, trazabilidad con
script, MoSCoW solo para ordenar, dos revisiones antes del commit, consecuencias por escrito antes de
subir a un entorno real, y que **los commits los hace siempre el usuario**. **Lo que este archivo
diga tiene prioridad sobre el global** (las dos reglas de arriba son más estrictas y siguen mandando).

Las copias de las skills de desarrollo están en [.claude/skills/](.claude/skills/) y se versionan con
el repo. **Si el equipo tiene la misma skill instalada de forma global (`~/.claude/skills/`), se usa
la global**; la copia del repo es el respaldo para quien no la tenga.

| Skill | Cuándo se aplica |
|---|---|
| `dev-cambio-codigo` | Se añade, cambia o corrige código de `docs_solutions/src/` |
| `dev-nuevo-adr` | Se crea o cambia un ADR, o su estado |
| `dev-trazabilidad` | Cambian el problema, las HU, los RF o los RNF, o se pide comprobar la trazabilidad |
| `dev-revision-cierre` | Cierre de jornada o antes de un commit |
| `dev-pre-produccion` | Antes de subir algo a un entorno real. **Aquí todo lo que toca los libros de Sheets o los proyectos de Apps Script en uso mueve nóminas reales** |
| `dev-inicio-proyecto`, `dev-nueva-skill` | Solo de referencia: crear un repo nuevo o una skill |
| `dev-pruebas` | Se escribe, cambia o pide una prueba, o se monta la base de pruebas. **Aquí nunca se escribe en libros reales de nóminas: se prueba con dobles en memoria** |
| `dev-licencia` | Crear o revisar el `LICENSE` de un repo |

### Pruebas: cómo se ejecutan

```sh
npm test                    # Vitest: unitarias, integración y recorridos del backend (1.881: 1.840 pasan y 41 documentan defectos)
npm run e2e                 # Playwright: las pantallas HTML reales contra el .gs real (227)
npm run lint                # Biome: solo docs_solutions/src/webapp y tests/webapp (el código antiguo no se reformatea)
python3 -m unittest discover -s scripts -p 'test_*.py'   # pruebas del verificador
python3 scripts/verificar_trazabilidad.py                # trazabilidad y enlaces
node --check < fichero.gs   # sintaxis de un .gs (Node no acepta la extensión)
```

Los `.gs` se prueban **sin modificarlos**: `tests/soporte/cargar-gs.js` los ejecuta en una caja de Node con dobles de
Google en memoria. **Los dobles aproximan Google, no lo sustituyen**: triggers, cuotas, permisos y textos de error reales
se comprueban a mano antes de cada despliegue. Las pruebas marcadas `it.fails`/`test.fail` **documentan defectos
conocidos** ([proximos_pasos.md](docs_work/proximos_pasos.md)): al corregir el código hay que quitarles la marca.

### Diferencias conocidas con la estructura estándar

Este repo nació antes que el estándar y **todavía no lo cumple del todo**. Las skills presuponen la
estructura estándar, así que, hasta migrar, **donde la skill diga una ruta, vale la equivalente de aquí**:

| Estándar (skills) | En este repo |
|---|---|
| `docs_dev/docs_discovery/` | `docs_discovery/` |
| `docs_dev/docs_solution/` | `docs_solutions/docs_design/` |
| `sdd.md` · `arquitectura.md` | `SSD.md` (que ya sigue arc42) |
| `historia_de_usuarios.md` | `historias_usuarios.md` |
| `NNNN-ESTADO-titulo.md` en los ADR | `NNNN-titulo.md` (el estado va solo en la cabecera) |
| `scripts/`, `tests/`, `valor_dev.md` | **Ya existen** (`scripts/`, `tests/` y `docs_work/valor_dev.md`) |

La migración, los ficheros reales de `docs_work/docs_cruce/` (protegidos solo por extensión en `.gitignore`) y lo que sigue sin probarse en Google real están anotados en [docs_work/proximos_pasos.md](docs_work/proximos_pasos.md).
**No se hace por iniciativa propia**: hay cientos de enlaces implicados y requiere el visto bueno.

---

## Principios que rigen el proyecto

### Priorización: MoSCoW

Todo lo que se prioriza —historias, requisitos, objetivos— usa **MoSCoW**:

| | Significa |
|---|---|
| 🔺 **Must** · imprescindible | Sin esto, el entregable **no sirve**. No es "muy importante": es que sin ello no se puede entregar |
| 🔸 **Should** · importante | Duele que falte, pero hay forma de salir del paso |
| 🔹 **Could** · deseable | Se hace si sobra capacidad |
| ⬜ **Won't** · no ahora | Decidido conscientemente que no entra en este alcance |

**La disciplina está en el reparto, no en la etiqueta.** Si más de la mitad de lo pendiente es
*Must*, la priorización ha dejado de priorizar y hay que revisarla: cuando todo es imprescindible,
nada lo es. *Won't* se escribe explícitamente — un "no" registrado evita volver a discutirlo cada
tres meses.

### Diseño: SOLID, KISS, DRY, YAGNI, Clean Code y Clean Architecture

Seis principios, y no todos pesan igual aquí. Estos cuatro son los que **más muerden** en un
proyecto de Apps Script procedural que mueve nóminas:

| | Qué exige aquí |
|---|---|
| **DRY** · no te repitas | La misma función copiada en dos scripts se corrige en uno y se olvida en el otro. Y como los dos mueven nóminas, **el olvido se paga en dinero** |
| **KISS** · simple | La solución más simple que resuelva el caso real. Un `if` legible gana a una abstracción elegante que nadie más va a mantener |
| **YAGNI** · no lo vas a necesitar | No se construye para un futuro hipotético. Si hace falta, se añade entonces |
| **Clean Code** | Nombres que dicen lo que hacen, funciones cortas, sin comentarios que expliquen lo que el código debería decir solo |

**Clean Architecture** se aplica por su espíritu: separar **qué se decide** de **cómo se guarda**.
En la práctica, aquí significa que la lógica de negocio no debe estar pegada a `SpreadsheetApp`: los
IDs, nombres de hoja y posiciones de columna van en configuración, y la lógica los recibe.

#### SOLID, adaptado a lo que este código es

El código es **Google Apps Script procedural**, no orientado a objetos, así que SOLID se aplica por
su espíritu y no por su letra. Dos de los cinco principios son los que de verdad muerden aquí:

- **S · Responsabilidad única.** Una función hace **una cosa**. Validar, escribir, registrar y
  notificar son cuatro cosas: si están en la misma función, no se puede probar ninguna por separado
  ni cambiar una sin arriesgar las demás.
- **D · Inversión de dependencias.** Lo que puede cambiar —identificadores de hojas, nombres de
  columnas, destinos— va en **constantes al principio del archivo o en datos**, nunca esparcido por
  la lógica. La lógica depende de esa configuración, no al revés.

Los otros tres se aplican en lo que tienen de traducible: **O** — ampliar debe hacerse añadiendo
datos (un concepto nuevo, una columna en el mapeo), no editando la lógica que los recorre. **L** e
**I** apenas tienen equivalente sin herencia ni interfaces, y forzarlos aquí sería teatro.

**Y la regla que más pesa en este proyecto, que es DRY llevado al caso concreto: no duplicar.** Cuando
la misma función vive copiada en dos scripts, se corrige en uno y se olvida en el otro — y como los
dos mueven nóminas, el olvido se paga en dinero. Antes de copiar una función a otro proyecto, hay
que preguntarse si no debería ser una librería compartida.

---

## Estándares que sigue la documentación

| Documento | Estándar | Qué implica |
|---|---|---|
| [SSD.md](docs_solutions/docs_design/SSD.md) | **arc42** | La especificación y el diseño siguen la estructura de arc42, y ahí vive la **matriz de trazabilidad completa** |
| [adr/](docs_solutions/docs_design/adr/README_ADR.md) | **MADR** | Cada decisión, en formato MADR, **declarando con qué RF y RNF se relaciona** |

### La cadena de trazabilidad

Nada existe suelto. Cada pieza dice de dónde viene:

```
problem.md  ──►  historias_usuarios.md  ──►  requisitos_funcionales.md  ──►  ADR
                                                       │                     ▲
                                                       ▼                     │
                                          requisitos_no_funcionales.md  ─────┘
```

- **Cada HU** se relaciona con `problem.md`.
- **Cada RF** se relaciona con una o varias HU.
- **Cada RNF** se relaciona con un RF si hay relación directa; si no la hay, **explica por qué
  existe**. Un RNF sin justificación es un requisito que nadie pidió.
- **Cada ADR** declara, dentro del propio ADR, con qué **RF y/o RNF** se relaciona.
- **El SSD** recoge la relación completa, para poder comprobar de un vistazo que todo está trazado.

> **Lo que no tiene trazabilidad no se planifica**: es un item de una versión futura, y vive en
> [`items_v3.md`](docs_work/items_v3.md). Solo se construye lo que se puede rastrear hasta el
> problema que lo justifica.

---

## La auditoría de dos pasadas

Cuando se pida **revisar el repositorio**, se hacen **dos pasadas completas**, no una:

| | Qué busca |
|---|---|
| **Pasada 1 · Estructura** | Enlaces rotos, archivos huérfanos, referencias a rutas que ya no existen, duplicación de código, IDs sin documentar, convenciones de nombre incumplidas, índices incompletos |
| **Pasada 2 · Coherencia** | Documentos que afirman lo que el código ya no hace, contradicciones entre documentos, trazabilidad rota, decisiones sin requisito, numeraciones desincronizadas |

**El informe se entrega en la conversación**, no en un archivo. Y **los hallazgos se registran como
primeros pasos** en [`proximos_pasos.md`](docs_work/proximos_pasos.md), siguiendo la regla de que
el sprint nuevo entra por arriba.

> **Por qué dos y no una.** La primera pasada encuentra lo que está roto; la segunda, lo que está
> mentiroso. Lo segundo es más peligroso: un enlace roto se ve, una documentación que describe un
> sistema que ya no existe se cree.
