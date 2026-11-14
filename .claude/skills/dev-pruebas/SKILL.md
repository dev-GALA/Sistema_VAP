---
name: dev-pruebas
description: Guía cómo diseñar, escribir y ejecutar las pruebas de un repo de desarrollo propio (unitarias, de integración y de extremo a extremo, con FIRST), incluido el código de Google Apps Script en archivos .gs que se prueba en Node con dobles en memoria, y deja montado el blindaje para que nadie se olvide de ejecutarlas. Úsala siempre que el usuario pida probar, testear o cubrir código, montar la base de pruebas de un repo, añadir una prueba, o cuando un cambio de código necesite pruebas, aunque no diga la palabra test.
---

# Pruebas de un repo de desarrollo

Probar es obligatorio con **cada cambio y cada código nuevo** (norma global). Esta skill dice **qué probar,
a qué nivel y cómo dejarlo montado**. El CLAUDE.md del repo manda sobre ella: fija las herramientas, los
comandos y la política de datos de prueba.

```
Progreso:
- [ ] 1. Leer lo que fija el repo
- [ ] 2. Elegir nivel y escribir la prueba que falla
- [ ] 3. Comprobar FIRST
- [ ] 4. Aislar lo externo
- [ ] 5. Ejecutar y blindar
- [ ] 6. Declarar lo que no se pueda probar
- [ ] 7. Informar
```

## 1. Leer lo que fija el repo

Del CLAUDE.md del repo y de sus ADR: herramientas (Vitest, Biome, Playwright, `unittest`), comandos, capas
y **política de datos de prueba**. Si no hay base de pruebas, propón montarla con las plantillas de `assets/` ([ayuda](assets/ayuda.plantilla.txt), [dobles](assets/dobles.plantilla.txt), [vitest](assets/vitest.config.plantilla.txt), [pre-commit](assets/pre-commit.plantilla.txt); se copian quitando `.plantilla.txt`) y espera el OK:
añade dependencias de desarrollo, y toda dependencia nueva va con su ADR.

## 2. Elegir nivel y escribir la prueba que falla

| Nivel | Qué prueba | Proporción |
|---|---|---|
| **Unitaria** | Reglas de dominio y casos de uso, con dobles en memoria, sin red, sin disco y sin reloj real | La mayoría |
| **Integración** | Los adaptadores de verdad contra respuestas grabadas o contra una copia | Las necesarias |
| **Extremo a extremo** | Un recorrido completo tal como lo usa la persona | Las menos |

- **Cada regla de negocio, una prueba que falle si la regla cambia.** Cada criterio de aceptación de un RF,
  al menos una, en el nivel más bajo en que se pueda comprobar.
- Se prueban **comportamientos y casos límite**, no líneas. La cobertura es un indicador, no el objetivo.
- Un fallo se reproduce **primero** con una prueba, y se comprueba que falla por la razón correcta.
- Cada prueba nombra en su descripción el RF/RNF que comprueba, para que la trazabilidad llegue al código.

## 3. Comprobar FIRST

| | Exige | Señal de incumplimiento |
|---|---|---|
| **F** Fast | Toda la tanda en segundos | Una prueba unitaria que abre un libro real |
| **I** Independent | Ninguna depende de otra ni del orden | Pasa solo si antes corrió otra |
| **R** Repeatable | Igual en cualquier máquina y cualquier día | `new Date()` dentro del dominio |
| **S** Self-validating | Dice sola si pasa o falla | Imprime y espera que alguien juzgue |
| **T** Timely | Se escribe con la regla, no meses después | Una tanda añadida al final «para cubrir» |

Una prueba que incumple uno de los cinco no es floja: da seguridad falsa. Se arregla o se borra.

## 4. Aislar lo externo

El dominio recibe **la fecha y el reloj como parámetros** y los servicios (hojas, Drive, correo) **inyectados**.
Para Apps Script (cargar los `.gs` en Node, dobles de hojas, sintaxis ES2019, comprobación de arquitectura)
lee [references/apps-script.md](references/apps-script.md).

**Datos de prueba:** siempre ficticios y sin datos personales. **Nunca llamadas reales a servicios que cuestan
dinero o consumen cupo, ni escritura en libros o entornos reales** salvo que el ADR del repo lo decida con su
procedimiento de borrado. Ante la duda, dobles o respuestas grabadas y consulta al usuario.

## 5. Ejecutar y blindar

1. **Ejecútalas tú**: antes de dar un cambio por hecho, antes de proponer un commit y en las revisiones.
   **Nunca digas que pasan sin haberlas ejecutado en esta sesión.**
2. **Gancho `pre-commit`** (`assets/pre-commit.plantilla.txt` → `.githooks/pre-commit`): bloquea el commit si
   fallan pruebas, trazabilidad o linter. Se activa una vez por clon con `git config core.hooksPath .githooks`.
   Instalarlo es decisión del usuario: propónlo.
3. **Local primero:** todo lo que se pueda hacer en local se hace en local. Una integración continua
   (GitHub Actions) solo se propone, con sus pros y contras, cuando algo no pueda hacerse en local, y ninguna
   credencial va a una plataforma externa sin decisión escrita.

## 6. Declarar lo que no se pueda probar

Lo que no se pueda probar de forma automática en la plataforma (un trigger de Google, un permiso, un
comportamiento de Apps Script) **se dice** y se anota en `docs_work/proximos_pasos.md` con la alternativa
propuesta, normalmente una comprobación manual con pasos escritos. Nunca se omite en silencio.

## 7. Informar

Qué pruebas se escribieron o cambiaron, la salida real de la tanda (cuántas pasan y cuántas fallan), lo que
quedó sin probar y por qué. Sin commit ni push.
