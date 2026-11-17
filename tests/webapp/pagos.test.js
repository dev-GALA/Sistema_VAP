// Pantallas de Pagos de la webapp: lectura de ficheros del banco, reglas, casos de uso y recorrido completo contra el
// servicio VAP_Pagos (dos proyectos conectados en memoria). HU-48 · HU-49 · HU-50 · RF-89 … RF-99. Datos INVENTADOS.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ID_LIBRO_PAGOS, ibanDePrueba } from '../pagos/cargar.js';
import { plano, SRC } from '../soporte/cargar-gs.js';
import {
  CONFIG_NORMAL,
  CONFIG_PAGOS,
  cargarWebapp,
  cargarWebappConServicio,
  ID_MAESTRO,
  prepararFuenteImportes,
  prepararLibro,
  prepararPersonal,
} from './cargar.js';

const { llamar, valor } = cargarWebapp();
const IBAN_1 = ibanDePrueba(1);
const IBAN_2 = ibanDePrueba(2);
const IBAN_X = ibanDePrueba(900);

/** Remesa ISO 20022 (pain.001) INVENTADA, con la misma forma que la del banco. */
function xml(pagos, { numero = pagos.length, suma } = {}) {
  const total = suma === undefined ? pagos.reduce((t, p) => t + Number(p.importe), 0).toFixed(2) : suma;
  const detalle = pagos
    .map(
      (p, i) => `<CdtTrfTxInf><PmtId><InstrId>I${i}</InstrId><EndToEndId>${p.ref || 'NOTPROVIDED'}</EndToEndId></PmtId>
<Amt><InstdAmt Ccy="EUR">${p.importe}</InstdAmt></Amt><CdtrAgt><FinInstnId><BICFI>BANCESMM</BICFI></FinInstnId></CdtrAgt>
<Cdtr><Nm>${p.nombre}</Nm><PstlAdr><Ctry>ES</Ctry></PstlAdr></Cdtr><CdtrAcct><Id><IBAN>${p.iban}</IBAN></Id></CdtrAcct>
<RmtInf><Ustrd>${p.concepto || 'NOMINA'}</Ustrd></RmtInf></CdtTrfTxInf>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09"><CstmrCdtTrfInitn>
<GrpHdr><MsgId>M1</MsgId><NbOfTxs>${numero}</NbOfTxs><CtrlSum>${total}</CtrlSum></GrpHdr>
<PmtInf><NbOfTxs>${numero}</NbOfTxs><CtrlSum>${total}</CtrlSum>${detalle}</PmtInf></CstmrCdtTrfInitn></Document>`;
}

const CSV_BANCO = (filas, { numero = filas.length, total = '', extra = '' } = {}) =>
  [
    'Ordenante;ES0000000000000000000000',
    `Número de pagos;${numero}`,
    `Importe total;${total}`,
    '',
    'Beneficiario;Fecha de pago;Tipo de pago;Cuenta de abono;Estado;Importe;Divisa',
    ...filas.map(
      (f) => `${f.nombre};01-11-2026;Nómina;${f.iban.replace(/(.{4})/g, '$1 ')};abonada o emitida;${f.importe};EUR`,
    ),
    'Solamente se muestran los pagos visibles en la pantalla',
    extra,
  ].join('\n');

describe('dominio-banco · leer ficheros del banco · RF-90', () => {
  const pagosXml = [
    { nombre: 'GARCIA &amp; LOPEZ, ANA', iban: IBAN_1, importe: '1234.50', ref: 'R1' },
    { nombre: 'PEREZ, LUIS', iban: IBAN_2, importe: '800.00', concepto: 'NOMINA OCT' },
  ];

  it('XML ISO 20022: lee nombre (con sus entidades), cuenta, importe, referencia y entidad del banco', () => {
    const r = plano(llamar('leerFicheroBanco_', xml(pagosXml), 'remesa.xml'));
    expect(r.errores).toStrictEqual([]);
    expect(r.pagos).toHaveLength(2);
    expect(r.pagos[0]).toStrictEqual({
      nombre: 'GARCIA & LOPEZ, ANA',
      iban: IBAN_1,
      importe: '1234.50',
      referencia: 'R1',
      banco: 'BANCESMM',
      fichero: 'remesa.xml',
    });
    expect(r.pagos[1].referencia).toBe('NOMINA OCT'); // sin EndToEndId útil, el concepto
  });

  it('CSV del listado del banco: localiza la cabecera por su texto, ignora preámbulo y pie, y quita los espacios del IBAN', () => {
    const r = plano(
      llamar(
        'leerFicheroBanco_',
        CSV_BANCO([{ nombre: 'PEREZ, LUIS', iban: IBAN_2, importe: '800,00' }]),
        'listado.csv',
      ),
    );
    expect(r.errores).toStrictEqual([]);
    expect(r.pagos).toStrictEqual([
      {
        nombre: 'PEREZ, LUIS',
        iban: IBAN_2,
        importe: '800,00',
        referencia: '',
        banco: `Entidad ${IBAN_2.slice(4, 8)}`,
        fichero: 'listado.csv',
      },
    ]);
  });

  it('un fichero que declara más pagos de los que trae se NIEGA: está incompleto', () => {
    const r = plano(llamar('leerFicheroBanco_', xml(pagosXml, { numero: 208 }), 'remesa.xml'));
    expect(r.errores[0]).toContain('declara 208 pagos y trae 2');
  });

  it('un fichero cuya suma no cuadra con la declarada se NIEGA', () => {
    const r = plano(llamar('leerFicheroBanco_', xml(pagosXml, { suma: '999999.00' }), 'remesa.xml'));
    expect(r.errores[0]).toContain('importe total');
  });

  it('el listado CSV también comprueba lo que declara su preámbulo', () => {
    const r = plano(
      llamar(
        'leerFicheroBanco_',
        CSV_BANCO([{ nombre: 'A', iban: IBAN_1, importe: '1,00' }], { numero: 208, total: '265.610,65' }),
        'l.csv',
      ),
    );
    expect(r.errores.join(' ')).toContain('declara 208 pagos y trae 1');
    expect(r.errores.join(' ')).toContain('265610,65');
  });

  it('formato no admitido, vacío, sin cabecera o con definiciones XML: se rechaza con un mensaje que no lleva datos', () => {
    expect(plano(llamar('leerFicheroBanco_', 'x', 'a.pdf')).errores[0]).toContain('formato no admitido');
    expect(plano(llamar('leerFicheroBanco_', '  ', 'a.csv')).errores[0]).toContain('vacío');
    expect(plano(llamar('leerFicheroBanco_', 'a;b\n1;2', 'a.csv')).errores[0]).toContain('cabecera');
    expect(
      plano(llamar('leerFicheroBanco_', '<!DOCTYPE x [<!ENTITY a "b">]><Document/>', 'a.xml')).errores[0],
    ).toContain('no permitida');
  });

  it('los mensajes de error no llevan nombres ni cuentas del fichero', () => {
    const r = plano(llamar('leerFicheroBanco_', xml(pagosXml, { numero: 5 }), 'remesa.xml'));
    expect(JSON.stringify(r.errores)).not.toContain(IBAN_1);
    expect(JSON.stringify(r.errores)).not.toContain('LOPEZ');
  });

  it('varios ficheros: TODOS o ninguno', () => {
    const bueno = { nombre: 'a.xml', texto: xml(pagosXml) };
    const malo = { nombre: 'b.xml', texto: xml(pagosXml, { numero: 9 }) };
    expect(plano(llamar('leerFicherosBanco_', [bueno, bueno])).pagos).toHaveLength(4);
    const mezcla = plano(llamar('leerFicherosBanco_', [bueno, malo]));
    expect(mezcla.pagos).toStrictEqual([]);
    expect(mezcla.errores).toHaveLength(1);
  });
});

describe('dominio-importes · la misma copia en los dos proyectos (DRY entre proyectos de Apps Script)', () => {
  it('dominio-importes.gs es idéntico en webapp y en pagos', () => {
    const leer = (proyecto) => readFileSync(join(SRC, proyecto, 'dominio-importes.gs'), 'utf8');
    expect(leer('webapp')).toBe(leer('pagos'));
  });
});

describe('dominio-pagos · reglas · RF-89 · RF-96 · RF-99', () => {
  const filasMaestro = [
    { idTrabajador: 'T1', nombre: 'Ana', apellidos: 'Ficticia', dni: '12345678Z', fechaBaja: '' },
    { idTrabajador: 'T2', nombre: 'Luis', apellidos: 'Falso', dni: '87654321X', fechaBaja: '' },
    { idTrabajador: 'T3', nombre: 'Baja', apellidos: 'Antigua', dni: '00000000T', fechaBaja: '2026-01-31' },
    { idTrabajador: '', nombre: 'Sin', apellidos: 'Id', dni: '11111111H', fechaBaja: '' },
  ];
  const personas = plano(llamar('personasDeEmpresa_', 'Empresa Uno', filasMaestro));

  it('personasDeEmpresa_ compone el identificador con la empresa, marca las bajas y salta lo que no tiene identificador', () => {
    expect(personas.map((p) => [p.idPersonal, p.activa])).toStrictEqual([
      ['Empresa Uno_T1', true],
      ['Empresa Uno_T2', true],
      ['Empresa Uno_T3', false],
    ]);
    expect(personas[0].nombre).toBe('Ana Ficticia');
  });

  it('esperadosDeEmpresa_ cruza por DNI solo entre activas, ignora importes vacíos o ceros y cuenta lo que no casa', () => {
    const activas = personas.filter((p) => p.activa);
    const r = plano(
      llamar('esperadosDeEmpresa_', activas, [
        { dni: '12345678z', importe: '1.000,50' },
        { dni: '87654321X', importe: '' },
        { dni: '00000000T', importe: '10,00' }, // de baja
        { dni: '12345678Z', importe: '5,00' }, // repetido
        { dni: '', importe: '3,00' },
      ]),
    );
    expect(r.esperados).toStrictEqual([{ idPersonal: 'Empresa Uno_T1', importe: '1000,50' }]);
    expect(r.dniSinPersona).toBe(1);
    expect(r.dniRepetidos).toBe(1);
  });

  it('enriquecerFilasDeInforme_ añade nombre y DNI de la persona, quita la huella y usa el nombre del banco si no consta', () => {
    const indice = plano(llamar('indexarPersonasPorId_', personas));
    const [a, b] = plano(
      llamar(
        'enriquecerFilasDeInforme_',
        [
          { idPersonal: 'Empresa Uno_T1', huella: 'x', nombreBanco: '' },
          { idPersonal: '', huella: 'y', nombreBanco: 'NOMBRE BANCO' },
        ],
        indice,
      ),
    );
    expect(a).toMatchObject({ nombre: 'Ana Ficticia', dni: '12345678Z' });
    expect(b).toMatchObject({ nombre: 'NOMBRE BANCO', dni: '' });
    expect(JSON.stringify([a, b])).not.toMatch(/"huella"/);
  });

  it('proponerCargaInicial_ clasifica cada fila y la cuenta no sale', () => {
    const porEmpresa = { 'Empresa Uno': personas.filter((p) => p.activa) };
    const filas = [
      { empresa: 'empresa uno', nombre: 'x', dni: '12345678Z', cuenta: IBAN_1 },
      { empresa: 'Empresa Uno', nombre: 'x', dni: '87654321X', cuenta: 'ES00' },
      { empresa: 'Empresa Uno', nombre: 'x', dni: '99999999R', cuenta: IBAN_2 },
      { empresa: 'Empresa Uno', nombre: 'x', dni: '12345678Z', cuenta: IBAN_2 },
      { empresa: 'Otra', nombre: 'x', dni: '87654321X', cuenta: IBAN_2 },
    ];
    const r = plano(llamar('proponerCargaInicial_', filas, porEmpresa, []));
    expect(r.map((x) => x.estado)).toStrictEqual([
      'lista',
      'cuenta-invalida',
      'sin-persona',
      'repetida',
      'sin-persona',
    ]);
    expect(r[0]).toMatchObject({ idPersonal: 'Empresa Uno_T1', ultimos4: IBAN_1.slice(-4) });
    expect(JSON.stringify(r)).not.toContain(IBAN_1);
    const yaTiene = plano(llamar('proponerCargaInicial_', [filas[0]], porEmpresa, ['Empresa Uno_T1']));
    expect(yaTiene[0].estado).toBe('ya-registrada');
  });

  it('una persona duplicada en el maestro (mismo DNI dos veces) es ambigua', () => {
    const doble = plano(
      llamar('personasDeEmpresa_', 'Empresa Uno', [filasMaestro[0], { ...filasMaestro[0], idTrabajador: 'T9' }]),
    );
    const r = plano(
      llamar(
        'proponerCargaInicial_',
        [{ empresa: 'Empresa Uno', dni: '12345678Z', cuenta: IBAN_1 }],
        { 'Empresa Uno': doble },
        [],
      ),
    );
    expect(r[0].estado).toBe('ambigua');
  });

  it('la fuente de importes está configurada solo si trae libro, hoja y las dos columnas; la hoja admite {empresa} y {periodo}', () => {
    expect(
      llamar('fuenteImportesConfigurada_', {
        vinculacion_libro_id: 'a',
        vinculacion_hoja: 'b',
        vinculacion_col_dni: 'c',
        vinculacion_col_importe: 'd',
      }),
    ).toBe(true);
    expect(llamar('fuenteImportesConfigurada_', { vinculacion_libro_id: 'a' })).toBe(false);
    expect(llamar('hojaDeFuente_', '{empresa} {periodo}', 'Uno', '2026-11')).toBe('Uno 2026-11');
  });
  it('idPersonalDe_ y el literal de la columna no se mezclan con la configuración', () => {
    expect(valor('SEPARADOR_ID_PERSONAL')).toBe('_');
  });
});

describe('recorrido completo · webapp + servicio VAP_Pagos conectados · HU-48 · HU-49 · HU-50', () => {
  const MAESTRO = [
    ['T1', 'Ana', 'Ficticia', '12345678Z', '2025-01-01', '', '', ''],
    ['T2', 'Luis', 'Falso', '87654321X', '2025-01-01', '', '', ''],
  ];

  function arrancar({ usuario = 'sara@gala.test', config = CONFIG_PAGOS, fuente = true } = {}) {
    const conectado = cargarWebappConServicio({ usuario });
    prepararLibro(conectado.entorno, { config, estadoPasos: [], registroPersonal: [] });
    prepararPersonal(conectado.entorno, { marca: true, filasMaestro: MAESTRO });
    if (fuente)
      prepararFuenteImportes(conectado.entorno, [
        ['12345678Z', '1.000,00'],
        ['87654321X', '500,00'],
      ]);
    return conectado;
  }
  const api = (entorno, nombre, ...args) => plano(entorno.llamar(nombre, ...args));
  const cargaInicial = (entorno) =>
    api(entorno, 'apiConfirmarCargaInicial', [
      { empresa: 'Empresa Uno', nombre: 'Ana', dni: '12345678Z', cuenta: IBAN_1 },
      { empresa: 'Empresa Uno', nombre: 'Luis', dni: '87654321X', cuenta: IBAN_2 },
    ]);
  const remesa = (pagos) => [{ nombre: 'remesa.xml', texto: xml(pagos) }];
  const pagoDe = (iban, importe, nombre = 'NOMBRE, APELLIDO') => ({ nombre, iban, importe });

  it('carga inicial: valida sin guardar, guarda solo las confirmadas y marca el maestro', () => {
    const { entorno, servicio } = arrancar();
    const filas = [
      { empresa: 'Empresa Uno', nombre: 'Ana', dni: '12345678Z', cuenta: IBAN_1 },
      { empresa: 'Empresa Uno', nombre: 'Zzz', dni: '99999999R', cuenta: IBAN_2 },
    ];
    expect(api(entorno, 'apiValidarCargaInicial', filas).map((r) => r.estado)).toStrictEqual(['lista', 'sin-persona']);
    expect(servicio.google.estado.libros.get(ID_LIBRO_PAGOS).getSheetByName('huellas').volcar()).toHaveLength(1);
    const r = api(entorno, 'apiConfirmarCargaInicial', filas);
    expect(r.map((x) => x.estado)).toStrictEqual(['guardada', 'error']);
    expect(r[1].detalle).toContain('sin-persona');
    expect(entorno.google.estado.libros.get(ID_MAESTRO).getSheetByName('Uno').volcar()[1][6]).toBe('sí');
    expect(JSON.stringify(entorno.google.estado.libros.get(ID_MAESTRO).getSheetByName('Uno').volcar())).not.toContain(
      IBAN_1,
    );
    // repetirla no sustituye: ya está registrada
    expect(api(entorno, 'apiValidarCargaInicial', [filas[0]])[0].estado).toBe('ya-registrada');
  });

  it('cruce de una empresa: informe en dos partes, con nombre y DNI leídos del maestro y SIN huella', () => {
    const { entorno } = arrancar();
    cargaInicial(entorno);
    const r = api(entorno, 'apiCruzarPagos', {
      periodo: '2026-11',
      empresa: 'Empresa Uno',
      ficheros: remesa([
        pagoDe(IBAN_1, '1000.00'),
        pagoDe(IBAN_2, '450.00'),
        pagoDe(IBAN_X, '9.00', 'DESCONOCIDO, PEDRO'),
      ]),
    });
    expect(r).toMatchObject({ periodo: '2026-11', empresa: 'Empresa Uno', total: 3, coincidentes: 1, incorrectos: 2 });
    const [ana, luis, desconocido] = r.filas;
    expect(ana).toMatchObject({
      estado: 'Coincidente',
      parte: 'coincide',
      nombre: 'Ana Ficticia',
      dni: '12345678Z',
      ultimos4: IBAN_1.slice(-4),
    });
    expect(luis).toMatchObject({ estado: 'Incorrecto', parte: 'coincide', nombre: 'Luis Falso' });
    expect(luis.observaciones).toContain('450,00');
    expect(luis.observaciones).toContain('500,00');
    expect(desconocido).toMatchObject({
      estado: 'Incorrecto',
      parte: 'no-existe',
      nombre: 'DESCONOCIDO, PEDRO',
      dni: '',
      banco: 'BANCESMM',
    });
    expect(JSON.stringify(r)).not.toMatch(/[0-9a-f]{64}/);
    expect(JSON.stringify(r)).not.toContain(IBAN_X);
  });

  it('LA CUENTA NO QUEDA EN NINGUNA HOJA NI EN NINGÚN LOG de la webapp ni del servicio tras el cruce (RNF-19)', () => {
    const { entorno, servicio } = arrancar();
    cargaInicial(entorno);
    api(entorno, 'apiCruzarPagos', {
      periodo: '2026-11',
      empresa: 'Empresa Uno',
      ficheros: remesa([pagoDe(IBAN_1, '1000.00'), pagoDe(IBAN_X, '9.00')]),
    });
    for (const proyecto of [entorno, servicio]) {
      const todo =
        JSON.stringify([...proyecto.google.estado.libros.values()].map((l) => l.getSheets().map((h) => h.volcar()))) +
        proyecto.google.estado.logs.join('\n');
      for (const iban of [IBAN_1, IBAN_2, IBAN_X]) expect(todo).not.toContain(iban);
    }
  });

  it('subsanar no borra el resultado original y repetir el cruce de esa empresa se niega', () => {
    const { entorno } = arrancar();
    cargaInicial(entorno);
    const datos = { periodo: '2026-11', empresa: 'Empresa Uno', ficheros: remesa([pagoDe(IBAN_2, '450.00')]) };
    const { filas } = api(entorno, 'apiCruzarPagos', datos);
    const incorrecta = filas.find((f) => f.estado === 'Incorrecto' && f.idPersonal);
    api(entorno, 'apiSubsanarPago', {
      periodo: '2026-11',
      filaId: incorrecta.filaId,
      resolucion: 'aceptado',
      motivo: 'Descuento acordado',
    });
    const { filas: despues } = api(entorno, 'apiInformePagos', '2026-11', 'Empresa Uno');
    expect(despues.find((f) => f.filaId === incorrecta.filaId)).toMatchObject({
      estado: 'Incorrecto',
      resolucion: 'aceptado',
      resueltoPor: 'sara@gala.test',
      motivoResolucion: 'Descuento acordado',
    });
    expect(() => entorno.llamar('apiCruzarPagos', datos)).toThrow('subsanadas');
    expect(() =>
      entorno.llamar('apiSubsanarPago', {
        periodo: '2026-11',
        filaId: incorrecta.filaId,
        resolucion: 'aceptado',
        motivo: ' ',
      }),
    ).toThrow('motivo');
  });

  it('un fichero incompleto se niega y NO deja nada en el informe', () => {
    const { entorno, servicio } = arrancar();
    cargaInicial(entorno);
    const malo = [{ nombre: 'r.xml', texto: xml([pagoDe(IBAN_1, '1000.00')], { numero: 208 }) }];
    expect(() =>
      entorno.llamar('apiCruzarPagos', { periodo: '2026-11', empresa: 'Empresa Uno', ficheros: malo }),
    ).toThrow('incompleto');
    expect(servicio.google.estado.libros.get(ID_LIBRO_PAGOS).getSheetByName('informe_2026-11')).toBeNull();
  });

  it('el informe y la fusión: sin todas las empresas se niega; con todas, deja constancia', () => {
    const { entorno } = arrancar();
    cargaInicial(entorno);
    api(entorno, 'apiCruzarPagos', {
      periodo: '2026-11',
      empresa: 'Empresa Uno',
      ficheros: remesa([pagoDe(IBAN_1, '1000.00'), pagoDe(IBAN_2, '500.00')]),
    });
    const informe = api(entorno, 'apiInformePagos', '2026-11', '');
    expect(informe.resumen).toMatchObject({ puedeFusionarse: false, faltan: ['Empresa Dos'] });
    expect(() => entorno.llamar('apiFusionarInformes', '2026-11')).toThrow('Empresa Dos');
    const csv = [
      { nombre: 'dos.csv', texto: CSV_BANCO([{ nombre: 'OTRO, ALGUIEN', iban: IBAN_X, importe: '10,00' }]) },
    ];
    api(entorno, 'apiCruzarPagos', { periodo: '2026-11', empresa: 'Empresa Dos', ficheros: csv });
    expect(api(entorno, 'apiFusionarInformes', '2026-11')).toMatchObject({ puedeFusionarse: true, sinResolver: 1 });
  });

  it('Maestro de Pagos e historial de una persona: con nombre y DNI, sin huella', () => {
    const { entorno } = arrancar();
    cargaInicial(entorno);
    api(entorno, 'apiCruzarPagos', {
      periodo: '2026-11',
      empresa: 'Empresa Uno',
      ficheros: remesa([pagoDe(IBAN_1, '1000.00')]),
    });
    const maestro = api(entorno, 'apiMaestroPagos');
    expect(maestro.map((m) => [m.nombre, m.dni, m.empresa, m.ultimos4])).toStrictEqual([
      ['Ana Ficticia', '12345678Z', 'Empresa Uno', IBAN_1.slice(-4)],
      ['Luis Falso', '87654321X', 'Empresa Uno', IBAN_2.slice(-4)],
    ]);
    expect(JSON.stringify(maestro)).not.toMatch(/[0-9a-f]{64}/);
    const historial = api(entorno, 'apiHistorialPersonaPagos', 'Empresa Uno_T1');
    expect(historial).toHaveLength(1);
    expect(historial[0]).toMatchObject({ periodo: '2026-11', nombre: 'Ana Ficticia', estado: 'Coincidente' });
  });

  it('sin la fuente de importes configurada o sin el servicio, el cruce se niega y lo dice', () => {
    const { entorno } = arrancar({
      config: [...CONFIG_NORMAL, ['empresas', 'Empresa Uno=Uno'], ['maestro_libro_id', ID_MAESTRO]],
    });
    expect(() =>
      entorno.llamar('apiCruzarPagos', {
        periodo: '2026-11',
        empresa: 'Empresa Uno',
        ficheros: remesa([pagoDe(IBAN_1, '1.00')]),
      }),
    ).toThrow('fuente de los importes');
    const sinServicio = cargarWebapp({ usuario: 'sara@gala.test' });
    prepararLibro(sinServicio, { config: CONFIG_PAGOS, estadoPasos: [] });
    expect(() => sinServicio.llamar('apiCruzarPagos', {})).toThrow('VAP_Pagos no está configurado');
    expect(plano(sinServicio.llamar('apiOpcionesPagos'))).toMatchObject({
      servicioConfigurado: false,
      fuenteImportesConfigurada: true,
    });
  });

  it('una empresa que no es una de las configuradas se rechaza', () => {
    const { entorno } = arrancar();
    expect(() =>
      entorno.llamar('apiCruzarPagos', {
        periodo: '2026-11',
        empresa: 'Inventada',
        ficheros: remesa([pagoDe(IBAN_1, '1.00')]),
      }),
    ).toThrow('no es una de las configuradas');
  });

  it('un extraño no puede llamar a NINGUNA función de pagos', () => {
    const { entorno } = arrancar({ usuario: 'extrano@gala.test' });
    const llamadas = [
      ['apiOpcionesPagos'],
      ['apiCruzarPagos', {}],
      ['apiInformePagos', '2026-11', ''],
      ['apiSubsanarPago', {}],
      ['apiFusionarInformes', '2026-11'],
      ['apiMaestroPagos'],
      ['apiHistorialPersonaPagos', 'x'],
      ['apiValidarCargaInicial', [{}]],
      ['apiConfirmarCargaInicial', [{}]],
    ];
    for (const [nombre, ...args] of llamadas)
      expect(() => entorno.llamar(nombre, ...args), nombre).toThrow('No tienes acceso');
  });

  it('la carga inicial tiene un máximo por llamada', () => {
    const { entorno } = arrancar();
    expect(() => entorno.llamar('apiValidarCargaInicial', new Array(201).fill({}))).toThrow('máximo');
    expect(() => entorno.llamar('apiValidarCargaInicial', [])).toThrow('No hay filas');
  });
});
