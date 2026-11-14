---
name: dev-revision-cierre
description: Realiza la revisión de cierre de jornada de un repo de desarrollo, con revisión de coherencia y huecos, revisión semántica de documentación y código, corrección de lo que no depende del usuario, anotación de lo pendiente en docs_work/proximos_pasos.md y propuesta de mensaje de commit. Úsala cuando el usuario diga que cierra o termina la jornada, que va a hacer commit o subir cambios, o pida una revisión final del repo, aunque no nombre la skill. No hace commit ni push.
---

# Revisión de cierre

Deja el repo **actualizado, coherente, robusto y correcto** antes de que el usuario haga el commit. El commit y el push los hace siempre él, no esta skill; esta revisión es la última comprobación antes de ese paso.

Copia esta lista y márcala al avanzar:

```
Progreso:
- [ ] 1. Delimitar qué ha cambiado
- [ ] 2. Revisión 1: coherencia y huecos
- [ ] 3. Revisión 2: semántica
- [ ] 4. Corregir lo que no depende del usuario
- [ ] 5. Anotar lo que sí depende de él
- [ ] 6. Pruebas y calidad
- [ ] 7. Informe y propuesta de commit
```

## 1. Delimitar

Ejecuta `git status` y `git diff --stat` (solo lectura). Lista archivos modificados, nuevos y renombrados. Revisa lo que cambió y también lo que **depende** de ello: si un ADR cambió de estado, hay que mirar su índice, el SDD y los enlaces.

## 2. Revisión 1: coherencia y huecos

Aplica a código y a documentación. Busca:

- Contradicciones entre documentos (ADR, SDD, arquitectura, README, requisitos).
- Rutas, nombres y enlaces que ya no existen, sobre todo tras renombrar ADR por cambio de estado.
- Trazabilidad rota: si cambió algo en `docs_dev/docs_discovery/`, aplica la skill `dev-trazabilidad`.
- Decisiones de diseño sin ADR, y ADR sin reflejo en el SDD.
- `CHANGELOG.md` sin entrada para los cambios y README desactualizado.
- Código o requisitos nuevos sin pruebas (unitarias, integración, E2E).
- Seguridad, copias de seguridad y resiliencia: en todo proyecto deben estar decididas y documentadas.
- Restos: TODO olvidados, código muerto, archivos temporales y secretos en los cambios (`.env`, claves, tokens).

## 3. Revisión 2: semántica

Lee texto y código como una persona que no estuvo presente:

- ¿Dice lo que se quiere decir? ¿Promete más o menos de lo que el código hace?
- Terminología consistente: un concepto, un nombre.
- Ambigüedades que admitan dos lecturas.
- Nombres de funciones y variables que describan lo que hacen; comentarios obsoletos.

## 4 y 5. Corregir o anotar

Un único criterio decide: **¿depende de una decisión del usuario?**

- **No:** se corrige en el momento y se anota en el informe.
- **Sí** (alcance, política, elegir entre alternativas): no se decide. Se añade a `docs_work/proximos_pasos.md` con lo que falta decidir y las opciones, y se actualizan los sprints y tareas. Si el archivo no existe, propón crearlo.

## 6. Pruebas y calidad

Ejecuta las pruebas y el linter o formateador del proyecto (el comando está en el README o en el manifiesto del proyecto). Informa del resultado tal cual. Si algo no se puede probar de forma automática en la plataforma, dilo y anótalo en `proximos_pasos.md` con la alternativa propuesta.

## 7. Informe

Corto (unas 15 líneas) y en lenguaje llano:

```
Corregido: ...
Pendiente de tu decisión (anotado en proximos_pasos.md): ...
Pruebas: ... (pasan / fallan cuáles)
Commit propuesto: "..."
```

El mensaje de commit propuesto tiene **menos de 15 caracteres**. Cuenta los caracteres; si son 15 o más, acórtalo. Ejemplo: `Programas v2` (12).
