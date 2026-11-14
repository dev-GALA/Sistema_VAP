# Buenas prácticas para escribir skills (resumen verificado)

Contenido:
1. Fuentes
2. Nombre
3. Descripción
4. Tamaño y estructura
5. Grados de libertad
6. Escribir las instrucciones
7. Scripts
8. Pruebas
9. Antipatrones
10. Campos propios de Claude Code

## 1. Fuentes

Verificadas el 2026-11-14. Si algo de este resumen las contradice, mandan ellas: actualiza este archivo.

- Especificación Agent Skills: https://agentskills.io/specification
- Guía de buenas prácticas de Anthropic: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Skills en Claude Code: https://code.claude.com/docs/en/skills
- Visión general de extensiones: https://code.claude.com/docs/en/features-overview

## 2. Nombre

- Entre 1 y 64 caracteres: minúsculas, números y guiones. Sin guion inicial ni guiones consecutivos. Debe coincidir con el nombre de la carpeta.
- No puede contener las palabras `anthropic` ni `claude`, ni etiquetas XML.
- La guía recomienda el gerundio (`processing-pdfs`) y admite sustantivos (`pdf-processing`) o imperativos. Lo importante es la consistencia dentro de la colección. Convención del usuario: prefijo de tipo y sustantivos.
- Evitar nombres vagos (`helper`, `utils`) o genéricos (`documents`, `data`).

## 3. Descripción

- Obligatoria, de 1 a 1024 caracteres, sin etiquetas XML.
- Siempre en tercera persona: se inyecta en el prompt de sistema. Mal: «Puedo ayudarte con...».
- Dice qué hace **y** cuándo usarla, con términos que el usuario usaría. Claude elige entre muchas skills solo por esta descripción.
- Mal: «Ayuda con documentos», «Procesa datos».
- En YAML, una descripción sin comillas no puede contener dos puntos seguidos de espacio ni ` #`.

## 4. Tamaño y estructura

- Cuerpo de SKILL.md por debajo de 500 líneas. Al acercarse, dividir en archivos de apoyo.
- Carga progresiva: siempre se ve nombre y descripción; el cuerpo se lee cuando la skill aplica; los archivos de apoyo, solo si hacen falta.
- Todos los archivos de apoyo se enlazan **directamente desde SKILL.md**. Una cadena de archivos que apuntan a otros hace que Claude lea solo fragmentos.
- Un archivo de apoyo de más de 100 líneas empieza con un índice.
- Organizar por dominio o por condición, de modo que Claude lea solo el archivo que toca.

## 5. Grados de libertad

| Nivel | Cuándo | Cómo |
|---|---|---|
| Alto | Varios enfoques válidos, depende del contexto | Instrucciones en texto |
| Medio | Hay un patrón preferido con variaciones | Pseudocódigo o script con parámetros |
| Bajo | Operación frágil, secuencia obligatoria | Script exacto, pocos o ningún parámetro |

## 6. Escribir las instrucciones

- Concisión: cada párrafo debe justificar su coste en tokens; no explicar lo que Claude ya sabe.
- Dar un valor por defecto y, si hace falta, una única salida alternativa; no un menú de opciones.
- Terminología consistente: un término por concepto.
- Ejemplos concretos de entrada y salida transmiten el estilo mejor que las descripciones.
- Plantilla estricta cuando el formato importa («usa siempre esta estructura»); flexible cuando no.
- Flujos largos como lista de progreso copiable, que Claude marca al avanzar.
- Bucle de validación: ejecutar el validador, corregir, repetir hasta que pase.
- Evitar información con fecha de caducidad.
- Explicar el porqué en lugar de imponer con MAYÚSCULAS.

## 7. Scripts

- Resolver los errores dentro del script en vez de dejar que Claude los resuelva.
- Cada constante justificada; nada de números mágicos.
- Indicar si el script se **ejecuta** o se **lee** como referencia.
- Listar las dependencias; no suponer que están instaladas.
- Rutas con `/`, nunca con `\`.
- Para operaciones por lotes o destructivas: planificar, validar y solo después aplicar, con mensajes de error específicos.

## 8. Pruebas

- Al menos tres evaluaciones, idealmente probadas con modelos distintos (Haiku, Sonnet y Opus).
- Orden recomendado: ver dónde falla Claude sin la skill, escribir tres escenarios, medir, escribir lo mínimo que cubra los fallos, iterar.
- Observar cómo navega Claude: archivos que nunca abre (sobran o están mal señalizados), archivos que relee siempre (deberían estar en SKILL.md), enlaces ignorados.
- Dos sesiones: una diseña y refina la skill; otra, nueva y con la skill cargada, la prueba en tareas reales.

## 9. Antipatrones

- Rutas con `\`.
- Demasiadas alternativas sin un valor por defecto.
- Información que caduca fuera de una sección de patrones antiguos.
- Términos mezclados para lo mismo.
- Cadenas de archivos de apoyo.
- Suponer paquetes instalados.
- Constantes sin justificar.
- Scripts que fallan y dejan el problema a Claude.
- Descripciones vagas o en primera persona.
- Nombres inconsistentes dentro de una colección.

## 10. Campos propios de Claude Code

Además de los de la especificación (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`), Claude Code admite, entre otros:

- `disable-model-invocation: true`: solo el usuario la invoca con `/nombre`; la descripción no ocupa contexto. Recomendado para skills con efectos secundarios.
- `user-invocable: false`: solo Claude la usa; no aparece en el menú `/`.
- `context: fork`: se ejecuta en un contexto aislado (subagente).
- `allowed-tools`, `model`, `agent`, `argument-hint`, `hooks`.

Con la misma skill en varios niveles gana la de mayor prioridad: gestionada, usuario y proyecto, en ese orden.
