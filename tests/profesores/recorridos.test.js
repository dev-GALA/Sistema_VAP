// Recorridos de extremo a extremo del backend del módulo de profesores: desde el punto de entrada real
// (disparador, menú, función que llama el diálogo) hasta el estado final de hojas, formulario y logs.
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { DNI_PRUEBA, entornoActividad, entornoSync, eventoEnvio, filaDestino, filaOrigen, leerLog, profesor } from './ayudas.js';

const ANA = 'Beta Ficticia, Ana';
const CARLOS = 'Dos Ficticio, Carlos';
const LISTA = 'SELECCIONE EL PROFESOR';
const disparar = (e, handler, evento) => e.llamar(handler, evento);

describe('Recorrido · alta de un profesor hasta que su respuesta lleva ID (RF-01 · RF-02 · RF-03)', () => {
  it('alta en VAP_Profesores → cambio estructural → aparece en el formulario → envío → ID en la hoja de respuestas', () => {
    const e = entornoSync({
      profesores: [profesor(CARLOS, 'B_2')],
      respuestas: [['Marca temporal', LISTA], ['10/03/2026 10:15:30', ANA]],
    });
    e.llamar('crearTriggersProduccion');
    expect(e.google.estado.disparadores.map((t) => t.handler)).toContain('onSpreadsheetChangeTrigger');

    e.hojaProfesores.appendRow(profesor(ANA, 'A_1'));
    disparar(e, 'onSpreadsheetChangeTrigger', { changeType: 'INSERT_ROW' });
    expect(e.formulario.opcionesPorTitulo[LISTA]).toStrictEqual([ANA, CARLOS]);

    disparar(e, 'onFormSubmit', eventoEnvio([[LISTA, ANA]]));
    expect(e.hojaRespuestas.volcar()).toStrictEqual([['Marca temporal', LISTA, 'ID_Profesor', 'DNI_Profesor'], ['10/03/2026 10:15:30', ANA, 'A_1', DNI_PRUEBA]]);
  });

  it('baja (casilla Alta desmarcada) → edición → desaparece de la lista y su envío ya no obtiene ID', () => {
    const e = entornoSync({
      profesores: [profesor(ANA, 'A_1'), profesor(CARLOS, 'B_2')],
      respuestas: [['Marca temporal', LISTA], ['10/03/2026 10:15:30', ANA]],
    });
    e.llamar('actualizarPreguntaProfesores');
    e.hojaProfesores.getRange(2, 7).setValue(false);
    disparar(e, 'onSpreadsheetEditTrigger', { range: e.hojaProfesores.getRange(2, 7) });
    expect(e.formulario.opcionesPorTitulo[LISTA]).toStrictEqual([CARLOS]);
    expect(() => disparar(e, 'onFormSubmit', eventoEnvio([[LISTA, ANA]]))).toThrow(`No se encontró el profesor "${ANA}"`);
    expect(e.hojaRespuestas.volcar()[1]).toStrictEqual(['10/03/2026 10:15:30', ANA]);
  });

  it('SSD §6.1.0 · un Alta pegada como texto "TRUE" deja a la persona fuera del formulario y de la asignación de ID', () => {
    const e = entornoSync({
      profesores: [profesor(ANA, 'A_1', 'TRUE'), profesor(CARLOS, 'B_2', true)],
      respuestas: [['Marca temporal', LISTA], ['10/03/2026 10:15:30', ANA]],
    });
    e.llamar('actualizarPreguntaProfesores');
    expect(e.formulario.opcionesPorTitulo[LISTA]).toStrictEqual([CARLOS]);
    expect(() => disparar(e, 'onFormSubmit', eventoEnvio([[LISTA, ANA]]))).toThrow(/No se encontró el profesor/);
  });

  it('SSD §6.1.0 · con ID_Profesor vacío (Id_Sage olvidado) no aparece en el formulario', () => {
    const e = entornoSync({ profesores: [profesor(ANA, ''), profesor(CARLOS, 'B_2')] });
    e.llamar('actualizarPreguntaProfesores');
    expect(e.formulario.opcionesPorTitulo[LISTA]).toStrictEqual([CARLOS]);
  });

  it('control de frecuencia: una alta dentro de los 30 s se pierde hasta el respaldo horario, que la recupera', () => {
    const e = entornoSync({ profesores: [profesor(CARLOS, 'B_2')] });
    e.llamar('crearTriggerHorarioRespaldo');
    disparar(e, 'onSpreadsheetChangeTrigger', { changeType: 'INSERT_ROW' });
    e.hojaProfesores.appendRow(profesor(ANA, 'A_1'));
    disparar(e, 'onSpreadsheetChangeTrigger', { changeType: 'INSERT_ROW' });
    expect(e.formulario.opcionesPorTitulo[LISTA]).toStrictEqual([CARLOS]);
    // Pasa la hora: el disparador de respaldo llama a la sincronización directamente (sin control de frecuencia).
    const respaldo = e.google.estado.disparadores.find((t) => t.timeBased);
    e.llamar(respaldo.handler);
    expect(e.formulario.opcionesPorTitulo[LISTA]).toStrictEqual([ANA, CARLOS]);
  });

  it('los disparadores instalados llaman a funciones que existen en el script', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    e.llamar('crearTriggerHorarioRespaldo');
    for (const t of e.google.estado.disparadores) {
      expect(e.ejecutar(`typeof ${t.handler}`)).toBe('function');
    }
  });

  it('un profesor ambiguo (dos activos con el mismo nombre) se ve en el formulario pero su envío falla sin escribir', () => {
    const e = entornoSync({
      profesores: [profesor('Ficticia, Repetida', 'A_1'), profesor('Ficticia, Repetida', 'A_2')],
      respuestas: [['Marca temporal', LISTA], ['10/03/2026 10:15:30', 'Ficticia, Repetida']],
    });
    e.llamar('actualizarPreguntaProfesores');
    expect(e.formulario.opcionesPorTitulo[LISTA]).toStrictEqual(['Ficticia, Repetida']);
    expect(() => disparar(e, 'onFormSubmit', eventoEnvio([[LISTA, 'Ficticia, Repetida']]))).toThrow(/varios profesores activos/);
    expect(plano(e.hojaRespuestas.volcar()[1])).toStrictEqual(['10/03/2026 10:15:30', 'Ficticia, Repetida']);
  });

  it('varios envíos seguidos escriben cada ID en su fila (marcas distintas)', () => {
    const e = entornoSync({
      profesores: [profesor(ANA, 'A_1'), profesor(CARLOS, 'B_2')],
      respuestas: [['Marca temporal', LISTA], ['10/03/2026 10:15:30', ANA], ['10/03/2026 10:16:30', CARLOS]],
    });
    disparar(e, 'onFormSubmit', eventoEnvio([[LISTA, CARLOS]], new Date('2026-03-10T09:16:30Z')));
    disparar(e, 'onFormSubmit', eventoEnvio([[LISTA, ANA]], new Date('2026-03-10T09:15:30Z')));
    const v = e.hojaRespuestas.volcar();
    expect(v[1][2]).toBe('A_1');
    expect(v[2][2]).toBe('B_2');
  });
});

