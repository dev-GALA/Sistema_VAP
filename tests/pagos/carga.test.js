// Carga inicial de cuentas, de USO ÚNICO (ADR-0020 · RF-89): reglas puras, casos de uso y recorrido contra el libro en
// memoria. Todo con datos INVENTADOS.
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { cargarPagos, DNI_1, DNI_2, ID_LIBRO_PAGOS, ibanDePrueba, prepararPagos, USUARIO_PRUEBA } from './cargar.js';

const { llamar } = cargarPagos();
const IBAN_A = ibanDePrueba(1);
const IBAN_B = ibanDePrueba(2);
const DNI_3 = '11111111H';
const NIE = 'X1234567L';

const filaExcel = (fila, dni, cuenta) => ({ fila, dni, cuenta });
const persona = (idPersonal, dni, empresa = 'Uno', activa = true) => ({ idPersonal, dni, empresa, activa });
const plan = (filasExcel, personas, registradas = []) =>
  plano(llamar('planCargaInicial_', filasExcel, personas, registradas));
const tipos = (p) => p.incidencias.map((i) => i.tipo);

describe('planCargaInicial_ · qué se carga y qué incidencias hay', () => {
  it('cruza por DNI: una cuenta por cada persona activa con ese DNI, aunque tenga dos ids', () => {
    const p = plan(
      [filaExcel(2, DNI_1, IBAN_A)],
      [persona('UNO_1', DNI_1), persona('DOS_7', DNI_1, 'Dos'), persona('UNO_2', DNI_2)],
    );
    expect(p.cuentas.map((c) => [c.idPersonal, c.dni, c.iban])).toEqual([
      ['UNO_1', DNI_1, IBAN_A],
      ['DOS_7', DNI_1, IBAN_A],
    ]);
  });

  it('normaliza el DNI y la cuenta del Excel (espacios, guiones, minúsculas)', () => {
    const espaciada = IBAN_A.replace(/(.{4})/g, '$1 ').toLowerCase();
    const p = plan([filaExcel(2, ' 1234-5678z ', espaciada)], [persona('UNO_1', DNI_1)]);
    expect(p.cuentas).toEqual([{ idPersonal: 'UNO_1', dni: DNI_1, iban: IBAN_A, fila: 2 }]);
  });

  it('las filas sin DNI ni cuenta (títulos de empresa, vacías) se ignoran y se cuentan', () => {
    const p = plan([filaExcel(2, '', ''), filaExcel(3, DNI_1, IBAN_A)], [persona('UNO_1', DNI_1)]);
    expect(p.resumen.ignoradas).toBe(1);
    expect(p.incidencias.filter((i) => i.tipo !== 'sin-cuenta-en-excel')).toEqual([]);
  });

  it('un DNI repetido con la MISMA cuenta se carga una vez; con cuentas DISTINTAS no se carga ninguna', () => {
    const igual = plan([filaExcel(2, DNI_1, IBAN_A), filaExcel(9, DNI_1, IBAN_A)], [persona('UNO_1', DNI_1)]);
    expect(igual.cuentas).toHaveLength(1);
    expect(igual.resumen.repetidas).toBe(1);
    const distinta = plan([filaExcel(2, DNI_1, IBAN_A), filaExcel(9, DNI_1, IBAN_B)], [persona('UNO_1', DNI_1)]);
    expect(distinta.cuentas).toEqual([]);
    expect(tipos(distinta)).toEqual(['cuentas-distintas', 'cuentas-distintas']);
    expect(distinta.incidencias[0].detalle).toContain('2, 9');
  });

  it('cada fila mala da su incidencia con la fila y el motivo, sin repetir nunca la cuenta', () => {
    const p = plan(
      [
        filaExcel(2, '', IBAN_A),
        filaExcel(3, '050986557L', IBAN_A),
        filaExcel(4, DNI_1, ''),
        filaExcel(5, DNI_2, 'ES00 1234'),
      ],
      [],
    );
    expect(tipos(p)).toEqual(['sin-dni', 'dni-invalido', 'sin-cuenta', 'cuenta-invalida']);
    expect(p.incidencias.map((i) => i.fila)).toEqual([2, 3, 4, 5]);
    expect(JSON.stringify(p)).not.toContain(IBAN_A);
    expect(JSON.stringify(p)).not.toContain('ES001234');
  });

  it('un DNI del Excel sin persona ACTIVA en el maestro se avisa (baja, otro DNI o error)', () => {
    const p = plan([filaExcel(2, DNI_1, IBAN_A)], [persona('UNO_1', DNI_1, 'Uno', false)]);
    expect(p.cuentas).toEqual([]);
    expect(tipos(p)).toEqual(['sin-persona-activa']);
    expect(p.incidencias[0]).toMatchObject({ fila: 2, dni: DNI_1 });
  });

  it('las personas activas del maestro sin cuenta en el Excel salen con su id; y las de DNI inválido también', () => {
    const p = plan(
      [filaExcel(2, DNI_1, IBAN_A)],
      [persona('UNO_1', DNI_1), persona('UNO_2', DNI_2), persona('UNO_3', '0509')],
    );
    expect(p.incidencias.map((i) => [i.tipo, i.idPersonal])).toEqual([
      ['dni-invalido', 'UNO_3'],
      ['sin-cuenta-en-excel', 'UNO_2'],
    ]);
  });

  it('lo ya registrado no se toca (se puede repetir la carga) y se cuenta', () => {
    const p = plan(
      [filaExcel(2, DNI_1, IBAN_A), filaExcel(3, DNI_2, IBAN_B)],
      [persona('UNO_1', DNI_1), persona('UNO_2', DNI_2)],
      ['UNO_1'],
    );
    expect(p.cuentas.map((c) => c.idPersonal)).toEqual(['UNO_2']);
    expect(p.resumen.yaRegistradas).toBe(1);
  });

  it('el resumen cuenta filas, cuentas a cargar e incidencias por tipo', () => {
    const p = plan([filaExcel(2, DNI_1, IBAN_A), filaExcel(3, '', IBAN_B)], [persona('UNO_1', DNI_1)]);
    expect(p.resumen).toMatchObject({ filasLeidas: 2, cuentasACargar: 1, incidenciasPorTipo: { 'sin-dni': 1 } });
  });

  it('acepta NIE', () => {
    expect(plan([filaExcel(2, NIE, IBAN_A)], [persona('UNO_1', NIE)]).cuentas).toHaveLength(1);
  });
});

