---
name: dev-cambio-codigo
description: Guía el orden de trabajo al añadir, cambiar o corregir código de un repo de desarrollo propio, con la prueba que falla primero, el cambio mínimo, las pruebas de arquitectura, la definición de hecho y los documentos que dependen del cambio. Úsala siempre que el usuario pida implementar una funcionalidad, corregir un fallo, refactorizar o tocar código de src, aunque no hable de pruebas, de capas ni de arquitectura.
---

# Cambio de código

Los principios (SOLID, KISS, DRY, YAGNI, ETC, Clean Architecture, FIRST) ya están en el CLAUDE.md global y en el del repo, y valen siempre. Esta skill no los repite: dice **en qué orden aplicarlos** y **qué se comprueba antes de dar el cambio por hecho**. Si algo choca con el CLAUDE.md del repo, manda el del repo.

```
Progreso:
- [ ] 1. Entender y localizar
- [ ] 2. Prueba primero
- [ ] 3. Cambio mínimo
- [ ] 4. Arquitectura
- [ ] 5. Pruebas y calidad
- [ ] 6. Lo que depende del cambio
- [ ] 7. Informar
```

## 1. Entender y localizar

Lee el CLAUDE.md del repo (stack, capas, comandos de prueba y calidad) y, si existe, `docs_work/proximos_pasos.md`. Decide en qué capa cae el cambio: regla pura (dominio), caso de uso (aplicación), adaptador (infraestructura) o interfaz. Si es una funcionalidad nueva, **su HU y su requisito se registran antes y en el mismo cambio** (skill `dev-trazabilidad`). Si la decisión es relevante, consulta antes con pros y contras; no la tomes tú.

## 2. Prueba primero

Escribe la prueba y **comprueba que falla por la razón correcta**. Un fallo se reproduce con una prueba antes de arreglarlo. El nivel lo marca la definición del repo: unitaria para reglas, integración para adaptadores, extremo a extremo para recorridos completos. Datos ficticios, y nunca llamadas reales a servicios que cuestan dinero o consumen cupo.

## 3. Cambio mínimo

Lo mínimo para que la prueba pase: funciones pequeñas con nombre que explica la intención, errores explícitos y nunca silenciados, dependencias hacia dentro y servicios externos inyectados. No generalices antes de tiempo. Si dos principios chocan, nombra el conflicto y decide con criterio en vez de citar el que convenga.

## 4. Arquitectura

Si el repo tiene pruebas de arquitectura (por ejemplo `tests/arquitectura.test.js`), ejecútalas con el resto. **No añadas una excepción a la regla de dependencias en silencio**: si el cambio la necesita, dilo, explica por qué y propón la alternativa. Si el repo tiene capas pero no tiene estas pruebas, propón crearlas con `assets/arquitectura.plantilla.txt` (se copia a `tests/arquitectura.test.js` y se adapta; tiene extensión `.txt` para que ninguna herramienta la ejecute dentro de la skill); cómo adaptarlas está en `references/pruebas-de-arquitectura.md`.

## 5. Pruebas y calidad

Ejecuta las pruebas completas y el linter del repo, y la trazabilidad si tocaste documentos. **Nunca afirmes que pasan sin haberlas ejecutado en esta sesión.** Si el cambio toca la interfaz y el repo tiene pruebas de extremo a extremo, ejecútalas también.

## 6. Lo que depende del cambio

Revisa solo lo que el repo exige en su definición de hecho:

- Cambia algo que el usuario nota: entrada en `CHANGELOG.md`.
- Cambia o añade un requisito: skill `dev-trazabilidad`.
- Es una decisión que condiciona el futuro: skill `dev-nuevo-adr`.
- Cambia lo que describen el SDD, la arquitectura o el README: actualízalos en este mismo cambio.
- Deja algo abierto o una excepción nueva: anótalo en `docs_work/proximos_pasos.md`.

## 7. Informar

Pocas líneas: qué cambió, qué pruebas se ejecutaron y su resultado, qué excepciones o decisiones quedan pendientes. Sin commit ni push.
