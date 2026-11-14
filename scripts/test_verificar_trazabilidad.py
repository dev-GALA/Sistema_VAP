"""Pruebas de verificar_trazabilidad.py. Cada prueba construye su propio repo mínimo en un directorio temporal."""

import tempfile
import unittest
from pathlib import Path

import verificar_trazabilidad as v

PROBLEM = "**JS-01 — Reportar**\nCuando...\n\n**JS-02 — Corregir**\nCuando...\n"
HU = (
    "### HU-01 · Uno\n\n| Estado | Prioridad | Origen |\n|---|---|---|\n| ✅ | 🔺 | JS-01 |\n\n"
    "### HU-02 · Dos\n\n| Estado | Prioridad | Origen |\n|---|---|---|\n| ✅ | 🔺 | JS-02 |\n"
)
RF = "| # | R | E | P | Origen |\n|--|--|--|--|--|\n| **RF-01** | a | ✅ | 🔺 | HU-01 |\n| **RF-02** | b | ✅ | 🔺 | HU-02 |\n"
RNF = (
    "| # | R | E | P | Relación con RF | Origen |\n|--|--|--|--|--|--|\n"
    "| **RNF-01** | a | ✅ | 🔺 | **RF-01** *(directa)* | x |\n"
    "| **RNF-02** | b | ✅ | 🔺 | — *(ver justificación J-01)* | x |\n\n"
    "| J | Qué | Por qué |\n|--|--|--|\n| **J-01** | RNF-02 | motivo |\n"
)
ADR = "# ADR-0001: x\n\n- **Estado:** Aceptada\n- **Requisitos:** RF-01, RNF-01 *(nota)*\n"


def construir(raiz: Path) -> None:
    ficheros = {
        "docs_discovery/problem.md": PROBLEM,
        "docs_discovery/historias_usuarios.md": HU,
        "docs_discovery/requisitos_funcionales.md": RF,
        "docs_discovery/requisitos_no_funcionales.md": RNF,
        "docs_solutions/docs_design/adr/0001-uno.md": ADR,
        "docs_solutions/docs_design/adr/README_ADR.md": "| [0001](0001-uno.md) |",
        "docs_solutions/docs_design/SSD.md": "| [0001](adr/0001-uno.md) |",
    }
    for ruta, contenido in ficheros.items():
        destino = raiz / ruta
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(contenido, encoding="utf-8")


class CasoBase(unittest.TestCase):
    def verificar(self) -> v.Informe:
        with tempfile.TemporaryDirectory() as carpeta:
            raiz = Path(carpeta)
            construir(raiz)
            return v.verificar(raiz)

    def assertHayError(self, informe: v.Informe, fragmento: str) -> None:
        self.assertTrue(any(fragmento in e for e in informe.errores), f"{fragmento!r} no está en {informe.errores}")


class RepoCorrecto(CasoBase):
    def test_un_repo_coherente_no_da_errores(self):
        self.assertEqual(self.verificar().errores, [])


class CadenaDeRequisitos(CasoBase):
    def test_rf_que_cita_una_hu_inexistente(self):
        with tempfile.TemporaryDirectory() as carpeta:
            raiz = Path(carpeta)
            construir(raiz)
            (raiz / "docs_discovery/requisitos_funcionales.md").write_text(RF.replace("HU-02", "HU-99"), encoding="utf-8")
            informe = v.verificar(raiz)
        self.assertHayError(informe, "RF-02 cita HU-99")
        self.assertHayError(informe, "HU-02 no aparece en ningún RF")

    def test_rnf_sin_rf_ni_justificacion(self):
        with tempfile.TemporaryDirectory() as carpeta:
            raiz = Path(carpeta)
            construir(raiz)
            (raiz / "docs_discovery/requisitos_no_funcionales.md").write_text(
                RNF.replace("J-01)*", "J-09)*").replace("**J-01**", "**J-07**"), encoding="utf-8"
            )
            informe = v.verificar(raiz)
        self.assertHayError(informe, "RNF-02 no se relaciona")

    def test_hu_sin_js_es_aviso_no_error(self):
        with tempfile.TemporaryDirectory() as carpeta:
            raiz = Path(carpeta)
            construir(raiz)
            (raiz / "docs_discovery/historias_usuarios.md").write_text(HU.replace("| JS-02 |", "| FLUJO paso 1 |"), encoding="utf-8")
            informe = v.verificar(raiz)
        self.assertEqual(informe.errores, [])
        self.assertTrue(any("HU-02 no cita ninguna JS" in a for a in informe.avisos))
        self.assertTrue(any("JS-02 no la recoge" in a for a in informe.avisos))


class Decisiones(CasoBase):
    def _con_adr(self, texto: str) -> v.Informe:
        with tempfile.TemporaryDirectory() as carpeta:
            raiz = Path(carpeta)
            construir(raiz)
            (raiz / "docs_solutions/docs_design/adr/0001-uno.md").write_text(texto, encoding="utf-8")
            return v.verificar(raiz)

    def test_adr_sin_linea_de_requisitos(self):
        self.assertHayError(self._con_adr("# ADR-0001\n- **Estado:** Aceptada\n"), "no tiene la línea «Requisitos:»")

    def test_adr_que_cita_requisito_inexistente(self):
        self.assertHayError(self._con_adr("- **Requisitos:** RF-77\n"), "cita RF-77, que no existe")

    def test_las_notas_en_cursiva_no_cuentan_como_requisitos(self):
        informe = self._con_adr("- **Requisitos:** RF-01 *(afectado: ver RF-02)*\n")
        self.assertEqual(informe.errores, [])

    def test_adr_fuera_del_indice_y_del_ssd(self):
        with tempfile.TemporaryDirectory() as carpeta:
            raiz = Path(carpeta)
            construir(raiz)
            (raiz / "docs_solutions/docs_design/adr/0002-dos.md").write_text(ADR, encoding="utf-8")
            informe = v.verificar(raiz)
        self.assertHayError(informe, "0002-dos.md: falta en el índice")
        self.assertHayError(informe, "0002-dos.md: falta en SSD §12")


class IdentificadoresYEnlaces(CasoBase):
    def test_id_citado_en_otro_documento_y_no_definido(self):
        with tempfile.TemporaryDirectory() as carpeta:
            raiz = Path(carpeta)
            construir(raiz)
            (raiz / "otro.md").write_text("Ver RF-55 y HU-01.\n", encoding="utf-8")
            informe = v.verificar(raiz)
        self.assertHayError(informe, "otro.md: cita RF-55")
        self.assertFalse(any("HU-01" in e and "otro.md" in e for e in informe.errores))

    def test_enlace_roto_y_enlace_con_espacios(self):
        with tempfile.TemporaryDirectory() as carpeta:
            raiz = Path(carpeta)
            construir(raiz)
            (raiz / "con espacio.md").write_text("x", encoding="utf-8")
            (raiz / "otro.md").write_text("[roto](no_existe.md) [bien](con%20espacio.md) [web](https://x.es)\n", encoding="utf-8")
            informe = v.verificar(raiz)
        self.assertHayError(informe, "enlace roto a no_existe.md")
        self.assertFalse(any("con%20espacio" in e for e in informe.errores))

    def test_los_rangos_se_expanden(self):
        self.assertEqual(v.ids_de("HU-14 … HU-16", "HU"), {"HU-14", "HU-15", "HU-16"})
        self.assertEqual(v.ids_de("RF-31…35", "RF"), {"RF-31", "RF-32", "RF-33", "RF-34", "RF-35"})


if __name__ == "__main__":
    unittest.main()
