// Reglas puras del servicio VAP_Pagos: huella, importes, cruce, informe y token. Sin Google.
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { cargarPagos, ibanDePrueba } from './cargar.js';

const { llamar, valor } = cargarPagos();
const hmac = (texto, clave) => createHmac('sha256', clave).update(texto).digest('hex');
const IBAN_A = ibanDePrueba(1);
const IBAN_B = ibanDePrueba(2);
const IBAN_C = ibanDePrueba(3);

describe('dominio-huella · RF-86 · RF-87 · RF-98', () => {
  it('la huella es HMAC-SHA256 de la cuenta normalizada con la clave', () => {
    const espaciado = IBAN_A.replace(/(.{4})/g, '$1 ').toLowerCase();
    expect(llamar('huellaDeCuenta_', espaciado, 'clave', hmac)).toBe(hmac(IBAN_A, 'clave'));
  });

  it('RF-87 · no depende de la persona ni de la empresa: solo de la cuenta y la clave', () => {
    expect(llamar('huellaDeCuenta_', IBAN_A, 'k', hmac)).toBe(llamar('huellaDeCuenta_', IBAN_A, 'k', hmac));
    expect(llamar('huellaDeCuenta_', IBAN_A, 'k', hmac)).not.toBe(llamar('huellaDeCuenta_', IBAN_A, 'otra', hmac));
  });

  it('sin clave o con una cuenta inválida se niega, y el error NO contiene la cuenta (RNF-19)', () => {
    expect(() => llamar('huellaDeCuenta_', IBAN_A, '', hmac)).toThrow('Falta la clave');
    const mala = `${IBAN_A.slice(0, -1)}${IBAN_A.endsWith('0') ? '1' : '0'}`;
    try {
      llamar('huellaDeCuenta_', mala, 'k', hmac);
      expect.unreachable();
    } catch (error) {
      expect(error.message).not.toContain(mala);
      expect(error.message).toContain('no es válida');
    }
  });

  it('RF-98 · los últimos 4 dígitos son los de la cuenta', () => {
    expect(llamar('ultimosDigitos_', IBAN_A)).toBe(IBAN_A.slice(-4));
  });
});

describe('dominio-importes · RF-99', () => {
  it.each([
    ['1.234,56', 123456],
    ['1234,56', 123456],
    ['1234.56', 123456],
    [1234.56, 123456],
    ['0,10', 10],
    ['10,10 €', 1010],
  ])('«%s» son %i céntimos', (texto, centimos) => expect(llamar('aCentimos_', texto)).toBe(centimos));

  it('lo que no es un importe no se convierte en cero', () => {
    for (const malo of ['', 'abc', '12,3,4x', null]) expect(Number.isNaN(llamar('aCentimos_', malo))).toBe(true);
  });

  it('los céntimos se comparan como enteros, con tolerancia explícita', () => {
    expect(llamar('importesCoinciden_', 10, 10, 0)).toBe(true);
    expect(llamar('importesCoinciden_', 10, 11, 0)).toBe(false);
    expect(llamar('importesCoinciden_', 10, 11, 1)).toBe(true);
    expect(llamar('importesCoinciden_', NaN, 11, 99)).toBe(false);
  });

  it('formatearCentimos_ usa coma decimal', () => {
    expect(llamar('formatearCentimos_', 123456)).toBe('1234,56');
    expect(llamar('formatearCentimos_', 5)).toBe('0,05');
  });
});

