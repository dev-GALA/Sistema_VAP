// Integración del volcado de horas extras: las funciones públicas que llama el diálogo
// (vapPeriodoPropuesto, vapAnalizarPeriodo, vapEjecutarExportacion) con origen, destino, Anteriores y LOG.
// Datos 100 % ficticios. ADR-0013 · ADR-0016 · RF-16..RF-19 · RNF-04/05/06.
import { describe, expect, it } from 'vitest';
import { entornoVolcado, fecha, filaOrigen, filaDestino, filtrarLog, sinHora } from './ayudas.js';
import { plano } from '../soporte/cargar-gs.js';

const marzo = (dia, extra = {}) => filaOrigen({ ts: fecha(2026, 3, dia), mes: 'MARZO', ...extra });
const analizar = (e, mes = 'MARZO', anio = 2026) => plano(e.llamar('vapAnalizarPeriodo', mes, anio));
const exportar = (e, mes = 'MARZO', anio = 2026) => plano(e.llamar('vapEjecutarExportacion', mes, anio));
const filasLog = (e) => (e.verLog() || []).slice(1).map(sinHora);

describe('menú y diálogo · ADR-0013 §2', () => {
  it('onOpen añade el menú VAP_Acciones con «Volcar Horas Extras del mes...»', () => {
    const e = entornoVolcado();
    e.llamar('onOpen');
    expect(plano(e.estado.menus)).toEqual([{ nombre: 'VAP_Acciones', items: [{ texto: 'Volcar Horas Extras del mes...', funcion: 'abrirDialogoVolcado' }] }]);
  });
  it('la función del menú existe en el script', () => {
    const e = entornoVolcado();
    e.llamar('onOpen');
    expect(e.ejecutar(`typeof ${e.estado.menus[0].items[0].funcion}`)).toBe('function');
  });
  it('abrirDialogoVolcado muestra la plantilla DialogoVolcado como modal de 520×560 titulado «Volcar Horas Extras»', () => {
    const e = entornoVolcado();
    e.llamar('abrirDialogoVolcado');
    expect(e.estado.dialogos).toHaveLength(1);
    const { salida, titulo } = e.estado.dialogos[0];
    expect(titulo).toBe('Volcar Horas Extras');
    expect([salida._ancho, salida._alto]).toEqual([520, 560]);
    expect(salida.getContent()).toContain('diálogo de prueba');
  });
  it('abrir el diálogo no escribe nada ni abre libros (RF-17)', () => {
    const e = entornoVolcado();
    e.llamar('abrirDialogoVolcado');
    expect(e.estado.escrituras).toEqual([]);
  });
  it('si falta la plantilla, el error es claro', () => {
    const e = entornoVolcado({ plantillasHtml: {} });
    expect(() => e.llamar('abrirDialogoVolcado')).toThrow(/DialogoVolcado/);
  });
});

describe('vapPeriodoPropuesto · mes en curso preseleccionado (ADR-0013 §2)', () => {
  it.each([
    ['2026-03-15T10:00:00Z', 'MARZO', 2026, '15/03/2026'],
    ['2026-01-01T12:00:00Z', 'ENERO', 2026, '01/01/2026'],
    ['2026-12-31T12:00:00Z', 'DICIEMBRE', 2026, '31/12/2026'],
    ['2026-12-31T23:30:00Z', 'ENERO', 2027, '01/01/2027'], // medianoche local: ya es 2027 en Madrid
    ['2026-03-31T21:59:00Z', 'MARZO', 2026, '31/03/2026'],
    ['2026-03-31T22:00:00Z', 'ABRIL', 2026, '01/04/2026'], // cambio de horario: 00:00 CEST
  ])('hoy=%s → %s %i (%s)', (ahora, mes, anio, hoy) => {
    const r = plano(entornoVolcado({ ahora }).llamar('vapPeriodoPropuesto'));
    expect(r).toMatchObject({ mes, anio, hoy });
    expect(r.meses).toHaveLength(12);
    expect(r.meses[0]).toBe('ENERO');
  });
  it('no abre ningún libro (funciona aunque no existan origen ni destino)', () => {
    const e = entornoVolcado({ libroOrigen: false, libroDestino: false });
    expect(plano(e.llamar('vapPeriodoPropuesto')).mes).toBe('MARZO');
  });
});

