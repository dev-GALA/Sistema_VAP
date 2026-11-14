#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validador de skills: especificación Agent Skills + guía de buenas prácticas
de Anthropic + convenciones del usuario.

Solo usa la biblioteca estándar. Si PyYAML está instalado, lo usa para
comprobar la cabecera; si no, hace una comprobación aproximada y lo avisa.

Uso:
  python3 validar_skill.py --coleccion ~/.claude/skills    (todas las skills + coherencia entre ellas)
  python3 validar_skill.py RUTA_SKILL [RUTA_SKILL ...]     (solo esas skills)

Opciones:
  --claude-md ARCHIVO   CLAUDE.md contra el que comprobar las skills citadas
                        (por defecto ~/.claude/CLAUDE.md si existe y se usa --coleccion)
  --estricto            los avisos también hacen fallar (código de salida 1)

Código de salida: 0 sin errores, 1 con errores (o con avisos si --estricto),
2 por uso incorrecto.

Fuentes (verificadas el 2026-11-14):
  https://agentskills.io/specification
  https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
  https://code.claude.com/docs/en/skills
Si esas páginas cambian, actualiza las constantes de aquí abajo.
"""
import argparse
import os
import re
import sys

try:
    import yaml  # PyYAML, opcional
except ImportError:  # pragma: no cover
    yaml = None

ERROR = "ERROR"
AVISO = "AVISO"

# Campos de la especificación Agent Skills
CAMPOS_SPEC = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}
# Campos que añade Claude Code (https://code.claude.com/docs/en/skills)
CAMPOS_CLAUDE_CODE = {
    "disable-model-invocation", "user-invocable", "context", "agent", "model",
    "argument-hint", "arguments", "hooks", "effort", "paths", "shell",
    "when_to_use", "disallowed-tools",
}

MAX_NOMBRE = 64                 # especificación
MAX_DESCRIPCION = 1024          # especificación
MAX_LINEAS_CUERPO = 500         # guía de buenas prácticas
LINEAS_CUERPO_AVISO = 400       # margen para avisar antes de llegar al límite
LINEAS_REFERENCIA_SIN_INDICE = 100  # guía: las referencias largas llevan índice
MIN_DESCRIPCION_UTIL = 80       # por debajo, la descripción suele ser demasiado vaga
PALABRAS_RESERVADAS = ("claude", "anthropic")

# Convención del usuario: prefijo de tipo de proyecto y sustantivos
PREFIJOS_TIPO = ("dev", "web", "datos")
# Palabras acabadas en ar/er/ir que son sustantivos o adjetivos, no verbos
NO_VERBOS = {"taller", "lugar", "mayor", "menor", "exterior", "interior", "mujer"}


def _normalizar(texto):
    """Devuelve el texto con saltos de línea Unix y si traía finales CRLF."""
    return texto.replace("\r\n", "\n"), "\r\n" in texto


def separar_frontmatter(texto):
    """Separa la cabecera entre '---' del cuerpo. Devuelve (cabecera, cuerpo) o (None, texto)."""
    m = re.match(r"\A---\n(.*?)\n---[ \t]*(?:\n(.*))?\Z", texto, re.S)
    if not m:
        return None, texto
    return m.group(1), m.group(2) or ""


def leer_campos_sin_yaml(cabecera):
    """Lector mínimo de 'clave: valor' de primer nivel, para cuando no hay PyYAML.

    Devuelve (campos, problemas). Detecta el fallo más habitual: un valor sin
    comillas que contiene ': ', que YAML interpreta como otro campo.
    """
    campos, problemas = {}, []
    lineas = cabecera.split("\n")
    i = 0
    while i < len(lineas):
        m = re.match(r"^([A-Za-z_][\w-]*):(?:[ \t]+(.*))?$", lineas[i])
        if not m:
            i += 1
            continue
        clave, valor = m.group(1), (m.group(2) or "").strip()
        j = i + 1
        hijas = []
        while j < len(lineas) and lineas[j][:1] in (" ", "\t"):
            hijas.append(lineas[j].strip())
            j += 1
        if valor[:1] in (">", "|"):
            campos[clave] = " ".join(h for h in hijas if h)
        elif valor == "":
            campos[clave] = {} if hijas else ""
        else:
            if valor[0] not in "\"'[{&*!":
                if re.search(r":[ \t]", valor):
                    problemas.append(
                        f"'{clave}' contiene ': ' sin comillas, y YAML lo lee como otro campo "
                        "(usa una coma o pon el valor entre comillas)")
                if re.search(r"[ \t]#", valor):
                    problemas.append(
                        f"'{clave}' contiene ' #' sin comillas, y YAML lo trata como comentario "
                        "(se cortaría el valor)")
            else:
                valor = valor.strip("\"'")
            campos[clave] = valor
        i = j
    return campos, problemas


def leer_campos(cabecera, usar_yaml=True):
    """Devuelve (campos, problemas, aproximado)."""
    if usar_yaml and yaml is not None:
        try:
            datos = yaml.safe_load(cabecera)
        except yaml.YAMLError as e:
            primera = str(e).splitlines()[0] if str(e) else "error de sintaxis"
            return None, [f"YAML inválido en la cabecera ({primera})"], False
        if not isinstance(datos, dict):
            return None, ["La cabecera no es una lista de 'clave: valor'"], False
        return datos, [], False
    campos, problemas = leer_campos_sin_yaml(cabecera)
    return campos, problemas, True


def validar_skill(ruta, usar_yaml=True):
    """Valida una carpeta de skill. Devuelve una lista de (nivel, mensaje)."""
    hallazgos = []

    def err(mensaje):
        hallazgos.append((ERROR, mensaje))

    def aviso(mensaje):
        hallazgos.append((AVISO, mensaje))

    ruta = os.path.normpath(ruta)
    carpeta = os.path.basename(os.path.abspath(ruta))
    archivo = os.path.join(ruta, "SKILL.md")
    if not os.path.isfile(archivo):
        err("Falta SKILL.md (con ese nombre exacto, en mayúsculas)")
        return hallazgos
    try:
        with open(archivo, encoding="utf-8", newline="") as f:
            crudo = f.read()
    except UnicodeDecodeError:
        err("SKILL.md no está en UTF-8")
        return hallazgos

    texto, tenia_crlf = _normalizar(crudo)
    if tenia_crlf:
        aviso("SKILL.md tiene finales de línea de Windows (CRLF); conviértelos con: sed -i 's/\\r$//' SKILL.md")

    cabecera, cuerpo = separar_frontmatter(texto)
    if cabecera is None:
        err("SKILL.md debe empezar con una cabecera entre líneas '---'")
        return hallazgos

    campos, problemas, aproximado = leer_campos(cabecera, usar_yaml)
    for p in problemas:
        err(p)
    if aproximado:
        aviso("Comprobación de YAML aproximada (PyYAML no disponible); "
              "instálalo con 'sudo apt install python3-yaml' para una comprobación completa")
    if campos is None:
        return hallazgos

    # --- name ---
    nombre = campos.get("name")
    if not isinstance(nombre, str) or not nombre.strip():
        err("Falta el campo 'name'")
        nombre = None
    else:
        if len(nombre) > MAX_NOMBRE:
            err(f"'name' tiene {len(nombre)} caracteres (máximo {MAX_NOMBRE})")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", nombre):
            err("'name' solo admite minúsculas sin tildes, números y guiones, "
                "sin guion inicial, final ni consecutivos")
        if nombre != carpeta:
            err(f"'name' ({nombre}) no coincide con el nombre de la carpeta ({carpeta})")
        for palabra in PALABRAS_RESERVADAS:
            if palabra in nombre:
                err(f"'name' no puede contener la palabra reservada '{palabra}'")

    # --- description ---
    desc = campos.get("description")
    if not isinstance(desc, str) or not desc.strip():
        err("Falta el campo 'description' (o está vacío)")
    else:
        if len(desc) > MAX_DESCRIPCION:
            err(f"'description' tiene {len(desc)} caracteres (máximo {MAX_DESCRIPCION})")
        if re.search(r"[<>]", desc):
            err("'description' no puede contener '<' ni '>' (etiquetas XML)")
        if re.search(r"\b(puedo|puedes|te ayudo|ayudarte|ayúdame|I can|you can|I will)\b", desc, re.I):
            aviso("'description' parece escrita en primera o segunda persona; debe ir en tercera ('Crea...', no 'Puedo...')")
        if not re.search(r"\b(cuando|úsala|úsalo|usa esta|use when|si el usuario|siempre que|antes de)\b", desc, re.I):
            aviso("'description' no dice cuándo usar la skill (qué hace y cuándo usarla)")
        if len(desc.strip()) < MIN_DESCRIPCION_UTIL:
            aviso(f"'description' es muy corta ({len(desc.strip())} caracteres); las vagas no se activan bien")

    desconocidos = sorted(set(campos) - CAMPOS_SPEC - CAMPOS_CLAUDE_CODE)
    if desconocidos:
        aviso("Campos de cabecera no reconocidos: " + ", ".join(desconocidos))

    # --- cuerpo ---
    lineas = len(cuerpo.splitlines())
    if lineas >= MAX_LINEAS_CUERPO:
        err(f"El cuerpo tiene {lineas} líneas (debe tener menos de {MAX_LINEAS_CUERPO}); mueve detalle a archivos de apoyo")
    elif lineas > LINEAS_CUERPO_AVISO:
        aviso(f"El cuerpo tiene {lineas} líneas y se acerca al límite de {MAX_LINEAS_CUERPO}")
    if re.search(r"\b(?:FIXME|XXX)\b|\bTODO:", texto):
        aviso("Quedan marcas de trabajo pendiente (TODO:, FIXME, XXX)")
    if re.search(r"`[^`\n]*[\w.]\\[\w.][^`\n]*`", cuerpo):
        aviso("Hay rutas con barra invertida '\\'; usa siempre '/'")

    # --- referencias a archivos de la propia skill ---
    refs = set(re.findall(r"`((?:references|assets|scripts)/[^`\s*<>{}]+)`", cuerpo))
    refs |= {r.split("#")[0] for r in re.findall(r"\]\((?!https?://|mailto:|#)([^)\s]+)\)", cuerpo)}
    for r in sorted(x for x in refs if x):
        if not os.path.exists(os.path.join(ruta, r)):
            err(f"El cuerpo referencia '{r}', que no existe")

    # --- skills mencionadas ---
    padre = os.path.dirname(os.path.abspath(ruta))
    for s in sorted(set(re.findall(r"\b[Ss]kill `([a-z0-9]+(?:-[a-z0-9]+)*)`", cuerpo))):
        if s != nombre and not os.path.isdir(os.path.join(padre, s)):
            err(f"Menciona la skill '{s}', que no existe junto a esta")

    # --- archivos de apoyo ---
    for sub in ("references", "assets"):
        base = os.path.join(ruta, sub)
        if not os.path.isdir(base):
            continue
        for raiz, _, archivos in os.walk(base):
            for a in sorted(archivos):
                if not a.endswith(".md"):
                    continue
                p = os.path.join(raiz, a)
                rel = os.path.relpath(p, ruta).replace(os.sep, "/")
                try:
                    with open(p, encoding="utf-8") as f:
                        t = f.read()
                except UnicodeDecodeError:
                    aviso(f"{rel} no está en UTF-8")
                    continue
                if re.search(r"\b(?:references|assets|scripts)/[\w./-]+", t):
                    aviso(f"{rel} referencia otros archivos de la skill; enlaza todo directamente desde SKILL.md, sin cadenas")
                lineas_ref = t.splitlines()
                if len(lineas_ref) > LINEAS_REFERENCIA_SIN_INDICE and not re.search(
                        r"(?i)contenido|índice|indice|table of contents", "\n".join(lineas_ref[:20])):
                    aviso(f"{rel} tiene más de {LINEAS_REFERENCIA_SIN_INDICE} líneas y no empieza con un índice")
    return hallazgos


def validar_coleccion_global(carpetas, claude_md=None):
    """Comprobaciones entre skills. Devuelve una lista de (elemento, nivel, mensaje)."""
    hallazgos = []
    nombres = [os.path.basename(os.path.abspath(c)) for c in carpetas]

    for n in nombres:
        partes = n.split("-")
        if partes[0] in PREFIJOS_TIPO:
            partes = partes[1:]
        else:
            hallazgos.append((n, AVISO, f"sin prefijo de tipo de proyecto ({', '.join(PREFIJOS_TIPO)})"))
        primera = partes[0] if partes else ""
        if re.fullmatch(r"[a-z]{3,}(?:ar|er|ir)", primera) and primera not in NO_VERBOS:
            hallazgos.append((n, AVISO,
                              f"'{primera}' parece un verbo en infinitivo; la colección usa sustantivos "
                              "(p. ej. dev-nuevo-adr, dev-revision-cierre)"))

    if claude_md and os.path.isfile(claude_md):
        try:
            with open(claude_md, encoding="utf-8") as f:
                t = f.read()
        except UnicodeDecodeError:
            hallazgos.append((os.path.basename(claude_md), AVISO, "no está en UTF-8; no se comprueban las skills citadas"))
            return hallazgos
        patron = r"`((?:" + "|".join(PREFIJOS_TIPO) + r")-[a-z0-9]+(?:-[a-z0-9]+)*)`"
        citadas = set(re.findall(patron, t))
        for s in sorted(citadas - set(nombres)):
            hallazgos.append((os.path.basename(claude_md), ERROR, f"cita la skill '{s}', que no existe en la colección"))
        for n in sorted(nombres):
            if n.split("-")[0] in PREFIJOS_TIPO and n not in citadas:
                hallazgos.append((n, AVISO, f"no aparece en la tabla de skills de {os.path.basename(claude_md)}"))
    return hallazgos


def listar_skills(coleccion):
    return sorted(
        os.path.join(coleccion, d) for d in os.listdir(coleccion)
        if os.path.isdir(os.path.join(coleccion, d))
        and not d.startswith(".") and d != "synced")  # synced: skills de la cuenta, las gestiona la app


def _imprimir(titulo, hallazgos):
    print(f"== {titulo}")
    if not hallazgos:
        print("  OK")
    for nivel, mensaje in hallazgos:
        print(f"  {nivel}  {mensaje}")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Valida skills (Agent Skills + guía de Anthropic + convenciones propias).")
    ap.add_argument("skills", nargs="*", help="carpetas de skills a validar")
    ap.add_argument("--coleccion", help="carpeta con todas las skills (valida cada una y la coherencia entre ellas)")
    ap.add_argument("--claude-md", help="CLAUDE.md contra el que comprobar las skills citadas")
    ap.add_argument("--estricto", action="store_true", help="los avisos también hacen fallar")
    ap.add_argument("--sin-yaml", action="store_true", help="fuerza la comprobación aproximada de YAML (pruebas)")
    args = ap.parse_args(argv)

    coleccion = os.path.expanduser(args.coleccion) if args.coleccion else None
    carpetas = [os.path.expanduser(s) for s in args.skills]
    if coleccion:
        if not os.path.isdir(coleccion):
            print(f"No existe la carpeta de skills: {coleccion}", file=sys.stderr)
            return 2
        carpetas = carpetas or listar_skills(coleccion)
    if not carpetas:
        ap.print_usage(sys.stderr)
        return 2

    claude_md = os.path.expanduser(args.claude_md) if args.claude_md else None
    if claude_md is None and coleccion:
        por_defecto = os.path.expanduser("~/.claude/CLAUDE.md")
        claude_md = por_defecto if os.path.isfile(por_defecto) else None

    errores = avisos = 0
    for c in carpetas:
        h = validar_skill(c, usar_yaml=not args.sin_yaml)
        _imprimir(os.path.basename(os.path.abspath(c)), h)
        errores += sum(1 for n, _ in h if n == ERROR)
        avisos += sum(1 for n, _ in h if n == AVISO)

    if coleccion:
        g = validar_coleccion_global(carpetas, claude_md)
        _imprimir("coherencia de la colección" + (f" (CLAUDE.md: {claude_md})" if claude_md else ""),
                  [(n, f"{elem}: {m}") for elem, n, m in g])
        errores += sum(1 for _, n, _ in g if n == ERROR)
        avisos += sum(1 for _, n, _ in g if n == AVISO)

    print(f"\n{len(carpetas)} skill(s), {errores} error(es), {avisos} aviso(s)")
    if errores or (args.estricto and avisos):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
