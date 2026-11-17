// Integración del servicio VAP_Pagos: el código real contra el Google falso (hojas en memoria). ADR-0019.
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import {
  CLAVE_PRUEBA,
  cargarPagos,
  ID_LIBRO_PAGOS,
  ibanDePrueba,
  llamarServicio,
  prepararPagos,
  TOKEN_PRUEBA,
} from './cargar.js';

const IBAN_A = ibanDePrueba(1);
const IBAN_B = ibanDePrueba(2);
const IBAN_NUEVO = ibanDePrueba(99);

const arrancar = (opciones) => {
  const entorno = cargarPagos();
  prepararPagos(entorno, opciones);
  return entorno;
};
const hoja = (entorno, nombre) =>
  plano(entorno.google.estado.libros.get(ID_LIBRO_PAGOS).getSheetByName(nombre).volcar());
const todoElLibro = (entorno) =>
  JSON.stringify(
    entorno.google.estado.libros
      .get(ID_LIBRO_PAGOS)
      .getSheets()
      .map((h) => h.volcar()),
  );

describe('doPost · la puerta del servicio · RNF-21', () => {
  it('sin token, o con uno distinto, responde «No autorizado» y no ejecuta nada', () => {
    const entorno = arrancar();
    for (const token of [null, '', 'otro']) {
      expect(llamarServicio(entorno, 'guardarCuenta', { idPersonal: 'A_1', iban: IBAN_A }, token)).toEqual({
        ok: false,
        error: 'No autorizado.',
      });
    }
    expect(hoja(entorno, 'huellas')).toHaveLength(1);
  });

  it('si el servicio no tiene token configurado, NO deja pasar a nadie (ni con token vacío)', () => {
    const entorno = arrancar({ token: false });
    expect(llamarServicio(entorno, 'maestro', {}, '').ok).toBe(false);
    expect(llamarServicio(entorno, 'maestro', {}, TOKEN_PRUEBA).ok).toBe(false);
  });

  it('un cuerpo que no es JSON se rechaza con un mensaje genérico', () => {
    const entorno = arrancar();
    const salida = entorno.llamar('doPost', { postData: { contents: 'esto no es json' } });
    expect(JSON.parse(salida.getContent())).toEqual({ ok: false, error: 'Petición no válida.' });
  });

  it('responde en JSON', () => {
    const entorno = arrancar();
    const salida = entorno.llamar('doPost', {
      postData: { contents: JSON.stringify({ token: TOKEN_PRUEBA, accion: 'maestro' }) },
    });
    expect(salida.getMimeType()).toBe('JSON');
  });

  it('sin la clave de la huella se niega y lo dice, sin escribir nada', () => {
    const entorno = arrancar({ clave: false });
    const r = llamarServicio(entorno, 'guardarCuenta', { idPersonal: 'A_1', iban: IBAN_A });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('CLAVE_HUELLA');
    expect(hoja(entorno, 'huellas')).toHaveLength(1);
  });
});

describe('guardar cuentas · RF-86 · RF-98 · RNF-19', () => {
  it('escribe la huella (HMAC-SHA256 en hexadecimal) y los últimos 4, y la cuenta no está en NINGUNA hoja', () => {
    const entorno = arrancar();
    llamarServicio(entorno, 'guardarCuenta', { idPersonal: 'UNO_1', iban: IBAN_A });
    const [, fila] = hoja(entorno, 'huellas');
    expect(fila[0]).toBe('UNO_1');
    expect(fila[1]).toMatch(/^[0-9a-f]{64}$/);
    expect(fila[2]).toBe(IBAN_A.slice(-4));
    expect(todoElLibro(entorno)).not.toContain(IBAN_A);
    expect(JSON.stringify(entorno.google.estado.logs)).not.toContain(IBAN_A);
  });

  it('un cambio de cuenta actualiza la fila de la persona en vez de añadir otra', () => {
    const entorno = arrancar();
    llamarServicio(entorno, 'guardarCuenta', { idPersonal: 'UNO_1', iban: IBAN_A });
    llamarServicio(entorno, 'guardarCuenta', { idPersonal: 'UNO_1', iban: IBAN_B });
    const filas = hoja(entorno, 'huellas');
    expect(filas).toHaveLength(2);
    expect(filas[1][2]).toBe(IBAN_B.slice(-4));
  });

  it('la misma cuenta da la misma huella en dos personas (cambio de empresa: baja y alta)', () => {
    const entorno = arrancar();
    llamarServicio(entorno, 'guardarCuentas', {
      cuentas: [
        { idPersonal: 'VIEJA_1', iban: IBAN_A },
        { idPersonal: 'NUEVA_1', iban: IBAN_A },
      ],
    });
    const filas = hoja(entorno, 'huellas');
    expect(filas[1][1]).toBe(filas[2][1]);
  });

  it('los códigos se guardan como TEXTO para que Sheets no pierda el cero inicial (columna formateada)', () => {
    const entorno = arrancar();
    llamarServicio(entorno, 'guardarCuenta', { idPersonal: 'UNO_1', iban: ibanDePrueba(7) });
    const formatos = entorno.google.estado.formato.filter((f) => f.m === 'setNumberFormat').map((f) => f.a[0]);
    expect(formatos).toContain('@');
  });
});