describe('vapAnalizarPeriodo · informe previo SIN escribir (RF-17 · RNF-05)', () => {
  it('devuelve el informe completo con el periodo', () => {
    const e = entornoVolcado({
      origen: [
        marzo(5, { nombre: 'Ana Prueba', horas: 3, otros: 20 }),
        marzo(6, { nombre: 'Bea Inventada', horas: 2 }),
        filaOrigen({ ts: fecha(2026, 4, 2), mes: 'ABRIL', nombre: 'Ana Prueba', horas: 9 }),
        filaOrigen({ ts: fecha(2025, 3, 2), mes: 'MARZO', nombre: 'Ana Prueba', horas: 9 }),
        filaOrigen({ ts: fecha(2026, 3, 2), mes: 'nunca', nombre: 'Ana Prueba', horas: 9 }),
      ],
      destino: [filaDestino({ nombre: 'Ana Prueba' })],
    });
    expect(analizar(e)).toEqual({
      ok: true, mes: 'MARZO', anio: 2026, totalFilas: 5, coinciden: 2, secretarias: 2, corregidas: 0,
      noCoinciden: 3, porOtroMes: 1, porOtroAnio: 1, sinMes: 1, avisosFecha: 0,
      incidencias: ['MES_NO_RECONOCIDO (fila 6): La columna C dice "nunca". No coincide con ningún mes.'],
      destinoOcupado: 0, yaArchivado: false,
    });
  });
  it('el año puede llegar como texto (lo envía el desplegable): se convierte a número', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba' })] });
    const r = plano(e.llamar('vapAnalizarPeriodo', 'MARZO', '2026'));
    expect(r).toMatchObject({ ok: true, anio: 2026, coinciden: 1 });
  });
  it('RF-19 · informa de las secretarias con varios envíos', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 1 }), marzo(9, { nombre: 'Ana Prueba', horas: 2 })] });
    expect(analizar(e)).toMatchObject({ coinciden: 2, secretarias: 1, corregidas: 1 });
  });
  it('las incidencias salen como «TIPO (fila N): detalle»', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 'x' }), filaOrigen({ mes: 'MARZO', nombre: 'Bea Inventada' })] });
    expect(analizar(e).incidencias).toEqual([
      'VALOR_NO_NUMERICO (fila 2): Nº HORAS EXTRA = "x" no es un número.',
      'SIN_MARCA_TEMPORAL (fila 3): Sin marca temporal: no se puede validar el año. Se exporta igualmente.',
    ]);
  });
  it('cuenta los avisos de fecha', () => {
    const e = entornoVolcado({ origen: [filaOrigen({ ts: fecha(2026, 6, 1), mes: 'MARZO', nombre: 'Ana Prueba' })] });
    expect(analizar(e).avisosFecha).toBe(1);
  });
  it('RF-17/RF-18 · no escribe nada: ni destino, ni Anteriores, ni LOG, ni respuestas', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
    const origen = e.hojaOrigen.volcar();
    const destino = e.hojaDestino.volcar();
    analizar(e);
    expect(e.estado.escrituras).toEqual([]);
    expect(e.hojaOrigen.volcar()).toEqual(origen);
    expect(e.hojaDestino.volcar()).toEqual(destino);
    expect(e.libroOrigen.getSheets().map((h) => h.getName())).toEqual(['Respuestas de formulario']);
  });
  it('periodo sin respuestas → informe con 0 coincidencias (no es error)', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba' })] });
    expect(analizar(e, 'JULIO')).toMatchObject({ ok: true, coinciden: 0, secretarias: 0, noCoinciden: 1, porOtroMes: 1 });
  });
  it('hoja de respuestas sin filas → 0 filas y destinoOcupado ausente', () => {
    const r = analizar(entornoVolcado({ origen: [] }));
    expect(r).toMatchObject({ ok: true, totalFilas: 0, coinciden: 0 });
    expect(r.destinoOcupado).toBeUndefined();
  });
  it('avisa si el destino ya tiene datos (premisa de hoja limpia, SSD §6.3)', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba', horas: 7, otros: 1 })] });
    expect(analizar(e).destinoOcupado).toBe(2);
  });
  it('destinoOcupado = -1 si no se puede abrir el destino', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba' })], libroDestino: false });
    expect(analizar(e)).toMatchObject({ ok: true, destinoOcupado: -1 });
  });
  it('yaArchivado = true si Anteriores ya trae el sello del periodo', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba' })], archivo: [['', '', 'ARCHIVADO MARZO 2026']] });
    expect(analizar(e).yaArchivado).toBe(true);
  });

  describe('errores → {ok:false} y se anotan en el LOG (ADR-0012)', () => {
    it('mes no válido', () => {
      const e = entornoVolcado({ origen: [] });
      expect(analizar(e, 'MARCIANO')).toEqual({ ok: false, error: 'Mes no válido: "MARCIANO".' });
    });
    it('el LOG se crea con cabecera y fila congelada y recoge ERROR/ANALISIS', () => {
      const e = entornoVolcado({ origen: [] });
      analizar(e, 'MARCIANO');
      const log = e.verLog();
      expect(log[0]).toEqual(plano(e.valor('LOG_HEADERS')));
      expect(e.libroOrigen.getSheetByName('LOG Volcado').getFrozenRows()).toBe(1);
      expect(plano(log[1].slice(1))).toEqual(['-', 'gestora@gala.test', '-', 'ERROR', 'ANALISIS', '', '', 'Mes no válido: "MARCIANO".']);
      expect(new Date(log[1][0]).toISOString()).toBe('2026-03-15T10:00:00.000Z');
    });
    it('sin pestaña de origen', () => {
      const e = entornoVolcado({ origen: false });
      expect(analizar(e)).toEqual({ ok: false, error: 'No existe la pestaña origen: "Respuestas de formulario".' });
      expect(filaLog(e, 0)[8]).toContain('No existe la pestaña origen');
    });
    it('sin libro de origen: devuelve el error y avisa por Logger (no se puede ni escribir el LOG)', () => {
      const e = entornoVolcado({ libroOrigen: false });
      const r = analizar(e);
      expect(r.ok).toBe(false);
      expect(e.estado.logs.some((l) => l.includes('No se pudo escribir en "LOG Volcado"'))).toBe(true);
    });
    it('un segundo error se añade al LOG existente sin repetir la cabecera', () => {
      const e = entornoVolcado({ origen: [] });
      analizar(e, 'X1');
      analizar(e, 'X2');
      const log = e.verLog();
      expect(log).toHaveLength(3);
      expect(log.filter((f) => f[1] === 'Run ID')).toHaveLength(1);
    });
    it('usuario sin correo accesible → columna Usuario vacía', () => {
      const e = entornoVolcado({ origen: [] });
      e.contexto.Session = { getActiveUser() { throw new Error('sin permiso'); }, getScriptTimeZone: () => 'Europe/Madrid' };
      analizar(e, 'X1');
      expect(e.verLog()[1][2]).toBe('');
    });
    it.fails('DEFECTO: un año no numérico debería rechazarse como el mes (hoy todo cae en «otro año»)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba' })] });
      expect(plano(e.llamar('vapAnalizarPeriodo', 'MARZO', 'abc')).ok).toBe(false);
    });
  });
});
function filaLog(e, i) { return e.verLog().slice(1)[i]; }

