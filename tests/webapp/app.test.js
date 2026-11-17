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
  const escritas = [];
  return {
    leidas,
    escritas,
    correoActual: () => correo,
    leerUsuarios: () => usuarios,
    leerEstadoPasos: () => {
      leidas.estadoPasos += 1;
      return filas;
    },
    ahora: () => '2026-11-17 12:30',
    conBloqueo: (accion) => accion(),
    anadirEstadoPaso: (fila) => {
      escritas.push(fila);
      filas.push(fila);
    },
  };
}

describe('app-contexto · quién es y qué ve', () => {
  it('un usuario con acceso recibe su rol y las nueve pantallas', () => {
    const contexto = plano(llamar('obtenerContexto_', dependencias()));
    expect(contexto).toMatchObject({ permitido: true, motivo: 'ok', correo: 'sara@gala.test', rol: 'administracion' });
    expect(contexto.pantallas).toHaveLength(9);
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
    pasoId: 'actualizar-bbdd-personas',
    estado: 'hecho',
    actualizadoPor: 'sara@gala.test',
    actualizadoEn: '2026-11-03',
  };

  it('devuelve los tres pasos con su estado', () => {
    const resultado = plano(llamar('pasosDelPeriodo_', dependencias({ filas: [fila] }), '2026-11'));
    expect(resultado.periodo).toBe('2026-11');
    expect(resultado.pasos.map((x) => [x.id, x.estado])).toStrictEqual([
      ['actualizar-bbdd-personas', 'hecho'],
      ['comprobar-concordancia', 'pendiente'],
      ['actualizar-export-sage', 'pendiente'],
    ]);
    expect(resultado.grupos.map((g) => g.id)).toStrictEqual(['acciones-1']);
  });

  it('el paso 1.2 sale bloqueado hasta que el 1.1 está hecho', () => {
    const sin = plano(llamar('pasosDelPeriodo_', dependencias(), '2026-11'));
    expect(sin.pasos.map((x) => x.desbloqueado)).toStrictEqual([true, false, true]);
    const con = plano(llamar('pasosDelPeriodo_', dependencias({ filas: [fila] }), '2026-11'));
    expect(con.pasos.map((x) => x.desbloqueado)).toStrictEqual([true, true, true]);
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

describe('app-proceso-mensual · marcar un paso como realizado', () => {
  const marcar = (deps, periodo = '2026-11', paso = 'actualizar-bbdd-personas') =>
    plano(llamar('marcarPasoRealizado_', deps, periodo, paso));

  it('escribe UNA fila con quién y cuándo, y devuelve los pasos ya actualizados', () => {
    const deps = dependencias();
    const resultado = marcar(deps);
    expect(plano(deps.escritas)).toStrictEqual([
      {
        periodo: '2026-11',
        pasoId: 'actualizar-bbdd-personas',
        estado: 'hecho',
        actualizadoPor: 'sara@gala.test',
        actualizadoEn: '2026-11-17 12:30',
      },
    ]);
    expect(resultado.pasos[0]).toMatchObject({ estado: 'hecho', actualizadoPor: 'sara@gala.test' });
    expect(resultado.pasos[1].desbloqueado).toBe(true);
  });

  it('sin acceso lanza el error y NO escribe', () => {
    const deps = dependencias({ correo: 'desconocido@gala.test' });
    expect(() => marcar(deps)).toThrow('No tienes acceso');
    expect(deps.escritas).toHaveLength(0);
  });

  it('rechaza un periodo no válido y NO escribe', () => {
    const deps = dependencias();
    expect(() => marcar(deps, '2026-13')).toThrow('AAAA-MM');
    expect(deps.escritas).toHaveLength(0);
  });

  it.each([
    ['paso-que-no-existe', /no existe/],
    ['comprobar-concordancia', /manual/],
  ])('no marca «%s»', (paso, mensaje) => {
    const deps = dependencias();
    expect(() => marcar(deps, '2026-11', paso)).toThrow(mensaje);
    expect(deps.escritas).toHaveLength(0);
  });

  it('un paso ya realizado no se marca dos veces', () => {
    const deps = dependencias();
    marcar(deps);
    expect(() => marcar(deps)).toThrow(/ya está realizado/);
    expect(deps.escritas).toHaveLength(1);
  });

  it('la decisión y la escritura ocurren DENTRO del bloqueo', () => {
    const deps = dependencias();
    let dentro = false;
    deps.conBloqueo = (accion) => {
      dentro = true;
      try {
        return accion();
      } finally {
        dentro = false;
      }
    };
    const anadir = deps.anadirEstadoPaso;
    deps.anadirEstadoPaso = (fila) => {
      expect(dentro).toBe(true);
      anadir(fila);
    };
    marcar(deps);
    expect(deps.escritas).toHaveLength(1);
  });
});

describe('app-personal · alta y baja de personas', () => {
  // Datos INVENTADOS.
  const CONFIG = {
    empresas: 'Empresa Uno=Uno; Empresa Dos',
    maestro_libro_id: 'libro-maestro',
    pagos_libro_id: 'libro-pagos',
  };
  const ALTA = {
    accion: 'alta',
    nombre: 'Ana',
    apellidos: 'Ficticia',
    dni: '12345678Z',
    fecha: '2026-11-03',
    empresa: 'Empresa Uno',
  };
  const IBAN = 'ES9121000418450200051332';

  function depsPersonal({ config = CONFIG, correo = 'sara@gala.test', servicio = true, falla = {} } = {}) {
    const deps = dependencias({ correo });
    const eventos = [];
    const maestro = [];
    const huellas = [];
    const marcas = [];
    return Object.assign(deps, {
      eventos,
      maestro,
      huellas,
      marcas,
      leerConfiguracion: () => config,
      servicioPagosConfigurado: () => servicio,
      nuevoId: () => 'evento-1',
      anadirEvento: (e) => eventos.push(e),
      aplicarEnMaestro: (_c, _e, registro) => {
        if (falla.maestro) throw new Error(falla.maestro);
        maestro.push(registro);
      },
      llamarServicioPagos: (accion, datos) => {
        if (falla.huella) throw new Error(falla.huella);
        huellas.push({ accion, id: datos.idPersonal, iban: datos.iban });
        return {};
      },
      marcarCuentaEnMaestro: (_c, _e, persona) => {
        if (falla.marca) throw new Error(falla.marca);
        marcas.push(persona);
      },
    });
  }
  const registrar = (deps, registros) => plano(llamar('registrarPersonas_', deps, registros));
  const estados = (deps) => deps.eventos.map((e) => e.estado);

  it('las opciones dicen las empresas y qué está configurado, sin ids de libros', () => {
    const o = plano(llamar('opcionesPersonal_', depsPersonal()));
    expect(o).toStrictEqual({
      empresas: ['Empresa Uno', 'Empresa Dos'],
      maestroConfigurado: true,
      cuentaConfigurada: true,
      maximoPorEnvio: 200,
    });
  });

  it('sin maestro o sin empresas la función no está configurada; sin el servicio de pagos, la cuenta tampoco', () => {
    expect(plano(llamar('opcionesPersonal_', depsPersonal({ config: {} }))).maestroConfigurado).toBe(false);
    expect(
      plano(llamar('opcionesPersonal_', depsPersonal({ config: { maestro_libro_id: 'x' } }))).maestroConfigurado,
    ).toBe(false);
    expect(plano(llamar('opcionesPersonal_', depsPersonal({ servicio: false }))).cuentaConfigurada).toBe(false);
  });

  it('un alta sin cuenta: registra, aplica al maestro y queda «aplicado» (falta la cuenta)', () => {
    const deps = depsPersonal();
    const [r] = registrar(deps, [ALTA]);
    expect(r).toMatchObject({ indice: 0, eventoId: 'evento-1', estado: 'aplicado' });
    expect(r.detalle).toContain('Falta la cuenta');
    expect(estados(deps)).toStrictEqual(['registrado', 'aplicado']);
    expect(deps.maestro).toHaveLength(1);
    expect(deps.huellas).toHaveLength(0);
  });

  it('un alta con cuenta: registra, aplica, la guarda en el servicio, la marca en el maestro y queda «completo»', () => {
    const deps = depsPersonal();
    const [r] = registrar(deps, [{ ...ALTA, idTrabajador: 'T1', iban: IBAN }]);
    expect(r.estado).toBe('completo');
    expect(estados(deps)).toStrictEqual(['registrado', 'aplicado', 'completo']);
    expect(deps.huellas).toStrictEqual([{ accion: 'guardarCuenta', id: 'Empresa Uno_T1', iban: IBAN }]);
    expect(plano(deps.marcas)).toStrictEqual([
      { idPersonal: 'Empresa Uno_T1', idTrabajador: 'T1', empresa: 'Empresa Uno' },
    ]);
  });

  it('si la cuenta se guarda pero falla la marca en el maestro, lo dice y no pasa en silencio (RF-85 · RF-97)', () => {
    const deps = depsPersonal({ falla: { marca: 'Falta la columna' } });
    const [r] = registrar(deps, [{ ...ALTA, idTrabajador: 'T1', iban: IBAN }]);
    expect(r.estado).toBe('error');
    expect(r.detalle).toContain('NO se pudo marcar en el maestro');
    expect(estados(deps)).toStrictEqual(['registrado', 'aplicado', 'error']);
  });

  it('EL REGISTRO NO LLEVA DNI, NOMBRE NI CUENTA: solo el identificador', () => {
    const deps = depsPersonal();
    registrar(deps, [{ ...ALTA, idTrabajador: 'T1', iban: IBAN }]);
    const texto = JSON.stringify(deps.eventos);
    expect(texto).not.toContain('12345678Z');
    expect(texto).not.toContain('Ana');
    expect(texto).not.toContain('Ficticia');
    expect(texto).not.toContain(IBAN);
    expect(deps.eventos[0]).toMatchObject({
      usuario: 'sara@gala.test',
      accion: 'alta',
      empresa: 'Empresa Uno',
      idTrabajador: 'T1',
    });
  });

  it('una baja sin cuenta queda «completo»', () => {
    const deps = depsPersonal();
    const [r] = registrar(deps, [{ ...ALTA, accion: 'baja' }]);
    expect(r.estado).toBe('completo');
    expect(estados(deps)).toStrictEqual(['registrado', 'aplicado', 'completo']);
  });

  it('sin empresa se registra pero NO se aplica al maestro: «sin-aplicar»', () => {
    const deps = depsPersonal();
    const [r] = registrar(deps, [{ ...ALTA, empresa: '' }]);
    expect(r.estado).toBe('sin-aplicar');
    expect(estados(deps)).toStrictEqual(['registrado', 'sin-aplicar']);
    expect(deps.maestro).toHaveLength(0);
  });

  it('un registro inválido se rechaza: no deja evento ni escribe nada', () => {
    const deps = depsPersonal();
    const [r] = registrar(deps, [{ ...ALTA, dni: '12345678A' }]);
    expect(r).toMatchObject({ estado: 'rechazado' });
    expect(r.detalle).toContain('DNI');
    expect(deps.eventos).toHaveLength(0);
    expect(deps.maestro).toHaveLength(0);
  });

  it('si falla el maestro queda «error», no se guarda la huella y no pasa en silencio', () => {
    const deps = depsPersonal({ falla: { maestro: 'Esa persona ya consta' } });
    const [r] = registrar(deps, [{ ...ALTA, idTrabajador: 'T1', iban: IBAN }]);
    expect(r).toMatchObject({ estado: 'error', detalle: 'Esa persona ya consta' });
    expect(estados(deps)).toStrictEqual(['registrado', 'error']);
    expect(deps.huellas).toHaveLength(0);
  });

  it('si falla la huella tras aplicar al maestro, lo dice: «aplicado, pero la cuenta NO se guardó»', () => {
    const deps = depsPersonal({ falla: { huella: 'Falta la hoja' } });
    const [r] = registrar(deps, [{ ...ALTA, idTrabajador: 'T1', iban: IBAN }]);
    expect(r.estado).toBe('error');
    expect(r.detalle).toContain('la cuenta NO se guardó');
    expect(estados(deps)).toStrictEqual(['registrado', 'aplicado', 'error']);
  });

  it('un error que repitiera la cuenta o el DNI se anota tapado', () => {
    const deps = depsPersonal({ falla: { huella: `fallo con ${IBAN} y 12345678Z` } });
    const [r] = registrar(deps, [{ ...ALTA, idTrabajador: 'T1', iban: IBAN }]);
    expect(r.detalle).not.toContain(IBAN);
    expect(r.detalle).not.toContain('12345678Z');
    expect(JSON.stringify(deps.eventos)).not.toContain(IBAN);
  });

  it('cada registro va aparte: uno que falla no impide los demás', () => {
    const deps = depsPersonal();
    const resultado = registrar(deps, [
      { ...ALTA, dni: '00000000A' },
      { ...ALTA, dni: '87654321X' },
    ]);
    expect(resultado.map((r) => r.estado)).toStrictEqual(['rechazado', 'aplicado']);
  });

  it('un DNI repetido en el mismo envío se rechaza en la segunda aparición', () => {
    const deps = depsPersonal();
    const resultado = registrar(deps, [ALTA, ALTA]);
    expect(resultado.map((r) => r.estado)).toStrictEqual(['aplicado', 'rechazado']);
  });

  it('cada alta o baja se aplica DENTRO del bloqueo', () => {
    const deps = depsPersonal();
    let dentro = false;
    deps.conBloqueo = (accion) => {
      dentro = true;
      try {
        return accion();
      } finally {
        dentro = false;
      }
    };
    const aplicar = deps.aplicarEnMaestro;
    deps.aplicarEnMaestro = (...a) => {
      expect(dentro).toBe(true);
      aplicar(...a);
    };
    registrar(deps, [ALTA]);
    expect(deps.maestro).toHaveLength(1);
  });

  it('sin maestro configurado no escribe nada y lo dice', () => {
    const deps = depsPersonal({ config: { empresas: 'Empresa Uno' } });
    expect(() => registrar(deps, [ALTA])).toThrow('no está configurado');
    expect(deps.eventos).toHaveLength(0);
  });

  it.each([[[]], [null], [new Array(201).fill(ALTA)]])('rechaza una lista de registros inadecuada', (lista) => {
    const deps = depsPersonal();
    expect(() => registrar(deps, lista)).toThrow();
    expect(deps.eventos).toHaveLength(0);
  });

  it('sin acceso lanza el error y no escribe', () => {
    const deps = depsPersonal({ correo: 'desconocido@gala.test' });
    expect(() => registrar(deps, [ALTA])).toThrow('No tienes acceso');
    expect(deps.eventos).toHaveLength(0);
  });

  describe('validar sin escribir (previsualización de la plantilla)', () => {
    const validar = (deps, registros) => plano(llamar('validarPersonas_', deps, registros));

    it('devuelve errores por fila y el registro normalizado SIN la cuenta', () => {
      const deps = depsPersonal();
      const r = validar(deps, [
        { ...ALTA, iban: IBAN, idTrabajador: 'T1' },
        { ...ALTA, dni: 'xx' },
      ]);
      expect(r[0].errores).toStrictEqual([]);
      expect(r[0].normalizado.tieneCuenta).toBe(true);
      expect(JSON.stringify(r)).not.toContain(IBAN);
      expect(r[1].errores.join(' ')).toContain('DNI');
      expect(deps.eventos).toHaveLength(0);
      expect(deps.maestro).toHaveLength(0);
    });

    it('marca el DNI repetido dentro del envío', () => {
      const r = validar(depsPersonal(), [ALTA, ALTA]);
      expect(r[0].errores).toStrictEqual([]);
      expect(r[1].errores.join(' ')).toContain('repetido');
    });

    it('sin acceso lanza el error', () => {
      expect(() => validar(depsPersonal({ correo: 'desconocido@gala.test' }), [ALTA])).toThrow('No tienes acceso');
    });
  });
});
