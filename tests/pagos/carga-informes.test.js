// Hojas de detalle de la carga inicial (ADR-0020): qué columnas llevan y qué datos dan para subsanar cada caso.
// Reglas puras, con datos INVENTADOS.
import { describe, expect, it } from 'vitest';
import { plano } from '../soporte/cargar-gs.js';
import { cargarPagos, DNI_1, DNI_2, ibanDePrueba } from './cargar.js';

const { llamar } = cargarPagos();
const IBAN_A = ibanDePrueba(1);
const IBAN_B = ibanDePrueba(2);
const DNI_3 = '11111111H';

const filaExcel = (fila, nombre, dni, cuenta, empresa = 'EMPRESA UNO') => ({ fila, nombre, dni, cuenta, empresa });
const persona = (idPersonal, nombre, dni, extra = {}) => ({
  idPersonal,
  nombre,
  dni,
  empresa: 'Uno',
  activa: true,
  pestana: 'VAP_Staff',
  fila: 2,
  fechaAlta: '2020-01-01',
  fechaBaja: '',
  ...extra,
});

function informes(excel, personas, { registradas = [], simulacion = true } = {}) {
  const plan = llamar('planCargaInicial_', excel, personas, registradas);
  const hojas = plano(llamar('informesDeCarga_', excel, personas, plan, registradas, simulacion));
  const porClave = {};
  hojas.forEach((h) => {
    porClave[h.clave] = h;
  });
  return porClave;
}
const filasComoObjetos = (hoja) =>
  hoja.filas.map((fila) => Object.fromEntries(hoja.cabecera.map((c, i) => [c, fila[i]])));

