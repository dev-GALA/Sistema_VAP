// Pruebas unitarias del dominio de la webapp: reglas puras, sin Google (ADR-0017).
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { cargarWebapp } from './cargar.js';

const { llamar, valor, ejecutar } = cargarWebapp();
const p = (nombre, ...args) => plano(llamar(nombre, ...args));

describe('dominio-periodo · el periodo se escribe AAAA-MM', () => {
  it.each(['2026-01', '2026-11', '2026-12', '1999-06'])('acepta %s', (periodo) => {
    expect(p('esPeriodoValido_', periodo)).toBe(true);
  });

  it.each(['2026-13', '2026-00', '26-11', '2026-1', '', '2026-11-01', '2026/11', ' 2026-11'])(
    'rechaza «%s»',
    (periodo) => {
      expect(p('esPeriodoValido_', periodo)).toBe(false);
    },
  );

  it('rechaza lo que no es texto', () => {
    expect(p('esPeriodoValido_', null)).toBe(false);
    expect(p('esPeriodoValido_', undefined)).toBe(false);
    expect(p('esPeriodoValido_', 202611)).toBe(false);
  });

  it('periodoDeFecha_ rellena el mes con un cero', () => {
    expect(ejecutar('periodoDeFecha_(new Date(2026, 0, 31))')).toBe('2026-01');
    expect(ejecutar('periodoDeFecha_(new Date(2026, 10, 5))')).toBe('2026-11');
    expect(ejecutar('periodoDeFecha_(new Date(2026, 11, 31))')).toBe('2026-12');
  });
});

describe('dominio-acceso · ante la duda, no se entra', () => {
  const usuarios = [
    { correo: 'sara@gala.test', rol: 'administracion' },
    { correo: 'dev@gala.test', rol: 'desarrollo' },
    { correo: 'raro@gala.test', rol: 'inventado' },
    { correo: 'doble@gala.test', rol: 'administracion' },
    { correo: 'DOBLE@gala.test', rol: 'desarrollo' },
  ];
  const decidir = (correo) => p('decidirAcceso_', correo, usuarios);

  it('deja entrar a un usuario activo y devuelve su rol', () => {
    expect(decidir('sara@gala.test')).toStrictEqual({ permitido: true, rol: 'administracion', motivo: 'ok' });
    expect(decidir('dev@gala.test')).toStrictEqual({ permitido: true, rol: 'desarrollo', motivo: 'ok' });
  });

  it('ignora mayúsculas y espacios del correo', () => {
    expect(decidir('  SARA@Gala.Test ').permitido).toBe(true);
  });

  it.each([
    [null, 'sin-identificar'],
    [undefined, 'sin-identificar'],
    ['', 'sin-identificar'],
    ['   ', 'sin-identificar'],
    ['otro@gala.test', 'no-registrado'],
    ['raro@gala.test', 'rol-desconocido'],
    ['doble@gala.test', 'duplicado'],
  ])('NO deja entrar a %s (%s)', (correo, motivo) => {
    expect(decidir(correo)).toStrictEqual({ permitido: false, rol: '', motivo });
  });

  it('con la lista vacía no entra nadie', () => {
    expect(p('decidirAcceso_', 'sara@gala.test', []).permitido).toBe(false);
  });

  it.each([
    ['a@x.com', ['a@x.com']],
    ['a@x.com, B@x.com', ['a@x.com', 'b@x.com']],
    ['a@x.com;b@x.com', ['a@x.com', 'b@x.com']],
    ['a@x.com\nb@x.com', ['a@x.com', 'b@x.com']],
    ['  a@x.com ,, ; ', ['a@x.com']],
    ['', []],
    [undefined, []],
    [null, []],
  ])('listaDeCorreos_(%j)', (entrada, esperado) => {
    expect(p('listaDeCorreos_', entrada)).toStrictEqual(esperado);
  });

  it('usuariosDeConfiguracion_ lee la clave email_<rol> de cada rol', () => {
    const config = {
      email_administracion: 'sara@gala.test, otra@gala.test',
      email_desarrollo: 'dev@gala.test',
      email_inventado: 'nadie@gala.test',
      cupo: '5',
    };
    expect(p('usuariosDeConfiguracion_', config)).toStrictEqual([
      { correo: 'sara@gala.test', rol: 'administracion' },
      { correo: 'otra@gala.test', rol: 'administracion' },
      { correo: 'dev@gala.test', rol: 'desarrollo' },
    ]);
  });

  it('sin claves de correos en la configuración no entra nadie', () => {
    expect(p('usuariosDeConfiguracion_', {})).toStrictEqual([]);
    expect(p('usuariosDeConfiguracion_', { email_administracion: '' })).toStrictEqual([]);
  });

  it('el mismo correo en dos roles se detecta y NO entra', () => {
    const usuarios = p('usuariosDeConfiguracion_', { email_administracion: 'a@x.com', email_desarrollo: 'A@x.com' });
    expect(p('decidirAcceso_', 'a@x.com', usuarios).motivo).toBe('duplicado');
  });
});

