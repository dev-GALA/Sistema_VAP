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

- [README.md](README.md) — mapa del repositorio
- [docs/SSD.md](docs/SSD.md) — especificación y diseño
- [docs/adr/](docs/adr/README_ADR.md) — decisiones de arquitectura
- [docs/ROADMAP.md](docs/ROADMAP.md) — fases y estado
- [CHANGELOG.md](CHANGELOG.md) — registro de cambios