describe('cruce, subsanación y fusión · recorrido completo · RF-91 … RF-94', () => {
  const pago = (iban, importe) => ({
    nombre: 'APELLIDO, NOMBRE',
    iban,
    importe,
    referencia: 'R1',
    banco: 'BANCOX',
    fichero: 'f.xml',
  });
  const cruce = { periodo: '2026-11', empresa: 'Uno', fuente: 'Vinculación' };

  function conPersonas() {
    const entorno = arrancar();
    llamarServicio(entorno, 'guardarCuentas', {
      cuentas: [
        { idPersonal: 'UNO_1', iban: IBAN_A },
        { idPersonal: 'UNO_2', iban: IBAN_B },
      ],
    });
    return entorno;
  }
  const esperados = [
    { idPersonal: 'UNO_1', importe: '100,00' },
    { idPersonal: 'UNO_2', importe: '200,00' },
  ];

  it('crea UNA hoja por mes con una fila por pago, y la cuenta no aparece en ella', () => {
    const entorno = conPersonas();
    const r = llamarServicio(entorno, 'cruzar', {
      ...cruce,
      pagos: [pago(IBAN_A, '100,00'), pago(IBAN_B, '150,00'), pago(IBAN_NUEVO, '9,00')],
      esperados,
    });
    expect(r.datos).toMatchObject({ total: 3, coincidentes: 1, incorrectos: 2 });
    const filas = hoja(entorno, 'informe_2026-11');
    expect(filas).toHaveLength(4);
    expect(todoElLibro(entorno)).not.toContain(IBAN_A);
    expect(todoElLibro(entorno)).not.toContain(IBAN_NUEVO);
  });

  it('repetir el cruce no duplica filas', () => {
    const entorno = conPersonas();
    const datos = { ...cruce, pagos: [pago(IBAN_A, '100,00')], esperados: [esperados[0]] };
    llamarServicio(entorno, 'cruzar', datos);
    llamarServicio(entorno, 'cruzar', datos);
    expect(hoja(entorno, 'informe_2026-11')).toHaveLength(2);
  });

  it('subsanar anota el historial, marca la fila y a partir de ahí no se puede sustituir el informe', () => {
    const entorno = conPersonas();
    const datos = { ...cruce, pagos: [pago(IBAN_B, '150,00')], esperados: [esperados[1]] };
    llamarServicio(entorno, 'cruzar', datos);
    const [incorrecta] = llamarServicio(entorno, 'informe', { periodo: '2026-11' }).datos;
    const r = llamarServicio(entorno, 'subsanar', {
      periodo: '2026-11',
      filaId: incorrecta.filaId,
      resolucion: 'aceptado',
      motivo: 'Anticipo ya descontado',
      usuario: 'sara@gala.test',
    });
    expect(r.ok).toBe(true);
    expect(hoja(entorno, 'subsanaciones')).toHaveLength(2);
    const [leida] = llamarServicio(entorno, 'informe', { periodo: '2026-11' }).datos;
    expect(leida).toMatchObject({ estado: 'Incorrecto', resolucion: 'aceptado', resueltoPor: 'sara@gala.test' });
    const otra = llamarServicio(entorno, 'cruzar', datos);
    expect(otra.ok).toBe(false);
    expect(otra.error).toContain('subsanadas');
  });

  it('la consulta del informe NO devuelve la huella', () => {
    const entorno = conPersonas();
    llamarServicio(entorno, 'cruzar', { ...cruce, pagos: [pago(IBAN_NUEVO, '9,00')], esperados: [] });
    expect(hoja(entorno, 'informe_2026-11')[1][7]).toMatch(/^[0-9a-f]{64}$/); // la hoja sí la guarda (parte 2)
    expect(JSON.stringify(llamarServicio(entorno, 'informe', { periodo: '2026-11' }).datos)).not.toMatch(
      /[0-9a-f]{64}/,
    );
  });

  it('fusionar exige todas las empresas y deja constancia', () => {
    const entorno = conPersonas();
    llamarServicio(entorno, 'cruzar', { ...cruce, pagos: [pago(IBAN_A, '100,00')], esperados: [esperados[0]] });
    expect(llamarServicio(entorno, 'fusionar', { periodo: '2026-11', empresas: ['Uno', 'Dos'], usuario: 'u' }).ok).toBe(
      false,
    );
    expect(llamarServicio(entorno, 'fusionar', { periodo: '2026-11', empresas: ['Uno'], usuario: 'u' }).ok).toBe(true);
    expect(hoja(entorno, 'fusiones')).toHaveLength(2);
  });

  it('el Maestro de Pagos devuelve identificador, últimos 4 y fecha (sin huella)', () => {
    const entorno = conPersonas();
    const r = llamarServicio(entorno, 'maestro', {});
    expect(r.datos.map((m) => m.idPersonal)).toEqual(['UNO_1', 'UNO_2']);
    expect(JSON.stringify(r.datos)).not.toMatch(/[0-9a-f]{64}/);
  });
});

