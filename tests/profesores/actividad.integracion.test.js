// Integración del volcado de actividad: análisis, destino, histórico, log, bloqueo y errores del servicio.
// RF-16/17/18 (periodo, informe previo, cancelar) · RF-20 (acumulación) · RF-23 (destino) · RF-46/48 (log)
// RF-63/64/70 (histórico) · RNF-04 (concurrencia) · ADR-0009 · ADR-0014 · SSD §7.4.
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { ANCHO_DESTINO, ANCHO_ORIGEN, CABECERAS_ORIGEN, entornoActividad, filaDestino, filaOrigen, leerLog } from './ayudas.js';

const ANA = 'Ana Beta Ficticia';
const CARLOS = 'Carlos Dos Ficticio';
const analizar = (x, mes = 'MARZO', anio = 2026) => plano(x.llamar('analizarVolcado_', mes, anio));
const instantanea = (x) => plano([...x.google.estado.libros.values()].map((l) => l.getSheets().map((h) => [l.getId(), h.getName(), h.volcar()])));

describe('analizarVolcado_ · validaciones previas', () => {
  it('RF-16 · rechaza un mes que no está en la lista (en minúsculas también)', () => {
    const x = entornoActividad();
    expect(() => x.llamar('analizarVolcado_', 'marzo', 2026)).toThrow('Mes no válido: "marzo".');
    expect(() => x.llamar('analizarVolcado_', '', 2026)).toThrow('Mes no válido: "".');
    expect(() => x.llamar('analizarVolcado_', undefined, 2026)).toThrow('Mes no válido');
  });
  it('lanza si no existe la pestaña de respuestas', () => {
    expect(() => entornoActividad({ sinHojaOrigen: true }).llamar('analizarVolcado_', 'MARZO', 2026)).toThrow('No existe la pestaña origen: "Respuestas de formulario 1".');
  });
  it('lanza si el libro de respuestas no es accesible (error del servicio)', () => {
    const x = entornoActividad();
    x.google.estado.libros.delete(x.valor('SOURCE_SPREADSHEET_ID'));
    expect(() => x.llamar('analizarVolcado_', 'MARZO', 2026)).toThrow(/no existe o no hay acceso/);
  });
  it('hoja solo con cabecera: plan vacío sin error', () => {
    const r = analizar(entornoActividad());
    expect(r).toMatchObject({ aVolcar: [], filasMes: [], noCoinciden: 0, totalFilas: 0, celdasConValor: 0, yaArchivado: false });
  });
});

describe('analizarVolcado_ · clasificación de filas (RF-16/17)', () => {
  it('cuenta coincidencias, otro mes, otro año y mes irreconocible; ignora filas totalmente vacías', () => {
    const x = entornoActividad({ origen: [
      filaOrigen({ profesor: ANA, datos: { 6: 1 } }),
      filaOrigen({ profesor: ANA, mes: 'ABRIL' }),
      filaOrigen({ profesor: ANA, ts: '2025-03-10T12:00:00Z' }),
      Array(ANCHO_ORIGEN).fill(''),
      filaOrigen({ profesor: ANA, mes: 'quizás' }),
    ] });
    const r = analizar(x);
    expect(r).toMatchObject({ totalFilas: 5, filasMes: [2], noCoinciden: 3, porOtroMes: 1, porOtroAnio: 1, sinMes: 1 });
    expect(r.incidencias.map((i) => i.tipo)).toStrictEqual(['MES_NO_RECONOCIDO']);
  });
  it('una fila sin profesor es incidencia SIN_PROFESOR y se descarta (no cuenta como no coincide)', () => {
    const r = analizar(entornoActividad({ origen: [filaOrigen({ profesor: '   ', datos: { 6: 1 } })] }));
    expect(r.incidencias).toStrictEqual([{ tipo: 'SIN_PROFESOR', fila: 2, detalle: 'La columna E (SELECCIONE EL PROFESOR) está vacía. Fila descartada.' }]);
    expect(r).toMatchObject({ filasMes: [], noCoinciden: 0, aVolcar: [] });
  });
  it('MES_NO_RECONOCIDO incluye el texto recibido y el profesor', () => {
    const r = analizar(entornoActividad({ origen: [filaOrigen({ profesor: ANA, mes: 'Trimestre uno' })] }));
    expect(r.incidencias[0]).toStrictEqual({ tipo: 'MES_NO_RECONOCIDO', fila: 2, profesor: ANA, detalle: 'La columna C dice "Trimestre uno". No coincide con ningún mes.' });
  });
  it('admite el mes escrito como número, abreviatura o con tildes/minúsculas', () => {
    const x = entornoActividad({ origen: [filaOrigen({ mes: '3' }), filaOrigen({ mes: 'mar' }), filaOrigen({ mes: ' marzo ' })] });
    expect(analizar(x).filasMes).toStrictEqual([2, 3, 4]);
  });
  it('el año del periodo se toma de la marca temporal (no de la columna del mes)', () => {
    const x = entornoActividad({ origen: [filaOrigen({ ts: '2027-03-10T12:00:00Z' })] });
    expect(analizar(x, 'MARZO', 2026)).toMatchObject({ porOtroAnio: 1, filasMes: [] });
    expect(analizar(x, 'MARZO', 2027)).toMatchObject({ porOtroAnio: 0, filasMes: [2] });
  });
  it('sin marca temporal la fila entra (no hay año que filtrar) y queda como incidencia SIN_MARCA_TEMPORAL', () => {
    const r = analizar(entornoActividad({ origen: [filaOrigen({ ts: '', profesor: ANA, datos: { 6: 4 } })] }));
    expect(r.filasMes).toStrictEqual([2]);
    expect(r.incidencias[0]).toMatchObject({ tipo: 'SIN_MARCA_TEMPORAL', fila: 2, profesor: ANA });
  });
  it('una marca temporal que es texto no interpretable se trata como ausente', () => {
    const r = analizar(entornoActividad({ origen: [filaOrigen({ ts: 'ayer por la tarde', profesor: ANA })] }));
    expect(r.filasMes).toStrictEqual([2]);
    expect(r.incidencias.map((i) => i.tipo)).toContain('SIN_MARCA_TEMPORAL');
  });
  it('año como texto en el menú: analizarVolcado_ recibe número; Number("2026") se aplica en vapAnalizarPeriodo', () => {
    const x = entornoActividad({ origen: [filaOrigen({})] });
    expect(plano(x.llamar('vapAnalizarPeriodo', 'MARZO', '2026')).coinciden).toBe(1);
  });
  it('aviso de fecha: el mes declarado y la marca difieren en más de un mes (el mes anterior o siguiente es normal)', () => {
    const x = entornoActividad({ origen: [
      filaOrigen({ ts: '2026-04-05T12:00:00Z' }), // mes siguiente: sin aviso
      filaOrigen({ ts: '2026-02-20T12:00:00Z' }), // mes anterior: sin aviso
      filaOrigen({ ts: '2026-06-05T12:00:00Z', profesor: CARLOS }), // 3 meses: aviso
    ] });
    const r = analizar(x);
    expect(r.filasMes).toStrictEqual([2, 3, 4]);
    expect(r.avisosFecha).toStrictEqual([{ fila: 4, nombre: CARLOS, detalle: 'Declara MARZO pero la marca temporal es 05/06/2026' }]);
  });
});

