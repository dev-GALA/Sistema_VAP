// Unitarias del volcado de horas extras de secretarias: funciones puras y el análisis (sin escribir).
// Datos 100 % ficticios. Referencias: ADR-0013, RF-16..RF-19, SSD §7.2.
import { describe, expect, it } from 'vitest';
import { entornoVolcado, fecha, filaOrigen, filaDestino } from './ayudas.js';
import { plano } from '../soporte/cargar-gs.js';

const entorno = () => entornoVolcado();
const llamar = (nombre, ...args) => entorno().llamar(nombre, ...args);

describe('normalizeKey · clave de nombre (ADR-0013 · cruce por nombre)', () => {
  it.each([
    ['  Ana   Prueba ', 'ana prueba'],
    ['ÁNGELA PÉREZ', 'angela perez'],
    ['Lola\tFalsa\nGarcía', 'lola falsa garcia'],
    ['Nuria Núñez', 'nuria nunez'],
    ['', ''],
    [null, ''],
    [undefined, ''],
    [123, '123'],
  ])('«%s» → «%s»', (entrada, esperado) => {
    expect(llamar('normalizeKey', entrada)).toBe(esperado);
  });
  it('dos grafías de la misma persona dan la misma clave', () => {
    const e = entorno();
    expect(e.llamar('normalizeKey', 'MARÍA  Ficticia')).toBe(e.llamar('normalizeKey', 'maria ficticia'));
  });
  it('la ñ se pliega a n (dos personas distintas pueden colisionar: se caracteriza)', () => {
    const e = entorno();
    expect(e.llamar('normalizeKey', 'Muñoz Falso')).toBe(e.llamar('normalizeKey', 'Munoz Falso'));
  });
});

describe('normalizarMes_ · RF-17 · «mes no reconocible» se cuenta aparte', () => {
  it.each([
    ['MARZO', 'MARZO'], ['marzo', 'MARZO'], ['  Marzo ', 'MARZO'], ['MÁRZO', 'MARZO'],
    ['1', 'ENERO'], ['3', 'MARZO'], ['03', 'MARZO'], ['12', 'DICIEMBRE'], ['012', 'DICIEMBRE'],
    ['Sept', 'SEPTIEMBRE'], ['SET', 'SEPTIEMBRE'], ['setiembre', 'SEPTIEMBRE'], ['Sep', 'SEPTIEMBRE'],
    ['mar', 'MARZO'], ['may', 'MAYO'], ['jun', 'JUNIO'], ['jul', 'JULIO'], ['ago', 'AGOSTO'], ['dic', 'DICIEMBRE'],
    ['Enero 2026', 'ENERO'], ['febr', 'FEBRERO'],
  ])('«%s» → %s', (entrada, esperado) => {
    expect(llamar('normalizarMes_', entrada)).toBe(esperado);
  });
  it.each([[''], ['   '], [null], [undefined], ['0'], ['13'], ['-1'], ['3abc'], ['1.5'], ['ma'], ['xyz'], ['??']])(
    '«%s» → null', (entrada) => {
      expect(llamar('normalizarMes_', entrada)).toBeNull();
    },
  );
  it('un prefijo ambiguo de 3 letras no se adivina (ju → null con 2 letras; «jun» sí)', () => {
    const e = entorno();
    expect(e.llamar('normalizarMes_', 'ju')).toBeNull();
    expect(e.llamar('normalizarMes_', 'jun')).toBe('JUNIO');
  });
  it('caracterización: se acepta cualquier palabra que empiece por las 3 letras de UN solo mes (Martes → MARZO, Marzzo → MARZO)', () => {
    const e = entorno();
    expect(e.llamar('normalizarMes_', 'Martes')).toBe('MARZO');
    expect(e.llamar('normalizarMes_', 'Marzzo')).toBe('MARZO');
  });
  it('acepta un número de tipo número (como llega de una celda)', () => {
    expect(llamar('normalizarMes_', 7)).toBe('JULIO');
  });
});

describe('toDate_', () => {
  it('una fecha válida se devuelve y una inválida es null', () => {
    const e = entorno();
    expect(e.llamar('toDate_', fecha(2026, 3, 1)).getTime()).toBe(fecha(2026, 3, 1).getTime());
    expect(e.llamar('toDate_', new Date('no-es-fecha'))).toBeNull();
  });
  it.each([[''], [null], [undefined]])('vacío «%s» → null', (v) => {
    expect(llamar('toDate_', v)).toBeNull();
  });
  it('convierte texto ISO y número (milisegundos); texto basura → null', () => {
    const e = entorno();
    expect(e.llamar('toDate_', '2026-03-05T10:00:00Z').toISOString()).toBe('2026-03-05T10:00:00.000Z');
    expect(e.llamar('toDate_', 0).getTime()).toBe(0);
    expect(e.llamar('toDate_', 'abc')).toBeNull();
  });
});

