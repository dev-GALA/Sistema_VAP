# DUDA-0001: Los volcados van a tres libros distintos

| | |
|---|---|
| **Estado** | 🔴 Abierta |
| **Detectada** | 17 agosto 2026 |
| **Bloquea** | Unificar el destino de los volcados · posible agujero en el cálculo final |
| **Quién puede responder** | Responsable de Administración · Gestor de nóminas |

---

## El hallazgo

Los volcados del sistema **no confluyen en una sola hoja**, como sugiere la documentación
([SSD §6.3](../SSD.md), *"hoja final donde confluyen los volcados"*), sino que escriben en **tres
libros de Google Sheets diferentes**:

| Qué se vuelca | Script | Libro destino (ID) | Columnas |
|---------------|--------|--------------------|----------|
| Horas extras de secretarias | `VAP_Script Volcado Horas Extras Secretarias` | `1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc` | `AE`, `AH` |
| Actividad de profesores | `VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26` | `1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc` *(el mismo)* | `AC..CN` |
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
// VAP_Script Volcado Horas Extras Secretarias.js
// VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js
const TARGET_SPREADSHEET_ID = '...';   // ← el libro que corresponda
```

Los rangos no colisionan con los 8 campos de nómina, así que técnicamente encaja sin tocar nada más.

> ⚠️ **Pero no es un cambio inocuo.** Si se apunta al libro equivocado, la actividad de ~400 personas
> acaba donde no debe, y el mes siguiente alguien cobra mal. **Verificar antes de cambiar.**

---

## Respuesta

> *(pendiente)*

## Decisión y acciones derivadas

> *(pendiente)*
