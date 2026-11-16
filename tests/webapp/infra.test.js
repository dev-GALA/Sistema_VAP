// Pruebas de integración de la webapp: el código real contra el Google falso (hojas en memoria).
// Cubre el libro propio (ADR-0018), el punto de entrada y que NINGUNA función `api…` se abre a un extraño.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { plano, SRC_WEBAPP } from '../soporte/cargar-gs.js';
import { ARCHIVOS_GS, CONFIG_NORMAL, cargarWebapp, prepararLibro } from './cargar.js';

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
    expect(html).toContain('webapp v0.1.0');
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
  it('apiContexto devuelve el rol y las cinco pantallas a quien tiene acceso', () => {
    const contexto = plano(arrancar().llamar('apiContexto'));
    expect(contexto).toMatchObject({ permitido: true, rol: 'administracion', correo: 'sara@gala.test' });
    expect(contexto.pantallas.map((p) => p.id)).toHaveLength(5);
  });

  it('apiContexto a un extraño le dice que no, sin pantallas ni rol', () => {
    const contexto = plano(arrancar({ usuario: 'extrano@gala.test' }).llamar('apiContexto'));
    expect(contexto).toMatchObject({ permitido: false, rol: '', pantallas: [] });
  });

  it('apiPasosDelPeriodo devuelve los pasos con el estado guardado en el libro', () => {
    const entorno = arrancar({
      libro: {
        estadoPasos: [
          ['2026-11', 'actualizar-export-sage', 'hecho', 'sara@gala.test', '2026-11-03'],
          ['2026-10', 'actualizar-export-sage', 'con-incidencias', 'sara@gala.test', '2026-10-03'],
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
    for (const nombre of nombres) {
      const entorno = arrancar({ usuario: 'extrano@gala.test' });
      let resultado;
      let lanzo = false;
      try {
        resultado = plano(entorno.llamar(nombre, '2026-11'));
      } catch (error) {
        lanzo = true;
        expect(error.message).toMatch(/No tienes acceso/);
      }
      if (!lanzo) expect(resultado.permitido, `${nombre} dejó pasar a un extraño`).toBe(false);
    }
  });
});

describe('versión 1 · solo lectura', () => {
  it('abrir la aplicación y pedir los pasos no modifica ninguna hoja del libro', () => {
    const entorno = arrancar({
      libro: { estadoPasos: [['2026-11', 'actualizar-export-sage', 'hecho', 'sara@gala.test', '2026-11-03']] },
    });
    const antes = volcado(entorno);
    pagina(entorno);
    entorno.llamar('apiContexto');
    entorno.llamar('apiPasosDelPeriodo', '2026-11');
    expect(volcado(entorno)).toStrictEqual(antes);
  });
});
