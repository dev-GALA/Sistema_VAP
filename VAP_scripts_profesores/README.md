# VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26

## ¿Qué hace este script?

Sincroniza automáticamente las respuestas de un formulario de Google hacia otra hoja de cálculo, acumulando los datos de cada profesor **por mes y año**.

**Caso de uso:** Los profesores rellenan un formulario varias veces durante el mes, cada vez reportando algunas actividades/gastos. El script acumula sus envíos: si el segundo envío deja una columna vacía, **no borra** lo que el primero reportó. Si rellena una columna, esa actualización pisa la anterior.

### Flujo de datos

```
ORIGEN (Google Forms respuestas)
├─ Marca temporal (col A) → año
├─ SELECCIONE EL MES (col C) → mes
├─ Nombre profesor (col E)
└─ Datos F..BQ

            ↓ [Script acumula por profesor+mes+año]

DESTINO (VINCULACIÓN GASTOS PERSONAL)
├─ Nombre profesor (col C) → búsqueda
└─ Datos AC..CN (volcado acumulado)
```

### Lógica de acumulación

1. **Agrupa** todas las respuestas por `(nombre normalizado + mes seleccionado + año de marca temporal)`.
2. **Dentro de cada grupo**, para cada columna de datos (F..BQ):
   - Recorre las respuestas en orden cronológico.
   - La **última celda NO vacía** de esa columna gana.
   - Una celda vacía **NO borra** lo anterior.
   - El valor `0` **sí cuenta** como dato (no se ignora).
3. **Por profesor**, escribe en destino el grupo más reciente (mes/año con fecha más tardía).

### Ejemplo

| Envío | Profesor | Mes | Columna F | Columna K |
|-------|----------|-----|-----------|-----------|
| 1º    | Juan     | MAYO | 10        | (vacío)   |
| 2º    | Juan     | MAYO | 20        | 5         |
| Resultado destino: | Juan | MAYO | **20** | **5** |

En el segundo envío, F se actualiza a 20, pero K pasa de vacío a 5 → ambos valores se preservan.

---

## Instalación

### 1. Backup (seguridad)
Se mantiene una copia: [backup_VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js](backup_VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js). Úsala para revertir si es necesario.

### 2. Copiar el script a Google Apps Script