describe('dominio-pantallas · las pantallas son datos', () => {
  it('son las cinco de la versión 1, en este orden', () => {
    expect(plano(valor('PANTALLAS')).map((x) => x.id)).toStrictEqual([
      'proceso-mensual',
      'comprobaciones',
      'diferencias',
      'altas-bajas',
      'maestro',
    ]);
  });

  it('cada pantalla dice qué es y qué requisitos la justifican', () => {
    for (const pantalla of plano(valor('PANTALLAS'))) {
      expect(pantalla.titulo).not.toBe('');
      expect(pantalla.resumen).not.toBe('');
      expect(pantalla.requisitos).toMatch(/HU-\d+/);
    }
  });

  it('en la versión 1 solo el proceso mensual está disponible', () => {
    const disponibles = plano(valor('PANTALLAS')).filter((x) => x.disponible);
    expect(disponibles.map((x) => x.id)).toStrictEqual(['proceso-mensual']);
  });

  it.each(['administracion', 'desarrollo'])('el rol %s ve todas', (rol) => {
    expect(p('pantallasPermitidas_', rol)).toHaveLength(5);
  });

  it('un rol que no existe no ve ninguna', () => {
    expect(p('pantallasPermitidas_', 'inventado')).toStrictEqual([]);
    expect(p('puedeVerPantalla_', 'inventado', 'proceso-mensual')).toBe(false);
  });

  it('una pantalla que no existe no se puede ver', () => {
    expect(p('puedeVerPantalla_', 'administracion', 'no-existe')).toBe(false);
  });
});

describe('dominio-pasos · el estado de cada paso del mes', () => {
  const catalogo = [
    { id: 'a', orden: 1, titulo: 'A', tipo: 'manual' },
    { id: 'b', orden: 2, titulo: 'B', tipo: 'ejecutable' },
  ];
  const fila = (extra) => ({
    periodo: '2026-11',
    pasoId: 'a',
    estado: 'hecho',
    actualizadoPor: 'sara@gala.test',
    actualizadoEn: '2026-11-03',
    ...extra,
  });
  const combinar = (filas, periodo = '2026-11') => p('combinarPasosConEstado_', catalogo, filas, periodo);

  it('un paso sin fila está pendiente', () => {
    const pasos = combinar([]);
    expect(pasos.map((x) => x.estado)).toStrictEqual(['pendiente', 'pendiente']);
    expect(pasos[0].actualizadoPor).toBe('');
  });

  it('toma el estado guardado y conserva los datos del catálogo', () => {
    const [a, b] = combinar([fila()]);
    expect(a).toMatchObject({
      id: 'a',
      titulo: 'A',
      tipo: 'manual',
      estado: 'hecho',
      actualizadoPor: 'sara@gala.test',
    });
    expect(b.estado).toBe('pendiente');
  });

  it('ignora las filas de otros periodos', () => {
    expect(combinar([fila({ periodo: '2026-10' })])[0].estado).toBe('pendiente');
  });

  it('si hay varias filas del mismo paso, manda la última', () => {
    const filas = [fila({ estado: 'pendiente' }), fila({ estado: 'con-incidencias' }), fila({ estado: 'hecho' })];
    expect(combinar(filas)[0].estado).toBe('hecho');
  });

  it('un estado que no se reconoce se muestra como desconocido, no como pendiente ni hecho', () => {
    expect(combinar([fila({ estado: 'terminado' })])[0].estado).toBe('desconocido');
  });

  it('el catálogo real arranca con el primer grupo de pasos acordado', () => {
    const real = plano(valor('PASOS_PROCESO_MENSUAL'));
    expect(real.map((x) => x.id)).toStrictEqual([
      'actualizar-export-sage',
      'actualizar-bbdd-personas',
      'comprobar-concordancia',
    ]);
    expect(real.map((x) => x.tipo)).toStrictEqual(['manual', 'manual', 'ejecutable']);
    expect(real.map((x) => x.orden)).toStrictEqual([1, 2, 3]);
  });
});