describe('formatearFecha_ · usa el huso del script', () => {
  it('formatea dd/MM/yyyy en Europe/Madrid', () => {
    const e = entornoVolcado({ zona: 'Europe/Madrid' });
    expect(e.llamar('formatearFecha_', new Date('2026-12-31T23:30:00Z'))).toBe('01/01/2027');
  });
  it('con otro huso cambia el día (borde de medianoche)', () => {
    const e = entornoVolcado({ zona: 'UTC' });
    expect(e.llamar('formatearFecha_', new Date('2026-12-31T23:30:00Z'))).toBe('31/12/2026');
  });
});

describe('mostrar_', () => {
  it.each([['', '(vacío)'], [null, '(vacío)'], [undefined, '(vacío)'], [0, 0], ['x', 'x'], [3.5, 3.5]])('%j → %j', (v, esperado) => {
    expect(llamar('mostrar_', v)).toBe(esperado);
  });
});

describe('vacio_ · el 0 cuenta como dato (SSD §6.3)', () => {
  it.each([
    [null, true], [undefined, true], ['', true], ['   ', true],
    [0, false], ['0', false], [false, false], ['a', false], [5, false],
  ])('%j → vacío=%s', (v, esperado) => {
    expect(llamar('vacio_', v)).toBe(esperado);
  });
});

describe('esNumericoOVacio_ · RNF-08 (admite coma decimal y €)', () => {
  it.each([
    ['', true], [null, true], [undefined, true], [0, true], [3, true], [3.5, true],
    ['3', true], ['3,5', true], ['12 €', true], ['€ 12,50', true], ['  ', true], ['1 000', true],
    ['abc', false], ['3h', false], ['1.2.3', false], ['--', false],
    [NaN, false], [Infinity, false],
  ])('%j → %s', (v, esperado) => {
    expect(llamar('esNumericoOVacio_', v)).toBe(esperado);
  });
});

describe('valoresIguales_ · decide si hay que escribir', () => {
  it.each([
    [3, 3, true], [3, '3', true], ['3', 3, true], [3, '3.0', true], ['', null, true], [null, undefined, true],
    ['', '', true], ['  a ', 'a', true],
    [3, 4, false], ['', 0, false], [0, '', false], [null, 0, false], ['a', 'b', false], [3, '', false],
    ['abc', 3, false],
  ])('%j vs %j → %s', (a, b, esperado) => {
    expect(llamar('valoresIguales_', a, b)).toBe(esperado);
  });
  it('un 0 reportado SÍ difiere de una celda vacía (el 0 es dato)', () => {
    expect(llamar('valoresIguales_', '', 0)).toBe(false);
  });
});

describe('clasificarError_ · SSD §7.2 (tipos de ERROR con solución)', () => {
  it.each([
    ['No existe la pestaña destino: "Hoja 1".', 'PESTANA_NO_ENCONTRADA'],
    ['NO EXISTE LA PESTAÑA origen', 'PESTANA_NO_ENCONTRADA'],
    ['Exception: Requested entity was not found.', 'ACCESO_AL_DESTINO'],
    ['No tienes permisos para abrir el libro', 'ACCESO_AL_DESTINO'],
    ['You do not have access', 'ACCESO_AL_DESTINO'],
    ['Lock timeout: another process was holding the lock', 'BLOQUEO'],
    ['Se agotó el tiempo: bloqueo ocupado', 'BLOQUEO'],
    ['Exception: Maximum execution time exceeded', 'TIEMPO_EXCEDIDO'],
    ['Se superó el tiempo de ejecución', 'TIEMPO_EXCEDIDO'],
    ['Algo raro', 'NO_CLASIFICADO'],
    ['', 'NO_CLASIFICADO'],
  ])('«%s» → %s', (mensaje, tipo) => {
    expect(plano(llamar('clasificarError_', new Error(mensaje))).tipo).toBe(tipo);
  });
  it('cada tipo trae una solución legible', () => {
    const e = entorno();
    for (const m of ['No existe la pestaña', 'permiso', 'lock', 'maximum execution time', 'x']) {
      expect(plano(e.llamar('clasificarError_', new Error(m))).solucion.length).toBeGreaterThan(10);
    }
  });
  it('acepta texto o null en lugar de Error', () => {
    const e = entorno();
    expect(plano(e.llamar('clasificarError_', 'permiso denegado')).tipo).toBe('ACCESO_AL_DESTINO');
    expect(plano(e.llamar('clasificarError_', null)).tipo).toBe('NO_CLASIFICADO');
    expect(plano(e.llamar('clasificarError_', undefined)).tipo).toBe('NO_CLASIFICADO');
  });
  it('si el mensaje encaja con varios tipos gana el primero de la lista (pestaña antes que acceso)', () => {
    expect(plano(llamar('clasificarError_', new Error('No existe la pestaña: access'))).tipo).toBe('PESTANA_NO_ENCONTRADA');
  });
  it('el mensaje del doble «no existe o no hay acceso» NO se clasifica como acceso (caracterización)', () => {
    expect(plano(llamar('clasificarError_', new Error('No se puede abrir el documento con el ID X: no existe o no hay acceso.'))).tipo)
      .toBe('NO_CLASIFICADO');
  });
});

