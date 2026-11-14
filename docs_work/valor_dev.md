# Valor del desarrollo — Sistema VAP

| Campo | Valor |
|---|---|
| Código | `VALOR-DEV` |
| Versión | 0.1 |
| Fecha | 2026-11-14 |
| Estado | 🟡 Vivo — se revisa con cada cambio que añada valor registrable |
| Propietario | Dpto. Data y Tecnología |

Valoración del Sistema VAP desde dos perspectivas: **valor de mercado** (cuánto costaría reponerlo) y
**valor interno** (qué problemas resuelve y qué aporta a GALA). **Son estimaciones, no presupuestos
contrastados.** Este documento no fija requisitos ni decisiones, solo les pone precio.

Formato tomado de los `valor_dev.md` de `gala_buca` (método en dos partes, parámetros con fuente y
registro de revisiones) y de `carfa` (conclusión por delante, límites dichos antes de que se usen mal e
impacto interno acumulado), **con las mismas tarifas que BUCA**, para que las cifras sean comparables.
Lo particular de VAP, que ninguno de los dos tiene, está en las dos secciones siguientes.

**Última revisión:** 2026-11-14 · **Fase:** la Fase 1 (secretarias) y la Fase 2.A (sincronización de
formularios de profesores) están **en producción**; el resto de lo documentado está **pendiente de
construir** (ver «Lo que existe y lo que no»).

---

## Conclusión

Reponer a precio de mercado **lo que hoy existe** costaría **≈ 21.000 €** (intervalo 14.300 – 34.200 €;
255 – 356 horas, central ≈ 305 h, margen ±35 %), sin IVA. Es inferior a la de `gala_buca` (≈ 25.600 €) y a la de `carfa`
(23.265 – 47.580 €, cifras que cita BUCA), con menos código y más análisis.

**El valor que aporta todavía no se puede cifrar en euros.** Falta el «antes»: los diez resultados
deseados de `problem.md` §6 figuran con «sin dato». Lo que sí se puede decir, sin inventar nada, es
**de qué está hecho ese valor**: sustituir un proceso mensual manual para unas **~400 personas** y
**4 responsables de complemento** (ciclo que se repite 12 veces al año) por captura masiva con
constancia, volcados con informe previo y confirmación, y un historial acumulado por campo. El valor
principal no es el dinero que se evita gastar: es **no pagar mal a nadie**, que el proceso **no dependa
de una sola persona** y **poder reconstruir de dónde salió una cifra**.

### Tres límites de esta cifra, dichos antes de que se usen mal

- **Es coste de reponer, no valor ganado.** Un desarrollo puede ser caro de reponer y aportar poco, o
  al revés. Las dos partes de este documento **no se suman**.
- **Las horas son estimación de quien redacta, sin contraste externo**, calculadas sobre lo que hoy hay
  en el repo (no sobre un registro de horas reales). Las tarifas vienen de otro repo (BUCA), que las
  verificó el 2026-11-14; **aquí no se han vuelto a consultar las fuentes**.
- **Lo construido apenas está cubierto por pruebas.** Hay 4.449 líneas de Apps Script y 1.458 de
  interfaz, y las únicas pruebas automáticas **no prueban ese código**: 11 pruebas de Vitest comprueban
  el propio arnés de pruebas (`tests/soporte/`), una de Playwright carga el portal y 11 de Python
  comprueban el verificador de trazabilidad. La lógica de negocio se ha validado hasta hoy **contra
  producción** (deuda `DT-17`). Un valor que descansa en eso vale menos que uno probado. No se resta
  nada de la cifra, pero **se dice**.

---

## Lo que existe y lo que no

Antes de valorar, qué hay realmente (fuente: `historias_usuarios.md` «Resumen por estado» y
`requisitos_funcionales.md`, recuentos del 2026-11-14):

| | Historias de usuario (41) | Requisitos funcionales (71) |
|---|---|---|
| ✅ Implementado | **20** | **25** |
| 🟡 Parcial | 6 | 8 |
| 🔴 Pendiente | 14 | 37 |
| ⚪ En decisión | 1 | 1 |

