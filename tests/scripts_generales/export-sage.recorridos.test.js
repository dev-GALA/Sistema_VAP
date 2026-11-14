// RECORRIDOS (extremo a extremo del backend) de VAP_script_export_SAGE.gs:
// onOpen → menú → acción → bloqueo → volcado → logs/errores → estado final de las hojas.
// Datos 100% ficticios. Referencias: RF-12 · RF-13 · RF-22 · RF-46 · RF-48 · RNF-04 · ADR-0011 · ADR-0012.
import { describe, expect, it } from 'vitest';
import { CAB_DESTINO, CAB_ORIGEN, entornoExport, filaDestino, filaOrigen, plano, volcado } from './ayudas.js';

const TS = '2026-03-15T10:00:00.000Z';
const hojaDe = (ent, nombre) => ent.libroOrigen.getSheetByName(nombre);
// exportNeto/exportBruto no devuelven nada (son puntos de entrada de menú): el resumen se lee del último registro de "logs".
const resumenDe = (ent) => plano(hojaDe(ent, 'logs').volcar().at(-1))[3];

// Plantilla ficticia de 4 personas: una cambia, una no cambia, una duplicada en el origen y una ausente en el destino.
const origenRealista = () => [
  CAB_ORIGEN,
  filaOrigen('GALA', '101', { seguro: 45.5, alim: 120, transp: 60, bruto: '2.345,67', ssEmp: 700, ssTrab: 150, irpf: 320, liquido: 1700 }),
  filaOrigen('GALA', '102', { seguro: 0, bruto: 1800, irpf: 210 }),
  filaOrigen('CERVANTES', '7', { bruto: 1500, irpf: 100 }),
  filaOrigen('CERVANTES', '7', { liquido: 1200 }),
  filaOrigen('GALA', '999', { bruto: 1 }),
];
const destinoRealista = () => [
  CAB_DESTINO,
  filaDestino('GALA', '101', { 12: 2000, 19: '15%' }),
  filaDestino('GALA', '102', { 7: 0, 12: 1800, 18: 210 }),
  filaDestino('CERVANTES', '7'),
  filaDestino('GALA', '555', { 12: 1234 }),
];