describe('analizarVolcado_ · validaciones (RF-16)', () => {
  it('rechaza un mes que no está en la lista', () => {
    const e = entornoVolcado();
    expect(() => e.llamar('analizarVolcado_', 'ENER', 2026)).toThrow('Mes no válido: "ENER".');
  });
  it('el mes debe venir normalizado: «marzo» en minúsculas se rechaza', () => {
    expect(() => entornoVolcado().llamar('analizarVolcado_', 'marzo', 2026)).toThrow(/Mes no válido/);
  });
  it('falla con mensaje claro si no existe la pestaña de origen', () => {
    const e = entornoVolcado({ origen: false });
    expect(() => e.llamar('analizarVolcado_', 'MARZO', 2026)).toThrow('No existe la pestaña origen: "Respuestas de formulario".');
  });
  it('falla si el libro de origen no existe', () => {
    const e = entornoVolcado({ libroOrigen: false });
    expect(() => e.llamar('analizarVolcado_', 'MARZO', 2026)).toThrow(/no existe o no hay acceso/);
  });
});

describe('analizarVolcado_ · hoja sin datos', () => {
  it('solo cabecera → plan vacío, sin tocar el destino', () => {
    const e = entornoVolcado({ origen: [] });
    const plan = plano(e.llamar('analizarVolcado_', 'MARZO', 2026));
    expect(plan).toMatchObject({ aVolcar: [], filasMes: [], corregidas: [], avisosFecha: [], incidencias: [],
      noCoinciden: 0, porOtroMes: 0, porOtroAnio: 0, sinMes: 0, totalFilas: 0, yaArchivado: false });
  });
  it('el plan vacío NO trae destinoOcupado (caracterización: el informe lo recibe como undefined)', () => {
    const plan = plano(entornoVolcado({ origen: [] }).llamar('analizarVolcado_', 'MARZO', 2026));
    expect(plan).not.toHaveProperty('destinoOcupado');
  });
  it('una fila completamente vacía se ignora en silencio (sin incidencia) pero cuenta en totalFilas', () => {
    const e = entornoVolcado({ origen: [filaOrigen(), filaOrigen({ ts: fecha(2026, 3, 2), mes: 'MARZO', nombre: 'Ana Prueba', horas: 1 })] });
    const plan = plano(e.llamar('analizarVolcado_', 'MARZO', 2026));
    expect(plan.totalFilas).toBe(2);
    expect(plan.incidencias).toEqual([]);
    expect(plan.filasMes).toEqual([3]);
  });
});

