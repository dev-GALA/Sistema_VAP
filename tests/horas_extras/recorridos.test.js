// Recorridos de extremo a extremo del BACKEND: desde el punto de entrada real (menú, disparador, envío de formulario)
// hasta el estado final de hojas, formulario y LOG. Datos ficticios. ADR-0004 · ADR-0013 · RF-16..RF-19.
import { describe, expect, it } from 'vitest';
import { CODIGO, CAB_ORIGEN, entornoSync, entornoVolcado, eventoEnvio, fecha, filaDestino, filaOrigen, filtrarLog } from './ayudas.js';
import { cargarGs, plano } from '../soporte/cargar-gs.js';

const marzo = (dia, extra = {}) => filaOrigen({ ts: fecha(2026, 3, dia), mes: 'MARZO', ...extra });

/** Lo que haría la persona: pulsar el elemento del menú. */
function pulsarMenu(e) {
  e.llamar('onOpen');
  const item = e.estado.menus[0].items[0];
  e.llamar(item.funcion);
}

/** Lo que haría la plataforma: llamar al manejador de cada disparador instalado cuyo manejador coincide. */
function dispararTriggers(e, manejador, evento) {
  const disparadores = e.estado.disparadores.filter((t) => t.handler === manejador);
  disparadores.forEach(() => e.llamar(manejador, evento));
  return disparadores.length;
}

describe('Recorrido 1 · cierre mensual feliz: menú → diálogo → informe → exportar (RF-16 · RF-17)', () => {
  it('desde onOpen hasta destino, Anteriores y LOG', () => {
    const e = entornoVolcado({
      ahora: '2026-03-31T16:00:00Z',
      origen: [
        marzo(24, { nombre: 'Ana Prueba', horas: 2, otros: 10 }),
        marzo(26, { nombre: 'Bea Inventada', horas: 4 }),
        marzo(27, { nombre: 'Ana Prueba', horas: 3, otros: 12 }), // reenvío de Ana: corrige
        filaOrigen({ ts: fecha(2026, 2, 27), mes: 'FEBRERO', nombre: 'Ana Prueba', horas: 9 }), // mes pasado: no se toca
      ],
      destino: [filaDestino({ nombre: 'Ana Prueba' }), filaDestino({ nombre: 'Bea Inventada' })],
    });

    pulsarMenu(e);
    expect(e.estado.dialogos[0].titulo).toBe('Volcar Horas Extras');

    // Lo que hace el diálogo al abrirse: mes propuesto = mes en curso.
    const propuesto = plano(e.llamar('vapPeriodoPropuesto'));
    expect([propuesto.mes, propuesto.anio]).toEqual(['MARZO', 2026]);

    // «Revisar»: informe sin escribir nada.
    const informe = plano(e.llamar('vapAnalizarPeriodo', propuesto.mes, propuesto.anio));
    expect(informe).toMatchObject({ ok: true, coinciden: 3, secretarias: 2, corregidas: 1, noCoinciden: 1, porOtroMes: 1, destinoOcupado: 0, yaArchivado: false });
    expect(e.estado.escrituras).toEqual([]);

    // «Exportar»
    const r = plano(e.llamar('vapEjecutarExportacion', propuesto.mes, propuesto.anio));
    expect(r).toEqual({ ok: true, actualizadas: 2, sinCambios: 0, creadas: 0, bloqueadas: 0, copiadas: 3, incidencias: 0 });

    expect([2, 3].map((f) => [e.celdaDestino(f, 31), e.celdaDestino(f, 34)])).toEqual([[3, 12], [4, '']]);
    expect(e.verArchivo().map((f) => [f[4], f[10]])).toEqual([['Ana Prueba', 'ARCHIVADO MARZO 2026'], ['Bea Inventada', 'ARCHIVADO MARZO 2026'], ['Ana Prueba', 'ARCHIVADO MARZO 2026']]);
    expect(filtrarLog(e.verLog(), 'RESUMEN', 'OK')).toHaveLength(1);
    expect(filtrarLog(e.verLog(), 'INCIDENCIA', 'VARIOS_ENVIOS')).toHaveLength(1);
    expect(e.hojaOrigen.getLastRow()).toBe(5); // la hoja de respuestas conserva sus 4 filas + cabecera
  });
});

describe('Recorrido 2 · cancelar: nada se modifica (RF-18)', () => {
  it('se abre el menú, se revisa el periodo y se cierra sin exportar', () => {
    const e = entornoVolcado({
      origen: [marzo(24, { nombre: 'Ana Prueba', horas: 2 })],
      destino: [filaDestino({ nombre: 'Ana Prueba' })],
    });
    const fotoOrigen = e.hojaOrigen.volcar();
    const fotoDestino = e.hojaDestino.volcar();
    pulsarMenu(e);
    e.llamar('vapPeriodoPropuesto');
    e.llamar('vapAnalizarPeriodo', 'MARZO', 2026);
    e.llamar('vapAnalizarPeriodo', 'FEBRERO', 2026);
    // …y la usuaria pulsa «Cancelar»: no se llama a vapEjecutarExportacion.
    expect(e.hojaOrigen.volcar()).toEqual(fotoOrigen);
    expect(e.hojaDestino.volcar()).toEqual(fotoDestino);
    expect(e.estado.escrituras).toEqual([]);
    expect(e.libroOrigen.getSheets().map((h) => h.getName())).toEqual(['Respuestas de formulario']);
    expect(e.verLog()).toBeNull();
  });
});

