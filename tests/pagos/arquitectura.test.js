// Pruebas de arquitectura del servicio VAP_Pagos (ADR-0019): las mismas reglas que la webapp (ADR-0017).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SRC_PAGOS } from '../soporte/cargar-gs.js';
import { ARCHIVOS, ARCHIVOS_GS } from './cargar.js';

const leer = (archivo) => readFileSync(join(SRC_PAGOS, archivo), 'utf8');
const capa = (archivo) => archivo.split('-')[0];
const delaCapa = (nombre) => ARCHIVOS_GS.filter((f) => capa(f) === nombre);
const SERVICIOS_DE_GOOGLE =
  /\b(SpreadsheetApp|PropertiesService|UrlFetchApp|DriveApp|MailApp|LockService|ScriptApp|HtmlService|CacheService|Session|Utilities|ContentService|Logger)\b/;
const sinComentariosNiTextos = (codigo) =>
  codigo
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""');
const funcionesDe = (archivos) =>
  archivos.flatMap((f) => [...leer(f).matchAll(/^function (\w+)\(/gm)].map((m) => m[1]));

describe('estructura', () => {
  it('todo archivo es un .gs con prefijo de capa o el manifiesto', () => {
    for (const f of ARCHIVOS)
      expect(f === 'appsscript.json' || f === 'README.md' || /^(dominio|app|infra)-[a-z-]+\.gs$/.test(f), f).toBe(true);
  });
});

describe('regla de dependencias', () => {
  it('ni el dominio ni los casos de uso usan servicios de Google', () => {
    for (const f of [...delaCapa('dominio'), ...delaCapa('app')])
      expect(sinComentariosNiTextos(leer(f)), f).not.toMatch(SERVICIOS_DE_GOOGLE);
  });

  it('el dominio no llama a casos de uso ni a infraestructura; los casos de uso no llaman a infraestructura', () => {
    const pares = [
      [delaCapa('dominio'), funcionesDe([...delaCapa('app'), ...delaCapa('infra')])],
      [delaCapa('app'), funcionesDe(delaCapa('infra'))],
    ];
    for (const [archivos, prohibidas] of pares)
      for (const f of archivos)
        for (const nombre of prohibidas)
          expect(sinComentariosNiTextos(leer(f)), `${f} llama a ${nombre}`).not.toMatch(new RegExp(`\\b${nombre}\\(`));
  });
});

describe('seguridad · RNF-19 · RNF-21', () => {
  it('la única función pública es doPost; todas las demás terminan en _', () => {
    for (const nombre of funcionesDe(ARCHIVOS_GS))
      expect(nombre === 'doPost' || nombre.endsWith('_'), nombre).toBe(true);
  });

  it('doPost vive en infra-principal y comprueba el token antes de atender nada', () => {
    const cuerpo = /^function doPost\([^)]*\) \{([\s\S]*?)^\}/m.exec(leer('infra-principal.gs'))[1];
    expect(cuerpo.indexOf('tokenValido_')).toBeGreaterThan(-1);
    expect(cuerpo.indexOf('tokenValido_')).toBeLessThan(cuerpo.indexOf('atenderLlamada_'));
  });

  it('ningún registro ni mensaje de error incluye la cuenta: Logger solo recibe textos fijos o el tipo de error', () => {
    for (const f of ARCHIVOS_GS)
      for (const [llamada] of leer(f).matchAll(/Logger\.log\([^)]*\)/g))
        expect(llamada, f).not.toMatch(/iban|cuenta|datos|peticion/i);
  });
});

describe('sintaxis ES2019', () => {
  it('ningún .gs usa sintaxis posterior a ES2019', () => {
    const PROHIBIDO = [/\?\./, /\?\?/, /\.replaceAll\(/, /Object\.hasOwn\(/, /\.at\(-?\d/, /structuredClone\(/];
    for (const f of ARCHIVOS_GS) for (const p of PROHIBIDO) expect(sinComentariosNiTextos(leer(f)), f).not.toMatch(p);
  });
});

describe('configuración', () => {
  it('los nombres de hojas del libro solo aparecen en infra-configuracion', () => {
    for (const f of ARCHIVOS_GS.filter((x) => x !== 'infra-configuracion.gs'))
      expect(
        leer(f)
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, ''),
        f,
      ).not.toMatch(/['"`](huellas|subsanaciones|fusiones)['"`]/);
  });
});
