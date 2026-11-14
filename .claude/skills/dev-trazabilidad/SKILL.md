---
name: dev-trazabilidad
description: Mantiene y verifica la trazabilidad entre el problema (JTBD), las historias de usuario (HU), los requisitos funcionales (RF) y no funcionales (RNF) y el resto de documentos del repo, ejecutando el script de comprobación en Python. Úsala cuando se creen o cambien problemas, HU, RF o RNF, cuando cambie algo en docs_dev/docs_discovery, antes de cerrar la jornada si hubo esos cambios, o cuando el usuario pida comprobar la trazabilidad o buscar IDs huérfanos.
---

# Trazabilidad

La trazabilidad garantiza que nada se construye sin motivo y que ningún problema queda sin cubrir. Funciona en los dos sentidos:

- Cada punto del **problema** se desarrolla en al menos una **HU**.
- Cada **HU** aparece en al menos un **RF** y/o **RNF**.
- Todo **RF/RNF** vuelve a una HU, y esta a un punto del problema.
- Cada elemento **cita, en su propio documento, los ID con los que se relaciona**.

## Procedimiento

```
Progreso:
- [ ] 1. Identificar el esquema de ID del repo
- [ ] 2. Mantener las referencias al editar
- [ ] 3. Ejecutar el script de comprobación
- [ ] 4. Corregir o anotar los fallos
```

1. **Esquema de ID.** Lee los documentos de `docs_dev/docs_discovery/` y usa el esquema que ya exista. Si no hay ninguno, propón `P-01`, `HU-01`, `RF-01` y `RNF-01`.
2. **Al editar.** Cuando añadas o cambies un punto del problema, una HU, un RF o un RNF, actualiza en el mismo momento las referencias en ambos extremos. Es mucho más barato que reconstruirlas después.
3. **Comprobar.** Busca el script del repo (normalmente `verificar_trazabilidad.py`, dentro de la carpeta scripts del propio repo; mira el README o `--help` por si el comando varía) y ejecútalo. Comprueba **todos** los documentos del repo, no solo los cuatro de discovery.
4. **Fallos.** Para cada ID huérfano, enlace faltante o referencia a un ID que no existe:
   - Si la corrección es obvia y no depende de una decisión del usuario, corrígela.
   - Si hay que decidir (por ejemplo, falta una HU para un RF), anótalo en `docs_work/proximos_pasos.md` con las opciones.

Vuelve a ejecutar el script hasta que pase, o hasta que lo pendiente esté anotado.

## Si el repo no tiene script

Propón crearlo (y espera el OK). Debe ser un script en Python que:

- Extrae los ID y sus referencias de todos los `.md` del repo.
- Construye el grafo problema → HU → RF/RNF y lo comprueba hacia abajo y hacia arriba.
- Informa de huérfanos, referencias a ID inexistentes y duplicados, con archivo y línea.
- Termina con código de salida distinto de cero si hay fallos, para poder usarlo en un hook o en CI.

Acompáñalo de pruebas siguiendo FIRST, como el resto del código. Si el usuario tiene el script en otro repo propio, cópialo en lugar de escribir uno nuevo.

## Informe

Unas pocas líneas: qué se comprobó, qué falló, qué se corrigió y qué quedó anotado.
