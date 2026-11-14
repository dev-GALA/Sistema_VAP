// Dobles en memoria de los servicios de Google Apps Script.
// Fieles en los DATOS (hojas, propiedades, bloqueos, correos, disparadores) y permisivos en lo VISUAL
// (colores, anchos, formatos: se registran en `estado.formato` pero no se comprueban).
// Todo es determinista (FIRST · Repeatable): la hora y los UUID los fija quien prueba.
import { evaluarPlantilla } from './plantilla.js';

const letraAColumna = (letras) => [...letras].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
const columnaALetra = (n) => {
  let s = '';
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
};

/** Métodos solo de presentación: se aceptan y se registran, pero no cambian datos. */
const FORMATO = /^(set(?!Value|Values|Formula|Name|Title|DataValidation)|auto|merge|hide|show|activate|freeze|protect|breakApart|clearFormat|clearNote|insertCheckboxes|moveActiveSheet|setActiveRange)/;

function permisivo(objeto, registrar) {
  return new Proxy(objeto, {
    get(destino, propiedad, receptor) {
      if (propiedad in destino) return Reflect.get(destino, propiedad, receptor);
      if (typeof propiedad === 'string' && FORMATO.test(propiedad)) {
        return (...args) => {
          registrar(propiedad, args);
          return receptor;
        };
      }
      return undefined;
    },
  });
}

class Rango {
  constructor(hoja, fila, columna, filas, columnas) {
    Object.assign(this, { hoja, fila, columna, filas, columnas });
    return permisivo(this, (m, a) => hoja._libro._estado.formato.push({ m, a }));
  }
  getRow() { return this.fila; }
  getColumn() { return this.columna; }
  getNumRows() { return this.filas; }
  getNumColumns() { return this.columnas; }
  getLastRow() { return this.fila + this.filas - 1; }
  getLastColumn() { return this.columna + this.columnas - 1; }
  getSheet() { return this.hoja; }
  getA1Notation() {
    const a = columnaALetra(this.columna) + this.fila;
    return this.filas * this.columnas === 1 ? a : `${a}:${columnaALetra(this.getLastColumn())}${this.getLastRow()}`;
  }
  getValues() {
    const salida = [];
    for (let f = 0; f < this.filas; f++) {
      const fila = [];
      for (let c = 0; c < this.columnas; c++) fila.push(this.hoja._celda(this.fila + f, this.columna + c));
      salida.push(fila);
    }
    return salida;
  }
  getDisplayValues() {
    return this.getValues().map((fila) => fila.map((v) => (v instanceof Date ? v.toISOString() : String(v))));
  }
  getValue() { return this.hoja._celda(this.fila, this.columna); }
  getDisplayValue() { return String(this.getValue()); }
  setValues(valores) {
    if (valores.length !== this.filas || (valores[0] || []).length !== this.columnas) {
      throw new Error(
        `Los datos tienen ${valores.length} filas y ${(valores[0] || []).length} columnas, pero el rango tiene ${this.filas} filas y ${this.columnas} columnas.`,
      );
    }
    valores.forEach((fila, f) => fila.forEach((v, c) => this.hoja._poner(this.fila + f, this.columna + c, v)));
    this.hoja._libro._estado.escrituras.push({ hoja: this.hoja.getName(), rango: this.getA1Notation() });
    return this;
  }
  setValue(valor) {
    for (let f = 0; f < this.filas; f++) for (let c = 0; c < this.columnas; c++) this.hoja._poner(this.fila + f, this.columna + c, valor);
    this.hoja._libro._estado.escrituras.push({ hoja: this.hoja.getName(), rango: this.getA1Notation() });
    return this;
  }
  clearContent() { return this.setValue(''); }
  clear() { return this.setValue(''); }
  setDataValidation(regla) {
    this.hoja._libro._estado.validaciones.push({ hoja: this.hoja.getName(), rango: this.getA1Notation(), regla });
    return this;
  }
}

