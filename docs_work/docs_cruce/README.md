# docs_cruce — ficheros de contraste (ADESLAS, COBEE, banco)

Aquí se dejan, **solo en local**, los ficheros reales que llegan de fuera para estudiar su formato. Lo que
se sabe de ellos está en [fuentes_de_contraste.md](fuentes_de_contraste.md).

> ⚠️ **Los `.xls` y `.csv` de esta carpeta contienen datos personales** (DNI, IBAN, correos, importes de
> nómina, familiares) y **no deben entrar en el repositorio** ([CLAUDE.md, segunda regla](../../CLAUDE.md)).
>
> **Hoy los protege únicamente la extensión** (`*.csv`, `*.xls`, `*.xlsx`, `*.ods` en
> [.gitignore](../../.gitignore)). **La carpeta en sí no está declarada como ignorada**: un fichero con otra
> extensión (`.txt`, `.pdf`, un `.xlsx` renombrado) se subiría con un `git add .`. Decisión pendiente:
> mover los ficheros a [`../migration_data/`](../migration_data/README.md), que sí está ignorada, o declarar
> esta carpeta en `.gitignore` dejando pasar solo los `.md`.
