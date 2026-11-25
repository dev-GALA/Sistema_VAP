// Casos de uso del servicio VAP_Pagos con las dependencias inyectadas, sin Google (ADR-0019).
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { cargarPagos, DNI_1, DNI_2, ibanDePrueba, USUARIO_PRUEBA } from './cargar.js';

const { llamar } = cargarPagos();
const IBAN_A = ibanDePrueba(1);
const IBAN_B = ibanDePrueba(2);

/** Dependencias falsas con las huellas y el informe en memoria. */
function dependencias({ huellas = [], informe = {} } = {}) {
  let n = 0;
  const estado = { huellas: [...huellas], informe: { ...informe }, subsanaciones: [], fusiones: [] };
  return {
    estado,
    clave: () => 'clave',
    calcularHmacHex: (texto, clave) => createHmac('sha256', clave).update(texto).digest('hex'),
    ahora: () => '2026-11-17 12:30',
    nuevoId: () => `id-${++n}`,
    conBloqueo: (accion) => accion(),
    leerHuellas: () => estado.huellas,
    guardarHuella: (fila) => {
      estado.huellas = estado.huellas.filter((h) => h.idPersonal !== fila.idPersonal).concat(fila);
    },
    leerInforme: (periodo) => estado.informe[periodo] || [],
    reemplazarInforme: (periodo, empresa, fuente, filas) => {
      const resto = (estado.informe[periodo] || []).filter((f) => !(f.empresa === empresa && f.fuente === fuente));
      estado.informe[periodo] = resto.concat(filas);
    },
    actualizarFilaInforme: (periodo, fila) => {
      estado.informe[periodo] = estado.informe[periodo].map((f) => (f.filaId === fila.filaId ? fila : f));
    },
    anadirSubsanacion: (r) => estado.subsanaciones.push(r),
    anadirFusion: (r) => estado.fusiones.push(r),
  };
}
const huellaReal = (iban) => createHmac('sha256', 'clave').update(iban).digest('hex');
const pago = (iban, importe) => ({
  nombre: 'APELLIDO, NOMBRE',
  iban,
  importe,
  referencia: 'R',
  banco: 'B',
  fichero: 'f.csv',
});

const persona = (idPersonal, dni, iban, extra = {}) => ({ idPersonal, dni, iban, usuario: USUARIO_PRUEBA, ...extra });