describe('dominio-cruce · RF-88 · RF-91 · RF-99', () => {
  const huellaDe = (iban) => hmac(iban, 'clave-cruce');
  const huellas = [
    { idPersonal: 'UNO_1', huella: huellaDe(IBAN_A), ultimos4: IBAN_A.slice(-4) },
    { idPersonal: 'UNO_2', huella: huellaDe(IBAN_B), ultimos4: IBAN_B.slice(-4) },
    { idPersonal: 'VIEJA_9', huella: huellaDe(IBAN_C), ultimos4: IBAN_C.slice(-4) },
  ];
  const contexto = { periodo: '2026-11', empresa: 'Uno', fuente: 'Vinculación', toleranciaCentimos: 0, huellaDe };
  const cruzar = (pagos, esperados, hs = huellas) => plano(llamar('cruzarPagos_', pagos, esperados, hs, contexto));
  const pago = (iban, importe, extra = {}) => ({
    nombre: 'APELLIDO, NOMBRE',
    iban,
    importe,
    referencia: 'REF1',
    banco: 'BANCOX',
    fichero: 'f.xml',
    ...extra,
  });

  it('un pago cuya cuenta e importe cuadran es Coincidente y no lleva observaciones ni nombre', () => {
    const [fila] = cruzar([pago(IBAN_A, '100,00')], [{ idPersonal: 'UNO_1', importe: '100,00' }]);
    expect(fila).toMatchObject({
      parte: 'coincide',
      estado: 'Coincidente',
      idPersonal: 'UNO_1',
      observaciones: '',
      nombreBanco: '',
      huella: '',
    });
  });

  it('importe distinto: Incorrecto con los dos importes, la referencia, el fichero y la fuente', () => {
    const [fila] = cruzar([pago(IBAN_A, '100,00')], [{ idPersonal: 'UNO_1', importe: '90,00' }]);
    expect(fila.estado).toBe('Incorrecto');
    expect(fila.observaciones).toContain('100,00');
    expect(fila.observaciones).toContain('90,00');
    expect(fila.observaciones).toContain('REF1');
    expect(fila.observaciones).toContain('f.xml');
    expect(fila.observaciones).toContain('Vinculación');
  });

  it('cuenta que no existe en VAP_Pagos: PARTE 2, con nombre, huella, últimos 4 y banco, siempre Incorrecto', () => {
    const [fila] = cruzar([pago(ibanDePrueba(77), '50,00')], []);
    expect(fila).toMatchObject({
      parte: 'no-existe',
      estado: 'Incorrecto',
      nombreBanco: 'APELLIDO, NOMBRE',
      banco: 'BANCOX',
    });
    expect(fila.huella).toBe(huellaDe(ibanDePrueba(77)));
    expect(fila.ultimos4).toBe(ibanDePrueba(77).slice(-4));
    expect(fila.observaciones).toContain('no registrada');
    expect(JSON.stringify(fila)).not.toContain(ibanDePrueba(77)); // ni la cuenta entera (RNF-19)
  });

  it('una cuenta inválida no se pierde: queda como Incorrecto en la parte 2, sin huella', () => {
    const [fila] = cruzar([pago('ES00', '50,00')], []);
    expect(fila).toMatchObject({ parte: 'no-existe', estado: 'Incorrecto', huella: '', ultimos4: '' });
    expect(fila.observaciones).toContain('no es un IBAN válido');
  });

  it('una persona esperada sin pago en el banco es Incorrecto (no se da por buena en silencio)', () => {
    const filas = cruzar([], [{ idPersonal: 'UNO_1', importe: '100,00' }]);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ idPersonal: 'UNO_1', estado: 'Incorrecto' });
    expect(filas[0].observaciones).toContain('sin pago');
  });

  it('solo cuenta entre las ACTIVAS: una cuenta de una persona de baja o de otra empresa es Incorrecto', () => {
    const [fila] = cruzar([pago(IBAN_C, '10,00')], [{ idPersonal: 'UNO_1', importe: '100,00' }]);
    expect(fila).toMatchObject({ estado: 'Incorrecto', idPersonal: 'VIEJA_9' });
    expect(fila.observaciones).toContain('no figura entre las esperadas');
  });

  it('una cuenta compartida por dos personas activas es ambigua y no se asigna a ninguna', () => {
    const compartida = [...huellas, { idPersonal: 'UNO_3', huella: huellaDe(IBAN_A), ultimos4: IBAN_A.slice(-4) }];
    const filas = cruzar(
      [pago(IBAN_A, '100,00')],
      [
        { idPersonal: 'UNO_1', importe: '100,00' },
        { idPersonal: 'UNO_3', importe: '100,00' },
      ],
      compartida,
    );
    const delPago = filas.filter((f) => f.observaciones.includes('ambigua'));
    expect(delPago).toHaveLength(1);
    expect(delPago[0].idPersonal).toBe('');
  });

  it('dos pagos a la misma persona se marcan para revisión', () => {
    const filas = cruzar([pago(IBAN_A, '60,00'), pago(IBAN_A, '40,00')], [{ idPersonal: 'UNO_1', importe: '100,00' }]);
    expect(filas.every((f) => f.estado === 'Incorrecto' && f.observaciones.includes('2 pagos'))).toBe(true);
  });

  it('cada pago y cada esperado dejan exactamente UNA fila', () => {
    const filas = cruzar(
      [pago(IBAN_A, '100,00'), pago(ibanDePrueba(77), '5,00')],
      [
        { idPersonal: 'UNO_1', importe: '100,00' },
        { idPersonal: 'UNO_2', importe: '70,00' },
      ],
    );
    expect(filas).toHaveLength(3);
  });
});

