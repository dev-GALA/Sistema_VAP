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
  it('son estas, en este orden (las cinco de la versión 1 y las cuatro de Pagos)', () => {
    expect(plano(valor('PANTALLAS')).map((x) => x.id)).toStrictEqual([
      'proceso-mensual',
      'comprobaciones',
      'diferencias',
      'altas-bajas',
      'maestro',
      'cruzar-pagos',
      'historico-pagos',
      'maestro-pagos',
      'carga-inicial',
    ]);
  });

  it('cada pantalla dice qué es y qué requisitos la justifican', () => {
    for (const pantalla of plano(valor('PANTALLAS'))) {
      expect(pantalla.titulo).not.toBe('');
      expect(pantalla.resumen).not.toBe('');
      expect(pantalla.requisitos).toMatch(/HU-\d+/);
    }
  });

  it('están disponibles el proceso mensual, las altas y las cuatro pantallas de Pagos', () => {
    const disponibles = plano(valor('PANTALLAS')).filter((x) => x.disponible);
    expect(disponibles.map((x) => x.id)).toStrictEqual([
      'proceso-mensual',
      'altas-bajas',
      'cruzar-pagos',
      'historico-pagos',
      'maestro-pagos',
      'carga-inicial',
    ]);
  });

  it.each(['administracion', 'desarrollo'])('el rol %s ve todas', (rol) => {
    expect(p('pantallasPermitidas_', rol)).toHaveLength(9);
  });

  it('un rol que no existe no ve ninguna', () => {
    expect(p('pantallasPermitidas_', 'inventado')).toStrictEqual([]);
    expect(p('puedeVerPantalla_', 'inventado', 'proceso-mensual')).toBe(false);
  });

  it('Altas/bajas y Maestro de personal cuelgan de Gestión Personal; las de pagos, de Pagos; las demás no tienen grupo', () => {
    const grupos = Object.fromEntries(plano(valor('PANTALLAS')).map((x) => [x.id, x.grupo || '']));
    expect(grupos).toStrictEqual({
      'proceso-mensual': '',
      comprobaciones: '',
      diferencias: '',
      'altas-bajas': 'Gestión Personal',
      maestro: 'Gestión Personal',
      'cruzar-pagos': 'Pagos',
      'historico-pagos': 'Pagos',
      'maestro-pagos': 'Pagos',
      'carga-inicial': 'Pagos',
    });
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

  it('el catálogo real: grupo Acciones 1 (1.1 y 1.2) y el paso 3 suelto', () => {
    const real = plano(valor('PASOS_PROCESO_MENSUAL'));
    expect(real.map((x) => [x.numero, x.id, x.grupo])).toStrictEqual([
      ['1.1', 'actualizar-bbdd-personas', 'acciones-1'],
      ['1.2', 'comprobar-concordancia', 'acciones-1'],
      ['3', 'actualizar-export-sage', ''],
    ]);
    expect(real.map((x) => x.tipo)).toStrictEqual(['manual', 'ejecutable', 'manual']);
    expect(plano(valor('GRUPOS_PASOS')).map((g) => g.id)).toStrictEqual(['acciones-1']);
  });

  it('el paso 1.1 lleva a Altas y bajas y el 1.2 exige que el 1.1 esté hecho', () => {
    const [uno, dos] = plano(valor('PASOS_PROCESO_MENSUAL'));
    expect(uno.accion).toStrictEqual({ pantalla: 'altas-bajas', rotulo: 'Ir a Altas y bajas' });
    expect(dos.requiere).toBe('actualizar-bbdd-personas');
  });

  it('cada paso y cada grupo del catálogo real existen y los ids no se repiten', () => {
    const real = plano(valor('PASOS_PROCESO_MENSUAL'));
    const ids = real.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    const grupos = plano(valor('GRUPOS_PASOS')).map((g) => g.id);
    for (const paso of real) {
      if (paso.grupo) expect(grupos).toContain(paso.grupo);
      if (paso.requiere) expect(ids).toContain(paso.requiere);
    }
  });
});