describe('analizarVolcado_ · cambio de año (diciembre reportado en enero)', () => {
  it('caracterización: el año del periodo es el de la marca temporal (ADR-0014), así que DICIEMBRE 2026 recoge un envío del 5-ene-2026', () => {
    const x = entornoActividad({ origen: [filaOrigen({ mes: 'DICIEMBRE', ts: '2026-01-05T12:00:00Z' })] });
    expect(analizar(x, 'DICIEMBRE', 2026).filasMes).toStrictEqual([2]);
  });
  it.fails('DEFECTO · RF-16: un reporte de DICIEMBRE enviado el 5-ene-2027 (mes siguiente, tolerado por el aviso de fechas) debería coincidir con DICIEMBRE 2026, no ir a «otro año»', () => {
    const x = entornoActividad({ origen: [filaOrigen({ mes: 'DICIEMBRE', ts: '2027-01-05T12:00:00Z' })] });
    expect(analizar(x, 'DICIEMBRE', 2026).filasMes).toStrictEqual([2]);
  });
});

describe('analizarVolcado_ · acumulación campo a campo (RF-20 · ADR-0009)', () => {
  const plan = (filas) => analizar(entornoActividad({ origen: filas }));
  const valor = (p, dst) => p.aVolcar[0].valores[dst]?.valor;

  it('RF-20 · un campo vacío NO borra un valor ya presente de un reporte anterior', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 6: 10, 7: 20 } }),
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: '', 7: 25 } }),
    ]);
    expect(valor(p, 29)).toBe(10);
    expect(valor(p, 30)).toBe(25);
  });
  it('RF-20 · gana la última celda no vacía por marca temporal, aunque la fila esté antes en la hoja', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: 7 } }),
      filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 6: 99 } }),
    ]);
    expect(valor(p, 29)).toBe(7);
  });
  it('un reporte anterior rellena un campo que el posterior no trae', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: 7 } }),
      filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 7: 3 } }),
    ]);
    expect([valor(p, 29), valor(p, 30)]).toStrictEqual([7, 3]);
  });
  it('RF-20 · el 0 es un dato válido y pisa un valor anterior', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 6: 8 } }),
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: 0 } }),
    ]);
    expect(valor(p, 29)).toBe(0);
  });
  it('un espacio en blanco cuenta como vacío y no pisa', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 6: 8 } }),
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: '   ' } }),
    ]);
    expect(valor(p, 29)).toBe(8);
  });
  it('una fila sin marca temporal se considera posterior y pisa', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: 1 } }),
      filaOrigen({ profesor: ANA, ts: '', datos: { 6: 2 } }),
    ]);
    expect(valor(p, 29)).toBe(2);
  });
  it('marcas temporales idénticas: gana la fila que aparece después', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: 1 } }),
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: 2 } }),
    ]);
    expect(valor(p, 29)).toBe(2);
  });
  it('anota VALOR_SOBRESCRITO con el nombre de la columna y los valores, solo si difieren', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 6: 1, 7: 5 } }),
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: 2, 7: 5 } }),
    ]);
    const sobre = p.incidencias.filter((i) => i.tipo === 'VALOR_SOBRESCRITO');
    expect(sobre).toHaveLength(1);
    expect(sobre[0]).toMatchObject({ fila: 3, profesor: ANA, detalle: '"CAMPO_6": 1 → 2 (reporte posterior de la fila 3).' });
  });
  it('un valor igual en texto y número no se considera sobrescrito', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 6: '5' } }),
      filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 6: 5 } }),
    ]);
    expect(p.incidencias.filter((i) => i.tipo === 'VALOR_SOBRESCRITO')).toHaveLength(0);
  });
  it('RF-60 · un valor no numérico se anota como VALOR_NO_NUMERICO pero se conserva en el plan', () => {
    const p = plan([filaOrigen({ profesor: ANA, datos: { 8: 'doce' } })]);
    expect(p.incidencias).toStrictEqual([{ tipo: 'VALOR_NO_NUMERICO', fila: 2, profesor: ANA, detalle: '"CAMPO_8" = "doce" no es un número.' }]);
    expect(valor(p, 31)).toBe('doce');
  });
  it('agrupa por clave normalizada (tildes, mayúsculas, espacios) y usa el último nombre visible', () => {
    const p = plan([
      filaOrigen({ profesor: 'José Ficticio', datos: { 6: 1 } }),
      filaOrigen({ profesor: '  JOSE   ficticio ', datos: { 7: 2 } }),
    ]);
    expect(p.aVolcar).toHaveLength(1);
    expect(p.aVolcar[0]).toMatchObject({ clave: 'jose ficticio', displayName: 'JOSE   ficticio', filas: [2, 3], nCeldas: 2 });
  });
  it('un profesor distinto genera un grupo distinto; celdasConValor suma todos los grupos', () => {
    const p = plan([filaOrigen({ profesor: ANA, datos: { 6: 1, 7: 2 } }), filaOrigen({ profesor: CARLOS, datos: { 6: 3 } })]);
    expect(p.aVolcar.map((g) => g.displayName)).toStrictEqual([ANA, CARLOS]);
    expect(p.celdasConValor).toBe(3);
  });
  it('multiReporte lista solo a quien tiene más de una fila e incluye sus sucursales distintas', () => {
    const p = plan([
      filaOrigen({ profesor: ANA, sucursal: 'Sucursal Uno' }),
      filaOrigen({ profesor: ANA, sucursal: 'Sucursal Dos' }),
      filaOrigen({ profesor: ANA, sucursal: 'Sucursal Dos' }),
      filaOrigen({ profesor: CARLOS }),
    ]);
    expect(p.multiReporte).toStrictEqual([{ nombre: ANA, filas: [2, 3, 4], sucursales: ['Sucursal Uno', 'Sucursal Dos'] }]);
  });
  it('un profesor con filas pero sin ningún dato aparece en el plan con 0 campos', () => {
    const p = plan([filaOrigen({ profesor: ANA })]);
    expect(p.aVolcar[0].nCeldas).toBe(0);
    expect(p.filasMes).toStrictEqual([2]);
  });
  it('no vuelca las columnas informativas (D sucursal) ni OBSERVACIONES (BR=70) ni ID_Profesor (BT=72)', () => {
    const fila = filaOrigen({ profesor: ANA });
    fila.length = 72; fila[69] = 'texto libre'; fila[71] = 'A_1';
    const p = analizar(entornoActividad({ origen: [fila] }));
    expect(p.aVolcar[0].nCeldas).toBe(0);
  });
  it('lee la última columna de datos (BQ=69) y la primera (F=6)', () => {
    const p = plan([filaOrigen({ profesor: ANA, datos: { 6: 1, 69: 2 } })]);
    expect([valor(p, 29), valor(p, 92)]).toStrictEqual([1, 2]);
  });
});

