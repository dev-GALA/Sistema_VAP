// Pruebas de integración de la webapp: el código real contra el Google falso (hojas en memoria).
// Cubre el libro propio (ADR-0018), el punto de entrada y que NINGUNA función `api…` se abre a un extraño.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ID_LIBRO_PAGOS } from '../pagos/cargar.js';
import { plano, SRC_WEBAPP } from '../soporte/cargar-gs.js';
import {
  ARCHIVOS_GS,
  CONFIG_NORMAL,
  CONFIG_PERSONAL,
  cargarWebapp,
  cargarWebappConServicio,
  ID_MAESTRO,
  prepararLibro,
  prepararPersonal,
} from './cargar.js';

const arrancar = ({ usuario = 'sara@gala.test', libro = {} } = {}) => {
  const entorno = cargarWebapp({ usuario });
  prepararLibro(entorno, { config: CONFIG_NORMAL, estadoPasos: [], ...libro });
  return entorno;
};
const pagina = (entorno) => entorno.llamar('doGet').getContent();
const volcado = (entorno) =>
  plano(
    entorno.google.estado.libros
      .get('libro-webapp-prueba')
      .getSheets()
      .map((h) => h.volcar()),
  );

describe('doGet · la puerta de entrada', () => {
  it('un usuario con acceso recibe la aplicación, con el estilo y la versión', () => {
    const html = pagina(arrancar());
    expect(html).toContain('id="navegacion"');
    expect(html).toContain('--accent: #fdc300');
    expect(html).toContain('webapp v0.4.0');
  });

  it('un usuario que no consta recibe «Sin acceso» y NO la aplicación', () => {
    const html = pagina(arrancar({ usuario: 'extrano@gala.test' }));
    expect(html).toContain('Sin acceso');
    expect(html).toContain('Sesión iniciada como extrano@gala.test');
    expect(html).not.toContain('id="navegacion"');
  });

  it('quien se quita de la lista de config deja de entrar', () => {
    const entorno = arrancar({
      libro: {
        config: [
          ['email_administracion', ''],
          ['email_desarrollo', 'dev@gala.test'],
        ],
      },
    });
    expect(pagina(entorno)).not.toContain('id="navegacion"');
  });

  it('el mismo correo en dos roles no entra: es ambiguo', () => {
    const doble = [
      ['email_administracion', 'sara@gala.test'],
      ['email_desarrollo', 'sara@gala.test'],
    ];
    expect(pagina(arrancar({ libro: { config: doble } }))).toContain('Sin acceso');
  });

  it('si Google no identifica al usuario (correo vacío), no entra', () => {
    const html = pagina(arrancar({ usuario: '' }));
    expect(html).toContain('Sin acceso');
    expect(html).not.toContain('id="navegacion"');
  });

  it('sin la propiedad ID_LIBRO_WEBAPP se niega y dice que falta configurar', () => {
    const entorno = cargarWebapp();
    const html = pagina(entorno);
    expect(html).toContain('aún no está configurada');
    expect(html).not.toContain('id="navegacion"');
  });

  it('si falta la hoja config se niega: no se abre por defecto', () => {
    const entorno = cargarWebapp();
    prepararLibro(entorno, { estadoPasos: [] });
    const html = pagina(entorno);
    expect(html).toContain('aún no está configurada');
    expect(html).not.toContain('id="navegacion"');
  });

  it('si a la hoja config le falta una columna se niega', () => {
    const entorno = cargarWebapp();
    prepararLibro(entorno, { config: [], cabeceraConfig: ['clave'] });
    expect(pagina(entorno)).toContain('aún no está configurada');
  });

  it('una clave repetida en config se niega: no se elige una en silencio', () => {
    const repetida = [
      ['email_administracion', 'sara@gala.test'],
      ['EMAIL_ADMINISTRACION', 'otra@gala.test'],
    ];
    const html = pagina(arrancar({ libro: { config: repetida } }));
    expect(html).toContain('aún no está configurada');
    expect(html).not.toContain('id="navegacion"');
  });

  it('con config vacía no entra nadie', () => {
    expect(pagina(arrancar({ libro: { config: [] } }))).toContain('Sin acceso');
  });

  it('un fallo inesperado se muestra sin detalles técnicos y se registra', () => {
    const entorno = arrancar();
    entorno.google.estado.libros.clear();
    const html = pagina(entorno);
    expect(html).toContain('error inesperado');
    expect(html).not.toContain('No se puede abrir el documento');
    expect(entorno.google.estado.logs.join('\n')).toContain('Error al abrir la webapp');
  });

  it('en el registro queda el motivo de la denegación, no el correo', () => {
    const entorno = arrancar({ usuario: 'extrano@gala.test' });
    pagina(entorno);
    const logs = entorno.google.estado.logs.join('\n');
    expect(logs).toContain('no-registrado');
    expect(logs).not.toContain('extrano@gala.test');
  });
});

