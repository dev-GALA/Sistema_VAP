// Ayudas compartidas por las pruebas de scripts_generales. Todos los datos son FICTICIOS.
// No son pruebas (no terminan en .test.js): solo construyen entornos repetibles.
import { CODIGO, cargarGs, plano } from '../soporte/cargar-gs.js';

export { CODIGO, cargarGs, plano };

/** Convierte lo que devuelve una hoja (con Date de la caja) en JSON comparable. */
export const volcado = (hoja) => plano(hoja.volcar());

/** new Date(año, mes, día) creada DENTRO de la caja vm (para que `instanceof Date` del script funcione). */
export const fechaCaja = (e, anio, mes, dia) => e.ejecutar(`new Date(${anio}, ${mes - 1}, ${dia})`);

/** dd/mm/yyyy de una fecha de la caja (en huso local, igual que la construye el script). */
export function ddmmyyyy(f) {
  if (!f) return f;
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()}`;
}

/** Reloj que avanza `ms` en cada `new Date()` del script (para probar la duración). */
export function relojQueAvanza(e, ms) {
  e.ejecutar(`(function(){ const Real = Object.getPrototypeOf(Date); let t = Date.now();
    class Fecha extends Real { constructor(...a){ if (a.length === 0) { super(t); t += ${ms}; } else super(...a); }
      static now(){ return t; } }
    globalThis.Date = Fecha; })()`);
}

/**
 * Espía los métodos de formato que el doble solo registra sin rango:
 * añade a `registro` {hoja, rango, m, a}. Debe llamarse con el libro ya creado.
 */
export function espiarFormato(libro, registro) {
  const METODOS = new Set(['setBackgrounds', 'setBackground', 'setNumberFormat', 'setFontWeight', 'setDataValidation']);
  const envolver = (hoja) => {
    const original = hoja.getRange.bind(hoja);
    hoja.getRange = (...a) => {
      const r = original(...a);
      const proxy = new Proxy(r, {
        get(t, p) {
          const v = t[p];
          if (typeof v !== 'function') return v;
          return (...args) => {
            if (METODOS.has(p)) registro.push({ hoja: hoja.getName(), rango: t.getA1Notation(), m: p, a: args });
            const salida = v.apply(t, args);
            return salida === t ? proxy : salida;
          };
        },
      });
      return proxy;
    };
    return hoja;
  };
  libro._hojas.forEach(envolver);
  const insertar = libro.insertSheet.bind(libro);
  libro.insertSheet = (n) => envolver(insertar(n));
}

// ─────────────────────────── EXPORT SAGE ───────────────────────────
export const CAB_ORIGEN = ['Empresa', 'Codigo_Empleado', 'SEGURO_MEDICO', 'COBE_Alimentacion', 'COBE_Transporte', 'TOTAL_BRUTO', 'SS_EMP', 'SS_TRABAH', 'IRPF', 'Líquido_a_percibir'];

/** Fila del origen: campos opcionales (vacío por defecto). */
export function filaOrigen(empresa, codigo, c = {}) {
  return [empresa, codigo, c.seguro ?? '', c.alim ?? '', c.transp ?? '', c.bruto ?? '', c.ssEmp ?? '', c.ssTrab ?? '', c.irpf ?? '', c.liquido ?? ''];
}

/** Fila del destino (20 columnas, A..T). `v` = { 7: valor, 12: valor... } por número de columna. */
export function filaDestino(empresa, num, v = {}) {
  const fila = Array(20).fill('');
  fila[4] = empresa;
  fila[5] = num;
  Object.entries(v).forEach(([col, valor]) => { fila[Number(col) - 1] = valor; });
  return fila;
}

export const CAB_DESTINO = filaDestino('EMPRESA', 'Nº EMPLEADO');

/**
 * Entorno del script de export: libro de origen activo, libros destino neto y bruto.
 * `origen` / `destino` = filas (el origen incluye cabecera); null = no crear esa pestaña.
 */
export function entornoExport({ origen = [CAB_ORIGEN], destino = [CAB_DESTINO], destinoBruto, opciones = {}, sinLibroNeto = false } = {}) {
  const e = cargarGs(CODIGO.exportSage, { ahora: '2026-03-15T10:00:00Z', ...opciones });
  const { google } = e;
  const idNeto = e.valor('VINC_NETO_TARGET_ID');
  const idBruto = e.valor('VINC_BRUTO_TARGET_ID');
  const libroOrigen = google.libro('LIBRO_ORIGEN', 'VAP_Export_Sage');
  google.activar(libroOrigen);
  const hojaOrigen = origen === null ? null : libroOrigen.conHoja(e.valor('SHEET_NAME'), origen);
  const crearDestino = (id, filas) => {
    const libro = google.libro(id, `Vinculacion ${id}`);
    const hoja = filas === null ? null : libro.conHoja(e.valor('VINC_TARGET_SHEET_NAME'), filas);
    return { libro, hoja };
  };
  const neto = sinLibroNeto ? { libro: null, hoja: null } : crearDestino(idNeto, destino);
  const bruto = crearDestino(idBruto, destinoBruto === undefined ? destino : destinoBruto);
  const ejecutarMenu = (texto) => {
    e.llamar('onOpen');
    const item = google.estado.menus.at(-1).items.find((i) => i.texto === texto);
    return e.llamar(item.funcion);
  };
  return { e, google, libroOrigen, hojaOrigen, neto, bruto, idNeto, idBruto, ejecutarMenu };
}

// ─────────────────────────── CRUCE SAGE ───────────────────────────
export const CAB_SECRETARIAS = ['Empresa', 'Id_Sage', 'ID_Secre', 'Nombre_Secretaria', 'Alta', 'Fecha Alta', 'Fecha Baja'];
export const CAB_PROFESORES = ['Empresa', 'Id_Sage', 'ID_Profesor', 'Nombre', 'Alta', 'Fecha_Alta', 'Fecha_Baja', 'Tipología_Profesor'];
export const CAB_CSV = ['Razón social', 'Código', 'Apellidos y nombre', 'Dni', 'Alta', 'Baja'];

/** Texto CSV de SAGE (separador ;). `filas` = arrays de 6 valores. */
export const csvSage = (filas, cabecera = CAB_CSV) => [cabecera, ...filas].map((f) => f.join(';')).join('\n') + '\n';

/** Entorno del cruce: libro de personal + CSV en Drive. Devuelve también el espía de formato. */
export function entornoCruce({ secretarias = [CAB_SECRETARIAS], profesores = [CAB_PROFESORES], csv = csvSage([]), opciones = {}, sinCsv = false } = {}) {
  const e = cargarGs(CODIGO.cruceSage, { ahora: '2026-03-15T10:00:00Z', ...opciones });
  const { google } = e;
  // El doble de Google no trae el enumerado MimeType (limitación de tests/soporte): se añade aquí, solo en la caja.
  e.contexto.MimeType = { GOOGLE_SHEETS: 'application/vnd.google-apps.spreadsheet' };
  const libro = google.libro(e.valor('CFG.SPREADSHEET_ID'), 'VAP_BBDD_Personas');
  google.activar(libro);
  if (secretarias !== null) libro.conHoja('VAP_Secretarias', secretarias);
  if (profesores !== null) libro.conHoja('VAP_Profesores', profesores);
  if (!sinCsv) google.archivo('csv-1', e.valor('CFG.CSV_NOMBRE'), csv);
  const formato = [];
  espiarFormato(libro, formato);
  return { e, google, libro, formato, hoja: (n) => libro.getSheetByName(n) };
}

/** Construye un registro de SAGE como lo haría leerCsvSage_ (usando las funciones del propio script). */
export function registroSage(e, { empresa = 'AUTOESCUELA GALA S.L.', codigo = '1', nombre, dni = '00000001A', alta = null, baja = null, fila = 2 }) {
  return {
    filaCsv: fila,
    empresaSage: empresa,
    empresaCanon: e.llamar('canonizarEmpresa_', empresa),
    codigo: e.llamar('normalizarCodigo_', codigo),
    nombreSage: nombre,
    tokens: e.llamar('tokens_', nombre),
    dni,
    fechaAlta: alta,
    fechaBaja: baja,
  };
}

/** Construye una fila de BBDD como lo haría leerHojaBBDD_. */
export function filaBBDD(e, { origen = 'secretarias', fila = 2, empresa = 'GALA', idSage = '', id = '', nombre, alta = true, fechaAlta = '', fechaBaja = '', tipologia = '' }) {
  return {
    origen,
    filaOriginal: fila,
    empresaBBDD: empresa,
    empresaCanon: e.llamar('canonizarEmpresa_', empresa),
    idSageBBDD: e.llamar('normalizarCodigo_', idSage),
    idBBDD: id,
    nombreBBDD: nombre,
    nombreLimpio: e.llamar('limpiarNombre_', nombre),
    tokens: e.llamar('tokens_', nombre),
    altaBBDD: alta,
    fechaAltaBBDD: fechaAlta,
    fechaBajaBBDD: fechaBaja,
    tipologia,
    match: null, nivelMatch: '', viaMatch: '', candidatos: [], marcas: [], revision: [], avisos: [],
  };
}
