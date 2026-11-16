# ADR-0018: Libro propio de la webapp, propietario y accesos

- **Estado:** Propuesta
- **Fecha:** 2026-11-16
- **Decisores:** Desarrollo
- **Equivalencia:** —
- **Requisitos:** RF-42, RF-43, RF-79, RNF-09, RNF-12

## Contexto

La webapp del [ADR-0017](0017-webapp-del-proceso-mensual-stack-y-estructura.md) necesita guardar el estado
del proceso mensual y saber quién puede entrar. Eso plantea tres preguntas:

- **¿Dónde se guarda?** Mezclarlo con `VAP_BBDD_Personas`, con la futura `VAP_Pagos` o con el libro de la
  Vinculación acoplaría la webapp a datos de personas y de nóminas, y ampliaría la superficie de quien puede
  abrirlos (RNF-12, [ADR-0006](0006-separar-bbdd-de-personal.md)).
- **¿De quién es?** `recursos@galaformacion.com` es la cuenta de otros proyectos y este contiene información
  muy delicada: no se usa.
- **¿Quién entra?** Hoy no está definido el alcance del control de acceso (RNF-09).

Es la respuesta de diseño a OB-07 (dónde vive el estado del cierre), en lo que toca a esta webapp.

## Decisión

1. **La webapp tiene su propio libro de Google Sheets**, `VAP_Webapp` (nombre provisional),
   **independiente** de `VAP_BBDD_Personas`, `VAP_Pagos` y del resto de libros del sistema.
2. **Su propietaria es la cuenta del desarrollador**, y no `recursos@`.
3. **Contenido de la versión 1:** una hoja `config` (clave y valor, como en BUCA) y una hoja
   `estado_pasos` (periodo, paso, estado, quién y cuándo). **La lista de cuentas y roles es la barrera de
   acceso** y vive en `config`, en las claves `email_administracion` y `email_desarrollo`, con los correos
   separados por comas: la Responsable de Administración y el desarrollador. Quitar un correo de la lista le quita el acceso.
4. **El acceso se comprueba en el servidor**, en `doGet` y en cada función `api…`. Un correo que no consta,
   que aparece en dos roles o que no se puede identificar **no entra**. Si el libro no está configurado, la webapp
   **se niega** y lo dice, en lugar de abrirse.
5. **El libro no guarda DNI, cuentas bancarias ni huellas.** Las diferencias de las comprobaciones, cuando
   existan, guardarán solo el identificador de la persona (RNF-18).
6. **El identificador del libro vive en las propiedades del script** (`ID_LIBRO_WEBAPP`), no en el código.
7. **Los otros libros se leerán en solo lectura**, por su identificador y desde la configuración.
8. **Resiliencia:** un segundo editor del libro y del proyecto, un procedimiento para transferir la
   propiedad, y una copia de seguridad periódica del libro.

## Consecuencias

- **Positivas:** la webapp no ve ni puede alterar los datos de personas ni de nóminas; el acceso es una
  lista que se edita sin tocar código; un fallo de la webapp no afecta a los volcados.
- **Negativas:** **depende de una persona** mientras el libro y el proyecto sean de su cuenta; hay un
  libro más que mantener y proteger; y la lista de usuarios, al ser una hoja, es tan segura como quien
  pueda editarla.
- **Abierto, y debe cerrarse antes de aceptar este ADR:**
  - **«Ejecutar como»:** el propietario o quien accede. Decide con qué permisos se leen los otros libros, y
    es un parámetro de seguridad que firma el desarrollador, no se elige por defecto.
  - **Quién es el segundo editor**, y la frecuencia de la copia de seguridad.
- **Lo que no se prueba en automático:** el comportamiento real de `Session.getActiveUser()` en vuestro
  dominio de Google, que depende de cómo se despliegue.

## Alternativas descartadas

- **Guardar el estado en `VAP_BBDD_Personas`.** Mezcla el control del proceso con datos personales y obliga a
  dar acceso a ese libro a más gente.
- **Una cuenta de grupo (`recursos@`).** Evita depender de una persona, pero esa cuenta es de otros
  proyectos y este maneja información delicada.
- **La lista de usuarios en el código o en las propiedades del script.** Cambiarla exigiría editar o
  desplegar, y Administración no podría ver quién tiene acceso.