describe('recorrido feliz: menú → Export Neto', () => {
  it('la acción del menú vuelca, audita en logs con el mismo Run ID que el LOG NETOS y avisa al usuario', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: destinoRealista(), opciones: { usuario: 'gestora@gala.test' } });
    ent.ejecutarMenu('Export Neto');
    const resumen = resumenDe(ent);

    const esperado = 'Actualizados=2 | SinCambio=1 | NoEncontrados=1 | BloqueadosDuplicadoDestino=0 | DuplicadosOrigen=1 | DuplicadosDestino=0';
    expect(resumen).toBe(esperado);

    // Estado final del destino neto
    const d = ent.neto.hoja.volcar();
    expect([7, 8, 9, 12, 16, 17, 18, 20].map((c) => d[1][c - 1])).toStrictEqual([45.5, 120, 60, '2.345,67', 700, 150, 320, 1700]);
    expect(d[1][18]).toBe('15%');                                        // columna S intacta
    expect([d[2][6], d[2][11], d[2][17]]).toStrictEqual([0, 1800, 210]); // sin cambio
    expect([d[3][11], d[3][17], d[3][19]]).toStrictEqual([1500, 100, 1200]); // combina duplicado por campo
    expect(d[4][11]).toBe(1234);                                         // persona solo en destino: intacta

    // El destino bruto no se ha tocado
    expect(ent.bruto.hoja.volcar()).toStrictEqual(destinoRealista());
    expect(ent.bruto.libro.getSheetByName('LOG BRUTOS')).toBeNull();

    // Auditoría central
    expect(plano(hojaDe(ent, 'logs').volcar())).toStrictEqual([
      plano(ent.e.valor('APP_LOG_HEADERS')),
      [TS, 'Export Neto', 'OK', esperado, 'uuid-0001', 'gestora@gala.test', 0],
    ]);
    expect(hojaDe(ent, 'errores')).toBeNull();

    // LOG detallado correlacionado por Run ID
    const log = volcado(ent.neto.libro.getSheetByName('LOG NETOS'));
    expect(log[0]).toStrictEqual(plano(ent.e.valor('VINC_LOG_HEADERS')));
    expect(new Set(log.slice(1).map((f) => f[1]))).toStrictEqual(new Set(['uuid-0001']));
    expect(log.slice(1).map((f) => f[2])).toStrictEqual(['DUPLICADO_ORIGEN', 'ACTUALIZADO', 'SIN_CAMBIO', 'ACTUALIZADO', 'NO_ENCONTRADO_DESTINO', 'RESUMEN']);
    expect(log.at(-1)[8]).toBe(esperado);

    // Aviso en pantalla
    expect(ent.google.estado.alertas.at(-1)[0]).toBe(`"Export Neto" completado.\n${esperado}`);
  });

  it('el menú de Export Bruto escribe en el libro bruto, en LOG BRUTOS y con su nombre de acción', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: destinoRealista() });
    ent.ejecutarMenu('Export Bruto');
    expect(ent.bruto.hoja.volcar()[1][17]).toBe(320);
    expect(ent.neto.hoja.volcar()).toStrictEqual(destinoRealista());
    expect(ent.bruto.libro.getSheetByName('LOG BRUTOS').getLastRow()).toBeGreaterThan(1);
    expect(plano(hojaDe(ent, 'logs').volcar()[1])[1]).toBe('Export Bruto');
  });

  it('Neto y luego Bruto en la misma sesión: dos filas en logs con Run ID distintos, cada LOG con el suyo', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: destinoRealista() });
    ent.ejecutarMenu('Export Neto');
    ent.ejecutarMenu('Export Bruto');
    const logs = plano(hojaDe(ent, 'logs').volcar()).slice(1);
    expect(logs.map((f) => [f[1], f[2], f[4]])).toStrictEqual([['Export Neto', 'OK', 'uuid-0001'], ['Export Bruto', 'OK', 'uuid-0002']]);
    expect(volcado(ent.neto.libro.getSheetByName('LOG NETOS')).slice(1).every((f) => f[1] === 'uuid-0001')).toBe(true);
    expect(volcado(ent.bruto.libro.getSheetByName('LOG BRUTOS')).slice(1).every((f) => f[1] === 'uuid-0002')).toBe(true);
    expect(ent.neto.hoja.volcar()).toStrictEqual(ent.bruto.hoja.volcar()); // mismos 8 campos en ambos
  });

  it('repetir el mismo Export Neto no cambia el destino y deja todo SIN_CAMBIO (RF-22)', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: destinoRealista() });
    ent.ejecutarMenu('Export Neto');
    const tras1 = ent.neto.hoja.volcar();
    const escrituras = ent.google.estado.escrituras.filter((w) => w.hoja === 'Hoja 1').length;
    ent.ejecutarMenu('Export Neto');
    const resumen2 = resumenDe(ent);
    expect(ent.neto.hoja.volcar()).toStrictEqual(tras1);
    expect(ent.google.estado.escrituras.filter((w) => w.hoja === 'Hoja 1')).toHaveLength(escrituras);
    expect(resumen2).toMatch(/^Actualizados=0 \| SinCambio=3 \| NoEncontrados=1/);
    expect(hojaDe(ent, 'logs').getLastRow()).toBe(3);
  });

  it('un cambio de importes en el origen entre dos ejecuciones se refleja solo en lo que cambió', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: destinoRealista() });
    ent.ejecutarMenu('Export Neto');
    ent.hojaOrigen.getRange(2, 9).setValue(333); // IRPF de la persona 101
    ent.google.estado.escrituras.length = 0;
    ent.ejecutarMenu('Export Neto');
    expect(ent.google.estado.escrituras.filter((w) => w.hoja === 'Hoja 1').map((w) => w.rango)).toStrictEqual(['R2']);
    const ultimo = volcado(ent.neto.libro.getSheetByName('LOG NETOS')).filter((f) => f[2] === 'ACTUALIZADO').at(-1);
    expect(ultimo[7]).toBe('IRPF: 320→333');
  });
});

