// Integración de la sincronización del desplegable y del ID_Secre: BBDD + formulario + hoja de respuestas + disparadores.
// Datos ficticios. ADR-0004 · ADR-0008 · SSD §7.2 · RNF-12.
import { describe, expect, it } from 'vitest';
import { DNI_PRUEBA, entornoSync, eventoEnvio, fecha } from './ayudas.js';
import { plano } from '../soporte/cargar-gs.js';

const ana = ['S001', 'Prueba, Ana', true];
const bea = ['S002', 'Inventada, Bea', true];
const cleoBaja = ['S003', 'Falsa, Cleo', false];
const CAB_RESP = ['Marca temporal', 'MES', 'SECRETARIA'];
const T = fecha(2026, 3, 10, 9, 5, 7);
const TEXTO_T = '10/03/2026 09:05:07';

const hojaEdicion = (e, nombre) => ({ range: { getSheet: () => ({ getName: () => nombre }) } });

describe('actualizarPreguntaSecretarias · carga las activas en el desplegable (ADR-0004)', () => {
  it('sustituye las opciones de la pregunta SECRETARIA por las secretarias activas ordenadas', () => {
    const e = entornoSync({ secretarias: [bea, ana, cleoBaja] });
    e.llamar('actualizarPreguntaSecretarias');
    expect(e.opcionesFormulario()).toEqual(['Inventada, Bea', 'Prueba, Ana']);
    expect(e.estado.logs).toContain('Formulario actualizado correctamente. Opciones cargadas: 2');
  });
  it('una baja desaparece del desplegable en la siguiente sincronización', () => {
    const e = entornoSync({ secretarias: [ana, bea] });
    e.llamar('actualizarPreguntaSecretarias');
    e.hojaSecretarias.getRange(3, 3).setValue(false);
    e.llamar('actualizarPreguntaSecretarias');
    expect(e.opcionesFormulario()).toEqual(['Prueba, Ana']);
  });
  it('solo toca la pregunta SECRETARIA: las demás listas y preguntas quedan igual', () => {
    const e = entornoSync({
      secretarias: [ana],
      items: [{ titulo: 'MES', opciones: ['ENERO'] }, { titulo: 'SECRETARIA', opciones: [] }, { titulo: 'SECRETARIA', tipo: 'TEXT', opciones: ['no'] }],
    });
    e.llamar('actualizarPreguntaSecretarias');
    expect(e.formulario.items.map((i) => i.opciones)).toEqual([['ENERO'], ['Prueba, Ana'], ['no']]);
  });
  it('lista vacía → error y el desplegable anterior se CONSERVA (no se deja el formulario sin opciones)', () => {
    const e = entornoSync({ secretarias: [cleoBaja] });
    expect(() => e.llamar('actualizarPreguntaSecretarias')).toThrow('No se han encontrado secretarias activas válidas');
    expect(e.opcionesFormulario()).toEqual(['(antigua)']);
    expect(e.estado.logs).toContain('ERROR actualizarPreguntaSecretarias: No se han encontrado secretarias activas válidas');
  });
  it('sin pregunta de tipo lista con ese título → error claro', () => {
    const e = entornoSync({ secretarias: [ana], items: [{ titulo: 'SECRETARIA', tipo: 'TEXT' }] });
    expect(() => e.llamar('actualizarPreguntaSecretarias')).toThrow('No se encuentra la pregunta tipo lista con título "SECRETARIA"');
  });
  it('formulario inexistente → error propagado y registrado', () => {
    const e = entornoSync({ secretarias: [ana], formulario: false });
    expect(() => e.llamar('actualizarPreguntaSecretarias')).toThrow(/No se puede abrir el formulario/);
    expect(e.estado.logs.some((l) => l.startsWith('ERROR actualizarPreguntaSecretarias: '))).toBe(true);
  });
  it('errores de la BBDD (hoja o columna ausente) se registran y se relanzan; el formulario no cambia', () => {
    const sinHoja = entornoSync({ hojaSecretarias: false });
    expect(() => sinHoja.llamar('actualizarPreguntaSecretarias')).toThrow('No existe la hoja "VAP_Secretarias"');
    expect(sinHoja.opcionesFormulario()).toEqual(['(antigua)']);
    const sinColumna = entornoSync({ secretarias: [['S1', 'x', DNI_PRUEBA]], cabeceraSecretarias: ['id_trabajador', 'Nombre_Secretaria', 'DNI'] });
    expect(() => sinColumna.llamar('actualizarPreguntaSecretarias')).toThrow('No se encuentra la columna "Alta"');
    expect(sinColumna.opcionesFormulario()).toEqual(['(antigua)']);
  });
  it('no escribe en la hoja de secretarias (solo lee)', () => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('actualizarPreguntaSecretarias');
    expect(e.estado.escrituras).toEqual([]);
  });
  it('es idempotente: dos ejecuciones dejan el mismo desplegable', () => {
    const e = entornoSync({ secretarias: [ana, bea] });
    e.llamar('actualizarPreguntaSecretarias');
    const una = [...e.opcionesFormulario()];
    e.llamar('actualizarPreguntaSecretarias');
    expect(e.opcionesFormulario()).toEqual(una);
  });
});