describe('guardarCuenta_ · RF-86 · RF-98 · RF-102', () => {
  it('guarda la huella, los últimos 4, el DNI y quién la guardó, y devuelve solo los últimos 4 (nunca la cuenta)', () => {
    const d = dependencias();
    const r = plano(llamar('guardarCuenta_', d, persona('UNO_1', DNI_1, IBAN_A)));
    expect(r).toEqual({ idPersonal: 'UNO_1', ultimos4: IBAN_A.slice(-4), avisos: [] });
    expect(d.estado.huellas[0]).toMatchObject({
      idPagos: '1',
      dni: DNI_1,
      idPersonal: 'UNO_1',
      huella: huellaReal(IBAN_A),
      ultimos4: IBAN_A.slice(-4),
      actualizadoPor: USUARIO_PRUEBA,
    });
    expect(JSON.stringify(d.estado)).not.toContain(IBAN_A);
  });

  it('normaliza el DNI al guardarlo (mayúsculas, sin espacios ni guiones)', () => {
    const d = dependencias();
    llamar('guardarCuenta_', d, persona('UNO_1', ' 1234-5678z ', IBAN_A));
    expect(d.estado.huellas[0].dni).toBe(DNI_1);
  });

  it('el número id_pagos es correlativo y no se reutiliza', () => {
    const d = dependencias();
    llamar('guardarCuenta_', d, persona('UNO_1', DNI_1, IBAN_A));
    llamar('guardarCuenta_', d, persona('UNO_2', DNI_2, IBAN_B));
    expect(d.estado.huellas.map((h) => h.idPagos)).toEqual(['1', '2']);
  });

  it('un cambio de cuenta sustituye la huella: la antigua deja de valer', () => {
    const d = dependencias();
    llamar('guardarCuenta_', d, persona('UNO_1', DNI_1, IBAN_A));
    llamar('guardarCuenta_', d, persona('UNO_1', DNI_1, IBAN_B));
    expect(d.estado.huellas.map((h) => h.huella)).toEqual([huellaReal(IBAN_B)]);
  });

  it('un mismo DNI con dos ids (dos empresas) deja dos filas con la MISMA huella y avisa', () => {
    const d = dependencias();
    llamar('guardarCuenta_', d, persona('GALA_1', DNI_1, IBAN_A));
    const r = plano(llamar('guardarCuenta_', d, persona('CERVANTES_9', DNI_1, IBAN_A)));
    expect(d.estado.huellas.map((h) => [h.idPagos, h.idPersonal, h.huella])).toEqual([
      ['1', 'GALA_1', huellaReal(IBAN_A)],
      ['2', 'CERVANTES_9', huellaReal(IBAN_A)],
    ]);
    expect(r.avisos).toHaveLength(1);
    expect(r.avisos[0]).toContain('GALA_1');
    expect(r.avisos[0]).toContain('CERVANTES_9');
    expect(r.avisos[0]).toContain(DNI_1);
  });

  it('si ese DNI cambia de cuenta, se actualizan TODAS sus filas a la vez', () => {
    const d = dependencias();
    llamar('guardarCuenta_', d, persona('GALA_1', DNI_1, IBAN_A));
    llamar('guardarCuenta_', d, persona('CERVANTES_9', DNI_1, IBAN_A));
    llamar('guardarCuenta_', d, persona('GALA_1', DNI_1, IBAN_B));
    expect(d.estado.huellas.map((h) => h.huella)).toEqual([huellaReal(IBAN_B), huellaReal(IBAN_B)]);
  });

  it('un id que ya consta con OTRO DNI se rechaza y no escribe nada', () => {
    const d = dependencias();
    llamar('guardarCuenta_', d, persona('GALA_1', DNI_1, IBAN_A));
    expect(() => llamar('guardarCuenta_', d, persona('GALA_1', DNI_2, IBAN_B))).toThrow('no puede tener dos DNI');
    expect(d.estado.huellas).toHaveLength(1);
    expect(d.estado.huellas[0].dni).toBe(DNI_1);
  });

  it('el conflicto da toda la información para resolverlo: id, los dos DNI, la fila, la cuenta y quién la guardó', () => {
    const d = dependencias();
    llamar('guardarCuenta_', d, persona('GALA_1', DNI_1, IBAN_A));
    let mensaje = '';
    try {
      llamar('guardarCuenta_', d, persona('GALA_1', DNI_2, IBAN_B));
    } catch (error) {
      mensaje = error.message;
    }
    for (const dato of ['GALA_1', DNI_1, DNI_2, 'fila 1', IBAN_A.slice(-4), USUARIO_PRUEBA, 'No se ha guardado nada']) {
      expect(mensaje).toContain(dato);
    }
    expect(mensaje).not.toContain(IBAN_A);
    expect(mensaje).not.toContain(IBAN_B);
  });

  it('el aviso dice si el id nuevo llega con la misma cuenta o con otra', () => {
    const d = dependencias();
    llamar('guardarCuenta_', d, persona('GALA_1', DNI_1, IBAN_A));
    const igual = plano(llamar('guardarCuenta_', d, persona('CERVANTES_9', DNI_1, IBAN_A)));
    expect(igual.avisos[0]).toContain('con la misma cuenta');
    const otra = plano(llamar('guardarCuenta_', d, persona('LOGYFOR_3', DNI_1, IBAN_B)));
    expect(otra.avisos[0]).toContain('cuenta distinta');
    expect(otra.avisos[0]).toContain(IBAN_B.slice(-4));
    expect(otra.avisos[0]).not.toContain(IBAN_B);
  });

  it('sin identificador, con DNI o cuenta inválidos o sin usuario se niega y no escribe', () => {
    const d = dependencias();
    expect(() => llamar('guardarCuenta_', d, persona('', DNI_1, IBAN_A))).toThrow('identificador');
    expect(() => llamar('guardarCuenta_', d, persona('UNO_1', '', IBAN_A))).toThrow('DNI');
    expect(() => llamar('guardarCuenta_', d, persona('UNO_1', '050986557L', IBAN_A))).toThrow('DNI');
    expect(() => llamar('guardarCuenta_', d, persona('UNO_1', DNI_1, 'ES00'))).toThrow('no es válida');
    expect(() => llamar('guardarCuenta_', d, persona('UNO_1', DNI_1, IBAN_A, { usuario: '' }))).toThrow('quién');
    expect(d.estado.huellas).toEqual([]);
  });
});

