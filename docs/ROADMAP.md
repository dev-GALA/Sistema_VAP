# ROADMAP — Sistema VAP

Fases del proyecto y estado de avance. El detalle cronológico de cada cambio está en
[`../CHANGELOG.md`](../CHANGELOG.md); el diseño del sistema, en [`SSD.md`](SSD.md); las
decisiones, en [`adr/`](adr/README.md).

Leyenda: `[x]` completado · `[ ]` pendiente.

---

## FASE 1 — Secretarias *(en producción)*

### Fase 1.A — Complementos Salariales

- [x] `VAP_BBDD_Personas` como fuente única de verdad del personal activo ([ADR-0001](adr/0001-google-sheets-como-bbdd-central.md), [ADR-0006](adr/0006-separar-bbdd-de-personal.md))
- [x] Webapp de reporte masivo con lista dinámica de secretarias activas ([ADR-0002](adr/0002-webapp-propia-para-reporte-de-complementos.md))
- [x] Validación de que el responsable corresponde al complemento que reporta ([ADR-0003](adr/0003-responsable-asignado-a-complemento-en-bbdd.md))
- [x] Gestión de envíos y correcciones por mes/año ([ADR-0005](adr/0005-gestion-de-envios-por-mes-y-anio.md))
- [x] Email de confirmación al responsable y aviso al gestor en cada remesa
- [x] Webapp de consulta de envíos realizados
- [x] Exportación mensual a demanda de datos fusionados por secretaria y concepto

### Fase 1.B — Horas Extras

- [x] Vinculación del formulario `EXTRA SECRETARIAS 2026` a `VAP_Secretarias` (lista dinámica) ([ADR-0004](adr/0004-formulario-horas-extras-vinculado-a-bbdd.md))
- [x] Volcado automático de horas extras a `VINCULACIÓN GASTOS PERSONAL` (`onFormSubmit`)

### Fase 1.C — Portal / lanzador de complementos (GALA Hub)

- [x] Portal (template `Portal`, `?page=portal`): portada alineada con GALA Hub con dos accesos
  (Reportar / Consultar) que enlazan a las webapps existentes, sin duplicar lógica ni modificar
  las dos webapps anteriores. Punto de entrada del recurso `rec-004` de GALA Hub

---

## FASE 2 — Profesores

### Fase 2.A — Sincronización de formularios *(en producción)*

- [x] Carga de `VAP_Profesores` en `VAP_BBDD_Personas` (con estado `Alta`)
- [x] Sincronización automática del desplegable "SELECCIONE EL PROFESOR" con profesores activos ([ADR-0008](adr/0008-reutilizar-patron-de-sincronizacion.md))
- [x] Escritura automática del `ID_Profesor` en las respuestas
- [x] Despliegue en proyecto Apps Script independiente ([ADR-0007](adr/0007-proyectos-apps-script-independientes.md))

### Fase 2.B — Volcado y cálculo de nóminas *(en curso)*

- [x] Volcado de actividad con acumulación por (profesor + mes + año) ([ADR-0009](adr/0009-acumular-respuestas-por-mes-y-anio.md))
- [x] Acción **Calculo Salario Base** sobre la exportación SAGE laboral ([ADR-0010](adr/0010-script-unico-sage-con-menu-y-cruce-por-cabecera.md))
- [x] Acciones **Export Neto** / **Export Bruto** a las hojas de Vinculación ([ADR-0011](adr/0011-fusionar-volcado-de-nominas-en-el-script-sage.md))
- [x] Auditoría centralizada `logs` / `errores` correlacionada por `Run ID` ([ADR-0012](adr/0012-auditoria-centralizada-logs-y-errores.md))
- [ ] Identificar todas las fuentes de datos actuales de profesores y su estructura
- [ ] Definir complementos salariales específicos del colectivo
- [ ] Evaluar reutilización de la webapp de secretarias o necesidad de versión propia
- [ ] Completar el flujo de volcado hacia el cálculo final de nóminas

---

## Mejoras propuestas (backlog)

- **Registro de actividad de profesores:** destino con una fila por (profesor, mes) para
  histórico mensual; validar que el mes elegido coincide con el año de la marca temporal; hoja
  de auditoría de cambios (ver [ADR-0009](adr/0009-acumular-respuestas-por-mes-y-anio.md)).
- **Robustez del mapeo de destino:** localizar también las columnas de **destino** de los
  volcados por cabecera, no por posición fija (ver [R-08](SSD.md#9-riesgos-y-limitaciones)).