describe('onSpreadsheetEditTrigger · edición de VAP_Secretarias', () => {
  it.each([[undefined], [null], [{}]])('evento %j → no hace nada', (ev) => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetEditTrigger', ev);
    expect(e.opcionesFormulario()).toEqual(['(antigua)']);
    expect(e.estado.cache).toEqual({});
  });
  it('una edición en OTRA hoja se ignora (y no gasta la ventana de frecuencia)', () => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'Config'));
    expect(e.opcionesFormulario()).toEqual(['(antigua)']);
    expect(e.estado.cache).toEqual({});
  });
  it('rango sin hoja se ignora', () => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetEditTrigger', { range: { getSheet: () => null } });
    expect(e.opcionesFormulario()).toEqual(['(antigua)']);
  });
  it('una edición en VAP_Secretarias sincroniza el formulario y lo deja anotado', () => {
    const e = entornoSync({ secretarias: [ana, bea] });
    e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'));
    expect(e.opcionesFormulario()).toEqual(['Inventada, Bea', 'Prueba, Ana']);
    expect(e.estado.logs[0]).toBe('Cambio detectado en VAP_Secretarias (edición). Sincronizando formulario...');
  });
  it('dos ediciones seguidas: la segunda se omite por frecuencia (la 2.ª edición no llega hasta el respaldo horario)', () => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'));
    e.hojaSecretarias.appendRow(bea);
    e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'));
    expect(e.opcionesFormulario()).toEqual(['Prueba, Ana']);
  });
  it('pasada la ventana, la edición pendiente sí se sincroniza', () => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'));
    e.hojaSecretarias.appendRow([...bea, DNI_PRUEBA]);
    delete e.estado.cache.vap_sync_secretarias_lock;
    e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'));
    expect(e.opcionesFormulario()).toEqual(['Inventada, Bea', 'Prueba, Ana']);
  });
  it('si la sincronización falla, se registra y se relanza el error', () => {
    const e = entornoSync({ secretarias: [] });
    expect(() => e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'))).toThrow('No se han encontrado secretarias activas válidas');
    expect(e.estado.logs).toContain('ERROR onSpreadsheetEditTrigger: No se han encontrado secretarias activas válidas');
  });
  it('caracterización: un fallo agota igualmente la ventana de 30 s (el reintento inmediato se omite)', () => {
    const e = entornoSync({ secretarias: [] });
    expect(() => e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'))).toThrow();
    e.hojaSecretarias.appendRow([...ana, DNI_PRUEBA]);
    e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'));
    expect(e.opcionesFormulario()).toEqual(['(antigua)']);
  });
});

