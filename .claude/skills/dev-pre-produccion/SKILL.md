---
name: dev-pre-produccion
description: Prepara por escrito las consecuencias de subir código o configuración a un entorno real o de dar por cerrado un diseño, indicando los efectos para quien lo usa (permisos, accesos, altas y bajas), lo que no se ha probado en real, lo que puede bloquear trabajo y cómo se vuelve atrás, y qué evita datos a medias o fallos silenciosos. Úsala siempre antes de desplegar, publicar, pasar a producción, cambiar permisos o configuración real, o cerrar un diseño, y cuando el usuario hable de subir a real, desplegar o publicar.
---

# Consecuencias antes de producción

Una consecuencia conocida o previsible que no se dijo es un fallo de quien preparó el cambio, no de quien lo aprueba. Por eso, **antes de subir nada**, el usuario recibe por escrito lo que va a pasar, y decide con eso delante.

```
Progreso:
- [ ] 1. Identificar qué se sube y dónde
- [ ] 2. Reunir hechos
- [ ] 3. Redactar las cuatro respuestas
- [ ] 4. Marcar lo no verificado
- [ ] 5. Presentar y esperar el sí
- [ ] 6. Si es Apps Script: pasos manuales (triggers, autorizaciones)
```

## 1. Qué se sube y dónde

Una frase: qué cambia (código, configuración, permisos, un diseño que se da por cerrado) y en qué entorno real.

## 2. Reunir hechos

Antes de escribir, mira lo que existe; no respondas de memoria:

- El diff o la lista de cambios.
- Los permisos o alcances que el cambio declara o necesita (manifiestos, roles, scopes).
- Los ADR de seguridad, copias de seguridad y resiliencia.
- `docs_work/pasos_para_produccion.md`, si existe: consúltalo y mantenlo coherente con lo que presentes.

## 3. Las cuatro respuestas

En lenguaje llano y corto. Si una respuesta es larga, no se entiende y no sirve para decidir:

1. **Consecuencias para quien lo usa:** permisos, accesos, altas y bajas de personas.
2. **Qué no se ha probado en el entorno real.**
3. **Qué puede bloquear trabajo real y cómo se vuelve atrás.**
4. **Qué evita que un fallo deje datos a medias o pase en silencio.**

Si alguna respuesta es «nada» o «no aplica», dilo expresamente y por qué: un hueco sin explicar se lee como un olvido.

## 4. Lo no verificado

Señala lo que no has podido comprobar, sobre todo nombres de menús o pantallas de terceros dados de memoria. No lo presentes como cierto.

## 5. Presentar y esperar

Entrega las cuatro respuestas (en total, unas 15 líneas) y **no subas nada hasta que el usuario lo lea y diga que sí**. Con el sí, procede solo con lo acordado y cuenta después exactamente lo que se hizo.

## 6. Apps Script: pasos manuales tras subir

Si lo que se sube es un proyecto de Apps Script, entrega **además** la lista de pasos manuales de Google que el código no hace: (1) triggers que deben existir, función que los crea y cómo comprobarlos (`verTriggers`); `borrarTriggers` elimina todos; (2) autorizaciones de la primera ejecución; (3) primera ejecución manual necesaria; (4) lo que no dispara triggers: los cambios hechos por script no lanzan `onEdit`/`onChange`, hace falta un trigger horario de respaldo; (5) la prueba con la que el usuario comprueba que funciona. No des el trabajo por terminado hasta que el usuario confirme que los triggers están creados. Si no hay triggers, di «no aplica».