class Hoja {
  constructor(libro, nombre, id) {
    this._libro = libro;
    this._nombre = nombre;
    this._id = id;
    this._datos = [];
    this._congeladas = 0;
    return permisivo(this, (m, a) => libro._estado.formato.push({ m, a }));
  }
  _celda(f, c) {
    const v = (this._datos[f - 1] || [])[c - 1];
    return v === undefined ? '' : v;
  }
  _poner(f, c, v) {
    while (this._datos.length < f) this._datos.push([]);
    const fila = this._datos[f - 1];
    while (fila.length < c) fila.push('');
    fila[c - 1] = v === undefined || v === null ? '' : v;
  }
  _vacia(fila) { return fila.every((v) => v === '' || v === null || v === undefined); }
  getName() { return this._nombre; }
  setName(n) { this._nombre = n; return this; }
  getSheetId() { return this._id; }
  getParent() { return this._libro; }
  getLastRow() {
    for (let i = this._datos.length - 1; i >= 0; i--) if (!this._vacia(this._datos[i])) return i + 1;
    return 0;
  }
  getLastColumn() {
    let max = 0;
    this._datos.forEach((fila) => {
      for (let i = fila.length - 1; i >= 0; i--) if (fila[i] !== '' && fila[i] !== null) { max = Math.max(max, i + 1); break; }
    });
    return max;
  }
  getMaxRows() { return Math.max(1000, this._datos.length); }
  getMaxColumns() { return Math.max(26, this.getLastColumn()); }
  getRange(a, b, c, d) {
    if (typeof a === 'string') return this._rangoA1(a);
    return new Rango(this, a, b, c === undefined ? 1 : c, d === undefined ? 1 : d);
  }
  _rangoA1(texto) {
    const m = /^([A-Z]+)(\d*)(?::([A-Z]+)(\d*))?$/.exec(texto);
    if (!m) throw new Error(`Rango A1 no soportado en el doble: ${texto}`);
    const c1 = letraAColumna(m[1]);
    const f1 = m[2] ? Number(m[2]) : 1;
    const c2 = m[3] ? letraAColumna(m[3]) : c1;
    const f2 = m[3] ? (m[4] ? Number(m[4]) : Math.max(this.getLastRow(), f1)) : f1;
    return new Rango(this, f1, c1, f2 - f1 + 1, c2 - c1 + 1);
  }
  getDataRange() { return new Rango(this, 1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
  appendRow(fila) {
    const f = this.getLastRow() + 1;
    fila.forEach((v, i) => this._poner(f, i + 1, v));
    return this;
  }
  clear() { this._datos = []; return this; }
  clearContents() { return this.clear(); }
  deleteRow(n) { this._datos.splice(n - 1, 1); return this; }
  deleteRows(n, cuantas) { this._datos.splice(n - 1, cuantas); return this; }
  insertRowAfter(n) { this._datos.splice(n, 0, []); return this; }
  insertRowBefore(n) { this._datos.splice(n - 1, 0, []); return this; }
  insertRowsAfter(n, cuantas) { for (let i = 0; i < cuantas; i++) this._datos.splice(n, 0, []); return this; }
  insertRowsBefore(n, cuantas) { return this.insertRowsAfter(n - 1, cuantas); }
  setFrozenRows(n) { this._congeladas = n; return this; }
  getFrozenRows() { return this._congeladas; }
  getIndex() { return this._libro._hojas.indexOf(this) + 1; }
  /** Para preparar datos en las pruebas: `hoja.cargar([[cabecera], [fila]...])`. */
  cargar(filas) { this._datos = filas.map((f) => [...f]); return this; }
  /** Para comprobar: todas las filas con contenido (sin colas vacías). */
  volcar() { return this._datos.slice(0, this.getLastRow()).map((f) => [...f]); }
}

class Libro {
  constructor(id, nombre, estado, zona) {
    this._id = id;
    this._nombre = nombre;
    this._estado = estado;
    this._zona = zona;
    this._hojas = [];
    this._contador = 1;
  }
  getId() { return this._id; }
  getName() { return this._nombre; }
  rename(n) { this._nombre = n; return this; }
  getUrl() { return `https://docs.google.com/spreadsheets/d/${this._id}/edit`; }
  getSpreadsheetTimeZone() { return this._zona; }
  getSheets() { return [...this._hojas]; }
  getSheetByName(nombre) { return this._hojas.find((h) => h._nombre === nombre) || null; }
  insertSheet(nombre) {
    if (nombre && this.getSheetByName(nombre)) throw new Error(`Ya existe una hoja con el nombre «${nombre}».`);
    const hoja = new Hoja(this, nombre || `Hoja ${this._hojas.length + 1}`, this._contador++);
    this._hojas.push(hoja);
    return hoja;
  }
  deleteSheet(hoja) { this._hojas = this._hojas.filter((h) => h !== hoja && h._id !== hoja._id); }
  getActiveSheet() { return this._hojas[0] || null; }
  setActiveSheet(h) { return h; }
  toast(mensaje, titulo) { this._estado.avisos.push({ mensaje, titulo }); }
  /** Para preparar datos en las pruebas: crea la hoja y la rellena. */
  conHoja(nombre, filas = []) {
    return this.insertSheet(nombre).cargar(filas);
  }
}

function crearIu(estado, respuestas) {
  const Button = { OK: 'OK', YES: 'YES', NO: 'NO', CANCEL: 'CANCEL', CLOSE: 'CLOSE' };
  const ButtonSet = { OK: 'OK', OK_CANCEL: 'OK_CANCEL', YES_NO: 'YES_NO', YES_NO_CANCEL: 'YES_NO_CANCEL' };
  const menu = (nombre) => {
    const m = { nombre, items: [] };
    const api = {
      addItem(texto, funcion) { m.items.push({ texto, funcion }); return api; },
      addSeparator() { m.items.push({ separador: true }); return api; },
      addSubMenu(sub) { m.items.push({ submenu: sub }); return api; },
      addToUi() { estado.menus.push(m); return api; },
      _menu: m,
    };
    return api;
  };
  return {
    Button,
    ButtonSet,
    createMenu: menu,
    alert(...args) {
      estado.alertas.push(args);
      return typeof respuestas.alert === 'function' ? respuestas.alert(...args) : respuestas.alert ?? Button.OK;
    },
    prompt(...args) {
      estado.alertas.push(args);
      const r = typeof respuestas.prompt === 'function' ? respuestas.prompt(...args) : respuestas.prompt ?? { boton: Button.OK, texto: '' };
      return { getSelectedButton: () => r.boton, getResponseText: () => r.texto };
    },
    showModalDialog(salida, titulo) { estado.dialogos.push({ salida, titulo }); },
    showModelessDialog(salida, titulo) { estado.dialogos.push({ salida, titulo }); },
    showSidebar(salida) { estado.dialogos.push({ salida, titulo: null }); },
  };
}

function crearArchivos(estado) {
  const blob = (nombre, contenido, tipo) => ({
    getName: () => nombre,
    getContentType: () => tipo,
    getDataAsString: () => (typeof contenido === 'string' ? contenido : Buffer.from(contenido).toString('utf8')),
    getBytes: () => [...Buffer.from(contenido)],
    setName(n) { nombre = n; return this; },
  });
  const archivo = (a) => ({
    getId: () => a.id,
    getName: () => a.nombre,
    getMimeType: () => a.tipo,
    getBlob: () => blob(a.nombre, a.contenido, a.tipo),
    getUrl: () => `https://drive.google.com/file/d/${a.id}/view`,
    setTrashed(v) { a.papelera = v; return this; },
    isTrashed: () => !!a.papelera,
  });
  const iterador = (lista) => {
    let i = 0;
    return { hasNext: () => i < lista.length, next: () => lista[i++] };
  };
  return {
    blob,
    archivo,
    DriveApp: {
      getFileById(id) {
        const a = estado.archivos.find((x) => x.id === id);
        if (!a) throw new Error(`No se encontró el archivo con ID ${id}.`);
        return archivo(a);
      },
      getFilesByName(nombre) { return iterador(estado.archivos.filter((x) => x.nombre === nombre && !x.papelera).map(archivo)); },
      getFolderById(id) {
        return {
          getId: () => id,
          createFile(a, b, c) {
            const esBlob = typeof a === 'object';
            const nuevo = { id: `archivo-${estado.archivos.length + 1}`, nombre: esBlob ? a.getName() : a, contenido: esBlob ? a.getBytes() : b, tipo: esBlob ? a.getContentType() : c, carpeta: id };
            estado.archivos.push(nuevo);
            return archivo(nuevo);
          },
        };
      },
    },
  };
}

/**
 * Crea un «Google» de mentira. `opciones`:
 *  - ahora: ISO de «ahora» · zona: huso del script · usuario: correo del usuario activo
 *  - plantillasHtml: { 'NombreArchivo': '<html>…' } para HtmlService
 *  - respuestas: { alert, prompt } valores o funciones · fetch: (url, opciones) => respuesta
 */
export function crearGoogle(opciones = {}) {
  const { ahora = '2026-03-15T10:00:00Z', zona = 'Europe/Madrid', usuario = 'gestor@gala.test', plantillasHtml = {}, respuestas = {}, fetch } = opciones;
  const estado = {
    ahora, zona, usuario,
    libros: new Map(), logs: [], correos: [], avisos: [], alertas: [], dialogos: [], menus: [], formato: [], validaciones: [], escrituras: [],
    disparadores: [], peticiones: [], archivos: [], esperas: [], propiedadesScript: {}, propiedadesUsuario: {}, cache: {}, formularios: new Map(),
    bloqueoOcupado: false, uuid: 0, libroActivo: null,
    urlWebapp: 'https://script.google.com/macros/s/AKfycbTEST/exec', evaluarEn: null,
  };

  const registrarFormato = (m, a) => estado.formato.push({ m, a });
  const nuevoLibro = (id, nombre = id) => {
    const libro = new Libro(id, nombre, estado, zona);
    estado.libros.set(id, libro);
    return libro;
  };

  const iu = crearIu(estado, respuestas);
  const ficheros = crearArchivos(estado);

  const SpreadsheetApp = {
    openById(id) {
      const libro = estado.libros.get(id);
      if (!libro) throw new Error(`No se puede abrir el documento con el ID ${id}: no existe o no hay acceso.`);
      return libro;
    },
    getActiveSpreadsheet: () => estado.libroActivo,
    getActive: () => estado.libroActivo,
    create(nombre) { return nuevoLibro(`libro-creado-${estado.libros.size + 1}`, nombre); },
    getUi: () => iu,
    flush() {},
    newDataValidation() {
      const regla = {};
      const api = {
        requireValueInList(lista, desplegable) { regla.lista = lista; regla.desplegable = desplegable; return api; },
        setAllowInvalid(v) { regla.permitirInvalido = v; return api; },
        setHelpText(t) { regla.ayuda = t; return api; },
        build: () => regla,
      };
      return api;
    },
  };

  const Utilities = {
    getUuid: () => `uuid-${String(++estado.uuid).padStart(4, '0')}`,
    sleep: (ms) => estado.esperas.push(ms),
    formatDate: (fecha, huso, patron) => formatearFecha(fecha, huso, patron),
    parseCsv: (texto, delimitador = ',') => analizarCsv(texto, delimitador),
    newBlob: (datos, tipo, nombre) => ficheros.blob(nombre, datos, tipo),
  };

  const crearBloqueo = () => ({
    tryLock: () => !estado.bloqueoOcupado,
    waitLock() { if (estado.bloqueoOcupado) throw new Error('Se agotó el tiempo de espera del bloqueo.'); },
    releaseLock() {},
    hasLock: () => !estado.bloqueoOcupado,
  });

  const almacen = (objeto) => ({
    getProperty: (k) => (k in objeto ? objeto[k] : null),
    setProperty(k, v) { objeto[k] = String(v); return this; },
    getProperties: () => ({ ...objeto }),
    setProperties(o) { Object.assign(objeto, o); return this; },
    deleteProperty(k) { delete objeto[k]; return this; },
  });

  const disparadorPublico = (t) => ({
    getHandlerFunction: () => t.handler,
    getEventType: () => t.onChange ? 'ON_CHANGE' : t.onFormSubmit ? 'ON_FORM_SUBMIT' : t.everyHours ? 'CLOCK' : 'UNKNOWN',
    getUniqueId: () => t.id,
    _spec: t,
  });

  const ScriptApp = {
    getProjectTriggers: () => estado.disparadores.map(disparadorPublico),
    deleteTrigger(d) { estado.disparadores = estado.disparadores.filter((t) => t.id !== d.getUniqueId()); },
    getOAuthToken: () => 'token-falso',
    getService: () => ({ getUrl: () => estado.urlWebapp }),
    EventType: { CLOCK: 'CLOCK', ON_CHANGE: 'ON_CHANGE', ON_FORM_SUBMIT: 'ON_FORM_SUBMIT' },
  };
  // Disparadores: cadena fluida que registra el manejador al llamar a create().
  ScriptApp.newTrigger = (handler) => {
    const spec = { handler };
    const api = new Proxy({}, {
      get(_d, nombre) {
        if (nombre === 'create') {
          return () => {
            const t = { ...spec, id: `disp-${estado.disparadores.length + 1}` };
            estado.disparadores.push(t);
            return disparadorPublico(t);
          };
        }
        return (...args) => {
          spec[nombre] = args.length === 0 ? true : args.length === 1 ? args[0] : args;
          return api;
        };
      },
    });
    return api;
  };

  const salidaHtml = (contenido) => {
    const salida = {
      _contenido: contenido,
      setTitle(t) { salida._titulo = t; return salida; },
      setWidth(w) { salida._ancho = w; return salida; },
      setHeight(h) { salida._alto = h; return salida; },
      setXFrameOptionsMode(m) { salida._xframe = m; return salida; },
      getContent: () => salida._contenido,
      getTitle: () => salida._titulo,
    };
    return salida;
  };
  const leerPlantilla = (nombre) => {
    if (!(nombre in plantillasHtml)) throw new Error(`No se encontró el archivo HTML «${nombre}».`);
    return plantillasHtml[nombre];
  };
  const HtmlService = {
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL', DEFAULT: 'DEFAULT' },
    createHtmlOutputFromFile: (nombre) => salidaHtml(leerPlantilla(nombre)),
    createHtml: (texto) => salidaHtml(texto),
    createTemplateFromFile(nombre) {
      const t = {
        evaluate() {
          const datos = { ...t };
          delete datos.evaluate;
          const incluir = (n) => leerPlantilla(n);
          return salidaHtml(evaluarPlantilla(leerPlantilla(nombre), datos, incluir, estado.evaluarEn));
        },
      };
      return t;
    },
  };

  const MailApp = {
    sendEmail(...args) {
      const [a, asunto, cuerpo, extra] = args;
      estado.correos.push(typeof a === 'object' ? { ...a } : { to: a, subject: asunto, body: cuerpo, ...(extra || {}) });
    },
  };

  const UrlFetchApp = {
    fetch(url, opciones = {}) {
      estado.peticiones.push({ url, opciones });
      const r = fetch ? fetch(url, opciones) : { codigo: 200, contenido: '' };
      return {
        getResponseCode: () => r.codigo,
        getContentText: () => (typeof r.contenido === 'string' ? r.contenido : Buffer.from(r.contenido).toString('utf8')),
        getContent: () => [...Buffer.from(r.contenido)],
        getBlob: () => ficheros.blob(r.nombre || 'respuesta', r.contenido, r.tipo || 'application/octet-stream'),
        getHeaders: () => r.cabeceras || {},
      };
    },
  };

  const global = {
    SpreadsheetApp, Utilities, ScriptApp, HtmlService, MailApp, UrlFetchApp,
    DriveApp: ficheros.DriveApp,
    Logger: { log: (...a) => estado.logs.push(a.join(' ')) },
    Session: {
      getActiveUser: () => ({ getEmail: () => usuario }),
      getEffectiveUser: () => ({ getEmail: () => usuario }),
      getScriptTimeZone: () => zona,
    },
    LockService: { getScriptLock: crearBloqueo, getDocumentLock: crearBloqueo, getUserLock: crearBloqueo },
    PropertiesService: {
      getScriptProperties: () => almacen(estado.propiedadesScript),
      getUserProperties: () => almacen(estado.propiedadesUsuario),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (k in estado.cache ? estado.cache[k] : null),
        put(k, v) { estado.cache[k] = String(v); },
        remove(k) { delete estado.cache[k]; },
      }),
    },
    FormApp: {
      ItemType: { LIST: 'LIST', MULTIPLE_CHOICE: 'MULTIPLE_CHOICE', TEXT: 'TEXT', CHECKBOX: 'CHECKBOX', DROPDOWN: 'LIST' },
      openById(id) {
        const f = estado.formularios.get(id);
        if (!f) throw new Error(`No se puede abrir el formulario con ID ${id}.`);
        return f;
      },
    },
  };