**Lo implementado es «mover datos»**: maestro de personal, captura (complementos, horas extras,
actividad de profesores) y consolidación (volcados y exportación a SAGE). **Lo pendiente es «controlar el
proceso»**: coordinar el cierre, verificar contra fuentes externas (ADESLAS, COBEE, banco), cerrar el
mes, medir e informar. Esta frontera importa para la valoración:

- **La Parte A (reposición) valora solo lo que está construido.** Lo pendiente no se valora como si
  existiera.
- **La Parte B (valor aportado) se ancla a lo implementado.** Los beneficios de lo pendiente (saber qué
  falta, comprobar que lo pagado es lo calculado) son valor **futuro**; se nombran, no se cifran.
- Dos decisiones están **sin aplicar**: ADR-0015 (se retiró el cálculo del salario base del script SAGE;
  el cambio estaba en el repo y, el 2026-09-07, «sin desplegar» en Apps Script) y ADR-0016 (un único
  libro de vinculación, «sin aplicar»). **No he podido verificar hoy qué versión corre en producción**;
  está anotado en `proximos_pasos.md` (OB-39) y se valora el código tal como está en el repo.

---

## Aviso de método — leer antes de citar cualquier cifra

| | Parte A — Valor de reposición | Parte B — Valor aportado |
|---|---|---|
| Pregunta que responde | ¿Cuánto costaría **reponer** esto a precio de mercado? | ¿Cuánto **aporta** esto a la organización? |
| Magnitud | Coste de reconstrucción (€, una vez) | Beneficio recurrente (€/año) |
| Se basa en | Inventario de lo construido | `problem.md` (JS y RD) e historias implementadas |
| Sesgo principal | Las estimaciones de esfuerzo en software son malas | Lo escribe quien construye el desarrollo |

**Sumarlas da un número sin significado.** Toda cifra lleva su fórmula, su parámetro y la fuente del
parámetro. Un parámetro sin fuente se marca como **pendiente**, y lo que dependa de él queda como fórmula
sin resolver. No se inventan tarifas ni líneas base.

**Cuándo se actualiza:** en la revisión previa al commit (`dev-revision-cierre`). Si un cambio no añade
valor registrable, se anota en el registro que se revisó y no cambió. Las **cifras medidas** salen de
órdenes, no de memoria:

```bash
find docs_solutions/src -name '*.gs'   -print0 | xargs -0 cat | wc -l   # Apps Script
find docs_solutions/src -name '*.html' -print0 | xargs -0 cat | wc -l   # interfaz
find tests scripts -type f -print0 | xargs -0 cat | wc -l              # pruebas y scripts
cat docs_discovery/*.md | wc -l                                         # discovery
cat docs_solutions/docs_design/adr/*.md | wc -l                         # decisiones
npm test                                                                # pruebas de Vitest
python3 scripts/verificar_trazabilidad.py                               # trazabilidad
```

Las **líneas** son solo un indicador de tamaño (cuentan comentarios y líneas en blanco). Las **horas**
son el juicio de un profesional sobre lo que costaría hacerlo de cero.

---

## Parámetros