describe('dominio-pasos · desbloqueo y marca de un paso', () => {
  const catalogo = [
    { id: 'a', orden: 1, titulo: 'A', tipo: 'manual' },
    { id: 'b', orden: 2, titulo: 'B', tipo: 'ejecutable', requiere: 'a' },
  ];
  const hecho = { periodo: '2026-11', pasoId: 'a', estado: 'hecho', actualizadoPor: 'x', actualizadoEn: 't' };

  it('un paso con requisito está bloqueado hasta que el requisito esté hecho', () => {
    expect(p('combinarPasosConEstado_', catalogo, [], '2026-11').map((x) => x.desbloqueado)).toStrictEqual([
      true,
      false,
    ]);
    expect(p('combinarPasosConEstado_', catalogo, [hecho], '2026-11').map((x) => x.desbloqueado)).toStrictEqual([
      true,
      true,
    ]);
  });

  it('el requisito hecho en OTRO periodo no desbloquea', () => {
    const otro = { ...hecho, periodo: '2026-10' };
    expect(p('combinarPasosConEstado_', catalogo, [otro], '2026-11')[1].desbloqueado).toBe(false);
  });

  it('se puede marcar un paso manual pendiente', () => {
    expect(p('decidirMarcaPaso_', catalogo, [], '2026-11', 'a')).toStrictEqual({ permitido: true, motivo: 'ok' });
  });

  it.each([
    ['no-existe', 'paso-desconocido'],
    ['b', 'no-es-manual'],
  ])('no se puede marcar «%s»: %s', (id, motivo) => {
    expect(p('decidirMarcaPaso_', catalogo, [], '2026-11', id)).toStrictEqual({ permitido: false, motivo });
  });

  it('un paso ya hecho en ese periodo no se vuelve a marcar', () => {
    expect(p('decidirMarcaPaso_', catalogo, [hecho], '2026-11', 'a')).toStrictEqual({
      permitido: false,
      motivo: 'ya-hecho',
    });
  });

  it('un paso manual con requisito sin cumplir no se marca', () => {
    const cat = [catalogo[0], { id: 'c', orden: 3, titulo: 'C', tipo: 'manual', requiere: 'a' }];
    expect(p('decidirMarcaPaso_', cat, [], '2026-11', 'c')).toStrictEqual({ permitido: false, motivo: 'bloqueado' });
  });
});

