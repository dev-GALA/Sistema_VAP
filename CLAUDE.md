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

## El proyecto

**Sistema VAP** (Valoración de Actividad Productiva) — sistema interno de **GALA Formación** que
automatiza el cálculo de los salarios mensuales variables de secretarias y profesores de
autoescuelas. Construido sobre Google Workspace: Sheets como base de datos, Google Apps Script para
la lógica, webapps GAS propias para reporte y consulta.

**Está en producción y mueve nóminas reales.** Razón de más para no tocar nada por iniciativa propia.

Documentación de referencia:

**`docs/` — el proceso y el trabajo por delante** (lo que se revisa con quien opera el sistema):

- [docs/FLUJO.md](docs/FLUJO.md) — el mapa del proceso mensual, del dato a la nómina
- [docs/retomar_trabajos.md](docs/retomar_trabajos.md) — qué toca hacer ahora, agrupado en sprints
- [docs/ROADMAP.md](docs/ROADMAP.md) — fases y estado
- [docs/dudas/](docs/dudas/README_dudas.md) — cuestiones sin resolver y deuda técnica
- [docs/reuniones/](docs/reuniones/README_reuniones.md) — guion y acta de cada reunión

**`docs_dev/` — el problema y el diseño**:

- [docs_dev/problem.md](docs_dev/problem.md) — el problema y los *Jobs To Be Done*
- [docs_dev/historias_usuarios.md](docs_dev/historias_usuarios.md) — historias de usuario
- [docs_dev/SSD.md](docs_dev/SSD.md) — especificación y diseño
- [docs_dev/adr/](docs_dev/adr/README_ADR.md) — decisiones de arquitectura

Y [README.md](README.md) — mapa del repositorio · [CHANGELOG.md](CHANGELOG.md) — registro de cambios

---

## Cómo se organiza el trabajo

El trabajo avanza por **sprints**, definidos en [docs/retomar_trabajos.md](docs/retomar_trabajos.md). Tres reglas
que hay que respetar sin que haga falta recordarlas:

1. **El sprint nuevo entra por arriba.** Cuando se decide abordar algo, se registra como sprint
   nuevo en primera posición y **el resto baja**: lo que era Sprint 1 pasa a ser Sprint 2, y así
   sucesivamente. Los identificadores de los objetivos (`OB-xx`) **no se renumeran**: identifican, no
   ordenan. El orden lo da el sprint.

2. **Lo que se cierra se marca en el ROADMAP.** Cada vez que un objetivo se completa, hay que
   reflejarlo en [docs/ROADMAP.md](docs/ROADMAP.md): marcar el punto de la fase correspondiente,
   actualizar los contadores del resumen y, si procede, el estado de la fase. El ROADMAP debe poder
   leerse solo y estar al día.

3. **Un objetivo cerrado deja rastro de qué salió de él.** Normalmente una respuesta a una duda, un
   ADR nuevo, o un punto del ROADMAP que ya se puede empezar.

Un sprint se cierra **por objetivo cumplido, no por fecha**: el desarrollo lo lleva una sola persona
compatibilizándolo con otras funciones.

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

### Diseño: SOLID, adaptado a lo que este código es

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

**Y una regla que no está en SOLID pero pesa más que ninguna en este proyecto: no duplicar.** Cuando
la misma función vive copiada en dos scripts, se corrige en uno y se olvida en el otro — y como los
dos mueven nóminas, el olvido se paga en dinero. Antes de copiar una función a otro proyecto, hay
que preguntarse si no debería ser una librería compartida.
