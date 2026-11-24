// Ayudas y datos 100 % ficticios para probar el módulo de complementos de secretarias.
// Cada prueba crea su propio entorno (FIRST · Independent): hora fija, azar fijo y UUID deterministas.
import { CODIGO, HTML, cargarGs, leerFuente, plano } from '../soporte/cargar-gs.js';

export { plano };

export const CAB_DATA = [
  'Timestamp', 'Batch_ID', 'ID_Responsable', 'Nombre_Responsable', 'Email_Responsable', 'Año', 'Mes',
  'ID_Concepto', 'Concepto', 'ID_Secretaria', 'Nombre_Secretaria', 'Tipo_Valor', 'Valor', 'Source', 'Modo', 'Corrige_Batch_ID',
];
export const CAB_LOGS = ['Timestamp', 'Batch_ID', 'ID_Responsable', 'Acción', 'Nº_Registros', 'Resultado', 'Mensaje', 'Tipo_Correccion'];
export const CAB_ERRORES = ['Timestamp', 'Batch_ID', 'ID_Responsable', 'Mes', 'ID_Concepto', 'ID_Secretaria', 'Valor_Intentado', 'Error'];

export const RESPONSABLES = [
  ['ID_Respon', 'Nombre', 'Email', 'Activa'],
  ['R1', 'Ana Prueba', 'ana@gala.test', true],
  ['R2', 'Beto Prueba', 'beto@gala.test', 'SI'],
  ['R3', 'Cleo Inactiva', 'cleo@gala.test', false],
  ['R4', 'Dani SinConceptos', 'dani@gala.test', true],
];
export const CONCEPTOS = [
  ['ID_Concepto', 'Concepto', 'Tipo_Valor', 'Activo'],
  ['C1', 'Aptos', 'IMPORTE', true],
  ['C2', 'Sábados 50', 'IMPORTE', true],
  ['C3', 'Reseñas', 'UNIDADES', true],
  ['C4', 'Concepto Retirado', 'IMPORTE', false],
  ['C5', 'Zeta Extra', 'IMPORTE', true],
];
export const RESP_CONC = [
  ['ID_Respon', 'ID_Concepto', 'Activa'],
  ['R1', 'C2', true],
  ['R1', 'C1', true],
  ['R1', 'C4', true], // concepto inactivo: no debe ofrecerse
  ['R1', 'C3', false], // asignación inactiva: no debe ofrecerse
  ['R2', 'C3', true],
  ['R3', 'C1', true],
];
export const SECRETARIAS = [
  ['id_trabajador', 'Nombre_Secretaria', 'Alta'],
  ['S1', 'Zoe Ficticia', true],
  ['S2', 'Álvaro Falso', true],
  ['S3', 'Berta Baja', false],
  ['S4', 'Ñoño Inventado', 1],
  ['S5', '', true], // sin nombre: se descarta
];
export const CONFIG = [
  ['Config_Notificaciones', '', ''],
  ['GESTION_SEGUIMIENTO_COMPLEMENTOS_SECRETARIAS', 'seguimiento@gala.test', true],
  ['GESTION_SEGUIMIENTO_COMPLEMENTOS_SECRETARIAS', 'apagado@gala.test', false],
  ['COPIA_GENERAL_COMPLEMENTOS_SECRETARIAS', 'copia@gala.test', true],
  ['OTRO_TIPO', 'otro@gala.test', true],
];

export const RESP1 = { id: 'R1', nombre: 'Ana Prueba', email: 'ana@gala.test' };
export const CONC1 = { id: 'C1', concepto: 'Aptos', tipoValor: 'IMPORTE' };

/** Plantillas HTML reales, con los nombres que usa `doGet`. */
export const plantillasReales = () => ({
  Portal: leerFuente(HTML.complementosPortal),
  Index: leerFuente(HTML.complementosReportar),
  Consultas: leerFuente(HTML.complementosConsultas),
});

/**
 * Rellena un entorno ya cargado (`cargarGs`) con la BBDD ficticia y el libro de datos con Data/Logs/Errores.
 * Sirve tanto a las pruebas de Vitest como al arnés de Playwright (que carga el .gs por su cuenta).
 * opciones: azar (valor de Math.random), sinHojas: [hojas a no crear], bbdd: {hoja: filas} para sustituir datos.
 */