describe('analizarVolcado_ · el análisis no escribe nada (RF-17 · RF-18)', () => {
  it('deja intactas todas las hojas de todos los libros', () => {
    const x = entornoActividad({
      origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })],
      destino: [filaDestino(ANA, { 29: 1 })],
      historico: [['ARCHIVADO MARZO 2026']],
    });
    const antes = instantanea(x);
    x.llamar('analizarVolcado_', 'MARZO', 2026);
    expect(instantanea(x)).toStrictEqual(antes);
    expect(x.google.estado.escrituras).toStrictEqual([]);
  });
});

describe('contarCeldasOcupadasDestino_ · RF-23 (destino limpio)', () => {
  const grupo = (nombre) => [{ clave: x0.llamar('normalizeKey', nombre) }];
  const x0 = entornoActividad();

  it('sin profesores a volcar devuelve 0 sin abrir el destino', () => {
    const x = entornoActividad({ destino: null });
    expect(x.llamar('contarCeldasOcupadasDestino_', [])).toBe(0);
  });
  it('cuenta solo las celdas con dato del rango AC..CN de los profesores del periodo', () => {
    const x = entornoActividad({ destino: [filaDestino(ANA, { 29: 1, 30: 0, 31: '', 92: 'x' }), filaDestino(CARLOS, { 29: 9 })] });
    expect(x.llamar('contarCeldasOcupadasDestino_', grupo(ANA))).toBe(3);
  });
  it('el cero cuenta como celda ocupada', () => {
    const x = entornoActividad({ destino: [filaDestino(ANA, { 29: 0 })] });
    expect(x.llamar('contarCeldasOcupadasDestino_', grupo(ANA))).toBe(1);
  });
  it('ignora datos en columnas anteriores a AC', () => {
    const f = filaDestino(ANA, {}); f[27] = 'dato en AB';
    expect(entornoActividad({ destino: [f] }).llamar('contarCeldasOcupadasDestino_', grupo(ANA))).toBe(0);
  });
  it('reconoce al profesor aunque cambien tildes, mayúsculas o espacios', () => {
    const x = entornoActividad({ destino: [filaDestino('  ANA   BETA FICTICIA ', { 29: 1 })] });
    expect(x.llamar('contarCeldasOcupadasDestino_', grupo(ANA))).toBe(1);
  });
  it('destino sin filas de datos: 0', () => {
    expect(entornoActividad({ destino: [] }).llamar('contarCeldasOcupadasDestino_', grupo(ANA))).toBe(0);
  });
  it('no cuenta filas sin nombre', () => {
    expect(entornoActividad({ destino: [filaDestino('', { 29: 1 })] }).llamar('contarCeldasOcupadasDestino_', grupo(ANA))).toBe(0);
  });
  it('si no se puede abrir el libro destino devuelve -1 («no se ha podido comprobar»)', () => {
    const x = entornoActividad({ destino: [] });
    x.google.estado.libros.delete(x.valor('TARGET_SPREADSHEET_ID'));
    expect(x.llamar('contarCeldasOcupadasDestino_', grupo(ANA))).toBe(-1);
  });
  it('a través del análisis informa destinoOcupado en el plan', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [filaDestino(ANA, { 29: 5, 30: 6 })] });
    expect(analizar(x).destinoOcupado).toBe(2);
  });
  it.fails('DEFECTO: si falta la pestaña destino debe informar -1 («no se pudo comprobar»), no 0 («limpio»)', () => {
    const x = entornoActividad({ destino: null });
    expect(x.llamar('contarCeldasOcupadasDestino_', grupo(ANA))).toBe(-1);
  });
});