1. Abre el spreadsheet **ORIGEN** ("REGISTRO DE ACTIVIDAD DE PROFESORES 26 (respuestas)").
2. Menú **Herramientas → Editor de secuencias de comandos** (o accede a [script.google.com](https://script.google.com) e importa el proyecto).
3. Reemplaza todo el contenido del archivo `Código.gs` (o equivalente) con el contenido de [VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js](VAP_script_REGISTRO_DE_ACTIVIDAD_DE_PROFESORES_26.js).
4. **Guarda** (`Ctrl+S`).

### 3. Configurar el activador (trigger)

El script **necesita un activador** para ejecutarse automáticamente cuando alguien envía el formulario.

1. En el editor de Apps Script, icono del **reloj** ⏰ (izquierda, "Activadores").
2. Mira si **ya existe** un activador apuntando a `onFormSubmit`:
   - **Si existe:** no hay que crear otro. Se ejecutará con el nuevo código automáticamente.
   - **Si no existe:** clic en **"+ Añadir activador"** y configura:
     - **Función a ejecutar:** `onFormSubmit`
     - **Implementación:** Head
     - **Origen del evento:** Desde una hoja de cálculo
     - **Tipo de evento:** Al enviar el formulario
     - Guardar.

### 4. Permisos

La primera vez que se ejecuta (manual o por trigger), Google pedirá autorizar. Acepta. El script necesita acceso a:
- El spreadsheet de respuestas (ORIGEN) — leer.
- El spreadsheet de destino (VINCULACIÓN GASTOS PERSONAL) — escribir.

**Importante:** El account que ejecuta debe tener **acceso de Editor** a ambos sheets. Si el account que crea el trigger no tiene acceso al destino, fallará con `"You do not have permission to access the requested document."` (ver [Solución de problemas](#solución-de-problemas)).

---

## Solución de problemas

### Error: "You do not have permission to access the requested document"

**Causa:** El account que ejecuta el script no tiene acceso al Sheet de destino.

**Solución:**
1. Comprueba que puedes abrir el destino manualmente con tu cuenta de Google:
   ```
   https://docs.google.com/spreadsheets/d/1qK3JeBdJV6nHMnFYZGgsRAC0t3rfvig17c5E0iYo8kc/edit
   ```
2. Si no tienes acceso, pide al propietario que lo comparta contigo como **Editor**.
3. Reintenta ejecutar el script manualmente (botón "Ejecutar" en el editor) para forzar la autorización.

### Error: "No existe la pestaña origen" o "No existe la pestaña destino"

**Causa:** Los nombres de las hojas/pestañas no coinciden con los del script.

**Solución:** Verifica en el script (primeras líneas) que:
- `SOURCE_SHEET_NAME = 'Respuestas de formulario 1'` (nombre de la pestaña ORIGEN).
- `TARGET_SHEET_NAME = 'Hoja 1'` (nombre de la pestaña DESTINO).

Si los nombres reales son distintos, edita el script y ajusta.

### El script se ejecuta pero no vuelca nada

**Causa más probable:** El trigger no está configurado.

**Solución:** Ve a Activadores (reloj ⏰) y verifica que existe un activador apuntando a `onFormSubmit` y que el evento es "Al enviar el formulario". Si no existe, créalo (paso 3 de Instalación).

### Registro de ejecución con errores

Para diagnosticar:
1. En el editor de Apps Script, abre **Ver → Registros de ejecución** (o el panel "Registros de ejecución" en la parte inferior).
2. Revisa los errores. Cada línea cita el código (`Código.gs:NRO`).
3. Si necesitas depuración:
   - Ejecuta manualmente `syncRegistroToVinculacion` (botón "Ejecutar", selecciona función).
   - Revisa los registros inmediatamente después.

---

## Validaciones internas

El script valida:

| Validación | Acción |
|-----------|--------|
| No existe pestaña origen | Lanza error y detiene. |
| No existe pestaña destino | Lanza error y detiene. |
| La hoja de respuestas está vacía | Retorna sin hacer nada. |
| Un profesor sin nombre | Se ignora esa fila. |
| El mes está vacío | Se agrupa con mes = `''` (normalizado). |
| La marca temporal no se puede leer | Se agrupa con año = `''` (normalizado). |

---

## Detalles técnicos

### Columnas en la hoja de ORIGEN

| Columna | Contenido | Nota |
|---------|-----------|------|
| A | Marca temporal | Generada automáticamente por el formulario. De aquí se extrae el **año**. |
| C | SELECCIONE EL MES | Desplegable (p. ej. "MAYO", "JUNIO"). |
| E | Nombre del profesor | Clave de agrupación. |
| F..BQ | Datos a reportar | 64 columnas con actividades/gastos/etc. |

### Normalización

Los nombres y meses se normalizan para comparación robusta:
- **trim:** se quita espacios al inicio/final.
- **Espacios múltiples:** "Juan  García" = "Juan García".
- **Minúsculas:** "JUAN" = "juan".
- **Sin tildes/diacríticos:** "José" = "jose".

Así, "José García" (primer envío) y "jose garcia" (segundo) se reconocen como el mismo profesor.

### Funciones auxiliares

- **`isEmpty(v)`:** Determina si una celda está vacía. Trata `null`, `undefined`, `''` y espacios como vacío. **PERO el `0` se considera dato válido** (para horas, cantidades).
- **`getYear(v)`:** Extrae el año de la marca temporal. Maneja objetos Date y strings; si no se puede interpretar, devuelve `''`.
- **`normalizeKey(name)`:** Normaliza un nombre o mes para comparación (trim, minúsculas, sin tildes).

### Locking

El script usa `LockService` para evitar que dos ejecuciones simultáneas corrompan datos. Espera 30 segundos a obtener el bloqueo; si no lo consigue, falla. Esto es robustez contra envíos concurrentes de múltiples profesores.

---

## Mejoras futuras (comentadas en ADR.md)

- **Destino por mes:** Actualmente, el destino tiene una fila por profesor. Futuramente podría ser una fila por profesor + mes.
- **Validación de mes:** Incluir una verificación explícita de que el mes seleccionado coincide con el mes de la marca temporal.
- **Auditoría:** Registrar cambios (quién, cuándo, qué cambió) en una hoja aparte.

---

## Contacto / Soporte

Si algo no funciona, revisa primero:
1. [Solución de problemas](#solución-de-problemas) más arriba.
2. Los registros de ejecución (Registros de ejecución en el editor de Apps Script).
3. Verifica que los IDs de los Spreadsheets son correctos (líneas 23-24 del script).

---

**Última actualización:** 2026-05-25  
**Versión del script:** 2.0 (con acumulación por mes/año)
