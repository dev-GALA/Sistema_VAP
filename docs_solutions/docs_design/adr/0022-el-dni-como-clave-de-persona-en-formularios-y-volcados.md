# ADR-0022: El DNI identifica a la persona en los formularios, los volcados y Complementos

- **Estado:** Propuesta
- **Fecha:** 2026-11-25
- **Decisores:** Fran Cañete (desarrollo)
- **Requisitos:** RF-04, RF-105

## Contexto

Los volcados cruzaban las respuestas con la Vinculación **por nombre**, y `id_trabajador` cambia cuando una persona cambia
de empresa. Una grafía distinta o un cambio de empresa hacía que alguien dejara de casar.

## Decisión

1. Las listas de los formularios (mecánicos, secretarías y profesores) solo ofrecen a quien tiene **Alta, `id_trabajador`,
   DNI con forma válida y nombre «APELLIDOS, NOMBRE»**; quien queda fuera se anota en el registro con fila, id y motivo.
2. La respuesta guarda el id **y el DNI**.
3. Los volcados cruzan **por DNI** y, solo si no lo hay, por nombre. DNI igual y nombre distinto: se escribe y se avisa.
   Nombre igual y DNI distinto, o DNI en varias filas: **no se escribe**.
4. Una **simulación** previa muestra cómo cruza cada persona sin escribir en los destinos.
5. Complementos aplica las mismas reglas de lista y guarda el DNI de cada secretaria.

## Consecuencias

- Un cambio de empresa o una grafía distinta no rompe el cruce.
- Quien tiene el DNI mal escrito **desaparece de la lista** hasta corregirlo.
- Las hojas de respuestas e históricos pasan a guardar DNI: más datos personales en esos libros.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Cruzar por `id_trabajador` | Cambia con la empresa y no estaba armonizado |
| Seguir por nombre | Falla con cualquier diferencia de grafía y no distingue homónimos |