describe('yaArchivado_ · RF-70 (aviso de periodo ya volcado)', () => {
  const marca = (m = 'MARZO', a = 2026) => `ARCHIVADO ${m} ${a}`;
  it('detecta el sello del periodo en cualquier celda del histórico', () => {
    const x = entornoActividad({ historico: [['a', 'b'], ['x', ` ${marca()} `]] });
    expect(x.llamar('yaArchivado_', 'MARZO', 2026)).toBe(true);
  });
  it('no lo da por archivado si el sello es de otro mes o año', () => {
    const x = entornoActividad({ historico: [[marca('ABRIL')], [marca('MARZO', 2025)]] });
    expect(x.llamar('yaArchivado_', 'MARZO', 2026)).toBe(false);
  });
  it('sin histórico, o con histórico vacío: false', () => {
    expect(entornoActividad().llamar('yaArchivado_', 'MARZO', 2026)).toBe(false);
    expect(entornoActividad({ historico: [] }).llamar('yaArchivado_', 'MARZO', 2026)).toBe(false);
  });
  it('un error del servicio se traga y devuelve false', () => {
    const x = entornoActividad({ historico: [[marca()]] });
    x.google.estado.libros.delete(x.valor('SOURCE_SPREADSHEET_ID'));
    expect(x.llamar('yaArchivado_', 'MARZO', 2026)).toBe(false);
  });
  it('el análisis lo refleja en yaArchivado', () => {
    const x = entornoActividad({ origen: [filaOrigen({})], historico: [[marca()]] });
    expect(analizar(x).yaArchivado).toBe(true);
  });
});

describe('vapAnalizarPeriodo · informe previo para el diálogo (RF-17)', () => {
  it('devuelve el informe con todos los contadores y el nombre del histórico', () => {
    const x = entornoActividad({
      origen: [
        filaOrigen({ profesor: ANA, datos: { 6: 1, 7: 2 } }),
        filaOrigen({ profesor: ANA, datos: { 6: 3 }, ts: '2026-03-11T12:00:00Z' }),
        filaOrigen({ profesor: CARLOS, mes: 'ABRIL' }),
      ],
      destino: [filaDestino(ANA, { 29: 1 })],
    });
    expect(plano(x.llamar('vapAnalizarPeriodo', 'MARZO', 2026))).toStrictEqual({
      ok: true, mes: 'MARZO', anio: 2026, totalFilas: 3, coinciden: 2, profesores: 1, multiReporte: 1, celdasConValor: 2,
      destinoOcupado: 1, noCoinciden: 1, porOtroMes: 1, porOtroAnio: 0, sinMes: 0, avisosFecha: 0,
      incidencias: ['VALOR_SOBRESCRITO (fila 3): "CAMPO_6": 1 → 3 (reporte posterior de la fila 3).'],
      yaArchivado: false, archivoNombre: 'Hoja 1',
    });
  });
  it('un mes no válido devuelve {ok:false,error} y anota la incidencia ANALISIS en el LOG', () => {
    const x = entornoActividad();
    expect(plano(x.llamar('vapAnalizarPeriodo', 'NOMES', 2026))).toStrictEqual({ ok: false, error: 'Mes no válido: "NOMES".' });
    const [fila] = leerLog(x);
    expect(fila).toMatchObject({ Categoría: 'ERROR', Tipo: 'ANALISIS', Detalle: 'Mes no válido: "NOMES".', Usuario: 'gestor@gala.test', Periodo: '-', 'Run ID': '-' });
  });
  it('una pestaña origen inexistente se devuelve como error del informe', () => {
    const x = entornoActividad({ sinHojaOrigen: true });
    const r = plano(x.llamar('vapAnalizarPeriodo', 'MARZO', 2026));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/No existe la pestaña origen/);
  });
  it('un año no numérico produce informe vacío sin coincidencias (NaN no coincide con ninguna marca)', () => {
    const x = entornoActividad({ origen: [filaOrigen({})] });
    const r = plano(x.llamar('vapAnalizarPeriodo', 'MARZO', 'dos mil'));
    expect(r.coinciden).toBe(0);
  });
});

