#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pruebas de validar_skill.py (solo biblioteca estándar; cada prueba usa su carpeta temporal).

Ejecutar:  python3 -m unittest discover -s RUTA_DE_ESTA_CARPETA -p 'test_*.py'
"""
import contextlib
import io
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import validar_skill as v  # noqa: E402

DESC_BUENA = ("Hace algo útil de forma concreta y ordenada para los proyectos del usuario. "
              "Úsala cuando el usuario pida hacer algo útil, aunque no la nombre.")


def crear_skill(base, nombre, descripcion=DESC_BUENA, cuerpo="# Título\n\nPasos.\n",
                nombre_fm=None, extra_fm="", crlf=False, archivos=None):
    carpeta = os.path.join(base, nombre)
    os.makedirs(carpeta, exist_ok=True)
    texto = f"---\nname: {nombre_fm or nombre}\ndescription: {descripcion}\n{extra_fm}---\n{cuerpo}"
    if crlf:
        texto = texto.replace("\n", "\r\n")
    with open(os.path.join(carpeta, "SKILL.md"), "w", encoding="utf-8", newline="") as f:
        f.write(texto)
    for rel, contenido in (archivos or {}).items():
        p = os.path.join(carpeta, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(contenido)
    return carpeta


def mensajes(hallazgos, nivel):
    return [m for n, m in hallazgos if n == nivel]


class ValidarSkill(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.base = self._tmp.name

    def tearDown(self):
        self._tmp.cleanup()

    def test_skill_correcta_no_da_errores_ni_avisos(self):
        c = crear_skill(self.base, "dev-nuevo-adr")
        self.assertEqual(v.validar_skill(c), [])

    def test_falta_skill_md(self):
        c = os.path.join(self.base, "dev-vacia")
        os.makedirs(c)
        self.assertTrue(any("Falta SKILL.md" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_sin_cabecera(self):
        c = os.path.join(self.base, "dev-sin-cabecera")
        os.makedirs(c)
        with open(os.path.join(c, "SKILL.md"), "w", encoding="utf-8") as f:
            f.write("# Solo cuerpo\n")
        self.assertTrue(any("cabecera" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_dos_puntos_en_descripcion_rompe_yaml(self):
        c = crear_skill(self.base, "dev-colon", descripcion="Hace algo: y esto rompe el YAML. Úsala cuando haga falta, siempre que se pida.")
        errores = mensajes(v.validar_skill(c), v.ERROR)
        self.assertTrue(any("YAML" in m or "': '" in m for m in errores), errores)

    def test_dos_puntos_en_descripcion_sin_pyyaml(self):
        c = crear_skill(self.base, "dev-colon", descripcion="Hace algo: y esto rompe el YAML. Úsala cuando haga falta, siempre que se pida.")
        h = v.validar_skill(c, usar_yaml=False)
        self.assertTrue(any("': '" in m for m in mensajes(h, v.ERROR)))
        self.assertTrue(any("aproximada" in m for m in mensajes(h, v.AVISO)))

    def test_descripcion_con_comillas_y_dos_puntos_es_valida(self):
        c = crear_skill(self.base, "dev-comillas", descripcion='"Hace algo: con comillas. Úsala cuando el usuario lo pida, aunque no la nombre."')
        self.assertEqual(mensajes(v.validar_skill(c), v.ERROR), [])
        self.assertEqual(mensajes(v.validar_skill(c, usar_yaml=False), v.ERROR), [])

    def test_name_distinto_de_carpeta(self):
        c = crear_skill(self.base, "dev-uno", nombre_fm="dev-otro")
        self.assertTrue(any("no coincide" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_name_invalido(self):
        for nombre in ("Dev-Mayus", "dev--doble", "-dev", "dev_guion_bajo"):
            with self.subTest(nombre=nombre):
                c = crear_skill(self.base, nombre)
                self.assertTrue(any("minúsculas" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_name_demasiado_largo(self):
        nombre = "dev-" + "a" * 70
        c = crear_skill(self.base, nombre)
        self.assertTrue(any("máximo 64" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_name_con_palabra_reservada(self):
        c = crear_skill(self.base, "dev-claude-ayuda")
        self.assertTrue(any("reservada" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_falta_description(self):
        c = os.path.join(self.base, "dev-sin-desc")
        os.makedirs(c)
        with open(os.path.join(c, "SKILL.md"), "w", encoding="utf-8") as f:
            f.write("---\nname: dev-sin-desc\n---\ncuerpo\n")
        self.assertTrue(any("description" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_description_demasiado_larga(self):
        c = crear_skill(self.base, "dev-larga", descripcion="Úsala cuando haga falta. " + "palabra " * 200)
        self.assertTrue(any("1024" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_description_con_angulos(self):
        c = crear_skill(self.base, "dev-xml", descripcion="Hace algo con <etiquetas> y se usa cuando el usuario lo pida, siempre que haga falta.")
        self.assertTrue(any("XML" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_description_en_primera_persona_avisa(self):
        c = crear_skill(self.base, "dev-persona", descripcion="Puedo ayudarte a hacer cosas útiles para tus proyectos cuando lo necesites, siempre que lo pidas.")
        self.assertTrue(any("tercera" in m for m in mensajes(v.validar_skill(c), v.AVISO)))

    def test_description_sin_cuando_avisa(self):
        c = crear_skill(self.base, "dev-sin-cuando", descripcion="Genera informes de ventas con tablas y gráficos para el equipo comercial de la empresa.")
        self.assertTrue(any("cuándo" in m for m in mensajes(v.validar_skill(c), v.AVISO)))

    def test_description_corta_avisa(self):
        c = crear_skill(self.base, "dev-corta", descripcion="Úsala cuando haga falta.")
        self.assertTrue(any("muy corta" in m for m in mensajes(v.validar_skill(c), v.AVISO)))

    def test_cuerpo_demasiado_largo(self):
        c = crear_skill(self.base, "dev-larguisima", cuerpo="línea\n" * 600)
        self.assertTrue(any("500" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_cuerpo_cerca_del_limite_avisa(self):
        c = crear_skill(self.base, "dev-casi", cuerpo="línea\n" * 450)
        h = v.validar_skill(c)
        self.assertEqual(mensajes(h, v.ERROR), [])
        self.assertTrue(any("se acerca" in m for m in mensajes(h, v.AVISO)))

    def test_referencia_inexistente(self):
        c = crear_skill(self.base, "dev-ref", cuerpo="Lee `references/falta.md` antes.\n")
        self.assertTrue(any("references/falta.md" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_referencia_existente_es_valida(self):
        c = crear_skill(self.base, "dev-ref-ok", cuerpo="Lee `references/guia.md` antes.\n",
                        archivos={"references/guia.md": "# Guía\n"})
        self.assertEqual(v.validar_skill(c), [])

    def test_enlace_markdown_relativo_inexistente(self):
        c = crear_skill(self.base, "dev-enlace", cuerpo="Ver [la guía](references/otra.md).\n")
        self.assertTrue(any("references/otra.md" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_enlace_externo_no_se_comprueba(self):
        c = crear_skill(self.base, "dev-externo", cuerpo="Ver [web](https://ejemplo.org/x).\n")
        self.assertEqual(v.validar_skill(c), [])

    def test_skill_mencionada_inexistente(self):
        c = crear_skill(self.base, "dev-menciona", cuerpo="Aplica la skill `dev-fantasma` luego.\n")
        self.assertTrue(any("dev-fantasma" in m for m in mensajes(v.validar_skill(c), v.ERROR)))

    def test_skill_mencionada_existente(self):
        crear_skill(self.base, "dev-real")
        c = crear_skill(self.base, "dev-menciona", cuerpo="Aplica la skill `dev-real` luego.\n")
        self.assertEqual(mensajes(v.validar_skill(c), v.ERROR), [])

    def test_cadena_de_referencias_avisa(self):
        c = crear_skill(self.base, "dev-cadena", cuerpo="Lee `references/a.md`.\n",
                        archivos={"references/a.md": "# A\nVer references/b.md\n", "references/b.md": "# B\n"})
        self.assertTrue(any("cadenas" in m for m in mensajes(v.validar_skill(c), v.AVISO)))

    def test_referencia_larga_sin_indice_avisa(self):
        largo = "# Larga\n" + "línea\n" * 120
        c = crear_skill(self.base, "dev-sin-indice", cuerpo="Lee `references/larga.md`.\n",
                        archivos={"references/larga.md": largo})
        self.assertTrue(any("índice" in m for m in mensajes(v.validar_skill(c), v.AVISO)))

    def test_referencia_larga_con_indice_no_avisa(self):
        largo = "# Larga\n\nContenido:\n1. Uno\n\n" + "línea\n" * 120
        c = crear_skill(self.base, "dev-con-indice", cuerpo="Lee `references/larga.md`.\n",
                        archivos={"references/larga.md": largo})
        self.assertEqual(mensajes(v.validar_skill(c), v.AVISO), [])

    def test_crlf_se_acepta_pero_avisa(self):
        c = crear_skill(self.base, "dev-crlf", crlf=True)
        h = v.validar_skill(c)
        self.assertEqual(mensajes(h, v.ERROR), [])
        self.assertTrue(any("CRLF" in m for m in mensajes(h, v.AVISO)))

    def test_ruta_con_barra_invertida_avisa(self):
        c = crear_skill(self.base, "dev-barra", cuerpo="Ejecuta `scripts\\ayuda.py` ahora.\n")
        self.assertTrue(any("barra invertida" in m for m in mensajes(v.validar_skill(c), v.AVISO)))

    def test_marca_pendiente_avisa(self):
        c = crear_skill(self.base, "dev-pendiente", cuerpo="TODO: completar esto.\n")
        self.assertTrue(any("pendiente" in m for m in mensajes(v.validar_skill(c), v.AVISO)))

    def test_texto_todo_en_castellano_no_avisa(self):
        c = crear_skill(self.base, "dev-todo", cuerpo="Revisa todo olvidado, y TODO olvidados no es una marca.\n")
        self.assertEqual(mensajes(v.validar_skill(c), v.AVISO), [])

    def test_campo_desconocido_avisa(self):
        c = crear_skill(self.base, "dev-campo", extra_fm="inventado: algo\n")
        self.assertTrue(any("inventado" in m for m in mensajes(v.validar_skill(c), v.AVISO)))

    def test_campos_de_claude_code_no_avisan(self):
        c = crear_skill(self.base, "dev-cc", extra_fm="disable-model-invocation: true\ncontext: fork\n")
        self.assertEqual(v.validar_skill(c), [])


class ValidarColeccion(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.base = self._tmp.name

    def tearDown(self):
        self._tmp.cleanup()

    def test_verbo_en_infinitivo_avisa(self):
        crear_skill(self.base, "dev-iniciar-proyecto")
        crear_skill(self.base, "dev-nuevo-adr")
        h = v.validar_coleccion_global(v.listar_skills(self.base))
        avisos = [(e, m) for e, n, m in h if n == v.AVISO]
        self.assertTrue(any(e == "dev-iniciar-proyecto" and "infinitivo" in m for e, m in avisos))
        self.assertFalse(any(e == "dev-nuevo-adr" for e, _ in avisos))

    def test_listar_ignora_carpeta_synced(self):
        crear_skill(self.base, "dev-real")
        os.makedirs(os.path.join(self.base, "synced", "id_id"))
        self.assertEqual([os.path.basename(x) for x in v.listar_skills(self.base)], ["dev-real"])

    def test_sustantivo_acabado_en_er_no_avisa(self):
        crear_skill(self.base, "dev-taller-pruebas")
        h = v.validar_coleccion_global(v.listar_skills(self.base))
        self.assertFalse(any("infinitivo" in m for _, _, m in h))

    def test_sin_prefijo_avisa(self):
        crear_skill(self.base, "prueba")
        h = v.validar_coleccion_global(v.listar_skills(self.base))
        self.assertTrue(any("prefijo" in m for _, _, m in h))

    def test_claude_md_cita_skill_inexistente(self):
        crear_skill(self.base, "dev-real")
        md = os.path.join(self.base, "CLAUDE.md")
        with open(md, "w", encoding="utf-8") as f:
            f.write("| Cuando... | `dev-real` |\n| Otro | `dev-fantasma` |\n")
        h = v.validar_coleccion_global(v.listar_skills(self.base), md)
        errores = [m for _, n, m in h if n == v.ERROR]
        self.assertTrue(any("dev-fantasma" in m for m in errores))
        self.assertFalse(any("dev-real" in m for m in errores))

    def test_skill_sin_registrar_en_claude_md_avisa(self):
        crear_skill(self.base, "dev-real")
        crear_skill(self.base, "dev-olvidada")
        md = os.path.join(self.base, "CLAUDE.md")
        with open(md, "w", encoding="utf-8") as f:
            f.write("| Cuando... | `dev-real` |\n")
        h = v.validar_coleccion_global(v.listar_skills(self.base), md)
        avisos = [(e, m) for e, n, m in h if n == v.AVISO]
        self.assertTrue(any(e == "dev-olvidada" and "no aparece" in m for e, m in avisos))
        self.assertFalse(any(e == "dev-real" and "no aparece" in m for e, m in avisos))


class Principal(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.base = self._tmp.name

    def tearDown(self):
        self._tmp.cleanup()

    def ejecutar(self, argv):
        salida = io.StringIO()
        with contextlib.redirect_stdout(salida), contextlib.redirect_stderr(io.StringIO()):
            codigo = v.main(argv)
        return codigo, salida.getvalue()

    def test_coleccion_correcta_sale_con_cero(self):
        crear_skill(self.base, "dev-nuevo-adr")
        md = os.path.join(self.base, "CLAUDE.md")
        with open(md, "w", encoding="utf-8") as f:
            f.write("`dev-nuevo-adr`\n")
        codigo, salida = self.ejecutar(["--coleccion", self.base, "--claude-md", md])
        self.assertEqual(codigo, 0, salida)
        self.assertIn("0 error(es), 0 aviso(s)", salida)

    def test_con_errores_sale_con_uno(self):
        crear_skill(self.base, "dev-uno", nombre_fm="dev-otro")
        codigo, _ = self.ejecutar(["--coleccion", self.base])
        self.assertEqual(codigo, 1)

    def test_estricto_hace_fallar_los_avisos(self):
        crear_skill(self.base, "dev-corta", descripcion="Úsala cuando haga falta.")
        self.assertEqual(self.ejecutar([os.path.join(self.base, "dev-corta")])[0], 0)
        self.assertEqual(self.ejecutar(["--estricto", os.path.join(self.base, "dev-corta")])[0], 1)

    def test_sin_argumentos_es_error_de_uso(self):
        self.assertEqual(self.ejecutar([])[0], 2)

    def test_coleccion_inexistente_es_error_de_uso(self):
        self.assertEqual(self.ejecutar(["--coleccion", os.path.join(self.base, "no-existe")])[0], 2)


if __name__ == "__main__":
    unittest.main()
