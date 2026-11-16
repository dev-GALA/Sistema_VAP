// Pruebas de los casos de uso de la webapp: con las dependencias inyectadas, sin Google (ADR-0017).
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { cargarWebapp } from './cargar.js';

const { llamar } = cargarWebapp();

const USUARIOS = [
  { correo: 'sara@gala.test', rol: 'administracion' },
  { correo: 'raro@gala.test', rol: 'inventado' },
];

/** Dependencias falsas que además cuentan cuántas veces se lee el estado de los pasos. */
function dependencias({ correo = 'sara@gala.test', usuarios = USUARIOS, filas = [] } = {}) {
  const leidas = { estadoPasos: 0 };
  return {
    leidas,
    correoActual: () => correo,
    leerUsuarios: () => usuarios,
    leerEstadoPasos: () => {
      leidas.estadoPasos += 1;
      return filas;
    },
  };
}

describe('app-contexto · quién es y qué ve', () => {
  it('un usuario con acceso recibe su rol y las cinco pantallas', () => {
    const contexto = plano(llamar('obtenerContexto_', dependencias()));
    expect(contexto).toMatchObject({ permitido: true, motivo: 'ok', correo: 'sara@gala.test', rol: 'administracion' });
    expect(contexto.pantallas).toHaveLength(5);
  });

  it('el correo del contexto va normalizado', () => {
    expect(plano(llamar('obtenerContexto_', dependencias({ correo: ' SARA@gala.test ' }))).correo).toBe(
      'sara@gala.test',
    );
  });

  it.each([
    ['desconocido@gala.test', 'no-registrado'],
    ['raro@gala.test', 'rol-desconocido'],
    ['', 'sin-identificar'],
  ])('%s no entra (%s) y no recibe ninguna pantalla', (correo, motivo) => {
    const contexto = plano(llamar('obtenerContexto_', dependencias({ correo })));
    expect(contexto).toMatchObject({ permitido: false, motivo, rol: '' });
    expect(contexto.pantallas).toStrictEqual([]);
  });

  it('exigirAcceso_ devuelve el contexto de quien tiene acceso', () => {
    expect(plano(llamar('exigirAcceso_', dependencias(), 'proceso-mensual')).rol).toBe('administracion');
  });

  it('exigirAcceso_ lanza el MISMO mensaje sea cual sea el motivo: no se cuenta por qué no entra', () => {
    const mensajes = ['desconocido@gala.test', 'raro@gala.test', ''].map((correo) => {
      try {
        llamar('exigirAcceso_', dependencias({ correo }), 'proceso-mensual');
        return null;
      } catch (error) {
        return error.message;
      }
    });
    expect(mensajes).toStrictEqual(Array(3).fill('No tienes acceso a esta pantalla.'));
  });

  it('exigirAcceso_ lanza si la pantalla no existe', () => {
    expect(() => llamar('exigirAcceso_', dependencias(), 'no-existe')).toThrow('No tienes acceso a esta pantalla.');
  });
});

describe('app-proceso-mensual · los pasos del mes', () => {
  const fila = {
    periodo: '2026-11',
    pasoId: 'actualizar-export-sage',
    estado: 'hecho',
    actualizadoPor: 'sara@gala.test',
    actualizadoEn: '2026-11-03',
  };

  it('devuelve los tres pasos con su estado', () => {
    const resultado = plano(llamar('pasosDelPeriodo_', dependencias({ filas: [fila] }), '2026-11'));
    expect(resultado.periodo).toBe('2026-11');
    expect(resultado.pasos.map((x) => [x.id, x.estado])).toStrictEqual([
      ['actualizar-export-sage', 'hecho'],
      ['actualizar-bbdd-personas', 'pendiente'],
      ['comprobar-concordancia', 'pendiente'],
    ]);
  });

  it.each(['2026-13', '', 'noviembre', null])('rechaza el periodo «%s»', (periodo) => {
    expect(() => llamar('pasosDelPeriodo_', dependencias(), periodo)).toThrow('AAAA-MM');
  });

  it('sin acceso lanza el error y NO llega a leer los datos', () => {
    const deps = dependencias({ correo: 'desconocido@gala.test' });
    expect(() => llamar('pasosDelPeriodo_', deps, '2026-11')).toThrow('No tienes acceso');
    expect(deps.leidas.estadoPasos).toBe(0);
  });
});