describe('guardarCuentas_ · carga inicial · RF-89', () => {
  it('cada cuenta por separado: una mala no impide las demás, y el error no lleva la cuenta', () => {
    const d = dependencias();
    const r = plano(
      llamar('guardarCuentas_', d, {
        usuario: USUARIO_PRUEBA,
        cuentas: [
          { idPersonal: 'A_1', dni: DNI_1, iban: IBAN_A },
          { idPersonal: 'A_2', dni: DNI_2, iban: 'ES00' },
          { idPersonal: 'A_3', dni: '11111111H', iban: IBAN_B },
        ],
      }),
    );
    expect(r.map((x) => x.estado)).toEqual(['guardada', 'error', 'guardada']);
    expect(JSON.stringify(r)).not.toContain('ES00');
    expect(d.estado.huellas).toHaveLength(2);
  });

  it('los avisos de cada cuenta salen en su resultado', () => {
    const d = dependencias();
    const r = plano(
      llamar('guardarCuentas_', d, {
        usuario: USUARIO_PRUEBA,
        cuentas: [
          { idPersonal: 'GALA_1', dni: DNI_1, iban: IBAN_A },
          { idPersonal: 'CERVANTES_9', dni: DNI_1, iban: IBAN_A },
        ],
      }),
    );
    expect(r[0].avisos).toEqual([]);
    expect(r[1].avisos).toHaveLength(1);
  });

  it('rechaza una lista vacía o demasiado larga', () => {
    const d = dependencias();
    expect(() => llamar('guardarCuentas_', d, { cuentas: [] })).toThrow('Falta');
    expect(() => llamar('guardarCuentas_', d, { cuentas: new Array(201).fill({}) })).toThrow('máximo');
  });
});

describe('cruzar_ · RF-91 · RF-92 · RF-94', () => {
  const huellas = [{ idPersonal: 'UNO_1', huella: huellaReal(IBAN_A), ultimos4: IBAN_A.slice(-4), actualizadoEn: 'x' }];
  const datos = (extra = {}) => ({
    periodo: '2026-11',
    empresa: 'Uno',
    fuente: 'Vinculación',
    pagos: [pago(IBAN_A, '100,00')],
    esperados: [{ idPersonal: 'UNO_1', importe: '100,00' }],
    ...extra,
  });

  it('guarda las filas del informe del mes y devuelve el resumen', () => {
    const d = dependencias({ huellas });
    expect(plano(llamar('cruzar_', d, datos()))).toMatchObject({
      periodo: '2026-11',
      empresa: 'Uno',
      total: 1,
      coincidentes: 1,
      incorrectos: 0,
    });
    expect(d.estado.informe['2026-11'][0].filaId).toBe('id-1');
  });

  it('repetir el cruce de una empresa sustituye sus filas y no toca las de otra', () => {
    const d = dependencias({ huellas });
    llamar('cruzar_', d, datos());
    llamar('cruzar_', d, datos({ empresa: 'Dos', esperados: [] }));
    llamar('cruzar_', d, datos());
    expect(d.estado.informe['2026-11'].filter((f) => f.empresa === 'Uno')).toHaveLength(1);
    expect(d.estado.informe['2026-11'].filter((f) => f.empresa === 'Dos')).toHaveLength(1);
  });

  it('valida el periodo, la empresa y los pagos', () => {
    const d = dependencias({ huellas });
    expect(() => llamar('cruzar_', d, datos({ periodo: '2026-13' }))).toThrow('AAAA-MM');
    expect(() => llamar('cruzar_', d, datos({ empresa: '' }))).toThrow('la empresa');
    expect(() => llamar('cruzar_', d, datos({ pagos: [] }))).toThrow('los pagos');
    expect(() => llamar('cruzar_', d, datos({ pagos: new Array(501).fill({}) }))).toThrow('máximo');
  });
});

describe('informe_ · quien consulta no recibe la huella', () => {
  it('filtra por empresa y vacía la huella de las filas', () => {
    const d = dependencias({
      informe: {
        '2026-11': [
          { filaId: 'a', empresa: 'Uno', huella: 'secreta' },
          { filaId: 'b', empresa: 'Dos', huella: 'secreta' },
        ],
      },
    });
    const r = plano(llamar('informe_', d, { periodo: '2026-11', empresa: 'Uno' }));
    expect(r).toHaveLength(1);
    expect(JSON.stringify(r)).not.toContain('secreta');
  });
});