describe('analizarVolcado_ · criterio de coincidencia (ADR-0013 · mes + año)', () => {
  const analizar = (origen, mes = 'MARZO', anio = 2026, extra = {}) =>
    plano(entornoVolcado({ origen, ...extra }).llamar('analizarVolcado_', mes, anio));

  it('RF-16 · coincide cuando mes y año coinciden', () => {
    const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba', horas: 2, otros: 10 })]);
    expect(plan.filasMes).toEqual([2]);
    expect(plan.aVolcar).toHaveLength(1);
    expect(plan.aVolcar[0]).toMatchObject({ clave: 'ana prueba', displayName: 'Ana Prueba', horas: 2, otros: 10, filas: [2] });
    expect(plan.noCoinciden).toBe(0);
  });
  it('RF-17 · «otro mes» se cuenta y no se toca', () => {
    const plan = analizar([filaOrigen({ ts: fecha(2026, 4, 5), mes: 'ABRIL', nombre: 'Ana Prueba', horas: 2 })]);
    expect(plan).toMatchObject({ porOtroMes: 1, noCoinciden: 1, filasMes: [], aVolcar: [] });
  });
  it('RF-17 · «otro año» se cuenta aparte', () => {
    const plan = analizar([filaOrigen({ ts: fecha(2025, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba', horas: 2 })]);
    expect(plan).toMatchObject({ porOtroAnio: 1, porOtroMes: 0, noCoinciden: 1, filasMes: [] });
  });
  it('RF-17 · mes no reconocible se cuenta y genera incidencia MES_NO_RECONOCIDO con el texto original', () => {
    const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'Quizás', nombre: 'Ana Prueba', horas: 2 })]);
    expect(plan.sinMes).toBe(1);
    expect(plan.noCoinciden).toBe(1);
    expect(plan.incidencias).toEqual([{ tipo: 'MES_NO_RECONOCIDO', fila: 2, secretaria: 'Ana Prueba',
      detalle: 'La columna C dice "Quizás". No coincide con ningún mes.' }]);
  });
  it('MES vacío con nombre → MES_NO_RECONOCIDO con el texto vacío', () => {
    const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: '', nombre: 'Ana Prueba' })]);
    expect(plan.sinMes).toBe(1);
    expect(plan.incidencias[0].detalle).toBe('La columna C dice "". No coincide con ningún mes.');
  });
  it('sin nombre → SIN_NOMBRE y la fila se descarta (no cuenta como «no coincide»)', () => {
    const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: '   ', horas: 2 })]);
    expect(plan.incidencias).toEqual([{ tipo: 'SIN_NOMBRE', fila: 2, secretaria: '',
      detalle: 'La columna E (SECRETARIA) está vacía. Fila descartada.' }]);
    expect(plan.noCoinciden).toBe(0);
    expect(plan.filasMes).toEqual([]);
  });
  it('el MES se reconoce aunque venga en número, abreviado o con tildes', () => {
    const plan = analizar([
      filaOrigen({ ts: fecha(2026, 3, 1), mes: '3', nombre: 'Uno Falso' }),
      filaOrigen({ ts: fecha(2026, 3, 2), mes: 'mar', nombre: 'Dos Falso' }),
      filaOrigen({ ts: fecha(2026, 3, 3), mes: ' Marzo ', nombre: 'Tres Falso' }),
    ]);
    expect(plan.filasMes).toEqual([2, 3, 4]);
  });
  it('sin marca temporal: se exporta igualmente con incidencia SIN_MARCA_TEMPORAL (no se puede validar el año)', () => {
    const plan = analizar([filaOrigen({ mes: 'MARZO', nombre: 'Ana Prueba', horas: 2 })]);
    expect(plan.filasMes).toEqual([2]);
    expect(plan.incidencias).toEqual([{ tipo: 'SIN_MARCA_TEMPORAL', fila: 2, secretaria: 'Ana Prueba',
      detalle: 'Sin marca temporal: no se puede validar el año. Se exporta igualmente.' }]);
  });
  it('marca temporal no interpretable (texto) se trata como ausente', () => {
    const plan = analizar([filaOrigen({ ts: 'ayer por la tarde', mes: 'MARZO', nombre: 'Ana Prueba' })]);
    expect(plan.incidencias.map((i) => i.tipo)).toEqual(['SIN_MARCA_TEMPORAL']);
  });
  it('la marca temporal puede venir como texto ISO', () => {
    const plan = analizar([filaOrigen({ ts: '2026-03-05T10:00:00', mes: 'MARZO', nombre: 'Ana Prueba' })]);
    expect(plan.filasMes).toEqual([2]);
  });

  describe('bordes del periodo (huso Europe/Madrid)', () => {
    it('primer instante del año (01/01 00:00:00) pertenece a ese año', () => {
      expect(analizar([filaOrigen({ ts: fecha(2027, 1, 1, 0, 0, 0), mes: 'ENERO', nombre: 'Ana Prueba' })], 'ENERO', 2027).filasMes).toEqual([2]);
    });
    it('último segundo del año (31/12 23:59:59) pertenece a ese año', () => {
      expect(analizar([filaOrigen({ ts: fecha(2026, 12, 31, 23, 59, 59), mes: 'DICIEMBRE', nombre: 'Ana Prueba' })], 'DICIEMBRE', 2026).filasMes).toEqual([2]);
    });
    it('un envío de DICIEMBRE hecho el 2 de enero del año siguiente queda como «otro año» del periodo DICIEMBRE (año anterior)', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2027, 1, 2), mes: 'DICIEMBRE', nombre: 'Ana Prueba' })], 'DICIEMBRE', 2026);
      expect(plan).toMatchObject({ porOtroAnio: 1, filasMes: [] });
    });
    it('el mismo envío entra en el periodo DICIEMBRE 2027 con aviso de fecha (declara DICIEMBRE, marca = enero)', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2027, 1, 2), mes: 'DICIEMBRE', nombre: 'Ana Prueba' })], 'DICIEMBRE', 2027);
      expect(plan.filasMes).toEqual([2]);
      expect(plan.avisosFecha).toHaveLength(1);
    });
    it('año del periodo como texto numérico se admite en la capa pública, no aquí: el análisis recibe número', () => {
      expect(analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba' })], 'MARZO', 2026).filasMes).toEqual([2]);
    });
  });

  describe('aviso de marca temporal fuera del mes', () => {
    it('diferencia de 1 mes (envío tardío del día 1 siguiente) no avisa', () => {
      expect(analizar([filaOrigen({ ts: fecha(2026, 4, 1), mes: 'MARZO', nombre: 'Ana Prueba' })]).avisosFecha).toEqual([]);
    });
    it('diferencia de 2 meses o más avisa y la fila se exporta igualmente', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2026, 5, 20), mes: 'MARZO', nombre: 'Ana Prueba' })]);
      expect(plan.filasMes).toEqual([2]);
      expect(plan.avisosFecha).toEqual([{ fila: 2, nombre: 'Ana Prueba',
        detalle: 'Declara MARZO pero la marca temporal es 20/05/2026' }]);
    });
    it('el mismo mes no avisa', () => {
      expect(analizar([filaOrigen({ ts: fecha(2026, 3, 31, 23, 59), mes: 'MARZO', nombre: 'Ana Prueba' })]).avisosFecha).toEqual([]);
    });
  });

  describe('valores no numéricos (se exportan tal cual, con aviso)', () => {
    it('horas no numéricas → VALOR_NO_NUMERICO con el valor', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba', horas: 'dos' })]);
      expect(plan.incidencias).toEqual([{ tipo: 'VALOR_NO_NUMERICO', fila: 2, secretaria: 'Ana Prueba',
        detalle: 'Nº HORAS EXTRA = "dos" no es un número.' }]);
      expect(plan.aVolcar[0].horas).toBe('dos');
    });
    it('otros extras no numéricos → VALOR_NO_NUMERICO con el valor', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba', otros: 'nada' })]);
      expect(plan.incidencias[0].detalle).toBe('€ OTROS EXTRAS = "nada" no es un número.');
    });
    it('ambos mal → dos incidencias', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba', horas: 'a', otros: 'b' })]);
      expect(plan.incidencias).toHaveLength(2);
    });
    it('coma decimal, euros y vacío son válidos (RNF-08)', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba', horas: '2,5', otros: '15 €' })]);
      expect(plan.incidencias).toEqual([]);
    });
    it('el 0 se conserva como dato', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba', horas: 0, otros: 0 })]);
      expect(plan.aVolcar[0]).toMatchObject({ horas: 0, otros: 0 });
    });
    it('las filas que no coinciden con el periodo no generan avisos de valor', () => {
      const plan = analizar([filaOrigen({ ts: fecha(2026, 4, 5), mes: 'ABRIL', nombre: 'Ana Prueba', horas: 'x' })]);
      expect(plan.incidencias).toEqual([]);
    });
  });

  describe('RF-19 · varios envíos: prevalece el más reciente', () => {
    const base = { mes: 'MARZO', nombre: 'Ana Prueba' };
    it('gana la marca temporal más reciente aunque aparezca ANTES en la hoja', () => {
      const plan = analizar([
        filaOrigen({ ...base, ts: fecha(2026, 3, 20), horas: 5, otros: 50 }),
        filaOrigen({ ...base, ts: fecha(2026, 3, 10), horas: 1, otros: 10 }),
      ]);
      expect(plan.aVolcar).toHaveLength(1);
      expect(plan.aVolcar[0]).toMatchObject({ horas: 5, otros: 50, filas: [2, 3] });
      expect(plan.corregidas).toEqual([{ nombre: 'Ana Prueba', filas: [2, 3] }]);
    });
    it('gana el último en el tiempo aunque aparezca después en la hoja', () => {
      const plan = analizar([
        filaOrigen({ ...base, ts: fecha(2026, 3, 10), horas: 1 }),
        filaOrigen({ ...base, ts: fecha(2026, 3, 20), horas: 5 }),
      ]);
      expect(plan.aVolcar[0].horas).toBe(5);
    });
    it('con tres envíos, el más reciente del conjunto', () => {
      const plan = analizar([
        filaOrigen({ ...base, ts: fecha(2026, 3, 10), horas: 1 }),
        filaOrigen({ ...base, ts: fecha(2026, 3, 25), horas: 9 }),
        filaOrigen({ ...base, ts: fecha(2026, 3, 12), horas: 3 }),
      ]);
      expect(plan.aVolcar[0]).toMatchObject({ horas: 9, filas: [2, 3, 4] });
    });
    it('empate exacto de marca temporal: gana la fila posterior de la hoja', () => {
      const t = fecha(2026, 3, 10, 9, 0, 0);
      const plan = analizar([filaOrigen({ ...base, ts: t, horas: 1 }), filaOrigen({ ...base, ts: t, horas: 2 })]);
      expect(plan.aVolcar[0].horas).toBe(2);
    });
    it('el envío más reciente sustituye también el valor vacío (la corrección es completa, no campo a campo)', () => {
      const plan = analizar([
        filaOrigen({ ...base, ts: fecha(2026, 3, 10), horas: 4, otros: 20 }),
        filaOrigen({ ...base, ts: fecha(2026, 3, 11), horas: 6, otros: '' }),
      ]);
      expect(plan.aVolcar[0]).toMatchObject({ horas: 6, otros: '' });
    });
    it('agrupa por nombre normalizado (mayúsculas, tildes, espacios) y conserva la grafía del envío ganador', () => {
      const plan = analizar([
        filaOrigen({ mes: 'MARZO', nombre: 'ÁNA  prueba', ts: fecha(2026, 3, 10), horas: 1 }),
        filaOrigen({ mes: 'MARZO', nombre: 'Ana Prueba', ts: fecha(2026, 3, 11), horas: 2 }),
      ]);
      expect(plan.aVolcar).toHaveLength(1);
      expect(plan.aVolcar[0]).toMatchObject({ clave: 'ana prueba', displayName: 'Ana Prueba', horas: 2 });
    });
    it('envíos de distintos meses de la misma persona NO se mezclan: el de otro mes no pisa (ADR-0013)', () => {
      const plan = analizar([
        filaOrigen({ mes: 'MARZO', nombre: 'Ana Prueba', ts: fecha(2026, 3, 10), horas: 1 }),
        filaOrigen({ mes: 'ABRIL', nombre: 'Ana Prueba', ts: fecha(2026, 4, 2), horas: 99 }),
      ]);
      expect(plan.aVolcar[0].horas).toBe(1);
      expect(plan.porOtroMes).toBe(1);
    });
    it('personas distintas no se agrupan; no hay «corregidas»', () => {
      const plan = analizar([
        filaOrigen({ mes: 'MARZO', nombre: 'Ana Prueba', ts: fecha(2026, 3, 10), horas: 1 }),
        filaOrigen({ mes: 'MARZO', nombre: 'Bea Inventada', ts: fecha(2026, 3, 11), horas: 2 }),
      ]);
      expect(plan.aVolcar.map((v) => v.displayName)).toEqual(['Ana Prueba', 'Bea Inventada']);
      expect(plan.corregidas).toEqual([]);
    });
    it('caracterización: un envío SIN marca temporal pisa a uno con marca (no son comparables)', () => {
      const plan = analizar([
        filaOrigen({ ...base, ts: fecha(2026, 3, 20), horas: 5 }),
        filaOrigen({ ...base, horas: 1 }),
      ]);
      expect(plan.aVolcar[0].horas).toBe(1);
    });
    it('caracterización: si el primero no tiene marca, el siguiente con marca prevalece', () => {
      const plan = analizar([
        filaOrigen({ ...base, horas: 1 }),
        filaOrigen({ ...base, ts: fecha(2026, 3, 20), horas: 5 }),
      ]);
      expect(plan.aVolcar[0].horas).toBe(5);
    });
  });

  it('noCoinciden = otro mes + otro año + sin mes; totalFilas cuenta todas las filas leídas', () => {
    const plan = analizar([
      filaOrigen({ ts: fecha(2026, 3, 1), mes: 'MARZO', nombre: 'Ana Prueba' }),
      filaOrigen({ ts: fecha(2026, 4, 1), mes: 'ABRIL', nombre: 'Ana Prueba' }),
      filaOrigen({ ts: fecha(2025, 3, 1), mes: 'MARZO', nombre: 'Ana Prueba' }),
      filaOrigen(),
      filaOrigen({ ts: fecha(2026, 3, 1), mes: 'quizá', nombre: 'Ana Prueba' }),
    ]);
    expect(plan).toMatchObject({ porOtroMes: 1, porOtroAnio: 1, sinMes: 1, noCoinciden: 3, totalFilas: 5 });
    expect(plan.filasMes).toEqual([2]);
  });
  it('lee hasta la columna I aunque la hoja sea más estrecha (filas cortas)', () => {
    const e = entornoVolcado({ origen: [] });
    e.hojaOrigen.cargar([['Marca temporal', '', 'MES', '', 'SECRETARIA'], [fecha(2026, 3, 5), '', 'MARZO', '', 'Ana Prueba']]);
    const plan = plano(e.llamar('analizarVolcado_', 'MARZO', 2026));
    expect(plan.aVolcar[0]).toMatchObject({ displayName: 'Ana Prueba', horas: '', otros: '' });
  });
  it('analizar no modifica la hoja de respuestas ni crea hojas (RF-17 · RF-18)', () => {
    const e = entornoVolcado({ origen: [filaOrigen({ ts: fecha(2026, 3, 5), mes: 'MARZO', nombre: 'Ana Prueba', horas: 3 })] });
    const antes = e.hojaOrigen.volcar();
    e.llamar('analizarVolcado_', 'MARZO', 2026);
    expect(e.hojaOrigen.volcar()).toEqual(antes);
    expect(e.estado.escrituras).toEqual([]);
    expect(e.libroOrigen.getSheets().map((h) => h.getName())).toEqual(['Respuestas de formulario']);
  });
});