describe('onSpreadsheetChangeTrigger · cambios estructurales', () => {
  it.each(['INSERT_ROW', 'REMOVE_ROW', 'INSERT_GRID', 'REMOVE_GRID'])('%s sincroniza', (tipo) => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetChangeTrigger', { changeType: tipo });
    expect(e.opcionesFormulario()).toEqual(['Prueba, Ana']);
    expect(e.estado.logs[0]).toBe(`Cambio estructural detectado (${tipo}). Sincronizando formulario...`);
  });
  it.each(['EDIT', 'FORMAT', 'INSERT_COLUMN', 'REMOVE_COLUMN', 'OTHER', undefined])('%s se ignora', (tipo) => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetChangeTrigger', { changeType: tipo });
    expect(e.opcionesFormulario()).toEqual(['(antigua)']);
    expect(e.estado.cache).toEqual({});
  });
  it('sin evento no hace nada', () => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetChangeTrigger');
    expect(e.opcionesFormulario()).toEqual(['(antigua)']);
  });
  it('comparte la ventana de frecuencia con el disparador de edición', () => {
    const e = entornoSync({ secretarias: [ana] });
    e.llamar('onSpreadsheetEditTrigger', hojaEdicion(e, 'VAP_Secretarias'));
    e.hojaSecretarias.appendRow(bea);
    e.llamar('onSpreadsheetChangeTrigger', { changeType: 'INSERT_ROW' });
    expect(e.opcionesFormulario()).toEqual(['Prueba, Ana']);
  });
  it('el fallo se registra y se relanza', () => {
    const e = entornoSync({ secretarias: [] });
    expect(() => e.llamar('onSpreadsheetChangeTrigger', { changeType: 'REMOVE_ROW' })).toThrow();
    expect(e.estado.logs.some((l) => l.startsWith('ERROR onSpreadsheetChangeTrigger: '))).toBe(true);
  });
});

