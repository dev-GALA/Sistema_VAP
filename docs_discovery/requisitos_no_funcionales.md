# Requisitos no funcionales — Sistema VAP

| | |
|---|---|
| **Versión** | 0.5 — separado de los funcionales |
| **Fecha** | 7 septiembre 2026 |
| **Responde a** | [Sprint 2 · OB-33](../docs_work/proximos_pasos.md) |
| **Complemento** | [requisitos_funcionales.md](requisitos_funcionales.md) |

---

## Cómo usar este documento

Los requisitos funcionales dicen **qué hace** el sistema. Estos dicen **bajo qué condiciones tiene
que hacerlo**: con qué garantías, con qué límites y a qué coste de mantenimiento.

> **La regla de este documento:** cada RNF se relaciona con un **RF** cuando la relación es directa.
> Cuando no la hay, **explica por qué existe** — un RNF sin RF y sin justificación es un requisito
> que nadie pidió, y acaba usándose para bloquear trabajo sin poder decir en nombre de quién.

> **La cadena de trazabilidad** ([regla en CLAUDE.md](../CLAUDE.md)):
>
> ```
> problem.md  ──►  historias_usuarios.md  ──►  requisitos_funcionales.md  ──►  ADR
>                                                        │                     ▲
>                                                        ▼                     │
>                                           requisitos_no_funcionales.md  ─────┘
> ```
>
> La relación completa, para comprobar de un vistazo que nada queda suelto, vive en el
> [SSD](../docs_solutions/docs_design/SSD.md).

### Convenciones

| Campo | Valores |
|-------|---------|
| **Estado** | ✅ Cumplido · 🟡 Parcial · 🔴 No cumplido · ⚪ En decisión |
| **Prioridad** | 🔺 Imprescindible · 🔸 Importante · 🔹 Deseable *(MoSCoW)* |
| **Relación con RF** | El RF que lo motiva, o la justificación **J-nn** de por qué existe sin él |

---

## Requisitos no funcionales

