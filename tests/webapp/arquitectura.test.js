// Pruebas de arquitectura de la webapp (ADR-0017): vigilan las reglas sin depender de que alguien se
// acuerde. Leen el código fuente de `docs_solutions/src/webapp/`; no ejecutan nada.
//
// Regla de dependencias (Clean Architecture): las dependencias apuntan hacia dentro.
//   dominio → solo otros archivos de dominio, y sin servicios de Google.
//   app     → dominio y otros casos de uso; los servicios de Google le llegan inyectados.
//   infra   → adaptadores y punto de entrada; solo ella conoce los servicios de Google.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SRC_WEBAPP } from '../soporte/cargar-gs.js';
import { ARCHIVOS, ARCHIVOS_GS, ARCHIVOS_HTML } from './cargar.js';

const leer = (archivo) => readFileSync(join(SRC_WEBAPP, archivo), 'utf8');
const capa = (archivo) => archivo.split('-')[0];
const delaCapa = (nombreCapa) => ARCHIVOS_GS.filter((f) => capa(f) === nombreCapa);

const SERVICIOS_DE_GOOGLE =
  /\b(SpreadsheetApp|PropertiesService|UrlFetchApp|DriveApp|MailApp|LockService|ScriptApp|HtmlService|CacheService|Session|Utilities|ContentService|Logger)\b/;

// Quita comentarios y textos para no confundir una palabra dentro de un texto con código.
function sinComentariosNiTextos(codigo) {
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""');
}

const funcionesDe = (archivos) =>
  archivos.flatMap((f) => [...leer(f).matchAll(/^function (\w+)\(/gm)].map((m) => m[1]));

describe('estructura · cada archivo declara su capa', () => {
  it('hay código en las tres capas y pantallas', () => {
    for (const c of ['dominio', 'app', 'infra']) expect(delaCapa(c).length, c).toBeGreaterThan(0);
    expect(ARCHIVOS_HTML.length).toBeGreaterThan(0);
  });

  it('todo archivo es un .gs con prefijo de capa, un .html de interfaz o el manifiesto', () => {
    for (const f of ARCHIVOS) {
      const valido =
        f === 'appsscript.json' ||
        /^(dominio|app|infra)-[a-z-]+\.gs$/.test(f) ||
        /^ui-[a-z-]+\.html$/.test(f) ||
        f === 'README.md';
      expect(valido, `«${f}» no sigue la convención de nombres`).toBe(true);
    }
  });
});

describe('regla de dependencias', () => {
  it('el dominio no usa ningún servicio de Google', () => {
    for (const f of delaCapa('dominio')) {
      expect(sinComentariosNiTextos(leer(f)), `${f} usa un servicio de Google`).not.toMatch(SERVICIOS_DE_GOOGLE);
    }
  });

  it('los casos de uso no usan ningún servicio de Google: les llegan inyectados', () => {
    for (const f of delaCapa('app')) {
      expect(sinComentariosNiTextos(leer(f)), `${f} usa un servicio de Google`).not.toMatch(SERVICIOS_DE_GOOGLE);
    }
  });

  it('el dominio no llama a casos de uso ni a infraestructura', () => {
    const prohibidas = funcionesDe([...delaCapa('app'), ...delaCapa('infra')]);
    for (const f of delaCapa('dominio')) {
      const codigo = sinComentariosNiTextos(leer(f));
      for (const nombre of prohibidas)
        expect(codigo, `${f} llama a ${nombre}`).not.toMatch(new RegExp(`\\b${nombre}\\(`));
    }
  });

  it('los casos de uso no llaman a infraestructura', () => {
    const prohibidas = funcionesDe(delaCapa('infra'));
    for (const f of delaCapa('app')) {
      const codigo = sinComentariosNiTextos(leer(f));
      for (const nombre of prohibidas)
        expect(codigo, `${f} llama a ${nombre}`).not.toMatch(new RegExp(`\\b${nombre}\\(`));
    }
  });
});

describe('seguridad · qué puede llamar el navegador', () => {
  it('solo doGet y las funciones api… son públicas; todas las demás terminan en _', () => {
    for (const nombre of funcionesDe(ARCHIVOS_GS)) {
      const publica = nombre === 'doGet' || /^api[A-Z]/.test(nombre);
      const privada = nombre.endsWith('_');
      expect(publica || privada, `«${nombre}» es pública sin ser doGet ni api…`).toBe(true);
    }
  });

  it('las funciones api… viven en infra-principal y solo delegan en un caso de uso', () => {
    const codigo = leer('infra-principal.gs');
    const apis = [...codigo.matchAll(/^function (api\w+)\([^)]*\) \{([\s\S]*?)^\}/gm)];
    expect(apis.length).toBeGreaterThan(0);
    for (const [, nombre, cuerpo] of apis) {
      expect(cuerpo, `${nombre} no usa dependencias_()`).toContain('dependencias_()');
      expect(sinComentariosNiTextos(cuerpo), `${nombre} toca un servicio de Google`).not.toMatch(SERVICIOS_DE_GOOGLE);
    }
    for (const f of ARCHIVOS_GS.filter((x) => x !== 'infra-principal.gs')) {
      expect(leer(f), `${f} define una función api…`).not.toMatch(/^function api\w+\(/m);
    }
  });

  it('el HTML del cliente no inserta texto del servidor como HTML', () => {
    for (const f of ARCHIVOS_HTML)
      expect(leer(f), `${f} usa innerHTML`).not.toMatch(/\binnerHTML\b|\binsertAdjacentHTML\b|document\.write/);
  });

  it('las plantillas solo usan scriptlets para incluir archivos y para datos simples', () => {
    const permitido = /^<\?!?= *(include_\('[a-z-]+'\)|[a-zA-Z]+) *\?>$/;
    for (const f of ARCHIVOS_HTML) {
      for (const [scriptlet] of leer(f).matchAll(/<\?[\s\S]*?\?>/g)) {
        expect(scriptlet, `${f}: scriptlet no permitido`).toMatch(permitido);
      }
    }
  });
});

describe('sintaxis ES2019 · la versión de V8 de Apps Script no está verificada', () => {
  const PROHIBIDO = [
    [/\?\./, 'encadenamiento opcional (?.)'],
    [/\?\?/, 'fusión de nulos (??)'],
    [/\.replaceAll\(/, 'replaceAll'],
    [/Object\.hasOwn\(/, 'Object.hasOwn'],
    [/\.at\(-?\d/, 'Array.prototype.at'],
    [/structuredClone\(/, 'structuredClone'],
    [/\bnew Intl\.ListFormat\b/, 'Intl.ListFormat'],
  ];
  it('ningún .gs usa sintaxis posterior a ES2019', () => {
    for (const f of ARCHIVOS_GS) {
      const codigo = sinComentariosNiTextos(leer(f));
      for (const [patron, nombre] of PROHIBIDO) expect(codigo, `${f} usa ${nombre}`).not.toMatch(patron);
    }
  });
});

describe('configuración · lo que puede cambiar no está esparcido por la lógica', () => {
  it('los nombres de hojas y columnas solo aparecen en infra-configuracion', () => {
    const sinComentarios = (codigo) => codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const f of ARCHIVOS_GS.filter((x) => x !== 'infra-configuracion.gs')) {
      expect(sinComentarios(leer(f)), `${f} escribe el nombre de una hoja`).not.toMatch(
        /['"`](config|estado_pasos)['"`]/,
      );
    }
  });
});
