# DUDA-0001: Los volcados van a tres libros distintos

| | |
|---|---|
| **Estado** | 🟢 **Resuelta** — 7 septiembre 2026 |
| **Detectada** | 17 agosto 2026 |
| **Resuelta por** | [Reunión 10](../reuniones/070926_10_revision_vap.md) → [ADR-0016](../../docs_solutions/docs_design/adr/0016-un-unico-libro-de-vinculacion.md) |
| **Bloqueaba** | Unificar el destino de los volcados · posible agujero en el cálculo final |
| **Quién podía responder** | Responsable de Administración · Gestor de nóminas |

---

## El hallazgo

Los volcados del sistema **no confluyen en una sola hoja**, como sugiere la documentación
([SSD §6.3](../../docs_solutions/docs_design/SSD.md), *"hoja final donde confluyen los volcados"*), sino que escriben en **tres
libros de Google Sheets diferentes**:

| Qué se vuelca | Script | Libro destino (ID) | Columnas |
|---------------|--------|--------------------|----------|
| Horas extras de secretarias | `VAP_Script Volcado Horas Extras Secretarias` | `1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc` | `AE`, `AH` |
| Actividad de profesores | `VAP_Script_Volcado_Actividad_Profesores` | `1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc` *(el mismo)* | `AC..CN` |
| Nóminas **Neto** | `VAP_script_export_SAGE` → `exportNeto` | `1HDwgihfz91atsLE99Qu0k3kTyBKpo3Iu3SaUtVGMPTs` | `G,H,I,L,P,Q,R,T` |
| Nóminas **Bruto** | `VAP_script_export_SAGE` → `exportBruto` | `1eTVPws0NVRMIlXgZYsUZANdfMyFYQtDlEEK5ujFt04A` | `G,H,I,L,P,Q,R,T` |

Los tres se escriben en una pestaña llamada **`Hoja 1`**, lo que hace fácil confundirlos al leer el
código.

## El dato que hace la pregunta relevante

**Los rangos de columnas no se solapan.**

```
Columna:  1 ......... 7 8 9 ... 12 ... 16 17 18 ... 20 ......... 29 ................. 92
                      G H I      L      P  Q  R      T           AC                  CN
                      └────── nóminas (neto/bruto) ──┘           └─── actividad ─────┘
                                                                  AE  AH
                                                                  (horas extras)
```

Las nóminas ocupan las columnas **7 a 20**; la actividad, de la **29 a la 92**. Caben en la misma
hoja sin pisarse — y de hecho **parece diseñado para eso**: conceptos de nómina a la izquierda,
actividad variable a la derecha, cruzando por la misma persona.

Pero hoy están repartidos en libros que no se comunican entre sí.

## Por qué importa

Si la nómina final se calcula desde **uno** de esos libros, los datos que se vuelcan a **los otros
dos** solo llegan al cálculo si alguien los copia a mano. O no llegan.

Concretamente: **la actividad de ~400 personas** (horas extras + actividad docente) se está
escribiendo en `1qK3…o8kc`. Si el cálculo se hace desde el libro de netos, esa actividad no está
donde se la espera.

No afirmo que haya un error: puede que exista un paso de consolidación entre libros que no está
documentado, o que los tres libros tengan funciones distintas y todo sea correcto. Pero **no consta
en ninguna parte**, y es la clase de cosa que conviene tener por escrito.

## Preguntas concretas

1. **¿De qué libro sale la nómina final?** ¿Del de netos, del de brutos, o de `1qK3…o8kc`?
2. **¿Existe un paso de copia entre libros?** Si la actividad se vuelca en uno y la nómina se calcula
   desde otro, alguien tiene que estar moviendo esos datos. ¿Quién, cuándo y cómo?
3. **¿Por qué neto y bruto son dos libros separados**, si reciben exactamente los mismos 8 campos con
   los mismos valores? La diferencia debe estar en las columnas que el script no toca.
4. **¿Cuál es el nombre real de cada libro?** En el código solo hay IDs, y eso hace difícil razonar
   sobre ellos.

## Qué hace falta para cerrarla

Acceso de lectura al **libro de netos** (`1HDw…MPTs`), o comprobar en él dos cosas:

- [ ] ¿El **nombre de la persona** está en la columna **C**? *(es como cruzan horas extras y profesores)*
- [ ] ¿Las columnas **AC..CN** están libres, o ya contienen esa misma actividad?

Con eso se puede decidir si unificar el destino es viable.

## Si la respuesta fuera "unificar"

El cambio es pequeño: **una línea en cada script**.