/** Dependencias falsas de la carga: el Excel de la carga inicial, el maestro, las huellas y el informe en memoria. */
function dependenciasDeCarga({ excel = [], personas = [], huellas = [], tiempo = () => true } = {}) {
  const estado = { huellas: [...huellas], informe: null, marcados: null, hojas: null };
  let n = 0;
  return {
    estado,
    clave: () => 'clave',
    calcularHmacHex: (texto, clave) => createHmac('sha256', clave).update(texto).digest('hex'),
    ahora: () => '2026-11-25 10:00',
    nuevoId: () => `id-${++n}`,
    conBloqueo: (accion) => accion(),
    leerHuellas: () => estado.huellas,
    guardarHuella: (fila) => {
      estado.huellas = estado.huellas.filter((h) => h.idPersonal !== fila.idPersonal).concat(fila);
    },
    leerCuentasDelExcel: () => excel,
    leerPersonasMaestro: () => personas,
    escribirInformeCarga: (filas) => {
      estado.informe = filas;
    },
    escribirHojasDeCarga: (hojas) => {
      estado.hojas = hojas;
    },
    marcarHuellaEnMaestro: (ids) => {
      estado.marcados = ids;
      return ids.length;
    },
    quedaTiempo: tiempo,
  };
}
const excelYPersonas = () => ({
  excel: [filaExcel(2, DNI_1, IBAN_A), filaExcel(3, DNI_2, IBAN_B)],
  personas: [persona('UNO_1', DNI_1), persona('UNO_2', DNI_2)],
});