describe('contarCeldasOcupadasDestino_ · premisa de «destino limpio» (SSD §6.3)', () => {
  const aVolcar = (...nombres) => nombres.map((n) => ({ clave: n.toLowerCase(), displayName: n }));
  it('lista vacía → 0 sin abrir el destino (aunque el libro no exista)', () => {
    expect(entornoVolcado({ libroDestino: false }).llamar('contarCeldasOcupadasDestino_', [])).toBe(0);
  });
  it('destino limpio → 0', () => {
    const e = entornoVolcado({ destino: [filaDestino({ nombre: 'Ana Prueba' })] });
    expect(e.llamar('contarCeldasOcupadasDestino_', aVolcar('Ana Prueba'))).toBe(0);
  });
  it('cuenta AE y AH por separado', () => {
    const e = entornoVolcado({ destino: [filaDestino({ nombre: 'Ana Prueba', horas: 2, otros: 5 }), filaDestino({ nombre: 'Bea Inventada', horas: 1 })] });
    expect(e.llamar('contarCeldasOcupadasDestino_', aVolcar('Ana Prueba', 'Bea Inventada'))).toBe(3);
  });
  it('el 0 cuenta como dato; el vacío y los espacios no', () => {
    const e = entornoVolcado({ destino: [filaDestino({ nombre: 'Ana Prueba', horas: 0, otros: '  ' })] });
    expect(e.llamar('contarCeldasOcupadasDestino_', aVolcar('Ana Prueba'))).toBe(1);
  });
  it('solo cuenta a las secretarias del periodo; las demás filas no', () => {
    const e = entornoVolcado({ destino: [filaDestino({ nombre: 'Ana Prueba', horas: 2 }), filaDestino({ nombre: 'Otra Ajena', horas: 9, otros: 9 })] });
    expect(e.llamar('contarCeldasOcupadasDestino_', aVolcar('Ana Prueba'))).toBe(1);
  });
  it('compara con la clave normalizada y salta nombres vacíos', () => {
    const e = entornoVolcado({ destino: [filaDestino({ nombre: ' ANA   prueba ', horas: 2 }), filaDestino({ nombre: '', horas: 8 })] });
    expect(e.llamar('contarCeldasOcupadasDestino_', [{ clave: 'ana prueba', displayName: 'Ana Prueba' }])).toBe(1);
  });
  it('destino con solo cabecera → 0', () => {
    expect(entornoVolcado({ destino: [] }).llamar('contarCeldasOcupadasDestino_', aVolcar('Ana Prueba'))).toBe(0);
  });
  it('destino sin la pestaña → 0 (caracterización: se silencia)', () => {
    expect(entornoVolcado({ destino: false }).llamar('contarCeldasOcupadasDestino_', aVolcar('Ana Prueba'))).toBe(0);
  });
  it('no se puede abrir el libro destino → -1 («no se ha podido comprobar»)', () => {
    expect(entornoVolcado({ libroDestino: false }).llamar('contarCeldasOcupadasDestino_', aVolcar('Ana Prueba'))).toBe(-1);
  });
  it('no escribe nada', () => {
    const e = entornoVolcado({ destino: [filaDestino({ nombre: 'Ana Prueba', horas: 2 })] });
    e.llamar('contarCeldasOcupadasDestino_', aVolcar('Ana Prueba'));
    expect(e.estado.escrituras).toEqual([]);
  });
});