describe('dominio-personal · validar un alta o una baja', () => {
  // Datos INVENTADOS: ninguna persona ni cuenta reales.
  const EMPRESAS = [
    { nombre: 'Empresa Uno', pestana: 'Uno' },
    { nombre: 'Empresa Dos', pestana: 'Empresa Dos' },
  ];
  const base = { accion: 'alta', nombre: 'Ana', apellidos: 'Prueba Ficticia', dni: '12345678Z', fecha: '2026-11-03' };
  const validar = (extra = {}) => p('validarRegistroPersonal_', { ...base, ...extra }, EMPRESAS);

  it('un alta con los cinco campos obligatorios es válida y no necesita empresa ni cuenta', () => {
    const r = validar();
    expect(r.errores).toStrictEqual([]);
    expect(r.normalizado).toMatchObject({ accion: 'alta', dni: '12345678Z', fecha: '2026-11-03', empresa: '' });
  });

  it('normaliza acción, DNI, fecha y empresa', () => {
    const r = validar({
      accion: ' BAJA ',
      dni: '12.345.678-z'.replace(/\./g, ''),
      fecha: '03/11/2026',
      empresa: 'empresa uno',
    });
    expect(r.errores).toStrictEqual([]);
    expect(r.normalizado).toMatchObject({
      accion: 'baja',
      dni: '12345678Z',
      fecha: '2026-11-03',
      empresa: 'Empresa Uno',
    });
  });

  it.each([
    [{ accion: '' }, 'acción'],
    [{ accion: 'modificar' }, 'acción'],
    [{ nombre: '  ' }, 'el nombre'],
    [{ apellidos: '' }, 'los apellidos'],
    [{ dni: '' }, 'Falta el DNI'],
    [{ dni: '12345678A' }, 'DNI no es válido'],
    [{ fecha: '' }, 'Falta la fecha'],
    [{ fecha: '2026-02-30' }, 'fecha no es válida'],
    [{ fecha: 'ayer' }, 'fecha no es válida'],
    [{ empresa: 'Otra' }, 'empresa no es una de las configuradas'],
    [{ idTrabajador: 'con espacios' }, 'identificador no es válido'],
    [{ nombre: 'x'.repeat(101) }, 'demasiado largo'],
  ])('rechaza %j', (extra, texto) => {
    const { errores } = validar(extra);
    expect(errores.join(' ')).toContain(texto);
  });

  it('NIE válido y letra de control comprobada', () => {
    expect(p('esDniValido_', 'X1234567L')).toBe(true);
    expect(p('esDniValido_', 'X1234567A')).toBe(false);
    expect(p('esDniValido_', '1234567Z')).toBe(false);
  });

  it('la fecha de un mes con 31 días en uno de 30 no existe', () => {
    expect(p('normalizarFecha_', '31/04/2026')).toBe('');
    expect(p('normalizarFecha_', '29/02/2028')).toBe('2028-02-29');
    expect(p('normalizarFecha_', '29/02/2026')).toBe('');
  });

  describe('cuenta bancaria', () => {
    const IBAN = 'ES91 2100 0418 4502 0005 1332';
    it('un IBAN válido con identificador se normaliza', () => {
      const r = validar({ iban: IBAN, idTrabajador: 'T-001' });
      expect(r.errores).toStrictEqual([]);
      expect(r.normalizado.iban).toBe('ES9121000418450200051332');
    });
    it('sin identificador no se acepta: la huella se guarda junto a él', () => {
      expect(validar({ iban: IBAN }).errores.join(' ')).toContain('identificador de SAGE');
    });
    it('un IBAN con el dígito de control mal se rechaza', () => {
      expect(validar({ iban: 'ES9021000418450200051332', idTrabajador: 'T1' }).errores.join(' ')).toContain('cuenta');
    });
    it('solo vale en un alta', () => {
      expect(validar({ accion: 'baja', iban: IBAN, idTrabajador: 'T1' }).errores.join(' ')).toContain(
        'solo se da en un alta',
      );
    });
    it('LOS ERRORES NUNCA REPITEN EL VALOR de la cuenta ni del DNI', () => {
      const r = validar({ iban: 'ES9021000418450200051332', dni: '99999999Q', idTrabajador: 'T1' });
      const texto = r.errores.join(' ');
      expect(texto).not.toContain('ES9021');
      expect(texto).not.toContain('99999999');
    });
    it.each(['ES9121000418450200051332', 'GB82WEST12345698765432'])('acepta %s', (iban) => {
      expect(p('esIbanValido_', iban)).toBe(true);
    });
  });

  describe('empresas de config', () => {
    it('separa por punto y coma y admite pestaña con «=»', () => {
      expect(p('parsearEmpresas_', 'Empresa Uno=Uno; Empresa Dos ;; Gala, S.L.')).toStrictEqual([
        { nombre: 'Empresa Uno', pestana: 'Uno' },
        { nombre: 'Empresa Dos', pestana: 'Empresa Dos' },
        { nombre: 'Gala, S.L.', pestana: 'Gala, S.L.' },
      ]);
    });
    it('vacío o ausente no da empresas', () => {
      expect(p('parsearEmpresas_', '')).toStrictEqual([]);
      expect(p('parsearEmpresas_', undefined)).toStrictEqual([]);
    });
  });

  it('detecta un DNI repetido dentro del mismo envío (misma empresa y acción)', () => {
    const n = (dni, empresa = 'A', accion = 'alta') => ({ dni, empresa, accion });
    expect(p('indicesConDniRepetido_', [n('1'), n('2'), n('1'), n('1', 'B'), n('1', 'A', 'baja')])).toStrictEqual([2]);
  });
});