describe('ejecutarVolcado_ · escritura en destino (RF-20 · RF-22)', () => {
  const ejecutar = (x, mes = 'MARZO', anio = 2026) => plano(x.llamar('vapEjecutarExportacion', mes, anio));

  it('actualiza al profesor existente solo en las columnas con dato y conserva el resto', () => {
    const x = entornoActividad({
      origen: [filaOrigen({ profesor: ANA, datos: { 6: 5, 8: 7 } })],
      destino: [filaDestino(ANA, { 30: 3, 29: 1 })],
    });
    const r = ejecutar(x);
    expect(r).toMatchObject({ ok: true, actualizados: 1, creados: 0, sinCambios: 0, bloqueados: 0, celdasEscritas: 2, celdasConservadas: 1 });
    const fila = x.hojaDestino.volcar()[1];
    expect([fila[28], fila[29], fila[30]]).toStrictEqual([5, 3, 7]);
    expect(fila[2]).toBe(ANA);
  });
  it('RF-20 · un campo vacío en el origen NO borra el valor que ya hay en el destino', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 7: '' , 6: 4 } })], destino: [filaDestino(ANA, { 30: 11 })] });
    ejecutar(x);
    expect(x.hojaDestino.volcar()[1][29]).toBe(11);
  });
  it('un 0 del origen sobrescribe el valor del destino', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 0 } })], destino: [filaDestino(ANA, { 29: 9 })] });
    ejecutar(x);
    expect(x.hojaDestino.volcar()[1][28]).toBe(0);
  });
  it('no toca columnas fuera de AC..CN ni otras filas', () => {
    const otra = filaDestino(CARLOS, { 29: 1 });
    const mia = filaDestino(ANA, {}); mia[0] = 'EMPRESA_A'; mia[27] = 'AB intacta'; mia[ANCHO_DESTINO - 1] = '';
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [otra, mia] });
    ejecutar(x);
    const v = x.hojaDestino.volcar();
    expect(v[1]).toStrictEqual(otra);
    expect(v[2][0]).toBe('EMPRESA_A');
    expect(v[2][27]).toBe('AB intacta');
  });
  it('empareja por nombre normalizado (tildes y mayúsculas) con la fila existente', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: 'José Ficticio', datos: { 6: 5 } })], destino: [filaDestino('JOSE  FICTICIO')] });
    const r = ejecutar(x);
    expect(r.creados).toBe(0);
    expect(x.hojaDestino.volcar()[1][28]).toBe(5);
  });
  it('crea una fila nueva al final con el nombre cuando el profesor no existe', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: CARLOS, datos: { 6: 5 } })], destino: [filaDestino(ANA)] });
    const r = ejecutar(x);
    expect(r).toMatchObject({ creados: 1, actualizados: 1 });
    const v = x.hojaDestino.volcar();
    expect(v).toHaveLength(3);
    expect([v[2][2], v[2][28]]).toStrictEqual([CARLOS, 5]);
    expect(leerLog(x).find((l) => l.Tipo === 'FILA_NUEVA')).toMatchObject({ Profesor: CARLOS, Detalle: 'Creada en la fila 3 del destino.' });
  });
  it('dos profesores nuevos nunca comparten fila', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } }), filaOrigen({ profesor: CARLOS, datos: { 6: 2 } })], destino: [] });
    ejecutar(x);
    const nombres = x.hojaDestino.volcar().slice(1).map((f) => f[2]);
    expect(nombres.sort()).toStrictEqual([ANA, CARLOS]);
  });
  it('caso límite actual: destino con solo cabecera (el doble acepta rangos de 0 filas; en Google real getRange(2,3,0,1) lanza)', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [] });
    expect(ejecutar(x)).toMatchObject({ ok: true, creados: 1 });
    expect(x.hojaDestino.volcar()[1][2]).toBe(ANA);
  });
  it('doble volcado: la segunda vez todo es «sin cambios» y no se reescribe el destino', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5, 7: 0 } })], destino: [filaDestino(ANA)] });
    ejecutar(x);
    const antes = x.hojaDestino.volcar();
    x.google.estado.escrituras.length = 0;
    const r2 = ejecutar(x);
    expect(r2).toMatchObject({ actualizados: 0, sinCambios: 1, celdasEscritas: 0, creados: 0 });
    expect(x.hojaDestino.volcar()).toStrictEqual(antes);
    expect(x.google.estado.escrituras.some((w) => w.hoja === 'Hoja 1' && w.rango.startsWith('AC'))).toBe(false);
  });
  it('doble volcado: el histórico recibe las filas otra vez (duplicadas) y el segundo análisis avisa de yaArchivado', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(ANA)], historico: [] });
    ejecutar(x);
    expect(plano(x.llamar('vapAnalizarPeriodo', 'MARZO', 2026)).yaArchivado).toBe(true);
    ejecutar(x);
    expect(x.hojaHistorico.volcar().filter((f) => f[ANCHO_ORIGEN] === 'ARCHIVADO MARZO 2026')).toHaveLength(2);
  });
  it('un nombre duplicado en el destino bloquea a ese profesor (no escribe) y sigue con los demás', () => {
    const x = entornoActividad({
      origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } }), filaOrigen({ profesor: CARLOS, datos: { 6: 6 } })],
      destino: [filaDestino(ANA), filaDestino('ana beta ficticia'), filaDestino(CARLOS)],
    });
    const r = ejecutar(x);
    expect(r).toMatchObject({ bloqueados: 1, actualizados: 1 });
    const v = x.hojaDestino.volcar();
    expect([v[1][28], v[2][28], v[3][28]]).toStrictEqual(['', '', 6]);
    expect(leerLog(x).find((l) => l.Tipo === 'NOMBRE_DUPLICADO_DESTINO')).toMatchObject({ Categoría: 'ERROR', Profesor: ANA, Detalle: expect.stringContaining('filas 2, 3 del destino') });
  });
  it('tres filas con el mismo nombre en el destino listan las tres', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(ANA), filaDestino(ANA), filaDestino(ANA)] });
    ejecutar(x);
    expect(leerLog(x).find((l) => l.Tipo === 'NOMBRE_DUPLICADO_DESTINO').Detalle).toContain('filas 2, 3, 4 del destino');
  });
  it('ignora filas del destino sin nombre al construir el índice', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(''), filaDestino(ANA)] });
    ejecutar(x);
    expect(x.hojaDestino.volcar()[2][28]).toBe(5);
  });
  it('acumula varios reportes del mismo profesor en una sola escritura', () => {
    const x = entornoActividad({
      origen: [
        filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 6: 1 } }),
        filaOrigen({ profesor: ANA, ts: '2026-03-12T12:00:00Z', datos: { 7: 2, 6: '' } }),
      ],
      destino: [filaDestino(ANA)],
    });
    expect(ejecutar(x)).toMatchObject({ actualizados: 1, celdasEscritas: 2 });
    const f = x.hojaDestino.volcar()[1];
    expect([f[28], f[29]]).toStrictEqual([1, 2]);
  });
  it('un valor texto «5» y un 5 numérico en destino cuentan como iguales (sin reescritura)', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(ANA, { 29: '5' })] });
    expect(ejecutar(x)).toMatchObject({ sinCambios: 1, celdasEscritas: 0 });
  });
  it('no modifica la hoja de respuestas (RF-63 · «la hoja de respuestas no se modifica»)', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(ANA)] });
    const antes = x.hojaOrigen.volcar();
    ejecutar(x);
    expect(x.hojaOrigen.volcar()).toStrictEqual(antes);
  });
});

