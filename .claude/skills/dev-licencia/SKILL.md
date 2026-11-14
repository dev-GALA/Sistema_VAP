---
name: dev-licencia
description: Crea o revisa el archivo LICENSE de un repo de desarrollo propio a partir de una plantilla propietaria común (todos los derechos reservados, artículos 96.1 y 97.4 de la LPI) y adapta solo lo particular del proyecto, como el nombre del producto, los datos personales que trata o los servicios de terceros sobre los que corre. Úsala cuando el usuario pida crear, copiar, actualizar o comprobar la licencia de un repo, o al inicializar un proyecto, aunque no diga la palabra LICENSE.
---

# Licencia de un repo propio

Todos los repos propios llevan la misma licencia propietaria, para que no haya textos distintos por
descuido. Solo cambia lo que es propio del proyecto. Una licencia es un texto legal: no la
inventes ni la rebajes.

```
Progreso:
- [ ] 1. Leer una LICENSE existente de otro repo propio
- [ ] 2. Reunir los datos del proyecto
- [ ] 3. Rellenar la plantilla
- [ ] 4. Enseñar el texto y esperar el OK
```

## 1. Punto de partida

Si existe otro repo propio con `LICENSE` (p. ej. `~/WorkspaceGALA/gala_buca/LICENSE`), léela: manda
sobre la plantilla si difieren. Si no hay ninguna, usa [assets/LICENSE.plantilla](assets/LICENSE.plantilla).

## 2. Datos del proyecto

- **Titular, NIF y dirección:** cópialos de la LICENSE de otro repo. **No los deduzcas** del nombre de
  la empresa ni del correo: si el repo pertenece a otra sociedad, pregunta al usuario por texto.
- **Producto:** el nombre del proyecto como lo llama su `README.md` o `CLAUDE.md`.
- **Particularidades**, solo las que el repo justifique:
  - Si el sistema trata datos personales o de nómina: un párrafo que diga que la licencia no cubre
    esos datos, que no forman parte del repo y que se rigen por la normativa de protección de datos.
  - Servicios de terceros sobre los que corre (Google Workspace, Apps Script…): se nombran donde
    dice `{{SERVICIOS}}`.
  - Si no aplica ninguna, se dejan vacías y no se añade nada.
- **Año:** el de creación del repo.

## 3. Rellenar

Sustituye cada `{{…}}`. No dejes ninguno sin resolver (`grep '{{' LICENSE` debe salir vacío). No
cambies los artículos de la LPI ni la frase de prohibición.

## 4. Confirmar

Muestra el texto final al usuario y espera su OK. Indica qué dato no pudiste verificar
(normalmente, que el titular sea el mismo que en otro repo). No hagas commit ni push.