describe('configuración · fallos claros', () => {
  it('si falta una hoja del libro, dice cuál', () => {
    const entorno = cargarPagos();
    const libro = prepararPagos(entorno);
    libro
      .getSheets()
      .filter((h) => h.getName() === 'fusiones')
      .forEach((h) => {
        libro.deleteSheet(h);
      });
    const r = llamarServicio(entorno, 'cruzar', {
      periodo: '2026-11',
      empresa: 'Uno',
      fuente: 'V',
      pagos: [{ nombre: 'N', iban: IBAN_A, importe: '1,00' }],
      esperados: [],
    });
    expect(CLAVE_PRUEBA).toBeTruthy();
    expect(r.ok).toBe(true); // el cruce no necesita `fusiones`
    expect(
      llamarServicio(entorno, 'fusionar', { periodo: '2026-11', empresas: ['Uno'], usuario: 'u' }).error,
    ).toContain('fusiones');
  });
});

describe('historial de una persona · RF-95', () => {
  it('reúne sus filas de todos los meses, ordenadas, sin huella y sin las de otras personas', () => {
    const entorno = arrancar();
    llamarServicio(entorno, 'guardarCuentas', {
      cuentas: [
        { idPersonal: 'UNO_1', iban: IBAN_A },
        { idPersonal: 'UNO_2', iban: IBAN_B },
      ],
    });
    const pago = (iban) => ({ nombre: 'N', iban, importe: '100,00', referencia: 'R', banco: 'B', fichero: 'f.xml' });
    for (const periodo of ['2026-11', '2026-10']) {
      llamarServicio(entorno, 'cruzar', {
        periodo,
        empresa: 'Uno',
        fuente: 'V',
        pagos: [pago(IBAN_A), pago(IBAN_B)],
        esperados: [
          { idPersonal: 'UNO_1', importe: '100,00' },
          { idPersonal: 'UNO_2', importe: '100,00' },
        ],
      });
    }
    const r = llamarServicio(entorno, 'historialPersona', { idPersonal: 'UNO_1' });
    expect(r.datos.map((f) => f.periodo)).toEqual(['2026-10', '2026-11']);
    expect(r.datos.every((f) => f.idPersonal === 'UNO_1' && f.huella === '')).toBe(true);
  });
});