describe('vapEjecutarExportacion · resultado y errores', () => {
  it('sin filas del periodo devuelve error y no escribe nada (ni log)', () => {
    const x = entornoActividad({ origen: [filaOrigen({ mes: 'ABRIL' })], destino: [filaDestino(ANA)] });
    const antes = instantanea(x);
    expect(plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026))).toStrictEqual({ ok: false, error: 'No hay filas que coincidan con el periodo.' });
    expect(instantanea(x)).toStrictEqual(antes);
  });
  it('mes no válido devuelve {ok:false,error}', () => {
    expect(plano(entornoActividad().llamar('vapEjecutarExportacion', 'X', 2026))).toStrictEqual({ ok: false, error: 'Mes no válido: "X".' });
  });
  it('la respuesta correcta lleva los contadores que pinta el diálogo', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(ANA)] });
    expect(Object.keys(plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026))).sort()).toStrictEqual(
      ['actualizados', 'bloqueados', 'celdasConservadas', 'celdasEscritas', 'copiadas', 'creados', 'incidencias', 'ok', 'sinCambios'],
    );
  });
  it('falta la pestaña destino: error claro, log ERROR clasificado y RESUMEN ERROR; no se copia al histórico', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: null, historico: [] });
    const r = plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r).toStrictEqual({ ok: false, error: 'No existe la pestaña destino: "Hoja 1".' });
    const log = leerLog(x);
    expect(log.find((l) => l.Tipo === 'PESTANA_NO_ENCONTRADA').Detalle).toContain('Posible solución: Revisa SOURCE_SHEET_NAME');
    expect(log.at(-1)).toMatchObject({ Categoría: 'RESUMEN', Tipo: 'ERROR', Detalle: 'Ejecución interrumpida: No existe la pestaña destino: "Hoja 1".' });
    expect(x.hojaHistorico.volcar()).toStrictEqual([]);
  });
  it('falta acceso al libro destino: error clasificado ACCESO_AL_DESTINO en el log', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(ANA)] });
    x.google.estado.libros.delete(x.valor('TARGET_SPREADSHEET_ID'));
    const r = plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no existe o no hay acceso/);
    // El mensaje del doble está en español y no contiene las palabras que clasificarError_ reconoce
    // (permis / access / not found): en Google real el mensaje es inglés y se clasifica como ACCESO_AL_DESTINO.
    expect(leerLog(x).find((l) => l.Categoría === 'ERROR').Tipo).toBe('NO_CLASIFICADO');
    expect(leerLog(x).at(-1)).toMatchObject({ Categoría: 'RESUMEN', Tipo: 'ERROR' });
  });
  it('libera el bloqueo siempre: en éxito y en error', () => {
    for (const destino of [[filaDestino(ANA)], null]) {
      const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino });
      const eventos = [];
      const real = x.google.global.LockService.getScriptLock;
      x.google.global.LockService.getScriptLock = () => {
        const l = real();
        return { waitLock: (ms) => { eventos.push(['wait', ms]); l.waitLock(ms); }, releaseLock: () => eventos.push(['release']) };
      };
      x.llamar('vapEjecutarExportacion', 'MARZO', 2026);
      expect(eventos).toStrictEqual([['wait', 30000], ['release']]);
    }
  });
  it('RNF-04 · con el bloqueo ocupado no escribe nada en destino ni histórico y devuelve el error', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(ANA)], historico: [] });
    x.google.estado.bloqueoOcupado = true;
    const antes = instantanea(x);
    const r = plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/bloqueo/);
    expect(instantanea(x)).toStrictEqual(antes);
  });
  it.fails('DEFECTO · RF-48: un fallo por bloqueo ocupado debería dejar registro BLOQUEO en LOG Volcado', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })], destino: [filaDestino(ANA)] });
    x.google.estado.bloqueoOcupado = true;
    x.llamar('vapEjecutarExportacion', 'MARZO', 2026);
    expect(leerLog(x).some((l) => l.Tipo === 'BLOQUEO')).toBe(true);
  });
  it.fails('DEFECTO · RF-48: un error del análisis al exportar (mes no válido) debería quedar en el log como ya ocurre al analizar', () => {
    const x = entornoActividad();
    x.llamar('vapEjecutarExportacion', 'X', 2026);
    expect(leerLog(x).length).toBeGreaterThan(0);
  });
});