describe('onFormSubmit · escribe ID_Secre en la fila del envío', () => {
  const envio = (nombre = 'Prueba, Ana', marca = T) => eventoEnvio({ MES: 'MARZO', SECRETARIA: nombre }, marca);

  it('rellena la columna ID_Secre existente en la fila del envío (localizada por marca temporal)', () => {
    const e = entornoSync({
      secretarias: [ana, bea],
      respuestas: [[...CAB_RESP, 'ID_Secre'], ['09/03/2026 08:00:00', 'MARZO', 'Inventada, Bea', 'S002'], [TEXTO_T, 'MARZO', 'Prueba, Ana', ''], ['11/03/2026 08:00:00', 'MARZO', 'Inventada, Bea', '']],
    });
    e.llamar('onFormSubmit', envio());
    expect(e.hojaRespuestas.getRange(3, 4).getValue()).toBe('S001');
    expect(e.hojaRespuestas.getRange(4, 4).getValue()).toBe('');
    expect(e.hojaRespuestas.getRange(2, 4).getValue()).toBe('S002');
  });
  it('si no existe la columna ID_Secre la crea al final con su cabecera', () => {
    const e = entornoSync({ secretarias: [ana], respuestas: [CAB_RESP, [TEXTO_T, 'MARZO', 'Prueba, Ana']] });
    e.llamar('onFormSubmit', envio());
    expect(e.hojaRespuestas.volcar()).toEqual([[...CAB_RESP, 'ID_Secre', 'DNI_Secre'], [TEXTO_T, 'MARZO', 'Prueba, Ana', 'S001', DNI_PRUEBA]]);
  });
  it('anota los pasos en el log', () => {
    const e = entornoSync({ secretarias: [ana], respuestas: [[...CAB_RESP, 'ID_Secre'], [TEXTO_T, 'MARZO', 'Prueba, Ana', '']] });
    e.llamar('onFormSubmit', envio());
    expect(e.estado.logs).toEqual([
      '1. Inicio onFormSubmit', '2. Secretaria recibida: Prueba, Ana', '3. Secretaria localizada: S001',
      '4. Hoja de respuestas encontrada: Respuestas de formulario', '5. Fila objetivo: 2',
      'Columna DNI_Secre creada en posición 5', '6. ID_Secre y DNI_Secre escritos en la fila 2',
    ]);
  });
  it('anota la creación de la columna', () => {
    const e = entornoSync({ secretarias: [ana], respuestas: [CAB_RESP, [TEXTO_T, 'MARZO', 'Prueba, Ana']] });
    e.llamar('onFormSubmit', envio());
    expect(e.estado.logs).toContain('Columna ID_Secre creada en posición 4');
  });
  it('el nombre se compara sin distinguir mayúsculas ni espacios sobrantes', () => {
    const e = entornoSync({ secretarias: [ana], respuestas: [CAB_RESP, [TEXTO_T, 'MARZO', 'prueba,  ANA']] });
    e.llamar('onFormSubmit', envio('prueba,  ANA'));
    expect(e.hojaRespuestas.getRange(2, 4).getValue()).toBe('S001');
  });
  it('solo escribe ID_Secre y DNI_Secre en esa fila (nada más cambia)', () => {
    const e = entornoSync({ secretarias: [ana], respuestas: [[...CAB_RESP, 'ID_Secre'], [TEXTO_T, 'MARZO', 'Prueba, Ana', '']] });
    e.llamar('onFormSubmit', envio());
    expect(e.estado.escrituras).toEqual([
      { hoja: 'Respuestas de formulario', rango: 'D2' },
      { hoja: 'Respuestas de formulario', rango: 'E1' },
      { hoja: 'Respuestas de formulario', rango: 'E2' },
    ]);
  });
  it('envío sin respuesta a SECRETARIA → error y no se escribe nada', () => {
    const e = entornoSync({ secretarias: [ana], respuestas: [CAB_RESP, [TEXTO_T, 'MARZO', '']] });
    expect(() => e.llamar('onFormSubmit', eventoEnvio({ MES: 'MARZO' }, T))).toThrow('No se encontró respuesta para la pregunta "SECRETARIA"');
    expect(e.estado.escrituras).toEqual([]);
    expect(e.estado.logs.at(-1)).toBe('ERROR onFormSubmit: No se encontró respuesta para la pregunta "SECRETARIA"');
  });
  it('secretaria desconocida → error y no se escribe nada', () => {
    const e = entornoSync({ secretarias: [ana], respuestas: [CAB_RESP, [TEXTO_T, 'MARZO', 'Imaginario, Nadie']] });
    expect(() => e.llamar('onFormSubmit', envio('Imaginario, Nadie'))).toThrow('No se encontró la secretaria "Imaginario, Nadie"');
    expect(e.estado.escrituras).toEqual([]);
  });
  it('secretaria de baja → error (no se asigna ID a quien no está de alta)', () => {
    const e = entornoSync({ secretarias: [cleoBaja], respuestas: [CAB_RESP, [TEXTO_T, 'MARZO', 'Falsa, Cleo']] });
    expect(() => e.llamar('onFormSubmit', envio('Falsa, Cleo'))).toThrow('No se encontró la secretaria "Falsa, Cleo"');
  });
  it('dos activas con el mismo nombre → error y no se escribe', () => {
    const e = entornoSync({ secretarias: [ana, ['S009', 'Prueba, Ana', true]], respuestas: [CAB_RESP, [TEXTO_T, 'MARZO', 'Prueba, Ana']] });
    expect(() => e.llamar('onFormSubmit', envio())).toThrow(/varias secretarias activas/);
    expect(e.estado.escrituras).toEqual([]);
  });
  it('formulario sin hoja de respuestas vinculada → error', () => {
    const e = entornoSync({ secretarias: [ana] });
    expect(() => e.llamar('onFormSubmit', envio())).toThrow('El formulario no tiene hoja de respuestas vinculada');
  });
  it('la hoja de respuestas no encuentra marca coincidente → usa la última fila (respaldo)', () => {
    const e = entornoSync({ secretarias: [ana], respuestas: [[...CAB_RESP, 'ID_Secre'], ['01/01/2026 00:00:00', 'ENERO', 'Inventada, Bea', 'S002'], ['otra marca', 'MARZO', 'Prueba, Ana', '']] });
    e.llamar('onFormSubmit', envio());
    expect(e.hojaRespuestas.getRange(3, 4).getValue()).toBe('S001');
  });
  it.fails('DEFECTO: dos envíos en el MISMO segundo: el ID del primero no debería escribirse en la fila del segundo', () => {
    const e = entornoSync({
      secretarias: [ana, bea],
      respuestas: [[...CAB_RESP, 'ID_Secre'], [TEXTO_T, 'MARZO', 'Prueba, Ana', ''], [TEXTO_T, 'MARZO', 'Inventada, Bea', '']],
    });
    e.llamar('onFormSubmit', envio('Prueba, Ana'));
    expect(e.hojaRespuestas.getRange(2, 4).getValue()).toBe('S001');
  });
});