describe('libro propio · se lee por el nombre de la cabecera', () => {
  it('encuentra las columnas aunque cambie el orden, las mayúsculas o los espacios', () => {
    const entorno = cargarWebapp({ usuario: 'sara@gala.test' });
    prepararLibro(entorno, {
      config: [['sara@gala.test', 'email_administracion']],
      estadoPasos: [],
      cabeceraConfig: [' VALOR ', 'Clave '],
    });
    expect(plano(entorno.llamar('apiContexto')).permitido).toBe(true);
  });

  it('las claves de config no distinguen mayúsculas ni espacios', () => {
    const entorno = cargarWebapp({ usuario: 'sara@gala.test' });
    prepararLibro(entorno, { config: [[' Email_Administracion ', ' SARA@gala.test ']], estadoPasos: [] });
    expect(plano(entorno.llamar('leerConfiguracion_'))).toStrictEqual({ email_administracion: 'SARA@gala.test' });
    expect(plano(entorno.llamar('apiContexto')).permitido).toBe(true);
  });

  it('ignora las filas vacías', () => {
    const entorno = cargarWebapp({ usuario: 'sara@gala.test' });
    prepararLibro(entorno, {
      config: [
        ['', ''],
        ['email_administracion', 'sara@gala.test'],
        ['', ''],
      ],
      estadoPasos: [],
    });
    expect(plano(entorno.llamar('leerUsuarios_'))).toHaveLength(1);
  });

  it('acepta varios correos en una sola clave', () => {
    const entorno = cargarWebapp({ usuario: 'otra@gala.test' });
    prepararLibro(entorno, { config: [['email_administracion', 'sara@gala.test, otra@gala.test']], estadoPasos: [] });
    expect(plano(entorno.llamar('apiContexto'))).toMatchObject({ permitido: true, rol: 'administracion' });
  });

  it('el periodo que Google Sheets convierte en fecha se lee como AAAA-MM', () => {
    const entorno = arrancar({
      libro: {
        estadoPasos: [
          [new Date(Date.UTC(2026, 10, 1, 12)), 'actualizar-export-sage', 'hecho', 'sara@gala.test', '2026-11-03'],
        ],
      },
    });
    const filas = plano(entorno.llamar('leerEstadoPasos_'));
    expect(filas[0].periodo).toBe('2026-11');
  });
});

