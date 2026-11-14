---
name: dev-nuevo-adr
description: Crea o actualiza un ADR en formato MADR dentro de docs_dev/docs_solution/adr/ con el número siguiente y el estado en el nombre del archivo y en la cabecera, y mantiene coherentes los enlaces, el índice README_ADR.md y el SDD. Úsala cuando el usuario quiera registrar, proponer, aceptar, rechazar, sustituir o dejar obsoleta una decisión de arquitectura o de diseño, o pida un ADR, aunque no use esas palabras.
---

# Nuevo ADR o cambio de estado

Un ADR deja por escrito **una decisión** y el motivo, para que quien llegue después (incluido el propio usuario) no tenga que reconstruirla.

## Antes de escribir

1. Lista `docs_dev/docs_solution/adr/` y lee `0000-plantilla.md` y `README_ADR.md`. **La plantilla del repo manda.** Si el repo no las tiene, avisa y, con el OK del usuario, créalas desde `references/plantilla-madr.md` y `references/readme-adr.md`.
2. El número es el más alto existente más 1, con 4 dígitos. No reutilices números aunque haya huecos o ADR rechazados.
3. Propón al usuario, en pocas líneas, el **nombre de archivo, el estado y un resumen de la decisión**, y espera su OK.

## Nombre del archivo

`NNNN-ESTADO-titulo-con-guiones.md`

- `ESTADO` en mayúsculas: `PROPUESTA`, `ACEPTADA`, `RECHAZADA`, `OBSOLETA` o `SUSTITUIDA`. Si los ADR existentes del repo usan otra forma, sigue la del repo.
- Título en minúsculas, con guiones, sin tildes ni ñ (`año` pasa a `ano`), corto pero comprensible sin abrir el archivo. Ejemplo: `0021-ACEPTADA-registros-con-contexto-y-sla-de-criticos.md`.
- El estado también va en la cabecera `status`, con el formato de la plantilla, y **ambos deben coincidir**.

## Contenido

Rellena la plantilla. Un buen ADR responde: qué problema o fuerza obliga a decidir; qué alternativas se consideraron (al menos dos); qué se decide y por qué; y qué consecuencias tiene, buenas y malas. Una decisión por ADR y sin relleno. Si trata seguridad, copias de seguridad o resiliencia, comprueba que cubre lo que el proyecto necesita: son decisiones obligatorias en todo proyecto.

## Cambiar el estado de un ADR existente

1. Renombra el archivo con el nuevo estado.
2. Cambia `status` en la cabecera para que coincida.
3. Busca el nombre antiguo en todo el repo (por ejemplo con `grep -rn`) y corrige cada enlace.
4. Actualiza `README_ADR.md` y la entrada del ADR en el SDD.
5. Si pasa a `SUSTITUIDA`, enlaza el ADR nuevo desde el antiguo y el antiguo desde el nuevo.

## Al terminar

- El SDD es el resumen de los ADR: añade o actualiza la entrada de este en `docs_dev/docs_solution/sdd.md`.
- Si la decisión cambia el problema, las historias o los requisitos, aplica la skill `dev-trazabilidad`.
- Informa en pocas líneas de los archivos creados, renombrados y modificados, y de los enlaces corregidos.
