# ADR-0021: `id_trabajador` se genera en el maestro y un centinela evita números repetidos

- **Estado:** Propuesta
- **Fecha:** 2026-11-25
- **Decisores:** Fran Cañete (desarrollo)
- **Requisitos:** RF-101, RF-103, RF-104, RF-106

## Contexto

`id_trabajador` es `Empresa_Id_Sage`, pero en dos de las tres pestañas era **texto escrito a mano** y no cumplía su propia
regla: nombres de empresa antiguos, filas cruzadas y el mismo número en personas distintas. Con ese id se guardan las
huellas de `VAP_Pagos` y los envíos de Complementos. El export de SAGE **no trae DNI**, así que solo puede contrastarse
por nombre.

## Decisión

1. La columna `id_trabajador` de `VAP_Staff`, `VAP_Secretarias` y `VAP_Profesores` se **genera con una fórmula en la
   cabecera** (así no la mueven la ordenación ni los filtros) y queda **protegida**, editable solo por el propietario.
2. Un disparador simple `onEdit` **deshace** (o marca, si se pega un bloque) un número que ya use **otra persona** en la
   misma empresa, en cualquiera de las tres pestañas. La misma persona (mismo DNI, o mismo nombre si falta) puede repetirlo.
3. Quien no está en SAGE y comparte número con otra persona recibe un **número provisional desde 9000**. `JOSE` e
   `INTERCASTILLA` no tienen nómina en SAGE y no se contrastan.
4. La corrección inicial de `Empresa` e `Id_Sage` y el traslado de los id nuevos a las huellas y a Complementos se hacen
   con **dos scripts de un solo uso**.

## Consecuencias

- El id deja de poder escribirse a mano y los cambios de empresa o número se reflejan solos.
- **Ningún script puede escribir en esa columna**: la webapp (altas) y el cruce con SAGE deben adaptarse antes de usarse
  (R-31). La fórmula devuelve texto vacío hasta el final de la hoja, lo que puede afectar a `getLastRow` y `appendRow`.
- Cambiar `Empresa` o `Id_Sage` cambia el id, pero **no** actualiza por sí solo huellas ni envíos antiguos (R-32).
- El propietario puede saltarse la protección.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Texto y revisión periódica | Es lo que había: los errores se descubren tarde |
| Fórmula fila a fila | Se pierde al insertar filas o pegar encima |
| Un identificador interno que no dependa de la empresa | Obliga a migrar todos los libros; el DNI ya cumple ese papel donde hace falta ([ADR-0022](0022-el-dni-como-clave-de-persona-en-formularios-y-volcados.md)) |