describe('yaArchivado_ · aviso de periodo ya archivado (ADR-0013)', () => {
  it('sin hoja Anteriores → false', () => {
    expect(entornoVolcado().llamar('yaArchivado_', 'MARZO', 2026)).toBe(false);
  });
  it('Anteriores vacía → false', () => {
    expect(entornoVolcado({ archivo: [] }).llamar('yaArchivado_', 'MARZO', 2026)).toBe(false);
  });
  it('detecta el sello en cualquier columna', () => {
    const e = entornoVolcado({ archivo: [['x', 'y', ''], ['a', '', 'ARCHIVADO MARZO 2026']] });
    expect(e.llamar('yaArchivado_', 'MARZO', 2026)).toBe(true);
  });
  it('tolera espacios alrededor del sello', () => {
    const e = entornoVolcado({ archivo: [['  ARCHIVADO MARZO 2026  ']] });
    expect(e.llamar('yaArchivado_', 'MARZO', 2026)).toBe(true);
  });
  it('otro mes u otro año → false', () => {
    const e = entornoVolcado({ archivo: [['ARCHIVADO MARZO 2026']] });
    expect(e.llamar('yaArchivado_', 'ABRIL', 2026)).toBe(false);
    expect(e.llamar('yaArchivado_', 'MARZO', 2025)).toBe(false);
  });
  it('el sello debe ser exacto: un texto que lo contiene no vale', () => {
    const e = entornoVolcado({ archivo: [['nota: ARCHIVADO MARZO 2026 revisado']] });
    expect(e.llamar('yaArchivado_', 'MARZO', 2026)).toBe(false);
  });
  it('si el libro de origen no se abre → false (no bloquea el análisis)', () => {
    expect(entornoVolcado({ libroOrigen: false }).llamar('yaArchivado_', 'MARZO', 2026)).toBe(false);
  });
  it('el histórico sin cabecera de 162 filas se recorre bien (sello al final)', () => {
    const filas = Array.from({ length: 162 }, (_, i) => [fecha(2026, 1, 1), '', `Persona ${i}`, 'ENERO', 1, '']);
    filas.push(['', '', '', '', '', '', '', '', '', '', 'ARCHIVADO MARZO 2026']);
    expect(entornoVolcado({ archivo: filas }).llamar('yaArchivado_', 'MARZO', 2026)).toBe(true);
  });
});

