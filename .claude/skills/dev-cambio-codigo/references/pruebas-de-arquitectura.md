# Pruebas de arquitectura

Las reglas del CLAUDE.md que se pueden comprobar leyendo el código se convierten en pruebas, para que se cumplan aunque nadie se acuerde. Una prueba que falla bloquea el commit; un párrafo de texto, no.

El ejemplo completo que acompaña a esta skill está tomado de BUCA (JavaScript para Apps Script, probado con Vitest). **Se copia a `tests/arquitectura.test.js` y se adapta; no se usa tal cual.** Dentro de la skill es un `.txt` a propósito: con extensión de prueba, el ejecutor de pruebas del repo lo recogería desde `.claude/skills/` y fallaría. Se ejecuta con el resto de las pruebas.

## Qué comprueba

| Regla | Prueba |
| --- | --- |
| Cada archivo pertenece a una capa por su prefijo | Ningún archivo de `src/` sin prefijo de capa |
| El dominio es puro | Sin servicios de la plataforma, sin reloj ni azar reales, y sin depender de otras capas |
| Los casos de uso no usan la plataforma | Sin servicios externos: les llegan inyectados |
| Las dependencias apuntan hacia dentro | Aplicación solo depende de dominio; infraestructura no conoce los casos de uso salvo el punto de entrada |
| Sintaxis compatible con la plataforma | Nada posterior a la versión de JavaScript que se haya fijado |
| Cada módulo se puede cargar en las pruebas | Convención de exportación del repo |

## Cómo adaptarlas

1. **Capas y prefijos:** cambia `CAPAS` y la forma de detectar los módulos (`modulosPorCapa`) a la convención del repo.
2. **Servicios prohibidos:** sustituye `SERVICIOS_DE_GOOGLE` por los de la plataforma (acceso a red, disco, base de datos, reloj del sistema…).
3. **Sintaxis:** ajusta `POSTERIOR_A_ES2019` a la versión del lenguaje que fije el repo, o elimina ese bloque.
4. **Lenguajes distintos de JavaScript:** la idea es la misma (leer el código y comprobar imports). Escribe la prueba en el lenguaje del repo y con su herramienta de pruebas.

## Excepciones: deuda reconocida, no permiso

Si el repo ya incumple una regla al empezar, **no se relaja la regla**: se anota cada incumplimiento en `EXCEPCIONES`, con el motivo y dónde se registra la decisión (por ejemplo, el registro de riesgos de la arquitectura). Una prueba obliga a quitar la excepción en cuanto deja de ser necesaria, así que la lista solo puede encogerse.

## Antes de dar la prueba por buena

Inyecta a propósito una violación de cada regla (un servicio de la plataforma en el dominio, un módulo de infraestructura en un caso de uso) y comprueba que la prueba falla; después restaura el archivo. Una prueba que nunca ha fallado no demuestra nada.