describe('cargaInicial_ · simulación y carga real', () => {
  it('la SIMULACIÓN no guarda nada, escribe el informe y no lleva la cuenta', () => {
    const d = dependenciasDeCarga(excelYPersonas());
    const r = plano(llamar('cargaInicial_', d, { simulacion: true, usuario: USUARIO_PRUEBA }));
    expect(d.estado.huellas).toEqual([]);
    expect(r).toMatchObject({ simulacion: true, guardadas: 0, pendientes: 2 });
    expect(d.estado.informe.length).toBeGreaterThan(0);
    expect(JSON.stringify([r, d.estado.informe])).not.toContain(IBAN_A);
  });

  it('la carga REAL guarda una fila por persona, con quién la cargó, y no deja la cuenta en ningún sitio', () => {
    const d = dependenciasDeCarga(excelYPersonas());
    const r = plano(llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA }));
    expect(r).toMatchObject({ guardadas: 2, pendientes: 0, erroresAlGuardar: 0 });
    expect(d.estado.huellas.map((h) => [h.idPersonal, h.dni, h.actualizadoPor])).toEqual([
      ['UNO_1', DNI_1, USUARIO_PRUEBA],
      ['UNO_2', DNI_2, USUARIO_PRUEBA],
    ]);
    expect(JSON.stringify([r, d.estado])).not.toContain(IBAN_A);
    expect(JSON.stringify([r, d.estado])).not.toContain(IBAN_B);
  });

  it('repetir la carga no duplica ni sustituye lo ya registrado', () => {
    const d = dependenciasDeCarga(excelYPersonas());
    llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA });
    const antes = JSON.stringify(d.estado.huellas);
    const r = plano(llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA }));
    expect(r).toMatchObject({ guardadas: 0, pendientes: 0 });
    expect(JSON.stringify(d.estado.huellas)).toBe(antes);
  });

  it('si se acaba el tiempo, para y dice cuántas quedan pendientes; al repetir continúa', () => {
    let turnos = 0;
    const d = dependenciasDeCarga({ ...excelYPersonas(), tiempo: () => turnos++ < 1 });
    const primera = plano(llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA, tamanoLote: 1 }));
    expect(primera).toMatchObject({ guardadas: 1, pendientes: 1 });
    d.quedaTiempo = () => true;
    const segunda = plano(llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA, tamanoLote: 1 }));
    expect(segunda).toMatchObject({ guardadas: 1, pendientes: 0 });
    expect(d.estado.huellas).toHaveLength(2);
  });

  it('escribe las ocho hojas de detalle, y las incidencias van ahí y no en el informe de VAP_Pagos', () => {
    const d = dependenciasDeCarga({
      excel: [filaExcel(2, DNI_1, IBAN_A), filaExcel(3, '050986557L', IBAN_B)],
      personas: [persona('UNO_1', DNI_1)],
    });
    llamar('cargaInicial_', d, { simulacion: true, usuario: USUARIO_PRUEBA });
    expect(d.estado.hojas.map((h) => h.clave)).toEqual([
      'repetidas',
      'dni-invalido',
      'id-repetido',
      'sin-cuenta',
      'sin-persona-activa',
      'cuentas-distintas',
      'sin-cuenta-en-excel',
      'con-huella',
    ]);
    expect(d.estado.hojas.find((h) => h.clave === 'dni-invalido').filas).toHaveLength(1);
    expect(d.estado.informe.every((f) => f[0] === 'RESUMEN')).toBe(true);
  });

  it('en la carga real, «con-huella» lista a las personas guardadas', () => {
    const d = dependenciasDeCarga(excelYPersonas());
    llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA });
    const hoja = d.estado.hojas.find((h) => h.clave === 'con-huella');
    expect(hoja.filas.map((f) => [f[2], f[6]])).toEqual([
      ['UNO_1', 'Con huella'],
      ['UNO_2', 'Con huella'],
    ]);
  });

  it('un error al guardar una cuenta no impide las demás y queda en el informe sin la cuenta', () => {
    const d = dependenciasDeCarga(excelYPersonas());
    const guardar = d.guardarHuella;
    d.guardarHuella = (fila) => {
      if (fila.idPersonal === 'UNO_1') throw new Error('Fallo simulado al escribir');
      guardar(fila);
    };
    const r = plano(llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA }));
    expect(r).toMatchObject({ guardadas: 1, erroresAlGuardar: 1, pendientes: 0 });
    expect(d.estado.huellas.map((h) => h.idPersonal)).toEqual(['UNO_2']);
    const fallo = d.estado.informe.find((f) => f[0] === 'error-al-guardar');
    expect(fallo).toEqual(['error-al-guardar', 2, DNI_1, 'UNO_1', 'Fallo simulado al escribir']);
    expect(JSON.stringify(d.estado.informe)).not.toContain(IBAN_A);
  });

  it('la carga real marca la casilla Huella de todas las personas con huella; la simulación no marca nada', () => {
    const real = dependenciasDeCarga(excelYPersonas());
    const r = plano(llamar('cargaInicial_', real, { simulacion: false, usuario: USUARIO_PRUEBA }));
    expect(real.estado.marcados).toEqual(['UNO_1', 'UNO_2']);
    expect(r.marcadas).toBe(2);
    const simulada = dependenciasDeCarga(excelYPersonas());
    llamar('cargaInicial_', simulada, { simulacion: true, usuario: USUARIO_PRUEBA });
    expect(simulada.estado.marcados).toBeNull();
  });

  it('si falla el marcado, las huellas ya guardadas se quedan y el fallo sale en el informe', () => {
    const d = dependenciasDeCarga(excelYPersonas());
    d.marcarHuellaEnMaestro = () => {
      throw new Error('Rango protegido');
    };
    const r = plano(llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA }));
    expect(r).toMatchObject({ guardadas: 2, marcadas: 0 });
    expect(d.estado.huellas).toHaveLength(2);
    expect(d.estado.informe.some((f) => f[0] === 'error-al-marcar' && f[4].includes('Rango protegido'))).toBe(true);
  });

  it('los avisos del servicio (mismo DNI, otro id) salen en el informe', () => {
    const d = dependenciasDeCarga({
      excel: [filaExcel(2, DNI_1, IBAN_A)],
      personas: [persona('UNO_1', DNI_1), persona('DOS_7', DNI_1, 'Dos')],
    });
    const r = plano(llamar('cargaInicial_', d, { simulacion: false, usuario: USUARIO_PRUEBA }));
    expect(r.avisos).toBe(1);
    expect(d.estado.informe.some((f) => f[0] === 'aviso')).toBe(true);
  });
});