describe('crearTriggersProduccion · disparadores (ADR-0008)', () => {
  const resumen = (e) => e.estado.disparadores.map((t) => ({ f: t.handler, forForm: !!t.forForm, forSpreadsheet: t.forSpreadsheet, onFormSubmit: t.onFormSubmit, onEdit: t.onEdit, onChange: t.onChange }));

  it('crea los tres: envío de formulario, edición y cambio estructural', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    expect(resumen(e)).toEqual([
      { f: 'onFormSubmit', forForm: true, forSpreadsheet: undefined, onFormSubmit: true, onEdit: undefined, onChange: undefined },
      { f: 'onSpreadsheetEditTrigger', forForm: false, forSpreadsheet: e.idBbdd, onFormSubmit: undefined, onEdit: true, onChange: undefined },
      { f: 'onSpreadsheetChangeTrigger', forForm: false, forSpreadsheet: e.idBbdd, onFormSubmit: undefined, onEdit: undefined, onChange: true },
    ]);
    expect(e.estado.logs).toContain('Triggers de producción creados correctamente');
  });
  it('el disparador de formulario se liga al formulario correcto', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    expect(e.estado.disparadores[0].forForm.id).toBe(e.idForm);
  });
  it('cada manejador existe como función en el script', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    for (const t of e.estado.disparadores) expect(e.ejecutar(`typeof ${t.handler}`)).toBe('function');
  });
  it('es idempotente: ejecutarla dos veces no duplica disparadores', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    e.llamar('crearTriggersProduccion');
    expect(e.estado.disparadores).toHaveLength(3);
  });
  it('borra los disparadores previos, también el horario de respaldo (caracterización: hay que recrearlo después)', () => {
    const e = entornoSync();
    e.llamar('crearTriggerHorarioRespaldo');
    e.llamar('crearTriggersProduccion');
    expect(e.estado.disparadores.map((t) => t.handler)).not.toContain('actualizarPreguntaSecretarias');
  });
  it.fails('DEFECTO (robustez): si el formulario no se puede abrir, no deberían perderse los disparadores existentes', () => {
    const e = entornoSync({ formulario: false });
    e.llamar('crearTriggerHorarioRespaldo');
    expect(() => e.llamar('crearTriggersProduccion')).toThrow();
    expect(e.estado.disparadores).toHaveLength(1);
  });
});

describe('crearTriggerHorarioRespaldo · respaldo cada hora', () => {
  it('crea un disparador horario que llama a actualizarPreguntaSecretarias', () => {
    const e = entornoSync();
    e.llamar('crearTriggerHorarioRespaldo');
    expect(plano(e.estado.disparadores.map((t) => ({ f: t.handler, tb: t.timeBased, h: t.everyHours })))).toEqual([{ f: 'actualizarPreguntaSecretarias', tb: true, h: 1 }]);
    expect(e.estado.logs).toContain('Trigger horario de respaldo creado correctamente');
  });
  it('caracterización: no es idempotente, ejecutarla dos veces crea dos disparadores', () => {
    const e = entornoSync();
    e.llamar('crearTriggerHorarioRespaldo');
    e.llamar('crearTriggerHorarioRespaldo');
    expect(e.estado.disparadores).toHaveLength(2);
  });
});

describe('borrarTriggers y verTriggers', () => {
  it('borrarTriggers elimina todos y lo anota', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    e.llamar('crearTriggerHorarioRespaldo');
    e.llamar('borrarTriggers');
    expect(e.estado.disparadores).toEqual([]);
    expect(e.estado.logs).toContain('Todos los triggers han sido eliminados');
  });
  it('borrarTriggers sin disparadores no falla', () => {
    const e = entornoSync();
    expect(() => e.llamar('borrarTriggers')).not.toThrow();
  });
  it('verTriggers lista función y evento de cada disparador', () => {
    const e = entornoSync();
    e.llamar('crearTriggersProduccion');
    e.llamar('crearTriggerHorarioRespaldo');
    e.estado.logs.length = 0;
    e.llamar('verTriggers');
    expect(e.estado.logs).toContain('Función: onFormSubmit | Evento: ON_FORM_SUBMIT');
    expect(e.estado.logs).toContain('Función: onSpreadsheetChangeTrigger | Evento: ON_CHANGE');
    expect(e.estado.logs).toContain('Función: actualizarPreguntaSecretarias | Evento: CLOCK');
    expect(e.estado.logs).toHaveLength(4); // el de edición aparece (el doble lo etiqueta UNKNOWN; en Google sería ON_EDIT)
  });
  it('verTriggers sin disparadores no escribe nada', () => {
    const e = entornoSync();
    e.llamar('verTriggers');
    expect(e.estado.logs).toEqual([]);
  });
});
