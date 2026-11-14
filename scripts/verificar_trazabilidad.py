#!/usr/bin/env python3
"""Verifica la trazabilidad de Sistema VAP, del problema a las decisiones.

Cadena: JS (problem.md) -> HU -> RF -> ADR, y RNF -> RF o justificación J-nn.

Errores (hacen fallar):
  - un RF sin HU, o que cita una HU que no existe;
  - una HU que ningún RF recoge;
  - un RNF sin RF ni justificación J-nn válida;
  - un ADR sin línea `Requisitos:`, o que cita un requisito que no existe;
  - un ADR que falta en el índice README_ADR.md o en SSD §12, o al revés;
  - un identificador citado en cualquier .md que no está definido;
  - un enlace relativo roto en cualquier .md.
Avisos (no fallan): una HU sin ninguna JS (puede nacer del proceso real) y una JS que ninguna HU recoge.

Solo biblioteca estándar. Uso: python3 scripts/verificar_trazabilidad.py [raiz_del_repo]
Salida: 0 sin errores, 1 con errores.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import unquote

ID = re.compile(r"\b(?:JS|HU|RF|RNF)-(\d+)\b")
RANGO = re.compile(r"\b(JS|HU|RF|RNF)-(\d+)\s*(?:…|\.\.\.|–)\s*(?:\1-)?(\d+)\b")
ENLACE = re.compile(r"\]\(([^)\s]+)\)")
CODIGO = re.compile(r"^```.*?^```", re.DOTALL | re.MULTILINE)


@dataclass
class Informe:
    errores: list[str] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)


def ids_de(texto: str, prefijo: str) -> set[str]:
    """Todos los identificadores de un tipo en un texto, expandiendo rangos «HU-14 … HU-20»."""
    encontrados = {m.group(0) for m in re.finditer(rf"\b{prefijo}-\d+\b", texto)}
    for m in RANGO.finditer(texto):
        if m.group(1) == prefijo:
            inicio, fin = int(m.group(2)), int(m.group(3))
            encontrados |= {f"{prefijo}-{n:02d}" for n in range(inicio, fin + 1)}
    return encontrados


def leer(ruta: Path) -> str:
    return ruta.read_text(encoding="utf-8") if ruta.exists() else ""


def filas_de_tabla(texto: str, prefijo: str) -> dict[str, list[str]]:
    """`| **RF-01** | ... |` -> {'RF-01': [celdas]}."""
    filas: dict[str, list[str]] = {}
    for linea in texto.splitlines():
        m = re.match(rf"^\|\s*\*\*({prefijo}-\d+)\*\*\s*\|(.*)\|\s*$", linea)
        if m:
            filas[m.group(1)] = [c.strip() for c in m.group(2).split("|")]
    return filas


def definir_js(problem: str) -> set[str]:
    return set(re.findall(r"^\*\*(JS-\d+)\s*[—–-]", problem, re.MULTILINE))


def definir_hu(historias: str) -> dict[str, set[str]]:
    """Cada HU y las JS de su tabla `| Estado | Prioridad | Origen |`."""
    resultado: dict[str, set[str]] = {}
    bloques = re.split(r"^### (?=HU-\d+)", historias, flags=re.MULTILINE)[1:]
    for bloque in bloques:
        hu = re.match(r"(HU-\d+)", bloque).group(1)
        tabla = re.search(r"\|\s*Estado\s*\|[^\n]*\n\|[-| ]+\|\n\|([^\n]*)\|", bloque)
        origen = tabla.group(1).split("|")[-1] if tabla else ""
        resultado[hu] = ids_de(origen, "JS")
    return resultado


def requisitos_de_adr(texto: str) -> set[str] | None:
    m = re.search(r"^- \*\*Requisitos:\*\*(.*)$", texto, re.MULTILINE)
    if not m:
        return None
    sin_notas = re.sub(r"\*[^*]*\*", "", m.group(1))
    return ids_de(sin_notas, "RF") | ids_de(sin_notas, "RNF")


def verificar_cadena(raiz: Path, informe: Informe) -> None:
    disc = raiz / "docs_discovery"
    problem = leer(disc / "problem.md")
    historias = leer(disc / "historias_usuarios.md")
    rf_texto = leer(disc / "requisitos_funcionales.md")
    rnf_texto = leer(disc / "requisitos_no_funcionales.md")

    js = definir_js(problem)
    hu = definir_hu(historias)
    rf = filas_de_tabla(rf_texto, "RF")
    rnf = filas_de_tabla(rnf_texto, "RNF")
    just = set(re.findall(r"^\|\s*\*\*(J-\d+)\*\*", rnf_texto, re.MULTILINE))

    hu_citadas: set[str] = set()
    for rf_id, celdas in rf.items():
        origen = ids_de(celdas[-1], "HU")
        hu_citadas |= origen
        if not origen:
            informe.errores.append(f"{rf_id} no cita ninguna HU en su columna Origen")
        for h in sorted(origen - hu.keys()):
            informe.errores.append(f"{rf_id} cita {h}, que no existe")

    for hu_id in sorted(hu.keys() - hu_citadas):
        informe.errores.append(f"{hu_id} no aparece en ningún RF")

    js_citadas: set[str] = set()
    for hu_id, origen in hu.items():
        js_citadas |= origen
        if not origen:
            informe.avisos.append(f"{hu_id} no cita ninguna JS (¿nace del proceso real?)")
        for j in sorted(origen - js):
            informe.errores.append(f"{hu_id} cita {j}, que no existe en problem.md")
    for j in sorted(js - js_citadas):
        informe.avisos.append(f"{j} no la recoge ninguna HU")

    for rnf_id, celdas in rnf.items():
        relacion = celdas[-2] if len(celdas) >= 2 else ""
        rfs = ids_de(relacion, "RF")
        justificaciones = set(re.findall(r"\bJ-\d+\b", relacion))
        if not rfs and not (justificaciones & just):
            informe.errores.append(f"{rnf_id} no se relaciona con un RF ni con una justificación J-nn válida")
        for r in sorted(rfs - rf.keys()):
            informe.errores.append(f"{rnf_id} cita {r}, que no existe")


def verificar_adr(raiz: Path, informe: Informe) -> None:
    carpeta = raiz / "docs_solutions" / "docs_design" / "adr"
    if not carpeta.exists():
        return
    rf = set(filas_de_tabla(leer(raiz / "docs_discovery" / "requisitos_funcionales.md"), "RF"))
    rnf = set(filas_de_tabla(leer(raiz / "docs_discovery" / "requisitos_no_funcionales.md"), "RNF"))
    indice = leer(carpeta / "README_ADR.md")
    ssd = leer(raiz / "docs_solutions" / "docs_design" / "SSD.md")
    for ruta in sorted(carpeta.glob("[0-9][0-9][0-9][0-9]-*.md")):
        if ruta.name.startswith("0000-"):
            continue
        pedidos = requisitos_de_adr(leer(ruta))
        if pedidos is None:
            informe.errores.append(f"{ruta.name}: no tiene la línea «Requisitos:»")
        else:
            if not pedidos:
                informe.errores.append(f"{ruta.name}: «Requisitos:» no cita ningún RF/RNF")
            for r in sorted(pedidos - rf - rnf):
                informe.errores.append(f"{ruta.name}: cita {r}, que no existe")
        if ruta.name not in indice:
            informe.errores.append(f"{ruta.name}: falta en el índice README_ADR.md")
        if ruta.name not in ssd:
            informe.errores.append(f"{ruta.name}: falta en SSD §12")


def verificar_identificadores(raiz: Path, informe: Informe) -> None:
    """Un ID citado en cualquier .md debe estar definido en su documento de origen."""
    disc = raiz / "docs_discovery"
    definidos = (
        definir_js(leer(disc / "problem.md"))
        | set(definir_hu(leer(disc / "historias_usuarios.md")))
        | set(filas_de_tabla(leer(disc / "requisitos_funcionales.md"), "RF"))
        | set(filas_de_tabla(leer(disc / "requisitos_no_funcionales.md"), "RNF"))
    )
    for ruta in sorted(raiz.rglob("*.md")):
        if _ignorada(ruta, raiz) or ruta.name == "CHANGELOG.md":
            continue
        texto = CODIGO.sub("", leer(ruta))
        citados = {m.group(0) for m in ID.finditer(texto)}
        for citado in sorted(citados - definidos):
            informe.errores.append(f"{ruta.relative_to(raiz)}: cita {citado}, que no está definido")


def verificar_enlaces(raiz: Path, informe: Informe) -> None:
    for ruta in sorted(raiz.rglob("*.md")):
        if _ignorada(ruta, raiz):
            continue
        texto = CODIGO.sub("", leer(ruta))
        for destino in ENLACE.findall(texto):
            if destino.startswith(("http://", "https://", "mailto:", "#")):
                continue
            objetivo = (ruta.parent / unquote(destino.split("#")[0])).resolve()
            if not objetivo.exists():
                informe.errores.append(f"{ruta.relative_to(raiz)}: enlace roto a {destino}")


def _ignorada(ruta: Path, raiz: Path) -> bool:
    partes = ruta.relative_to(raiz).parts
    return any(p in {".git", "node_modules", ".claude"} for p in partes)


def verificar(raiz: Path) -> Informe:
    informe = Informe()
    verificar_cadena(raiz, informe)
    verificar_adr(raiz, informe)
    verificar_identificadores(raiz, informe)
    verificar_enlaces(raiz, informe)
    return informe


def main(argumentos: list[str]) -> int:
    raiz = Path(argumentos[0]).resolve() if argumentos else Path(__file__).resolve().parent.parent
    informe = verificar(raiz)
    for e in informe.errores:
        print(f"ERROR  {e}")
    for a in informe.avisos:
        print(f"AVISO  {a}")
    print(f"\n{len(informe.errores)} error(es), {len(informe.avisos)} aviso(s)")
    return 1 if informe.errores else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