describe('recorrido contra el libro en memoria · cargaInicialSimular / cargaInicialEjecutar', () => {
  const ID_MAESTRO = 'maestro-prueba';
  const ID_EXCEL = 'excel-prueba';

  function arrancar() {
    const entorno = cargarPagos();
    prepararPagos(entorno);
    const maestro = entorno.google.libro(ID_MAESTRO, 'VAP_BBDD_Personas');
    const cabecera = ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre', 'DNI', 'Alta', 'Huella'];
    maestro.conHoja('VAP_Staff', [cabecera, ['UNO', 1, 'UNO_1', 'NOMBRE FALSO, A', DNI_1, true, false]]);
    maestro.conHoja('VAP_Secretarias', [
      ['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre_Secretaria', 'DNI', 'Alta', 'Huella'],
      ['UNO', 2, 'UNO_2', 'NOMBRE FALSO, B', DNI_2, true, false],
      ['UNO', 3, 'UNO_3', 'NOMBRE FALSO, C', DNI_3, false, false],
    ]);
    maestro.conHoja('VAP_Profesores', [['Empresa', 'Id_Sage', 'id_trabajador', 'Nombre', 'DNI', 'Alta', 'Huella']]);
    entorno.google.libro(ID_EXCEL, 'Carga inicial temporal').conHoja('Altas Combinadas', [
      ['EMPRESA/APELLIDOS Y NOMBRE EMPLEADO', 'DNI', 'Nº DE CUENTA BANCARIA'],
      ['UNO', '', ''],
      ['NOMBRE FALSO, A', DNI_1, IBAN_A],
      ['NOMBRE FALSO, B', DNI_2, IBAN_B],
    ]);
    const propiedades = entorno.google.estado.propiedadesScript;
    propiedades.ID_LIBRO_VAP_Personas = ID_MAESTRO;
    propiedades.ID_LIBRO_CARGA_INICIAL = ID_EXCEL;
    return entorno;
  }
  const hoja = (entorno, nombre) =>
    plano(entorno.google.estado.libros.get(ID_LIBRO_PAGOS).getSheetByName(nombre).volcar());
  const libroEntero = (entorno) =>
    JSON.stringify(
      entorno.google.estado.libros
        .get(ID_LIBRO_PAGOS)
        .getSheets()
        .map((h) => h.volcar()),
    );

  it('la simulación escribe solo el informe de la carga: ni una fila en `huellas`', () => {
    const entorno = arrancar();
    entorno.llamar('cargaInicialSimular');
    expect(hoja(entorno, 'huellas')).toHaveLength(1);
    const informe = hoja(entorno, 'carga_inicial');
    expect(informe[0]).toEqual(['tipo', 'fila_excel', 'dni', 'id_trabajador', 'detalle']);
    expect(informe.some((f) => f[0] === 'RESUMEN')).toBe(true);
    expect(libroEntero(entorno)).not.toContain(IBAN_A);
  });

  it('la carga real lee las tres pestañas del maestro, solo las personas activas, y guarda las huellas', () => {
    const entorno = arrancar();
    entorno.llamar('cargaInicialEjecutar');
    const huellas = hoja(entorno, 'huellas');
    expect(huellas.slice(1).map((f) => [f[1], f[2]])).toEqual([
      [DNI_1, 'UNO_1'],
      [DNI_2, 'UNO_2'],
    ]);
    expect(huellas[1][3]).toBe(createHmac('sha256', 'clave-de-prueba-no-real').update(IBAN_A).digest('hex'));
    expect(libroEntero(entorno)).not.toContain(IBAN_A);
    expect(libroEntero(entorno)).not.toContain(IBAN_B);
    expect(JSON.stringify(entorno.google.estado.logs)).not.toContain(IBAN_A);
  });

  it('la carga real marca Huella en el maestro SOLO de quien tiene huella, y no toca nada más', () => {
    const entorno = arrancar();
    entorno.llamar('cargaInicialEjecutar');
    const maestro = entorno.google.estado.libros.get(ID_MAESTRO);
    const casilla = (pestana, fila) => plano(maestro.getSheetByName(pestana).volcar())[fila][6];
    expect(casilla('VAP_Staff', 1)).toBe(true); // UNO_1
    expect(casilla('VAP_Secretarias', 1)).toBe(true); // UNO_2
    expect(casilla('VAP_Secretarias', 2)).toBe(false); // UNO_3: de baja y sin huella
    expect(plano(maestro.getSheetByName('VAP_Staff').volcar())[1].slice(0, 6)).toEqual([
      'UNO',
      1,
      'UNO_1',
      'NOMBRE FALSO, A',
      DNI_1,
      true,
    ]);
  });

  it('las hojas de detalle van al libro TEMPORAL, con nombre y DNI pero sin la cuenta; VAP_Pagos no recibe ningún nombre', () => {
    const entorno = arrancar();
    entorno.llamar('cargaInicialSimular');
    const temporal = entorno.google.estado.libros.get(ID_EXCEL);
    const nombres = temporal.getSheets().map((h) => h.getName());
    for (const esperado of [
      'repetidas_carga_inicial',
      'dni_invalido_carga_inicial',
      'id_repetido_carga_inicial',
      'sin_cuenta_carga_inicial',
      'sin_persona_activa_carga_inicial',
      'cuentas_distintas_carga_inicial',
      'sin_cuenta_en_excel_carga_inicial',
      'con_huella_carga_inicial',
    ])
      expect(nombres).toContain(esperado);
    const conHuella = plano(temporal.getSheetByName('con_huella_carga_inicial').volcar());
    expect(conHuella[0]).toEqual(['pestana', 'fila_maestro', 'id_trabajador', 'empresa', 'nombre', 'dni', 'estado']);
    expect(conHuella.slice(1).map((f) => [f[2], f[4], f[5], f[6]])).toEqual([
      ['UNO_1', 'NOMBRE FALSO, A', DNI_1, 'Se cargará'],
      ['UNO_2', 'NOMBRE FALSO, B', DNI_2, 'Se cargará'],
    ]);
    const detalle = JSON.stringify(
      nombres.filter((n) => n.endsWith('_carga_inicial')).map((n) => plano(temporal.getSheetByName(n).volcar())),
    );
    expect(detalle).not.toContain(IBAN_A);
    expect(detalle).not.toContain(IBAN_B);
    expect(libroEntero(entorno)).not.toContain('NOMBRE FALSO');
  });

  it('la simulación no marca ninguna casilla', () => {
    const entorno = arrancar();
    entorno.llamar('cargaInicialSimular');
    const staff = plano(entorno.google.estado.libros.get(ID_MAESTRO).getSheetByName('VAP_Staff').volcar());
    expect(staff[1][6]).toBe(false);
  });

  it('sin las propiedades del maestro o del Excel de la carga inicial se niega y lo dice', () => {
    const entorno = arrancar();
    delete entorno.google.estado.propiedadesScript.ID_LIBRO_CARGA_INICIAL;
    expect(() => entorno.llamar('cargaInicialSimular')).toThrow('ID_LIBRO_CARGA_INICIAL');
  });
});