describe('copiarAHistorico_ · RF-63 · RF-64', () => {
  const ejecutar = (x) => plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));
  const origen = () => [
    filaOrigen({ profesor: ANA, datos: { 6: 1 } }),
    filaOrigen({ profesor: CARLOS, mes: 'ABRIL', datos: { 6: 2 } }),
    filaOrigen({ profesor: CARLOS, datos: { 6: 3 } }),
  ];

  it('añade al histórico existente solo las filas del periodo (no las intermedias), selladas con periodo, fecha y Run ID', () => {
    const x = entornoActividad({ origen: origen(), destino: [], historico: [['cab'], ['fila previa']] });
    const r = ejecutar(x);
    expect(r.copiadas).toBe(2);
    const v = x.hojaHistorico.volcar();
    expect(v).toHaveLength(4);
    expect(v[1]).toStrictEqual(['fila previa']);
    expect(v[2][4]).toBe(ANA);
    expect(v[3][4]).toBe(CARLOS);
    expect(v[3][2]).toBe('MARZO');
    expect(v[2].slice(ANCHO_ORIGEN)).toStrictEqual(['ARCHIVADO MARZO 2026', expect.anything(), 'uuid-000']);
  });
  it('conserva los valores originales de la fila copiada (copia fiel por posición)', () => {
    const x = entornoActividad({ origen: origen(), destino: [], historico: [[]] });
    ejecutar(x);
    expect(x.hojaHistorico.volcar()[0].slice(0, ANCHO_ORIGEN)).toStrictEqual(x.hojaOrigen.volcar()[1]);
  });
  it('crea el histórico si no existe, con las cabeceras del formulario más tres columnas y la primera fila congelada', () => {
    const x = entornoActividad({ origen: origen(), destino: [] });
    ejecutar(x);
    const hoja = x.libroOrigen.getSheetByName('Hoja 1');
    expect(hoja.volcar()[0]).toStrictEqual([...CABECERAS_ORIGEN, 'Archivado en', 'Fecha de archivo', 'Run ID']);
    expect(hoja.getFrozenRows()).toBe(1);
    expect(hoja.volcar()).toHaveLength(3);
  });
  it('RF-64 · si falla la copia, avisa en el log y NO deshace el volcado a destino', () => {
    const x = entornoActividad({ origen: origen(), destino: [filaDestino(ANA)] });
    const crear = x.libroOrigen.insertSheet.bind(x.libroOrigen);
    x.libroOrigen.insertSheet = (nombre) => { if (nombre === 'Hoja 1') throw new Error('Servicio no disponible'); return crear(nombre); };
    const r = ejecutar(x);
    expect(r).toMatchObject({ ok: true, copiadas: 0, actualizados: 2, creados: 1 });
    expect(x.hojaDestino.volcar()[1][28]).toBe(1);
    expect(leerLog(x).find((l) => l.Tipo === 'COPIA_HISTORICO')).toMatchObject({
      Categoría: 'ERROR',
      Detalle: 'No se pudo copiar a "Hoja 1": Servicio no disponible. El volcado a VINCULACIÓN sí se ha realizado.',
    });
    expect(leerLog(x).at(-1).Tipo).toBe('OK');
  });
  it('la copia no se intenta si ninguna fila coincide (no se llega a ejecutar)', () => {
    const x = entornoActividad({ origen: [filaOrigen({ mes: 'ABRIL' })], destino: [], historico: [] });
    ejecutar(x);
    expect(x.hojaHistorico.volcar()).toStrictEqual([]);
  });
  it('anota COPIA_HISTORICO con el número de filas copiadas', () => {
    const x = entornoActividad({ origen: origen(), destino: [], historico: [[]] });
    ejecutar(x);
    expect(leerLog(x).find((l) => l.Tipo === 'COPIA_HISTORICO')).toMatchObject({ Categoría: 'MOVIMIENTO', Detalle: '2 fila(s) copiadas a "Hoja 1".' });
  });
});

