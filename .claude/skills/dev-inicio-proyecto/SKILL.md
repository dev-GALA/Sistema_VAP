---
name: dev-inicio-proyecto
description: Inicializa un proyecto de desarrollo nuevo con la estructura y los documentos estándar del usuario (docs_dev/docs_discovery, docs_dev/docs_solution con adr, docs_work, scripts, src, tests, CHANGELOG, README, LICENSE y el CLAUDE.md del proyecto) y deja anotadas las decisiones obligatorias pendientes. Úsala cuando el usuario diga inicializa un proyecto de dev, repo nuevo, nuevo proyecto o empezamos un proyecto, o pida preparar la estructura de un proyecto de desarrollo.
---

# Inicializar un proyecto de desarrollo

«Inicializar» significa dejar el repo con la estructura y los documentos base de los estándares del usuario, y las decisiones obligatorias identificadas. **No se escribe todavía código de la aplicación.**

```
Progreso:
- [ ] 1. Conocer el proyecto
- [ ] 2. Proponer el plan y esperar OK
- [ ] 3. Crear estructura y documentos base
- [ ] 4. Crear el CLAUDE.md del proyecto
- [ ] 5. Dejar anotado lo obligatorio pendiente
- [ ] 6. Informe
```

## 1. Conocer el proyecto

Pregunta **una cosa cada vez y por texto en el chat**, sin cuestionarios cerrados:

1. Nombre del repo y, en una frase, el problema que resuelve.
2. Plataforma o stack (decide dónde va el código, cómo se prueba y qué linter se usa).
3. Si hay otro repo propio del que copiar `LICENSE`, `CHANGELOG.md` y el script de trazabilidad.

No preguntes lo que puedas deducir (carpeta actual, archivos existentes).

## 2. Proponer el plan

En pocas líneas: carpetas y archivos que crearás, qué copiarás de otro repo y qué quedará pendiente. Si la carpeta ya tiene contenido, di qué no vas a tocar. Espera el OK del usuario antes de crear nada.

## 3. Estructura y documentos base

```
raíz/
├── CHANGELOG.md  README.md  LICENSE  CLAUDE.md  .gitignore
├── docs_dev/
│   ├── docs_discovery/   problem.md, historia_de_usuarios.md,
│   │                     requisitos_funcionales.md, requisitos_no_funcionales.md
│   └── docs_solution/    adr/, sdd.md, arquitectura.md
├── docs_work/            proximos_pasos.md, valor_dev.md
├── scripts/              comprobación de trazabilidad (Python) y sus pruebas
├── src/
└── tests/
```

- **Plantillas:** copia las de `assets/` (`problem.md`, `historia_de_usuarios.md`, `requisitos_funcionales.md`, `requisitos_no_funcionales.md`, `proximos_pasos.md`, `valor_dev.md`, `CHANGELOG.md`). Ya traen el sistema de IDs de la trazabilidad.
- **`adr/`:** aplica la skill `dev-nuevo-adr` para crear `0000-plantilla.md` y `README_ADR.md`.
- **`LICENSE`:** cópiala de otro repo propio. Si no hay ninguno, pregunta al usuario cuál quiere; no la elijas tú.
- **Script de trazabilidad:** cópialo de otro repo propio junto con su prueba. Si no hay, créalo con la skill `dev-trazabilidad`, con OK.
- **`.gitignore`:** según el stack. Los archivos con secretos (`.env` y similares) no se suben a git.
- **`README.md`:** breve: propósito, instalación, cómo ejecutar las pruebas y estructura.
- **Pruebas de arquitectura:** en cuanto exista el primer código, créalas con la skill `dev-cambio-codigo` (trae un ejemplo y cómo adaptarlo), para que la regla de dependencias la vigile una prueba y no solo el texto.
- **`sdd.md` y `arquitectura.md`:** esqueletos arc42 con la profundidad que pida la complejidad del proyecto.

## 4. CLAUDE.md del proyecto

Solo lo propio del proyecto: qué es, stack, cómo ejecutar pruebas y linter, particularidades. No repitas las reglas del CLAUDE.md global: ya se aplican.

## 5. Lo obligatorio pendiente

En `docs_work/proximos_pasos.md` deja una tarea por cada decisión que todo proyecto debe documentar: **seguridad, copias de seguridad y resiliencia** (cada una con su ADR). Propón además, sin crearlos, los ADR de arranque habituales: marco documental, arc42 y SDD, principios y estrategia de pruebas.

## 6. Informe

Archivos creados, lo copiado de otro repo, lo que queda pendiente y las decisiones que esperan al usuario. Sin commit ni push.