describe('Recorrido · volcado mensual de actividad (RF-16 · RF-17 · RF-20 · RF-63)', () => {
  const origenMarzo = () => [
    filaOrigen({ profesor: ANA, sucursal: 'Sucursal Uno', ts: '2026-03-05T12:00:00Z', datos: { 6: 10, 7: 20 } }),
    filaOrigen({ profesor: ANA, sucursal: 'Sucursal Dos', ts: '2026-03-12T12:00:00Z', datos: { 6: '', 8: 5 } }),
    filaOrigen({ profesor: CARLOS, ts: '2026-03-08T12:00:00Z', datos: { 6: 0 } }),
    filaOrigen({ profesor: ANA, mes: 'ABRIL', ts: '2026-04-02T12:00:00Z', datos: { 6: 999 } }),
  ];

  it('menú → diálogo → periodo propuesto → informe previo → exportación: estado final completo', () => {
    const x = entornoActividad({ origen: origenMarzo(), destino: [filaDestino(ANA)], plantillasHtml: { DialogoVolcado: '<html></html>' } });
    x.llamar('onOpen');
    const [menu] = x.google.estado.menus;
    expect(menu.items[0].funcion).toBe('abrirDialogoVolcado');
    x.llamar(menu.items[0].funcion);
    expect(x.google.estado.dialogos).toHaveLength(1);

    const propuesta = plano(x.llamar('vapPeriodoPropuesto'));
    expect([propuesta.mes, propuesta.anio]).toStrictEqual(['MARZO', 2026]);

    const informe = plano(x.llamar('vapAnalizarPeriodo', propuesta.mes, propuesta.anio));
    expect(informe).toMatchObject({ ok: true, totalFilas: 4, coinciden: 3, profesores: 2, multiReporte: 1, noCoinciden: 1, porOtroMes: 1, destinoOcupado: 0, yaArchivado: false });
    expect(x.hojaDestino.volcar()).toStrictEqual([x.hojaDestino.volcar()[0], filaDestino(ANA)]); // el informe no escribe

    const r = plano(x.llamar('vapEjecutarExportacion', propuesta.mes, propuesta.anio));
    expect(r).toMatchObject({ ok: true, actualizados: 2, creados: 1, sinCambios: 0, bloqueados: 0, copiadas: 3, celdasEscritas: 4 });

    const destino = x.hojaDestino.volcar();
    expect(destino.slice(1).map((f) => [f[2], f[28], f[29], f[30]])).toStrictEqual([[ANA, 10, 20, 5], [CARLOS, 0, '', '']]);
    const historico = x.libroOrigen.getSheetByName('Hoja 1').volcar();
    expect(historico).toHaveLength(4);
    expect(historico.slice(1).map((f) => f[ANCHO_ARCHIVADO])).toStrictEqual(Array(3).fill('ARCHIVADO MARZO 2026'));
    expect(leerLog(x).at(-1).Tipo).toBe('OK');
  });

  it('RF-18 · cancelar: revisar el periodo y no exportar deja todo exactamente como estaba', () => {
    const x = entornoActividad({ origen: origenMarzo(), destino: [filaDestino(ANA, { 29: 1 })], historico: [['previo']] });
    const copia = () => plano([...x.google.estado.libros.values()].map((l) => l.getSheets().map((h) => [h.getName(), h.volcar()])));
    const antes = copia();
    x.llamar('vapPeriodoPropuesto');
    x.llamar('vapAnalizarPeriodo', 'MARZO', 2026);
    expect(copia()).toStrictEqual(antes);
    expect(x.google.estado.escrituras).toStrictEqual([]);
  });

  it('ADR-0009 · un segundo volcado posterior con campos nuevos completa y sobrescribe, y lo vacío no borra lo ya volcado', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, ts: '2026-03-05T12:00:00Z', datos: { 6: 10, 7: 20 } })], destino: [filaDestino(ANA)] });
    x.llamar('vapEjecutarExportacion', 'MARZO', 2026);
    // Llega un reporte tardío: nuevo valor en 6, campo 7 vacío, campo 8 nuevo.
    x.hojaOrigen.appendRow(filaOrigen({ profesor: ANA, ts: '2026-03-20T12:00:00Z', datos: { 6: 11, 8: 3 } }));
    const r = plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r).toMatchObject({ actualizados: 1, celdasEscritas: 2 });
    const f = x.hojaDestino.volcar()[1];
    expect([f[28], f[29], f[30]]).toStrictEqual([11, 20, 3]);
  });

  it('RF-23 · volcar sobre la hoja del mes anterior: el informe avisa y la exportación conserva los campos sin dato', () => {
    const x = entornoActividad({
      origen: [filaOrigen({ profesor: ANA, datos: { 6: 5 } })],
      destino: [filaDestino(ANA, { 29: 100, 30: 200 })],
    });
    expect(plano(x.llamar('vapAnalizarPeriodo', 'MARZO', 2026)).destinoOcupado).toBe(2);
    const r = plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r).toMatchObject({ celdasEscritas: 1, celdasConservadas: 1 });
    expect(x.hojaDestino.volcar()[1].slice(28, 30)).toStrictEqual([5, 200]);
  });

  it('periodo sin respuestas: el informe dice 0 coincidencias y la exportación se niega sin escribir', () => {
    const x = entornoActividad({ origen: origenMarzo(), destino: [filaDestino(ANA)] });
    expect(plano(x.llamar('vapAnalizarPeriodo', 'JUNIO', 2026))).toMatchObject({ ok: true, coinciden: 0, noCoinciden: 4, porOtroMes: 4 });
    expect(plano(x.llamar('vapEjecutarExportacion', 'JUNIO', 2026)).ok).toBe(false);
    expect(x.libroOrigen.getSheetByName('LOG Volcado')).toBeNull();
  });

  it('año anterior: el mismo mes de otro año no se mezcla con el actual', () => {
    const x = entornoActividad({ origen: [filaOrigen({ profesor: ANA, ts: '2025-03-10T12:00:00Z', datos: { 6: 1 } }), filaOrigen({ profesor: ANA, ts: '2026-03-10T12:00:00Z', datos: { 6: 2 } })], destino: [filaDestino(ANA)] });
    x.llamar('vapEjecutarExportacion', 'MARZO', 2026);
    expect(x.hojaDestino.volcar()[1][28]).toBe(2);
    expect(plano(x.llamar('vapAnalizarPeriodo', 'MARZO', 2026)).porOtroAnio).toBe(1);
  });

  it('RF-47/48 · fallo a mitad (sin pestaña destino) deja el histórico intacto y el log con la causa', () => {
    const x = entornoActividad({ origen: origenMarzo(), destino: null, historico: [['previo']] });
    const r = plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r.ok).toBe(false);
    expect(x.hojaHistorico.volcar()).toStrictEqual([['previo']]);
    expect(leerLog(x).map((l) => l.Categoría)).toStrictEqual(['ERROR', 'RESUMEN']);
  });

  it('un volcado con nombres duplicados en el destino escribe a los demás y deja el aviso en el log', () => {
    const x = entornoActividad({ origen: origenMarzo(), destino: [filaDestino(ANA), filaDestino(ANA)] });
    const r = plano(x.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r).toMatchObject({ bloqueados: 1, creados: 1 });
    expect(leerLog(x).some((l) => l.Tipo === 'NOMBRE_DUPLICADO_DESTINO')).toBe(true);
  });
});

const ANCHO_ARCHIVADO = 69; // primera columna añadida por el histórico: «Archivado en»