describe('funciones api… · el contrato con el navegador', () => {
  it('apiContexto devuelve el rol y las nueve pantallas a quien tiene acceso', () => {
    const contexto = plano(arrancar().llamar('apiContexto'));
    expect(contexto).toMatchObject({ permitido: true, rol: 'administracion', correo: 'sara@gala.test' });
    expect(contexto.pantallas.map((p) => p.id)).toHaveLength(9);
  });

  it('apiContexto a un extraño le dice que no, sin pantallas ni rol', () => {
    const contexto = plano(arrancar({ usuario: 'extrano@gala.test' }).llamar('apiContexto'));
    expect(contexto).toMatchObject({ permitido: false, rol: '', pantallas: [] });
  });

  it('apiPasosDelPeriodo devuelve los pasos con el estado guardado en el libro', () => {
    const entorno = arrancar({
      libro: {
        estadoPasos: [
          ['2026-11', 'actualizar-bbdd-personas', 'hecho', 'sara@gala.test', '2026-11-03'],
          ['2026-10', 'actualizar-bbdd-personas', 'con-incidencias', 'sara@gala.test', '2026-10-03'],
        ],
      },
    });
    const { pasos } = plano(entorno.llamar('apiPasosDelPeriodo', '2026-11'));
    expect(pasos.map((x) => x.estado)).toStrictEqual(['hecho', 'pendiente', 'pendiente']);
    expect(pasos[0].actualizadoPor).toBe('sara@gala.test');
  });

  it('si falta la hoja de estado de los pasos, lo dice con claridad', () => {
    const entorno = cargarWebapp({ usuario: 'sara@gala.test' });
    prepararLibro(entorno, { config: CONFIG_NORMAL });
    expect(() => entorno.llamar('apiPasosDelPeriodo', '2026-11')).toThrow('Falta la hoja «estado_pasos»');
  });

  it('LA PUERTA OLVIDADA: toda función api… rechaza a un extraño (se descubren leyendo el código)', () => {
    const nombres = ARCHIVOS_GS.flatMap((f) =>
      [...readFileSync(join(SRC_WEBAPP, f), 'utf8').matchAll(/^function (api\w+)\(/gm)].map((m) => m[1]),
    );
    expect(nombres).toContain('apiContexto');
    expect(nombres).toContain('apiPasosDelPeriodo');
    expect(nombres).toContain('apiMarcarPasoRealizado');
    for (const nombre of nombres) {
      const entorno = arrancar({ usuario: 'extrano@gala.test' });
      let resultado;
      let lanzo = false;
      try {
        resultado = plano(entorno.llamar(nombre, '2026-11', 'actualizar-bbdd-personas'));
      } catch (error) {
        lanzo = true;
        expect(error.message).toMatch(/No tienes acceso/);
      }
      if (!lanzo) expect(resultado.permitido, `${nombre} dejó pasar a un extraño`).toBe(false);
    }
  });
});

describe('lectura y escritura del estado de los pasos', () => {
  const FILA_HECHA = ['2026-11', 'actualizar-export-sage', 'hecho', 'sara@gala.test', '2026-11-03'];

  it('abrir la aplicación y pedir los pasos NO modifica ninguna hoja del libro', () => {
    const entorno = arrancar({ libro: { estadoPasos: [FILA_HECHA] } });
    const antes = volcado(entorno);
    pagina(entorno);
    entorno.llamar('apiContexto');
    entorno.llamar('apiPasosDelPeriodo', '2026-11');
    expect(volcado(entorno)).toStrictEqual(antes);
  });

  it('marcar un paso añade UNA fila a estado_pasos y no toca config', () => {
    const entorno = arrancar();
    const antes = volcado(entorno);
    const { pasos } = plano(entorno.llamar('apiMarcarPasoRealizado', '2026-11', 'actualizar-bbdd-personas'));
    const despues = volcado(entorno);
    expect(despues[0]).toStrictEqual(antes[0]);
    expect(despues[1]).toHaveLength(2);
    const [periodo, paso, estado, quien, cuando] = despues[1][1];
    expect([periodo, paso, estado, quien]).toStrictEqual([
      '2026-11',
      'actualizar-bbdd-personas',
      'hecho',
      'sara@gala.test',
    ]);
    expect(cuando).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    expect(pasos[0]).toMatchObject({ estado: 'hecho', actualizadoPor: 'sara@gala.test' });
  });

  it('lo marcado se lee de vuelta, aunque Sheets haya convertido el periodo y la hora en fechas', () => {
    const entorno = arrancar();
    entorno.llamar('apiMarcarPasoRealizado', '2026-11', 'actualizar-bbdd-personas');
    const { pasos } = plano(entorno.llamar('apiPasosDelPeriodo', '2026-11'));
    expect(pasos[0].estado).toBe('hecho');
    expect(pasos[0].actualizadoEn).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  });

  it('un extraño NO escribe nada', () => {
    const entorno = arrancar({ usuario: 'extrano@gala.test' });
    const antes = volcado(entorno);
    expect(() => entorno.llamar('apiMarcarPasoRealizado', '2026-11', 'actualizar-bbdd-personas')).toThrow(
      'No tienes acceso',
    );
    expect(volcado(entorno)).toStrictEqual(antes);
  });

  it('si el bloqueo está ocupado no se escribe y se dice', () => {
    const entorno = arrancar();
    entorno.google.estado.bloqueoOcupado = true;
    const antes = volcado(entorno);
    expect(() => entorno.llamar('apiMarcarPasoRealizado', '2026-11', 'actualizar-bbdd-personas')).toThrow();
    expect(volcado(entorno)).toStrictEqual(antes);
  });
});

describe('altas y bajas · contra el maestro, VAP_Pagos y el registro (libros falsos, datos inventados)', () => {
  const IBAN = 'ES9121000418450200051332';
  const ALTA = {
    accion: 'alta',
    nombre: 'Ana',
    apellidos: 'Ficticia',
    dni: '12345678Z',
    fecha: '2026-11-03',
    empresa: 'Empresa Uno',
  };

  const arrancarPersonal = ({ usuario = 'sara@gala.test', personal = {}, config = CONFIG_PERSONAL } = {}) => {
    const entorno = cargarWebapp({ usuario });
    prepararLibro(entorno, { config, estadoPasos: [], registroPersonal: [] });
    prepararPersonal(entorno, personal);
    return entorno;
  };
  const hoja = (entorno, idLibro, nombre) => entorno.google.estado.libros.get(idLibro).getSheetByName(nombre).volcar();
  const registrar = (entorno, registros) => plano(entorno.llamar('apiRegistrarPersonas', registros));

  it('un alta escribe la persona al final de la pestaña de su empresa, con el DNI normalizado', () => {
    const entorno = arrancarPersonal();
    const [r] = registrar(entorno, [{ ...ALTA, dni: '12345678z', idTrabajador: 'T1' }]);
    expect(r.estado).toBe('aplicado');
    expect(hoja(entorno, ID_MAESTRO, 'Uno')[1]).toStrictEqual(['T1', 'Ana', 'Ficticia', '12345678Z', '2026-11-03', '']);
    expect(hoja(entorno, ID_MAESTRO, 'Empresa Dos')).toHaveLength(1);
  });

  it('una empresa sin «=» usa su propio nombre como pestaña', () => {
    const entorno = arrancarPersonal();
    registrar(entorno, [{ ...ALTA, empresa: 'Empresa Dos' }]);
    expect(hoja(entorno, ID_MAESTRO, 'Empresa Dos')).toHaveLength(2);
  });

  it('una baja pone la fecha de baja de esa persona y nada más', () => {
    const fila = ['T1', 'Ana', 'Ficticia', '12345678Z', '2025-01-01', ''];
    const entorno = arrancarPersonal({
      personal: { filasMaestro: [fila, ['T2', 'Luis', 'Falso', '87654321X', '2025-02-01', '']] },
    });
    const [r] = registrar(entorno, [{ ...ALTA, accion: 'baja', fecha: '2026-11-30' }]);
    expect(r.estado).toBe('completo');
    const maestro = hoja(entorno, ID_MAESTRO, 'Uno');
    expect(maestro[1][5]).toBe('2026-11-30');
    expect(maestro[2]).toStrictEqual(['T2', 'Luis', 'Falso', '87654321X', '2025-02-01', '']);
  });

  it.each([
    ['dar de alta a quien ya consta', 'alta', [['T1', 'Ana', 'F', '12345678Z', '2025-01-01', '']], 'ya consta'],
    ['dar de baja a quien no está', 'baja', [], 'No se encuentra'],
    [
      'dar de baja a quien ya tiene baja',
      'baja',
      [['T1', 'Ana', 'F', '12345678Z', '2025-01-01', '2026-01-01']],
      'ya tiene fecha de baja',
    ],
    [
      'dar de baja a quien aparece dos veces',
      'baja',
      [
        ['T1', 'A', 'F', '12345678Z', '', ''],
        ['T2', 'A', 'F', '12345678Z', '', ''],
      ],
      'más de una vez',
    ],
  ])('rechaza %s, deja el error anotado y no toca el maestro', (_n, accion, filasMaestro, texto) => {
    const entorno = arrancarPersonal({ personal: { filasMaestro } });
    const antes = hoja(entorno, ID_MAESTRO, 'Uno');
    const [r] = registrar(entorno, [{ ...ALTA, accion }]);
    expect(r.estado).toBe('error');
    expect(r.detalle).toContain(texto);
    expect(hoja(entorno, ID_MAESTRO, 'Uno')).toStrictEqual(antes);
    const registro = hoja(entorno, 'libro-webapp-prueba', 'registro_personal');
    expect(registro.map((f) => f[6]).slice(1)).toStrictEqual(['registrado', 'error']);
  });

  it('el registro deja una fila por paso: quién, cuándo, acción, empresa e identificador, y NADA personal', () => {
    const entorno = arrancarPersonal();
    registrar(entorno, [{ ...ALTA, idTrabajador: 'T1' }]);
    const registro = hoja(entorno, 'libro-webapp-prueba', 'registro_personal');
    expect(registro).toHaveLength(3);
    expect(registro[1].slice(2, 7)).toStrictEqual(['sara@gala.test', 'alta', 'Empresa Uno', 'T1', 'registrado']);
    expect(registro[1][1]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
    const texto = JSON.stringify(registro);
    for (const secreto of ['12345678Z', 'Ana', 'Ficticia']) expect(texto).not.toContain(secreto);
  });

  describe('la cuenta bancaria · la webapp llama al servicio VAP_Pagos (dos proyectos, ADR-0019)', () => {
    const conCuenta = { ...ALTA, idTrabajador: 'T1', iban: IBAN };
    const arrancarConServicio = (opciones = {}) => {
      const conectado = cargarWebappConServicio({ usuario: 'sara@gala.test', ...opciones });
      prepararLibro(conectado.entorno, { config: CONFIG_PERSONAL, estadoPasos: [], registroPersonal: [] });
      prepararPersonal(conectado.entorno, { marca: true, ...(opciones.personal || {}) });
      return conectado;
    };
    const huellas = (servicio) => servicio.google.estado.libros.get(ID_LIBRO_PAGOS).getSheetByName('huellas').volcar();
    const todoDe = (entorno) =>
      JSON.stringify([...entorno.google.estado.libros.values()].map((l) => l.getSheets().map((h) => h.volcar())));

    it('guarda la cuenta en el SERVICIO (que calcula la huella con SU clave) y marca en el maestro que consta', () => {
      const { entorno, servicio } = arrancarConServicio();
      const [r] = registrar(entorno, [conCuenta]);
      expect(r.estado).toBe('completo');
      const [, fila] = huellas(servicio);
      expect(fila[0]).toBe('Empresa Uno_T1');
      expect(fila[1]).toMatch(/^[0-9a-f]{64}$/);
      expect(fila[2]).toBe(IBAN.slice(-4));
      const maestro = hoja(entorno, ID_MAESTRO, 'Uno')[1];
      expect(maestro[6]).toBe('sí');
      expect(maestro[7]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('RNF-21 · la clave de la huella NO está en la webapp: ni propiedad, ni cálculo', () => {
      const { entorno } = arrancarConServicio();
      registrar(entorno, [conCuenta]);
      expect(Object.keys(entorno.google.estado.propiedadesScript)).not.toContain('CLAVE_HUELLA');
      expect(Object.keys(entorno.google.estado.propiedadesScript).sort()).toStrictEqual([
        'ID_LIBRO_WEBAPP',
        'TOKEN_SERVICIO_PAGOS',
        'URL_SERVICIO_PAGOS',
      ]);
    });

    it('LA CUENTA NO ESTÁ EN NINGUNA HOJA, NI EN EL REGISTRO, NI EN LOS LOGS DE NINGUNO DE LOS DOS PROYECTOS (RNF-19)', () => {
      const { entorno, servicio } = arrancarConServicio();
      registrar(entorno, [conCuenta]);
      for (const proyecto of [entorno, servicio]) {
        expect(todoDe(proyecto)).not.toContain(IBAN);
        expect(todoDe(proyecto)).not.toContain(IBAN.slice(4));
        expect(proyecto.google.estado.logs.join('\n')).not.toContain(IBAN);
      }
    });

    it('el servicio rechaza una llamada sin el token correcto: el alta con cuenta queda en error y sin huella', () => {
      const { entorno, servicio } = arrancarConServicio();
      entorno.google.estado.propiedadesScript.TOKEN_SERVICIO_PAGOS = 'otro-token';
      const [r] = registrar(entorno, [conCuenta]);
      expect(r.estado).toBe('error');
      expect(r.detalle).toContain('la cuenta NO se guardó');
      expect(huellas(servicio)).toHaveLength(1);
      expect(todoDe(entorno)).not.toContain(IBAN);
    });

    it('si el servicio no responde bien, lo dice y deja anotado el alta ya aplicada', () => {
      const { entorno } = arrancarConServicio();
      entorno.google.estado.propiedadesScript.URL_SERVICIO_PAGOS = 'https://otro.prueba/exec';
      const [r] = registrar(entorno, [conCuenta]);
      expect(r.estado).toBe('error');
      expect(r.detalle).toContain('código 404');
      const registro = hoja(entorno, 'libro-webapp-prueba', 'registro_personal');
      expect(registro.map((f) => f[6]).slice(1)).toStrictEqual(['registrado', 'aplicado', 'error']);
      expect(hoja(entorno, ID_MAESTRO, 'Uno')).toHaveLength(2);
    });

    it('sin el servicio configurado, la pantalla no se ofrece a guardar cuentas y el alta con cuenta falla sin dejarla en ningún sitio', () => {
      const entorno = cargarWebapp({ usuario: 'sara@gala.test' });
      prepararLibro(entorno, { config: CONFIG_PERSONAL, estadoPasos: [], registroPersonal: [] });
      prepararPersonal(entorno, { marca: true });
      expect(plano(entorno.llamar('apiOpcionesPersonal')).cuentaConfigurada).toBe(false);
      const [r] = registrar(entorno, [conCuenta]);
      expect(r.estado).toBe('error');
      expect(todoDe(entorno)).not.toContain(IBAN);
    });

    it('si falta la marca en el maestro, la cuenta consta en VAP_Pagos pero el alta queda en error y lo dice', () => {
      const { entorno, servicio } = arrancarConServicio({ personal: { marca: false } });
      const [r] = registrar(entorno, [conCuenta]);
      expect(r.estado).toBe('error');
      expect(r.detalle).toContain('NO se pudo marcar en el maestro');
      expect(huellas(servicio)).toHaveLength(2);
    });
  });

  describe('lo que no está configurado se niega con claridad', () => {
    it('sin las claves del maestro y las empresas no escribe nada', () => {
      const entorno = arrancarPersonal({ config: CONFIG_NORMAL });
      expect(() => registrar(entorno, [ALTA])).toThrow('no está configurado');
      expect(hoja(entorno, 'libro-webapp-prueba', 'registro_personal')).toHaveLength(1);
    });

    it('si falta la pestaña de la empresa en el maestro lo dice y queda anotado', () => {
      const entorno = arrancarPersonal();
      entorno.google.estado.libros.delete(ID_MAESTRO);
      entorno.google.libro(ID_MAESTRO, 'VAP_BBDD_Personas').conHoja('Otra', [['id_trabajador']]);
      const [r] = registrar(entorno, [ALTA]);
      expect(r).toMatchObject({ estado: 'error' });
      expect(r.detalle).toContain('Falta la pestaña «Uno»');
    });

    it('si al maestro le falta una columna lo dice y no escribe', () => {
      const entorno = arrancarPersonal();
      entorno.google.estado.libros.delete(ID_MAESTRO);
      entorno.google.libro(ID_MAESTRO, 'VAP_BBDD_Personas').conHoja('Uno', [['id_trabajador', 'nombre']]);
      const [r] = registrar(entorno, [ALTA]);
      expect(r.estado).toBe('error');
      expect(r.detalle).toContain('faltan las columnas');
      expect(hoja(entorno, ID_MAESTRO, 'Uno')).toHaveLength(1);
    });

    it('si falta la hoja registro_personal no escribe nada en el maestro', () => {
      const entorno = cargarWebapp({ usuario: 'sara@gala.test' });
      prepararLibro(entorno, { config: CONFIG_PERSONAL, estadoPasos: [] });
      prepararPersonal(entorno);
      expect(() => registrar(entorno, [ALTA])).toThrow('Falta la hoja «registro_personal»');
      expect(hoja(entorno, ID_MAESTRO, 'Uno')).toHaveLength(1);
    });
  });

  it('apiOpcionesPersonal no devuelve ningún identificador de libro ni clave', () => {
    const entorno = arrancarPersonal();
    const texto = JSON.stringify(plano(entorno.llamar('apiOpcionesPersonal')));
    expect(texto).not.toContain(ID_MAESTRO);
    expect(plano(entorno.llamar('apiOpcionesPersonal')).empresas).toStrictEqual(['Empresa Uno', 'Empresa Dos']);
  });

  it('un extraño no valida, no registra y no ve las opciones', () => {
    const entorno = arrancarPersonal({ usuario: 'extrano@gala.test' });
    for (const [nombre, args] of [
      ['apiOpcionesPersonal', []],
      ['apiValidarPersonas', [[ALTA]]],
      ['apiRegistrarPersonas', [[ALTA]]],
    ]) {
      expect(() => entorno.llamar(nombre, ...args), nombre).toThrow('No tienes acceso');
    }
    expect(hoja(entorno, ID_MAESTRO, 'Uno')).toHaveLength(1);
  });
});
