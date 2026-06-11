# Architecture Decision Records (ADR) — Sistema VAP

Este directorio registra las **decisiones de arquitectura** del Sistema VAP, una por archivo.
Cada ADR es inmutable una vez aceptado: si una decisión cambia, se crea un ADR nuevo que
**supera** (supersedes) al anterior en lugar de editar el antiguo.

Formato: ver [`0000-plantilla.md`](0000-plantilla.md). Equivalencia con la antigua numeración
`DT-NN` del documento monolítico, indicada en cada ficha.

## Índice

| ADR | Título | Estado | (Antes) |
|-----|--------|--------|---------|
| [0001](0001-google-sheets-como-bbdd-central.md) | Google Sheets como BBDD central de personal | Aceptada | DT-01 |
| [0002](0002-webapp-propia-para-reporte-de-complementos.md) | Webapp propia para el reporte de complementos | Aceptada | DT-02 |
| [0003](0003-responsable-asignado-a-complemento-en-bbdd.md) | Asignar cada responsable a un complemento en BBDD | Aceptada | DT-03 |
| [0004](0004-formulario-horas-extras-vinculado-a-bbdd.md) | Vincular el formulario de Horas Extras a la BBDD | Aceptada | DT-04 |
| [0005](0005-gestion-de-envios-por-mes-y-anio.md) | Gestionar envíos por mes + año | Aceptada | DT-05 |
| [0006](0006-separar-bbdd-de-personal.md) | Separar la BBDD de personal del resto de hojas | Aceptada | DT-06 |
| [0007](0007-proyectos-apps-script-independientes.md) | Un proyecto Apps Script independiente por colectivo | Aceptada | DT-07 |
| [0008](0008-reutilizar-patron-de-sincronizacion.md) | Reutilizar el patrón de sincronización (gemelo) | Aceptada | DT-08 |
| [0009](0009-acumular-respuestas-por-mes-y-anio.md) | Acumular respuestas de formulario por mes/año | Aceptada | DT-09 |
| [0010](0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md) | Script único SAGE con menú propio y cruce por cabecera | Aceptada | DT-10 |
| [0011](0011-fusionar-volcado-de-nominas-en-el-script-sage.md) | Fusionar el volcado de nóminas en el script SAGE | Aceptada | DT-11 |
| [0012](0012-auditoria-centralizada-logs-y-errores.md) | Auditoría centralizada en `logs` / `errores` | Aceptada | DT-12 |

## Estados posibles

- **Propuesta** — en discusión, aún no implementada.
- **Aceptada** — vigente e implementada.
- **Superada** — reemplazada por un ADR posterior (se indica cuál).
- **Obsoleta** — ya no aplica, sin reemplazo.
