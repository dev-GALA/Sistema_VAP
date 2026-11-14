---
name: dev-nueva-skill
description: Guía la creación, mejora o revisión de una skill propia (carpeta con SKILL.md) siguiendo la especificación Agent Skills, la guía de buenas prácticas de Anthropic y las convenciones del usuario, y la valida con un script antes de darla por buena. Úsala siempre que el usuario pida crear, escribir, mejorar, renombrar o revisar una skill, un SKILL.md o la descripción de una skill, aunque no diga la palabra skill.
---

# Nueva skill o cambio en una skill

Una skill mal hecha no se activa cuando debe, o gasta contexto cuando no hace falta. Este proceso evita ambas cosas siguiendo dos fuentes de referencia, la especificación Agent Skills y la guía de Anthropic (resumidas en `references/buenas-practicas.md`), más las convenciones del usuario.

```
Progreso:
- [ ] 1. Extraer del trabajo real
- [ ] 2. Decidir dónde vive
- [ ] 3. Nombre y descripción
- [ ] 4. Redactar
- [ ] 5. Validar con el script
- [ ] 6. Probar con casos reales
- [ ] 7. Entregar
```

## 1. Extraer del trabajo real

Una skill nace de algo que ya se repite. Si la conversación contiene el procedimiento, extráelo de ahí. Si no, pregunta **una cosa cada vez y por texto**: qué se repite, qué se explica cada vez, qué suele salir mal. Si es una idea sin uso real detrás, dilo y propón esperar a la tercera repetición; si el usuario insiste, adelante.

## 2. Decidir dónde vive

- **Regla que debe cumplirse siempre:** va en el CLAUDE.md, con una línea que apunte a la skill si hay un procedimiento largo. Una skill solo se carga si Claude la reconoce; el CLAUDE.md está siempre.
- **Procedimiento que se dispara en un momento concreto:** skill.
- **Algo que debe ocurrir sí o sí, sin que Claude decida:** hook. Menciónalo al usuario; no lo configures sin su OK.
- **Dónde:** global en `~/.claude/skills/` (se sincroniza con `cls`) o propia de un repo en `.claude/skills/`.
- **Efectos secundarios** (crea muchos archivos, sube, borra): valora `disable-model-invocation: true`, para que solo se ejecute cuando el usuario la invoque con `/nombre`.
- **Coherencia:** una skill nunca contradice el CLAUDE.md global. No pide commit ni push, no toca credenciales y no actúa sin OK donde esa regla lo exige.

## 3. Nombre y descripción

- **Nombre:** `<tipo>-<sustantivos>`. Prefijo de tipo de proyecto (`dev`, `web`, `datos`) y después sustantivos, no verbos: `dev-nuevo-adr`, `dev-revision-cierre`. Minúsculas sin tildes, guiones, hasta 64 caracteres, igual que la carpeta, sin «claude» ni «anthropic».
- **Descripción:** una línea de hasta 1024 caracteres, en tercera persona («Crea...», no «Puedo...»). Dice **qué hace y cuándo usarla**, con las frases que el usuario diría de verdad. Claude tiende a no activar skills cuando le convendría, así que termina con «aunque no diga...» o similar. Sin `<` ni `>`.
- **Sin dos puntos seguidos de espacio** en la descripción: rompen la cabecera YAML. Usa una coma o pon el valor entre comillas.

## 4. Redactar

Lo esencial (el detalle está en `references/buenas-practicas.md`):

- Escribe solo lo que Claude no sabe ya: cada párrafo debe justificar su coste en tokens.
- Explica el porqué en vez de poner MAYÚSCULAS.
- Pasos secuenciales con lista de progreso copiable. Plantilla exacta si el formato es estricto.
- Un valor por defecto, no un menú de opciones. Un mismo término para un mismo concepto.
- Menos de 500 líneas. Lo demás, en archivos de apoyo enlazados directamente desde SKILL.md, sin cadenas.
- Si lleva scripts, deben resolver sus errores, listar dependencias y decir si se ejecutan o se leen. Rutas con `/`.
- Si una skill existe ya, conserva su nombre. Si hay que renombrarla, busca el nombre antiguo en el CLAUDE.md y en las demás skills, y recuerda al usuario que `cls` no borra: la carpeta antigua hay que eliminarla a mano en el pendrive y en cada equipo.

## 5. Validar con el script

Ejecútalo; no lo sustituyas por una revisión a mano. Una revisión manual dejó pasar un error de YAML que el validador sí detectó. Con la skill nueva ya en su carpeta:

```
python3 ~/.claude/skills/dev-nueva-skill/scripts/validar_skill.py --coleccion ~/.claude/skills
```

Corrige cada `ERROR`. Revisa cada `AVISO` y corrígelo o justifícalo en el informe. Repite hasta que no haya errores. Si el script no está o falla, dilo; no pases a dar la skill por buena sin avisar. Sus pruebas están en `scripts/test_validar_skill.py`.

## 6. Probar con casos reales

La guía pide al menos tres pruebas. Hazlas, o di en el informe que la skill queda **sin probar**:

1. Escribe tres peticiones realistas, como las diría el usuario (con detalle, sin nombrar la skill) y una más que **no** deba activarla (un caso cercano pero distinto).
2. Pide al usuario que las pruebe en una **sesión nueva**, sin el contexto de cuando se creó la skill.
3. Observa: ¿se activó cuando debía y no cuando no?, ¿siguió los pasos?, ¿leyó los archivos de apoyo?, ¿hizo algo que el CLAUDE.md prohíbe?
4. Ajusta, sobre todo la descripción si no se activó, y repite.

## 7. Entregar

Informe corto: archivos creados o cambiados, salida del validador, qué pruebas se hicieron y cuáles no, y qué debe hacer el usuario (`cls` para llevarla al pendrive y `cll` en los otros equipos). Si es una skill `dev-*`, añádela a la tabla «Skills de desarrollo» del CLAUDE.md global; el validador avisa si falta.