describe('vapEjecutarExportacion · confirmación y escritura (RF-16 · RF-17)', () => {
  it('sin filas del periodo no escribe nada ni toma el bloqueo', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba' })], destino: [filaDestino({ nombre: 'Ana Prueba' })], espiar: true });
    expect(exportar(e, 'JULIO')).toEqual({ ok: false, error: 'No hay filas que coincidan con el periodo.' });
    expect(e.estado.escrituras).toEqual([]);
    expect(e.bloqueo.esperas).toEqual([]);
    expect(e.verLog()).toBeNull();
  });
  it('un mes no válido devuelve ok:false sin escribir', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba' })] });
    expect(exportar(e, 'MARCIANO')).toEqual({ ok: false, error: 'Mes no válido: "MARCIANO".' });
    expect(e.estado.escrituras).toEqual([]);
  });
  it('año como texto se acepta', () => {
    const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
    expect(plano(e.llamar('vapEjecutarExportacion', 'MARZO', '2026')).ok).toBe(true);
  });

  describe('camino feliz', () => {
    const preparar = (extra = {}) => entornoVolcado({
      origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3, otros: 20 }), marzo(6, { nombre: 'Bea Inventada', horas: 2 })],
      destino: [filaDestino({ nombre: 'Ana Prueba' })],
      ...extra,
    });
    it('escribe horas en AE y otros en AH de la persona encontrada, y crea la fila de la que no existe', () => {
      const e = preparar();
      const r = exportar(e);
      expect(r).toEqual({ ok: true, actualizadas: 2, sinCambios: 0, creadas: 1, bloqueadas: 0, copiadas: 2, incidencias: 0 });
      expect([e.celdaDestino(2, 3), e.celdaDestino(2, 31), e.celdaDestino(2, 34)]).toEqual(['Ana Prueba', 3, 20]);
      expect([e.celdaDestino(3, 3), e.celdaDestino(3, 31), e.celdaDestino(3, 34)]).toEqual(['Bea Inventada', 2, '']);
    });
    it('toma el bloqueo 30 s y lo libera al terminar (RNF-04)', () => {
      const e = preparar({ espiar: true });
      exportar(e);
      expect(e.bloqueo).toEqual({ esperas: [30000], liberaciones: 1 });
    });
    it('el LOG recoge cada movimiento antes→después, la copia y el resumen, con el mismo Run ID', () => {
      const e = preparar();
      exportar(e);
      const log = filasLog(e);
      expect(log).toEqual([
        ['run00001', 'gestora@gala.test', 'MARZO 2026', 'MOVIMIENTO', 'ACTUALIZADO', '', 'Ana Prueba', 'Fila 2. Nº horas (AE): (vacío) → 3 | € otros (AH): (vacío) → 20'],
        ['run00001', 'gestora@gala.test', 'MARZO 2026', 'MOVIMIENTO', 'FILA_NUEVA', '', 'Bea Inventada', 'Creada en la fila 3 del destino.'],
        ['run00001', 'gestora@gala.test', 'MARZO 2026', 'MOVIMIENTO', 'ACTUALIZADO', '', 'Bea Inventada', 'Fila 3. Nº horas (AE): (vacío) → 2'],
        ['run00001', 'gestora@gala.test', 'MARZO 2026', 'MOVIMIENTO', 'COPIA_ARCHIVO', '', '', '2 fila(s) copiadas a "Anteriores".'],
        ['run00001', 'gestora@gala.test', 'MARZO 2026', 'RESUMEN', 'OK', '', '',
          'Actualizadas=2 | SinCambio=0 | Creadas=1 | Bloqueadas=0 | Copiadas=2 | Coinciden=2 | NoCoinciden=0 | Incidencias=0'],
      ].map((f) => f));
    });
    it('el LOG lleva la hora de ejecución en la primera columna', () => {
      const e = preparar();
      exportar(e);
      for (const f of e.verLog().slice(1)) expect(new Date(f[0]).toISOString()).toBe('2026-03-15T10:00:00.000Z');
    });
    it('el Run ID son 8 caracteres y cambia entre ejecuciones', () => {
      const e = preparar();
      exportar(e);
      exportar(e);
      const ids = [...new Set(e.verLog().slice(1).map((f) => f[1]))];
      expect(ids).toEqual(['run00001', 'run00002']);
    });
    it('RF-18/RNF-06 · la hoja de respuestas NO se modifica', () => {
      const e = preparar();
      const antes = e.hojaOrigen.volcar();
      exportar(e);
      expect(e.hojaOrigen.volcar()).toEqual(antes);
    });
    it('el periodo no coincidente no se toca en el destino', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 }), filaOrigen({ ts: fecha(2026, 4, 5), mes: 'ABRIL', nombre: 'Cleo Falsa', horas: 8 })],
        destino: [filaDestino({ nombre: 'Ana Prueba' }), filaDestino({ nombre: 'Cleo Falsa', horas: 1 })],
      });
      exportar(e);
      expect(e.celdaDestino(3, 31)).toBe(1);
    });
    it('conserva el resto de columnas del destino', () => {
      const fila = filaDestino({ nombre: 'Ana Prueba' });
      fila[5] = 'dato ajeno'; fila[32] = 'otro dato';
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [fila] });
      exportar(e);
      expect([e.celdaDestino(2, 6), e.celdaDestino(2, 33)]).toEqual(['dato ajeno', 'otro dato']);
    });
    it('el cruce de nombre ignora tildes, mayúsculas y espacios', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'ÁNA   PRUEBA', horas: 3 })],
        destino: [filaDestino({ nombre: 'ana prueba' })],
      });
      const r = exportar(e);
      expect(r).toMatchObject({ creadas: 0, actualizadas: 1 });
      expect(e.celdaDestino(2, 31)).toBe(3);
    });
  });

  describe('RF-19 · el envío más reciente prevalece (corrección por reenvío)', () => {
    const escenario = () => entornoVolcado({
      origen: [
        marzo(20, { nombre: 'Ana Prueba', horas: 5, otros: 50 }),
        marzo(10, { nombre: 'Ana Prueba', horas: 1, otros: 10 }),
      ],
      destino: [filaDestino({ nombre: 'Ana Prueba' })],
    });
    it('se escribe el valor del envío con marca temporal más reciente', () => {
      const e = escenario();
      exportar(e);
      expect([e.celdaDestino(2, 31), e.celdaDestino(2, 34)]).toEqual([5, 50]);
    });
    it('queda anotado VARIOS_ENVIOS con las filas de origen', () => {
      const e = escenario();
      const r = exportar(e);
      expect(r.incidencias).toBe(0);
      const v = filtrarLog(e.verLog(), 'INCIDENCIA', 'VARIOS_ENVIOS');
      expect(v).toHaveLength(1);
      expect(v[0].slice(1)).toEqual(['run00001', 'gestora@gala.test', 'MARZO 2026', 'INCIDENCIA', 'VARIOS_ENVIOS', '2,3', 'Ana Prueba',
        'Vale el envío con marca temporal más reciente.']);
    });
    it('se archivan AMBAS filas en Anteriores (la copia conserva el histórico)', () => {
      const e = escenario();
      expect(exportar(e).copiadas).toBe(2);
      expect(e.verArchivo()).toHaveLength(2);
    });
    it('una corrección posterior sobrescribe el valor ya volcado (segunda ejecución)', () => {
      const e = entornoVolcado({ origen: [marzo(10, { nombre: 'Ana Prueba', horas: 1 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
      exportar(e);
      e.hojaOrigen.appendRow(marzo(25, { nombre: 'Ana Prueba', horas: 6 }));
      const r = exportar(e);
      expect(r).toMatchObject({ actualizadas: 1, sinCambios: 0 });
      expect(e.celdaDestino(2, 31)).toBe(6);
      const act = filtrarLog(e.verLog(), 'MOVIMIENTO', 'ACTUALIZADO').pop();
      expect(act[8]).toBe('Fila 2. Nº horas (AE): 1 → 6');
    });
  });

  describe('destino con datos', () => {
    it('valores iguales → SIN_CAMBIO y no escribe esa celda', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3, otros: '20' })],
        destino: [filaDestino({ nombre: 'Ana Prueba', horas: '3', otros: 20 })],
      });
      const antes = e.estado.escrituras.length;
      const r = exportar(e);
      expect(r).toMatchObject({ actualizadas: 0, sinCambios: 1 });
      expect(filtrarLog(e.verLog(), 'MOVIMIENTO', 'SIN_CAMBIO')[0][8]).toBe('Fila 2. Ya tenía esos valores.');
      const escriturasDestino = e.estado.escrituras.slice(antes).filter((w) => w.hoja === 'Hoja 1');
      expect(escriturasDestino).toEqual([]);
    });
    it('valores distintos → ACTUALIZADO con antes→después y solo se escribe la celda que cambia', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3, otros: 20 })],
        destino: [filaDestino({ nombre: 'Ana Prueba', horas: 3, otros: 5 })],
      });
      exportar(e);
      const celdas = e.estado.escrituras.filter((w) => w.hoja === 'Hoja 1').map((w) => w.rango);
      expect(celdas).toEqual(['AH2']);
      expect(filtrarLog(e.verLog(), 'MOVIMIENTO', 'ACTUALIZADO')[0][8]).toBe('Fila 2. € otros (AH): 5 → 20');
    });
    it('el 0 reportado se escribe aunque la celda esté vacía (el 0 es dato)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 0, otros: 0 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
      exportar(e);
      expect([e.celdaDestino(2, 31), e.celdaDestino(2, 34)]).toEqual([0, 0]);
    });
    it('un valor vacío reportado borra el dato previo del destino (caracterización)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 2, otros: '' })], destino: [filaDestino({ nombre: 'Ana Prueba', otros: 40 })] });
      exportar(e);
      expect(e.celdaDestino(2, 34)).toBe('');
      expect(filtrarLog(e.verLog(), 'MOVIMIENTO', 'ACTUALIZADO')[0][8]).toContain('€ otros (AH): 40 → (vacío)');
    });
    it('los valores no numéricos se escriben tal cual (con incidencia)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 'dos' })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
      const r = exportar(e);
      expect(e.celdaDestino(2, 31)).toBe('dos');
      expect(r.incidencias).toBe(1);
      expect(filtrarLog(e.verLog(), 'INCIDENCIA', 'VALOR_NO_NUMERICO')).toHaveLength(1);
    });
    it('doble ejecución del mismo periodo: la segunda no cambia nada y DUPLICA las filas de Anteriores (ADR-0013 §Consecuencias)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
      exportar(e);
      expect(analizar(e).yaArchivado).toBe(true);
      const r = exportar(e);
      expect(r).toMatchObject({ actualizadas: 0, sinCambios: 1, copiadas: 1 });
      expect(e.verArchivo()).toHaveLength(2);
    });
  });

  describe('nombre duplicado en destino · ADR-0013 §7', () => {
    const escenario = () => entornoVolcado({
      origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 }), marzo(6, { nombre: 'Bea Inventada', horas: 2 })],
      destino: [
        filaDestino({ nombre: 'Ana Prueba' }), filaDestino({ nombre: 'Bea Inventada' }),
        filaDestino({ nombre: ' ANA prueba' }), filaDestino({ nombre: 'Ana  Prueba' }),
      ],
    });
    it('no se escribe a la persona ambigua y SÍ a las demás', () => {
      const e = escenario();
      const r = exportar(e);
      expect(r).toMatchObject({ bloqueadas: 1, actualizadas: 1, creadas: 0 });
      expect([2, 4, 5].map((f) => e.celdaDestino(f, 31))).toEqual(['', '', '']);
      expect(e.celdaDestino(3, 31)).toBe(2);
    });
    it('el LOG registra ERROR NOMBRE_DUPLICADO_DESTINO con todas las filas', () => {
      const e = escenario();
      exportar(e);
      const err = filtrarLog(e.verLog(), 'ERROR', 'NOMBRE_DUPLICADO_DESTINO');
      expect(err).toHaveLength(1);
      expect(err[0][8]).toBe('Aparece en las filas 2, 4, 5 del destino. NO se escribe hasta resolver la ambigüedad.');
      expect(err[0][7]).toBe('Ana Prueba');
    });
    it('el resumen cuenta la bloqueada', () => {
      const e = escenario();
      exportar(e);
      expect(filasLog(e).pop()[7]).toContain('Bloqueadas=1');
    });
    it('un duplicado en destino de alguien que NO se vuelca no molesta', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })],
        destino: [filaDestino({ nombre: 'Ana Prueba' }), filaDestino({ nombre: 'Dup Ajena' }), filaDestino({ nombre: 'Dup Ajena' })],
      });
      expect(exportar(e)).toMatchObject({ bloqueadas: 0, actualizadas: 1 });
    });
    it.fails('DEFECTO: las filas de una secretaria BLOQUEADA no deberían archivarse como «exportadas» (ADR-0013 §5: copia de las filas exportadas)', () => {
      const e = escenario();
      exportar(e);
      const archivadas = (e.verArchivo() || []).map((f) => f[4]);
      expect(archivadas).not.toContain('Ana Prueba');
    });
  });

  describe('persona no encontrada → fila nueva', () => {
    it('se añade al final con el nombre del envío y sus valores, y se anota FILA_NUEVA', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Nueva Imaginaria', horas: 4, otros: 8 })],
        destino: [filaDestino({ nombre: 'Ana Prueba' })],
      });
      const r = exportar(e);
      expect(r).toMatchObject({ creadas: 1, actualizadas: 1 });
      expect([e.celdaDestino(3, 3), e.celdaDestino(3, 31), e.celdaDestino(3, 34)]).toEqual(['Nueva Imaginaria', 4, 8]);
      expect(filtrarLog(e.verLog(), 'MOVIMIENTO', 'FILA_NUEVA')[0][8]).toBe('Creada en la fila 3 del destino.');
    });
    it('varias nuevas se colocan en filas consecutivas sin pisarse', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Nueva Uno', horas: 1 }), marzo(6, { nombre: 'Nueva Dos', horas: 2 }), marzo(7, { nombre: 'Nueva Tres', horas: 3 })],
        destino: [filaDestino({ nombre: 'Ana Prueba' })],
      });
      exportar(e);
      expect([3, 4, 5].map((f) => [e.celdaDestino(f, 3), e.celdaDestino(f, 31)])).toEqual([['Nueva Uno', 1], ['Nueva Dos', 2], ['Nueva Tres', 3]]);
    });
    it('dos envíos de la misma nueva persona crean UNA sola fila', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Nueva Uno', horas: 1 }), marzo(9, { nombre: 'nueva uno', horas: 4 })],
        destino: [filaDestino({ nombre: 'Ana Prueba' })],
      });
      expect(exportar(e)).toMatchObject({ creadas: 1 });
      expect(e.celdaDestino(3, 31)).toBe(4);
      expect(e.hojaDestino.getLastRow()).toBe(3);
    });
    it('destino con solo la cabecera: crea la fila (en el doble; en Google real getRange(2,…,0,…) podría fallar: no verificable)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Nueva Uno', horas: 1 })], destino: [] });
      expect(exportar(e)).toMatchObject({ ok: true, creadas: 1 });
      expect(e.celdaDestino(2, 3)).toBe('Nueva Uno');
    });
  });

  describe('Anteriores · copia sellada (ADR-0013 §5)', () => {
    const origen = [
      marzo(5, { nombre: 'Ana Prueba', horas: 3, otros: 20 }),
      filaOrigen({ ts: fecha(2026, 4, 5), mes: 'ABRIL', nombre: 'Cleo Falsa', horas: 8 }),
      marzo(7, { nombre: 'Bea Inventada', horas: 2 }),
    ];
    it('crea la hoja si no existe y añade las filas coincidentes (ni la intermedia de otro mes) con sello, fecha y Run ID', () => {
      const e = entornoVolcado({ origen, destino: [filaDestino({ nombre: 'Ana Prueba' })] });
      exportar(e);
      const a = e.verArchivo();
      expect(a).toHaveLength(2);
      expect(a.map((f) => f[4])).toEqual(['Ana Prueba', 'Bea Inventada']);
      expect(a[0].slice(0, 10)).toEqual(e.hojaOrigen.volcar()[1].slice(0, 10));
      expect(a[0][10]).toBe('ARCHIVADO MARZO 2026');
      expect(new Date(a[0][11]).toISOString()).toBe('2026-03-15T10:00:00.000Z');
      expect(a[0][12]).toBe('run00001');
      expect(a[0]).toHaveLength(13);
    });
    it('añade tras las filas que ya tenga (histórico previo intacto)', () => {
      const previo = [['hist-1', 'x'], ['hist-2', 'y'], ['hist-3', 'z']];
      const e = entornoVolcado({ origen, destino: [filaDestino({ nombre: 'Ana Prueba' })], archivo: previo });
      exportar(e);
      const a = e.verArchivo();
      expect(a.slice(0, 3)).toEqual(previo);
      expect(a).toHaveLength(5);
      expect(a[3][4]).toBe('Ana Prueba');
    });
    it('copia en orden de fila de origen aunque el plan las tenga en otro orden', () => {
      const e = entornoVolcado({
        origen: [marzo(9, { nombre: 'Zeta Falsa', horas: 1 }), marzo(5, { nombre: 'Alfa Falsa', horas: 2 })],
        destino: [filaDestino({ nombre: 'Zeta Falsa' })],
      });
      exportar(e);
      expect(e.verArchivo().map((f) => f[4])).toEqual(['Zeta Falsa', 'Alfa Falsa']);
    });
    it('el LOG anota COPIA_ARCHIVO con el número de filas', () => {
      const e = entornoVolcado({ origen, destino: [filaDestino({ nombre: 'Ana Prueba' })] });
      exportar(e);
      expect(filtrarLog(e.verLog(), 'MOVIMIENTO', 'COPIA_ARCHIVO')[0][8]).toBe('2 fila(s) copiadas a "Anteriores".');
    });
    it('si la copia falla, el volcado ya hecho se mantiene y se anota ERROR COPIA_ARCHIVO (sin datos a medias en silencio)', () => {
      const e = entornoVolcado({ origen, destino: [filaDestino({ nombre: 'Ana Prueba' })], log: [plano(entornoVolcado().valor('LOG_HEADERS'))] });
      e.libroOrigen.insertSheet = () => { throw new Error('Cuota excedida'); };
      const r = exportar(e);
      expect(r).toMatchObject({ ok: true, copiadas: 0, actualizadas: 2 });
      expect(e.celdaDestino(2, 31)).toBe(3);
      const err = filtrarLog(e.verLog(), 'ERROR', 'COPIA_ARCHIVO');
      expect(err[0][8]).toBe('No se pudo copiar a "Anteriores": Cuota excedida. El volcado a VINCULACIÓN sí se ha realizado.');
      expect(filasLog(e).pop()[7]).toContain('Copiadas=0');
    });
  });

  describe('fallos durante la ejecución · sin silencios (ADR-0012)', () => {
    it('destino sin pestaña → ok:false, ERROR PESTANA_NO_ENCONTRADA + RESUMEN ERROR, bloqueo liberado, nada copiado', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: false, espiar: true });
      const r = exportar(e);
      expect(r).toEqual({ ok: false, error: 'No existe la pestaña destino: "Hoja 1".' });
      const log = filasLog(e);
      expect(log.map((f) => f.slice(3, 5))).toEqual([['ERROR', 'PESTANA_NO_ENCONTRADA'], ['RESUMEN', 'ERROR']]);
      expect(log[0][7]).toMatch(/^No existe la pestaña destino: "Hoja 1"\. — Posible solución: Revisa SOURCE_SHEET_NAME/);
      expect(log[1][7]).toBe('Ejecución interrumpida: No existe la pestaña destino: "Hoja 1".');
      expect(e.bloqueo.liberaciones).toBe(1);
      expect(e.verArchivo()).toBeNull();
    });
    it('caracterización: si falla el destino, las incidencias del análisis NO llegan al LOG (solo ERROR y RESUMEN)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 'x' })], destino: false });
      exportar(e);
      expect(filasLog(e).map((f) => f[4])).toEqual(['PESTANA_NO_ENCONTRADA', 'ERROR']);
    });
    it('libro destino inexistente → ok:false y ERROR anotado (tipo NO_CLASIFICADO con el mensaje del doble)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], libroDestino: false, espiar: true });
      const r = exportar(e);
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/no existe o no hay acceso/);
      expect(filtrarLog(e.verLog(), 'ERROR', 'NO_CLASIFICADO')).toHaveLength(1);
      expect(e.bloqueo.liberaciones).toBe(1);
      expect(e.verArchivo()).toBeNull();
    });
    it('bloqueo ocupado → ok:false con mensaje y NO se escribe nada (RNF-04)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba' })], espiar: true });
      e.estado.bloqueoOcupado = true;
      const r = exportar(e);
      expect(r).toEqual({ ok: false, error: 'Se agotó el tiempo de espera del bloqueo.' });
      expect(e.celdaDestino(2, 31)).toBe('');
      expect(e.estado.escrituras).toEqual([]);
      expect(e.bloqueo.liberaciones).toBe(0);
    });
    it.fails('DEFECTO: un bloqueo ocupado debería quedar en el LOG como ERROR BLOQUEO (SSD §7.2 lo lista; hoy waitLock está fuera del try)', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
      e.estado.bloqueoOcupado = true;
      exportar(e);
      expect(filtrarLog(e.verLog(), 'ERROR', 'BLOQUEO')).toHaveLength(1);
    });
    it.fails('DEFECTO: un fallo al analizar durante la exportación (p. ej. sin pestaña de origen) debería anotarse en el LOG como lo hace el informe previo', () => {
      const e = entornoVolcado({ origen: false });
      expect(exportar(e).ok).toBe(false);
      expect((e.verLog() || []).length).toBeGreaterThan(1);
    });
    it('si el LOG no se puede escribir, la exportación sigue y se avisa por Logger', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba' })], archivo: [] });
      e.libroOrigen.insertSheet = () => { throw new Error('Cuota excedida'); };
      const r = exportar(e);
      expect(r.ok).toBe(true);
      expect(e.estado.logs.some((l) => l.includes('No se pudo escribir en "LOG Volcado": Cuota excedida'))).toBe(true);
    });
    it('usuario sin correo accesible → Usuario vacío en el LOG', () => {
      const e = entornoVolcado({ origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
      e.contexto.Session = { getActiveUser() { throw new Error('x'); }, getScriptTimeZone: () => 'Europe/Madrid' };
      exportar(e);
      expect(new Set(e.verLog().slice(1).map((f) => f[2]))).toEqual(new Set(['']));
    });
  });

  describe('incidencias y avisos en el LOG (ADR-0013 §6)', () => {
    it('anota SIN_NOMBRE, MES_NO_RECONOCIDO, SIN_MARCA_TEMPORAL y MARCA_TEMPORAL_FUERA_DE_MES', () => {
      const e = entornoVolcado({
        origen: [
          marzo(5, { nombre: 'Ana Prueba', horas: 3 }),
          marzo(6, { nombre: '', horas: 1 }),
          filaOrigen({ ts: fecha(2026, 3, 7), mes: 'quizás', nombre: 'Bea Inventada' }),
          filaOrigen({ mes: 'MARZO', nombre: 'Cleo Falsa', horas: 1 }),
          filaOrigen({ ts: fecha(2026, 6, 1), mes: 'MARZO', nombre: 'Dani Irreal', horas: 1 }),
        ],
        destino: [filaDestino({ nombre: 'Ana Prueba' })],
      });
      const r = exportar(e);
      expect(r.incidencias).toBe(3);
      const tipos = filtrarLog(e.verLog(), 'INCIDENCIA').map((f) => f[5]);
      expect(tipos).toEqual(['SIN_NOMBRE', 'MES_NO_RECONOCIDO', 'SIN_MARCA_TEMPORAL', 'MARCA_TEMPORAL_FUERA_DE_MES']);
      const fuera = filtrarLog(e.verLog(), 'INCIDENCIA', 'MARCA_TEMPORAL_FUERA_DE_MES')[0];
      expect([fuera[6], fuera[7], fuera[8]]).toEqual([6, 'Dani Irreal', 'Declara MARZO pero la marca temporal es 01/06/2026']);
    });
    it('el resumen informa de coinciden / no coinciden / incidencias', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 }), filaOrigen({ ts: fecha(2026, 4, 5), mes: 'ABRIL', nombre: 'Ana Prueba' })],
        destino: [filaDestino({ nombre: 'Ana Prueba' })],
      });
      exportar(e);
      expect(filasLog(e).pop()[7]).toBe('Actualizadas=1 | SinCambio=0 | Creadas=0 | Bloqueadas=0 | Copiadas=1 | Coinciden=1 | NoCoinciden=1 | Incidencias=0');
    });
    it('el LOG existente se amplía por debajo sin repetir cabecera', () => {
      const e = entornoVolcado({
        origen: [marzo(5, { nombre: 'Ana Prueba', horas: 3 })], destino: [filaDestino({ nombre: 'Ana Prueba' })],
        log: [plano(entornoVolcado().valor('LOG_HEADERS')), ['previo', '', '', '', '', '', '', '', 'fila anterior']],
      });
      exportar(e);
      const log = e.verLog();
      expect(log[1][0]).toBe('previo');
      expect(log.filter((f) => f[0] === 'Timestamp')).toHaveLength(1);
      expect(log.length).toBeGreaterThan(3);
    });
  });

  describe('DEFECTO conocido RNF-07 · escrituras en bloque', () => {
    it.fails('DEFECTO (RNF-07 🔴 deuda técnica): el volcado debería escribir en bloque; hoy escribe celda a celda', () => {
      const nombres = Array.from({ length: 40 }, (_, i) => `Persona Ficticia ${i}`);
      const e = entornoVolcado({
        origen: nombres.map((n, i) => marzo(5, { nombre: n, horas: i, otros: i })),
        destino: nombres.map((n) => filaDestino({ nombre: n })),
      });
      exportar(e);
      expect(e.estado.escrituras.filter((w) => w.hoja === 'Hoja 1').length).toBeLessThanOrEqual(5);
    });
    it('caracterización: con 40 personas se hacen 80 escrituras individuales en el destino', () => {
      const nombres = Array.from({ length: 40 }, (_, i) => `Persona Ficticia ${i}`);
      const e = entornoVolcado({
        origen: nombres.map((n, i) => marzo(5, { nombre: n, horas: i + 1, otros: i + 1 })),
        destino: nombres.map((n) => filaDestino({ nombre: n })),
      });
      exportar(e);
      expect(e.estado.escrituras.filter((w) => w.hoja === 'Hoja 1')).toHaveLength(80);
    });
  });
});