describe('constantes del script (contrato con la hoja, SSD §7.2 · §6.3)', () => {
  it('columnas de origen y destino documentadas', () => {
    const e = entorno();
    expect(plano(['SRC_TIMESTAMP_COL', 'SRC_MONTH_COL', 'SOURCE_NAME_COL', 'SRC_HORAS_EXTRA_COL', 'SRC_OTROS_EXTRAS_COL',
      'TARGET_NAME_COL', 'DST_HORAS_EXTRA_COL', 'DST_OTROS_EXTRAS_COL'].map((c) => e.valor(c))))
      .toEqual([1, 3, 5, 7, 9, 3, 31, 34]);
  });
  it('AE = columna 31 y AH = columna 34', () => {
    const e = entorno();
    const letra = (n) => { let s = ''; for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s; return s; };
    expect([letra(e.valor('DST_HORAS_EXTRA_COL')), letra(e.valor('DST_OTROS_EXTRAS_COL'))]).toEqual(['AE', 'AH']);
  });
  it('los 12 meses en mayúsculas y sin tildes, en orden', () => {
    expect(plano(entorno().valor('MESES'))).toEqual(['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']);
  });
  it('cabecera del LOG con las 9 columnas del SSD', () => {
    expect(plano(entorno().valor('LOG_HEADERS'))).toEqual(['Timestamp', 'Run ID', 'Usuario', 'Periodo', 'Categoría', 'Tipo', 'Fila origen', 'Secretaria', 'Detalle']);
  });
  it('los IDs de libro de origen y destino son distintos', () => {
    const e = entorno();
    expect(e.valor('SOURCE_SPREADSHEET_ID')).not.toBe(e.valor('TARGET_SPREADSHEET_ID'));
  });
});