| Parámetro | Valor | Fuente | Fecha |
|---|---|---|---|
| Tarifa — Desarrollador senior (€/h, sin IVA) | **55 – 95, central 70** | Copiada del `valor_dev.md` de `gala_buca`: [tarifaautonomo.com](https://tarifaautonomo.com/blog/tarifa-hora-fullstack-espana) («Senior 5–10 años: 55–90 €/h») y [jobrise.io](https://jobrise.io/es/blog/tarifas-freelance-developer-espana-2026/) («Sénior: 65–95 €/h»), reverificadas por ese repo el 2026-11-14. **No reverificadas aquí** | 2026-11-14 |
| Tarifa — Analista / Product (€/h, sin IVA) | **35 – 65, central 46** | Ídem (franja «nivel medio»). **El paso de «nivel medio» a «analista» es un supuesto** | 2026-11-14 |
| Tarifa — Arquitecto / Tech Lead (€/h, sin IVA) | **90 – 140, central 90** | Ídem (franja «Expert/Lead, +10 años»); central = límite inferior para no inflar. **Una sola fuente: confianza baja** | 2026-11-14 |
| Tarifa de consultora | No se usa | Las otras franjas de consultora de los repos de GALA están marcadas como «supuestas» | — |
| Personas cuya retribución depende del proceso | ~400 | `problem.md` §1 | 2026-08-17 |
| Responsables de complemento que reportan | 4 | `problem.md` §1 | 2026-08-17 |
| Ciclos de cierre al año | 12 | `problem.md` §1 | — |
| Casos de un mismo profesor con más de un reporte en el mes (histórico) | 122 | `problem.md` §2.1 | 2026-08-17 |
| `coste_hora_admin` — Coste-hora de la Responsable de Administración (€/h) | **PENDIENTE** | Responsable del proyecto / RRHH. No se toma de BUCA: su 12,76 €/h es el SMI por decisión suya, no el coste de este puesto | — |
| `coste_hora_manager` — Coste-hora de un Responsable de complemento (€/h) | **PENDIENTE** | Ídem | — |
| `coste_hora_secretaria` — Coste-hora de una secretaria (€/h) | **PENDIENTE** | Ídem | — |
| `horas_cierre_mes` — Horas que dedica hoy el equipo al cierre (línea base de RD-01) | **PENDIENTE** | Medirlo: es la cifra que más cambia el resultado | — |
| `min_reporte` — Minutos por responsable y mes reportando (línea base de RD-06) | **PENDIENTE** | Medirlo con los 4 responsables | — |
| `errores_cierre` — Correcciones tras el cierre por mes (línea base de RD-02) | **PENDIENTE** | Responsable de Administración | — |
| `horas_mantenimiento_año` — Horas anuales de mantenimiento del sistema | **PENDIENTE** | Quien lo mantiene (hoy una sola persona, RNF-11) | — |
| Coste de licencias | 0 € adicionales | RNF-01: se construye sobre Google Workspace, que ya estaba | — |

**Lo que no se puede tomar de otro repo** son las filas `PENDIENTE`: son medidas de GALA. Las filas
marcadas como línea base son el parámetro más importante del documento: **sin saber cuánto se tarda
hoy, no hay ahorro que calcular.** Medirlas es trabajo de descubrimiento y tiene que hacerse **mientras
el proceso manual siga existiendo** (hoy sigue en parte: ver «Lo que existe y lo que no»); después ya no
se puede medir cómo era el trabajo sin el sistema.

---

## Parte A — Valor de reposición

Qué costaría reconstruir desde cero lo que hoy existe, por un perfil competente que **no** tuviera este
material delante. Las horas incluyen el análisis y las decisiones, no solo la escritura.

### Artefactos construidos

| # | Artefacto | Qué incluye | Perfil | Horas |
|---|---|---|---|---|
| A1 | Descubrimiento | `problem.md` (597 líneas: JTBD, 11 job stories, 10 resultados deseados, restricciones y anti-objetivos); 41 HU con criterios de aceptación; 71 RF y 17 RNF con sus 7 justificaciones; matriz de trazabilidad | Analista / Product | 28 – 40 |
| A2 | Mapa del proceso y trabajo con el negocio | `FLUJO.md` y 8 diagramas; 6 dudas formalizadas; 2 actas de reunión; análisis de los tres documentos de contraste (ADESLAS, COBEE, banco) | Analista / Product | 12 – 18 |
| A3 | 16 ADR (MADR) | Alternativas y consecuencias: Sheets como BBDD, webapp propia, responsable por complemento, envíos por mes y año, proyectos GAS independientes, auditoría centralizada, volcados por periodo, un único libro de vinculación | Arquitecto / Tech Lead | 14 – 20 |
| A4 | SSD | 753 líneas: arquitectura, modelo de datos de cuatro libros, componentes y flujos, 21 riesgos y trazabilidad completa (§12) | Arquitecto / Tech Lead | 10 – 14 |
| A5 | `proximos_pasos.md` | 1.043 líneas: 39 objetivos en 7 sprints con dependencias y tres vías | Arquitecto / Tech Lead | 5 – 8 |
| A6 | Complementos de secretarias | `Export_Complementos_Mensuales` (1.132 líneas `.gs`: reporte masivo, correcciones sin borrar, consulta de envíos, notificaciones, exportación mensual) y 3 pantallas (943 líneas HTML) | Desarrollador senior | 47 – 64 |
| A7 | Horas extras de secretarias | Sincronización del desplegable (342) y volcado por periodo con informe y confirmación (600), más diálogo (251 HTML) | Desarrollador senior | 32 – 43 |
| A8 | Actividad de profesores | Sincronización (343), volcado con acumulación campo a campo (666) y diálogo (264 HTML) | Desarrollador senior | 34 – 46 |
| A9 | Scripts SAGE | `export_SAGE` (461 líneas) y cruce de la BBDD de personas con SAGE (905): cruce por cabecera, volcado Neto/Bruto, auditoría | Desarrollador senior | 41 – 54 |
| A10 | Auditoría de código y deuda técnica | 20 entradas de deuda técnica verificadas contra los Sheets reales | Desarrollador senior | 6 – 9 |
| A11 | Verificador de trazabilidad (`scripts/`) | 215 líneas de Python sin dependencias y sus 11 pruebas (141 líneas) | Desarrollador senior | 5 – 8 |
| A12 | Arnés de pruebas | 800 líneas en `tests/`: doble de Google en memoria (519), cargador de `.gs` en Node, Vitest y Playwright | Desarrollador senior | 14 – 20 |
| A13 | `README`, `CHANGELOG`, `LICENSE`, `.gitignore`, `CLAUDE.md` del proyecto | Incluye reglas de datos personales y de no actuar sin permiso | Desarrollador senior | 4 – 7 |
| A14 | Este documento | Doble enfoque, parámetros y fórmulas sin resolver | Arquitecto / Tech Lead | 3 – 5 |
| | **Total** | | | **255 – 356 h** |

Estimación central: **≈ 305 h** (unas 38 jornadas). Margen declarado: **±35 %**. No se valoran las skills
de `.claude/skills/` (viven fuera del repo en origen) ni `backup_old_js/` (copias históricas).

### Tamaño medido (2026-11-14)

| Capa | Líneas |
|---|---|
| Apps Script (`.gs`, 7 archivos) | 4.449 |
| Interfaz (`.html`, 5 archivos) | 1.458 |
| Pruebas y arnés (`tests/`) | 800 |
| Python (verificador y sus pruebas) | 356 |
| Documentación (discovery, SSD, plan, flujo: 4.495; ADR: 795; dudas y actas: 1.933) | ≈ 7.200 |

### Contraste con otros desarrollos de GALA

Horas «todo incluido» frente a líneas de código y pruebas (solo indicador de tamaño; las horas de cada
repo son estimación de quien construye). Datos de otros repos tomados del `valor_dev.md` de BUCA, no
reverificados.

| Desarrollo | Código + pruebas (líneas) | Horas | Horas por 1.000 líneas |
|---|---|---|---|
| `site_bomberos_2026` | ≈ 16.500 | 315 – 530 | 19 – 32 |
| `carfa` (hasta v0.11) | ≈ 27.000 | ≈ 490 – 750 | 18 – 28 |
| `sigema` | ≈ 7.400 | 226 | 31 |
| `scripts_form_uniforme_expedientes` v1 | ≈ 1.750 | 56 – 88 | 32 – 50 |
| `gala_buca` | ≈ 12.500 | 292 – 418 | 23 – 33 |
| **Sistema VAP** | **≈ 7.060** (4.449 + 1.458 + 800 + 356) | **255 – 356** | **36 – 50** |

**Lectura:** VAP está en la **parte alta** de la franja, y es coherente: tiene **mucha documentación y
poco código y pocas pruebas** (≈ 7.200 líneas de documentos frente a ≈ 7.060 de código y pruebas), igual
que `scripts_form_uniforme_expedientes`, que sale caro por línea por la misma razón. **No lo valida**,
solo prueba que tiene el mismo orden de magnitud. Si se quisiera la cifra más prudente, el
límite inferior (255 h) es el que menos se puede discutir.

### Fórmula

```text
Valor de reposición = Σ (horas del artefacto × tarifa de mercado del perfil)
```

| Perfil | Horas (rango, central) | Tarifa (rango, central) | Mínimo | Central | Máximo |
|---|---|---|---|---|---|
| Arquitecto / Tech Lead (A3, A4, A5, A14) | 32 – 47 (39,5) | 90 – 140 (90) | 2.880 € | 3.555 € | 6.580 € |
| Desarrollador senior (A6 – A13) | 183 – 251 (217) | 55 – 95 (70) | 10.065 € | 15.190 € | 23.845 € |
| Analista / Product (A1, A2) | 40 – 58 (49) | 35 – 65 (46) | 1.400 € | 2.254 € | 3.770 € |
| **Total** | **255 – 356 (≈ 305)** | | **14.345 €** | **≈ 21.000 €** | **34.195 €** |

**Cómo leer la cifra.** El central (**≈ 21.000 €**) es lo que cabe citar. El mínimo y el máximo
multiplican a la vez los dos extremos (horas y tarifa), así que el intervalo es muy ancho a propósito y
no es una banda de confianza. **Sensibilidad:** con el margen de ±35 % sobre las horas, el central va de
≈ 13.650 a ≈ 28.350 €; si el arquitecto se valorase a la tarifa de desarrollador (70 €/h), el central
bajaría unos 790 €.

**Lo que sigue sin respaldo:** las horas son estimación propia sin contraste, y las tarifas de arquitecto
y analista salen de una o dos fuentes.

### Intangibles que también habría que reponer

No se cifran, porque cualquier número sería indefendible. Desaparecen si el desarrollo desaparece:

- **Conocimiento del proceso real**, difícil de reponer: el cierre arranca con una coordinación personal
  y presencial; el dato de un profesor **no tiene un único autor** (hay que acumular campo a campo, no
  quedarse con el último envío); existe **trabajo manual invisible** (vaciar la hoja de respuestas para
  que el volcado no reutilizara valores del mes pasado) que nadie había escrito en ningún procedimiento.
- **Dieciséis decisiones con sus alternativas.** Reponerlas no es copiar los ADR: es volver a hacer el
  análisis y equivocarse en los mismos sitios.
- **Riesgos identificados antes de materializarse** (R-01 a R-21): por ejemplo, que el volcado a Neto/Bruto
  escriba por posición fija, o que el archivo donde se calcula la nómina esté fuera del sistema.
- **La regla de datos personales** del proyecto: ningún fichero de ADESLAS, COBEE, bancos o SAGE entra en
  el repositorio. Es una política, no código, y evita el incidente más caro posible.
- **Trazabilidad establecida y verificada automáticamente** (JS → HU → RF/RNF → ADR). Retroajustarla sobre
  documentación existente es, en la práctica, inviable.

---

## Parte B — Valor aportado a la organización

Qué gana GALA por cada funcionalidad: tiempo que reduce, errores que evita, trabajo manual que elimina,
riesgo que mitiga.

> **Estado: partidas y fórmulas definidas, sin cifras.** Derivadas de `problem.md`. No existe línea base
> medida (los diez resultados deseados dicen «sin dato») ni coste-hora del equipo, así que **ninguna cifra
> en euros se cierra**. Presentarla de otra forma sería un error.

### Regla de anclaje

Cada entrada se ancla a una **`JS-NN`** (job story) o a un **`RD-NN`** (resultado deseado) **y** a las
HU/RF implementadas que lo producen. Si no se puede señalar qué situación del problema produce el
beneficio, no es valor del desarrollo: es una aspiración. Solo se valoran HU **✅ implementadas**; las
🟡 se valoran en lo que ya hacen y las 🔴 quedan fuera.

`Confianza`: **Alta** = línea base medida · **Media** = línea base estimada con quien hace el trabajo ·
**Baja** = supuesto sin validar. **Hoy todas las partidas son de confianza baja**: son hipótesis, nunca
resultados.

### Fórmulas

```text
Ahorro de tiempo (€/año)
  = (minutos ahorrados por operación × operaciones al año) / 60 × coste-hora del perfil

Errores evitados (€/año)
  = (tasa de error actual − tasa de error residual) × volumen anual × coste unitario del error

Riesgo mitigado (€/año)
  = probabilidad anual del incidente × impacto económico del incidente
  (se presenta siempre separado del ahorro, nunca sumado sin aviso)
```

### Partidas de valor (hipótesis pendientes de medir)

| # | Ancla | Qué aporta | Fórmula (€/año) | Confianza |
|---|---|---|---|---|
| B1 | `JS-01` · RD-06 · HU-04, HU-05 | Los responsables reportan **a todo su equipo de una vez** y no con un formulario por persona y concepto | `(min_antes − min_ahora) × 4 responsables × 12 / 60 × coste_hora_manager` | Baja — `min_reporte` sin medir |
| B2 | `JS-01` · HU-06 | Constancia de lo enviado: ya no hay envíos que acaben en spam y **no se noten** | Riesgo mitigado: `prob. de dato perdido × coste de un pago equivocado` | Baja — sin dato de incidentes anteriores |
| B3 | `JS-02` · HU-07, HU-08 | Corregir sin borrar lo anterior, y consultar lo ya enviado | Errores evitados: `correcciones al año × coste de reconstruir el dato` | Baja |
| B4 | `JS-05` · HU-01, HU-02, HU-03 | Quien causa baja deja de aparecer en los formularios; nadie queda fuera del cálculo | Errores evitados: `altas y bajas al año × tasa de fallo × coste del pago equivocado` | Baja |
| B5 | RD-01 · HU-14 | **Elimina el vaciado manual de la hoja de respuestas** y el volcado de horas extras a mano, con informe y confirmación previos | `(min_manual − min_con_volcado) × 12 / 60 × coste_hora_admin` | Baja — sin línea base |
| B6 | RD-02 · HU-15 | Actividad de profesores **acumulada campo a campo**: no se pierde lo que reportó otra secretaria (122 casos en el histórico) | Errores evitados: `122 casos / periodo medido × tasa de error al quedarse con el último × coste` | Baja |
| B7 | RD-01 · HU-16, HU-17 | Volcado de netos y brutos a la hoja de vinculación **sin teclear** ~400 filas | `(min_teclear − min_con_volcado) × 12 / 60 × coste_hora_admin` | Baja — sin línea base |
| B8 | `JS-04` · RD-04 · HU-20, HU-31 (🟡) | Hay rastro de lo que cada volcado hizo y de lo reportado, para **responder a una reclamación con hechos** | Riesgo mitigado: `reclamaciones al año × (horas de reconstruir sin rastro − horas con rastro) × coste_hora_admin` | Baja — HU-31 es parcial: la información está **repartida** |
| B9 | RD-05 · RNF-11, RNF-12 | El conocimiento de cómo se consolida **deja de vivir solo en una persona** | No se cifra: riesgo de parada en la semana de cierre | — |

Notas de método:

- **B1, B5 y B7 son tiempo** (se pueden sumar si comparten perfil); **B2, B3, B4, B6 y B8 son errores o
  riesgo** y se presentan aparte. B9 no se cifra.
- **No hay doble conteo con A**: la Parte A es coste de construir; la B, beneficio recurrente.
- **Lo que no aporta todavía** (se nombra, no se cifra): saber qué falta por reportar y por dónde va el
  cierre (`JS-03`, `JS-08`, HU-26 a HU-30), comprobar lo que se descuenta (`JS-09`, HU-23 y HU-24),
  confirmar que lo pagado es lo calculado (`JS-10`, HU-25), dar el mes por cerrado (`JS-07`, HU-22) y
  comparar periodos (`JS-11`, HU-33 a HU-35). Son las situaciones del Responsable de Administración, «el
  rol peor cubierto» (`problem.md` §5), y **construirlas es lo que más valor nuevo añadiría**.

### Ilustración con lo único medido: el volumen

No hay minutos medidos, pero sí volumen. Sin inventar ningún tiempo:

```text
Cada minuto ahorrado por persona y por mes, sobre ~400 personas
  = 400 min/mes = 6,7 h/mes = 80 h/año
```

Un ahorro de **10 minutos por persona y mes** (hipótesis, no dato) serían **800 h/año**. Para pasarlo a
euros falta `coste_hora_admin`. Como **cota inferior** solo para tener un orden de magnitud, con el
12,76 €/h de BUCA (SMI más cotización, **que no es el coste de este puesto**): 80 h × 12,76 ≈ **1.020 €
al año por cada minuto ahorrado por persona y mes**. La decisión de qué coste-hora usar es del
responsable.

### Umbral de rentabilidad

```text
Coste anual del Sistema VAP
  = licencias (0 €, RNF-01) + horas_mantenimiento_año × tarifa de desarrollador (70 €/h)

Horas del equipo que hay que ahorrar al año para cubrirlo
  = Coste anual del Sistema VAP / coste_hora_admin
```

Sin `horas_mantenimiento_año` ni `coste_hora_admin` no se puede resolver. **Con licencias a cero, el
umbral es solo el mantenimiento**, y se cubre con pocas horas ahorradas; pero esa afirmación está sin
medir.

### Valor no cuantificable

Se lista, no se cifra: que **lo que cobra una persona** (~400, sobre todo profesorado, que no interviene
en la captura ni puede contrastarla) tenga una cadena de datos defendible; llegar al cierre **sin la
sospecha** de que algo se quedó por el camino; que quien reporta **pueda demostrar que lo hizo**; y que el
mes no dependa de la presencia de una sola persona.

---

## Impacto interno acumulado

Lo que se sabe y lo que no.

**Medido (en documentos, no en este documento):**

- ~400 personas, 4 responsables de complemento, 55 autoescuelas y 12 cierres al año.
- 122 casos de un profesor con más de un reporte en el mismo mes: justifica la acumulación por campo.
- Primera pieza sustituida: el reporte masivo de complementos, **varios meses en uso**.
- 0 errores y 18 avisos de trazabilidad (`verificar_trazabilidad.py`, 2026-11-14).

**No medido todavía, y por eso no se cifra:**

- **Horas del cierre manual** (`RD-01`) y **correcciones tras el cierre** (`RD-02`): sin dato.
- **Descuadres entre lo calculado y lo pagado** (`RD-08`): hoy nadie lo comprueba.
- **Coste de mantenimiento**: una sola persona, compatibilizado con otras funciones.

**Riesgos que reducen este valor** (de `SSD.md` §9): ambos volcados dependen de que alguien pulse el botón
(R-09); los procesos automáticos no dejan rastro consultable (R-18); los movimientos entre libros se
hacen copiando y pegando (R-19); el archivo donde se calcula la nómina está fuera del sistema (R-20); el
código se sincroniza con Apps Script a mano (R-13). **El paso de repo a producción es manual**, así que
la cifra de la Parte A valora el repo, no lo desplegado.

---

## Resumen para dirección

| Concepto | Cifra | Estado |
|---|---|---|
| **Valor de reposición** | **≈ 21.000 €** (14.300 – 34.200 €) = 255 – 356 h (≈ 305 h, ±35 %) × tarifas de mercado de 2026 | Horas estimadas por quien redacta; tarifas con fuente, heredadas de BUCA |
| **Valor aportado** | Sin cifra. Orden de magnitud: ≈ 80 h/año por cada minuto ahorrado por persona y mes | Hipótesis; faltan línea base y coste-hora |

Qué existe hoy, dicho sin adornos: **un proceso de captura y consolidación en producción para
secretarias y profesores, con 20 de 41 historias implementadas, documentado y trazado, pero sin pruebas
automáticas sobre su lógica y sin ninguna medida del «antes».** El valor de reposición es real y defendible
como orden de magnitud. El valor aportado **existe pero no está medido**.

**Qué falta para cerrar la Parte B:** `horas_cierre_mes`, `min_reporte`, `errores_cierre`,
`horas_mantenimiento_año` y los tres costes-hora. Solo puede darlos GALA. **Esta es la medición más
urgente mientras el proceso manual siga siendo recuperable en la memoria de quien lo hacía.**

---

## Registro de revisiones

| Fecha | Cambio | Quién |
|---|---|---|
| 2026-11-14 | Creación del documento. Parte A con inventario de 14 artefactos (255 – 356 h, ≈ 21.000 €); tarifas heredadas de `gala_buca`. Parte B con partidas B1 a B9 ancladas a JS/RD, **sin cifras**: faltan línea base y costes-hora. | Redactado con Claude; pendiente de revisión del responsable |