describe('dominio-informe · RF-91 · RF-92 · RF-93', () => {
  const fila = (extra = {}) => ({ filaId: 'f1', estado: 'Incorrecto', empresa: 'Uno', resolucion: '', ...extra });

  it('subsanar exige una fila Incorrecto, una resolución válida y un motivo', () => {
    expect(plano(llamar('validarSubsanacion_', fila(), { resolucion: 'aceptado', motivo: 'ok' }))).toEqual([]);
    expect(
      llamar('validarSubsanacion_', fila({ estado: 'Coincidente' }), { resolucion: 'aceptado', motivo: 'ok' }),
    ).toHaveLength(1);
    expect(llamar('validarSubsanacion_', fila(), { resolucion: 'inventada', motivo: 'ok' })).toHaveLength(1);
    expect(llamar('validarSubsanacion_', fila(), { resolucion: 'aceptado', motivo: ' ' })).toHaveLength(1);
    expect(llamar('validarSubsanacion_', fila(), { resolucion: 'asignado', motivo: 'm' })).toHaveLength(1);
    expect(plano(llamar('validarSubsanacion_', null, {}))).toEqual(['No existe esa fila del informe.']);
  });

  it('ida y vuelta entre la fila lógica y los valores de la hoja, en el orden de las columnas', () => {
    const original = plano(
      llamar(
        'valoresAFilaDeInforme_',
        valor('COLUMNAS_INFORME').map((c) => `v:${c}`),
      ),
    );
    const valores = plano(llamar('filaDeInformeAValores_', original));
    expect(valores).toEqual(valor('COLUMNAS_INFORME').map((c) => `v:${c}`));
  });

  it('la fusión exige que no falte ninguna empresa y cuenta lo que sigue sin resolver', () => {
    const filas = [
      fila({ empresa: 'Uno' }),
      fila({ empresa: 'Uno', estado: 'Coincidente' }),
      fila({ empresa: 'Dos', resolucion: 'aceptado' }),
    ];
    const completo = plano(llamar('resumenDeInforme_', filas, ['Uno', 'Dos']));
    expect(completo).toMatchObject({ puedeFusionarse: true, faltan: [], sinResolver: 1 });
    const incompleto = plano(llamar('resumenDeInforme_', filas, ['Uno', 'Dos', 'Tres']));
    expect(incompleto).toMatchObject({ puedeFusionarse: false, faltan: ['Tres'] });
    expect(plano(llamar('resumenDeInforme_', [], ['Uno'])).puedeFusionarse).toBe(false);
  });
});

describe('dominio-acceso · el token del servicio · RNF-21', () => {
  it('solo vale el token exacto, y nunca uno vacío', () => {
    expect(llamar('tokenValido_', 'abc', 'abc')).toBe(true);
    expect(llamar('tokenValido_', 'abd', 'abc')).toBe(false);
    expect(llamar('tokenValido_', 'abcd', 'abc')).toBe(false);
    expect(llamar('tokenValido_', '', '')).toBe(false);
    expect(llamar('tokenValido_', undefined, 'abc')).toBe(false);
  });
});