describe('recorrido con fallo: se audita, se avisa y se relanza (RF-46 · RF-48)', () => {
  it('destino sin la pestaña "Hoja 1": errores + logs ERROR + alerta + excepción, sin tocar el origen', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: null, opciones: { usuario: 'gestora@gala.test' } });
    expect(() => ent.ejecutarMenu('Export Neto')).toThrow(/No existe la pestaña destino "Hoja 1"/);

    const errores = plano(hojaDe(ent, 'errores').volcar());
    expect(errores[0]).toStrictEqual(plano(ent.e.valor('APP_ERR_HEADERS')));
    expect(errores[1].slice(0, 3)).toStrictEqual([TS, 'Export Neto', 'Pestaña no encontrada']);
    expect(errores[1][5]).toBe('uuid-0001');
    expect(errores[1][6]).toBe('gestora@gala.test');
    const logs = plano(hojaDe(ent, 'logs').volcar());
    expect(logs[1][2]).toBe('ERROR');
    expect(logs[1][4]).toBe('uuid-0001');
    expect(ent.google.estado.alertas.at(-1)[0]).toMatch(/^Error en "Export Neto":/);
    expect(volcado(ent.hojaOrigen)).toStrictEqual(plano(origenRealista()));
  });

  it('cabecera de datos renombrada en el origen: tipo "Cabecera no encontrada" y destino intacto', () => {
    const cab = CAB_ORIGEN.map((c) => (c === 'IRPF' ? 'RETENCION' : c));
    const ent = entornoExport({ origen: [cab, ...origenRealista().slice(1)], destino: destinoRealista() });
    expect(() => ent.ejecutarMenu('Export Neto')).toThrow(/IRPF/);
    expect(plano(hojaDe(ent, 'errores').volcar()[1])[2]).toBe('Cabecera no encontrada');
    expect(ent.neto.hoja.volcar()).toStrictEqual(destinoRealista());
  });

  it('libro destino inaccesible (ID desconocido): queda registrado y no deja datos a medias', () => {
    const ent = entornoExport({ origen: origenRealista(), sinLibroNeto: true });
    expect(() => ent.ejecutarMenu('Export Neto')).toThrow();
    expect(hojaDe(ent, 'errores').getLastRow()).toBe(2);
    expect(ent.google.estado.escrituras.filter((w) => w.hoja === 'Hoja 1')).toHaveLength(0);
  });

  it('otra ejecución en curso (bloqueo ocupado): tipo "Bloqueo de ejecución", nada escrito en el destino', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: destinoRealista() });
    ent.google.estado.bloqueoOcupado = true;
    expect(() => ent.ejecutarMenu('Export Neto')).toThrow('Se agotó el tiempo de espera del bloqueo.');
    expect(plano(hojaDe(ent, 'errores').volcar()[1])[2]).toBe('Bloqueo de ejecución');
    expect(ent.neto.hoja.volcar()).toStrictEqual(destinoRealista());
    // Al liberarse el bloqueo, un reintento funciona y las dos ejecuciones quedan auditadas
    ent.google.estado.bloqueoOcupado = false;
    ent.ejecutarMenu('Export Neto');
    expect(plano(hojaDe(ent, 'logs').volcar()).slice(1).map((f) => f[2])).toStrictEqual(['ERROR', 'OK']);
  });

  it('el fallo del registro (sin hoja "logs" creable) no impide que el error llegue al usuario', () => {
    const ent = entornoExport({ origen: null });
    ent.libroOrigen.insertSheet('logs'); // ya existe vacía: se reutiliza
    expect(() => ent.ejecutarMenu('Export Neto')).toThrow(/No existe la pestaña origen/);
    expect(hojaDe(ent, 'logs').getLastRow()).toBe(2);
  });

  it('si el aviso en pantalla no está disponible (ejecución sin interfaz) la acción termina igualmente', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: destinoRealista(), opciones: { respuestas: { alert: () => { throw new Error('sin UI'); } } } });
    expect(() => ent.ejecutarMenu('Export Neto')).not.toThrow();
    expect(ent.google.estado.logs.some((l) => l.includes('completado'))).toBe(true);
  });
});

describe('recorrido con duplicados en el destino: el resultado es parcial pero seguro', () => {
  it('bloquea solo la clave repetida y vuelca el resto', () => {
    const destino = [CAB_DESTINO, filaDestino('GALA', '101'), filaDestino('GALA', '102'), filaDestino('GALA', '102')];
    const ent = entornoExport({ origen: origenRealista(), destino });
    ent.ejecutarMenu('Export Neto');
    const resumen = resumenDe(ent);
    expect(resumen).toMatch(/BloqueadosDuplicadoDestino=2/);
    expect(resumen).toMatch(/DuplicadosDestino=1/);
    const d = ent.neto.hoja.volcar();
    expect(d[1][17]).toBe(320);                  // 101 sí
    expect([d[2][17], d[3][17]]).toStrictEqual(['', '']); // 102 bloqueada
  });
});

describe('confirmación humana antes de escribir (RNF-05 · RF-17 · RF-18)', () => {
  it.fails('DEFECTO (RNF-05): Export Neto debería pedir confirmación (OK/Cancelar) ANTES de escribir; hoy escribe directamente y solo avisa al terminar', () => {
    const ent = entornoExport({ origen: origenRealista(), destino: destinoRealista(), opciones: { respuestas: { alert: () => 'CANCEL' } } });
    ent.ejecutarMenu('Export Neto');
    expect(ent.neto.hoja.volcar()).toStrictEqual(destinoRealista()); // si el usuario cancela, el destino no cambia
  });
});