```js
// VAP_Script Volcado Horas Extras Secretarias.gs
// VAP_Script_Volcado_Actividad_Profesores.gs
const TARGET_SPREADSHEET_ID = '...';   // ← el libro que corresponda
```

Los rangos no colisionan con los 8 campos de nómina, así que técnicamente encaja sin tocar nada más.

> ⚠️ **Pero no es un cambio inocuo.** Si se apunta al libro equivocado, la actividad de ~400 personas
> acaba donde no debe, y el mes siguiente alguien cobra mal. **Verificar antes de cambiar.**

---

## Respuesta

**No había un paso de consolidación oculto: el reparto en tres libros era accidental, y se va a
deshacer.** Estas son las respuestas a las cuatro preguntas de arriba.

**1 · ¿De qué libro sale la nómina final?** De ninguno de los tres. Sale de **`Gastos de Personal
2026`**, un Excel que está **fuera** del sistema y al que los datos llegan **a mano**. No se vincula
a nada: es el punto final de almacenamiento de los datos ya calculados.

**2 · ¿Existe un paso de copia entre libros?** Sí, y es **manual**. Es el trasvase a `Gastos de
Personal 2026`, que seguirá siendo manual por ahora. Enlaza con
[DUDA-0003](0003-momentos-de-copia-y-pega-del-proceso.md) y con el riesgo `R-19` del
[SSD](../../docs_solutions/docs_design/SSD.md#9-riesgos-y-limitaciones).

**3 · ¿Por qué neto y bruto son dos libros separados?** La pregunta **deja de tener destinatario**:
los dos libros se eliminan y se sustituyen por uno solo. Pero no se ha explicado *por qué* estaban
separados, y eso todavía importa — ver las acciones derivadas.

**4 · ¿Cuál es el nombre real de cada libro?**

| Nombre | ID | Papel |
|---|---|---|
| `export sage laboral` | `19edOEgwdT-Ab-0nEWRn4nrtN6IxxRc4CYu1XW4u0454` | Origen. Se mantiene |
| `Vinculacion gastos personal 2026 netos` | `1HDwgihfz91atsLE99Qu0k3kTyBKpo3Iu3SaUtVGMPTs` | **Se elimina** |
| `Vinculación gastos personal 2026 brutos` | `1eTVPws0NVRMIlXgZYsUZANdfMyFYQtDlEEK5ujFt04A` | **Se elimina** |
| `Vinculación gastos personal 2026 completo` | *(pendiente)* | **Destino único** de todos los volcados |
| `Gastos de Personal 2026` | *(pendiente)* | Almacenamiento final. Trasvase manual, sin vincular |

> 🔍 **Un libro sin reconciliar.** El libro `1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc` —donde
> escriben **horas extras** (`AE`, `AH`) y **actividad de profesores** (`AC..CN`)— no aparece en esa
> lista. O **es** el "completo", o es un sexto libro. De cuál sea depende que la migración toque
> **dos** scripts o **cuatro**. Ver acción **A3**.

## Decisión y acciones derivadas

**[ADR-0016 · Un único libro de Vinculación como destino de todos los volcados](../../docs_solutions/docs_design/adr/0016-un-unico-libro-de-vinculacion.md)**

Nada de esto está hecho. El seguimiento vive en
[el registro de la reunión 10](../reuniones/070926_10_revision_vap.md).

- [ ] **A1 · Conseguir el ID** de `Vinculación gastos personal 2026 completo`
- [ ] **A2 · Conseguir el ID** de `Gastos de Personal 2026` *(informativo: no se vincula)*
- [ ] **A3 · Identificar `1qK3…o8kc`**: ¿es el "completo" o es otro libro?
- [ ] **A4 · Resolver si sobra una acción de export.** *Export Neto* y *Export Bruto* vuelcan los
      **mismos 8 campos con los mismos valores**. Con un destino único escribirían lo mismo en el
      mismo sitio: o sobra una, o la diferencia está en columnas que el script no toca y hay que
      escribirla antes de unificar
- [ ] **A5 · Repuntar `TARGET_SPREADSHEET_ID`** en los scripts que corresponda, una vez resueltos A1
      y A3. ⚠️ **Verificar antes de cambiar:** apuntar al libro equivocado manda la actividad de
      ~400 personas donde no debe
- [ ] **A6 · Conservar los dos libros eliminados** hasta cerrar el ejercicio: son el histórico

> Las dos comprobaciones que esta ficha pedía —si el nombre está en la columna `C` y si `AC..CN`
> están libres en el libro de netos— **dejan de hacer falta**: ya no se trata de decidir si unificar
> es viable, sino de ejecutar la unificación ya decidida.