export function poblarEntorno(e, opciones = {}) {
  const { azar = 0, sinHojas = [], bbdd: sustitutos = {}, confTemp = true } = opciones;
  e.ejecutar(`Math.random = () => ${azar}`);
  const g = e.google;
  const libroBbdd = g.libro(e.valor('BBDD_SPREADSHEET_ID'), 'BBDD_Personas');
  const tablas = {
    VAP_Responsables: RESPONSABLES, VAP_Complementos_Secretarias: CONCEPTOS, VAP_Responsables_Complementos: RESP_CONC,
    VAP_Secretarias: SECRETARIAS, Config: CONFIG, ...sustitutos,
  };
  for (const [nombre, filas] of Object.entries(tablas)) if (!sinHojas.includes(nombre)) libroBbdd.conHoja(nombre, filas);
  const libroDatos = g.libro('libro-datos', 'Carga_Datos_Mensuales');
  g.activar(libroDatos);
  if (!sinHojas.includes('Data')) libroDatos.conHoja('Data', [CAB_DATA]);
  if (!sinHojas.includes('Logs')) libroDatos.conHoja('Logs', [CAB_LOGS]);
  if (!sinHojas.includes('Errores')) libroDatos.conHoja('Errores', [CAB_ERRORES]);
  // El doble de SpreadsheetApp.create no crea la primera hoja (Google sí): lo completamos aquí.
  if (confTemp) {
    e.ejecutar(`(function () { const crear = SpreadsheetApp.create;
      SpreadsheetApp.create = function (n) { const l = crear.call(SpreadsheetApp, n); l.insertSheet('Hoja 1'); return l; }; })()`);
  }
  return {
    e, g, libroBbdd, libroDatos,
    hoja: (nombre) => libroDatos.getSheetByName(nombre),
    data: () => libroDatos.getSheetByName('Data'),
    logs: () => libroDatos.getSheetByName('Logs'),
    errores: () => libroDatos.getSheetByName('Errores'),
    bbddHoja: (nombre) => libroBbdd.getSheetByName(nombre),
    llamar: (...args) => plano(e.llamar(...args)),
    /** Fecha creada DENTRO de la caja (para que `instanceof Date` del script funcione). */
    fecha: (iso) => e.ejecutar(`new Date(${JSON.stringify(iso)})`),
  };
}

/**
 * Entorno completo para Vitest: el .gs real + datos ficticios.
 * opciones: ahora, usuario, fetch, respuestas, plantillas (true: HTML reales) + las de `poblarEntorno`.
 */
export function crearEntorno(opciones = {}) {
  const { ahora = '2026-03-15T10:00:00Z', usuario = 'gestor@gala.test', fetch, respuestas, plantillas = false } = opciones;
  const e = cargarGs(CODIGO.complementos, { ahora, usuario, fetch, respuestas, plantillasHtml: plantillas ? plantillasReales() : {} });
  return poblarEntorno(e, opciones);
}

/** Cambia la hora que ve el script (`new Date()`), p. ej. para que una corrección sea posterior al envío original. */
export function fijarHora(env, iso) {
  const ms = new Date(iso).getTime();
  env.e.ejecutar(`(function () { const Real = Object.getPrototypeOf(Date);
    class Fecha extends Real { constructor(...a) { if (a.length === 0) super(${ms}); else super(...a); } static now() { return ${ms}; } }
    globalThis.Date = Fecha; })()`);
}

/** Fila de Data en el orden de CAB_DATA. */
export function filaData(env, c = {}) {
  const v = {
    ts: '2026-03-10T09:00:00Z', batch: 'BATCH_A', resp: 'R1', nombreResp: 'Ana Prueba', emailResp: 'ana@gala.test', year: 2026, mes: 3,
    idC: 'C1', conc: 'Aptos', idS: 'S1', nomS: 'Zoe Ficticia', tipo: 'IMPORTE', valor: 100, source: 'WEBAPP', modo: 'NUEVO', corrige: '', ...c,
  };
  const ts = 'tsRaw' in c ? c.tsRaw : env.fecha(v.ts); // tsRaw: valor tal cual (texto, vacío…)
  return [ts, v.batch, v.resp, v.nombreResp, v.emailResp, v.year, v.mes, v.idC, v.conc, v.idS, v.nomS, v.tipo, v.valor, v.source, v.modo, v.corrige];
}

export const cargarData = (env, filas) => env.data() && env.data().cargar([CAB_DATA, ...filas.map((f) => filaData(env, f))]);

/** Cuerpo de envío tal y como lo manda la pantalla. */
export function envio(cambios = {}) {
  return {
    year: 2026, month: 3, responsable: RESP1, concepto: CONC1, modo: 'NUEVO', corrigeBatchId: '', tipoCorreccion: '',
    valores: [
      { idSecretaria: 'S1', nombreSecretaria: 'Zoe Ficticia', valorStr: '100' },
      { idSecretaria: 'S2', nombreSecretaria: 'Álvaro Falso', valorStr: '250,5' },
    ],
    ...cambios,
  };
}

/** Respuestas encadenadas para `ui.prompt`: una por llamada, en orden. */
export const colaPrompt = (...respuestas) => {
  const cola = [...respuestas];
  return (..._args) => {
    const r = cola.shift();
    if (r === 'CANCEL') return { boton: 'CANCEL', texto: '' };
    return { boton: 'OK', texto: r };
  };
};

/** Respuesta HTTP correcta del export. */
export const fetchXlsxOk = () => ({ codigo: 200, contenido: 'XLSX-FALSO', tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

/** Registra en Drive el libro temporal que creará el script (id predecible en el doble). */
export function registrarTemporal(env) {
  const id = `libro-creado-${env.g.estado.libros.size + 1}`;
  env.g.archivo(id, 'temporal', 'x', 'application/vnd.google-apps.spreadsheet');
  return id;
}