describe('Recorrido 3 · cierre a primeros del mes siguiente (ADR-0013 §2)', () => {
  it('el diálogo propone ABRIL pero se elige MARZO: se vuelca marzo y el destino de abril no se toca', () => {
    const e = entornoVolcado({
      ahora: '2026-04-02T08:00:00Z',
      origen: [marzo(30, { nombre: 'Ana Prueba', horas: 5 }), filaOrigen({ ts: fecha(2026, 4, 1), mes: 'ABRIL', nombre: 'Ana Prueba', horas: 99 })],
      destino: [filaDestino({ nombre: 'Ana Prueba' })],
    });
    expect(plano(e.llamar('vapPeriodoPropuesto')).mes).toBe('ABRIL');
    e.llamar('vapEjecutarExportacion', 'MARZO', '2026');
    expect(e.celdaDestino(2, 31)).toBe(5);
    expect(e.verLog()[1][3]).toBe('MARZO 2026');
  });
});

describe('Recorrido 4 · volcar sobre la hoja del mes anterior: se avisa ANTES de escribir (SSD §6.3)', () => {
  it('el informe señala celdas ocupadas; la exportación, si se confirma, las sobrescribe y lo deja en el LOG', () => {
    const e = entornoVolcado({
      origen: [marzo(24, { nombre: 'Ana Prueba', horas: 2, otros: 10 })],
      destino: [filaDestino({ nombre: 'Ana Prueba', horas: 7, otros: 70 })],
    });
    expect(plano(e.llamar('vapAnalizarPeriodo', 'MARZO', 2026)).destinoOcupado).toBe(2);
    expect(e.celdaDestino(2, 31)).toBe(7); // el informe no escribió
    e.llamar('vapEjecutarExportacion', 'MARZO', 2026);
    expect(e.celdaDestino(2, 31)).toBe(2);
    expect(filtrarLog(e.verLog(), 'MOVIMIENTO', 'ACTUALIZADO')[0][8]).toBe('Fila 2. Nº horas (AE): 7 → 2 | € otros (AH): 70 → 10');
  });
});