describe('informesDeCarga_ · una hoja por tema', () => {
  it('siempre devuelve las ocho hojas, con su cabecera, aunque estén vacías', () => {
    const h = informes([], []);
    expect(Object.keys(h).sort()).toEqual(
      [
        'con-huella',
        'cuentas-distintas',
        'dni-invalido',
        'id-repetido',
        'repetidas',
        'sin-cuenta',
        'sin-cuenta-en-excel',
        'sin-persona-activa',
      ].sort(),
    );
    for (const hoja of Object.values(h)) expect(hoja.cabecera.length).toBeGreaterThan(2);
  });

  it('todas las filas de cada hoja tienen tantas columnas como su cabecera', () => {
    const h = informes(
      [
        filaExcel(2, 'A, A', DNI_1, IBAN_A),
        filaExcel(3, 'A, A', DNI_1, IBAN_A),
        filaExcel(4, 'B, B', '0509', IBAN_B),
        filaExcel(5, 'C, C', DNI_2, ''),
        filaExcel(6, 'D, D', DNI_3, IBAN_B),
      ],
      [persona('UNO_1', 'A, A', DNI_1), persona('UNO_2', 'Z, Z', '12'), persona('UNO_3', 'Q, Q', '99999999R')],
    );
    for (const hoja of Object.values(h)) for (const fila of hoja.filas) expect(fila).toHaveLength(hoja.cabecera.length);
  });

  it('repetidas: cada fila repetida dice la fila que repite, los últimos 4 de la cuenta y las personas del maestro con ese DNI', () => {
    const h = informes(
      [filaExcel(2, 'A, A', DNI_1, IBAN_A, 'GALA'), filaExcel(9, 'A, A', DNI_1, IBAN_A, 'CERVANTES')],
      [persona('GALA_1', 'A, A', DNI_1), persona('CERVANTES_7', 'A, A', DNI_1, { empresa: 'Cervantes' })],
    );
    const [fila] = filasComoObjetos(h.repetidas);
    expect(h.repetidas.filas).toHaveLength(1);
    expect(fila).toMatchObject({
      dni: DNI_1,
      fila_excel: 9,
      nombre_excel: 'A, A',
      empresa_excel: 'CERVANTES',
      cuenta_termina_en: IBAN_A.slice(-4),
      repite_la_fila: 2,
    });
    expect(fila.personas_activas_del_maestro_con_ese_dni).toContain('GALA_1');
    expect(fila.personas_activas_del_maestro_con_ese_dni).toContain('CERVANTES_7');
  });

  it('dni-invalido del EXCEL: motivo, y posible pareja del maestro por nombre', () => {
    const h = informes(
      [filaExcel(3, 'Pérez Ruiz, Ana', '050986557L', IBAN_A)],
      [persona('UNO_1', 'PEREZ RUIZ, ANA', DNI_1)],
    );
    const [fila] = filasComoObjetos(h['dni-invalido']);
    expect(fila).toMatchObject({ origen: 'Excel', fila_excel: 3, dni_tal_como_viene: '050986557L' });
    expect(fila.motivo).toContain('10 caracteres');
    expect(fila.posible_pareja_por_nombre).toContain('UNO_1');
    expect(fila.posible_pareja_por_nombre).toContain(DNI_1);
  });

  it('dni-invalido del MAESTRO: id, pestaña y fila del maestro, y posible fila del Excel por nombre', () => {
    const h = informes(
      [filaExcel(4, 'GARCIA LOPEZ, LUIS', DNI_2, IBAN_A)],
      [persona('UNO_5', 'García López, Luis', '1234', { pestana: 'VAP_Secretarias', fila: 17 })],
    );
    const [fila] = filasComoObjetos(h['dni-invalido']);
    expect(fila).toMatchObject({
      origen: 'Maestro',
      id_trabajador: 'UNO_5',
      pestana: 'VAP_Secretarias',
      fila_maestro: 17,
      dni_tal_como_viene: '1234',
    });
    expect(fila.posible_pareja_por_nombre).toContain('fila 4');
    expect(fila.posible_pareja_por_nombre).toContain(DNI_2);
  });

  describe('la pareja por nombre cuadra aunque cambien tildes, comas, mayúsculas, orden o partículas', () => {
    // El Excel trae `nombreExcel` con un DNI inválido y el maestro `nombreMaestro` con un DNI bueno: ¿se emparejan?
    const pareja = (nombreExcel, nombreMaestro) => {
      const h = informes([filaExcel(3, nombreExcel, '050986557L', IBAN_A)], [persona('UNO_1', nombreMaestro, DNI_1)]);
      return filasComoObjetos(h['dni-invalido'])[0].posible_pareja_por_nombre;
    };

    it('tildes, eñes, comas y mayúsculas no importan', () => {
      expect(pareja('Muñoz Pérez, José', 'MUNOZ PEREZ JOSE')).toContain('[igual]');
    });

    it('el orden de las palabras no importa (NOMBRE APELLIDOS o APELLIDOS, NOMBRE)', () => {
      expect(pareja('LUIS GARCIA LOPEZ', 'GARCIA LOPEZ, LUIS')).toContain('[igual]');
    });

    it('las partículas (de, del, la, los, y) no importan', () => {
      expect(pareja('GARCIA TORRE, ANA', 'GARCIA DE LA TORRE, ANA')).toContain('[igual]');
    });

    it('un apellido de menos o una errata de una letra se ofrece como [parecido]', () => {
      expect(pareja('GARCIA, LUIS', 'GARCIA LOPEZ, LUIS')).toContain('[parecido]');
      expect(pareja('MARTINES RUIZ, ANA', 'MARTINEZ RUIZ, ANA')).toContain('[parecido]');
    });

    it('lo igual va antes que lo parecido, y con un solo nombre en común no se ofrece nada', () => {
      const h = informes(
        [filaExcel(3, 'GARCIA LOPEZ, LUIS', '050986557L', IBAN_A)],
        [persona('UNO_2', 'GARCIA, LUIS', DNI_2), persona('UNO_1', 'LUIS GARCIA LOPEZ', DNI_1)],
      );
      const texto = filasComoObjetos(h['dni-invalido'])[0].posible_pareja_por_nombre;
      expect(texto.indexOf('UNO_1')).toBeLessThan(texto.indexOf('UNO_2'));
      expect(pareja('GARCIA', 'GARCIA LOPEZ, LUIS')).toBe('');
      expect(pareja('RUIZ, ANA', 'PEREZ, MARTA')).toBe('');
    });
  });

  it('sin-cuenta: la fila del Excel y lo que consta del DNI en el maestro', () => {
    const h = informes([filaExcel(5, 'C, C', DNI_1, '')], [persona('UNO_1', 'C, C', DNI_1)]);
    const [fila] = filasComoObjetos(h['sin-cuenta']);
    expect(fila).toMatchObject({ fila_excel: 5, nombre_excel: 'C, C', dni: DNI_1 });
    expect(fila.personas_del_maestro_con_ese_dni).toContain('UNO_1');
  });

  it('sin-persona-activa: dice si el DNI consta de baja en el maestro o no consta, con los últimos 4 de la cuenta', () => {
    const h = informes(
      [filaExcel(6, 'D, D', DNI_1, IBAN_A), filaExcel(7, 'E, E', DNI_2, IBAN_B)],
      [persona('UNO_1', 'D, D', DNI_1, { activa: false, fechaBaja: '2026-03-31' })],
    );
    const [de_baja, nuevo] = filasComoObjetos(h['sin-persona-activa']);
    expect(de_baja.en_el_maestro_con_ese_dni).toContain('UNO_1');
    expect(de_baja.en_el_maestro_con_ese_dni).toContain('de baja');
    expect(de_baja.en_el_maestro_con_ese_dni).toContain('2026-03-31');
    expect(de_baja.cuenta_termina_en).toBe(IBAN_A.slice(-4));
    expect(nuevo.en_el_maestro_con_ese_dni).toBe('No consta en el maestro');
  });

  it('cuentas-distintas: una fila por cada aparición del DNI', () => {
    const h = informes(
      [filaExcel(2, 'A, A', DNI_1, IBAN_A), filaExcel(8, 'A, A', DNI_1, IBAN_B)],
      [persona('UNO_1', 'A, A', DNI_1)],
    );
    const filas = filasComoObjetos(h['cuentas-distintas']);
    expect(filas.map((f) => [f.fila_excel, f.cuenta_termina_en])).toEqual([
      [2, IBAN_A.slice(-4)],
      [8, IBAN_B.slice(-4)],
    ]);
  });

  it('sin-cuenta-en-excel: la persona activa con su pestaña, fila, fecha de alta y posible fila del Excel por nombre', () => {
    const h = informes(
      [filaExcel(3, 'RUIZ, MARTA', '', IBAN_A)],
      [persona('UNO_3', 'Ruiz, Marta', DNI_3, { pestana: 'VAP_Profesores', fila: 30, fechaAlta: '2025-09-01' })],
    );
    const [fila] = filasComoObjetos(h['sin-cuenta-en-excel']);
    expect(fila).toMatchObject({
      pestana: 'VAP_Profesores',
      fila_maestro: 30,
      id_trabajador: 'UNO_3',
      nombre: 'Ruiz, Marta',
      dni: DNI_3,
      fecha_alta: '2025-09-01',
    });
    expect(fila.posible_fila_en_el_excel_por_nombre).toContain('fila 3');
  });

  it('id-repetido: cada aparición del id con su pestaña, fila y DNI, y si los DNI coinciden o no', () => {
    const h = informes(
      [],
      [
        persona('GALA_654', 'A, A', DNI_1, { pestana: 'VAP_Staff', fila: 89 }),
        persona('GALA_654', 'A, A', DNI_1, { pestana: 'VAP_Staff', fila: 321 }),
        persona('GALA_9', 'B, B', DNI_2, { fila: 5 }),
        persona('GALA_9', 'B, B', DNI_3, { fila: 6 }),
        persona('GALA_1', 'C, C', '99999999R', { fila: 7 }),
      ],
    );
    const filas = filasComoObjetos(h['id-repetido']);
    expect(filas.map((f) => [f.id_trabajador, f.fila_maestro, f.situacion])).toEqual([
      ['GALA_654', 89, 'Mismo DNI en todas las apariciones'],
      ['GALA_654', 321, 'Mismo DNI en todas las apariciones'],
      ['GALA_9', 5, 'DNI DISTINTOS: conflicto, hay que resolverlo antes de cargar'],
      ['GALA_9', 6, 'DNI DISTINTOS: conflicto, hay que resolverlo antes de cargar'],
    ]);
    expect(filas[0]).toMatchObject({ pestana: 'VAP_Staff', nombre: 'A, A', dni: DNI_1 });
  });

  it('un id repetido en el maestro se carga UNA sola vez', () => {
    const plan = plano(
      llamar(
        'planCargaInicial_',
        [filaExcel(2, 'A, A', DNI_1, IBAN_A)],
        [persona('GALA_654', 'A, A', DNI_1, { fila: 89 }), persona('GALA_654', 'A, A', DNI_1, { fila: 321 })],
        [],
      ),
    );
    expect(plan.cuentas).toHaveLength(1);
    expect(plan.resumen.idsRepetidosEnMaestro).toBe(1);
  });

  it('con-huella: en simulación «Se cargará» o «Ya tenía huella»; en real «Con huella»', () => {
    const personas = [
      persona('UNO_1', 'A, A', DNI_1),
      persona('UNO_2', 'B, B', DNI_2),
      persona('UNO_3', 'C, C', DNI_3),
    ];
    const excel = [filaExcel(2, 'A, A', DNI_1, IBAN_A), filaExcel(3, 'B, B', DNI_2, IBAN_B)];
    const sim = filasComoObjetos(informes(excel, personas, { registradas: ['UNO_2'], simulacion: true })['con-huella']);
    expect(sim.map((f) => [f.id_trabajador, f.estado])).toEqual([
      ['UNO_1', 'Se cargará'],
      ['UNO_2', 'Ya tenía huella'],
    ]);
    expect(sim[0]).toMatchObject({ nombre: 'A, A', dni: DNI_1 });
    const real = filasComoObjetos(
      informes(excel, personas, { registradas: ['UNO_1', 'UNO_2'], simulacion: false })['con-huella'],
    );
    expect(real.map((f) => f.estado)).toEqual(['Con huella', 'Con huella']);
  });

  it('ninguna hoja contiene nunca la cuenta completa', () => {
    const h = informes(
      [filaExcel(2, 'A, A', DNI_1, IBAN_A), filaExcel(3, 'B, B', '0509', IBAN_B)],
      [persona('UNO_1', 'A, A', DNI_1)],
    );
    const todo = JSON.stringify(h);
    expect(todo).not.toContain(IBAN_A);
    expect(todo).not.toContain(IBAN_B);
  });
});
