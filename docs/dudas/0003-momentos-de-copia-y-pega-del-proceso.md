# DUDA-0003: Los momentos de copia y pega del proceso

| | |
|---|---|
| **Estado** | 🔴 Abierta |
| **Detectada** | 18 agosto 2026 |
| **Bloquea** | Convertir esos pasos en procesos semiautomáticos · saber cuándo un dato entró y quién lo metió |
| **Quién puede responder** | Responsable de Administración · Gestor de nóminas · Gerente |

---

## El hallazgo

El mapa del flujo ([FLUJO.md](../FLUJO.md)) deja ver que el proceso mensual tiene **al menos cuatro
momentos en los que alguien mueve datos a mano**, y ninguno de los cuatro deja constancia de qué se
movió, cuándo ni quién lo hizo:

| # | Dónde | Qué se mueve | Quién |
|---|-------|--------------|-------|
| 1 | Al `bbdd_export_sage_laboral` | El Excel exportado de SAGE | Gestor de nóminas |
| 2 | Al archivo de cálculo | Los datos de los archivos de vinculación y la exportación de complementos | Responsable de Administración |
| 3 | Al archivo de cálculo | Los datos propios del Gerente | Gerente |
| 4 | De vuelta a `bbdd_export_sage_laboral` | Los complementos ya calculados y ajustados | 🔍 sin determinar |

**Lo que se sabe** 🟩: los cuatro existen y los cuatro son manuales — se deduce de que ningún script
los hace.

**Lo que no se sabe** 🔍: en qué momento exacto ocurre cada uno, si hay un orden obligatorio entre
ellos, y qué pasa si uno se hace dos veces o se olvida.

## Por qué importa

**Un pegado en el momento equivocado borra el trabajo de todo un mes.** El caso más claro es el
cruce entre el movimiento 1 y el 4: si cada mes se pega un Excel nuevo sobre
`bbdd_export_sage_laboral` **después** de haber rellenado la columna de productividad, ese pegado se
lleva por delante el resultado de todo el proceso de complementos.

Y como ninguno deja rastro, si eso ocurriera **nadie podría saber después que ocurrió**: no hay
registro que consultar, solo el resultado ya mal.

Además, estos cuatro puntos son hoy **el techo de la trazabilidad del sistema**. Todo lo que hacen
los scripts queda anotado con su identificador de ejecución, su usuario y su hora; en cuanto el dato
pasa por uno de estos saltos, esa cadena se corta.

## La propuesta que hay que contrastar

No automatizarlos del todo, sino convertirlos en **acciones semiautomáticas que la Responsable de
Administración lance cuando lo considere**: el sistema prepara el movimiento, muestra qué va a
cambiar, y **solo escribe si ella confirma**.

Es exactamente el patrón que ya siguen los tres volcados —analizar, informar, confirmar, escribir— y
tiene dos ventajas sobre automatizarlo:

- **Deja rastro sin quitar el control.** Queda registrado qué se movió y cuándo, pero la decisión de
  cuándo hacerlo sigue siendo suya.
- **Es el patrón que ya conoce**, así que no hay que aprender nada nuevo
  ([problem.md §7](../../docs_dev/problem.md)).

> Merece la pena plantearlo así al presentarlo: el objetivo no es quitarle pasos de las manos, sino
> **que quede constancia de los que ya hace** — y de paso avisar si algo se hace fuera de orden.

## Preguntas concretas

1. **¿En qué momento del mes ocurre cada uno de los cuatro movimientos?**
2. **¿Hay un orden obligatorio entre ellos?** En concreto: ¿el Excel de SAGE se pega **antes** de
   rellenar la productividad, o después?
3. **¿Quién hace el movimiento 4**, el de devolver los complementos calculados al archivo de nómina?
4. **¿Ha pasado alguna vez que uno se olvidara o se repitiera?** Si ha pasado, ¿cómo se detectó?
5. **¿Habría inconveniente en que esos pasos se lancen desde una acción** que deje constancia, en
   lugar de con copiar y pegar?

## Qué hace falta para cerrarla

- [ ] Recorrer el cierre de un mes real con la Responsable de Administración, anotando cuándo ocurre
      cada movimiento
- [ ] Confirmar el orden entre el pegado del Excel y el relleno de la productividad
- [ ] Identificar quién ejecuta el movimiento 4
- [ ] Validar con ella que la versión semiautomática le resulta cómoda **antes** de construirla

---

## Respuesta

> *(pendiente)*

## Decisión y acciones derivadas

> *(pendiente — si acaba en un cambio de diseño, crear un ADR y enlazarlo aquí)*