describe('Recorrido 5 · errores visibles, no silenciosos (ADR-0012)', () => {
  it('destino desaparecido: la exportación falla con mensaje, el bloqueo se libera y el LOG lo cuenta', () => {
    const e = entornoVolcado({ origen: [marzo(24, { nombre: 'Ana Prueba', horas: 2 })], destino: false, espiar: true });
    pulsarMenu(e);
    const r = plano(e.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r.ok).toBe(false);
    expect(e.bloqueo.liberaciones).toBe(1);
    expect(filtrarLog(e.verLog(), 'RESUMEN', 'ERROR')).toHaveLength(1);
    expect(e.verArchivo()).toBeNull();
  });
  it('dos personas lanzan el volcado a la vez: la segunda recibe «bloqueo» y no escribe (RNF-04)', () => {
    const e = entornoVolcado({ origen: [marzo(24, { nombre: 'Ana Prueba', horas: 2 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
    e.estado.bloqueoOcupado = true; // la primera ejecución sigue en curso
    const r = plano(e.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r.ok).toBe(false);
    expect(e.celdaDestino(2, 31)).toBe('');
    e.estado.bloqueoOcupado = false; // termina la primera: reintento
    expect(plano(e.llamar('vapEjecutarExportacion', 'MARZO', 2026)).ok).toBe(true);
    expect(e.celdaDestino(2, 31)).toBe(2);
  });
});

describe('Recorrido 6 · desplegable de secretarias: alta/baja en la BBDD → formulario (ADR-0004)', () => {
  it('instalar disparadores, editar VAP_Secretarias y ver el desplegable actualizado', () => {
    const e = entornoSync({ secretarias: [['S001', 'Ana Prueba', true], ['S002', 'Bea Inventada', false]] });
    e.llamar('crearTriggersProduccion');
    e.llamar('crearTriggerHorarioRespaldo');
    expect(e.estado.disparadores).toHaveLength(4);

    // Se da de alta a Bea (marcando la casilla «Alta»): la plataforma dispara onEdit.
    e.hojaSecretarias.getRange(3, 3).setValue(true);
    const llamadas = dispararTriggers(e, 'onSpreadsheetEditTrigger', { range: { getSheet: () => e.hojaSecretarias } });
    expect(llamadas).toBe(1);
    expect(e.opcionesFormulario()).toEqual(['Ana Prueba', 'Bea Inventada']);

    // Se inserta una fila (cambio estructural) dentro de la ventana: se omite; el respaldo horario la recogerá.
    e.hojaSecretarias.appendRow(['S003', 'Cleo Falsa', true]);
    dispararTriggers(e, 'onSpreadsheetChangeTrigger', { changeType: 'INSERT_ROW' });
    expect(e.opcionesFormulario()).toEqual(['Ana Prueba', 'Bea Inventada']);
    dispararTriggers(e, 'actualizarPreguntaSecretarias');
    expect(e.opcionesFormulario()).toEqual(['Ana Prueba', 'Bea Inventada', 'Cleo Falsa']);
  });
});

describe('Recorrido 7 · envío del formulario → ID_Secre → volcado (ADR-0004 + ADR-0013)', () => {
  it('el envío de una secretaria queda identificado y entra en el volcado del periodo', () => {
    // Ambos .gs en el mismo entorno de prueba (en Google son proyectos distintos, ADR-0007: aquí solo se comprueba que no chocan).
    const e = entornoVolcado({ rutas: [CODIGO.horasExtrasVolcado, CODIGO.horasExtrasSync], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
    const bbdd = e.google.libro(e.valor('SPREADSHEET_ID'), 'BBDD ficticia');
    bbdd.conHoja('VAP_Secretarias', [['id_trabajador', 'Nombre_Secretaria', 'Alta'], ['S001', 'Ana Prueba', true]]);
    const formulario = {
      getItems: () => [], getDestinationId: () => e.idOrigen,
    };
    e.estado.formularios.set(e.valor('FORM_ID'), formulario);

    // 1) La secretaria envía el formulario: la plataforma añade la fila y dispara onFormSubmit.
    const marca = fecha(2026, 3, 27, 10, 15, 0);
    e.hojaOrigen.appendRow(filaOrigen({ ts: marca, mes: 'MARZO', nombre: 'Ana Prueba', horas: 3, otros: 15 }));
    e.llamar('onFormSubmit', eventoEnvio({ MES: 'MARZO', SECRETARIA: 'Ana Prueba' }, marca));
    expect(e.hojaOrigen.getRange(2, 6).getValue()).toBe('S001'); // columna F = ID_Secre (SSD §7.2)

    // 2) La responsable lanza el volcado de marzo.
    const informe = plano(e.llamar('vapAnalizarPeriodo', 'MARZO', 2026));
    expect(informe).toMatchObject({ ok: true, coinciden: 1, incidencias: [] });
    e.llamar('vapEjecutarExportacion', 'MARZO', 2026);
    expect([e.celdaDestino(2, 31), e.celdaDestino(2, 34)]).toEqual([3, 15]);
  });
  it('la cabecera de la hoja de respuestas de las pruebas trae ID_Secre en la columna F, como el SSD', () => {
    expect(CAB_ORIGEN[5]).toBe('ID_Secre');
  });
  it('los dos .gs se cargan juntos sin pisarse constantes ni funciones', () => {
    expect(() => cargarGs([CODIGO.horasExtrasVolcado, CODIGO.horasExtrasSync])).not.toThrow();
  });
  it('y cada uno por separado también (RNF-12: componentes independientes)', () => {
    expect(() => cargarGs(CODIGO.horasExtrasVolcado)).not.toThrow();
    expect(() => cargarGs(CODIGO.horasExtrasSync)).not.toThrow();
  });
});

describe('Recorrido 8 · un envío corregido entre dos volcados (RF-19)', () => {
  it('el segundo volcado detecta la corrección y deja el rastro antes→después', () => {
    const e = entornoVolcado({ origen: [marzo(24, { nombre: 'Ana Prueba', horas: 2, otros: 10 })], destino: [filaDestino({ nombre: 'Ana Prueba' })] });
    e.llamar('vapEjecutarExportacion', 'MARZO', 2026);
    e.hojaOrigen.appendRow(marzo(29, { nombre: 'Ana Prueba', horas: 2, otros: 25 }));
    expect(plano(e.llamar('vapAnalizarPeriodo', 'MARZO', 2026))).toMatchObject({ yaArchivado: true, destinoOcupado: 2, corregidas: 1 });
    const r = plano(e.llamar('vapEjecutarExportacion', 'MARZO', 2026));
    expect(r).toMatchObject({ actualizadas: 1, sinCambios: 0, copiadas: 2 });
    expect([e.celdaDestino(2, 31), e.celdaDestino(2, 34)]).toEqual([2, 25]);
    const ultimo = filtrarLog(e.verLog(), 'MOVIMIENTO', 'ACTUALIZADO').pop();
    expect(ultimo[8]).toBe('Fila 2. € otros (AH): 10 → 25');
    expect(e.verArchivo()).toHaveLength(3); // 1 de la primera ejecución + 2 de la segunda (duplicado conocido, ADR-0013)
  });
});