describe('subsanar_ · RF-93', () => {
  const incorrecta = { filaId: 'f1', estado: 'Incorrecto', empresa: 'Uno', resolucion: '', observaciones: 'original' };

  it('anota el historial y la resolución SIN borrar el resultado original', () => {
    const d = dependencias({ informe: { '2026-11': [incorrecta] } });
    llamar('subsanar_', d, {
      periodo: '2026-11',
      filaId: 'f1',
      resolucion: 'aceptado',
      motivo: 'Redondeo conocido',
      usuario: 'sara@gala.test',
    });
    expect(d.estado.subsanaciones).toHaveLength(1);
    expect(d.estado.informe['2026-11'][0]).toMatchObject({
      estado: 'Incorrecto',
      observaciones: 'original',
      resolucion: 'aceptado',
      resueltoPor: 'sara@gala.test',
      motivoResolucion: 'Redondeo conocido',
    });
  });

  it('anota el id_pagos de la persona afectada, y lo deja vacío si el pago no tiene persona (Parte 2)', () => {
    const huellas = [{ idPagos: '7', dni: DNI_1, idPersonal: 'UNO_1', huella: 'h', ultimos4: '1234' }];
    const informe = {
      '2026-11': [
        { ...incorrecta, filaId: 'con', idPersonal: 'UNO_1' },
        { ...incorrecta, filaId: 'sin', idPersonal: '' },
      ],
    };
    const d = dependencias({ huellas, informe });
    for (const filaId of ['con', 'sin']) {
      llamar('subsanar_', d, { periodo: '2026-11', filaId, resolucion: 'aceptado', motivo: 'x', usuario: 'u' });
    }
    expect(d.estado.subsanaciones.map((r) => [r.filaId, r.idPagos])).toEqual([
      ['con', '7'],
      ['sin', ''],
    ]);
  });

  it('no subsana una fila Coincidente ni sin motivo', () => {
    const d = dependencias({ informe: { '2026-11': [{ ...incorrecta, estado: 'Coincidente' }] } });
    expect(() =>
      llamar('subsanar_', d, { periodo: '2026-11', filaId: 'f1', resolucion: 'aceptado', motivo: 'x', usuario: 'u' }),
    ).toThrow('Solo se pueden subsanar');
    expect(d.estado.subsanaciones).toEqual([]);
  });
});

describe('fusionar_ · RF-92', () => {
  const informe = {
    '2026-11': [
      { empresa: 'Uno', estado: 'Coincidente', resolucion: '' },
      { empresa: 'Dos', estado: 'Incorrecto', resolucion: '' },
    ],
  };

  it('fusiona cuando están todas las empresas y deja constancia con lo que queda sin resolver', () => {
    const d = dependencias({ informe });
    const r = plano(
      llamar('fusionar_', d, { periodo: '2026-11', empresas: ['Uno', 'Dos'], usuario: 'sara@gala.test' }),
    );
    expect(r.puedeFusionarse).toBe(true);
    expect(d.estado.fusiones[0]).toMatchObject({ periodo: '2026-11', empresas: 2, sinResolver: 1 });
  });

  it('se niega si falta una empresa y no deja constancia', () => {
    const d = dependencias({ informe });
    expect(() =>
      llamar('fusionar_', d, { periodo: '2026-11', empresas: ['Uno', 'Dos', 'Tres'], usuario: 'u' }),
    ).toThrow('Tres');
    expect(d.estado.fusiones).toEqual([]);
  });
});

describe('maestroDePagos_ · RF-96', () => {
  it('devuelve identificador, últimos 4 y fecha; la huella no sale', () => {
    const d = dependencias({
      huellas: [{ idPersonal: 'UNO_1', huella: 'secreta', ultimos4: '0001', actualizadoEn: 'x' }],
    });
    const r = plano(llamar('maestroDePagos_', d));
    expect(r).toEqual([{ idPersonal: 'UNO_1', ultimos4: '0001', actualizadoEn: 'x' }]);
  });
});

describe('atenderLlamada_', () => {
  it('una acción desconocida no se ejecuta, ni siquiera las heredadas de Object', () => {
    const d = dependencias();
    expect(plano(llamar('atenderLlamada_', d, 'noExiste', {}))).toEqual({ ok: false, error: 'Acción desconocida.' });
    expect(plano(llamar('atenderLlamada_', d, 'constructor', {}))).toEqual({ ok: false, error: 'Acción desconocida.' });
  });
  it('un error del caso de uso vuelve como { ok: false } sin lanzar', () => {
    expect(plano(llamar('atenderLlamada_', dependencias(), 'cruzar', {})).ok).toBe(false);
  });
});

describe('resumen_ · RF-92', () => {
  it('dice qué empresas faltan sin escribir nada', () => {
    const d = dependencias({ informe: { '2026-11': [{ empresa: 'Uno', estado: 'Coincidente', resolucion: '' }] } });
    const r = plano(llamar('resumen_', d, { periodo: '2026-11', empresas: ['Uno', 'Dos'] }));
    expect(r).toMatchObject({ puedeFusionarse: false, faltan: ['Dos'] });
    expect(d.estado.fusiones).toEqual([]);
  });
});