| # | Requisito | Estado | Prio | Relación con RF | Origen |
|---|-----------|--------|------|-----------------|--------|
| **RNF-01** | El sistema se construirá sobre la plataforma corporativa existente, sin requerir infraestructura nueva | ✅ | 🔺 | — *(ver justificación J-01)* | [problem.md §7](problem.md) |
| **RNF-02** | Los datos **de origen** se localizarán por **nombre de cabecera**, no por posición, para resistir reordenaciones de columnas | 🟡 | 🔺 | RF-12 · RF-21 | ADR-0010 · SSD |
| **RNF-03** | El sistema distinguirá los datos por **periodo (mes y año)**, sin necesidad de reestructurarse con el paso de los años | ✅ | 🔺 | RF-09 · RF-16 | SSD |
| **RNF-04** | Las operaciones de escritura serán seguras ante ejecuciones concurrentes | 🟡 | 🔺 | RF-05 · RF-17 | SSD · DT-13 |
| **RNF-05** | **Ninguna acción que escriba datos se ejecutará sin confirmación humana explícita** | 🟡 | 🔺 | **RF-17** *(directa)* | [problem.md §7](problem.md) |
| **RNF-06** | Ninguna operación **del sistema** destruirá datos reportados: las correcciones se añaden, no sustituyen | ✅ | 🔺 | **RF-08** *(directa)* | HU-07 |
| **RNF-07** | Las escrituras se realizarán **en bloque**, no celda a celda, para no degradarse al crecer el volumen | 🔴 | 🔸 | RF-22 | Deuda técnica |
| **RNF-08** | La interpretación de valores numéricos será correcta con independencia del separador decimal empleado | 🔴 | 🔺 | RF-60 | Deuda técnica |
| **RNF-09** | El sistema tratará datos retributivos y de carácter personal, y su acceso estará limitado a quien deba tenerlo | 🟡 | 🔺 | — *(ver justificación J-02)* | [problem.md §7](problem.md) |
| **RNF-10** | Quien use el sistema seguirá trabajando de forma reconocible: no se le exigirá aprender una herramienta compleja | ✅ | 🔺 | — *(ver justificación J-03)* | [problem.md §8](problem.md) |
| **RNF-11** | El sistema será mantenible por **una sola persona** compatibilizándolo con otras funciones | 🟡 | 🔸 | — *(ver justificación J-04)* | [problem.md §7](problem.md) |
| **RNF-12** | Cada componente será independiente de los demás, de modo que el fallo de uno no impida operar el resto | ✅ | 🔸 | — *(ver justificación J-05)* | SSD |
| **RNF-13** | Ninguna operación superará el **límite de tiempo de ejecución** de la plataforma, con el volumen previsible de la plantilla | 🟡 | 🔺 | RF-16 · RF-20 | Deuda técnica |
| **RNF-14** | El registro de ejecuciones se conservará el tiempo suficiente para responder a una reclamación sobre un periodo pasado | 🟡 | 🔸 | RF-49 · RF-66 | HU-31 |
| **RNF-15** | Cuando el **destino** se direccione por posición fija, cualquier cambio en su estructura deberá detectarse antes de escribir | 🔴 | 🔸 | RF-22 | [R-08](../docs_solutions/docs_design/SSD.md#9-riesgos-y-limitaciones) |
| **RNF-16** | Cada función tendrá **una sola responsabilidad**, de forma que pueda comprobarse por separado | 🔴 | 🔸 | — *(ver justificación J-06)* | CLAUDE.md · DT-18 |
| **RNF-17** | Una misma lógica **no se duplicará** entre proyectos: se comparte o se aísla en un solo punto | 🔴 | 🔸 | — *(ver justificación J-07)* | CLAUDE.md · DT-19, DT-20 |

### Los siete sin relación directa con un RF, y por qué existen

Un RNF que no se puede colgar de ningún requisito funcional **tiene que justificar su existencia**, o
es un requisito que nadie pidió. Estos siete la tienen:

| # | RNF | Por qué existe sin colgar de ningún RF |
|---|-----|----------------------------------------|
| **J-01** | RNF-01 · Plataforma corporativa | **Es una restricción de contexto, anterior a cualquier requisito.** Google Workspace ya estaba antes de que el sistema existiera. No se eligió: se heredó, y condiciona todo lo demás |
| **J-02** | RNF-09 · Acceso limitado | **Obligación legal, no funcionalidad pedida.** El sistema trata datos retributivos y personales; nadie escribió una historia que dijera *"quiero que mis datos estén protegidos"*, y aun así no cumplirlo sería una infracción |
| **J-03** | RNF-10 · Trabajo reconocible | **Condición de aceptación.** No hace nada, pero si no se cumple el sistema no se usa: quien opera el cierre lo abandonaría por una hoja de cálculo propia. Es el requisito que hace que todos los demás importen |
| **J-04** | RNF-11 · Mantenible por una persona | **Restricción de recursos.** El desarrollo lo lleva una sola persona compatibilizándolo con otras funciones. Un diseño que exija un equipo es un diseño que no se mantendrá |
| **J-05** | RNF-12 · Componentes independientes | **Contención de fallos.** Ningún RF pide que el sistema siga funcionando a medias; pero si la caída de un volcado impidiera reportar complementos, un fallo pequeño pararía el cierre entero |
| **J-06** | RNF-16 · Responsabilidad única | **Testabilidad.** Las funciones llegan a 185 líneas y hacen hasta cinco cosas: no hay nada del tamaño de un test, y de ahí que no haya tests. Es la causa, no el síntoma |
| **J-07** | RNF-17 · No duplicar | **DRY, con consecuencia económica.** 31 funciones están duplicadas entre scripts. Una corrección aplicada en uno se olvida en su gemelo — y como los dos mueven nóminas, **el olvido se paga en dinero** |

> **J-06 y J-07 son los dos que más se parecen a "estética" y menos lo son.** Los dos tienen
> consecuencia medible y ya materializada: la comprobación de destino limpio está en dos volcados y
> falta en los otros dos.

> **RNF-16 y RNF-17 no son estética.** Las funciones del sistema llegan a **185 líneas** y hacen
> hasta cinco cosas distintas, y hay lógica copiada en hasta tres scripts. Las dos cosas tienen
> consecuencia medible: no hay nada del tamaño de un test —de ahí que no haya tests—, y una
> corrección aplicada en un script se olvida en su gemelo. Ya ha pasado: la comprobación de destino
> limpio está en dos volcados y falta en los otros dos.

> **RNF-13 no es teórico.** La plataforma corta las ejecuciones que se alargan, y hay un volcado que
> escribe **celda a celda**: hoy funciona, pero es de las cosas que dejan de funcionar al crecer, y lo
> hacen a mitad de escritura. Un volcado cortado por la mitad es peor que uno que no arranca.

> **RNF-05 es el requisito no funcional más importante de este documento**, y el menos evidente. No
> nace de una limitación técnica sino de una condición de aceptación: quien opera el cierre maneja
> datos muy sensibles y necesita conservar el control de cuándo ocurre cada cosa.
>
> Se cumple hoy en los volcados —que preparan, informan y esperan confirmación— y **no** en los
> procesos que se disparan por sí solos ni en los export, que escriben sin preguntar. Todo lo que se
> construya de aquí en adelante debe cumplirlo: **automatizar el trabajo, no la decisión de
> hacerlo**.

---

---

## Resumen

| Estado | Nº |
|---|---|
| ✅ **Cumplidos** | 5 |
| 🟡 **Parciales** | 7 |
| 🔴 **No cumplidos** | 5 |
| | **17** |

**Diez tienen relación directa o indirecta con un RF; siete existen por sí mismos**, con su
justificación escrita arriba.

*Los no cumplidos —escritura en bloque, precisión numérica, detección de cambios en destino,
responsabilidad única y no duplicación— son **deuda técnica ya inventariada**, no funcionalidad
ausente. Su sitio de seguimiento es
[`deuda-tecnica.md`](../docs_work/dudas/deuda-tecnica.md).*