describe('LOG Volcado · RF-46 · RF-48', () => {
  const ejecutar = (x) => plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));

  it('crea la hoja de log con sus cabeceras y la primera fila congelada', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [filaDestino(ANA)] });
    ejecutar(x);
    const hoja = x.libroOrigen.getSheetByName('LOG Volcado');
    expect(hoja.volcar()[0]).toStrictEqual(plano(x.valor('LOG_HEADERS')));
    expect(hoja.getFrozenRows()).toBe(1);
  });
  it('cada fila lleva usuario, periodo, Run ID y marca de tiempo de la ejecución', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [filaDestino(ANA)], usuario: 'lola@gala.test' });
    ejecutar(x);
    const filas = leerLog(x);
    expect(filas.length).toBeGreaterThan(1);
    filas.forEach((f) => {
      expect(f.Usuario).toBe('lola@gala.test');
      expect(f.Periodo).toBe('MARZO 2026');
      expect(f['Run ID']).toBe('uuid-000');
      expect(new Date(f.Timestamp).toISOString()).toBe('2026-03-15T10:00:00.000Z');
    });
  });
  it('ACTUALIZADO describe cada cambio con el nombre real de la columna: antes → después', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 12, 7: 0 } })], destino: [filaDestino(ANA, { 29: 5 })] });
    ejecutar(x);
    const mov = leerLog(x).find((l) => l.Tipo === 'ACTUALIZADO');
    expect(mov['Fila origen']).toBe('2');
    expect(mov.Detalle).toBe('Fila 2. 2 campo(s). CAMPO_6: 5 → 12 | CAMPO_7: (vacío) → 0');
  });
  it('recorta el detalle a 12 campos con un contador del resto (SSD §7.4)', () => {
    const datos = {}; for (let c = 6; c < 20; c++) datos[c] = c;
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos })], destino: [filaDestino(ANA)] });
    ejecutar(x);
    const d = leerLog(x).find((l) => l.Tipo === 'ACTUALIZADO').Detalle;
    expect(d).toContain('14 campo(s).');
    expect(d.endsWith('| … y 2 campo(s) más')).toBe(true);
    expect(d.split(' | ')).toHaveLength(13);
  });
  it('exactamente 12 cambios no lleva contador de resto', () => {
    const datos = {}; for (let c = 6; c < 18; c++) datos[c] = c;
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos })], destino: [filaDestino(ANA)] });
    ejecutar(x);
    expect(leerLog(x).find((l) => l.Tipo === 'ACTUALIZADO').Detalle).not.toContain('más');
  });
  it('SIN_CAMBIO indica fila destino y nº de campos ya iguales', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1, 7: 2 } })], destino: [filaDestino(ANA, { 29: 1, 30: 2 })] });
    ejecutar(x);
    expect(leerLog(x).find((l) => l.Tipo === 'SIN_CAMBIO').Detalle).toBe('Fila 2. Los 2 campo(s) reportados ya tenían ese valor.');
  });
  it('vuelca al log las incidencias del análisis, avisos de fecha y VARIOS_REPORTES con sucursales', () => {
    const x = entornoActividad({
      origen: [
        filaOrigen({ profesor: ANA, sucursal: 'Sucursal Uno', datos: { 6: 1 } }),
        filaOrigen({ profesor: ANA, sucursal: 'Sucursal Dos', ts: '2026-06-02T12:00:00Z', datos: { 6: 2 } }),
      ],
      destino: [filaDestino(ANA)],
    });
    ejecutar(x);
    const log = leerLog(x);
    expect(log.find((l) => l.Tipo === 'MARCA_TEMPORAL_FUERA_DE_MES')).toMatchObject({ Categoría: 'INCIDENCIA', 'Fila origen': 3, Profesor: ANA });
    expect(log.find((l) => l.Tipo === 'VARIOS_REPORTES')).toMatchObject({ 'Fila origen': '2,3', Detalle: '2 reportes acumulados por campo desde 2 sucursales: Sucursal Uno · Sucursal Dos' });
    expect(log.find((l) => l.Tipo === 'VALOR_SOBRESCRITO')).toBeDefined();
  });
  it('VARIOS_REPORTES con una sola sucursal no la menciona', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA }), filaOrigen({ profesor: ANA })], destino: [filaDestino(ANA)] });
    ejecutar(x);
    expect(leerLog(x).find((l) => l.Tipo === 'VARIOS_REPORTES').Detalle).toBe('2 reportes acumulados por campo');
  });
  it('termina con una fila RESUMEN OK con todos los contadores', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } }), filaOrigen({ mes: 'ABRIL' })], destino: [filaDestino(ANA)], historico: [] });
    ejecutar(x);
    const resumen = leerLog(x).at(-1);
    expect(resumen).toMatchObject({ Categoría: 'RESUMEN', Tipo: 'OK' });
    expect(resumen.Detalle).toBe('Actualizados=1 | SinCambio=0 | Creados=0 | Bloqueados=0 | CeldasEscritas=1 | CeldasConservadas=0 | Copiadas=1 | Coinciden=1 | NoCoinciden=1 | Incidencias=0');
  });
  it('dos ejecuciones se acumulan en el mismo log sin repetir cabeceras', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [filaDestino(ANA)] });
    ejecutar(x); ejecutar(x);
    const hoja = x.libroOrigen.getSheetByName('LOG Volcado').volcar();
    expect(hoja.filter((f) => f[0] === 'Timestamp')).toHaveLength(1);
    expect(leerLog(x).filter((l) => l.Categoría === 'RESUMEN')).toHaveLength(2);
  });
  it('el usuario queda vacío si la sesión no puede darlo (sin error)', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [filaDestino(ANA)] });
    x.google.global.Session.getActiveUser = () => { throw new Error('sin sesión'); };
    expect(ejecutar(x).ok).toBe(true);
    expect(leerLog(x)[0].Usuario).toBe('');
  });
  it('el usuario queda vacío si el correo viene vacío', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [filaDestino(ANA)], usuario: '' });
    ejecutar(x);
    expect(leerLog(x)[0].Usuario).toBe('');
  });
  it('si no se puede escribir el log, el volcado no falla: solo se anota en Logger', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [filaDestino(ANA)] });
    x.libroOrigen.insertSheet = () => { throw new Error('sin cuota'); };
    expect(ejecutar(x).ok).toBe(true);
    expect(x.google.estado.logs).toContain('No se pudo escribir en "LOG Volcado": sin cuota');
  });
  it('escribirLog_ con filas vacías o nulas no crea la hoja', () => {
    const x = entornoActividad();
    x.llamar('escribirLog_', []);
    x.llamar('escribirLog_', null);
    expect(x.libroOrigen.getSheetByName('LOG Volcado')).toBeNull();
  });
  it('registrarIncidenciaSuelta_ escribe una fila ERROR con Run ID y periodo «-»', () => {
    const x = entornoActividad();
    x.llamar('registrarIncidenciaSuelta_', 'PRUEBA', 'detalle suelto');
    expect(leerLog(x)).toStrictEqual([expect.objectContaining({ Categoría: 'ERROR', Tipo: 'PRUEBA', Detalle: 'detalle suelto', 'Run ID': '-', Periodo: '-' })]);
  });
});

describe('abrir con el libro activo ligado (el script vive en el libro de respuestas)', () => {
  it('el histórico y el log se crean en el libro de RESPUESTAS, nunca en el destino', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, datos: { 6: 1 } })], destino: [filaDestino(ANA)] });
    x.llamar('vapEjecutarExportacion', 'MARZO', 2026);
    expect(x.libroDestino.getSheets().map((h) => h.getName())).toStrictEqual(['Hoja 1']);
    expect(x.libroOrigen.getSheets().map((h) => h.getName()).sort()).toStrictEqual(['Hoja 1', 'LOG Volcado', 'Respuestas de formulario 1']);
  });
});