  return {
    global,
    estado,
    /** Crea un libro de cálculo accesible por `SpreadsheetApp.openById(id)`. */
    libro: (id, nombre) => nuevoLibro(id, nombre),
    /** Fija el libro «activo» (al que está ligado el script). */
    activar(libro) { estado.libroActivo = libro; return libro; },
    /** Registra un archivo en Drive. */
    archivo(id, nombre, contenido, tipo = 'text/csv') { estado.archivos.push({ id, nombre, contenido, tipo }); },
    registrarFormato,
  };
}

// ── Utilidades puras ──────────────────────────────────────────────────────────────────────────
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Subconjunto de `Utilities.formatDate` (patrones de SimpleDateFormat) con huso horario real. */
export function formatearFecha(fecha, huso, patron) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: huso, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' })
      .formatToParts(d).map((p) => [p.type, p.value]),
  );
  const mes = Number(partes.month);
  const diaSemana = DIAS[new Date(Date.UTC(Number(partes.year), mes - 1, Number(partes.day))).getUTCDay()];
  const tokens = {
    yyyy: partes.year, yy: partes.year.slice(2),
    MMMM: MESES[mes - 1], MMM: MESES[mes - 1].slice(0, 3), MM: partes.month, M: String(mes),
    dd: partes.day, d: String(Number(partes.day)),
    HH: partes.hour, H: String(Number(partes.hour)), mm: partes.minute, ss: partes.second,
    SSS: String(d.getUTCMilliseconds()).padStart(3, '0'),
    EEEE: diaSemana, EEE: diaSemana.slice(0, 3),
  };
  return patron.replace(/'([^']*)'|yyyy|yy|MMMM|MMM|MM|M|dd|d|HH|H|mm|ss|SSS|EEEE|EEE/g, (t, literal) => (literal !== undefined ? literal : tokens[t]));
}

/** CSV mínimo con comillas, como `Utilities.parseCsv`. */
export function analizarCsv(texto, delimitador = ',') {
  const filas = [];
  let fila = [];
  let celda = '';
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === delimitador) { fila.push(celda); celda = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(celda); filas.push(fila); fila = []; celda = '';
    } else celda += c;
  }
  if (celda !== '' || fila.length) { fila.push(celda); filas.push(fila); }
  return filas;
}
